import { YouthProfile, TESDAProgram, CBFScoreBreakdown, NormalizedInputs, NormalizedGoal, CBFMatchCategory } from "../types";
export type { CBFMatchCategory } from "../types";
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
 * Formats ISO/database time strings into human-readable 12-hour format (e.g., "8:00 AM")
 */
export function formatProgramTime(t?: string | null): string {
  if (!t) return "";
  let timeStr = String(t).trim();
  if (timeStr.includes("T")) {
    const afterT = timeStr.split("T")[1]?.replace("Z", "");
    if (afterT) timeStr = afterT;
  }
  if (timeStr.includes(":")) {
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    if (!isNaN(h)) {
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const displayM = m < 10 ? `0${m}` : `${m}`;
      return `${displayH}:${displayM} ${period}`;
    }
  }
  return timeStr;
}

/**
 * Extracts hour integer (0-23) from time string
 */
function getHourFromTime(t?: string | null): number | null {
  if (!t) return null;
  let timeStr = String(t).trim();
  if (timeStr.includes("T")) {
    const afterT = timeStr.split("T")[1]?.replace("Z", "");
    if (afterT) timeStr = afterT;
  }
  if (timeStr.includes(":")) {
    const h = parseInt(timeStr.split(":")[0], 10);
    return isNaN(h) ? null : h;
  }
  return null;
}

/**
 * Formats an ISO date string or Date object into a readable date (e.g. "Sep 1, 2026")
 * Parses calendar YYYY-MM-DD directly to prevent off-by-one day timezone shifts.
 */
export function formatProgramDate(d?: string | Date | null): string {
  if (!d) return "";
  try {
    let dateObj: Date;
    if (d instanceof Date) {
      dateObj = d;
    } else {
      const str = String(d).trim();
      if (!str) return "";
      const datePart = str.split("T")[0];
      const match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (match) {
        dateObj = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      } else {
        dateObj = new Date(str);
      }
    }
    if (isNaN(dateObj.getTime())) return String(d);
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return String(d);
  }
}

/**
 * Formats a start and end date range into a clean human-readable string:
 * e.g. "Sep 1 – Oct 1, 2026" or "Sep 1, 2026 to Ongoing"
 */
export function formatProgramDateRange(startDate?: string | Date | null, endDate?: string | Date | null): string {
  if (!startDate && !endDate) return "";
  const start = formatProgramDate(startDate);
  const end = formatProgramDate(endDate);

  if (start && end) {
    if (start === end) return start;
    const startParts = start.split(", ");
    const endParts = end.split(", ");
    if (startParts.length === 2 && endParts.length === 2 && startParts[1] === endParts[1]) {
      return `${startParts[0]} – ${endParts[0]}, ${endParts[1]}`;
    }
    return `${start} – ${end}`;
  }

  if (start && !end) {
    return `${start} to Ongoing`;
  }

  if (!start && end) {
    return `Until ${end}`;
  }

  return "";
}

/**
 * Returns a clean, concise training days representation (e.g. "Mon – Fri", "Sat – Sun (Weekends)", "Mon, Wed, Fri")
 */
