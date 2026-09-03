import { YouthProfile, TESDAProgram, CBFScoreBreakdown, NormalizedInputs, NormalizedGoal } from "../types";
import { CATEGORIES, CATEGORY_MAP } from "./cbf-taxonomy-data";
import { normalizeSkills, normalizePreferences, normalizeExperiences, normalizeGoal } from "./cbf-normalization";

/**
 * Resolves or extracts the program's primary categoryId
 */
export function getProgramCategoryId(program: TESDAProgram): string | null {
  if (program.categoryId) {
    return program.categoryId;
  }
  if (typeof program.category === "string") {
    const matchedCategory = CATEGORIES.find(
      c => c.name.toLowerCase() === (program.category as string).toLowerCase() ||
           c.slug.toLowerCase() === (program.category as string).toLowerCase() ||
           c.id === program.category
    );
    if (matchedCategory) return matchedCategory.id;
  } else if (program.category && typeof program.category === "object" && (program.category as any).id) {
    return (program.category as any).id;
  }

  // If a program cannot be confidently classified, return null for review
  return null;
}

/**
 * Extracts and ensures normalized data is available for a YouthProfile.
 * If raw inputs are provided without pre-computed normalized JSON, runs normalization on the fly.
 */
export function resolveYouthNormalizedData(youth: YouthProfile): {
  skills: NormalizedInputs;
  preferences: NormalizedInputs;
  experiences: NormalizedInputs;
  goal: NormalizedGoal;
} {
  // 1. Skills
  let skills: NormalizedInputs = [];
  const rawSkills = (youth.skills && youth.skills.length > 0) ? youth.skills : (youth.skillsRaw || []);
  if (
    youth.skillsNormalized &&
    Array.isArray(youth.skillsNormalized) &&
    youth.skillsNormalized.length === rawSkills.length &&
    rawSkills.length > 0
  ) {
    skills = youth.skillsNormalized;
  } else {
    skills = normalizeSkills(rawSkills);
  }

  // 2. Preferences
  let preferences: NormalizedInputs = [];
  const rawPrefs = youth.preferencesRaw && youth.preferencesRaw.length > 0 
    ? youth.preferencesRaw 
    : (youth.interests || [youth.sectorPreference].filter(Boolean));
  if (
    youth.preferencesNormalized &&
    Array.isArray(youth.preferencesNormalized) &&
    youth.preferencesNormalized.length === rawPrefs.length &&
    rawPrefs.length > 0
  ) {
    preferences = youth.preferencesNormalized;
  } else {
    preferences = normalizePreferences(rawPrefs);
  }

  // 3. Experiences
  let experiences: NormalizedInputs = [];
  const rawExp = youth.experiencesRaw && youth.experiencesRaw.length > 0 ? youth.experiencesRaw : [];
  if (
    youth.experiencesNormalized &&
    Array.isArray(youth.experiencesNormalized) &&
    youth.experiencesNormalized.length === rawExp.length &&
    rawExp.length > 0
  ) {
    experiences = youth.experiencesNormalized;
  } else {
    experiences = normalizeExperiences(rawExp);
  }

  // 4. Primary Goal
  let goal: NormalizedGoal = null;
  if (youth.goalNormalized !== undefined && youth.goalNormalized !== null) {
    goal = youth.goalNormalized;
  } else {
    const rawG = youth.goalRaw || youth.livelihoodGoal;
    goal = normalizeGoal(rawG);
  }

  return { skills, preferences, experiences, goal };
}

/**
 * Calculates full 4-factor detailed score breakdown for a youth and TESDA program
 */
