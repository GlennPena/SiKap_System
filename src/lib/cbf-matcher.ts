import { YouthProfile, TESDAProgram } from "../types";

/**
 * Common non-domain TVET and conversational stopwords
 * These words must NOT trigger domain skill matches between unrelated fields (e.g., "Basic" should not match "Basic welding" to "Basic computer")
 */
const STOP_WORDS = new Set([
  "basic", "level", "skills", "skill", "training", "knowledge", "nc", "ii", "i", "iii", "iv", "v",
  "and", "of", "the", "to", "for", "with", "at", "in", "on", "by", "an", "a", "or", "is",
  "course", "program", "servicing", "operation", "operations", "work", "standard",
  "competency", "competencies", "certificate", "national", "qualification", "able", "can",
  "perform", "general", "practical", "overview", "introduction", "intro", "oriented",
  "holder", "practitioner", "assistant", "associate", "worker", "entry"
]);

/**
 * Comprehensive TVET Sector Taxonomy Mapping
 * Maps industry sectors to keyword stems, skill variations, and aliases
 */
export const TVET_SECTOR_TAXONOMY: Record<string, { aliases: string[]; keywords: string[] }> = {
  "Information Technology & Digital": {
    aliases: [
      "information technology", "it", "ict", "it & technology", "computer", "computing",
      "digital", "software", "tech", "web", "data", "cyber", "hardware", "network",
      "programming", "coding", "systems", "information and communication", "it & digital"
    ],
    keywords: [
      "comput", "pc", "laptop", "softwar", "hardwar", "network", "system", "program",
      "code", "codin", "web", "design", "graphic", "excel", "data", "encod", "typing",
      "media", "cyber", "tech", "digit", "server", "troubleshoot", "app", "offic",
      "database", "frontend", "backend", "developer", "technician", "it", "ict", "css"
    ]
  },
  "Metals & Engineering": {
    aliases: [
      "metals & engineering", "metals", "metal", "welding", "smaw", "gmaw", "gtaw",
      "mig", "tig", "machining", "fabrication", "iron", "steel", "pipefitting"
    ],
    keywords: [
      "weld", "weldi", "smaw", "gmaw", "gtaw", "mig", "tig", "machin", "fabricat",
      "lathe", "pipe", "metal", "sheet", "iron", "steel", "cut", "grind", "fit",
      "solder", "flux", "electrode", "joint", "arc", "torch", "shielded"
    ]
  },
  "Construction & Building Services": {
    aliases: [
      "construction & building services", "construction", "building", "electrical",
      "plumbing", "carpentry", "masonry", "wiring", "refrigeration", "aircon", "hvac"
    ],
    keywords: [
      "carpent", "mason", "electr", "plumb", "draft", "piping", "paint",
      "tile", "scaffold", "concret", "rebar", "wir", "solar", "hvch", "aircon",
      "refrigerat", "rac", "breaker", "structure", "panel"
    ]
  },
  "Tourism, Food & Hospitality": {
    aliases: [
      "tourism, food & hospitality", "tourism", "food", "hospitality", "cookery",
      "culinary", "baking", "pastry", "kitchen", "hotel", "restaurant", "barista", "f&b"
    ],
    keywords: [
      "cook", "cooki", "cooker", "bak", "bakin", "pastri", "food", "kitchen",
      "barista", "beverag", "housekeep", "waiter", "bartend", "culinari", "cater",
      "restaur", "hotel", "dish", "chef", "dining", "cocktail", "espresso"
    ]
  },
  "Automotive & Land Transport": {
    aliases: [
      "automotive & land transport", "automotive", "transport", "driving",
      "mechanic", "motorcycle", "vehicle", "diesel"
    ],
    keywords: [
      "auto", "engin", "mechan", "motor", "brake", "vehicl", "driv", "drivin",
      "diesel", "transmission", "troubleshoot", "tire", "align", "tune", "motorcycle",
      "chassis", "clutch", "suspension"
    ]
  },
  "Health, Social & Care Services": {
    aliases: [
      "health, social & care services", "health", "caregiving", "nursing",
      "elderly care", "caregiver", "social work", "patient care"
    ],
    keywords: [
      "care", "caregiv", "nurs", "elder", "first aid", "health", "therap", "physio",
      "patient", "babysit", "disabl", "sanitat", "hygien", "assist", "clinic", "hospital"
    ]
  },
  "Beauty, Wellness & Personal Care": {
    aliases: [
      "beauty, wellness & personal care", "beauty", "wellness", "personal care",
      "hairdressing", "cosmetology", "nail care", "spa", "massage", "barber"
    ],
    keywords: [
      "hair", "makeup", "nail", "salon", "spa", "cosmet", "wellness",
      "massage", "therapi", "skincare", "barber", "aesthetic", "manicur", "pedicur", "facial"
    ]
  },
  "Agriculture, Fishery & Forestry": {
    aliases: [
      "agriculture, fishery & forestry", "agriculture", "farming", "crop",
      "fishery", "livestock", "poultry", "forestry", "aquaculture", "agri"
    ],
    keywords: [
      "farm", "crop", "poult", "livestock", "fish", "organ", "plant",
      "garden", "soil", "harvest", "fertiliz", "horticultur", "agri", "aquacultur", "animal"
    ]
  },
  "Garments, Textiles & Fashion": {
    aliases: [
      "garments, textiles & fashion", "garments", "textiles", "fashion",
      "dressmaking", "tailoring", "sewing", "sew", "apparel"
    ],
    keywords: [
      "sew", "tailor", "dress", "textil", "fabric", "pattern", "embroider",
      "garment", "fashion", "alter", "needle", "stitch", "cloth"
    ]
  },
  "Business, Finance & Sales": {
    aliases: [
      "business, finance & sales", "business", "finance", "sales", "bookkeeping",
      "accounting", "e-commerce", "retail", "entrepreneurship", "management"
    ],
    keywords: [
      "bookkeep", "account", "sal", "market", "store", "cashier", "inventory",
      "entrepreneur", "retail", "customer", "admin", "e-com", "manag", "ledger", "selling"
    ]
  }
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
  "pag-aayos ng kompyuter": ["computer repair", "it support", "hardware", "computer systems"],
  "pag-picture": ["photography", "digital media", "video editing"],
  "encoding": ["data entry", "ms office", "typing", "computer", "information technology"],
  "selling": ["sales", "retail", "customer service", "e-commerce"],
  "baking": ["pastry", "bread", "food prep"],
  "mechanic": ["automotive", "engine repair", "troubleshooting"],
  "professional it": ["information technology", "computer systems", "software", "network", "it support"]
};

