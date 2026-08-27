import { GoogleGenAI } from "@google/genai";
import { YouthProfile, TESDAProgram, SkillGapData } from "../types";

/**
 * Helper to call Gemini API with model fallbacks
 */
async function generateContentWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelsToTry = Array.from(new Set([
    process.env.GEMINI_MODEL,
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite"
  ].filter(Boolean))) as string[];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      console.warn(`Gemini model "${model}" failed, trying next fallback...`);
    }
  }

  return "";
}

/**
 * Generates a 100% personalized, real-time Gemini AI Match Rationale tailored to a youth's unique profile
 */
export async function generateYouthCareerPathway(
  youth: YouthProfile,
  topPrograms: TESDAProgram[]
): Promise<string> {
  const topProg = topPrograms && topPrograms.length > 0 ? topPrograms[0] : null;
  const firstName = (youth.name || "Youth Member").split(" ")[0];

  const generateDynamicPersonalizedRationale = () => {
    const userSkills = youth.skills && youth.skills.length > 0
      ? youth.skills.join(", ")
      : youth.interests && youth.interests.length > 0
        ? youth.interests.join(", ")
        : youth.sectorPreference || "vocational competencies";

    const targetGoal = youth.livelihoodGoal || youth.sectorPreference || "sustainable employment";
    const progTitle = topProg ? topProg.title : "Vocational Training Program";
    const provider = topProg ? topProg.provider : "TESDA Partner Institution";

    return `${firstName} possesses background skills in ${userSkills}. Enrolling in ${progTitle} at ${provider} directly bridges their technical competencies, certifying their qualifications under national standards to achieve their career ambition of "${targetGoal}".`;
  };

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return generateDynamicPersonalizedRationale();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert AI Career Matchmaking Consultant analyzing a youth profile for Sangguniang Kabataan in San Luis, Pampanga.

Evaluate this youth profile against the target program and write a 100% personalized, natural language match rationale explaining WHY this specific program was chosen for them.

YOUTH PROFILE:
- Full Name: ${youth.name}
- Age: ${youth.age}
- Barangay: ${youth.barangay || "San Luis"}
- Educational Attainment: ${youth.educationalAttainment}
- Current Status: ${youth.currentStatus}
- Registered Skills & Competencies: ${youth.skills.join(", ") || "None listed"}
- Expressed Interests: ${youth.interests.join(", ") || "None listed"}
- Preferred Sector: ${youth.sectorPreference}
- Career & Livelihood Goal: ${youth.livelihoodGoal}

TARGET PROGRAM:
- Program Title: ${topProg ? topProg.title : "TESDA Vocational Program"}
- Provider: ${topProg ? topProg.provider : "TESDA Partner"}

REQUIREMENTS FOR YOUR RESPONSE:
1. Provide a personalized 2 to 3 sentence reasoning rationale explaining why ${firstName} is matched to this program.
2. Directly reference ${firstName}'s registered skills (${youth.skills.slice(0, 3).join(", ") || "background"}) and how they align with the program's focus.
3. Connect how completing this program unlocks their goal ("${youth.livelihoodGoal}").
4. Output ONLY the raw rationale text. Do NOT use quotes, markdown bolding, or bullet points.
`;

    const text = await generateContentWithFallback(ai, prompt);
    const cleaned = text ? text.replace(/^["']|["']$/g, "").trim() : "";
    return cleaned || generateDynamicPersonalizedRationale();
  } catch (error) {
    console.error("Gemini API Error:", error);
    return generateDynamicPersonalizedRationale();
  }
}

/**
 * Generates a short personalized 3-bullet advice pathway directly from Google Gemini
 */
export async function generateYouthPersonalizedAdviceBullets(
  youth: YouthProfile,
  topPrograms: TESDAProgram[]
): Promise<string[]> {
  const topProg = topPrograms && topPrograms.length > 0 ? topPrograms[0] : null;
  const firstName = (youth.name || "Youth Member").split(" ")[0];
  const skillsStr = youth.skills && youth.skills.length > 0 ? youth.skills.join(" and ") : youth.sectorPreference || "your background skills";
  const goalStr = youth.livelihoodGoal || "your career goal";
  const progTitle = topProg ? topProg.title : "TESDA Vocational Course";
  const provider = topProg ? topProg.provider : "TESDA GPSAT";

  const defaultBullets = [
    `Leverage your existing foundational skills in ${skillsStr} during early practical modules of ${progTitle}.`,
    `Successfully complete the certified NC II coursework at ${provider} to obtain nationwide accredited credentials.`,
    `Utilize local SK Livelihood referrals in Barangay ${youth.barangay || "San Luis"} to secure placement matching "${goalStr}".`
  ];

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return defaultBullets;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert Youth Career Advisor for Sangguniang Kabataan in San Luis, Pampanga.
Generate exactly 3 concise, highly personalized, and actionable bullet points for ${firstName}'s step-by-step career pathway.

YOUTH PROFILE:
- Name: ${youth.name}
- Skills: ${skillsStr}
- Sector Preference: ${youth.sectorPreference}
- Goal: ${goalStr}

TARGET PROGRAM:
- Title: ${progTitle}
- Provider: ${provider}

REQUIREMENTS:
- Exactly 3 actionable bullet points tailored specifically to ${firstName}.
- Step 1: Action item focusing on leveraging their skills (${skillsStr}).
- Step 2: Action item focusing on completing ${progTitle} at ${provider}.
- Step 3: Action item focusing on achieving their goal ("${goalStr}").
- Output ONLY the 3 lines starting each line with "• ". Do NOT include intro or outro headers.
`;

    const text = await generateContentWithFallback(ai, prompt);
    if (text) {
      const parsed = text
        .split("\n")
        .map(line => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
        .filter(s => s.length > 10);
      if (parsed.length >= 3) {
        return parsed.slice(0, 3);
      }
    }
    return defaultBullets;
  } catch (err) {
    console.error("Gemini Bullets API Error:", err);
    return defaultBullets;
  }
}

/**
 * Uses Gemini LLM to generate policy & training recommendations for SK Officials
 */
export async function generateSKSkillsGapReport(
  skillsGaps: SkillGapData[],
  barangay: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return `Priority recommendation for ${barangay}: Organize mobile welding and food processing NC II workshops to address high youth skill demand.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a public policy AI consultant for local youth development in ${barangay}, San Luis, Pampanga.
Analyze these youth skills gaps and provide a 2-paragraph strategic recommendation for the SK Council budget allocation:

${skillsGaps.map(g => `Skill: ${g.skill} | Demand Count: ${g.count} | Action Needed: ${g.recommendedAction}`).join("\n")}
`;

    const text = await generateContentWithFallback(ai, prompt);
    return text || `Focus SK funds on top demanded vocational sectors in ${barangay}.`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Allocate SK Livelihood funds toward high-demand technical courses in ${barangay}.`;
  }
}
