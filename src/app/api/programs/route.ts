import { NextResponse } from "next/server";
import { db, sanitizeApiError } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyNewProgramPublished } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Normalize display cost model to/from database enum & fundingType
function normalizeCostForDb(rawCost?: string): { cost: "Free" | "Subsidized" | "With_Fee"; fundingType: string } {
  if (!rawCost || rawCost === "Free") {
    return { cost: "Free", fundingType: "Free" };
  }
  if (rawCost === "Scholarship-Funded") {
    return { cost: "Free", fundingType: "Scholarship-Funded" };
  }
  if (rawCost === "Subsidized") {
    return { cost: "Subsidized", fundingType: "Subsidized" };
  }
  if (rawCost === "Self-Funded" || rawCost === "With Fee") {
    return { cost: "With_Fee", fundingType: "Self-Funded" };
  }
  return { cost: "Free", fundingType: rawCost || "Free" };
}

function mapProgramCostForClient<T extends { cost?: any; fundingType?: any }>(prog: T): T {
  const fType = prog.fundingType;
  let clientCost = prog.cost;
  if (fType === "Scholarship-Funded") clientCost = "Scholarship-Funded";
  else if (fType === "Self-Funded" || prog.cost === "With_Fee") clientCost = "Self-Funded";
  else if (fType === "Subsidized" || prog.cost === "Subsidized") clientCost = "Subsidized";
  else if (fType === "Free" || prog.cost === "Free") clientCost = "Free";
  return { ...prog, cost: clientCost } as T;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";

    // Auto-archive any concluded active programs whose endDate has elapsed
    const now = new Date();
    const concludedPrograms = await db.tESDAProgram.findMany({
      where: {
        activeStatus: { not: "Closed" },
        endDate: { not: null, lt: now }
      },
      select: { id: true, title: true }
    });

    if (concludedPrograms.length > 0) {
      const concludedIds = concludedPrograms.map(p => p.id);
      await db.tESDAProgram.updateMany({
        where: { id: { in: concludedIds } },
        data: { activeStatus: "Closed" }
      });

      // Also update enrollees/applicants: mark as Archived
      await db.referral.updateMany({
        where: {
          programId: { in: concludedIds },
          status: { in: ["Enrolled", "Pending"] }
        },
        data: { status: "Archived" }
      });
    }

    const programs = await db.tESDAProgram.findMany({
      where: archived
        ? { activeStatus: "Closed" }
        : { activeStatus: { not: "Closed" } },
      include: {
        category: true,
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            officialAcc: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: programs.map(mapProgramCostForClient) });
  } catch (error: any) {
    console.error("Programs GET Error:", error);
    return NextResponse.json({ success: false, error: sanitizeApiError(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    
    // Backend Validation
    if (body.trainingHours <= 0) return NextResponse.json({ success: false, message: "Training hours must be greater than 0" }, { status: 400 });
    if (!body.trainingDays || body.trainingDays.length === 0) return NextResponse.json({ success: false, message: "At least one training day must be selected" }, { status: 400 });
    
    const startDateTime = body.startTime ? new Date(`1970-01-01T${body.startTime}:00Z`) : null;
    const endDateTime = body.endTime ? new Date(`1970-01-01T${body.endTime}:00Z`) : null;
    
    if (startDateTime && endDateTime && startDateTime >= endDateTime) return NextResponse.json({ success: false, message: "Start time must be before end time" }, { status: 400 });
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (body.startDate) {
      const s = new Date(body.startDate);
      if (s < todayMidnight) return NextResponse.json({ success: false, message: "Start date cannot be in the past" }, { status: 400 });
    }
    if (body.endDate) {
      const e = new Date(body.endDate);
      if (e < todayMidnight) return NextResponse.json({ success: false, message: "End date cannot be in the past" }, { status: 400 });
    }
    if (body.startDate && body.endDate) {
      const s = new Date(body.startDate);
      const e = new Date(body.endDate);
      if (e < s) return NextResponse.json({ success: false, message: "End date cannot be before start date" }, { status: 400 });
      if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
        return NextResponse.json({ success: false, message: "Start date and End date cannot be on the same day" }, { status: 400 });
      }
    }

    const costInfo = normalizeCostForDb(body.cost);
    const newProgram = await db.tESDAProgram.create({
      data: {
        title: body.title,
        provider: body.provider || "TESDA Pampanga",
        type: body.type || "Training",
        location: body.location || "San Luis Training Center",
        trainingHours: Number(body.trainingHours),
        cost: costInfo.cost,
        fundingType: costInfo.fundingType || body.fundingType || "Free",
        slotsTotal: Number(body.slotsTotal) || 25,
        slotsRemaining: Number(body.slotsTotal) || 25,
        youthMatched: 0,
        eligibility: body.eligibility || "Open to all San Luis OSY youth",
        contactPerson: body.contactPerson || "TESDA Registrar",
        contactNumber: body.contactNumber || "+63 917 000 1122",
        activeStatus: "Active",
        partnerId: (session?.user as any)?.id || undefined,
        categoryId: body.categoryId || undefined,
        requiredDocuments: body.requiredDocuments || ["Birth Certificate", "2x2 Picture"],
        requiredSkills: body.requiredSkills || [],
        trainingDays: body.trainingDays,
        startTime: startDateTime,
        endTime: endDateTime,
        room: body.room,
        instructor: body.instructor,
        deliveryMode: body.deliveryMode || "Face-to-Face",
        perks: body.perks || [],
        cptrCourseCode: body.cptrCourseCode || undefined,
        certificationType: body.certificationType || "National Certificate",
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined
      },
      include: {
        category: true
      }
    });

    // Notify KK Youth members of the newly published scholarship course
    notifyNewProgramPublished({
      programId: newProgram.id,
      title: newProgram.title,
      provider: newProgram.provider,
      location: newProgram.location,
      trainingHours: newProgram.trainingHours
    }).catch(err => console.error("[Notification Error - Program Published]:", err));

    return NextResponse.json({ success: true, data: mapProgramCostForClient(newProgram) }, { status: 201 });
  } catch (error: any) {
    console.error("Programs POST Error:", error);
    return NextResponse.json({ success: false, error: sanitizeApiError(error) }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const existingProg = await db.tESDAProgram.findUnique({ where: { id: body.id } });
    if (!existingProg) return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });

    // Backend Validation
    if (body.trainingHours !== undefined && body.trainingHours <= 0) return NextResponse.json({ success: false, message: "Training hours must be greater than 0" }, { status: 400 });
    if (body.trainingDays !== undefined && (!body.trainingDays || body.trainingDays.length === 0)) return NextResponse.json({ success: false, message: "At least one training day must be selected" }, { status: 400 });
    
    const updateData: any = { ...body };
    if (body.cost !== undefined) {
      const costInfo = normalizeCostForDb(body.cost);
      updateData.cost = costInfo.cost;
      updateData.fundingType = costInfo.fundingType;
    }
    delete updateData.id;
    delete updateData.category;
    delete updateData.partner;
    delete updateData.referrals;
    delete updateData._count;

    // Date Validations for PUT (no past dates, no end before start, no start equal to end, no overlap with previous session)
    const nowPut = new Date();
    const todayMidnightPut = new Date(nowPut.getFullYear(), nowPut.getMonth(), nowPut.getDate());

    if (body.startDate) {
      const s = new Date(body.startDate);
      if (s < todayMidnightPut) return NextResponse.json({ success: false, message: "Start date cannot be in the past" }, { status: 400 });
    }
    if (body.endDate) {
      const e = new Date(body.endDate);
      if (e < todayMidnightPut) return NextResponse.json({ success: false, message: "End date cannot be in the past" }, { status: 400 });
    }
    if (body.startDate && body.endDate) {
      const s = new Date(body.startDate);
      const e = new Date(body.endDate);
      if (e < s) return NextResponse.json({ success: false, message: "End date cannot be before start date" }, { status: 400 });
      if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
        return NextResponse.json({ success: false, message: "Start date and End date cannot be on the same day" }, { status: 400 });
      }
    }

    // Overlap validation when restoring a closed session
    const isRestoring = body.activeStatus === "Active" && (existingProg.activeStatus === "Closed" || (existingProg.endDate && new Date(existingProg.endDate) < nowPut));
    if (isRestoring && existingProg.endDate && body.startDate) {
      const prevEnd = new Date(existingProg.endDate);
      const newStart = new Date(body.startDate);
      if (newStart <= prevEnd) {
        return NextResponse.json({
          success: false,
          message: `Start date cannot overlap with the previous session (ended ${prevEnd.toLocaleDateString()}). New session must start after the previous session.`
        }, { status: 400 });
      }
    }

    // Handle program restoration: when re-activating a closed/concluded program
    if (isRestoring) {
      updateData.activeStatus = "Active";
      const totalSlots = body.slotsTotal ? Math.max(1, Number(body.slotsTotal)) : (existingProg.slotsTotal || 25);
      updateData.slotsTotal = totalSlots;
      updateData.slotsRemaining = totalSlots;

      if (body.startDate) updateData.startDate = new Date(body.startDate);
      if (body.endDate) updateData.endDate = new Date(body.endDate);
    } else if (body.slotsTotal !== undefined) {
      const newSlotsTotal = Math.max(1, Number(body.slotsTotal));
      const currentOccupied = Math.max(0, existingProg.slotsTotal - existingProg.slotsRemaining);
      const newSlotsRemaining = Math.max(0, newSlotsTotal - currentOccupied);
      updateData.slotsTotal = newSlotsTotal;
      updateData.slotsRemaining = newSlotsRemaining;

      if (newSlotsRemaining === 0 && existingProg.activeStatus === "Active") {
        updateData.activeStatus = "Full";
      } else if (newSlotsRemaining > 0 && existingProg.activeStatus === "Full") {
        updateData.activeStatus = "Active";
      }
    } else if (body.slotsRemaining !== undefined) {
      updateData.slotsRemaining = Math.max(0, Number(body.slotsRemaining));
    }
    
    if (updateData.startTime) {
      updateData.startTime = new Date(`1970-01-01T${updateData.startTime}:00Z`);
    }
    if (updateData.endTime) {
      updateData.endTime = new Date(`1970-01-01T${updateData.endTime}:00Z`);
    }

    if (updateData.startTime && updateData.endTime && updateData.startTime >= updateData.endTime) {
      return NextResponse.json({ success: false, message: "Start time must be before end time" }, { status: 400 });
    }
    
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    
    if (updateData.startDate && updateData.endDate) {
      if (updateData.startDate > updateData.endDate) {
        return NextResponse.json({ success: false, message: "End date cannot be before start date" }, { status: 400 });
      }
      if (updateData.startDate.getTime() === updateData.endDate.getTime()) {
        return NextResponse.json({ success: false, message: "Start date and End date cannot be on the same day" }, { status: 400 });
      }
    }

    const updated = await db.tESDAProgram.update({
      where: { id: body.id },
      data: updateData,
      include: {
        category: true
      }
    });

    return NextResponse.json({ success: true, data: mapProgramCostForClient(updated) });
  } catch (error: any) {
    console.error("Programs PUT Error:", error);
    return NextResponse.json({ success: false, error: sanitizeApiError(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const roleStr = (session?.user as any)?.role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    if (!id) return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });

    const prog = await db.tESDAProgram.findUnique({ where: { id } });
    if (!prog) return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 });

    if (permanent) {
      await db.referral.deleteMany({ where: { programId: id } });
      await db.tESDAProgram.delete({ where: { id } });
      return NextResponse.json({
        success: true,
        message: `Program "${prog.title}" and related records permanently deleted.`
      });
    }

    // Read selective graduation evaluation from body if provided
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Body may be empty on query-only calls
    }

    // 1. Soft delete / archive program
    const updated = await db.tESDAProgram.update({
      where: { id },
      data: { activeStatus: "Closed" }
    });

    let graduatedCount = 0;
    let incompleteCount = 0;

    if (body && Array.isArray(body.graduatedReferralIds)) {
      const gradIds: string[] = body.graduatedReferralIds;
      const incompIds: string[] = Array.isArray(body.incompleteReferralIds) ? body.incompleteReferralIds : [];

      if (gradIds.length > 0) {
        const resGrad = await db.referral.updateMany({
          where: { id: { in: gradIds }, programId: id },
          data: { status: "Archived" }
        });
        graduatedCount = resGrad.count;
      }

      if (incompIds.length > 0) {
        const resIncomp = await db.referral.updateMany({
          where: { id: { in: incompIds }, programId: id },
          data: { status: "Declined" }
        });
        incompleteCount = resIncomp.count;
      }

      // Close any remaining Pending applications
      await db.referral.updateMany({
        where: { programId: id, status: "Pending" },
        data: { status: "Declined" }
      });
    } else {
      // Fallback for legacy calls without body
      const archivedRefs = await db.referral.updateMany({
        where: {
          programId: id,
          status: { in: ["Enrolled", "Pending"] }
        },
        data: { status: "Archived" }
      });
      graduatedCount = archivedRefs.count;
    }

    return NextResponse.json({
      success: true,
      message: `Program "${prog.title}" archived successfully: ${graduatedCount} graduate(s) certified${incompleteCount > 0 ? `, ${incompleteCount} marked incomplete` : ""}.`,
      data: updated,
      graduatedCount,
      incompleteCount,
      archivedStudentsCount: graduatedCount
    });
  } catch (error: any) {
    console.error("Programs DELETE Error:", error);
    return NextResponse.json({ success: false, error: sanitizeApiError(error) }, { status: 400 });
  }
}
