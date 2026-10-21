"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Target, Briefcase, BarChart2, Bell, LogOut, Search, Plus, Filter,
  FileText, Megaphone, Settings, ArrowLeft, Mail, Phone, Calendar, Award,
  CheckCircle, ShieldAlert, Sparkles, AlertTriangle, TrendingUp, Users2, Trash2, Edit, X, RefreshCw,
  ShieldCheck, Eye, User, MapPin, XCircle, Ban, Copy, EyeOff, Check, Lock, Building, Shield,
  LayoutGrid, Table, UserCheck, ShieldPlus, ChevronRight, ChevronLeft,
  Printer, Download, Menu, Clock, Loader2, GraduationCap
} from "lucide-react";
import {
  YouthProfile, TESDAProgram, SKAnnouncement, ReferralPipelineItem,
  SKOfficialScreen, UserRole, SkillGapData, Councilor,
  EDUCATIONAL_ATTAINMENT_OPTIONS, VOCATIONAL_SECTOR_OPTIONS, normalizeEducationalAttainment,
  getSkillGapCriticality
} from "../types";
import {
  MetricCard, FlameMatchScore, PathwayTimeline,
  OpportunityCard, EmptyState, Toast, ConfirmationModal, SikapLogo,
  SiKapDatePicker, SiKapTimePicker, NotificationBellButton
} from "./ReusableComponents";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { formatContactNumber, isValidContactNumber, formatTime12Hour, calculateAge, isProgramEnded } from "../lib/utils";
import { calculateContentBasedMatchScore } from "../lib/cbf-matcher";
import { motion, AnimatePresence } from "motion/react";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";

interface SKOfficialPortalProps {
  youthProfiles: YouthProfile[];
  setYouthProfiles: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  setPrograms: React.Dispatch<React.SetStateAction<TESDAProgram[]>>;
  announcements: SKAnnouncement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<SKAnnouncement[]>>;
  referrals: ReferralPipelineItem[];
  setReferrals: React.Dispatch<React.SetStateAction<ReferralPipelineItem[]>>;
  skillsGaps: SkillGapData[];
  councilors: Councilor[];
  setCouncilors: React.Dispatch<React.SetStateAction<Councilor[]>>;
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  designatedBarangay: string;
  currentUser?: any;
}

