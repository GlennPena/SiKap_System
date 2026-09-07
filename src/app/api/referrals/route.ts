import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notifyReferralStatusChanged, notifyNewApplicationReceived } from "@/lib/notifications";

function mapToPipelineItem(r: any) {
  const formattedDate = r.referralDate ? r.referralDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  return {
    id: r.id,
    youthName: r.youth?.name || "Youth Member",
    purok: r.youth?.purok || "",
    barangay: r.youth?.barangay?.name || "",
    programTitle: r.program?.title || "",
    programId: r.programId || r.program?.id || "",
    matchScore: r.matchScore,
    applicationDate: formattedDate,
    referralDate: formattedDate,
    status: r.status
  };
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
       whereClause.youth = {
         OR: [
           { userId: (session.user as any).id },
           { name: (session.user as any).name }
         ]
       };
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
      } else {
        whereClause.program = { activeStatus: { not: "Closed" } };
        whereClause.status = { not: "Archived" };
      }
    }

    const referrals = await db.referral.findMany({
      where: whereClause,
      include: {
        youth: { include: { barangay: true } },
        program: true
      },
      orderBy: { referralDate: "desc" }
    });

    return NextResponse.json({ success: true, data: referrals.map(mapToPipelineItem) });
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
      const y = await db.youthProfile.findFirst({
        where: {
          OR: [
            { userId: (session.user as any).id },
            { name: (session.user as any).name }
          ]
        }
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

    // Check if referral already exists
    const existing = await db.referral.findFirst({
      where: {
        youthId,
        programId
      },
      include: {
        youth: { include: { barangay: true } },
        program: true
      }
    });

    if (existing) {
      await db.youthProfile.update({
        where: { id: youthId },
        data: { hasReferred: true }
      });
      return NextResponse.json({ success: true, data: mapToPipelineItem(existing) });
    }

    // Check program availability
    const program = await db.tESDAProgram.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json({ success: false, error: "Training program not found" }, { status: 404 });
    }

    if (program.slotsRemaining <= 0) {
      return NextResponse.json({ success: false, error: `Cannot apply: "${program.title}" is already at full capacity!` }, { status: 400 });
    }

    const newReferral = await db.referral.create({
      data: {
        youthId,
        programId,
        matchScore: Number(body.matchScore) || 85,
        status: "Pending"
      },
      include: {
        youth: { include: { barangay: true } },
        program: true
      }
    });

    // Reserve 1 slot upon application
    await db.tESDAProgram.update({
      where: { id: programId },
      data: { slotsRemaining: Math.max(0, program.slotsRemaining - 1) }
    });

    // Update hasReferred flag on youth profile
    await db.youthProfile.update({
      where: { id: youthId },
      data: { hasReferred: true }
    });

    // Notify TESDA partners of new applicant
    notifyNewApplicationReceived({
      referralId: newReferral.id,
      youthName: newReferral.youth?.name || "Youth Applicant",
      barangayName: newReferral.youth?.barangay?.name || "San Luis",
      programTitle: newReferral.program?.title || "TESDA Course"
    }).catch((err) => console.error("[New Application Notification Error]:", err));

    return NextResponse.json({ success: true, data: mapToPipelineItem(newReferral) }, { status: 201 });
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

    // Manage slotsRemaining based on status transition
    if (currentRef.program) {
      const wasHoldingSlot = currentRef.status === "Pending" || currentRef.status === "Enrolled";
      const willHoldSlot = body.status === "Pending" || body.status === "Enrolled";

      if (!wasHoldingSlot && willHoldSlot) {
        // Switching from Declined to Pending/Enrolled: reserve 1 slot if available
        if (currentRef.program.slotsRemaining <= 0) {
          return NextResponse.json({ success: false, error: `Cannot update: "${currentRef.program.title}" has no available slots left!` }, { status: 400 });
        }
        await db.tESDAProgram.update({
          where: { id: currentRef.programId },
          data: { slotsRemaining: Math.max(0, currentRef.program.slotsRemaining - 1) }
        });
      } else if (wasHoldingSlot && !willHoldSlot) {
        // Switching from Pending/Enrolled to Declined: restore 1 slot
        await db.tESDAProgram.update({
          where: { id: currentRef.programId },
          data: { slotsRemaining: Math.min(currentRef.program.slotsTotal, currentRef.program.slotsRemaining + 1) }
        });
      }
    }

    const updated = await db.referral.update({
      where: { id: body.id },
      data: { status: body.status },
      include: {
        youth: { include: { barangay: true } },
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
    await db.referral.delete({ where: { id } });

    // Restore slot if the cancelled/deleted referral was currently holding a slot (Pending or Enrolled)
    if ((referral.status === "Pending" || referral.status === "Enrolled") && referral.program) {
      await db.tESDAProgram.update({
        where: { id: referral.programId },
        data: { slotsRemaining: Math.min(referral.program.slotsTotal, referral.program.slotsRemaining + 1) }
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