export function calculateDetailedCBFMatch(
  youth: YouthProfile,
  program: TESDAProgram
): CBFScoreBreakdown {
  const programCategoryId = getProgramCategoryId(program);
  
  if (!programCategoryId) {
    return {
      programId: program.id,
      programTitle: program.title,
      categoryId: null,
      categoryName: "Uncategorized",
      skillMatch: 0,
      skillPoints: 0,
      preferenceMatch: 0,
      preferencePoints: 0,
      experienceMatch: 0,
      experiencePoints: 0,
      goalMatch: 0,
      goalPoints: 0,
      finalScore: 0,
      passedSkillGate: false,
      excluded: true
    };
  }

  const categoryObj = CATEGORY_MAP[programCategoryId];
  const categoryName = categoryObj ? categoryObj.name : "Unspecified";

  const { skills, preferences, experiences, goal } = resolveYouthNormalizedData(youth);

  // 1. Skill Match (Weight: 50%)
  // Denominator: Total number of unique resolved canonical skills
  const resolvedSkills = skills.filter(s => !s.isUnresolved && s.categoryId !== null);
  const totalUniqueResolvedSkills = resolvedSkills.length;
  
  const matchingSkills = resolvedSkills.filter(s => s.categoryId === programCategoryId);
  const matchingUniqueSkillsCount = matchingSkills.length;

  const skillMatch = totalUniqueResolvedSkills > 0 
    ? Math.round((matchingUniqueSkillsCount / totalUniqueResolvedSkills) * 100)
    : 0;

  const skillPoints = Number((skillMatch * 0.50).toFixed(2));

  // Skill Relevance Gate:
  // IF skillMatch > 0% -> PASS; IF skillMatch == 0% -> EXCLUDE
  const passedSkillGate = skillMatch > 0;
  const excluded = !passedSkillGate;

  // 2. Preference Match (Weight: 25%)
  const resolvedPreferences = preferences.filter(p => !p.isUnresolved && p.categoryId !== null);
  const hasMatchingPreference = resolvedPreferences.some(p => p.categoryId === programCategoryId);
  const preferenceMatch = hasMatchingPreference ? 100 : 0;
  const preferencePoints = Number((preferenceMatch * 0.25).toFixed(2));

  // 3. Experience Match (Weight: 15%)
  const resolvedExperiences = experiences.filter(e => !e.isUnresolved && e.categoryId !== null);
  const hasMatchingExperience = resolvedExperiences.some(e => e.categoryId === programCategoryId);
  const experienceMatch = hasMatchingExperience ? 100 : 0;
  const experiencePoints = Number((experienceMatch * 0.15).toFixed(2));

  // 4. Primary Goal Match (Weight: 10%)
  const hasMatchingGoal = goal !== null && !goal.isUnresolved && goal.categoryId === programCategoryId;
  const goalMatch = hasMatchingGoal ? 100 : 0;
  const goalPoints = Number((goalMatch * 0.10).toFixed(2));

  // Final Score: (Skill x 0.50) + (Pref x 0.25) + (Exp x 0.15) + (Goal x 0.10)
  // If excluded, finalScore is calculated for debugging but recommendation engines filter excluded items
  const rawSum = skillPoints + preferencePoints + experiencePoints + goalPoints;
  const finalScore = Math.round(rawSum);

  return {
    programId: program.id,
    programTitle: program.title,
    categoryId: programCategoryId,
    categoryName,
    skillMatch,
    preferenceMatch,
    experienceMatch,
    goalMatch,
    skillPoints,
    preferencePoints,
    experiencePoints,
    goalPoints,
    finalScore,
    passedSkillGate,
    excluded,
    matchedSkills: matchingSkills.map(s => s.value || s.raw),
    totalResolvedSkills: totalUniqueResolvedSkills
  };
}

/**
 * Returns the final percentage match score (0 to 100) for a youth and program.
 * Note: If the program fails the Skill Gate, returns 0 for downstream simple displays.
 */
export function calculateContentBasedMatchScore(
  youth: YouthProfile,
  program: TESDAProgram
): number {
  const breakdown = calculateDetailedCBFMatch(youth, program);
  if (breakdown.excluded) {
    return 0;
  }
  return breakdown.finalScore;
}

/**
 * Ranks all TESDA programs for a youth, applying the Skill Relevance Gate
 * and sorting passing programs descending by finalScore.
 */
export function rankProgramsForYouth(
  youth: YouthProfile,
  programs: TESDAProgram[]
): { program: TESDAProgram; breakdown: CBFScoreBreakdown }[] {
  if (!Array.isArray(programs)) return [];

  return programs
    .map(program => ({
      program,
      breakdown: calculateDetailedCBFMatch(youth, program)
    }))
    .filter(item => item.breakdown.passedSkillGate)
    .sort((a, b) => b.breakdown.finalScore - a.breakdown.finalScore);
}