/**
 * Levenshtein Edit Distance for Fuzzy Typo & Spelling Variation Recognition
 */
export function levenshteinSimilarity(a: string, b: string): number {
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
export function toStemToken(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 6);
}

/**
 * Cleans string, strips stopwords, and extracts meaningful tokens
 */
export function cleanAndTokenize(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

/**
 * Splits compound or multi-word user skill inputs into individual sub-skills
 * e.g., "Welding, Driving and Coding" -> ["welding", "driving", "coding"]
 */
export function extractSubSkills(skillsArray: string[]): string[] {
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
 * Identifies TVET sectors corresponding to any given text phrase
 */
export function identifySectors(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const tokens = cleanAndTokenize(text).map(toStemToken);
  const matchedSectors: string[] = [];

  for (const [sectorName, config] of Object.entries(TVET_SECTOR_TAXONOMY)) {
    const aliasMatch = config.aliases.some(alias => lower.includes(alias) || alias.includes(lower));
    const keywordMatch = config.keywords.some(kw => tokens.some(t => t.startsWith(kw) || kw.startsWith(t)));
    if (aliasMatch || keywordMatch) {
      matchedSectors.push(sectorName);
    }
  }

  return Array.from(new Set(matchedSectors));
}

/**
 * Enhanced Content-Based Filtering Recommendation Algorithm
 * Accurately aligns Youth competencies, TVET sector preference, livelihood goals, and interests with TESDA programs.
 * Returns percentage score (15% to 99%)
 */
export function calculateContentBasedMatchScore(
  youth: YouthProfile,
  program: TESDAProgram
): number {
  const rawSkills = youth.skills || [];
  const parsedYouthSkills = extractSubSkills(rawSkills);
  const programRequiredSkills = program.requiredSkills || [];

  const programText = `${program.title} ${programRequiredSkills.join(" ")} ${program.provider || ""}`;
  const programSectors = identifySectors(programText);
  const programMeaningfulWords = cleanAndTokenize(programText);
  const programTokens = new Set(programMeaningfulWords.map(toStemToken));

  // 1. Skill Alignment Score (Weight: 40%)
  let skillScore = 15;
  let matchingSkillsCount = 0;

  parsedYouthSkills.forEach(skill => {
    const sLower = skill.toLowerCase().trim();
    if (!sLower) return;

    const aliases = SYNONYM_ALIAS_MAP[sLower] || [sLower];
    const skillWords = cleanAndTokenize(aliases.join(" "));
    const skillTokens = skillWords.map(toStemToken);
    const skillSectors = identifySectors(aliases.join(" "));

    const hasDirectTokenOverlap = skillTokens.some(st => 
      programTokens.has(st) || Array.from(programTokens).some(pt => pt.startsWith(st) || st.startsWith(pt))
    );

    const hasSectorOverlap = skillSectors.some(ss => programSectors.includes(ss));

    if (hasDirectTokenOverlap) {
      matchingSkillsCount += 1.0;
    } else if (hasSectorOverlap) {
      matchingSkillsCount += 0.7;
    }
  });

  if (parsedYouthSkills.length > 0) {
    if (matchingSkillsCount > 0) {
      skillScore = Math.min(100, Math.round(55 + matchingSkillsCount * 22));
    } else {
      // Skills listed but NONE match this program domain
      skillScore = 10;
    }
  }

  // 2. Sector Preference Match (Weight: 25%)
  let sectorScore = 30;
  const youthSector = youth.sectorPreference || "";
  if (youthSector) {
    const youthSectors = identifySectors(youthSector);
    const hasOverlap = youthSectors.some(ys => programSectors.includes(ys));
    if (hasOverlap) {
      sectorScore = 100;
    } else if (programSectors.length > 0) {
      // Youth explicitly chose a different sector from this program
      sectorScore = 15;
    }
  }

  // 3. Livelihood & Career Goal Alignment (Weight: 20%)
  let goalScore = 35;
  const livelihoodGoal = youth.livelihoodGoal || "";
  if (livelihoodGoal) {
    const goalAliases = SYNONYM_ALIAS_MAP[livelihoodGoal.toLowerCase().trim()] || [livelihoodGoal];
    const goalText = goalAliases.join(" ");
    const goalSectors = identifySectors(goalText);
    const goalTokens = cleanAndTokenize(goalText).map(toStemToken);

    const hasDirectGoalToken = goalTokens.some(gt => 
      programTokens.has(gt) || Array.from(programTokens).some(pt => pt.startsWith(gt) || gt.startsWith(pt))
    );
    const hasGoalSector = goalSectors.some(gs => programSectors.includes(gs));

    if (hasDirectGoalToken) {
      goalScore = 100;
    } else if (hasGoalSector) {
      goalScore = 90;
    } else if (programSectors.length > 0) {
      goalScore = 15;
    }
  }

  // 4. Interest Alignment (Weight: 10%)
  let interestScore = 40;
  const interests = youth.interests || [];
  if (interests.length > 0) {
    const interestText = interests.join(" ");
    const interestSectors = identifySectors(interestText);
    const hasSectorInterest = interestSectors.some(is => programSectors.includes(is));
    const hasTypeInterest = interests.some((i: string) => {
      const iLower = i.toLowerCase();
      if (iLower.includes("training") || iLower.includes("vocational")) return program.type === "Training";
      if (iLower.includes("employment")) return program.type === "Employment";
      if (iLower.includes("entrepreneurship")) return program.type === "Entrepreneurship";
      return false;
    });

    if (hasSectorInterest && hasTypeInterest) {
      interestScore = 100;
    } else if (hasSectorInterest || hasTypeInterest) {
      interestScore = 80;
    } else {
      interestScore = 35;
    }
  }

  // 5. Educational Eligibility (Weight: 5%)
  let eduScore = 80;
  const edu = (youth.educationalAttainment || "").toLowerCase();
  const elig = (program.eligibility || "").toLowerCase();
  if (elig.includes("open to all") || elig.includes("at least 15") || elig.includes("at least 18")) {
    eduScore = 100;
  } else if (elig.includes("shs") || elig.includes("high school")) {
    if (edu.includes("shs") || edu.includes("hs graduate") || edu.includes("college") || edu.includes("vocational")) {
      eduScore = 100;
    } else {
      eduScore = 50;
    }
  }

  const finalScore = Math.round(
    skillScore * 0.40 +
    sectorScore * 0.25 +
    goalScore * 0.20 +
    interestScore * 0.10 +
    eduScore * 0.05
  );

  return Math.min(99, Math.max(15, finalScore));
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

  const youthProfileText = `${youth.sectorPreference || ""} ${youth.livelihoodGoal || ""} ${(youth.interests || []).join(" ")}`;
  const youthTargetSectors = identifySectors(youthProfileText);

  // Helper to split and clean long concatenated skill strings into concise skill names
  const sanitizeSkillString = (raw: string): string[] => {
    if (!raw || typeof raw !== "string") return [];
    const trimmed = raw.trim();
    if (trimmed.length === 0) return [];

    if (trimmed.length > 35) {
      const parts = trimmed
        .split(/(?=\b(?:Basic|Ability|Knowledge|Computer|Customer|Food|Electrical|Safety)\b)|[,;.\n]/g)
        .map(s => s.trim().replace(/^[-*•\s]+/, ""))
        .filter(s => s.length >= 3 && s.length <= 35);
      
      if (parts.length > 0) return Array.from(new Set(parts));
      return [trimmed.slice(0, 32) + "..."];
    }

    return [trimmed];
  };

  const sectorSkillsMap: Record<string, string[]> = {
    "Metals & Engineering": ["SMAW Shielded Metal Arc Welding", "Metal Fitting & Cutting", "TIG/MIG Welding Essentials", "Blueprint Reading"],
    "Construction & Building Services": ["Electrical Wiring & Installation", "Plumbing & Pipefitting", "Carpentry & Framing", "Masonry & Tiling"],
    "Tourism, Food & Hospitality": ["Bread & Pastry Baking", "Commercial Cookery & Food Prep", "Barista & Beverage Crafting", "Food Safety & Sanitation"],
    "Information Technology & Digital": ["Computer Office & MS Excel", "Basic Graphic Design & Canva", "Computer Systems Troubleshooting", "Data Entry & Bookkeeping", "Network Setup & Maintenance"],
    "Automotive & Land Transport": ["Small Engine Troubleshooting", "Automotive Electrical Servicing", "Motorcycle Engine Tuning", "Defensive Driving"],
    "Health, Social & Care Services": ["Elderly Caregiving Essentials", "First Aid & Basic Life Support", "Patient Care Assisting", "Sanitation Protocols"],
    "Beauty, Wellness & Personal Care": ["Hairdressing & Hair Care", "Nail Care & Manicure/Pedicure", "Basic Facial & Skincare", "Body Massage Therapy"],
    "Agriculture, Fishery & Forestry": ["Organic Crop Production", "Hydroponics & Urban Farming", "Poultry Raising & Care", "Aquaculture Management"],
    "Garments, Textiles & Fashion": ["Garment Sewing & Tailoring", "Pattern Making & Alteration", "Textile Maintenance", "Fashion Design Basics"],
    "Business, Finance & Sales": ["Bookkeeping & Basic Accounting", "Store Inventory & Cashiering", "Customer Relations Management", "E-commerce Selling"]
  };

  // 1. Sector-specific skills from TVET taxonomy based on youth's sectorPreference or goal
  youthTargetSectors.forEach(sectorName => {
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
  });

  // 2. Next, extract and sanitize skills from active TESDA programs matching the youth's sector
  programs.forEach(prog => {
    const progSectors = identifySectors(`${prog.title} ${(prog.requiredSkills || []).join(" ")}`);
    const isSectorMatch = progSectors.some(ps => youthTargetSectors.includes(ps));
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

/**
 * Accurately formats database stored program time strings (e.g. 1970-01-01T08:00:00.000Z or 08:00)
 * into human-readable 12-hour format without timezone skew (e.g. "8:00 AM")
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

