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
  EDIT_PROGRAM = "Edit Program"
}

export interface SkillGapData {
  skill: string;
  count: number;
  percentage: number;
  availableSlots: number;
  recommendedAction: string;
}

export interface YouthProfile {
  id: string;
  name: string;
  email?: string;
  age: number;
  purok: string;
  barangay: string;
  educationalAttainment: string;
  currentStatus: string; // "Out-of-school" | "In-school" | "Employed" | "Self-employed" | "Graduate"
  skills: string[];
  interests: string[]; // "Employment" | "Entrepreneurship" | "Further Education" | "Vocational Training"
  sectorPreference: string;
  livelihoodGoal: string;
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

export interface ReferralPipelineItem {
  id: string;
  youthName: string;
  purok: string;
  barangay: string;
  programTitle: string;
  programId?: string;
  matchScore: number;
  referralDate: string;
  status: "Pending" | "Enrolled" | "Declined" | "Archived";
}

export interface OfficialAccount {
  id: string;
  name: string;
  email: string;
  role: "SK Chairperson" | "Barangay Captain" | "TESDA Representative";
  barangay?: string; // empty for TESDA Representative
  status: "Active" | "Inactive";
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

