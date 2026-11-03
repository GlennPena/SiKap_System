import { NextResponse } from "next/server";
import { db, sanitizeApiError } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalYouth, totalPrograms, totalApplications, enrolledApplications, barangayDistinct] = await Promise.all([
      db.youthProfile.count(),
      db.tESDAProgram.count({
        where: { activeStatus: { not: "Closed" } }
      }),
      db.referral.count(),
      db.referral.count({ where: { status: "Enrolled" } }),
      db.youthProfile.groupBy({
        by: ['barangayId']
      })
    ]);

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
    return NextResponse.json({
      success: true,
      data: {
        totalYouth: 0,
        totalPrograms: 0,
        totalApplications: 0,
        enrolledApplications: 0,
        barangaysRepresented: 0
      },
      warning: sanitizeApiError(error)
    });
  }
}
