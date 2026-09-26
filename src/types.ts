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

export interface SkillGapData {
  skill: string;
  count: number;
  percentage: number;
  availableSlots: number;
  recommendedAction: string;
}

export const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  "College Level",
  "Senior High School Graduate",
  "High School Graduate",
  "Elementary Level"
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
  if (!val) return "College Level";
  const v = val.trim().toLowerCase();
  if (v.includes("college") || v.includes("undergraduate") || v.includes("tertiary") || v.includes("higher ed")) {
    return "College Level";
  }
  if (v.includes("senior") || v.includes("shs") || v.includes("grade 11") || v.includes("grade 12")) {
    return "Senior High School Graduate";
  }
  if (v.includes("high school") || v.includes("hs") || v.includes("junior") || v.includes("jhs") || v.includes("secondary")) {
    return "High School Graduate";
  }
  if (v.includes("elementary") || v.includes("primary") || v.includes("grade school")) {
    return "Elementary Level";
  }
  if (v.includes("vocational") || v.includes("tvet") || v.includes("tech-voc")) {
    return "Senior High School Graduate";
  }
  return "College Level";
}

export interface YouthProfile {
  id: string;
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
  savedCareerPlan?: any;
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
  youthName: string;
  purok: string;
  barangay: string;
  programTitle: string;
  programId?: string;
  matchScore: number;
  applicationDate?: string;
  referralDate?: string; // backwards compatibility alias
  status: "Pending" | "Enrolled" | "Declined" | "Archived";
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

