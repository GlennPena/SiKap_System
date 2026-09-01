import { NextResponse } from "next/server";
import { calculateDetailedCBFMatch } from "@/lib/cbf-matcher";
import { generateYouthCareerPathway, generateYouthPersonalizedAdviceBullets } from "@/lib/gemini";
import { YouthProfile, TESDAProgram } from "@/types";

export async function POST(request: Request) {
  try {
    const { youth, programs, generateLLMAdvice } = await request.json();
    
    if (!youth || !Array.isArray(programs)) {
      return NextResponse.json({ success: false, error: "Invalid parameters" }, { status: 400 });
    }

    // Score all programs with detailed 4-factor breakdown
    const scoredPrograms = programs
      .map((program: TESDAProgram) => {
        const breakdown = calculateDetailedCBFMatch(youth as YouthProfile, program);
        return {
          program,
          score: breakdown.excluded ? 0 : breakdown.finalScore,
          breakdown
        };
      })
      .sort((a, b) => b.score - a.score);

    const matches = scoredPrograms.map(sp => ({
      programId: sp.program.id,
      programTitle: sp.program.title,
      matchScore: sp.score,
      breakdown: sp.breakdown
    }));

    let advice = "";
    let bulletAdvice: string[] = [];

    // Filter to passing programs for LLM advice
    const passingPrograms = scoredPrograms
      .filter(sp => sp.breakdown.passedSkillGate)
      .map(sp => sp.program);

    if (generateLLMAdvice && passingPrograms.length > 0) {
      const topRankedPrograms = passingPrograms.slice(0, 3);
      advice = await generateYouthCareerPathway(youth as YouthProfile, topRankedPrograms);
      bulletAdvice = await generateYouthPersonalizedAdviceBullets(youth as YouthProfile, topRankedPrograms);
    }

    return NextResponse.json({
      success: true,
      matches,
      careerAdvice: advice,
      bulletAdvice
    });
  } catch (error: any) {
    console.error("Match API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
