import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateYouthLongTermCareerPlan } from "@/lib/gemini";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { youthProfile, program } = body;

    if (!youthProfile) {
      return NextResponse.json({ success: false, error: "Missing youthProfile payload" }, { status: 400 });
    }

    // Generate real-time Gemini long-term career roadmap
    const careerPlan = await generateYouthLongTermCareerPlan(youthProfile, program);

    return NextResponse.json({
      success: true,
      data: careerPlan
    });
  } catch (error: any) {
    console.error("Career Plan API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
