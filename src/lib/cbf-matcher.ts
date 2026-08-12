import { YouthProfile, TESDAProgram } from "../types";

/**
 * Calculates Jaccard Similarity between two string sets
 */
function jaccardSimilarity(setA: string[], setB: string[]): number {
  if (!setA.length || !setB.length) return 0;
  const aLower = setA.map(s => s.toLowerCase().trim());
  const bLower = setB.map(s => s.toLowerCase().trim());
  
  const intersection = aLower.filter(x => bLower.some(y => y.includes(x) || x.includes(y)));
  const union = new Set([...aLower, ...bLower]);
  
  return intersection.length / union.size;
}

/**
 * Content-Based Filtering Recommendation Algorithm
 * Calculates a match score (0 to 100%) between a Youth Profile and a TESDA Program
 */
export function calculateContentBasedMatchScore(
  youth: YouthProfile,
  program: TESDAProgram
): number {
  // 1. Skill Similarity Score (Weight: 45%)
  const programSkillKeywords = [
    ...(program.requiredSkills || []),
    ...program.title.split(" "),
    program.type
  ];
  const skillSim = jaccardSimilarity(youth.skills, programSkillKeywords);
  const skillScore = Math.min(100, Math.round(skillSim * 180 + (youth.skills.length > 0 ? 30 : 0)));

  // 2. Interest Alignment (Weight: 25%)
  let interestScore = 50;
  if (youth.interests && youth.interests.length > 0) {
    const matchesInterest = youth.interests.some(interest => {
      if (interest.includes("Vocational") || interest.includes("Training")) return program.type === "Training";
      if (interest.includes("Employment")) return program.type === "Employment";
      if (interest.includes("Entrepreneurship")) return program.type === "Entrepreneurship";
      return false;
    });
    interestScore = matchesInterest ? 95 : 40;
  }

  // 3. Sector Preference Match (Weight: 20%)
  let sectorScore = 40;
  if (youth.sectorPreference) {
    const sectorLower = youth.sectorPreference.toLowerCase();
    const titleLower = program.title.toLowerCase();
    const providerLower = program.provider.toLowerCase();
    
    if (titleLower.includes(sectorLower) || providerLower.includes(sectorLower)) {
      sectorScore = 100;
    } else if (
      (sectorLower.includes("metal") || sectorLower.includes("construction")) && (titleLower.includes("weld") || titleLower.includes("carpentry") || titleLower.includes("electric")) ||
      (sectorLower.includes("food") || sectorLower.includes("tourism")) && (titleLower.includes("cook") || titleLower.includes("bak") || titleLower.includes("food")) ||
      (sectorLower.includes("it") || sectorLower.includes("business")) && (titleLower.includes("comput") || titleLower.includes("web") || titleLower.includes("excel") || titleLower.includes("bookkeeping"))
    ) {
      sectorScore = 90;
    }
  }

  // 4. Educational Eligibility Match (Weight: 10%)
  let eduScore = 75;
  const edu = (youth.educationalAttainment || "").toLowerCase();
  const elig = (program.eligibility || "").toLowerCase();
  if (elig.includes("open to all") || elig.includes("at least 15")) {
    eduScore = 100;
  } else if (elig.includes("shs") || elig.includes("high school")) {
    if (edu.includes("shs") || edu.includes("hs graduate") || edu.includes("college")) {
      eduScore = 100;
    } else {
      eduScore = 60;
    }
  }

  // Weighted sum formula
  const finalScore = Math.round(
    skillScore * 0.45 +
    interestScore * 0.25 +
    sectorScore * 0.20 +
    eduScore * 0.10
  );

  return Math.min(99, Math.max(35, finalScore));
}
