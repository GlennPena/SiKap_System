import { NextResponse } from "next/server";
import { generateSKSkillsGapReport } from "@/lib/gemini";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { skillsGaps, barangay } = await request.json();
    if (!Array.isArray(skillsGaps)) {
      return NextResponse.json({ success: false, message: "Invalid parameters" }, { status: 400 });
    }

    const report = await generateSKSkillsGapReport(skillsGaps, barangay || "San Luis, Pampanga");
    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
