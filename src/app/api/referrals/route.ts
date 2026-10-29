import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyReferralStatusChanged, notifyNewApplicationReceived } from "@/lib/notifications";

export const dynamic = "force-dynamic";

function mapToPipelineItem(r: any) {
  const formattedDate = r.referralDate ? r.referralDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const youthEmail = r.youth?.user?.email || r.youth?.email || "";
  return {
    id: r.id,
    youthId: r.youthId || r.youth?.id || "",
    youthName: r.youth?.name || "Youth Member",
    youthEmail: youthEmail,
    email: youthEmail,
    purok: r.youth?.purok || "",
    barangay: r.youth?.barangay?.name || "",
    programTitle: r.program?.title || "",
    programId: r.programId || r.program?.id || "",
    matchScore: r.matchScore,
    applicationDate: formattedDate,
    referralDate: formattedDate,
    status: r.status,
    program: r.program ? {
      id: r.program.id,
      title: r.program.title,
      provider: r.program.provider,
      location: r.program.location,
      trainingHours: r.program.trainingHours,
      cost: r.program.cost,
      slotsTotal: r.program.slotsTotal,
      slotsRemaining: r.program.slotsRemaining,
      eligibility: r.program.eligibility,
      activeStatus: r.program.activeStatus
    } : undefined
  };
}