export function formatTrainingDays(days?: string[] | string | null): string {
  if (!days) return "Mon-Fri";

  const dayAbbrMap: Record<string, string> = {
    monday: "Mon", mon: "Mon", m: "Mon",
    tuesday: "Tue", tues: "Tue", tue: "Tue", tu: "Tue",
    wednesday: "Wed", wed: "Wed", w: "Wed",
    thursday: "Thu", thurs: "Thu", thur: "Thu", thu: "Thu", th: "Thu",
    friday: "Fri", fri: "Fri", f: "Fri",
    saturday: "Sat", sat: "Sat", sa: "Sat",
    sunday: "Sun", sun: "Sun", su: "Sun"
  };

  const weekOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  let tokens: string[] = [];
  if (Array.isArray(days)) {
    tokens = days.flatMap(d => (typeof d === "string" ? d.split(/[,;]+/) : []));
  } else if (typeof days === "string") {
    tokens = days.split(/[,;]+/);
  }

  tokens = tokens.map(s => s.trim()).filter(Boolean);
  if (tokens.length === 0) return "Mon-Fri";

  const expandedDays: string[] = [];
  for (const token of tokens) {
    const rangeMatch = token.match(/^([A-Za-z]+)\s*[-–—]\s*([A-Za-z]+)$/);
    if (rangeMatch) {
      const startAbbr = dayAbbrMap[rangeMatch[1].toLowerCase()];
      const endAbbr = dayAbbrMap[rangeMatch[2].toLowerCase()];
      if (startAbbr && endAbbr) {
        const startIdx = weekOrder.indexOf(startAbbr);
        const endIdx = weekOrder.indexOf(endAbbr);
        if (startIdx !== -1 && endIdx !== -1 && startIdx <= endIdx) {
          for (let i = startIdx; i <= endIdx; i++) {
            expandedDays.push(weekOrder[i]);
          }
          continue;
        }
      }
    }

    const cleanToken = token.replace(/[^A-Za-z]/g, "").toLowerCase();
    const abbr = dayAbbrMap[cleanToken];
    if (abbr) {
      expandedDays.push(abbr);
    }
  }

  const normalized = Array.from(new Set(expandedDays))
    .sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));

  if (normalized.length === 0) return Array.isArray(days) ? days.join(", ") : String(days);

  // Group consecutive days into ranges (e.g. Mon-Sat, Mon-Wed, Fri-Sat)
  const groups: string[][] = [];
  let currentGroup: string[] = [normalized[0]];

  for (let i = 1; i < normalized.length; i++) {
    const prevIdx = weekOrder.indexOf(normalized[i - 1]);
    const currIdx = weekOrder.indexOf(normalized[i]);
    if (currIdx === prevIdx + 1) {
      currentGroup.push(normalized[i]);
    } else {
      groups.push(currentGroup);
      currentGroup = [normalized[i]];
    }
  }
  groups.push(currentGroup);

  return groups.map(g => {
    if (g.length === 1) return g[0];
    return `${g[0]}-${g[g.length - 1]}`;
  }).join(", ");
}

/**
 * Formats a timeslot into human-readable 12-hour format with session classification
 * Example: { formattedRange: "8:00 AM – 12:00 PM", sessionType: "Morning", label: "Morning (8:00 AM – 12:00 PM)" }
 */
export function formatProgramTimeslot(
  startTime?: string | null,
  endTime?: string | null
): {
  formattedRange: string;
  sessionType: "Morning" | "Afternoon" | "Full Day" | "Evening" | "Custom";
  label: string;
} {
  const startFmt = formatProgramTime(startTime);
  const endFmt = formatProgramTime(endTime);

  if (!startFmt && !endFmt) {
    return {
      formattedRange: "Flexible / TBA",
      sessionType: "Custom",
      label: "Flexible Schedule"
    };
  }

  const formattedRange = startFmt && endFmt ? `${startFmt} – ${endFmt}` : startFmt || endFmt;

  const startH = getHourFromTime(startTime);
  const endH = getHourFromTime(endTime);

  let sessionType: "Morning" | "Afternoon" | "Full Day" | "Evening" | "Custom" = "Custom";
  if (startH !== null && endH !== null) {
    if (startH <= 9 && endH >= 16) {
      sessionType = "Full Day";
    } else if (startH < 12 && endH <= 13) {
      sessionType = "Morning";
    } else if (startH >= 12 && endH <= 18) {
      sessionType = "Afternoon";
    } else if (startH >= 17) {
      sessionType = "Evening";
    }
  } else if (startH !== null) {
    if (startH < 12) sessionType = "Morning";
    else if (startH < 17) sessionType = "Afternoon";
    else sessionType = "Evening";
  }

  const sessionLabel = sessionType !== "Custom" ? `${sessionType} (${formattedRange})` : formattedRange;

  return {
    formattedRange,
    sessionType,
    label: sessionLabel
  };
}

/**
 * Returns a complete, user-friendly schedule string combining days, timeslot, and session.
 * Example: "Mon – Fri · 8:00 AM – 12:00 PM (Morning)"
 */
