"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Building2, Users, Briefcase, Activity, Shield, Copy, Check, RefreshCw, 
  UserCheck, LogOut, ArrowRight, Eye, Edit, Trash2, PlusCircle, CheckCircle2,
  Lock, Bell, Search, Filter, MapPin, Sparkles, AlertTriangle, ChevronRight, ChevronLeft,
  User, Mail, Phone, Calendar, CheckCircle, X, Layers, ExternalLink, ShieldCheck,
  Key, Power, Ban, FileText, History, Clock, Tag, Award, GraduationCap, CheckCircle as CheckIcon,
  LayoutGrid, List, UserPlus, ShieldAlert, EyeOff, Printer, Download, Menu, Loader2,
  Table, ArrowUpRight, ChevronDown, ChevronUp
} from "lucide-react";
import { OfficialAccount, Councilor, YouthProfile, TESDAProgram, Barangay, ReferralPipelineItem, SKAnnouncement, EDUCATIONAL_ATTAINMENT_OPTIONS, normalizeEducationalAttainment } from "../types";
import { MetricCard, SikapLogo, ConfirmationModal, NotificationBellButton } from "./ReusableComponents";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { motion } from "motion/react";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { isProgramEnded } from "../lib/utils";
import { broadcastDataChange } from "../lib/realtime-sync";

const getPaginationItems = (current: number, total: number): (number | string)[] => {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
};