function getStatusPriority(status: string): number {
  if (status === "Archived") return 4;
  if (status === "Enrolled") return 3;
  if (status === "Pending") return 2;
  if (status === "Declined") return 1;
  return 0;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filterBarangay = searchParams.get("barangay");
    const archived = searchParams.get("archived") === "true";
    const roleStr = (session.user as any).role;

    let whereClause: any = {};

    if (roleStr === "KK_YOUTH") {
      const userEmail = (session.user as any).email;
      const userId = (session.user as any).id;
      const orConditions: any[] = [];
      if (userId) orConditions.push({ userId });
      if (userEmail) orConditions.push({ user: { email: userEmail } });

      if (orConditions.length > 0) {
        whereClause.youth = { OR: orConditions };
      } else if ((session.user as any).name) {
        whereClause.youth = { name: (session.user as any).name };
      }
    } else {
      if (roleStr === "SK_OFFICIAL" || roleStr === "BARANGAY_CAPTAIN") {
        whereClause.youth = { barangayId: (session.user as any).barangayId };
      }

      if (filterBarangay && filterBarangay !== "All") {
        if (roleStr === "SUPER_ADMIN" || roleStr === "TESDA_PARTNER") {
          whereClause.youth = { barangay: { name: filterBarangay } };
        }
      }

      if (archived) {
        whereClause.OR = [
          { status: "Archived" },
          { program: { activeStatus: "Closed" } }
        ];
      } else if (roleStr === "TESDA_PARTNER") {
        whereClause.program = { activeStatus: { not: "Closed" } };
        whereClause.status = { not: "Archived" };
      }
    }

    const referrals = await db.referral.findMany({
      where: whereClause,
      include: {
        youth: { include: { barangay: true, user: true } },
        program: true
      },
      orderBy: { referralDate: "desc" }
    });

    // Deduplicate referrals by (youth, program) and clean up any duplicate DB records automatically
    const uniqueMap = new Map<string, any>();
    const duplicateRowsToDelete: any[] = [];

    for (const r of referrals) {
      const youthKey = (
        r.youthId ||
        r.youth?.user?.email?.toLowerCase().trim() ||
        r.youth?.name?.toLowerCase().trim() ||
        r.id
      );
      const programKey = (
        r.programId ||
        r.program?.title?.toLowerCase().trim() ||
        r.id
      );
      const compositeKey = `${youthKey}::${programKey}`;

      const existing = uniqueMap.get(compositeKey);
      if (!existing) {
        uniqueMap.set(compositeKey, r);
      } else {
        const existingPriority = getStatusPriority(existing.status);
        const candidatePriority = getStatusPriority(r.status);
        if (candidatePriority > existingPriority) {
          duplicateRowsToDelete.push(existing);
          uniqueMap.set(compositeKey, r);
        } else {
          duplicateRowsToDelete.push(r);
        }
      }
    }

    if (duplicateRowsToDelete.length > 0) {
      const duplicateIds = duplicateRowsToDelete.map(d => d.id);
      const slotRestoresByProgram = new Map<string, { count: number; slotsTotal: number; slotsRemaining: number }>();

      for (const dup of duplicateRowsToDelete) {
        if ((dup.status === "Pending" || dup.status === "Enrolled") && dup.program && dup.programId) {
          const prev = slotRestoresByProgram.get(dup.programId) || {
            count: 0,
            slotsTotal: dup.program.slotsTotal,
            slotsRemaining: dup.program.slotsRemaining
          };
          prev.count += 1;
          slotRestoresByProgram.set(dup.programId, prev);
        }
      }

      // Clean up duplicates in DB and restore any over-deducted slots
      await db.referral.deleteMany({
        where: { id: { in: duplicateIds } }
      }).catch(err => console.error("Error cleaning duplicate referrals:", err));

      for (const [progId, info] of slotRestoresByProgram.entries()) {
        const restoredSlots = Math.min(info.slotsTotal, info.slotsRemaining + info.count);
        await db.tESDAProgram.update({
          where: { id: progId },
          data: { slotsRemaining: restoredSlots }
        }).catch(err => console.error("Error restoring slot for duplicate referral:", err));
      }
    }

    const deduplicatedReferrals = Array.from(uniqueMap.values());

    return NextResponse.json({ success: true, data: deduplicatedReferrals.map(mapToPipelineItem) });
  } catch (error: any) {
    console.error("Referrals GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const roleStr = (session.user as any).role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "SK_OFFICIAL" && roleStr !== "KK_YOUTH") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    let youthId = body.youthId;
    if (!youthId && roleStr === "KK_YOUTH") {
      const userEmail = (session.user as any).email;
      const userId = (session.user as any).id;
      const orConditions: any[] = [];
      if (userId) orConditions.push({ userId });
      if (userEmail) orConditions.push({ user: { email: userEmail } });

      const y = await db.youthProfile.findFirst({
        where: orConditions.length > 0 ? { OR: orConditions } : { name: (session.user as any).name }
      });
      if (y) youthId = y.id;
    }
    if (!youthId && body.youthName) {
      const y = await db.youthProfile.findFirst({ where: { name: body.youthName } });
      if (y) youthId = y.id;
    }

    let programId = body.programId;
    if (!programId && body.programTitle) {
      const p = await db.tESDAProgram.findFirst({ where: { title: body.programTitle } });
      if (p) programId = p.id;
    }

    if (!youthId || !programId) {
      return NextResponse.json({ success: false, error: "Missing youth or program references" }, { status: 400 });
    }

    // Use a transaction to prevent race-condition duplicate applications from rapid/concurrent requests
    const txResult = await db.$transaction(async (tx) => {
      // Check if referral already exists for this youth and program
      const existing = await tx.referral.findFirst({
        where: {
          youthId,
          programId
        },
        include: {
          youth: { include: { barangay: true, user: true } },
          program: true
        }
      });

      if (existing) {
        await tx.youthProfile.update({
          where: { id: youthId },
          data: { hasReferred: true }
        });
        return { alreadyExisted: true, referral: existing, error: null, status: 200 };
      }

      // Check program availability
      const program = await tx.tESDAProgram.findUnique({
        where: { id: programId }
      });

      if (!program) {
        return { alreadyExisted: false, referral: null, error: "Training program not found", status: 404 };
      }

      if (program.slotsRemaining <= 0) {
        return {
          alreadyExisted: false,
          referral: null,
          error: `Cannot apply: "${program.title}" is already at full capacity!`,
          status: 400
        };
      }

      // Check if program schedule/term has concluded
      if (program.activeStatus === "Closed" || (program.endDate && new Date(program.endDate).getTime() < Date.now())) {
        return {
          alreadyExisted: false,
          referral: null,
          error: `Cannot apply: "${program.title}" training schedule has concluded!`,
          status: 400
        };
      }

      const newReferral = await tx.referral.create({
        data: {
          youthId,
          programId,
          matchScore: Number(body.matchScore) || 85,
          status: "Pending"
        },
        include: {
          youth: { include: { barangay: true, user: true } },
          program: true
        }
      });

      // Reserve 1 slot upon application
      await tx.tESDAProgram.update({
        where: { id: programId },
        data: { slotsRemaining: Math.max(0, program.slotsRemaining - 1) }
      });

      // Update hasReferred flag on youth profile
      await tx.youthProfile.update({
        where: { id: youthId },
        data: { hasReferred: true }
      });

      return { alreadyExisted: false, referral: newReferral, error: null, status: 201 };
    });

    if (txResult.error || !txResult.referral) {
      return NextResponse.json({ success: false, error: txResult.error || "Failed to create application" }, { status: txResult.status });
    }

    if (!txResult.alreadyExisted) {
      // Notify TESDA partners of new applicant only when a brand-new application is created
      notifyNewApplicationReceived({
        referralId: txResult.referral.id,
        youthName: txResult.referral.youth?.name || "Youth Applicant",
        barangayName: txResult.referral.youth?.barangay?.name || "San Luis",
        programTitle: txResult.referral.program?.title || "TESDA Program"
      }).catch((err) => console.error("[New Application Notification Error]:", err));
    }

    return NextResponse.json(
      { success: true, alreadyExisted: txResult.alreadyExisted, data: mapToPipelineItem(txResult.referral) },
      { status: txResult.status }
    );
  } catch (error: any) {
    console.error("Referrals POST Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const roleStr = (session.user as any).role;
    if (roleStr !== "SUPER_ADMIN" && roleStr !== "TESDA_PARTNER" && roleStr !== "SK_OFFICIAL") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ success: false, error: "Missing ID or status" }, { status: 400 });
    }

    const currentRef = await db.referral.findUnique({
      where: { id: body.id },
      include: { program: true }
    });

    if (!currentRef) {
      return NextResponse.json({ success: false, error: "Referral not found" }, { status: 404 });
    }

    // Also find and clean up any duplicate referrals for the same youth + program
    const duplicateRefs = await db.referral.findMany({
      where: {
        youthId: currentRef.youthId,
        programId: currentRef.programId,
        id: { not: currentRef.id }
      }
    });

    let duplicateSlotsHeld = 0;
    if (duplicateRefs.length > 0) {
      duplicateSlotsHeld = duplicateRefs.filter(d => d.status === "Pending" || d.status === "Enrolled").length;
      await db.referral.deleteMany({
        where: { id: { in: duplicateRefs.map(d => d.id) } }
      });
    }

    // Manage slotsRemaining based on status transition + any cleaned duplicate slots
    if (currentRef.program) {
      const wasHoldingSlot = currentRef.status === "Pending" || currentRef.status === "Enrolled";
      const willHoldSlot = body.status === "Pending" || body.status === "Enrolled";

      let slotDelta = duplicateSlotsHeld;
      if (!wasHoldingSlot && willHoldSlot) {
        if (currentRef.program.slotsRemaining + duplicateSlotsHeld <= 0) {
          return NextResponse.json({ success: false, error: `Cannot update: "${currentRef.program.title}" has no available slots left!` }, { status: 400 });
        }
        slotDelta -= 1;
      } else if (wasHoldingSlot && !willHoldSlot) {
        slotDelta += 1;
      }

      if (slotDelta !== 0) {
        const updatedSlots = Math.max(
          0,
          Math.min(currentRef.program.slotsTotal, currentRef.program.slotsRemaining + slotDelta)
        );
        await db.tESDAProgram.update({
          where: { id: currentRef.programId },
          data: { slotsRemaining: updatedSlots }
        });
      }
    }

    const updated = await db.referral.update({
      where: { id: body.id },
      data: { status: body.status },
      include: {
        youth: { include: { barangay: true, user: true } },
        program: true
      }
    });

    // Trigger off-site push & email notifications asynchronously
    notifyReferralStatusChanged({
      referralId: updated.id,
      youthProfileId: updated.youthId,
      status: updated.status,
      programTitle: updated.program?.title || "TESDA Program"
    }).catch((err) => console.error("[Referral Notification Error]:", err));

    return NextResponse.json({ success: true, data: mapToPipelineItem(updated) });
  } catch (error: any) {
    console.error("Referrals PATCH Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing referral ID" }, { status: 400 });
    }

    const referral = await db.referral.findUnique({
      where: { id },
      include: { program: true }
    });
    if (!referral) {
      return NextResponse.json({ success: true, message: "Referral already removed" });
    }

    const youthId = referral.youthId;
    const programId = referral.programId;

    // Find all referrals for this youth + program (in case duplicate rows exist)
    const allMatchingRefs = await db.referral.findMany({
      where: { youthId, programId }
    });
    const slotsHeldCount = allMatchingRefs.filter(r => r.status === "Pending" || r.status === "Enrolled").length;

    await db.referral.deleteMany({
      where: { youthId, programId }
    });

    // Restore slot(s) if the cancelled/deleted referral(s) were currently holding slots (Pending or Enrolled)
    if (slotsHeldCount > 0 && referral.program) {
      await db.tESDAProgram.update({
        where: { id: programId },
        data: { slotsRemaining: Math.min(referral.program.slotsTotal, referral.program.slotsRemaining + slotsHeldCount) }
      });
    }

    // Check if youth has any other referrals left
    const remaining = await db.referral.count({ where: { youthId } });
    if (remaining === 0) {
      await db.youthProfile.update({
        where: { id: youthId },
        data: { hasReferred: false }
      });
    }

    return NextResponse.json({ success: true, message: "Referral deleted successfully" });
  } catch (error: any) {
    console.error("Referrals DELETE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
