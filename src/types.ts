export enum UserRole {
  SUPER_ADMIN = "Super Admin",
  SK_OFFICIAL = "SK Official",
  KK_YOUTH = "KK Youth Member",
  TESDA_PARTNER = "TESDA Partner Representative",
  BARANGAY_CAPTAIN = "Barangay Captain"
}

export enum SKOfficialScreen {
  DASHBOARD = "Dashboard",
  YOUTH_PROFILES = "Youth Profiles",
  PROFILE_DETAIL = "Profile Detail",
  REGISTER_YOUTH = "Register Youth",
  TESDA_PROGRAMS = "TESDA Programs",
  SKILLS_GAP = "Skills Gap Analytics",
  ANNOUNCEMENTS = "SK Announcements",
  SETTINGS = "Settings & Profile",
  COUNCILORS = "My Team",
  PENDING_APPROVALS = "Pending Approvals"
}

export enum YouthScreen {
  HOME = "Home",
  MATCHES = "Your Matches",
  PATHWAY = "Your Livelihood Pathway",
  PROFILE = "My Profile"
}

export enum TESDAPartnerScreen {
  DASHBOARD = "TESDA Dashboard",
  PROGRAMS = "Programs",
  ADD_PROGRAM = "Add New Program",
  EDIT_PROGRAM = "Edit Program",
  SETTINGS = "Partner Profile & Settings"
}

export enum BarangayCaptainScreen {
  DASHBOARD = "Executive Dashboard",
  YOUTH_DIRECTORY = "KK Youth Directory",
  SK_COUNCIL = "SK Council Oversight",
  APPLICATIONS = "Program Applications",
  TESDA_PROGRAMS = "TESDA Listings",
  PROFILE = "Executive Profile"
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Alias {
  id: string;
  alias: string;
  normalizedValue: string;
  categoryId: string;
}

export interface NormalizedInput {
  raw: string;
  value: string | null;
  categoryId: string | null;
  isUnresolved: boolean;
}

export type NormalizedInputs = NormalizedInput[];
export type NormalizedGoal = NormalizedInput | null;

export interface CBFScoreBreakdown {
  programId: string;
  programTitle: string;
  categoryId: string;
  categoryName?: string;
  skillMatch: number;
  preferenceMatch: number;
  experienceMatch: number;
  goalMatch: number;
  skillPoints: number;
  preferencePoints: number;
  experiencePoints: number;
  goalPoints: number;
  finalScore: number;
  passedSkillGate: boolean;
  excluded: boolean;
  matchedSkills?: string[];
  totalResolvedSkills?: number;
}

export type CBFMatchCategory = 
  | "Excellent Match"
  | "Strong Match"
  | "Moderate Match"
  | "Low Match"
  | "Highly Recommended" 
  | "Good Match" 
  | "Potential Match" 
  | "Limited Match" 
  | "Not Enough Matching Data";

export interface SkillGapData {
  skill: string;
  count: number;
  percentage: number;
  availableSlots: number;
  recommendedAction: string;
}

export type SkillGapCriticalityLevel = "Critical" | "Moderate" | "Low" | "None";

export interface SkillGapCriticalityInfo {
  level: SkillGapCriticalityLevel;
  label: string;
  badgeClass: string;
  barClass: string;
  trackClass: string;
  textClass: string;
  dotClass: string;
  hexColor: string;
}

export const getSkillGapCriticality = (percentage: number, count: number): SkillGapCriticalityInfo => {
  if (count === 0) {
    return {
      level: "None",
      label: "No Gap",
      badgeClass: "bg-gray-100 text-gray-500 border-gray-200",
      barClass: "bg-gray-300",
      trackClass: "bg-gray-100",
      textClass: "text-gray-500",
      dotClass: "bg-gray-400",
      hexColor: "#9ca3af"
    };
  }
  if (percentage >= 30) {
    return {
      level: "Critical",
      label: "Critical Gap",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
      barClass: "bg-linear-to-r from-red-600 via-rose-500 to-red-500 shadow-xs shadow-red-500/25",
      trackClass: "bg-red-100/40",
      textClass: "text-red-700",
      dotClass: "bg-red-500",
      hexColor: "#dc2626"
    };
  }
  if (percentage >= 15) {
    return {
      level: "Moderate",
      label: "Moderate Gap",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
      barClass: "bg-linear-to-r from-amber-500 via-amber-400 to-orange-500 shadow-xs shadow-amber-500/25",
      trackClass: "bg-amber-100/40",
      textClass: "text-amber-800",
      dotClass: "bg-amber-500",
      hexColor: "#d97706"
    };
  }
  return {
    level: "Low",
    label: "Low Gap",
    badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
    barClass: "bg-linear-to-r from-emerald-500 to-teal-600 shadow-xs shadow-emerald-500/20",
    trackClass: "bg-emerald-100/40",
    textClass: "text-emerald-800",
    dotClass: "bg-emerald-500",
    hexColor: "#059669"
  };
};

export const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  "Elementary Level",
  "Elementary Graduate",
  "Junior High School Level",
  "Junior High School Graduate",
  "Senior High School Level",
  "Senior High School Graduate",
  "College Level (Undergraduate)"
] as const;

