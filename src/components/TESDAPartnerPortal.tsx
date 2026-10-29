"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Briefcase, Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, SlidersHorizontal, Eye, MapPin, GraduationCap, Info, User,
  Trash2, Pencil, Bell, CheckCircle, Clock, AlertTriangle, Sparkles, Filter, ChevronRight, ChevronLeft, CheckCircle2,
  Lock, EyeOff, Edit, ShieldAlert, Copy, Menu, Loader2,
  Sun, Moon, Building2, Timer, Zap, Archive, Calculator, ShieldCheck,
  LayoutGrid, Table, ArrowUpRight, RefreshCw, UserCheck, RotateCcw
} from "lucide-react";
import { TESDAProgram, ReferralPipelineItem, TESDAPartnerScreen, YouthProfile } from "../types";
import { MetricCard, SikapLogo, ConfirmationModal, SiKapDatePicker, SiKapTimePicker, NotificationBellButton } from "./ReusableComponents";
import { motion, AnimatePresence } from "motion/react";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { SettingsHeaderBanner, SettingsSidebarNav, SettingsSecurityGuideCard, SettingsNotificationChannelsCard } from "./SettingsShared";
import { CATEGORIES } from "../lib/cbf-taxonomy-data";
import { formatProgramTime, formatTrainingDays, formatProgramTimeslot, getProgramFullSchedule, formatProgramDate, formatProgramDateRange, computeProgramTrainingHours } from "../lib/cbf-matcher";
import { toTitleCase, isProgramEnded } from "../lib/utils";
import { broadcastDataChange } from "../lib/realtime-sync";

const getProgramCategory = (prog?: any): string => {
  if (!prog) return "Information and Communication Technology";
  if (typeof prog.category === "string" && prog.category.trim()) {
    const found = CATEGORIES.find(c => c.id === prog.category || c.slug === prog.category || c.name.toLowerCase() === prog.category.toLowerCase());
    if (found) return found.name;
    return prog.category;
  }
  if (prog.category && typeof prog.category === "object" && prog.category.name) {
    return prog.category.name;
  }
  if (prog.categoryId) {
    const found = CATEGORIES.find(c => c.id === String(prog.categoryId));
    if (found) return found.name;
  }
  const t = (prog.title || "").toLowerCase();
  if (t.includes("computer") || t.includes("web") || t.includes("ict") || t.includes("programming") || t.includes("servicing") || t.includes("systems") || t.includes("hardware") || t.includes("software")) {
    return "Information and Communication Technology";
  }
  if (t.includes("welding") || t.includes("metal") || t.includes("smaw") || t.includes("construction") || t.includes("carpentry") || t.includes("masonry") || t.includes("plumbing")) {
    return "Construction";
  }
  if (t.includes("cook") || t.includes("baking") || t.includes("pastry") || t.includes("food") || t.includes("bread") || t.includes("beverage")) {
    return "Process Food and Beverages";
  }
  if (t.includes("electric") || t.includes("wiring") || t.includes("electronics") || t.includes("solar")) {
    return "Electrical and Electronics";
  }
  if (t.includes("automotive") || t.includes("motorcycle") || t.includes("driving") || t.includes("engine")) {
    return "Automotive and Land Transport";
  }
  if (t.includes("agri") || t.includes("farm") || t.includes("crop") || t.includes("organic") || t.includes("aquaculture")) {
    return "Agriculture";
  }
  if (t.includes("tourism") || t.includes("hotel") || t.includes("housekeeping") || t.includes("front office") || t.includes("bartending")) {
    return "Tourism";
  }
  if (t.includes("care") || t.includes("health") || t.includes("nursing") || t.includes("patient")) {
    return "Human Health/ Health Care";
  }
  return "Technical-Vocational Training";
};

interface TESDAPartnerPortalProps {
  programs: TESDAProgram[];
  setPrograms: React.Dispatch<React.SetStateAction<TESDAProgram[]>>;
  referrals: ReferralPipelineItem[];
  setReferrals: React.Dispatch<React.SetStateAction<ReferralPipelineItem[]>>;
  youthProfiles: YouthProfile[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  currentUser?: any;
}

export const TESDAPartnerPortal: React.FC<TESDAPartnerPortalProps> = ({
  programs,
  setPrograms,
  referrals,
  setReferrals,
  youthProfiles,
  onLogout,
  addToast,
  currentUser
}) => {
  const [currentScreen, setCurrentScreen] = useState<TESDAPartnerScreen>(TESDAPartnerScreen.DASHBOARD);
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

  // Dashboard Sub-tabs
  const [dashboardTab, setDashboardTab] = useState<"all" | "pending" | "enrolled" | "programs" | "archived">("all");

  // Profile & Settings Sub-tabs
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [repName, setRepName] = useState(currentUser?.name || "TESDA Partner Representative");
  const [repEmail, setRepEmail] = useState(currentUser?.email || "tesda.gpsat@gov.ph");
  const [centerName, setCenterName] = useState("Gonzalo Puyat School of Arts and Trades (GPSAT)");
  const [repPhone, setRepPhone] = useState("+63 919 555 7890");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state if currentUser changes
  useEffect(() => {
    if (currentUser?.name) setRepName(currentUser.name);
    if (currentUser?.email) setRepEmail(currentUser.email);
  }, [currentUser]);

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repName.trim()) {
      addToast("Representative name cannot be blank.", "error");
      return;
    }
    if (!repEmail.trim() || !repEmail.includes("@")) {
      addToast("Please enter a valid institutional email address.", "error");
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser?.id,
          name: repName.trim(),
          email: repEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update institution profile.");
      }
      setIsEditingProfile(false);
      addToast("Institution profile updated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update institution profile.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      addToast("Please enter your current security password.", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New password and confirmation do not match.", "error");
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser?.id,
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      addToast("Institutional security password updated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper to get all relevant storage keys for TESDA partner
  const getStorageKeys = () => {
    const keys: string[] = [];
    if (currentUser?.email) {
      keys.push(`sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}`);
    }
    if (currentUser?.id) {
      keys.push(`sikap_cleared_notifs_${currentUser.id}`);
    }
    keys.push("sikap_cleared_notifs_tesda");
    return Array.from(new Set(keys));
  };

  const getReadStorageKey = () => {
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) return `sikap_read_notifs_${email}`;
    return "sikap_read_notifs_tesda";
  };

  // Track read notification IDs with localStorage persistence
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const key = currentUser?.email ? `sikap_read_notifs_${currentUser.email.toLowerCase().trim()}` : "sikap_read_notifs_tesda";
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Track dismissed/cleared notifications with localStorage persistence
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          "sikap_cleared_notifs_tesda"
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

  // Re-synchronize cleared notifications whenever TESDA user or storage updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncNotificationsFromStorage = () => {
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

