import { NextResponse } from "next/server";
import { calculateDetailedCBFMatch } from "@/lib/cbf-matcher";
import {
  generateYouthCareerPathway,
  generateYouthPersonalizedAdviceBullets,
  translateAdviceToSimpleTagalog,
  translateBulletsToSimpleTagalog
} from "@/lib/gemini";
import { YouthProfile, TESDAProgram } from "@/types";
import { db } from "@/lib/db";

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
    let careerAdviceTl = "";
    let bulletAdviceTl: string[] = [];

    // Filter to passing programs for LLM advice, or fall back to available scored programs
    const passingPrograms = scoredPrograms
      .filter(sp => sp.breakdown.passedSkillGate)
      .map(sp => sp.program);

    if (generateLLMAdvice && scoredPrograms.length > 0) {
      const topRankedPrograms = passingPrograms.length > 0
        ? passingPrograms.slice(0, 3)
        : scoredPrograms.slice(0, 3).map(sp => sp.program);

      // Generate base English advice
      advice = await generateYouthCareerPathway(youth as YouthProfile, topRankedPrograms);
      bulletAdvice = await generateYouthPersonalizedAdviceBullets(youth as YouthProfile, topRankedPrograms);

      // Directly translate the exact generated English advice into simple Tagalog
      // to guarantee 100% semantic consistency, identical numbers, and identical steps
      careerAdviceTl = await translateAdviceToSimpleTagalog(advice, youth as YouthProfile);
      bulletAdviceTl = await translateBulletsToSimpleTagalog(bulletAdvice, youth as YouthProfile);

      // Persist to database for this youth profile so it doesn't need to re-generate on reload
      if (youth.id && youth.id !== "empty-youth-profile" && advice) {
        try {
          const adviceObj = {
            programId: topRankedPrograms[0]?.id || "",
            programTitle: topRankedPrograms[0]?.title || "",
            careerAdvice: advice,
            bulletAdvice,
            careerAdviceTl,
            bulletAdviceTl,
            generatedAt: new Date().toISOString()
          };
          await db.$executeRawUnsafe(
            `UPDATE "YouthProfile" SET "savedMatchAdvice" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
            JSON.stringify(adviceObj),
            youth.id
          );
        } catch (dbErr) {
          console.warn("Failed to auto-save match advice to database:", dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      matches,
      careerAdvice: advice,
      bulletAdvice,
      careerAdviceTl,
      bulletAdviceTl
    });
  } catch (error: any) {
    console.error("Match API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
