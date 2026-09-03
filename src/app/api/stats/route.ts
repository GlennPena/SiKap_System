import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const totalYouth = await db.youthProfile.count();
    const totalPrograms = await db.tESDAProgram.count({
      where: { activeStatus: { not: "Closed" } }
    });
    const totalApplications = await db.referral.count();
    const enrolledApplications = await db.referral.count({ where: { status: "Enrolled" } });
    
    const barangayDistinct = await db.youthProfile.groupBy({
      by: ['barangayId']
    });

    return NextResponse.json({
      success: true,
      data: {
        totalYouth,
        totalPrograms,
        totalApplications,
        enrolledApplications,
        barangaysRepresented: barangayDistinct.length
      }
    });
  } catch (error: any) {
    console.error("Stats GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