        const readKey = getReadStorageKey();
        const readSaved = localStorage.getItem(readKey);
        if (readSaved) {
          const parsed = JSON.parse(readSaved);
          if (Array.isArray(parsed)) {
            setReadNotificationIds(prev => Array.from(new Set([...prev, ...parsed])));
          }
        }
      } catch (e) {
        console.error("Failed to sync cleared notifications in TESDA portal:", e);
      }
    };

    syncNotificationsFromStorage();
    window.addEventListener("storage", syncNotificationsFromStorage);
    return () => window.removeEventListener("storage", syncNotificationsFromStorage);
  }, [currentUser?.email, currentUser?.id]);

  const markAsRead = (id: string) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read notification:", e);
      }
      return updated;
    });
  };

  const markAllAsRead = (allIds: string[]) => {
    setReadNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read notifications:", e);
      }
      return updated;
    });
    addToast("All notifications marked as read", "success");
  };

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
      } catch (e) {
        console.error("Failed to save cleared notifications:", e);
      }
      return updated;
    });
    // Also mark them as read
    setReadNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast("All notifications cleared", "info");
  };

  // Selected applicant for detail view modal
  const [selectedApplicant, setSelectedApplicant] = useState<YouthProfile | null>(null);
  const [selectedApplicantReferral, setSelectedApplicantReferral] = useState<ReferralPipelineItem | null>(null);

  // Selected program for detail view modal
  const [viewingProgram, setViewingProgram] = useState<TESDAProgram | null>(null);

  // Program edit modal state (stays on current screen)
  const [editingProgramModal, setEditingProgramModal] = useState<TESDAProgram | null>(null);

  // Program delete confirmation modal state
  const [programToDelete, setProgramToDelete] = useState<TESDAProgram | null>(null);

  // Program archive confirmation modal state
  const [programToArchive, setProgramToArchive] = useState<TESDAProgram | null>(null);

  // Program restore confirmation modal state
  const [programToRestore, setProgramToRestore] = useState<TESDAProgram | null>(null);

  // Action loading states for restore, archive, delete
  const [isRestoringProgram, setIsRestoringProgram] = useState(false);
  const [restoringProgramId, setRestoringProgramId] = useState<string | null>(null);
  const [isArchivingProgram, setIsArchivingProgram] = useState(false);
  const [archivingProgramId, setArchivingProgramId] = useState<string | null>(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

  // Archived records state for the Archived History tab & Catalog Archive View
  const [archivedProgramsList, setArchivedProgramsList] = useState<TESDAProgram[]>([]);
  const [archivedReferralsList, setArchivedReferralsList] = useState<ReferralPipelineItem[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);
  const [viewingArchivedPrograms, setViewingArchivedPrograms] = useState(false);

  // Modal inline editing states for "View Program Details"
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [isSavingModal, setIsSavingModal] = useState(false);
  const [modalEditTitle, setModalEditTitle] = useState("");
  const [modalEditLevel, setModalEditLevel] = useState("NC II");
  const [modalEditCategoryId, setModalEditCategoryId] = useState("1");
  const [modalEditTrainingHours, setModalEditTrainingHours] = useState<number | "">("");
  const [modalEditSlotsTotal, setModalEditSlotsTotal] = useState<number | "">(25);
  const [modalEditCost, setModalEditCost] = useState("Free");
  const [modalEditLocation, setModalEditLocation] = useState("");
  const [modalEditRoom, setModalEditRoom] = useState("");
  const [modalEditInstructor, setModalEditInstructor] = useState("");
  const [modalEditTrainingDays, setModalEditTrainingDays] = useState<string[]>([]);
  const [modalEditStartTime, setModalEditStartTime] = useState("");
  const [modalEditEndTime, setModalEditEndTime] = useState("");
  const [modalEditStartDate, setModalEditStartDate] = useState("");
  const [modalEditEndDate, setModalEditEndDate] = useState("");
  const [modalEditEligibility, setModalEditEligibility] = useState("");
  const [modalEditRequiredDocuments, setModalEditRequiredDocuments] = useState("");
  const [modalEditRequiredSkills, setModalEditRequiredSkills] = useState("");
  const [modalEditContactName, setModalEditContactName] = useState("");
  const [modalEditContactPhone, setModalEditContactPhone] = useState("");

  // Helper to fetch archived records on demand
  const fetchArchivedData = async () => {
    setLoadingArchived(true);
    try {
      const [progRes, refRes] = await Promise.all([
        fetch("/api/programs?archived=true"),
        fetch("/api/referrals?archived=true")
      ]);
      const progData = await progRes.json();
      const refData = await refRes.json();
      if (progData.success && progData.data) {
        setArchivedProgramsList(progData.data);
      }
      if (refData.success && refData.data) {
        setArchivedReferralsList(refData.data);
      }
    } catch (err) {
      console.error("Error loading archived data:", err);
    } finally {
      setLoadingArchived(false);
    }
  };

  // Fetch archived records on initial load so counter badge is immediately accurate
  useEffect(() => {
    fetchArchivedData();
  }, []);

  // Helper to detect if program term / duration is concluded
  const isProgramDurationDone = (prog?: TESDAProgram | null) => {
    if (!prog || !prog.endDate) return false;
    try {
      const end = new Date(prog.endDate);
      end.setHours(23, 59, 59, 999);
      return !isNaN(end.getTime()) && end.getTime() < Date.now();
    } catch {
      return false;
    }
  };

  // Pipeline Search & Filter states
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("All");
  const [pipelineProgramFilter, setPipelineProgramFilter] = useState<string>("All");
  const [pipelineBarangayFilter, setPipelineBarangayFilter] = useState<string>("All");
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  // Dashboard Program Pagination:
  // Pipeline referrals list (Tabs 1-3) displays max 3 programs per page
  const DASHBOARD_PROGRAMS_PER_PAGE = 3;
  const [dashboardProgramPage, setDashboardProgramPage] = useState(1);

  // Program Roster Grid (Tab 4) displays max 6 programs per page
  const DASHBOARD_ROSTER_PER_PAGE = 6;
  const [dashboardRosterPage, setDashboardRosterPage] = useState(1);

  // Programs Screen Catalog displays max 6 programs per page
  const PROGRAMS_CATALOG_PER_PAGE = 6;
  const [programsCatalogPage, setProgramsCatalogPage] = useState(1);

  // Reset dashboard program pagination when filters or tab change
  useEffect(() => {
    setDashboardProgramPage(1);
    setDashboardRosterPage(1);
  }, [pipelineSearch, pipelineStatusFilter, pipelineProgramFilter, pipelineBarangayFilter, dashboardTab]);

  // Programs Screen Search & Filter
  const [programSearchQuery, setProgramSearchQuery] = useState("");
  const [programLevelFilter, setProgramLevelFilter] = useState("All");
  const [programCategoryFilter, setProgramCategoryFilter] = useState("All");
  const [programStatusFilter, setProgramStatusFilter] = useState("All");
  const [programCostFilter, setProgramCostFilter] = useState("All");
  const [programViewMode, setProgramViewMode] = useState<"grid" | "table">("grid");

  // Reset programs catalog pagination when search or filters change
  useEffect(() => {
    setProgramsCatalogPage(1);
  }, [programSearchQuery, programLevelFilter, programCategoryFilter, programStatusFilter, programCostFilter, viewingArchivedPrograms]);

  const toggleProgramExpand = (title: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [title]: prev[title] === false ? true : false
    }));
  };

  // Form states for adding/editing program
  const [progTitle, setProgTitle] = useState("");
  const [progLevel, setProgLevel] = useState("NC II");
  const [progTrainingHours, setProgTrainingHours] = useState<number | "">("");
  const [progLocation, setProgLocation] = useState("");
  const [progCost, setProgCost] = useState<"Free" | "Subsidized" | "With Fee">("Free");
  const [progSlots, setProgSlots] = useState<number | "">("");
  const [progEligibility, setProgEligibility] = useState("");
  const [progRequiredDocuments, setProgRequiredDocuments] = useState("");
  const [progRequiredSkills, setProgRequiredSkills] = useState("");
  const [progContactName, setProgContactName] = useState("");
  const [progContactPhone, setProgContactPhone] = useState("");
  const [progTrainingDays, setProgTrainingDays] = useState<string[]>([]);
  const [progStartTime, setProgStartTime] = useState("");
  const [progEndTime, setProgEndTime] = useState("");
  const [progRoom, setProgRoom] = useState("");
  const [progInstructor, setProgInstructor] = useState("");
  const [progStartDate, setProgStartDate] = useState("");
  const [progEndDate, setProgEndDate] = useState("");
  const [progCategoryId, setProgCategoryId] = useState<string>("1");

  // Editing program ID state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const handleNewProgramClick = () => {
    setEditingProgramId(null);
    setProgTitle("");
    setProgLevel("NC II");
    setProgCategoryId("1");
    setProgTrainingHours("");
    setProgLocation("");
    setProgCost("Free");
    setProgSlots("");
    setProgEligibility("");
    setProgRequiredDocuments("");
    setProgRequiredSkills("");
    setProgContactName("");
    setProgContactPhone("");
    setProgTrainingDays([]);
    setProgStartTime("");
    setProgEndTime("");
    setProgRoom("");
    setProgInstructor("");
    setProgStartDate("");
    setProgEndDate("");
    setCurrentScreen(TESDAPartnerScreen.ADD_PROGRAM);
  };

  // Helper to safely format time for <input type="time"> (HH:MM)
  const parseTimeForInput = (t?: string | null): string => {
    if (!t) return "";
    let str = String(t).trim();
    if (str.includes("T")) {
      const afterT = str.split("T")[1]?.replace("Z", "");
      if (afterT) str = afterT;
    }
    if (str.includes(":")) {
      const parts = str.split(":");
      const h = parts[0].padStart(2, "0");
      const m = (parts[1] || "00").padStart(2, "0");
      return `${h}:${m}`;
    }
    return str;
  };

  // Quick preset helper for configuring timeslots
  const applyTimeslotPreset = (preset: "morning" | "afternoon" | "fullday" | "evening") => {
    if (preset === "morning") {
      setProgStartTime("08:00");
      setProgEndTime("12:00");
    } else if (preset === "afternoon") {
      setProgStartTime("13:00");
      setProgEndTime("17:00");
    } else if (preset === "fullday") {
      setProgStartTime("08:00");
      setProgEndTime("17:00");
    } else if (preset === "evening") {
      setProgStartTime("17:30");
      setProgEndTime("20:30");
    }
  };

  // Auto-compute training hours from schedule parameters
  const computedTrainingHours = useMemo(() => {
    return computeProgramTrainingHours({
      startDate: progStartDate,
      endDate: progEndDate,
      startTime: progStartTime,
      endTime: progEndTime,
      trainingDays: progTrainingDays
    });
  }, [progStartDate, progEndDate, progStartTime, progEndTime, progTrainingDays]);

  // If training hours field is empty, auto-populate when computed hours become available
  useEffect(() => {
    if (computedTrainingHours && (progTrainingHours === "" || progTrainingHours === 0)) {
      setProgTrainingHours(computedTrainingHours.totalHours);
    }
  }, [computedTrainingHours]);

  const handleOpenEditModal = (prog: TESDAProgram) => {
    setEditingProgramId(prog.id);
    setProgCategoryId(prog.categoryId || "1");

    // Parse title & level (e.g. "Food Processing NC II" -> "Food Processing" & "NC II")
    const match = prog.title.match(/(.*)\s+(NC\s+I|NC\s+II|NC\s+III)$/i);
    if (match) {
      setProgTitle(match[1].trim());
      setProgLevel(match[2]);
    } else {
      setProgTitle(prog.title);
      setProgLevel("NC II");
    }

    setProgTrainingHours(prog.trainingHours || "");
    setProgLocation(prog.location || "");
    setProgCost(prog.cost || "Free");
    setProgSlots(prog.slotsTotal || 30);
    setProgEligibility(prog.eligibility || "");
    setProgRequiredDocuments(prog.requiredDocuments ? prog.requiredDocuments.join(', ') : "");
    setProgRequiredSkills(prog.requiredSkills ? prog.requiredSkills.join(', ') : "");
    setProgContactName(prog.contactPerson || "");
    setProgContactPhone(prog.contactNumber || "");
    setProgTrainingDays(prog.trainingDays || []);

    // Format times cleanly without timezone shift
    setProgStartTime(parseTimeForInput(prog.startTime));
    setProgEndTime(parseTimeForInput(prog.endTime));

    setProgRoom(prog.room || "");
    setProgInstructor(prog.instructor || "");

    // Format dates
    if (prog.startDate) {
      setProgStartDate(new Date(prog.startDate).toISOString().split('T')[0]);
    } else setProgStartDate("");

    if (prog.endDate) {
      setProgEndDate(new Date(prog.endDate).toISOString().split('T')[0]);
    } else setProgEndDate("");

    setEditingProgramModal(prog);
  };

  // Form submission for Add Program (Screen)
  const handleAddProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      addToast("Please fill in the program title", "error");
      return;
    }

    if (!progTrainingHours || Number(progTrainingHours) <= 0) {
      addToast("Training hours must be greater than 0", "error");
      return;
    }

    if (progTrainingDays.length === 0) {
      addToast("Please select at least one training day", "error");
      return;
    }

    if (progStartTime && progEndTime && progStartTime >= progEndTime) {
      addToast("Start time must be before end time", "error");
      return;
    }

    if (progStartDate && progEndDate && new Date(progStartDate) > new Date(progEndDate)) {
      addToast("Start date must be before or equal to end date", "error");
      return;
    }

    const fullTitle = `${progTitle.trim()} ${progLevel}`.trim();

    const payload = {
      title: fullTitle,
      categoryId: progCategoryId,
      location: progLocation,
      trainingHours: Number(progTrainingHours),
      cost: progCost,
      slotsTotal: Number(progSlots),
      eligibility: progEligibility,
      requiredDocuments: progRequiredDocuments ? progRequiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : [],
      requiredSkills: progRequiredSkills ? progRequiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
      contactPerson: progContactName,
      contactNumber: progContactPhone,
      trainingDays: progTrainingDays,
      startTime: progStartTime || undefined,
      endTime: progEndTime || undefined,
      room: progRoom,
      instructor: progInstructor,
      startDate: progStartDate || undefined,
      endDate: progEndDate || undefined,
    };

    try {
      const res = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save program");
      }

      setPrograms(prev => [data.data, ...prev]);
      addToast("New TESDA training program posted successfully!", "success");
      broadcastDataChange("programs", "created");
      setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
    } catch (err: any) {
      addToast(err.message || "An error occurred", "error");
    }
  };

  // Form submission for Edit Program (Popup Modal)
  const handleEditModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgramModal) return;

    if (!progTitle.trim()) {
      addToast("Please fill in the program title", "error");
      return;
    }

    if (!progTrainingHours || Number(progTrainingHours) <= 0) {
      addToast("Training hours must be greater than 0", "error");
      return;
    }

    if (progTrainingDays.length === 0) {
      addToast("Please select at least one training day", "error");
      return;
    }

    if (progStartTime && progEndTime && progStartTime >= progEndTime) {
      addToast("Start time must be before end time", "error");
      return;
    }

    if (progStartDate && progEndDate && new Date(progStartDate) > new Date(progEndDate)) {
      addToast("Start date must be before or equal to end date", "error");
      return;
    }

    const fullTitle = `${progTitle.trim()} ${progLevel}`.trim();

    const payload = {
      title: fullTitle,
      categoryId: progCategoryId,
      location: progLocation,
      trainingHours: Number(progTrainingHours),
      cost: progCost,
      slotsTotal: Number(progSlots),
      eligibility: progEligibility,
      requiredDocuments: progRequiredDocuments ? progRequiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : [],
      requiredSkills: progRequiredSkills ? progRequiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
      contactPerson: progContactName,
      contactNumber: progContactPhone,
      trainingDays: progTrainingDays,
      startTime: progStartTime || undefined,
      endTime: progEndTime || undefined,
      room: progRoom,
      instructor: progInstructor,
      startDate: progStartDate || undefined,
      endDate: progEndDate || undefined,
      id: editingProgramModal.id
    };

    try {
      const res = await fetch("/api/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update program");
      }

      setPrograms(prev => prev.map(p => p.id === editingProgramModal.id ? data.data : p));
      addToast("TESDA training program updated successfully!", "success");
      broadcastDataChange("programs", "updated");
      setEditingProgramModal(null);
      setEditingProgramId(null);
    } catch (err: any) {
      addToast(err.message || "An error occurred", "error");
    }
  };

  // Change application status
  const handleUpdateReferralStatus = async (refId: string, newStatus: "Enrolled" | "Declined") => {
    const targetReferral = referrals.find(item => item.id === refId);
    if (!targetReferral) return;

    if (newStatus === "Enrolled") {
      const associatedProgram = programs.find(p => p.title === targetReferral.programTitle);
      if (associatedProgram && associatedProgram.slotsRemaining <= 0) {
        addToast(`Cannot accept: "${targetReferral.programTitle}" is already at full capacity!`, "error");
        return;
      }
    }

    try {
      const res = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: refId, status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setReferrals(prev =>
          prev
            .filter(item => {
              if (item.id === refId) return true;
              const isSameYouthAndProg =
                ((targetReferral.youthId && item.youthId === targetReferral.youthId) ||
                  item.youthName.toLowerCase().trim() === targetReferral.youthName.toLowerCase().trim()) &&
                (item.programTitle === targetReferral.programTitle ||
                  (targetReferral.programId && item.programId === targetReferral.programId));
              return !isSameYouthAndProg;
            })
            .map(item => {
          if (item.id === refId) {
            return { ...item, status: newStatus };
          }
          return item;
        }));

        const wasHoldingSlot = targetReferral.status === "Pending" || targetReferral.status === "Enrolled";
        const willHoldSlot = newStatus === "Enrolled";

        if (!wasHoldingSlot && willHoldSlot) {
          setPrograms(prev => prev.map(p => {
            if (p.title === targetReferral.programTitle || p.id === targetReferral.programId) {
              return {
                ...p,
                slotsRemaining: Math.max(0, p.slotsRemaining - 1)
              };
            }
            return p;
          }));
        } else if (wasHoldingSlot && !willHoldSlot) {
          setPrograms(prev => prev.map(p => {
            if (p.title === targetReferral.programTitle || p.id === targetReferral.programId) {
              return {
                ...p,
                slotsRemaining: Math.min(p.slotsTotal, p.slotsRemaining + 1)
              };
            }
            return p;
          }));
        }

        addToast(
          newStatus === "Enrolled"
            ? `Accepted & enrolled "${targetReferral.youthName}" into "${targetReferral.programTitle}"!`
            : `Declined application for "${targetReferral.youthName}".`,
          newStatus === "Enrolled" ? "success" : "info"
        );
        broadcastDataChange("referrals", "status_updated");
        broadcastDataChange("programs", "slots_updated");
      } else {
        addToast(data.error || "Failed to update application status", "error");
      }
    } catch (err) {
      console.error("Error updating referral status:", err);
      addToast("Network error: Failed to update application status.", "error");
    }
  };

  const handleDeleteProgram = async (progId: string, title: string) => {
    setIsDeletingProgram(true);
    setDeletingProgramId(progId);
    try {
      const res = await fetch(`/api/programs?id=${progId}&permanent=true`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPrograms(prev => prev.filter(p => p.id !== progId));
        setArchivedProgramsList(prev => prev.filter(p => p.id !== progId));
        setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
        addToast(data.message || `Program "${title}" permanently deleted.`, "success");
        broadcastDataChange("programs", "deleted");
        if (viewingProgram && viewingProgram.id === progId) {
          setViewingProgram(null);
        }
      } else {
        addToast(data.error || "Failed to delete program", "error");
      }
    } catch (err) {
      console.error("Error deleting program:", err);
      setPrograms(prev => prev.filter(p => p.id !== progId));
      setArchivedProgramsList(prev => prev.filter(p => p.id !== progId));
      setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
      addToast(`Program "${title}" has been deleted.`, "success");
      broadcastDataChange("programs", "deleted");
    } finally {
      setIsDeletingProgram(false);
      setDeletingProgramId(null);
    }
  };

  const handleArchiveProgram = async (progId: string, title: string) => {
    setIsArchivingProgram(true);
    setArchivingProgramId(progId);
    try {
      const res = await fetch(`/api/programs?id=${progId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const archivedProg = programs.find(p => p.id === progId) || data.data;
        if (archivedProg) {
          setArchivedProgramsList(prev => [{ ...archivedProg, activeStatus: "Closed" as any }, ...prev.filter(p => p.id !== progId)]);
        }
        setPrograms(prev => prev.filter(p => p.id !== progId));
        setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
        addToast(data.message || `Program "${title}" and enrolled students have been concluded & archived.`, "success");
        broadcastDataChange("programs", "archived");
        if (viewingProgram && viewingProgram.id === progId) {
          setViewingProgram(null);
        }
      } else {
        addToast(data.error || "Failed to archive program term", "error");
      }
    } catch (err) {
      console.error("Error archiving program:", err);
      addToast(`Network error: Could not archive "${title}".`, "error");
    } finally {
      setIsArchivingProgram(false);
      setArchivingProgramId(null);
    }
  };

  const handleUnarchiveProgram = async (progId: string, title: string) => {
    setIsRestoringProgram(true);
    setRestoringProgramId(progId);
    try {
      const res = await fetch("/api/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: progId, activeStatus: "Active" })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setArchivedProgramsList(prev => prev.filter(p => p.id !== progId));
        setPrograms(prev => {
          if (prev.some(p => p.id === progId)) {
            return prev.map(p => p.id === progId ? data.data : p);
          }
          return [data.data, ...prev];
        });
        addToast(`Program "${title}" has been restored to Active Programs!`, "success");
        broadcastDataChange("programs", "restored");
        if (viewingProgram && viewingProgram.id === progId) {
          setViewingProgram(data.data);
        }
      } else {
        addToast(data.error || "Failed to restore program", "error");
      }
    } catch (err: any) {
      console.error("Error restoring program:", err);
      addToast(err.message || "Failed to restore program", "error");
    } finally {
      setIsRestoringProgram(false);
      setRestoringProgramId(null);
    }
  };

  // Helper to start inline editing within the View Program Details dialog
  const startEditingInModal = (prog: TESDAProgram) => {
    const match = prog.title.match(/(.*)\s+(NC\s+I|NC\s+II|NC\s+III)$/i);
    if (match) {
      setModalEditTitle(match[1].trim());
      setModalEditLevel(match[2].toUpperCase());
    } else {
      setModalEditTitle(prog.title);
      setModalEditLevel("NC II");
    }

    let catId = prog.categoryId ? String(prog.categoryId) : "";
    if (!catId && prog.category) {
      const found = CATEGORIES.find(c => c.id === prog.category || c.name.toLowerCase() === String(prog.category).toLowerCase());
      if (found) catId = found.id;
    }
    if (!catId) catId = "1";
    setModalEditCategoryId(catId);

    setModalEditTrainingHours(prog.trainingHours || "");
    setModalEditLocation(prog.location || "");
    setModalEditCost(prog.cost || "Free");
    setModalEditSlotsTotal(prog.slotsTotal || 25);
    setModalEditEligibility(prog.eligibility || "");
    setModalEditRequiredDocuments(prog.requiredDocuments ? prog.requiredDocuments.join(', ') : "");
    setModalEditRequiredSkills(prog.requiredSkills ? prog.requiredSkills.join(', ') : "");
    setModalEditContactName(prog.contactPerson || "");
    setModalEditContactPhone(prog.contactNumber || "");
    setModalEditTrainingDays(prog.trainingDays || []);
    setModalEditStartTime(parseTimeForInput(prog.startTime));
    setModalEditEndTime(parseTimeForInput(prog.endTime));
    setModalEditRoom(prog.room || "");
    setModalEditInstructor(prog.instructor || "");
    setModalEditStartDate(prog.startDate ? new Date(prog.startDate).toISOString().split('T')[0] : "");
    setModalEditEndDate(prog.endDate ? new Date(prog.endDate).toISOString().split('T')[0] : "");
    setIsEditingInModal(true);
  };

  // Auto-calculated hours for modal inline edit
  const computedModalTrainingHours = useMemo(() => {
    if (!modalEditStartDate || !modalEditEndDate || !modalEditStartTime || !modalEditEndTime || modalEditTrainingDays.length === 0) {
      return null;
    }
    return computeProgramTrainingHours({
      startDate: modalEditStartDate,
      endDate: modalEditEndDate,
      startTime: modalEditStartTime,
      endTime: modalEditEndTime,
      trainingDays: modalEditTrainingDays
    });
  }, [modalEditStartDate, modalEditEndDate, modalEditStartTime, modalEditEndTime, modalEditTrainingDays]);

  const applyModalTimeslotPreset = (preset: "morning" | "afternoon" | "fullday" | "evening") => {
    if (preset === "morning") {
      setModalEditStartTime("08:00");
      setModalEditEndTime("12:00");
    } else if (preset === "afternoon") {
      setModalEditStartTime("13:00");
      setModalEditEndTime("17:00");
    } else if (preset === "fullday") {
      setModalEditStartTime("08:00");
      setModalEditEndTime("17:00");
    } else if (preset === "evening") {
      setModalEditStartTime("17:30");
      setModalEditEndTime("20:30");
    }
  };

  const handleSaveModalEdits = async () => {
    if (!viewingProgram) return;

    if (!modalEditTitle.trim()) {
      addToast("Please fill in the program title", "error");
      return;
    }

    if (!modalEditTrainingHours || Number(modalEditTrainingHours) <= 0) {
      addToast("Training hours must be greater than 0", "error");
      return;
    }

    if (modalEditTrainingDays.length === 0) {
      addToast("Please select at least one training day", "error");
      return;
    }

    if (modalEditStartTime && modalEditEndTime && modalEditStartTime >= modalEditEndTime) {
      addToast("Start time must be before end time", "error");
      return;
    }

    if (modalEditStartDate && modalEditEndDate && new Date(modalEditStartDate) > new Date(modalEditEndDate)) {
      addToast("Start date must be before or equal to end date", "error");
      return;
    }

    setIsSavingModal(true);
    const fullTitle = modalEditLevel && !modalEditTitle.toUpperCase().includes(modalEditLevel)
      ? `${modalEditTitle.trim()} ${modalEditLevel}`.trim()
      : modalEditTitle.trim();

    const payload = {
      id: viewingProgram.id,
      title: fullTitle,
      categoryId: modalEditCategoryId,
      location: modalEditLocation,
      trainingHours: Number(modalEditTrainingHours),
      cost: modalEditCost,
      slotsTotal: Number(modalEditSlotsTotal),
      eligibility: modalEditEligibility,
      requiredDocuments: modalEditRequiredDocuments ? modalEditRequiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : [],
      requiredSkills: modalEditRequiredSkills ? modalEditRequiredSkills.split(',').map(s => s.trim()).filter(Boolean) : [],
      contactPerson: modalEditContactName,
      contactNumber: modalEditContactPhone,
      trainingDays: modalEditTrainingDays,
      startTime: modalEditStartTime || undefined,
      endTime: modalEditEndTime || undefined,
      room: modalEditRoom,
      instructor: modalEditInstructor,
      startDate: modalEditStartDate || undefined,
      endDate: modalEditEndDate || undefined,
    };

    try {
      const res = await fetch("/api/programs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update program");
      }

      setPrograms(prev => prev.map(p => p.id === viewingProgram.id ? data.data : p));
      setArchivedProgramsList(prev => prev.map(p => p.id === viewingProgram.id ? data.data : p));
      setViewingProgram(data.data);
      setIsEditingInModal(false);
      addToast("Program details updated successfully!", "success");
      broadcastDataChange("programs", "updated");
    } catch (err: any) {
      addToast(err.message || "An error occurred", "error");
    } finally {
      setIsSavingModal(false);
    }
  };

  // Only active, non-closed programs should appear on the dashboard
  const activePrograms = useMemo(() => {
    return programs.filter(p => p.activeStatus !== "Closed");
  }, [programs]);

  // Programs whose duration has completed
  const completedPrograms = useMemo(() => {
    return activePrograms.filter(p => isProgramDurationDone(p));
  }, [activePrograms]);

  // Active referrals: only non-archived referrals belonging to active programs
  const activeReferrals = useMemo(() => {
    const seenApplicantProg = new Set<string>();
    return referrals.filter(item => {
      const youthKey = (item.youthId || item.youthEmail || item.youthName || item.id).toLowerCase().trim();
      const progKey = (item.programId || item.programTitle || item.id).toLowerCase().trim();
      const compositeKey = `${youthKey}::${progKey}`;
      if (seenApplicantProg.has(compositeKey)) return false;
      seenApplicantProg.add(compositeKey);
      if (item.status === "Archived") return false;
      const prog = activePrograms.find(p => p.title === item.programTitle || p.id === item.programId);
      return !!prog;
    });
  }, [referrals, activePrograms]);

  // Computed Metrics based on active catalog
  const totalSlotsRemaining = useMemo(() => activePrograms.reduce((acc, curr) => acc + curr.slotsRemaining, 0), [activePrograms]);
  const totalSlotsAllocated = useMemo(() => activePrograms.reduce((acc, curr) => acc + (curr.slotsTotal || 30), 0), [activePrograms]);
  const pendingReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Pending").length, [activeReferrals]);
  const enrolledReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Enrolled").length, [activeReferrals]);

  // Memoized TESDA notifications
  const tesdaNotifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      desc: string;
      icon: React.ReactNode;
      bg: string;
      action: () => void;
    }> = [];

    if (pendingReferralsCount > 0) {
      list.push({
        id: "notif-tesda-pending",
        title: `Pending Youth Applications (${pendingReferralsCount})`,
        desc: "Youth members are waiting for TESDA enrollment confirmation.",
        icon: <Clock className="w-4 h-4 text-amber-800" />,
        bg: "bg-amber-100",
        action: () => {
          setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
          setDashboardTab("pending");
        }
      });
    }

    if (activePrograms.length > 0) {
      list.push({
        id: "notif-tesda-programs",
        title: `Active Training Programs (${activePrograms.length})`,
        desc: `${totalSlotsRemaining} open training slots available across programs.`,
        icon: <BookOpen className="w-4 h-4 text-[#0A6B43]" />,
        bg: "bg-emerald-100/70",
        action: () => {
          setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
        }
      });
    }

    return list;
  }, [pendingReferralsCount, activePrograms.length, totalSlotsRemaining]);

  const activeNotifs = useMemo(() => {
    return tesdaNotifications.filter(n => !clearedNotificationIds.includes(n.id));
  }, [tesdaNotifications, clearedNotificationIds]);

  // Unique Barangays from active referrals
  const uniqueBarangays = useMemo(() => {
    const set = new Set(activeReferrals.map(r => r.barangay).filter(Boolean));
    return Array.from(set).sort();
  }, [activeReferrals]);

  // Filter referrals based on search, status, program, barangay, and dashboardTab
  const filteredReferrals = useMemo(() => {
    return activeReferrals.filter(item => {
      const matchesSearch =
        item.youthName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        item.barangay.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        item.purok.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
        item.programTitle.toLowerCase().includes(pipelineSearch.toLowerCase());

      let matchesStatus = pipelineStatusFilter === "All" || item.status === pipelineStatusFilter;
      if (dashboardTab === "pending") matchesStatus = item.status === "Pending";
      else if (dashboardTab === "enrolled") matchesStatus = item.status === "Enrolled";

      const matchesProgram = pipelineProgramFilter === "All" || item.programTitle === pipelineProgramFilter;
      const matchesBarangay = pipelineBarangayFilter === "All" || item.barangay === pipelineBarangayFilter;

      return matchesSearch && matchesStatus && matchesProgram && matchesBarangay;
    });
  }, [activeReferrals, pipelineSearch, pipelineStatusFilter, pipelineProgramFilter, pipelineBarangayFilter, dashboardTab]);

  // Active program titles ONLY (never display closed or deleted program titles)
  const allProgramTitles = useMemo(() => {
    return activePrograms.map(p => p.title);
  }, [activePrograms]);

  // Group the filtered referrals by active program title
  const groupedReferrals: Record<string, ReferralPipelineItem[]> = useMemo(() => {
    const grouped: Record<string, ReferralPipelineItem[]> = {};
    allProgramTitles.forEach(title => {
      grouped[title] = [];
    });

    filteredReferrals.forEach(item => {
      if (grouped[item.programTitle]) {
        grouped[item.programTitle].push(item);
      }
    });
    return grouped;
  }, [allProgramTitles, filteredReferrals]);

  const isSearchActive = pipelineSearch !== "" || pipelineStatusFilter !== "All" || pipelineProgramFilter !== "All" || pipelineBarangayFilter !== "All" || (dashboardTab !== "all" && dashboardTab !== "archived");

  // Filter program titles to display in pipeline list
  const programTitlesToDisplay = useMemo(() => {
    return allProgramTitles.filter(title => {
      const applicantsCount = groupedReferrals[title]?.length || 0;
      if (isSearchActive) {
        return applicantsCount > 0;
      }
      return true;
    });
  }, [allProgramTitles, groupedReferrals, isSearchActive]);

  // Pagination calculations for Grouped Pipeline Lists (Tab 1, 2, 3)
  const totalPipelineProgramPages = Math.ceil(programTitlesToDisplay.length / DASHBOARD_PROGRAMS_PER_PAGE) || 1;
  const currentPipelineProgramPage = Math.min(dashboardProgramPage, totalPipelineProgramPages);
  const paginatedProgramTitles = useMemo(() => {
    const start = (currentPipelineProgramPage - 1) * DASHBOARD_PROGRAMS_PER_PAGE;
    return programTitlesToDisplay.slice(start, start + DASHBOARD_PROGRAMS_PER_PAGE);
  }, [programTitlesToDisplay, currentPipelineProgramPage]);

  // Pagination calculations for Program Roster Grid (Tab 4) - 6 programs per page
  const totalRosterProgramPages = Math.ceil(activePrograms.length / DASHBOARD_ROSTER_PER_PAGE) || 1;
  const currentRosterProgramPage = Math.min(dashboardRosterPage, totalRosterProgramPages);
  const paginatedRosterPrograms = useMemo(() => {
    const start = (currentRosterProgramPage - 1) * DASHBOARD_ROSTER_PER_PAGE;
    return activePrograms.slice(start, start + DASHBOARD_ROSTER_PER_PAGE);
  }, [activePrograms, currentRosterProgramPage]);

  // Pagination page numbers generator helper
  const getPaginationItems = (currentPage: number, totalPages: number): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  // Unique TESDA categories for filtering (derived from taxonomy CATEGORIES and existing programs)
  const tesdaCategoryOptions = useMemo(() => {
    const catSet = new Set<string>();
    programs.forEach(p => {
      const c = getProgramCategory(p);
      if (c) catSet.add(c);
    });
    CATEGORIES.forEach(c => catSet.add(c.name));
    return Array.from(catSet).sort().map(cat => ({ value: cat, label: cat }));
  }, [programs]);

  // Filter for Programs Screen
  const filteredProgramsList = useMemo(() => {
    const sourceList = viewingArchivedPrograms ? archivedProgramsList : activePrograms;
    return sourceList.filter(prog => {
      const q = programSearchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        prog.title.toLowerCase().includes(q) ||
        (prog.location && prog.location.toLowerCase().includes(q)) ||
        (prog.instructor && prog.instructor.toLowerCase().includes(q)) ||
        (prog.provider && prog.provider.toLowerCase().includes(q)) ||
        (prog.requiredSkills && prog.requiredSkills.some(s => s.toLowerCase().includes(q)));

      const matchesLevel = programLevelFilter === "All" || prog.title.toUpperCase().includes(programLevelFilter);

      const catName = getProgramCategory(prog);
      const matchesCategory = programCategoryFilter === "All" ||
        catName.toLowerCase().trim() === programCategoryFilter.toLowerCase().trim();

      const isEnded = isProgramEnded(prog) || isProgramDurationDone(prog);
      let matchesStatus = true;
      if (programStatusFilter === "Active") {
        matchesStatus = !isEnded && prog.activeStatus !== "Closed";
      } else if (programStatusFilter === "Concluded") {
        matchesStatus = isEnded || prog.activeStatus === "Closed";
      }

      let matchesCost = true;
      if (programCostFilter === "Free") {
        matchesCost = !prog.cost || prog.cost.toLowerCase().includes("free");
      } else if (programCostFilter === "Subsidized") {
        matchesCost = Boolean(prog.cost && prog.cost.toLowerCase().includes("subsidized"));
      } else if (programCostFilter === "With Fee") {
        matchesCost = Boolean(prog.cost && (prog.cost.toLowerCase().includes("fee") || prog.cost.toLowerCase().includes("paid")));
      }

      return matchesSearch && matchesLevel && matchesCategory && matchesStatus && matchesCost;
    });
  }, [viewingArchivedPrograms, archivedProgramsList, activePrograms, programSearchQuery, programLevelFilter, programCategoryFilter, programStatusFilter, programCostFilter]);

  // Pagination calculations for Published Programs Catalog Screen - 6 programs per page
  const totalProgramsCatalogPages = Math.ceil(filteredProgramsList.length / PROGRAMS_CATALOG_PER_PAGE) || 1;
  const currentProgramsCatalogPage = Math.min(programsCatalogPage, totalProgramsCatalogPages);
  const paginatedCatalogPrograms = useMemo(() => {
    const start = (currentProgramsCatalogPage - 1) * PROGRAMS_CATALOG_PER_PAGE;
    return filteredProgramsList.slice(start, start + PROGRAMS_CATALOG_PER_PAGE);
  }, [filteredProgramsList, currentProgramsCatalogPage]);

  // Helper to open applicant modal
  const openApplicantModal = (item: ReferralPipelineItem) => {
    setSelectedApplicantReferral(item);
    const itemEmail = (item.youthEmail || (item as any).email || "").toLowerCase().trim();
    const matchedProfile = youthProfiles.find(y =>
      (item.youthId && y.id === item.youthId) ||
      (itemEmail && y.email && y.email.toLowerCase().trim() === itemEmail) ||
      (!item.youthId && !itemEmail && y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim())
    );
    if (matchedProfile) {
      setSelectedApplicant(matchedProfile);
    } else {
      setSelectedApplicant({
        id: item.id,
        name: item.youthName,
        age: 20,
        purok: item.purok,
        barangay: item.barangay,
        educationalAttainment: "Junior High School Graduate",
        currentStatus: "Out-of-school",
        skills: ["Basic Technical Skills", "Hands-on Workshop"],
        interests: ["Vocational Training", "Employment"],
        sectorPreference: "Technical-Vocational",
        livelihoodGoal: `Acquire certification in ${item.programTitle} for gainful employment.`,
        contactNumber: "+63 917 000 0000",
        registeredDate: item.referralDate,
        matchScore: item.matchScore,
        soloParent: false,
        pwd: false,
        indigenous: false
      });
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-[#F8FAF9] flex font-sans text-slate-800 antialiased w-full" id="tesda-portal-container">
      {/* Mobile & Tablet Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Responsive Sliding Drawer on Mobile & Tablet / Sticky on Desktop) */}
      <aside
        className={`fixed xl:static inset-y-0 left-0 z-50 w-72 sm:w-80 xl:w-[17%] xl:min-w-[260px] h-[100dvh] max-h-[100dvh] shrink-0 bg-[#082D21] text-white flex flex-col justify-between shadow-2xl xl:shadow-none border-r border-white/10 select-none overflow-y-auto overscroll-y-contain overflow-x-hidden transform transition-transform duration-300 ease-in-out font-sans ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain min-h-0 flex-1">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-6 px-0.5 pt-0.5">
            <div className="flex items-center gap-2.5 min-w-0 sidebar-brand-container">
              <SikapLogo size={36} logoSize={38} textSize={27} variant="white" showText={true} disableHover={true} className="sidebar-brand-logo" />
              <div className="border-l border-white/20 pl-2.5 min-w-0 shrink-0 flex flex-col justify-center sidebar-brand-divider">
                <span className="text-xs sm:text-[13px] font-black text-amber-400 uppercase tracking-wider block leading-tight sidebar-brand-position">Partner</span>
                <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide block truncate leading-tight mt-0.5 max-w-[105px] sm:max-w-[120px] xl:max-w-[135px] sidebar-brand-barangay" title="TESDA Partner">
                  TESDA
                </span>
              </div>
            </div>

            {/* Mobile/Tablet Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="xl:hidden p-1 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 relative">
            {[
              {
                id: TESDAPartnerScreen.DASHBOARD,
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
                ),
                onClick: () => {
                  setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
                  setDashboardTab("all");
                }
              },
              {
                id: TESDAPartnerScreen.PROGRAMS,
                label: "Programs",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 6.25c-1.85-1.4-4.22-2.25-6.75-2.25H2v14.5h3.25c2.14 0 4.18.66 5.75 1.75V6.25z" />
                    <path d="M12 6.25c1.85-1.4 4.22-2.25 6.75-2.25H22v14.5h-3.25c-2.14 0-4.18.66-5.75 1.75V6.25z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                ),
                onClick: () => {
                  setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                }
              },
              {
                id: TESDAPartnerScreen.SETTINGS,
                label: "Settings",
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
                ),
                onClick: () => {
                  setCurrentScreen(TESDAPartnerScreen.SETTINGS);
                }
              }
            ].map((tab) => {
              const isActive =
                currentScreen === tab.id ||
                (tab.id === TESDAPartnerScreen.PROGRAMS &&
                  (currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM));

              return (
                <div key={tab.id} className="relative">
                  {/* Animated Active Page Indicator Bar on far-left edge */}
                  {isActive && (
                    <motion.span
                      layoutId="tesdaActiveIndicator"
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#02513B] rounded-r-full shadow-[0_0_8px_rgba(2,81,59,0.8)] z-20 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Animated Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="tesdaActiveBackground"
                      className="absolute inset-0 bg-[#02513B] rounded-xl pointer-events-none z-0 shadow-sm border border-emerald-400/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      tab.onClick();
                      setIsMobileNavOpen(false);
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
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-amber-400/40 shrink-0 select-none">
                {currentUser?.name
                  ? currentUser.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  : "TP"}
              </div>

              {/* Complete Name and Email without hover effect */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {currentUser?.name || "TESDA Partner"}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5" title={currentUser?.email || "partner@tesda.gov.ph"}>
                  {currentUser?.email || "partner@tesda.gov.ph"}
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

      {/* Main Viewport */}
      <main className="flex-1 h-full max-h-full flex flex-col min-w-0 overflow-y-auto overscroll-y-contain pb-12 sm:pb-6">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Mobile & Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="xl:hidden p-2 -ml-1 text-gray-700 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[24px] xl:text-3xl font-black text-[#0A6B43] tracking-tight leading-tight truncate">
                {currentScreen === TESDAPartnerScreen.DASHBOARD && "Dashboard"}
                {currentScreen === TESDAPartnerScreen.PROGRAMS && "Programs"}
                {currentScreen === TESDAPartnerScreen.ADD_PROGRAM && "Post New Program"}
                {currentScreen === TESDAPartnerScreen.EDIT_PROGRAM && "Edit Program"}
                {currentScreen === TESDAPartnerScreen.SETTINGS && "Settings"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0" id="notification-bell-container">
            {/* Notification Bell */}
            <div className="relative">
              <NotificationBellButton
                isOpen={showNotifications}
                onClick={() => setShowNotifications(!showNotifications)}
                unreadCount={activeNotifs.filter(n => !readNotificationIds.includes(n.id)).length}
                title="TESDA Notifications"
                size="lg"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs"
              />

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="fixed inset-x-3.5 top-20 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-14 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white border border-emerald-100 rounded-2xl shadow-2xl py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/70 p-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-slate-900 text-xs">TESDA Action Center</span>
                        {activeNotifs.filter(n => !readNotificationIds.includes(n.id)).length > 0 && (
                          <span className="bg-[#0A6B43] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {activeNotifs.filter(n => !readNotificationIds.includes(n.id)).length}
                          </span>
                        )}
                      </div>
                      {activeNotifs.length > 0 && (
                        <div className="flex items-center gap-2">
                          {activeNotifs.some(n => !readNotificationIds.includes(n.id)) && (
                            <>
                              <button
                                type="button"
                                onClick={() => markAllAsRead(tesdaNotifications.map(n => n.id))}
                                className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                title="Mark all notifications as read"
                              >
                                Mark read
                              </button>
                              <span className="text-gray-300">·</span>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => clearAllNotifications(tesdaNotifications.map(n => n.id))}
                            className="text-[10px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                            title="Clear all alerts from list"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>

                    <NotificationSettingsCard compact userRole="TESDA_PARTNER" addToast={addToast} />

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {activeNotifs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                          <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-gray-700">All caught up!</p>
                          <p className="text-[10px] text-gray-400">No active alerts or pending youth action items right now.</p>
                        </div>
                      ) : (
                        activeNotifs.map((n) => {
                          const isRead = readNotificationIds.includes(n.id);
                          return (
                            <div
                              key={n.id}
                              onClick={() => {
                                markAsRead(n.id);
                                n.action();
                                setShowNotifications(false);
                              }}
                              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                                isRead ? "bg-white hover:bg-gray-50/80" : "bg-emerald-50/30 hover:bg-emerald-50/60"
                              }`}
                            >
                              <div className={`p-2 rounded-xl ${n.bg} shrink-0 mt-0.5 relative`}>
                                {n.icon}
                                {!isRead && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0A6B43] rounded-full ring-2 ring-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className={`text-xs ${isRead ? "font-semibold text-gray-700" : "font-extrabold text-slate-900"}`}>
                                  {n.title}
                                </p>
                                <p className={`text-[11px] mt-0.5 leading-relaxed ${isRead ? "text-gray-400 font-normal" : "text-slate-600 font-medium"}`}>
                                  {n.desc}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 -mr-1">
                                {!isRead && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(n.id);
                                    }}
                                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-emerald-700 hover:bg-emerald-100/70 p-1.5 sm:p-1 rounded-md transition-all"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(n.id);
                                  }}
                                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-rose-600 hover:bg-gray-100 p-1.5 sm:p-1 rounded-md transition-all"
                                  title="Clear alert"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400">Click an action to navigate, or close to dismiss</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="px-2 sm:px-3 lg:px-4 py-4 sm:py-6 space-y-6 max-w-[1420px] w-full mx-auto">

          {/* ============================================================ */}
          {/* SCREEN 1: DASHBOARD & PIPELINE */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.DASHBOARD && (
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
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Mabuhay, {currentUser?.name || repName || "TESDA Partner"}!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage training listings and connect youth with programs suited to their skills and goals.
                  </p>
                </div>
              </div>
              {/* Alert Banner if Programs have reached end date */}
              {completedPrograms.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/10 via-purple-50 to-indigo-50 border border-purple-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-[11px] sm:text-xs font-black text-purple-950 uppercase tracking-wider">
                          Training Term Concluded ({completedPrograms.length})
                        </h4>
                        <span className="text-[9.5px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200/90 text-purple-800 border border-purple-300/40">
                          Ready to Archive
                        </span>
                      </div>
                      <p className="text-[11.5px] sm:text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                        {completedPrograms.length === 1 ? (
                          <>
                            <strong>"{completedPrograms[0].title}"</strong> training schedule has ended. Click below to archive the program and graduate its enrollees.
                          </>
                        ) : (
                          <>
                            {completedPrograms.length} training programs have concluded their schedules. You can archive them to graduate their enrollees.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons: Clean Responsive Layout on Mobile & Desktop */}
                  <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-purple-200/60 md:border-t-0">
                    {completedPrograms.map(prog => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => setProgramToArchive(prog)}
                        className="w-full md:w-auto h-[38px] sm:h-auto px-3.5 py-2 bg-purple-700 hover:bg-purple-800 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center md:justify-start gap-1.5 cursor-pointer"
                        title={`Archive "${prog.title}" and record enrollees as completed/graduated`}
                      >
                        <Archive className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[260px] sm:max-w-[200px] md:max-w-none">
                          Archive {completedPrograms.length > 1 ? prog.title : 'Term & Enrollees'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert Banner if Pending Applicants */}
              {pendingReferralsCount > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0 mt-0.5 sm:mt-0">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] sm:text-xs font-black text-amber-950 uppercase tracking-wider">Action Required: New Applicants</h4>
                      <p className="text-[11.5px] sm:text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                        You have <span className="font-bold text-amber-800">{pendingReferralsCount} Katipunan ng Kabataan</span> candidate(s) awaiting enrollment review.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDashboardTab("pending")}
                    className="w-full md:w-auto h-[38px] sm:h-auto px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer flex items-center justify-center"
                  >
                    Review Pending ({pendingReferralsCount})
                  </button>
                </div>
              )}

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <MetricCard
                  title="Published Programs"
                  value={activePrograms.length}
                  subtitle={`${activePrograms.filter(p => p.slotsRemaining > 0).length} active · ${activePrograms.filter(p => p.slotsRemaining === 0).length} full`}
                  icon={<BookOpen className="w-5 h-5" />}
                  accent="teal"
                />
                <MetricCard
                  title="Available Capacity"
                  value={totalSlotsRemaining}
                  subtitle={`out of ${totalSlotsAllocated} total slots`}
                  icon={<Target className="w-5 h-5" />}
                  accent="green"
                />
                <MetricCard
                  title="Active Pipeline"
                  value={activeReferrals.length}
                  subtitle="registered applicants"
                  icon={<Users className="w-5 h-5" />}
                  accent="gold"
                />
                <MetricCard
                  title="Enrolled Trainees"
                  value={enrolledReferralsCount}
                  subtitle="confirmed cohort members"
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  accent="charcoal"
                />
              </div>

              {/* View Selector Tabs & Global Search - Standardized Main Card Container */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  {/* Segment Tabs */}
                  <div className="h-[38px] p-1 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 max-w-full">
                    <button
                      onClick={() => setDashboardTab("all")}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${dashboardTab === "all"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      All Active ({activeReferrals.length})
                    </button>
                    <button
                      onClick={() => setDashboardTab("pending")}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "pending"
                          ? "bg-white text-amber-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Pending</span>
                      {pendingReferralsCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {pendingReferralsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setDashboardTab("enrolled")}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${dashboardTab === "enrolled"
                          ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      Enrolled ({enrolledReferralsCount})
                    </button>
                    <button
                      onClick={() => setDashboardTab("programs")}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${dashboardTab === "programs"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      Program Roster ({activePrograms.length})
                    </button>
                    <button
                      onClick={() => {
                        setDashboardTab("archived");
                        fetchArchivedData();
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "archived"
                          ? "bg-white text-emerald-800 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archived History</span>
                    </button>
                  </div>

                  {/* Right Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNewProgramClick}
                      className="w-full sm:w-auto px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post New Program</span>
                    </button>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search applicant, purok, or program…"
                      value={pipelineSearch}
                      onChange={(e) => setPipelineSearch(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-8 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                    {pipelineSearch && (
                      <button
                        type="button"
                        onClick={() => setPipelineSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Program Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={pipelineProgramFilter}
                      onChange={(val) => setPipelineProgramFilter(val)}
                      options={[
                        { value: "All", label: "All Programs" },
                        ...activePrograms.map(p => ({ value: p.title, label: p.title }))
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="All Programs"
                    />
                  </div>

                  {/* Barangay Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={pipelineBarangayFilter}
                      onChange={(val) => setPipelineBarangayFilter(val)}
                      options={[
                        { value: "All", label: "All Barangays" },
                        ...uniqueBarangays.map(b => ({ value: b, label: `Brgy. ${b}` }))
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="All Barangays"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={pipelineStatusFilter}
                      onChange={(val) => setPipelineStatusFilter(val)}
                      disabled={dashboardTab !== "all"}
                      options={[
                        { value: "All", label: "All Statuses" },
                        { value: "Pending", label: "Pending Review" },
                        { value: "Enrolled", label: "Enrolled" },
                        { value: "Declined", label: "Declined" }
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="All Statuses"
                    />
                  </div>
                </div>

                {/* Active Filter Clear Bar */}
                {isSearchActive && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">
                      Showing <strong className="text-gray-900">{filteredReferrals.length}</strong> candidate match(es) across programs
                    </span>
                    <button
                      onClick={() => {
                        setPipelineSearch("");
                        setPipelineStatusFilter("All");
                        setPipelineProgramFilter("All");
                        setPipelineBarangayFilter("All");
                        setDashboardTab("all");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reset All Filters
                    </button>
                  </div>
                )}
              </div>

              {/* ============================================================ */}
              {/* TAB 1, 2, 3: Grouped Pipeline Lists */}
              {/* ============================================================ */}
              {dashboardTab !== "programs" && dashboardTab !== "archived" && (
                <div className="space-y-4">
                  {programTitlesToDisplay.length === 0 ? (
                    <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] py-12 sm:py-16 px-6 text-center space-y-4">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                        <Users className="w-7 h-7" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-[18px] font-extrabold text-gray-900 tracking-tight leading-snug">No Applicants Found</h3>
                        <p className="text-[14px] text-gray-500 leading-relaxed font-normal max-w-md mx-auto">
                          No Katipunan ng Kabataan applicants match your active search or filter configuration. Try adjusting your filters.
                        </p>
                      </div>
                      {isSearchActive && (
                        <button
                          type="button"
                          onClick={() => {
                            setPipelineSearch("");
                            setPipelineStatusFilter("All");
                            setPipelineProgramFilter("All");
                            setPipelineBarangayFilter("All");
                            setDashboardTab("all");
                          }}
                          className="mt-2 px-3.5 py-1.5 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Reset All Filters
                        </button>
                      )}
                    </div>
                  ) : (
                    paginatedProgramTitles.map((title) => {
                      const programApplicants = groupedReferrals[title] || [];
                      const isExpanded = expandedPrograms[title] !== false;
                      const originalProgram = activePrograms.find(p => p.title === title);
                      const slotsRemaining = originalProgram?.slotsRemaining;
                      const slotsTotal = originalProgram?.slotsTotal || 30;

                      return (
                        <div key={title} className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
                          {/* Program Accordion Header */}
                          <div
                            onClick={() => toggleProgramExpand(title)}
                            className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-900 via-[#0A4D36] to-emerald-950 text-white border-b border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition-all hover:brightness-105 shadow-xs"
                          >
                            <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-black shrink-0 shadow-xs mt-0.5 sm:mt-0">
                                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-xs sm:text-sm text-white break-words sm:truncate" title={title}>
                                    {title}
                                  </h3>
                                  <span className="text-[10px] font-extrabold px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 shrink-0">
                                    {programApplicants.length} Candidate{programApplicants.length !== 1 ? "s" : ""}
                                  </span>
                                  {isProgramDurationDone(originalProgram) && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1 shrink-0">
                                      <Clock className="w-3 h-3 text-purple-300" /> Term Ended
                                    </span>
                                  )}
                                  {slotsRemaining !== undefined && (
                                    <span className={`sm:hidden text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${slotsRemaining > 5
                                        ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                                        : slotsRemaining > 0
                                          ? "bg-amber-500/20 text-amber-200 border-amber-400/30"
                                          : "bg-red-500/20 text-red-200 border-red-400/30"
                                      }`}>
                                      {slotsRemaining} / {slotsTotal} Slots Left
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2.5 text-[11px] sm:text-xs text-emerald-200/80 mt-1.5 sm:mt-1 flex-wrap font-medium">
                                  {originalProgram?.trainingHours && (
                                    <span className="bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/40 shrink-0 font-semibold">
                                      ⏱ {originalProgram.trainingHours} Hours
                                    </span>
                                  )}
                                  {originalProgram && (
                                    <span className="bg-emerald-950/80 text-emerald-200 px-2 sm:px-2.5 py-0.5 rounded-md border border-emerald-700/50 flex items-center gap-1 sm:gap-1.5 font-bold shrink-0 max-w-full">
                                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                                      <span className="truncate">{getProgramFullSchedule(originalProgram)}</span>
                                    </span>
                                  )}
                                  {originalProgram?.location && (
                                    <span className="truncate max-w-[200px] sm:max-w-none flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span>{originalProgram.location}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Capacity Indicator & Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-4 shrink-0 pt-1 md:pt-0 border-t border-emerald-800/30 md:border-t-0">
                              <div className="flex items-center gap-2">
                                {originalProgram && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProgramToArchive(originalProgram);
                                    }}
                                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold rounded-xl transition-all flex items-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer ${isProgramDurationDone(originalProgram)
                                        ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                        : "bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-600/40"
                                      }`}
                                    title={isProgramDurationDone(originalProgram) ? "Training Concluded: Archive Term & Enrollees" : "Conclude & Archive Program Term"}
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>{isProgramDurationDone(originalProgram) ? "Archive Term" : "Archive"}</span>
                                  </button>
                                )}
                              </div>

                              {slotsRemaining !== undefined && (
                                <div className="text-right hidden sm:block">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className={`text-xs font-black ${slotsRemaining > 5 ? "text-emerald-300" : slotsRemaining > 0 ? "text-amber-300" : "text-red-300"
                                      }`}>
                                      {slotsRemaining} / {slotsTotal} Slots Left
                                    </span>
                                  </div>
                                  <div className="w-24 bg-emerald-950/80 h-1.5 rounded-full overflow-hidden mt-1 ml-auto border border-emerald-700/40">
                                    <div
                                      className={`h-full rounded-full ${slotsRemaining > 5 ? "bg-emerald-400" : slotsRemaining > 0 ? "bg-amber-400" : "bg-red-400"
                                        }`}
                                      style={{ width: `${Math.min(100, Math.round(((slotsTotal - slotsRemaining) / slotsTotal) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 text-emerald-200 flex items-center justify-center border border-white/10 shrink-0"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Candidate List Body - Smooth Height & Opacity Expand */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                key={`program-candidates-${title}`}
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                  height: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
                                  opacity: { duration: 0.22, ease: "easeOut" }
                                }}
                                className="overflow-hidden"
                              >
                                <div className="overflow-x-auto">
                                  {programApplicants.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                                      No applicants enrolled or registered under this program for the selected filters.
                                    </div>
                                  ) : (
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                                          <th className="py-3 px-4">Candidate Name</th>
                                          <th className="py-3 px-4">Barangay & Purok</th>
                                          <th className="py-3 px-4">Match Score</th>
                                          <th className="py-3 px-4">Applied Date</th>
                                          <th className="py-3 px-4">Status</th>
                                          <th className="py-3 px-4 text-right">Admissions Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {programApplicants.map((item) => (
                                          <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                                            {/* Name & Quick Profile */}
                                            <td className="py-3.5 px-4">
                                              <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0">
                                                  {item.youthName.charAt(0)}
                                                </div>
                                                <div>
                                                  <button
                                                    onClick={() => openApplicantModal(item)}
                                                    className="font-bold text-gray-900 hover:text-[#0A6B43] hover:underline cursor-pointer text-left block text-sm"
                                                  >
                                                    {item.youthName}
                                                  </button>
                                                  <span className="text-[11px] text-gray-500 font-medium">
                                                    Katipunan ng Kabataan
                                                  </span>
                                                </div>
                                              </div>
                                            </td>

                                            {/* Residency */}
                                            <td className="py-3.5 px-4 font-semibold text-gray-700">
                                              <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>Purok {item.purok}, Brgy. {item.barangay}</span>
                                              </div>
                                            </td>

                                            {/* Match Score */}
                                            <td className="py-3.5 px-4">
                                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#0A6B43] border border-emerald-200">
                                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                                {item.matchScore}% Match
                                              </span>
                                            </td>

                                            {/* Applied Date */}
                                            <td className="py-3.5 px-4 text-gray-500 font-medium">
                                              {item.referralDate}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4">
                                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${item.status === "Enrolled"
                                                  ? "bg-emerald-50 text-[#0A6B43] border-emerald-250"
                                                  : item.status === "Pending"
                                                    ? "bg-amber-50 text-amber-800 border-amber-250"
                                                    : "bg-red-50 text-red-700 border-red-200"
                                                }`}>
                                                {item.status}
                                              </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  onClick={() => openApplicantModal(item)}
                                                  className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] border border-gray-200 hover:border-emerald-250 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                                  title="View Full Profile Dossier"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                  <span className="hidden sm:inline">Profile</span>
                                                </button>

                                                {item.status === "Pending" ? (
                                                  <>
                                                    <button
                                                      onClick={() => handleUpdateReferralStatus(item.id, "Enrolled")}
                                                      className="px-3 py-1.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                      title="Accept & Enroll Trainee"
                                                    >
                                                      <Check className="w-3.5 h-3.5" />
                                                      <span>Enroll</span>
                                                    </button>
                                                    <button
                                                      onClick={() => handleUpdateReferralStatus(item.id, "Declined")}
                                                      className="p-1.5 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                                      title="Decline Application"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </>
                                                ) : (
                                                  <span className="text-[10px] text-gray-400 font-bold px-2 py-1 bg-gray-50 border border-gray-200 rounded-md">
                                                    Processed
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  )}

                  {/* Pagination Controls for Grouped Pipeline Programs */}
                  {totalPipelineProgramPages > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900">{(currentPipelineProgramPage - 1) * DASHBOARD_PROGRAMS_PER_PAGE + 1}</span> to{" "}
                        <span className="font-bold text-gray-900">{Math.min(programTitlesToDisplay.length, currentPipelineProgramPage * DASHBOARD_PROGRAMS_PER_PAGE)}</span> of{" "}
                        <span className="font-bold text-gray-900">{programTitlesToDisplay.length}</span> programs
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          disabled={currentPipelineProgramPage === 1}
                          onClick={() => {
                            setDashboardProgramPage(p => Math.max(1, p - 1));
                            document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                          }}
                          className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {getPaginationItems(currentPipelineProgramPage, totalPipelineProgramPages).map((item, idx) => {
                            if (item === "...") {
                              return (
                                <span key={`pipeline-ellipsis-${idx}`} className="w-7 text-center text-xs text-gray-400 select-none">
                                  ...
                                </span>
                              );
                            }
                            const pageNum = Number(item);
                            const isSelected = pageNum === currentPipelineProgramPage;
                            return (
                              <button
                                key={`pipeline-page-${pageNum}`}
                                type="button"
                                onClick={() => {
                                  setDashboardProgramPage(pageNum);
                                  document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                                }}
                                className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#0A6B43] text-white shadow-xs font-black"
                                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-2xs"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          disabled={currentPipelineProgramPage === totalPipelineProgramPages}
                          onClick={() => {
                            setDashboardProgramPage(p => Math.min(totalPipelineProgramPages, p + 1));
                            document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                          }}
                          className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: Program Roster Grid */}
              {/* ============================================================ */}
              {dashboardTab === "programs" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                    {paginatedRosterPrograms.map((prog) => (
                    <div key={prog.id} className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 pb-3 sm:pb-3.5 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md flex flex-col justify-between h-full group">
                      <div>
                        {/* Header: Cost/Hours & Status Badge */}
                        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 mb-3">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2 sm:px-2.5 py-1 rounded-md shrink-0">
                            {prog.cost} · {prog.trainingHours}h
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isProgramDurationDone(prog) && (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 shrink-0">
                                <Clock className="w-3 h-3 text-purple-600" /> Ended
                              </span>
                            )}
                            <span className={`text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide ${
                              prog.slotsRemaining > 0 ? "bg-emerald-50 text-[#0A6B43] border-emerald-200" : "bg-red-50 text-red-700 border-red-200"
                            }`}>
                              {prog.slotsRemaining > 0 ? `${prog.slotsRemaining} Slots Left` : "Full Capacity"}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-base text-gray-900 group-hover:text-[#0A6B43] transition-colors leading-snug tracking-tight mb-2.5 break-words">
                          {prog.title}
                        </h3>

                        <div className="space-y-2 text-xs text-gray-600 mb-4">
                          {/* Schedule & Timeslot Badge */}
                          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Schedule & Timeslot</p>
                                <p className="text-xs font-bold text-gray-900 break-words sm:truncate">
                                  {getProgramFullSchedule(prog)}
                                </p>
                              </div>
                            </div>
                            {(() => {
                              const ts = formatProgramTimeslot(prog.startTime, prog.endTime);
                              return ts.sessionType !== "Custom" ? (
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                  ts.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
                                  ts.sessionType === "Afternoon" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                  ts.sessionType === "Full Day" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                                  "bg-purple-100 text-purple-900 border border-purple-200"
                                }`}>
                                  {ts.sessionType}
                                </span>
                              ) : null;
                            })()}
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="break-words sm:truncate font-medium">{prog.location || "San Luis Municipal Center"}</span>
                          </div>
                          {prog.instructor && (
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="break-words sm:truncate font-medium">Trainer: {prog.instructor}</span>
                            </div>
                          )}
                          {(prog.startDate || prog.endDate) && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="break-words sm:truncate font-medium">{formatProgramDateRange(prog.startDate, prog.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Capacity meter */}
                        <div className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-150">
                          <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                            <span>Enrollment Capacity</span>
                            <span>{prog.slotsTotal - prog.slotsRemaining} / {prog.slotsTotal}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[#0A6B43] h-full rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(100, Math.round(((prog.slotsTotal - prog.slotsRemaining) / prog.slotsTotal) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 pb-0.5 border-t border-gray-100 mt-3 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setViewingProgram(prog);
                            setIsEditingInModal(false);
                          }}
                          className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100/80 text-[#0A6B43] border border-emerald-200 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <div className="flex items-center gap-1">
                          {isProgramDurationDone(prog) ? (
                            <button
                              type="button"
                              onClick={() => setProgramToArchive(prog)}
                              disabled={isArchivingProgram}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                              title="Conclude Term & Archive Students"
                            >
                              {archivingProgramId === prog.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Archive className="w-3 h-3" />
                              )}
                              <span>Archive Term</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setProgramToArchive(prog)}
                              disabled={isArchivingProgram}
                              className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Archive Program"
                            >
                              {archivingProgramId === prog.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(prog)}
                            className="p-1.5 text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Program"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgramToDelete(prog)}
                            disabled={isDeletingProgram}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Program"
                          >
                            {deletingProgramId === prog.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls for Program Roster Grid */}
                {totalRosterProgramPages > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-900">{(currentRosterProgramPage - 1) * DASHBOARD_ROSTER_PER_PAGE + 1}</span> to{" "}
                      <span className="font-bold text-gray-900">{Math.min(activePrograms.length, currentRosterProgramPage * DASHBOARD_ROSTER_PER_PAGE)}</span> of{" "}
                      <span className="font-bold text-gray-900">{activePrograms.length}</span> programs
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <button
                        type="button"
                        disabled={currentRosterProgramPage === 1}
                        onClick={() => {
                          setDashboardRosterPage(p => Math.max(1, p - 1));
                          document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                        }}
                        className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {getPaginationItems(currentRosterProgramPage, totalRosterProgramPages).map((item, idx) => {
                          if (item === "...") {
                            return (
                              <span key={`roster-ellipsis-${idx}`} className="w-7 text-center text-xs text-gray-400 select-none">
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(item);
                          const isSelected = pageNum === currentRosterProgramPage;
                          return (
                            <button
                              key={`roster-page-${pageNum}`}
                              type="button"
                              onClick={() => {
                                setDashboardRosterPage(pageNum);
                                document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                              }}
                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#0A6B43] text-white shadow-xs font-black"
                                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-2xs"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={currentRosterProgramPage === totalRosterProgramPages}
                        onClick={() => {
                          setDashboardRosterPage(p => Math.min(totalRosterProgramPages, p + 1));
                          document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                        }}
                        className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* ============================================================ */}
              {/* TAB 5: Archived History (Closed/Concluded Programs & Trainees) */}
              {/* ============================================================ */}
              {dashboardTab === "archived" && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                        <Archive className="w-4 h-4 text-[#0A6B43]" />
                        Archived Training Programs & Graduated Trainees
                      </h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">
                        Historical repository of concluded and archived training terms. The active dashboard remains uncluttered while graduate records and audit trails remain safely preserved.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchArchivedData}
                      className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
                    >
                      Refresh Archive
                    </button>
                  </div>

                  {loadingArchived ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                      <div className="w-8 h-8 border-3 border-[#0A6B43] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-gray-500 font-bold">Loading archived records from database...</p>
                    </div>
                  ) : archivedProgramsList.length === 0 && archivedReferralsList.length === 0 ? (
                    <div className="w-full bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                        <Archive className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-extrabold text-gray-900">No Archived Programs or Enrollees</h4>
                        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                          When you archive a program or conclude a training term whose duration is done, it will be safely filed here and hidden from your active dashboard.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Archived Programs Grid */}
                      {archivedProgramsList.length > 0 && (
                        <div>
                          <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">
                            Concluded & Archived Programs ({archivedProgramsList.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {archivedProgramsList.map(prog => {
                              const programArchivedEnrollees = archivedReferralsList.filter(r => r.programTitle === prog.title || r.programId === prog.id);
                              return (
                                <div key={prog.id} className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all">
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md">
                                      Archived Term
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-500">
                                      {prog.trainingHours}h · {prog.cost}
                                    </span>
                                  </div>
                                  <h4 className="font-extrabold text-sm text-gray-900 mb-2">{prog.title}</h4>
                                  <div className="space-y-1 text-xs text-gray-500 mb-3">
                                    {prog.location && (
                                      <p className="truncate flex items-center gap-1 font-medium">
                                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span>{prog.location}</span>
                                      </p>
                                    )}
                                    {prog.endDate && (
                                      <p className="truncate flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                                        <span>Concluded on: {formatProgramDate(prog.endDate)}</span>
                                      </p>
                                    )}
                                  </div>
                                  <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-xs">
                                    <span className="text-gray-500 font-medium">Archived Enrollees</span>
                                    <span className="font-bold text-gray-900 bg-emerald-50 text-[#0A6B43] px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                                      {programArchivedEnrollees.length} Trainees
                                    </span>
                                  </div>

                                  {/* Card Action Buttons */}
                                  <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingProgram(prog);
                                        setIsEditingInModal(false);
                                      }}
                                      className="py-1.5 px-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] border border-gray-200 hover:border-emerald-200 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Details
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setProgramToRestore(prog)}
                                      disabled={isRestoringProgram || restoringProgramId === prog.id}
                                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] disabled:opacity-50"
                                      title="Restore program to active catalog"
                                    >
                                      {restoringProgramId === prog.id ? (
                                        <>
                                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          <span>Restoring...</span>
                                        </>
                                      ) : (
                                        <>
                                          <RotateCcw className="w-3.5 h-3.5" />
                                          <span>Restore</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Archived Enrollees Table */}
                      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-wider">
                            Archived Enrollees & Graduates Record ({archivedReferralsList.length})
                          </h4>
                        </div>
                        {archivedReferralsList.length === 0 ? (
                          <div className="p-8 text-center text-xs text-gray-400 font-medium">
                            No student records currently marked as archived.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-50/70 text-gray-500 font-bold text-[11px] uppercase tracking-wider border-b border-gray-200">
                                  <th className="py-3 px-4">Candidate Name</th>
                                  <th className="py-3 px-4">Barangay & Purok</th>
                                  <th className="py-3 px-4">Archived Program</th>
                                  <th className="py-3 px-4">Match Score</th>
                                  <th className="py-3 px-4">Record Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {archivedReferralsList.map(item => (
                                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                                    <td className="py-3 px-4 font-bold text-gray-900">
                                      {item.youthName}
                                    </td>
                                    <td className="py-3 px-4 text-gray-600 font-medium">
                                      Purok {item.purok}, Brgy. {item.barangay}
                                    </td>
                                    <td className="py-3 px-4 font-medium text-gray-700">
                                      {item.programTitle}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {item.matchScore}% Match
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                        Archived
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: ALL PUBLISHED PROGRAMS (CATALOG) */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.PROGRAMS && (
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
                    Published Programs Catalog
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage and publish certified technical-vocational training programs for San Luis youths.
                  </p>
                </div>
              </div>

              {/* Programs Catalog Card Container */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3.5 sm:p-6 space-y-4 sm:space-y-5">
                {/* Top Row: Title, Counter Badge, and Action Buttons (Archived & Post New Program) */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight">
                      {viewingArchivedPrograms ? "Archived Training Programs" : "Active Training Programs"}
                    </h3>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border leading-none ${
                      viewingArchivedPrograms
                        ? "bg-gray-100 text-gray-700 border-gray-300"
                        : "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                    }`}>
                      {filteredProgramsList.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    {/* Post New Program Button */}
                    <button
                      type="button"
                      onClick={handleNewProgramClick}
                      className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Post New Program</span>
                    </button>

                    {/* Archive / Active Programs Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const next = !viewingArchivedPrograms;
                        setViewingArchivedPrograms(next);
                        if (next) fetchArchivedData();
                      }}
                      className={`px-4 py-2 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 ${
                        viewingArchivedPrograms
                          ? "bg-[#0A6B43] hover:bg-[#075332]"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                      title={viewingArchivedPrograms ? "Switch back to active programs" : "View archived program catalog"}
                    >
                      {viewingArchivedPrograms ? (
                        <>
                          <BookOpen className="w-4 h-4" />
                          <span>Active Programs</span>
                          {activePrograms.length > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
                              {activePrograms.length}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <Archive className="w-4 h-4" />
                          <span>Archive Programs</span>
                          {archivedProgramsList.length > 0 && (
                            <span className="ml-0.5 px-1.5 py-0.2 bg-white/20 text-white rounded-full text-[10px] font-bold">
                              {archivedProgramsList.length}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Second Row: Search & Filters Toolbar */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by program title, trainer, skills, or location..."
                      value={programSearchQuery}
                      onChange={(e) => setProgramSearchQuery(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-8 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                    {programSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProgramSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">
                    {/* 4 Filter Dropdowns (Symmetrical 2x2 Grid on Mobile, 4-in-a-row on Desktop) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                      <CustomSelect
                        value={programCategoryFilter}
                        onChange={(val) => setProgramCategoryFilter(val)}
                        options={[
                          { value: "All", label: "All Categories" },
                          ...tesdaCategoryOptions
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70 w-full min-w-0 sm:min-w-[145px]"
                        placeholder="All Categories"
                      />

                      <CustomSelect
                        value={programStatusFilter}
                        onChange={(val) => setProgramStatusFilter(val)}
                        options={[
                          { value: "All", label: "All Status" },
                          { value: "Active", label: "Active" },
                          { value: "Concluded", label: "Concluded" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70 w-full min-w-0 sm:min-w-[110px]"
                        placeholder="All Status"
                      />

                      <CustomSelect
                        value={programCostFilter}
                        onChange={(val) => setProgramCostFilter(val)}
                        options={[
                          { value: "All", label: "All Costs" },
                          { value: "Free", label: "Free / TWSP" },
                          { value: "Subsidized", label: "Subsidized" },
                          { value: "With Fee", label: "With Fee" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70 w-full min-w-0 sm:min-w-[110px]"
                        placeholder="All Costs"
                      />

                      <CustomSelect
                        value={programLevelFilter}
                        onChange={(val) => setProgramLevelFilter(val)}
                        options={[
                          { value: "All", label: "All Certifications" },
                          { value: "NC I", label: "NC I Programs" },
                          { value: "NC II", label: "NC II Programs" },
                          { value: "NC III", label: "NC III Programs" },
                          { value: "NC IV", label: "NC IV Programs" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70 w-full min-w-0 sm:min-w-[135px]"
                        placeholder="All Certifications"
                      />
                    </div>

                    {/* View Mode Switcher & Mobile Counter/Reset */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 pt-0.5 sm:pt-0">
                      {/* Mobile Indicator / Clear Filters Button */}
                      {(programSearchQuery || programLevelFilter !== "All" || programCategoryFilter !== "All" || programStatusFilter !== "All" || programCostFilter !== "All") ? (
                        <button
                          type="button"
                          onClick={() => {
                            setProgramSearchQuery("");
                            setProgramLevelFilter("All");
                            setProgramCategoryFilter("All");
                            setProgramStatusFilter("All");
                            setProgramCostFilter("All");
                          }}
                          className="sm:hidden text-[11px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset Filters</span>
                        </button>
                      ) : (
                        <div className="sm:hidden text-[11px] font-medium text-gray-500">
                          <span className="font-bold text-gray-800">{filteredProgramsList.length}</span> {filteredProgramsList.length === 1 ? "Program" : "Programs"}
                        </div>
                      )}

                      {/* Grid / Table Segmented Control */}
                      <div className="h-[38px] p-0.5 bg-gray-100/90 border border-gray-200/90 rounded-xl flex items-center gap-0.5 shrink-0 ml-auto sm:ml-0">
                        <button
                          type="button"
                          onClick={() => setProgramViewMode("grid")}
                          className={`h-full px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${programViewMode === "grid"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-200/50"
                            }`}
                          title="Grid Cards View"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11.5px] sm:text-[12px] font-semibold">Grid</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProgramViewMode("table")}
                          className={`h-full px-2.5 sm:px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${programViewMode === "table"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-200/50"
                            }`}
                          title="Table View"
                        >
                          <Table className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11.5px] sm:text-[12px] font-semibold">Table</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Programs Content (Empty State, Grid View, or Table View) */}
                {filteredProgramsList.length === 0 ? (
                  <div className="py-12 sm:py-16 px-4 text-center max-w-lg mx-auto space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                      <BookOpen className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight leading-snug">No Training Programs Found</h4>
                      <p className="text-[14px] text-gray-500 leading-relaxed font-normal max-w-md mx-auto">
                        Try adjusting your search terms or filter criteria, or publish a new training program listing.
                      </p>
                      {(programSearchQuery || programLevelFilter !== "All" || programCategoryFilter !== "All" || programStatusFilter !== "All" || programCostFilter !== "All") && (
                        <button
                          type="button"
                          onClick={() => {
                            setProgramSearchQuery("");
                            setProgramLevelFilter("All");
                            setProgramCategoryFilter("All");
                            setProgramStatusFilter("All");
                            setProgramCostFilter("All");
                          }}
                          className="mt-2 px-3.5 py-1.5 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </div>
                ) : programViewMode === "grid" ? (
                  /* Grid Cards View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 items-stretch">
                    {paginatedCatalogPrograms.map((prog) => {
                      const isEnded = isProgramEnded(prog) || isProgramDurationDone(prog);
                      const isFull = (prog.slotsRemaining || 0) <= 0;

                      return (
                        <div
                          key={prog.id}
                          className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-6 pb-3 sm:pb-3.5 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md flex flex-col h-full group"
                        >
                          <div className="flex-1 flex flex-col">
                            {/* Header: Title as header and category as subheader + Active/Inactive badge on same row */}
                            <div className="flex items-start justify-between gap-2.5 sm:gap-3 border-b border-gray-100 pb-2">
                              <div className="min-w-0 space-y-0.5">
                                <h3 className="font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors text-[15px] sm:text-base leading-snug tracking-tight line-clamp-2" title={prog.title}>
                                  {prog.title}
                                </h3>
                                <p className="text-xs text-gray-500 font-medium truncate">
                                  {getProgramCategory(prog)}
                                </p>
                              </div>

                              <span className={`text-[9.5px] sm:text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 tracking-wide ${
                                prog.activeStatus === "Closed"
                                  ? "bg-gray-100 text-gray-700 border-gray-300"
                                  : isEnded
                                    ? "bg-gray-100 text-gray-600 border-gray-300"
                                    : isFull
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                              }`}>
                                {prog.activeStatus === "Closed" ? "Archived" : isEnded ? "Inactive" : "Active"}
                              </span>
                            </div>

                            {/* Duration & Training Term: 2-column key-value block with micro-icons and flexible mobile sizing */}
                            <div className="py-2.5 flex flex-col justify-center">
                              <div className="grid grid-cols-[auto_1fr] sm:grid-cols-2 gap-2.5 sm:gap-3 items-center">
                                <div className="min-w-0 pr-2 border-r border-gray-100 sm:border-r-0 sm:pr-0">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-emerald-600/80 shrink-0" />
                                    <span>Duration</span>
                                  </span>
                                  <p className="text-xs sm:text-sm font-semibold sm:font-medium text-gray-800 sm:text-gray-700 mt-0.5 truncate">
                                    {prog.trainingHours ? `${prog.trainingHours} Hours` : "Flexible"}
                                  </p>
                                </div>
                                <div className="min-w-0 pl-1 sm:pl-0">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-emerald-600/80 shrink-0" />
                                    <span>Training Term</span>
                                  </span>
                                  <p className="text-xs sm:text-sm font-semibold sm:font-medium text-gray-800 sm:text-gray-700 mt-0.5 truncate" title={(prog.startDate || prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}>
                                    {(prog.startDate || prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Break line between Duration and Available Slots */}
                            <div className="border-t border-gray-100" />

                            {/* Available Slots Progress Bar */}
                            <div className="space-y-1.5 pt-2 pb-2">
                              <div className="flex justify-between items-center gap-2">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block shrink-0">Available Slots</span>
                                <span className={`text-[10px] font-extrabold uppercase tracking-wider truncate text-right ${prog.activeStatus === "Closed" || isEnded ? "text-gray-400" : isFull ? "text-red-600" : "text-gray-500"}`}>
                                  {prog.activeStatus === "Closed" ? "Archived Term" : isEnded ? "Concluded" : isFull ? "Slots Full" : `${prog.slotsRemaining} of ${prog.slotsTotal} open`}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${prog.activeStatus === "Closed" || isEnded ? "bg-gray-400" : isFull ? "bg-red-400" : "bg-[#0A6B43]"}`}
                                  style={{ width: prog.activeStatus === "Closed" || isEnded ? "100%" : `${Math.min(100, Math.max(0, ((prog.slotsTotal - prog.slotsRemaining) / (prog.slotsTotal || 1)) * 100))}%` }}
                                />
                              </div>
                            </div>

                            {/* Competencies / Skills Acquired - Absorbs variable vertical space */}
                            <div className="flex-1 flex flex-col justify-start min-h-[42px] sm:min-h-[46px] pt-2 pb-3">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                                Target Competencies
                              </span>
                              <div className="flex flex-wrap gap-1 sm:gap-1.5 items-center">
                                {prog.requiredSkills && prog.requiredSkills.length > 0 ? (
                                  <>
                                    {prog.requiredSkills.slice(0, 3).map((skill, sIdx) => (
                                      <span key={sIdx} className="text-[10px] sm:text-[11px] bg-slate-100 text-slate-700 font-semibold px-1.5 sm:px-2 py-0.5 rounded-md max-w-full truncate">
                                        {toTitleCase(skill)}
                                      </span>
                                    ))}
                                    {prog.requiredSkills.length > 3 && (
                                      <span className="text-[9.5px] sm:text-[10px] text-gray-400 font-bold self-center shrink-0">
                                        +{prog.requiredSkills.length - 3} more
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400 italic py-0.5">
                                    General Technical Skills
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: View Program Details on bottom right */}
                          <div className="pt-2.5 sm:pt-3 border-t border-gray-100 mt-auto flex justify-end items-center">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingProgram(prog);
                                setIsEditingInModal(false);
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 sm:py-0 sm:px-0 rounded-lg sm:rounded-none bg-emerald-50/70 sm:bg-transparent text-xs sm:text-[13px] font-bold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer shrink-0 group ml-auto active:scale-95"
                            >
                              <span>View Program Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead>
                          <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold whitespace-nowrap">
                            <th className="py-3 px-4 text-left">Program Title & Sector</th>
                            <th className="py-3 px-4 text-left">Duration</th>
                            <th className="py-3 px-4 text-left">Training Term</th>
                            <th className="py-3 px-4 text-left">Available Slots</th>
                            <th className="py-3 px-4 text-left">Target Competencies</th>
                            <th className="py-3 px-4 text-left">Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {paginatedCatalogPrograms.map((prog) => {
                            const isEnded = isProgramEnded(prog) || isProgramDurationDone(prog);
                            const isFull = (prog.slotsRemaining || 0) <= 0;

                            return (
                              <tr key={prog.id} className="hover:bg-emerald-50/30 transition-colors group">
                                <td className="py-3 px-4 max-w-[260px]">
                                  <div className="space-y-0.5">
                                    <span className="font-bold text-gray-900 group-hover:text-[#0A6B43] transition-colors line-clamp-1 block" title={prog.title}>
                                      {prog.title}
                                    </span>
                                    <p className="text-[11px] text-gray-500 font-medium truncate">
                                      {getProgramCategory(prog)}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap align-middle">
                                  <span className="font-medium text-gray-700 text-xs">
                                    {prog.trainingHours ? `${prog.trainingHours} Hours` : "Flexible"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap align-middle">
                                  <span className="font-medium text-gray-700 text-xs" title={(prog.startDate || prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}>
                                    {(prog.startDate || prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="space-y-1 min-w-[130px]">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className={`font-bold ${isEnded ? "text-gray-500" : isFull ? "text-red-600" : "text-gray-900"}`}>
                                        {isEnded ? "Concluded" : isFull ? "Slots Full" : `${prog.slotsRemaining} of ${prog.slotsTotal} open`}
                                      </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${isEnded ? "bg-gray-400" : isFull ? "bg-red-400" : "bg-[#0A6B43]"}`}
                                        style={{ width: isEnded ? "100%" : `${Math.min(100, Math.max(0, ((prog.slotsTotal - prog.slotsRemaining) / (prog.slotsTotal || 1)) * 100))}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 max-w-[200px]">
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {prog.requiredSkills && prog.requiredSkills.length > 0 ? (
                                      <>
                                        {prog.requiredSkills.slice(0, 2).map((skill, sIdx) => (
                                          <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.5 rounded">
                                            {toTitleCase(skill)}
                                          </span>
                                        ))}
                                        {prog.requiredSkills.length > 2 && (
                                          <span className="text-[10px] text-gray-400 font-bold">
                                            +{prog.requiredSkills.length - 2}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[11px] text-gray-400 italic">General Skills</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide ${
                                    prog.activeStatus === "Closed"
                                      ? "bg-gray-100 text-gray-700 border-gray-300"
                                      : isEnded
                                        ? "bg-gray-100 text-gray-600 border-gray-300"
                                        : isFull
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                  }`}>
                                    {prog.activeStatus === "Closed" ? "Archived" : isEnded ? "Inactive" : "Active"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingProgram(prog);
                                        setIsEditingInModal(false);
                                      }}
                                      className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer group"
                                      title="View Program Details"
                                    >
                                      <span>View Program Details</span>
                                      <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

                {/* Pagination Controls for Published Programs Catalog */}
                {totalProgramsCatalogPages > 1 && (
                  <div className="bg-white rounded-2xl border border-gray-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-gray-500 font-medium">
                      Showing <span className="font-bold text-gray-900">{(currentProgramsCatalogPage - 1) * PROGRAMS_CATALOG_PER_PAGE + 1}</span> to{" "}
                      <span className="font-bold text-gray-900">{Math.min(filteredProgramsList.length, currentProgramsCatalogPage * PROGRAMS_CATALOG_PER_PAGE)}</span> of{" "}
                      <span className="font-bold text-gray-900">{filteredProgramsList.length}</span> programs
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <button
                        type="button"
                        disabled={currentProgramsCatalogPage === 1}
                        onClick={() => {
                          setProgramsCatalogPage(p => Math.max(1, p - 1));
                          document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                        }}
                        className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Prev</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {getPaginationItems(currentProgramsCatalogPage, totalProgramsCatalogPages).map((item, idx) => {
                          if (item === "...") {
                            return (
                              <span key={`catalog-ellipsis-${idx}`} className="w-7 text-center text-xs text-gray-400 select-none">
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(item);
                          const isSelected = pageNum === currentProgramsCatalogPage;
                          return (
                            <button
                              key={`catalog-page-${pageNum}`}
                              type="button"
                              onClick={() => {
                                setProgramsCatalogPage(pageNum);
                                document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                              }}
                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#0A6B43] text-white shadow-xs font-black"
                                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-2xs"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={currentProgramsCatalogPage === totalProgramsCatalogPages}
                        onClick={() => {
                          setProgramsCatalogPage(p => Math.min(totalProgramsCatalogPages, p + 1));
                          document.querySelector("main")?.scrollTo({ top: 380, behavior: "smooth" });
                        }}
                        className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: ADD / EDIT PROGRAM (ORGANIZED 2-COL FORM) */}
          {/* ============================================================ */}
          {(currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM) && (
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
                    {editingProgramId ? "Modify Training Program" : "Post New Program"}
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Configure curriculum parameters, schedules, capacity, and candidate prerequisites for youth learners.
                  </p>
                </div>
              </div>

              {/* Back Button & Header */}
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentScreen(TESDAPartnerScreen.PROGRAMS)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-[#0A6B43] hover:border-emerald-300 font-bold text-xs bg-white border border-gray-200 px-3.5 py-2 rounded-xl transition-all shadow-2xs hover:shadow-xs cursor-pointer shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-500" />
                  <span>Back to Programs</span>
                </button>
              </div>

              {/* Form Layout: Expanded Form - Full width matching header banner and portal cards */}
              <div className="w-full">
                <div className="bg-white border border-gray-200/90 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 sm:p-8 lg:p-10">
                  <form onSubmit={handleAddProgramSubmit} className="space-y-6">

                    {/* Section 1: Program Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Basic Program Identity</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Program Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shielded Metal Arc Welding, Bread & Pastry Production"
                            value={progTitle}
                            onChange={(e) => setProgTitle(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Certification Level</label>
                          <CustomSelect
                            value={progLevel}
                            onChange={(val) => setProgLevel(val)}
                            options={[
                              { value: "NC I", label: "NC I" },
                              { value: "NC II", label: "NC II" },
                              { value: "NC III", label: "NC III" }
                            ]}
                            size="sm"
                            buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                            placeholder="Select Level"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-[#0A6B43] uppercase tracking-wider">Vocational Category *</label>
                          <CustomSelect
                            value={progCategoryId}
                            onChange={(val) => setProgCategoryId(val)}
                            options={CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))}
                            size="sm"
                            buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                            placeholder="Select Category"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Hours *</label>
                            {computedTrainingHours && (
                              <button
                                type="button"
                                onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                                className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Click to auto-apply computed hours"
                              >
                                <Zap className="w-3 h-3 text-emerald-600" />
                                <span>Auto: {computedTrainingHours.totalHours}h</span>
                              </button>
                            )}
                          </div>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="e.g. 160"
                            value={progTrainingHours}
                            onChange={(e) => setProgTrainingHours(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Slot Allocation *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="e.g. 25"
                            value={progSlots}
                            onChange={(e) => setProgSlots(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Cost Model</label>
                          <CustomSelect
                            value={progCost}
                            onChange={(val) => setProgCost(val as any)}
                            options={[
                              { value: "Free", label: "Free (TESDA Subsidized)" },
                              { value: "Subsidized", label: "Subsidized / Co-pay" },
                              { value: "With Fee", label: "Fee-based" }
                            ]}
                            size="sm"
                            buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                            placeholder="Select Cost"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Schedule & Venue */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Schedule, Facility & Trainer</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Venue / Location</label>
                          <input
                            type="text"
                            placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                            value={progLocation}
                            onChange={(e) => setProgLocation(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assigned Room / Facility</label>
                          <input
                            type="text"
                            placeholder="e.g. Workshop Room B-102, Computer Lab 1"
                            value={progRoom}
                            onChange={(e) => setProgRoom(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">Training Days</label>
                        <div className="flex flex-wrap gap-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                            <label key={day} className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-bold cursor-pointer transition-all ${progTrainingDays.includes(day)
                                ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-2xs"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                              }`}>
                              <input
                                type="checkbox"
                                checked={progTrainingDays.includes(day)}
                                onChange={(e) => {
                                  if (e.target.checked) setProgTrainingDays(prev => [...prev, day]);
                                  else setProgTrainingDays(prev => prev.filter(d => d !== day));
                                }}
                                className="hidden"
                              />
                              {day.substring(0, 3)}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Timeslot Configuration */}
                      <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Training Timeslot</label>
                          <span className="text-[10px] text-gray-400 font-medium">Select preset or set custom hours</span>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("morning")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "08:00" && progEndTime === "12:00"
                                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                          >
                            <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Morning (8 AM – 12 PM)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("afternoon")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "13:00" && progEndTime === "17:00"
                                ? "bg-blue-100 text-blue-900 border-blue-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                          >
                            <Sun className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Afternoon (1 PM – 5 PM)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("fullday")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "08:00" && progEndTime === "17:00"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                          >
                            <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Full Day (8 AM – 5 PM)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("evening")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "17:30" && progEndTime === "20:30"
                                ? "bg-purple-100 text-purple-900 border-purple-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                              }`}
                          >
                            <Moon className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>Evening (5:30 PM – 8:30 PM)</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SiKapTimePicker
                            label="Start Time"
                            badgeText="Training Start"
                            value={progStartTime}
                            onChange={(val) => setProgStartTime(val)}
                            placeholder="Select start time"
                          />

                          <SiKapTimePicker
                            label="End Time"
                            badgeText="Training End"
                            value={progEndTime}
                            onChange={(val) => setProgEndTime(val)}
                            placeholder="Select end time"
                          />
                        </div>

                        {/* Live Schedule Preview */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                            <div>
                              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Preview Display</p>
                              <p className="text-xs font-bold text-gray-900">
                                {formatTrainingDays(progTrainingDays)} · {formatProgramTimeslot(progStartTime, progEndTime).formattedRange}
                              </p>
                            </div>
                          </div>
                          {(() => {
                            const ts = formatProgramTimeslot(progStartTime, progEndTime);
                            return ts.sessionType !== "Custom" ? (
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${ts.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
                                  ts.sessionType === "Afternoon" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                    ts.sessionType === "Full Day" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                                      "bg-purple-100 text-purple-900 border border-purple-200"
                                }`}>
                                {ts.sessionType}
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <SiKapDatePicker
                          label="Start Date"
                          badgeText="Program Start"
                          value={progStartDate}
                          onChange={(val) => setProgStartDate(val)}
                          placeholder="Select start date"
                        />

                        <SiKapDatePicker
                          label="End Date"
                          badgeText="Program End"
                          value={progEndDate}
                          min={progStartDate || undefined}
                          onChange={(val) => setProgEndDate(val)}
                          placeholder="Select end date"
                        />

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Trainer / Instructor</label>
                          <input
                            type="text"
                            placeholder="e.g. Engr. Danilo Santos, TVET Trainer"
                            value={progInstructor}
                            onChange={(e) => setProgInstructor(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      {/* Auto-Calculated Duration Summary Card */}
                      {computedTrainingHours && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                              <Calculator className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
                                  Auto-Calculated Total: {computedTrainingHours.totalHours} Hours
                                </span>
                                <span className="text-[9px] bg-white text-[#0A6B43] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                                  {computedTrainingHours.dailyHours} hrs/day
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                                {computedTrainingHours.sessionCount} class days scheduled between {formatProgramDateRange(progStartDate, progEndDate)}
                                {computedTrainingHours.deductedLunch ? " (excl. 1h lunch)" : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${progTrainingHours === computedTrainingHours.totalHours
                                ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-xs"
                                : "bg-white hover:bg-emerald-100 text-[#0A6B43] border-emerald-300 shadow-2xs"
                              }`}
                          >
                            {progTrainingHours === computedTrainingHours.totalHours ? "✓ Applied" : "Apply to Hours"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Requirements & Contacts */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Admissions & Contact Info</h4>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Eligibility Criteria</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Open to registered Katipunan ng Kabataan Out-of-School Youth aged 15–30 residing in San Luis, Pampanga."
                          value={progEligibility}
                          onChange={(e) => setProgEligibility(e.target.value)}
                          className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Required Documents (comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Barangay Clearance, 2x2 ID Photo, Photocopy of Valid ID"
                            value={progRequiredDocuments}
                            onChange={(e) => setProgRequiredDocuments(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Target Prerequisite Skills</label>
                          <input
                            type="text"
                            placeholder="e.g. Basic Math, English comprehension, Willingness to learn"
                            value={progRequiredSkills}
                            onChange={(e) => setProgRequiredSkills(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Officer Contact Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Engr. Danilo Santos, TESDA Focal Person"
                            value={progContactName}
                            onChange={(e) => setProgContactName(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Official Phone Number</label>
                          <input
                            type="text"
                            placeholder="e.g. +63 917 123 4567 / (045) 900-1234"
                            value={progContactPhone}
                            onChange={(e) => setProgContactPhone(e.target.value)}
                            className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen(TESDAPartnerScreen.PROGRAMS)}
                        className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-7 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center"
                      >
                        {editingProgramId ? "Save Program Changes" : "Publish Training Program"}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 5: PARTNER PROFILE & NOTIFICATION SETTINGS */}
          {currentScreen === TESDAPartnerScreen.SETTINGS && (
            <div className="space-y-6">
              {/* Settings Header Banner with Circular Gradient Background & Botanical Plant Growth */}
              <SettingsHeaderBanner subtitle="Manage institutional TVET center credentials, representative details, system security, and notifications." />

              {/* 2-Column Settings Layout: Left Vertical Sidebar + Right Main Content Area */}
              <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
                {/* Left Vertical Sidebar Navigation */}
                <SettingsSidebarNav
                  tabs={[
                    { id: "profile", label: "Institution Profile", icon: Building2 },
                    { id: "security", label: "Security & Password", icon: Lock },
                    { id: "notifications", label: "Alerts & Notifications", icon: Bell },
                    { id: "badge", label: "TVET Accreditation Badge", icon: Award },
                  ]}
                  activeTab={profileActiveTab}
                  onTabChange={(tabId) => setProfileActiveTab(tabId as any)}
                />

                {/* Right Main Content Area */}
                <main className="flex-1 min-w-0 w-full">
                  <AnimatePresence mode="wait">
                  {/* TAB 1: INSTITUTION PROFILE */}
                  {profileActiveTab === "profile" && (
                    <motion.div
                      key="profile"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-6 w-full"
                    >
                      {/* Left Column: Institution Dossier Info or Active Edit Form */}
                      <div className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                      {!isEditingProfile ? (
                        /* Read-Only Dossier Mode */
                        <div className="space-y-6">
                          <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              <Building2 className="w-4.5 h-4.5 text-[#0A6B43]" />
                              Institution Profile Details
                            </h3>
                          </div>

                          {/* Section 1: Basic Information */}
                          <div className="space-y-3.5">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Training Institution Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                              <div className="space-y-0.5 sm:col-span-2">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Training Institution</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[16px] font-semibold text-gray-900 break-words leading-tight">{centerName}</p>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Accredited Representative</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[16px] font-semibold text-gray-900 leading-tight">{repName}</p>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Institutional Email</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[16px] font-semibold text-gray-900 break-words truncate leading-tight" title={repEmail}>
                                    {repEmail}
                                  </p>
                                </div>
                              </div>
                              <div className="space-y-0.5 sm:col-span-2">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Contact / Hotline</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[16px] font-semibold text-gray-900 leading-tight">{repPhone || "Not configured"}</p>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Institution Classification</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[15px] font-semibold text-gray-900 leading-tight">Public Vocational Institution (TESDA-Administered)</p>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Regional Jurisdiction</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[15px] font-semibold text-gray-900 leading-tight">District II, Pampanga · Region III Central Luzon</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Accreditation & Operating Status */}
                          <div className="space-y-3.5 pt-1">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Accreditation & Operating Status
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">UTPRAS Operating Status</span>
                                <div className="h-[42px] flex items-center">
                                  <span className="text-xs font-extrabold text-[#0A6B43] bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                                    ACTIVE & CERTIFIED
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-0.5">
                                <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Accreditation Code</span>
                                <div className="h-[42px] flex items-center">
                                  <p className="text-[16px] font-mono font-bold text-gray-900 leading-tight">UTPRAS-R03-PAM-2024</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bottom Action: Edit Details Button */}
                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(true)}
                              className="group/edit px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer bg-[#0A6B43] hover:bg-[#075332] active:scale-98"
                            >
                              <Edit className="w-4 h-4 transition-transform duration-200 group-hover/edit:rotate-12 group-hover/edit:scale-120" />
                              <span>Edit Details</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode Form */
                        <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
                          <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              <Edit className="w-4.5 h-4.5 text-[#0A6B43]" />
                              Edit Institution Details
                            </h3>
                          </div>

                          {/* Section 1: Basic Information */}
                          <div className="space-y-3.5">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Training Institution Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                              <div className="space-y-0.5 sm:col-span-2">
                                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Training Institution / Center Name *</label>
                                <input
                                  type="text"
                                  required
                                  value={centerName}
                                  onChange={(e) => setCenterName(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0A6B43] transition-all"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Accredited Focal Representative *</label>
                                <input
                                  type="text"
                                  required
                                  value={repName}
                                  onChange={(e) => setRepName(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0A6B43] transition-all"
                                />
                              </div>

                              <div className="space-y-0.5">
                                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Institutional Email *</label>
                                <input
                                  type="email"
                                  required
                                  value={repEmail}
                                  onChange={(e) => setRepEmail(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0A6B43] transition-all"
                                />
                              </div>

                              <div className="space-y-0.5 sm:col-span-2">
                                <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Official Contact / Landline</label>
                                <input
                                  type="text"
                                  value={repPhone}
                                  onChange={(e) => setRepPhone(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#0A6B43] transition-all"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Form Buttons */}
                          <div className="pt-2 flex justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              disabled={isSavingProfile}
                              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingProfile}
                              className="group/save px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer bg-[#0A6B43] hover:bg-[#075332] active:scale-98"
                            >
                              {isSavingProfile ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4 transition-transform duration-200 group-hover/save:scale-125 group-hover/save:rotate-6" />
                              )}
                              <span>Save Institution Details</span>
                            </button>
                          </div>
                        </form>
                      )}
                      </div>

                      {/* Right Column: TVET Authority & Institutional Profile */}
                      <div className="xl:col-span-5 space-y-4">
                        <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-sm space-y-4">
                          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                            <h4 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                              <Award className="w-4.5 h-4.5 text-[#0A6B43]" />
                              TVET Center Authority
                            </h4>
                            <span className="text-[11px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Verified TVET Focal
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-[#0A6B43] flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-emerald-200 overflow-hidden shrink-0">
                              {repName.charAt(0).toUpperCase() || "T"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-gray-900 text-base leading-tight truncate">{repName}</h4>
                              <p className="text-xs font-bold text-[#0A6B43] mt-0.5 truncate">{centerName}</p>
                              <p className="text-xs text-gray-500 font-medium mt-1 truncate">{repEmail}</p>
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                              <span className="text-gray-500 font-medium">Clearance Level</span>
                              <span className="font-bold text-gray-900">Institutional Partner (Tier 4)</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                              <span className="text-gray-500 font-medium">Active TVET Programs</span>
                              <span className="font-bold text-gray-900">
                                {programs.filter((p) => p.activeStatus === "Active" || p.activeStatus === "Full").length} Program(s)
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                              <span className="text-gray-500 font-medium">Enrolled Youth Trainees</span>
                              <span className="font-bold text-gray-900">
                                {referrals.filter((r) => r.status === "Enrolled").length} Trainee(s)
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                              <span className="text-gray-500 font-medium">Supervisory Office</span>
                              <span className="font-bold text-gray-900">TESDA Pampanga PO</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 text-xs">
                              <span className="text-gray-500 font-medium">Accreditation Code</span>
                              <span className="font-mono font-bold text-gray-700">UTPRAS-R03-PAM-2024</span>
                            </div>
                          </div>

                          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-[11px] text-gray-600 leading-relaxed font-medium">
                            <p className="font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Republic Act No. 7796 Mandate
                            </p>
                            Authorized under the Technical Education and Skills Development Act to evaluate youth program applications, administer competency training, and report graduation outcomes.
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <button
                              type="button"
                              disabled={isLoggingOut}
                              onClick={handleSignOut}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 bg-rose-50/50 hover:bg-rose-100 transition-all ${
                                isLoggingOut ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                              }`}
                            >
                              {isLoggingOut ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />
                                  <span>Signing out...</span>
                                </>
                              ) : (
                                <>
                                  <LogOut className="w-3.5 h-3.5" />
                                  <span>Sign Out of Institutional Portal</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: ACCOUNT SECURITY */}
                  {profileActiveTab === "security" && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full pb-6"
                    >
                      <div className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                          <div className="border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              <Lock className="w-4.5 h-4.5 text-[#0A6B43]" />
                              Account Security & Password
                            </h3>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Current Password *</label>
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
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">New Password *</label>
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
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Confirm New Password *</label>
                              {confirmPassword.length > 0 && (
                                <span className={`text-[11px] font-bold ${confirmPassword === newPassword ? "text-[#0A6B43]" : "text-rose-500"}`}>
                                  {confirmPassword === newPassword ? "Passwords match ✓" : "Passwords do not match"}
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type={showConfirmPass ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-type new password..."
                                className={`w-full px-3 py-2 pr-10 h-10 border rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                                  confirmPassword.length > 0 && confirmPassword !== newPassword ? "border-rose-300 bg-rose-50/20" : "border-gray-200"
                                }`}
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
                              disabled={isChangingPassword || newPassword.length < 6 || newPassword !== confirmPassword || !currentPassword}
                              className={`group/pwd px-5 py-2.5 h-10 text-white text-sm font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                isChangingPassword || newPassword.length < 6 || newPassword !== confirmPassword || !currentPassword
                                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                  : "bg-[#0A6B43] hover:bg-[#075332] active:scale-98"
                              }`}
                            >
                              {isChangingPassword ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                              ) : (
                                <Lock className="w-4 h-4 transition-transform duration-200 group-hover/pwd:rotate-12 group-hover/pwd:scale-115" />
                              )}
                              <span>Update Institutional Password</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Security Guide Companion Card */}
                      <div className="xl:col-span-5">
                        <SettingsSecurityGuideCard
                          newPassword={newPassword}
                          accountTypeLabel="TVET Partner Account"
                          accountNotice="Your account maintains access to municipal youth training enrollments and competency certification records. Ensure institutional credentials remain strictly confidential."
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: NOTIFICATIONS */}
                  {profileActiveTab === "notifications" && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full pb-6"
                    >
                      <div className="xl:col-span-7">
                        <NotificationSettingsCard
                          userRole="TESDA_PARTNER"
                          userEmail={currentUser?.email}
                          addToast={addToast}
                          className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6 animate-in fade-in duration-150"
                        />
                      </div>
                      <div className="xl:col-span-5 space-y-4">
                        <SettingsNotificationChannelsCard
                          pushDescription="Real-time push alerts for youth program applications, batch intake milestones, and municipal referral submissions."
                          emailDescription="Official endorsement packages, TVET compliance audits, and security authentication notices sent to your institutional address."
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: TVET ACCREDITATION BADGE */}
                  {profileActiveTab === "badge" && (
                    <motion.div
                      key="badge"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="space-y-6 w-full pb-6"
                    >
                      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
                        <div className="border-b border-gray-100 pb-3">
                          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                            <ShieldCheck className="w-4.5 h-4.5 text-[#0A6B43]" />
                            TVET Accreditation Badge
                          </h3>
                          <p className="text-sm text-gray-400 font-medium mt-0.5">
                            Official TESDA training institution accreditation credential for San Luis, Pampanga
                          </p>
                        </div>

                        {/* Digital Credential ID Card */}
                        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-700/40 bg-gradient-to-br from-emerald-950 via-slate-900 to-[#0A3D27] text-white p-7 shadow-2xl max-w-xl mx-auto w-full">
                          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 left-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                          {/* Card Top Header */}
                          <div className="flex items-center justify-between pb-5 border-b border-emerald-800/60 relative z-10">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-amber-400">
                                <Award className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Republic of the Philippines</p>
                                <p className="text-xs font-extrabold tracking-wide text-white">TESDA TVET Training Partner</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              Official Partner
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-black text-3xl shadow-lg border-2 border-white/30 shrink-0">
                              {repName.charAt(0).toUpperCase() || "T"}
                            </div>
                            <div className="text-center sm:text-left space-y-1">
                              <h4 className="text-lg font-black text-white tracking-tight">{repName}</h4>
                              <p className="text-xs font-semibold text-emerald-200">{centerName}</p>
                              <p className="text-[11px] text-slate-300 font-mono pt-1">
                                Provincial Office: Pampanga · Region III
                              </p>
                              <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-mono text-emerald-300">
                                <span>REG-ID:</span>
                                <span className="font-bold">{currentUser?.id?.slice(0, 12) || "TESDA-R03-GPSAT-01"}</span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="pt-4 border-t border-emerald-800/60 flex items-center justify-between text-[10px] text-slate-300 relative z-10">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>UTPRAS Verified & Active</span>
                            </div>
                            <span className="font-mono text-slate-400">RA 7796 Accredited</span>
                          </div>
                        </div>

                        {/* Copy Credential Button */}
                        <div className="flex justify-end pt-3 w-full">
                          <button
                            type="button"
                            onClick={() => {
                              const info = `TESDA TVET PARTNER CREDENTIAL\nRepresentative: ${repName}\nInstitution: ${centerName}\nEmail: ${repEmail}\nContact: ${repPhone}\nPartner ID: ${currentUser?.id || "TESDA-R03-GPSAT-01"}\nUTPRAS Status: Active\nAccreditation Code: UTPRAS-R03-PAM-2024`;
                              navigator.clipboard.writeText(info);
                              addToast("TVET Institution Credential copied to clipboard!", "success");
                            }}
                            className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-[14px] font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                          >
                            <Copy className="w-4 h-4 text-[#0A6B43]" />
                            Copy Credential Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                </main>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================ */}
      {/* APPLICANT PROFILE DOSSIER MODAL */}
      {/* ============================================================ */}
      {selectedApplicant && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApplicant(null);
          }}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200 ease-out">

            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-[#112F24] to-[#1A4234] text-white p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-xl shadow-sm uppercase">
                  {selectedApplicant.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight leading-tight">{selectedApplicant.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-200/90 mt-0.5">
                    <span>{selectedApplicant.age} yrs old</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      Purok {selectedApplicant.purok}, Brgy. {selectedApplicant.barangay}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-center">
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-300 block">AI Match</span>
                  <span className="text-base font-black text-white">{selectedApplicant.matchScore || 85}%</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApplicant(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[65vh]">

              {/* 2-Column Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Column 1: Contact & Education */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                    Residency & Contact
                  </h5>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Contact Number</p>
                        <p className="font-bold text-gray-800">{selectedApplicant.contactNumber || "N/A"}</p>
                      </div>
                    </div>

                    {selectedApplicant.email && (
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Email Address</p>
                          <p className="font-bold text-gray-800">{selectedApplicant.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Educational Attainment</p>
                        <p className="font-bold text-gray-800">{selectedApplicant.educationalAttainment}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Status Category</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-[#0A6B43] border border-emerald-200 font-bold text-[10px]">
                          Out-of-School Youth (OSY)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Skills & Career Path */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                    Skills & Competencies
                  </h5>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Declared Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.skills && selectedApplicant.skills.length > 0 ? (
                          selectedApplicant.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">No skills registered</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider mb-1.5">Aspirational Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.interests && selectedApplicant.interests.length > 0 ? (
                          selectedApplicant.interests.map((i, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                              {i}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">No interests declared</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-150">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Career & Livelihood Goal</p>
                      <p className="text-xs text-gray-700 italic font-medium">
                        "{selectedApplicant.livelihoodGoal || "Seeking technical training and livelihood certification."}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50/80 border-t border-gray-100 p-4 px-6 flex items-center justify-between gap-3 shrink-0">
              <div>
                {(() => {
                  const activeRef = referrals.find(
                    r => (selectedApplicantReferral && r.id === selectedApplicantReferral.id) || r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()
                  );
                  if (!activeRef) return null;
                  return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${activeRef.status === "Enrolled"
                        ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                        : activeRef.status === "Pending"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-red-50 text-red-800 border-red-200"
                      }`}>
                      Current Status: {activeRef.status}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                {(() => {
                  const activeRef = referrals.find(
                    r => ((selectedApplicantReferral && r.id === selectedApplicantReferral.id) || r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()) && r.status === "Pending"
                  );
                  if (!activeRef) return null;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateReferralStatus(activeRef.id, "Declined");
                          setSelectedApplicant(null);
                        }}
                        className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdateReferralStatus(activeRef.id, "Enrolled");
                          setSelectedApplicant(null);
                        }}
                        className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Accept & Enroll
                      </button>
                    </>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PROGRAM SYLLABUS & DETAILS MODAL (VIEW & INLINE EDIT) */}
      {/* ============================================================ */}
      {viewingProgram && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingProgram(null);
              setIsEditingInModal(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl sm:max-w-4xl relative z-10 flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 ease-out">

            {/* Header (Optimized for Mobile & Desktop) */}
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/70 shrink-0 space-y-2">
              {/* Top Row: Category & Status Badges (Left) + Close Button (Right) */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-[#0A6B43] border border-emerald-200 truncate">
                    {getProgramCategory(viewingProgram)}
                  </span>
                  {viewingProgram.activeStatus === "Closed" && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100/80 text-amber-800 border border-amber-200">
                      Archived Catalog
                    </span>
                  )}
                  {(() => {
                    const isEnded = isProgramEnded(viewingProgram) || isProgramDurationDone(viewingProgram);
                    const isFull = (viewingProgram.slotsRemaining || 0) <= 0;

                    if (isEditingInModal) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide bg-amber-50 text-amber-800 border-amber-300 shadow-2xs">
                          <Pencil className="w-2.5 h-2.5 text-amber-600" />
                          <span>Edit Mode</span>
                        </span>
                      );
                    }

                    if (viewingProgram.activeStatus === "Closed") {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide bg-amber-50 text-amber-900 border-amber-300 shadow-2xs">
                          <Archive className="w-2.5 h-2.5 text-amber-700" />
                          <span>Archived Term</span>
                        </span>
                      );
                    }

                    if (isEnded) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide bg-gray-100 text-gray-700 border-gray-300">
                          <Clock className="w-2.5 h-2.5 text-gray-500" />
                          <span>Inactive Term</span>
                        </span>
                      );
                    }

                    if (isFull) {
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide bg-amber-50 text-amber-800 border-amber-200">
                          <Users className="w-2.5 h-2.5 text-amber-600" />
                          <span>Slots Full</span>
                        </span>
                      );
                    }

                    return (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border shrink-0 tracking-wide bg-emerald-50 text-[#0A6B43] border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A6B43] animate-pulse" />
                        <span>Active Program</span>
                      </span>
                    );
                  })()}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setViewingProgram(null);
                    setIsEditingInModal(false);
                  }}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title: Full width on both mobile and desktop */}
              <h3 className="text-base sm:text-xl font-black text-gray-950 leading-snug tracking-tight">
                {viewingProgram.title}
              </h3>
            </div>

            {/* Archived Program Informational Banner (Mobile Responsive) */}
            {viewingProgram.activeStatus === "Closed" && !isEditingInModal && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/80 to-emerald-50/50 border-b border-amber-200/80 p-3.5 sm:px-6 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs shrink-0">
                <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 shadow-2xs mt-0.5 sm:mt-0">
                    <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-amber-950 text-xs">Archived Training Program Record</p>
                    <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
                      This program term has concluded and is preserved in historical archive. You can restore this program to the active catalog at any time.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProgramToRestore(viewingProgram)}
                  disabled={isRestoringProgram || restoringProgramId === viewingProgram.id}
                  className="w-full sm:w-auto px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                  title="Restore program to active training catalog"
                >
                  {restoringProgramId === viewingProgram.id ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Program</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Modal Body: Scrollable Information Grid */}
            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-xs">

              {/* Key Overview Stat Cards (View Mode - 2 cols on mobile, 4 on desktop) */}
              {!isEditingInModal && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                      <Award className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/70 block leading-tight">Certification</span>
                      <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate mt-0.5">
                        {(() => {
                          const match = viewingProgram.title?.match(/(NC\s+I|NC\s+II|NC\s+III)$/i);
                          return match ? match[1].toUpperCase() : (viewingProgram.type || "NC II");
                        })()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50/70 border border-blue-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                      <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-blue-800/70 block leading-tight">Duration</span>
                      <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate mt-0.5">
                        {viewingProgram.trainingHours ? `${viewingProgram.trainingHours} Hours` : "Flexible"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50/70 border border-purple-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200">
                      <Users className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-purple-800/70 block leading-tight">Slot Capacity</span>
                      <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate mt-0.5">
                        {viewingProgram.slotsRemaining} of {viewingProgram.slotsTotal} open
                      </p>
                    </div>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                      <ShieldCheck className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-amber-800/70 block leading-tight">Tuition Model</span>
                      <p className="text-xs sm:text-sm font-extrabold text-gray-900 truncate mt-0.5">
                        {viewingProgram.cost === "Free" || !viewingProgram.cost ? "Free (Subsidized)" : viewingProgram.cost}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 1: Basic Program Identity & Curriculum */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                    <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[14px] font-extrabold text-gray-900 tracking-tight">
                      Curriculum & Program Identity
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate sm:whitespace-normal">
                      Core TVET qualification specifications and instructional allotment.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Program Title */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Program Title
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        value={modalEditTitle}
                        onChange={(e) => setModalEditTitle(e.target.value)}
                        placeholder="e.g. Shielded Metal Arc Welding"
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {viewingProgram.title || "—"}
                      </p>
                    )}
                  </div>

                  {/* Certification Level */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Certification Level
                    </span>
                    {isEditingInModal ? (
                      <CustomSelect
                        value={modalEditLevel}
                        onChange={(val) => setModalEditLevel(val)}
                        options={[
                          { value: "NC I", label: "NC I" },
                          { value: "NC II", label: "NC II" },
                          { value: "NC III", label: "NC III" }
                        ]}
                        size="sm"
                        buttonClassName="h-[36px] sm:h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Level"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase bg-emerald-50 text-[#0A6B43] border border-emerald-200">
                          {(() => {
                            const match = viewingProgram.title?.match(/(NC\s+I|NC\s+II|NC\s+III)$/i);
                            return match ? match[1].toUpperCase() : (viewingProgram.type || "NC II");
                          })()}
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-500 font-medium">National Certificate</span>
                      </div>
                    )}
                  </div>

                  {/* Vocational Category */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Vocational Sector
                    </span>
                    {isEditingInModal ? (
                      <CustomSelect
                        value={modalEditCategoryId}
                        onChange={(val) => setModalEditCategoryId(val)}
                        options={CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))}
                        size="sm"
                        buttonClassName="h-[36px] sm:h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Category"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {getProgramCategory(viewingProgram)}
                      </p>
                    )}
                  </div>

                  {/* Training Duration (Hours) */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                        Training Duration
                      </span>
                      {isEditingInModal && computedModalTrainingHours && (
                        <button
                          type="button"
                          onClick={() => setModalEditTrainingHours(computedModalTrainingHours.totalHours)}
                          className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                          title="Apply auto-computed duration"
                        >
                          <Zap className="w-3 h-3 text-emerald-600" />
                          <span>Auto: {computedModalTrainingHours.totalHours}h</span>
                        </button>
                      )}
                    </div>
                    {isEditingInModal ? (
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 160"
                        value={modalEditTrainingHours}
                        onChange={(e) => setModalEditTrainingHours(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {viewingProgram.trainingHours ? `${viewingProgram.trainingHours} Hours Total Curriculum` : "Flexible Duration"}
                      </p>
                    )}
                  </div>

                  {/* Capacity / Slots */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Slot Allocation & Availability
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 25"
                        value={modalEditSlotsTotal}
                        onChange={(e) => setModalEditSlotsTotal(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                          {viewingProgram.slotsRemaining} available / {viewingProgram.slotsTotal} capacity
                        </p>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              viewingProgram.activeStatus === "Closed"
                                ? "bg-gray-400"
                                : (viewingProgram.slotsRemaining || 0) <= 0
                                  ? "bg-red-400"
                                  : "bg-[#0A6B43]"
                            }`}
                            style={{
                              width: viewingProgram.activeStatus === "Closed"
                                ? "100%"
                                : `${Math.min(100, Math.max(0, ((viewingProgram.slotsTotal - viewingProgram.slotsRemaining) / (viewingProgram.slotsTotal || 1)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cost Model */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Tuition & Funding Model
                    </span>
                    {isEditingInModal ? (
                      <CustomSelect
                        value={modalEditCost}
                        onChange={(val) => setModalEditCost(val as any)}
                        options={[
                          { value: "Free", label: "Free (TESDA Subsidized)" },
                          { value: "Subsidized", label: "Subsidized / Co-pay" },
                          { value: "With Fee", label: "Fee-based" }
                        ]}
                        size="sm"
                        buttonClassName="h-[36px] sm:h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Cost"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {viewingProgram.cost === "Free" || !viewingProgram.cost ? "Free (TESDA Subsidized / TWSP)" : viewingProgram.cost}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Facility, Schedule & Trainer */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[14px] font-extrabold text-gray-900 tracking-tight">
                      Schedule, Facility & Trainer
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate sm:whitespace-normal">
                      Training premises, instructional calendar, and assigned instructors.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Venue / Location */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Training Venue / Location
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                        value={modalEditLocation}
                        onChange={(e) => setModalEditLocation(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{viewingProgram.location || "San Luis Training Center"}</span>
                      </p>
                    )}
                  </div>

                  {/* Room / Facility */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Assigned Room / Facility
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. Workshop Room B-102"
                        value={modalEditRoom}
                        onChange={(e) => setModalEditRoom(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{viewingProgram.room || "Main Workshop Area"}</span>
                      </p>
                    )}
                  </div>

                  {/* Trainer / Instructor */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Assigned Trainer / Instructor
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TVET Trainer"
                        value={modalEditInstructor}
                        onChange={(e) => setModalEditInstructor(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{viewingProgram.instructor || "Assigned TESDA Trainer"}</span>
                      </p>
                    )}
                  </div>

                  {/* Training Days */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Training Days
                    </span>
                    {isEditingInModal ? (
                      <div className="flex flex-wrap gap-1 pt-0.5 min-h-[36px] items-center">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                          <label
                            key={day}
                            className={`flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              modalEditTrainingDays.includes(day)
                                ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-2xs"
                                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={modalEditTrainingDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) setModalEditTrainingDays(prev => [...prev, day]);
                                else setModalEditTrainingDays(prev => prev.filter(d => d !== day));
                              }}
                              className="hidden"
                            />
                            {day.substring(0, 3)}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 pt-0.5 items-center">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((shortDay, dIdx) => {
                          const isProgramDay = (viewingProgram.trainingDays || []).some(
                            (d: string) => d.toLowerCase().startsWith(shortDay.toLowerCase())
                          );
                          return (
                            <span
                              key={dIdx}
                              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${
                                isProgramDay
                                  ? "bg-[#0A6B43] text-white"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {shortDay}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Program Term Start Date */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Program Term Start Date
                    </span>
                    {isEditingInModal ? (
                      <SiKapDatePicker
                        label="Start Date"
                        badgeText="Term Start"
                        value={modalEditStartDate}
                        onChange={(val) => setModalEditStartDate(val)}
                        placeholder="Select start date"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {formatProgramDate(viewingProgram.startDate) || "TBD"}
                      </p>
                    )}
                  </div>

                  {/* Program Term End Date */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Program Term End Date
                    </span>
                    {isEditingInModal ? (
                      <SiKapDatePicker
                        label="End Date"
                        badgeText="Term End"
                        value={modalEditEndDate}
                        min={modalEditStartDate || undefined}
                        onChange={(val) => setModalEditEndDate(val)}
                        placeholder="Select end date"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {formatProgramDate(viewingProgram.endDate) || "TBD"}
                      </p>
                    )}
                  </div>

                  {/* Timeslot & Session */}
                  <div className="space-y-0.5 sm:space-y-1 sm:col-span-2 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Training Timeslot & Session
                    </span>
                    {isEditingInModal ? (
                      <div className="space-y-2.5 bg-gray-50/70 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-gray-200/80 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">Timeslot Presets</span>
                          <span className="text-[9px] text-gray-400 font-medium">Click to apply</span>
                        </div>
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1 sm:gap-1.5">
                          <button
                            type="button"
                            onClick={() => applyModalTimeslotPreset("morning")}
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              modalEditStartTime === "08:00" && modalEditEndTime === "12:00"
                                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Morning (8–12)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyModalTimeslotPreset("afternoon")}
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              modalEditStartTime === "13:00" && modalEditEndTime === "17:00"
                                ? "bg-blue-100 text-blue-900 border-blue-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <Sun className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>Afternoon (1–5)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyModalTimeslotPreset("fullday")}
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              modalEditStartTime === "08:00" && modalEditEndTime === "17:00"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Full Day (8–5)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applyModalTimeslotPreset("evening")}
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              modalEditStartTime === "17:30" && modalEditEndTime === "20:30"
                                ? "bg-purple-100 text-purple-900 border-purple-300 shadow-2xs"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <Moon className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>Evening (5:30–8:30)</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          <SiKapTimePicker
                            label="Start Time"
                            badgeText="Training Start"
                            value={modalEditStartTime}
                            onChange={(val) => setModalEditStartTime(val)}
                            placeholder="Select start time"
                          />
                          <SiKapTimePicker
                            label="End Time"
                            badgeText="Training End"
                            value={modalEditEndTime}
                            onChange={(val) => setModalEditEndTime(val)}
                            placeholder="Select end time"
                          />
                        </div>
                      </div>
                    ) : (
                      (() => {
                        const ts = formatProgramTimeslot(viewingProgram.startTime, viewingProgram.endTime);
                        return (
                          <div className="min-h-[30px] sm:min-h-[34px] flex items-center gap-2 flex-wrap">
                            <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">{ts.formattedRange}</p>
                            {ts.sessionType !== "Custom" && (
                              <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                ts.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
                                ts.sessionType === "Afternoon" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                ts.sessionType === "Full Day" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                                "bg-purple-100 text-purple-900 border border-purple-200"
                              }`}>
                                {ts.sessionType}
                              </span>
                            )}
                          </div>
                        );
                      })()
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Admissions, Prerequisites & Contacts */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[14px] font-extrabold text-gray-900 tracking-tight">
                      Admissions, Prerequisites & Contacts
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate sm:whitespace-normal">
                      Candidate entry criteria, paperwork verification, and focal officer contacts.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                  {/* Eligibility Criteria */}
                  <div className="space-y-0.5 sm:space-y-1 sm:col-span-2 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Eligibility Criteria
                    </span>
                    {isEditingInModal ? (
                      <textarea
                        rows={2}
                        placeholder="e.g. Open to registered Katipunan ng Kabataan Out-of-School Youth residing in San Luis, Pampanga."
                        value={modalEditEligibility}
                        onChange={(e) => setModalEditEligibility(e.target.value)}
                        className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-start gap-2 sm:gap-2.5">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                        <p className="text-[11px] sm:text-xs text-gray-800 leading-relaxed font-medium">
                          {viewingProgram.eligibility || "Open to registered Katipunan ng Kabataan Out-of-School Youth residing in San Luis, Pampanga."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Required Documents */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Required Submission Documents
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. Barangay Clearance, 2x2 ID Photo, Valid ID"
                        value={modalEditRequiredDocuments}
                        onChange={(e) => setModalEditRequiredDocuments(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                        {viewingProgram.requiredDocuments && viewingProgram.requiredDocuments.length > 0 ? (
                          viewingProgram.requiredDocuments.map((doc, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-800 font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] border border-gray-200 flex items-center gap-1">
                              <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500 shrink-0" />
                              <span>{doc}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Barangay Certificate, Valid ID, 2x2 Photo</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Prerequisite Skills */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Target Prerequisite Skills
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. Basic Math, English comprehension"
                        value={modalEditRequiredSkills}
                        onChange={(e) => setModalEditRequiredSkills(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                        {viewingProgram.requiredSkills && viewingProgram.requiredSkills.length > 0 ? (
                          viewingProgram.requiredSkills.map((sk, idx) => (
                            <span key={idx} className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-600 shrink-0" />
                              <span>{toTitleCase(sk)}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] sm:text-xs text-gray-500 font-medium">Basic Literacy, Junior High School Graduate</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Focal Officer / Contact Person */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Officer Contact Person
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TESDA Focal Person"
                        value={modalEditContactName}
                        onChange={(e) => setModalEditContactName(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{viewingProgram.contactPerson || "TESDA Focal Person"}</span>
                      </p>
                    )}
                  </div>

                  {/* Official Phone Number */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Official Phone Number
                    </span>
                    {isEditingInModal ? (
                      <input
                        type="text"
                        placeholder="e.g. +63 917 123 4567"
                        value={modalEditContactPhone}
                        onChange={(e) => setModalEditContactPhone(e.target.value)}
                        className="w-full h-[36px] sm:h-[38px] px-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{viewingProgram.contactNumber || "+63 917 123 4567"}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer with Archive, Restore, Delete, Edit and Close (Mobile & Desktop Optimized) */}
            <div className="p-3.5 sm:p-5 border-t border-gray-100 bg-gray-50/80 shrink-0">
              {isEditingInModal ? (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-gray-600">Editing Program Details</span>
                  </div>

                  <div className="grid grid-cols-2 sm:flex sm:items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingInModal(false)}
                      disabled={isSavingModal}
                      className="w-full sm:w-auto h-[38px] sm:h-auto px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveModalEdits}
                      disabled={isSavingModal}
                      className="w-full sm:w-auto h-[38px] sm:h-auto px-5 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 text-center"
                    >
                      {isSavingModal ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* MOBILE ACTION BUTTONS (Clean 2-Row Grid for Phones) */}
                  <div className="sm:hidden space-y-2">
                    {/* Row 1: Primary Action (Restore or Archive) + Edit Program */}
                    <div className="grid grid-cols-2 gap-2">
                      {viewingProgram.activeStatus === "Closed" ? (
                        <button
                          type="button"
                          onClick={() => setProgramToRestore(viewingProgram)}
                          disabled={isRestoringProgram || restoringProgramId === viewingProgram.id}
                          className="h-[40px] px-3 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-2xs"
                          title="Restore this archived program to active catalog"
                        >
                          {restoringProgramId === viewingProgram.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                              <span>Restoring...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                              <span>Restore Program</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProgramToArchive(viewingProgram)}
                          disabled={isArchivingProgram || archivingProgramId === viewingProgram.id}
                          className="h-[40px] px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-2xs"
                          title="Conclude term and move to Archived Programs"
                        >
                          {archivingProgramId === viewingProgram.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                              <span>Archiving...</span>
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5 shrink-0" />
                              <span>Archive Term</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => startEditingInModal(viewingProgram)}
                        className="h-[40px] px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border border-gray-200"
                      >
                        <Pencil className="w-3.5 h-3.5 shrink-0 text-gray-600" />
                        <span>Edit Program</span>
                      </button>
                    </div>

                    {/* Row 2: Delete Program + Close Modal */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setProgramToDelete(viewingProgram)}
                        disabled={isDeletingProgram || deletingProgramId === viewingProgram.id}
                        className="h-[38px] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                        title="Permanently remove program from system"
                      >
                        {deletingProgramId === viewingProgram.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 shrink-0 text-red-600" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewingProgram(null);
                          setIsEditingInModal(false);
                        }}
                        className="h-[38px] px-3 border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  {/* DESKTOP ACTION BUTTONS (Tablets & Desktops >= sm) */}
                  <div className="hidden sm:flex sm:items-center sm:justify-between gap-3">
                    {/* Left: Destructive & Archival / Restore actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {viewingProgram.activeStatus === "Closed" ? (
                        <button
                          type="button"
                          onClick={() => setProgramToRestore(viewingProgram)}
                          disabled={isRestoringProgram || restoringProgramId === viewingProgram.id}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          title="Restore this archived program to active catalog"
                        >
                          {restoringProgramId === viewingProgram.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Restoring Program...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore Program</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setProgramToArchive(viewingProgram)}
                          disabled={isArchivingProgram || archivingProgramId === viewingProgram.id}
                          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                          title="Conclude term and move to Archived Programs"
                        >
                          {archivingProgramId === viewingProgram.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Archiving Program...</span>
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5" />
                              <span>Archive Program</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setProgramToDelete(viewingProgram)}
                        disabled={isDeletingProgram || deletingProgramId === viewingProgram.id}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                        title="Permanently remove program from system"
                      >
                        {deletingProgramId === viewingProgram.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Deleting Program...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Program</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right: Close and Edit */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingProgram(null);
                          setIsEditingInModal(false);
                        }}
                        className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditingInModal(viewingProgram)}
                        className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Program</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POPUP MODAL: EDIT TRAINING PROGRAM (STAYS ON CURRENT TAB) */}
      {/* ============================================================ */}
      {editingProgramModal && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingProgramModal(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200 ease-out my-6">

            {/* Modal Header */}
            <div className="p-6 border-b border-emerald-900/40 bg-gradient-to-r from-[#112F24] to-[#1A4234] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Edit Training Program
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium truncate max-w-md">
                    {editingProgramModal.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProgramModal(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Form */}
            <div className="p-6 overflow-y-auto space-y-6">
              <form id="edit-program-modal-form" onSubmit={handleEditModalSubmit} className="space-y-6">

                {/* Section 1: Program Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Basic Program Identity</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Program Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shielded Metal Arc Welding, Bread & Pastry Production"
                        value={progTitle}
                        onChange={(e) => setProgTitle(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Certification Level</label>
                      <CustomSelect
                        value={progLevel}
                        onChange={(val) => setProgLevel(val)}
                        options={[
                          { value: "NC I", label: "NC I" },
                          { value: "NC II", label: "NC II" },
                          { value: "NC III", label: "NC III" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Level"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-[#0A6B43] uppercase tracking-wider">Vocational Category *</label>
                      <CustomSelect
                        value={progCategoryId}
                        onChange={(val) => setProgCategoryId(val)}
                        options={CATEGORIES.map(cat => ({ value: cat.id, label: cat.name }))}
                        size="sm"
                        buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Category"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Hours *</label>
                        {computedTrainingHours && (
                          <button
                            type="button"
                            onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                            className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Click to auto-apply computed hours"
                          >
                            <Zap className="w-3 h-3 text-emerald-600" />
                            <span>Auto: {computedTrainingHours.totalHours}h</span>
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 160"
                        value={progTrainingHours}
                        onChange={(e) => setProgTrainingHours(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Slot Allocation *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 25"
                        value={progSlots}
                        onChange={(e) => setProgSlots(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Cost Model</label>
                      <CustomSelect
                        value={progCost}
                        onChange={(val) => setProgCost(val as any)}
                        options={[
                          { value: "Free", label: "Free (TESDA Subsidized)" },
                          { value: "Subsidized", label: "Subsidized / Co-pay" },
                          { value: "With Fee", label: "Fee-based" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Cost"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Schedule & Venue */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Schedule, Facility & Trainer</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Training Venue / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                        value={progLocation}
                        onChange={(e) => setProgLocation(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Assigned Room / Facility</label>
                      <input
                        type="text"
                        placeholder="e.g. Workshop Room B-102, Computer Lab 1"
                        value={progRoom}
                        onChange={(e) => setProgRoom(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">Training Days</label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <label key={day} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold cursor-pointer transition-all ${progTrainingDays.includes(day)
                            ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-2xs"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}>
                          <input
                            type="checkbox"
                            checked={progTrainingDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) setProgTrainingDays(prev => [...prev, day]);
                              else setProgTrainingDays(prev => prev.filter(d => d !== day));
                            }}
                            className="hidden"
                          />
                          {day.substring(0, 3)}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Timeslot Configuration */}
                  <div className="space-y-3 bg-gray-50/70 p-3.5 rounded-2xl border border-gray-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">Training Timeslot</label>
                      <span className="text-[10px] text-gray-400 font-medium">Select preset or set custom hours</span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("morning")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "08:00" && progEndTime === "12:00"
                            ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Sun className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Morning (8 AM – 12 PM)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("afternoon")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "13:00" && progEndTime === "17:00"
                            ? "bg-blue-100 text-blue-900 border-blue-300 shadow-2xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Sun className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Afternoon (1 PM – 5 PM)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("fullday")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "08:00" && progEndTime === "17:00"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Full Day (8 AM – 5 PM)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("evening")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all flex items-center gap-1 ${progStartTime === "17:30" && progEndTime === "20:30"
                            ? "bg-purple-100 text-purple-900 border-purple-300 shadow-2xs"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                      >
                        <Moon className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>Evening (5:30 PM – 8:30 PM)</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SiKapTimePicker
                        label="Start Time"
                        badgeText="Training Start"
                        value={progStartTime}
                        onChange={(val) => setProgStartTime(val)}
                        placeholder="Select start time"
                      />

                      <SiKapTimePicker
                        label="End Time"
                        badgeText="Training End"
                        value={progEndTime}
                        onChange={(val) => setProgEndTime(val)}
                        placeholder="Select end time"
                      />
                    </div>

                    {/* Live Schedule Preview */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                        <div>
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Preview Display</p>
                          <p className="text-xs font-bold text-gray-900">
                            {formatTrainingDays(progTrainingDays)} · {formatProgramTimeslot(progStartTime, progEndTime).formattedRange}
                          </p>
                        </div>
                      </div>
                      {(() => {
                        const ts = formatProgramTimeslot(progStartTime, progEndTime);
                        return ts.sessionType !== "Custom" ? (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${ts.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
                              ts.sessionType === "Afternoon" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                ts.sessionType === "Full Day" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                                  "bg-purple-100 text-purple-900 border border-purple-200"
                            }`}>
                            {ts.sessionType}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <SiKapDatePicker
                      label="Start Date"
                      badgeText="Program Start"
                      value={progStartDate}
                      onChange={(val) => setProgStartDate(val)}
                      placeholder="Select start date"
                    />

                    <SiKapDatePicker
                      label="End Date"
                      badgeText="Program End"
                      value={progEndDate}
                      min={progStartDate || undefined}
                      onChange={(val) => setProgEndDate(val)}
                      placeholder="Select end date"
                    />

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Trainer / Instructor</label>
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TVET Trainer"
                        value={progInstructor}
                        onChange={(e) => setProgInstructor(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Auto-Calculated Duration Summary Card */}
                  {computedTrainingHours && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900">
                              Auto-Calculated Total: {computedTrainingHours.totalHours} Hours
                            </span>
                            <span className="text-[9px] bg-white text-[#0A6B43] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                              {computedTrainingHours.dailyHours} hrs/day
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 font-medium mt-0.5 truncate">
                            {computedTrainingHours.sessionCount} class days scheduled between {formatProgramDateRange(progStartDate, progEndDate)}
                            {computedTrainingHours.deductedLunch ? " (excl. 1h lunch)" : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${progTrainingHours === computedTrainingHours.totalHours
                            ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-xs"
                            : "bg-white hover:bg-emerald-100 text-[#0A6B43] border-emerald-300 shadow-2xs"
                          }`}
                      >
                        {progTrainingHours === computedTrainingHours.totalHours ? "✓ Applied" : "Apply to Hours"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Section 3: Requirements & Contacts */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Admissions & Contact Info</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Eligibility Criteria</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Open to registered Katipunan ng Kabataan Out-of-School Youth aged 15–30 residing in San Luis, Pampanga."
                      value={progEligibility}
                      onChange={(e) => setProgEligibility(e.target.value)}
                      className="w-full p-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Required Documents (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Barangay Clearance, 2x2 ID Photo, Photocopy of Valid ID"
                        value={progRequiredDocuments}
                        onChange={(e) => setProgRequiredDocuments(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Target Prerequisite Skills</label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Math, English comprehension, Willingness to learn"
                        value={progRequiredSkills}
                        onChange={(e) => setProgRequiredSkills(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Officer Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TESDA Focal Person"
                        value={progContactName}
                        onChange={(e) => setProgContactName(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Official Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +63 917 123 4567 / (045) 900-1234"
                        value={progContactPhone}
                        onChange={(e) => setProgContactPhone(e.target.value)}
                        className="w-full h-[38px] px-3.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/80 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingProgramModal(null)}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-program-modal-form"
                className="px-6 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Update Program
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RESTORE PROGRAM CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!programToRestore}
        title={`Restore Training Program "${programToRestore?.title}"?`}
        description={`This will reactivate "${programToRestore?.title}" and return it to the active training catalog. Katipunan ng Kabataan youth learners in San Luis will immediately be able to view details and apply.`}
        confirmText="Restore Program"
        confirmVariant="green"
        isLoading={isRestoringProgram}
        loadingText="Restoring Program..."
        onConfirm={async () => {
          if (programToRestore) {
            await handleUnarchiveProgram(programToRestore.id, programToRestore.title);
            setProgramToRestore(null);
          }
        }}
        onCancel={() => {
          if (!isRestoringProgram) setProgramToRestore(null);
        }}
      />

      {/* ============================================================ */}
      {/* ARCHIVE PROGRAM / CONCLUDE TERM CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!programToArchive}
        title={`Conclude & Archive Program Term: "${programToArchive?.title}"?`}
        description={`Archiving will remove "${programToArchive?.title}" and its enrollees from this active dashboard to make way for future terms, and safely preserve all student records in the database. You can review them anytime under Archived History.`}
        confirmText="Conclude & Archive Term"
        confirmVariant="green"
        isLoading={isArchivingProgram}
        loadingText="Archiving Term..."
        onConfirm={async () => {
          if (programToArchive) {
            await handleArchiveProgram(programToArchive.id, programToArchive.title);
            setProgramToArchive(null);
          }
        }}
        onCancel={() => {
          if (!isArchivingProgram) setProgramToArchive(null);
        }}
      />

      {/* ============================================================ */}
      {/* DELETE PROGRAM CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!programToDelete}
        title={`Delete Program "${programToDelete?.title}"?`}
        description={`Are you sure you want to delete "${programToDelete?.title}"? This will close the program and remove it together with its applicant records from the active dashboard.`}
        confirmText="Delete Program"
        confirmVariant="red"
        isLoading={isDeletingProgram}
        loadingText="Deleting Program..."
        onConfirm={async () => {
          if (programToDelete) {
            await handleDeleteProgram(programToDelete.id, programToDelete.title);
            setProgramToDelete(null);
          }
        }}
        onCancel={() => {
          if (!isDeletingProgram) setProgramToDelete(null);
        }}
      />

    </div>
  );
};