/**
 * Generates personalized skill suggestions from the 10 categories matching
 * the youth's primary goal, preferences, and experiences.
 */
export function getSuggestedSkillsForYouth(
  youth: YouthProfile,
  programs: TESDAProgram[] = []
): { skill: string; tag: string; isHighMatch: boolean }[] {
  const { skills, preferences, experiences, goal } = resolveYouthNormalizedData(youth);
  const existingValues = new Set(skills.map(s => (s.value || s.raw).toLowerCase().trim()));

  const targetCategoryIds = new Set<string>();
  if (goal && !goal.isUnresolved && goal.categoryId) targetCategoryIds.add(goal.categoryId);
  preferences.forEach(p => { if (!p.isUnresolved && p.categoryId) targetCategoryIds.add(p.categoryId); });
  experiences.forEach(e => { if (!e.isUnresolved && e.categoryId) targetCategoryIds.add(e.categoryId); });

  const suggestions: { skill: string; tag: string; isHighMatch: boolean }[] = [];
  const added = new Set<string>();

  const categoryPopularSkills: Record<string, string[]> = {
    "1": ["Computer Programming", "Web Design & Frontend", "Microsoft Excel & Data Entry", "Computer Systems Servicing", "Graphic Design"],
    "2": ["Commercial Cooking", "Bread & Pastry Production", "Culinary Arts", "Food Safety & Preparation"],
    "3": ["Motorcycle Engine Repair", "Automotive Servicing", "Defensive Driving", "Small Engine Troubleshooting"],
    "4": ["Shielded Metal Arc Welding (SMAW)", "TIG/MIG Welding", "Metal Fabrication & Pipefitting"],
    "5": ["Electrical Installation & Maintenance", "Residential Building Wiring", "Mobile Phone Repair"],
    "6": ["Carpentry & Woodworking", "Plumbing & Pipe Installation", "Masonry & Tile Setting"],
    "7": ["Housekeeping Operations", "Barista & Beverage Crafting", "Food & Beverage Service"],
    "8": ["Organic Agriculture Production", "Hydroponics & Urban Farming", "Poultry & Livestock Raising"],
    "9": ["Hairdressing & Styling", "Nail Care Services", "Hilot Wellness Massage Therapy"],
    "10": ["Dressmaking & Tailoring", "Garments Pattern Making", "Fashion Design"]
  };

  // 1. Target categories matching youth preferences/goal
  targetCategoryIds.forEach(catId => {
    const list = categoryPopularSkills[catId] || [];
    list.forEach(skillName => {
      const sLower = skillName.toLowerCase();
      if (!existingValues.has(sLower) && !added.has(sLower)) {
        added.add(sLower);
        suggestions.push({
          skill: skillName,
          tag: "Recommended for You",
          isHighMatch: true
        });
      }
    });
  });

  // 2. Fallbacks
  const generalFallbacks = [
    "Computer Programming",
    "Commercial Cooking",
    "Electrical Installation",
    "SMAW Welding",
    "Motorcycle Repair"
  ];
  generalFallbacks.forEach(skillName => {
    const sLower = skillName.toLowerCase();
    if (!existingValues.has(sLower) && !added.has(sLower)) {
      added.add(sLower);
      suggestions.push({
        skill: skillName,
        tag: "Popular Skill",
        isHighMatch: false
      });
    }
  });

  return suggestions.slice(0, 10);
}

/**
 * Formats ISO/database time strings into human-readable 12-hour format
 */
export function formatProgramTime(t?: string | null): string {
  if (!t) return "";
  if (t.includes("T")) {
    const timePart = t.split("T")[1]?.replace("Z", "");
    if (timePart) {
      const [hStr, mStr] = timePart.split(":");
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr || "0", 10);
      if (!isNaN(h)) {
        const period = h >= 12 ? "PM" : "AM";
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const displayM = m < 10 ? `0${m}` : `${m}`;
        return `${displayH}:${displayM} ${period}`;
      }
    }
  }
  if (t.includes(":")) {
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (!isNaN(h)) {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : `${m}`;
      return `${displayH}:${displayM} ${period}`;
    }
  }
  return t;
}
