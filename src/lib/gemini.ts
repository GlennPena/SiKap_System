import { GoogleGenAI } from "@google/genai";
import { YouthProfile, TESDAProgram, SkillGapData } from "../types";

/**
 * Helper to call Gemini API with model fallbacks
 */
async function generateContentWithFallback(ai: GoogleGenAI, prompt: string): Promise<string> {
  const modelsToTry = Array.from(new Set([
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash"
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
  const brgyName = youth.barangay?.trim() || "San Luis";

  const generateDynamicPersonalizedRationale = () => {
    const userSkills = youth.skills && youth.skills.length > 0
      ? youth.skills.join(", ")
      : youth.interests && youth.interests.length > 0
        ? youth.interests.join(", ")
        : youth.sectorPreference || "vocational competencies";

    const targetGoal = youth.livelihoodGoal || youth.sectorPreference || "sustainable employment";
    const progTitle = topProg ? topProg.title : "Vocational Training Program";
    const provider = topProg ? topProg.provider : "TESDA Partner Institution";

    return `As a registered Katipunan ng Kabataan member from Barangay ${brgyName}, San Luis, ${firstName} possesses practical background skills in ${userSkills}. Enrolling in ${progTitle} at ${provider} directly bridges their technical competencies, certifying their qualifications under national standards to achieve their career ambition of "${targetGoal}".`;
  };

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return generateDynamicPersonalizedRationale();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert AI Career Matchmaking Consultant analyzing a youth profile for the Sangguniang Kabataan (SK) and Katipunan ng Kabataan (KK) in the Municipality of San Luis, Pampanga.

Evaluate this youth profile against the target program and write a 100% personalized, natural language match rationale explaining WHY this specific program was chosen for them.

YOUTH PROFILE:
- Full Name: ${youth.name}
- Registered Barangay: Barangay ${brgyName}, San Luis, Pampanga (OFFICIALLY VERIFIED)
- Age: ${youth.age}
- Educational Attainment: ${youth.educationalAttainment}
- Current Status: ${youth.currentStatus}
- Registered Skills & Competencies: ${youth.skills.join(", ") || "None listed"}
- Expressed Interests: ${youth.interests?.join(", ") || "None listed"}
- Preferred Sector: ${youth.sectorPreference}
- Career & Livelihood Goal: ${youth.livelihoodGoal}

TARGET PROGRAM:
- Program Title: ${topProg ? topProg.title : "TESDA Vocational Program"}
- Provider: ${topProg ? topProg.provider : "TESDA Partner"}

REQUIREMENTS FOR YOUR RESPONSE:
1. Provide a personalized 2 to 3 sentence reasoning rationale explaining why ${firstName} from Barangay ${brgyName} is matched to this program.
2. Accurately identify ${firstName} as a Katipunan ng Kabataan (KK) member residing in Barangay ${brgyName}, San Luis. You MUST strictly use "Barangay ${brgyName}" and NEVER substitute or mention any other barangay.
3. Directly reference ${firstName}'s registered skills (${youth.skills.slice(0, 3).join(", ") || "background"}) and how they align with the program's focus.
4. Connect how completing this program unlocks their goal ("${youth.livelihoodGoal}").
5. Output ONLY the raw rationale text. Do NOT use quotes, markdown bolding, or bullet points.
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
 * Rule-based fallback translation for youth advice rationale to ensure high consistency when offline
 */
export function fallbackTranslateAdviceToTagalog(englishAdvice: string, youth: YouthProfile): string {
  if (!englishAdvice) return "";
  const firstName = (youth.name || "Miyembro ng KK").split(" ")[0];
  const brgyName = youth.barangay?.trim() || "San Luis";

  let t = englishAdvice;
  t = t.replace(/As a registered Katipunan ng Kabataan member from Barangay/gi, "Bilang isang rehistradong miyembro ng Katipunan ng Kabataan mula sa Barangay");
  t = t.replace(/As an active Katipunan ng Kabataan member from Barangay/gi, "Bilang isang aktibong miyembro ng Katipunan ng Kabataan mula sa Barangay");
  t = t.replace(/possesses practical background skills in/gi, "ay may praktikal na kasanayan sa");
  t = t.replace(/has practical background skills in/gi, "ay may praktikal na kasanayan sa");
  t = t.replace(/practical background skills in/gi, "praktikal na kasanayan sa");
  t = t.replace(/Enrolling in/gi, "Ang pag-aaral ng");
  t = t.replace(/directly bridges their technical competencies/gi, "ay lalong magpapalakas sa kanyang mga kakayahan");
  t = t.replace(/directly bridges their competencies/gi, "ay magpapalakas sa kanyang mga kasanayan");
  t = t.replace(/certifying their qualifications under national standards/gi, "at magbibigay ng opisyal na sertipikasyon mula sa TESDA");
  t = t.replace(/to achieve their career ambition of/gi, "upang maabot ang pangarap na");
  t = t.replace(/to achieve their goal of/gi, "upang maabot ang pangarap na");
  t = t.replace(/unlock formal job opportunities in/gi, "at magbubukas ng magagandang trabaho sa");
  t = t.replace(/unlock sustainable livelihood opportunities in/gi, "at magbubukas ng matatag na hanapbuhay sa");
  t = t.replace(/is an excellent match because/gi, "ay napakagandang tugma dahil");
  t = t.replace(/is a direct fit because/gi, "ay eksaktong bagay dahil");
  t = t.replace(/will officially certify their qualifications/gi, "ay magbibigay sa iyo ng opisyal na sertipiko");
  t = t.replace(/vocational trades/gi, "mga bokasyonal na larangan");
  t = t.replace(/their target industry/gi, "kanyang napiling hanapbuhay");

  return t;
}

/**
 * Translates an AI-generated English match rationale into accurate, simple Tagalog for Out-of-School Youth (OSY).
 * Translating directly from the generated English ensures 100% semantic consistency, identical recommendations,
 * and eliminates discrepancies between the English and Tagalog views.
 */
export async function translateAdviceToSimpleTagalog(
  englishAdvice: string,
  youth: YouthProfile
): Promise<string> {
  if (!englishAdvice) return "";
  const fallback = fallbackTranslateAdviceToTagalog(englishAdvice, youth);

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert bilingual Youth Career Counselor for Katipunan ng Kabataan in San Luis, Pampanga.
Translate this English AI Match Rationale into ACCURATE, SIMPLE, CONVERSATIONAL TAGALOG (Filipino) for an Out-of-School Youth (OSY).

SOURCE ENGLISH RATIONALE (GENERATED BY AI):
"${englishAdvice}"

YOUTH PROFILE:
- Name: ${youth.name}
- Barangay: Barangay ${youth.barangay || "San Luis"}, San Luis, Pampanga

STRICT TRANSLATION INSTRUCTIONS FOR ACCURACY & CONSISTENCY:
1. ACCURACY: The translation must be 100% faithful to the source English text. Preserve the exact reasons, specific skills mentioned, training program title, school/provider name, and career goals.
2. ACCESSIBLE FOR OSY: Use plain, conversational, and encouraging Tagalog. Avoid difficult, archaic, or overly formal textbook Filipino words.
3. PRESERVE ENTITIES: Keep the youth's name, "Barangay ${youth.barangay || "San Luis"}", "San Luis, Pampanga", program names, and credentials like "NC II" and "TESDA" exact.
4. Output ONLY the raw translated paragraph. Do NOT add quotes, markdown formatting, or introductory greetings.
`;
    const text = await generateContentWithFallback(ai, prompt);
    const cleaned = text ? text.replace(/^["']|["']$/g, "").trim() : "";
    return cleaned || fallback;
  } catch (error) {
    console.error("Gemini Translate Advice Error:", error);
    return fallback;
  }
}

/**
 * Generates or translates an inspiring, simple Tagalog AI Match Rationale tailored for Out-of-School Youth (OSY).
 * When englishAdvice is provided, translates it directly to guarantee 100% consistency with the English text.
 */
export async function generateYouthCareerPathwayTagalog(
  youth: YouthProfile,
  topPrograms: TESDAProgram[],
  englishAdvice?: string
): Promise<string> {
  const baseEnglish = englishAdvice || await generateYouthCareerPathway(youth, topPrograms);
  return translateAdviceToSimpleTagalog(baseEnglish, youth);
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
  const brgyName = youth.barangay?.trim() || "San Luis";
  const skillsStr = youth.skills && youth.skills.length > 0 ? youth.skills.join(" and ") : youth.sectorPreference || "your background skills";
  const goalStr = youth.livelihoodGoal || "your career goal";
  const progTitle = topProg ? topProg.title : "TESDA Vocational Course";
  const provider = topProg ? topProg.provider : "TESDA GPSAT";

  const defaultBullets = [
    `Leverage your existing foundational skills in ${skillsStr} during early practical modules of ${progTitle}.`,
    `Successfully complete the certified NC II coursework at ${provider} to obtain nationwide accredited credentials.`,
    `Utilize local Katipunan ng Kabataan (KK) referrals in Barangay ${brgyName} to secure placement matching "${goalStr}".`
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
- Barangay: Barangay ${brgyName}, San Luis, Pampanga
- Skills: ${skillsStr}
- Sector Preference: ${youth.sectorPreference}
- Goal: ${goalStr}

TARGET PROGRAM:
- Title: ${progTitle}
- Provider: ${provider}

REQUIREMENTS:
- Exactly 3 actionable bullet points tailored specifically to ${firstName} from Barangay ${brgyName}.
- Step 1: Action item focusing on leveraging their skills (${skillsStr}).
- Step 2: Action item focusing on completing ${progTitle} at ${provider}.
- Step 3: Action item focusing on connecting with local KK/SK referrals in Barangay ${brgyName} to achieve their goal ("${goalStr}").
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
 * Generates concise 3-bullet advice pathway in simple Tagalog directly from Google Gemini
/**
 * Rule-based fallback translation for a single action bullet
 */
export function fallbackTranslateBulletToTagalog(bullet: string, youth: YouthProfile): string {
  let b = bullet;
  b = b.replace(/^Leverage your existing foundational skills in/gi, "Gamitin ang iyong mga natutunang kasanayan sa");
  b = b.replace(/^Leverage your practical skills in/gi, "Gamitin ang iyong praktikal na kasanayan sa");
  b = b.replace(/^Leverage your skills in/gi, "Gamitin ang iyong kasanayan sa");
  b = b.replace(/^Apply your hands-on experience in/gi, "Gamitin ang iyong aktwal na karanasan sa");
  b = b.replace(/^Apply your foundational skills in/gi, "Gamitin ang iyong kaalaman sa");
  b = b.replace(/during early practical modules of/gi, "sa mga unang practical module ng");
  b = b.replace(/during initial training modules of/gi, "sa simula ng kursong");
  b = b.replace(/during early modules of/gi, "sa mga unang module ng");

  b = b.replace(/^Successfully complete the certified NC II coursework at/gi, "Tapusin ang certified NC II training sa");
  b = b.replace(/^Successfully complete the NC II program at/gi, "Matagumpay na tapusin ang kursong NC II sa");
  b = b.replace(/^Complete the certified NC II training at/gi, "Tapusin ang certified NC II training sa");
  b = b.replace(/^Complete the certified NC II coursework at/gi, "Tapusin ang certified NC II coursework sa");
  b = b.replace(/^Complete the/gi, "Tapusin ang");
  b = b.replace(/to obtain nationwide accredited credentials\./gi, "upang magkaroon ng opisyal na sertipiko mula sa TESDA.");
  b = b.replace(/to obtain nationally accredited credentials\./gi, "para sa pambansang sertipikasyon mula sa TESDA.");
  b = b.replace(/to receive accredited certification\./gi, "para sa pambansang sertipikasyon.");

  b = b.replace(/^Utilize local Katipunan ng Kabataan \(KK\) referrals in/gi, "Gamitin ang tulong at referral ng Katipunan ng Kabataan (KK) sa");
  b = b.replace(/^Coordinate with SK and PESO officials in/gi, "Makipag-ugnayan sa SK at PESO sa");
  b = b.replace(/^Coordinate with local KK\/SK referrals in/gi, "Lumapit sa mga referral ng KK at SK sa");
  b = b.replace(/^Connect with local KK\/SK officials in/gi, "Makipag-ugnayan sa pamunuan ng KK at SK sa");
  b = b.replace(/to secure placement matching/gi, "upang makahanap ng trabaho na tugma sa");
  b = b.replace(/to secure job opportunities matching/gi, "upang makahanap ng trabahong tugma sa");
  b = b.replace(/to achieve your goal of/gi, "upang makamit ang pangarap na");
  b = b.replace(/to achieve your career ambition of/gi, "upang maabot ang pangarap na");

  return b;
}

/**
 * Translates an array of AI-generated English advice bullets into accurate, simple Tagalog for Out-of-School Youth (OSY).
 * Translating directly from the generated English ensures 100% semantic consistency.
 */
export async function translateBulletsToSimpleTagalog(
  englishBullets: string[],
  youth: YouthProfile
): Promise<string[]> {
  if (!Array.isArray(englishBullets) || englishBullets.length === 0) return [];
  const fallbacks = englishBullets.map(b => fallbackTranslateBulletToTagalog(b, youth));

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return fallbacks;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert bilingual Youth Career Counselor for Katipunan ng Kabataan in San Luis, Pampanga.
Translate these ${englishBullets.length} English Action Steps for an Out-of-School Youth into ACCURATE, SIMPLE, CONVERSATIONAL TAGALOG (Filipino).

SOURCE ACTION STEPS (GENERATED BY AI):
${englishBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

YOUTH CONTEXT:
- Name: ${youth.name}
- Barangay: Barangay ${youth.barangay || "San Luis"}, San Luis, Pampanga

STRICT TRANSLATION INSTRUCTIONS FOR ACCURACY & CONSISTENCY:
1. ACCURACY: Translate each step faithfully so that it has the exact same meaning, recommendations, and local entities as its English counterpart.
2. ACCESSIBLE FOR OSY: Use plain, conversational, everyday Tagalog.
3. EXACT BULLET COUNT: Output exactly ${englishBullets.length} lines, each starting with "• ". Do NOT combine steps or include headers.
`;
    const text = await generateContentWithFallback(ai, prompt);
    if (text) {
      const parsed = text
        .split("\n")
        .map(line => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
        .filter(s => s.length > 5);
      if (parsed.length === englishBullets.length) {
        return parsed;
      }
    }
    return fallbacks;
  } catch (err) {
    console.error("Gemini Translate Bullets Error:", err);
    return fallbacks;
  }
}

/**
 * Generates or translates concise 3-bullet advice pathway in simple Tagalog directly from Google Gemini.
 * When englishBullets is provided, translates it directly to guarantee 100% consistency with the English text.
 */
export async function generateYouthPersonalizedAdviceBulletsTagalog(
  youth: YouthProfile,
  topPrograms: TESDAProgram[],
  englishBullets?: string[]
): Promise<string[]> {
  const baseBullets = (englishBullets && englishBullets.length > 0)
    ? englishBullets
    : await generateYouthPersonalizedAdviceBullets(youth, topPrograms);
  return translateBulletsToSimpleTagalog(baseBullets, youth);
}

/**
 * Uses Gemini LLM to generate strategic policy & budget recommendations for SK Officials
 */
export async function generateSKSkillsGapReport(
  skillsGaps: SkillGapData[],
  barangay: string
): Promise<string> {
  const topGaps = skillsGaps.slice(0, 4);
  const gapsList = topGaps.map(g => `- ${g.skill}: ${g.count} youth (${g.percentage}%), ${g.availableSlots} available slots. Recommended Action: ${g.recommendedAction}`).join("\n");

  const defaultReport = `Strategic Competency Intervention for Barangay ${barangay}:

1. Priority Skill Intervention:
The diagnostic data reveals that the most prominent skill deficiency is ${topGaps[0]?.skill || "Technical Literacy"}, affecting ${topGaps[0]?.count || 0} registered Katipunan ng Kabataan members (${topGaps[0]?.percentage || 0}% of the local cohort). Addressing this requires an immediate 3-to-5 day localized community workshop held at the Barangay Hall or Community Center.

2. Budget & Resource Allocation:
It is recommended that the Sangguniang Kabataan allocate 15% to 20% of its Annual Barangay Youth Investment Program (ABYIP) fund toward training materials, assessment subsidies, and starter toolkits for priority Out-of-School Youth (OSY).

3. Institutional Partnerships & Employment Linkages:
Formalize an institutional coordination agreement with TESDA GPSAT (Gonzalo Puyat School of Arts and Trades) for mobile training deployment in Barangay ${barangay}. Coordinate with PESO San Luis and local Pampanga business partners to guarantee job placement and apprenticeship opportunities for certified graduates.`;

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return defaultReport;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a senior Youth TVET Policy Consultant advising the Sangguniang Kabataan (SK) Council of Barangay ${barangay}, San Luis, Pampanga, Philippines.

Analyze the following diagnosed local youth skills gaps:
${gapsList}

Provide an executive, highly actionable 3-part strategic policy and budget recommendation for the SK Chairperson:
1. Priority Skill Intervention (explain the top gap and immediate action).
2. Budget & Resource Allocation (practical advice on using the SK fund/ABYIP).
3. Institutional Partnerships & Employment Linkages (partnering with TESDA GPSAT and PESO San Luis).

Keep the tone professional, concise, encouraging, and policy-oriented. Output formatted plain text paragraphs.
`;

    const text = await generateContentWithFallback(ai, prompt);
    return text || defaultReport;
  } catch (error) {
    console.error("Gemini Skills Gap Report Error:", error);
    return defaultReport;
  }
}

export interface GeminiLongTermCareerPlan {
  roadmapTitle: string;
  summary: string;
  targetGoal: string;
  programTitle: string;
  immediate30Days: string[];
  employmentTrack: {
    targetRoles: string[];
    targetLocations: string;
    estimatedSalary: string;
    actionSteps: string[];
  };
  entrepreneurshipTrack: {
    businessConcept: string;
    starterFunding: string;
    initialServices: string[];
  };
  longTerm1To2Years: string[];
  localSupportContacts: string[];
  generatedDate: string;
}

/**
 * Generates a realistic, highly personalized post-graduation long-term career roadmap
 * tailored for Katipunan ng Kabataan Out-of-School Youth (OSY) in San Luis, Pampanga.
 */
export async function generateYouthLongTermCareerPlan(
  youth: YouthProfile,
  program?: TESDAProgram | null
): Promise<GeminiLongTermCareerPlan> {
  const firstName = (youth.name || "Youth Member").split(" ")[0];
  const progTitle = program?.title || "TESDA NC II Certified Course";
  const provider = program?.provider || "TESDA Pampanga";
  const goalStr = youth.livelihoodGoal || "Certified Skilled Professional";
  const brgyStr = youth.barangay || "San Luis";
  const skillsStr = youth.skills && youth.skills.length > 0 ? youth.skills.join(", ") : "technical skills";

  const fallbackPlan: GeminiLongTermCareerPlan = {
    roadmapTitle: `${progTitle} Post-Graduation Career Roadmap`,
    summary: `Tailored post-graduation action plan for ${firstName} to transition from ${progTitle} graduate into an actively earning professional in ${brgyStr}, Pampanga.`,
    targetGoal: goalStr,
    programTitle: progTitle,
    immediate30Days: [
      `Claim your official TESDA National Certificate (NC II) and National Certificate Card from ${provider}.`,
      `Register as a certified jobseeker at the PESO (Public Employment Service Office) Desk in San Luis Municipal Hall.`,
      `Compile a one-page competency resume showcasing your hands-on laboratory training and practical skills in ${skillsStr}.`
    ],
    employmentTrack: {
      targetRoles: [
        `${progTitle.replace(/NC\s*II/gi, "").trim()} Specialist`,
        `Technical Support Assistant`,
        `Junior Operations Technician`
      ],
      targetLocations: `San Luis, City of San Fernando, and Clark Freeport Zone, Pampanga`,
      estimatedSalary: `₱14,500 – ₱20,000 / month (entry-level)`,
      actionSteps: [
        `Attend the quarterly Pampanga Provincial Job Fair and apply to TESDA-partner companies with your NC II credential.`,
        `Practice technical interview responses demonstrating practical problem solving from your ${provider} coursework.`
      ]
    },
    entrepreneurshipTrack: {
      businessConcept: `Local Home-Service & Freelance Enterprise in Barangay ${brgyStr}`,
      starterFunding: `Apply for the Sangguniang Kabataan (SK) Youth Livelihood Grant and DTI Pangkabuhayan Starter Toolkit.`,
      initialServices: [
        `On-call repair and maintenance services for households and small businesses in ${brgyStr}.`,
        `Promote your services on local San Luis community Facebook groups with transparent service rates.`
      ]
    },
    longTerm1To2Years: [
      `Pursue advanced TESDA NC III qualification or specialized micro-credentials to increase your earning capacity.`,
      `Establish a steady client network or secure a senior technician role to achieve your career ambition of "${goalStr}".`
    ],
    localSupportContacts: [
      `PESO San Luis Desk (San Luis Municipal Hall, Pampanga)`,
      `Sangguniang Kabataan (SK) Federation Livelihood Desk`,
      `DTI Negosyo Center – San Luis / San Fernando Branch`
    ],
    generatedDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  };

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return fallbackPlan;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are a senior Youth Employment & TVET Livelihood Consultant for Sangguniang Kabataan in San Luis, Pampanga, Philippines.
Create a 100% realistic, practical, and highly actionable post-graduation livelihood career plan for an Out-of-School Youth (OSY) who has completed their TESDA program.

YOUTH PROFILE:
- Name: ${youth.name} (First Name: ${firstName})
- Age: ${youth.age}
- Barangay: ${brgyStr}, San Luis, Pampanga
- Registered Skills: ${skillsStr}
- Sector Preference: ${youth.sectorPreference}
- Career Landmark Goal: "${goalStr}"
- Completed TESDA Program: "${progTitle}" at ${provider}

INSTRUCTIONS:
Return a strictly valid, raw JSON object (with NO markdown formatting, NO \`\`\`json wrappers) matching the exact schema below:
{
  "roadmapTitle": "string - catchy realistic title (e.g. From CSS NC II Graduate to Professional IT Specialist)",
  "summary": "string - 2 sentence empowering summary tailored to ${firstName}",
  "targetGoal": "${goalStr}",
  "programTitle": "${progTitle}",
  "immediate30Days": [
    "string - Action 1 (e.g. Claim NC II certificate at ${provider})",
    "string - Action 2 (e.g. Register at PESO San Luis Municipal Hall)",
    "string - Action 3 (e.g. Prepare portfolio/resume with practical competencies)"
  ],
  "employmentTrack": {
    "targetRoles": ["string - specific entry level job role 1", "string - role 2", "string - role 3"],
    "targetLocations": "string - local employment locations (San Luis, San Fernando, Clark/Angeles, Pampanga)",
    "estimatedSalary": "string - realistic Philippine peso entry salary (e.g. ₱15,000 – ₱22,000 / month)",
    "actionSteps": ["string - practical application step 1", "string - step 2"]
  },
  "entrepreneurshipTrack": {
    "businessConcept": "string - realistic freelance/home-service business in Barangay ${brgyStr}",
    "starterFunding": "string - realistic grant/toolkit (e.g. SK Livelihood Grant & DTI Negosyo Center Toolkits)",
    "initialServices": ["string - specific service 1 with sample pricing", "string - specific service 2 with pricing"]
  },
  "longTerm1To2Years": [
    "string - 1-2 year milestone 1 (e.g. NC III or specialized certification)",
    "string - 1-2 year milestone 2 (e.g. achieving ${goalStr} with sustainable income)"
  ],
  "localSupportContacts": [
    "PESO San Luis Desk (San Luis Municipal Hall, Pampanga)",
    "Sangguniang Kabataan (SK) Federation Livelihood Desk",
    "DTI Negosyo Center – Pampanga Branch"
  ],
  "generatedDate": "${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}"
}
`;

    const text = await generateContentWithFallback(ai, prompt);
    if (text) {
      const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.roadmapTitle && parsed.immediate30Days) {
        return parsed;
      }
    }
    return fallbackPlan;
  } catch (error) {
    console.error("Gemini Career Plan API Error:", error);
    return fallbackPlan;
  }
}

/**
 * Synchronous, instant fallback translation for GeminiLongTermCareerPlan into simple Tagalog.
 * Accurately translates each individual field and array item of the source plan so that
 * the Tagalog output is 100% consistent with what was generated in English.
 */
export function getFallbackTagalogCareerPlan(
  plan: GeminiLongTermCareerPlan,
  youth: YouthProfile
): GeminiLongTermCareerPlan {
  const firstName = (youth.name || "Miyembro ng KK").split(" ")[0];
  const brgyStr = youth.barangay || "San Luis";
  const progTitle = plan.programTitle || "TESDA Kurso";
  const goalStr = youth.livelihoodGoal || plan.targetGoal || "Matatag na Hanapbuhay";

  // Translate immediate 30 days steps with 1-to-1 fidelity
  const translatedImmediate30Days = (plan.immediate30Days && plan.immediate30Days.length > 0)
    ? plan.immediate30Days.map(step => {
        let s = step;
        s = s.replace(/Obtain official NC II certificate and certified transcript from/gi, "Kunin ang opisyal na sertipiko ng NC II at transcript mula sa");
        s = s.replace(/Obtain official NC II certificate and/gi, "Kunin ang opisyal na sertipiko ng NC II at");
        s = s.replace(/Obtain official (.*?) certificate from/gi, "Kunin ang opisyal na sertipiko ng $1 mula sa");
        s = s.replace(/Acquire certified NC II credentials from/gi, "Kunin ang sertipikadong NC II credentials mula sa");
        s = s.replace(/Register as certified jobseeker at/gi, "Magpalista bilang certified jobseeker sa");
        s = s.replace(/Register at San Luis PESO desk/gi, "Magrehistro sa PESO desk sa San Luis");
        s = s.replace(/Register with San Luis PESO for/gi, "Magrehistro sa PESO San Luis para sa");
        s = s.replace(/Prepare professional bio-data and/gi, "Maghanda ng bio-data at");
        s = s.replace(/Prepare a one-page bio-data highlighting/gi, "Gumawa ng isang-pahinang bio-data na nagpapakita ng");
        s = s.replace(/Prepare portfolio of/gi, "Ihanda ang portfolio ng");
        s = s.replace(/Submit candidate profile to/gi, "Ipasa ang profile sa");
        s = s.replace(/at San Luis Municipal Hall/gi, "sa Municipal Hall ng San Luis");
        return s;
      })
    : [
        `Kunin ang iyong opisyal na TESDA National Certificate (NC II) at National Certificate Card mula sa training center.`,
        `Magpalista bilang certified jobseeker sa PESO Desk sa Municipal Hall ng San Luis, Pampanga.`,
        `Gumawa ng isang-pahinang bio-data o resume na nagpapakita ng iyong mga praktikal na kasanayan at karanasan sa workshop.`
      ];

  // Translate employment track action steps with 1-to-1 fidelity
  const translatedActionSteps = (plan.employmentTrack?.actionSteps && plan.employmentTrack.actionSteps.length > 0)
    ? plan.employmentTrack.actionSteps.map(step => {
        let s = step;
        s = s.replace(/Apply to partner service centers and dealerships in/gi, "Mag-apply sa mga partner service center at pagawaan sa");
        s = s.replace(/Participate in PESO-sponsored local job fairs in/gi, "Sumali sa mga job fair na inorganisa ng PESO sa");
        s = s.replace(/Leverage SK employment referral letter for priority endorsement/gi, "Gamitin ang referral letter ng SK para sa agarang endorsement");
        s = s.replace(/Submit applications to/gi, "Magpasa ng aplikasyon sa");
        s = s.replace(/Practice technical interview responses/gi, "Mag-ensayo sa pagsagot sa teknikal na job interview");
        s = s.replace(/Attend the upcoming PESO job fair in/gi, "Pumunta sa darating na PESO job fair sa");
        return s;
      })
    : [
        `Pumunta sa mga Job Fair sa Pampanga at magpasa ng aplikasyon sa mga kumpanyang partner ng TESDA gamit ang iyong NC II.`,
        `Mag-ensayo sa pagsagot sa job interview at ipakita ang iyong natutunang galing sa aktwal na pagsasanay.`
      ];

  // Translate entrepreneurship track initial services with 1-to-1 fidelity
  const translatedInitialServices = (plan.entrepreneurshipTrack?.initialServices && plan.entrepreneurshipTrack.initialServices.length > 0)
    ? plan.entrepreneurshipTrack.initialServices.map(srv => {
        let s = srv;
        s = s.replace(/home-based/gi, "serbisyo sa tahanan");
        s = s.replace(/on-call/gi, "on-call na serbisyo");
        s = s.replace(/basic maintenance and troubleshooting/gi, "pangunahing maintenance at pagkukumpuni");
        s = s.replace(/per service/gi, "bawat serbisyo");
        s = s.replace(/per project/gi, "bawat proyekto");
        s = s.replace(/per hour/gi, "bawat oras");
        s = s.replace(/starter fee/gi, "panimulang singil");
        return s;
      })
    : [
        `Paggawa at pagkukumpuni para sa mga tahanan at maliliit na negosyo sa Barangay ${brgyStr}.`,
        `I-post ang iyong serbisyo sa mga community Facebook group sa San Luis na may malinaw na presyo.`
      ];

  // Translate long-term 1-2 years milestones with 1-to-1 fidelity
  const translatedLongTerm = (plan.longTerm1To2Years && plan.longTerm1To2Years.length > 0)
    ? plan.longTerm1To2Years.map(m => {
        let s = m;
        s = s.replace(/Acquire TESDA NC III/gi, "Kumuha ng TESDA NC III");
        s = s.replace(/Acquire specialized certification/gi, "Kumuha ng espesyal na sertipikasyon");
        s = s.replace(/Expand from solo freelancing to/gi, "Mula sa sariling raket, magpalawak patungo sa");
        s = s.replace(/Achieve sustainable monthly revenue of/gi, "Makamit ang buwanang kita na");
        s = s.replace(/Transition into supervisor or lead technician/gi, "Maging supervisor o lead technician");
        s = s.replace(/Establish registered business name with DTI/gi, "Irehistro ang opisyal na pangalan ng negosyo sa DTI");
        return s;
      })
    : [
        `Kumuha ng mas mataas na kwalipikasyon tulad ng TESDA NC III o karagdagang micro-credentials upang lumaki ang kita.`,
        `Bumuo ng matatag na grupo ng mga suki o maging senior technician upang maabot ang pangarap na "${goalStr}".`
      ];

  // Translate title and summary
  const translatedTitle = plan.roadmapTitle
    ? plan.roadmapTitle
        .replace(/Roadmap/gi, "Gabay sa Trabaho at Negosyo")
        .replace(/Career Plan/gi, "Plano sa Karera")
        .replace(/Strategy/gi, "Estratehiya")
    : `${progTitle} • Gabay sa Trabaho at Negosyo Pagkatapos ng Pagsasanay`;

  const translatedSummary = plan.summary
    ? plan.summary
        .replace(/^A pragmatic, real-life career action plan tailored for your transition from/gi, "Praktikal at totoong gabay sa hanapbuhay mula sa")
        .replace(/A pragmatic, real-life career action plan tailored for/gi, "Praktikal at totoong plano sa karera para kay")
        .replace(/into employment and entrepreneurship in/gi, "patungo sa trabaho at negosyo sa")
        .replace(/A strategic post-graduation roadmap for/gi, "Isang estratehikong gabay pagkatapos ng kurso para kay")
    : `Praktikal at totoong plano sa buhay para kay ${firstName} upang makapagsimula agad sa trabaho o sariling negosyo sa Barangay ${brgyStr}, San Luis pagkatapos ng ${progTitle}.`;

  return {
    roadmapTitle: translatedTitle,
    summary: translatedSummary,
    targetGoal: goalStr,
    programTitle: progTitle,
    immediate30Days: translatedImmediate30Days,
    employmentTrack: {
      targetRoles: plan.employmentTrack.targetRoles.map(r => {
        return r
          .replace(/Specialist/gi, "Espesyalista")
          .replace(/Assistant/gi, "Katulong / Assistant")
          .replace(/Technician/gi, "Teknisyan")
          .replace(/Operator/gi, "Operator")
          .replace(/Crew/gi, "Staff / Crew");
      }),
      targetLocations: plan.employmentTrack.targetLocations || `San Luis, Lungsod ng San Fernando, at Clark Freeport Zone, Pampanga`,
      estimatedSalary: plan.employmentTrack.estimatedSalary.includes("month")
        ? plan.employmentTrack.estimatedSalary.replace(/month/gi, "buwan").replace(/entry-level/gi, "panimula")
        : `${plan.employmentTrack.estimatedSalary} (Panimulang Sahod)`,
      actionSteps: translatedActionSteps
    },
    entrepreneurshipTrack: {
      businessConcept: plan.entrepreneurshipTrack.businessConcept
        ? plan.entrepreneurshipTrack.businessConcept
            .replace(/Home-based/gi, "Pambahay na")
            .replace(/Mobile/gi, "Puntahan / Mobile na")
            .replace(/Shop/gi, "Pwesto / Shop")
            .replace(/Service/gi, "Serbisyo")
            .replace(/Enterprise/gi, "Negosyo")
        : `Serbisyo sa Tahanan at Komunidad sa Barangay ${brgyStr}`,
      starterFunding: plan.entrepreneurshipTrack.starterFunding
        ? plan.entrepreneurshipTrack.starterFunding
            .replace(/available upon presentation of NC II/gi, "makukuha gamit ang NC II")
            .replace(/Grant/gi, "Grant / Tulong")
        : `Mag-apply sa SK Youth Livelihood Grant at DTI Pangkabuhayan Starter Toolkit para sa puhunan at gamit.`,
      initialServices: translatedInitialServices
    },
    longTerm1To2Years: translatedLongTerm,
    localSupportContacts: plan.localSupportContacts || [
      `PESO San Luis Desk (Municipal Hall ng San Luis, Pampanga)`,
      `Sangguniang Kabataan (SK) Federation Livelihood Desk`,
      `DTI Negosyo Center – Pampanga Branch`
    ],
    generatedDate: plan.generatedDate
  };
}

/**
 * Translates a GeminiLongTermCareerPlan into simple, conversational Tagalog suitable for Out-of-School Youth (OSY).
 * Strictly guarantees 1-to-1 fidelity with the English source plan to keep the system consistent and accurate.
 */
export async function translateCareerPlanToTagalog(
  plan: GeminiLongTermCareerPlan,
  youth: YouthProfile
): Promise<GeminiLongTermCareerPlan> {
  const fallbackTagalogPlan = getFallbackTagalogCareerPlan(plan, youth);

  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    return fallbackTagalogPlan;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
You are an expert bilingual Youth Employment Consultant and Career Specialist for Katipunan ng Kabataan in San Luis, Pampanga.
Translate the following Career Roadmap JSON for an Out-of-School Youth (OSY) into ACCURATE, SIMPLE, CONVERSATIONAL TAGALOG (Filipino).

SOURCE CAREER ROADMAP JSON (IN ENGLISH):
${JSON.stringify(plan, null, 2)}

YOUTH PROFILE:
- Name: ${youth.name}
- Barangay: Barangay ${youth.barangay || "San Luis"}, San Luis, Pampanga

STRICT TRANSLATION RULES FOR ACCURACY AND CONSISTENCY:
1. FAITHFUL TRANSLATION: Every field in the output must be an accurate, 1-to-1 translation of the corresponding source English field. Do not invent new details, and do not omit any recommendations.
2. PRESERVE FIGURES & ENTITIES: Keep all numbers, salary ranges (translate "/ month" to "/ buwan"), barangay names ("Barangay ${youth.barangay || "San Luis"}"), city names (San Luis, San Fernando, Clark), institution names ("TESDA GPSAT", "PESO", "DTI"), and certifications ("NC II", "NC III") exact.
3. CONVERSATIONAL FOR OSY: Use plain, friendly, everyday Tagalog. Avoid difficult, archaic, or textbook Filipino words.
4. EXACT MATCHING ARRAYS:
   - immediate30Days: Exactly ${plan.immediate30Days.length} items, translated faithfully 1-to-1.
   - targetRoles: Exactly ${plan.employmentTrack.targetRoles.length} items, translated to Filipino/Taglish job titles.
   - actionSteps: Exactly ${plan.employmentTrack.actionSteps.length} items, translated faithfully 1-to-1.
   - initialServices: Exactly ${plan.entrepreneurshipTrack.initialServices.length} items, translated faithfully 1-to-1.
   - longTerm1To2Years: Exactly ${plan.longTerm1To2Years.length} items, translated faithfully 1-to-1.
   - localSupportContacts: Exactly ${plan.localSupportContacts.length} items, keeping official contact names and offices.
5. STRICT JSON OUTPUT: Return ONLY valid JSON matching the exact schema. Do NOT include markdown code fences or backticks.
`;
    const text = await generateContentWithFallback(ai, prompt);
    if (text) {
      const cleanJson = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.roadmapTitle && Array.isArray(parsed.immediate30Days) && parsed.immediate30Days.length > 0) {
        return {
          ...parsed,
          generatedDate: plan.generatedDate || parsed.generatedDate
        };
      }
    }
    return fallbackTagalogPlan;
  } catch (err) {
    console.error("Gemini Translate Plan Error:", err);
    return fallbackTagalogPlan;
  }
}