export type EducationalAttainment = typeof EDUCATIONAL_ATTAINMENT_OPTIONS[number];

export const VOCATIONAL_SECTOR_OPTIONS = [
  "Information & Communications Technology (ICT)",
  "Agriculture, Forestry and Fishery",
  "Automotive and Land Transportation",
  "Construction",
  "Electrical and Electronics",
  "Heating, Ventilation, Airconditioning and Refrigeration (HVAC/R)",
  "Heavy Equipment Operation",
  "Metals and Engineering / Welding",
  "Process Food and Beverages / Culinary",
  "Tourism / Hotel and Restaurant Services",
  "Social, Community Development and other Services / Caregiving",
  "Human Health / Health Care",
  "Visual and Performing Arts / Creative",
  "Garments and Textiles",
  "Wholesale and Retail / Sales",
  "Logistics and Warehousing",
  "Maritime",
  "Utilities / Solar Power",
  "Language and Culture",
  "Entrepreneurship & Management"
] as const;

export function normalizeEducationalAttainment(val?: string | null): EducationalAttainment {
  if (!val) return "Junior High School Graduate";
  const trimmed = val.trim();

  // Direct match (case-insensitive) against defined options
  const exact = EDUCATIONAL_ATTAINMENT_OPTIONS.find(
    opt => opt.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;

  const v = trimmed.toLowerCase();

  // 1. College / Tertiary / Undergraduate / Bachelor
  if (
    v.includes("college") ||
    v.includes("undergrad") ||
    v.includes("tertiary") ||
    v.includes("bachelor") ||
    v.includes("higher ed") ||
    v.includes("university")
  ) {
    return "College Level (Undergraduate)";
  }

  // 2. Senior High School (SHS, Grade 11, Grade 12)
  if (
    v.includes("senior high") ||
    v.includes("senior") ||
    v.includes("shs") ||
    v.includes("grade 11") ||
    v.includes("grade 12")
  ) {
    if (v.includes("level") || v.includes("undergrad") || v.includes("student") || v.includes("attending")) {
      return "Senior High School Level";
    }
    return "Senior High School Graduate";
  }

  // 3. Junior High School (JHS, Grade 7 to 10)
  if (
    v.includes("junior high") ||
    v.includes("junior") ||
    v.includes("jhs") ||
    v.includes("grade 7") ||
    v.includes("grade 8") ||
    v.includes("grade 9") ||
    v.includes("grade 10")
  ) {
    if (v.includes("level") || v.includes("undergrad") || v.includes("student") || v.includes("attending")) {
      return "Junior High School Level";
    }
    return "Junior High School Graduate";
  }

  // 4. Generic High School / Secondary (legacy "High School Graduate", "High School Level", etc.)
  if (v.includes("high school") || v.includes("hs") || v.includes("secondary")) {
    if (v.includes("level") || v.includes("undergrad") || v.includes("student") || v.includes("attending")) {
      return "Junior High School Level";
    }
    return "Junior High School Graduate";
  }

  // 5. Elementary / Primary / Grade School
  if (v.includes("elem") || v.includes("primary") || v.includes("grade school")) {
    if (v.includes("grad")) {
      return "Elementary Graduate";
    }
    return "Elementary Level";
  }

  // 6. Vocational / Tech-Voc / TVET
  if (v.includes("vocational") || v.includes("tvet") || v.includes("tech-voc")) {
    return "Senior High School Graduate";
  }

  return "Junior High School Graduate";
}

export interface YouthProfile {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  birthdate?: string;
  age: number;
  gender?: string;
  purok: string;
  barangay: string;
  educationalAttainment: string;
  currentStatus: string; // "Out-of-school" | "In-school" | "Employed" | "Self-employed" | "Graduate"
  skills: string[];
  interests: string[]; // "Employment" | "Entrepreneurship" | "Further Education" | "Vocational Training"
  sectorPreference: string;
  livelihoodGoal: string;
  
  // CBF Raw inputs
  skillsRaw?: string[];
  preferencesRaw?: string[];
  experiencesRaw?: string[];
  goalRaw?: string;

  // CBF Normalized JSON data
  skillsNormalized?: NormalizedInputs;
  preferencesNormalized?: NormalizedInputs;
  experiencesNormalized?: NormalizedInputs;
  goalNormalized?: NormalizedGoal;

  contactNumber: string;
  registeredDate: string;
  matchScore: number; // Percentage
  soloParent: boolean;
  pwd: boolean;
  indigenous: boolean;
  hasReferred?: boolean; // If they have been referred
  approvalStatus?: "Approved" | "Pending" | "Rejected";
  verificationIdType?: string;
  verificationIdNumber?: string;
  verificationIdImage?: string;
  profilePicture?: string;
  savedCareerPlan?: any;
  savedMatchAdvice?: SavedMatchAdvice | null;
}

export interface SavedMatchAdvice {
  programId: string;
  programTitle: string;
  careerAdvice: string;
  bulletAdvice: string[];
  careerAdviceTl: string;
  bulletAdviceTl: string[];
  generatedAt?: string;
}

export interface TESDAProgram {
  id: string;
  title: string;
  provider: string;
  type: "Training" | "Employment" | "Entrepreneurship";
  location: string;
  trainingHours: number;
  cost: "Free" | "Subsidized" | "With Fee";
  slotsTotal: number;
  slotsRemaining: number;
  youthMatched: number;
  eligibility: string;
  contactPerson: string;
  contactNumber: string;
  activeStatus: "Active" | "Full" | "Closed";
  categoryId?: string;
  category?: string | Category;
  requiredDocuments?: string[];
  requiredSkills?: string[];
  trainingDays?: string[];
  startTime?: string;
  endTime?: string;
  room?: string;
  instructor?: string;
  startDate?: string;
  endDate?: string;
}

export interface SKAnnouncement {
  id: string;
  title: string;
  body: string;
  category: "Program Update" | "Event" | "Reminder" | "General";
  audience: "All KK members" | "OSY only";
  datePosted: string;
  barangay?: string;
  eventDate?: string;
  venue?: string;
  contactPerson?: string;
  status?: "Active" | "Cancelled";
  expiryDate?: string;
}

export interface ProgramApplication {
  id: string;
  youthId?: string;
  youthName: string;
  youthEmail?: string;
  email?: string;
  purok: string;
  barangay: string;
  programTitle: string;
  programId?: string;
  matchScore: number;
  applicationDate?: string;
  referralDate?: string; // backwards compatibility alias
  status: "Pending" | "Enrolled" | "Declined" | "Archived";
  program?: Partial<TESDAProgram>;
}

// Backwards compatibility alias
export type ReferralPipelineItem = ProgramApplication;

export interface OfficialAccount {
  id: string;
  name: string;
  email: string;
  role: "SK Chairperson" | "Barangay Captain" | "TESDA Representative";
  barangay?: string; // empty for TESDA Representative
  status: "Active" | "Inactive" | "Suspended";
  dateCreated: string;
}

export interface Councilor {
  id: string;
  name: string;
  email: string;
  role: "SK Councilor" | "Secretary" | "Treasurer";
  contactNumber?: string;
  status: "Active" | "Inactive";
  dateCreated: string;
  barangay: string;
}

export interface Barangay {
  name: string;
}

