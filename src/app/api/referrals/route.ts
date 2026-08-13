import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

function mapToPipelineItem(r: any) {
  return {
    id: r.id,
    youthName: r.youth.name,
    purok: r.youth.purok,
    barangay: r.youth.barangay.name,
    programTitle: r.program.title,
    matchScore: r.matchScore,
    referralDate: r.referralDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
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
       whereClause.youth = { userId: (session.user as any).id };
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
    
    // Fallback: If payload gives youthName instead of youthId (for prototype transition)
    let youthId = body.youthId;
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
