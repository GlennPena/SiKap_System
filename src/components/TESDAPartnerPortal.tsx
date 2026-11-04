"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, Eye, MapPin, GraduationCap, Info, User,
  Trash2, Pencil, Bell, CheckCircle, Clock, AlertTriangle, Sparkles, ChevronRight, ChevronLeft, CheckCircle2,
  Lock, EyeOff, Edit, Copy, Menu, Loader2,
  Sun, Moon, Building2, Zap, Archive, Calculator, ShieldCheck,
  LayoutGrid, Table, ArrowUpRight, RefreshCw, UserCheck, RotateCcw, Compass,
  BarChart2, Download, Printer, FileSpreadsheet
} from "lucide-react";
import { SAN_LUIS_BARANGAYS, normalizeBarangayName } from "../lib/barangay-data";
import { TESDAProgram, ReferralPipelineItem, TESDAPartnerScreen, YouthProfile } from "../types";
import { TrainingVenueMapModal } from "./TrainingVenueMapModal";
import { formatLocationWithCoords, extractLocationDisplay } from "../lib/training-venues";
import { SikapLogo, ConfirmationModal, SiKapDatePicker, SiKapTimePicker, NotificationBellButton } from "./ReusableComponents";
import { motion, AnimatePresence } from "motion/react";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { SettingsHeaderBanner, SettingsSidebarNav, SettingsSecurityGuideCard, SettingsNotificationChannelsCard } from "./SettingsShared";
import { CATEGORIES } from "../lib/cbf-taxonomy-data";
import { formatTrainingDays, formatProgramTimeslot, formatProgramDate, formatProgramDateRange, computeProgramTrainingHours } from "../lib/cbf-matcher";
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
  const { data: sessionData, update: updateSession } = useSession();
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

  // Role-based access control for applicant management actions
  const canManageApplicants = useMemo(() => {
    if (!currentUser?.role) return true;
    const r = String(currentUser.role).toUpperCase();
    return r.includes("TESDA") || r.includes("ADMIN");
  }, [currentUser?.role]);

  // Applicants & Dashboard Sub-tabs
  const [dashboardTab, setDashboardTab] = useState<"all" | "pending" | "approved" | "enrolled" | "declined" | "programs" | "archived">("all");
  const APPLICANTS_TABLE_PER_PAGE = 10;
  const [applicantTablePage, setApplicantTablePage] = useState(1);

  // Track Approved (pre-enrollment) stage IDs in localStorage so Approved vs Enrolled distinction persists
  const [approvedStageIds, setApprovedStageIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sikap_tesda_approved_stage_ids");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch { }
    }
    return [];
  });

  const updateApprovedStageIds = (updater: (prev: string[]) => string[]) => {
    setApprovedStageIds(prev => {
      const next = Array.from(new Set(updater(prev)));
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("sikap_tesda_approved_stage_ids", JSON.stringify(next));
        } catch { }
      }
      return next;
    });
  };

  // Review Application Modal State (with Confirmation Step)
  const [reviewingApplication, setReviewingApplication] = useState<ReferralPipelineItem | null>(null);
  const [pendingReviewDecision, setPendingReviewDecision] = useState<"Approved" | "Enrolled" | "Declined" | null>(null);

  // Applicants loading & error states
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string | null>(null);

  // Check if current user is the founding TESDA partner (GPSAT)
  const isFoundingPartner = useMemo(() => {
    const email = (currentUser?.email || sessionData?.user?.email || "").toLowerCase();
    const pos = ((currentUser as any)?.officialPosition || (sessionData?.user as any)?.officialPosition || "").toLowerCase();
    const inst = ((currentUser as any)?.institutionName || (sessionData?.user as any)?.institutionName || "").toLowerCase();
    return (
      email === "rroe.bwsample@gmail.com" ||
      email.includes("gpsat") ||
      pos.includes("tesda representative") ||
      inst.includes("gpsat") ||
      inst.includes("gonzalo puyat")
    );
  }, [currentUser, sessionData]);

  // Determine initial institution and liaison identity
  const userKey = currentUser?.id || currentUser?.email || "default";
  const initialInstitution = isFoundingPartner
    ? "Gonzalo Puyat School of Arts and Trades (GPSAT)"
    : ((currentUser as any)?.institutionName || (sessionData?.user as any)?.institutionName || "Technical Vocational Institute");
  const initialRepName = (currentUser as any)?.representativeName || (sessionData?.user as any)?.representativeName || (currentUser?.name && !currentUser.name.includes("@") ? currentUser.name : "Ronald Roe");
  const initialEmail = currentUser?.email || sessionData?.user?.email || (isFoundingPartner ? "rroe.bwsample@gmail.com" : "tvet.partner@sikap.ph");
  const initialPhone = (currentUser as any)?.contactNumber || (sessionData?.user as any)?.contactNumber || "+63 919 555 7890";

  // Profile & Settings Sub-tabs
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [repName, setRepName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_name_${userKey}`);
      if (saved) return saved;
    }
    return initialRepName;
  });
  const [repEmail, setRepEmail] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_email_${userKey}`);
      if (saved) return saved;
    }
    return initialEmail;
  });
  const [centerName, setCenterName] = useState(() => {
    if (isFoundingPartner) return "Gonzalo Puyat School of Arts and Trades (GPSAT)";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_center_name_${userKey}`);
      if (saved && !saved.toLowerCase().includes("roe")) return saved;
    }
    return initialInstitution;
  });
  const [repPhone, setRepPhone] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_phone_${userKey}`);
      if (saved) return saved;
    }
    return initialPhone;
  });
  const [savedRepName, setSavedRepName] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_name_${userKey}`);
      if (saved) return saved;
    }
    return initialRepName;
  });
  const [savedRepEmail, setSavedRepEmail] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_email_${userKey}`);
      if (saved) return saved;
    }
    return initialEmail;
  });
  const [savedCenterName, setSavedCenterName] = useState(() => {
    if (isFoundingPartner) return "Gonzalo Puyat School of Arts and Trades (GPSAT)";
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_center_name_${userKey}`);
      if (saved && !saved.toLowerCase().includes("roe")) return saved;
    }
    return initialInstitution;
  });
  const [savedRepPhone, setSavedRepPhone] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`sikap_tvet_rep_phone_${userKey}`);
      if (saved) return saved;
    }
    return initialPhone;
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleCancelProfileEdit = () => {
    setRepName(savedRepName);
    setRepEmail(savedRepEmail);
    setCenterName(savedCenterName);
    setRepPhone(savedRepPhone);
    setIsEditingProfile(false);
  };

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync state if currentUser or sessionData changes from server
  useEffect(() => {
    if (isFoundingPartner) {
      setCenterName("Gonzalo Puyat School of Arts and Trades (GPSAT)");
      setSavedCenterName("Gonzalo Puyat School of Arts and Trades (GPSAT)");
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`sikap_tvet_center_name_${userKey}`, "Gonzalo Puyat School of Arts and Trades (GPSAT)");
        } catch {}
      }
    } else {
      const freshInst = (currentUser as any)?.institutionName || (sessionData?.user as any)?.institutionName;
      if (freshInst) {
        setCenterName(freshInst);
        setSavedCenterName(freshInst);
      }
    }

    const freshRep = (currentUser as any)?.representativeName || (sessionData?.user as any)?.representativeName || (currentUser?.name && !currentUser.name.includes("@") ? currentUser.name : null);
    const freshEmail = currentUser?.email || sessionData?.user?.email;
    const freshPhone = (currentUser as any)?.contactNumber || (sessionData?.user as any)?.contactNumber;

    if (freshRep) {
      setRepName(freshRep);
      setSavedRepName(freshRep);
    }
    if (freshEmail) {
      setRepEmail(freshEmail);
      setSavedRepEmail(freshEmail);
    }
    if (freshPhone) {
      setRepPhone(freshPhone);
      setSavedRepPhone(freshPhone);
    }
  }, [isFoundingPartner, currentUser, sessionData, userKey]);

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
          representativeName: repName.trim(),
          email: repEmail.trim().toLowerCase(),
          institutionName: centerName.trim(),
          centerName: centerName.trim(),
          contactNumber: repPhone.trim(),
          phone: repPhone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to update institution profile.");
      }

      // Persist in localStorage for instant retention across refreshes
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`sikap_tvet_rep_name_${userKey}`, repName.trim());
          localStorage.setItem(`sikap_tvet_rep_email_${userKey}`, repEmail.trim().toLowerCase());
          localStorage.setItem(`sikap_tvet_center_name_${userKey}`, centerName.trim());
          localStorage.setItem(`sikap_tvet_rep_phone_${userKey}`, repPhone.trim());
        } catch {}
      }

      // Update NextAuth active session
      if (updateSession) {
        try {
          await updateSession({
            name: repName.trim(),
            representativeName: repName.trim(),
            email: repEmail.trim().toLowerCase(),
            institutionName: centerName.trim(),
            contactNumber: repPhone.trim(),
          });
        } catch {}
      }

      setSavedRepName(repName.trim());
      setSavedRepEmail(repEmail.trim().toLowerCase());
      setSavedCenterName(centerName.trim());
      setSavedRepPhone(repPhone.trim());
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
      } catch { }
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
      } catch { }
      return updated;
    });
    addToast("All notifications cleared", "info");
  };

  // Selected applicant for detail view modal
  const [selectedApplicant, setSelectedApplicant] = useState<YouthProfile | null>(null);
  const [selectedApplicantReferral, setSelectedApplicantReferral] = useState<ReferralPipelineItem | null>(null);

  // Selected program for detail view modal
  const [viewingProgram, setViewingProgram] = useState<TESDAProgram | null>(null);

  // Program Enrollee & Cohort Roster states
  const [viewingProgramRoster, setViewingProgramRoster] = useState<TESDAProgram | null>(null);
  const [programRosterTab, setProgramRosterTab] = useState<"all" | "enrolled" | "pending" | "approved" | "completed" | "declined">("all");
  const [programRosterSearch, setProgramRosterSearch] = useState("");
  const [programRosterBarangay, setProgramRosterBarangay] = useState("All");
  const [programModalTab, setProgramModalTab] = useState<"details" | "roster">("details");

  // Program delete confirmation modal state
  const [programToDelete, setProgramToDelete] = useState<TESDAProgram | null>(null);

  // Program archive confirmation modal state
  const [programToArchive, setProgramToArchive] = useState<TESDAProgram | null>(null);
  const [graduationEvaluations, setGraduationEvaluations] = useState<Record<string, "Graduated" | "Incomplete">>({});

  // Program restore confirmation modal state
  const [programToRestore, setProgramToRestore] = useState<TESDAProgram | null>(null);

  // Action loading states for restore, archive, delete
  const [isRestoringProgram, setIsRestoringProgram] = useState(false);
  const [restoringProgramId, setRestoringProgramId] = useState<string | null>(null);
  const [isArchivingProgram, setIsArchivingProgram] = useState(false);
  const [archivingProgramId, setArchivingProgramId] = useState<string | null>(null);
  const [isDeletingProgram, setIsDeletingProgram] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

  // Action loading states for referral status updates and program forms
  const [processingReferralId, setProcessingReferralId] = useState<string | null>(null);
  const [processingReferralStatus, setProcessingReferralStatus] = useState<"Approved" | "Enrolled" | "Declined" | null>(null);
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);

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
  const [modalEditDeliveryMode, setModalEditDeliveryMode] = useState("Face-to-Face");
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

  // Pipeline Search, Filter & Sort states
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("All");
  const [pipelineProgramFilter, setPipelineProgramFilter] = useState<string>("All");
  const [pipelineBarangayFilter, setPipelineBarangayFilter] = useState<string>("All");
  const [pipelineDateRangeFilter, setPipelineDateRangeFilter] = useState<string>("All");
  const [applicantSortCol, setApplicantSortCol] = useState<"applicant" | "program" | "matchScore" | "appliedDate" | "status">("appliedDate");
  const [applicantSortDir, setApplicantSortDir] = useState<"asc" | "desc">("desc");

  const handleApplicantSort = (col: "applicant" | "program" | "matchScore" | "appliedDate" | "status") => {
    if (applicantSortCol === col) {
      setApplicantSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setApplicantSortCol(col);
      setApplicantSortDir(col === "applicant" || col === "program" || col === "status" ? "asc" : "desc");
    }
  };

  const refreshApplicantsData = async () => {
    setIsLoadingApplicants(true);
    setApplicantsError(null);
    try {
      const [activeRes, archRes, progRes] = await Promise.all([
        fetch("/api/referrals"),
        fetch("/api/referrals?archived=true"),
        fetch("/api/programs")
      ]);
      const activeData = await activeRes.json();
      const archData = await archRes.json();
      const progData = await progRes.json();

      if (!activeRes.ok || !activeData.success) {
        throw new Error(activeData.error || activeData.message || "Failed to load applicant records.");
      }
      setReferrals(activeData.data || []);
      if (archData.success && archData.data) {
        setArchivedReferralsList(archData.data);
      }
      if (progData.success && progData.data) {
        setPrograms(progData.data);
      }
    } catch (err: any) {
      console.error("Error refreshing applicants:", err);
      setApplicantsError(err.message || "Unable to fetch latest applications. Please try again.");
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  // Programs Screen Catalog displays max 6 programs per page
  const PROGRAMS_CATALOG_PER_PAGE = 6;
  const [programsCatalogPage, setProgramsCatalogPage] = useState(1);

  // Reset applicant pagination when filters or tab change
  useEffect(() => {
    setApplicantTablePage(1);
  }, [pipelineSearch, pipelineStatusFilter, pipelineProgramFilter, pipelineBarangayFilter, pipelineDateRangeFilter, dashboardTab, applicantSortCol, applicantSortDir]);

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

  // Form states for adding/editing program
  const [progTitle, setProgTitle] = useState("");
  const [progLevel, setProgLevel] = useState("NC II");
  const [progTrainingHours, setProgTrainingHours] = useState<number | "">("");
  const [progLocation, setProgLocation] = useState("");
  const [progCost, setProgCost] = useState<"Free" | "Subsidized" | "With Fee">("Free");
  const [progSlots, setProgSlots] = useState<number | "">("");
  const [progEligibility, setProgEligibility] = useState("");
  const [progRequiredDocuments, setProgRequiredDocuments] = useState("");
  const [progTrainingDays, setProgTrainingDays] = useState<string[]>([]);
  const [progStartTime, setProgStartTime] = useState("");
  const [progEndTime, setProgEndTime] = useState("");
  const [progRoom, setProgRoom] = useState("");
  const [progInstructor, setProgInstructor] = useState("");
  const [progStartDate, setProgStartDate] = useState("");
  const [progEndDate, setProgEndDate] = useState("");
  const [progCategoryId, setProgCategoryId] = useState<string>("1");
  const [progDeliveryMode, setProgDeliveryMode] = useState<string>("Face-to-Face");
  const [progFundingType, setProgFundingType] = useState<string>("100% Free");
  const [progCptrCourseCode, setProgCptrCourseCode] = useState<string>("");
  const [progPerks, setProgPerks] = useState<string[]>([]);

  // Editing program ID state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  // Map Modal State for Picking / Viewing Training Venue
  const [isVenueMapModalOpen, setIsVenueMapModalOpen] = useState(false);
  const [venueMapModalMode, setVenueMapModalMode] = useState<"picker" | "viewer">("picker");
  const [venueMapTarget, setVenueMapTarget] = useState<"create" | "modalEdit" | "editModal">("create");
  const [progLat, setProgLat] = useState<number | undefined>(undefined);
  const [progLng, setProgLng] = useState<number | undefined>(undefined);
  const [modalEditLat, setModalEditLat] = useState<number | undefined>(undefined);
  const [modalEditLng, setModalEditLng] = useState<number | undefined>(undefined);

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
    setProgTrainingDays([]);
    setProgStartTime("");
    setProgEndTime("");
    setProgRoom("");
    setProgInstructor("");
    setProgStartDate("");
    setProgEndDate("");
    setProgDeliveryMode("Face-to-Face");
    setProgFundingType("100% Free");
    setProgCptrCourseCode("");
    setProgPerks([]);
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

    setIsSubmittingProgram(true);
    const levelSuffix = progLevel && progLevel !== "None" ? progLevel : "";
    const fullTitle = levelSuffix && !progTitle.toUpperCase().includes(levelSuffix)
      ? `${progTitle.trim()} ${levelSuffix}`.trim()
      : progTitle.trim();

    const payload = {
      title: fullTitle,
      provider: myInstitutionName,
      deliveryMode: progDeliveryMode || "Face-to-Face",
      fundingType: progFundingType || "100% Free",
      cptrCourseCode: progCptrCourseCode || undefined,
      perks: progPerks || [],
      certificationType: progLevel === "None" ? "None" : (progLevel || "NC II"),
      categoryId: progCategoryId,
      location: progLocation,
      trainingHours: Number(progTrainingHours),
      cost: progCost,
      slotsTotal: Number(progSlots),
      eligibility: progEligibility,
      requiredDocuments: progRequiredDocuments ? progRequiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : [],
      requiredSkills: [],
      contactPerson: savedRepName || (currentUser as any)?.representativeName || myInstitutionName,
      contactNumber: savedRepPhone || (currentUser as any)?.contactNumber || "+63 917 000 1122",
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
    } finally {
      setIsSubmittingProgram(false);
    }
  };

  // Change application status (supports Pending -> Approved -> Enrolled, or Declined)
  const handleUpdateReferralStatus = async (refId: string, newStatus: "Approved" | "Enrolled" | "Declined"): Promise<boolean> => {
    if (!canManageApplicants) {
      addToast("Unauthorized: Only TESDA Partner Representatives can update application statuses.", "error");
      return false;
    }

    const targetReferral = referrals.find(item => item.id === refId);
    if (!targetReferral) return false;

    const currentEffectiveStatus =
      targetReferral.status === "Enrolled" && approvedStageIds.includes(targetReferral.id)
        ? "Approved"
        : targetReferral.status;

    const wasHoldingSlot =
      currentEffectiveStatus === "Pending" ||
      currentEffectiveStatus === "Approved" ||
      currentEffectiveStatus === "Enrolled";
    const willHoldSlot = newStatus === "Approved" || newStatus === "Enrolled";

    if (!wasHoldingSlot && willHoldSlot) {
      const associatedProgram = programs.find(p => p.title === targetReferral.programTitle || p.id === targetReferral.programId);
      if (associatedProgram && associatedProgram.slotsRemaining <= 0) {
        addToast(`Cannot approve: "${targetReferral.programTitle}" is already at full capacity!`, "error");
        return false;
      }
    }

    setProcessingReferralId(refId);
    setProcessingReferralStatus(newStatus);

    try {
      const res = await fetch("/api/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: refId, status: newStatus })
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (newStatus === "Approved") {
          updateApprovedStageIds(prev => [...prev, refId]);
        } else {
          updateApprovedStageIds(prev => prev.filter(id => id !== refId));
        }

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
            })
        );

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
          newStatus === "Approved"
            ? `Approved application for "${targetReferral.youthName}" in "${targetReferral.programTitle}"!`
            : newStatus === "Enrolled"
              ? `Officially enrolled "${targetReferral.youthName}" into "${targetReferral.programTitle}"!`
              : `Declined application for "${targetReferral.youthName}".`,
          newStatus === "Declined" ? "info" : "success"
        );
        broadcastDataChange("referrals", "status_updated");
        broadcastDataChange("programs", "slots_updated");
        return true;
      } else {
        addToast(data.error || "Failed to update application status", "error");
        return false;
      }
    } catch (err) {
      console.error("Error updating referral status:", err);
      addToast("Network error: Failed to update application status.", "error");
      return false;
    } finally {
      setProcessingReferralId(null);
      setProcessingReferralStatus(null);
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

  const handleArchiveProgram = async (progId: string, title: string, evaluations?: Record<string, "Graduated" | "Incomplete">) => {
    setIsArchivingProgram(true);
    setArchivingProgramId(progId);
    try {
      const gradIds: string[] = [];
      const incompIds: string[] = [];
      if (evaluations) {
        Object.entries(evaluations).forEach(([refId, status]) => {
          if (status === "Graduated") gradIds.push(refId);
          else if (status === "Incomplete") incompIds.push(refId);
        });
      }

      const res = await fetch(`/api/programs?id=${progId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graduatedReferralIds: gradIds,
          incompleteReferralIds: incompIds
        })
      });
      const data = await res.json();
      if (data.success) {
        const archivedProg = programs.find(p => p.id === progId) || data.data;
        if (archivedProg) {
          setArchivedProgramsList(prev => [{ ...archivedProg, activeStatus: "Closed" as any }, ...prev.filter(p => p.id !== progId)]);
        }
        setPrograms(prev => prev.filter(p => p.id !== progId));

        // Update local referrals: certified graduates become Archived, incomplete ones become Declined
        setReferrals(prev => prev.map(r => {
          if (r.programId === progId || r.programTitle.toLowerCase().trim() === title.toLowerCase().trim()) {
            if (gradIds.includes(r.id)) return { ...r, status: "Archived" };
            if (incompIds.includes(r.id) || r.status === "Pending") return { ...r, status: "Declined" };
          }
          return r;
        }));

        addToast(data.message || `Program "${title}" archived with certified graduates!`, "success");
        broadcastDataChange("programs", "archived");
        broadcastDataChange("referrals", "status_updated");
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
      setProgramToArchive(null);
      setGraduationEvaluations({});
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
      setModalEditLevel((prog as any).certificationType === "None" ? "None" : "None");
    }

    let catId = prog.categoryId ? String(prog.categoryId) : "";
    if (!catId && prog.category) {
      const found = CATEGORIES.find(c => c.id === prog.category || c.name.toLowerCase() === String(prog.category).toLowerCase());
      if (found) catId = found.id;
    }
    if (!catId) catId = "1";
    setModalEditCategoryId(catId);

    setModalEditTrainingHours(prog.trainingHours || "");
    setModalEditLocation(extractLocationDisplay(prog.location) || "");
    setModalEditCost(prog.cost || "Free");
    setModalEditDeliveryMode(prog.deliveryMode || "Face-to-Face");
    setModalEditSlotsTotal(prog.slotsTotal || 25);
    setModalEditEligibility(prog.eligibility || "");
    setModalEditRequiredDocuments(prog.requiredDocuments ? prog.requiredDocuments.join(', ') : "");
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
    const levelSuffix = modalEditLevel && modalEditLevel !== "None" ? modalEditLevel : "";
    const fullTitle = levelSuffix && !modalEditTitle.toUpperCase().includes(levelSuffix)
      ? `${modalEditTitle.trim()} ${levelSuffix}`.trim()
      : modalEditTitle.trim();

    const currentOccupied = Math.max(0, (viewingProgram.slotsTotal || 0) - (viewingProgram.slotsRemaining || 0));
    const newTotal = Number(modalEditSlotsTotal);
    const newRemaining = Math.max(0, newTotal - currentOccupied);

    const payload = {
      id: viewingProgram.id,
      title: fullTitle,
      certificationType: modalEditLevel === "None" ? "None" : (modalEditLevel || "NC II"),
      categoryId: modalEditCategoryId,
      location: modalEditLocation,
      trainingHours: Number(modalEditTrainingHours),
      cost: modalEditCost,
      deliveryMode: modalEditDeliveryMode || "Face-to-Face",
      slotsTotal: newTotal,
      slotsRemaining: newRemaining,
      eligibility: modalEditEligibility,
      requiredDocuments: modalEditRequiredDocuments ? modalEditRequiredDocuments.split(',').map(s => s.trim()).filter(Boolean) : [],
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

  // Scoped institution identity & founding partner check
  const myInstitutionName = useMemo(() => {
    if (isFoundingPartner) return "Gonzalo Puyat School of Arts and Trades (GPSAT)";
    return savedCenterName || (currentUser as any)?.institutionName || "Technical Vocational Institute";
  }, [isFoundingPartner, savedCenterName, currentUser]);

  const isGPSAT = useMemo(() => {
    if (isFoundingPartner) return true;
    const inst = (myInstitutionName || "").toLowerCase();
    const email = (currentUser?.email || "").toLowerCase();
    return (
      inst.includes("gpsat") ||
      inst.includes("gonzalo puyat") ||
      email.includes("gpsat") ||
      email === "rroe.bwsample@gmail.com"
    );
  }, [isFoundingPartner, myInstitutionName, currentUser?.email]);

  // Dynamic brand label for left navbar header
  const partnerNavbarBrand = useMemo(() => {
    if (isGPSAT) return "TESDA";
    const raw = (myInstitutionName || "TVET").trim();
    const clean = raw.replace(/^TESDA\s*[-–—]?\s*/i, "");
    return clean || "TVET";
  }, [isGPSAT, myInstitutionName]);

  // Scoped to this specific training provider
  const scopedPrograms = useMemo(() => {
    if (isGPSAT) {
      return programs.filter(p => {
        const prov = (p.provider || "").toLowerCase().trim();
        return (
          prov === "" ||
          prov.includes("gpsat") ||
          prov.includes("gonzalo") ||
          prov.includes("tesda pampanga") ||
          prov.includes("tesda - gonzalo") ||
          prov.includes("tesda")
        );
      });
    }
    const instClean = myInstitutionName.toLowerCase().trim();
    return programs.filter(p => {
      const prov = (p.provider || "").toLowerCase().trim();
      return prov === instClean || prov.includes(instClean) || instClean.includes(prov);
    });
  }, [programs, isGPSAT, myInstitutionName]);

  // Only active, non-closed programs belonging to this institution should appear on the dashboard
  const activePrograms = useMemo(() => {
    return scopedPrograms.filter(p => p.activeStatus !== "Closed");
  }, [scopedPrograms]);

  // Programs whose duration has completed
  const completedPrograms = useMemo(() => {
    return activePrograms.filter(p => isProgramDurationDone(p));
  }, [activePrograms]);

  // Active referrals: only non-archived referrals belonging to active programs (preserving Approved stage distinction)
  const activeReferrals = useMemo(() => {
    const seenApplicantProg = new Set<string>();
    return referrals
      .filter(item => {
        const youthKey = (item.youthId || item.youthEmail || item.youthName || item.id).toLowerCase().trim();
        const progKey = (item.programId || item.programTitle || item.id).toLowerCase().trim();
        const compositeKey = `${youthKey}::${progKey}`;
        if (seenApplicantProg.has(compositeKey)) return false;
        seenApplicantProg.add(compositeKey);
        if (item.status === "Archived") return false;
        const prog = activePrograms.find(p => p.title === item.programTitle || p.id === item.programId);
        return !!prog;
      })
      .map(item => {
        if (item.status === "Enrolled" && approvedStageIds.includes(item.id)) {
          return { ...item, status: "Approved" as const };
        }
        return item;
      });
  }, [referrals, activePrograms, approvedStageIds]);

  // Normalized archived referrals list (deduplicated)
  const normalizedArchivedReferrals = useMemo(() => {
    const seen = new Set<string>();
    return archivedReferralsList
      .filter(item => {
        const youthKey = (item.youthId || item.youthEmail || item.youthName || item.id).toLowerCase().trim();
        const progKey = (item.programId || item.programTitle || item.id).toLowerCase().trim();
        const key = `${youthKey}::${progKey}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(item => ({
        ...item,
        status: (item.status === "Archived" ? "Archived" : item.status) as ReferralPipelineItem["status"]
      }));
  }, [archivedReferralsList]);

  // Computed Metrics based on active catalog
  const totalSlotsRemaining = useMemo(() => activePrograms.reduce((acc, curr) => acc + curr.slotsRemaining, 0), [activePrograms]);
  const totalSlotsAllocated = useMemo(() => activePrograms.reduce((acc, curr) => acc + (curr.slotsTotal || 30), 0), [activePrograms]);
  const pendingReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Pending").length, [activeReferrals]);
  const approvedReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Approved").length, [activeReferrals]);
  const enrolledReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Enrolled").length, [activeReferrals]);
  const declinedReferralsCount = useMemo(() => activeReferrals.filter(r => r.status === "Declined").length, [activeReferrals]);

  // Dashboard Analytics & Activity UI states
  const [hoveredStatusSlice, setHoveredStatusSlice] = useState<number | null>(null);
  const [programDemandSort, setProgramDemandSort] = useState<"demand" | "slots" | "title">("demand");
  const [trendTimeframe, setTrendTimeframe] = useState<"weekly" | "6m" | "12m">("6m");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [barangayChartMode, setBarangayChartMode] = useState<"all" | "active">("all");
  const [barangayCountMetric, setBarangayCountMetric] = useState<"applications" | "uniqueYouth">("applications");
  const [hoveredBarangayIdx, setHoveredBarangayIdx] = useState<number | null>(null);
  const [sectorSupplyMetric, setSectorSupplyMetric] = useState<"programs" | "slots">("slots");
  const [hoveredSectorIdx, setHoveredSectorIdx] = useState<number | null>(null);
  const recentActivityLimit = 5;

  // All consolidated applications (active + archived, deduplicated)
  const allConsolidatedReferrals = useMemo(() => {
    const map = new Map<string, ReferralPipelineItem>();
    [...activeReferrals, ...normalizedArchivedReferrals].forEach(item => {
      const youthKey = (item.youthId || item.youthEmail || item.youthName || item.id).toLowerCase().trim();
      const progKey = (item.programId || item.programTitle || item.id).toLowerCase().trim();
      const key = `${youthKey}::${progKey}`;
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
    return Array.from(map.values());
  }, [activeReferrals, normalizedArchivedReferrals]);

  // Program-specific cohort statistics helper
  const getProgramCohortStats = (prog?: TESDAProgram | null) => {
    if (!prog) {
      return {
        total: 0,
        enrolledCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        completedCount: 0,
        declinedCount: 0,
        archivedCount: 0,
        cohort: [] as ReferralPipelineItem[]
      };
    }
    const progId = (prog.id || "").toLowerCase().trim();
    const progTitle = (prog.title || "").toLowerCase().trim();

    const cohort = allConsolidatedReferrals.filter(r => {
      const rId = (r.programId || "").toLowerCase().trim();
      const rTitle = (r.programTitle || "").toLowerCase().trim();
      return (progId && rId === progId) || (progTitle && rTitle === progTitle);
    });

    const enrolled = cohort.filter(r => r.status === "Enrolled");
    const pending = cohort.filter(r => r.status === "Pending");
    const approved = cohort.filter(r => r.status === "Approved");
    const completed = cohort.filter(r => r.status === "Completed" || (r as any).isGraduate);
    const declined = cohort.filter(r => r.status === "Declined");
    const archived = cohort.filter(r => r.status === "Archived");

    return {
      total: cohort.length,
      enrolledCount: enrolled.length,
      pendingCount: pending.length,
      approvedCount: approved.length,
      completedCount: completed.length,
      declinedCount: declined.length,
      archivedCount: archived.length,
      cohort
    };
  };

  const handleExportProgramRosterCSV = (prog: TESDAProgram, items: ReferralPipelineItem[]) => {
    const headers = [
      "Trainee Name",
      "Email",
      "Contact Number",
      "Barangay",
      "Purok",
      "Program Title",
      "Delivery Mode",
      "Status",
      "Match Score",
      "Application Date",
      "Completion Date"
    ];
    const rows = items.map(item => {
      const matchedProfile = youthProfiles.find(y =>
        (item.youthId && y.id === item.youthId) ||
        (item.youthName && y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim())
      );
      const email = item.youthEmail || item.email || matchedProfile?.email || "—";
      const contact = (item as any).contactNumber || matchedProfile?.contactNumber || "—";
      return [
        `"${(item.youthName || "").replace(/"/g, '""')}"`,
        `"${email.replace(/"/g, '""')}"`,
        `"${contact.replace(/"/g, '""')}"`,
        `"${(item.barangay || "").replace(/"/g, '""')}"`,
        `"${(item.purok || "").replace(/"/g, '""')}"`,
        `"${(prog.title || item.programTitle || "").replace(/"/g, '""')}"`,
        `"${(prog.deliveryMode || "Face-to-Face").replace(/"/g, '""')}"`,
        `"${item.status || ""}"`,
        `"${item.matchScore || 0}%"`,
        `"${item.applicationDate || item.referralDate || ""}"`,
        `"${item.completionDate || "—"}"`
      ];
    });
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${(prog.title || "Program").replace(/[^a-zA-Z0-9_-]/g, "_")}_Enrollees_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast(`Exported ${items.length} enrollee records for "${prog.title}" to CSV.`, "success");
  };

  const filteredRosterReferrals = useMemo(() => {
    if (!viewingProgramRoster) return [];
    const stats = getProgramCohortStats(viewingProgramRoster);
    let list = stats.cohort;

    if (programRosterTab === "enrolled") {
      list = list.filter(r => r.status === "Enrolled");
    } else if (programRosterTab === "pending") {
      list = list.filter(r => r.status === "Pending");
    } else if (programRosterTab === "approved") {
      list = list.filter(r => r.status === "Approved");
    } else if (programRosterTab === "completed") {
      list = list.filter(r => r.status === "Completed" || (r as any).isGraduate);
    } else if (programRosterTab === "declined") {
      list = list.filter(r => r.status === "Declined");
    }

    if (programRosterBarangay !== "All") {
      list = list.filter(r => r.barangay && r.barangay.toLowerCase() === programRosterBarangay.toLowerCase());
    }

    if (programRosterSearch.trim()) {
      const q = programRosterSearch.toLowerCase().trim();
      list = list.filter(r =>
        (r.youthName && r.youthName.toLowerCase().includes(q)) ||
        (r.youthEmail && r.youthEmail.toLowerCase().includes(q)) ||
        ((r as any).email && (r as any).email.toLowerCase().includes(q)) ||
        (r.purok && r.purok.toLowerCase().includes(q)) ||
        (r.barangay && r.barangay.toLowerCase().includes(q))
      );
    }

    return list;
  }, [viewingProgramRoster, allConsolidatedReferrals, programRosterTab, programRosterBarangay, programRosterSearch]);

  const totalApplicationsCount = allConsolidatedReferrals.length;

  // Unique youth count (prevents duplicate youth from being counted as separate individuals)
  const uniqueApplicantYouthCount = useMemo(() => {
    const set = new Set<string>();
    allConsolidatedReferrals.forEach(r => {
      const key = (r.youthId || r.youthEmail || r.youthName || r.id).toLowerCase().trim();
      if (key) set.add(key);
    });
    return set.size;
  }, [allConsolidatedReferrals]);

  const uniqueEnrolledYouthCount = useMemo(() => {
    const set = new Set<string>();
    activeReferrals
      .filter(r => r.status === "Enrolled")
      .forEach(r => {
        const key = (r.youthId || r.youthEmail || r.youthName || r.id).toLowerCase().trim();
        if (key) set.add(key);
      });
    return set.size;
  }, [activeReferrals]);

  // CHART 1: Application Status Distribution (Donut Chart)
  const statusDistributionData = useMemo(() => {
    const rawSlices = [
      { label: "Pending", count: pendingReferralsCount, color: "#F59E0B", tab: "pending" as const, filter: "Pending" },
      { label: "Approved", count: approvedReferralsCount, color: "#3B82F6", tab: "approved" as const, filter: "Approved" },
      { label: "Enrolled", count: enrolledReferralsCount, color: "#0A6B43", tab: "enrolled" as const, filter: "Enrolled" },
      { label: "Declined", count: declinedReferralsCount, color: "#EF4444", tab: "declined" as const, filter: "Declined" },
      { label: "Archived", count: normalizedArchivedReferrals.length, color: "#64748B", tab: "archived" as const, filter: "Archived" }
    ];
    const total = rawSlices.reduce((sum, s) => sum + s.count, 0);
    const slices = rawSlices.map(s => ({
      ...s,
      pct: total > 0 ? Math.round((s.count / total) * 100) : 0
    }));
    return { slices, total };
  }, [
    pendingReferralsCount,
    approvedReferralsCount,
    enrolledReferralsCount,
    declinedReferralsCount,
    normalizedArchivedReferrals.length
  ]);

  // CHART 2: Program Demand vs. Available Slots (Horizontal Bar Chart)
  const programDemandData = useMemo(() => {
    const items = activePrograms.map(prog => {
      const progApps = activeReferrals.filter(
        r => r.programId === prog.id || r.programTitle.toLowerCase().trim() === prog.title.toLowerCase().trim()
      );
      const activeDemand = progApps.filter(r => r.status !== "Declined").length;
      const pending = progApps.filter(r => r.status === "Pending").length;
      const approved = progApps.filter(r => r.status === "Approved").length;
      const enrolled = progApps.filter(r => r.status === "Enrolled").length;
      const slotsRemaining = Math.max(0, prog.slotsRemaining || 0);
      const slotsTotal = Math.max(1, prog.slotsTotal || 25);

      return {
        id: prog.id,
        title: prog.title,
        category: getProgramCategory(prog),
        demand: activeDemand,
        totalApps: progApps.length,
        pending,
        approved,
        enrolled,
        slotsRemaining,
        slotsTotal
      };
    });

    const sorted = [...items].sort((a, b) => {
      if (programDemandSort === "demand") {
        if (b.demand !== a.demand) return b.demand - a.demand;
        return a.slotsRemaining - b.slotsRemaining;
      }
      if (programDemandSort === "slots") {
        if (a.slotsRemaining !== b.slotsRemaining) return a.slotsRemaining - b.slotsRemaining;
        return b.demand - a.demand;
      }
      return a.title.localeCompare(b.title);
    });

    const maxScale = Math.max(
      10,
      ...sorted.map(i => Math.max(i.demand, i.slotsRemaining, i.slotsTotal))
    );

    return { items: sorted, maxScale };
  }, [activePrograms, activeReferrals, programDemandSort]);

  // CHART 3: Application Trends Over Time (Weekly / 6M / 12M Line Chart)
  const applicationTrendsData = useMemo(() => {
    const getTs = (item: ReferralPipelineItem): number => {
      const raw = (item as any).rawDate || item.applicationDate || item.referralDate;
      if (!raw) return 0;
      const t = new Date(raw).getTime();
      return isNaN(t) ? 0 : t;
    };

    const validTimestamps = allConsolidatedReferrals
      .map(getTs)
      .filter(ts => ts > 0);

    // Anchor timeline to latest application date or current date so real database timestamps always fall cleanly in range
    const latestDataTime = validTimestamps.length > 0 ? Math.max(...validTimestamps) : Date.now();
    const anchorDate = new Date(Math.max(Date.now(), latestDataTime));

    if (trendTimeframe === "weekly") {
      const buckets: Array<{ key: string; label: string; fullLabel: string; count: number; uniqueYouth: number }> = [];
      const dayMs = 24 * 60 * 60 * 1000;
      const endOfCurrentWeek = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 23, 59, 59, 999).getTime();

      for (let i = 7; i >= 0; i--) {
        const bucketEnd = endOfCurrentWeek - i * 7 * dayMs;
        const bucketStart = bucketEnd - 7 * dayMs + 1;
        const startD = new Date(bucketStart);
        const endD = new Date(bucketEnd);
        const shortLabel = startD.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const fullLabel = `${startD.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${endD.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        const matching = allConsolidatedReferrals.filter(r => {
          const ts = getTs(r);
          return ts >= bucketStart && ts <= bucketEnd;
        });
        const youthSet = new Set(matching.map(r => (r.youthId || r.youthEmail || r.youthName || r.id).toLowerCase().trim()));

        buckets.push({
          key: `wk-${i}`,
          label: shortLabel,
          fullLabel,
          count: matching.length,
          uniqueYouth: youthSet.size
        });
      }

      const maxCount = Math.max(4, ...buckets.map(b => b.count));
      const totalInPeriod = buckets.reduce((sum, b) => sum + b.count, 0);
      return { buckets, maxCount, totalInPeriod };
    } else {
      const monthCount = trendTimeframe === "12m" ? 12 : 6;
      const buckets: Array<{ key: string; label: string; fullLabel: string; count: number; uniqueYouth: number }> = [];

      for (let i = monthCount - 1; i >= 0; i--) {
        const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth();
        const shortLabel = d.toLocaleDateString("en-US", { month: "short" });
        const fullLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });

        const matching = allConsolidatedReferrals.filter(r => {
          const ts = getTs(r);
          if (!ts) return false;
          const rd = new Date(ts);
          return rd.getFullYear() === year && rd.getMonth() === month;
        });
        const youthSet = new Set(matching.map(r => (r.youthId || r.youthEmail || r.youthName || r.id).toLowerCase().trim()));

        buckets.push({
          key: `${year}-${String(month + 1).padStart(2, "0")}`,
          label: shortLabel,
          fullLabel,
          count: matching.length,
          uniqueYouth: youthSet.size
        });
      }

      const maxCount = Math.max(4, ...buckets.map(b => b.count));
      const totalInPeriod = buckets.reduce((sum, b) => sum + b.count, 0);
      return { buckets, maxCount, totalInPeriod };
    }
  }, [allConsolidatedReferrals, trendTimeframe]);

  // CHART 4: Applications by Barangay (Top 6 Barangays of San Luis, Pampanga)
  const barangayApplicationsData = useMemo(() => {
    const statsMap = new Map<string, {
      barangay: string;
      applications: number;
      uniqueYouthSet: Set<string>;
      pending: number;
      approved: number;
      enrolled: number;
    }>();

    SAN_LUIS_BARANGAYS.forEach(brgy => {
      statsMap.set(brgy, {
        barangay: brgy,
        applications: 0,
        uniqueYouthSet: new Set<string>(),
        pending: 0,
        approved: 0,
        enrolled: 0
      });
    });

    allConsolidatedReferrals.forEach(r => {
      const normalized = normalizeBarangayName(r.barangay || "");
      const matchedBrgy = SAN_LUIS_BARANGAYS.find(
        b => normalizeBarangayName(b).toLowerCase() === normalized.toLowerCase()
      ) || normalized || "San Sebastian";

      if (!statsMap.has(matchedBrgy)) {
        statsMap.set(matchedBrgy, {
          barangay: matchedBrgy,
          applications: 0,
          uniqueYouthSet: new Set<string>(),
          pending: 0,
          approved: 0,
          enrolled: 0
        });
      }

      const entry = statsMap.get(matchedBrgy)!;
      entry.applications += 1;
      const youthKey = (r.youthId || r.youthEmail || r.youthName || r.id).toLowerCase().trim();
      if (youthKey) entry.uniqueYouthSet.add(youthKey);
      if (r.status === "Pending") entry.pending += 1;
      else if (r.status === "Approved") entry.approved += 1;
      else if (r.status === "Enrolled") entry.enrolled += 1;
    });

    const allItems = Array.from(statsMap.values()).map(item => ({
      barangay: item.barangay,
      applications: item.applications,
      uniqueYouth: item.uniqueYouthSet.size,
      pending: item.pending,
      approved: item.approved,
      enrolled: item.enrolled
    }));

    const getVal = (i: { applications: number; uniqueYouth: number }) =>
      barangayCountMetric === "uniqueYouth" ? i.uniqueYouth : i.applications;

    const scopedItems = barangayChartMode === "active"
      ? allItems.filter(i => getVal(i) > 0)
      : allItems;

    // Exclude barangays with zero applications when positive values are available;
    // if fewer than 6 barangays have applications, display only those with actual applications.
    const positiveItems = scopedItems.filter(i => getVal(i) > 0);

    const sortedTop6 = [...positiveItems]
      .sort((a, b) => {
        const valA = getVal(a);
        const valB = getVal(b);
        if (valB !== valA) return valB - valA;
        return a.barangay.localeCompare(b.barangay);
      })
      .slice(0, 6);

    const maxVal = Math.max(
      1,
      ...sortedTop6.map(i => getVal(i))
    );
    const activeBarangayCount = allItems.filter(i => getVal(i) > 0).length;
    const scopeTotalCount = barangayChartMode === "active" ? activeBarangayCount : SAN_LUIS_BARANGAYS.length;

    return {
      items: sortedTop6,
      maxVal,
      activeBarangayCount,
      scopeTotalCount,
      totalBarangays: SAN_LUIS_BARANGAYS.length
    };
  }, [allConsolidatedReferrals, barangayChartMode, barangayCountMetric]);

  // CHART 5: Youth Interests vs. Training Supply by Vocational Sector (Grouped Bar Chart)
  const sectorInterestVsSupplyData = useMemo(() => {
    const sectorDefinitions = [
      {
        id: "ict",
        shortLabel: "ICT & Digital",
        fullName: "Information & Communication Technology",
        keywords: ["ict", "computer", "information", "programming", "web", "digital", "software", "hardware", "networking", "tech", "data", "encoding"]
      },
      {
        id: "construction",
        shortLabel: "Construction & Welding",
        fullName: "Construction & Metal Trades",
        keywords: ["construction", "welding", "smaw", "carpentry", "masonry", "plumbing", "tile", "metal", "pipe", "scaffold"]
      },
      {
        id: "food",
        shortLabel: "Food & Culinary",
        fullName: "Process Food & Beverages",
        keywords: ["food", "cook", "cooking", "culinary", "baking", "pastry", "bread", "beverage", "kitchen", "catering"]
      },
      {
        id: "electrical",
        shortLabel: "Electrical & Electronics",
        fullName: "Electrical & Electronics",
        keywords: ["electrical", "electric", "wiring", "electronics", "solar", "eim", "appliance", "mechatronics"]
      },
      {
        id: "automotive",
        shortLabel: "Automotive",
        fullName: "Automotive & Land Transport",
        keywords: ["automotive", "mechanic", "driving", "motorcycle", "vehicle", "engine", "transport", "chassis"]
      },
      {
        id: "agriculture",
        shortLabel: "Agriculture",
        fullName: "Agriculture & Agri-Fishery",
        keywords: ["agriculture", "agri", "farm", "farming", "crop", "organic", "livestock", "poultry", "aquaculture", "horticulture"]
      },
      {
        id: "tourism",
        shortLabel: "Tourism & Hospitality",
        fullName: "Tourism & Hospitality",
        keywords: ["tourism", "hotel", "hospitality", "housekeeping", "bartending", "barista", "front office", "events", "travel"]
      },
      {
        id: "healthcare",
        shortLabel: "Health Care",
        fullName: "Human Health / Health Care",
        keywords: ["health", "caregiving", "caregiver", "nursing", "medical", "wellness", "massage", "hilots", "first aid"]
      },
      {
        id: "entrepreneurship",
        shortLabel: "Entrepreneurship",
        fullName: "Entrepreneurship & Business",
        keywords: ["entrepreneurship", "business", "bookkeeping", "accounting", "retail", "selling", "commerce", "livelihood"]
      }
    ];

    const items = sectorDefinitions.map(sec => {
      // Unique youth interested in this sector (deduplicated by youth ID/name)
      const interestedYouthSet = new Set<string>();
      youthProfiles.forEach(y => {
        if (y.approvalStatus && y.approvalStatus !== "Approved") return;
        const textPool = [
          y.sectorPreference || "",
          y.livelihoodGoal || "",
          ...(y.interests || []),
          ...(y.skills || [])
        ].join(" ").toLowerCase();

        if (sec.keywords.some(kw => textPool.includes(kw))) {
          const uniqueKey = (y.id || y.email || y.name).toLowerCase().trim();
          if (uniqueKey) interestedYouthSet.add(uniqueKey);
        }
      });

      // Active TESDA programs in this sector
      const matchingPrograms = activePrograms.filter(p => {
        const cat = getProgramCategory(p).toLowerCase();
        const title = (p.title || "").toLowerCase();
        return sec.keywords.some(kw => cat.includes(kw) || title.includes(kw));
      });

      const availableSlots = matchingPrograms.reduce((sum, p) => sum + Math.max(0, p.slotsRemaining || 0), 0);
      const totalSlots = matchingPrograms.reduce((sum, p) => sum + Math.max(0, p.slotsTotal || 0), 0);

      return {
        id: sec.id,
        shortLabel: sec.shortLabel,
        fullName: sec.fullName,
        youthInterested: interestedYouthSet.size,
        programCount: matchingPrograms.length,
        availableSlots,
        totalSlots
      };
    });

    const activeItems = items
      .filter(i => i.youthInterested > 0 || i.programCount > 0)
      .sort((a, b) => (b.youthInterested + b.programCount * 3) - (a.youthInterested + a.programCount * 3));

    const finalItems = activeItems.length > 0 ? activeItems.slice(0, 7) : items.slice(0, 6);

    const maxYouth = Math.max(5, ...finalItems.map(i => i.youthInterested));
    const maxSupply = Math.max(
      5,
      ...finalItems.map(i => (sectorSupplyMetric === "programs" ? i.programCount : i.availableSlots))
    );
    const maxCombined = Math.max(maxYouth, maxSupply, 5);

    return { items: finalItems, maxYouth, maxSupply, maxCombined };
  }, [youthProfiles, activePrograms, sectorSupplyMetric]);

  // SECTION 4: Recent Applicant Activity (Compact Timeline with Relative & Exact Timestamps)
  const recentApplicantActivities = useMemo(() => {
    const getTs = (item: ReferralPipelineItem): number => {
      const raw = (item as any).rawDate || item.applicationDate || item.referralDate;
      if (!raw) return 0;
      const t = new Date(raw).getTime();
      return isNaN(t) ? 0 : t;
    };

    const formatRelativeTimestamp = (ts: number, fallback: string): string => {
      if (!ts || ts <= 0) return fallback || "Recently";
      const diffMs = Date.now() - ts;
      if (diffMs < 60 * 1000) return "Just now";
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? "min" : "mins"} ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffDays < 30) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
      const diffMonths = Math.floor(diffDays / 30);
      if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
      const diffYears = Math.floor(diffDays / 365);
      return `${diffYears} ${diffYears === 1 ? "year" : "years"} ago`;
    };

    return [...allConsolidatedReferrals]
      .sort((a, b) => getTs(b) - getTs(a))
      .slice(0, recentActivityLimit)
      .map(item => {
        const ts = getTs(item);
        const fallbackDate = item.applicationDate || item.referralDate || "Recently";
        let exactDateTime = fallbackDate;
        let shortExactDate = fallbackDate;

        if (ts > 0) {
          const d = new Date(ts);
          shortExactDate = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          });
          if ((item as any).rawDate) {
            exactDateTime = `${shortExactDate} at ${d.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit"
            })}`;
          } else {
            exactDateTime = shortExactDate;
          }
        }

        const relativeTime = formatRelativeTimestamp(ts, fallbackDate);

        let activityType = "Application Submitted";
        if (item.status === "Approved") {
          activityType = "Application Approved";
        } else if (item.status === "Enrolled") {
          activityType = "Enrollment Completed";
        } else if (item.status === "Declined") {
          activityType = "Application Declined";
        } else if (item.status === "Archived") {
          activityType = "Cohort Completed";
        }

        return {
          ...item,
          activityType,
          relativeTime,
          exactDateTime,
          shortExactDate
        };
      });
  }, [allConsolidatedReferrals, recentActivityLimit]);

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
          setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
          setDashboardTab("pending");
          setPipelineStatusFilter("Pending");
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

  // Unique Barangays from active + archived referrals
  const uniqueBarangays = useMemo(() => {
    const set = new Set(
      [...activeReferrals, ...normalizedArchivedReferrals]
        .map(r => r.barangay)
        .filter(Boolean)
    );
    return Array.from(set).sort();
  }, [activeReferrals, normalizedArchivedReferrals]);

  // Unique Program options for Applicants filter dropdown
  const applicantProgramOptions = useMemo(() => {
    const set = new Set<string>();
    activePrograms.forEach(p => { if (p.title) set.add(p.title); });
    activeReferrals.forEach(r => { if (r.programTitle) set.add(r.programTitle); });
    if (dashboardTab === "archived" || pipelineStatusFilter === "Archived") {
      archivedProgramsList.forEach(p => { if (p.title) set.add(p.title); });
      normalizedArchivedReferrals.forEach(r => { if (r.programTitle) set.add(r.programTitle); });
    }
    return Array.from(set).sort();
  }, [activePrograms, activeReferrals, archivedProgramsList, normalizedArchivedReferrals, dashboardTab, pipelineStatusFilter]);

  // Parse application date helper
  const parseReferralTimestamp = (item: ReferralPipelineItem): number => {
    const raw = (item as any).rawDate || item.applicationDate || item.referralDate;
    if (!raw) return 0;
    const t = new Date(raw).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Filter and sort referrals based on search, status tab, status dropdown, program, barangay, date range, and sort column
  const filteredReferrals = useMemo(() => {
    const isArchivedMode = dashboardTab === "archived" || pipelineStatusFilter === "Archived";
    const sourceList = isArchivedMode
      ? normalizedArchivedReferrals.map(r => ({ ...r, status: "Archived" as const }))
      : activeReferrals;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const filtered = sourceList.filter(item => {
      const q = pipelineSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.youthName.toLowerCase().includes(q) ||
        item.barangay.toLowerCase().includes(q) ||
        item.purok.toLowerCase().includes(q) ||
        item.programTitle.toLowerCase().includes(q) ||
        (item.youthEmail && item.youthEmail.toLowerCase().includes(q));

      let matchesStatus = true;
      if (!isArchivedMode) {
        if (dashboardTab === "pending") matchesStatus = item.status === "Pending";
        else if (dashboardTab === "approved") matchesStatus = item.status === "Approved";
        else if (dashboardTab === "enrolled") matchesStatus = item.status === "Enrolled";
        else if (dashboardTab === "declined") matchesStatus = item.status === "Declined";

        if (matchesStatus && pipelineStatusFilter !== "All" && pipelineStatusFilter !== "Archived") {
          matchesStatus = item.status === pipelineStatusFilter;
        }
      }

      const matchesProgram = pipelineProgramFilter === "All" || item.programTitle === pipelineProgramFilter;
      const matchesBarangay = pipelineBarangayFilter === "All" || item.barangay === pipelineBarangayFilter;

      let matchesDateRange = true;
      if (pipelineDateRangeFilter !== "All") {
        const ts = parseReferralTimestamp(item);
        if (!ts) {
          matchesDateRange = false;
        } else if (pipelineDateRangeFilter === "today") {
          matchesDateRange = ts >= startOfToday;
        } else if (pipelineDateRangeFilter === "7d") {
          matchesDateRange = ts >= now.getTime() - 7 * 24 * 60 * 60 * 1000;
        } else if (pipelineDateRangeFilter === "30d") {
          matchesDateRange = ts >= now.getTime() - 30 * 24 * 60 * 60 * 1000;
        } else if (pipelineDateRangeFilter === "month") {
          matchesDateRange = ts >= startOfMonth;
        } else if (pipelineDateRangeFilter === "90d") {
          matchesDateRange = ts >= now.getTime() - 90 * 24 * 60 * 60 * 1000;
        }
      }

      return matchesSearch && matchesStatus && matchesProgram && matchesBarangay && matchesDateRange;
    });

    const statusOrder: Record<string, number> = {
      Pending: 1,
      Approved: 2,
      Enrolled: 3,
      Declined: 4,
      Archived: 5
    };

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (applicantSortCol === "applicant") {
        cmp = a.youthName.localeCompare(b.youthName);
      } else if (applicantSortCol === "program") {
        cmp = a.programTitle.localeCompare(b.programTitle);
      } else if (applicantSortCol === "matchScore") {
        cmp = (a.matchScore || 0) - (b.matchScore || 0);
      } else if (applicantSortCol === "appliedDate") {
        cmp = parseReferralTimestamp(a) - parseReferralTimestamp(b);
      } else if (applicantSortCol === "status") {
        cmp = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      }
      return applicantSortDir === "asc" ? cmp : -cmp;
    });
  }, [
    activeReferrals,
    normalizedArchivedReferrals,
    pipelineSearch,
    pipelineStatusFilter,
    pipelineProgramFilter,
    pipelineBarangayFilter,
    pipelineDateRangeFilter,
    dashboardTab,
    applicantSortCol,
    applicantSortDir
  ]);

  // Pagination for flat All Applicants Table View
  const totalApplicantTablePages = Math.ceil(filteredReferrals.length / APPLICANTS_TABLE_PER_PAGE) || 1;
  const currentApplicantTablePage = Math.min(applicantTablePage, totalApplicantTablePages);
  const paginatedFlatApplicants = useMemo(() => {
    const start = (currentApplicantTablePage - 1) * APPLICANTS_TABLE_PER_PAGE;
    return filteredReferrals.slice(start, start + APPLICANTS_TABLE_PER_PAGE);
  }, [filteredReferrals, currentApplicantTablePage]);

  const isSearchActive = pipelineSearch !== "" || pipelineStatusFilter !== "All" || pipelineProgramFilter !== "All" || pipelineBarangayFilter !== "All" || pipelineDateRangeFilter !== "All" || dashboardTab !== "all";

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

  // Extract 1-2 character initials from an applicant's full name
  const getApplicantInitials = (fullName?: string): string => {
    if (!fullName) return "?";
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
        registeredDate: item.referralDate || item.applicationDate || "",
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
                <span
                  className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide block truncate leading-tight mt-0.5 max-w-[105px] sm:max-w-[120px] xl:max-w-[135px] sidebar-brand-barangay"
                  title={isGPSAT ? "TESDA GPSAT Partner" : myInstitutionName}
                >
                  {partnerNavbarBrand}
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
                badge: undefined as number | undefined,
                onClick: () => {
                  setViewingProgramRoster(null);
                  setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
                }
              },
              {
                id: TESDAPartnerScreen.APPLICANTS,
                label: "Applicants",
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
                ),
                badge: pendingReferralsCount > 0 ? pendingReferralsCount : undefined,
                onClick: () => {
                  setViewingProgramRoster(null);
                  setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                  if (dashboardTab === "programs") setDashboardTab("all");
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
                badge: undefined as number | undefined,
                onClick: () => {
                  setViewingProgramRoster(null);
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
                badge: undefined as number | undefined,
                onClick: () => {
                  setViewingProgramRoster(null);
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
                  {currentUser?.name || repName || (isGPSAT ? "TESDA Representative" : "TVET Partner Liaison")}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5" title={currentUser?.email || repEmail || (isGPSAT ? "tesda.gpsat@gov.ph" : "tvet.partner@sikap.ph")}>
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
                {currentScreen === TESDAPartnerScreen.APPLICANTS && "Applicants"}
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
                              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group relative ${isRead ? "bg-white hover:bg-gray-50/80" : "bg-emerald-50/30 hover:bg-emerald-50/60"
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
          {/* SCREEN 1: TESDA OVERVIEW DASHBOARD                           */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.DASHBOARD && (
            <div className="space-y-6">
              {/* PAGE HEADER: Greeting Card Banner matching KK Youth & SK Official Dashboards */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                <GrowthPlantAnimation />

                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Mabuhay, {currentUser?.name || repName || "TESDA Partner"}!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Monitor training capacity, track youth application analytics, and manage technical-vocational programs across San Luis, Pampanga.
                  </p>
                </div>
              </motion.div>

              {/* Alert Banner if Programs have reached end date */}
              {completedPrograms.length > 0 && (
                <div className="bg-white border border-purple-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h4 className="text-[11px] sm:text-xs font-black text-purple-950 uppercase tracking-wider">
                          Training Term Concluded ({completedPrograms.length})
                        </h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                          Ready to Archive
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium mt-0.5 leading-relaxed">
                        {completedPrograms.length === 1 ? (
                          <>
                            <strong>&ldquo;{completedPrograms[0].title}&rdquo;</strong> has concluded its training schedule. Archive the term to certify graduates.
                          </>
                        ) : (
                          <>
                            {completedPrograms.length} training programs have concluded their schedules and are ready for cohort graduation verification.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-gray-100 md:border-t-0">
                    {completedPrograms.map(prog => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => setProgramToArchive(prog)}
                        className="w-full sm:w-auto px-3.5 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Archive className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[220px]">
                          Archive {completedPrograms.length > 1 ? prog.title : "Term & Enrollees"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* 1. DASHBOARD STATISTICS CARDS (5 COMPACT CARDS)               */}
              {/* ============================================================ */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* Card 1: Total Applications */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                    setDashboardTab("all");
                    setPipelineStatusFilter("All");
                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="col-span-2 sm:col-span-1 text-left rounded-2xl p-4 sm:p-5 shadow-[0_10px_28px_-6px_rgba(4,26,19,0.28)] hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                  style={{
                    background: "linear-gradient(to right, #041A13 0%, #082D21 45%, #106348 100%)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white/95 leading-snug">
                      Total Applications
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-tight my-1.5 tabular-nums">
                    {totalApplicationsCount}
                  </div>
                  <p className="text-[11px] text-emerald-100/85 font-medium truncate">
                    {uniqueApplicantYouthCount} unique youth applicant{uniqueApplicantYouthCount !== 1 ? "s" : ""}
                  </p>
                </button>

                {/* Card 2: Pending Review */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                    setDashboardTab("pending");
                    setPipelineStatusFilter("Pending");
                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100 hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-[#0A6B43] transition-colors leading-snug">
                      Pending Review
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight my-1.5 tabular-nums">
                    {pendingReferralsCount}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    {pendingReferralsCount > 0 ? "Awaiting TESDA decision →" : "All applications reviewed"}
                  </p>
                </button>

                {/* Card 3: Approved Applications */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                    setDashboardTab("approved");
                    setPipelineStatusFilter("Approved");
                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100 hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-[#0A6B43] transition-colors leading-snug">
                      Approved Applications
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight my-1.5 tabular-nums">
                    {approvedReferralsCount}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    Approved for cohort admission
                  </p>
                </button>

                {/* Card 4: Enrolled Trainees */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                    setDashboardTab("enrolled");
                    setPipelineStatusFilter("Enrolled");
                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100 hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-[#0A6B43] transition-colors leading-snug">
                      Enrolled Trainees
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#0A6B43] shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight my-1.5 tabular-nums">
                    {enrolledReferralsCount}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    {uniqueEnrolledYouthCount} unique active trainee{uniqueEnrolledYouthCount !== 1 ? "s" : ""}
                  </p>
                </button>

                {/* Card 5: Active Training Programs */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                    setViewingArchivedPrograms(false);
                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-left bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100 hover:border-emerald-200 hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-[#0A6B43] transition-colors leading-snug">
                      Active Programs
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#0A6B43] shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight my-1.5 tabular-nums">
                    {activePrograms.length}
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium truncate">
                    {totalSlotsRemaining} of {totalSlotsAllocated} slots available
                  </p>
                </button>
              </div>

              {/* ============================================================ */}
              {/* 2. QUICK ACTIONS SECTION                                      */}
              {/* ============================================================ */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900 tracking-tight">
                      Quick Actions
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Direct shortcuts to common TESDA applicant and training program management tasks
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
                  {/* Action 1: Manage Applicants */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                      setDashboardTab("all");
                      setPipelineStatusFilter("All");
                      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all flex items-start gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0A6B43] group-hover:bg-[#0A6B43] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                          Manage Applicants
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A6B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                        View and filter all applications
                      </p>
                    </div>
                  </button>

                  {/* Action 2: Manage Programs */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                      setViewingArchivedPrograms(false);
                      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all flex items-start gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0A6B43] group-hover:bg-[#0A6B43] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                          Manage Programs
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A6B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                        Update courses and schedules
                      </p>
                    </div>
                  </button>

                  {/* Action 3: Review Pending Applications */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                      setDashboardTab("pending");
                      setPipelineStatusFilter("Pending");
                      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all flex items-start gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 group-hover:bg-[#0A6B43] group-hover:border-[#0A6B43] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                          Review Pending
                        </span>
                        {pendingReferralsCount > 0 ? (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                            {pendingReferralsCount}
                          </span>
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A6B43] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                        Process awaiting decisions
                      </p>
                    </div>
                  </button>

                  {/* Action 4: Add Training Program */}
                  <button
                    type="button"
                    onClick={handleNewProgramClick}
                    className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all flex items-start gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0A6B43] group-hover:bg-[#0A6B43] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                          Add Training Program
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A6B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                        Publish a new TVET course
                      </p>
                    </div>
                  </button>

                  {/* Action 5: View Analytics */}
                  <button
                    type="button"
                    onClick={() => {
                      document.getElementById("tesda-dashboard-analytics")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="p-3.5 rounded-xl border border-gray-200/80 bg-gray-50/50 hover:bg-emerald-50/50 hover:border-emerald-300 text-left transition-all flex items-start gap-3 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/20"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#0A6B43] group-hover:bg-[#0A6B43] group-hover:text-white transition-colors flex items-center justify-center shrink-0 mt-0.5">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                          View Analytics
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0A6B43] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                        Explore demand & sector insights
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ============================================================ */}
              {/* 3. DASHBOARD ANALYTICS (5 DECISION-SUPPORT CHARTS)            */}
              {/* ============================================================ */}
              <div id="tesda-dashboard-analytics" className="space-y-5 sm:space-y-6 scroll-mt-20">
                {/* Analytics Row 1: Application Status Distribution (Donut) + Application Trends (Line Chart) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                  {/* CHART 1 (5 cols): Application Status Distribution Donut Chart */}
                  <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="flex flex-col flex-1">
                      <div className="pb-3 border-b border-gray-100 flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            Application Status Distribution
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Breakdown of Pending, Approved, Enrolled, Declined, and Archived records
                          </p>
                        </div>
                      </div>

                      {statusDistributionData.total === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2 min-h-[220px]">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <Users className="w-6 h-6" />
                          </div>
                          <h5 className="text-sm font-bold text-gray-800">No Application Records Yet</h5>
                          <p className="text-xs text-gray-400 max-w-xs font-medium">
                            Status distribution will appear once youth applications are submitted.
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6 py-5 flex-1">
                          {/* Donut SVG */}
                          <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0 flex items-center justify-center">
                            {(() => {
                              const R = 44;
                              const C = 2 * Math.PI * R;
                              const total = statusDistributionData.total || 1;
                              let accumulated = 0;

                              return (
                                <svg className="w-36 h-36 sm:w-40 sm:h-40 -rotate-90 transform" viewBox="0 0 120 120">
                                  <circle cx="60" cy="60" r={R} fill="none" stroke="#F1F5F9" strokeWidth="16" />
                                  {statusDistributionData.slices.map((s, idx) => {
                                    if (s.count <= 0) return null;
                                    const sliceLen = (s.count / total) * C;
                                    const strokeDash = `${sliceLen} ${C - sliceLen}`;
                                    const offset = -accumulated;
                                    accumulated += sliceLen;
                                    const isHovered = hoveredStatusSlice === idx;

                                    return (
                                      <circle
                                        key={s.label}
                                        cx="60"
                                        cy="60"
                                        r={R}
                                        fill="none"
                                        stroke={s.color}
                                        strokeWidth={isHovered ? 20 : 16}
                                        strokeDasharray={strokeDash}
                                        strokeDashoffset={offset}
                                        style={{
                                          transition: "stroke-dasharray 0.6s cubic-bezier(0.22, 1, 0.36, 1), stroke-width 0.2s ease"
                                        }}
                                        className="cursor-pointer"
                                        onMouseEnter={() => setHoveredStatusSlice(idx)}
                                        onMouseLeave={() => setHoveredStatusSlice(null)}
                                        onClick={() => {
                                          setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                                          setDashboardTab(s.tab);
                                          setPipelineStatusFilter(s.filter === "Archived" ? "All" : s.filter);
                                          if (s.tab === "archived") fetchArchivedData();
                                          document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                      />
                                    );
                                  })}
                                </svg>
                              );
                            })()}

                            {/* Center Text */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
                              {hoveredStatusSlice !== null && statusDistributionData.slices[hoveredStatusSlice] ? (
                                <div className="animate-in fade-in duration-150">
                                  <span
                                    className="text-lg font-black leading-none block tabular-nums"
                                    style={{ color: statusDistributionData.slices[hoveredStatusSlice].color }}
                                  >
                                    {statusDistributionData.slices[hoveredStatusSlice].pct}%
                                  </span>
                                  <span className="text-[11px] font-bold text-gray-800 mt-1 block">
                                    {statusDistributionData.slices[hoveredStatusSlice].count} {statusDistributionData.slices[hoveredStatusSlice].label}
                                  </span>
                                </div>
                              ) : (
                                <div>
                                  <span className="text-2xl font-black text-gray-900 leading-none block tabular-nums">
                                    {statusDistributionData.total}
                                  </span>
                                  <span className="text-[10px] text-gray-500 font-semibold mt-1 block uppercase tracking-wider">
                                    Applications
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Interactive Legend */}
                          <div className="space-y-1.5 w-full sm:w-auto min-w-[175px]">
                            {statusDistributionData.slices.map((s, idx) => {
                              const isHovered = hoveredStatusSlice === idx;
                              return (
                                <button
                                  key={s.label}
                                  type="button"
                                  onMouseEnter={() => setHoveredStatusSlice(idx)}
                                  onMouseLeave={() => setHoveredStatusSlice(null)}
                                  onClick={() => {
                                    setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                                    setDashboardTab(s.tab);
                                    setPipelineStatusFilter(s.filter === "Archived" ? "All" : s.filter);
                                    if (s.tab === "archived") fetchArchivedData();
                                    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className={`w-full flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-xl transition-all cursor-pointer text-left ${isHovered ? "bg-gray-100 scale-[1.01]" : "hover:bg-gray-50"
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0"
                                      style={{ backgroundColor: s.color }}
                                    />
                                    <span className={`text-xs ${isHovered ? "font-bold text-gray-950" : "font-medium text-gray-700"}`}>
                                      {s.label}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-gray-900 tabular-nums">
                                    {s.count} <span className="text-gray-400 font-normal">({s.pct}%)</span>
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span>Click any status segment to filter applicants</span>
                      <span className="font-semibold text-gray-700">{uniqueApplicantYouthCount} unique youth</span>
                    </div>
                  </div>

                  {/* CHART 3 (7 cols): Application Trends Over Time (Line Chart with Weekly / Monthly Filters) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            Application Trends
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Application submission volume over time from official timestamps
                          </p>
                        </div>

                        {/* Weekly / 6M / 12M Time Range Filter */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setTrendTimeframe("weekly");
                              setHoveredTrendIdx(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${trendTimeframe === "weekly" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            Weekly
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTrendTimeframe("6m");
                              setHoveredTrendIdx(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${trendTimeframe === "6m" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            6 Months
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTrendTimeframe("12m");
                              setHoveredTrendIdx(null);
                            }}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${trendTimeframe === "12m" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            12 Months
                          </button>
                        </div>
                      </div>

                      {/* SVG Line Chart */}
                      <div className="pt-2 flex-1 flex flex-col justify-end">
                        {(() => {
                          const buckets = applicationTrendsData.buckets;
                          const maxVal = applicationTrendsData.maxCount;
                          const n = buckets.length;
                          const W = 560;
                          const H = 165;
                          const padX = 24;
                          const padTop = 22;
                          const padBottom = 18;
                          const usableW = W - padX * 2;
                          const usableH = H - padTop - padBottom;

                          const coords = buckets.map((b, idx) => {
                            const x = n > 1 ? padX + (idx / (n - 1)) * usableW : W / 2;
                            const y = padTop + usableH - (b.count / Math.max(1, maxVal)) * usableH;
                            return { x, y, ...b, idx };
                          });

                          const polylinePoints = coords.map(c => `${c.x},${c.y}`).join(" ");
                          const areaPath = coords.length > 0
                            ? `M ${coords[0].x},${padTop + usableH} ` +
                            coords.map(c => `L ${c.x},${c.y}`).join(" ") +
                            ` L ${coords[coords.length - 1].x},${padTop + usableH} Z`
                            : "";

                          return (
                            <div className="relative w-full">
                              {/* Hover Tooltip */}
                              {hoveredTrendIdx !== null && coords[hoveredTrendIdx] && (
                                <div className="absolute -top-2 right-2 z-20 bg-gray-900 text-white px-3 py-1.5 rounded-xl shadow-lg text-[11px] font-bold flex items-center gap-2 pointer-events-none animate-in fade-in duration-150">
                                  <span className="text-emerald-300">{coords[hoveredTrendIdx].fullLabel}:</span>
                                  <span>{coords[hoveredTrendIdx].count} application{coords[hoveredTrendIdx].count !== 1 ? "s" : ""}</span>
                                  <span className="text-gray-400 font-medium">({coords[hoveredTrendIdx].uniqueYouth} unique youth)</span>
                                </div>
                              )}

                              <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-44 sm:h-48 overflow-visible">
                                <defs>
                                  <linearGradient id="tesdaTrendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#0A6B43" stopOpacity="0.22" />
                                    <stop offset="100%" stopColor="#0A6B43" stopOpacity="0.0" />
                                  </linearGradient>
                                </defs>

                                {/* Horizontal Grid Lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((ratio, gIdx) => {
                                  const y = padTop + ratio * usableH;
                                  const val = Math.round(maxVal * (1 - ratio));
                                  return (
                                    <g key={gIdx}>
                                      <line
                                        x1={padX}
                                        y1={y}
                                        x2={W - padX}
                                        y2={y}
                                        stroke={ratio === 1 ? "#CBD5E1" : "#F1F5F9"}
                                        strokeWidth="1"
                                      />
                                      <text
                                        x={padX - 6}
                                        y={y + 3}
                                        textAnchor="end"
                                        className="text-[9px] fill-gray-400 font-semibold"
                                      >
                                        {val}
                                      </text>
                                    </g>
                                  );
                                })}

                                {/* Shaded Area */}
                                {areaPath && <path d={areaPath} fill="url(#tesdaTrendAreaGrad)" />}

                                {/* Trend Line */}
                                {coords.length > 1 && (
                                  <polyline
                                    fill="none"
                                    stroke="#0A6B43"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    points={polylinePoints}
                                  />
                                )}

                                {/* Interactive Data Points */}
                                {coords.map((c) => {
                                  const isHovered = hoveredTrendIdx === c.idx;
                                  return (
                                    <g
                                      key={c.key}
                                      className="cursor-pointer"
                                      onMouseEnter={() => setHoveredTrendIdx(c.idx)}
                                      onMouseLeave={() => setHoveredTrendIdx(null)}
                                    >
                                      <circle cx={c.x} cy={c.y} r={14} fill="transparent" />
                                      <circle
                                        cx={c.x}
                                        cy={c.y}
                                        r={isHovered ? 5.5 : 4}
                                        fill={isHovered ? "#0A6B43" : "#FFFFFF"}
                                        stroke="#0A6B43"
                                        strokeWidth={isHovered ? 3 : 2.2}
                                      />
                                      {c.count > 0 && (
                                        <text
                                          x={c.x}
                                          y={c.y - 9}
                                          textAnchor="middle"
                                          className={`text-[10px] font-bold ${isHovered ? "fill-[#0A6B43] font-black" : "fill-gray-600"}`}
                                        >
                                          {c.count}
                                        </text>
                                      )}
                                    </g>
                                  );
                                })}
                              </svg>

                              {/* X-Axis Labels */}
                              <div className="flex items-center justify-between px-4 pt-1 border-t border-gray-100">
                                {buckets.map((b, idx) => (
                                  <span
                                    key={b.key}
                                    onMouseEnter={() => setHoveredTrendIdx(idx)}
                                    onMouseLeave={() => setHoveredTrendIdx(null)}
                                    className={`text-[10px] font-bold truncate cursor-pointer transition-colors ${hoveredTrendIdx === idx ? "text-[#0A6B43] font-black" : "text-gray-500"
                                      }`}
                                  >
                                    {b.label}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-3">
                      <span>
                        Total in selected range: <strong className="text-gray-900">{applicationTrendsData.totalInPeriod} application{applicationTrendsData.totalInPeriod !== 1 ? "s" : ""}</strong>
                      </span>
                      <span className="text-gray-400">
                        {trendTimeframe === "weekly" ? "Last 8 weeks" : trendTimeframe === "12m" ? "Last 12 months" : "Last 6 months"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Analytics Row 2: Program Demand vs. Available Slots + Youth Interests vs. Training Supply */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                  {/* CHART 2 (6 cols): Program Demand vs. Available Slots (Horizontal Bar Chart) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="space-y-4 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            Program Demand vs. Available Slots
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Comparing active applicant demand against remaining slot capacity per program
                          </p>
                        </div>

                        {/* Sort Selector */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => setProgramDemandSort("demand")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${programDemandSort === "demand" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            By Demand
                          </button>
                          <button
                            type="button"
                            onClick={() => setProgramDemandSort("slots")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${programDemandSort === "slots" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            Low Slots
                          </button>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#0A6B43] shrink-0" />
                          <span>Applicant Demand (Pending/Approved/Enrolled)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] shrink-0" />
                          <span>Available Slots</span>
                        </div>
                      </div>

                      {programDemandData.items.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                          <BookOpen className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-sm font-bold text-gray-800">No Active Training Programs</p>
                          <p className="text-xs text-gray-400">Add a training program to compare applicant demand and capacity.</p>
                        </div>
                      ) : (
                        <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1 custom-scrollbar">
                          {programDemandData.items.map(prog => {
                            const demandPct = Math.min(100, Math.round((prog.demand / programDemandData.maxScale) * 100));
                            const slotsPct = Math.min(100, Math.round((prog.slotsRemaining / programDemandData.maxScale) * 100));

                            return (
                              <div
                                key={prog.id}
                                onClick={() => {
                                  setPipelineProgramFilter(prog.title);
                                  setDashboardTab("all");
                                  setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                                  document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className="p-3 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all cursor-pointer space-y-2 group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-bold text-gray-900 group-hover:text-[#0A6B43] truncate" title={prog.title}>
                                    {prog.title}
                                  </span>
                                  <span className="text-[11px] font-semibold text-gray-500 shrink-0 tabular-nums">
                                    {prog.demand} applicant{prog.demand !== 1 ? "s" : ""} · {prog.slotsRemaining}/{prog.slotsTotal} open
                                  </span>
                                </div>

                                {/* Horizontal Bar 1: Applicant Demand */}
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-[10px] font-bold text-gray-500 shrink-0">Demand</span>
                                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#0A6B43] rounded-full transition-all duration-500"
                                      style={{ width: `${prog.demand > 0 ? Math.max(4, demandPct) : 0}%` }}
                                    />
                                  </div>
                                  <span className="w-7 text-right text-[11px] font-extrabold text-[#0A6B43] tabular-nums">
                                    {prog.demand}
                                  </span>
                                </div>

                                {/* Horizontal Bar 2: Available Slots */}
                                <div className="flex items-center gap-2">
                                  <span className="w-16 text-[10px] font-bold text-gray-500 shrink-0">Open Slots</span>
                                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${prog.slotsRemaining === 0 ? "bg-red-500" : "bg-[#3B82F6]"
                                        }`}
                                      style={{ width: `${prog.slotsRemaining > 0 ? Math.max(4, slotsPct) : 0}%` }}
                                    />
                                  </div>
                                  <span className="w-7 text-right text-[11px] font-extrabold text-blue-700 tabular-nums">
                                    {prog.slotsRemaining}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-3">
                      <span>Click a program to view its applicants</span>
                      <span className="font-semibold text-gray-700">{activePrograms.length} active programs</span>
                    </div>
                  </div>

                  {/* CHART 5 (6 cols): Youth Interests vs. Training Supply (Grouped Bar Chart) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            Youth Interests vs. Training Supply
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Comparing unique youth interest by sector against available TESDA training supply
                          </p>
                        </div>

                        {/* Supply Metric Toggle */}
                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => setSectorSupplyMetric("slots")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${sectorSupplyMetric === "slots" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            Open Slots
                          </button>
                          <button
                            type="button"
                            onClick={() => setSectorSupplyMetric("programs")}
                            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${sectorSupplyMetric === "programs" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                              }`}
                          >
                            Programs
                          </button>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#0A6B43] shrink-0" />
                            <span>Unique Interested Youth</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shrink-0" />
                            <span>{sectorSupplyMetric === "programs" ? "Active TESDA Programs" : "Available Training Slots"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Grouped Vertical Bar Chart */}
                      <div className="pt-4 pb-1 flex-1 flex flex-col justify-end relative">
                        {hoveredSectorIdx !== null && sectorInterestVsSupplyData.items[hoveredSectorIdx] && (() => {
                          const sec = sectorInterestVsSupplyData.items[hoveredSectorIdx];
                          return (
                            <div className="absolute -top-1 right-1 z-20 bg-gray-900 text-white px-3 py-2 rounded-xl shadow-lg text-[11px] pointer-events-none animate-in fade-in duration-150">
                              <p className="font-extrabold text-emerald-300">{sec.fullName}</p>
                              <div className="flex items-center gap-3 mt-1 font-semibold">
                                <span>Interested Youth: <strong>{sec.youthInterested}</strong></span>
                                <span>·</span>
                                <span>Programs: <strong>{sec.programCount}</strong> ({sec.availableSlots} open slots)</span>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="h-48 w-full flex items-end justify-between gap-2 sm:gap-3 px-2 pb-2 border-b border-gray-200 relative">
                          {/* Subtle horizontal guide lines */}
                          <div className="absolute inset-x-2 inset-y-0 flex flex-col justify-between pointer-events-none pb-2">
                            <div className="border-b border-gray-100 w-full" />
                            <div className="border-b border-gray-100 w-full" />
                            <div className="border-b border-gray-100 w-full" />
                            <div className="border-b border-gray-100 w-full" />
                          </div>

                          {sectorInterestVsSupplyData.items.map((sec, idx) => {
                            const supplyVal = sectorSupplyMetric === "programs" ? sec.programCount : sec.availableSlots;
                            const youthPct = sec.youthInterested > 0
                              ? Math.max(8, Math.round((sec.youthInterested / sectorInterestVsSupplyData.maxCombined) * 100))
                              : 3;
                            const supplyPct = supplyVal > 0
                              ? Math.max(8, Math.round((supplyVal / sectorInterestVsSupplyData.maxCombined) * 100))
                              : 3;
                            const isHovered = hoveredSectorIdx === idx;

                            return (
                              <div
                                key={sec.id}
                                onMouseEnter={() => setHoveredSectorIdx(idx)}
                                onMouseLeave={() => setHoveredSectorIdx(null)}
                                className="flex-1 min-w-0 h-full flex flex-col items-center justify-end cursor-pointer relative z-10 group"
                              >
                                <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                                  {/* Bar 1: Interested Youth */}
                                  <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[18px]">
                                    <span className="text-[9px] font-bold text-gray-600 mb-0.5 tabular-nums">
                                      {sec.youthInterested}
                                    </span>
                                    <div
                                      style={{ height: `${youthPct}%` }}
                                      className={`w-full rounded-t-md transition-all duration-500 ${sec.youthInterested > 0 ? "bg-[#0A6B43]" : "bg-gray-200"
                                        } ${isHovered ? "ring-2 ring-emerald-500/30" : ""}`}
                                    />
                                  </div>

                                  {/* Bar 2: Training Supply */}
                                  <div className="flex flex-col items-center justify-end h-full flex-1 max-w-[18px]">
                                    <span className="text-[9px] font-bold text-amber-700 mb-0.5 tabular-nums">
                                      {supplyVal}
                                    </span>
                                    <div
                                      style={{ height: `${supplyPct}%` }}
                                      className={`w-full rounded-t-md transition-all duration-500 ${supplyVal > 0 ? "bg-[#F59E0B]" : "bg-gray-200"
                                        } ${isHovered ? "ring-2 ring-amber-400/40" : ""}`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* X-Axis Sector Labels */}
                        <div className="flex items-center justify-between gap-1.5 px-2 pt-2">
                          {sectorInterestVsSupplyData.items.map((sec, idx) => (
                            <span
                              key={sec.id}
                              onMouseEnter={() => setHoveredSectorIdx(idx)}
                              onMouseLeave={() => setHoveredSectorIdx(null)}
                              className={`flex-1 min-w-0 text-center text-[10px] font-bold truncate cursor-pointer transition-colors ${hoveredSectorIdx === idx ? "text-[#0A6B43] font-black" : "text-gray-500"
                                }`}
                              title={sec.fullName}
                            >
                              {sec.shortLabel}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 mt-3">
                      <span>Deduplicated unique youth per vocational sector</span>
                      <span className="font-semibold text-gray-700">{youthProfiles.length} registered youth profiles</span>
                    </div>
                  </div>
                </div>

                {/* Bottom 50/50 Row: Applications by Barangay (Top 6) + Recent Applicant Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                  {/* LEFT COLUMN (6 cols / 50%): Applications by Barangay (Top 6 Vertical Bar Chart) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="space-y-4 flex-1 flex flex-col justify-between">
                      {/* Card Header & Toggles */}
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                              Applications by Barangay
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#0A6B43] border border-emerald-200/80">
                              Top {Math.min(6, Math.max(1, barangayApplicationsData.items.length))}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Top 6 barangays by application volume ({barangayChartMode === "active"
                              ? `from ${barangayApplicationsData.activeBarangayCount} active barangay${barangayApplicationsData.activeBarangayCount !== 1 ? "s" : ""}`
                              : `across all ${barangayApplicationsData.totalBarangays} barangays`})
                          </p>
                        </div>

                        {/* Controls: Metric (Applications vs Unique Youth) + Scope (All 17 vs Active) */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setBarangayCountMetric("applications");
                                setHoveredBarangayIdx(null);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${barangayCountMetric === "applications" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                              Applications
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBarangayCountMetric("uniqueYouth");
                                setHoveredBarangayIdx(null);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${barangayCountMetric === "uniqueYouth" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                              Unique Youth
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setBarangayChartMode("all");
                                setHoveredBarangayIdx(null);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${barangayChartMode === "all" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                                }`}
                              title="Rank top 6 across all 17 barangays of San Luis"
                            >
                              All 17 Barangays
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBarangayChartMode("active");
                                setHoveredBarangayIdx(null);
                              }}
                              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${barangayChartMode === "active" ? "bg-white text-[#0A6B43] shadow-xs" : "text-gray-500 hover:text-gray-800"
                                }`}
                              title="Rank top 6 among barangays with active applications"
                            >
                              Active Only
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Vertical Column Chart Body */}
                      {barangayApplicationsData.items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2 min-h-[240px]">
                          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0A6B43]">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-extrabold text-gray-900">No Barangay Applications Yet</h4>
                          <p className="text-xs text-gray-500 max-w-xs font-medium">
                            Top barangays will appear here once youth applications are submitted.
                          </p>
                        </div>
                      ) : (
                        (() => {
                          const rawMax = barangayApplicationsData.maxVal;
                          const yMax = rawMax <= 4 ? 4 : Math.ceil(rawMax / 4) * 4;
                          const yTicks = [yMax, Math.round(yMax * 0.75), Math.round(yMax * 0.5), Math.round(yMax * 0.25), 0];
                          const totalPool = barangayCountMetric === "uniqueYouth"
                            ? Math.max(1, uniqueApplicantYouthCount)
                            : Math.max(1, totalApplicationsCount);

                          const formatShortBarangay = (name: string) =>
                            name
                              .replace(/^Santa Cruz Pambilog$/i, "Sta. Cruz Pam.")
                              .replace(/^Santa Cruz Poblacion$/i, "Sta. Cruz Pob.")
                              .replace(/^Santa\s+/i, "Sta. ")
                              .replace(/^Santo\s+/i, "Sto. ");

                          return (
                            <div className="pt-2 pb-1 flex-1 flex flex-col justify-end relative">
                              {/* Floating Tooltip on Hover */}
                              {hoveredBarangayIdx !== null && barangayApplicationsData.items[hoveredBarangayIdx] && (() => {
                                const hoveredItem = barangayApplicationsData.items[hoveredBarangayIdx];
                                const hoveredVal = barangayCountMetric === "uniqueYouth"
                                  ? hoveredItem.uniqueYouth
                                  : hoveredItem.applications;
                                const hoveredPct = hoveredVal > 0 ? Math.round((hoveredVal / totalPool) * 100) : 0;
                                const totalAppsPct = hoveredItem.applications > 0
                                  ? Math.round((hoveredItem.applications / Math.max(1, totalApplicationsCount)) * 100)
                                  : 0;

                                return (
                                  <div className="absolute -top-1 right-1 z-20 bg-gray-900 text-white px-3 py-1.5 rounded-xl shadow-lg text-[11px] pointer-events-none flex flex-wrap items-center gap-x-2 gap-y-0.5 animate-in fade-in duration-150">
                                    <span className="font-extrabold text-emerald-300">
                                      Brgy. {hoveredItem.barangay}
                                    </span>
                                    <span className="text-gray-400">·</span>
                                    <span className="font-bold">
                                      {barangayCountMetric === "uniqueYouth"
                                        ? `${hoveredItem.uniqueYouth} unique youth (${hoveredItem.applications} app${hoveredItem.applications !== 1 ? "s" : ""})`
                                        : `${hoveredItem.applications} application${hoveredItem.applications !== 1 ? "s" : ""}`}
                                    </span>
                                    <span className="text-gray-400">·</span>
                                    <span className="text-emerald-200 font-semibold">
                                      {barangayCountMetric === "uniqueYouth"
                                        ? `${hoveredPct}% of youth`
                                        : `${totalAppsPct}% of total`}
                                    </span>
                                  </div>
                                );
                              })()}

                              {/* Main Plot Area: Y-Axis + Up to 6 Vertical Columns */}
                              <div className="flex items-stretch pt-5">
                                {/* Y-Axis Labels */}
                                <div className="w-7 pr-2 h-52 flex flex-col justify-between text-right select-none shrink-0">
                                  {yTicks.map((tick, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="text-[10px] font-bold text-gray-400 leading-none tabular-nums -translate-y-1"
                                    >
                                      {tick}
                                    </span>
                                  ))}
                                </div>

                                {/* Columns & Horizontal Grid Lines */}
                                <div className="flex-1 min-w-0">
                                  <div className="relative h-52 border-l border-b border-gray-200 flex items-end justify-around gap-2 sm:gap-3 px-2 sm:px-4">
                                    {/* Horizontal Grid Lines */}
                                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                      {yTicks.map((_, gIdx) => (
                                        <div
                                          key={gIdx}
                                          className={`w-full ${gIdx === yTicks.length - 1 ? "" : "border-t border-dashed border-gray-100"
                                            }`}
                                        />
                                      ))}
                                    </div>

                                    {/* Top 6 Vertical Barangay Bars */}
                                    {barangayApplicationsData.items.map((item, idx) => {
                                      const val = barangayCountMetric === "uniqueYouth" ? item.uniqueYouth : item.applications;
                                      const pctOfTotal = val > 0 ? Math.round((val / totalPool) * 100) : 0;
                                      const barHeightPct = val > 0
                                        ? Math.max(10, Math.round((val / yMax) * 100))
                                        : 4;
                                      const isHovered = hoveredBarangayIdx === idx;
                                      const tooltipText = `Brgy. ${item.barangay}: ${val} ${barangayCountMetric === "uniqueYouth" ? "unique youth" : (val === 1 ? "application" : "applications")
                                        } (${pctOfTotal}% of total)`;

                                      return (
                                        <button
                                          key={item.barangay}
                                          type="button"
                                          title={tooltipText}
                                          onMouseEnter={() => setHoveredBarangayIdx(idx)}
                                          onMouseLeave={() => setHoveredBarangayIdx(null)}
                                          onFocus={() => setHoveredBarangayIdx(idx)}
                                          onBlur={() => setHoveredBarangayIdx(null)}
                                          onClick={() => {
                                            setPipelineBarangayFilter(item.barangay);
                                            setDashboardTab("all");
                                            setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                                            document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                                          }}
                                          className="flex-1 max-w-[68px] h-full flex flex-col items-center justify-end group relative z-10 cursor-pointer focus:outline-none"
                                        >
                                          {/* Application Count Above Bar */}
                                          <span
                                            className={`text-xs font-extrabold mb-1.5 tabular-nums transition-transform ${isHovered
                                                ? "text-[#0A6B43] scale-110"
                                                : "text-gray-800"
                                              }`}
                                          >
                                            {val}
                                          </span>

                                          {/* Vertical Green Bar */}
                                          <div
                                            style={{ height: `${barHeightPct}%` }}
                                            className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 ${isHovered
                                                ? "bg-emerald-600 ring-4 ring-emerald-500/20 shadow-xs"
                                                : "bg-[#0A6B43] group-hover:bg-emerald-600"
                                              }`}
                                          />
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* X-Axis Barangay Labels */}
                                  <div className="flex items-start justify-around gap-2 sm:gap-3 px-2 sm:px-4 pt-2.5">
                                    {barangayApplicationsData.items.map((item, idx) => {
                                      const val = barangayCountMetric === "uniqueYouth" ? item.uniqueYouth : item.applications;
                                      const pctOfTotal = val > 0 ? Math.round((val / totalPool) * 100) : 0;
                                      const isHovered = hoveredBarangayIdx === idx;
                                      const shortName = formatShortBarangay(item.barangay);

                                      return (
                                        <button
                                          key={item.barangay}
                                          type="button"
                                          onMouseEnter={() => setHoveredBarangayIdx(idx)}
                                          onMouseLeave={() => setHoveredBarangayIdx(null)}
                                          onClick={() => {
                                            setPipelineBarangayFilter(item.barangay);
                                            setDashboardTab("all");
                                            setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                                            document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                                          }}
                                          title={`Brgy. ${item.barangay}: ${val} ${barangayCountMetric === "uniqueYouth" ? "unique youth" : (val === 1 ? "application" : "applications")
                                            } (${pctOfTotal}% of total)`}
                                          className="flex-1 max-w-[68px] text-center cursor-pointer focus:outline-none"
                                        >
                                          <span
                                            className={`block text-[10px] sm:text-[11px] leading-tight truncate transition-colors ${isHovered
                                                ? "font-black text-[#0A6B43]"
                                                : "font-bold text-gray-700 hover:text-[#0A6B43]"
                                              }`}
                                          >
                                            {shortName}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-500 mt-3">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#0A6B43] shrink-0" />
                        <span>
                          Showing top {barangayApplicationsData.items.length} of{" "}
                          {barangayChartMode === "active"
                            ? `${barangayApplicationsData.activeBarangayCount} active barangays`
                            : `${barangayApplicationsData.totalBarangays} barangays`}
                        </span>
                      </span>
                      <span className="text-gray-400 truncate">Click a bar to filter applicants</span>
                    </div>
                  </div>

                  {/* RIGHT COLUMN (6 cols / 50%): Recent Applicant Activity (Compact Timeline Feed) */}
                  <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100/90 flex flex-col justify-between h-full">
                    <div className="space-y-4 flex-1 flex flex-col">
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-base sm:text-lg tracking-tight">
                            Recent Applicant Activity
                          </h3>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Latest application events and status updates across training programs
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                            setDashboardTab("all");
                            setPipelineStatusFilter("All");
                            document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-[#0A6B43] text-[#0A6B43] hover:text-white border border-emerald-200/80 hover:border-[#0A6B43] text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>View All Applicants</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Compact Vertical Activity Timeline (Latest 5) */}
                      {recentApplicantActivities.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2 min-h-[240px]">
                          <div className="w-11 h-11 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43]">
                            <Clock className="w-5 h-5" />
                          </div>
                          <h4 className="text-sm font-extrabold text-gray-900">No Recent Applicant Activity</h4>
                          <p className="text-xs text-gray-500 max-w-xs font-medium">
                            Application events for your TESDA training programs will appear here automatically.
                          </p>
                        </div>
                      ) : (
                        <div className="relative flex-1 flex flex-col justify-between py-1">
                          {/* Subtle Vertical Timeline Connecting Line */}
                          {recentApplicantActivities.length > 1 && (
                            <div
                              className="absolute left-[25px] top-5 bottom-5 w-px bg-gray-200/90 pointer-events-none"
                              aria-hidden="true"
                            />
                          )}

                          <div className="space-y-2.5">
                            {recentApplicantActivities.slice(0, 5).map((item) => {
                              const isEnrolled = item.status === "Enrolled";
                              const isApproved = item.status === "Approved";
                              const isPending = item.status === "Pending";
                              const isArchived = item.status === "Archived";

                              return (
                                <div
                                  key={item.id}
                                  onClick={() => openApplicantModal(item)}
                                  className="relative flex items-start gap-3 p-2.5 rounded-xl hover:bg-emerald-50/40 border border-transparent hover:border-emerald-200/70 transition-all cursor-pointer group"
                                >
                                  {/* Contextual Timeline Node Icon */}
                                  <div
                                    className={`relative z-10 w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${isEnrolled
                                        ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                        : isApproved
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : isPending
                                            ? "bg-amber-50 text-amber-700 border-amber-200"
                                            : isArchived
                                              ? "bg-slate-100 text-slate-700 border-slate-200"
                                              : "bg-red-50 text-red-600 border-red-200"
                                      }`}
                                  >
                                    {isEnrolled ? (
                                      <CheckCircle2 className="w-4 h-4" />
                                    ) : isApproved ? (
                                      <UserCheck className="w-4 h-4" />
                                    ) : isPending ? (
                                      <FileText className="w-4 h-4" />
                                    ) : isArchived ? (
                                      <Archive className="w-4 h-4" />
                                    ) : (
                                      <X className="w-4 h-4" />
                                    )}
                                  </div>

                                  {/* Compact Content Hierarchy */}
                                  <div className="min-w-0 flex-1">
                                    {/* Top Row: Prominent Activity Type + Subtle Status Badge + Relative Timestamp */}
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate">
                                          {item.activityType}
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${isEnrolled
                                              ? "bg-emerald-50/90 text-[#0A6B43] border-emerald-200"
                                              : isApproved
                                                ? "bg-blue-50/90 text-blue-700 border-blue-200"
                                                : isPending
                                                  ? "bg-amber-50/90 text-amber-800 border-amber-200"
                                                  : isArchived
                                                    ? "bg-slate-100 text-slate-700 border-slate-200"
                                                    : "bg-red-50/90 text-red-700 border-red-200"
                                            }`}
                                        >
                                          {item.status}
                                        </span>
                                      </div>

                                      {/* Relative Timestamp with Exact Date/Time Tooltip */}
                                      <span
                                        title={`Exact date & time: ${item.exactDateTime}`}
                                        className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 whitespace-nowrap shrink-0 tabular-nums"
                                      >
                                        {item.relativeTime}
                                      </span>
                                    </div>

                                    {/* Bottom Row: Applicant Name · Training Program · Exact Date Secondary Label */}
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                      <p className="text-xs text-gray-600 truncate">
                                        <span className="font-bold text-gray-800 group-hover:text-[#0A6B43] group-hover:underline">
                                          {item.youthName}
                                        </span>
                                        <span className="text-gray-300 mx-1.5">·</span>
                                        <span className="font-medium text-gray-600">
                                          {item.programTitle}
                                        </span>
                                      </p>

                                      <span
                                        title={item.exactDateTime}
                                        className="hidden sm:inline-block text-[10px] text-gray-400 font-medium whitespace-nowrap shrink-0"
                                      >
                                        {item.shortExactDate}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-[11px] text-gray-500 mt-3">
                      <span>
                        Showing latest <strong className="text-gray-800">{Math.min(5, recentApplicantActivities.length)}</strong> of{" "}
                        <strong className="text-gray-800">{totalApplicationsCount}</strong> applications
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentScreen(TESDAPartnerScreen.APPLICANTS);
                          setDashboardTab("all");
                          setPipelineStatusFilter("All");
                          document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="font-bold text-[#0A6B43] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Open Applicants</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 1B: DEDICATED APPLICANTS PAGE                         */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.APPLICANTS && (
            <div className="space-y-6">
              {/* Top Header Banner: Title "Applicants" & Required Subtitle (No Summary Cards) */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                <GrowthPlantAnimation />

                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Applicants
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage and review youth applications across all training programs.
                  </p>
                </div>
              </div>

              {/* Main Consolidated Applicants Management Container */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 sm:p-6 space-y-5">
                {/* Top Row: Status Tabs + Refresh Action */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                  {/* Status Tabs: All Applications, Pending, Approved, Enrolled, Declined, and Archived */}
                  <div
                    role="tablist"
                    aria-label="Application status tabs"
                    className="h-[40px] p-1 bg-gray-50/80 border border-gray-200 rounded-xl flex items-center gap-1 overflow-x-auto scrollbar-none shrink-0 max-w-full"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "all"}
                      onClick={() => {
                        setDashboardTab("all");
                        setPipelineStatusFilter("All");
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "all"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>All Applications</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dashboardTab === "all" ? "bg-emerald-50 text-[#0A6B43]" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {activeReferrals.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "pending"}
                      onClick={() => {
                        setDashboardTab("pending");
                        setPipelineStatusFilter("Pending");
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "pending"
                          ? "bg-white text-amber-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Pending</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${pendingReferralsCount > 0 ? "bg-amber-100 text-amber-800" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {pendingReferralsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "approved"}
                      onClick={() => {
                        setDashboardTab("approved");
                        setPipelineStatusFilter("Approved");
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "approved"
                          ? "bg-white text-blue-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Approved</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dashboardTab === "approved" ? "bg-blue-50 text-blue-700" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {approvedReferralsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "enrolled"}
                      onClick={() => {
                        setDashboardTab("enrolled");
                        setPipelineStatusFilter("Enrolled");
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "enrolled"
                          ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Enrolled</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dashboardTab === "enrolled" ? "bg-emerald-50 text-[#0A6B43]" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {enrolledReferralsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "declined"}
                      onClick={() => {
                        setDashboardTab("declined");
                        setPipelineStatusFilter("Declined");
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "declined"
                          ? "bg-white text-red-700 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Declined</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dashboardTab === "declined" ? "bg-red-50 text-red-700" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {declinedReferralsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      role="tab"
                      aria-selected={dashboardTab === "archived"}
                      onClick={() => {
                        setDashboardTab("archived");
                        setPipelineStatusFilter("Archived");
                        fetchArchivedData();
                      }}
                      className={`h-full px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${dashboardTab === "archived"
                          ? "bg-white text-slate-800 shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                    >
                      <span>Archived</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${dashboardTab === "archived" ? "bg-gray-200 text-gray-800" : "bg-gray-200/70 text-gray-600"
                        }`}>
                        {normalizedArchivedReferrals.length}
                      </span>
                    </button>
                  </div>

                  {/* Right Action: Refresh Applications */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={refreshApplicantsData}
                      disabled={isLoadingApplicants || loadingArchived}
                      className="h-[38px] px-3.5 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] border border-gray-200 hover:border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Refresh applicant records from database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApplicants || loadingArchived ? "animate-spin text-[#0A6B43]" : ""}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Search Bar & 4 Filter Dropdowns (Program, Barangay, Status, Date Range) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
                  {/* Search Input (4 cols on desktop) */}
                  <div className="relative sm:col-span-2 lg:col-span-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search applicant, program, or barangay..."
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

                  {/* Program Filter (2 cols on desktop) */}
                  <div className="relative lg:col-span-2">
                    <CustomSelect
                      value={pipelineProgramFilter}
                      onChange={(val) => setPipelineProgramFilter(val)}
                      options={[
                        { value: "All", label: "All Programs" },
                        ...applicantProgramOptions.map(title => ({ value: title, label: title }))
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="Program"
                    />
                  </div>

                  {/* Barangay Filter (2 cols on desktop) */}
                  <div className="relative lg:col-span-2">
                    <CustomSelect
                      value={pipelineBarangayFilter}
                      onChange={(val) => setPipelineBarangayFilter(val)}
                      options={[
                        { value: "All", label: "All Barangays" },
                        ...uniqueBarangays.map(b => ({ value: b, label: `Brgy. ${b.replace(/^Barangay\s+/i, "")}` }))
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="Barangay"
                    />
                  </div>

                  {/* Status Filter (2 cols on desktop) */}
                  <div className="relative lg:col-span-2">
                    <CustomSelect
                      value={pipelineStatusFilter}
                      onChange={(val) => {
                        setPipelineStatusFilter(val);
                        if (val === "All") setDashboardTab("all");
                        else if (val === "Pending") setDashboardTab("pending");
                        else if (val === "Approved") setDashboardTab("approved");
                        else if (val === "Enrolled") setDashboardTab("enrolled");
                        else if (val === "Declined") setDashboardTab("declined");
                        else if (val === "Archived") {
                          setDashboardTab("archived");
                          fetchArchivedData();
                        }
                      }}
                      options={[
                        { value: "All", label: "All Statuses" },
                        { value: "Pending", label: "Pending" },
                        { value: "Approved", label: "Approved" },
                        { value: "Enrolled", label: "Enrolled" },
                        { value: "Declined", label: "Declined" },
                        { value: "Archived", label: "Archived" }
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="Status"
                    />
                  </div>

                  {/* Date Range Filter (2 cols on desktop) */}
                  <div className="relative lg:col-span-2">
                    <CustomSelect
                      value={pipelineDateRangeFilter}
                      onChange={(val) => setPipelineDateRangeFilter(val)}
                      options={[
                        { value: "All", label: "All Dates" },
                        { value: "today", label: "Today" },
                        { value: "7d", label: "Last 7 Days" },
                        { value: "30d", label: "Last 30 Days" },
                        { value: "month", label: "This Month" },
                        { value: "90d", label: "Last 3 Months" }
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="Date Range"
                    />
                  </div>
                </div>

                {/* Active Filter Clear Bar */}
                {isSearchActive && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">
                      Showing <strong className="text-gray-900">{filteredReferrals.length}</strong> matching application{filteredReferrals.length !== 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPipelineSearch("");
                        setPipelineStatusFilter("All");
                        setPipelineProgramFilter("All");
                        setPipelineBarangayFilter("All");
                        setPipelineDateRangeFilter("All");
                        setDashboardTab("all");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}

                {/* Error State */}
                {applicantsError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-red-800 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{applicantsError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={refreshApplicantsData}
                      className="px-3 py-1.5 bg-white hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Loading State */}
                {(isLoadingApplicants || (dashboardTab === "archived" && loadingArchived)) ? (
                  <div className="py-16 text-center space-y-3 border border-gray-100 rounded-2xl bg-gray-50/40">
                    <Loader2 className="w-8 h-8 text-[#0A6B43] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-gray-600">Loading youth applications...</p>
                  </div>
                ) : filteredReferrals.length === 0 ? (
                  /* Empty State */
                  <div className="py-14 px-6 text-center space-y-3 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900">No Applications Found</h3>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        {isSearchActive
                          ? "No youth applications match your current search or filter settings. Try adjusting your filters."
                          : "There are currently no youth applications recorded in this category."}
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
                          setPipelineDateRangeFilter("All");
                          setDashboardTab("all");
                        }}
                        className="mt-1 px-3.5 py-1.5 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                ) : (
                  /* Consolidated Responsive Table + Mobile Cards */
                  <div className="space-y-4">
                    {/* Mobile & Tablet Card View (< md) */}
                    <div className="md:hidden divide-y divide-gray-100 border border-gray-200/90 rounded-2xl overflow-hidden">
                      {paginatedFlatApplicants.map((item) => {
                        const matchedProfile = youthProfiles.find(
                          y =>
                            (item.youthId && y.id === item.youthId) ||
                            y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim()
                        );
                        const initials = getApplicantInitials(item.youthName);
                        const requiresDecision = item.status === "Pending" || item.status === "Approved";

                        return (
                          <div key={item.id} className="p-4 space-y-3 bg-white hover:bg-emerald-50/20 transition-colors">
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-3 min-w-0">
                                {matchedProfile?.profilePicture ? (
                                  <img
                                    src={matchedProfile.profilePicture}
                                    alt={item.youthName}
                                    className="w-9 h-9 rounded-full object-cover border border-emerald-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-extrabold text-xs shrink-0">
                                    {initials || "KK"}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <button
                                    type="button"
                                    onClick={() => openApplicantModal(item)}
                                    className="font-bold text-gray-900 hover:text-[#0A6B43] text-sm truncate block text-left cursor-pointer"
                                  >
                                    {item.youthName}
                                  </button>
                                  <p className="text-[11px] text-gray-500 font-medium truncate">
                                    Purok {item.purok}, Brgy. {item.barangay.replace(/^Barangay\s+/i, "")}
                                  </p>
                                </div>
                              </div>

                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shrink-0 ${item.status === "Enrolled"
                                  ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                  : item.status === "Approved"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : item.status === "Pending"
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : item.status === "Archived"
                                        ? "bg-gray-100 text-gray-700 border-gray-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-gray-800 truncate" title={item.programTitle}>
                                {item.programTitle}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#0A6B43] border border-emerald-200 shrink-0">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                {item.matchScore}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="text-[11px] text-gray-500 font-medium">
                                Applied: <strong className="text-gray-700">{item.applicationDate || item.referralDate}</strong>
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openApplicantModal(item)}
                                  className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] border border-gray-200 hover:border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Review</span>
                                </button>
                                {canManageApplicants && requiresDecision && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReviewingApplication(item);
                                        setPendingReviewDecision("Declined");
                                      }}
                                      disabled={processingReferralId === item.id}
                                      className="w-8 h-8 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg flex items-center justify-center cursor-pointer shadow-2xs active:scale-95 disabled:opacity-60"
                                      title="Reject Application"
                                      aria-label="Reject Application"
                                    >
                                      {processingReferralId === item.id && processingReferralStatus === "Declined" ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-red-600 shrink-0" />
                                      ) : (
                                        <X className="w-4 h-4 shrink-0" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReviewingApplication(item);
                                        setPendingReviewDecision(item.status === "Approved" ? "Enrolled" : "Approved");
                                      }}
                                      disabled={processingReferralId === item.id}
                                      className="w-8 h-8 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white rounded-lg flex items-center justify-center cursor-pointer shadow-xs disabled:opacity-60"
                                      title={item.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                                      aria-label={item.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                                    >
                                      {processingReferralId === item.id && (processingReferralStatus === "Approved" || processingReferralStatus === "Enrolled") ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                      ) : (
                                        <Check className="w-4 h-4 shrink-0" />
                                      )}
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop Consolidated Table (>= md) */}
                    <div className="hidden md:block border border-gray-200/90 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold text-[11px] uppercase tracking-wider whitespace-nowrap">
                              <th className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantSort("applicant")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none ${applicantSortCol === "applicant" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                  <span>Applicant</span>
                                  {applicantSortCol === "applicant" ? (
                                    applicantSortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantSort("program")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none ${applicantSortCol === "program" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                  <span>Program</span>
                                  {applicantSortCol === "program" ? (
                                    applicantSortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantSort("matchScore")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none ${applicantSortCol === "matchScore" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                  <span>Match Score</span>
                                  {applicantSortCol === "matchScore" ? (
                                    applicantSortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantSort("appliedDate")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none ${applicantSortCol === "appliedDate" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                  <span>Applied Date</span>
                                  {applicantSortCol === "appliedDate" ? (
                                    applicantSortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3.5 px-4">
                                <button
                                  type="button"
                                  onClick={() => handleApplicantSort("status")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none ${applicantSortCol === "status" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                    }`}
                                >
                                  <span>Status</span>
                                  {applicantSortCol === "status" ? (
                                    applicantSortDir === "asc" ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 opacity-40" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3.5 px-4 text-center">Review</th>
                              <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedFlatApplicants.map((item) => {
                              const matchedProfile = youthProfiles.find(
                                y =>
                                  (item.youthId && y.id === item.youthId) ||
                                  y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim()
                              );
                              const initials = getApplicantInitials(item.youthName);
                              const associatedProgram = programs.find(
                                p => p.title === item.programTitle || p.id === item.programId
                              );
                              const requiresDecision = item.status === "Pending" || item.status === "Approved";

                              return (
                                <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors group">
                                  {/* Column 1: Applicant (Initials/Avatar, Full Name, Barangay or Purok) */}
                                  <td className="py-3.5 px-4">
                                    <div className="flex items-center gap-3">
                                      {matchedProfile?.profilePicture ? (
                                        <img
                                          src={matchedProfile.profilePicture}
                                          alt={item.youthName}
                                          className="w-9 h-9 rounded-full object-cover border border-emerald-200 shrink-0"
                                        />
                                      ) : (
                                        <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-extrabold text-xs shrink-0">
                                          {initials || "KK"}
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => openApplicantModal(item)}
                                          className="font-bold text-gray-900 hover:text-[#0A6B43] hover:underline cursor-pointer text-left block text-sm truncate max-w-[220px]"
                                        >
                                          {item.youthName}
                                        </button>
                                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5">
                                          <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                          <span className="truncate">
                                            Purok {item.purok}, Brgy. {item.barangay.replace(/^Barangay\s+/i, "")}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </td>

                                  {/* Column 2: Program */}
                                  <td className="py-3.5 px-4">
                                    <div className="min-w-0 max-w-[260px]">
                                      <p className="font-bold text-gray-900 truncate" title={item.programTitle}>
                                        {item.programTitle}
                                      </p>
                                      {associatedProgram && (
                                        <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                          {associatedProgram.slotsRemaining} of {associatedProgram.slotsTotal} slots open · {associatedProgram.trainingHours}h
                                        </p>
                                      )}
                                    </div>
                                  </td>

                                  {/* Column 3: Match Score */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#0A6B43] border border-emerald-200">
                                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>{item.matchScore}%</span>
                                    </div>
                                  </td>

                                  {/* Column 4: Applied Date */}
                                  <td className="py-3.5 px-4 text-gray-600 font-semibold whitespace-nowrap">
                                    {item.applicationDate || item.referralDate}
                                  </td>

                                  {/* Column 5: Status */}
                                  <td className="py-3.5 px-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${item.status === "Enrolled"
                                        ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                        : item.status === "Approved"
                                          ? "bg-blue-50 text-blue-700 border-blue-200"
                                          : item.status === "Pending"
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : item.status === "Archived"
                                              ? "bg-gray-100 text-gray-700 border-gray-200"
                                              : "bg-red-50 text-red-700 border-red-200"
                                      }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Enrolled"
                                          ? "bg-[#0A6B43]"
                                          : item.status === "Approved"
                                            ? "bg-blue-600"
                                            : item.status === "Pending"
                                              ? "bg-amber-500"
                                              : item.status === "Archived"
                                                ? "bg-gray-500"
                                                : "bg-red-500"
                                        }`} />
                                      <span>{item.status}</span>
                                    </span>
                                  </td>

                                  {/* Column 6: Review (Opens applicant profile and application details) */}
                                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => openApplicantModal(item)}
                                      className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0A6B43] border border-gray-200 hover:border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                      title="Review applicant profile and application details"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Review</span>
                                    </button>
                                  </td>

                                  {/* Column 7: Action (Icon-only Reject and Approve buttons) */}
                                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                    {canManageApplicants && requiresDecision ? (
                                      <div className="inline-flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewingApplication(item);
                                            setPendingReviewDecision("Declined");
                                          }}
                                          disabled={processingReferralId === item.id}
                                          className="w-8 h-8 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center shadow-2xs active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                                          title="Reject Application"
                                          aria-label="Reject Application"
                                        >
                                          {processingReferralId === item.id && processingReferralStatus === "Declined" ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" />
                                          ) : (
                                            <X className="w-4 h-4 shrink-0" />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReviewingApplication(item);
                                            setPendingReviewDecision(item.status === "Approved" ? "Enrolled" : "Approved");
                                          }}
                                          disabled={processingReferralId === item.id}
                                          className="w-8 h-8 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white rounded-lg transition-all cursor-pointer inline-flex items-center justify-center shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
                                          title={item.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                                          aria-label={item.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                                        >
                                          {processingReferralId === item.id && (processingReferralStatus === "Approved" || processingReferralStatus === "Enrolled") ? (
                                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                          ) : (
                                            <Check className="w-4 h-4 shrink-0" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-gray-400">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Pagination Controls */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <p className="text-xs text-gray-500 font-medium">
                        Showing <span className="font-bold text-gray-900">{(currentApplicantTablePage - 1) * APPLICANTS_TABLE_PER_PAGE + 1}</span> to{" "}
                        <span className="font-bold text-gray-900">{Math.min(filteredReferrals.length, currentApplicantTablePage * APPLICANTS_TABLE_PER_PAGE)}</span> of{" "}
                        <span className="font-bold text-gray-900">{filteredReferrals.length}</span> application{filteredReferrals.length !== 1 ? "s" : ""}
                      </p>

                      {totalApplicantTablePages > 1 && (
                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          <button
                            type="button"
                            disabled={currentApplicantTablePage === 1}
                            onClick={() => setApplicantTablePage(p => Math.max(1, p - 1))}
                            className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {getPaginationItems(currentApplicantTablePage, totalApplicantTablePages).map((item, idx) => {
                              if (item === "...") {
                                return (
                                  <span key={`app-ellipsis-${idx}`} className="w-7 text-center text-xs text-gray-400 select-none">
                                    ...
                                  </span>
                                );
                              }
                              const pageNum = Number(item);
                              const isSelected = pageNum === currentApplicantTablePage;
                              return (
                                <button
                                  key={`app-page-${pageNum}`}
                                  type="button"
                                  onClick={() => setApplicantTablePage(pageNum)}
                                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
                                      ? "bg-[#0A6B43] text-white shadow-xs font-black"
                                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            disabled={currentApplicantTablePage === totalApplicantTablePages}
                            onClick={() => setApplicantTablePage(p => Math.min(totalApplicantTablePages, p + 1))}
                            className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 disabled:opacity-40 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* SCREEN 2: ALL PUBLISHED PROGRAMS (CATALOG) & COHORT ROSTER */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.PROGRAMS && (
            viewingProgramRoster ? (
              <div className="space-y-6">
                {/* Top Banner with Botanical Growth and Gradient */}
                <div
                  className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                  }}
                >
                  <GrowthPlantAnimation />

                  <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-3xl lg:max-w-4xl space-y-3">
                    {/* Back to Catalog Breadcrumb Button */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setViewingProgramRoster(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer border border-white/20 backdrop-blur-xs shadow-xs"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Programs Catalog</span>
                      </button>
                    </div>

                    {/* Title and Badges */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                          {viewingProgramRoster.deliveryMode || "Face-to-Face"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                          {viewingProgramRoster.type || "NC II Certified"}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-400/20 text-blue-200 border border-blue-400/30">
                          {getProgramCategory(viewingProgramRoster)}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          viewingProgramRoster.activeStatus === "Closed"
                            ? "bg-gray-500/30 text-gray-200 border-gray-400/40"
                            : "bg-emerald-500/30 text-emerald-100 border-emerald-400/40"
                        }`}>
                          {viewingProgramRoster.activeStatus === "Closed" ? "Archived Batch" : "Active Cohort"}
                        </span>
                      </div>

                      <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                        {viewingProgramRoster.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                        Official Trainee Enrollee Roster & Cohort Records • {viewingProgramRoster.provider || "TESDA Partner"}
                      </p>
                    </div>

                    {/* Top Actions: Export CSV, Print Masterlist, View Specs */}
                    <div className="flex items-center gap-2 flex-wrap pt-2">
                      <button
                        type="button"
                        onClick={() => handleExportProgramRosterCSV(viewingProgramRoster, filteredRosterReferrals)}
                        className="px-3.5 py-2 bg-white text-[#0A6B43] hover:bg-emerald-50 active:scale-95 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Download clean CSV of all trainees for institutional reporting"
                      >
                        <Download className="w-3.5 h-3.5 text-[#0A6B43]" />
                        <span>Export Roster (CSV)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                        title="Print official trainee cohort masterlist"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Masterlist</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setViewingProgram(viewingProgramRoster);
                          setProgramModalTab("details");
                          setIsEditingInModal(false);
                        }}
                        className="px-3.5 py-2 bg-white/15 hover:bg-white/25 active:scale-95 text-white text-xs font-bold rounded-xl transition-all border border-white/20 flex items-center gap-1.5 cursor-pointer"
                        title="View complete curriculum, schedule and facility details"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Program Specifications</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {/* 4-Item Logistics Overview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        <span>Training Term</span>
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 truncate">
                        {formatProgramDateRange(viewingProgramRoster.startDate, viewingProgramRoster.endDate)}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {viewingProgramRoster.trainingHours ? `${viewingProgramRoster.trainingHours} Hours Total` : "Flexible Hours"}
                      </p>
                    </div>

                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Instructional Days</span>
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 truncate">
                        {formatTrainingDays(viewingProgramRoster.trainingDays)}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {formatProgramTimeslot(viewingProgramRoster.startTime, viewingProgramRoster.endTime).formattedRange}
                      </p>
                    </div>

                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-emerald-600" />
                        <span>Premises & Room</span>
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 truncate">
                        {viewingProgramRoster.room || "Main Workshop Area"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium truncate" title={extractLocationDisplay(viewingProgramRoster.location)}>
                        {extractLocationDisplay(viewingProgramRoster.location)}
                      </p>
                    </div>

                    <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl p-3">
                      <span className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-emerald-600" />
                        <span>Assigned Instructor</span>
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 mt-0.5 truncate">
                        {viewingProgramRoster.instructor || "Assigned TESDA Trainer"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {viewingProgramRoster.cost || "Free (Subsidized)"}
                      </p>
                    </div>
                  </div>

                  {/* Slot Capacity Progress Bar */}
                  {(() => {
                    const stats = getProgramCohortStats(viewingProgramRoster);
                    const totalCapacity = viewingProgramRoster.slotsTotal || 25;
                    const filledCount = stats.enrolledCount;
                    const pct = Math.min(100, Math.round((filledCount / totalCapacity) * 100));

                    return (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-[#0A6B43] uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Cohort Slot Utilization</span>
                          </span>
                          <span className="font-bold text-gray-700">
                            <strong className="text-emerald-950 font-black">{filledCount}</strong> of {totalCapacity} Trainees Enrolled ({viewingProgramRoster.slotsRemaining} slots remaining)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              filledCount >= totalCapacity ? "bg-amber-500" : "bg-[#0A6B43]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Status Metric Cards (Clickable tabs) */}
                  {(() => {
                    const stats = getProgramCohortStats(viewingProgramRoster);
                    const cards = [
                      { id: "all", label: "All Records", count: stats.total, color: "text-gray-900", bg: "bg-gray-50", border: "border-gray-200" },
                      { id: "enrolled", label: "Enrolled Trainees", count: stats.enrolledCount, color: "text-[#0A6B43]", bg: "bg-emerald-50/80", border: "border-emerald-200" },
                      { id: "pending", label: "Pending Review", count: stats.pendingCount, color: "text-amber-700", bg: "bg-amber-50/80", border: "border-amber-200" },
                      { id: "approved", label: "Approved", count: stats.approvedCount, color: "text-blue-700", bg: "bg-blue-50/80", border: "border-blue-200" },
                      { id: "completed", label: "Completed / Graduated", count: stats.completedCount, color: "text-purple-700", bg: "bg-purple-50/80", border: "border-purple-200" },
                      { id: "declined", label: "Declined", count: stats.declinedCount, color: "text-red-700", bg: "bg-red-50/80", border: "border-red-200" },
                    ];

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
                        {cards.map(c => {
                          const isSelected = programRosterTab === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setProgramRosterTab(c.id as any)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${c.bg} ${
                                isSelected ? "ring-2 ring-[#0A6B43] shadow-xs" : `${c.border} hover:opacity-90`
                              }`}
                            >
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block truncate">
                                {c.label}
                              </span>
                              <span className={`text-lg sm:text-xl font-black mt-0.5 block ${c.color}`}>
                                {c.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Filter and Search Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search trainee name, email, or purok..."
                        value={programRosterSearch}
                        onChange={(e) => setProgramRosterSearch(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                      />
                      {programRosterSearch && (
                        <button
                          type="button"
                          onClick={() => setProgramRosterSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold shrink-0">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>Barangay:</span>
                      </div>
                      <select
                        value={programRosterBarangay}
                        onChange={(e) => setProgramRosterBarangay(e.target.value)}
                        className="h-[36px] px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                      >
                        <option value="All">All Barangays</option>
                        {SAN_LUIS_BARANGAYS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      <div className="text-xs font-bold text-gray-500 pl-2">
                        Showing <span className="text-gray-900 font-black">{filteredRosterReferrals.length}</span> Trainees
                      </div>
                    </div>
                  </div>

                  {/* Trainee Roster Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    {filteredRosterReferrals.length === 0 ? (
                      <div className="text-center py-12 px-4 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0A6B43] flex items-center justify-center mx-auto mb-2">
                          <Users className="w-6 h-6" />
                        </div>
                        <h4 className="font-extrabold text-gray-900 text-sm">No Trainees Found</h4>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          {programRosterSearch || programRosterBarangay !== "All"
                            ? "No trainee records match your search and barangay filter. Try adjusting your search term."
                            : programRosterTab === "enrolled"
                              ? "No enrolled trainees in this class cohort yet. Accept approved applicants to populate the class roster."
                              : `No records found in the "${programRosterTab}" category for this program.`}
                        </p>
                        {(programRosterSearch || programRosterBarangay !== "All" || programRosterTab !== "all") && (
                          <button
                            type="button"
                            onClick={() => {
                              setProgramRosterSearch("");
                              setProgramRosterBarangay("All");
                              setProgramRosterTab("all");
                            }}
                            className="mt-2 px-3 py-1.5 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10.5px] font-bold whitespace-nowrap">
                              <th className="py-3 px-4">Trainee Name</th>
                              <th className="py-3 px-4">Barangay & Purok</th>
                              <th className="py-3 px-4">Contact & Email</th>
                              <th className="py-3 px-4 text-center">AI Match</th>
                              <th className="py-3 px-4">Registration Date</th>
                              <th className="py-3 px-4 text-center">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredRosterReferrals.map(item => {
                              const matchedProfile = youthProfiles.find(y =>
                                (item.youthId && y.id === item.youthId) ||
                                (item.youthName && y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim())
                              );
                              const email = item.youthEmail || item.email || matchedProfile?.email || "—";
                              const contact = (item as any).contactNumber || matchedProfile?.contactNumber || "—";

                              const statusBadgeStyle =
                                item.status === "Enrolled"
                                  ? "bg-emerald-50 text-[#0A6B43] border-emerald-200 font-black"
                                  : item.status === "Approved"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 font-bold"
                                    : item.status === "Pending"
                                      ? "bg-amber-50 text-amber-800 border-amber-200 font-bold"
                                      : item.status === "Completed"
                                        ? "bg-purple-50 text-purple-700 border-purple-200 font-bold"
                                        : "bg-red-50 text-red-700 border-red-200 font-bold";

                              const initials = (item.youthName || "Y")
                                .split(" ")
                                .map(p => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();

                              return (
                                <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors group">
                                  <td className="py-3 px-4">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                                        {initials}
                                      </div>
                                      <div className="min-w-0">
                                        <button
                                          type="button"
                                          onClick={() => openApplicantModal(item)}
                                          className="font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors text-left line-clamp-1 cursor-pointer hover:underline"
                                        >
                                          {item.youthName}
                                        </button>
                                        <p className="text-[11px] text-gray-400">
                                          {matchedProfile?.gender || "Youth"} • Age {matchedProfile?.age || 20}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-semibold text-gray-800">{item.barangay}</div>
                                    <div className="text-[11px] text-gray-400">{item.purok ? `Purok ${item.purok}` : "—"}</div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-700 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                      <span>{contact}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-400 flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                      <span className="truncate max-w-[150px]">{email}</span>
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-center">
                                    <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px]">
                                      {item.matchScore || 85}% Match
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap">
                                    <span className="text-gray-600 font-medium text-xs">
                                      {item.applicationDate || item.referralDate || "—"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-center">
                                    <span className={`text-[10px] uppercase px-2.5 py-0.5 rounded-full border tracking-wide ${statusBadgeStyle}`}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 whitespace-nowrap text-right">
                                  <div className="flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => openApplicantModal(item)}
                                      className="px-3 py-1.5 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#0A6B43] text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                                      title="View Youth Member Full Profile"
                                    >
                                      View Profile
                                    </button>
                                  </div>
                                </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
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
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border leading-none ${viewingArchivedPrograms
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
                      className={`px-4 py-2 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0 ${viewingArchivedPrograms
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
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs text-gray-500 font-medium truncate">
                                    {getProgramCategory(prog)}
                                  </p>
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.2 rounded-md">
                                    {prog.deliveryMode || "Face-to-Face"}
                                  </span>
                                </div>
                              </div>

                              <span className={`text-[9.5px] sm:text-[10px] font-extrabold uppercase px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 tracking-wide ${prog.activeStatus === "Closed"
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

                            
                          </div>

                          {/* Cohort & Enrollees Bar */}
                          {(() => {
                            const pStats = getProgramCohortStats(prog);
                            return (
                              <div className="pt-1.5 pb-2">
                                <div className="flex items-center justify-between text-[11px] bg-gray-50/80 px-2.5 py-1 rounded-lg border border-gray-100">
                                  <span className="font-bold text-gray-600 flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Enrolled Cohort</span>
                                  </span>
                                  <span className="font-extrabold text-[#0A6B43]">
                                    {pStats.enrolledCount} Trainees
                                    {pStats.pendingCount > 0 && (
                                      <span className="text-amber-600 font-bold ml-1">({pStats.pendingCount} pending)</span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Card Footer: View Roster & View Program Details */}
                          <div className="pt-2.5 sm:pt-3 border-t border-gray-100 mt-auto flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setViewingProgramRoster(prog);
                                setProgramRosterTab("all");
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-xs font-bold text-[#0A6B43] border border-emerald-200/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
                              title={`View ${prog.title} Enrollee Roster & Records`}
                            >
                              <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Roster ({getProgramCohortStats(prog).enrolledCount})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setViewingProgram(prog);
                                setProgramModalTab("details");
                                setIsEditingInModal(false);
                              }}
                              className="inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-auto active:scale-95"
                            >
                              <span>Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500" />
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
                            <th className="py-3 px-4 text-center">Delivery Mode</th>
                            <th className="py-3 px-4 text-left">Duration</th>
                            <th className="py-3 px-4 text-left">Training Term</th>
                            <th className="py-3 px-4 text-left">Available Slots</th>
                            <th className="py-3 px-4 text-center">Enrollees</th>
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
                                <td className="py-3 px-4 whitespace-nowrap text-center align-middle">
                                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-md">
                                    {prog.deliveryMode || "Face-to-Face"}
                                  </span>
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
                                <td className="py-3 px-4 whitespace-nowrap text-center align-middle">
                                  {(() => {
                                    const pStats = getProgramCohortStats(prog);
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setViewingProgramRoster(prog);
                                          setProgramRosterTab("all");
                                        }}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-[#0A6B43] hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
                                        title="View Enrollees & Cohort Roster"
                                      >
                                        <Users className="w-3.5 h-3.5 text-[#0A6B43]" />
                                        <span>{pStats.enrolledCount} Enrolled</span>
                                        {pStats.pendingCount > 0 && (
                                          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                            +{pStats.pendingCount}
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })()}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border tracking-wide ${prog.activeStatus === "Closed"
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
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingProgramRoster(prog);
                                        setProgramRosterTab("all");
                                      }}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                                      title="View Cohort Roster"
                                    >
                                      <Users className="w-3 h-3" />
                                      <span>Roster</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setViewingProgram(prog);
                                        setProgramModalTab("details");
                                        setIsEditingInModal(false);
                                      }}
                                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer group"
                                      title="View Program Details"
                                    >
                                      <span>Details</span>
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
                              className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${isSelected
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
            )
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
                              { value: "None", label: "None" },
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Tuition Cost Model</label>
                          <CustomSelect
                            value={progCost}
                            onChange={(val) => setProgCost(val as any)}
                            options={[
                              { value: "Free", label: "Free" },
                              { value: "Subsidized", label: "Subsidized / Co-pay" },
                              { value: "With Fee", label: "Fee-based" }
                            ]}
                            size="sm"
                            buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                            placeholder="Select Cost"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-[#0A6B43] uppercase tracking-wider">Delivery Mode *</label>
                          <CustomSelect
                            value={progDeliveryMode}
                            onChange={(val) => setProgDeliveryMode(val)}
                            options={[
                              { value: "Face-to-Face", label: "Face-to-Face" },
                              { value: "Online Learning", label: "Online Learning" },
                              { value: "Blended Learning", label: "Blended Learning" }
                            ]}
                            size="sm"
                            buttonClassName="h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                            placeholder="Select Delivery Mode"
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
                        <div className="space-y-1 min-w-0">
                          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
                            <label className="text-[10px] sm:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider truncate">Training Venue / Location</label>
                            <button
                              type="button"
                              onClick={() => {
                                setVenueMapTarget("create");
                                setVenueMapModalMode("picker");
                                setIsVenueMapModalOpen(true);
                              }}
                              className="text-[10px] sm:text-[11px] font-bold text-[#0A6B43] hover:text-[#075332] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                              <span>Locate / Pin on Map</span>
                            </button>
                          </div>
                          <div className="relative min-w-0 w-full">
                            <input
                              type="text"
                              placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                              value={extractLocationDisplay(progLocation)}
                              onChange={(e) => setProgLocation(e.target.value)}
                              className="w-full min-w-0 h-[38px] pl-3.5 pr-20 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors truncate"
                              title={extractLocationDisplay(progLocation)}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setVenueMapTarget("create");
                                setVenueMapModalMode("picker");
                                setIsVenueMapModalOpen(true);
                              }}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 text-[10px] font-extrabold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0 z-10"
                              title="Search or Pin on Map"
                            >
                              <Compass className="w-3 h-3 shrink-0" />
                              <span>Map</span>
                            </button>
                          </div>
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

                    {/* Section 3: Program Description & Required Documents */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Program Description &amp; Requirements</h4>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Program Description</label>
                          <span className="text-[10px] text-gray-400 font-medium">Overview &amp; Learning Outcomes</span>
                        </div>
                        <div className="w-full rounded-xl border border-gray-200 bg-gray-50/70 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all overflow-hidden shadow-2xs">
                          <textarea
                            rows={3}
                            placeholder="Describe what trainees will learn in this program, key skills covered, and career opportunities upon completion."
                            value={progEligibility}
                            onChange={(e) => setProgEligibility(e.target.value)}
                            className="w-full p-2.5 sm:p-3 bg-transparent border-0 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-y min-h-[68px] max-h-[160px] block modal-scrollbar"
                          />
                        </div>
                      </div>

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
                        disabled={isSubmittingProgram}
                        className="px-7 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isSubmittingProgram ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span>{editingProgramId ? "Saving Program..." : "Publishing Program..."}</span>
                          </>
                        ) : (
                          <span>{editingProgramId ? "Save Program Changes" : "Publish Training Program"}</span>
                        )}
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
                                      <p className="text-[16px] font-semibold text-gray-900 break-words leading-tight">{savedCenterName}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Accredited Representative</span>
                                    <div className="h-[42px] flex items-center">
                                      <p className="text-[16px] font-semibold text-gray-900 leading-tight">{savedRepName}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Institutional Email</span>
                                    <div className="h-[42px] flex items-center">
                                      <p className="text-[16px] font-semibold text-gray-900 break-words truncate leading-tight" title={savedRepEmail}>
                                        {savedRepEmail}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="space-y-0.5 sm:col-span-2">
                                    <span className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Contact / Hotline</span>
                                    <div className="h-[42px] flex items-center">
                                      <p className="text-[16px] font-semibold text-gray-900 leading-tight">{savedRepPhone || "Not configured"}</p>
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
                                  onClick={() => {
                                    setRepName(savedRepName);
                                    setRepEmail(savedRepEmail);
                                    setCenterName(savedCenterName);
                                    setRepPhone(savedRepPhone);
                                    setIsEditingProfile(true);
                                  }}
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
                                  onClick={handleCancelProfileEdit}
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
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 bg-rose-50/50 hover:bg-rose-100 transition-all ${isLoggingOut ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
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
                                  className={`w-full px-3 py-2 pr-10 h-10 border rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${confirmPassword.length > 0 && confirmPassword !== newPassword ? "border-rose-300 bg-rose-50/20" : "border-gray-200"
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
                                className={`group/pwd px-5 py-2.5 h-10 text-white text-sm font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${isChangingPassword || newPassword.length < 6 || newPassword !== confirmPassword || !currentPassword
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
      {/* APPLICANT PROFILE DOSSIER MODAL (FULLY MOBILE RESPONSIVE)     */}
      {/* ============================================================ */}
      {selectedApplicant && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedApplicant(null);
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[70] p-2 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92dvh] sm:max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 ease-out">

            {/* Modal Top Header (Optimized for Mobile & Desktop) */}
            <div className="bg-gradient-to-r from-[#112F24] via-[#163D2F] to-[#1A4234] text-white p-3.5 sm:p-5 md:p-6 shrink-0 border-b border-emerald-950/40">
              <div className="flex items-start justify-between gap-2.5 sm:gap-4">
                {/* Applicant Avatar & Name Info */}
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-base sm:text-xl shadow-xs uppercase shrink-0">
                    {selectedApplicant.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <h3 className="font-black text-sm sm:text-base md:text-lg tracking-tight leading-snug text-white truncate max-w-full">
                        {selectedApplicant.name}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                        {selectedApplicant.age} yrs old
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-200/90 mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                      <span className="truncate">
                        Purok {selectedApplicant.purok}, Brgy. {selectedApplicant.barangay.replace(/^Barangay\s+/i, "")}, San Luis
                      </span>
                    </p>
                  </div>
                </div>

                {/* Header Right: AI Match Badge + Close Button */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                  <div className="bg-white/10 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/20 text-center">
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-300 block">AI Match</span>
                    <span className="text-xs sm:text-base font-black text-white">{selectedApplicant.matchScore || 85}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedApplicant(null)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Content with Mobile Padding */}
            <div className="p-3.5 sm:p-5 md:p-6 space-y-3.5 sm:space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">

              {/* Application Details Summary Banner */}
              {selectedApplicantReferral && (
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#0A6B43] shrink-0" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#0A6B43]">
                        Training Application Details
                      </span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${selectedApplicantReferral.status === "Enrolled"
                        ? "bg-emerald-100 text-[#0A6B43] border-emerald-300"
                        : selectedApplicantReferral.status === "Approved"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : selectedApplicantReferral.status === "Pending"
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : selectedApplicantReferral.status === "Archived"
                              ? "bg-gray-200 text-gray-700 border-gray-300"
                              : "bg-red-100 text-red-700 border-red-300"
                      }`}>
                      {selectedApplicantReferral.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Program Applied For</span>
                      <p className="font-extrabold text-gray-900 mt-0.5">{selectedApplicantReferral.programTitle}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Application Date</span>
                      <p className="font-bold text-gray-800 mt-0.5">{selectedApplicantReferral.applicationDate || selectedApplicantReferral.referralDate}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">SiKap Match Score</span>
                      <p className="font-extrabold text-[#0A6B43] mt-0.5">{selectedApplicantReferral.matchScore}% Match</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Column Responsive Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

                {/* Column 1: Residency, Contact & Profile */}
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/60 pb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                    <span>Personal Profile & Contact</span>
                  </h5>

                  <div className="space-y-2.5 text-xs">
                    {/* Contact Number */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Phone className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Contact Number</p>
                        <a
                          href={`tel:${selectedApplicant.contactNumber}`}
                          className="font-bold text-gray-900 hover:text-[#0A6B43] truncate block text-xs"
                        >
                          {selectedApplicant.contactNumber || "N/A"}
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    {selectedApplicant.email && (
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Email Address</p>
                          <a
                            href={`mailto:${selectedApplicant.email}`}
                            className="font-bold text-gray-900 hover:text-[#0A6B43] truncate block text-xs"
                          >
                            {selectedApplicant.email}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Educational Attainment */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Educational Attainment</p>
                        <p className="font-bold text-gray-900 leading-snug break-words text-xs">
                          {selectedApplicant.educationalAttainment || "Secondary Graduate"}
                        </p>
                      </div>
                    </div>

                    {/* Demographic Categories */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <Info className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Demographic Profile</p>
                        <div className="flex flex-wrap gap-1">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#0A6B43] border border-emerald-200 font-bold text-[10px]">
                            {selectedApplicant.currentStatus || "Out-of-School Youth"}
                          </span>
                          {selectedApplicant.soloParent && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[10px]">
                              Solo Parent
                            </span>
                          )}
                          {selectedApplicant.pwd && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[10px]">
                              PWD
                            </span>
                          )}
                          {selectedApplicant.indigenous && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                              Indigenous
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Verification Document Info (If Present) */}
                    {selectedApplicant.verificationIdType && (
                      <div className="flex items-start gap-2.5 min-w-0 pt-1 border-t border-gray-200/60">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Proof of Identity Document</p>
                          <p className="font-bold text-gray-900 text-xs truncate">
                            {selectedApplicant.verificationIdType}
                            {selectedApplicant.verificationIdNumber ? ` · ${selectedApplicant.verificationIdNumber}` : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: Competencies, Interests & Career Objective */}
                <div className="bg-gray-50/80 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3">
                  <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200/60 pb-1.5 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-[#0A6B43]" />
                    <span>Skills & Career Objective</span>
                  </h5>

                  <div className="space-y-3 text-xs">
                    {/* Declared Skills */}
                    <div>
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">Registered Competencies</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.skills && selectedApplicant.skills.length > 0 ? (
                          selectedApplicant.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2.5 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">No specific skills registered</span>
                        )}
                      </div>
                    </div>

                    {/* Aspirational Interests */}
                    <div>
                      <p className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider mb-1.5">Vocational Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.interests && selectedApplicant.interests.length > 0 ? (
                          selectedApplicant.interests.map((i, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-0.5 rounded-md">
                              {i}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">General Vocational Interest</span>
                        )}
                      </div>
                    </div>

                    {/* Career Goal */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">Career & Livelihood Goal</p>
                      <p className="text-xs text-gray-800 italic font-medium leading-relaxed">
                        &ldquo;{selectedApplicant.livelihoodGoal || "Seeking technical vocational training and accreditation for employment."}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer (Stacked on Mobile, Flex on Desktop) */}
            <div className="bg-gray-50/90 border-t border-gray-200/80 p-3 sm:p-4 px-4 sm:px-6 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Left Status Indicator */}
              <div className="flex items-center gap-2">
                {(() => {
                  const activeRef = selectedApplicantReferral || activeReferrals.find(
                    r => r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()
                  );
                  if (!activeRef) return null;
                  return (
                    <span className={`text-xs font-bold ${activeRef.status === "Enrolled"
                        ? "text-[#0A6B43]"
                        : activeRef.status === "Approved"
                          ? "text-blue-700"
                          : activeRef.status === "Pending"
                            ? "text-amber-800"
                            : "text-gray-700"
                      }`}>
                      Application Status: <strong>{activeRef.status}</strong>
                    </span>
                  );
                })()}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 w-full sm:w-auto">
                {(() => {
                  const activeRef = selectedApplicantReferral || activeReferrals.find(
                    r => r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()
                  );
                  const requiresDecision = activeRef && (activeRef.status === "Pending" || activeRef.status === "Approved");
                  return (
                    <>
                      {canManageApplicants && requiresDecision && activeRef && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplicant(null);
                              setReviewingApplication(activeRef);
                              setPendingReviewDecision("Declined");
                            }}
                            className="w-9 h-9 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border border-gray-200 hover:border-red-200 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-2xs active:scale-95"
                            title="Reject Application"
                            aria-label="Reject Application"
                          >
                            <X className="w-4 h-4 shrink-0" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplicant(null);
                              setReviewingApplication(activeRef);
                              setPendingReviewDecision(activeRef.status === "Approved" ? "Enrolled" : "Approved");
                            }}
                            className="w-9 h-9 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-xs"
                            title={activeRef.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                            aria-label={activeRef.status === "Approved" ? "Enroll Applicant" : "Approve Application"}
                          >
                            <Check className="w-4 h-4 shrink-0" />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedApplicant(null)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-gray-200 hover:bg-gray-300 active:scale-95 text-gray-800 text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
                      >
                        Close
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* REVIEW APPLICATION MODAL (WITH CONFIRMATION STEP)             */}
      {/* ============================================================ */}
      {reviewingApplication && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !processingReferralId) {
              setReviewingApplication(null);
              setPendingReviewDecision(null);
            }
          }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200 ease-out">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#082D21] via-[#0A4D36] to-[#082D21] text-white p-4 sm:p-5 border-b border-emerald-900/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-white leading-tight truncate">
                    Review Youth Application
                  </h3>
                  <p className="text-xs text-emerald-100/80 font-medium truncate">
                    Evaluate candidate qualifications and confirm admission decision
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!!processingReferralId}
                onClick={() => {
                  setReviewingApplication(null);
                  setPendingReviewDecision(null);
                }}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 text-xs">
              {(() => {
                const matchedProfile = youthProfiles.find(
                  y =>
                    (reviewingApplication.youthId && y.id === reviewingApplication.youthId) ||
                    y.name.toLowerCase().trim() === reviewingApplication.youthName.toLowerCase().trim()
                );
                const associatedProgram = programs.find(
                  p => p.title === reviewingApplication.programTitle || p.id === reviewingApplication.programId
                );

                return (
                  <>
                    {/* Applicant & Program Summary Card */}
                    <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3 border-b border-gray-200/70 pb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-black text-sm shrink-0">
                            {reviewingApplication.youthName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-gray-900 truncate">
                              {reviewingApplication.youthName}
                            </h4>
                            <p className="text-[11px] text-gray-500 font-medium truncate">
                              Purok {reviewingApplication.purok}, Brgy. {reviewingApplication.barangay.replace(/^Barangay\s+/i, "")}
                            </p>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#0A6B43] border border-emerald-200 shrink-0">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          {reviewingApplication.matchScore}% Match
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            Program Applied For
                          </span>
                          <p className="font-bold text-gray-900 mt-0.5 leading-snug">
                            {reviewingApplication.programTitle}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            Available Slots
                          </span>
                          <p className="font-bold text-gray-900 mt-0.5">
                            {associatedProgram
                              ? `${associatedProgram.slotsRemaining} of ${associatedProgram.slotsTotal} slots open`
                              : "Active Program"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            Educational Attainment
                          </span>
                          <p className="font-semibold text-gray-700 mt-0.5">
                            {matchedProfile?.educationalAttainment || "Junior High School Graduate"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                            Current Status
                          </span>
                          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${reviewingApplication.status === "Approved"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                            {reviewingApplication.status}
                          </span>
                        </div>
                      </div>

                      {matchedProfile?.skills && matchedProfile.skills.length > 0 && (
                        <div className="pt-2 border-t border-gray-200/70">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1">
                            Applicant Skills
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {matchedProfile.skills.slice(0, 5).map((sk, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700 font-semibold text-[10px]">
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 1: Select Decision vs Step 2: Confirmation Step */}
                    {!pendingReviewDecision ? (
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-700">
                          Select an admissions action for this application:
                        </p>
                        <div className="grid grid-cols-1 gap-2.5">
                          {reviewingApplication.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() => setPendingReviewDecision("Approved")}
                              className="w-full p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-50 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                                  <Check className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="font-extrabold text-blue-950 text-xs group-hover:text-blue-700">
                                    Approve Application
                                  </p>
                                  <p className="text-[11px] text-blue-800/80 font-medium">
                                    Mark application as Approved for admission prior to final cohort enrollment.
                                  </p>
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-blue-600 shrink-0" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setPendingReviewDecision("Enrolled")}
                            className="w-full p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-extrabold text-emerald-950 text-xs group-hover:text-[#0A6B43]">
                                  {reviewingApplication.status === "Approved" ? "Confirm Cohort Enrollment" : "Approve & Enroll Immediately"}
                                </p>
                                <p className="text-[11px] text-emerald-800/80 font-medium">
                                  Officially admit and enroll this applicant into the training cohort.
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-[#0A6B43] shrink-0" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setPendingReviewDecision("Declined")}
                            className="w-full p-3.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0">
                                <X className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-extrabold text-red-950 text-xs group-hover:text-red-700">
                                  Decline Application
                                </p>
                                <p className="text-[11px] text-red-800/80 font-medium">
                                  Decline this application and release its reserved slot back to available capacity.
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-red-600 shrink-0" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Step 2: Explicit Confirmation Step */
                      <div className={`rounded-2xl p-4 border space-y-3 ${pendingReviewDecision === "Declined"
                          ? "bg-red-50/80 border-red-200"
                          : pendingReviewDecision === "Approved"
                            ? "bg-blue-50/80 border-blue-200"
                            : "bg-emerald-50/80 border-emerald-200"
                        }`}>
                        <div className="flex items-start gap-2.5">
                          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${pendingReviewDecision === "Declined"
                              ? "text-red-600"
                              : pendingReviewDecision === "Approved"
                                ? "text-blue-600"
                                : "text-[#0A6B43]"
                            }`} />
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-gray-900 text-xs uppercase tracking-wider">
                              Confirm Application Decision
                            </h5>
                            <p className="text-xs text-gray-700 leading-relaxed font-medium">
                              Are you sure you want to mark <strong>{reviewingApplication.youthName}</strong>&apos;s application for{" "}
                              <strong>{reviewingApplication.programTitle}</strong> as{" "}
                              <strong className="uppercase">{pendingReviewDecision}</strong>?
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {pendingReviewDecision === "Declined"
                                ? "1 training slot will be restored to the program's available capacity and the applicant will be notified."
                                : "The applicant and their barangay SK officials will be notified of this status update."}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                          <button
                            type="button"
                            disabled={!!processingReferralId}
                            onClick={() => setPendingReviewDecision(null)}
                            className="px-3.5 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            disabled={!!processingReferralId}
                            onClick={async () => {
                              const ok = await handleUpdateReferralStatus(reviewingApplication.id, pendingReviewDecision);
                              if (ok) {
                                setReviewingApplication(null);
                                setPendingReviewDecision(null);
                              }
                            }}
                            className={`px-4 py-2 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60 ${pendingReviewDecision === "Declined"
                                ? "bg-red-600 hover:bg-red-700"
                                : pendingReviewDecision === "Approved"
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : "bg-[#0A6B43] hover:bg-[#075332]"
                              }`}
                          >
                            {processingReferralId === reviewingApplication.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>Submitting...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm & {pendingReviewDecision === "Declined" ? "Decline" : pendingReviewDecision === "Approved" ? "Approve" : "Enroll"}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const app = reviewingApplication;
                  setReviewingApplication(null);
                  setPendingReviewDecision(null);
                  openApplicantModal(app);
                }}
                className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Applicant Profile</span>
              </button>
              <button
                type="button"
                disabled={!!processingReferralId}
                onClick={() => {
                  setReviewingApplication(null);
                  setPendingReviewDecision(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
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

            {/* Modal Navigation Tabs: Program Specs vs Enrollees Roster */}
            {!isEditingInModal && (
              <div className="flex items-center gap-1 sm:gap-2 px-3.5 sm:px-6 pt-1 bg-gray-50/70 border-b border-gray-200 shrink-0">
                <button
                  type="button"
                  onClick={() => setProgramModalTab("details")}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    programModalTab === "details"
                      ? "border-[#0A6B43] text-[#0A6B43]"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Program Specifications</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProgramModalTab("roster")}
                  className={`py-2 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    programModalTab === "roster"
                      ? "border-[#0A6B43] text-[#0A6B43]"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Enrollees & Applicants</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    programModalTab === "roster" ? "bg-emerald-100 text-[#0A6B43]" : "bg-gray-200 text-gray-600"
                  }`}>
                    {getProgramCohortStats(viewingProgram).total}
                  </span>
                </button>
              </div>
            )}

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
              {programModalTab === "roster" && !isEditingInModal ? (
                /* Modal Enrollees Tab Content */
                <div className="space-y-4">
                  {/* Top CTA Banner to open full-screen view */}
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-extrabold text-[#0A6B43] text-xs">Program Cohort Masterlist</p>
                        <p className="text-[11px] text-gray-600 font-medium">
                          Viewing all registered applicants and enrolled trainees for this qualification.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const targetProg = viewingProgram;
                        setViewingProgram(null);
                        setViewingProgramRoster(targetProg);
                        setProgramRosterTab("all");
                      }}
                      className="px-3.5 py-1.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>Open Full Cohort Screen & Export</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Summary Metric Chips */}
                  {(() => {
                    const stats = getProgramCohortStats(viewingProgram);
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2.5">
                          <span className="text-[9px] font-extrabold uppercase text-emerald-800 tracking-wider block">Enrolled Trainees</span>
                          <span className="text-base font-black text-emerald-950 mt-0.5 block">{stats.enrolledCount}</span>
                        </div>
                        <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5">
                          <span className="text-[9px] font-extrabold uppercase text-amber-800 tracking-wider block">Pending Review</span>
                          <span className="text-base font-black text-amber-950 mt-0.5 block">{stats.pendingCount}</span>
                        </div>
                        <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-2.5">
                          <span className="text-[9px] font-extrabold uppercase text-blue-800 tracking-wider block">Approved</span>
                          <span className="text-base font-black text-blue-950 mt-0.5 block">{stats.approvedCount}</span>
                        </div>
                        <div className="bg-purple-50/60 border border-purple-100 rounded-xl p-2.5">
                          <span className="text-[9px] font-extrabold uppercase text-purple-800 tracking-wider block">Completed</span>
                          <span className="text-base font-black text-purple-950 mt-0.5 block">{stats.completedCount}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Enrollee Table List */}
                  {(() => {
                    const stats = getProgramCohortStats(viewingProgram);
                    if (stats.cohort.length === 0) {
                      return (
                        <div className="text-center py-8 px-4 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                          <Users className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                          <p className="font-bold text-gray-700 text-xs">No Trainees or Applicants Yet</p>
                          <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                            When Katipunan ng Kabataan youths apply or get referred to this program, their profile and enrollment record will appear here.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-[11.5px]">
                            <thead>
                              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                                <th className="py-2.5 px-3">Trainee</th>
                                <th className="py-2.5 px-3">Barangay</th>
                                <th className="py-2.5 px-3">Match</th>
                                <th className="py-2.5 px-3 text-center">Status</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {stats.cohort.map(item => {
                                const statusColor =
                                  item.status === "Enrolled"
                                    ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                    : item.status === "Approved"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : item.status === "Pending"
                                        ? "bg-amber-50 text-amber-800 border-amber-200"
                                        : item.status === "Completed"
                                          ? "bg-purple-50 text-purple-700 border-purple-200"
                                          : "bg-red-50 text-red-700 border-red-200";

                                return (
                                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                    <td className="py-2.5 px-3">
                                      <div className="font-bold text-gray-900">{item.youthName}</div>
                                      <div className="text-[10px] text-gray-500">{item.youthEmail || item.email || "—"}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <div className="text-gray-700 font-medium">{item.barangay}</div>
                                      <div className="text-[10px] text-gray-400">Purok {item.purok}</div>
                                    </td>
                                    <td className="py-2.5 px-3">
                                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-[10px]">
                                        {item.matchScore || 85}%
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide ${statusColor}`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <div className="flex items-center justify-end">
                                        <button
                                          type="button"
                                          onClick={() => openApplicantModal(item)}
                                          className="px-2.5 py-1 border border-gray-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#0A6B43] text-gray-700 rounded-lg text-[10.5px] font-bold transition-colors cursor-pointer"
                                          title="View Youth Member Profile"
                                        >
                                          View Profile
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
                    );
                  })()}
                </div>
              ) : (
                /* Program Specifications Tab Content */
                <>

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
                          if (match) return match[1].toUpperCase();
                          if ((viewingProgram as any).certificationType === "None") return "None";
                          return viewingProgram.type || "None";
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
                          { value: "None", label: "None" },
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
                        {(() => {
                          const match = viewingProgram.title?.match(/(NC\s+I|NC\s+II|NC\s+III)$/i);
                          const certLabel = match
                            ? match[1].toUpperCase()
                            : (viewingProgram as any).certificationType === "None"
                              ? "None"
                              : "None";
                          return (
                            <>
                              <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase bg-emerald-50 text-[#0A6B43] border border-emerald-200">
                                {certLabel}
                              </span>
                              <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                                {certLabel === "None" ? "No National Certificate" : "National Certificate"}
                              </span>
                            </>
                          );
                        })()}
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
                            className={`h-full rounded-full transition-all duration-300 ${viewingProgram.activeStatus === "Closed"
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
                      Cost Model
                    </span>
                    {isEditingInModal ? (
                      <CustomSelect
                        value={modalEditCost}
                        onChange={(val) => setModalEditCost(val as any)}
                        options={[
                          { value: "Free", label: "Free" },
                          { value: "Subsidized", label: "Subsidized / Co-pay" },
                          { value: "With Fee", label: "Fee-based" }
                        ]}
                        size="sm"
                        buttonClassName="h-[36px] sm:h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Cost"
                      />
                    ) : (
                      <p className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                        {viewingProgram.cost === "Free" || !viewingProgram.cost ? "Free" : viewingProgram.cost}
                      </p>
                    )}
                  </div>

                  {/* Delivery Mode */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Delivery Mode
                    </span>
                    {isEditingInModal ? (
                      <CustomSelect
                        value={modalEditDeliveryMode}
                        onChange={(val) => setModalEditDeliveryMode(val)}
                        options={[
                          { value: "Face-to-Face", label: "Face-to-Face" },
                          { value: "Online Learning", label: "Online Learning" },
                          { value: "Blended Learning", label: "Blended Learning" }
                        ]}
                        size="sm"
                        buttonClassName="h-[36px] sm:h-[38px] !text-xs !rounded-xl font-medium bg-gray-50/70"
                        placeholder="Select Delivery Mode"
                      />
                    ) : (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {viewingProgram.deliveryMode || "Face-to-Face"}
                        </span>
                      </div>
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
                  <div className="min-w-0 space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1">
                      <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block truncate">
                        Training Venue / Location
                      </span>
                      {isEditingInModal ? (
                        <button
                          type="button"
                          onClick={() => {
                            setVenueMapTarget("modalEdit");
                            setVenueMapModalMode("picker");
                            setIsVenueMapModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[#0A6B43] hover:text-[#075332] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>Pin on Map</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setVenueMapModalMode("viewer");
                            setIsVenueMapModalOpen(true);
                          }}
                          className="text-[10px] font-bold text-[#0A6B43] hover:text-[#075332] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Compass className="w-3 h-3 shrink-0" />
                          <span>View Map</span>
                        </button>
                      )}
                    </div>
                    {isEditingInModal ? (
                      <div className="relative min-w-0 w-full">
                        <input
                          type="text"
                          placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                          value={extractLocationDisplay(modalEditLocation)}
                          onChange={(e) => setModalEditLocation(e.target.value)}
                          className="w-full min-w-0 h-[36px] sm:h-[38px] pl-3 pr-16 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors truncate"
                          title={extractLocationDisplay(modalEditLocation)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVenueMapTarget("modalEdit");
                            setVenueMapModalMode("picker");
                            setIsVenueMapModalOpen(true);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 text-[10px] font-extrabold rounded-md transition-colors shrink-0 z-10"
                        >
                          Map
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setVenueMapModalMode("viewer");
                          setIsVenueMapModalOpen(true);
                        }}
                        className="w-full text-left text-xs sm:text-[13px] font-bold text-[#0A6B43] hover:text-[#075332] leading-snug flex items-center justify-between gap-1.5 group cursor-pointer min-w-0"
                        title="Click to view campus map location"
                      >
                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                          <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                          <span className="truncate group-hover:underline underline-offset-2">{extractLocationDisplay(viewingProgram.location) || "San Luis Training Center"}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                          Map
                        </span>
                      </button>
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
                            className={`flex items-center gap-1 px-2 py-0.5 border rounded-lg text-[10px] font-bold cursor-pointer transition-all ${modalEditTrainingDays.includes(day)
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
                              className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md ${isProgramDay
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
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${modalEditStartTime === "08:00" && modalEditEndTime === "12:00"
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
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${modalEditStartTime === "13:00" && modalEditEndTime === "17:00"
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
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${modalEditStartTime === "08:00" && modalEditEndTime === "17:00"
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
                            className={`px-2 py-1 text-[10px] sm:text-[11px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1 cursor-pointer ${modalEditStartTime === "17:30" && modalEditEndTime === "20:30"
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
                              <span className={`text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md ${ts.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
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

              {/* Section 3: Program Description & Required Documents */}
              <div className="bg-gray-50/60 border border-gray-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-[14px] font-extrabold text-gray-900 tracking-tight">
                      Program Description & Required Documents
                    </h4>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate sm:whitespace-normal">
                      Overview of the training program and required applicant documents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:gap-4">
                  {/* Program Description */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                      Program Description
                    </span>
                    {isEditingInModal ? (
                      <div className="w-full rounded-xl border border-gray-200 bg-gray-50/70 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all overflow-hidden shadow-2xs">
                        <textarea
                          rows={3}
                          placeholder="Provide a brief description of the training program, learning objectives, and what trainees can expect..."
                          value={modalEditEligibility}
                          onChange={(e) => setModalEditEligibility(e.target.value)}
                          className="w-full p-2.5 bg-transparent border-0 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-y min-h-[70px] max-h-[160px] block modal-scrollbar"
                        />
                      </div>
                    ) : (
                      <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-start gap-2 sm:gap-2.5">
                        <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                        <p className="text-[11px] sm:text-xs text-gray-800 leading-relaxed font-medium">
                          {viewingProgram.eligibility || "No program description provided."}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Required Documents (comma separated) */}
                  <div className="space-y-0.5 sm:space-y-1 bg-white border border-gray-200/70 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs">
                    <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-0.5">
                      Required Documents (comma separated)
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
                </div>
              </div>

                </>
              )}
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

{/* ============================================================ */ }
{/* RESTORE PROGRAM CONFIRMATION MODAL */ }
{/* ============================================================ */ }
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

{/* ============================================================ */ }
{/* COHORT GRADUATION & ARCHIVAL VERIFICATION MODAL              */ }
{/* ============================================================ */ }
{
  programToArchive && (() => {
    const enrollees = referrals.filter(
      r => (r.programId === programToArchive.id || r.programTitle.toLowerCase().trim() === programToArchive.title.toLowerCase().trim()) && r.status === "Enrolled"
    );
    const evaluatedCount = enrollees.filter(e => graduationEvaluations[e.id]).length;
    const graduatedCount = enrollees.filter(e => graduationEvaluations[e.id] === "Graduated").length;
    const incompleteCount = enrollees.filter(e => graduationEvaluations[e.id] === "Incomplete").length;
    const isAllEvaluated = enrollees.length === 0 || evaluatedCount === enrollees.length;

    const markAll = (status: "Graduated" | "Incomplete") => {
      const next: Record<string, "Graduated" | "Incomplete"> = {};
      enrollees.forEach(e => { next[e.id] = status; });
      setGraduationEvaluations(next);
    };

    return (
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[70] p-3 sm:p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isArchivingProgram) {
            setProgramToArchive(null);
            setGraduationEvaluations({});
          }
        }}
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92dvh] animate-in fade-in zoom-in-95 duration-200 ease-out">

          {/* Modal Top Header */}
          <div className="bg-gradient-to-r from-[#112F24] via-[#163D2F] to-[#1A4234] text-white p-4 sm:p-5 shrink-0 border-b border-emerald-950/40">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                    Cohort Graduation Verification
                  </span>
                  <h3 className="font-black text-sm sm:text-base text-white tracking-tight leading-snug truncate">
                    Conclude & Archive: {programToArchive.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                disabled={isArchivingProgram}
                onClick={() => {
                  setProgramToArchive(null);
                  setGraduationEvaluations({});
                }}
                className="text-emerald-200/70 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar text-xs">

            {/* Information Note */}
            <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
              <p className="text-gray-700 leading-relaxed font-medium">
                To keep institutional records accurate, identify which trainees successfully completed the course. Only trainees marked as <strong>Graduated</strong> will receive certified qualifications in their Katipunan ng Kabataan credentials folder.
              </p>
            </div>

            {enrollees.length > 0 ? (
              <div className="space-y-3">
                {/* Evaluation Status & Quick Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-gray-900 uppercase tracking-wider text-[11px]">
                      Enrolled Trainees ({enrollees.length})
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${isAllEvaluated
                      ? "bg-emerald-50 text-[#0A6B43] border-emerald-300"
                      : "bg-amber-50 text-amber-800 border-amber-300"
                      }`}>
                      {isAllEvaluated ? `✓ All Evaluated (${graduatedCount} Graduated · ${incompleteCount} Incomplete)` : `Evaluated: ${evaluatedCount} of ${enrollees.length}`}
                    </span>
                  </div>

                  {/* Quick Bulk Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => markAll("Graduated")}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Mark All Graduated
                    </button>
                    <button
                      type="button"
                      onClick={() => markAll("Incomplete")}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Mark All Incomplete
                    </button>
                  </div>
                </div>

                {/* Trainee Evaluation Cards List */}
                <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                  {enrollees.map(item => {
                    const currentEval = graduationEvaluations[item.id];
                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${currentEval === "Graduated"
                          ? "bg-emerald-50/40 border-emerald-300 shadow-2xs"
                          : currentEval === "Incomplete"
                            ? "bg-amber-50/30 border-amber-300 shadow-2xs"
                            : "bg-gray-50/70 border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${currentEval === "Graduated"
                            ? "bg-emerald-600 text-white"
                            : currentEval === "Incomplete"
                              ? "bg-amber-600 text-white"
                              : "bg-gray-200 text-gray-700"
                            }`}>
                            {item.youthName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">
                              {item.youthName}
                            </h4>
                            <p className="text-[11px] text-gray-500 truncate">
                              Purok {item.purok}, Brgy. {item.barangay.replace(/^Barangay\s+/i, "")}
                            </p>
                          </div>
                        </div>

                        {/* Evaluation Toggle Buttons */}
                        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setGraduationEvaluations(prev => ({ ...prev, [item.id]: "Graduated" }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${currentEval === "Graduated"
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "bg-white hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 border border-gray-200"
                              }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Graduated</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setGraduationEvaluations(prev => ({ ...prev, [item.id]: "Incomplete" }))}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${currentEval === "Incomplete"
                              ? "bg-amber-600 text-white shadow-xs"
                              : "bg-white hover:bg-amber-50 text-gray-600 hover:text-amber-800 border border-gray-200"
                              }`}
                          >
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Incomplete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Incomplete Warning Message if any un-evaluated */}
                {!isAllEvaluated && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-amber-900">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">
                      <strong>Archive Locked:</strong> Please evaluate all {enrollees.length} enrolled trainees ({enrollees.length - evaluatedCount} remaining) before confirming. The archive button will unlock once all are evaluated.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-500 font-medium">
                No active enrolled trainees in this cohort. Archiving will safely move this program term to Archived History.
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-3.5 sm:p-4 bg-gray-50/90 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
            <span className="text-[11px] text-gray-500 text-center sm:text-left">
              {enrollees.length > 0 && isAllEvaluated
                ? `Ready to conclude: ${graduatedCount} certified graduate(s), ${incompleteCount} non-completer(s).`
                : enrollees.length === 0
                  ? "Ready to archive empty program term."
                  : `${enrollees.length - evaluatedCount} trainee(s) left to evaluate.`}
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                disabled={isArchivingProgram}
                onClick={() => {
                  setProgramToArchive(null);
                  setGraduationEvaluations({});
                }}
                className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isAllEvaluated || isArchivingProgram}
                onClick={async () => {
                  if (programToArchive) {
                    await handleArchiveProgram(programToArchive.id, programToArchive.title, graduationEvaluations);
                  }
                }}
                className={`flex-1 sm:flex-none px-5 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 text-center ${isAllEvaluated && !isArchivingProgram
                  ? "bg-[#0A6B43] hover:bg-[#075332] active:scale-95 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                  }`}
              >
                {isArchivingProgram ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    <span>Archiving Term...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 shrink-0" />
                    <span>Conclude & Archive Term</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  })()
}

{/* ============================================================ */ }
{/* DELETE PROGRAM CONFIRMATION MODAL */ }
{/* ============================================================ */ }
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

      {/* Training Venue Map Modal for TESDA Partner */}
      <TrainingVenueMapModal
        isOpen={isVenueMapModalOpen}
        onClose={() => setIsVenueMapModalOpen(false)}
        mode={venueMapModalMode}
        programTitle={venueMapTarget === "create" || venueMapTarget === "editModal" ? progTitle : (viewingProgram?.title || progTitle)}
        provider={viewingProgram?.provider || "TESDA Partner"}
        initialLocation={
          venueMapModalMode === "viewer"
            ? (viewingProgram?.location || progLocation)
            : (venueMapTarget === "create" || venueMapTarget === "editModal" ? progLocation : modalEditLocation)
        }
        initialLat={
          venueMapModalMode === "viewer"
            ? (viewingProgram?.latitude || progLat)
            : (venueMapTarget === "create" || venueMapTarget === "editModal" ? progLat : modalEditLat)
        }
        initialLng={
          venueMapModalMode === "viewer"
            ? (viewingProgram?.longitude || progLng)
            : (venueMapTarget === "create" || venueMapTarget === "editModal" ? progLng : modalEditLng)
        }
        room={viewingProgram?.room || progRoom}
        instructor={viewingProgram?.instructor || progInstructor}
        contactPerson={viewingProgram?.contactPerson || savedRepName}
        contactNumber={viewingProgram?.contactNumber || savedRepPhone}
        onSelectLocation={(res: { location: string; latitude: number; longitude: number }) => {
          const locWithCoords = formatLocationWithCoords(res.location, res.latitude, res.longitude);
          if (venueMapTarget === "create" || venueMapTarget === "editModal") {
            setProgLocation(locWithCoords);
            setProgLat(res.latitude);
            setProgLng(res.longitude);
          } else {
            setModalEditLocation(locWithCoords);
            setModalEditLat(res.latitude);
            setModalEditLng(res.longitude);
          }
        }}
      />
    </div>
  );
};
