import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    const roleStr = (session.user as any).role;
    
    let whereClause: any = {};

    if (roleStr === "SK_OFFICIAL" || roleStr === "BARANGAY_CAPTAIN") {
       whereClause.youth = { barangayId: (session.user as any).barangayId };
    } else if (roleStr === "KK_YOUTH") {
       whereClause.youth = {
         OR: [
           { userId: (session.user as any).id },
           { name: (session.user as any).name }
         ]
       };
    }
    
    if (filterBarangay && filterBarangay !== "All") {
      if (roleStr === "SUPER_ADMIN" || roleStr === "TESDA_PARTNER") {
        whereClause.youth = { barangay: { name: filterBarangay } };
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

    // Update hasReferred flag on youth profile
    await db.youthProfile.update({
      where: { id: youthId },
      data: { hasReferred: true }
    });

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

    // When accepting into program, decrement slotsRemaining
    if (body.status === "Enrolled" && currentRef.status !== "Enrolled") {
      if (currentRef.program && currentRef.program.slotsRemaining <= 0) {
        return NextResponse.json({ success: false, error: `Cannot accept: "${currentRef.program.title}" has no available slots left!` }, { status: 400 });
      }
      if (currentRef.program) {
        await db.tESDAProgram.update({
          where: { id: currentRef.programId },
          data: { slotsRemaining: Math.max(0, currentRef.program.slotsRemaining - 1) }
        });
      }
    } else if (body.status !== "Enrolled" && currentRef.status === "Enrolled") {
      // If changing from Enrolled to Declined or Pending, restore the slot
      if (currentRef.program) {
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

    const referral = await db.referral.findUnique({ where: { id } });
    if (!referral) {
      return NextResponse.json({ success: true, message: "Referral already removed" });
    }

    const youthId = referral.youthId;
    await db.referral.delete({ where: { id } });

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
