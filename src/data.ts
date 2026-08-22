import { YouthProfile, TESDAProgram, SKAnnouncement, ReferralPipelineItem, SkillGapData, OfficialAccount, Councilor, Barangay } from "./types";

export const INITIAL_YOUTH_PROFILES: YouthProfile[] = [];

export const INITIAL_TESDA_PROGRAMS: TESDAProgram[] = [];

export const INITIAL_ANNOUNCEMENTS: SKAnnouncement[] = [];

export const INITIAL_REFERRALS: ReferralPipelineItem[] = [];

export const SKILLS_GAPS: SkillGapData[] = [
  {
    skill: "Computer Literacy",
    count: 0,
    percentage: 0,
    availableSlots: 0,
    recommendedAction: "Organize Barangay-level digital tools and internet research basic workshop."
  },
  {
    skill: "Food Processing",
    count: 0,
    percentage: 0,
    availableSlots: 0,
    recommendedAction: "Fund additional localized batch of Food Processing NC II in municipal kitchen."
  },
  {
    skill: "Electrical Installation",
    count: 0,
    percentage: 0,
    availableSlots: 0,
    recommendedAction: "Refer out-of-school youth to empty training slots at TESDA GPSAT campus."
  },
  {
    skill: "Welding / Metal Fab",
    count: 0,
    percentage: 0,
    availableSlots: 0,
    recommendedAction: "Utilize SK budget to sponsor tools & protective gears for priority SMAW enrollees."
  },
  {
    skill: "Bread and Pastry",
    count: 0,
    percentage: 0,
    availableSlots: 0,
    recommendedAction: "Partner with local cooperative bakeries for job placement opportunities."
  }
];

export const INITIAL_BARANGAYS: Barangay[] = [
  { name: "San Sebastian" },
  { name: "Sta. Cruz Pambilog" },
  { name: "San Nicolas" },
  { name: "Sto. Rosario" },
  { name: "San Jose" },
  { name: "San Juan" },
  { name: "Sta. Rita" },
  { name: "Sto. Niño" },
  { name: "San Agustin" },
  { name: "San Carlos" },
  { name: "San Isidro" },
  { name: "San Roque" },
  { name: "Sta. Cruz Población" },
  { name: "Sta. Lucia" },
  { name: "Sta. Monica" },
  { name: "Sta. Catalina" },
  { name: "Sto. Tomas" }
];

export const INITIAL_OFFICIALS: OfficialAccount[] = [];

export const INITIAL_COUNCILORS: Councilor[] = [];
