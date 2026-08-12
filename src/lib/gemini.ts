import { GoogleGenAI } from "@google/genai";
import { YouthProfile, TESDAProgram, SkillGapData } from "../types";

export async function generateYouthCareerPathway(
  youth: YouthProfile,
  topPrograms: TESDAProgram[]
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return `Based on your skills in ${youth.skills.join(", ")}, we recommend completing TESDA NC II certification in ${youth.sectorPreference} to achieve your goal of "${youth.livelihoodGoal}".`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert Youth Career & Skills Development Advisor for Sangguniang Kabataan in San Luis, Pampanga.
Generate a concise, encouraging 3-bullet point personalized career development advice for this youth:
Name: ${youth.name}
Age: ${youth.age}
Educational Attainment: ${youth.educationalAttainment}
Status: ${youth.currentStatus}
Skills: ${youth.skills.join(", ")}
Interests: ${youth.interests.join(", ")}
Livelihood Goal: ${youth.livelihoodGoal}

Top Matched Programs available:
${topPrograms.map(p => `- ${p.title} (${p.provider})`).join("\n")}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Keep honing your skills through TESDA programs and local SK workshops!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Pursue TESDA certified training in ${youth.sectorPreference} to accelerate your progress toward ${youth.livelihoodGoal}.`;
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

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || `Focus SK funds on top demanded vocational sectors in ${barangay}.`;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Allocate SK Livelihood funds toward high-demand technical courses in ${barangay}.`;
  }
}