interface SuperAdminPortalProps {
  youthProfiles: YouthProfile[];
  setYouthProfiles?: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  barangays: Barangay[];
  setBarangays: React.Dispatch<React.SetStateAction<Barangay[]>>;
  officialAccounts: OfficialAccount[];
  setOfficialAccounts: React.Dispatch<React.SetStateAction<OfficialAccount[]>>;
  councilors: Councilor[];
  setCouncilors?: React.Dispatch<React.SetStateAction<Councilor[]>> | React.Dispatch<React.SetStateAction<any[]>>;
  referrals?: ReferralPipelineItem[];
  announcements?: SKAnnouncement[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  currentUser?: any;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  youthProfiles,
  setYouthProfiles,
  programs,
  barangays,
  setBarangays,
  officialAccounts,
  setOfficialAccounts,
  councilors,
  setCouncilors,
  referrals = [],
  announcements = [],
  onLogout,
  addToast,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "youth_masterlist" | "barangays" | "tesda_records" | "audit_logs" | "create_account" | "create_tesda" | "profile"
  >("dashboard");
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

  const { update: updateSession } = useSession();

  // Profile Tab State
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [adminName, setAdminName] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sikap_superadmin_name");
      if (cached) return cached;
    }
    return currentUser?.name || "System Super Administrator";
  });
  const [adminEmail, setAdminEmail] = useState(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("sikap_superadmin_email");
      if (cached) return cached;
    }
    return currentUser?.email || "admin@sanluis.gov.ph";
  });
  const [adminPhone, setAdminPhone] = useState("+63 917 123 4567");
  const [adminOffice, setAdminOffice] = useState("Municipal Youth Development Office (MYDO)");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Executive Municipal Report Generator State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportBarangay, setSelectedReportBarangay] = useState<string>("All");

  // Password Security Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (currentUser?.name) {
      setAdminName(currentUser.name);
      try {
        localStorage.setItem("sikap_superadmin_name", currentUser.name);
      } catch {}
    }
    if (currentUser?.email) {
      setAdminEmail(currentUser.email);
      try {
        localStorage.setItem("sikap_superadmin_email", currentUser.email);
      } catch {}
    }
  }, [currentUser?.name, currentUser?.email]);

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) {
      addToast("Administrator name cannot be empty.", "error");
      return;
    }
    if (!adminEmail.trim() || !adminEmail.includes("@")) {
      addToast("Please enter a valid administrative email address.", "error");
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentUser?.id,
          name: adminName.trim(),
          email: adminEmail.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update administrator profile.");
      }

      // Persist locally for instant retention across refreshes
      try {
        localStorage.setItem("sikap_superadmin_name", adminName.trim());
        localStorage.setItem("sikap_superadmin_email", adminEmail.trim().toLowerCase());
      } catch {}

      // Update NextAuth active session cookie
      if (updateSession) {
        try {
          await updateSession({
            name: adminName.trim(),
            email: adminEmail.trim().toLowerCase()
          });
        } catch {}
      }

      setIsEditingProfile(false);
      addToast("Super Administrator profile updated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update administrator profile.", "error");
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
      addToast("Super Administrator password updated successfully!", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to update password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Create account form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SK Chairperson" | "Barangay Captain" | "TESDA Representative">("SK Chairperson");
  const [barangayAssignment, setBarangayAssignment] = useState("San Agustin");
  const [tempPassword, setTempPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter & Pagination states: Barangay Directory
  const [brgySearch, setBrgySearch] = useState("");
  const [brgyStatusFilter, setBrgyStatusFilter] = useState("All");
  const [brgyViewMode, setBrgyViewMode] = useState<"grid" | "table">("grid");
  const [brgyPage, setBrgyPage] = useState(1);
  const BRGY_PER_PAGE = 6;

  // Search & Filter states: TESDA Directory
  const [tesdaSearch, setTesdaSearch] = useState("");

  // Search & Filter & Pagination states: Youth Masterlist
  const [youthSearch, setYouthSearch] = useState("");
  const [youthBrgyFilter, setYouthBrgyFilter] = useState("All");
  const [youthStatusFilter, setYouthStatusFilter] = useState("All");
  const [youthDemographicFilter, setYouthDemographicFilter] = useState("All");
  const [youthEduFilter, setYouthEduFilter] = useState("All");
  const [youthViewMode, setYouthViewMode] = useState<"grid" | "table">("table");
  const [youthTableSortColumn, setYouthTableSortColumn] = useState<string>("name");
  const [youthTableSortDirection, setYouthTableSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedYouthDetail, setSelectedYouthDetail] = useState<YouthProfile | null>(null);
  const [youthPage, setYouthPage] = useState(1);
  const YOUTH_PER_PAGE = 10;

  // Search & Filter & Pagination states: Audit Logs
  const [auditSearch, setAuditSearch] = useState("");
  const [auditCategoryFilter, setAuditCategoryFilter] = useState("All");
  const [auditPage, setAuditPage] = useState(1);
  const AUDIT_PER_PAGE = 10;

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper to get all relevant storage keys for Super Admin
  const getStorageKeys = () => {
    const keys: string[] = [];
    if (currentUser?.email) {
      keys.push(`sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}`);
    }
    if (currentUser?.id) {
      keys.push(`sikap_cleared_notifs_${currentUser.id}`);
    }
    keys.push("sikap_cleared_notifs_admin");
    return Array.from(new Set(keys));
  };

  const getReadStorageKey = () => {
    const email = currentUser?.email?.toLowerCase().trim();
    if (email) return `sikap_read_notifs_${email}`;
    return "sikap_read_notifs_admin";
  };

  // Track read notification IDs with localStorage persistence
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const key = currentUser?.email ? `sikap_read_notifs_${currentUser.email.toLowerCase().trim()}` : "sikap_read_notifs_admin";
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          "sikap_cleared_notifs_admin"
        ].filter(Boolean) as string[];

        let loaded: string[] = [];
        for (const k of initialKeys) {
          const stored = localStorage.getItem(k);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) loaded.push(...parsed);
            } catch {}
          }
        }
        return Array.from(new Set(loaded));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Re-synchronize cleared notifications whenever Admin user or storage updates
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
            } catch {}
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
        console.error("Failed to sync cleared notifications in Admin portal:", e);
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
        console.error(e);
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
        console.error(e);
      }
      return updated;
    });
    addToast("All alerts marked as read", "success");
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
        console.error(e);
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
        console.error(e);
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
    addToast("All alerts cleared", "info");
  };

  // State for newly created or reset credentials modal
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    pass: string;
    role: string;
    barangay?: string;
    isReset?: boolean;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Edit / View Barangay states
  const [selectedBrgy, setSelectedBrgy] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editBrgyName, setEditBrgyName] = useState("");
  const [originalBrgyName, setOriginalBrgyName] = useState("");

  // Delete account verification state
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<{ id: string; name: string; role: string; isCouncilor?: boolean; isYouth?: boolean } | null>(null);

  // Status toggle loading state
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Auto-generate temp password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(pass);
    return pass;
  };

  useEffect(() => {
    generatePassword();
  }, [activeTab]);

  // Fetch actual officials from database
  useEffect(() => {
    fetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setOfficialAccounts(data.data);
        }
      })
      .catch(err => console.error("Error fetching users:", err));
  }, [setOfficialAccounts]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = e.target.value as "SK Chairperson" | "Barangay Captain" | "TESDA Representative";
    setRole(selectedRole);
  };

  const handleCreateAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !tempPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          tempPassword: tempPassword,
          role: role,
          barangay: role === "TESDA Representative" ? undefined : barangayAssignment
        })
      });

      const data = await response.json();

      if (data.success) {
        setOfficialAccounts(prev => [data.data, ...prev]);
        setCreatedCredentials({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          pass: tempPassword,
          role: role,
          barangay: role === "TESDA Representative" ? undefined : barangayAssignment
        });

        addToast(`Successfully created ${role} account for ${fullName}!`, "success");
        broadcastDataChange("users", "created");

        // Reset fields
        setFullName("");
        setEmail("");
        generatePassword();
      } else {
        addToast(data.message || "Failed to create account", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error creating account", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTesdaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !tempPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      addToast("Please enter a valid email address", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          tempPassword: tempPassword,
          role: "TESDA Representative"
        })
      });

      const data = await response.json();

      if (data.success) {
        setOfficialAccounts(prev => [data.data, ...prev]);
        setCreatedCredentials({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          pass: tempPassword,
          role: "TESDA Representative"
        });

        addToast(`Successfully created TESDA Representative account for ${fullName}!`, "success");
        broadcastDataChange("users", "created");

        // Reset fields
        setFullName("");
        setEmail("");
        generatePassword();
      } else {
        addToast(data.message || "Failed to create account", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error creating account", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suggestion 2: One-Click Password Reset
  const handleResetPassword = async (official: { id: string; name: string; email: string; role: string; barangay?: string }) => {
    const newPass = generatePassword();
    setUpdatingUserId(official.id);

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: official.id,
          newTempPassword: newPass
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedCredentials({
          name: official.name,
          email: official.email,
          pass: newPass,
          role: official.role,
          barangay: official.barangay,
          isReset: true
        });
        addToast(`Password reset generated for ${official.name}!`, "success");
      } else {
        addToast(data.message || "Failed to reset password", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error resetting password", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Reset Password specifically for KK Youth Member accounts
  const handleResetYouthPassword = async (youth: YouthProfile) => {
    const newPass = generatePassword();
    setUpdatingUserId(youth.id);

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: youth.userId,
          targetEmail: youth.email,
          youthProfileId: youth.id,
          newTempPassword: newPass
        })
      });

      const data = await res.json();
      if (data.success) {
        setCreatedCredentials({
          name: youth.name,
          email: youth.email || data.data?.email || "Registered KK Account",
          pass: newPass,
          role: "KK Youth Member",
          barangay: youth.barangay ? youth.barangay.replace(/^Barangay\s+/i, "") : "San Luis",
          isReset: true
        });
        addToast(`Password reset generated for ${youth.name}!`, "success");
      } else {
        addToast(data.message || "Failed to reset password", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Network error resetting password", "error");
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Suggestion 3: Account Status Toggle (Active vs Suspended)
  const handleToggleStatus = async (official: { id: string; name: string; status: string }) => {
    const nextStatus = official.status === "Active" ? "Suspended" : "Active";
    setUpdatingUserId(official.id);

    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: official.id,
          status: nextStatus
        })
      });

      const data = await res.json();
      if (data.success) {
        setOfficialAccounts(prev => prev.map(o => o.id === official.id ? { ...o, status: nextStatus } : o));
        addToast(`Account for ${official.name} is now ${nextStatus}.`, "success");
        broadcastDataChange("users", "status_updated");
      } else {
        addToast(data.message || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      setOfficialAccounts(prev => prev.map(o => o.id === official.id ? { ...o, status: nextStatus } : o));
      addToast(`Account status updated to ${nextStatus}.`, "info");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SiKap Official Portal Credentials
-----------------------------------
Name: ${createdCredentials.name}
Role: ${createdCredentials.role}
Barangay: ${createdCredentials.barangay || "Municipal Hub"}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.pass}
-----------------------------------
Please sign in at ${window.location.origin} and change your password immediately.`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast("Credentials copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute System Statistics across all 17 Barangays
  const stats = useMemo(() => {
    const skChairpersons = officialAccounts.filter(o => o.role === "SK Chairperson" && o.status === "Active").length;
    const brgyCaptains = officialAccounts.filter(o => o.role === "Barangay Captain" && o.status === "Active").length;
    const tesdaReps = officialAccounts.filter(o => o.role === "TESDA Representative" && o.status === "Active").length;
    const skCouncilors = councilors.filter(c => c.status === "Active").length;
    const kkMembers = youthProfiles.length;
    const osyCount = youthProfiles.filter(y => y.currentStatus === "Out-of-school").length;

    const totalPrograms = programs.length;
    const activePrograms = programs.filter(p => p.activeStatus !== "Closed").length;

    return {
      totalBarangays: barangays.length, // 17 Barangays
      skChairpersons,
      brgyCaptains,
      tesdaReps,
      skCouncilors,
      kkMembers,
      osyCount,
      totalPrograms,
      activePrograms
    };
  }, [officialAccounts, councilors, youthProfiles, programs, barangays]);

  // Compute stats per Barangay for all 17 Barangays
  const barangayDataList = useMemo(() => {
    return barangays.map(b => {
      const sk = officialAccounts.find(o => o.role === "SK Chairperson" && o.barangay === b.name);
      const cap = officialAccounts.find(o => o.role === "Barangay Captain" && o.barangay === b.name);
      const councilorCount = councilors.filter(c => c.barangay === b.name).length;
      
      const kkCount = youthProfiles.filter(y => {
        const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
        const bName = b.name.trim().toLowerCase();
        return yBrgy === bName;
      }).length;

      return {
        name: b.name,
        sk: sk ? { id: sk.id, name: sk.name, email: sk.email, status: sk.status } : { id: null, name: "Unassigned", email: "N/A", status: "Inactive" },
        cap: cap ? { id: cap.id, name: cap.name, email: cap.email, status: cap.status } : { id: null, name: "Unassigned", email: "N/A", status: "Inactive" },
        councilorCount,
        kkCount
      };
    });
  }, [barangays, officialAccounts, councilors, youthProfiles]);

  // Barangay Coverage Summary
  const brgyCoverageSummary = useMemo(() => {
    const fullyCovered = barangayDataList.filter(b => b.sk.status === "Active" && b.cap.status === "Active").length;
    const needsSk = barangayDataList.filter(b => b.sk.status !== "Active").length;
    const needsCap = barangayDataList.filter(b => b.cap.status !== "Active").length;
    const needsAny = barangayDataList.filter(b => b.sk.status !== "Active" || b.cap.status !== "Active").length;

    return {
      total: barangayDataList.length,
      fullyCovered,
      needsSk,
      needsCap,
      needsAny
    };
  }, [barangayDataList]);

  // Filtered Barangay list
  const filteredBarangays = useMemo(() => {
    return barangayDataList.filter(item => {
      const query = brgySearch.toLowerCase();
      const matchesSearch = !query ||
        item.name.toLowerCase().includes(query) ||
        item.sk.name.toLowerCase().includes(query) ||
        item.sk.email.toLowerCase().includes(query) ||
        item.cap.name.toLowerCase().includes(query) ||
        item.cap.email.toLowerCase().includes(query);
      
      let matchesStatus = true;
      if (brgyStatusFilter === "Fully Assigned") {
        matchesStatus = item.sk.status === "Active" && item.cap.status === "Active";
      } else if (brgyStatusFilter === "Needs SK Chairperson") {
        matchesStatus = item.sk.status !== "Active";
      } else if (brgyStatusFilter === "Needs Barangay Captain") {
        matchesStatus = item.cap.status !== "Active";
      } else if (brgyStatusFilter === "Needs Assignment") {
        matchesStatus = item.sk.status !== "Active" || item.cap.status !== "Active";
      }

      return matchesSearch && matchesStatus;
    });
  }, [barangayDataList, brgySearch, brgyStatusFilter]);

  // Reset barangay page on filter or search change
  useEffect(() => {
    setBrgyPage(1);
  }, [brgySearch, brgyStatusFilter]);

  // Calculate total barangay pages and slice for pagination (limit 6 per page)
  const totalBrgyPages = Math.max(1, Math.ceil(filteredBarangays.length / BRGY_PER_PAGE));
  const paginatedBarangayList = useMemo(() => {
    const start = (brgyPage - 1) * BRGY_PER_PAGE;
    return filteredBarangays.slice(start, start + BRGY_PER_PAGE);
  }, [filteredBarangays, brgyPage, BRGY_PER_PAGE]);

  // Filtered TESDA list
  const filteredTesdaReps = useMemo(() => {
    return officialAccounts
      .filter(o => o.role === "TESDA Representative")
      .filter(item => item.name.toLowerCase().includes(tesdaSearch.toLowerCase()) || item.email.toLowerCase().includes(tesdaSearch.toLowerCase()));
  }, [officialAccounts, tesdaSearch]);

  // Suggestion 1: Filtered Municipal Youth Masterlist
  const filteredYouthMasterlist = useMemo(() => {
    return youthProfiles.filter(y => {
      // Search matches
      const query = youthSearch.toLowerCase();
      const matchesSearch = !query || 
        y.name.toLowerCase().includes(query) ||
        y.purok.toLowerCase().includes(query) ||
        (y.livelihoodGoal && y.livelihoodGoal.toLowerCase().includes(query)) ||
        (y.skills && y.skills.some((s: string) => s.toLowerCase().includes(query)));

      // Barangay match
      const cleanBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const matchesBrgy = youthBrgyFilter === "All" || cleanBrgy === youthBrgyFilter.trim().toLowerCase();

      // Status match
      const matchesStatus = youthStatusFilter === "All" || y.currentStatus === youthStatusFilter;

      // Demographics match
      let matchesDemographic = true;
      if (youthDemographicFilter === "PWD") matchesDemographic = Boolean(y.pwd);
      else if (youthDemographicFilter === "Solo Parent") matchesDemographic = Boolean(y.soloParent);
      else if (youthDemographicFilter === "Indigenous") matchesDemographic = Boolean(y.indigenous);

      // Education match
      const matchesEdu = youthEduFilter === "All" || normalizeEducationalAttainment(y.educationalAttainment) === youthEduFilter;

      return matchesSearch && matchesBrgy && matchesStatus && matchesDemographic && matchesEdu;
    });
  }, [youthProfiles, youthSearch, youthBrgyFilter, youthStatusFilter, youthDemographicFilter, youthEduFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setYouthPage(1);
  }, [youthSearch, youthBrgyFilter, youthStatusFilter, youthDemographicFilter, youthEduFilter]);

  const handleYouthTableSort = (column: string) => {
    if (youthTableSortColumn === column) {
      setYouthTableSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setYouthTableSortColumn(column);
      setYouthTableSortDirection("asc");
    }
  };

  const sortedYouthMasterlist = useMemo(() => {
    const list = [...filteredYouthMasterlist];
    list.sort((a, b) => {
      let valA: any = "";
      let valB: any = "";
      switch (youthTableSortColumn) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "barangay":
          valA = a.barangay.toLowerCase();
          valB = b.barangay.toLowerCase();
          break;
        case "age":
          valA = a.age;
          valB = b.age;
          break;
        case "status":
          valA = a.currentStatus.toLowerCase();
          valB = b.currentStatus.toLowerCase();
          break;
        case "education":
          valA = a.educationalAttainment.toLowerCase();
          valB = b.educationalAttainment.toLowerCase();
          break;
        default:
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
      }
      if (valA < valB) return youthTableSortDirection === "asc" ? -1 : 1;
      if (valA > valB) return youthTableSortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredYouthMasterlist, youthTableSortColumn, youthTableSortDirection]);

  // Calculate total pages and slice for pagination (limit 10 per page)
  const totalYouthPages = Math.max(1, Math.ceil(sortedYouthMasterlist.length / YOUTH_PER_PAGE));
  const paginatedYouthList = useMemo(() => {
    const start = (youthPage - 1) * YOUTH_PER_PAGE;
    return sortedYouthMasterlist.slice(start, start + YOUTH_PER_PAGE);
  }, [sortedYouthMasterlist, youthPage, YOUTH_PER_PAGE]);

  // Suggestion 4: System-Wide Audit Log & Activity Stream
  const auditLogs = useMemo(() => {
    const events: {
      id: string;
      category: "User Provisioning" | "Youth Registration" | "Application & Enrollment" | "Program Update" | "Announcement";
      actor: string;
      action: string;
      target: string;
      barangay?: string;
      timestamp: string;
      rawDate: Date;
    }[] = [];

    // Official Accounts Provisioning Logs
    officialAccounts.forEach(acc => {
      events.push({
        id: `acc-${acc.id}`,
        category: "User Provisioning",
        actor: "Super Admin (MYDO)",
        action: `Provisioned official account (${acc.role})`,
        target: `${acc.name} (${acc.email})`,
        barangay: acc.barangay || "Municipal Hub",
        timestamp: acc.dateCreated || "Recently",
        rawDate: new Date()
      });
    });

    // Youth Registrations
    youthProfiles.forEach(y => {
      events.push({
        id: `youth-${y.id}`,
        category: "Youth Registration",
        actor: y.name,
        action: `Registered Katipunan ng Kabataan Profile`,
        target: `${y.name} · ${y.purok}`,
        barangay: y.barangay.replace(/^Barangay\s+/i, ""),
        timestamp: y.registeredDate ? new Date(y.registeredDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Active Record",
        rawDate: y.registeredDate ? new Date(y.registeredDate) : new Date()
      });
    });

    // Applications & Admissions
    referrals.forEach(r => {
      const appDate = r.applicationDate || r.referralDate;
      events.push({
        id: `ref-${r.id}`,
        category: "Application & Enrollment",
        actor: r.youthName,
        action: `Application status: ${r.status} for ${r.programTitle}`,
        target: `${r.youthName} · Match Score ${r.matchScore}%`,
        barangay: r.barangay || "San Luis",
        timestamp: appDate ? new Date(appDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently",
        rawDate: appDate ? new Date(appDate) : new Date()
      });
    });

    // TESDA Programs
    programs.forEach(p => {
      events.push({
        id: `prog-${p.id}`,
        category: "Program Update",
        actor: "TESDA Partner Coordinator",
        action: `Program cataloged (${p.activeStatus}): ${p.title}`,
        target: `${p.provider} · ${p.trainingHours} Hours · ${p.slotsRemaining} Slots`,
        barangay: "Municipal Hub",
        timestamp: "Active Offering",
        rawDate: new Date()
      });
    });

    // SK Announcements
    announcements.forEach(a => {
      events.push({
        id: `ann-${a.id}`,
        category: "Announcement",
        actor: "SK Official",
        action: `Published broadcast: "${a.title}"`,
        target: `Audience: ${a.audience}`,
        barangay: a.barangay || "Municipal",
        timestamp: a.datePosted || "Active",
        rawDate: new Date()
      });
    });

    return events.filter(e => {
      const matchesCategory = auditCategoryFilter === "All" || e.category === auditCategoryFilter;
      const query = auditSearch.toLowerCase();
      const matchesSearch = !query || 
        e.action.toLowerCase().includes(query) ||
        e.actor.toLowerCase().includes(query) ||
        e.target.toLowerCase().includes(query) ||
        (e.barangay && e.barangay.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [officialAccounts, youthProfiles, referrals, programs, announcements, auditCategoryFilter, auditSearch]);

  // Reset audit page on filter or search change
  useEffect(() => {
    setAuditPage(1);
  }, [auditSearch, auditCategoryFilter]);

  // Calculate total audit pages and slice for pagination (limit 10 per page)
  const totalAuditPages = Math.max(1, Math.ceil(auditLogs.length / AUDIT_PER_PAGE));
  const paginatedAuditLogs = useMemo(() => {
    const start = (auditPage - 1) * AUDIT_PER_PAGE;
    return auditLogs.slice(start, start + AUDIT_PER_PAGE);
  }, [auditLogs, auditPage, AUDIT_PER_PAGE]);

  const selectedBrgyDetails = useMemo(() => {
    if (!selectedBrgy) return null;
    const data = barangayDataList.find(d => d.name === selectedBrgy);
    
    const brgyCouncilors = councilors.filter(c => c.barangay === selectedBrgy);
    const brgyYouth = youthProfiles.filter(y => {
      const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const bName = selectedBrgy.trim().toLowerCase();
      return yBrgy === bName;
    });

    return {
      ...data,
      councilors: brgyCouncilors,
      youth: brgyYouth
    };
  }, [selectedBrgy, barangayDataList, councilors, youthProfiles]);

  const handleEditBrgyClick = (brgyName: string) => {
    setOriginalBrgyName(brgyName);
    setEditBrgyName(brgyName);
    setIsEditModalOpen(true);
  };

  const handleSaveBrgyName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBrgyName.trim()) {
      addToast("Barangay Name cannot be empty", "error");
      return;
    }

    setBarangays(prev => prev.map(b => b.name === originalBrgyName ? { name: editBrgyName.trim() } : b));
    setOfficialAccounts(prev => prev.map(o => o.barangay === originalBrgyName ? { ...o, barangay: editBrgyName.trim() } : o));
    
    addToast(`Successfully renamed Barangay ${originalBrgyName} to ${editBrgyName.trim()}!`, "success");
    setIsEditModalOpen(false);
  };

  const confirmDeleteAccount = async () => {
    if (!deleteAccountTarget) return;
    const { id, name, role, isCouncilor, isYouth } = deleteAccountTarget;

    const isCouncilorAccount = Boolean(
      isCouncilor ||
      role === "SK Councilor" ||
      role.toLowerCase().includes("councilor") ||
      role.toLowerCase().includes("secretary") ||
      role.toLowerCase().includes("treasurer")
    );

    const isYouthAccount = Boolean(
      isYouth ||
      role === "KK Youth Member" ||
      role.toLowerCase().includes("youth")
    );

    try {
      let endpoint = `/api/users?id=${id}`;
      if (isYouthAccount) {
        endpoint = `/api/youth?id=${id}`;
      } else if (isCouncilorAccount) {
        endpoint = `/api/councilors?id=${id}`;
      }

      const res = await fetch(endpoint, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (isYouthAccount) {
          if (setYouthProfiles) {
            setYouthProfiles(prev => prev.filter(y => y.id !== id));
          }
        } else if (isCouncilorAccount) {
          if (setCouncilors) {
            setCouncilors(prev => prev.filter(c => c.id !== id));
          }
        } else {
          setOfficialAccounts(prev => prev.filter(o => o.id !== id));
        }
        addToast(`Successfully deleted ${role} account for ${name}!`, "success");
        if (isYouthAccount) {
          broadcastDataChange("youth", "deleted");
        } else if (isCouncilorAccount) {
          broadcastDataChange("councilors", "deleted");
        } else {
          broadcastDataChange("users", "deleted");
        }
      } else {
        addToast(data.message || data.error || "Failed to delete account", "error");
      }
    } catch (err) {
      console.error(err);
      if (isYouthAccount) {
        if (setYouthProfiles) {
          setYouthProfiles(prev => prev.filter(y => y.id !== id));
        }
      } else if (isCouncilorAccount) {
        if (setCouncilors) {
          setCouncilors(prev => prev.filter(c => c.id !== id));
        }
      } else {
        setOfficialAccounts(prev => prev.filter(o => o.id !== id));
      }
      addToast(`Account for ${name} removed.`, "info");
    } finally {
      setDeleteAccountTarget(null);
    }
  };

  // ============================================================
  // MUNICIPAL EXECUTIVE REPORT DATA & METRICS
  // ============================================================
  const reportFilteredYouth = useMemo(() => {
    if (selectedReportBarangay === "All") return youthProfiles;
    const target = selectedReportBarangay.trim().toLowerCase();
    return youthProfiles.filter(y => {
      const yBrgy = (y.barangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return yBrgy === target;
    });
  }, [youthProfiles, selectedReportBarangay]);

  const reportFilteredEnrollments = useMemo(() => {
    if (selectedReportBarangay === "All") return referrals;
    const target = selectedReportBarangay.trim().toLowerCase();
    return referrals.filter(r => {
      const rBrgy = (r.barangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return rBrgy === target;
    });
  }, [referrals, selectedReportBarangay]);

  // Section I: Executive KPI Scorecard metrics (strictly no in-school vs employed, strictly "Enrollments")
  const reportStats = useMemo(() => {
    const totalYouth = reportFilteredYouth.length;
    const osyCount = reportFilteredYouth.filter(y => y.currentStatus === "Out-of-school").length;
    const osyPercentage = totalYouth > 0 ? ((osyCount / totalYouth) * 100).toFixed(1) : "0.0";
    const activeProgramsCount = programs.filter(p => p.activeStatus !== "Closed").length;
    const totalEnrollments = reportFilteredEnrollments.length;
    const barangaysCount = selectedReportBarangay === "All" ? barangays.length : 1;

    return {
      totalYouth,
      osyCount,
      osyPercentage,
      activeProgramsCount,
      totalProgramsCount: programs.length,
      totalEnrollments,
      barangaysCount
    };
  }, [reportFilteredYouth, programs, reportFilteredEnrollments, selectedReportBarangay, barangays]);

  // Section II: 17-Barangay Administrative & Demographic Matrix
  const barangayReportList = useMemo(() => {
    const targetList = selectedReportBarangay === "All" 
      ? barangays 
      : barangays.filter(b => b.name.toLowerCase() === selectedReportBarangay.toLowerCase());

    return targetList.map(b => {
      const sk = officialAccounts.find(o => o.role === "SK Chairperson" && o.barangay === b.name);
      const cap = officialAccounts.find(o => o.role === "Barangay Captain" && o.barangay === b.name);
      const councilorCount = councilors.filter(c => c.barangay === b.name).length;
      
      const bName = b.name.trim().toLowerCase();
      const bYouth = youthProfiles.filter(y => {
        const yBrgy = (y.barangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
        return yBrgy === bName;
      });

      const bEnrollments = referrals.filter(r => {
        const rBrgy = (r.barangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
        return rBrgy === bName;
      });

      const kkCount = bYouth.length;
      const osyCount = bYouth.filter(y => y.currentStatus === "Out-of-school").length;
      const osyPercentage = kkCount > 0 ? ((osyCount / kkCount) * 100).toFixed(1) : "0.0";

      return {
        name: b.name,
        sk: sk ? { name: sk.name, email: sk.email, status: sk.status } : { name: "Unassigned", email: "N/A", status: "Inactive" },
        cap: cap ? { name: cap.name, email: cap.email, status: cap.status } : { name: "Unassigned", email: "N/A", status: "Inactive" },
        councilorCount,
        kkCount,
        osyCount,
        osyPercentage,
        enrollmentCount: bEnrollments.length
      };
    });
  }, [barangays, officialAccounts, councilors, youthProfiles, referrals, selectedReportBarangay]);

  // Section III: Educational Attainment Distribution
  const educationStats = useMemo(() => {
    const list = reportFilteredYouth;
    const total = list.length || 1;
    const categories = [...EDUCATIONAL_ATTAINMENT_OPTIONS];

    return categories.map(cat => {
      const count = list.filter(y => normalizeEducationalAttainment(y.educationalAttainment) === cat).length;
      return {
        label: cat,
        count,
        percentage: ((count / total) * 100).toFixed(1)
      };
    });
  }, [reportFilteredYouth]);

  // Age group distribution (excluding 15-17 yrs old as requested)
  const ageGroupStats = useMemo(() => {
    const list = reportFilteredYouth;
    const total = list.length || 1;
    const g2 = list.filter(y => y.age >= 18 && y.age <= 24).length;
    const g3 = list.filter(y => y.age >= 25 && y.age <= 30).length;

    return [
      { label: "18–24 years (Core Youth)", count: g2, percentage: ((g2 / total) * 100).toFixed(1) },
      { label: "25–30 years (Young Adult)", count: g3, percentage: ((g3 / total) * 100).toFixed(1) },
    ];
  }, [reportFilteredYouth]);

  // Formatted Excel (.xls) Export pre-configured for US Letter Single Page Width Printing (No Tarpapel)
  const handleExportReportExcel = () => {
    const reportScope = selectedReportBarangay === "All" ? "All 17 Barangays" : `Barangay ${selectedReportBarangay}`;
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    
    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Municipal Youth Report</x:Name>
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
          <col width="38" />   <!-- Col 1 (A): Index # -->
          <col width="170" />  <!-- Col 2 (B): Barangay Zone -->
          <col width="88" />   <!-- Col 3 (C): KK Members -->
          <col width="78" />   <!-- Col 4 (D): OSY Count -->
          <col width="78" />   <!-- Col 5 (E): OSY % -->
          <col width="180" />  <!-- Col 6 (F): SK Chairperson -->
          <col width="180" />  <!-- Col 7 (G): Barangay Captain -->
          <col width="88" />   <!-- Col 8 (H): Councilors -->
          <col width="98" />   <!-- Col 9 (I): Enrollments -->

          <tr><td colspan="9" class="banner-title">MUNICIPALITY OF SAN LUIS · PROVINCE OF PAMPANGA</td></tr>
          <tr><td colspan="9" class="banner-sub">MUNICIPAL YOUTH DEVELOPMENT OFFICE (MYDO) · SIKAP CENTRAL EXECUTIVE REGISTRY</td></tr>
          <tr><td colspan="9" style="height: 6px; border: none;"></td></tr>
          <tr>
            <td colspan="3" class="meta-box"><strong>Scope:</strong> ${reportScope}</td>
            <td colspan="3" class="meta-box"><strong>Assessment Date:</strong> ${dateStr}</td>
            <td colspan="3" class="meta-box"><strong>Generating Authority:</strong> ${adminName}</td>
          </tr>
          <tr><td colspan="9" style="height: 12px; border: none;"></td></tr>
          
          <!-- TABLE 1: EXECUTIVE KPI SCORECARD -->
          <tr><td colspan="9" class="sec-hdr">I. EXECUTIVE KPI SCORECARD - MUNICIPAL SUMMARY</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th colspan="3">Key Performance Indicator (KPI)</th>
            <th colspan="2" class="text-center">Metric Value</th>
            <th colspan="3">Coverage Status & Operational Details</th>
          </tr>
          <tr>
            <td class="text-center">1</td>
            <td colspan="3" class="font-bold">Total Katipunan ng Kabataan (KK) Members</td>
            <td colspan="2" class="text-center font-bold text-num" style="font-size: 11pt; color: #0A6B43;">${reportStats.totalYouth}</td>
            <td colspan="3">${reportStats.barangaysCount} active administrative zone(s) registered</td>
          </tr>
          <tr>
            <td class="text-center">2</td>
            <td colspan="3" class="font-bold">Out-of-School Youth (OSY)</td>
            <td colspan="2" class="text-center font-bold" style="font-size: 11pt; color: #b45309;">${reportStats.osyCount} (${reportStats.osyPercentage}%)</td>
            <td colspan="3">Prioritized for TVET livelihood training & scholarship programs</td>
          </tr>
          <tr>
            <td class="text-center">3</td>
            <td colspan="3" class="font-bold">Active TVET Vocational Programs</td>
            <td colspan="2" class="text-center font-bold" style="font-size: 11pt; color: #047857;">${reportStats.activeProgramsCount} of ${reportStats.totalProgramsCount} Modules</td>
            <td colspan="3">Published TESDA technical training modules with open enrollment slots</td>
          </tr>
          <tr>
            <td class="text-center">4</td>
            <td colspan="3" class="font-bold">Total Program Enrollments</td>
            <td colspan="2" class="text-center font-bold text-num" style="font-size: 11pt; color: #1d4ed8;">${reportStats.totalEnrollments}</td>
            <td colspan="3">Youth trainees registered and enrolled in technical programs</td>
          </tr>
          <tr>
            <td class="text-center">5</td>
            <td colspan="3" class="font-bold">Municipal Geographic Coverage</td>
            <td colspan="2" class="text-center font-bold" style="font-size: 11pt; color: #0f172a;">${reportStats.barangaysCount} Zones</td>
            <td colspan="3">100% of municipal barangays tracked and synchronized</td>
          </tr>
          <tr><td colspan="9" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 2: 17-BARANGAY MATRIX -->
          <tr><td colspan="9" class="sec-hdr">II. 17-BARANGAY ADMINISTRATIVE & DEMOGRAPHIC MATRIX</td></tr>
          <tr>
            <th class="text-center">#</th>
            <th>Barangay Zone</th>
            <th class="text-center">KK Members</th>
            <th class="text-center">OSY Count</th>
            <th class="text-center">OSY %</th>
            <th>SK Chairperson</th>
            <th>Barangay Captain</th>
            <th class="text-center">Councilors</th>
            <th class="text-center">Enrollments</th>
          </tr>
          ${barangayReportList.map((b, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="font-bold">${b.name}</td>
              <td class="text-center font-bold text-num">${b.kkCount}</td>
              <td class="text-center font-bold text-num" style="color: #b45309;">${b.osyCount}</td>
              <td class="text-center font-bold text-pct">${b.osyPercentage}%</td>
              <td>
                <strong>${b.sk.name}</strong> 
                <span style="font-size: 8pt; font-weight: bold; color: ${b.sk.status === 'Active' ? '#047857' : '#64748b'};">(${b.sk.status})</span>
              </td>
              <td>
                <strong>${b.cap.name}</strong> 
                <span style="font-size: 8pt; font-weight: bold; color: ${b.cap.status === 'Active' ? '#047857' : '#64748b'};">(${b.cap.status})</span>
              </td>
              <td class="text-center font-bold text-num" style="color: #7e22ce;">${b.councilorCount}</td>
              <td class="text-center font-bold text-num" style="color: #1d4ed8;">${b.enrollmentCount}</td>
            </tr>
          `).join("")}
          <tr class="total-row">
            <td class="text-center">--</td>
            <td>MUNICIPAL TOTAL</td>
            <td class="text-center text-num">${reportStats.totalYouth}</td>
            <td class="text-center text-num">${reportStats.osyCount}</td>
            <td class="text-center text-pct">${reportStats.osyPercentage}%</td>
            <td colspan="2" class="text-center">17 Municipal Zones Synchronized</td>
            <td class="text-center text-num">${councilors.length}</td>
            <td class="text-center text-num">${reportStats.totalEnrollments}</td>
          </tr>
          <tr><td colspan="9" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 3: EDUCATIONAL ATTAINMENT & DEMOGRAPHICS -->
          <tr><td colspan="9" class="sec-hdr">III. EDUCATIONAL ATTAINMENT & DEMOGRAPHIC PROFILE</td></tr>
          <tr>
            <th class="text-center">#</th>
            <th colspan="4">Educational Attainment / Demographic Cohort</th>
            <th colspan="2" class="text-center">Youth Count</th>
            <th colspan="2" class="text-center">Demographic Share (%)</th>
          </tr>
          ${educationStats.map((e, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td colspan="4" class="font-bold">${e.label}</td>
              <td colspan="2" class="text-center font-bold text-num">${e.count}</td>
              <td colspan="2" class="text-center font-bold text-pct">${e.percentage}%</td>
            </tr>
          `).join("")}
          ${ageGroupStats.map((a, idx) => `
            <tr style="background-color: #f8fafc;">
              <td class="text-center">${educationStats.length + idx + 1}</td>
              <td colspan="4" class="font-bold">Cohort: ${a.label}</td>
              <td colspan="2" class="text-center font-bold text-num">${a.count}</td>
              <td colspan="2" class="text-center font-bold text-pct">${a.percentage}%</td>
            </tr>
          `).join("")}
          <tr><td colspan="9" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 4: TVET PROGRAMS -->
          <tr><td colspan="9" class="sec-hdr">IV. TESDA TVET PROGRAM DIRECTORY & ENROLLMENT CAPACITY</td></tr>
          <tr>
            <th class="text-center">#</th>
            <th colspan="3">Training Program Title</th>
            <th colspan="2">Training Center / Provider</th>
            <th class="text-center">Total Capacity</th>
            <th class="text-center">Available Slots</th>
            <th class="text-center">Enrolled</th>
          </tr>
          ${programs.map((p, idx) => {
            const enrolledCount = referrals.filter(r => r.programId === p.id).length;
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td colspan="3" class="font-bold">${p.title}</td>
                <td colspan="2">${p.provider || "San Luis TVET Center"}</td>
                <td class="text-center font-bold text-num">${p.slotsTotal}</td>
                <td class="text-center font-bold text-num" style="color: #047857;">${p.slotsRemaining}</td>
                <td class="text-center font-bold text-num" style="color: #1d4ed8;">${enrolledCount}</td>
              </tr>
            `;
          }).join("")}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `San_Luis_Municipal_Youth_Report_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Municipal Census & Enrollment Report downloaded as Letter-Printable Excel (.xls)!", "success");
  };

  // Memoized Central Alerts
  const allCentralAlerts = useMemo(() => [
    {
      id: "alert-demographics",
      title: "Registered KK Demographics",
      desc: `${youthProfiles.length} active youth profiles registered across 17 barangays.`,
      targetTab: "youth_masterlist" as const,
      icon: Users,
      iconBg: "bg-emerald-100 text-[#0A6B43]",
    },
    {
      id: "alert-leaders",
      title: "Barangay Leaders Sync",
      desc: `${officialAccounts.length} authorized official accounts active in database.`,
      targetTab: "barangays" as const,
      icon: Shield,
      iconBg: "bg-amber-100 text-amber-800",
    },
    {
      id: "alert-tesda",
      title: "TESDA Vocational Programs",
      desc: `${programs.length} published TVET program offerings available municipal-wide.`,
      targetTab: "tesda_records" as const,
      icon: Briefcase,
      iconBg: "bg-blue-100 text-blue-800",
    },
  ], [youthProfiles.length, officialAccounts.length, programs.length]);

  const systemAlerts = useMemo(() => {
    return allCentralAlerts.filter((a) => !clearedNotificationIds.includes(a.id));
  }, [allCentralAlerts, clearedNotificationIds]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FAFAF8] flex font-sans antialiased text-slate-800 w-full" id="super-admin-portal-root">
      
      {/* Mobile Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ============================================================ */}
      {/* SIDEBAR - Signature SiKap Emerald Theme (Responsive Drawer on Mobile) */}
      {/* ============================================================ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-[17%] lg:min-w-[250px] xl:min-w-[260px] h-[100dvh] max-h-[100dvh] shrink-0 bg-[#082D21] text-white flex flex-col justify-between shadow-2xl lg:shadow-none border-r border-white/10 select-none overflow-y-auto overflow-x-hidden transform transition-transform duration-300 ease-in-out font-sans ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 flex-1">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-6 px-0.5 pt-0.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <SikapLogo size={36} logoSize={38} textSize={27} variant="white" showText={true} disableHover={true} />
              <div className="border-l border-white/20 pl-2.5 min-w-0 shrink-0 flex flex-col justify-center">
                <span className="text-[13px] sm:text-sm font-black text-amber-400 uppercase tracking-wider block leading-tight">Admin</span>
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
                id: "dashboard",
                label: "Infrastructure Dashboard",
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
                    <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.48 12H2" />
                  </svg>
                )
              },
              {
                id: "youth_masterlist",
                label: "Youth Masterlist",
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
                badge: stats.kkMembers > 0 ? stats.kkMembers : undefined
              },
              {
                id: "barangays",
                label: "Barangay Directory (17)",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18H6zm-2 0H2v-8a2 2 0 0 1 2-2h2v10zm16 0h2a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2v13z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
                    <path d="M10 6h4" />
                    <path d="M10 10h4" />
                    <path d="M10 14h4" />
                    <path d="M10 18h4" />
                  </svg>
                ),
                badge: stats.totalBarangays > 0 ? stats.totalBarangays : undefined
              },
              {
                id: "tesda_records",
                label: "TESDA Directory",
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
                ),
                badge: stats.tesdaReps > 0 ? stats.tesdaReps : undefined
              },
              {
                id: "audit_logs",
                label: "Audit Logs & Activity",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 5v5.25l4.5 2.67-.75 1.23L11 13V7h1.5z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                )
              },
              {
                id: "create_account",
                label: "Provision Official Account",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 6h-2v3H8v2h3v3h2v-3h3v-2h-3V8z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 12h8" />
                    <path d="M12 8v8" />
                  </svg>
                )
              },
              {
                id: "create_tesda",
                label: "Provision TESDA Account",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <circle cx="9" cy="6.5" r="3.5" />
                    <path d="M9 12c-3.1 0-6 2.2-6 5.5V20h12v-2.5c0-3.3-2.9-5.5-6-5.5z" />
                    <path d="m16 11 2 2 4-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <polyline points="16 11 18 13 22 9" />
                  </svg>
                )
              },
              {
                id: "profile",
                label: "Admin Profile & Security",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2 3.5 5.5V11C3.5 16.5 7.14 21.6 12 23c4.86-1.4 8.5-6.5 8.5-12V5.5L12 2zm-1.5 14-3.5-3.5 1.4-1.4 2.1 2.1 5.1-5.1 1.4 1.4-6.5 6.5z" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                )
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <div key={tab.id} className="relative">
                  {/* Animated Active Page Indicator Bar on far-left edge */}
                  {isActive && (
                    <motion.span
                      layoutId="superAdminActiveIndicator"
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#02513B] rounded-r-full shadow-[0_0_8px_rgba(2,81,59,0.8)] z-20 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Animated Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="superAdminActiveBackground"
                      className="absolute inset-0 bg-[#02513B] rounded-xl pointer-events-none z-0 shadow-sm border border-emerald-400/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setIsMobileNavOpen(false);
                      if (tab.id === "create_account") setRole("SK Chairperson");
                      if (tab.id === "create_tesda") setRole("TESDA Representative");
                    }}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors duration-200 text-left group tracking-tight outline-none focus:outline-none ${
                      isActive
                        ? "text-emerald-300 cursor-pointer"
                        : "text-gray-300/80 hover:bg-white/5 hover:text-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className={`transition-colors duration-200 shrink-0 ${
                        isActive
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
                {currentUser?.name
                  ? currentUser.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                  : "SA"}
              </div>

              {/* Complete Name and Email without hover effect */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {currentUser?.name || "Super Administrator"}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5" title={currentUser?.email || "bitwise6767@gmail.com"}>
                  {currentUser?.email || "bitwise6767@gmail.com"}
                </p>
              </div>
            </div>

            {/* Sign Out Button (Only element with hover effect) */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              title="Sign Out Central"
              aria-label="Sign Out Central"
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

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <main className="flex-1 h-[100dvh] max-h-[100dvh] flex flex-col min-w-0 bg-slate-50/70 overflow-y-auto pb-12 sm:pb-6">
        
        {/* Sticky Top Header */}
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
                {activeTab === "dashboard" && "Infrastructure Dashboard"}
                {activeTab === "youth_masterlist" && "Youth Masterlist"}
                {activeTab === "barangays" && "Barangay Directory"}
                {activeTab === "tesda_records" && "TESDA Directory"}
                {activeTab === "audit_logs" && "Audit Logs & Activity"}
                {activeTab === "create_account" && "Provision Official"}
                {activeTab === "create_tesda" && "Provision TESDA"}
                {activeTab === "profile" && "Admin Profile & Security"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 relative shrink-0" id="notification-bell-container">
            {/* Live Status Pill */}
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#0A6B43] text-xs font-extrabold rounded-full shadow-2xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Infrastructure
            </span>

            {/* Official Report Generation Button */}
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="p-2 sm:px-3.5 sm:py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shrink-0"
              title="Generate Official Municipal Executive Report"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Generate Report</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <NotificationBellButton
                isOpen={showNotifications}
                onClick={() => setShowNotifications(!showNotifications)}
                unreadCount={systemAlerts.filter(a => !readNotificationIds.includes(a.id)).length}
                title="System Central Alerts"
                size="lg"
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs"
              />

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="fixed inset-x-3.5 top-20 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-14 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white border border-emerald-100 rounded-2xl shadow-2xl py-3 text-xs overflow-hidden text-slate-700 animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/70 p-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-slate-900 text-sm">System Central Alerts</span>
                        {systemAlerts.filter(a => !readNotificationIds.includes(a.id)).length > 0 && (
                          <span className="bg-[#0A6B43] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                            {systemAlerts.filter(a => !readNotificationIds.includes(a.id)).length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {systemAlerts.length > 0 && (
                          <>
                            {systemAlerts.some(a => !readNotificationIds.includes(a.id)) && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => markAllAsRead(allCentralAlerts.map((a) => a.id))}
                                  className="text-[11px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                  title="Mark all notifications as read"
                                >
                                  Mark read
                                </button>
                                <span className="text-slate-300">·</span>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => clearAllNotifications(allCentralAlerts.map((a) => a.id))}
                              className="text-[11px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                              title="Clear all alerts from list"
                            >
                              Clear all
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {systemAlerts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                          <p className="font-bold text-slate-600">No active alerts</p>
                          <p className="text-[11px] mt-0.5">All system alerts have been cleared or reviewed.</p>
                        </div>
                      ) : (
                        systemAlerts.map((item) => {
                          const Icon = item.icon;
                          const isRead = readNotificationIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                markAsRead(item.id);
                                setActiveTab(item.targetTab);
                                setShowNotifications(false);
                              }}
                              className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                                isRead ? "bg-white hover:bg-gray-50/80" : "bg-emerald-50/30 hover:bg-emerald-50/60"
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 mt-0.5 relative ${item.iconBg}`}>
                                <Icon className="w-4 h-4" />
                                {!isRead && (
                                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0A6B43] rounded-full ring-2 ring-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 pr-2">
                                <p className={`text-xs ${isRead ? "font-semibold text-slate-700" : "font-extrabold text-slate-900"}`}>
                                  {item.title}
                                </p>
                                <p className={`text-[11px] leading-relaxed ${isRead ? "text-slate-400 font-normal" : "text-slate-600 font-medium"}`}>
                                  {item.desc}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 -mr-1">
                                {!isRead && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/70 p-1 rounded-md transition-all"
                                    title="Mark as read"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(item.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 hover:bg-gray-100 p-1 rounded-md transition-all"
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
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer text-left"
              title="View Admin Profile & Security"
            >
              <div className="w-8 h-8 rounded-full bg-[#112F24] text-white flex items-center justify-center font-black text-xs shadow-xs border border-emerald-600">
                SA
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">San Luis, Pampanga</p>
              </div>
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="px-2 sm:px-3 lg:px-4 py-4 sm:py-6 max-w-[1420px] w-full mx-auto space-y-6">
          
          {/* ============================================================ */}
          {/* TAB 1: SYSTEM INFRASTRUCTURE DASHBOARD */}
          {/* ============================================================ */}
          {activeTab === "dashboard" && (
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
                    Mabuhay, {adminName || "Administrator"}!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Municipal System Infrastructure & Telemetry · San Luis Central Governance Engine across 17 Barangays.
                  </p>
                </div>
              </div>

              {/* Highlight KPI Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <MetricCard
                  title="Barangays Tracked"
                  value={stats.totalBarangays}
                  subtitle="17 municipal zones active"
                  icon={<Building2 className="w-5 h-5" />}
                  accent="green"
                />
                <MetricCard
                  title="Total KK Members"
                  value={stats.kkMembers}
                  subtitle={`${stats.osyCount} Out-of-School Youth`}
                  icon={<Users className="w-5 h-5" />}
                  accent="gold"
                />
                <MetricCard
                  title="Active TESDA Modules"
                  value={`${stats.activePrograms} / ${stats.totalPrograms}`}
                  subtitle="active technical programs"
                  icon={<Briefcase className="w-5 h-5" />}
                  accent="charcoal"
                />
                <MetricCard
                  title="System Status"
                  value="100%"
                  subtitle="all microservices synchronized"
                  icon={<Activity className="w-5 h-5" />}
                  accent="green"
                />
              </div>

              {/* Registered System Demographics Breakdown */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-[26px] font-extrabold text-gray-900 tracking-tight">System Accounts & Demographics</h3>
                  <span className="text-xs font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto shrink-0">
                    {officialAccounts.length + councilors.length + youthProfiles.length} Total Users Active
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
                  {[
                    { label: "SK Chairpersons", count: stats.skChairpersons, color: "bg-blue-500", lightBg: "bg-blue-50 border-blue-200 text-blue-800" },
                    { label: "Barangay Captains", count: stats.brgyCaptains, color: "bg-emerald-500", lightBg: "bg-emerald-50 border-emerald-200 text-emerald-800" },
                    { label: "TESDA Partner Reps", count: stats.tesdaReps, color: "bg-amber-500", lightBg: "bg-amber-50 border-amber-200 text-amber-800" },
                    { label: "SK Councilors", count: stats.skCouncilors, color: "bg-purple-500", lightBg: "bg-purple-50 border-purple-200 text-purple-800" },
                    { label: "KK Youth Members", count: stats.kkMembers, color: "bg-[#0A6B43]", lightBg: "bg-emerald-100/80 border-emerald-300 text-emerald-900" }
                  ].map((roleItem, index) => (
                    <div key={index} className="bg-white border border-gray-200/90 p-4 rounded-xl flex flex-col justify-between hover:shadow-xs hover:-translate-y-0.5 transition-all duration-200">
                      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">{roleItem.label}</p>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-black text-gray-900">{roleItem.count}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleItem.lightBg}`}>
                          Active
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${roleItem.color} rounded-full`} style={{ width: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Quick Actions & Infrastructure Node Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Provisioning Quick Shortcuts */}
                <div className="bg-gradient-to-br from-[#112F24] to-[#164132] text-white rounded-2xl p-4 sm:p-6 shadow-md space-y-4 lg:col-span-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shrink-0 shadow-xs">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Central Provisioning</h4>
                      <p className="text-xs text-emerald-200 font-medium">Fast action shortcuts</p>
                    </div>
                  </div>

                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    Create secure authentication nodes for municipal barangay officials and TVET training partners.
                  </p>

                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => {
                        setIsReportModalOpen(true);
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-800/80 hover:bg-emerald-700/80 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer border border-emerald-500/40"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-emerald-300" />
                        Generate Municipal Report
                      </span>
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("youth_masterlist");
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-700/60 hover:bg-emerald-600/70 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer border border-emerald-500/40"
                    >
                      <span>Explore Youth Masterlist</span>
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("create_account");
                        setRole("SK Chairperson");
                      }}
                      className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50 active:scale-[0.99] text-gray-900 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Provision SK / Captain Account</span>
                      <ArrowRight className="w-4 h-4 text-[#0A6B43]" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("create_tesda");
                        setRole("TESDA Representative");
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Provision TESDA Representative</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>

                {/* Infrastructure Health & Security Grid */}
                <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-6 shadow-xs lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-gray-100 pb-3.5">
                    <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">
                          Infrastructure Architecture & Security Node Status
                        </h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">
                          Core system microservices, cryptographic tokens, and database latency
                        </p>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto text-[10px] sm:text-[11px] bg-gray-100 text-gray-600 font-bold px-2.5 py-1 rounded-full border border-gray-200 shrink-0">
                      Refreshed: Real-time
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-800 font-bold">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Security Layer</span>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-relaxed">
                        OAuth 2.0 and NextAuth JWT tokens enforced with Bcrypt 10-round salted password hashing.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-blue-800 font-bold">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: "8s" }} />
                        <span>Database Sync</span>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-relaxed">
                        Prisma PostgreSQL engine with cascaded foreign-key consistency and real-time state sync.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50/80 border border-gray-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>AI Inference Engine</span>
                      </div>
                      <p className="text-gray-600 text-[11px] leading-relaxed">
                        Content-Based Filtering (CBF) engine active with zero queue latency, coupled with Gemini LLM for personalized insights.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: MUNICIPAL YOUTH MASTERLIST (Suggestion 1) */}
          {/* ============================================================ */}
          {activeTab === "youth_masterlist" && (
            <div className="space-y-5">
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
                    Municipal Youth Masterlist
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Central census directory of all Katipunan ng Kabataan members across all 17 barangays of San Luis.
                  </p>
                </div>
              </div>

              {/* Single Main Card Container for Registered Youth, Search & Results */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                {/* Top Row: Card Name on left, active counter badge on right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Katipunan ng Kabataan Masterlist</h3>
                  <span className="text-xs font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto shrink-0">
                    Showing {filteredYouthMasterlist.length} of {youthProfiles.length} Members
                  </span>
                </div>

                {/* Second Row: Search bar with current filters + Grid/Table view */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, skill, purok, or barangay…"
                      value={youthSearch}
                      onChange={(e) => setYouthSearch(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-4 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 sm:flex-initial">
                      <CustomSelect
                        value={youthBrgyFilter}
                        onChange={(val) => setYouthBrgyFilter(val)}
                        options={[
                          { value: "All", label: "All Barangays" },
                          ...barangays.map(b => ({ value: b.name, label: b.name }))
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                        placeholder="All Barangays"
                      />

                      <CustomSelect
                        value={youthStatusFilter}
                        onChange={(val) => setYouthStatusFilter(val)}
                        options={[
                          { value: "All", label: "All Statuses" },
                          { value: "Out-of-school", label: "Out-of-school (OSY)" },
                          { value: "In-school", label: "In-school" },
                          { value: "Employed", label: "Employed" },
                          { value: "Self-employed", label: "Self-employed" },
                          { value: "Graduate", label: "Graduate" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                        placeholder="All Statuses"
                      />

                      <CustomSelect
                        value={youthDemographicFilter}
                        onChange={(val) => setYouthDemographicFilter(val)}
                        options={[
                          { value: "All", label: "All Sectors" },
                          { value: "Solo Parent", label: "Solo Parent" },
                          { value: "PWD", label: "Person with Disability (PWD)" },
                          { value: "Indigenous", label: "Indigenous Youth" }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                        placeholder="All Sectors"
                      />

                      <CustomSelect
                        value={youthEduFilter}
                        onChange={(val) => setYouthEduFilter(val)}
                        options={[
                          { value: "All", label: "All Education" },
                          ...EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                        placeholder="All Education"
                      />
                    </div>

                    {/* View Mode Switcher */}
                    <div className="h-[38px] p-1 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setYouthViewMode("grid")}
                        className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                          youthViewMode === "grid"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                        title="Grid Cards View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setYouthViewMode("table")}
                        className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                          youthViewMode === "table"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                        title="Table View"
                      >
                        <Table className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset Filters Notification (if active) */}
                {(youthSearch || youthBrgyFilter !== "All" || youthStatusFilter !== "All" || youthDemographicFilter !== "All" || youthEduFilter !== "All") && (
                  <div className="flex items-center justify-between pt-1 text-xs text-gray-500 border-t border-gray-100">
                    <span className="font-medium">Active filters applied</span>
                    <button
                      onClick={() => {
                        setYouthSearch("");
                        setYouthBrgyFilter("All");
                        setYouthStatusFilter("All");
                        setYouthDemographicFilter("All");
                        setYouthEduFilter("All");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Filters
                    </button>
                  </div>
                )}

                {/* Results Section (Grid View or Table View) */}
                <div>
                  {sortedYouthMasterlist.length === 0 ? (
                    <div className="border border-gray-200 rounded-xl p-10 text-center space-y-3 bg-white">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0A6B43] flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">No Katipunan ng Kabataan Members Found</h4>
                      <p className="text-xs text-gray-500 max-w-md mx-auto">
                        We couldn't find any youth records matching your current filter configuration. Try broadening your search or resetting filters.
                      </p>
                      <button
                        onClick={() => {
                          setYouthSearch("");
                          setYouthBrgyFilter("All");
                          setYouthStatusFilter("All");
                          setYouthDemographicFilter("All");
                          setYouthEduFilter("All");
                        }}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : youthViewMode === "grid" ? (
                    /* Grid Cards View - Matching SK/KK format */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {paginatedYouthList.map((y) => (
                          <div
                            key={y.id}
                            className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1.5 hover:shadow-md flex flex-col justify-between group"
                            id={`youth-card-${y.id}`}
                          >
                            <div>
                              {/* Avatar - Name, _ years old . gender */}
                              <div className="flex items-center gap-3 mb-3.5">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                                  {y.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-bold text-gray-900 group-hover:text-[#0A6B43] transition-colors text-base truncate leading-snug tracking-tight">
                                    {y.name}
                                  </h4>
                                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                                    {y.age} years old · {y.gender || "Youth"}
                                  </p>
                                </div>
                              </div>

                              {/* Break Line between Avatar and Location */}
                              <hr className="border-gray-100 my-3.5" />

                              {/* Location (Barangay & Purok) & Educational Attainment */}
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 min-w-0">
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="font-medium">{y.barangay.replace(/^Barangay\s+/i, "")} ({y.purok})</span>
                                </div>
                                <span className="text-gray-300 shrink-0 select-none">·</span>
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{y.educationalAttainment}</span>
                                </div>
                              </div>

                              {/* Livelihood Status Pill Badge */}
                              <div className="mb-3.5">
                                <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                                  y.currentStatus === "Out-of-school"
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : y.currentStatus === "In-school"
                                    ? "bg-blue-50 text-blue-800 border-blue-200"
                                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}>
                                  {y.currentStatus}
                                </span>
                              </div>

                              {/* Skills Pills */}
                              <div className="flex flex-wrap gap-1 mb-4">
                                {y.skills && y.skills.length > 0 ? (
                                  <>
                                    {y.skills.slice(0, 3).map((skill, sIdx) => (
                                      <span key={sIdx} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-md">
                                        {skill}
                                      </span>
                                    ))}
                                    {y.skills.length > 3 && (
                                      <span className="text-[11px] font-bold text-gray-400 px-1 py-0.5">
                                        +{y.skills.length - 3}
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200/80 rounded-md">
                                    No Skills Specified
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <button
                              onClick={() => setSelectedYouthDetail(y)}
                              className="w-full mt-2 py-2 px-3 bg-gray-50 hover:bg-emerald-50 hover:text-[#0A6B43] border border-gray-200/80 rounded-xl text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>View Full Profile</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Grid Pagination Footer */}
                      {sortedYouthMasterlist.length > YOUTH_PER_PAGE && (
                        <div className="border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                          <p className="text-xs text-gray-500 font-medium">
                            Showing <span className="font-semibold text-gray-800">{(youthPage - 1) * YOUTH_PER_PAGE + 1}</span> to{" "}
                            <span className="font-semibold text-gray-800">{Math.min(sortedYouthMasterlist.length, youthPage * YOUTH_PER_PAGE)}</span> of{" "}
                            <span className="font-semibold text-gray-800">{sortedYouthMasterlist.length}</span> members
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <button
                              type="button"
                              disabled={youthPage === 1}
                              onClick={() => setYouthPage(p => Math.max(1, p - 1))}
                              className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>Previous</span>
                            </button>

                            {getPaginationItems(youthPage, totalYouthPages).map((item, idx) => {
                              if (item === "...") {
                                return (
                                  <span
                                    key={`ellipsis-grid-${idx}`}
                                    className="h-8 min-w-[32px] px-2 flex items-center justify-center text-xs text-gray-400 font-semibold select-none"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              const pageNum = Number(item);
                              const isActive = youthPage === pageNum;
                              return (
                                <button
                                  key={`grid-page-${pageNum}`}
                                  type="button"
                                  onClick={() => setYouthPage(pageNum)}
                                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                                    isActive
                                      ? "bg-[#0A6B43] text-white shadow-xs font-bold"
                                      : "border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              disabled={youthPage === totalYouthPages}
                              onClick={() => setYouthPage(p => Math.min(totalYouthPages, p + 1))}
                              className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Table View - Matching SK Table format */
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold whitespace-nowrap">
                              <th className="py-3 px-4 text-left whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleYouthTableSort("name")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${
                                    youthTableSortColumn === "name" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                  title={`Sort by KK Youth Member (${youthTableSortColumn === "name" ? (youthTableSortDirection === "asc" ? "Increasing" : "Decreasing") : "Click to sort"})`}
                                >
                                  <span>Youth Member</span>
                                  {youthTableSortColumn === "name" ? (
                                    youthTableSortDirection === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    )
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-60 shrink-0 transition-opacity" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleYouthTableSort("barangay")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${
                                    youthTableSortColumn === "barangay" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                  title={`Sort by Barangay Zone`}
                                >
                                  <span>Barangay Zone</span>
                                  {youthTableSortColumn === "barangay" ? (
                                    youthTableSortDirection === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    )
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-60 shrink-0 transition-opacity" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleYouthTableSort("age")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${
                                    youthTableSortColumn === "age" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                  title={`Sort by Age`}
                                >
                                  <span>Age</span>
                                  {youthTableSortColumn === "age" ? (
                                    youthTableSortDirection === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    )
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-60 shrink-0 transition-opacity" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleYouthTableSort("education")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${
                                    youthTableSortColumn === "education" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                  title={`Sort by Education`}
                                >
                                  <span>Education</span>
                                  {youthTableSortColumn === "education" ? (
                                    youthTableSortDirection === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    )
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-60 shrink-0 transition-opacity" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => handleYouthTableSort("status")}
                                  className={`inline-flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold transition-colors cursor-pointer select-none whitespace-nowrap group outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-0 ${
                                    youthTableSortColumn === "status" ? "text-[#0A6B43]" : "text-gray-500 hover:text-gray-900"
                                  }`}
                                  title={`Sort by Livelihood Status`}
                                >
                                  <span>Status</span>
                                  {youthTableSortColumn === "status" ? (
                                    youthTableSortDirection === "asc" ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                    )
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 opacity-60 shrink-0 transition-opacity" />
                                  )}
                                </button>
                              </th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">Special Sectors</th>
                              <th className="py-3 px-4 text-left whitespace-nowrap">Key Competencies</th>
                              <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {paginatedYouthList.map((y) => (
                              <tr key={y.id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-xs shrink-0">
                                      {y.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-gray-900 truncate">{y.name}</p>
                                      <p className="text-[11px] text-gray-400 truncate">{y.email || `${y.purok}`}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-700 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>{y.barangay.replace(/^Barangay\s+/i, "")}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                  {y.age} y/o · {y.gender || "Youth"}
                                </td>
                                <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                  {y.educationalAttainment}
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${
                                    y.currentStatus === "Out-of-school"
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : y.currentStatus === "In-school"
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  }`}>
                                    {y.currentStatus}
                                  </span>
                                </td>
                                <td className="py-3 px-4 whitespace-nowrap">
                                  <div className="flex flex-wrap gap-1">
                                    {y.soloParent && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md">Solo Parent</span>}
                                    {y.pwd && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md">PWD</span>}
                                    {y.indigenous && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">Indigenous</span>}
                                    {!y.soloParent && !y.pwd && !y.indigenous && <span className="text-gray-400 text-[11px]">—</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex flex-wrap gap-1 max-w-xs">
                                    {y.skills && y.skills.length > 0 ? (
                                      <>
                                        {y.skills.slice(0, 2).map((skill, sIdx) => (
                                          <span key={sIdx} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100/60 px-2 py-0.5 rounded-md">
                                            {skill}
                                          </span>
                                        ))}
                                        {y.skills.length > 2 && (
                                          <span className="text-[11px] font-bold text-gray-400 px-1 py-0.5">
                                            +{y.skills.length - 2}
                                          </span>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-200/80 rounded-md">
                                        No Skills Specified
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  <button
                                    onClick={() => setSelectedYouthDetail(y)}
                                    title="View Full Profile"
                                    className="w-8.5 h-8.5 rounded-full bg-white border border-gray-200/90 text-[#0A6B43] shadow-xs hover:bg-[#0A6B43] hover:text-white hover:border-[#0A6B43] hover:shadow-sm inline-flex items-center justify-center transition-all cursor-pointer active:scale-95 group mx-auto outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                                  >
                                    <ArrowUpRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Table Pagination Footer */}
                      {sortedYouthMasterlist.length > YOUTH_PER_PAGE && (
                        <div className="border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                          <p className="text-xs text-gray-500 font-medium">
                            Showing <span className="font-semibold text-gray-800">{(youthPage - 1) * YOUTH_PER_PAGE + 1}</span> to{" "}
                            <span className="font-semibold text-gray-800">{Math.min(sortedYouthMasterlist.length, youthPage * YOUTH_PER_PAGE)}</span> of{" "}
                            <span className="font-semibold text-gray-800">{sortedYouthMasterlist.length}</span> members
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap justify-center">
                            <button
                              type="button"
                              disabled={youthPage === 1}
                              onClick={() => setYouthPage(p => Math.max(1, p - 1))}
                              className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                            >
                              <ChevronLeft className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                              <span>Previous</span>
                            </button>

                            {getPaginationItems(youthPage, totalYouthPages).map((item, idx) => {
                              if (item === "...") {
                                return (
                                  <span
                                    key={`ellipsis-tbl-${idx}`}
                                    className="h-8 min-w-[32px] px-2 flex items-center justify-center text-xs text-gray-400 font-semibold select-none"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              const pageNum = Number(item);
                              const isActive = youthPage === pageNum;
                              return (
                                <button
                                  key={`tbl-page-${pageNum}`}
                                  type="button"
                                  onClick={() => setYouthPage(pageNum)}
                                  className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                                    isActive
                                      ? "bg-[#0A6B43] text-white shadow-xs font-bold"
                                      : "border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              disabled={youthPage === totalYouthPages}
                              onClick={() => setYouthPage(p => Math.min(totalYouthPages, p + 1))}
                              className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                            >
                              <span>Next</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: BARANGAY ADMINISTRATIVE DIRECTORY (17 Barangays) */}
          {/* ============================================================ */}
          {activeTab === "barangays" && (
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
                    Barangay Administrative Directory
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Municipal zone governance, official SK Chairperson credentials, and administrative coverage across 17 barangays.
                  </p>
                </div>
              </div>

              {/* Top Mini KPI Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Total Zones</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{brgyCoverageSummary.total}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">Barangays</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-medium mt-1">100% municipal coverage</p>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Fully Assigned</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-[#0A6B43] tracking-tight">{brgyCoverageSummary.fullyCovered}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">/ 17</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-[#0A6B43] h-full rounded-full transition-all" 
                      style={{ width: `${(brgyCoverageSummary.fullyCovered / 17) * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">SK Chairpersons</span>
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{stats.skChairpersons}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">/ 17 Active</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold mt-1">{17 - stats.skChairpersons} vacancies</p>
                </div>

                <div className="bg-white border border-gray-200/90 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Barangay Captains</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{stats.brgyCaptains}</span>
                    <span className="text-[11px] text-gray-500 font-semibold">/ 17 Active</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">{17 - stats.brgyCaptains} vacancies</p>
                </div>
              </div>

              {/* Single Main Card Container for Barangay Directory */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                {/* Top Row: Card Name on left, Provision Leader on right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Barangay Administrative Directory</h3>
                  <button
                    onClick={() => {
                      setActiveTab("create_account");
                      setRole("SK Chairperson");
                    }}
                    className="w-full sm:w-auto justify-center bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>Provision Leader</span>
                  </button>
                </div>

                {/* Second Row: Search bar with current filters + Grid/Table view */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by Barangay name, SK Chairperson, or Barangay Captain…"
                      value={brgySearch}
                      onChange={(e) => setBrgySearch(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-4 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <div className="min-w-[200px]">
                      <CustomSelect
                        value={brgyStatusFilter}
                        onChange={(val) => setBrgyStatusFilter(val)}
                        options={[
                          { value: "All", label: "All 17 Barangays" },
                          { value: "Fully Assigned", label: `Fully Assigned (${brgyCoverageSummary.fullyCovered})` },
                          { value: "Needs SK Chairperson", label: `Needs SK (${brgyCoverageSummary.needsSk})` },
                          { value: "Needs Barangay Captain", label: `Needs Captain (${brgyCoverageSummary.needsCap})` },
                          { value: "Needs Assignment", label: `Needs Assignment (${brgyCoverageSummary.needsAny})` }
                        ]}
                        size="sm"
                        buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                        placeholder="All 17 Barangays"
                      />
                    </div>

                    {/* View Mode Switcher */}
                    <div className="h-[38px] p-1 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBrgyViewMode("grid")}
                        className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                          brgyViewMode === "grid"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                        title="Grid Cards View"
                      >
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrgyViewMode("table")}
                        className={`h-full px-3 rounded-lg flex items-center gap-1.5 text-[12px] transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none ${
                          brgyViewMode === "table"
                            ? "bg-white text-[#0A6B43] shadow-xs font-bold"
                            : "text-gray-500 hover:text-gray-800 font-medium hover:bg-gray-100/60"
                        }`}
                        title="Table View"
                      >
                        <Table className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset Filters Notification (if active) */}
                {(brgySearch || brgyStatusFilter !== "All") && (
                  <div className="flex items-center justify-between pt-1 text-xs text-gray-500 border-t border-gray-100">
                    <span className="font-medium">Active filters applied</span>
                    <button
                      onClick={() => {
                        setBrgySearch("");
                        setBrgyStatusFilter("All");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Filters
                    </button>
                  </div>
                )}

              {/* ============================================================ */}
              {/* VIEW 1: ORGANIZED GRID CARDS VIEW */}
              {/* ============================================================ */}
              {brgyViewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {paginatedBarangayList.map((item) => {
                    const isFullyCovered = item.sk.status === "Active" && item.cap.status === "Active";

                    return (
                      <div 
                        key={item.name}
                        className="bg-white border border-gray-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-1.5 transition-all duration-200 flex flex-col justify-between space-y-4 group"
                      >
                        {/* Card Header: Zone Name + Status Badge + Rename */}
                        <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center font-black text-sm shrink-0 border border-emerald-100 shadow-2xs">
                              <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors truncate tracking-tight">
                                Barangay {item.name}
                              </h3>
                              <span className="text-[10px] text-gray-400 font-medium">San Luis, Pampanga</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                              isFullyCovered 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {isFullyCovered ? "Fully Covered" : "Needs Leader"}
                            </span>
                            <button
                              onClick={() => handleEditBrgyClick(item.name)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Rename Barangay"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Leadership Details: 2 Structured Sub-Cards */}
                        <div className="space-y-2.5">
                          
                          {/* SK Chairperson Box */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            item.sk.status === "Active" 
                              ? "bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-gray-300" 
                              : "bg-amber-50/40 border-dashed border-amber-300"
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> SK Chairperson
                              </span>
                              {item.sk.id && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
                                  item.sk.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {item.sk.status}
                                </span>
                              )}
                            </div>

                            {item.sk.id ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{item.sk.name}</p>
                                  <p className="text-[10px] font-mono text-gray-400 truncate">{item.sk.email}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleResetPassword({ id: item.sk.id!, name: item.sk.name, email: item.sk.email, role: "SK Chairperson", barangay: item.name })}
                                    disabled={updatingUserId === item.sk.id}
                                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                    title="Reset Password to Temporary"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Toggle Status */}
                                  <button
                                    onClick={() => handleToggleStatus({ id: item.sk.id!, name: item.sk.name, status: item.sk.status })}
                                    disabled={updatingUserId === item.sk.id}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                    title={item.sk.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                  >
                                    {item.sk.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteAccountTarget({ id: item.sk.id!, name: item.sk.name, role: "SK Chairperson" })}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                    title="Delete SK Chairperson Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 py-0.5">
                                <span className="text-[11px] text-gray-400 italic">No Chairperson assigned</span>
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("SK Chairperson");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <UserPlus className="w-3 h-3" /> Assign Now
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Barangay Captain Box */}
                          <div className={`p-3.5 rounded-xl border transition-all ${
                            item.cap.status === "Active" 
                              ? "bg-gray-50/70 border-gray-200/80 hover:bg-white hover:border-gray-300" 
                              : "bg-amber-50/40 border-dashed border-amber-300"
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Barangay Captain
                              </span>
                              {item.cap.id && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${
                                  item.cap.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {item.cap.status}
                                </span>
                              )}
                            </div>

                            {item.cap.id ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">{item.cap.name}</p>
                                  <p className="text-[10px] font-mono text-gray-400 truncate">{item.cap.email}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleResetPassword({ id: item.cap.id!, name: item.cap.name, email: item.cap.email, role: "Barangay Captain", barangay: item.name })}
                                    disabled={updatingUserId === item.cap.id}
                                    className="p-1 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                    title="Reset Password to Temporary"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Toggle Status */}
                                  <button
                                    onClick={() => handleToggleStatus({ id: item.cap.id!, name: item.cap.name, status: item.cap.status })}
                                    disabled={updatingUserId === item.cap.id}
                                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                    title={item.cap.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                  >
                                    {item.cap.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteAccountTarget({ id: item.cap.id!, name: item.cap.name, role: "Barangay Captain" })}
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                    title="Delete Barangay Captain Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 py-0.5">
                                <span className="text-[11px] text-gray-400 italic">No Captain assigned</span>
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("Barangay Captain");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <UserPlus className="w-3 h-3" /> Assign Now
                                </button>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Card Sub-Footer: Councilor count + Youth residents + Roster action */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <Users className="w-3 h-3 text-gray-500 shrink-0" />
                              <span>{item.councilorCount} Councilors</span>
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <GraduationCap className="w-3 h-3 text-[#0A6B43] shrink-0" />
                              <span>{item.kkCount} Youth</span>
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBrgy(item.name);
                              setIsViewModalOpen(true);
                            }}
                            className="text-xs font-bold text-[#0A6B43] hover:text-[#075332] flex items-center gap-1 cursor-pointer transition-colors group-hover:translate-x-0.5 transition-transform"
                          >
                            <span>Roster</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ============================================================ */}
              {/* VIEW 2: COMPACT HIGH-LEGIBILITY TABLE VIEW */}
              {/* ============================================================ */}
              {brgyViewMode === "table" && (
                <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">Barangay Administrative Directory (17 Municipal Zones)</h3>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Tabular overview of SK Chairpersons and Barangay Captains across San Luis</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500">
                      Showing <strong>{filteredBarangays.length}</strong> of 17 zones
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200/80 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold">
                          <th className="p-4 pl-6">Barangay Zone</th>
                          <th className="p-4">SK Chairperson</th>
                          <th className="p-4">Barangay Captain</th>
                          <th className="p-4 text-center">Councilors</th>
                          <th className="p-4 text-center">KK Youth</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                        {paginatedBarangayList.map((item, index) => (
                          <tr key={index} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="p-4 pl-6 font-extrabold text-gray-900 text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0A6B43] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                                  <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <span>{item.name}</span>
                              </div>
                            </td>
                            
                            {/* SK Chairperson details */}
                            <td className="p-4">
                              {item.sk.id ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.sk.name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium">{item.sk.email}</p>
                                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${
                                      item.sk.status === "Active" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}>
                                      {item.sk.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResetPassword({ id: item.sk.id!, name: item.sk.name, email: item.sk.email, role: "SK Chairperson", barangay: item.name })}
                                      disabled={updatingUserId === item.sk.id}
                                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Reset Password to Temporary"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus({ id: item.sk.id!, name: item.sk.name, status: item.sk.status })}
                                      disabled={updatingUserId === item.sk.id}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title={item.sk.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                    >
                                      {item.sk.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                    <button
                                      onClick={() => setDeleteAccountTarget({ id: item.sk.id!, name: item.sk.name, role: "SK Chairperson" })}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete SK Chairperson Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("SK Chairperson");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Assign Chairperson
                                </button>
                              )}
                            </td>

                            {/* Barangay Captain details */}
                            <td className="p-4">
                              {item.cap.id ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-gray-900">{item.cap.name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium">{item.cap.email}</p>
                                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${
                                      item.cap.status === "Active" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}>
                                      {item.cap.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResetPassword({ id: item.cap.id!, name: item.cap.name, email: item.cap.email, role: "Barangay Captain", barangay: item.name })}
                                      disabled={updatingUserId === item.cap.id}
                                      className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Reset Password to Temporary"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus({ id: item.cap.id!, name: item.cap.name, status: item.cap.status })}
                                      disabled={updatingUserId === item.cap.id}
                                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title={item.cap.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                    >
                                      {item.cap.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                    <button
                                      onClick={() => setDeleteAccountTarget({ id: item.cap.id!, name: item.cap.name, role: "Barangay Captain" })}
                                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                      title="Delete Barangay Captain Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("Barangay Captain");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Assign Captain
                                </button>
                              )}
                            </td>

                            <td className="p-4 text-center font-bold text-gray-700">
                              <span className="px-2.5 py-1 bg-gray-100 rounded-lg inline-block text-xs">
                                {item.councilorCount}
                              </span>
                            </td>

                            <td className="p-4 text-center font-bold text-[#0A6B43]">
                              <span className="px-2.5 py-1 bg-emerald-50 text-[#0A6B43] border border-emerald-200 rounded-lg inline-block text-xs">
                                {item.kkCount}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedBrgy(item.name);
                                    setIsViewModalOpen(true);
                                  }}
                                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="View Barangay Roster"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => handleEditBrgyClick(item.name)}
                                  className="p-1.5 text-gray-400 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Rename Barangay"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Pagination Footer */}
                  {filteredBarangays.length > BRGY_PER_PAGE && (
                    <div className="border-t border-gray-100 px-4 py-3 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                      <p className="text-xs text-gray-500 font-medium">
                        Showing <span className="font-semibold text-gray-800">{(brgyPage - 1) * BRGY_PER_PAGE + 1}</span> to{" "}
                        <span className="font-semibold text-gray-800">{Math.min(filteredBarangays.length, brgyPage * BRGY_PER_PAGE)}</span> of{" "}
                        <span className="font-semibold text-gray-800">{filteredBarangays.length}</span> barangays
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          disabled={brgyPage === 1}
                          onClick={() => setBrgyPage(p => Math.max(1, p - 1))}
                          className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>Previous</span>
                        </button>

                        {getPaginationItems(brgyPage, totalBrgyPages).map((item, idx) => {
                          if (item === "...") {
                            return (
                              <span
                                key={`ellipsis-tbl-brgy-${idx}`}
                                className="h-8 min-w-[32px] px-2 flex items-center justify-center text-xs text-gray-400 font-semibold select-none"
                              >
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(item);
                          const isActive = brgyPage === pageNum;
                          return (
                            <button
                              key={`tbl-brgy-page-${pageNum}`}
                              type="button"
                              onClick={() => setBrgyPage(pageNum)}
                              className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                                isActive
                                  ? "bg-[#0A6B43] text-white shadow-xs font-bold"
                                  : "border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          disabled={brgyPage === totalBrgyPages}
                          onClick={() => setBrgyPage(p => Math.min(totalBrgyPages, p + 1))}
                          className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: TESDA DIRECTORY & RECORDS */}
          {/* ============================================================ */}
          {activeTab === "tesda_records" && (
            <div className="space-y-5">
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
                    TESDA Partner Directory
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Institutional TVET partner directory, certified program modules, and accredited training providers.
                  </p>
                </div>
              </div>

              {/* Single Main Card Container for TESDA Municipal Representatives */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                {/* Top Row: Card Name on left, Provision New Representative on right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-[26px] font-extrabold text-gray-900 tracking-tight">TESDA Municipal Representatives</h3>
                  <button
                    onClick={() => {
                      setActiveTab("create_tesda");
                      setRole("TESDA Representative");
                    }}
                    className="w-full sm:w-auto justify-center bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white px-4 sm:px-5 py-2.5 rounded-xl text-[14px] font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>Provision New Representative</span>
                  </button>
                </div>

                {/* Second Row: Search bar */}
                <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by representative name or official email…"
                      value={tesdaSearch}
                      onChange={(e) => setTesdaSearch(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-4 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <span className="text-xs font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl shadow-2xs self-start sm:self-auto shrink-0">
                    {filteredTesdaReps.length} Representative(s)
                  </span>
                </div>

                {/* Results Table Container */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead>
                        <tr className="bg-gray-50/70 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-bold whitespace-nowrap">
                          <th className="py-3 px-4 text-left whitespace-nowrap">Representative Name</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Official Email</th>
                          <th className="py-3 px-4 text-left whitespace-nowrap">Assigned Role</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Date Created</th>
                          <th className="py-3 px-4 text-center whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTesdaReps.length > 0 ? (
                          filteredTesdaReps.map((item) => (
                            <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {item.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 truncate">{item.name}</p>
                                    <p className="text-[11px] text-gray-400">TVET Technical Liaison</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#0A6B43] font-mono text-xs font-semibold whitespace-nowrap">
                                {item.email}
                              </td>
                              <td className="py-3 px-4 text-gray-700 whitespace-nowrap font-medium">
                                {item.role}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                  item.status === "Active" 
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                    : "bg-amber-50 text-amber-800 border-amber-200"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center text-gray-500 whitespace-nowrap">
                                {item.dateCreated}
                              </td>
                              <td className="py-3 px-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => handleResetPassword({ id: item.id, name: item.name, email: item.email, role: "TESDA Representative" })}
                                    disabled={updatingUserId === item.id}
                                    className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                    title="Reset Password to Temporary"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleToggleStatus({ id: item.id, name: item.name, status: item.status })}
                                    disabled={updatingUserId === item.id}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title={item.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                  >
                                    {item.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>

                                  <button
                                    onClick={() => setDeleteAccountTarget({ id: item.id, name: item.name, role: "TESDA Representative" })}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Delete TESDA Representative Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-400 font-medium">
                              No TESDA Representatives registered matching your search criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: SYSTEM-WIDE AUDIT LOGS & ACTIVITY (Suggestion 4) */}
          {/* ============================================================ */}
          {activeTab === "audit_logs" && (
            <div className="space-y-5">
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
                    Security & Audit Logs
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Immutable security event telemetry, administrative actions, and account provisioning records.
                  </p>
                </div>
              </div>

              {/* Single Main Card Container for Security & Audit Logs */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 space-y-5">
                {/* Top Row: Card Name on left, active counter badge on right */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <h3 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Municipal Activity Stream & Audit Trail</h3>
                  <span className="text-xs font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs self-start sm:self-auto shrink-0">
                    {auditLogs.length} Log Entries
                  </span>
                </div>

                {/* Second Row: Search bar & Category filter */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search logs by actor, action description, or barangay…"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full h-[38px] pl-10 pr-4 bg-gray-50/70 border border-gray-200 rounded-xl text-[12px] placeholder:text-[12px] font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="min-w-[220px]">
                    <CustomSelect
                      value={auditCategoryFilter}
                      onChange={(val) => setAuditCategoryFilter(val)}
                      options={[
                        { value: "All", label: `All Event Categories (${auditLogs.length})` },
                        { value: "User Provisioning", label: "User Provisioning" },
                        { value: "Youth Registration", label: "Youth Registration" },
                        { value: "Application & Enrollment", label: "Application & Enrollment" },
                        { value: "Program Update", label: "Program Updates" },
                        { value: "Announcement", label: "Announcements" }
                      ]}
                      size="sm"
                      buttonClassName="h-[38px] !text-[12px] !rounded-xl font-medium bg-gray-50/70"
                      placeholder="All Event Categories"
                    />
                  </div>
                </div>

                {/* Reset Filters Notification (if active) */}
                {(auditSearch || auditCategoryFilter !== "All") && (
                  <div className="flex items-center justify-between pt-1 text-xs text-gray-500 border-t border-gray-100">
                    <span className="font-medium">Active filter applied</span>
                    <button
                      onClick={() => {
                        setAuditSearch("");
                        setAuditCategoryFilter("All");
                      }}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Clear Filters
                    </button>
                  </div>
                )}

                {/* Logs Stream Container */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs divide-y divide-gray-100">
                  {paginatedAuditLogs.length > 0 ? (
                    paginatedAuditLogs.map((log) => (
                      <div key={log.id} className="p-4 px-6 hover:bg-emerald-50/30 transition-colors flex items-start gap-3.5">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          log.category === "User Provisioning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          log.category === "Youth Registration" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" :
                          log.category === "Application & Enrollment" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {log.category === "User Provisioning" && <Key className="w-4 h-4" />}
                          {log.category === "Youth Registration" && <Users className="w-4 h-4" />}
                          {log.category === "Application & Enrollment" && <FileText className="w-4 h-4" />}
                          {log.category === "Program Update" && <Briefcase className="w-4 h-4" />}
                          {log.category === "Announcement" && <Bell className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <p className="text-xs font-extrabold text-gray-900">{log.action}</p>
                            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {log.timestamp}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-600">
                            <span className="font-medium text-gray-800">{log.target}</span>
                            {log.barangay && (
                              <span className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                {log.barangay}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">by {log.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-400 font-medium">
                      No audit events recorded for current filters.
                    </div>
                  )}

                  {/* Pagination Controls for Audit Logs */}
                  {auditLogs.length > AUDIT_PER_PAGE && (
                    <div className="p-4 px-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <span className="text-gray-500 font-medium">
                        Showing <span className="font-semibold text-gray-800">{(auditPage - 1) * AUDIT_PER_PAGE + 1}</span> to{" "}
                        <span className="font-semibold text-gray-800">{Math.min(auditPage * AUDIT_PER_PAGE, auditLogs.length)}</span> of{" "}
                        <span className="font-semibold text-gray-800">{auditLogs.length}</span> log entries
                      </span>

                      <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <button
                          type="button"
                          disabled={auditPage === 1}
                          onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                          className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                        >
                          <ChevronLeft className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span>Previous</span>
                        </button>

                        {getPaginationItems(auditPage, totalAuditPages).map((item, idx) => {
                          if (item === "...") {
                            return (
                              <span
                                key={`ellipsis-audit-${idx}`}
                                className="h-8 min-w-[32px] px-2 flex items-center justify-center text-xs text-gray-400 font-semibold select-none"
                              >
                                ...
                              </span>
                            );
                          }
                          const pageNum = Number(item);
                          const isActive = auditPage === pageNum;
                          return (
                            <button
                              key={`audit-page-${pageNum}`}
                              type="button"
                              onClick={() => setAuditPage(pageNum)}
                              className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer outline-none focus:outline-none ${
                                isActive
                                  ? "bg-[#0A6B43] text-white shadow-xs font-bold"
                                  : "border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 active:scale-95"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          disabled={auditPage === totalAuditPages}
                          onClick={() => setAuditPage(p => Math.min(totalAuditPages, p + 1))}
                          className="h-8 px-2.5 sm:px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 flex items-center gap-1 transition-all cursor-pointer active:scale-95 outline-none focus:outline-none"
                        >
                          <span>Next</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: CREATE OFFICIAL ACCOUNT FORM */}
          {/* ============================================================ */}
          {activeTab === "create_account" && (
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
                    Provision Official Account
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Create verified administrative access credentials for SK Chairpersons and Barangay Captains across 17 Barangays.
                  </p>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
                
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Provision Barangay Leader Account</h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">Create verified access credentials for SK Chairpersons and Barangay Captains across 17 Barangays</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 shrink-0">
                    OAuth 2.0 Node
                  </span>
                </div>

                <form onSubmit={handleCreateAccountSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 text-xs font-semibold">
                  
                  {/* Section 1: Official Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      1. Official Credentials & Name
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Authorized Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Captain Danilo Santos"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Official Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. danilosantos.captain@sanluispampanga.gov.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Role & Barangay */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      2. Role & Territorial Zone Assignment (17 Barangays)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Assigned Official Role</label>
                        <CustomSelect
                          value={role}
                          onChange={(val) => handleRoleChange({ target: { value: val } } as any)}
                          options={[
                            { value: "SK Chairperson", label: "SK Chairperson" },
                            { value: "Barangay Captain", label: "Barangay Captain" }
                          ]}
                          size="md"
                          placeholder="Select Role"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Barangay Assignment</label>
                        <CustomSelect
                          value={barangayAssignment}
                          onChange={(val) => setBarangayAssignment(val)}
                          options={barangays.map(b => ({ value: b.name, label: b.name }))}
                          size="md"
                          placeholder="Select Barangay"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Generated Password */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      3. Temporary Security Node
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase">Temporary Generated Password</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="w-full p-2.5 sm:p-3 bg-gray-50/80 border border-gray-200 text-[#0A6B43] font-mono font-bold rounded-xl tracking-wider focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden text-xs sm:text-sm transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-3.5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs self-stretch sm:self-auto"
                          title="Generate New Password"
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">The official will be prompted to update this password upon initial sign in.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 sm:py-3.5 px-4 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold sm:font-black rounded-xl tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 shrink-0" />
                      )}
                      <span className="leading-snug">Provision Account & Generate Credentials</span>
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

          {/* ============================================================ */}
          {/* TAB 5: CREATE TESDA REPRESENTATIVE FORM */}
          {/* ============================================================ */}
          {activeTab === "create_tesda" && (
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
                    Provision TVET Partner
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Create verified access credentials for accredited technical-vocational education and training officers.
                  </p>
                </div>
              </div>

              <div className="max-w-3xl mx-auto">
                <div className="bg-white border border-gray-200/90 rounded-2xl shadow-xs overflow-hidden">
                
                <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight">Provision TESDA Partner Representative</h3>
                      <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">Create verified access credentials for TVET technical training officers</p>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 shrink-0">
                    Municipal Partner
                  </span>
                </div>

                <form onSubmit={handleCreateTesdaSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 text-xs font-semibold">
                  
                  {/* Section 1: Partner Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      1. Representative Profile & Contact
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Authorized Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Evelyn Castor"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Official Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. evelyn.castor@tesda.gov.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 bg-gray-50/80 border border-gray-200 rounded-xl text-gray-900 text-xs focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Scope Assignment */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      2. Role & Jurisdiction
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Assigned Official Role</label>
                        <input
                          type="text"
                          readOnly
                          value="TESDA Representative"
                          className="w-full p-3 bg-gray-100/70 border border-gray-200 text-gray-500 rounded-xl text-xs cursor-not-allowed outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-700 uppercase">Jurisdiction Scope</label>
                        <input
                          type="text"
                          readOnly
                          value="Municipal-wide (All 17 San Luis Barangays)"
                          className="w-full p-3 bg-gray-100/70 border border-gray-200 text-gray-500 rounded-xl text-xs cursor-not-allowed outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Generated Password */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b border-gray-100">
                      3. Temporary Security Node
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-700 uppercase">Temporary Generated Password</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                          <input
                            type="text"
                            required
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="w-full p-2.5 sm:p-3 bg-gray-50/80 border border-gray-200 text-[#0A6B43] font-mono font-bold rounded-xl tracking-wider focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden text-xs sm:text-sm transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="px-3.5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-2xs self-stretch sm:self-auto"
                          title="Generate New Password"
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 sm:py-3.5 px-4 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold sm:font-black rounded-xl tracking-wide shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      ) : (
                        <UserCheck className="w-4 h-4 shrink-0" />
                      )}
                      <span className="leading-snug">Provision TESDA Account & Generate Credentials</span>
                    </button>
                  </div>

                </form>
              </div>
            </div>
          </div>
        )}

          {/* ============================================================ */}
          {/* TAB 8: SUPER ADMIN PROFILE & GOVERNANCE COMMAND */}
          {/* ============================================================ */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in duration-200">
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
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                      Tier 1 Root Clearance
                    </span>
                  </div>
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Admin Profile & Security
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Manage municipal youth governance oversight, central root credentials, administrative access keys, and system alert controls.
                  </p>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar (Centered) */}
              <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] shrink-0 border border-slate-200 mx-auto">
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab("profile")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      profileActiveTab === "profile"
                        ? "bg-[#0A6B43] text-white shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0" />
                    <span>Administrator Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab("security")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      profileActiveTab === "security"
                        ? "bg-[#0A6B43] text-white shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Security & Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab("notifications")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      profileActiveTab === "notifications"
                        ? "bg-[#0A6B43] text-white shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Central System Alerts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveTab("badge")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      profileActiveTab === "badge"
                        ? "bg-[#0A6B43] text-white shadow-xs font-extrabold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>Root Authorization Badge</span>
                  </button>
                </div>
              </div>

              {/* Centered Tab Contents Container */}
              <div className="max-w-5xl mx-auto w-full">
                {/* TAB 1: ADMINISTRATOR PROFILE */}
                {profileActiveTab === "profile" && (
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left Column (3 cols) */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg sm:text-xl shadow-md border-2 border-amber-400 shrink-0 mt-0.5 sm:mt-0">
                            ADM
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{adminName}</h3>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0">
                                Root Authority
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                              {adminOffice}
                            </p>
                            <p className="text-xs font-mono text-slate-600 mt-1 truncate">
                              {adminEmail}
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
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Administrator Full Name</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{adminName}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Official Designation</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Super Administrator & MYDO Head</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Executive Email</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{adminEmail}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Communication Hotline</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{adminPhone}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Office / Department</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">{adminOffice}</p>
                          </div>
                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Territorial Scope</p>
                            <p className="text-xs font-bold text-slate-800 mt-1">Municipality of San Luis (17 Barangays)</p>
                          </div>
                          <div className="sm:col-span-2 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Root Governance Clearance</p>
                              <p className="text-xs text-slate-600 mt-0.5">Unrestricted administrative governance across all barangay zones & institutional portals</p>
                            </div>
                            <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg">
                              TIER 1 ROOT
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Edit Mode Form */
                        <form onSubmit={handleSaveProfileSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Administrator Full Name
                              </label>
                              <input
                                type="text"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Executive Email Address
                              </label>
                              <input
                                type="email"
                                value={adminEmail}
                                onChange={(e) => setAdminEmail(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Direct Contact Hotline
                              </label>
                              <input
                                type="text"
                                value={adminPhone}
                                onChange={(e) => setAdminPhone(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Department / Office Designation
                              </label>
                              <input
                                type="text"
                                value={adminOffice}
                                onChange={(e) => setAdminOffice(e.target.value)}
                                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                                required
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
                                  Save Administrator Details
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </div>

                  {/* Right Column (2 cols): Authority & Clearance Summary */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-slate-900 leading-tight">Root Governance Authority</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Tier 1 Central Municipal Command</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Clearance Level</span>
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                            Tier 1 Root Governance
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Municipal Zones</span>
                          <span className="text-xs font-bold text-slate-900">
                            17 Barangays (San Luis)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Provisioned Accounts</span>
                          <span className="text-xs font-bold text-slate-900">
                            {officialAccounts.length} Official(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">KK Youth Tracked</span>
                          <span className="text-xs font-bold text-slate-900">
                            {stats.kkMembers} Members
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-xs text-slate-600 font-medium">Institutional Hub</span>
                          <span className="text-xs font-bold text-slate-900">
                            MYDO Central Command
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-[#0A6B43]" />
                          Statutory & Legal Framework
                        </p>
                        Authorized under RA 10742 (Sangguniang Kabataan Reform Act) and the Data Privacy Act of 2012 (RA 10173) to administer youth livelihood records and official credentials.
                      </div>

                      <div className="pt-2 border-t border-slate-100">
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
                              <span>Sign Out Central Administration</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ACCOUNT SECURITY */}
              {profileActiveTab === "security" && (
                <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          Update Root Security Password
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          Ensure central administrative access remains strictly protected against unauthorized access.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Current Security Password
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        New Security Password (minimum 6 characters)
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Confirm New Security Password
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
                        Changing the Root Administrator password will immediately update central access across all municipal services. Ensure credentials are preserved safely.
                      </span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isChangingPassword ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Updating Root Password...
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            Update Root Password
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: NOTIFICATIONS */}
              {profileActiveTab === "notifications" && (
                <div className="max-w-3xl mx-auto">
                  <NotificationSettingsCard
                    userRole="SUPER_ADMIN"
                    userEmail={currentUser?.email}
                    addToast={addToast}
                  />
                </div>
              )}

              {/* TAB 4: ROOT AUTHORIZATION BADGE */}
              {profileActiveTab === "badge" && (
                <div className="max-w-xl mx-auto space-y-6">
                  {/* Digital Credential ID Card */}
                  <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-[#112F24] to-[#0A231A] text-white p-7 shadow-2xl">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Card Top Header */}
                    <div className="flex items-center justify-between pb-5 border-b border-white/10 relative z-10 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 truncate">Republic of the Philippines</p>
                          <p className="text-xs font-extrabold tracking-wide text-white truncate">Municipality of San Luis · MYDO</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                        Root Clearance
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-3xl shadow-lg border-2 border-white/30 shrink-0">
                        ADM
                      </div>
                      <div className="text-center sm:text-left space-y-1">
                        <h4 className="text-lg font-black text-white tracking-tight">{adminName}</h4>
                        <p className="text-xs font-semibold text-amber-300">Super Administrator & MYDO Head</p>
                        <p className="text-[11px] text-slate-300 font-mono pt-1">
                          Municipal Youth Development Office · San Luis, Pampanga
                        </p>
                        <div className="inline-flex items-center gap-2 mt-2 px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-[10px] font-mono text-amber-300">
                          <span>AUTH-ID:</span>
                          <span className="font-bold">{currentUser?.id?.slice(0, 14) || "SA-MYDO-SANLUIS-001"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 relative z-10">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Central Infrastructure Controller</span>
                      </div>
                      <span className="font-mono text-slate-400">Tier 1 Root Governance</span>
                    </div>
                  </div>

                  {/* Copy Credential Button */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        const info = `MUNICIPAL SUPER ADMINISTRATOR CREDENTIAL\nAdministrator: ${adminName}\nDesignation: Super Administrator & MYDO Head\nOffice: ${adminOffice}\nEmail: ${adminEmail}\nContact: ${adminPhone}\nJurisdiction: San Luis, Pampanga (17 Barangays)\nClearance: Tier 1 Root Governance\nAuthorization ID: ${currentUser?.id || "SA-MYDO-SANLUIS-001"}`;
                        navigator.clipboard.writeText(info);
                        addToast("Super Administrator Credential copied to clipboard!", "success");
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs transition-colors cursor-pointer"
                    >
                      <Copy className="w-4 h-4 text-[#0A6B43]" />
                      Copy Root Credential Details
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================ */}
      {/* YOUTH PROFILE DETAIL MODAL (Polished Youth Dossier) */}
      {/* ============================================================ */}
      {selectedYouthDetail && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedYouthDetail(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div className="bg-slate-50 border border-gray-200 rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 ease-out">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#0A6B43] to-[#042f2e] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  {selectedYouthDetail.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight text-white drop-shadow-xs">
                    {selectedYouthDetail.name}
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium mt-0.5 truncate">
                    {selectedYouthDetail.email || `Barangay ${selectedYouthDetail.barangay.replace(/^Barangay\s+/i, "")} · ${selectedYouthDetail.purok}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedYouthDetail(null)}
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
                title="Close Dossier"
                aria-label="Close Dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-gray-700">
              
              {/* Super Admin Quick Actions Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200/90 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Account Governance:</span>
                  <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    selectedYouthDetail.approvalStatus === "Approved" || !selectedYouthDetail.approvalStatus
                      ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200"
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {selectedYouthDetail.approvalStatus || "Active Resident"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleResetYouthPassword(selectedYouthDetail)}
                    disabled={updatingUserId === selectedYouthDetail.id}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/90 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Generate temporary password for this youth account"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-700" />
                    <span>{updatingUserId === selectedYouthDetail.id ? "Generating..." : "Reset Password"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDeleteAccountTarget({
                        id: selectedYouthDetail.id,
                        name: selectedYouthDetail.name,
                        role: "KK Youth Member",
                        isYouth: true
                      });
                      setSelectedYouthDetail(null);
                    }}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Permanently delete this youth profile and account"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Delete Account</span>
                  </button>
                </div>
              </div>

              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 border border-gray-100 space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                  <User className="w-4.5 h-4.5 text-[#0A6B43] shrink-0" />
                  <h4 className="text-[15px] font-bold text-gray-900 tracking-tight">Personal & Demographic Information</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-gray-900">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Territorial Barangay</span>
                    <p className="text-[14px] font-bold text-gray-900 mt-0.5 leading-snug">
                      Barangay {selectedYouthDetail.barangay.replace(/^Barangay\s+/i, "")}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Purok / Zone</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.purok || "Purok 1"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Age</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.age} years old
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Gender</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.gender || "Female"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Educational Attainment</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.educationalAttainment || "Senior High School Graduate"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Livelihood Status</span>
                    <p className="text-[14px] font-extrabold text-[#0A6B43] mt-0.5 leading-snug">
                      {selectedYouthDetail.currentStatus}
                    </p>
                  </div>

                  {selectedYouthDetail.contactNumber && (
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Contact Number</span>
                      <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                        {selectedYouthDetail.contactNumber}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Sector Preference</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.sectorPreference || "General / Flexible"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">Registration Status</span>
                    <p className="text-[14px] font-semibold text-gray-900 mt-0.5 leading-snug">
                      {selectedYouthDetail.registeredDate || "Verified katipunan member"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Career Goals, Competencies & Demographics Card */}
              <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-5 sm:p-6 border border-gray-100 space-y-5">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-1.5">
                    Declared Career & Livelihood Goal
                  </span>
                  <p className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-gray-900 font-medium text-xs leading-relaxed">
                    "{selectedYouthDetail.livelihoodGoal || "Seeking technical-vocational training, livelihood skills development, and municipal employment opportunities."}"
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                    Competencies & Technical Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedYouthDetail.skills && selectedYouthDetail.skills.length > 0 ? (
                      selectedYouthDetail.skills.map((s: string, idx: number) => (
                        <span key={idx} className="bg-gray-100 border border-gray-200 px-3 py-1 rounded-xl text-gray-800 text-xs font-bold shadow-2xs">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No skills listed yet</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                    Training Interests & Program Modules
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedYouthDetail.interests && selectedYouthDetail.interests.length > 0 ? (
                      selectedYouthDetail.interests.map((it: string, idx: number) => (
                        <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold shadow-2xs">
                          {it}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 italic text-xs">No interests listed</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block mb-2">
                    Special Demographics
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedYouthDetail.soloParent && (
                      <span className="bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold">
                        Solo Parent
                      </span>
                    )}
                    {selectedYouthDetail.pwd && (
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
                        Person with Disability
                      </span>
                    )}
                    {selectedYouthDetail.indigenous && (
                      <span className="bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
                        Indigenous Youth
                      </span>
                    )}
                    {!selectedYouthDetail.soloParent && !selectedYouthDetail.pwd && !selectedYouthDetail.indigenous && (
                      <span className="bg-gray-100 text-gray-600 border border-gray-200 px-3 py-1 rounded-full text-xs font-medium">
                        General Youth Resident
                      </span>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW BARANGAY DETAILS MODAL */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedBrgyDetails && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsViewModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div className="bg-slate-50 border border-gray-200 rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 ease-out">
            
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#0A6B43] to-[#042f2e] text-white p-4 sm:p-5 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-base shrink-0 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight text-white drop-shadow-xs">
                    Barangay {selectedBrgyDetails.name} Zone Summary
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-medium mt-0.5 truncate">
                    Administrative Leadership Roster & Katipunan ng Kabataan Directory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
                title="Close Summary"
                aria-label="Close Summary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs font-semibold">
              
              {/* Leaders summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">SK Chairperson</span>
                    <p className="font-extrabold text-base text-gray-900 mt-1">{selectedBrgyDetails.sk.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{selectedBrgyDetails.sk.email}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedBrgyDetails.sk.status === "Active" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" : "bg-gray-100 text-gray-500"
                    }`}>
                      {selectedBrgyDetails.sk.status}
                    </span>
                    {selectedBrgyDetails.sk.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.sk.id!, name: selectedBrgyDetails.sk.name, role: "SK Chairperson" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-gray-200/90 p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Barangay Captain</span>
                    <p className="font-extrabold text-base text-gray-900 mt-1">{selectedBrgyDetails.cap.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5 font-medium">{selectedBrgyDetails.cap.email}</p>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`inline-block text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedBrgyDetails.cap.status === "Active" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" : "bg-gray-100 text-gray-500"
                    }`}>
                      {selectedBrgyDetails.cap.status}
                    </span>
                    {selectedBrgyDetails.cap.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.cap.id!, name: selectedBrgyDetails.cap.name, role: "Barangay Captain" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 text-xs font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Councilors Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-gray-900 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0A6B43]" />
                  SK Councilors Roster ({selectedBrgyDetails.councilors.length}/11 Capacity)
                </h4>
                {selectedBrgyDetails.councilors.length > 0 ? (
                  <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200/80 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold whitespace-nowrap">
                            <th className="p-3 pl-4">Councilor Name</th>
                            <th className="p-3">Official Role</th>
                            <th className="p-3">Email Address</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Registered Date</th>
                            <th className="p-3 text-center pr-4">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 whitespace-nowrap">
                          {selectedBrgyDetails.councilors.map((c, i) => (
                            <tr key={c.id || i} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="p-3 pl-4 font-bold text-gray-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-[11px] shrink-0">
                                    {c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <span>{c.name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  c.role?.toLowerCase().includes("secretary")
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : c.role?.toLowerCase().includes("treasurer")
                                    ? "bg-teal-50 text-teal-800 border-teal-200"
                                    : "bg-emerald-50 text-[#0A6B43] border border-emerald-200"
                                }`}>
                                  {c.role || "SK Councilor"}
                                </span>
                              </td>
                              <td className="p-3 text-gray-500 font-mono text-[11px]">{c.email}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  c.status === "Active" ? "bg-emerald-50 text-[#0A6B43] border border-emerald-200" : "bg-gray-100 text-gray-500"
                                }`}>
                                  {c.status}
                                </span>
                              </td>
                              <td className="p-3 text-right text-gray-400 font-medium">{c.dateCreated}</td>
                              <td className="p-3 text-center pr-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteAccountTarget({
                                      id: c.id,
                                      name: c.name,
                                      role: c.role || "SK Councilor",
                                      isCouncilor: true,
                                    });
                                    setIsViewModalOpen(false);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 border border-red-200/80 rounded-xl transition-colors cursor-pointer"
                                  title={`Delete ${c.name}'s account`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200/90 p-6 text-center rounded-2xl text-gray-400">
                    No councilors registered for this barangay yet.
                  </div>
                )}
              </div>

              {/* KK Members list */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-gray-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                  Registered KK Youth Residents ({selectedBrgyDetails.youth.length})
                </h4>
                {selectedBrgyDetails.youth.length > 0 ? (
                  <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden max-h-52 overflow-y-auto shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[500px] text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200/80 text-[10px] text-gray-500 uppercase tracking-wider font-extrabold sticky top-0 whitespace-nowrap">
                            <th className="p-3 pl-4">Member Name</th>
                            <th className="p-3">Age</th>
                            <th className="p-3">Purok</th>
                            <th className="p-3 pr-4">Attainment / Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 whitespace-nowrap">
                          {selectedBrgyDetails.youth.map((y, i) => (
                            <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                              <td className="p-3 pl-4 font-bold text-gray-900">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {y.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                  </div>
                                  <span>{y.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-gray-500">{y.age} y/o</td>
                              <td className="p-3 text-gray-500">{y.purok}</td>
                              <td className="p-3 pr-4 text-gray-600 font-medium">{y.educationalAttainment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200/90 p-6 text-center rounded-2xl text-gray-400">
                    No KK youth registered for this barangay yet.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-white border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors cursor-pointer text-xs"
              >
                Close Summary
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* EDIT / RENAME BARANGAY MODAL */}
      {/* ============================================================ */}
      {isEditModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md overflow-hidden text-xs font-semibold shadow-2xl animate-in fade-in zoom-in-95 duration-200 ease-out">
            
            <div className="bg-gradient-to-r from-[#064e3b] via-[#0A6B43] to-[#042f2e] text-white p-4 sm:p-5 flex justify-between items-center shadow-xs">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">Rename Barangay Zone</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrgyName} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 uppercase">Administrative Barangay Name</label>
                <input
                  type="text"
                  required
                  value={editBrgyName}
                  onChange={(e) => setEditBrgyName(e.target.value)}
                  className="w-full p-3 bg-gray-50/80 border border-gray-200 text-gray-900 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0A6B43]/20 focus:border-[#0A6B43] focus:outline-hidden transition-all"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer text-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors cursor-pointer text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUCCESS CREATED / RESET CREDENTIALS MODAL */}
      {/* ============================================================ */}
      {createdCredentials && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreatedCredentials(null);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-white border border-emerald-200 rounded-3xl w-full max-w-md p-6 text-center space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 ease-out">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center mx-auto mb-1 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-gray-900">
                {createdCredentials.isReset ? "Password Reset Successfully!" : "Account Provisioned Successfully!"}
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {createdCredentials.isReset ? "New temporary password initialized in database" : "Official access credentials have been initialized in database"}
              </p>
            </div>
            
            <div className="text-left bg-gray-50/80 border border-gray-200 rounded-2xl p-4 space-y-2 text-xs text-gray-700 font-medium">
              <p><strong className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider block">Assigned Official Name</strong> <span className="text-gray-900 font-bold">{createdCredentials.name}</span></p>
              <p><strong className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider block">Provisioned Role</strong> <span className="text-[#0A6B43] font-bold">{createdCredentials.role}</span></p>
              {createdCredentials.barangay && (
                <p><strong className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider block">Barangay Zone</strong> <span className="text-gray-900 font-bold">{createdCredentials.barangay}</span></p>
              )}
              <div className="h-px bg-gray-200 my-2" />
              <p><strong className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider block">Registered Email</strong> <span className="text-[#0A6B43] font-mono text-[11px] font-bold">{createdCredentials.email}</span></p>
              <p><strong className="text-gray-400 uppercase text-[9px] font-extrabold tracking-wider block">Temporary Password</strong> <span className="text-amber-800 font-mono text-sm font-bold tracking-wider">{createdCredentials.pass}</span></p>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
              Copy this secure credential card and send it privately to the assigned official.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-3 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied to Clipboard ✓" : "Copy Credentials"}
              </button>
              <button
                onClick={() => setCreatedCredentials(null)}
                className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {/* ============================================================ */}
      <ConfirmationModal
        isOpen={!!deleteAccountTarget}
        title={`Delete Account: ${deleteAccountTarget?.role} "${deleteAccountTarget?.name}"?`}
        description={`Are you sure you want to permanently delete the official account for "${deleteAccountTarget?.name}"? They will lose access to the SiKap administrative system immediately.`}
        confirmText="Delete Account"
        confirmVariant="red"
        onConfirm={confirmDeleteAccount}
        onCancel={() => setDeleteAccountTarget(null)}
      />

      {/* ============================================================ */}
      {/* EXECUTIVE MUNICIPAL REPORT GENERATOR MODAL */}
      {/* ============================================================ */}
      {isReportModalOpen && (
        <div 
          id="printable-superadmin-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReportModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div 
            id="printable-superadmin-modal-card"
            className="bg-white rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-slate-200 animate-in fade-in zoom-in-95 duration-200 ease-out"
          >
            
            {/* Modal Header Bar (Hidden during Print) */}
            <div className="relative bg-[#112F24] text-white p-4 sm:p-5 pr-14 sm:pr-16 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print border-b border-emerald-900">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                    Executive Municipal Report Generator
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md">
                      Official MYDO Document
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-200/90 font-medium">
                    Municipality of San Luis, Pampanga · Comprehensive Statistical Assessment
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Scope Filter Dropdown */}
                <div className="flex items-center gap-1.5">
                  <CustomSelect
                    value={selectedReportBarangay}
                    onChange={(val) => setSelectedReportBarangay(val)}
                    options={[
                      { value: "All", label: "Zone: All 17 Barangays" },
                      ...barangays.map((b) => ({ value: b.name, label: `Zone: ${b.name}` }))
                    ]}
                    size="sm"
                    placeholder="Select Zone"
                    buttonClassName="bg-[#0D241C] border-emerald-800/80 text-emerald-100 font-bold hover:bg-[#123026]"
                  />
                </div>

                {/* Export Excel (.xls) Formatted Table Button */}
                <button
                  type="button"
                  onClick={handleExportReportExcel}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/50"
                  title="Export styled spreadsheet pre-configured for US Letter printing (.xls)"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Export Excel (.xls)</span>
                </button>

                {/* Print / Save as PDF Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print official multi-page document on US Letter paper size or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF (Letter)</span>
                </button>
              </div>

              {/* Dedicated Top-Right X / Exit Button */}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                aria-label="Close report generator"
                title="Close report modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Report Document Body */}
            <div
              className="flex-1 p-6 sm:p-10 print:p-0 print:space-y-5 overflow-y-auto space-y-7 text-slate-800 bg-white"
              id="printable-superadmin-report"
            >
              
              {/* Document Header & Official Government Letterhead */}
              <div className="text-center border-b-2 border-[#0A6B43] pb-5 space-y-1 print-avoid-break">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Republic of the Philippines · Province of Pampanga
                </p>
                <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-tight">
                  MUNICIPALITY OF SAN LUIS
                </h2>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0A6B43] uppercase tracking-wider">
                  MUNICIPAL YOUTH DEVELOPMENT OFFICE (MYDO) · CENTRAL EXECUTIVE REGISTRY
                </h3>
                <p className="text-[10px] text-slate-400 font-semibold pt-1 uppercase tracking-wider">
                  SiKap Integrated Katipunan ng Kabataan & TVET Livelihood Matching System
                </p>
                <div className="pt-2">
                  <span className="inline-block bg-slate-100 text-slate-900 border border-slate-300 text-xs sm:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-lg">
                    Comprehensive Municipal Youth Demographic & TVET Enrollment Report
                  </span>
                </div>
              </div>

              {/* Document Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200 print-avoid-break">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Report Scope</span>
                  <span className="font-black text-slate-900 text-xs">
                    {selectedReportBarangay === "All" ? "All 17 Municipal Zones" : `Barangay ${selectedReportBarangay}`}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Report Series ID</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    MYDO-SLP-2026-{selectedReportBarangay.slice(0, 3).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Assessment Date</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Generating Authority</span>
                  <span className="font-bold text-[#0A6B43] text-xs">
                    {adminName} (Super Admin)
                  </span>
                </div>
              </div>

              {/* SECTION I: EXECUTIVE KPI SCORECARD */}
              <div className="space-y-3 print-avoid-break">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A6B43]" />
                    I. Executive KPI Scorecard
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Official Central Metrics
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 print:grid-cols-5 kpi-scorecard-grid gap-3 text-center">
                  
                  {/* Metric 1: Total KK Youth */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Total KK Youth
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {reportStats.totalYouth}
                    </p>
                    <span className="text-[10px] font-semibold text-slate-500 mt-1">
                      {reportStats.barangaysCount} zone(s) active
                    </span>
                  </div>

                  {/* Metric 2: Out-of-School Youth (OSY) */}
                  <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                      Out-of-School (OSY)
                    </span>
                    <p className="text-2xl font-black text-amber-950 mt-1">
                      {reportStats.osyCount}
                    </p>
                    <span className="text-[10px] font-bold text-amber-700 mt-1">
                      {reportStats.osyPercentage}% OSY density
                    </span>
                  </div>

                  {/* Metric 3: Active TESDA Programs */}
                  <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Active TVET Programs
                    </span>
                    <p className="text-2xl font-black text-emerald-950 mt-1">
                      {reportStats.activeProgramsCount}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 mt-1">
                      of {reportStats.totalProgramsCount} published modules
                    </span>
                  </div>

                  {/* Metric 4: Total Program Enrollments (strictly using "Enrollment", no "referrals") */}
                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                      Program Enrollments
                    </span>
                    <p className="text-2xl font-black text-blue-950 mt-1">
                      {reportStats.totalEnrollments}
                    </p>
                    <span className="text-[10px] font-semibold text-blue-700 mt-1">
                      trainees enrolled
                    </span>
                  </div>

                  {/* Metric 5: Municipal Coverage */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between col-span-2 sm:col-span-1 print:col-span-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Municipal Coverage
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {reportStats.barangaysCount}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 mt-1">
                      100% zones tracked
                    </span>
                  </div>

                </div>
              </div>

              {/* SECTION II: 17-BARANGAY ADMINISTRATIVE & DEMOGRAPHIC MATRIX */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A6B43]" />
                    II. Barangay Governance & Demographic Matrix
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Coverage Breakdown across 17 Zones
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Barangay Zone</th>
                        <th className="py-2.5 px-2 text-center">KK Members</th>
                        <th className="py-2.5 px-2 text-center">OSY Count</th>
                        <th className="py-2.5 px-2 text-center">OSY %</th>
                        <th className="py-2.5 px-3">SK Chairperson</th>
                        <th className="py-2.5 px-3">Barangay Captain</th>
                        <th className="py-2.5 px-2 text-center">Councilors</th>
                        <th className="py-2.5 px-2 text-center">Enrollments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {barangayReportList.map((b) => (
                        <tr key={b.name} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {b.name}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                            {b.kkCount}
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-amber-700">
                            {b.osyCount}
                          </td>
                          <td className="py-2.5 px-2 text-center text-[11px] font-bold text-slate-600">
                            {b.osyPercentage}%
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                              {b.sk.name}
                            </span>
                            <span className={`text-[9px] font-bold uppercase ${b.sk.status === "Active" ? "text-emerald-700" : "text-slate-400"}`}>
                              {b.sk.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-800 block text-[11px] leading-tight">
                              {b.cap.name}
                            </span>
                            <span className={`text-[9px] font-bold uppercase ${b.cap.status === "Active" ? "text-emerald-700" : "text-slate-400"}`}>
                              {b.cap.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-bold text-purple-700">
                            {b.councilorCount}
                          </td>
                          <td className="py-2.5 px-2 text-center font-black text-blue-700">
                            {b.enrollmentCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION III: DEMOGRAPHIC & EDUCATIONAL PROFILE ANALYSIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-5 print-avoid-break">
                
                {/* Educational Attainment Table */}
                <div className="space-y-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>III. Educational Attainment</span>
                    <span className="text-[10px] text-slate-400 font-bold">Academic Distribution</span>
                  </h4>
                  <div className="space-y-2">
                    {educationStats.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-semibold">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{item.count}</span>
                          <span className="text-[10px] font-bold text-slate-500 w-12 text-right">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Age Demographics Table */}
                <div className="space-y-3 p-4 bg-slate-50/60 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                    <span>Age Bracket Demographics</span>
                    <span className="text-[10px] text-slate-400 font-bold">Age Cohorts</span>
                  </h4>
                  <div className="space-y-2">
                    {ageGroupStats.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-semibold">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900">{item.count}</span>
                          <span className="text-[10px] font-bold text-slate-500 w-12 text-right">
                            ({item.percentage}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary note */}
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed font-medium">
                    Demographic data validated against active Katipunan ng Kabataan profiling records across San Luis, Pampanga.
                  </div>
                </div>

              </div>

              {/* SECTION IV: TESDA TVET PROGRAM DIRECTORY & ENROLLMENT UTILIZATION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0A6B43]" />
                    IV. Technical Vocational (TVET) Program Offerings & Capacity
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Active TESDA Partnerships
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Program Title</th>
                        <th className="py-2.5 px-3">Training Center / Provider</th>
                        <th className="py-2.5 px-2 text-center">Total Slots</th>
                        <th className="py-2.5 px-2 text-center">Available</th>
                        <th className="py-2.5 px-2 text-center">Enrolled</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {programs.map((p) => {
                        const enrolledCount = referrals.filter(r => r.programId === p.id).length;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {p.title}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">
                              {p.provider || "San Luis TVET Center"}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                              {p.slotsTotal}
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-emerald-700">
                              {p.slotsRemaining}
                            </td>
                            <td className="py-2.5 px-2 text-center font-black text-blue-700">
                              {enrolledCount}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {(() => {
                                const isEnded = isProgramEnded(p);
                                return (
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                    isEnded
                                      ? "bg-purple-100 text-purple-800 border-purple-300"
                                      : p.activeStatus === "Closed"
                                        ? "bg-red-50 text-red-700 border-red-200"
                                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  }`}>
                                    {isEnded ? "Term Ended" : p.activeStatus || "Active"}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
