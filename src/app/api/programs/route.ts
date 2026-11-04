import { NextResponse } from "next/server";
import { db, sanitizeApiError } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyNewProgramPublished } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get("archived") === "true";

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

    return NextResponse.json({ success: true, data: programs });
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
    if (body.startDate && body.endDate && new Date(body.startDate) > new Date(body.endDate)) return NextResponse.json({ success: false, message: "Start date must be before or equal to end date" }, { status: 400 });

    const newProgram = await db.tESDAProgram.create({
      data: {
        title: body.title,
        provider: body.provider || "TESDA Pampanga",
        type: body.type || "Training",
        location: body.location || "San Luis Training Center",
        trainingHours: Number(body.trainingHours),
        cost: body.cost || "Free",
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
        fundingType: body.fundingType || "Free",
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

    return NextResponse.json({ success: true, data: newProgram }, { status: 201 });
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
    delete updateData.id;
    delete updateData.category;
    delete updateData.partner;
    delete updateData.referrals;
    delete updateData._count;

    // Slot integrity recalculation
    if (body.slotsTotal !== undefined) {
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
    
    if (updateData.startDate && updateData.endDate && updateData.startDate > updateData.endDate) {
      return NextResponse.json({ success: false, message: "Start date must be before or equal to end date" }, { status: 400 });
    }

    const updated = await db.tESDAProgram.update({
      where: { id: body.id },
      data: updateData,
      include: {
        category: true
      }
    });

    return NextResponse.json({ success: true, data: updated });
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