export function getProgramFullSchedule(program?: {
  trainingDays?: string[] | null;
  startTime?: string | null;
  endTime?: string | null;
} | null): string {
  if (!program) return "Schedule TBA";
  const days = formatTrainingDays(program.trainingDays);
  const { formattedRange, sessionType } = formatProgramTimeslot(program.startTime, program.endTime);
  if (formattedRange.includes("Flexible") || formattedRange.includes("TBA")) {
    return `${days} · Flexible Hours`;
  }
  return sessionType !== "Custom"
    ? `${days} · ${formattedRange} (${sessionType})`
    : `${days} · ${formattedRange}`;
}

export interface ComputedTrainingHoursResult {
  totalHours: number;
  sessionCount: number;
  dailyHours: number;
  deductedLunch: boolean;
}

/**
 * Automatically computes total training hours based on:
 * - Start & End Date (calendar count of class sessions)
 * - Selected Training Days (Mon, Tue, etc.)
 * - Start & End Time (daily hours, excluding standard 1h lunch for full-day sessions >= 5h)
 */
export function computeProgramTrainingHours(params: {
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  trainingDays?: string[] | null;
}): ComputedTrainingHoursResult | null {
  const { startDate, endDate, startTime, endTime, trainingDays } = params;

  if (!startDate || !endDate || !startTime || !endTime) return null;

  // 1. Calculate daily hours
  let startStr = String(startTime).trim();
  if (startStr.includes("T")) startStr = startStr.split("T")[1]?.replace("Z", "") || "";
  let endStr = String(endTime).trim();
  if (endStr.includes("T")) endStr = endStr.split("T")[1]?.replace("Z", "") || "";

  const startParts = startStr.split(":");
  const endParts = endStr.split(":");
  if (startParts.length < 2 || endParts.length < 2) return null;

  const startMins = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
  const endMins = parseInt(endParts[0], 10) * 60 + parseInt(endParts[1], 10);
  if (isNaN(startMins) || isNaN(endMins) || endMins <= startMins) return null;

  const rawMins = endMins - startMins;
  // Deduct 1h lunch if >= 5 hours
  const deductedLunch = rawMins >= 300;
  const effectiveMins = deductedLunch ? rawMins - 60 : rawMins;
  const dailyHours = Math.round((effectiveMins / 60) * 10) / 10;
  if (dailyHours <= 0) return null;

  // 2. Calculate session days between startDate and endDate
  const cleanStart = String(startDate).split("T")[0];
  const cleanEnd = String(endDate).split("T")[0];
  const sParts = cleanStart.split("-").map(Number);
  const eParts = cleanEnd.split("-").map(Number);
  if (sParts.length !== 3 || eParts.length !== 3) return null;

  const curr = new Date(sParts[0], sParts[1] - 1, sParts[2]);
  const end = new Date(eParts[0], eParts[1] - 1, eParts[2]);
  if (isNaN(curr.getTime()) || isNaN(end.getTime()) || curr > end) return null;

  // Day of week mapping (0=Sun, 1=Mon, ..., 6=Sat)
  const dayNameToIndex: Record<string, number> = {
    sun: 0, sunday: 0,
    mon: 1, monday: 1,
    tue: 2, tuesday: 2,
    wed: 3, wednesday: 3,
    thu: 4, thursday: 4,
    fri: 5, friday: 5,
    sat: 6, saturday: 6
  };

  let targetDayIndices: number[] = [];
  if (trainingDays && trainingDays.length > 0) {
    targetDayIndices = trainingDays
      .map(d => dayNameToIndex[d.toLowerCase().trim()])
      .filter((idx): idx is number => idx !== undefined);
  }
  // Default to Mon-Fri if no days chosen
  if (targetDayIndices.length === 0) {
    targetDayIndices = [1, 2, 3, 4, 5];
  }

  let sessionCount = 0;
  let loopCount = 0;
  while (curr <= end && loopCount < 400) {
    if (targetDayIndices.includes(curr.getDay())) {
      sessionCount++;
    }
    curr.setDate(curr.getDate() + 1);
    loopCount++;
  }

  if (sessionCount === 0) return null;

  const totalHours = Math.round(sessionCount * dailyHours);
  return {
    totalHours,
    sessionCount,
    dailyHours,
    deductedLunch
  };
}

