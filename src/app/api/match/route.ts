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

    // Rank and sort all programs descending by calculated match score
    const scoredPrograms = programs
      .map((program: TESDAProgram) => {
        const score = calculateContentBasedMatchScore(youth as YouthProfile, program);
        return {
          program,
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    const matches = scoredPrograms.map(sp => ({
      programId: sp.program.id,
      programTitle: sp.program.title,
      matchScore: sp.score
    }));

    let advice = "";
    let bulletAdvice: string[] = [];

    if (generateLLMAdvice && scoredPrograms.length > 0) {
      const topRankedPrograms = scoredPrograms.slice(0, 3).map(sp => sp.program);
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
