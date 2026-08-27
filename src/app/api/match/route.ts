import { NextResponse } from "next/server";
import { calculateContentBasedMatchScore } from "@/lib/cbf-matcher";
import { generateYouthCareerPathway, generateYouthPersonalizedAdviceBullets } from "@/lib/gemini";
import { YouthProfile, TESDAProgram } from "@/types";

export async function POST(request: Request) {
  try {
    const { youth, programs, generateLLMAdvice } = await request.json();
    
    if (!youth || !Array.isArray(programs)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    const matches = programs.map((program: TESDAProgram) => {
      const score = calculateContentBasedMatchScore(youth as YouthProfile, program);
      return {
        programId: program.id,
        programTitle: program.title,
        matchScore: score
      };
    });

    let advice = "";
    let bulletAdvice: string[] = [];

    if (generateLLMAdvice) {
      advice = await generateYouthCareerPathway(youth as YouthProfile, programs.slice(0, 3));
      bulletAdvice = await generateYouthPersonalizedAdviceBullets(youth as YouthProfile, programs.slice(0, 3));
    }

    return NextResponse.json({
      success: true,
      matches,
      careerAdvice: advice,
      bulletAdvice
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