/**
 * CBF Match Categories:
 * - 90% and above: Excellent Match
 * - 75–89%: Strong Match
 * - 50–74%: Moderate Match
 * - Below 50%: Low Match
 * - 0% or N/A: Others / Not Match
 */
export interface CBFMatchCategoryDetails {
  category: CBFMatchCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  flameColor: string;
  hasScore: boolean;
  description: string;
}

export function getCBFMatchCategory(score: number, hasEnoughData: boolean = true): CBFMatchCategoryDetails {
  if (!hasEnoughData || score <= 0 || isNaN(score)) {
    return {
      category: "Not Enough Matching Data",
      label: "Others",
      badgeBg: "bg-gray-100",
      badgeText: "text-gray-600",
      badgeBorder: "border-gray-250",
      dotColor: "bg-gray-400",
      flameColor: "text-gray-400 fill-gray-400",
      hasScore: false,
      description: "Additional competencies or sector preferences are needed to calculate alignment."
    };
  }

  if (score >= 90) {
    return {
      category: "Excellent Match",
      label: "Excellent Match",
      badgeBg: "bg-emerald-50",
      badgeText: "text-[#0A6B43]",
      badgeBorder: "border-emerald-300",
      dotColor: "bg-[#0A6B43]",
      flameColor: "text-amber-500 fill-amber-500 animate-pulse",
      hasScore: true,
      description: "Exceptional alignment with your registered technical skills and primary career goals."
    };
  }

  if (score >= 75) {
    return {
      category: "Strong Match",
      label: "Strong Match",
      badgeBg: "bg-teal-50",
      badgeText: "text-teal-800",
      badgeBorder: "border-teal-200",
      dotColor: "bg-teal-600",
      flameColor: "text-teal-600 fill-teal-500",
      hasScore: true,
      description: "Strong compatibility based on your technical competencies and declared sector."
    };
  }

  if (score >= 50) {
    return {
      category: "Moderate Match",
      label: "Moderate Match",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-800",
      badgeBorder: "border-amber-200",
      dotColor: "bg-amber-500",
      flameColor: "text-amber-500 fill-transparent",
      hasScore: true,
      description: "Good cross-functional match that can help broaden your vocational skill set."
    };
  }

  return {
    category: "Low Match",
    label: "Low Match",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-250",
    dotColor: "bg-slate-400",
    flameColor: "text-slate-400 fill-transparent",
    hasScore: true,
    description: "Lower direct overlap with your current competencies, but open for enrollment."
  };
}

/**
 * Determines whether programs qualify for the distinct "Top Match" designation.
 * A program is designated as Top Match if:
 * 1. It is among actionable/valid programs with score >= 50.
 * 2. It has the maximum CBF score (exact tie) OR is nearly identical (within 2 percentage points of max score).
 */
export function identifyTopMatchProgramIds(
  scoredPrograms: { program: TESDAProgram; matchScore: number; isCompleted?: boolean }[],
  nearTieDelta: number = 2
): Set<string> {
  if (!scoredPrograms || scoredPrograms.length === 0) return new Set();

  // Prefer uncompleted programs for Top Match designation
  const uncompleted = scoredPrograms.filter(sp => !sp.isCompleted);
  const pool = uncompleted.length > 0 ? uncompleted : scoredPrograms;
  const validScores = pool.map(p => p.matchScore).filter(s => s > 0);
  if (validScores.length === 0) return new Set();

  const maxScore = Math.max(...validScores);
  if (maxScore < 50) return new Set(); // Must be at least Potential Match (>=50%) to receive Top Match

  const topIds = pool
    .filter(p => p.matchScore >= maxScore - nearTieDelta && p.matchScore >= 50)
    .slice(0, 3) // At most top 3 in case of broad ties
    .map(p => p.program.id);

  return new Set(topIds);
}

