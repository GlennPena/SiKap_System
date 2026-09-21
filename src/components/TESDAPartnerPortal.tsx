"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Briefcase, Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, SlidersHorizontal, Eye, MapPin, GraduationCap, Info, User,
  Trash2, Pencil, Bell, CheckCircle, Clock, AlertTriangle, Sparkles, Filter, ChevronRight, CheckCircle2,
  Building, UserCheck, ShieldCheck, Layers, ArrowUpRight, Archive, Calculator,
  Lock, EyeOff, Edit, ShieldAlert, Copy, Menu
} from "lucide-react";
import { TESDAProgram, ReferralPipelineItem, TESDAPartnerScreen, YouthProfile } from "../types";
import { MetricCard, SikapLogo, ConfirmationModal } from "./ReusableComponents";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { CATEGORIES } from "../lib/cbf-taxonomy-data";
import { formatProgramTime, formatTrainingDays, formatProgramTimeslot, getProgramFullSchedule, formatProgramDate, formatProgramDateRange, computeProgramTrainingHours } from "../lib/cbf-matcher";

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
  const [notificationsRead, setNotificationsRead] = useState(false);

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
            } catch {}
          }
        }
        return Array.from(new Set(loaded));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Re-synchronize cleared notifications whenever TESDA user updates
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
          } catch {}
        }
      }
      if (loaded.length > 0) {
        setClearedNotificationIds(prev => Array.from(new Set([...prev, ...loaded])));
      }
    } catch (e) {
      console.error("Failed to sync cleared notifications in TESDA portal:", e);
    }
  }, [currentUser?.email, currentUser?.id]);

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

  // Selected applicant for detail view modal
  const [selectedApplicant, setSelectedApplicant] = useState<YouthProfile | null>(null);

  // Selected program for detail view modal
  const [viewingProgram, setViewingProgram] = useState<TESDAProgram | null>(null);

  // Program edit modal state (stays on current screen)
  const [editingProgramModal, setEditingProgramModal] = useState<TESDAProgram | null>(null);

  // Program delete confirmation modal state
  const [programToDelete, setProgramToDelete] = useState<TESDAProgram | null>(null);

  // Program archive confirmation modal state
  const [programToArchive, setProgramToArchive] = useState<TESDAProgram | null>(null);

  // Archived records state for the Archived History tab
  const [archivedProgramsList, setArchivedProgramsList] = useState<TESDAProgram[]>([]);
  const [archivedReferralsList, setArchivedReferralsList] = useState<ReferralPipelineItem[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

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

  // Programs Screen Search & Filter
  const [programSearchQuery, setProgramSearchQuery] = useState("");
  const [programLevelFilter, setProgramLevelFilter] = useState("All");

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
        setReferrals(prev => prev.map(item => {
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
      } else {
        addToast(data.error || "Failed to update application status", "error");
      }
    } catch (err) {
      console.error("Error updating referral status:", err);
      addToast("Network error: Failed to update application status.", "error");
    }
  };

  const handleDeleteProgram = async (progId: string, title: string) => {
    try {
      const res = await fetch(`/api/programs?id=${progId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPrograms(prev => prev.filter(p => p.id !== progId));
        setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
        addToast(data.message || `Program "${title}" and its enrollees removed from active dashboard and archived in database.`, "success");
      } else {
        addToast(data.error || "Failed to delete program", "error");
      }
    } catch (err) {
      console.error("Error deleting program:", err);
      setPrograms(prev => prev.filter(p => p.id !== progId));
      setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
      addToast(`Program "${title}" has been archived.`, "success");
    }
  };

  const handleArchiveProgram = async (progId: string, title: string) => {
    try {
      const res = await fetch(`/api/programs?id=${progId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPrograms(prev => prev.filter(p => p.id !== progId));
        setReferrals(prev => prev.filter(r => r.programTitle !== title && r.programId !== progId));
        addToast(data.message || `Program "${title}" and enrolled students have been concluded & archived. Ready for a new term!`, "success");
      } else {
        addToast(data.error || "Failed to archive program term", "error");
      }
    } catch (err) {
      console.error("Error archiving program:", err);
      addToast(`Network error: Could not archive "${title}".`, "error");
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
    return referrals.filter(item => {
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

  // Filter for Programs Screen
  const filteredProgramsList = useMemo(() => {
    return activePrograms.filter(prog => {
      const matchesSearch = prog.title.toLowerCase().includes(programSearchQuery.toLowerCase()) ||
                            (prog.location && prog.location.toLowerCase().includes(programSearchQuery.toLowerCase())) ||
                            (prog.instructor && prog.instructor.toLowerCase().includes(programSearchQuery.toLowerCase()));
      const matchesLevel = programLevelFilter === "All" || prog.title.toUpperCase().includes(programLevelFilter);
      return matchesSearch && matchesLevel;
    });
  }, [activePrograms, programSearchQuery, programLevelFilter]);

  // Helper to open applicant modal
  const openApplicantModal = (item: ReferralPipelineItem) => {
    const matchedProfile = youthProfiles.find(y => y.name.toLowerCase().trim() === item.youthName.toLowerCase().trim());
    if (matchedProfile) {
      setSelectedApplicant(matchedProfile);
    } else {
      setSelectedApplicant({
        id: item.id,
        name: item.youthName,
        age: 20,
        purok: item.purok,
        barangay: item.barangay,
        educationalAttainment: "High School Graduate",
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
    <div className="h-screen overflow-hidden bg-[#F8FAF9] flex font-sans text-slate-800 antialiased" id="tesda-portal-container">
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-64 h-screen shrink-0 bg-[#112F24] text-white flex flex-col justify-between shadow-2xl lg:shadow-xl select-none overflow-hidden transform transition-transform duration-300 ease-in-out ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="overflow-y-auto min-h-0 flex-1">
          {/* Brand Header */}
          <div className="p-5 sm:p-6 border-b border-emerald-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SikapLogo size={32} variant="white" showText={true} />
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/40">
                Partner
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="px-5 sm:px-6 text-[11px] text-emerald-300/70 font-medium pt-2">TESDA Training & Livelihood Hub</p>

          {/* Navigation Links */}
          <div className="px-4 py-4 space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-emerald-400/60 mb-2">Main Portals</p>
            
            <button
              onClick={() => {
                setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
                setDashboardTab("all");
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentScreen === TESDAPartnerScreen.DASHBOARD
                  ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900 text-emerald-200 shadow-sm border-l-4 border-emerald-400"
                  : "text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-emerald-400" />
                <span>Dashboard & Pipeline</span>
              </div>
              {pendingReferralsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.2 rounded-full shadow-xs">
                  {pendingReferralsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentScreen === TESDAPartnerScreen.PROGRAMS
                  ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900 text-emerald-200 shadow-sm border-l-4 border-emerald-400"
                  : "text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span>Published Courses</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300/80 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/40">
                {activePrograms.length}
              </span>
            </button>

            <button
              onClick={() => {
                handleNewProgramClick();
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM
                  ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900 text-emerald-200 shadow-sm border-l-4 border-emerald-400"
                  : "text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Post New Course</span>
            </button>

            <button
              onClick={() => {
                setCurrentScreen(TESDAPartnerScreen.SETTINGS);
                setIsMobileNavOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentScreen === TESDAPartnerScreen.SETTINGS
                  ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900 text-emerald-200 shadow-sm border-l-4 border-emerald-400"
                  : "text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
              <Bell className="w-4 h-4 text-emerald-400" />
              <span>Partner Profile & Alerts</span>
            </button>
          </div>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#0c241b] shrink-0">
          <div
            onClick={() => {
              setCurrentScreen(TESDAPartnerScreen.SETTINGS);
              setIsMobileNavOpen(false);
            }}
            className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/30 cursor-pointer transition-all"
            title="Click to view Profile & Notification Preferences"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
              {currentUser?.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-emerald-100 truncate">{currentUser?.name || "TESDA Officer"}</p>
              <p className="text-[10px] text-emerald-300/70 truncate">{currentUser?.email || "GPSAT Guagua / San Luis"}</p>
            </div>
          </div>
          
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 rounded-xl transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-1.5 sm:p-2 -ml-1 text-slate-700 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="p-2 bg-emerald-50 text-[#0A6B43] rounded-xl border border-emerald-100 hidden sm:block shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h1 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 tracking-tight leading-tight truncate block">
                  {currentUser?.name || "TESDA GPSAT"} Portal
                </h1>
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                  San Luis Matchmaker
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 truncate block">
                Katipunan ng Kabataan (KK) Out-of-School Youth Admissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick Action: New Program */}
            <button
              onClick={handleNewProgramClick}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Course</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              {(() => {
                const tesdaNotifications: Array<{
                  id: string;
                  title: string;
                  desc: string;
                  icon: React.ReactNode;
                  bg: string;
                  action: () => void;
                }> = [];

                if (pendingReferralsCount > 0) {
                  tesdaNotifications.push({
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
                  tesdaNotifications.push({
                    id: "notif-tesda-programs",
                    title: `Active Training Programs (${activePrograms.length})`,
                    desc: `${totalSlotsRemaining} open training slots available across courses.`,
                    icon: <BookOpen className="w-4 h-4 text-[#0A6B43]" />,
                    bg: "bg-emerald-100/70",
                    action: () => {
                      setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                    }
                  });
                }

                const activeNotifs = tesdaNotifications.filter(n => !clearedNotificationIds.includes(n.id));

                return (
                  <>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative p-2.5 text-slate-600 hover:text-[#0A6B43] bg-slate-100/80 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer ${
                        showNotifications ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-300" : ""
                      }`}
                      title="TESDA Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {!notificationsRead && activeNotifs.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                          {activeNotifs.length}
                        </span>
                      )}
                    </button>

                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="fixed inset-x-3.5 top-16 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-12 sm:mt-0 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-emerald-50/70 shrink-0">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-[#0A6B43]" />
                              <span className="font-extrabold text-slate-900 text-xs">TESDA Action Center</span>
                              {activeNotifs.length > 0 && (
                                <span className="bg-[#0A6B43] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                                  {activeNotifs.length}
                                </span>
                              )}
                            </div>
                            {activeNotifs.length > 0 && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    clearAllNotifications(tesdaNotifications.map(n => n.id));
                                    addToast("All notifications marked as read & cleared", "info");
                                  }}
                                  className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                  title="Mark all as read & clear"
                                >
                                  Mark read
                                </button>
                                <span className="text-gray-300">·</span>
                                <button
                                  onClick={() => {
                                    clearAllNotifications(tesdaNotifications.map(n => n.id));
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

                          <NotificationSettingsCard compact userRole="TESDA_PARTNER" addToast={addToast} />

                          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                            {activeNotifs.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                                <p className="text-xs font-bold text-gray-700">All caught up!</p>
                                <p className="text-[10px] text-gray-400">No active alerts or pending youth action items right now.</p>
                              </div>
                            ) : (
                              activeNotifs.map((n) => (
                                <div
                                  key={n.id}
                                  onClick={() => {
                                    dismissNotification(n.id);
                                    n.action();
                                    setShowNotifications(false);
                                  }}
                                  className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3 group relative"
                                >
                                  <div className={`p-2 rounded-xl ${n.bg} shrink-0 mt-0.5`}>
                                    {n.icon}
                                  </div>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-bold text-slate-900 text-xs">{n.title}</p>
                                    <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">{n.desc}</p>
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
                            <span className="text-[10px] font-bold text-gray-400">Click an action to navigate, or ✕ to dismiss</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ============================================================ */}
          {/* SCREEN 1: DASHBOARD & PIPELINE */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.DASHBOARD && (
            <div className="space-y-6">
              
              {/* Alert Banner if Programs have reached end date */}
              {completedPrograms.length > 0 && (
                <div className="bg-gradient-to-r from-purple-500/10 via-purple-50 to-indigo-50 border border-purple-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                          Training Term Concluded ({completedPrograms.length})
                        </h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                          Ready to Archive
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {completedPrograms.length === 1 ? (
                          <>
                            <strong>"{completedPrograms[0].title}"</strong> training schedule has ended. Click below to archive the course and graduate its enrollees.
                          </>
                        ) : (
                          <>
                            {completedPrograms.length} training courses have concluded their schedules. You can archive them to graduate their enrollees.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {completedPrograms.map(prog => (
                      <button
                        key={prog.id}
                        type="button"
                        onClick={() => setProgramToArchive(prog)}
                        className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Archive course and record enrollees as completed/graduated"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Archive {completedPrograms.length > 1 ? prog.title.slice(0, 15) + '...' : 'Term & Enrollees'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert Banner if Pending Applicants */}
              {pendingReferralsCount > 0 && (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">Action Required: New Applicants</h4>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        You have <span className="font-bold text-amber-800">{pendingReferralsCount} Katipunan ng Kabataan</span> candidate(s) awaiting enrollment review.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDashboardTab("pending")}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
                  >
                    Review Pending ({pendingReferralsCount})
                  </button>
                </div>
              )}

              {/* KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Published Courses"
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

              {/* View Selector Tabs & Global Search */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  {/* Segment Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl flex-wrap">
                    <button
                      onClick={() => setDashboardTab("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dashboardTab === "all"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All Active ({activeReferrals.length})
                    </button>
                    <button
                      onClick={() => setDashboardTab("pending")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        dashboardTab === "pending"
                          ? "bg-white text-amber-700 shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span>Pending</span>
                      {pendingReferralsCount > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                          {pendingReferralsCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setDashboardTab("enrolled")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dashboardTab === "enrolled"
                          ? "bg-white text-emerald-700 shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Enrolled ({enrolledReferralsCount})
                    </button>
                    <button
                      onClick={() => setDashboardTab("programs")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dashboardTab === "programs"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Course Roster ({activePrograms.length})
                    </button>
                    <button
                      onClick={() => {
                        setDashboardTab("archived");
                        fetchArchivedData();
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        dashboardTab === "archived"
                          ? "bg-white text-emerald-800 shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
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
                      className="px-3 py-1.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Course
                    </button>
                  </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search applicant, purok, or course..."
                      value={pipelineSearch}
                      onChange={(e) => setPipelineSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition-all"
                    />
                  </div>

                  {/* Program Filter */}
                  <div className="relative">
                    <select
                      value={pipelineProgramFilter}
                      onChange={(e) => setPipelineProgramFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer truncate"
                    >
                      <option value="All">All Training Programs</option>
                      {activePrograms.map(p => (
                        <option key={p.id} value={p.title}>{p.title}</option>
                      ))}
                    </select>
                  </div>

                  {/* Barangay Filter */}
                  <div className="relative">
                    <select
                      value={pipelineBarangayFilter}
                      onChange={(e) => setPipelineBarangayFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Barangays (San Luis)</option>
                      {uniqueBarangays.map(b => (
                        <option key={b} value={b}>Brgy. {b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={pipelineStatusFilter}
                      onChange={(e) => setPipelineStatusFilter(e.target.value)}
                      disabled={dashboardTab !== "all"}
                      className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer ${
                        dashboardTab !== "all" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending Review</option>
                      <option value="Enrolled">Enrolled</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>
                </div>

                {/* Active Filter Clear Bar */}
                {isSearchActive && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 font-medium">
                      Showing <strong className="text-slate-900">{filteredReferrals.length}</strong> candidate match(es) across programs
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
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">No applicants found matching current filters</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Try adjusting your search query, status filters, or barangay selections.
                      </p>
                    </div>
                  ) : (
                    programTitlesToDisplay.map((title) => {
                      const programApplicants = groupedReferrals[title] || [];
                      const isExpanded = expandedPrograms[title] !== false;
                      const originalProgram = activePrograms.find(p => p.title === title);
                      const slotsRemaining = originalProgram?.slotsRemaining;
                      const slotsTotal = originalProgram?.slotsTotal || 30;

                      return (
                        <div key={title} className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
                          {/* Program Accordion Header */}
                          <div 
                            onClick={() => toggleProgramExpand(title)}
                            className="p-4 bg-gradient-to-r from-[#112F24] via-[#164132] to-[#1A4B3A] text-white border-b border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer transition-all hover:brightness-105 shadow-xs"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center justify-center font-black shrink-0 shadow-xs">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-extrabold text-sm text-white truncate" title={title}>
                                    {title}
                                  </h3>
                                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                                    {programApplicants.length} Candidate{programApplicants.length !== 1 ? "s" : ""}
                                  </span>
                                  {isProgramDurationDone(originalProgram) && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/40 flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-purple-300" /> Term Ended
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-emerald-200/80 mt-1 flex-wrap font-medium">
                                  {originalProgram?.trainingHours && (
                                    <span className="bg-emerald-950/70 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-700/40">
                                      ⏱ {originalProgram.trainingHours} Hours
                                    </span>
                                  )}
                                  {originalProgram && (
                                    <span className="bg-emerald-950/80 text-emerald-200 px-2.5 py-0.5 rounded-md border border-emerald-700/50 flex items-center gap-1.5 font-bold">
                                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                      <span>{getProgramFullSchedule(originalProgram)}</span>
                                    </span>
                                  )}
                                  {originalProgram?.location && (
                                    <span className="truncate">📍 {originalProgram.location}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Capacity Indicator & Actions */}
                            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                              {originalProgram && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProgramToArchive(originalProgram);
                                  }}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                    isProgramDurationDone(originalProgram)
                                      ? "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                                      : "bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-600/40"
                                  }`}
                                  title={isProgramDurationDone(originalProgram) ? "Training Concluded: Archive Term & Enrollees" : "Conclude & Archive Program Term"}
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                  <span>{isProgramDurationDone(originalProgram) ? "Archive Term & Enrollees" : "Archive"}</span>
                                </button>
                              )}

                              {slotsRemaining !== undefined && (
                                <div className="text-right hidden sm:block">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className={`text-xs font-black ${
                                      slotsRemaining > 5 ? "text-emerald-300" : slotsRemaining > 0 ? "text-amber-300" : "text-red-300"
                                    }`}>
                                      {slotsRemaining} / {slotsTotal} Slots Left
                                    </span>
                                  </div>
                                  <div className="w-24 bg-emerald-950/80 h-1.5 rounded-full overflow-hidden mt-1 ml-auto border border-emerald-700/40">
                                    <div 
                                      className={`h-full rounded-full ${
                                        slotsRemaining > 5 ? "bg-emerald-400" : slotsRemaining > 0 ? "bg-amber-400" : "bg-red-400"
                                      }`}
                                      style={{ width: `${Math.min(100, Math.round(((slotsTotal - slotsRemaining) / slotsTotal) * 100))}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="w-8 h-8 rounded-lg bg-white/10 text-emerald-200 flex items-center justify-center border border-white/10">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </div>
                          </div>

                          {/* Candidate List Body */}
                          {isExpanded && (
                            <div className="overflow-x-auto">
                              {programApplicants.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400 font-medium">
                                  No applicants enrolled or registered under this program for the selected filters.
                                </div>
                              ) : (
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50/60 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                                      <th className="py-3 px-5">Candidate Name</th>
                                      <th className="py-3 px-4">Barangay & Purok</th>
                                      <th className="py-3 px-4">Match Score</th>
                                      <th className="py-3 px-4">Applied Date</th>
                                      <th className="py-3 px-4">Status</th>
                                      <th className="py-3 px-5 text-right">Admissions Action</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {programApplicants.map((item) => (
                                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Name & Quick Profile */}
                                        <td className="py-3.5 px-5">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black text-xs shrink-0">
                                              {item.youthName.charAt(0)}
                                            </div>
                                            <div>
                                              <button
                                                onClick={() => openApplicantModal(item)}
                                                className="font-bold text-slate-900 hover:text-[#0A6B43] hover:underline cursor-pointer text-left block"
                                              >
                                                {item.youthName}
                                              </button>
                                              <span className="text-[10px] text-slate-400 font-medium">
                                                Katipunan ng Kabataan
                                              </span>
                                            </div>
                                          </div>
                                        </td>

                                        {/* Residency */}
                                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                                          <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span>Purok {item.purok}, Brgy. {item.barangay}</span>
                                          </div>
                                        </td>

                                        {/* Match Score */}
                                        <td className="py-3.5 px-4">
                                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                                            <Sparkles className="w-3 h-3 text-emerald-600" />
                                            {item.matchScore}% AI Match
                                          </span>
                                        </td>

                                        {/* Applied Date */}
                                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                                          {item.referralDate}
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3.5 px-4">
                                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                            item.status === "Enrolled"
                                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                              : item.status === "Pending"
                                              ? "bg-amber-50 text-amber-800 border-amber-200"
                                              : "bg-red-50 text-red-800 border-red-200"
                                          }`}>
                                            {item.status}
                                          </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-5 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              onClick={() => openApplicantModal(item)}
                                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                              title="View Full Profile Dossier"
                                            >
                                              <Eye className="w-3.5 h-3.5" />
                                              <span className="hidden sm:inline">Profile</span>
                                            </button>

                                            {item.status === "Pending" ? (
                                              <>
                                                <button
                                                  onClick={() => handleUpdateReferralStatus(item.id, "Enrolled")}
                                                  className="px-3 py-1.5 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                                  title="Accept & Enroll Trainee"
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                  <span>Enroll</span>
                                                </button>
                                                <button
                                                  onClick={() => handleUpdateReferralStatus(item.id, "Declined")}
                                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                                  title="Decline Application"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </button>
                                              </>
                                            ) : (
                                              <span className="text-[10px] text-slate-400 font-bold px-2 py-1 bg-slate-50 rounded-md">
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
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 4: Course Roster Grid */}
              {/* ============================================================ */}
              {dashboardTab === "programs" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {activePrograms.map((prog) => (
                    <div key={prog.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group">
                      <div className="p-5">
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                            {prog.cost} · {prog.trainingHours}h
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isProgramDurationDone(prog) && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-purple-600" /> Ended
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              prog.slotsRemaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}>
                              {prog.slotsRemaining > 0 ? `${prog.slotsRemaining} Slots Left` : "Full Capacity"}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-[#0A6B43] transition-colors leading-tight mb-2">
                          {prog.title}
                        </h3>

                        <div className="space-y-2 text-xs text-slate-600 mb-4">
                          {/* Schedule & Timeslot Badge */}
                          <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule & Timeslot</p>
                                <p className="text-xs font-black text-slate-900 truncate">
                                  {getProgramFullSchedule(prog)}
                                </p>
                              </div>
                            </div>
                            {(() => {
                              const ts = formatProgramTimeslot(prog.startTime, prog.endTime);
                              return ts.sessionType !== "Custom" ? (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
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
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{prog.location || "San Luis Municipal Center"}</span>
                          </div>
                          {prog.instructor && (
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">Trainer: {prog.instructor}</span>
                            </div>
                          )}
                          {(prog.startDate || prog.endDate) && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{formatProgramDateRange(prog.startDate, prog.endDate)}</span>
                            </div>
                          )}
                        </div>

                        {/* Capacity meter */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1">
                            <span>Enrollment Capacity</span>
                            <span>{prog.slotsTotal - prog.slotsRemaining} / {prog.slotsTotal}</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#0A6B43] h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.round(((prog.slotsTotal - prog.slotsRemaining) / prog.slotsTotal) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => setViewingProgram(prog)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Details
                        </button>
                        <div className="flex items-center gap-1">
                          {isProgramDurationDone(prog) ? (
                            <button
                              onClick={() => setProgramToArchive(prog)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Conclude Term & Archive Students"
                            >
                              <Archive className="w-3 h-3" /> Archive Term
                            </button>
                          ) : (
                            <button
                              onClick={() => setProgramToArchive(prog)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Archive Program"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(prog)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Program"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProgramToDelete(prog)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ============================================================ */}
              {/* TAB 5: Archived History (Closed/Concluded Courses & Trainees) */}
              {/* ============================================================ */}
              {dashboardTab === "archived" && (
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        <Archive className="w-4 h-4 text-emerald-700" />
                        Archived Training Programs & Graduated Trainees
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Historical repository of concluded and deleted training terms. The active dashboard remains uncluttered while graduate records and audit trails remain safely preserved.
                      </p>
                    </div>
                    <button
                      onClick={fetchArchivedData}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      Refresh Archive
                    </button>
                  </div>

                  {loadingArchived ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                      <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-slate-500 font-bold">Loading archived records from database...</p>
                    </div>
                  ) : archivedProgramsList.length === 0 && archivedReferralsList.length === 0 ? (
                    <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                      <Archive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-900">No Archived Programs or Enrollees</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        When you archive a program or conclude a training term whose duration is done, it will be safely filed here and hidden from your active dashboard.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Archived Courses Grid */}
                      {archivedProgramsList.length > 0 && (
                        <div>
                          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                            Concluded & Archived Programs ({archivedProgramsList.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {archivedProgramsList.map(prog => {
                              const programArchivedEnrollees = archivedReferralsList.filter(r => r.programTitle === prog.title || r.programId === prog.id);
                              return (
                                <div key={prog.id} className="bg-slate-50/90 border border-slate-200 rounded-2xl p-5 shadow-xs">
                                  <div className="flex justify-between items-start gap-2 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                                      Archived Term
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {prog.trainingHours}h · {prog.cost}
                                    </span>
                                  </div>
                                  <h4 className="font-extrabold text-sm text-slate-900 mb-2">{prog.title}</h4>
                                  <div className="space-y-1 text-xs text-slate-500 mb-3">
                                    {prog.location && <p className="truncate">📍 {prog.location}</p>}
                                    {prog.endDate && <p className="truncate">⏱ Concluded on: {formatProgramDate(prog.endDate)}</p>}
                                  </div>
                                  <div className="pt-2 border-t border-slate-200/60 flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">Archived Enrollees</span>
                                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                      {programArchivedEnrollees.length} Trainees
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Archived Enrollees Table */}
                      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                            Archived Enrollees & Graduates Record ({archivedReferralsList.length})
                          </h4>
                        </div>
                        {archivedReferralsList.length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 font-medium">
                            No student records currently marked as archived.
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider border-b border-slate-100">
                                  <th className="py-3 px-4">Candidate Name</th>
                                  <th className="py-3 px-4">Barangay & Purok</th>
                                  <th className="py-3 px-4">Archived Program</th>
                                  <th className="py-3 px-4">Match Score</th>
                                  <th className="py-3 px-4">Record Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {archivedReferralsList.map(item => (
                                  <tr key={item.id} className="hover:bg-slate-50/80">
                                    <td className="py-3 px-4 font-bold text-slate-900">
                                      {item.youthName}
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">
                                      Purok {item.purok}, Brgy. {item.barangay}
                                    </td>
                                    <td className="py-3 px-4 font-medium text-slate-700">
                                      {item.programTitle}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        {item.matchScore}% Match
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
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
              {/* Header with Search and New Program Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Active Technical-Vocational Programs</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Manage and post technical courses certified under TESDA for San Luis youths</p>
                </div>
                <button
                  onClick={handleNewProgramClick}
                  className="px-4 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Post New Course
                </button>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by course title, trainer, location..."
                    value={programSearchQuery}
                    onChange={(e) => setProgramSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="min-w-[160px]">
                  <select
                    value={programLevelFilter}
                    onChange={(e) => setProgramLevelFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Certifications</option>
                    <option value="NC I">NC I Courses</option>
                    <option value="NC II">NC II Courses</option>
                    <option value="NC III">NC III Courses</option>
                  </select>
                </div>
              </div>

              {/* Programs Grid */}
              {filteredProgramsList.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center">
                  <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-slate-900">No training programs found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try clearing your search terms or create a new course listing.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProgramsList.map((prog) => {
                    const applicantsCount = referrals.filter(r => r.programTitle === prog.title).length;
                    const enrolledCount = referrals.filter(r => r.programTitle === prog.title && r.status === "Enrolled").length;

                    return (
                      <div key={prog.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
                        <div className="p-6">
                          <div className="flex justify-between items-start gap-2 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                              {prog.type || "Training"} Course
                            </span>
                            <div className="flex items-center gap-1.5">
                              {isProgramDurationDone(prog) && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-600" /> Term Ended
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                prog.slotsRemaining > 0 ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
                              }`}>
                                {prog.slotsRemaining > 0 ? `${prog.slotsRemaining} Slots Open` : "Full"}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-[#0A6B43] transition-colors leading-tight mb-2">
                            {prog.title}
                          </h3>

                          <p className="text-xs text-slate-500 font-medium mb-4">
                            ⏱ {prog.trainingHours} Training Hours · {prog.cost}
                          </p>

                          <div className="space-y-2 text-xs text-slate-600 mb-5">
                            {/* Schedule & Timeslot Badge */}
                            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Schedule & Timeslot</p>
                                  <p className="text-xs font-black text-slate-900 truncate">
                                    {getProgramFullSchedule(prog)}
                                  </p>
                                </div>
                              </div>
                              {(() => {
                                const ts = formatProgramTimeslot(prog.startTime, prog.endTime);
                                return ts.sessionType !== "Custom" ? (
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
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
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="truncate">{prog.location || "San Luis Municipal Hub"}</span>
                            </div>
                            {prog.instructor && (
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">Instructor: {prog.instructor}</span>
                              </div>
                            )}
                            {(prog.startDate || prog.endDate) && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{formatProgramDateRange(prog.startDate, prog.endDate)}</span>
                              </div>
                            )}
                          </div>

                          {/* Enrollment Progress */}
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 mb-1.5">
                              <span>Admissions Progress</span>
                              <span>{enrolledCount} Enrolled / {applicantsCount} Applied</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#0A6B43] h-full rounded-full"
                                style={{ width: `${Math.min(100, Math.round((enrolledCount / (prog.slotsTotal || 30)) * 100))}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                          <button
                            onClick={() => setViewingProgram(prog)}
                            className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Syllabus
                          </button>

                          <div className="flex items-center gap-1.5">
                            {isProgramDurationDone(prog) ? (
                              <button
                                onClick={() => setProgramToArchive(prog)}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Conclude Term & Archive Students"
                              >
                                <Archive className="w-3.5 h-3.5" /> Archive Term
                              </button>
                            ) : (
                              <button
                                onClick={() => setProgramToArchive(prog)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Archive Program"
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(prog)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => setProgramToDelete(prog)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Course"
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
          )}

          {/* ============================================================ */}
          {/* SCREEN 3: ADD / EDIT PROGRAM (ORGANIZED 2-COL FORM) */}
          {/* ============================================================ */}
          {(currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM) && (
            <div className="space-y-6">
              {/* Back Button & Header */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
                  className="text-slate-600 hover:text-[#0A6B43] font-bold text-xs flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    {editingProgramId ? "Modify Training Course" : "Post New Technical-Vocational Course"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Configure curriculum parameters, schedules, capacity, and candidate prerequisites
                  </p>
                </div>
              </div>

              {/* Form Layout: Expanded Form */}
              <div className="max-w-4xl mx-auto w-full">
                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-8">
                  <form onSubmit={handleAddProgramSubmit} className="space-y-6">
                    
                    {/* Section 1: Course Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Basic Course Identity</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="sm:col-span-2 space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Training Course Title *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Shielded Metal Arc Welding, Bread & Pastry Production"
                            value={progTitle}
                            onChange={(e) => setProgTitle(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Certification Level</label>
                          <select
                            value={progLevel}
                            onChange={(e) => setProgLevel(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="NC I">NC I</option>
                            <option value="NC II">NC II</option>
                            <option value="NC III">NC III</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-emerald-700 uppercase">Vocational Category *</label>
                          <select
                            value={progCategoryId}
                            onChange={(e) => setProgCategoryId(e.target.value)}
                            className="w-full p-2.5 border border-emerald-300 bg-emerald-50/60 font-bold rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Training Hours *</label>
                            {computedTrainingHours && (
                              <button
                                type="button"
                                onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                                className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                                title="Click to auto-apply computed hours"
                              >
                                ⚡ Auto: {computedTrainingHours.totalHours}h
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
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Slot Allocation *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            placeholder="e.g. 25"
                            value={progSlots}
                            onChange={(e) => setProgSlots(e.target.value === "" ? "" : Number(e.target.value))}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Cost Model</label>
                          <select
                            value={progCost}
                            onChange={(e) => setProgCost(e.target.value as any)}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="Free">Free (TESDA Subsidized)</option>
                            <option value="Subsidized">Subsidized / Co-pay</option>
                            <option value="With Fee">Fee-based</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Schedule & Venue */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Schedule, Facility & Trainer</h4>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Training Venue / Location</label>
                          <input
                            type="text"
                            placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                            value={progLocation}
                            onChange={(e) => setProgLocation(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Assigned Room / Facility</label>
                          <input
                            type="text"
                            placeholder="e.g. Workshop Room B-102, Computer Lab 1"
                            value={progRoom}
                            onChange={(e) => setProgRoom(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase block">Training Days</label>
                        <div className="flex flex-wrap gap-2">
                          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                            <label key={day} className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                              progTrainingDays.includes(day)
                                ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
                      <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700 uppercase">Training Timeslot</label>
                          <span className="text-[10px] text-slate-400 font-medium">Select preset or set custom hours</span>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("morning")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              progStartTime === "08:00" && progEndTime === "12:00"
                                ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            🌅 Morning (8 AM – 12 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("afternoon")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              progStartTime === "13:00" && progEndTime === "17:00"
                                ? "bg-blue-100 text-blue-900 border-blue-300 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            ☀️ Afternoon (1 PM – 5 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("fullday")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              progStartTime === "08:00" && progEndTime === "17:00"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            🏢 Full Day (8 AM – 5 PM)
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTimeslotPreset("evening")}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                              progStartTime === "17:30" && progEndTime === "20:30"
                                ? "bg-purple-100 text-purple-900 border-purple-300 shadow-2xs"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            🌙 Evening (5:30 PM – 8:30 PM)
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Start Time</label>
                            <input
                              type="time"
                              value={progStartTime}
                              onChange={(e) => setProgStartTime(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">End Time</label>
                            <input
                              type="time"
                              value={progEndTime}
                              onChange={(e) => setProgEndTime(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Live Schedule Preview */}
                        <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Display</p>
                              <p className="text-xs font-black text-slate-900">
                                {formatTrainingDays(progTrainingDays)} · {formatProgramTimeslot(progStartTime, progEndTime).formattedRange}
                              </p>
                            </div>
                          </div>
                          {(() => {
                            const ts = formatProgramTimeslot(progStartTime, progEndTime);
                            return ts.sessionType !== "Custom" ? (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Start Date</label>
                          <input
                            type="date"
                            value={progStartDate}
                            onChange={(e) => setProgStartDate(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">End Date</label>
                          <input
                            type="date"
                            value={progEndDate}
                            onChange={(e) => setProgEndDate(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Trainer / Instructor</label>
                          <input
                            type="text"
                            placeholder="e.g. Engr. Danilo Santos, TVET Trainer"
                            value={progInstructor}
                            onChange={(e) => setProgInstructor(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Auto-Calculated Duration Summary Card */}
                      {computedTrainingHours && (
                        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                              <Calculator className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                                  Auto-Calculated Total: {computedTrainingHours.totalHours} Hours
                                </span>
                                <span className="text-[9px] bg-white text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                                  {computedTrainingHours.dailyHours} hrs/day
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                                {computedTrainingHours.sessionCount} class days scheduled between {formatProgramDateRange(progStartDate, progEndDate)}
                                {computedTrainingHours.deductedLunch ? " (excl. 1h lunch)" : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                              progTrainingHours === computedTrainingHours.totalHours
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
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Admissions & Contact Info</h4>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">Eligibility Criteria</label>
                        <textarea
                          rows={2}
                          placeholder="e.g. Open to registered Katipunan ng Kabataan Out-of-School Youth aged 15–30 residing in San Luis, Pampanga."
                          value={progEligibility}
                          onChange={(e) => setProgEligibility(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Required Documents (comma separated)</label>
                          <input
                            type="text"
                            placeholder="e.g. Barangay Clearance, 2x2 ID Photo, Photocopy of Valid ID"
                            value={progRequiredDocuments}
                            onChange={(e) => setProgRequiredDocuments(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Target Prerequisite Skills</label>
                          <input
                            type="text"
                            placeholder="e.g. Basic Math, English comprehension, Willingness to learn"
                            value={progRequiredSkills}
                            onChange={(e) => setProgRequiredSkills(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Officer Contact Name</label>
                          <input
                            type="text"
                            placeholder="e.g. Engr. Danilo Santos, TESDA Focal Person"
                            value={progContactName}
                            onChange={(e) => setProgContactName(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Official Phone Number</label>
                          <input
                            type="text"
                            placeholder="e.g. +63 917 123 4567 / (045) 900-1234"
                            value={progContactPhone}
                            onChange={(e) => setProgContactPhone(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-7 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        {editingProgramId ? "Save Changes" : "Publish Training Course"}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 5: PARTNER PROFILE & NOTIFICATION SETTINGS */}
          {currentScreen === TESDAPartnerScreen.SETTINGS && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Banner Header */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight leading-tight">
                      TESDA Partner Profile & Settings
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                      Manage institutional TVET center credentials, representative details, system security, and off-site notifications.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    Accredited TVET Partner
                  </span>
                </div>
              </div>

              {/* Top Sub-tab Pill Navigation Bar */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setProfileActiveTab("profile")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    profileActiveTab === "profile"
                      ? "bg-[#0A6B43] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Institution Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileActiveTab("security")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    profileActiveTab === "security"
                      ? "bg-[#0A6B43] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Account Security</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileActiveTab("notifications")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    profileActiveTab === "notifications"
                      ? "bg-[#0A6B43] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Alerts & Notifications</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProfileActiveTab("badge")}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    profileActiveTab === "badge"
                      ? "bg-[#0A6B43] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>TVET Accreditation Badge</span>
                </button>
              </div>

              {/* TAB 1: INSTITUTION PROFILE */}
              {profileActiveTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column (3 cols) */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md border-2 border-emerald-600 shrink-0 mt-0.5 sm:mt-0">
                            {repName.charAt(0).toUpperCase() || "T"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{repName}</h3>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                                Verified TVET Focal
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                              {centerName}
                            </p>
                            <p className="text-xs font-mono text-slate-600 mt-1 truncate">
                              {repEmail}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(!isEditingProfile)}
                          className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors self-start sm:self-auto shrink-0 ${
                            isEditingProfile
                              ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
                              : "bg-[#0A6B43] text-white hover:bg-[#085435]"
                          }`}
                        >
                          <Edit className="w-3.5 h-3.5 shrink-0" />
                          <span>{isEditingProfile ? "Cancel" : "Edit Profile"}</span>
                        </button>
                      </div>

                      {/* View Mode */}
                      {!isEditingProfile ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Training Institution</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{centerName}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Accredited Representative</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{repName}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Institutional Email</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{repEmail}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Contact / Hotline</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{repPhone}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Institution Classification</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Public Vocational Institution (TESDA-Administered)</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Regional Jurisdiction</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">District II, Pampanga · Region III Central Luzon</p>
                          </div>
                          <div className="sm:col-span-2 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">UTPRAS Operating Status</p>
                              <p className="text-xs text-slate-600 mt-0.5">Fully certified under Unified TVET Program Registration & Accreditation System</p>
                            </div>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              ACTIVE
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode Form */
                        <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Training Institution / Center Name
                              </label>
                              <input
                                type="text"
                                value={centerName}
                                onChange={(e) => setCenterName(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Accredited Focal Representative
                              </label>
                              <input
                                type="text"
                                value={repName}
                                onChange={(e) => setRepName(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Institutional Email
                              </label>
                              <input
                                type="email"
                                value={repEmail}
                                onChange={(e) => setRepEmail(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Official Contact / Landline
                              </label>
                              <input
                                type="text"
                                value={repPhone}
                                onChange={(e) => setRepPhone(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              disabled={isSavingProfile}
                              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingProfile}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center gap-2"
                            >
                              {isSavingProfile ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  Save Institution Details
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Right Column (2 cols): Authority & Accreditation Card */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center border border-emerald-200 shrink-0">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900">TVET Center Authority</h4>
                          <p className="text-[11px] text-slate-500">Accredited Training Partner Clearance</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Clearance Level</span>
                          <span className="text-xs font-black text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            Institutional Partner (Tier 4)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Active Programs</span>
                          <span className="text-xs font-bold text-slate-900">
                            {programs.filter((p) => p.activeStatus === "Active" || p.activeStatus === "Full").length} Course(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Enrolled Youth</span>
                          <span className="text-xs font-bold text-slate-900">
                            {referrals.filter((r) => r.status === "Enrolled").length} Trainee(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Supervisory Office</span>
                          <span className="text-xs font-bold text-slate-900">
                            TESDA Pampanga PO
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Accreditation Code</span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            UTPRAS-R03-PAM-2024
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#0A6B43]" />
                          Republic Act No. 7796 Mandate
                        </p>
                        Authorized under the Technical Education and Skills Development Act to evaluate youth course applications, administer competency training, and report graduation outcomes.
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={onLogout}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-xs font-bold text-rose-700 bg-rose-50/50 hover:bg-rose-100 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out of Institutional Portal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCOUNT SECURITY */}
              {profileActiveTab === "security" && (
                <div className="max-w-2xl bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          Update Account Password
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Ensure your institutional training partner credentials remain secure.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] pr-10 text-slate-900"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Password (minimum 6 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] pr-10 text-slate-900"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] text-slate-900"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Updating your password will immediately secure your portal. Please ensure you keep a secure institutional record.
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center justify-center gap-2"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Updating Security Password...
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Update Institutional Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {profileActiveTab === "notifications" && (
                <div className="max-w-3xl">
                  <NotificationSettingsCard
                    userRole="TESDA_PARTNER"
                    userEmail={currentUser?.email}
                    addToast={addToast}
                  />
                </div>
              )}

              {/* TAB 4: TVET ACCREDITATION BADGE */}
              {profileActiveTab === "badge" && (
                <div className="max-w-xl mx-auto space-y-6">
                  {/* Digital Credential ID Card */}
                  <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-700/40 bg-gradient-to-br from-emerald-950 via-slate-900 to-[#0A3D27] text-white p-7 shadow-2xl">
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
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const info = `TESDA TVET PARTNER CREDENTIAL\nRepresentative: ${repName}\nInstitution: ${centerName}\nEmail: ${repEmail}\nContact: ${repPhone}\nPartner ID: ${currentUser?.id || "TESDA-R03-GPSAT-01"}\nUTPRAS Status: Active\nAccreditation Code: UTPRAS-R03-PAM-2024`;
                        navigator.clipboard.writeText(info);
                        addToast("TVET Institution Credential copied to clipboard!", "success");
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors"
                    >
                      <Copy className="w-4 h-4 text-[#0A6B43]" />
                      Copy Credential Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* ============================================================ */}
      {/* APPLICANT PROFILE DOSSIER MODAL */}
      {/* ============================================================ */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-150">
            
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
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                    Residency & Contact
                  </h5>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Contact Number</p>
                        <p className="font-bold text-slate-800">{selectedApplicant.contactNumber || "N/A"}</p>
                      </div>
                    </div>

                    {selectedApplicant.email && (
                      <div className="flex items-start gap-2.5">
                        <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Email Address</p>
                          <p className="font-bold text-slate-800">{selectedApplicant.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2.5">
                      <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Educational Attainment</p>
                        <p className="font-bold text-slate-800">{selectedApplicant.educationalAttainment}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Status Category</p>
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                          Out-of-School Youth (OSY)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Skills & Career Path */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
                    Skills & Competencies
                  </h5>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Declared Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.skills && selectedApplicant.skills.length > 0 ? (
                          selectedApplicant.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No skills registered</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase mb-1.5">Aspirational Interests</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.interests && selectedApplicant.interests.length > 0 ? (
                          selectedApplicant.interests.map((i, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                              {i}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No interests declared</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Career & Livelihood Goal</p>
                      <p className="text-xs text-slate-700 italic font-medium">
                        "{selectedApplicant.livelihoodGoal || "Seeking technical training and livelihood certification."}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 px-6 flex items-center justify-between gap-3 shrink-0">
              <div>
                {(() => {
                  const activeRef = referrals.find(
                    r => r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()
                  );
                  if (!activeRef) return null;
                  return (
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      activeRef.status === "Enrolled"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
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
                    r => r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase() && r.status === "Pending"
                  );
                  if (!activeRef) return null;

                  return (
                    <>
                      <button
                        onClick={() => {
                          handleUpdateReferralStatus(activeRef.id, "Declined");
                          setSelectedApplicant(null);
                        }}
                        className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateReferralStatus(activeRef.id, "Enrolled");
                          setSelectedApplicant(null);
                        }}
                        className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                      >
                        Accept & Enroll
                      </button>
                    </>
                  );
                })()}

                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* PROGRAM SYLLABUS & DETAILS MODAL */}
      {/* ============================================================ */}
      {viewingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black text-[#0A6B43] bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider mb-2 inline-block border border-emerald-200">
                  {viewingProgram.type || "Training"} Course
                </span>
                <h3 className="text-lg font-black text-slate-900 leading-tight">{viewingProgram.title}</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">{viewingProgram.provider || "TESDA Guagua / San Luis Hub"}</p>
              </div>
              <button
                onClick={() => setViewingProgram(null)}
                className="p-2 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all border border-slate-200 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Details Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration & Term</p>
                    <p className="text-sm font-black text-slate-900">{viewingProgram.trainingHours} Hours</p>
                    {(viewingProgram.startDate || viewingProgram.endDate) && (
                      <p className="text-[10px] font-bold text-emerald-800 mt-0.5">
                        {formatProgramDateRange(viewingProgram.startDate, viewingProgram.endDate)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="bg-teal-50/60 rounded-xl p-3.5 border border-teal-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slot Allocation</p>
                    <p className="text-sm font-black text-slate-900">{viewingProgram.slotsRemaining} / {viewingProgram.slotsTotal} Available</p>
                  </div>
                </div>
              </div>

              {/* Schedule & Location */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                  Schedule & Facility
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Training Days</p>
                    <p className="font-bold text-slate-900">{formatTrainingDays(viewingProgram.trainingDays)}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Time Slot & Session</p>
                    {(() => {
                      const ts = formatProgramTimeslot(viewingProgram.startTime, viewingProgram.endTime);
                      return (
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="font-bold text-slate-900">{ts.formattedRange}</p>
                          {ts.sessionType !== "Custom" && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
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
                    })()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Venue / Room</p>
                    <p className="font-bold text-slate-900">{viewingProgram.location} {viewingProgram.room ? `(${viewingProgram.room})` : ""}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Instructor</p>
                    <p className="font-bold text-slate-900">{viewingProgram.instructor || "Assigned TESDA Trainer"}</p>
                  </div>
                  {(viewingProgram.startDate || viewingProgram.endDate) && (
                    <div className="col-span-1 sm:col-span-2">
                      <p className="font-bold text-slate-400 text-[10px] uppercase">Program Term Dates</p>
                      <p className="font-bold text-slate-900">{formatProgramDateRange(viewingProgram.startDate, viewingProgram.endDate)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Eligibility & Documents */}
              <div className="space-y-3">
                <h4 className="font-black text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                  Requirements & Eligibility
                </h4>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 leading-relaxed text-slate-700 font-medium">
                  {viewingProgram.eligibility || 'Katipunan ng Kabataan registered resident of San Luis, Pampanga.'}
                </p>

                {viewingProgram.requiredDocuments && viewingProgram.requiredDocuments.length > 0 && (
                  <div>
                    <p className="font-bold text-slate-800 mb-1">Required Documents:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProgram.requiredDocuments.map((doc, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-md text-[10px]">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact Details */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[10px] tracking-wider text-slate-400">
                  Contact Officer
                </h4>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{viewingProgram.contactPerson || "TESDA Officer"}</p>
                    <p className="text-slate-500 font-medium">{viewingProgram.contactNumber || "+63 917 123 4567"}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setViewingProgram(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer transition-all text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POPUP MODAL: EDIT TRAINING COURSE (STAYS ON CURRENT TAB) */}
      {/* ============================================================ */}
      {editingProgramModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-emerald-900/40 bg-gradient-to-r from-[#112F24] to-[#1A4234] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-bold">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    Edit Training Course
                  </h3>
                  <p className="text-xs text-emerald-200/80 font-medium truncate max-w-md">
                    {editingProgramModal.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProgramModal(null)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable Form */}
            <div className="p-6 overflow-y-auto space-y-6">
              <form id="edit-program-modal-form" onSubmit={handleEditModalSubmit} className="space-y-6">
                
                {/* Section 1: Course Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                      1
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Basic Course Identity</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Training Course Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Shielded Metal Arc Welding, Bread & Pastry Production"
                        value={progTitle}
                        onChange={(e) => setProgTitle(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Certification Level</label>
                      <select
                        value={progLevel}
                        onChange={(e) => setProgLevel(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="NC I">NC I</option>
                        <option value="NC II">NC II</option>
                        <option value="NC III">NC III</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-700 uppercase">Vocational Category *</label>
                      <select
                        value={progCategoryId}
                        onChange={(e) => setProgCategoryId(e.target.value)}
                        className="w-full p-2.5 border border-emerald-300 bg-emerald-50/60 font-bold rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-600 uppercase">Training Hours *</label>
                        {computedTrainingHours && (
                          <button
                            type="button"
                            onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                            className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                            title="Click to auto-apply computed hours"
                          >
                            ⚡ Auto: {computedTrainingHours.totalHours}h
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
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Slot Allocation *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="e.g. 25"
                        value={progSlots}
                        onChange={(e) => setProgSlots(e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Cost Model</label>
                      <select
                        value={progCost}
                        onChange={(e) => setProgCost(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Free">Free (TESDA Subsidized)</option>
                        <option value="Subsidized">Subsidized / Co-pay</option>
                        <option value="With Fee">Fee-based</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 2: Schedule & Venue */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Schedule, Facility & Trainer</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Training Venue / Location</label>
                      <input
                        type="text"
                        placeholder="e.g. San Luis Training Center / GPSAT Guagua"
                        value={progLocation}
                        onChange={(e) => setProgLocation(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Assigned Room / Facility</label>
                      <input
                        type="text"
                        placeholder="e.g. Workshop Room B-102, Computer Lab 1"
                        value={progRoom}
                        onChange={(e) => setProgRoom(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase block">Training Days</label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <label key={day} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold cursor-pointer transition-all ${
                          progTrainingDays.includes(day)
                            ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
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
                  <div className="space-y-3 bg-slate-50/60 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Training Timeslot</label>
                      <span className="text-[10px] text-slate-400 font-medium">Select preset or set custom hours</span>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("morning")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          progStartTime === "08:00" && progEndTime === "12:00"
                            ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        🌅 Morning (8 AM – 12 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("afternoon")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          progStartTime === "13:00" && progEndTime === "17:00"
                            ? "bg-blue-100 text-blue-900 border-blue-300 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        ☀️ Afternoon (1 PM – 5 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("fullday")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          progStartTime === "08:00" && progEndTime === "17:00"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        🏢 Full Day (8 AM – 5 PM)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyTimeslotPreset("evening")}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                          progStartTime === "17:30" && progEndTime === "20:30"
                            ? "bg-purple-100 text-purple-900 border-purple-300 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        🌙 Evening (5:30 PM – 8:30 PM)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Start Time</label>
                        <input
                          type="time"
                          value={progStartTime}
                          onChange={(e) => setProgStartTime(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">End Time</label>
                        <input
                          type="time"
                          value={progEndTime}
                          onChange={(e) => setProgEndTime(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Live Schedule Preview */}
                    <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Clock className="w-4 h-4 text-[#0A6B43] shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preview Display</p>
                          <p className="text-xs font-black text-slate-900">
                            {formatTrainingDays(progTrainingDays)} · {formatProgramTimeslot(progStartTime, progEndTime).formattedRange}
                          </p>
                        </div>
                      </div>
                      {(() => {
                        const ts = formatProgramTimeslot(progStartTime, progEndTime);
                        return ts.sessionType !== "Custom" ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Start Date</label>
                      <input
                        type="date"
                        value={progStartDate}
                        onChange={(e) => setProgStartDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">End Date</label>
                      <input
                        type="date"
                        value={progEndDate}
                        onChange={(e) => setProgEndDate(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Trainer / Instructor</label>
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TVET Trainer"
                        value={progInstructor}
                        onChange={(e) => setProgInstructor(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Auto-Calculated Duration Summary Card */}
                  {computedTrainingHours && (
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                              Auto-Calculated Total: {computedTrainingHours.totalHours} Hours
                            </span>
                            <span className="text-[9px] bg-white text-emerald-800 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                              {computedTrainingHours.dailyHours} hrs/day
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium mt-0.5 truncate">
                            {computedTrainingHours.sessionCount} class days scheduled between {formatProgramDateRange(progStartDate, progEndDate)}
                            {computedTrainingHours.deductedLunch ? " (excl. 1h lunch)" : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProgTrainingHours(computedTrainingHours.totalHours)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer shrink-0 ${
                          progTrainingHours === computedTrainingHours.totalHours
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
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Admissions & Contact Info</h4>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Eligibility Criteria</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Open to registered Katipunan ng Kabataan Out-of-School Youth aged 15–30 residing in San Luis, Pampanga."
                      value={progEligibility}
                      onChange={(e) => setProgEligibility(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Required Documents (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. Barangay Clearance, 2x2 ID Photo, Photocopy of Valid ID"
                        value={progRequiredDocuments}
                        onChange={(e) => setProgRequiredDocuments(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Target Prerequisite Skills</label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Math, English comprehension, Willingness to learn"
                        value={progRequiredSkills}
                        onChange={(e) => setProgRequiredSkills(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Officer Contact Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos, TESDA Focal Person"
                        value={progContactName}
                        onChange={(e) => setProgContactName(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Official Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +63 917 123 4567 / (045) 900-1234"
                        value={progContactPhone}
                        onChange={(e) => setProgContactPhone(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingProgramModal(null)}
                className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-program-modal-form"
                className="px-6 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Update Course
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ARCHIVE PROGRAM / CONCLUDE TERM CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!programToArchive}
        title={`Conclude & Archive Program Term: "${programToArchive?.title}"?`}
        description={`Archiving will remove "${programToArchive?.title}" and its enrollees from this active dashboard to make way for future terms, and safely preserve all student records in the database. You can review them anytime under Archived History.`}
        confirmText="Conclude & Archive Term"
        confirmVariant="green"
        onConfirm={() => {
          if (programToArchive) {
            handleArchiveProgram(programToArchive.id, programToArchive.title);
            setProgramToArchive(null);
          }
        }}
        onCancel={() => setProgramToArchive(null)}
      />

      {/* ============================================================ */}
      {/* DELETE PROGRAM CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!programToDelete}
        title={`Delete Course "${programToDelete?.title}"?`}
        description={`Are you sure you want to delete "${programToDelete?.title}"? This will close the course and remove it together with its applicant records from the active dashboard.`}
        confirmText="Delete Program"
        confirmVariant="red"
        onConfirm={() => {
          if (programToDelete) {
            handleDeleteProgram(programToDelete.id, programToDelete.title);
            setProgramToDelete(null);
          }
        }}
        onCancel={() => setProgramToDelete(null)}
      />

    </div>
  );
};