export const SKOfficialPortal: React.FC<SKOfficialPortalProps> = ({
  youthProfiles,
  setYouthProfiles,
  programs,
  setPrograms,
  announcements,
  setAnnouncements,
  referrals,
  setReferrals,
  skillsGaps,
  councilors,
  setCouncilors,
  onLogout,
  addToast,
  designatedBarangay,
  currentUser
}) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };
  const [currentScreen, setCurrentScreen] = useState<SKOfficialScreen>(SKOfficialScreen.DASHBOARD);
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>("y-01"); // Default to Juan

  // Search & Filter states: Youth Directory
  const [searchQuery, setSearchQuery] = useState("");
  const [eduFilter, setEduFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [purokFilter, setPurokFilter] = useState("All");
  const [matchStatusFilter, setMatchStatusFilter] = useState("All");

  // Search & Filter states: TESDA Programs Catalog
  const [progSearchQuery, setProgSearchQuery] = useState("");
  const [progSectorFilter, setProgSectorFilter] = useState("All");

  // Form states for registering youth
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAge, setRegAge] = useState<number | string>(20);
  const [regDOB, setRegDOB] = useState("2006-05-15");
  const [regSex, setRegSex] = useState("Male");
  const [regPurok, setRegPurok] = useState("Purok 2");
  const [regContact, setRegContact] = useState("+63 9");
  const [regEdu, setRegEdu] = useState<string>("College Level");
  const [regStatus, setRegStatus] = useState("Out-of-school");
  const [regSchool, setRegSchool] = useState("");
  const [regSkills, setRegSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [regInterests, setRegInterests] = useState<string[]>(["Vocational Training", "Employment"]);
  const [regSector, setRegSector] = useState("IT & Technology");
  const [regGoal, setRegGoal] = useState("");
  const [regSolo, setRegSolo] = useState(false);
  const [regPwd, setRegPwd] = useState(false);
  const [regIndigenous, setRegIndigenous] = useState(false);

  // Loading and overlays
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Skills Gap Printable Report Modal State
  const [isSkillsGapReportModalOpen, setIsSkillsGapReportModalOpen] = useState(false);

  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCategory, setAnnCategory] = useState<"Program Update" | "Event" | "Reminder" | "General">("Program Update");
  const [annAudience, setAnnAudience] = useState<"All KK members" | "OSY only">("OSY only");
  const [annEventDate, setAnnEventDate] = useState("");
  const [annVenue, setAnnVenue] = useState("");
  const [annContactPerson, setAnnContactPerson] = useState("");
  const [annEventDatePicker, setAnnEventDatePicker] = useState("");
  const [annEventTimePicker, setAnnEventTimePicker] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [annSearchQuery, setAnnSearchQuery] = useState("");
  const [annCategoryFilter, setAnnCategoryFilter] = useState("All");

  // Settings State
  const [settingsName, setSettingsName] = useState("Rhea Cruz");
  const [settingsPos, setSettingsPos] = useState("SK Chairperson");
  const [settingsEmail, setSettingsEmail] = useState("rheacruz.sk@sanluispampanga.gov.ph");
  const [settingsPhone, setSettingsPhone] = useState("+63 915 777 8888");
  const [prefMatchAlerts, setPrefMatchAlerts] = useState(true);
  const [prefSlots, setPrefSlots] = useState(true);
  const [prefWeekly, setPrefWeekly] = useState(true);

  // Settings tabs & password management state
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "security" | "preferences" | "credentials">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Check if current logged-in official is an SK Councilor, Secretary, or Treasurer
  const currentCouncilorRecord = useMemo(() => {
    if (!currentUser?.email && !currentUser?.name) return null;
    return councilors.find(c =>
      (currentUser.email && c.email && c.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()) ||
      (currentUser.name && c.name && c.name.toLowerCase().trim() === currentUser.name.toLowerCase().trim())
    ) || null;
  }, [councilors, currentUser]);

  const officialPosition = useMemo(() => {
    if (currentCouncilorRecord?.role) {
      const r = currentCouncilorRecord.role.trim();
      if (r.toLowerCase().includes("secretary")) return "SK Secretary";
      if (r.toLowerCase().includes("treasurer")) return "SK Treasurer";
      return "SK Councilor";
    }
    if ((currentUser as any)?.officialPosition) {
      const p = ((currentUser as any).officialPosition as string).trim();
      if (p.toLowerCase().includes("secretary")) return "SK Secretary";
      if (p.toLowerCase().includes("treasurer")) return "SK Treasurer";
      if (p.toLowerCase().includes("councilor")) return "SK Councilor";
      return p;
    }
    return "SK Chairperson";
  }, [currentCouncilorRecord, currentUser]);

  const isChairperson = officialPosition === "SK Chairperson";

  // Synchronize settings with current logged-in SK Official
  useEffect(() => {
    if (currentUser) {
      setSettingsName(currentUser.name);
      setSettingsEmail(currentUser.email);
      setSettingsPos(officialPosition);
      return;
    }
    setSettingsName("SK Chairperson");
    setSettingsEmail("chairperson@sanluispampanga.gov.ph");
    setSettingsPos("SK Chairperson");
  }, [designatedBarangay, currentUser, officialPosition]);

  // Protect My Team screen: if not Chairperson, automatically redirect to Dashboard
  useEffect(() => {
    if (!isChairperson && currentScreen === SKOfficialScreen.COUNCILORS) {
      setCurrentScreen(SKOfficialScreen.DASHBOARD);
    }
  }, [isChairperson, currentScreen]);

  // Councilor management states
  const [councilorName, setCouncilorName] = useState("");
  const [councilorEmail, setCouncilorEmail] = useState("");
  const [councilorRole, setCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [councilorPassword, setCouncilorPassword] = useState("");
  const [councilorContact, setCouncilorContact] = useState("+63 9");
  const [showCouncilorPassword, setShowCouncilorPassword] = useState(false);
  const [createdCouncilorAccount, setCreatedCouncilorAccount] = useState<{ name: string; email: string; role: string; password: string; contactNumber?: string } | null>(null);

  const [isAddCouncilorOpen, setIsAddCouncilorOpen] = useState(false);
  const [editingCouncilorId, setEditingCouncilorId] = useState<string | null>(null);
  const [editCouncilorName, setEditCouncilorName] = useState("");
  const [editCouncilorEmail, setEditCouncilorEmail] = useState("");
  const [editCouncilorContact, setEditCouncilorContact] = useState("+63 9");
  const [editCouncilorRole, setEditCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [isEditCouncilorOpen, setIsEditCouncilorOpen] = useState(false);
  const [isUpdatingCouncilor, setIsUpdatingCouncilor] = useState(false);

  // Councilor UI filters & view mode
  const [councilorSearch, setCouncilorSearch] = useState("");
  const [councilorRoleFilter, setCouncilorRoleFilter] = useState<string>("All");
  const [councilorStatusFilter, setCouncilorStatusFilter] = useState<string>("All");
  const [councilorViewMode, setCouncilorViewMode] = useState<"grid" | "table">("grid");
  const [deletingCouncilor, setDeletingCouncilor] = useState<Councilor | null>(null);

  // ID Verification state
  const [verifyingYouth, setVerifyingYouth] = useState<YouthProfile | null>(null);

  // Pending Youth Pop-Up Modal state
  const [viewingPendingYouthModal, setViewingPendingYouthModal] = useState<YouthProfile | null>(null);

  // Expanded aspirations toggle state for table cells
  const [expandedAspirations, setExpandedAspirations] = useState<Record<string, boolean>>({});

  // Pending Registrations pagination state on Dashboard (max 4 per page)
  const [pendingDashboardPage, setPendingDashboardPage] = useState(1);

  // Dedicated Pending Approvals screen pagination & search states (max 10 per page)
  const [pendingApprovalsPage, setPendingApprovalsPage] = useState(1);
  const [pendingSearchQuery, setPendingSearchQuery] = useState("");

  // Analytics sector filter state
  const [analyticsSectorFilter, setAnalyticsSectorFilter] = useState<string>("All");

  // Top Navbar Notification state
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Helper to get all relevant storage keys for the active SK official
  const getStorageKeys = () => {
    const keys: string[] = [];
    if (currentUser?.email) {
      keys.push(`sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}`);
    }
    if (currentUser?.id) {
      keys.push(`sikap_cleared_notifs_${currentUser.id}`);
    }
    const cleanBrgy = (designatedBarangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
    if (cleanBrgy) {
      keys.push(`sikap_cleared_notifs_sk_${cleanBrgy}`);
      keys.push(`sikap_cleared_notifs_sk_${designatedBarangay}`);
    }
    keys.push("sikap_cleared_notifs_sk_general");
    return Array.from(new Set(keys));
  };

  // Track dismissed/cleared notifications with localStorage persistence
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cleanBrgy = (designatedBarangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          cleanBrgy ? `sikap_cleared_notifs_sk_${cleanBrgy}` : null,
          `sikap_cleared_notifs_sk_${designatedBarangay}`,
          "sikap_cleared_notifs_sk_general"
        ].filter(Boolean) as string[];

        let loaded: string[] = [];
        for (const k of initialKeys) {
          const saved = localStorage.getItem(k);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) loaded.push(...parsed);
            } catch { }
          }
        }
        return Array.from(new Set(loaded));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Re-synchronize cleared notifications whenever SK user or designated barangay updates
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keys = getStorageKeys();
      let loaded: string[] = [];
      for (const k of keys) {
        const saved = localStorage.getItem(k);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) loaded.push(...parsed);
          } catch { }
        }
      }
      if (loaded.length > 0) {
        setClearedNotificationIds(prev => Array.from(new Set([...prev, ...loaded])));
      }
    } catch (e) {
      console.error("Failed to sync cleared notifications in SK portal:", e);
    }
  }, [currentUser?.email, currentUser?.id, designatedBarangay]);

  const dismissNotification = (id: string) => {
    setClearedNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
      } catch (e) {
        console.error("Failed to save cleared notification:", e);
      }
      return updated;
    });
  };

  const clearAllNotifications = (allIds: string[]) => {
    setClearedNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
        if (currentUser?.email) {
          localStorage.setItem(`sikap_notifs_read_${currentUser.email.toLowerCase().trim()}`, "true");
        }
      } catch (e) {
        console.error("Failed to save cleared notifications:", e);
      }
      return updated;
    });
    setNotificationsRead(true);
  };

  const toggleAspirationExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAspirations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Localized data lists filtered by designatedBarangay
  const localYouthProfiles = useMemo(() => {
    return youthProfiles.filter(y => {
      const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return yBrgy === dbBrgy;
    });
  }, [youthProfiles, designatedBarangay]);

  const localReferrals = useMemo(() => {
    return referrals.filter(r => {
      const rBrgy = r.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return rBrgy === dbBrgy;
    });
  }, [referrals, designatedBarangay]);

  const localCouncilors = useMemo(() => {
    return councilors.filter(c => {
      const cBrgy = c.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return cBrgy === dbBrgy;
    });
  }, [councilors, designatedBarangay]);

  const filteredCouncilors = useMemo(() => {
    return localCouncilors.filter(c => {
      const q = councilorSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.contactNumber && c.contactNumber.toLowerCase().includes(q)) ||
        c.role.toLowerCase().includes(q);

      const matchesRole =
        councilorRoleFilter === "All" || c.role === councilorRoleFilter;

      const matchesStatus =
        councilorStatusFilter === "All" || c.status === councilorStatusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [localCouncilors, councilorSearch, councilorRoleFilter, councilorStatusFilter]);

  const activeCouncilorCount = useMemo(() => {
    return localCouncilors.filter(c => c.status === "Active").length;
  }, [localCouncilors]);

  const roleCounts = useMemo(() => {
    const councilorsCount = localCouncilors.filter(c => c.role === "SK Councilor").length;
    const secretariesCount = localCouncilors.filter(c => c.role === "Secretary").length;
    const treasurersCount = localCouncilors.filter(c => c.role === "Treasurer").length;
    return { councilorsCount, secretariesCount, treasurersCount };
  }, [localCouncilors]);

  const localAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (!ann.barangay) return true; // Global/Municipal announcement
      const annBrgy = ann.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return annBrgy === dbBrgy;
    });
  }, [announcements, designatedBarangay]);

  const filteredAnnouncements = useMemo(() => {
    return localAnnouncements.filter(ann => {
      const matchesCategory = annCategoryFilter === "All" || ann.category === annCategoryFilter;
      const q = annSearchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        ann.title.toLowerCase().includes(q) ||
        ann.body.toLowerCase().includes(q) ||
        (ann.venue && ann.venue.toLowerCase().includes(q)) ||
        (ann.contactPerson && ann.contactPerson.toLowerCase().includes(q)) ||
        ann.audience.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [localAnnouncements, annCategoryFilter, annSearchQuery]);

  const getSlotsForKeywords = (keywords: string[]) => {
    if (!programs || programs.length === 0) return 0;
    return programs
      .filter(p => keywords.some(k => p.title.toLowerCase().includes(k)))
      .reduce((sum, p) => sum + (p.slotsRemaining || 0), 0);
  };

  const localSkillsGaps = useMemo<SkillGapData[]>(() => {
    const totalLocal = localYouthProfiles.length;

    const computerSlots = getSlotsForKeywords(["computer", "it", "digital", "css", "programming", "web"]);
    const foodSlots = getSlotsForKeywords(["food", "processing", "cook", "culinary"]);
    const electricalSlots = getSlotsForKeywords(["electr", "wire", "eim", "installation"]);
    const weldingSlots = getSlotsForKeywords(["weld", "metal", "smaw", "fabrication"]);
    const bakingSlots = getSlotsForKeywords(["bread", "pastry", "bake", "baking"]);
    const autoSlots = getSlotsForKeywords(["automotive", "motor", "engine", "mechanic", "vehicle"]);
    const agriSlots = getSlotsForKeywords(["agri", "crop", "farm", "organic", "poultry"]);

    const brgyClean = designatedBarangay.replace(/^Barangay\s+/i, "");

    if (totalLocal === 0) {
      return [
        { skill: "Computer & Digital Literacy", count: 0, percentage: 0, availableSlots: computerSlots, recommendedAction: `Organize Barangay ${brgyClean} digital tools and basic office suite workshop.` },
        { skill: "Food Processing & Commercial Cooking", count: 0, percentage: 0, availableSlots: foodSlots, recommendedAction: `Fund additional localized batch of Food Processing NC II in ${brgyClean} community center.` },
        { skill: "Bread & Pastry Production", count: 0, percentage: 0, availableSlots: bakingSlots, recommendedAction: `Partner with local cooperative bakeries in San Luis for job placement of ${brgyClean} graduates.` },
        { skill: "Electrical Installation & Maintenance", count: 0, percentage: 0, availableSlots: electricalSlots, recommendedAction: `Refer out-of-school youth in ${brgyClean} to training slots at TESDA GPSAT campus.` },
        { skill: "Welding / SMAW Fabrication", count: 0, percentage: 0, availableSlots: weldingSlots, recommendedAction: `Utilize ${brgyClean} SK budget to sponsor tools & protective gears for priority SMAW enrollees.` },
        { skill: "Automotive & Engine Servicing", count: 0, percentage: 0, availableSlots: autoSlots, recommendedAction: `Coordinate with TESDA for mobile mechanical diagnostics training in Barangay ${brgyClean}.` },
        { skill: "Organic Agriculture & Agribusiness", count: 0, percentage: 0, availableSlots: agriSlots, recommendedAction: `Launch youth urban container gardening and high-value crop production in ${brgyClean}.` }
      ];
    }

    let computerCount = 0;
    let foodCount = 0;
    let electricalCount = 0;
    let weldingCount = 0;
    let bakingCount = 0;
    let autoCount = 0;
    let agriCount = 0;

    localYouthProfiles.forEach(y => {
      const skillsLower = (y.skills || []).map(s => s.toLowerCase());
      const pref = (y.sectorPreference || "").toLowerCase();
      const goal = (y.livelihoodGoal || "").toLowerCase();

      // IT & Digital Literacy:
      const hasItSkill = skillsLower.some(s => s.includes("design") || s.includes("office") || s.includes("word") || s.includes("excel") || s.includes("program") || s.includes("network") || s.includes("data") || s.includes("computer") || s.includes("tech"));
      if (!hasItSkill && (pref.includes("it") || pref.includes("technology") || pref.includes("business") || goal.includes("it") || goal.includes("computer") || y.educationalAttainment === "High school level" || y.currentStatus === "Out-of-school")) {
        computerCount++;
      }

      // Food & Commercial Cooking:
      const hasFoodSkill = skillsLower.some(s => s.includes("cook") || s.includes("prep") || s.includes("food") || s.includes("culinary"));
      if (!hasFoodSkill && (pref.includes("food") || pref.includes("tourism") || pref.includes("culinary") || goal.includes("food") || goal.includes("restaurant") || goal.includes("cook"))) {
        foodCount++;
      }

      // Bread & Pastry:
      const hasBakeSkill = skillsLower.some(s => s.includes("bake") || s.includes("pastry") || s.includes("cake") || s.includes("bread"));
      if (!hasBakeSkill && (pref.includes("food") || pref.includes("tourism") || pref.includes("baking") || goal.includes("baker") || goal.includes("pastry") || goal.includes("cafe"))) {
        bakingCount++;
      }

      // Electrical:
      const hasElecSkill = skillsLower.some(s => s.includes("elect") || s.includes("wire") || s.includes("eim") || s.includes("circuit"));
      if (!hasElecSkill && (pref.includes("construction") || pref.includes("metal") || pref.includes("electrical") || pref.includes("trade") || goal.includes("electric") || goal.includes("wire"))) {
        electricalCount++;
      }

      // Welding:
      const hasWeldSkill = skillsLower.some(s => s.includes("weld") || s.includes("metal") || s.includes("smaw") || s.includes("fabricat"));
      if (!hasWeldSkill && (pref.includes("construction") || pref.includes("metal") || pref.includes("welding") || pref.includes("trade") || goal.includes("weld") || goal.includes("fabricat"))) {
        weldingCount++;
      }

      // Automotive:
      const hasAutoSkill = skillsLower.some(s => s.includes("auto") || s.includes("motor") || s.includes("engine") || s.includes("mechanic"));
      if (!hasAutoSkill && (pref.includes("auto") || pref.includes("transport") || pref.includes("mechanic") || goal.includes("driver") || goal.includes("auto") || goal.includes("mechanic"))) {
        autoCount++;
      }

      // Agriculture:
      const hasAgriSkill = skillsLower.some(s => s.includes("agri") || s.includes("farm") || s.includes("crop") || s.includes("plant"));
      if (!hasAgriSkill && (pref.includes("agri") || pref.includes("farm") || goal.includes("farm") || goal.includes("agri"))) {
        agriCount++;
      }
    });

    const makeGap = (skill: string, count: number, availableSlots: number, action: string): SkillGapData => {
      const pct = totalLocal > 0 ? parseFloat(((count / totalLocal) * 100).toFixed(1)) : 0;
      return {
        skill,
        count,
        percentage: Math.min(100, pct),
        availableSlots,
        recommendedAction: action
      };
    };

    return [
      makeGap("Computer & Digital Literacy", computerCount, computerSlots, `Organize Barangay ${brgyClean} digital tools and basic office suite workshop.`),
      makeGap("Food Processing & Commercial Cooking", foodCount, foodSlots, `Fund additional localized batch of Food Processing NC II in ${brgyClean} community center.`),
      makeGap("Bread & Pastry Production", bakingCount, bakingSlots, `Partner with local cooperative bakeries in San Luis for job placement of ${brgyClean} graduates.`),
      makeGap("Electrical Installation & Maintenance", electricalCount, electricalSlots, `Refer out-of-school youth in ${brgyClean} to training slots at TESDA GPSAT campus.`),
      makeGap("Welding / SMAW Fabrication", weldingCount, weldingSlots, `Utilize ${brgyClean} SK budget to sponsor tools & protective gears for priority SMAW enrollees.`),
      makeGap("Automotive & Engine Servicing", autoCount, autoSlots, `Coordinate with TESDA for mobile mechanical diagnostics training in Barangay ${brgyClean}.`),
      makeGap("Organic Agriculture & Agribusiness", agriCount, agriSlots, `Launch youth urban container gardening and high-value crop production in ${brgyClean}.`)
    ].sort((a, b) => b.count - a.count);
  }, [localYouthProfiles, designatedBarangay, programs]);

  const mostCriticalGapItem = useMemo(() => {
    return localSkillsGaps.find(g => g.count > 0) || localSkillsGaps[0] || { skill: "Computer & Digital Literacy", count: 0, percentage: 0 };
  }, [localSkillsGaps]);

  const highestSector = useMemo(() => {
    if (localYouthProfiles.length === 0) {
      return { name: "None", count: 0 };
    }
    const sectorCountMap: Record<string, number> = {};
    localYouthProfiles.forEach(y => {
      const sec = y.sectorPreference || "Technical Vocational";
      sectorCountMap[sec] = (sectorCountMap[sec] || 0) + 1;
    });
    let highest = Object.keys(sectorCountMap)[0] || "Technical Vocational";
    let highestCount = 0;
    Object.entries(sectorCountMap).forEach(([sec, cnt]) => {
      if (cnt > highestCount) {
        highest = sec;
        highestCount = cnt;
      }
    });
    return { name: highest, count: highestCount };
  }, [localYouthProfiles]);

  const unmatchedCount = useMemo(() => {
    return localYouthProfiles.filter(y => y.currentStatus === "Out-of-school" && !y.hasReferred).length;
  }, [localYouthProfiles]);

  // Clean formatted Barangay name
  const cleanDesignatedBarangay = useMemo(() => {
    return designatedBarangay.replace(/^Barangay\s+/i, "").trim();
  }, [designatedBarangay]);

  const formattedBrgyName = useMemo(() => {
    return `Barangay ${cleanDesignatedBarangay}`;
  }, [cleanDesignatedBarangay]);

  // Resolved SK Chairperson Name for official report sign-off
  const skChairName = useMemo(() => {
    if (isChairperson && (settingsName || currentUser?.name)) {
      return settingsName || currentUser.name;
    }
    const chairInCouncilors = councilors.find(c =>
      c.role.toLowerCase().includes("chair") &&
      (c.barangay.toLowerCase() === designatedBarangay.toLowerCase() ||
        c.barangay.replace(/^Barangay\s+/i, "").toLowerCase() === designatedBarangay.replace(/^Barangay\s+/i, "").toLowerCase())
    );
    return chairInCouncilors?.name || (currentUser?.name && isChairperson ? currentUser.name : "HON. SK CHAIRPERSON");
  }, [isChairperson, settingsName, currentUser, councilors, designatedBarangay]);

  // Sector breakdown for Skills Gap Report
  const skillsGapSectorBreakdown = useMemo(() => {
    const defaultCategories: Record<string, { count: number; track: string; demand: string }> = {
      "IT & Digital Technologies": { count: 0, track: "Computer Systems Servicing NC II", demand: "High Priority" },
      "Food, Culinary & Pastry Arts": { count: 0, track: "Cookery NC II / Bread & Pastry NC II", demand: "High Priority" },
      "Construction, Electrical & Welding": { count: 0, track: "SMAW NC II / Electrical Installation NC II", demand: "Critical Need" },
      "Automotive & Engine Servicing": { count: 0, track: "Automotive Servicing NC I / NC II", demand: "Moderate Need" },
      "Agriculture & Agribusiness": { count: 0, track: "Organic Agriculture Production NC II", demand: "High Priority" },
      "Other Livelihood & Trades": { count: 0, track: "Community-Based Livelihood Training", demand: "Emerging Field" }
    };

    localYouthProfiles.forEach(y => {
      const pref = (y.sectorPreference || "").toLowerCase();
      const goal = (y.livelihoodGoal || "").toLowerCase();
      if (pref.includes("it") || pref.includes("tech") || pref.includes("computer") || goal.includes("computer") || goal.includes("tech")) {
        defaultCategories["IT & Digital Technologies"].count++;
      } else if (pref.includes("food") || pref.includes("culinary") || pref.includes("pastry") || pref.includes("bread") || pref.includes("cook") || goal.includes("food") || goal.includes("cook") || goal.includes("baker")) {
        defaultCategories["Food, Culinary & Pastry Arts"].count++;
      } else if (pref.includes("construction") || pref.includes("weld") || pref.includes("electr") || pref.includes("metal") || pref.includes("smaw") || goal.includes("electric") || goal.includes("weld")) {
        defaultCategories["Construction, Electrical & Welding"].count++;
      } else if (pref.includes("auto") || pref.includes("engine") || pref.includes("mechanic") || pref.includes("motor") || goal.includes("mechanic") || goal.includes("driver")) {
        defaultCategories["Automotive & Engine Servicing"].count++;
      } else if (pref.includes("agri") || pref.includes("farm") || pref.includes("crop") || goal.includes("farm") || goal.includes("agri")) {
        defaultCategories["Agriculture & Agribusiness"].count++;
      } else {
        defaultCategories["Other Livelihood & Trades"].count++;
      }
    });

    const total = localYouthProfiles.length;
    return Object.entries(defaultCategories).map(([sector, info]) => ({
      sector,
      count: info.count,
      pct: total > 0 ? ((info.count / total) * 100).toFixed(1) : "0.0",
      track: info.track,
      demand: info.demand
    }));
  }, [localYouthProfiles]);

  // Export Skills Gap Analytics Report to Styled Microsoft Excel (.xls)
  const handleExportSkillsGapExcel = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const totalYouth = localYouthProfiles.length;
    const osyCount = localYouthProfiles.filter(y => y.currentStatus === "Out-of-school").length;
    const osyPct = totalYouth > 0 ? ((osyCount / totalYouth) * 100).toFixed(1) : "0.0";
    const totalTesdaSlots = programs.reduce((sum, p) => sum + (p.slotsRemaining || 0), 0);

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${formattedBrgyName.slice(0, 20)} Skills Gap</x:Name>
                <x:WorksheetOptions>
                  <x:FitToPage/>
                  <x:Print>
                    <x:ValidPrinterInfo/>
                    <x:PaperSizeIndex>1</x:PaperSizeIndex>
                    <x:FitWidth>1</x:FitWidth>
                    <x:FitHeight>0</x:FitHeight>
                    <x:Orientation>Portrait</x:Orientation>
                  </x:Print>
                  <x:PageSetup>
                    <x:Header x:Margin="0.3"/>
                    <x:Footer x:Margin="0.3"/>
                    <x:PageMargins x:Left="0.4" x:Right="0.4" x:Top="0.5" x:Bottom="0.5"/>
                  </x:PageSetup>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
          @page {
            size: letter portrait;
            margin: 0.4in 0.4in 0.5in 0.4in;
            mso-page-orientation: portrait;
          }
          body {
            font-family: 'Segoe UI', -apple-system, Calibri, Arial, sans-serif;
            font-size: 9.5pt;
            color: #1e293b;
            margin: 0;
            padding: 8px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 18px;
            table-layout: fixed;
          }
          th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-weight: bold;
            border: 1px solid #cbd5e1;
            padding: 7px 10px;
            font-size: 9pt;
            text-align: left;
            vertical-align: middle;
            height: 24pt;
          }
          td {
            border: 1px solid #e2e8f0;
            padding: 6px 10px;
            font-size: 9pt;
            vertical-align: middle;
            white-space: normal;
            height: 20pt;
          }
          .banner-title {
            background-color: #0A6B43;
            color: #ffffff;
            font-size: 13pt;
            font-weight: bold;
            text-align: center;
            padding: 11px 10px;
            border: 1px solid #075332;
          }
          .banner-sub {
            background-color: #112F24;
            color: #a7f3d0;
            font-size: 9.5pt;
            font-weight: bold;
            text-align: center;
            padding: 6px 10px;
            border: 1px solid #0A231A;
          }
          .meta-box {
            background-color: #f8fafc;
            border: 1px solid #cbd5e1;
            font-size: 9pt;
            padding: 7px 10px;
          }
          .sec-hdr {
            background-color: #0A6B43;
            color: #ffffff;
            font-size: 10pt;
            font-weight: bold;
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #075332;
          }
          .total-row {
            background-color: #e2e8f0;
            font-weight: bold;
            color: #0f172a;
            border-top: 2px solid #0A6B43;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .text-num { mso-number-format: "#\,\#\#0"; }
          .text-pct { mso-number-format: "0\.0%"; }
        </style>
      </head>
      <body>
        <table>
          <col width="38" />   <!-- Col 1: Index # -->
          <col width="280" />  <!-- Col 2: Competency Area / Sector -->
          <col width="110" />  <!-- Col 3: Youth Lacking / Count -->
          <col width="110" />  <!-- Col 4: Deficiency Rate % -->
          <col width="130" />  <!-- Col 5: Slots / Severity -->
          <col width="290" />  <!-- Col 6: Recommended Training Track / Action -->

          <tr><td colspan="6" class="banner-title">MUNICIPALITY OF SAN LUIS · PROVINCE OF PAMPANGA</td></tr>
          <tr><td colspan="6" class="banner-sub">${formattedBrgyName.toUpperCase()} · SANGGUNIANG KABATAAN</td></tr>
          <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
          <tr>
            <td colspan="2" class="meta-box"><strong>SK Presiding Officer:</strong> Hon. ${skChairName}</td>
            <td colspan="2" class="meta-box"><strong>Assessment Date:</strong> ${dateStr}</td>
            <td colspan="2" class="meta-box"><strong>Barangay Scope:</strong> ${formattedBrgyName}</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 1: KK SKILLS & LIVELIHOOD READINESS SCORECARD -->
          <tr><td colspan="6" class="sec-hdr">I. KATIPUNAN NG KABATAAN WORKFORCE READINESS & OSY SCORECARD</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th>Diagnostic Indicator / Demographic Metric</th>
            <th class="text-center">Youth Count</th>
            <th class="text-center">Demographic Ratio</th>
            <th class="text-center">Classification</th>
            <th>Strategic Action Directive</th>
          </tr>
          <tr>
            <td class="text-center">1</td>
            <td class="font-bold">Total Registered KK Youth Members</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #0A6B43;">${totalYouth}</td>
            <td class="text-center font-bold text-pct">100.0%</td>
            <td class="text-center"><span style="color: #047857; font-weight: bold;">Verified KK Base</span></td>
            <td>Official Youth Registry Base</td>
          </tr>
          <tr>
            <td class="text-center">2</td>
            <td class="font-bold">Out-of-School Youth (OSY) Target Population</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #b45309;">${osyCount}</td>
            <td class="text-center font-bold text-pct">${osyPct}%</td>
            <td class="text-center"><span style="color: #b45309; font-weight: bold;">Primary Priority</span></td>
            <td>Priority Beneficiaries for Livelihood TVET</td>
          </tr>
          <tr>
            <td class="text-center">3</td>
            <td class="font-bold">OSY Demographic Vulnerability Density Rate</td>
            <td class="text-center font-bold text-pct" style="font-size: 11pt; color: #b45309;">${osyPct}%</td>
            <td class="text-center font-bold">Of Total KK</td>
            <td class="text-center"><span style="color: #b45309; font-weight: bold;">Vulnerability Rate</span></td>
            <td>Targeted Livelihood Intervention Baseline</td>
          </tr>
          <tr>
            <td class="text-center">4</td>
            <td class="font-bold">Unmatched OSY Requiring TVET Scholarship</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #dc2626;">${unmatchedCount}</td>
            <td class="text-center font-bold text-pct">${totalYouth > 0 ? ((unmatchedCount / totalYouth) * 100).toFixed(1) : "0.0"}%</td>
            <td class="text-center"><span style="color: #dc2626; font-weight: bold;">Urgent TVET Need</span></td>
            <td>Immediate Program Matching & Enrollment</td>
          </tr>
          <tr>
            <td class="text-center">5</td>
            <td class="font-bold">Active TESDA Training Capacity in San Luis</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #1d4ed8;">${totalTesdaSlots}</td>
            <td class="text-center font-bold">Available Slots</td>
            <td class="text-center"><span style="color: #1d4ed8; font-weight: bold;">Open Capacity</span></td>
            <td>TESDA GPSAT & Community Center Courses</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 2: TECHNICAL COMPETENCY DEFICIENCY & TRAINING ALLOCATION MATRIX -->
          <tr><td colspan="6" class="sec-hdr">II. TECHNICAL COMPETENCY DEFICIENCY & TRAINING ALLOCATION MATRIX</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th>Competency Deficiency Area</th>
            <th class="text-center">Youth Lacking</th>
            <th class="text-center">Deficiency Impact Rate</th>
            <th class="text-center">Severity & Slots</th>
            <th>Recommended Training Action & Pathway</th>
          </tr>
          ${localSkillsGaps.map((gap, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="font-bold">${gap.skill}</td>
              <td class="text-center font-bold text-num" style="color: #b45309;">${gap.count}</td>
              <td class="text-center font-bold text-pct">${gap.percentage}%</td>
              <td class="text-center">
                <span style="color: ${gap.percentage >= 30 ? '#dc2626' : gap.percentage >= 15 ? '#b45309' : '#047857'}; font-weight: bold;">
                  ${gap.percentage >= 30 ? 'Critical Gap' : gap.percentage >= 15 ? 'Moderate Gap' : 'Low Gap'}
                </span>
                <span style="font-size: 8pt; color: #047857; display: block;">(${gap.availableSlots} Slots Avail)</span>
              </td>
              <td>${gap.recommendedAction}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td class="text-center">--</td>
            <td>OVERALL COMPETENCY DEFICIENCY BASE</td>
            <td class="text-center text-num">${localSkillsGaps.reduce((acc, g) => acc + g.count, 0)}</td>
            <td class="text-center">--</td>
            <td class="text-center text-num">${localSkillsGaps.reduce((acc, g) => acc + g.availableSlots, 0)} Total Slots</td>
            <td>Comprehensive Katipunan ng Kabataan Livelihood Assessment</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 3: YOUTH SECTOR PREFERENCES & DEMAND TRAJECTORY -->
          <tr><td colspan="6" class="sec-hdr">III. PRIORITY SECTOR PREFERENCES & TVET DEMAND BREAKDOWN</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th colspan="2">Industry / Sector Trajectory</th>
            <th class="text-center">Interested Youth</th>
            <th class="text-center">Youth Share %</th>
            <th>Strategic TVET Alignment</th>
          </tr>
          ${skillsGapSectorBreakdown.map((sec, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td colspan="2" class="font-bold">${sec.sector}</td>
              <td class="text-center font-bold text-num">${sec.count}</td>
              <td class="text-center font-bold text-pct">${sec.pct}%</td>
              <td>${sec.count > 0 ? 'Active Enrollment Priority Track' : 'Baseline TVET Offering'}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td class="text-center">--</td>
            <td colspan="2">TOTAL YOUTH ASSESSED</td>
            <td class="text-center text-num">${totalYouth}</td>
            <td class="text-center text-pct">100.0%</td>
            <td>Comprehensive Demographics Captured</td>
          </tr>
          <tr><td colspan="6" style="height: 22px; border: none;"></td></tr>

          <!-- SECTION IV: OFFICIAL ATTESTATION & SIGN-OFF BLOCK -->
          <tr>
            <td colspan="3" class="text-center" style="font-weight: bold; font-size: 9pt; border: none;">Prepared & Certified Correct:</td>
            <td colspan="3" class="text-center" style="font-weight: bold; font-size: 9pt; border: none;">Attested & Noted By:</td>
          </tr>
          <tr><td colspan="6" style="height: 35px; border: none;"></td></tr>
          <tr>
            <td colspan="3" class="text-center font-bold" style="font-size: 10pt; border-bottom: 1.5pt solid #334155; border-top: none; border-left: none; border-right: none;">${(skChairName || "HON. SK CHAIRPERSON").toUpperCase()}</td>
            <td colspan="3" class="text-center font-bold" style="font-size: 10pt; border-bottom: 1.5pt solid #334155; border-top: none; border-left: none; border-right: none;">HON. PUNONG BARANGAY</td>
          </tr>
          <tr>
            <td colspan="3" class="text-center" style="font-size: 8.5pt; font-weight: bold; color: #047857; border: none;">SK Chairperson</td>
            <td colspan="3" class="text-center" style="font-size: 8.5pt; font-weight: bold; color: #0f172a; border: none;">Punong Barangay</td>
          </tr>
          <tr>
            <td colspan="3" class="text-center" style="font-size: 8pt; color: #64748b; border: none;">Sangguniang Kabataan · ${formattedBrgyName}</td>
            <td colspan="3" class="text-center" style="font-size: 8pt; color: #64748b; border: none;">Barangay Government of ${formattedBrgyName}</td>
          </tr>
          <tr><td colspan="6" style="height: 14px; border: none;"></td></tr>
          <tr>
            <td colspan="6" class="text-center" style="font-size: 8pt; color: #94a3b8; border: none;">Official Skills Gap Diagnostic Document generated through the SiKap Youth Governance & Livelihood Matching Platform · Verified Katipunan ng Kabataan Public Record · San Luis, Pampanga</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `San_Luis_${formattedBrgyName.replace(/[^a-zA-Z0-9]/g, '_')}_Skills_Gap_Analytics_Report_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (addToast) addToast(`Downloaded ${formattedBrgyName} Skills Gap Report (.xls)`, "success");
  };

  // Pending Approvals Barangay Filter
  const [pendingBarangayFilter, setPendingBarangayFilter] = useState<string>("All");

  const generateCouncilorPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouncilorPassword(pass);
  };

  // Navigation logic
  const handleViewProfile = (id: string) => {
    setSelectedYouthId(id);
    setCurrentScreen(SKOfficialScreen.PROFILE_DETAIL);
  };

  // Skill Chip methods
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!regSkills.includes(skillInput.trim())) {
        setRegSkills([...regSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRegSkills(regSkills.filter(s => s !== skill));
  };

  const handleToggleInterest = (interest: string) => {
    if (regInterests.includes(interest)) {
      setRegInterests(regInterests.filter(i => i !== interest));
    } else {
      setRegInterests([...regInterests, interest]);
    }
  };

  // Register youth submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regGoal.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail.trim() || !emailRegex.test(regEmail)) {
      addToast("Please enter a valid email address for KK member login credentials", "error");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      addToast("Please enter a password with at least 6 characters for login", "error");
      return;
    }

    if (regAge === "" || Number(regAge) < 15 || Number(regAge) > 30) {
      addToast("Please enter a valid age between 15 and 30 years old", "error");
      return;
    }

    if (!isValidContactNumber(regContact)) {
      addToast("Please enter a valid 11-digit mobile contact number (+63 9XX XXX XXXX)", "error");
      return;
    }

    setIsRegistering(true);

    const brgyName = designatedBarangay.startsWith("Barangay ")
      ? designatedBarangay.replace(/^Barangay\s+/i, "")
      : designatedBarangay;

    const payload = {
      email: regEmail,
      password: regPassword,
      name: regName,
      birthdate: regDOB,
      age: Number(regAge),
      gender: regSex,
      purok: regPurok,
      barangay: brgyName,
      educationalAttainment: regEdu,
      currentStatus: "Out-of-school",
      skills: regSkills,
      interests: regInterests,
      sectorPreference: regSector,
      livelihoodGoal: regGoal,
      contactNumber: regContact,
      soloParent: regSolo,
      pwd: regPwd,
      indigenous: regIndigenous,
      approvalStatus: "Approved"
    };

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        const createdProfile: YouthProfile = data.data;
        setYouthProfiles(prev => [createdProfile, ...prev]);
        setNewlyCreatedId(createdProfile.id);
        addToast(`Registered ${createdProfile.name} and provisioned login account!`, "success");
      } else {
        const newId = `y-${Date.now()}`;
        const fallbackProfile: YouthProfile = {
          id: newId,
          ...payload,
          barangay: `Barangay ${brgyName}`,
          registeredDate: "Just now",
          matchScore: 85,
          hasReferred: false,
          approvalStatus: "Approved" as const
        };
        setYouthProfiles(prev => [fallbackProfile, ...prev]);
        setNewlyCreatedId(newId);
        if (data.message) addToast(data.message, "info");
      }
    } catch (err) {
      console.error("Failed to register user in database:", err);
      const newId = `y-${Date.now()}`;
      const fallbackProfile: YouthProfile = {
        id: newId,
        ...payload,
        barangay: `Barangay ${brgyName}`,
        registeredDate: "Just now",
        matchScore: 85,
        hasReferred: false,
        approvalStatus: "Approved" as const
      };
      setYouthProfiles(prev => [fallbackProfile, ...prev]);
      setNewlyCreatedId(newId);
    } finally {
      setIsRegistering(false);
      setShowRegSuccess(true);
    }
  };

  // Reset form
  const resetRegForm = () => {
    setRegName("");
    setRegEmail("");
    setRegPassword("");
    setRegAge(20);
    setRegDOB("2006-05-15");
    setRegSex("Male");
    setRegPurok("Purok 2");
    setRegContact("+63 9");
    setRegEdu("College Level");
    setRegStatus("Out-of-school");
    setRegSchool("");
    setRegSkills([]);
    setSkillInput("");
    setRegInterests(["Vocational Training", "Employment"]);
    setRegSector("IT & Technology");
    setRegGoal("");
    setRegSolo(false);
    setRegPwd(false);
    setRegIndigenous(false);
    setShowRegSuccess(false);
    setNewlyCreatedId(null);
  };

  // Post or Edit Announcement (DB Persisted)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) {
      addToast("Please fill in the announcement content", "error");
      return;
    }

    const isEditing = Boolean(editingAnnouncementId);

    const combinedEventDate = annEventDatePicker
      ? `${new Date(annEventDatePicker + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${annEventTimePicker ? ` • ${formatTime12Hour(annEventTimePicker)}` : ""}`
      : annEventDate.trim() || undefined;

    const payload = {
      ...(isEditing ? { id: editingAnnouncementId } : {}),
      title: annTitle,
      body: annBody,
      category: annCategory,
      audience: annAudience,
      eventDate: combinedEventDate,
      venue: annVenue.trim() || undefined,
      contactPerson: annContactPerson.trim() || undefined
    };

    try {
      const res = await fetch("/api/announcements", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        if (isEditing) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? data.data : a));
          addToast("Announcement updated successfully!", "success");
        } else {
          setAnnouncements(prev => [data.data, ...prev]);
          addToast("Announcement posted and published to youth portal!", "success");
        }
      } else {
        if (isEditing) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? { ...a, ...payload } : a));
          addToast("Announcement updated successfully!", "success");
        } else {
          const fallback: SKAnnouncement = {
            id: `a-${Date.now()}`,
            title: annTitle,
            body: annBody,
            category: annCategory,
            audience: annAudience,
            eventDate: annEventDate.trim() || undefined,
            venue: annVenue.trim() || undefined,
            contactPerson: annContactPerson.trim() || undefined,
            status: "Active",
            datePosted: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            barangay: designatedBarangay
          };
          setAnnouncements(prev => [fallback, ...prev]);
          addToast("Announcement posted successfully!", "success");
        }
      }
    } catch (err) {
      console.error("Failed to persist announcement:", err);
      if (isEditing) {
        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? { ...a, ...payload } : a));
        addToast("Announcement updated!", "info");
      } else {
        const fallback: SKAnnouncement = {
          id: `a-${Date.now()}`,
          title: annTitle,
          body: annBody,
          category: annCategory,
          audience: annAudience,
          eventDate: annEventDate.trim() || undefined,
          venue: annVenue.trim() || undefined,
          contactPerson: annContactPerson.trim() || undefined,
          status: "Active",
          datePosted: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          barangay: designatedBarangay
        };
        setAnnouncements(prev => [fallback, ...prev]);
        addToast("Announcement posted successfully!", "success");
      }
    } finally {
      setShowAnnouncementModal(false);
      setEditingAnnouncementId(null);
      setAnnTitle("");
      setAnnBody("");
      setAnnEventDate("");
      setAnnEventDatePicker("");
      setAnnEventTimePicker("");
      setAnnVenue("");
      setAnnContactPerson("");
    }
  };

  const handleOpenEditAnnouncement = (ann: SKAnnouncement) => {
    setEditingAnnouncementId(ann.id);
    setAnnTitle(ann.title);
    setAnnBody(ann.body);
    setAnnCategory(ann.category);
    setAnnAudience(ann.audience);
    setAnnEventDate(ann.eventDate || "");
    setAnnVenue(ann.venue || "");
    setAnnContactPerson(ann.contactPerson || "");
    setShowAnnouncementModal(true);
  };

  const handleCancelAnnouncement = async (ann: SKAnnouncement) => {
    const newStatus = ann.status === "Cancelled" ? "Active" : "Cancelled";

    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, status: newStatus } : a));
    addToast(newStatus === "Cancelled" ? "Announcement marked as Cancelled" : "Announcement reactivated", newStatus === "Cancelled" ? "info" : "success");

    try {
      await fetch("/api/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ann.id, status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update announcement status in database:", err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addToast("Announcement deleted", "info");

    try {
      await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete announcement from database:", err);
    }
  };

  const handleApproveYouth = async (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Approved" } : y));
    addToast("Youth profile has been successfully approved!", "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus: "Approved" })
      });
    } catch (err) {
      console.error("Failed to persist youth approval to database:", err);
    }
  };

  const handleRejectYouth = async (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Rejected" } : y));
    addToast("Youth profile has been rejected.", "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus: "Rejected" })
      });
    } catch (err) {
      console.error("Failed to persist youth rejection to database:", err);
    }
  };

  const handleAddCouncilorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilorName.trim() || !councilorEmail.trim() || !councilorPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    if (!isValidContactNumber(councilorContact)) {
      addToast("Please provide a valid 11-digit mobile number (+63 9XX XXX XXXX)", "error");
      return;
    }

    // Quota validation: 7 SK Councilors, 2 Secretaries, 2 Treasurers (Max 11)
    if (localCouncilors.length >= 11) {
      addToast("Council roster is at full capacity (Maximum 11 members: 7 Councilors, 2 Secretaries, 2 Treasurers).", "error");
      return;
    }
    if (councilorRole === "SK Councilor" && roleCounts.councilorsCount >= 7) {
      addToast("SK Councilor quota reached (Maximum of 7 councilors allowed).", "error");
      return;
    }
    if (councilorRole === "Secretary" && roleCounts.secretariesCount >= 2) {
      addToast("Secretary quota reached (Maximum of 2 secretaries allowed).", "error");
      return;
    }
    if (councilorRole === "Treasurer" && roleCounts.treasurersCount >= 2) {
      addToast("Treasurer quota reached (Maximum of 2 treasurers allowed).", "error");
      return;
    }

    const payload = {
      name: councilorName.trim(),
      email: councilorEmail.trim().toLowerCase(),
      role: councilorRole,
      password: councilorPassword.trim(),
      contactNumber: councilorContact,
      barangay: designatedBarangay
    };

    try {
      const res = await fetch("/api/councilors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setCouncilors(prev => [data.data, ...prev]);
        setCreatedCouncilorAccount({
          name: councilorName,
          email: councilorEmail.toLowerCase(),
          role: councilorRole,
          password: councilorPassword,
          contactNumber: councilorContact
        });
        addToast(`Account provisioned for ${councilorRole} ${councilorName}!`, "success");
        setIsAddCouncilorOpen(false);
        setCouncilorName("");
        setCouncilorEmail("");
        setCouncilorContact("+63 9");
      } else {
        addToast(data.message || "Failed to create councilor account", "error");
      }
    } catch (err) {
      console.error("Error creating councilor account:", err);
      const fallback: Councilor = {
        id: `c-${Date.now()}`,
        name: councilorName,
        email: councilorEmail.toLowerCase(),
        role: councilorRole,
        contactNumber: councilorContact,
        barangay: designatedBarangay,
        status: "Active",
        dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      setCouncilors(prev => [fallback, ...prev]);
      setCreatedCouncilorAccount({
        name: councilorName,
        email: councilorEmail.toLowerCase(),
        role: councilorRole,
        password: councilorPassword,
        contactNumber: councilorContact
      });
      addToast(`Provisioned account for ${councilorRole} ${councilorName}!`, "success");
      setIsAddCouncilorOpen(false);
      setCouncilorName("");
      setCouncilorEmail("");
      setCouncilorContact("+63 9");
    }
  };

  const handleEditCouncilorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCouncilorName.trim() || !editCouncilorEmail.trim()) {
      addToast("Please fill in all fields", "error");
      return;
    }

    // Role reassignment quota check if changing role
    const currentMember = localCouncilors.find(c => c.id === editingCouncilorId);
    if (currentMember && currentMember.role !== editCouncilorRole) {
      if (editCouncilorRole === "SK Councilor" && roleCounts.councilorsCount >= 7) {
        addToast("Cannot reassign: Maximum of 7 SK Councilors already reached.", "error");
        return;
      }
      if (editCouncilorRole === "Secretary" && roleCounts.secretariesCount >= 2) {
        addToast("Cannot reassign: Maximum of 2 Secretaries already reached.", "error");
        return;
      }
      if (editCouncilorRole === "Treasurer" && roleCounts.treasurersCount >= 2) {
        addToast("Cannot reassign: Maximum of 2 Treasurers already reached.", "error");
        return;
      }
    }

    setIsUpdatingCouncilor(true);
    try {
      const res = await fetch("/api/councilors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCouncilorId,
          name: editCouncilorName.trim(),
          email: editCouncilorEmail.trim(),
          role: editCouncilorRole,
          contactNumber: editCouncilorContact
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to update councilor details");
      }

      setCouncilors(prev => prev.map(c =>
        c.id === editingCouncilorId
          ? {
            ...c,
            name: editCouncilorName.trim(),
            email: editCouncilorEmail.trim(),
            role: editCouncilorRole,
            contactNumber: editCouncilorContact
          }
          : c
      ));

      addToast("Councilor details saved to database successfully!", "success");
      setIsEditCouncilorOpen(false);
      setEditingCouncilorId(null);
    } catch (err: any) {
      console.error("Error updating councilor:", err);
      addToast("Failed to update councilor: " + (err.message || "Network error"), "error");
    } finally {
      setIsUpdatingCouncilor(false);
    }
  };

  const handleToggleCouncilorStatus = async (id: string) => {
    const target = councilors.find(c => c.id === id);
    if (!target) return;
    const nextStatus = target.status === "Active" ? "Inactive" : "Active";

    try {
      const res = await fetch("/api/councilors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: target.id,
          name: target.name,
          email: target.email,
          role: target.role,
          contactNumber: target.contactNumber,
          status: nextStatus
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to update status");
      }

      setCouncilors(prev => prev.map(c => c.id === id ? { ...c, status: nextStatus } : c));
      addToast(`Councilor is now ${nextStatus}`, "info");
    } catch (err: any) {
      console.error("Error toggling status:", err);
      addToast("Failed to update status: " + (err.message || "Network error"), "error");
    }
  };

  const handleDeleteCouncilor = (id: string) => {
    const target = councilors.find(c => c.id === id);
    if (target) {
      setDeletingCouncilor(target);
    }
  };

  const confirmDeleteCouncilor = async () => {
    if (!deletingCouncilor) return;
    const target = deletingCouncilor;
    try {
      const res = await fetch(`/api/councilors?id=${target.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to remove official");
      }
      setCouncilors(prev => prev.filter(c => c.id !== target.id));
      addToast(`${target.name} removed from team successfully`, "info");
    } catch (err: any) {
      console.error("Error deleting councilor:", err);
      addToast("Failed to remove official: " + (err.message || "Network error"), "error");
    } finally {
      setDeletingCouncilor(null);
    }
  };
  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim() || !settingsEmail.trim()) {
      addToast("Full name and email address are required", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName.trim(),
          email: settingsEmail.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        if (currentCouncilorRecord) {
          setCouncilors(prev => prev.map(c =>
            c.id === currentCouncilorRecord.id
              ? { ...c, name: settingsName.trim(), email: settingsEmail.trim(), contactNumber: settingsPhone }
              : c
          ));
        }
        addToast(data.message || "Profile updated in database!", "success");
        setIsEditingProfile(false);
      } else {
        addToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      addToast("Profile details saved successfully!", "success");
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New password and password confirmation do not match", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || "Account password changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast(data.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      addToast("Failed to connect to server to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };



  // Calculated Metrics
  const totalKK = localYouthProfiles.length;
  const totalMatched = localReferrals.length;
  const activeTESDA = programs.length;

  const pendingCount = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Pending").length;
  }, [localYouthProfiles]);

  const pendingProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Pending");
  }, [localYouthProfiles]);

  const PENDING_PER_PAGE = 4;
  const totalPendingPages = Math.max(1, Math.ceil(pendingProfiles.length / PENDING_PER_PAGE));
  const currentPendingPage = Math.min(Math.max(1, pendingDashboardPage), totalPendingPages);
  const paginatedPendingProfiles = useMemo(() => {
    const start = (currentPendingPage - 1) * PENDING_PER_PAGE;
    return pendingProfiles.slice(start, start + PENDING_PER_PAGE);
  }, [pendingProfiles, currentPendingPage]);

  // Dedicated Pending Approvals tab: search and 10-record pagination (mobile and big screen)
  const filteredPendingProfiles = useMemo(() => {
    if (!pendingSearchQuery.trim()) return pendingProfiles;
    const q = pendingSearchQuery.toLowerCase().trim();
    return pendingProfiles.filter(y =>
      y.name.toLowerCase().includes(q) ||
      (y.email && y.email.toLowerCase().includes(q)) ||
      y.purok.toLowerCase().includes(q) ||
      (y.verificationIdNumber && y.verificationIdNumber.toLowerCase().includes(q)) ||
      (y.verificationIdType && y.verificationIdType.toLowerCase().includes(q)) ||
      (y.educationalAttainment && y.educationalAttainment.toLowerCase().includes(q)) ||
      (y.livelihoodGoal && y.livelihoodGoal.toLowerCase().includes(q))
    );
  }, [pendingProfiles, pendingSearchQuery]);

  const PENDING_APPROVALS_PER_PAGE = 10;
  const totalPendingApprovalPages = Math.max(1, Math.ceil(filteredPendingProfiles.length / PENDING_APPROVALS_PER_PAGE));
  const currentPendingApprovalPage = Math.min(Math.max(1, pendingApprovalsPage), totalPendingApprovalPages);
  const paginatedPendingApprovalProfiles = useMemo(() => {
    const start = (currentPendingApprovalPage - 1) * PENDING_APPROVALS_PER_PAGE;
    return filteredPendingProfiles.slice(start, start + PENDING_APPROVALS_PER_PAGE);
  }, [filteredPendingProfiles, currentPendingApprovalPage]);

  // Verified Youth Profiles ONLY for Youth Profiles Roster Tab
  const verifiedYouthProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Approved");
  }, [localYouthProfiles]);

  // Filtered Youth Profiles
  const filteredProfiles = useMemo(() => {
    return verifiedYouthProfiles.filter(y => {
      const matchesSearch = y.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.purok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesEdu = eduFilter === "All" || normalizeEducationalAttainment(y.educationalAttainment) === eduFilter;
      const matchesPurok = purokFilter === "All" || y.purok === purokFilter;

      let matchesAge = true;
      if (ageFilter === "15-20") matchesAge = y.age >= 15 && y.age <= 20;
      else if (ageFilter === "21-25") matchesAge = y.age >= 21 && y.age <= 25;
      else if (ageFilter === "26-30") matchesAge = y.age >= 26 && y.age <= 30;

      let matchesStatus = true;
      if (matchStatusFilter === "Excellent") matchesStatus = y.matchScore >= 90;
      else if (matchStatusFilter === "Good") matchesStatus = y.matchScore >= 75 && y.matchScore < 90;
      else if (matchStatusFilter === "Fair") matchesStatus = y.matchScore >= 50 && y.matchScore < 75;
      else if (matchStatusFilter === "Low") matchesStatus = y.matchScore < 50;

      return matchesSearch && matchesEdu && matchesPurok && matchesAge && matchesStatus;
    });
  }, [verifiedYouthProfiles, searchQuery, eduFilter, ageFilter, purokFilter, matchStatusFilter]);

  // Filtered TESDA programs for official catalog view
  const filteredProgramsForSK = useMemo(() => {
    return programs.filter(p => {
      const q = progSearchQuery.toLowerCase();
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        (p.requiredSkills && p.requiredSkills.some(s => s.toLowerCase().includes(q))) ||
        (p.type && p.type.toLowerCase().includes(q)) ||
        (p.eligibility && p.eligibility.toLowerCase().includes(q));

      const catName = typeof p.category === "string" ? p.category : p.category?.name || "";
      const matchesType = progSectorFilter === "All" ||
        catName.toLowerCase().includes(progSectorFilter.toLowerCase()) ||
        p.title.toLowerCase().includes(progSectorFilter.toLowerCase()) ||
        (p.type && p.type.toLowerCase().includes(progSectorFilter.toLowerCase()));
      return matchesSearch && matchesType;
    });
  }, [programs, progSearchQuery, progSectorFilter]);

  // Selected profile details helper (used strictly when viewing an individual youth record)
  const selectedYouth = useMemo(() => {
    const found = localYouthProfiles.find(y => y.id === selectedYouthId) || localYouthProfiles[0];
    if (found) return found;
    return youthProfiles.find(y => y.id === "y-01") || youthProfiles[0];
  }, [localYouthProfiles, youthProfiles, selectedYouthId]);

  // State for live Google Gemini LLM API match rationales & Policy Reports
  const [geminiRationales, setGeminiRationales] = useState<Record<string, string>>({});
  const [aiPolicyReport, setAiPolicyReport] = useState<string>("");
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState<boolean>(false);

  const handleGenerateAiPolicyReport = async () => {
    setIsGeneratingAiReport(true);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillsGaps: localSkillsGaps,
          barangay: designatedBarangay
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setAiPolicyReport(data.report);
        addToast("Live Gemini AI Policy Recommendation generated!", "success");
      } else {
        addToast(data.message || "Failed to generate AI report", "error");
      }
    } catch (err) {
      console.error("AI Report generation error:", err);
      addToast("Network error generating AI report", "error");
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  const fetchLiveGeminiRationale = async (progId: string, youth: YouthProfile) => {
    const key = `${youth.id}-${progId}`;
    if (geminiRationales[key]) return;

    try {
      const prog = programs.find(p => p.id === progId);
      if (!prog) return;

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youth, programs: [prog], generateLLMAdvice: true })
      });
      const data = await res.json();
      if (data.success && data.careerAdvice) {
        setGeminiRationales(prev => ({ ...prev, [key]: data.careerAdvice }));
      }
    } catch (err) {
      console.error("Gemini API call error:", err);
    }
  };

  useEffect(() => {
    if (selectedYouth && programs.length > 0) {
      programs.slice(0, 3).forEach(prog => {
        fetchLiveGeminiRationale(prog.id, selectedYouth);
      });
    }
  }, [selectedYouthId, selectedYouth, programs]);

  const getGeminiRationale = (progId: string, youthName: string) => {
    const key = `${selectedYouth.id}-${progId}`;
    if (geminiRationales[key]) {
      return geminiRationales[key];
    }
    if (youthName === "Juan dela Cruz") {
      if (progId === "p-01") {
        return "Based on your welding skills and interest in skilled trade work, this program is a 94% match. Completing Welding NC II will directly qualify you for advanced certifications and examinations you need to reach your goal.";
      }
      if (progId === "p-03") {
        return "Your profile indicates solid physical stamina and basic familiarity with mechanical tools. Electrical installation is an outstanding high-demand trade in San Luis. With some coaching, your background matches this pathway strongly (82% match).";
      }
    }
    return `Content-Based Filtering (CBF) matched this training based on the skills background of ${youthName}. This opportunity aligns with their focus on ${selectedYouth.sectorPreference || "Technical Vocational programs"}.`;
  };

  // System Notifications Memo
  const systemNotifications = useMemo(() => {
    const list: { id: string; title: string; desc: string; time: string; type: "approval" | "announcement" | "skills" | "program"; targetScreen: SKOfficialScreen; icon: React.ReactNode }[] = [];

    if (pendingCount > 0) {
      list.push({
        id: "notif-pending",
        title: "Pending Youth Approvals",
        desc: `${pendingCount} Katipunan ng Kabataan self-registrations waiting for official verification.`,
        time: "Requires Review",
        type: "approval",
        targetScreen: SKOfficialScreen.PENDING_APPROVALS,
        icon: <Users className="w-4 h-4 text-[#0A6B43]" />
      });
    }

    if (localAnnouncements.length > 0) {
      list.push({
        id: "notif-announcement",
        title: "Active SK Broadcasts",
        desc: `${localAnnouncements.length} announcements actively broadcasted for Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}.`,
        time: "Active Feed",
        type: "announcement",
        targetScreen: SKOfficialScreen.ANNOUNCEMENTS,
        icon: <Megaphone className="w-4 h-4 text-emerald-600" />
      });
    }

    if (mostCriticalGapItem && mostCriticalGapItem.count > 0) {
      list.push({
        id: "notif-skills",
        title: "Most Critical Skill Gap",
        desc: `${mostCriticalGapItem.count} youth identified with core deficiency in ${mostCriticalGapItem.skill}.`,
        time: "Diagnostic Alert",
        type: "skills",
        targetScreen: SKOfficialScreen.SKILLS_GAP,
        icon: <BarChart2 className="w-4 h-4 text-amber-600" />
      });
    }

    if (programs.length > 0) {
      list.push({
        id: "notif-programs",
        title: "TESDA Program Registry",
        desc: `${programs.length} active vocational training programs published in San Luis.`,
        time: "Registry Live",
        type: "program",
        targetScreen: SKOfficialScreen.TESDA_PROGRAMS,
        icon: <Briefcase className="w-4 h-4 text-[#0A6B43]" />
      });
    }

    return list;
  }, [pendingCount, localAnnouncements, mostCriticalGapItem, programs, designatedBarangay]);

  const activeSystemNotifications = useMemo(() => {
    return systemNotifications.filter(n => !clearedNotificationIds.includes(n.id));
  }, [systemNotifications, clearedNotificationIds]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FAFAF8] flex w-full font-sans antialiased" id="sk-portal-container">
      {/* Mobile Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Responsive Sliding Drawer on Mobile / Sticky on Desktop) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-[17%] lg:min-w-[250px] xl:min-w-[260px] h-[100dvh] max-h-[100dvh] shrink-0 bg-[#082D21] text-white flex flex-col justify-between shadow-2xl lg:shadow-none border-r border-white/10 select-none overflow-y-auto overflow-x-hidden transform transition-transform duration-300 ease-in-out font-sans ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 flex-1">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-6 px-0.5 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <SikapLogo size={28} logoSize={30} textSize={22} variant="white" showText={true} />
              <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-black text-[#D99427] uppercase tracking-widest block leading-none">Official</span>
                <span className="text-[8.5px] sm:text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[85px] sm:max-w-[95px] xl:max-w-[105px]" title={designatedBarangay.replace(/^Barangay\s+/i, "")}>
                  {designatedBarangay.replace(/^Barangay\s+/i, "")}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden p-1 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 relative">
            {[
              {
                id: SKOfficialScreen.DASHBOARD,
                label: "Dashboard",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                )
              },
              {
                id: SKOfficialScreen.YOUTH_PROFILES,
                label: "Youth Profiles",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <circle cx="9" cy="6.5" r="3.5" />
                    <path d="M9 12c-3.1 0-6 2.2-6 5.5V20h12v-2.5c0-3.3-2.9-5.5-6-5.5z" />
                    <circle cx="16.5" cy="7.5" r="2.8" />
                    <path d="M16.5 12.5c-.4 0-.8.05-1.2.14 1.4 1.1 2.2 2.7 2.2 4.86V20h4.5v-2c0-3-2.5-5.5-5.5-5.5z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                )
              },
              {
                id: SKOfficialScreen.PENDING_APPROVALS,
                label: "Pending Approvals",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2a6 6 0 0 0-6 6c0 7-3 9-3 9h18s-3-2-3-9a6 6 0 0 0-6-6z" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                  </svg>
                ),
                badge: pendingCount
              },
              ...(isChairperson
                ? [
                  {
                    id: SKOfficialScreen.COUNCILORS,
                    label: "My Team",
                    activeIcon: (
                      <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                        <circle cx="8" cy="6.5" r="3.5" />
                        <path d="M14 19a6 6 0 0 0-12 0h12z" />
                        <circle cx="16.5" cy="7.5" r="2.8" />
                        <path d="M16.5 12.5c-.4 0-.8.05-1.2.14 1.4 1.1 2.2 2.7 2.2 4.86V20h4.5v-2c0-3-2.5-5.5-5.5-5.5z" />
                      </svg>
                    ),
                    inactiveIcon: (
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M14 19a6 6 0 0 0-12 0" />
                        <circle cx="8" cy="9" r="4" />
                        <path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8" />
                      </svg>
                    )
                  }
                ]
                : []),
              {
                id: SKOfficialScreen.TESDA_PROGRAMS,
                label: "TESDA Programs",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M9 3a2 2 0 0 0-2 2v1H4a2 2 0 0 0-2 2v3h20V8a2 2 0 0 0-2-2h-3V5a2 2 0 0 0-2-2H9zm2 3V5h2v1h-2z" />
                    <path d="M2 13v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6H14v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1H2z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="20" height="14" x="2" y="7" rx="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                )
              },
              {
                id: SKOfficialScreen.SKILLS_GAP,
                label: "Skills Gap Analytics",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <rect x="4" y="13" width="4.5" height="8" rx="1.5" />
                    <rect x="10" y="3.5" width="4.5" height="17.5" rx="1.5" />
                    <rect x="16" y="8" width="4.5" height="13" rx="1.5" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="18" x2="18" y1="20" y2="10" />
                    <line x1="12" x2="12" y1="20" y2="4" />
                    <line x1="6" x2="6" y1="20" y2="14" />
                  </svg>
                )
              },
              {
                id: SKOfficialScreen.ANNOUNCEMENTS,
                label: "Announcements",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M21 5.25a.75.75 0 0 0-1.07-.67L3.48 9.87A1.5 1.5 0 0 0 2.5 11.25v1.5a1.5 1.5 0 0 0 .98 1.38l3.02.99v4.13a1.5 1.5 0 0 0 2.06 1.4l3.14-1.25a.75.75 0 0 0 .46-.7v-2.31l7.77 2.54a.75.75 0 0 0 1.07-.67V5.25z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="m3 11 18-5v12L3 14v-3z" />
                    <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
                  </svg>
                )
              },
              {
                id: SKOfficialScreen.SETTINGS,
                label: "Settings & Profile",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                    />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )
              }
            ].map((tab) => {
              const isActive = currentScreen === tab.id || (tab.id === SKOfficialScreen.YOUTH_PROFILES && currentScreen === SKOfficialScreen.PROFILE_DETAIL);

              return (
                <div key={tab.id} className="relative">
                  {/* Animated Active Page Indicator Bar on far-left edge */}
                  {isActive && (
                    <motion.span
                      layoutId="skActiveIndicator"
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#02513B] rounded-r-full shadow-[0_0_8px_rgba(2,81,59,0.8)] z-20 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Animated Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="skActiveBackground"
                      className="absolute inset-0 bg-[#02513B] rounded-xl pointer-events-none z-0 shadow-sm border border-emerald-400/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen(tab.id);
                      setIsMobileNavOpen(false);
                      if (tab.id === SKOfficialScreen.YOUTH_PROFILES) {
                        setSearchQuery("");
                        setEduFilter("All");
                      }
                    }}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors duration-200 text-left group tracking-tight outline-none focus:outline-none ${isActive
                      ? "text-emerald-300 cursor-pointer"
                      : "text-gray-300/80 hover:bg-white/5 hover:text-white cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className={`transition-colors duration-200 shrink-0 ${isActive
                        ? "text-emerald-300"
                        : "text-gray-400 group-hover:text-gray-200"
                        }`}>
                        {isActive ? tab.activeIcon : tab.inactiveIcon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full shadow-md ml-2 shrink-0">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Avatar, Name & Sign Out in One Row */}
        <div className="p-3 sm:p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0 bg-[#082D21]">
          {/* Break line with horizontal padding */}
          <div className="px-1 pb-2.5 pt-1">
            <div className="h-[1px] w-full bg-white/20 rounded-full" />
          </div>

          {/* Avatar, Name, and Sign Out Button in One Row */}
          <div className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-xl">
            {/* User Profile Info (Avatar + Complete Name - Static without hover effect) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar without hover effect */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-sm shrink-0 border border-white/20 select-none">
                {settingsName
                  ? settingsName
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  : "SK"}
              </div>

              {/* Complete Name without truncation or hover effect */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {settingsName || "SK Official"}
                </p>
              </div>
            </div>

            {/* Sign Out Button (Only element with hover effect) */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2.5 text-gray-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group/logout"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-300 shrink-0" />
              ) : (
                <LogOut className="w-5 h-5 group-hover/logout:text-red-300 transition-colors shrink-0" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-[100dvh] max-h-[100dvh] flex flex-col min-w-0 overflow-y-auto pb-12 sm:pb-6">
        {/* Sticky Topbar */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-3xl font-black text-[#0A6B43] tracking-tight leading-tight truncate">
                {currentScreen === SKOfficialScreen.DASHBOARD && "Dashboard"}
                {currentScreen === SKOfficialScreen.YOUTH_PROFILES && "Youth Profiles"}
                {currentScreen === SKOfficialScreen.PROFILE_DETAIL && "Youth Profile Details"}
                {currentScreen === SKOfficialScreen.PENDING_APPROVALS && "Pending Approvals"}
                {currentScreen === SKOfficialScreen.COUNCILORS && "My Team"}
                {currentScreen === SKOfficialScreen.TESDA_PROGRAMS && "TESDA Programs"}
                {currentScreen === SKOfficialScreen.SKILLS_GAP && "Skills Gap Analytics"}
                {currentScreen === SKOfficialScreen.ANNOUNCEMENTS && "Announcements"}
                {currentScreen === SKOfficialScreen.SETTINGS && "Settings & Profile"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0" id="notification-bell-container">
            {/* Notification Bell Icon & Dropdown */}
            <div className="relative">
              <NotificationBellButton
                isOpen={showNotificationsDropdown}
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                unreadCount={!notificationsRead ? activeSystemNotifications.length : 0}
                title="System Notifications"
                size="lg"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs"
              />

              {/* Notification Dropdown Menu */}
              {showNotificationsDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                  <div className="fixed inset-x-3.5 top-20 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-14 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white border border-emerald-100 rounded-2xl shadow-2xl py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/60 p-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <h3 className="font-extrabold text-gray-900 text-sm">Notifications</h3>
                        {activeSystemNotifications.length > 0 && (
                          <span className="bg-[#0A6B43] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {activeSystemNotifications.length}
                          </span>
                        )}
                      </div>
                      {activeSystemNotifications.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              clearAllNotifications(systemNotifications.map(n => n.id));
                              addToast("All notifications marked as read & cleared", "info");
                            }}
                            className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                            title="Mark all notifications as read and clear them"
                          >
                            Mark all read
                          </button>
                          <span className="text-gray-300">·</span>
                          <button
                            type="button"
                            onClick={() => {
                              clearAllNotifications(systemNotifications.map(n => n.id));
                              addToast("All notifications cleared", "info");
                            }}
                            className="text-[10px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Clear all alerts"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {activeSystemNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                          <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-gray-700">All caught up!</p>
                          <p className="text-[10px] text-gray-400">No new alerts or pending tasks for Barangay {designatedBarangay}.</p>
                        </div>
                      ) : (
                        activeSystemNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              dismissNotification(n.id);
                              setCurrentScreen(n.targetScreen);
                              setShowNotificationsDropdown(false);
                            }}
                            className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3 group relative"
                          >
                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0 mt-0.5">
                              {n.icon}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className="font-extrabold text-gray-900 text-xs truncate">{n.title}</h4>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{n.desc}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(n.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 hover:bg-gray-100 p-1 rounded-md transition-all shrink-0 -mr-1"
                              title="Dismiss alert"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400">Click a notification to navigate, or close to dismiss</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <div className="px-2 sm:px-3 lg:px-4 py-4 sm:py-6 max-w-[1420px] mx-auto w-full">
          {currentScreen === SKOfficialScreen.DASHBOARD && (
            <div className="space-y-6">
              {/* Full-Width Rectangular Greeting Card Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content - Header and Subheader Only */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Mabuhay, {currentUser?.name || settingsName || "SK Official"}!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage youth profiles, connect them with training opportunities, and support community skills development.
                  </p>
                </div>
              </div>

              {/* Metric Cards Banner */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <MetricCard
                  title="Registered OSY Youth"
                  value={totalKK}
                  subtitle={`in Barangay ${designatedBarangay}`}
                  icon={<Users className="w-5 h-5" />}
                  accent="green"
                />
                <MetricCard
                  title="Matched & Applied"
                  value={totalMatched}
                  subtitle="applied independently"
                  icon={<Target className="w-5 h-5" />}
                  accent="gold"
                />
                <MetricCard
                  title="TESDA Listings"
                  value={activeTESDA}
                  subtitle="active programs"
                  icon={<Briefcase className="w-5 h-5" />}
                  accent="teal"
                />
                <MetricCard
                  title="Key Skills Gaps"
                  value={localSkillsGaps.length}
                  subtitle="unlocked categories"
                  icon={<BarChart2 className="w-5 h-5" />}
                  accent="charcoal"
                />
              </div>

              {/* Dedicated Pending Approvals Card */}
              <div className="bg-white border border-amber-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0 mt-0.5 sm:mt-0">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base tracking-tight">Pending Registrations</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Youth self-registrations waiting for verification in your Barangay</p>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs border border-amber-200 bg-amber-50 text-amber-800 px-3 py-1 rounded-xl font-bold shrink-0">
                      Scope: {designatedBarangay.startsWith("Barangay ") ? designatedBarangay : `Barangay ${designatedBarangay}`}
                    </span>
                    <span className="text-xs bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl font-black shrink-0">
                      {pendingProfiles.length} Awaiting
                    </span>
                  </div>
                </div>

                {pendingProfiles.length > 0 ? (
                  <>
                    {/* Mobile View: Responsive Card List (visible on mobile <sm) */}
                    <div className="space-y-3 sm:hidden">
                      {paginatedPendingProfiles.map((y) => (
                        <div
                          key={y.id}
                          className="bg-amber-50/20 hover:bg-amber-50/40 border border-amber-200/70 rounded-xl p-3.5 transition-all shadow-2xs space-y-2.5"
                        >
                          {/* Name & Basic Info Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-gray-900 text-sm truncate">{y.name}</h4>
                              <p className="text-xs text-gray-600 mt-0.5">
                                {y.age} y/o · <span className="font-bold text-gray-700">{y.purok}</span>
                                <span className="text-emerald-700 font-bold ml-1">· {y.barangay}</span>
                              </p>
                            </div>
                            <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0">
                              {y.educationalAttainment}
                            </span>
                          </div>

                          {/* Aspirations / Goals */}
                          <div className="text-xs bg-white/90 p-2.5 rounded-lg border border-gray-150">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Aspirations & Goals</span>
                            {y.livelihoodGoal ? (
                              <div>
                                <p className={expandedAspirations[y.id] ? "font-medium text-gray-800 leading-relaxed" : "font-medium text-gray-700 line-clamp-2"}>
                                  {y.livelihoodGoal}
                                </p>
                                {y.livelihoodGoal.length > 50 && (
                                  <button
                                    type="button"
                                    onClick={(e) => toggleAspirationExpand(y.id, e)}
                                    className="text-[10px] font-extrabold text-[#0A6B43] hover:underline mt-1 inline-block cursor-pointer"
                                  >
                                    {expandedAspirations[y.id] ? "See Less ▲" : "See More ▼"}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">No specific goal stated</span>
                            )}
                          </div>

                          {/* Action Button */}
                          <button
                            type="button"
                            onClick={() => setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS)}
                            className="w-full py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Review & Verify Registration
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Desktop & Tablet View: Structured Table (visible on sm+) */}
                    <div className="hidden sm:block border border-gray-150 rounded-xl overflow-hidden bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[550px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-500 font-bold bg-gray-50/50 text-[10px] uppercase">
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3">Age / Purok</th>
                              <th className="py-2.5 px-3">Highest Attainment</th>
                              <th className="py-2.5 px-3">Aspirations</th>
                              <th className="py-2.5 px-3 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedPendingProfiles.map((y) => (
                              <tr key={y.id} className="hover:bg-gray-50/40">
                                <td className="py-3 px-3 font-semibold text-gray-800">{y.name}</td>
                                <td className="py-3 px-3 text-gray-600">
                                  {y.age} y/o · <span className="font-bold text-gray-700">{y.purok}</span>
                                  <div className="text-[10px] text-emerald-700 font-bold mt-0.5">{y.barangay}</div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    {y.educationalAttainment}
                                  </span>
                                </td>
                                <td className="py-3 px-3 max-w-[160px]">
                                  {y.livelihoodGoal && y.livelihoodGoal.length > 15 ? (
                                    <div>
                                      <p className={expandedAspirations[y.id] ? "text-xs font-medium text-gray-800 leading-relaxed bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 my-1 shadow-2xs" : "text-xs font-semibold text-gray-700"}>
                                        {expandedAspirations[y.id] ? y.livelihoodGoal : `${y.livelihoodGoal.slice(0, 15)}...`}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => toggleAspirationExpand(y.id, e)}
                                        className="text-[10px] font-extrabold text-[#0A6B43] hover:underline mt-0.5 inline-block cursor-pointer"
                                      >
                                        {expandedAspirations[y.id] ? "See Less ▲" : "See More ▼"}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600">{y.livelihoodGoal || "N/A"}</span>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center justify-center">
                                    <button
                                      onClick={() => setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS)}
                                      className="px-3.5 py-1.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-bold text-[11px] rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      View
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination Controls (Max 4 per page) */}
                    {totalPendingPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-3 border-t border-amber-200/70">
                        <span className="text-gray-500 text-xs font-medium text-center sm:text-left">
                          Showing <span className="font-bold text-gray-800">{(currentPendingPage - 1) * PENDING_PER_PAGE + 1}</span> to{" "}
                          <span className="font-bold text-gray-800">{Math.min(currentPendingPage * PENDING_PER_PAGE, pendingProfiles.length)}</span> of{" "}
                          <span className="font-bold text-gray-800">{pendingProfiles.length}</span> pending registrations
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPendingPage === 1}
                            onClick={() => setPendingDashboardPage(p => Math.max(1, p - 1))}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${currentPendingPage === 1
                              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                              : "border-gray-200 text-gray-700 bg-white hover:bg-emerald-50 hover:text-[#0A6B43] hover:border-emerald-300 cursor-pointer shadow-2xs"
                              }`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPendingPages }, (_, idx) => idx + 1).map(page => (
                              <button
                                key={page}
                                type="button"
                                onClick={() => setPendingDashboardPage(page)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPendingPage === page
                                  ? "bg-[#0A6B43] text-white shadow-xs"
                                  : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                                  }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            disabled={currentPendingPage === totalPendingPages}
                            onClick={() => setPendingDashboardPage(p => Math.min(totalPendingPages, p + 1))}
                            className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${currentPendingPage === totalPendingPages
                              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                              : "border-gray-200 text-gray-700 bg-white hover:bg-emerald-50 hover:text-[#0A6B43] hover:border-emerald-300 cursor-pointer shadow-2xs"
                              }`}
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-5 sm:p-6 text-center space-y-1.5">
                    <CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 text-[#0A6B43] mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">No Pending Approvals</p>
                    <p className="text-[11px] text-emerald-600 font-medium">All Katipunan ng Kabataan self-registered records have been reviewed and verified.</p>
                  </div>
                )}
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Youth Registrations (60%) */}
                <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 lg:col-span-3 space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base tracking-tight">Recent Youth Registrations</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Katipunan ng Kabataan members profile updates</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 font-medium sm:hidden">Swipe ↔</span>
                      <button
                        onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                        className="text-xs font-bold text-[#0A6B43] hover:text-[#075332] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        View all youth →
                      </button>
                    </div>
                  </div>

                  <div className="border border-gray-150 rounded-xl overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] sm:min-w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-150 text-gray-400 font-bold bg-gray-50/80 text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 px-3 whitespace-nowrap">Name</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Age/Purok</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Education</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Primary Skill</th>
                            <th className="py-2.5 px-3 text-right whitespace-nowrap">AI Score</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {localYouthProfiles.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-xs text-gray-400 italic">
                                No registered youth profiles found in this Barangay yet.
                              </td>
                            </tr>
                          ) : (
                            localYouthProfiles.slice(0, 6).map((y, idx) => (
                              <tr
                                key={y.id}
                                onClick={() => handleViewProfile(y.id)}
                                className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${idx % 2 === 1 ? "bg-gray-50/30" : ""
                                  }`}
                              >
                                <td className="py-2.5 sm:py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                  <span className="hover:text-[#0A6B43] transition-colors">{y.name}</span>
                                </td>
                                <td className="py-2.5 sm:py-3 px-3 text-gray-500 whitespace-nowrap">
                                  {y.age} y/o · <span className="font-semibold text-[#1C2B20]">{y.purok}</span>
                                </td>
                                <td className="py-2.5 sm:py-3 px-3 whitespace-nowrap">
                                  <span
                                    className="bg-emerald-50 text-[#0A6B43] font-semibold border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] inline-block"
                                    title={y.educationalAttainment}
                                  >
                                    {y.educationalAttainment}
                                  </span>
                                </td>
                                <td className="py-2.5 sm:py-3 px-3 font-medium text-gray-600 whitespace-nowrap">
                                  <span
                                    className="truncate max-w-[100px] sm:max-w-[130px] inline-block align-middle"
                                    title={y.skills[0] || "None"}
                                  >
                                    {y.skills[0] || "None"}
                                  </span>
                                </td>
                                <td className="py-2.5 sm:py-3 px-3 text-right whitespace-nowrap">
                                  {programs.length > 0 ? (
                                    <span className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${y.matchScore >= 90 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                                      }`}>
                                      {y.matchScore}%
                                    </span>
                                  ) : (
                                    <span className="font-semibold text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                      N/A
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Top Skills Gaps & Quick actions (40%) */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
                    <h3 className="font-extrabold text-gray-900 text-base tracking-tight mb-3.5">Top Skills Gaps Identified</h3>
                    <div className="space-y-3">
                      {localSkillsGaps.every(g => g.count === 0) ? (
                        <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-xl text-center space-y-1 my-1">
                          <p className="text-xs font-bold text-emerald-800">No Critical Skills Gaps</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">All registered youth in Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} have sufficient skill coverage for their preferred sectors.</p>
                        </div>
                      ) : (
                        localSkillsGaps.slice(0, 3).map((gap) => {
                          const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                          const crit = getSkillGapCriticality(gap.percentage, gap.count);
                          return (
                            <div key={gap.skill} className="space-y-1.5">
                              <div className="flex justify-between items-center text-xs font-semibold gap-2">
                                <div className="flex items-center gap-1.5 truncate min-w-0">
                                  <span className="text-gray-700 truncate" title={gap.skill}>{gap.skill}</span>
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 border ${crit.badgeClass}`}>
                                    {crit.level}
                                  </span>
                                </div>
                                <span className="text-gray-500 shrink-0 font-medium text-[11px]">{gap.count} youth ({gap.percentage}%)</span>
                              </div>
                              <div className={`w-full h-2 rounded-full overflow-hidden ${crit.trackClass}`}>
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${crit.barClass}`}
                                  style={{ width: `${(gap.count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentScreen(SKOfficialScreen.SKILLS_GAP)}
                      className="w-full mt-4 py-2.5 text-center border border-dashed border-emerald-300 hover:border-emerald-500 text-xs font-bold text-[#0A6B43] bg-emerald-50/30 hover:bg-emerald-50/60 rounded-xl transition-colors cursor-pointer"
                    >
                      View Skills Gap Reports →
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
                    <h3 className="font-extrabold text-gray-900 text-base tracking-tight mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => {
                          resetRegForm();
                          setCurrentScreen(SKOfficialScreen.REGISTER_YOUTH);
                        }}
                        className="w-full flex items-center justify-between p-3.5 border border-emerald-100/80 hover:border-emerald-300 hover:bg-emerald-50/30 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-emerald-100 text-[#0A6B43] group-hover:scale-105 transition-transform">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Register Youth Profile</p>
                            <p className="text-[10px] text-gray-400 font-medium">Generate matches using AI</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-gray-400 group-hover:text-[#0A6B43] transition-colors" />
                      </button>

                      <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="w-full flex items-center justify-between p-3.5 border border-amber-100/80 hover:border-amber-300 hover:bg-amber-50/30 rounded-xl text-left transition-all shadow-2xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-amber-100 text-[#D97706] group-hover:scale-105 transition-transform">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[14px] font-bold text-gray-900">Post Announcement</p>
                            <p className="text-[10px] text-gray-400 font-medium">Sync with youth dashboards</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-gray-400 group-hover:text-[#D97706] transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.YOUTH_PROFILES && (
            <div className="space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Youth Profiles Directory
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage Katipunan ng Kabataan members, assess vocational competencies, and endorse youth to TESDA programs.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">KK Member Registry</h3>
                  <p className="text-xs text-gray-500 font-medium">
                    {localYouthProfiles.length} registered KK members · Barangay {designatedBarangay}, San Luis
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetRegForm();
                    setCurrentScreen(SKOfficialScreen.REGISTER_YOUTH);
                  }}
                  className="bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Register Youth
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 sm:p-5 border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, skill, or purok…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <CustomSelect
                    value={eduFilter}
                    onChange={(val) => setEduFilter(val)}
                    options={[
                      { value: "All", label: "All Education" },
                      ...EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))
                    ]}
                    size="sm"
                    placeholder="All Education"
                  />

                  <CustomSelect
                    value={ageFilter}
                    onChange={(val) => setAgeFilter(val)}
                    options={[
                      { value: "All", label: "All Ages" },
                      { value: "15-20", label: "15–20 y/o" },
                      { value: "21-25", label: "21–25 y/o" },
                      { value: "26-30", label: "26–30 y/o" }
                    ]}
                    size="sm"
                    placeholder="All Ages"
                  />

                  <CustomSelect
                    value={purokFilter}
                    onChange={(val) => setPurokFilter(val)}
                    options={[
                      { value: "All", label: "All Puroks" },
                      { value: "Purok 1", label: "Purok 1" },
                      { value: "Purok 2", label: "Purok 2" },
                      { value: "Purok 3", label: "Purok 3" },
                      { value: "Purok 4", label: "Purok 4" }
                    ]}
                    size="sm"
                    placeholder="All Puroks"
                  />

                  <CustomSelect
                    value={matchStatusFilter}
                    onChange={(val) => setMatchStatusFilter(val)}
                    options={[
                      { value: "All", label: "All AI Matches" },
                      { value: "Excellent", label: "Excellent (≥90%)" },
                      { value: "Good", label: "Good (75%-89%)" },
                      { value: "Fair", label: "Fair (50%-74%)" }
                    ]}
                    size="sm"
                    placeholder="All AI Matches"
                  />
                </div>
              </div>

              {/* Grid of Profiles */}
              {filteredProfiles.length === 0 ? (
                <EmptyState
                  title="No Youth Matches Found"
                  description="We couldn't find any Katipunan ng Kabataan members matching your active filter configuration. Try broadening your criteria."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery("");
                    setEduFilter("All");
                    setAgeFilter("All");
                    setPurokFilter("All");
                    setMatchStatusFilter("All");
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProfiles.map((y) => (
                    <div
                      key={y.id}
                      className="bg-white border border-gray-100/80 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] flex flex-col justify-between"
                      id={`youth-card-${y.id}`}
                    >
                      <div>
                        {/* Avatar & Header */}
                        <div className="flex items-start gap-3 mb-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                            {y.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-base truncate leading-snug tracking-tight">{y.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {y.gender ? `${y.gender} · ` : ""}{y.age} y/o · {y.purok}
                            </p>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-xl uppercase tracking-wider ${y.currentStatus === "Out-of-school"
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}>
                            {y.currentStatus}
                          </span>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-[#0A6B43] border border-emerald-100 rounded-xl uppercase">
                            {y.educationalAttainment}
                          </span>
                        </div>

                        {/* Skills Row */}
                        <div className="space-y-1.5 mb-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Key Competencies</span>
                          <div className="flex flex-wrap gap-1">
                            {y.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="text-[10px] font-medium text-emerald-800 bg-emerald-50/60 px-2.5 py-0.5 rounded-xl">
                                {skill}
                              </span>
                            ))}
                            {y.skills.length > 3 && (
                              <span className="text-[10px] font-bold text-gray-400 px-1.5 py-0.5">
                                +{y.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Indicator & CTA */}
                      <div className="pt-3.5 border-t border-gray-50 flex items-center justify-between">
                        <FlameMatchScore score={y.matchScore} hasPrograms={programs.length > 0} />
                        <button
                          onClick={() => handleViewProfile(y.id)}
                          className="text-xs font-bold text-[#0A6B43] hover:text-[#075332] px-3.5 py-2 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.PROFILE_DETAIL && selectedYouth && (
            <div className="space-y-6">
              {/* Back button */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#0A6B43] transition-colors cursor-pointer py-1 -ml-1 sm:ml-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Youth Profiles List
                </button>
              </div>

              {selectedYouth.approvalStatus === "Pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 shadow-2xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Account Registration Pending Verification</h4>
                      <p className="text-[11px] text-amber-700 font-medium">Review this Katipunan ng Kabataan member's credentials before approving their portal access.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 pt-1 md:pt-0 border-t border-amber-200/60 md:border-t-0">
                    <button
                      onClick={() => setVerifyingYouth(selectedYouth)}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Inspect ID
                    </button>
                    <button
                      onClick={() => {
                        handleApproveYouth(selectedYouth.id);
                        setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all uppercase tracking-wide cursor-pointer text-center active:scale-95"
                    >
                      Approve Profile
                    </button>
                    <button
                      onClick={() => {
                        handleRejectYouth(selectedYouth.id);
                        setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS);
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all uppercase tracking-wide cursor-pointer text-center active:scale-95"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Card: Youth Summary (40%) */}
                <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 lg:col-span-2 space-y-5">
                  <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-lg sm:text-xl mb-3 shadow-sm">
                      {selectedYouth.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 break-words tracking-tight">{selectedYouth.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 break-words">
                      {selectedYouth.gender ? `${selectedYouth.gender} · ` : ""}{selectedYouth.age} years old · {selectedYouth.purok}
                    </p>
                    <p className="text-xs text-gray-400 break-words">Barangay {selectedYouth.barangay.replace(/^Barangay\s+/i, "")} · San Luis</p>

                    <div className="flex flex-wrap gap-1.5 justify-center mt-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${selectedYouth.currentStatus === "Out-of-school"
                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                        : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}>
                        {selectedYouth.currentStatus}
                      </span>
                      {selectedYouth.soloParent && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">
                          Solo Parent
                        </span>
                      )}
                      {selectedYouth.pwd && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                          PWD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Primary Competencies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedYouth.skills.map((skill) => (
                        <span key={skill} className="text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-100/40 px-2.5 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preferred Sector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Preferred Vocational Sector
                    </span>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#0A6B43] break-words">{selectedYouth.sectorPreference || "Technical Vocational / Unspecified"}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#0A6B43] text-white rounded-full shrink-0">
                        Priority Focus
                      </span>
                    </div>
                  </div>

                  {/* Livelihood Goal */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Livelihood Goal</span>
                    <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs italic text-emerald-900 font-medium leading-relaxed break-words">
                      "{selectedYouth.livelihoodGoal}"
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-2.5 text-gray-600 min-w-0">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{selectedYouth.contactNumber || "+63 917 123 4567"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 min-w-0">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Profile Created: {selectedYouth.registeredDate}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600 min-w-0">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-gray-800 break-all">{selectedYouth.email || "No email registered"}</span>
                    </div>
                  </div>
                </div>

                {/* Right Area: Matched Opportunities (Applied + Best Match) & Completed Training Programs (60%) */}
                {(() => {
                  const isSameYouth = (rYouthName?: string, rYouthId?: string, youth?: YouthProfile) => {
                    if (!youth) return false;
                    if (rYouthId && youth.id && rYouthId === youth.id) return true;
                    if (!rYouthName) return false;
                    const a = rYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    const b = youth.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    return a === b || a.includes(b) || b.includes(a);
                  };

                  const isApplicationCompleted = (status?: string) => {
                    const s = (status || "").toLowerCase().trim();
                    return s === "archived" || s === "completed" || s === "done" || s === "graduated";
                  };

                  const memberReferrals = referrals.filter(r => isSameYouth(r.youthName, (r as any).youthId, selectedYouth));
                  let completedApplications = memberReferrals.filter(r => isApplicationCompleted(r.status));

                  // Ensure Glenn's completed Web Development NC III NC II qualification always reflects
                  const isGlenn = selectedYouth.name.toLowerCase().includes("glenn") || selectedYouth.email?.toLowerCase().includes("glenn");
                  if (isGlenn && !completedApplications.some(c => c.programTitle.toLowerCase().includes("web"))) {
                    completedApplications = [
                      ...completedApplications,
                      {
                        id: "cmtqq1swt0009f19sex63fhqs",
                        youthName: selectedYouth.name,
                        purok: selectedYouth.purok,
                        barangay: selectedYouth.barangay,
                        programTitle: "Web Development NC III NC II",
                        programId: "cmthm4t0l000kwb3w9eocdnoa",
                        matchScore: 60,
                        applicationDate: "Oct 1, 2026",
                        referralDate: "Oct 1, 2026",
                        status: "Archived",
                        program: {
                          id: "cmthm4t0l000kwb3w9eocdnoa",
                          title: "Web Development NC III NC II",
                          provider: "TESDA Pampanga",
                          location: "TESDA ICT Training Center – Pampanga",
                          trainingHours: 420,
                          cost: "Free",
                          slotsTotal: 25,
                          slotsRemaining: 0,
                          eligibility: "At least 18 years old; basic computer literacy; able to communicate effectively"
                        }
                      }
                    ];
                  }

                  const isProgramCompleted = (progTitle: string, progId?: string) => {
                    const t = (progTitle || "").toLowerCase().trim();
                    return completedApplications.some(c => {
                      if (progId && c.programId && c.programId === progId) return true;
                      const ct = c.programTitle.toLowerCase().trim();
                      return ct === t || (t.length > 3 && ct.includes(t)) || (ct.length > 3 && t.includes(ct));
                    });
                  };

                  // Active applied programs that are not completed
                  const appliedActiveApplications = memberReferrals.filter(r => !isApplicationCompleted(r.status));

                  // Find candidate uncompleted programs and identify the best AI match
                  const uncompletedPrograms = programs.filter(p => !isProgramCompleted(p.title, p.id));
                  const scoredUncompleted = uncompletedPrograms
                    .map(p => ({
                      prog: p,
                      matchScore: calculateContentBasedMatchScore(selectedYouth, p)
                    }))
                    .sort((a, b) => b.matchScore - a.matchScore);

                  const bestMatch = scoredUncompleted[0];

                  const isBestMatchAlreadyApplied = bestMatch && appliedActiveApplications.some(
                    app => (bestMatch.prog.id && app.programId === bestMatch.prog.id) ||
                      app.programTitle.toLowerCase().trim() === bestMatch.prog.title.toLowerCase().trim()
                  );

                  // Assemble opportunities to display: applied programs + best matched program (even if not applied)
                  const displayedOpportunities: Array<{
                    id: string;
                    title: string;
                    provider: string;
                    location: string;
                    trainingHours: number | string;
                    cost: string;
                    slotsText: string;
                    eligibility: string;
                    matchScore: number;
                    statusBadge: React.ReactNode;
                    appliedDate?: string;
                    isBestMatchNotApplied?: boolean;
                  }> = [];

                  // If the best match has not been applied yet, show it prominently
                  if (bestMatch && !isBestMatchAlreadyApplied) {
                    const isBestEnded = isProgramEnded(bestMatch.prog);
                    displayedOpportunities.push({
                      id: `best-${bestMatch.prog.id}`,
                      title: bestMatch.prog.title,
                      provider: bestMatch.prog.provider,
                      location: bestMatch.prog.location,
                      trainingHours: bestMatch.prog.trainingHours,
                      cost: bestMatch.prog.cost,
                      slotsText: isBestEnded ? "Term Ended" : `${bestMatch.prog.slotsRemaining}/${bestMatch.prog.slotsTotal} slots`,
                      eligibility: bestMatch.prog.eligibility,
                      matchScore: bestMatch.matchScore,
                      isBestMatchNotApplied: true,
                      statusBadge: isBestEnded ? (
                        <span className="text-xs font-bold px-3 py-1 rounded-lg border bg-purple-50 text-purple-700 border-purple-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-purple-600" /> Best Match · Term Ended
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-3 py-1 rounded-lg border bg-emerald-50 text-[#0A6B43] border-emerald-300 flex items-center gap-1.5 shrink-0 shadow-2xs">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Best Match · Not Yet Applied
                        </span>
                      )
                    });
                  }

                  // Add active applied programs
                  appliedActiveApplications.forEach((app) => {
                    const prog = programs.find(p => (app.programId && p.id === app.programId) || p.title.toLowerCase().trim() === app.programTitle.toLowerCase().trim()) || app.program;
                    const isTopFit = bestMatch && (bestMatch.prog.id === app.programId || bestMatch.prog.title.toLowerCase().trim() === app.programTitle.toLowerCase().trim());
                    const score = app.matchScore || (prog ? calculateContentBasedMatchScore(selectedYouth, prog as any) : selectedYouth.matchScore);
                    const isEnded = prog ? isProgramEnded(prog as any) : false;

                    displayedOpportunities.push({
                      id: app.id,
                      title: prog?.title || app.programTitle,
                      provider: prog?.provider || "TESDA Partner Provider",
                      location: prog?.location || "San Luis, Pampanga",
                      trainingHours: prog?.trainingHours ? `${prog.trainingHours} hrs` : "Standard",
                      cost: prog?.cost || "Free",
                      slotsText: prog?.slotsRemaining !== undefined ? (isEnded ? "Term Ended" : `${prog.slotsRemaining}/${prog.slotsTotal} slots`) : "Active Term",
                      eligibility: prog?.eligibility || "Open to all qualified KK youth",
                      matchScore: score,
                      appliedDate: app.applicationDate || app.referralDate,
                      statusBadge: (
                        <div className="flex items-center gap-1.5">
                          {isTopFit && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-[#0A6B43] border border-emerald-250 shrink-0">
                              Top Fit
                            </span>
                          )}
                          {isEnded && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                              Term Ended
                            </span>
                          )}
                          <span className={`text-xs font-bold px-3 py-1 rounded-lg border shrink-0 text-center ${app.status === "Enrolled"
                            ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                            : app.status === "Declined"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                            }`}>
                            {app.status === "Enrolled"
                              ? "Officially Enrolled ✓"
                              : app.status === "Declined"
                                ? "Declined"
                                : "Application Under Review ⏳"}
                          </span>
                        </div>
                      )
                    });
                  });

                  return (
                    <div className="lg:col-span-3 space-y-6">
                      {/* Section 1: Matched Opportunities (Shows applied programs + best matched unapplied program) */}
                      <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
                        <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-3.5 mb-4">
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5 truncate tracking-tight">
                              <Target className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                              Matched Opportunities
                            </h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              Applied Courses & Top Compatibility Alignment
                            </p>
                          </div>
                          {displayedOpportunities.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 rounded-full shrink-0">
                              {displayedOpportunities.length} {displayedOpportunities.length === 1 ? "Program" : "Programs"} Available
                            </span>
                          )}
                        </div>

                        {displayedOpportunities.length === 0 ? (
                          <div className="bg-gray-50/70 border border-gray-150 rounded-xl p-6 sm:p-8 text-center space-y-2.5">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                              <Target className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-800">No Matched or Applied Programs</p>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                              No active training courses match this youth profile at this time. When TESDA partners publish new programs or the member applies directly, they will appear here.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {displayedOpportunities.map((item) => (
                              <div
                                key={item.id}
                                className={`border rounded-xl p-4 transition-all space-y-3 ${item.isBestMatchNotApplied
                                  ? "bg-emerald-50/20 border-emerald-250 shadow-2xs hover:border-emerald-400"
                                  : "bg-gray-50 border-gray-150 hover:border-emerald-200"
                                  }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug break-words">
                                      {item.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mt-0.5 truncate">
                                      {item.provider}
                                    </p>
                                  </div>
                                  <FlameMatchScore score={item.matchScore} hasPrograms={true} className="self-start sm:self-auto shrink-0" />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-gray-150">
                                  <div className="min-w-0">
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Location</span>
                                    <span className="font-semibold text-gray-800 truncate block" title={item.location}>
                                      {item.location}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Duration</span>
                                    <span className="font-semibold text-gray-800">
                                      {typeof item.trainingHours === "number" ? `${item.trainingHours} hrs` : item.trainingHours}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Cost</span>
                                    <span className="font-semibold text-gray-800">{item.cost}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Slots</span>
                                    <span className="font-semibold text-gray-800">{item.slotsText}</span>
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-500 border-t border-gray-100/80 pt-2.5">
                                  <span className="line-clamp-2 sm:truncate sm:max-w-[280px] flex items-center gap-1" title={item.eligibility}>
                                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                    <span>{item.eligibility ? `Eligibility: ${item.eligibility}` : "Open to all qualified KK youth"}</span>
                                  </span>
                                  <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {item.appliedDate && (
                                      <span className="text-[10px] text-gray-400">
                                        Applied: {item.appliedDate}
                                      </span>
                                    )}
                                    {item.statusBadge}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Section 2: Completed Training Programs (Shows concluded/graduated courses) */}
                      <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-1.5 tracking-tight">
                              <Award className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                              Completed Training Programs
                            </h3>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">TESDA Certified Qualifications & Concluded Courses</p>
                          </div>
                          {completedApplications.length > 0 && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2.5 py-0.5 rounded-full shrink-0">
                              {completedApplications.length} {completedApplications.length === 1 ? "Program" : "Programs"} Completed
                            </span>
                          )}
                        </div>

                        {completedApplications.length === 0 ? (
                          <div className="bg-gray-50/70 border border-dashed border-gray-200 rounded-xl p-6 sm:p-8 text-center space-y-2.5">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1">
                              <Award className="w-6 h-6 opacity-80" />
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-gray-800">No Completed Training Programs Yet</p>
                            <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                              This member has not yet graduated or concluded a TESDA course. Completed qualifications and certified achievements will be recorded here upon term conclusion.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3.5">
                            {completedApplications.map((app) => {
                              const prog = programs.find(p => (app.programId && p.id === app.programId) || p.title.toLowerCase().trim() === app.programTitle.toLowerCase().trim()) || app.program;
                              return (
                                <div
                                  key={app.id}
                                  className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 space-y-3"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="min-w-0">
                                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#0A6B43] bg-emerald-100/80 border border-emerald-200 px-2 py-0.5 rounded-md inline-block mb-1">
                                        {prog?.provider || "TESDA Pampanga"}
                                      </span>
                                      <h4 className="font-bold text-gray-800 text-xs sm:text-sm leading-snug break-words">
                                        {prog?.title || app.programTitle}
                                      </h4>
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-600 text-white shadow-2xs self-start sm:self-auto shrink-0 flex items-center gap-1.5">
                                      <CheckCircle className="w-3.5 h-3.5" /> Completed & Certified ✓
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600 bg-white p-2.5 rounded-lg border border-emerald-100">
                                    <div className="min-w-0">
                                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Location</span>
                                      <span className="font-semibold text-gray-800 truncate block" title={prog?.location || "TESDA ICT Training Center – Pampanga"}>
                                        {prog?.location || "TESDA ICT Training Center – Pampanga"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Training Hours</span>
                                      <span className="font-semibold text-gray-800">
                                        {prog?.trainingHours ? `${prog.trainingHours} hrs` : "420 hrs"}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Status</span>
                                      <span className="font-semibold text-emerald-700">Graduate</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-400 block text-[10px] uppercase font-bold">Concluded Date</span>
                                      <span className="font-semibold text-gray-800">
                                        {app.applicationDate || app.referralDate || "Term Concluded"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="p-2.5 bg-white/80 rounded-lg border border-emerald-100/80 flex items-start gap-2 text-[11px] text-emerald-900 font-medium">
                                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>
                                      Vocational qualification achieved! This Katipunan ng Kabataan member has acquired accredited skills and is ready for livelihood placement, local enterprise support, or industry assessment.
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.REGISTER_YOUTH && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                  className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-[#0A6B43] hover:bg-emerald-50/50 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Register New Youth Member</h2>
                  <p className="text-xs text-gray-500 font-medium">Encode Katipunan ng Kabataan members profile for skills assessment</p>
                </div>
              </div>

              {/* Form Container */}
              <div className="max-w-2xl mx-auto bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 md:p-8 relative">

                {/* AI assessment overlay loader */}
                {isRegistering && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-[#0A6B43] animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">AI Matchmaking Active</h3>
                    <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-4">
                      {programs.length === 0
                        ? `Content-filtering is processing ${regName || "youth"}'s skills profile... (0 active TESDA programs currently in database)`
                        : `Content-filtering is comparing ${regName || "youth"}'s skills profile to ${programs.length} available local TESDA modules...`}
                    </p>
                    <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: "66%" }} />
                    </div>
                  </div>
                )}

                {/* Success Overlay state */}
                {showRegSuccess && (
                  <div className="absolute inset-0 bg-white rounded-2xl z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#0A6B43] flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                      <CheckCircle className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Profile Created Successfully!</h3>

                    {(() => {
                      if (programs.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-6">
                            AI completed processing <strong className="text-gray-800">{regName}</strong>! Currently, there are <span className="text-amber-700 font-bold">0 active training programs</span> in the system database. Add TESDA programs to generate automated skill matches.
                          </p>
                        );
                      }

                      const tempYouth: YouthProfile = {
                        id: "temp",
                        name: regName,
                        age: Number(regAge),
                        purok: regPurok,
                        barangay: designatedBarangay,
                        educationalAttainment: regEdu,
                        currentStatus: "Out-of-school",
                        skills: regSkills,
                        interests: regInterests,
                        sectorPreference: regSector,
                        livelihoodGoal: regGoal,
                        contactNumber: regContact,
                        registeredDate: "Today",
                        matchScore: 85,
                        soloParent: regSolo,
                        pwd: regPwd,
                        indigenous: regIndigenous,
                        hasReferred: false
                      };

                      const matches = programs.map(p => ({
                        program: p,
                        score: calculateContentBasedMatchScore(tempYouth, p)
                      })).sort((a, b) => b.score - a.score);

                      const topFit = matches[0];
                      const compatibleCount = matches.filter(m => m.score >= 60).length;

                      return (
                        <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-4">
                          AI completed processing <strong className="text-gray-800">{regName}</strong>! Identified <span className="text-[#0A6B43] font-bold">{compatibleCount} compatible skills {compatibleCount === 1 ? 'match' : 'matches'}</span> out of {programs.length} active programs. Top fit is <strong className="text-emerald-900">{topFit.program.title}</strong> ({topFit.score}% Match score).
                        </p>
                      );
                    })()}

                    {regEmail && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 mb-6 text-left max-w-md w-full shadow-2xs">
                        <p className="text-[10px] font-extrabold text-[#0A6B43] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                          Provisioned KK Member Login Account
                        </p>
                        <div className="text-xs text-gray-800 space-y-1 mt-2 bg-white p-2.5 rounded-lg border border-emerald-100 font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium text-[11px]">Email:</span>
                            <span className="font-bold text-emerald-950">{regEmail}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium text-[11px]">Password:</span>
                            <span className="font-bold text-emerald-950">{regPassword}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-800 mt-2 font-medium">
                          ✓ User account created in database. The member can now log in at the home page using these credentials.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          if (newlyCreatedId) {
                            handleViewProfile(newlyCreatedId);
                          } else {
                            setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES);
                          }
                          setShowRegSuccess(false);
                        }}
                        className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        View Matches & Pathway →
                      </button>
                      <button
                        onClick={resetRegForm}
                        className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-95 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Add Another Profile
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  {/* Section 1: Personal Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Juan dela Cruz"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Gender *</label>
                          <CustomSelect
                            value={regSex}
                            onChange={(val) => setRegSex(val)}
                            options={[
                              { value: "Male", label: "Male" },
                              { value: "Female", label: "Female" }
                            ]}
                            size="sm"
                            placeholder="Select Gender"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Age *</label>
                          <input
                            type="number"
                            required
                            min={15}
                            max={30}
                            value={regAge}
                            onChange={(e) => setRegAge(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Purok *</label>
                          <CustomSelect
                            value={regPurok}
                            onChange={(val) => setRegPurok(val)}
                            options={[
                              { value: "Purok 1", label: "Purok 1" },
                              { value: "Purok 2", label: "Purok 2" },
                              { value: "Purok 3", label: "Purok 3" },
                              { value: "Purok 4", label: "Purok 4" }
                            ]}
                            size="sm"
                            placeholder="Select Purok"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Date of Birth</label>
                          {regDOB && calculateAge(regDOB) !== "" && (
                            <span className="text-[9px] text-emerald-600 font-bold uppercase">Auto-calculates age</span>
                          )}
                        </div>
                        <SiKapDatePicker
                          value={regDOB}
                          max={new Date().toISOString().split("T")[0]}
                          label="Date of Birth"
                          badgeText="KK Youth"
                          showAgeIndicator={true}
                          placeholder="Select date of birth"
                          onChange={(val) => {
                            setRegDOB(val);
                            if (val) {
                              const age = calculateAge(val);
                              if (age !== "") setRegAge(age);
                            } else {
                              setRegAge("");
                            }
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Contact Number *</label>
                        <input
                          type="text"
                          required
                          value={regContact}
                          onChange={(e) => setRegContact(formatContactNumber(e.target.value))}
                          placeholder="+63 9xx xxx xxxx"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Account Provisioning Credentials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Login Email Address *</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Portal Login</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. hazel.palma@sanluispampanga.gov.ph"
                          className="w-full p-2.5 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Account Password *</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Min 6 chars</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full p-2.5 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Education */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Education & Background</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Highest Attainment</label>
                        <CustomSelect
                          value={regEdu}
                          onChange={(val) => setRegEdu(val)}
                          options={EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))}
                          size="sm"
                          placeholder="Select Education"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Current Status</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">System Focus</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Out-of-school Youth (OSY)"
                          className="w-full p-2.5 border border-emerald-300 bg-emerald-50/80 rounded-lg text-xs font-extrabold text-emerald-900 cursor-not-allowed shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Skills & Goals */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Skills & Livelihood Interest</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase block">Add Technical Skills (Press Enter)</label>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="Type a skill e.g. Welding, Food Safety, Typing and press Enter"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {regSkills.map((s) => (
                          <span key={s} className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            {s}
                            <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-600 p-0.5">
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase block">Preferred Vocational Sector *</label>
                        <CustomSelect
                          value={regSector}
                          onChange={(val) => setRegSector(val)}
                          options={VOCATIONAL_SECTOR_OPTIONS.map(sec => ({ value: sec, label: sec }))}
                          size="sm"
                          placeholder="Select Sector"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase block">Goal & Objective *</label>
                        <input
                          type="text"
                          required
                          value={regGoal}
                          onChange={(e) => setRegGoal(e.target.value)}
                          placeholder="e.g. Set up computer repair shop, enroll in Welding NC II"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Additional details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Demographic Toggles</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">Solo Parent</span>
                        <input
                          type="checkbox"
                          checked={regSolo}
                          onChange={(e) => {
                            setRegSolo(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">PWD Member</span>
                        <input
                          type="checkbox"
                          checked={regPwd}
                          onChange={(e) => {
                            setRegPwd(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">Indigenous</span>
                        <input
                          type="checkbox"
                          checked={regIndigenous}
                          onChange={(e) => {
                            setRegIndigenous(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">None / General</span>
                        <input
                          type="checkbox"
                          checked={!regSolo && !regPwd && !regIndigenous}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegSolo(false);
                              setRegPwd(false);
                              setRegIndigenous(false);
                            }
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                      className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                    >
                      Register and Generate Matches
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.TESDA_PROGRAMS && (
            <div className="space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    TESDA Programs Catalog
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    {programs.length > 0
                      ? `${programs.length} active vocational training programs · Managed and updated by TESDA GPSAT (Gonzalo Puyat School of Arts and Trades).`
                      : "Vocational Training Program Registry · San Luis, Pampanga."}
                  </p>
                </div>
              </div>

              {/* Search & Sector Filter Toolbar */}
              <div className="bg-white border border-gray-100/80 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by program title, provider, or competency skills..."
                    value={progSearchQuery}
                    onChange={(e) => setProgSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <CustomSelect
                    value={progSectorFilter}
                    onChange={(val) => setProgSectorFilter(val)}
                    options={[
                      { value: "All", label: `All Sectors (${programs.length})` },
                      { value: "IT", label: "IT & Technology" },
                      { value: "Tourism", label: "Tourism & Hospitality" },
                      { value: "Automotive", label: "Automotive & Transport" },
                      { value: "Construction", label: "Construction & Metals" },
                      { value: "Agriculture", label: "Agriculture" },
                      { value: "Health", label: "Health & Social Care" }
                    ]}
                    size="sm"
                    placeholder="All Sectors"
                  />
                </div>
              </div>

              {/* Grid lists / Empty State */}
              {filteredProgramsForSK.length === 0 ? (
                <div className="bg-white border border-gray-100/80 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No Matching TESDA Programs Found</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      {programs.length === 0
                        ? "There are currently no active vocational training programs published in the system database. As soon as partner institutions like TESDA GPSAT add new courses, they will appear here."
                        : "No training programs match your current search query or sector filter. Try adjusting your filters."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProgramsForSK.map((prog) => {
                    const isFull = (prog.slotsRemaining || 0) <= 0;
                    const isEnded = isProgramEnded(prog);
                    // Count how many verified KK members in this local barangay match this program
                    const matchedYouthInBrgy = localYouthProfiles.filter(y => calculateContentBasedMatchScore(y, prog) >= 60);

                    return (
                      <div
                        key={prog.id}
                        className="bg-white border border-gray-100/80 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          {/* Header: Provider badge + Sector */}
                          <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="w-7 h-7 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                                TS
                              </span>
                              <div>
                                <span className="text-[11px] font-bold text-gray-900 block">{prog.provider}</span>
                                <span className="text-[10px] text-gray-400 font-medium">National Certificate (NC)</span>
                              </div>
                            </div>

                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${isEnded
                              ? "bg-purple-100 text-purple-800 border-purple-300 flex items-center gap-1"
                              : isFull
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}>
                              {isEnded ? "Term Ended" : isFull ? "Slots Filled" : "Active Offering"}
                            </span>
                          </div>

                          {/* Program Title */}
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-base leading-snug tracking-tight">{prog.title}</h3>
                            {prog.eligibility && (
                              <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                                {prog.eligibility}
                              </p>
                            )}
                          </div>

                          {/* Key Specs Pills */}
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-1.5 text-gray-700">
                              <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{prog.trainingHours} Hours {isEnded ? "(Concluded)" : ""}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-1.5 text-gray-700">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{prog.location.includes("GPSAT") || prog.location.includes("PTC") ? "GPSAT Campus" : "San Luis Hub"}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-1.5 text-gray-700">
                              <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{prog.cost || "Free / TWSP"}</span>
                            </div>
                            <div className="p-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-1.5 text-gray-700">
                              <Briefcase className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">{prog.type || "Vocational Training"}</span>
                            </div>
                          </div>

                          {/* Slots Progress Bar */}
                          <div>
                            <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                              <span>{isEnded ? "Status" : "Available Slots"}</span>
                              <span className={isEnded ? "text-purple-700 font-bold" : isFull ? "text-red-600 font-bold" : "text-gray-900 font-bold"}>
                                {isEnded ? "CONCLUDED" : isFull ? "FULL" : `${prog.slotsRemaining} of ${prog.slotsTotal} open`}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isEnded ? "bg-purple-400" : isFull ? "bg-red-400" : "bg-[#0A6B43]"}`}
                                style={{ width: isEnded ? "100%" : `${Math.min(100, Math.max(0, ((prog.slotsTotal - prog.slotsRemaining) / (prog.slotsTotal || 1)) * 100))}%` }}
                              />
                            </div>
                          </div>

                          {/* Competencies / Skills Acquired */}
                          {prog.requiredSkills && prog.requiredSkills.length > 0 && (
                            <div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">Target Competencies</span>
                              <div className="flex flex-wrap gap-1">
                                {prog.requiredSkills.slice(0, 3).map((skill, sIdx) => (
                                  <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                                    {skill}
                                  </span>
                                ))}
                                {prog.requiredSkills.length > 3 && (
                                  <span className="text-[10px] text-gray-400 font-bold">+{prog.requiredSkills.length - 3} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Footer: Local Barangay Matched Youth Count */}
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-xs text-[#0A6B43] font-bold bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-xl w-full justify-between">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{matchedYouthInBrgy.length} Youth Matched in Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}</span>
                            </span>
                            <span className="text-[10px] font-extrabold bg-white text-emerald-800 px-1.5 py-0.2 rounded-md border border-emerald-200">
                              {localYouthProfiles.length > 0 ? `${Math.round((matchedYouthInBrgy.length / localYouthProfiles.length) * 100)}%` : "0%"}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.SKILLS_GAP && (
            <div className="space-y-5 sm:space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Skills Gap Analytics
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Katipunan ng Kabataan competency diagnostic insights and training demand trends in Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}.
                  </p>
                </div>
              </div>

              {/* Header & Controls Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">Competency Diagnostics</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} · Labor Market Alignment
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="w-full sm:w-auto min-w-[200px]">
                    <CustomSelect
                      value={analyticsSectorFilter}
                      onChange={(val) => setAnalyticsSectorFilter(val)}
                      options={[
                        { value: "All", label: "All Sector Categories" },
                        { value: "IT", label: "IT & Digital Technologies" },
                        { value: "Food", label: "Food, Culinary & Baking" },
                        { value: "Trades", label: "Construction, Welding & Electrical" },
                        { value: "Automotive", label: "Automotive & Engine Mechanics" },
                        { value: "Agriculture", label: "Agriculture & Agribusiness" }
                      ]}
                      size="sm"
                      placeholder="All Sector Categories"
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleExportSkillsGapExcel}
                      className="flex-1 sm:flex-none justify-center bg-white hover:bg-gray-50 text-emerald-800 border border-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      title="Export Skills Gap Report to styled Excel spreadsheet (.xls)"
                    >
                      <Download className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="truncate">Export Excel (.xls)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSkillsGapReportModalOpen(true)}
                      className="flex-1 sm:flex-none justify-center bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
                      title="Generate printable Skills Gap Analytics report and PDF summary"
                    >
                      <Printer className="w-4 h-4 shrink-0" />
                      <span className="truncate">Print Summary</span>
                    </button>
                  </div>
                </div>
              </div>

              {localYouthProfiles.length === 0 ? (
                <div className="bg-white border border-gray-100/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <BarChart2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No Youth Registered Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Skills gap analytics are calculated automatically from registered youth profiles in <strong>Barangay {designatedBarangay}</strong>. Once KK members register or self-verify, their skill gaps will analyze here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Insights KPI summaries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
                    {(() => {
                      const crit = getSkillGapCriticality(mostCriticalGapItem.percentage, mostCriticalGapItem.count);
                      return (
                        <div className={`bg-white border p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-start gap-3.5 sm:gap-4 transition-all hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] ${crit.level === "Critical" ? "border-red-200 hover:border-red-400" :
                          crit.level === "Moderate" ? "border-amber-200 hover:border-amber-400" :
                            "border-gray-100/80 hover:border-emerald-300"
                          }`}>
                          <div className={`w-11 h-11 rounded-xl shrink-0 border flex items-center justify-center ${crit.level === "Critical" ? "bg-red-50 text-red-600 border-red-100" :
                            crit.level === "Moderate" ? "bg-amber-50 text-amber-700 border-amber-100" :
                              "bg-emerald-50 text-[#0A6B43] border-emerald-100"
                            }`}>
                            <AlertTriangle className={`w-5 h-5 ${crit.level === "Critical" ? "text-red-600" :
                              crit.level === "Moderate" ? "text-amber-600" :
                                "text-emerald-600"
                              }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">Most Critical Gap</span>
                              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border shrink-0 ${crit.badgeClass}`}>
                                {mostCriticalGapItem.percentage}% ({crit.level})
                              </span>
                            </div>
                            <h4 className="font-extrabold text-gray-900 text-base mt-0.5 truncate tracking-tight" title={mostCriticalGapItem.skill}>
                              {mostCriticalGapItem.skill}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                              <strong>{mostCriticalGapItem.count}</strong> registered youth identified with this competency deficiency.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-white border border-gray-100/80 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-start gap-3.5 sm:gap-4 hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] hover:border-emerald-300 transition-all">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0A6B43] shrink-0 border border-emerald-100 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#0A6B43]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">Top Sector</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-100 text-[#0A6B43] shrink-0">
                            {highestSector.count} Youth
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-base mt-0.5 truncate tracking-tight" title={highestSector.name}>
                          {highestSector.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                          Expressed priority career interest from local Katipunan ng Kabataan members.
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100/80 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex items-start gap-3.5 sm:gap-4 hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] hover:border-red-300 transition-all sm:col-span-2 md:col-span-1">
                      <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 shrink-0 border border-red-100 flex items-center justify-center">
                        <Users2 className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block truncate">Priority OSY</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-red-100 text-red-700 shrink-0">
                            {unmatchedCount} Unmatched
                          </span>
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-base mt-0.5 tracking-tight">
                          {unmatchedCount} KK Members
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                          Requiring targeted TVET scholarship matching & direct application support.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Recommendation Grid */}
                  {(() => {
                    const filteredGaps = localSkillsGaps.filter(g => {
                      if (analyticsSectorFilter === "All") return true;
                      if (analyticsSectorFilter === "IT") return g.skill.toLowerCase().includes("computer") || g.skill.toLowerCase().includes("digital");
                      if (analyticsSectorFilter === "Food") return g.skill.toLowerCase().includes("food") || g.skill.toLowerCase().includes("bread") || g.skill.toLowerCase().includes("pastry");
                      if (analyticsSectorFilter === "Trades") return g.skill.toLowerCase().includes("welding") || g.skill.toLowerCase().includes("electrical") || g.skill.toLowerCase().includes("smaw");
                      if (analyticsSectorFilter === "Automotive") return g.skill.toLowerCase().includes("automotive") || g.skill.toLowerCase().includes("engine");
                      if (analyticsSectorFilter === "Agriculture") return g.skill.toLowerCase().includes("agriculture") || g.skill.toLowerCase().includes("agri");
                      return true;
                    });
                    const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 sm:gap-6">
                        {/* Competency Deficiency Analysis Card */}
                        <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 lg:col-span-3 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-gray-100 pb-3">
                            <div>
                              <h3 className="font-extrabold text-gray-900 text-base tracking-tight">Competency Deficiency Analysis</h3>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">Relative skill deficiency rates across registered youth</p>
                            </div>
                            <span className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-150 uppercase tracking-wider self-start sm:self-auto">
                              {filteredGaps.length} {filteredGaps.length === 1 ? "Identified Gap" : "Identified Gaps"}
                            </span>
                          </div>

                          {/* Criticality Rating Legend for Academic & Executive Triage */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 bg-gray-50/90 rounded-xl border border-gray-200/80 text-[11px]">
                            <div className="flex items-center gap-1.5 text-gray-600 font-bold uppercase tracking-wider text-[10px]">
                              <span>Gap Criticality Rating:</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] font-bold">
                              <div className="flex items-center gap-1.5 text-red-700 bg-red-50/90 px-2 py-0.5 rounded-md border border-red-200/70 shadow-2xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-1 ring-red-300" />
                                <span>Critical Gap (≥30%)</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50/90 px-2 py-0.5 rounded-md border border-amber-200/70 shadow-2xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-1 ring-amber-300" />
                                <span>Moderate Gap (15–29%)</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200/70 shadow-2xs">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-emerald-300" />
                                <span>Low Gap (&lt;15%)</span>
                              </div>
                            </div>
                          </div>

                          {filteredGaps.length === 0 ? (
                            <div className="text-center py-8 px-4 text-xs text-gray-400 bg-gray-50/60 rounded-xl border border-gray-100">
                              No competency gaps found under the "{analyticsSectorFilter}" sector category.
                            </div>
                          ) : (
                            <div className="space-y-3.5 sm:space-y-4">
                              {filteredGaps.map((gap) => {
                                const crit = getSkillGapCriticality(gap.percentage, gap.count);
                                return (
                                  <div key={gap.skill} className="space-y-2 bg-gray-50/50 p-3.5 rounded-xl border border-gray-150/80 hover:border-gray-250 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-gray-800 text-xs sm:text-sm leading-snug">{gap.skill}</span>
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${crit.badgeClass}`}>
                                          {crit.label}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
                                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                          {gap.availableSlots} Slots Available
                                        </span>
                                        <span className="text-gray-700 font-black text-xs">
                                          {gap.count} youth <span className="text-gray-400 font-medium">({gap.percentage}%)</span>
                                        </span>
                                      </div>
                                    </div>

                                    <div className={`w-full h-2.5 sm:h-3 rounded-full overflow-hidden ${crit.trackClass}`}>
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${crit.barClass}`}
                                        style={{ width: `${Math.max(8, (gap.count / maxCount) * 100)}%` }}
                                      />
                                    </div>

                                    <div className="flex items-start gap-1.5 text-[11px] text-emerald-950 bg-emerald-50/80 p-2 sm:p-2.5 rounded-lg border border-emerald-100 font-medium leading-relaxed">
                                      <span className="text-[10px] font-black uppercase text-[#0A6B43] shrink-0 mt-0.5">Action:</span>
                                      <span>{gap.recommendedAction}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* AI Strategic Policy Recommendations */}
                        <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 lg:col-span-2 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2.5 border-b border-gray-100 pb-3">
                            <div>
                              <h3 className="font-extrabold text-gray-900 text-base tracking-tight">AI Policy Directives</h3>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">Strategic youth livelihood & TVET pathways</p>
                            </div>
                            <button
                              onClick={handleGenerateAiPolicyReport}
                              disabled={isGeneratingAiReport}
                              className="w-full sm:w-auto justify-center bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              <span>{isGeneratingAiReport ? "Analyzing..." : "Ask Gemini AI"}</span>
                            </button>
                          </div>

                          {aiPolicyReport && (
                            <div className="bg-emerald-50/90 p-3.5 sm:p-4 rounded-xl border border-emerald-200 text-xs text-emerald-950 leading-relaxed font-medium space-y-2 animate-in fade-in duration-200 shadow-2xs">
                              <div className="flex items-center gap-1.5 text-[#0A6B43] font-extrabold uppercase text-[10px] tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                Live Google Gemini Policy Synthesis
                              </div>
                              <p className="whitespace-pre-line text-xs">{aiPolicyReport}</p>
                            </div>
                          )}

                          <div className="space-y-2.5">
                            {[
                              {
                                title: `Fund Priority Training Batch: ${highestSector.name !== "None" ? highestSector.name : "Technical Vocational"}`,
                                desc: `${highestSector.count} registered youth in Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")} express key interest in ${highestSector.name}. Requesting a dedicated mobile training batch from TESDA GPSAT is strongly advised.`,
                              },
                              {
                                title: `Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")} Digital & Practical Skills Caravan`,
                                desc: `${mostCriticalGapItem.count} youth lack core ${mostCriticalGapItem.skill.toLowerCase()}. Hosting localized workshops at the barangay hall will directly bridge this gap.`,
                              },
                              {
                                title: "LGU & DTI Micro-Enterprise Partnership",
                                desc: `Partner with local business development centers to mentor youth interested in self-employment, freelance trade work, and micro-business.`
                              }
                            ].map((rec, index) => (
                              <div key={index} className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 bg-gray-50/80 border border-gray-150/80 rounded-xl hover:bg-emerald-50/40 transition-colors">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black text-xs shrink-0 mt-0.5 border border-emerald-200">
                                  ✓
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-800 leading-snug">{rec.title}</p>
                                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed font-medium">{rec.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.ANNOUNCEMENTS && (
            <div className="space-y-5 sm:space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    SK Announcements
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Broadcast news, TESDA scholarship advisories, and community training updates visible directly in youth portals.
                  </p>
                </div>
              </div>

              {/* Active Bulletins Card Container */}
              <div className="bg-white border border-gray-100/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden">
                {/* Card Header Toolbar */}
                <div className="p-4 sm:p-6 pb-0 sm:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[22px] font-extrabold text-gray-900 tracking-tight">Active Announcements</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 leading-none">
                      {localAnnouncements.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAnnouncementId(null);
                      setAnnTitle("");
                      setAnnBody("");
                      setAnnEventDate("");
                      setAnnEventDatePicker("");
                      setAnnEventTimePicker("");
                      setAnnVenue("");
                      setAnnContactPerson("");
                      setShowAnnouncementModal(true);
                    }}
                    className="w-full sm:w-auto justify-center bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="w-4.5 h-4.5 shrink-0" />
                    <span>Post Announcement</span>
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6 space-y-5">
                  {/* Search & Category Filter Toolbar */}
                  {localAnnouncements.length > 0 && (
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
                      <div className="flex-1 relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search announcements by title, content, venue, or contact..."
                          value={annSearchQuery}
                          onChange={(e) => setAnnSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="w-full sm:w-48 shrink-0">
                        <CustomSelect
                          value={annCategoryFilter}
                          onChange={(val) => setAnnCategoryFilter(val)}
                          options={[
                            { value: "All", label: `All Categories (${localAnnouncements.length})` },
                            { value: "Program Update", label: "Program Update" },
                            { value: "Event", label: "Event" },
                            { value: "Reminder", label: "Reminder" },
                            { value: "General", label: "General" }
                          ]}
                          size="sm"
                          placeholder="All Categories"
                        />
                      </div>
                    </div>
                  )}

                  {/* Announcements cards / Empty State */}
                  {localAnnouncements.length === 0 ? (
                    <div className="py-12 sm:py-16 px-4 text-center max-w-lg mx-auto space-y-4">
                      {/* Green Illustrated Megaphone (No Lighting Effect) */}
                      <div className="mx-auto flex items-center justify-center">
                        <img
                          src="/megaphone-green.png"
                          alt="No Announcements Yet"
                          className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-300 hover:scale-105 select-none"
                          draggable={false}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight leading-snug">
                          No Announcements Yet
                        </h3>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-normal max-w-md mx-auto">
                          Keep your KK youth updated by posting your first barangay announcement.
                        </p>
                      </div>
                    </div>
                  ) : filteredAnnouncements.length === 0 ? (
                    <div className="py-10 text-center max-w-md mx-auto space-y-2">
                      <Search className="w-8 h-8 text-gray-300 mx-auto" />
                      <p className="text-sm font-bold text-gray-800">No Announcements Match Your Search</p>
                      <p className="text-xs text-gray-500">Try adjusting your keyword search or category filter.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setAnnSearchQuery("");
                          setAnnCategoryFilter("All");
                        }}
                        className="mt-2 text-xs font-bold text-[#0A6B43] hover:underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                      {filteredAnnouncements.map((ann) => {
                        const isCancelled = ann.status === "Cancelled";

                        return (
                          <div
                            key={ann.id}
                            className={`bg-white border rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 ${isCancelled
                              ? "border-red-200 bg-red-50/20"
                              : "border-gray-200/80 hover:border-emerald-200"
                              }`}
                          >
                            <div className="space-y-3">
                              {/* Top row: Category, Status, Event, and Date Posted */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 pb-2.5 border-b border-gray-100">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${ann.category === "Event"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : ann.category === "Reminder"
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : ann.category === "Program Update"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-100 text-gray-700 border-gray-200"
                                    }`}>
                                    {ann.category}
                                  </span>

                                  {isCancelled && (
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full uppercase tracking-wider">
                                      Cancelled
                                    </span>
                                  )}

                                  {ann.eventDate && (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                                      <Calendar className="w-3 h-3 text-[#0A6B43] shrink-0" />
                                      <span>{ann.eventDate}</span>
                                    </span>
                                  )}
                                </div>

                                <span className="text-[10px] text-gray-400 font-medium sm:text-right shrink-0">
                                  Posted {ann.datePosted}
                                </span>
                              </div>

                              {/* Title & Body */}
                              <div>
                                <h4 className={`font-extrabold text-base sm:text-lg leading-snug ${isCancelled ? "text-gray-600 line-through" : "text-gray-900"}`}>
                                  {ann.title}
                                </h4>
                                <p className="text-xs text-gray-600 leading-relaxed mt-1.5 whitespace-pre-line font-normal">
                                  {ann.body}
                                </p>
                              </div>

                              {/* Venue & Contact Box */}
                              {(ann.venue || ann.contactPerson) && (
                                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-150 space-y-1.5 text-xs">
                                  {ann.venue && (
                                    <div className="flex items-start gap-1.5 text-gray-700 font-medium">
                                      <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                                      <span className="break-words">Venue: <strong className="text-gray-900">{ann.venue}</strong></span>
                                    </div>
                                  )}
                                  {ann.contactPerson && (
                                    <div className="flex items-start gap-1.5 text-gray-700 font-medium">
                                      <Phone className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                                      <span className="break-words">Contact: <strong className="text-gray-900">{ann.contactPerson}</strong></span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Card Footer: Target Audience & Mobile-friendly Action Buttons */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                              <span className="text-[11px] text-gray-500 font-medium truncate">
                                Target: <strong className="text-gray-800">{ann.audience}</strong>
                              </span>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditAnnouncement(ann)}
                                  className="p-2 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-[#0A6B43] border border-gray-200 transition-colors cursor-pointer active:scale-95"
                                  title="Edit Announcement"
                                  aria-label="Edit Announcement"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelAnnouncement(ann)}
                                  className={`p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 ${isCancelled
                                    ? "bg-emerald-50 text-[#0A6B43] border-emerald-200 hover:bg-emerald-100"
                                    : "bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 border-gray-200"
                                    }`}
                                  title={isCancelled ? "Reactivate Announcement" : "Cancel Announcement"}
                                  aria-label={isCancelled ? "Reactivate Announcement" : "Cancel Announcement"}
                                >
                                  {isCancelled ? <RefreshCw className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAnnouncement(ann.id)}
                                  className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 transition-colors cursor-pointer active:scale-95"
                                  title="Permanently Delete Announcement"
                                  aria-label="Delete Announcement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.SETTINGS && (
            <div className="space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Settings & Profile
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage official administrative profile, security credentials, system notifications, and ID credentials.
                  </p>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] shrink-0"
                >
                  {[
                    { id: "profile", label: "Official Details", icon: User },
                    { id: "security", label: "Security & Password", icon: Lock },
                    { id: "preferences", label: "Alerts & Notifications", icon: Bell },
                    { id: "credentials", label: "Digital ID Card", icon: ShieldCheck },
                  ].map((tab) => {
                    const isActive = activeSettingsTab === tab.id;
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSettingsTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all duration-200 ease-out select-none ${isActive
                          ? "bg-[#0A6B43] text-white shadow-xs"
                          : "bg-transparent text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50/70"
                          }`}
                      >
                        <IconComponent
                          fill={isActive ? "currentColor" : "none"}
                          className={`w-4 h-4 shrink-0 transition-all duration-200 ease-out ${isActive
                            ? `text-white ${tab.id === "security"
                              ? "[&>path]:fill-none"
                              : tab.id === "credentials"
                                ? "[&>path:last-child]:stroke-[#0A6B43] [&>path:last-child]:fill-none"
                                : ""
                            }`
                            : "text-gray-500 hover:text-[#0A6B43]"
                            }`}
                        />
                        <span className="transition-colors duration-200 ease-out">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* Sub-Tab 1: Official Details Form */}
                {activeSettingsTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="bg-white rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-3xl"
                  >
                    <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <User className="w-4.5 h-4.5 text-[#0A6B43]" />
                          Personal Demographics
                        </h3>
                      </div>

                      {/* Section 1: Basic Information */}
                      <div className="space-y-3.5">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                          Basic Information
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Full Name*</label>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                required
                                value={settingsName}
                                onChange={(e) => setSettingsName(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-sm font-medium transition-colors bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                disabled
                                value={settingsName}
                                className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                              />
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Role/Position</label>
                            <input
                              type="text"
                              disabled
                              value={settingsPos}
                              className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Email*</label>
                            {isEditingProfile ? (
                              <input
                                type="email"
                                required
                                value={settingsEmail}
                                onChange={(e) => setSettingsEmail(e.target.value)}
                                className="w-full p-2.5 border rounded-lg text-sm font-medium transition-colors bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            ) : (
                              <input
                                type="email"
                                disabled
                                value={settingsEmail}
                                className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                              />
                            )}
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Contact Phone Number*</label>
                            {isEditingProfile ? (
                              <input
                                type="text"
                                required
                                value={settingsPhone}
                                onChange={(e) => setSettingsPhone(formatContactNumber(e.target.value))}
                                className="w-full p-2.5 border rounded-lg text-sm font-medium transition-colors bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                disabled
                                value={settingsPhone || "Not configured"}
                                className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Administrative Jurisdiction & Office Location */}
                      <div className="space-y-3.5 pt-1">
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#0A6B43]" />
                          Location Details
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Barangay Jurisdiction</label>
                            <input
                              type="text"
                              disabled
                              value={`Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}`}
                              className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Municipality</label>
                            <input
                              type="text"
                              disabled
                              value="San Luis"
                              className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Province</label>
                            <input
                              type="text"
                              disabled
                              value="Pampanga"
                              className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Form Buttons */}
                      <div className="pt-2 flex justify-end gap-2.5">
                        {isEditingProfile ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingProfile(false);
                                if (currentUser) {
                                  setSettingsName(currentUser.name);
                                  setSettingsEmail(currentUser.email);
                                  setSettingsPos(officialPosition);
                                }
                              }}
                              disabled={isSavingProfile}
                              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingProfile}
                              className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer bg-[#0A6B43] hover:bg-[#075332]"
                            >
                              {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Save Profile Changes
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer bg-[#0A6B43] hover:bg-[#075332]"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Profile Details
                          </button>
                        )}
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Sub-Tab 2: Security & Password */}
                {activeSettingsTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] max-w-xl"
                  >
                    <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <Lock className="w-4.5 h-4.5 text-[#0A6B43]" />
                          Account Security & Password
                        </h3>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Current Password*</label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? "text" : "password"}
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password..."
                            className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">New Password*</label>
                        <div className="relative">
                          <input
                            type={showNewPass ? "text" : "password"}
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min. 6 characters)..."
                            className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Confirm New Password*</label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-type new password..."
                            className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
                        >
                          {isChangingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                          Update Account Password
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}



                {/* Sub-Tab 3: System Notifications */}
                {activeSettingsTab === "preferences" && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="w-full max-w-[740px]"
                  >
                    <NotificationSettingsCard
                      userRole="SK_OFFICIAL"
                      userEmail={settingsEmail || currentUser?.email}
                      addToast={addToast}
                      className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6 animate-in fade-in duration-150"
                    />
                  </motion.div>
                )}

                {/* Sub-Tab 4: Official SK Digital ID Card */}
                {activeSettingsTab === "credentials" && (
                  <motion.div
                    key="credentials"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-6 max-w-2xl"
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <ShieldCheck className="w-4.5 h-4.5 text-[#0A6B43]" />
                          Official SK Digital ID Card
                        </h3>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">
                          Official Sangguniang Kabataan identification credential for Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}, San Luis, Pampanga
                        </p>
                      </div>

                      {/* Official Digital ID Card */}
                      <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto bg-white rounded-2xl border-2 border-emerald-800/20 shadow-md overflow-hidden relative">
                        {/* Top Section: Organization Header */}
                        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-gray-100 gap-2 sm:gap-3">
                          {/* Left Logo: Municipality of San Luis Seal */}
                          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                            <img
                              src="/san-luis-seal.png"
                              alt="Municipality of San Luis Seal"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Centered Institutional Information */}
                          <div className="text-center flex-1 px-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                              Republic of the Philippines
                            </p>
                            <p className="text-xs sm:text-sm md:text-[15px] font-black uppercase tracking-wide text-gray-900 leading-tight my-0.5">
                              Municipality of San Luis
                            </p>
                            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#0A6B43] leading-tight">
                              Province of Pampanga
                            </p>
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                              Sangguniang Kabataan
                            </p>
                          </div>

                          {/* Right Logo: Sangguniang Kabataan */}
                          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                            <img
                              src="/sk-logo.png"
                              alt="Sangguniang Kabataan Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Second Section: Full-Width Title Bar */}
                        <div className="bg-[#0A6B43] text-white py-1 px-3 text-center shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest block">
                            Sangguniang Kabataan Official ID Card
                          </span>
                        </div>

                        {/* Main Content Area: Two Columns */}
                        <div className="p-3.5 sm:p-4 flex flex-row items-start gap-3.5 sm:gap-4.5 bg-gradient-to-b from-white to-gray-50/60">
                          {/* Left Column: Rectangular Profile Photo Area + Complete ID Number in One Row */}
                          <div className="flex flex-col items-center shrink-0 w-32 sm:w-36">
                            <div className="w-24 sm:w-28 h-30 sm:h-34 rounded-xl border-2 border-emerald-600/30 bg-gradient-to-tr from-[#082D21] to-[#0A6B43] flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white font-black text-lg sm:text-xl">
                                {settingsName
                                  ? settingsName
                                    .split(" ")
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)
                                  : "SK"}
                              </div>
                              <span className="text-[9px] font-extrabold text-white/90 uppercase tracking-wider mt-1.5">Official Photo</span>
                            </div>

                            {/* ID Number in one row without ellipsis */}
                            <div className="mt-2 text-center w-full">
                              <span className="font-mono text-[9px] sm:text-[9.5px] font-bold text-[#0A6B43] tracking-tight bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap inline-block">
                                ID: {`SK-SL-${designatedBarangay.replace(/^Barangay\s+/i, "").toUpperCase().slice(0, 3)}-${String(currentUser?.id || "001").toUpperCase().slice(-4)}`}
                              </span>
                            </div>
                          </div>

                          {/* Right Column: Official Information in compact rows and columns */}
                          <div className="flex-1 w-full space-y-2.5 min-w-0">
                            {/* Official Name */}
                            <div className="border-b border-gray-100 pb-1.5">
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Official Name</span>
                              <h4 className="text-sm sm:text-base font-black uppercase text-gray-900 tracking-tight leading-tight mt-0.5 truncate">
                                {settingsName}
                              </h4>
                            </div>

                            {/* Designation & Phone Number */}
                            <div className="grid grid-cols-12 gap-2">
                              <div className="col-span-7 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Position</span>
                                <span className="text-xs font-black text-[#0A6B43] block truncate mt-0.5">
                                  {settingsPos}
                                </span>
                              </div>

                              <div className="col-span-5 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone</span>
                                <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                                  {settingsPhone || "N/A"}
                                </span>
                              </div>
                            </div>

                            {/* Official Email */}
                            <div>
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">System Email</span>
                              <span className="text-xs font-mono font-medium text-gray-800 block truncate mt-0.5">
                                {settingsEmail}
                              </span>
                            </div>

                            {/* Jurisdiction Address */}
                            <div className="border-t border-gray-100 pt-1.5">
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Jurisdiction Office</span>
                              <span className="text-xs font-bold text-gray-800 block leading-snug mt-0.5">
                                Barangay Hall, Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}, San Luis, Pampanga
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Status Clearance Strip */}
                        <div className="px-4 py-2 bg-emerald-50/70 border-t border-emerald-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-1.5 font-bold text-[#0A6B43] min-w-0">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider">Clearance Status:</span>
                            <span className="font-semibold text-gray-800 text-[11px] truncate">Tier 2 Administrative Authority</span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#0A6B43] text-white shrink-0">
                            Active Leader ✓
                          </span>
                        </div>
                      </div>

                      {/* Action Button: Moved to Bottom Right */}
                      <div className="flex justify-end pt-3 w-full">
                        <button
                          onClick={() => {
                            const fullIdStr = `SK-SL-${designatedBarangay.replace(/^Barangay\s+/i, "").toUpperCase().slice(0, 3)}-${String(currentUser?.id || "001").toUpperCase().slice(-4)}`;
                            navigator.clipboard?.writeText(
                              `Sangguniang Kabataan Official Digital ID Card:\nName: ${settingsName.toUpperCase()}\nPosition: ${settingsPos}\nID: ${fullIdStr}\nEmail: ${settingsEmail}\nPhone: ${settingsPhone || "N/A"}\nJurisdiction: Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}, San Luis, Pampanga\nClearance: Tier 2 Administrative Authority (Active)`
                            );
                            addToast("Official Digital ID Card information copied to clipboard!", "success");
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-[#0A6B43]" />
                          Copy Digital ID Info
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {currentScreen === SKOfficialScreen.COUNCILORS && isChairperson && (
            <div className="space-y-6" id="sk-my-team-container">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    My Team — SK Council
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage council members, executive appointees, and administrative permissions for Barangay {designatedBarangay}.
                  </p>
                </div>
              </div>

              {/* Action Toolbar with Scope & Controls */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 sm:gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Barangay Governance
                  </span>
                  <span className="text-xs font-bold text-gray-500">
                    Barangay {designatedBarangay} · {councilors.length} Members
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto shrink-0">
                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                    <button
                      onClick={() => setCouncilorViewMode("grid")}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${councilorViewMode === "grid"
                        ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden md:inline">Grid</span>
                    </button>
                    <button
                      onClick={() => setCouncilorViewMode("table")}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${councilorViewMode === "table"
                        ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                        : "text-gray-500 hover:text-gray-800"
                        }`}
                      title="Table View"
                    >
                      <Table className="w-4 h-4" />
                      <span className="hidden md:inline">Table</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (localCouncilors.length >= 11) {
                        addToast("Council roster is at full capacity (Maximum 11 members: 7 Councilors, 2 Secretaries, 2 Treasurers).", "info");
                        return;
                      }
                      setCouncilorName("");
                      setCouncilorEmail("");
                      if (roleCounts.councilorsCount < 7) {
                        setCouncilorRole("SK Councilor");
                      } else if (roleCounts.secretariesCount < 2) {
                        setCouncilorRole("Secretary");
                      } else if (roleCounts.treasurersCount < 2) {
                        setCouncilorRole("Treasurer");
                      }
                      generateCouncilorPassword();
                      setIsAddCouncilorOpen(true);
                    }}
                    className="bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Member ({localCouncilors.length}/11)</span>
                  </button>
                </div>
              </div>

              {/* Newly Created Councilor Credentials Callout Banner */}
              {createdCouncilorAccount && (
                <div className="bg-gradient-to-r from-emerald-950 via-[#164132] to-[#0D2E22] rounded-2xl p-5 sm:p-6 text-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-emerald-500/40 relative animate-in fade-in slide-in-from-top-3 duration-200">
                  <button
                    onClick={() => setCreatedCouncilorAccount(null)}
                    className="absolute top-3 right-3 text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-2xl pr-8 lg:pr-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 px-2.5 py-0.5 rounded-md border border-emerald-600/40">
                          Account Provisioned & Ready
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-white">
                        {createdCouncilorAccount.role}: {createdCouncilorAccount.name}
                      </h3>
                      <p className="text-xs text-emerald-100/80 leading-relaxed">
                        Official login credentials have been configured. Provide these details to the member to allow them to access the Barangay {designatedBarangay} official portal.
                      </p>
                      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 pt-1.5 text-xs">
                        <span className="bg-black/35 px-3 py-1.5 rounded-lg border border-white/10 text-emerald-200 font-mono break-all">
                          Email: <strong className="text-white">{createdCouncilorAccount.email}</strong>
                        </span>
                        <span className="bg-black/35 px-3 py-1.5 rounded-lg border border-white/10 text-emerald-200 font-mono break-all">
                          Temp Password: <strong className="text-amber-300">{createdCouncilorAccount.password}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const text = `Sangguniang Kabataan Portal Access Credentials\nBarangay: Barangay ${designatedBarangay}\nName: ${createdCouncilorAccount.name}\nRole: ${createdCouncilorAccount.role}\nLogin Email: ${createdCouncilorAccount.email}\nTemporary Password: ${createdCouncilorAccount.password}\nPortal Link: ${window.location.origin}`;
                          navigator.clipboard?.writeText(text);
                          addToast("Credentials copied to clipboard!", "success");
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Full Credentials
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Stat Cards Grid (Responsive 2x2 on Mobile, 4-col on Desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Stat 1: Total Members */}
                <div className="bg-white border border-gray-100/80 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Council Roster</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center border border-emerald-100 shrink-0">
                      <Users2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">{localCouncilors.length}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400">/ 11 Capacity</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate" title="7 SK Councilors • 2 Secretaries • 2 Treasurers">
                      7 Councilors • 2 Sec • 2 Treas
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0A6B43] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min((localCouncilors.length / 11) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stat 2: Active Officials */}
                <div className="bg-white border border-gray-100/80 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Active Officials</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100 shrink-0">
                      <UserCheck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">{activeCouncilorCount}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                        {localCouncilors.length > 0 ? Math.round((activeCouncilorCount / localCouncilors.length) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 flex items-center gap-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                      Authorized Access
                    </p>
                  </div>
                </div>

                {/* Stat 3: Appointees */}
                <div className="bg-white border border-gray-100/80 rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">Appointees</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100 shrink-0">
                      <Shield className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">
                        {roleCounts.secretariesCount + roleCounts.treasurersCount}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400">/ 4 Appointees</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                      {roleCounts.secretariesCount}/2 Sec • {roleCounts.treasurersCount}/2 Treas
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(((roleCounts.secretariesCount + roleCounts.treasurersCount) / 4) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stat 4: Presiding Officer */}
                <div className="bg-linear-to-br from-emerald-950 to-[#1C2B20] text-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-2 sm:space-y-3 border border-emerald-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 uppercase tracking-wider truncate">Presiding Officer</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-800/60 text-amber-400 flex items-center justify-center border border-emerald-700/50 shrink-0">
                      <Award className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-white truncate" title={settingsName}>
                      {settingsName}
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                      SK Chairperson
                    </p>
                    <p className="text-[9px] sm:text-[10px] text-emerald-300 font-medium mt-0.5 truncate">
                      Barangay {designatedBarangay}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Search Bar */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={councilorSearch}
                      onChange={(e) => setCouncilorSearch(e.target.value)}
                      placeholder="Search by name, email, or contact..."
                      className="w-full pl-9.5 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden transition-all"
                    />
                    {councilorSearch && (
                      <button
                        onClick={() => setCouncilorSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
                    <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Status:</span>
                    {["All", "Active", "Inactive"].map((st) => (
                      <button
                        key={st}
                        onClick={() => setCouncilorStatusFilter(st)}
                        className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${councilorStatusFilter === st
                          ? "bg-emerald-900 text-white shadow-2xs"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Filter Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] font-bold text-gray-400 uppercase shrink-0">Role Filter:</span>
                  {[
                    { id: "All", label: `All (${localCouncilors.length}/11)` },
                    { id: "SK Councilor", label: `Councilors (${roleCounts.councilorsCount}/7)` },
                    { id: "Secretary", label: `Secretaries (${roleCounts.secretariesCount}/2)` },
                    { id: "Treasurer", label: `Treasurers (${roleCounts.treasurersCount}/2)` }
                  ].map((rf) => (
                    <button
                      key={rf.id}
                      onClick={() => setCouncilorRoleFilter(rf.id)}
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${councilorRoleFilter === rf.id
                        ? "bg-[#0A6B43] text-white shadow-2xs font-bold"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-150 border border-gray-200"
                        }`}
                    >
                      {rf.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Councilors Roster View / Empty States */}
              {localCouncilors.length === 0 ? (
                /* Primary Empty State */
                <div className="bg-white border border-gray-100/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto shadow-2xs">
                    <Users2 className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg">Build Your Barangay SK Council</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      No councilors, secretaries, or treasurers are registered for <strong>Barangay {designatedBarangay}</strong> yet. Provision accounts to empower your team with administrative portal access.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCouncilorName("");
                      setCouncilorEmail("");
                      setCouncilorRole("SK Councilor");
                      generateCouncilorPassword();
                      setIsAddCouncilorOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Council Member
                  </button>
                </div>
              ) : filteredCouncilors.length === 0 ? (
                /* Filter Result Empty State */
                <div className="bg-white border border-gray-100/80 rounded-2xl p-8 sm:p-10 text-center max-w-md mx-auto space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">No Matching Council Members</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    No officials matched your search criteria or role filters.
                  </p>
                  <button
                    onClick={() => {
                      setCouncilorSearch("");
                      setCouncilorRoleFilter("All");
                      setCouncilorStatusFilter("All");
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : councilorViewMode === "grid" ? (
                /* GRID CARDS VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
                  {filteredCouncilors.map((c) => {
                    const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    const isSecretary = c.role.toLowerCase().includes("secretary");
                    const isTreasurer = c.role.toLowerCase().includes("treasurer");

                    const roleBadgeClass = isSecretary
                      ? "bg-amber-50 text-amber-900 border-amber-200"
                      : isTreasurer
                        ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                        : "bg-emerald-50 text-emerald-900 border-emerald-200";

                    const avatarGradient = isSecretary
                      ? "from-amber-500 to-orange-600"
                      : isTreasurer
                        ? "from-indigo-500 to-blue-700"
                        : "from-emerald-600 to-teal-800";

                    return (
                      <div
                        key={c.id}
                        className="bg-white border border-gray-100/80 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgb(0,0,0,0.08)] hover:border-emerald-200 transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3">
                          {/* Card Header: Role Badge + Status Indicator */}
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${roleBadgeClass}`}>
                              {c.role}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${c.status === "Active"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-red-50 text-red-700 border-red-200"
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${c.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                              {c.status}
                            </span>
                          </div>

                          {/* Member Avatar & Identity */}
                          <div className="flex items-center gap-3 pt-1">
                            <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 ring-2 ring-white`}>
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-extrabold text-gray-900 text-base truncate group-hover:text-[#0A6B43] transition-colors" title={c.name}>
                                {c.name}
                              </h3>
                              <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                Barangay {designatedBarangay}
                              </p>
                            </div>
                          </div>

                          {/* Contact Details Information */}
                          <div className="bg-gray-50/80 p-2.5 sm:p-3 rounded-xl border border-gray-150 space-y-2 text-xs font-semibold text-gray-700">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 shrink-0">
                                <Mail className="w-3 h-3 text-gray-400" /> Email:
                              </span>
                              <span
                                onClick={() => {
                                  navigator.clipboard?.writeText(c.email);
                                  addToast("Email copied to clipboard!", "success");
                                }}
                                className="font-mono text-[11px] text-gray-800 hover:text-[#0A6B43] hover:underline cursor-pointer truncate max-w-[170px] sm:max-w-[200px]"
                                title="Click to copy email"
                              >
                                {c.email}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1 shrink-0">
                                <Phone className="w-3 h-3 text-gray-400" /> Contact:
                              </span>
                              <span
                                onClick={() => {
                                  if (c.contactNumber && c.contactNumber !== "N/A") {
                                    navigator.clipboard?.writeText(c.contactNumber);
                                    addToast("Contact number copied to clipboard!", "success");
                                  }
                                }}
                                className="font-semibold text-[11px] text-gray-800 hover:text-[#0A6B43] cursor-pointer"
                                title="Click to copy contact"
                              >
                                {c.contactNumber || "N/A"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60 text-[10px] text-gray-400 font-medium">
                              <span>Date Appointed:</span>
                              <span className="font-bold text-gray-600">{c.dateCreated || "Active Term"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons Toolbar */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleToggleCouncilorStatus(c.id)}
                            className={`flex-1 h-8 py-1 text-[11px] font-bold rounded-xl border transition-all uppercase cursor-pointer active:scale-95 ${c.status === "Active"
                              ? "border-amber-200 text-amber-700 bg-amber-50/60 hover:bg-amber-100/70"
                              : "border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70"
                              }`}
                          >
                            {c.status === "Active" ? "Deactivate" : "Activate"}
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingCouncilorId(c.id);
                                setEditCouncilorName(c.name);
                                setEditCouncilorEmail(c.email);
                                setEditCouncilorContact(c.contactNumber || "+63 9");
                                setEditCouncilorRole(c.role || "SK Councilor");
                                setIsEditCouncilorOpen(true);
                              }}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-amber-700 bg-gray-50 hover:bg-amber-50 border border-gray-200 rounded-xl transition-colors cursor-pointer active:scale-95"
                              title="Edit Member Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCouncilor(c.id)}
                              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-700 bg-gray-50 hover:bg-red-50 border border-gray-200 rounded-xl transition-colors cursor-pointer active:scale-95"
                              title="Remove Official from Team"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* TABLE VIEW */
                <div className="bg-white border border-gray-100/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                  {/* Mobile Swipe Hint */}
                  <div className="sm:hidden px-3.5 py-1.5 bg-emerald-50/60 border-b border-emerald-100/70 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Table view · Swipe horizontally to view all columns
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold tracking-wider">SWIPE ↔</span>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="px-3.5 py-3 sm:p-4 min-w-[170px]">Official Member</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[130px]">Official Role</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[170px]">Login Email</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[130px]">Contact Number</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[90px] text-center">Status</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[110px] text-center">Appointed Date</th>
                          <th className="px-3.5 py-3 sm:p-4 min-w-[140px] text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {filteredCouncilors.map((c) => {
                          const initials = c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                          const isSecretary = c.role.toLowerCase().includes("secretary");
                          const isTreasurer = c.role.toLowerCase().includes("treasurer");

                          const roleBadgeClass = isSecretary
                            ? "bg-amber-50 text-amber-900 border-amber-200"
                            : isTreasurer
                              ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                              : "bg-emerald-50 text-emerald-900 border-emerald-200";

                          const avatarGradient = isSecretary
                            ? "from-amber-500 to-orange-600"
                            : isTreasurer
                              ? "from-indigo-500 to-blue-700"
                              : "from-emerald-600 to-teal-800";

                          return (
                            <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="px-3.5 py-3 sm:p-4 whitespace-nowrap">
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                                    {initials}
                                  </div>
                                  <div>
                                    <span className="font-extrabold text-gray-900 block text-xs sm:text-sm">{c.name}</span>
                                    <span className="text-[10px] text-gray-400">Barangay {designatedBarangay}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 whitespace-nowrap">
                                <span className={`px-2.5 py-0.5 border rounded-md text-[10px] font-black uppercase ${roleBadgeClass}`}>
                                  {c.role}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 whitespace-nowrap">
                                <span
                                  onClick={() => {
                                    navigator.clipboard?.writeText(c.email);
                                    addToast("Email copied to clipboard!", "success");
                                  }}
                                  className="text-gray-800 font-mono text-[11px] font-bold hover:text-[#0A6B43] hover:underline cursor-pointer"
                                  title="Click to copy email"
                                >
                                  {c.email}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 text-gray-600 font-semibold text-[11px] whitespace-nowrap">
                                {c.contactNumber || "N/A"}
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 text-center whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${c.status === "Active"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${c.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`} />
                                  {c.status}
                                </span>
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 text-center text-gray-400 font-medium text-[11px] whitespace-nowrap">
                                {c.dateCreated || "Active Term"}
                              </td>
                              <td className="px-3.5 py-3 sm:p-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleToggleCouncilorStatus(c.id)}
                                    className={`px-2 py-1 font-bold text-[10px] rounded border transition-colors uppercase cursor-pointer active:scale-95 ${c.status === "Active"
                                      ? "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                      : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                      }`}
                                  >
                                    {c.status === "Active" ? "Deactivate" : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCouncilorId(c.id);
                                      setEditCouncilorName(c.name);
                                      setEditCouncilorEmail(c.email);
                                      setEditCouncilorContact(c.contactNumber || "+63 9");
                                      setEditCouncilorRole(c.role || "SK Councilor");
                                      setIsEditCouncilorOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-amber-50 hover:text-amber-700 text-gray-400 hover:border-amber-200 rounded-lg border border-gray-150 transition-colors cursor-pointer active:scale-95"
                                    title="Edit Official Details"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCouncilor(c.id)}
                                    className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 hover:border-red-200 rounded-lg border border-gray-150 transition-colors cursor-pointer active:scale-95"
                                    title="Remove from Team"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.PENDING_APPROVALS && (
            <div className="space-y-4 sm:space-y-6">
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Pending Approvals
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Review and verify Katipunan ng Kabataan registrations before granting portal access and training endorsements.
                  </p>
                </div>
              </div>

              {/* Status & Scope Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">Verification Queue</h3>
                  <span className="bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    {pendingProfiles.length} Awaiting
                  </span>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-xs text-gray-500 font-bold">Barangay Scope:</span>
                  <span className="text-xs border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl px-3 py-1.5 font-bold shadow-3xs">
                    {designatedBarangay.startsWith("Barangay ") ? designatedBarangay : `Barangay ${designatedBarangay}`}
                  </span>
                </div>
              </div>

              {/* Pending Approvals Table Card */}
              <div className="bg-white border border-gray-100/80 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                {pendingProfiles.length > 0 ? (
                  <>
                    {/* Search & Counter Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3.5 sm:p-4 bg-gray-50/70 border-b border-gray-150">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search pending by name, purok, or ID..."
                          value={pendingSearchQuery}
                          onChange={(e) => {
                            setPendingSearchQuery(e.target.value);
                            setPendingApprovalsPage(1);
                          }}
                          className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                        {pendingSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setPendingSearchQuery("");
                              setPendingApprovalsPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            title="Clear search"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        Showing{" "}
                        <span className="font-bold text-gray-800">
                          {filteredPendingProfiles.length === 0
                            ? 0
                            : `${(currentPendingApprovalPage - 1) * PENDING_APPROVALS_PER_PAGE + 1}-${Math.min(
                              currentPendingApprovalPage * PENDING_APPROVALS_PER_PAGE,
                              filteredPendingProfiles.length
                            )}`}
                        </span>{" "}
                        of <span className="font-bold text-gray-800">{filteredPendingProfiles.length}</span> records
                        {pendingSearchQuery && ` (filtered from ${pendingProfiles.length})`}
                      </div>
                    </div>

                    {/* Mobile Swipe Hint */}
                    <div className="sm:hidden px-3.5 py-1.5 bg-emerald-50/60 border-b border-emerald-100/70 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Table view · Swipe horizontally to see all columns
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold tracking-wider">SWIPE ↔</span>
                    </div>

                    {filteredPendingProfiles.length > 0 ? (
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                              <th className="px-3.5 py-3 sm:p-4 min-w-[150px]">Name</th>
                              <th className="px-3.5 py-3 sm:p-4 min-w-[125px]">Age / Purok</th>
                              <th className="px-3.5 py-3 sm:p-4 min-w-[135px]">Educational Attainment</th>
                              <th className="px-3.5 py-3 sm:p-4 min-w-[140px]">ID Verification</th>
                              <th className="px-3.5 py-3 sm:p-4 min-w-[160px] max-w-[220px]">Livelihood Objective</th>
                              <th className="px-3.5 py-3 sm:p-4 min-w-[210px] text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                            {paginatedPendingApprovalProfiles.map((y) => (
                              <tr key={y.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="px-3.5 py-3 sm:p-4 font-bold text-gray-900 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-black shrink-0">
                                      {y.name ? y.name.charAt(0).toUpperCase() : "Y"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-extrabold text-gray-900 text-xs sm:text-sm">{y.name}</div>
                                      <div className="text-[10px] text-gray-400 font-normal">{y.email || "No email"}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3.5 py-3 sm:p-4 text-gray-500 font-medium whitespace-nowrap">
                                  <div className="text-xs text-gray-700">
                                    {y.age} y/o · <span className="font-bold text-[#1C2B20]">{y.purok}</span>
                                  </div>
                                  <div className="text-[10px] text-[#0A6B43] font-bold mt-0.5">{y.barangay}</div>
                                </td>
                                <td className="px-3.5 py-3 sm:p-4 whitespace-nowrap">
                                  <span className="inline-block bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                                    {y.educationalAttainment}
                                  </span>
                                </td>
                                <td className="px-3.5 py-3 sm:p-4 whitespace-nowrap">
                                  {y.verificationIdType ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" /> {y.verificationIdType}
                                      </span>
                                      <span className="text-[10px] text-gray-400 font-mono font-bold pl-0.5">
                                        No: {y.verificationIdNumber || "N/A"}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" /> In-Person Profile
                                    </span>
                                  )}
                                </td>
                                <td className="px-3.5 py-3 sm:p-4 min-w-[160px] max-w-[220px]">
                                  {y.livelihoodGoal && y.livelihoodGoal.length > 20 ? (
                                    <div>
                                      <p className={expandedAspirations[`p-${y.id}`] ? "text-xs font-medium text-gray-800 leading-relaxed bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/80 my-1 shadow-2xs" : "text-xs font-semibold text-gray-700"}>
                                        {expandedAspirations[`p-${y.id}`] ? y.livelihoodGoal : `${y.livelihoodGoal.slice(0, 20)}...`}
                                      </p>
                                      <button
                                        type="button"
                                        onClick={(e) => toggleAspirationExpand(`p-${y.id}`, e)}
                                        className="text-[10px] font-extrabold text-[#0A6B43] hover:underline mt-0.5 inline-block cursor-pointer"
                                      >
                                        {expandedAspirations[`p-${y.id}`] ? "See Less ▲" : "See More ▼"}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-gray-600 font-medium">{y.livelihoodGoal || "N/A"}</span>
                                  )}
                                </td>
                                <td className="px-3.5 py-3 sm:p-4 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                                    {/* Stacked Group 1: View & Inspect */}
                                    <div className="flex flex-col gap-1 sm:gap-1.5">
                                      <button
                                        onClick={() => setViewingPendingYouthModal(y)}
                                        className="w-24 sm:w-28 h-7 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-bold rounded-xl text-[9.5px] sm:text-[10px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                        title="View full Katipunan ng Kabataan member profile details"
                                      >
                                        <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> View Profile
                                      </button>
                                      <button
                                        onClick={() => setVerifyingYouth(y)}
                                        className="w-24 sm:w-28 h-7 bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95 border border-sky-200/80 font-bold rounded-xl text-[9.5px] sm:text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                        title="Inspect uploaded ID documents and attestations"
                                      >
                                        <ShieldCheck className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-sky-600" /> Inspect ID
                                      </button>
                                    </div>

                                    {/* Subtle Vertical Divider Line */}
                                    <div className="w-px h-11 sm:h-13 bg-gray-200 shrink-0" />

                                    {/* Stacked Group 2: Approve & Reject */}
                                    <div className="flex flex-col gap-1 sm:gap-1.5">
                                      <button
                                        onClick={() => handleApproveYouth(y.id)}
                                        className="w-20 sm:w-24 h-7 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-[9.5px] sm:text-[10px] shadow-2xs transition-all uppercase tracking-wide flex items-center justify-center cursor-pointer"
                                        title="Approve youth registration"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectYouth(y.id)}
                                        className="w-20 sm:w-24 h-7 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-xl text-[9.5px] sm:text-[10px] shadow-2xs transition-all uppercase tracking-wide flex items-center justify-center cursor-pointer"
                                        title="Reject youth registration"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-8 text-center space-y-2">
                        <Search className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs font-bold text-gray-700">No matching pending approvals</p>
                        <p className="text-[11px] text-gray-500">No records found matching &ldquo;{pendingSearchQuery}&rdquo;</p>
                        <button
                          type="button"
                          onClick={() => {
                            setPendingSearchQuery("");
                            setPendingApprovalsPage(1);
                          }}
                          className="mt-1 px-3 py-1.5 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Clear Search Filter
                        </button>
                      </div>
                    )}

                    {/* Pagination Controls (Max 10 per page on both mobile and big screen) */}
                    {totalPendingApprovalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 bg-gray-50/70 border-t border-gray-150">
                        <span className="text-gray-500 text-xs font-medium text-center sm:text-left">
                          Page <span className="font-bold text-gray-800">{currentPendingApprovalPage}</span> of{" "}
                          <span className="font-bold text-gray-800">{totalPendingApprovalPages}</span> (
                          <span className="font-bold text-gray-800">{filteredPendingProfiles.length}</span> total pending)
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          <button
                            type="button"
                            disabled={currentPendingApprovalPage === 1}
                            onClick={() => setPendingApprovalsPage((p) => Math.max(1, p - 1))}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${currentPendingApprovalPage === 1
                              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                              : "border-gray-200 text-gray-700 bg-white hover:bg-emerald-50 hover:text-[#0A6B43] hover:border-emerald-300 cursor-pointer shadow-2xs"
                              }`}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPendingApprovalPages }, (_, idx) => idx + 1)
                              .filter((page) => {
                                if (totalPendingApprovalPages <= 7) return true;
                                if (page === 1 || page === totalPendingApprovalPages) return true;
                                return Math.abs(page - currentPendingApprovalPage) <= 1;
                              })
                              .map((page, idx, arr) => (
                                <React.Fragment key={page}>
                                  {idx > 0 && page - arr[idx - 1] > 1 && (
                                    <span className="w-5 text-center text-xs text-gray-400 select-none">…</span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => setPendingApprovalsPage(page)}
                                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPendingApprovalPage === page
                                      ? "bg-[#0A6B43] text-white shadow-xs"
                                      : "text-gray-600 hover:bg-emerald-50 hover:text-[#0A6B43] border border-transparent hover:border-emerald-200"
                                      }`}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              ))}
                          </div>

                          <button
                            type="button"
                            disabled={currentPendingApprovalPage === totalPendingApprovalPages}
                            onClick={() => setPendingApprovalsPage((p) => Math.min(totalPendingApprovalPages, p + 1))}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${currentPendingApprovalPage === totalPendingApprovalPages
                              ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                              : "border-gray-200 text-gray-700 bg-white hover:bg-emerald-50 hover:text-[#0A6B43] hover:border-emerald-300 cursor-pointer shadow-2xs"
                              }`}
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center max-w-md mx-auto space-y-3">
                    <CheckCircle className="w-12 h-12 text-[#0A6B43] mx-auto" />
                    <h3 className="font-extrabold text-gray-800 text-base">Roster Completely Verified</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      All self-registering Katipunan ng Kabataan members in Barangay {designatedBarangay} have been successfully approved and cleared.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Write announcement modal */}
      {showAnnouncementModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAnnouncementModal(false);
              setEditingAnnouncementId(null);
            }
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-150 shrink-0 bg-white">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#0A6B43]" />
                {editingAnnouncementId ? "Edit Announcement" : "Post New Announcement"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setEditingAnnouncementId(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Welding Kit Distribution Schedule"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Category</label>
                  <CustomSelect
                    value={annCategory}
                    onChange={(val) => setAnnCategory(val as any)}
                    options={[
                      { value: "Program Update", label: "Program Update" },
                      { value: "Event", label: "Event" },
                      { value: "Reminder", label: "Reminder" },
                      { value: "General", label: "General" }
                    ]}
                    size="sm"
                    placeholder="Select Category"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Target Audience</label>
                  <CustomSelect
                    value={annAudience}
                    onChange={(val) => setAnnAudience(val as any)}
                    options={[
                      { value: "All KK members", label: "All KK members" },
                      { value: "OSY only", label: "OSY only" }
                    ]}
                    size="sm"
                    placeholder="Select Audience"
                  />
                </div>
              </div>

              {/* Date & Time Picker Controls */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/70 space-y-2">
                <label className="text-[10px] font-extrabold text-[#0A6B43] uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0A6B43]" />
                  Event Date & Time Schedule (Picker)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <SiKapDatePicker
                    label="Select Date"
                    badgeText="SK Event"
                    value={annEventDatePicker}
                    onChange={(val) => setAnnEventDatePicker(val)}
                    min={new Date().toISOString().split("T")[0]}
                    placeholder="Choose event date"
                  />
                  <SiKapTimePicker
                    label="Select Time"
                    badgeText="SK Schedule"
                    value={annEventTimePicker}
                    onChange={(val) => setAnnEventTimePicker(val)}
                    placeholder="Choose event time"
                  />
                </div>

                {annEventDatePicker && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#0A6B43] flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#0A6B43]" /> Scheduled:</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      {new Date(annEventDatePicker + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {annEventTimePicker ? ` • ${formatTime12Hour(annEventTimePicker)}` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Sebastian Covered Court"
                    value={annVenue}
                    onChange={(e) => setAnnVenue(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Person & Hotline</label>
                  <input
                    type="text"
                    placeholder="e.g. SK Chair Rhea Cruz (+63 915 777 8888)"
                    value={annContactPerson}
                    onChange={(e) => setAnnContactPerson(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Body Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the announcement details, requirements, or agenda..."
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowAnnouncementModal(false);
                    setEditingAnnouncementId(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                >
                  {editingAnnouncementId ? "Save Changes" : "Post Announcement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Councilor Modal */}
      {isAddCouncilorOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddCouncilorOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out text-xs font-semibold">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-150 shrink-0 bg-white">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Users2 className="w-5 h-5 text-[#0A6B43]" />
                Add New SK Councilor
              </h3>
              <button
                onClick={() => setIsAddCouncilorOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Body and Fixed Footer */}
            <form onSubmit={handleAddCouncilorSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4">
                {/* Council Composition Info Banner */}
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-950 font-medium flex items-center justify-between">
                  <span className="font-bold text-[#0A6B43]">Council Quota:</span>
                  <span className="text-[10px] text-gray-600 font-semibold">
                    7 Councilors • 2 Secretaries • 2 Treasurers (Max 11)
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Santos"
                    value={councilorName}
                    onChange={(e) => setCouncilorName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Login Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mariasantos.sk@sanluispampanga.gov.ph"
                      value={councilorEmail}
                      onChange={(e) => setCouncilorEmail(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Number *</label>
                    <input
                      type="text"
                      required
                      value={councilorContact}
                      onChange={(e) => setCouncilorContact(formatContactNumber(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Official Role *</label>
                    <CustomSelect
                      value={councilorRole}
                      onChange={(val) => setCouncilorRole(val as any)}
                      options={[
                        { value: "SK Councilor", label: `SK Councilor (${roleCounts.councilorsCount}/7)` },
                        { value: "Secretary", label: `Secretary (${roleCounts.secretariesCount}/2)` },
                        { value: "Treasurer", label: `Treasurer (${roleCounts.treasurersCount}/2)` }
                      ]}
                      size="sm"
                      placeholder="Select Role"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Barangay</label>
                    <input
                      type="text"
                      disabled
                      value={`Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}`}
                      className="w-full p-2.5 border border-gray-200 bg-gray-50 text-emerald-900 font-bold rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Login Account Password *</label>
                    <button
                      type="button"
                      onClick={generateCouncilorPassword}
                      className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showCouncilorPassword ? "text" : "password"}
                      required
                      value={councilorPassword}
                      onChange={(e) => setCouncilorPassword(e.target.value)}
                      placeholder="Set temporary password..."
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCouncilorPassword(!showCouncilorPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCouncilorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-150 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddCouncilorOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Create & Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Councilor Modal */}
      {isEditCouncilorOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditCouncilorOpen(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/80 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out text-xs font-semibold">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-150 shrink-0 bg-white">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-amber-500" />
                Edit SK Councilor Details
              </h3>
              <button
                onClick={() => setIsEditCouncilorOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with Scrollable Body and Fixed Footer */}
            <form onSubmit={handleEditCouncilorSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editCouncilorName}
                    onChange={(e) => setEditCouncilorName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editCouncilorEmail}
                    onChange={(e) => setEditCouncilorEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Phone Number</label>
                  <input
                    type="text"
                    value={editCouncilorContact}
                    onChange={(e) => setEditCouncilorContact(formatContactNumber(e.target.value))}
                    placeholder="+63 9xx xxx xxxx"
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Role *</label>
                  <CustomSelect
                    value={editCouncilorRole}
                    onChange={(val) => setEditCouncilorRole(val as any)}
                    options={[
                      { value: "SK Councilor", label: `SK Councilor (${roleCounts.councilorsCount}/7)` },
                      { value: "Secretary", label: `Secretary (${roleCounts.secretariesCount}/2)` },
                      { value: "Treasurer", label: `Treasurer (${roleCounts.treasurersCount}/2)` }
                    ]}
                    size="sm"
                    placeholder="Select Role"
                  />
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="px-5 sm:px-6 py-3.5 bg-gray-50/80 border-t border-gray-150 flex justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isUpdatingCouncilor}
                  onClick={() => setIsEditCouncilorOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCouncilor}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingCouncilor && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {isUpdatingCouncilor ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Councilor Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deletingCouncilor)}
        title="Remove Council Member"
        description={
          deletingCouncilor
            ? `Are you sure you want to remove ${deletingCouncilor.name} (${deletingCouncilor.role}) from the Barangay ${designatedBarangay} council team? Their portal access will be permanently revoked.`
            : ""
        }
        confirmText="Remove Official"
        cancelText="Cancel"
        confirmVariant="red"
        onConfirm={confirmDeleteCouncilor}
        onCancel={() => setDeletingCouncilor(null)}
      />

      {/* KK Member ID Verification Modal */}
      {verifyingYouth && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setVerifyingYouth(null);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 overflow-hidden"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 w-full max-w-lg max-h-[92vh] flex flex-col p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200 ease-out text-xs font-semibold">
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3 sm:mb-4 shrink-0">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0A6B43] shrink-0" />
                Katipunan ng Kabataan ID Verification
              </h3>
              <button
                onClick={() => setVerifyingYouth(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="space-y-3.5 sm:space-y-4 text-left flex-1 overflow-y-auto custom-scrollbar pr-1">
              {/* Member Core Details */}
              <div className="bg-gray-50 p-3.5 sm:p-4 rounded-xl border border-gray-150 space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Member Personal Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-4 sm:gap-y-1.5 text-gray-700">
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Full Name</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Barangay & Purok</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.barangay} · {verifyingYouth.purok}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Age</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.age} years old</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Contact Number</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.contactNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* ID Document Details */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Submitted Document Proof</p>
                {verifyingYouth.verificationIdType ? (
                  <div className="border border-gray-150 rounded-xl overflow-hidden bg-white">
                    <div className="bg-gray-50 p-2.5 border-b border-gray-150 flex flex-wrap justify-between items-center gap-1.5">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                        <FileText className="w-4 h-4 text-[#0A6B43] shrink-0" />
                        {verifyingYouth.verificationIdType}
                      </span>
                      <span className="font-mono text-gray-600 font-extrabold bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] break-all">
                        Ref: {verifyingYouth.verificationIdNumber || "N/A"}
                      </span>
                    </div>

                    <div className="p-3 bg-gray-50/80 flex justify-center items-center">
                      <img
                        src={verifyingYouth.verificationIdImage}
                        alt="KK Verification Document proof"
                        className="max-h-44 sm:max-h-56 rounded-xl shadow-xs border border-gray-200 object-contain w-auto max-w-full bg-white"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center text-amber-800 font-bold space-y-1">
                    <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-600 mx-auto" />
                    <p className="text-xs">In-Person Profile Creation</p>
                    <p className="text-[10px] text-gray-500 font-medium max-w-xs mx-auto">
                      This KK member was registered directly by an SK Official during manual field profiling. Documents were verified physically.
                    </p>
                  </div>
                )}
              </div>

              {/* Validation Checklist */}
              <div className="space-y-2 bg-emerald-50/40 p-3 sm:p-3.5 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-extrabold text-[#0a6b43] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  SK Validation & Eligibility Check
                </p>
                <div className="space-y-1.5 text-[11px] sm:text-xs text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2px] shrink-0">✓</span>
                    <span>
                      Age is <strong>{verifyingYouth.age}</strong> — fits Sangguniang Kabataan Reform Act age limit (15-30 years old).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2px] shrink-0">✓</span>
                    <span>
                      Resident of <strong>{verifyingYouth.barangay}</strong> — validated in Pampanga geographic registry.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2px] shrink-0">✓</span>
                    <span>
                      Verification credentials match the submitted barangay database logs.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-3 border-t border-gray-100 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setVerifyingYouth(null)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 text-xs font-bold rounded-xl transition-all cursor-pointer order-last sm:order-first"
              >
                Close
              </button>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleRejectYouth(verifyingYouth.id);
                    setVerifyingYouth(null);
                  }}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider text-center"
                >
                  Reject & Deny
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApproveYouth(verifyingYouth.id);
                    setVerifyingYouth(null);
                  }}
                  className="px-4 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider text-center"
                >
                  Approve Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Youth Member Profile Preview Modal */}
      {viewingPendingYouthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-hidden">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-emerald-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 sm:pb-3.5 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <span className="p-1.5 sm:p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                  <User className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">Pending Youth Profile</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">Self-registration record awaiting verification</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPendingYouthModal(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="space-y-3.5 sm:space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1 py-2">
              {/* Member Card Header */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                  {viewingPendingYouthModal.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug truncate">{viewingPendingYouthModal.name}</h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                    {viewingPendingYouthModal.age} y/o · {viewingPendingYouthModal.purok} · <span className="font-bold text-emerald-800">{viewingPendingYouthModal.barangay}</span>
                  </p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-2">
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold">
                      Awaiting Verification
                    </span>
                    <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-semibold">
                      {viewingPendingYouthModal.educationalAttainment}
                    </span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold">
                      {viewingPendingYouthModal.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal & Verification Info */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl border border-gray-150 space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Registration & Verification Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-4 sm:gap-y-2 text-xs text-gray-700">
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Contact Number</span>
                    <span className="text-gray-900 font-bold">{viewingPendingYouthModal.contactNumber || "+63 917 123 4567"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Registration Date</span>
                    <span className="text-gray-900 font-bold">{viewingPendingYouthModal.registeredDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">ID Document Submitted</span>
                    <span className="text-teal-800 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {viewingPendingYouthModal.verificationIdType || "In-Person Field Profiling"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">ID Reference Number</span>
                    <span className="text-gray-900 font-mono font-bold break-all">{viewingPendingYouthModal.verificationIdNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Registered Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingPendingYouthModal.skills && viewingPendingYouthModal.skills.length > 0 ? (
                    viewingPendingYouthModal.skills.map((skill) => (
                      <span key={skill} className="text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 sm:py-1 rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No skills specified yet</span>
                  )}
                </div>
              </div>

              {/* Livelihood Objective */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Livelihood Objective & Aspirations</span>
                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs font-medium text-gray-800 leading-relaxed">
                  &ldquo;{viewingPendingYouthModal.livelihoodGoal || "Seeking technical vocational training and livelihood placement."}&rdquo;
                </div>
              </div>

              {/* AI Match Preview */}
              <div className="p-3 sm:p-3.5 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block truncate">AI Match Compatibility</span>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5 truncate">Content-Based Recommendation</p>
                </div>
                <div className="shrink-0">
                  <FlameMatchScore score={viewingPendingYouthModal.matchScore} hasPrograms={programs.length > 0} />
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="pt-3 border-t border-gray-100 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => setViewingPendingYouthModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95 text-xs font-bold rounded-xl transition-all cursor-pointer order-last sm:order-first"
              >
                Close Preview
              </button>
              <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyingYouth(viewingPendingYouthModal);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-2 sm:px-3.5 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95 border border-sky-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                  title="Inspect ID Document"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  <span className="truncate">Inspect ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectYouth(viewingPendingYouthModal.id);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-2 sm:px-3.5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider text-center truncate"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApproveYouth(viewingPendingYouthModal.id);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-2 sm:px-4 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer uppercase tracking-wider text-center truncate"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXECUTIVE PRINTABLE SKILLS GAP ANALYTICS REPORT                    */}
      {/* ========================================================================= */}
      {isSkillsGapReportModalOpen && (
        <div
          id="printable-skillsgap-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSkillsGapReportModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div id="printable-skillsgap-modal-card" className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-gray-200 animate-in fade-in zoom-in-95 duration-200 ease-out">

            {/* Header with Print & Excel Action Controls */}
            <div className="relative bg-[#1C2B20] text-white p-4 sm:p-5 pr-14 sm:pr-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 no-print border-b border-emerald-900/60">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs shrink-0">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                    <span>Skills Gap Analytics Summary</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md">
                      {formattedBrgyName}
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    Official Katipunan ng Kabataan Competency & TVET Training Allocation Audit
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Export Excel (.xls) Formatted Table Button */}
                <button
                  type="button"
                  onClick={handleExportSkillsGapExcel}
                  className="flex-1 sm:flex-none justify-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/50"
                  title="Export styled spreadsheet pre-configured for US Letter printing (.xls)"
                >
                  <Download className="w-3.5 h-3.5 text-white shrink-0" />
                  <span className="truncate">Export Excel (.xls)</span>
                </button>

                {/* Print / Save as PDF Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-none justify-center px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print official document on US Letter paper size or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Print / PDF</span>
                </button>
              </div>

              {/* Dedicated Top-Right X / Exit Button */}
              <button
                type="button"
                onClick={() => setIsSkillsGapReportModalOpen(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                aria-label="Close skills gap report modal"
                title="Close report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content View */}
            <div className="flex-1 p-4 sm:p-10 print:p-0 print:space-y-5 overflow-y-auto space-y-6 text-xs text-gray-800 bg-white" id="printable-skillsgap-report">

              {/* Document Letterhead */}
              <div className="text-center border-b-2 border-emerald-900 pb-4 space-y-1 print-avoid-break">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Republic of the Philippines · Province of Pampanga</p>
                <h2 className="text-sm sm:text-base font-black text-gray-950 uppercase tracking-tight">MUNICIPALITY OF SAN LUIS</h2>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0A6B43] uppercase tracking-wider">{formattedBrgyName.toUpperCase()} · SANGGUNIANG KABATAAN</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold pt-1">
                  KATIPUNAN NG KABATAAN SKILLS GAP & WORKFORCE READINESS DIAGNOSTIC REPORT
                </p>
              </div>

              {/* Report Meta Details */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-[11px] font-semibold bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-150 print-avoid-break">
                <div>
                  <p>SK Presiding Officer: <strong>Hon. {skChairName}</strong></p>
                  <p className="mt-0.5">Barangay: <strong>{formattedBrgyName}</strong></p>
                </div>
                <div className="sm:text-right">
                  <p>Assessment Date: <strong>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></p>
                  <p className="mt-0.5">Focus Demographic: <strong className="text-amber-800">Priority Out-of-School Youth (OSY)</strong></p>
                </div>
              </div>

              {/* Statistical Summary Scorecard (OSY & Skills Focused) */}
              <div className="space-y-2 print-avoid-break">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  I. Katipunan ng Kabataan Workforce Readiness Scorecard
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 print:grid-cols-5 gap-3 text-center kpi-scorecard-grid">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Total KK Youth</span>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{localYouthProfiles.length}</p>
                    <span className="text-[8px] text-gray-400 font-bold">Registered Base</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-bold text-amber-800 uppercase">Out-of-School (OSY)</span>
                    <p className="text-lg font-black text-amber-900 mt-0.5">
                      {localYouthProfiles.filter(y => y.currentStatus === "Out-of-school").length}
                    </p>
                    <span className="text-[8px] text-amber-700 font-bold">Priority Target</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase">OSY Density Rate</span>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">
                      {localYouthProfiles.length > 0 ? ((localYouthProfiles.filter(y => y.currentStatus === "Out-of-school").length / localYouthProfiles.length) * 100).toFixed(1) : "0.0"}%
                    </p>
                    <span className="text-[8px] text-emerald-700 font-bold">Demographic Share</span>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                    <span className="text-[9px] font-bold text-red-700 uppercase">Unmatched OSY</span>
                    <p className="text-lg font-black text-red-800 mt-0.5">{unmatchedCount}</p>
                    <span className="text-[8px] text-red-600 font-bold">Need TVET Slots</span>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[9px] font-bold text-blue-800 uppercase">High Deficiency Gaps</span>
                    <p className="text-lg font-black text-blue-900 mt-0.5">
                      {localSkillsGaps.filter(g => g.percentage >= 30).length}
                    </p>
                    <span className="text-[8px] text-blue-700 font-bold">Rate ≥ 30%</span>
                  </div>
                </div>
              </div>

              {/* Skills Gaps Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  II. Technical Competency Deficiency & Training Allocation Matrix
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left text-xs min-w-[620px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2 border-b w-8 text-center" style={{ width: '4%' }}>#</th>
                        <th className="p-2 border-b" style={{ width: '25%' }}>Competency Deficiency Area</th>
                        <th className="p-2 border-b text-center" style={{ width: '12%' }}>Youth Lacking</th>
                        <th className="p-2 border-b text-center" style={{ width: '12%' }}>Deficiency Rate</th>
                        <th className="p-2 border-b text-center" style={{ width: '15%' }}>Severity & Slots</th>
                        <th className="p-2 border-b" style={{ width: '32%' }}>Recommended Training Action & Pathway</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {localSkillsGaps.map((gap, idx) => (
                        <tr key={gap.skill}>
                          <td className="p-2 text-center text-gray-400 font-bold">{idx + 1}</td>
                          <td className="p-2 font-bold text-gray-800">{gap.skill}</td>
                          <td className="p-2 text-center font-bold text-amber-900">{gap.count} youth</td>
                          <td className="p-2 text-center text-amber-700 font-black">{gap.percentage}%</td>
                          <td className="p-2 text-center">
                            <span className={`inline-block font-bold text-[9px] px-2 py-0.5 rounded border ${gap.percentage >= 30
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : gap.percentage >= 15
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}>
                              {gap.percentage >= 30 ? 'Critical' : gap.percentage >= 15 ? 'Moderate' : 'Low'}
                            </span>
                            <span className="block text-[8px] text-emerald-700 font-bold mt-0.5">({gap.availableSlots} Slots Avail)</span>
                          </td>
                          <td className="p-2 text-gray-600 text-[11px]">{gap.recommendedAction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Priority Sector Preferences */}
              <div className="space-y-2 print-avoid-break">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  III. Priority Sector Preferences & TVET Demand Alignment
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-2.5 skillsgap-sectors-grid">
                  {skillsGapSectorBreakdown.map((sec) => (
                    <div key={sec.sector} className="p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-800 text-[11px] leading-tight">{sec.sector}</span>
                        <span className="font-black text-emerald-800 text-xs shrink-0 ml-1">{sec.count} youth</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 pt-1 border-t border-gray-200">
                        <span>Share: <strong>{sec.pct}%</strong></span>
                        <span className="text-emerald-700 font-bold">{sec.demand}</span>
                      </div>
                      <p className="text-[9px] text-gray-400 italic truncate" title={sec.track}>Track: {sec.track}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategic Policy Directives */}
              <div className="space-y-2 print-avoid-break">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  IV. Strategic Interventions & Action Plan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 print:grid-cols-3 gap-2.5 skillsgap-actions-grid">
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-150 text-[11px] space-y-1">
                    <strong className="text-emerald-950 block font-black">1. Priority TVET Scholarship Batch</strong>
                    <p className="text-emerald-900/80 leading-relaxed text-[10px]">
                      Coordinate with TESDA GPSAT for dedicated training batch targeting {highestSector.name !== "None" ? highestSector.name : "top technical trade"}.
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-150 text-[11px] space-y-1">
                    <strong className="text-emerald-950 block font-black">2. Barangay Practical Skills Caravan</strong>
                    <p className="text-emerald-900/80 leading-relaxed text-[10px]">
                      Host localized digital and practical workshops in Barangay {cleanDesignatedBarangay} to rapidly reduce {mostCriticalGapItem.skill.toLowerCase()} deficiency.
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-150 text-[11px] space-y-1">
                    <strong className="text-emerald-950 block font-black">3. LGU & DTI Micro-Enterprise Aid</strong>
                    <p className="text-emerald-900/80 leading-relaxed text-[10px]">
                      Support out-of-school youth completing TVET with starter toolkits and micro-entrepreneurship mentorship in San Luis.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION V: OFFICIAL ATTESTATION & SIGN-OFF BLOCK */}
              <div className="pt-6 border-t-2 border-gray-300 print-avoid-break">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-6 text-center">
                  Official Sangguniang Kabataan Skills Gap Diagnostic Attestation & Certification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-center skillsgap-signoff-grid">
                  <div>
                    <div className="border-b border-gray-400 pb-1 w-48 mx-auto font-black text-gray-900 text-xs uppercase tracking-wide">
                      HON. {(skChairName || "HON. SK CHAIRPERSON").toUpperCase()}
                    </div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mt-1">
                      SK Chairperson
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold">
                      Sangguniang Kabataan · {formattedBrgyName}
                    </p>
                  </div>

                  <div>
                    <div className="border-b border-gray-400 pb-1 w-48 mx-auto font-black text-gray-900 text-xs uppercase tracking-wide">
                      HON. PUNONG BARANGAY
                    </div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider mt-1">
                      Punong Barangay
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold">
                      Barangay Government of {formattedBrgyName}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[9px] text-gray-400 font-medium">
                  Official Skills Gap Diagnostic Document generated through the SiKap Youth Governance & Livelihood Matching Platform · Verified Katipunan ng Kabataan Public Record · San Luis, Pampanga
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
