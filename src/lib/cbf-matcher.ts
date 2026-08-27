import { YouthProfile, TESDAProgram } from "../types";

/**
 * Comprehensive TVET Sector Taxonomy Mapping
 * Maps industry sectors to keyword stems, skill variations, and competencies
 */
const TVET_SECTOR_TAXONOMY: Record<string, string[]> = {
  "Metals & Engineering": [
    "weld", "smaw", "gmaw", "gtaw", "mig", "tig", "machin", "fabricat",
    "lathe", "pipe", "metal", "sheet", "iron", "steel", "cut", "grind", "fit", "solder"
  ],
  "Construction & Building Services": [
    "carpent", "mason", "electr", "plumb", "draft", "piping", "paint",
    "tile", "scaffold", "concret", "rebar", "wir", "solar", "hvch", "aircon", "refrigerat"
  ],
  "Tourism, Food & Hospitality": [
    "cook", "bak", "pastri", "food", "kitchen", "barista", "beverag",
    "housekeep", "waiter", "bartend", "culinari", "cater", "restaur", "hotel", "dish", "chef"
  ],
  "Information Technology & Digital": [
    "comput", "web", "design", "graphic", "code", "program", "excel",
    "data", "softwar", "network", "media", "photograph", "video", "typ", "offic", "system", "encod"
  ],
  "Automotive & Land Transport": [
    "auto", "engin", "mechan", "motor", "brake", "vehicl", "driv", "drivin",
    "diesel", "transmission", "troubleshoot", "tire", "align", "tune"
  ],
  "Health, Social & Care Services": [
    "care", "nurs", "elder", "first aid", "health", "therap", "physio",
    "patient", "babysit", "disabl", "sanitat", "hygien", "assist"
  ],
  "Beauty, Wellness & Personal Care": [
    "hair", "makeup", "nail", "salon", "spa", "cosmet", "wellness",
    "massage", "therapi", "skincare", "barber", "aesthetic"
  ],
  "Agriculture, Fishery & Forestry": [
    "farm", "crop", "poult", "livestock", "fish", "organ", "plant",
    "garden", "soil", "harvest", "fertiliz", "horticultur", "agri"
  ],
  "Garments, Textiles & Fashion": [
    "sew", "tailor", "dress", "textil", "fabric", "pattern", "embroider",
    "garment", "fashion", "alter", "needle"
  ],
  "Business, Finance & Sales": [
    "bookkeep", "account", "sal", "market", "store", "cashier", "inventory",
    "entrepreneur", "retail", "customer", "admin", "e-com", "manag"
  ]
};

/**
 * Tagalog / English & Colloquial Vocational Synonym Alias Dictionaries
 */
const SYNONYM_ALIAS_MAP: Record<string, string[]> = {
  "pagluluto": ["cooking", "cookery", "food prep", "culinary", "kitchen"],
  "pagtahi": ["sewing", "tailoring", "dressmaking", "garment"],
  "pag-welding": ["welding", "smaw", "metalwork", "fabrication"],
  "pagmamaneho": ["driving", "automotive", "transportation"],
  "kuryente": ["electrical", "wiring", "electrician"],
  "pag-aayos ng motor": ["motorcycle", "engine repair", "mechanic"],
  "pag-aalaga": ["caregiving", "nursing", "elderly care"],
  "pagtatanim": ["farming", "agriculture", "crop production"],
  "pag-aayos ng cellphone": ["electronics", "mobile repair", "servicing"],
  "pag-aayos ng kompyuter": ["computer repair", "it support", "hardware"],
  "pag-picture": ["photography", "digital media", "video editing"],
  "encoding": ["data entry", "ms office", "typing", "computer"],
  "selling": ["sales", "retail", "customer service", "e-commerce"],
  "baking": ["pastry", "bread", "food prep"],
  "mechanic": ["automotive", "engine repair", "troubleshooting"]
};

/**
 * Levenshtein Edit Distance for Fuzzy Typo & Spelling Variation Recognition
 */
function levenshteinSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;
  
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  const maxLength = Math.max(a.length, b.length);
  return 1.0 - matrix[b.length][a.length] / maxLength;
}

/**
 * Normalizes a word into a clean root stem for fuzzy token comparison
 */
