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
    const { youth, programs, targetProgram, generateLLMAdvice } = await request.json();
    
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
    let savedAdviceResult: any = null;

    // Filter to passing programs for LLM advice, or fall back to available scored programs
    const passingPrograms = scoredPrograms
      .filter(sp => sp.breakdown.passedSkillGate)
      .map(sp => sp.program);

    if (generateLLMAdvice && (targetProgram || scoredPrograms.length > 0)) {
      const topRankedPrograms: TESDAProgram[] = targetProgram
        ? [targetProgram as TESDAProgram]
        : passingPrograms.length > 0
          ? passingPrograms.slice(0, 3)
          : scoredPrograms.slice(0, 3).map(sp => sp.program);

      const targetProg = topRankedPrograms[0];

      // Generate base English advice specifically for this target program
      advice = await generateYouthCareerPathway(youth as YouthProfile, [targetProg]);
      bulletAdvice = await generateYouthPersonalizedAdviceBullets(youth as YouthProfile, [targetProg]);

      // Directly translate the exact generated English advice into simple Tagalog
      // to guarantee 100% semantic consistency, identical numbers, and identical steps
      careerAdviceTl = await translateAdviceToSimpleTagalog(advice, youth as YouthProfile);
      bulletAdviceTl = await translateBulletsToSimpleTagalog(bulletAdvice, youth as YouthProfile);

      // Persist to database for this youth profile (merging into byProgramId map so multiple Top Matches are all saved)
      if (youth.id && youth.id !== "empty-youth-profile" && advice && targetProg) {
        try {
          const entry = {
            programId: targetProg.id || "",
            programTitle: targetProg.title || "",
            careerAdvice: advice,
            bulletAdvice,
            careerAdviceTl,
            bulletAdviceTl,
            generatedAt: new Date().toISOString()
          };

          let existingAdvice: any = youth.savedMatchAdvice || null;
          try {
            const rows: any[] = await db.$queryRawUnsafe(
              `SELECT "savedMatchAdvice" FROM "YouthProfile" WHERE "id" = $1 LIMIT 1`,
              youth.id
            );
            if (rows && rows[0]?.savedMatchAdvice) {
              const raw = rows[0].savedMatchAdvice;
              existingAdvice = typeof raw === "string" ? JSON.parse(raw) : raw;
            }
          } catch {
            // fallback to youth.savedMatchAdvice if query fails
          }

          const byProgramId: Record<string, any> = {
            ...(existingAdvice?.byProgramId || {})
          };

          if (existingAdvice?.programId && existingAdvice?.careerAdvice) {
            byProgramId[existingAdvice.programId] = {
              programId: existingAdvice.programId,
              programTitle: existingAdvice.programTitle || "",
              careerAdvice: existingAdvice.careerAdvice,
              bulletAdvice: Array.isArray(existingAdvice.bulletAdvice) ? existingAdvice.bulletAdvice : [],
              careerAdviceTl: existingAdvice.careerAdviceTl || "",
              bulletAdviceTl: Array.isArray(existingAdvice.bulletAdviceTl) ? existingAdvice.bulletAdviceTl : [],
              generatedAt: existingAdvice.generatedAt
            };
          }

          byProgramId[targetProg.id] = entry;

          const adviceObj = {
            ...(existingAdvice?.programId ? existingAdvice : entry),
            byProgramId
          };
          savedAdviceResult = adviceObj;

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
      programId: targetProgram?.id || scoredPrograms[0]?.program?.id || "",
      careerAdvice: advice,
      bulletAdvice,
      careerAdviceTl,
      bulletAdviceTl,
      savedMatchAdvice: savedAdviceResult
    });
  } catch (error: any) {
    console.error("Match API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