function toStemToken(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5); // Take 5-char stem prefix
}

/**
 * Splits compound or multi-word user skill inputs into individual sub-skills
 * e.g., "Welding, Driving and Coding" -> ["welding", "driving", "coding"]
 */
function extractSubSkills(skillsArray: string[]): string[] {
  const result: string[] = [];
  skillsArray.forEach(skill => {
    if (!skill) return;
    const parts = skill.split(/[,;&/]|\band\b/gi).map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      result.push(...parts);
    } else {
      result.push(skill.trim());
    }
  });
  return Array.from(new Set(result));
}

/**
 * Enhanced Content-Based Filtering Recommendation Algorithm
 * Dynamically recognizes custom youth skills & competencies and recalculates match score (35% to 99%)
 */
export function calculateContentBasedMatchScore(
  youth: YouthProfile,
  program: TESDAProgram
): number {
  const rawSkills = youth.skills || [];
  const parsedYouthSkills = extractSubSkills(rawSkills);
  const programRequiredSkills = program.requiredSkills || [];

  // Extract normalized token stems from Program details
  const programTokens = new Set<string>([
    ...program.title.toLowerCase().split(/\s+/).map(toStemToken).filter(Boolean),
    ...programRequiredSkills.flatMap(s => s.toLowerCase().split(/\s+/).map(toStemToken)).filter(Boolean),
    toStemToken(program.type || "")
  ]);

  const programWords = new Set<string>([
    ...program.title.toLowerCase().split(/\s+/).filter(w => w.length >= 3),
    ...programRequiredSkills.flatMap(s => s.toLowerCase().split(/\s+/)).filter(w => w.length >= 3)
  ]);

  let directMatchCount = 0;
  let taxonomyMatchCount = 0;
  let fuzzyMatchCount = 0;

  // 1. Dynamic Skill & Competency Alignment
  parsedYouthSkills.forEach(skill => {
    const sLower = skill.toLowerCase().trim();
    if (!sLower) return;

    // Check Tagalog / Synonym aliases
    const aliases = SYNONYM_ALIAS_MAP[sLower] || [sLower];
    
    let matchedForSkill = false;

    // Check direct token overlap & alias overlap
    for (const alias of aliases) {
      const skillTokens = alias.split(/\s+/).map(toStemToken).filter(Boolean);

      const hasDirectOverlap = skillTokens.some(st => 
        programTokens.has(st) || Array.from(programTokens).some(pt => pt.includes(st) || st.includes(pt))
      );

      if (hasDirectOverlap) {
        directMatchCount += 1;
        matchedForSkill = true;
        break;
      }
    }

    // Fuzzy Levenshtein edit distance check (handles typos e.g. "computor" vs "computer")
    if (!matchedForSkill) {
      for (const alias of aliases) {
        const words = alias.split(/\s+/).filter(w => w.length >= 3);
        for (const w of words) {
          for (const pw of Array.from(programWords)) {
            if (levenshteinSimilarity(w, pw) >= 0.72) {
              fuzzyMatchCount += 0.8;
              matchedForSkill = true;
              break;
            }
          }
          if (matchedForSkill) break;
        }
        if (matchedForSkill) break;
      }
    }

    // TVET Sector Taxonomy overlap check
    if (!matchedForSkill) {
      for (const alias of aliases) {
        const skillTokens = alias.split(/\s+/).map(toStemToken).filter(Boolean);
        for (const stems of Object.values(TVET_SECTOR_TAXONOMY)) {
          const matchesSkill = skillTokens.some(st => stems.some(k => k.startsWith(st) || st.startsWith(k)));
          const matchesProg = Array.from(programTokens).some(pt => stems.some(k => k.startsWith(pt) || pt.startsWith(k)));
          
          if (matchesSkill && matchesProg) {
            taxonomyMatchCount += 1;
            matchedForSkill = true;
            break;
          }
        }
        if (matchedForSkill) break;
      }
    }
  });

  // Calculate dynamic skill score: Base score + direct bonuses + fuzzy bonuses + taxonomic bonuses
  const baseSkillScore = parsedYouthSkills.length > 0 ? 35 : 15;
  const directBonus = directMatchCount * 30;      // +30% per direct match
  const fuzzyBonus = Math.round(fuzzyMatchCount * 22); // +22% per fuzzy typo match
  const taxonomyBonus = taxonomyMatchCount * 18;  // +18% per domain-related skill match
  const generalSkillCountBonus = Math.min(15, parsedYouthSkills.length * 3); // Small boost for profile completeness

  const skillScore = Math.min(100, Math.round(baseSkillScore + directBonus + fuzzyBonus + taxonomyBonus + generalSkillCountBonus));

  // 2. Dynamic Sector Preference Match (Weight: 25%)
  let sectorScore = 40;
  if (youth.sectorPreference) {
    const sectorPrefLower = youth.sectorPreference.toLowerCase();
    const titleLower = program.title.toLowerCase();
    const providerLower = program.provider.toLowerCase();

    if (titleLower.includes(sectorPrefLower) || providerLower.includes(sectorPrefLower)) {
      sectorScore = 100;
    } else {
      // Taxonomic sector preference matching
      for (const [sectorName, keywords] of Object.entries(TVET_SECTOR_TAXONOMY)) {
        const prefMatchesSector = sectorPrefLower.includes(sectorName.toLowerCase()) || keywords.some(k => sectorPrefLower.includes(k));
        const progMatchesSector = keywords.some(k => titleLower.includes(k) || providerLower.includes(k));

        if (prefMatchesSector && progMatchesSector) {
          sectorScore = 90;
          break;
        }
      }
    }
  }

  // 3. Interest Alignment (Weight: 15%)
  let interestScore = 50;
  if (youth.interests && youth.interests.length > 0) {
    const matchesInterest = youth.interests.some(interest => {
      if (interest.includes("Vocational") || interest.includes("Training")) return program.type === "Training";
      if (interest.includes("Employment")) return program.type === "Employment";
      if (interest.includes("Entrepreneurship")) return program.type === "Entrepreneurship";
      return false;
    });
    interestScore = matchesInterest ? 95 : 45;
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

  // Weighted Sum Calculation:
  // Skills Alignment: 50%
  // Sector Preference: 25%
  // Interest Alignment: 15%
  // Educational Eligibility: 10%
  const finalScore = Math.round(
    skillScore * 0.50 +
    sectorScore * 0.25 +
    interestScore * 0.15 +
    eduScore * 0.10
  );

  return Math.min(99, Math.max(35, finalScore));
}

/**
 * Dynamically generates personalized vocational skill suggestions for a Youth Member
 * based on their sectorPreference, livelihoodGoal, interests, and active TESDA programs.
 */
export function getSuggestedSkillsForYouth(
  youth: YouthProfile,
  programs: TESDAProgram[]
): { skill: string; tag: string; isHighMatch: boolean }[] {
  const existingSkills = new Set((youth.skills || []).map(s => s.toLowerCase().trim()));
  const suggestions: { skill: string; tag: string; isHighMatch: boolean }[] = [];
  const addedSkillsLower = new Set<string>();

  const sectorPref = (youth.sectorPreference || "").toLowerCase();
  const goal = (youth.livelihoodGoal || "").toLowerCase();

  // Helper to split and clean long concatenated skill strings into concise skill names
  const sanitizeSkillString = (raw: string): string[] => {
    if (!raw || typeof raw !== "string") return [];
    const trimmed = raw.trim();
    if (trimmed.length === 0) return [];

    if (trimmed.length > 35) {
      // Split concatenated phrases like "Basic communication skills Basic computer literacy..."
      const parts = trimmed
        .split(/(?=\b(?:Basic|Ability|Knowledge|Computer|Customer|Food|Electrical|Safety)\b)|[,;.\n]/g)
        .map(s => s.trim().replace(/^[-*•\s]+/, ""))
        .filter(s => s.length >= 3 && s.length <= 35);
      
      if (parts.length > 0) return Array.from(new Set(parts));
      return [trimmed.slice(0, 32) + "..."];
    }

    return [trimmed];
  };

  // 1. First, add sector-specific skills from TVET taxonomy based on youth's sectorPreference or goal
  for (const [sectorName, keywords] of Object.entries(TVET_SECTOR_TAXONOMY)) {
    const matchesPref = sectorPref && (sectorPref.includes(sectorName.toLowerCase()) || keywords.some(k => sectorPref.includes(k)));
    const matchesGoal = goal && keywords.some(k => goal.includes(k));

    if (matchesPref || matchesGoal) {
      const sectorSkillsMap: Record<string, string[]> = {
        "Metals & Engineering": ["SMAW Shielded Metal Arc Welding", "Metal Fitting & Cutting", "TIG/MIG Welding Essentials", "Blueprint Reading"],
        "Construction & Building Services": ["Electrical Wiring & Installation", "Plumbing & Pipefitting", "Carpentry & Framing", "Masonry & Tiling"],
        "Tourism, Food & Hospitality": ["Bread & Pastry Baking", "Commercial Cookery & Food Prep", "Barista & Beverage Crafting", "Food Safety & Sanitation"],
        "Information Technology & Digital": ["Computer Office & MS Excel", "Basic Graphic Design & Canva", "Social Media Marketing", "Data Entry & Bookkeeping"],
        "Automotive & Land Transport": ["Small Engine Troubleshooting", "Automotive Electrical Servicing", "Motorcycle Engine Tuning", "Defensive Driving"],
        "Health, Social & Care Services": ["Elderly Caregiving Essentials", "First Aid & Basic Life Support", "Patient Care Assisting", "Sanitation Protocols"],
        "Beauty, Wellness & Personal Care": ["Hairdressing & Hair Care", "Nail Care & Manicure/Pedicure", "Basic Facial & Skincare", "Body Massage Therapy"],
        "Agriculture, Fishery & Forestry": ["Organic Crop Production", "Hydroponics & Urban Farming", "Poultry Raising & Care", "Aquaculture Management"],
        "Garments, Textiles & Fashion": ["Garment Sewing & Tailoring", "Pattern Making & Alteration", "Textile Maintenance", "Fashion Design Basics"],
        "Business, Finance & Sales": ["Bookkeeping & Basic Accounting", "Store Inventory & Cashiering", "Customer Relations Management", "E-commerce Selling"]
      };

      const recommended = sectorSkillsMap[sectorName] || [];
      recommended.forEach(skill => {
        const sLower = skill.toLowerCase().trim();
        if (!existingSkills.has(sLower) && !addedSkillsLower.has(sLower)) {
          addedSkillsLower.add(sLower);
          suggestions.push({
            skill,
            tag: "Recommended for You",
            isHighMatch: true
          });
        }
      });
    }
  }

  // 2. Next, extract and sanitize skills from active TESDA programs matching the youth's sector
  programs.forEach(prog => {
    const isSectorMatch = sectorPref && (prog.title.toLowerCase().includes(sectorPref) || prog.provider.toLowerCase().includes(sectorPref));
    const reqSkills = prog.requiredSkills || [];

    reqSkills.forEach(rawSkill => {
      const cleanSkills = sanitizeSkillString(rawSkill);
      cleanSkills.forEach(skill => {
        const sLower = skill.toLowerCase().trim();
        if (!existingSkills.has(sLower) && !addedSkillsLower.has(sLower)) {
          addedSkillsLower.add(sLower);
          suggestions.push({
            skill,
            tag: isSectorMatch ? "Program Match" : "Active Course",
            isHighMatch: isSectorMatch
          });
        }
      });
    });
  });

  // 3. Fallback popular skills if suggestions are under 6
  const fallbackPopular = [
    { skill: "Basic Computer Typing & MS Office", tag: "Popular" },
    { skill: "Customer Service & Communications", tag: "Popular" },
    { skill: "Food Sanitation & Preparation", tag: "Popular" },
    { skill: "Electrical Installation & Safety", tag: "Popular" },
    { skill: "Small Business & Entrepreneurship", tag: "Popular" }
  ];

  fallbackPopular.forEach(item => {
    const sLower = item.skill.toLowerCase().trim();
    if (!existingSkills.has(sLower) && !addedSkillsLower.has(sLower)) {
      addedSkillsLower.add(sLower);
      suggestions.push({
        skill: item.skill,
        tag: item.tag,
        isHighMatch: false
      });
    }
  });

  return suggestions.slice(0, 10);
}
