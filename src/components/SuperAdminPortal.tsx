"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Building2, Users, Briefcase, Activity, Shield, Copy, Check, RefreshCw, 
  UserCheck, LogOut, ArrowRight, Eye, Edit, Trash2, PlusCircle, CheckCircle2,
  Lock, Bell, Search, Filter, MapPin, Sparkles, AlertTriangle, ChevronRight, ChevronLeft,
  User, Mail, Phone, Calendar, CheckCircle, X, Layers, ExternalLink, ShieldCheck,
  Key, Power, Ban, FileText, History, Clock, Tag, Award, GraduationCap, CheckCircle as CheckIcon,
  LayoutGrid, List, UserPlus, ShieldAlert
} from "lucide-react";
import { OfficialAccount, Councilor, YouthProfile, TESDAProgram, Barangay, ReferralPipelineItem, SKAnnouncement } from "../types";
import { MetricCard, SikapLogo, ConfirmationModal } from "./ReusableComponents";

interface SuperAdminPortalProps {
  youthProfiles: YouthProfile[];
  setYouthProfiles?: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  barangays: Barangay[];
  setBarangays: React.Dispatch<React.SetStateAction<Barangay[]>>;
  officialAccounts: OfficialAccount[];
  setOfficialAccounts: React.Dispatch<React.SetStateAction<OfficialAccount[]>>;
  councilors: Councilor[];
  referrals?: ReferralPipelineItem[];
  announcements?: SKAnnouncement[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  currentUser?: any;
}

export const SuperAdminPortal: React.FC<SuperAdminPortalProps> = ({
  youthProfiles,
  programs,
  barangays,
  setBarangays,
  officialAccounts,
  setOfficialAccounts,
  councilors,
  referrals = [],
  announcements = [],
  onLogout,
  addToast,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "youth_masterlist" | "barangays" | "tesda_records" | "audit_logs" | "create_account" | "create_tesda"
  >("dashboard");

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
  const [notificationsRead, setNotificationsRead] = useState(false);

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
  const [deleteAccountTarget, setDeleteAccountTarget] = useState<{ id: string; name: string; role: string } | null>(null);

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
Please sign in at http://localhost:3001 and change your password immediately.`;
    
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
      const matchesEdu = youthEduFilter === "All" || y.educationalAttainment === youthEduFilter;

      return matchesSearch && matchesBrgy && matchesStatus && matchesDemographic && matchesEdu;
    });
  }, [youthProfiles, youthSearch, youthBrgyFilter, youthStatusFilter, youthDemographicFilter, youthEduFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setYouthPage(1);
  }, [youthSearch, youthBrgyFilter, youthStatusFilter, youthDemographicFilter, youthEduFilter]);

  // Calculate total pages and slice for pagination (limit 10 per page)
  const totalYouthPages = Math.max(1, Math.ceil(filteredYouthMasterlist.length / YOUTH_PER_PAGE));
  const paginatedYouthList = useMemo(() => {
    const start = (youthPage - 1) * YOUTH_PER_PAGE;
    return filteredYouthMasterlist.slice(start, start + YOUTH_PER_PAGE);
  }, [filteredYouthMasterlist, youthPage, YOUTH_PER_PAGE]);

  // Suggestion 4: System-Wide Audit Log & Activity Stream
  const auditLogs = useMemo(() => {
    const events: {
      id: string;
      category: "User Provisioning" | "Youth Registration" | "Referral & Enrollment" | "Program Update" | "Announcement";
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

    // Referrals & Admissions
    referrals.forEach(r => {
      events.push({
        id: `ref-${r.id}`,
        category: "Referral & Enrollment",
        actor: r.youthName,
        action: `Application status: ${r.status} for ${r.programTitle}`,
        target: `${r.youthName} · Match Score ${r.matchScore}%`,
        barangay: r.barangay || "San Luis",
        timestamp: r.referralDate ? new Date(r.referralDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently",
        rawDate: r.referralDate ? new Date(r.referralDate) : new Date()
      });
    });

    // TESDA Programs
    programs.forEach(p => {
      events.push({
        id: `prog-${p.id}`,
        category: "Program Update",
        actor: "TESDA Partner Coordinator",
        action: `Course cataloged (${p.activeStatus}): ${p.title}`,
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
    const { id, name, role } = deleteAccountTarget;

    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setOfficialAccounts(prev => prev.filter(o => o.id !== id));
        addToast(`Successfully deleted ${role} account for ${name}!`, "success");
      } else {
        addToast(data.message || "Failed to delete account", "error");
      }
    } catch (err) {
      console.error(err);
      setOfficialAccounts(prev => prev.filter(o => o.id !== id));
      addToast(`Account for ${name} removed.`, "info");
    } finally {
      setDeleteAccountTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800" id="super-admin-portal-root">
      
      {/* ============================================================ */}
      {/* SIDEBAR - Signature SiKap Emerald Theme (#112F24 / #164132) */}
      {/* ============================================================ */}
      <aside className="w-68 bg-gradient-to-b from-[#112F24] via-[#164132] to-[#0A231A] text-white flex flex-col justify-between shadow-xl shrink-0 z-20">
        <div className="p-6">
          {/* Header Brand */}
          <div className="flex items-center gap-3 mb-8 pb-5 border-b border-emerald-800/40">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-tight text-white block truncate">SiKap System</span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-slate-950">MYDO</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-300 block tracking-tight">Super Admin Command</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Infrastructure Dashboard", icon: <Activity className="w-4.5 h-4.5" /> },
              { id: "youth_masterlist", label: "Youth Masterlist", icon: <Users className="w-4.5 h-4.5" />, badge: stats.kkMembers },
              { id: "barangays", label: "Barangay Directory (17)", icon: <Building2 className="w-4.5 h-4.5" />, badge: stats.totalBarangays },
              { id: "tesda_records", label: "TESDA Directory", icon: <Briefcase className="w-4.5 h-4.5" />, badge: stats.tesdaReps },
              { id: "audit_logs", label: "Audit Logs & Activity", icon: <History className="w-4.5 h-4.5" /> },
              { id: "create_account", label: "Provision Official Account", icon: <PlusCircle className="w-4.5 h-4.5" /> },
              { id: "create_tesda", label: "Provision TESDA Account", icon: <UserCheck className="w-4.5 h-4.5" /> }
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    if (item.id === "create_account") setRole("SK Chairperson");
                    if (item.id === "create_tesda") setRole("TESDA Representative");
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-emerald-800/80 text-amber-300 border-l-4 border-amber-400 shadow-xs font-extrabold"
                      : "text-emerald-100/80 hover:bg-emerald-800/40 hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-amber-400" : "text-emerald-300"}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-5 border-t border-emerald-800/40 bg-[#0B1E16]">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/30">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              ADM
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Super Administrator</p>
              <p className="text-[10px] text-emerald-300 font-medium">Municipal MYDO Authority</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs text-red-300 hover:text-white rounded-xl transition-all font-bold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out Central
          </button>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50/70 overflow-y-auto">
        
        {/* Sticky Top Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 py-4 flex items-center justify-between z-10 shadow-xs">
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              {activeTab === "dashboard" && "System Infrastructure Dashboard"}
              {activeTab === "youth_masterlist" && "Municipal Youth Demographic Masterlist"}
              {activeTab === "barangays" && "Barangay Administrative Directory (17 Zones)"}
              {activeTab === "tesda_records" && "TESDA Directory & Records"}
              {activeTab === "audit_logs" && "System-Wide Audit Logs & Activity Stream"}
              {activeTab === "create_account" && "Authorized Official Provisioning Studio"}
              {activeTab === "create_tesda" && "TESDA Representative Provisioning"}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Municipal Youth Development Office · Municipality of San Luis, Pampanga (17 Barangays)
            </p>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Live Status Pill */}
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#0A6B43] text-xs font-extrabold rounded-full shadow-2xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Live Infrastructure: Healthy
            </span>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-all cursor-pointer ${
                  showNotifications ? "ring-2 ring-emerald-500 bg-emerald-50 text-[#0A6B43]" : ""
                }`}
                title="System Central Alerts"
              >
                <Bell className="w-4.5 h-4.5" />
                {!notificationsRead && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs overflow-hidden text-slate-700 animate-in fade-in-50 slide-in-from-top-2">
                    <div className="px-4 pb-2 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 p-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-slate-900 text-sm">System Central Alerts</span>
                      </div>
                      <button
                        onClick={() => {
                          setNotificationsRead(true);
                          addToast("Central alerts marked as read", "info");
                        }}
                        className="text-[11px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      <div
                        onClick={() => { setActiveTab("youth_masterlist"); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-emerald-100 text-[#0A6B43] shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Registered KK Demographics</p>
                          <p className="text-[11px] text-slate-500 font-medium">{youthProfiles.length} active youth profiles registered across 17 barangays.</p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setActiveTab("barangays"); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Barangay Leaders Sync</p>
                          <p className="text-[11px] text-slate-500 font-medium">{officialAccounts.length} authorized official accounts active in database.</p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setActiveTab("tesda_records"); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-blue-100 text-blue-800 shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">TESDA Vocational Courses</p>
                          <p className="text-[11px] text-slate-500 font-medium">{programs.length} published TVET course offerings available municipal-wide.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-[#112F24] text-white flex items-center justify-center font-black text-xs shadow-xs border border-emerald-600">
                SA
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 leading-none">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">San Luis, Pampanga</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab Content */}
        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          
          {/* ============================================================ */}
          {/* TAB 1: SYSTEM INFRASTRUCTURE DASHBOARD */}
          {/* ============================================================ */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
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
                  subtitle="active technical courses"
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
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-4.5 h-4.5 text-[#0A6B43]" />
                      Registered System Accounts & Demographics by Assigned Role
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Live distribution across the 17 barangays of San Luis, Pampanga</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
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
                    <div key={index} className="bg-slate-50/80 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between hover:bg-white hover:shadow-xs transition-all">
                      <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{roleItem.label}</p>
                      <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-black text-slate-900">{roleItem.count}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleItem.lightBg}`}>
                          Active
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full ${roleItem.color} rounded-full`} style={{ width: "100%" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Administrative Quick Actions & Infrastructure Node Status */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Provisioning Quick Shortcuts */}
                <div className="bg-gradient-to-br from-[#112F24] to-[#164132] text-white rounded-2xl p-6 shadow-md space-y-4 lg:col-span-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black">
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
                        setActiveTab("youth_masterlist");
                      }}
                      className="w-full py-2.5 px-4 bg-emerald-700/60 hover:bg-emerald-600/70 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer border border-emerald-500/40"
                    >
                      <span>Explore Youth Masterlist</span>
                      <ArrowRight className="w-4 h-4 text-emerald-300" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("create_account");
                        setRole("SK Chairperson");
                      }}
                      className="w-full py-2.5 px-4 bg-white hover:bg-emerald-50 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Provision SK / Captain Account</span>
                      <ArrowRight className="w-4 h-4 text-[#0A6B43]" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("create_tesda");
                        setRole("TESDA Representative");
                      }}
                      className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Provision TESDA Representative</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>

                {/* Infrastructure Health & Security Grid */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-[#0A6B43]" />
                      Infrastructure Architecture & Security Node Status
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md">
                      Refreshed: Real-time
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-amber-700 font-bold">
                        <Lock className="w-4 h-4 text-amber-600" />
                        <span>Security Layer</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        OAuth 2.0 and NextAuth JWT tokens enforced with Bcrypt 10-round salted password hashing.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-blue-700 font-bold">
                        <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" style={{ animationDuration: "8s" }} />
                        <span>Database Sync</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Prisma PostgreSQL engine with cascaded foreign-key consistency and real-time state sync.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>AI Inference Engine</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Google Gemini 2.5 Flash alignment matrix active with zero queue latency for youth matching.
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
              
              {/* Comprehensive Filter Controls */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex-1 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search youth by Name, Purok, Target Skills, or Livelihood Goal..."
                      value={youthSearch}
                      onChange={(e) => setYouthSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <span className="text-xs font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl shrink-0">
                    Showing {filteredYouthMasterlist.length} of {youthProfiles.length} KK Youth
                  </span>
                </div>

                {/* Filter Selector Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Barangay Zone (17)</label>
                    <select
                      value={youthBrgyFilter}
                      onChange={(e) => setYouthBrgyFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All 17 Barangays</option>
                      {barangays.map(b => (
                        <option key={b.name} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Livelihood / Education Status</label>
                    <select
                      value={youthStatusFilter}
                      onChange={(e) => setYouthStatusFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Out-of-school">Out-of-school (OSY)</option>
                      <option value="In-school">In-school</option>
                      <option value="Employed">Employed</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="Graduate">Graduate</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Special Sector / Demographics</label>
                    <select
                      value={youthDemographicFilter}
                      onChange={(e) => setYouthDemographicFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Sectors</option>
                      <option value="Solo Parent">Solo Parent</option>
                      <option value="PWD">Person with Disability (PWD)</option>
                      <option value="Indigenous">Indigenous Youth</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">Educational Attainment</label>
                    <select
                      value={youthEduFilter}
                      onChange={(e) => setYouthEduFilter(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                    >
                      <option value="All">All Attainments</option>
                      <option value="Elementary level">Elementary level</option>
                      <option value="High School level">High School level</option>
                      <option value="High School Graduate">High School Graduate</option>
                      <option value="College level">College level</option>
                      <option value="College Graduate">College Graduate</option>
                      <option value="Vocational / TVET">Vocational / TVET</option>
                    </select>
                  </div>
                </div>

                {(youthSearch || youthBrgyFilter !== "All" || youthStatusFilter !== "All" || youthDemographicFilter !== "All" || youthEduFilter !== "All") && (
                  <div className="flex items-center justify-between pt-2 text-xs">
                    <span className="text-slate-500 font-medium">Active filters applied</span>
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
                      <X className="w-3.5 h-3.5" /> Reset Filters
                    </button>
                  </div>
                )}
              </div>

              {/* Masterlist Table Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                        <th className="p-4 pl-6">KK Member Name</th>
                        <th className="p-4">Barangay Zone</th>
                        <th className="p-4">Age / Education</th>
                        <th className="p-4">Current Status</th>
                        <th className="p-4">Special Sectors</th>
                        <th className="p-4">Key Competencies</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {paginatedYouthList.length > 0 ? (
                        paginatedYouthList.map((y) => (
                          <tr key={y.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900 text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                                  {y.name.charAt(0)}
                                </div>
                                <div>
                                  <span className="block">{y.name}</span>
                                  <span className="text-[10px] font-mono text-slate-400 font-normal">{y.purok}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              <div className="flex items-center gap-1 text-xs">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{y.barangay.replace(/^Barangay\s+/i, "")}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-900">{y.age} y/o</span>
                              <span className="text-[11px] text-slate-500 block">{y.educationalAttainment}</span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                y.currentStatus === "Out-of-school"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : y.currentStatus === "In-school"
                                  ? "bg-blue-50 text-blue-800 border-blue-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}>
                                {y.currentStatus}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {y.soloParent && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded">Solo Parent</span>}
                                {y.pwd && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded">PWD</span>}
                                {y.indigenous && <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded">Indigenous</span>}
                                {!y.soloParent && !y.pwd && !y.indigenous && <span className="text-slate-400 text-[11px]">—</span>}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {y.skills && y.skills.slice(0, 2).map((s: string, sIdx: number) => (
                                  <span key={sIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                    {s}
                                  </span>
                                ))}
                                {y.skills && y.skills.length > 2 && (
                                  <span className="text-[10px] text-slate-400 font-bold">+{y.skills.length - 2}</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setSelectedYouthDetail(y)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#0A6B43] border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Full Profile
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                            No Katipunan ng Kabataan members found matching current search or filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls (Limit 10 per page) */}
                {filteredYouthMasterlist.length > 0 && (
                  <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      Showing <strong>{((youthPage - 1) * YOUTH_PER_PAGE) + 1}</strong> to <strong>{Math.min(youthPage * YOUTH_PER_PAGE, filteredYouthMasterlist.length)}</strong> of <strong>{filteredYouthMasterlist.length}</strong> youth records
                    </span>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        onClick={() => setYouthPage(prev => Math.max(1, prev - 1))}
                        disabled={youthPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalYouthPages }, (_, i) => i + 1).map((pg) => {
                          if (
                            pg === 1 || 
                            pg === totalYouthPages || 
                            (pg >= youthPage - 1 && pg <= youthPage + 1)
                          ) {
                            return (
                              <button
                                key={pg}
                                onClick={() => setYouthPage(pg)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  youthPage === pg
                                    ? "bg-[#0A6B43] text-white shadow-xs"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {pg}
                              </button>
                            );
                          } else if (pg === youthPage - 2 || pg === youthPage + 2) {
                            return <span key={pg} className="px-1 text-slate-400 font-bold">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setYouthPage(prev => Math.min(totalYouthPages, prev + 1))}
                        disabled={youthPage === totalYouthPages}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: BARANGAY ADMINISTRATIVE DIRECTORY (17 Barangays) */}
          {/* ============================================================ */}
          {activeTab === "barangays" && (
            <div className="space-y-6">
              
              {/* Top Mini KPI Stats Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Total Zones</span>
                    <Building2 className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{brgyCoverageSummary.total}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">Barangays</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">100% municipal coverage</p>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Fully Assigned</span>
                    <CheckCircle2 className="w-4 h-4 text-[#0A6B43]" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-[#0A6B43]">{brgyCoverageSummary.fullyCovered}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">/ 17</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-[#0A6B43] h-full rounded-full transition-all" 
                      style={{ width: `${(brgyCoverageSummary.fullyCovered / 17) * 100}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">SK Chairpersons</span>
                    <Shield className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{stats.skChairpersons}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">/ 17 Active</span>
                  </div>
                  <p className="text-[10px] text-blue-600 font-bold mt-1">{17 - stats.skChairpersons} vacancies</p>
                </div>

                <div className="bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">Barangay Captains</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-slate-900">{stats.brgyCaptains}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">/ 17 Active</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">{17 - stats.brgyCaptains} vacancies</p>
                </div>
              </div>

              {/* Filter, Search & View Switcher Toolbar */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Barangay name, SK Chairperson, or Barangay Captain..."
                    value={brgySearch}
                    onChange={(e) => setBrgySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={brgyStatusFilter}
                    onChange={(e) => setBrgyStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All 17 Barangays</option>
                    <option value="Fully Assigned">Fully Assigned ({brgyCoverageSummary.fullyCovered})</option>
                    <option value="Needs SK Chairperson">Needs SK Chairperson ({brgyCoverageSummary.needsSk})</option>
                    <option value="Needs Barangay Captain">Needs Barangay Captain ({brgyCoverageSummary.needsCap})</option>
                    <option value="Needs Assignment">Needs Any Assignment ({brgyCoverageSummary.needsAny})</option>
                  </select>

                  {/* View Mode Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setBrgyViewMode("grid")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        brgyViewMode === "grid"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Cards</span>
                    </button>
                    <button
                      onClick={() => setBrgyViewMode("table")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        brgyViewMode === "table"
                          ? "bg-white text-slate-900 shadow-xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                      title="Compact Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Table</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTab("create_account");
                      setRole("SK Chairperson");
                    }}
                    className="px-3.5 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Provision Leader
                  </button>
                </div>
              </div>

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
                        className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                      >
                        {/* Card Header: Zone Name + Status Badge + Rename */}
                        <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center font-black text-sm shrink-0 border border-emerald-200">
                              <MapPin className="w-4.5 h-4.5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-slate-900 truncate">
                                Barangay {item.name}
                              </h3>
                              <span className="text-[10px] text-slate-500 font-medium">San Luis, Pampanga</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                              isFullyCovered 
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}>
                              {isFullyCovered ? "Fully Covered" : "Needs Leader"}
                            </span>
                            <button
                              onClick={() => handleEditBrgyClick(item.name)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Rename Barangay"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Card Leadership Details: 2 Structured Sub-Cards */}
                        <div className="space-y-2.5">
                          
                          {/* SK Chairperson Box */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            item.sk.status === "Active" 
                              ? "bg-slate-50/90 border-slate-200" 
                              : "bg-amber-50/40 border-dashed border-amber-300"
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
                                <Shield className="w-3 h-3" /> SK Chairperson
                              </span>
                              {item.sk.id && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                  item.sk.status === "Active" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {item.sk.status}
                                </span>
                              )}
                            </div>

                            {item.sk.id ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{item.sk.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500 truncate">{item.sk.email}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleResetPassword({ id: item.sk.id!, name: item.sk.name, email: item.sk.email, role: "SK Chairperson", barangay: item.name })}
                                    disabled={updatingUserId === item.sk.id}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 rounded-md transition-colors cursor-pointer"
                                    title="Reset Password to Temporary"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Toggle Status */}
                                  <button
                                    onClick={() => handleToggleStatus({ id: item.sk.id!, name: item.sk.name, status: item.sk.status })}
                                    disabled={updatingUserId === item.sk.id}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-md transition-colors cursor-pointer"
                                    title={item.sk.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                  >
                                    {item.sk.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteAccountTarget({ id: item.sk.id!, name: item.sk.name, role: "SK Chairperson" })}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100/60 rounded-md transition-colors cursor-pointer"
                                    title="Delete SK Chairperson Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 py-0.5">
                                <span className="text-[11px] text-slate-400 italic">No Chairperson assigned</span>
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("SK Chairperson");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <UserPlus className="w-3 h-3" /> Assign Now
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Barangay Captain Box */}
                          <div className={`p-3 rounded-xl border transition-all ${
                            item.cap.status === "Active" 
                              ? "bg-slate-50/90 border-slate-200" 
                              : "bg-amber-50/40 border-dashed border-amber-300"
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Barangay Captain
                              </span>
                              {item.cap.id && (
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                  item.cap.status === "Active" 
                                    ? "bg-emerald-100 text-emerald-800" 
                                    : "bg-amber-100 text-amber-800"
                                }`}>
                                  {item.cap.status}
                                </span>
                              )}
                            </div>

                            {item.cap.id ? (
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-900 truncate">{item.cap.name}</p>
                                  <p className="text-[10px] font-mono text-slate-500 truncate">{item.cap.email}</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleResetPassword({ id: item.cap.id!, name: item.cap.name, email: item.cap.email, role: "Barangay Captain", barangay: item.name })}
                                    disabled={updatingUserId === item.cap.id}
                                    className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-100/60 rounded-md transition-colors cursor-pointer"
                                    title="Reset Password to Temporary"
                                  >
                                    <Key className="w-3.5 h-3.5" />
                                  </button>
                                  {/* Toggle Status */}
                                  <button
                                    onClick={() => handleToggleStatus({ id: item.cap.id!, name: item.cap.name, status: item.cap.status })}
                                    disabled={updatingUserId === item.cap.id}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/60 rounded-md transition-colors cursor-pointer"
                                    title={item.cap.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                  >
                                    {item.cap.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                  </button>
                                  {/* Delete */}
                                  <button
                                    onClick={() => setDeleteAccountTarget({ id: item.cap.id!, name: item.cap.name, role: "Barangay Captain" })}
                                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-100/60 rounded-md transition-colors cursor-pointer"
                                    title="Delete Barangay Captain Account"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-2 py-0.5">
                                <span className="text-[11px] text-slate-400 italic">No Captain assigned</span>
                                <button
                                  onClick={() => {
                                    setActiveTab("create_account");
                                    setRole("Barangay Captain");
                                    setBarangayAssignment(item.name);
                                  }}
                                  className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <UserPlus className="w-3 h-3" /> Assign Now
                                </button>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Card Footer: Demographic summary & Full Roster Modal Trigger */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              👥 {item.councilorCount} Councilors
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              🎓 {item.kkCount} Youth
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedBrgy(item.name);
                              setIsViewModalOpen(true);
                            }}
                            className="text-xs font-bold text-[#0A6B43] hover:text-[#075332] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Roster</span>
                            <ArrowRight className="w-3 h-3" />
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
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">Barangay Administrative Directory (17 Municipal Zones)</h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Tabular overview of SK Chairpersons and Barangay Captains across San Luis</p>
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      Showing <strong>{filteredBarangays.length}</strong> of 17 zones
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <th className="p-4 pl-6">Barangay Zone</th>
                          <th className="p-4">SK Chairperson</th>
                          <th className="p-4">Barangay Captain</th>
                          <th className="p-4 text-center">Councilors</th>
                          <th className="p-4 text-center">KK Youth</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {paginatedBarangayList.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 pl-6 font-extrabold text-slate-900 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0A6B43] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
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
                                    <p className="font-bold text-slate-900">{item.sk.name}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{item.sk.email}</p>
                                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.2 rounded mt-1 ${
                                      item.sk.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}>
                                      {item.sk.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResetPassword({ id: item.sk.id!, name: item.sk.name, email: item.sk.email, role: "SK Chairperson", barangay: item.name })}
                                      disabled={updatingUserId === item.sk.id}
                                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Reset Password to Temporary"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus({ id: item.sk.id!, name: item.sk.name, status: item.sk.status })}
                                      disabled={updatingUserId === item.sk.id}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title={item.sk.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                    >
                                      {item.sk.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                    <button
                                      onClick={() => setDeleteAccountTarget({ id: item.sk.id!, name: item.sk.name, role: "SK Chairperson" })}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                                  className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
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
                                    <p className="font-bold text-slate-900">{item.cap.name}</p>
                                    <p className="text-[11px] text-slate-500 font-medium">{item.cap.email}</p>
                                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.2 rounded mt-1 ${
                                      item.cap.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                                    }`}>
                                      {item.cap.status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleResetPassword({ id: item.cap.id!, name: item.cap.name, email: item.cap.email, role: "Barangay Captain", barangay: item.name })}
                                      disabled={updatingUserId === item.cap.id}
                                      className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Reset Password to Temporary"
                                    >
                                      <Key className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleToggleStatus({ id: item.cap.id!, name: item.cap.name, status: item.cap.status })}
                                      disabled={updatingUserId === item.cap.id}
                                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title={item.cap.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                    >
                                      {item.cap.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                    </button>
                                    <button
                                      onClick={() => setDeleteAccountTarget({ id: item.cap.id!, name: item.cap.name, role: "Barangay Captain" })}
                                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                                  className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <UserPlus className="w-3.5 h-3.5" /> Assign Captain
                                </button>
                              )}
                            </td>

                            <td className="p-4 text-center font-bold text-slate-700">
                              <span className="px-2.5 py-1 bg-slate-100 rounded-md inline-block text-xs">
                                {item.councilorCount}
                              </span>
                            </td>

                            <td className="p-4 text-center font-bold text-[#0A6B43]">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md inline-block text-xs">
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
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#0A6B43] border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="View Barangay Roster"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                                <button
                                  onClick={() => handleEditBrgyClick(item.name)}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
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
                </div>
              )}

              {/* Pagination Controls for Barangay Directory (6 per page) */}
              {filteredBarangays.length > 0 && (
                <div className="p-4 px-6 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing <strong>{((brgyPage - 1) * BRGY_PER_PAGE) + 1}</strong> to <strong>{Math.min(brgyPage * BRGY_PER_PAGE, filteredBarangays.length)}</strong> of <strong>{filteredBarangays.length}</strong> barangay zones
                  </span>

                  <div className="flex items-center gap-1.5 self-center sm:self-auto">
                    <button
                      onClick={() => setBrgyPage(prev => Math.max(1, prev - 1))}
                      disabled={brgyPage === 1}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalBrgyPages }, (_, i) => i + 1).map((pg) => {
                        if (
                          pg === 1 || 
                          pg === totalBrgyPages || 
                          (pg >= brgyPage - 1 && pg <= brgyPage + 1)
                        ) {
                          return (
                            <button
                              key={pg}
                              onClick={() => setBrgyPage(pg)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                brgyPage === pg
                                  ? "bg-[#0A6B43] text-white shadow-xs"
                                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              {pg}
                            </button>
                          );
                        } else if (pg === brgyPage - 2 || pg === brgyPage + 2) {
                          return <span key={pg} className="px-1 text-slate-400 font-bold">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setBrgyPage(prev => Math.min(totalBrgyPages, prev + 1))}
                      disabled={brgyPage === totalBrgyPages}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: TESDA DIRECTORY & RECORDS */}
          {/* ============================================================ */}
          {activeTab === "tesda_records" && (
            <div className="space-y-5">
              
              {/* Header and Action */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search by TESDA Representative name or official email..."
                    value={tesdaSearch}
                    onChange={(e) => setTesdaSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <button
                  onClick={() => {
                    setActiveTab("create_tesda");
                    setRole("TESDA Representative");
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" /> Provision New Representative
                </button>
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">TESDA Municipal Representatives</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Authorized technical and vocational training coordinators assigned to the municipality</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {filteredTesdaReps.length} Representative(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                        <th className="p-4 pl-6">Representative Name</th>
                        <th className="p-4">Official Email</th>
                        <th className="p-4">Assigned Role</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center">Date Created</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {filteredTesdaReps.length > 0 ? (
                        filteredTesdaReps.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 pl-6 font-bold text-slate-900 text-sm">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-xs uppercase">
                                  {item.name.charAt(0)}
                                </div>
                                <span>{item.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-[#0A6B43] font-mono text-xs">{item.email}</td>
                            <td className="p-4 text-slate-700">{item.role}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-amber-50 text-amber-800 border border-amber-200"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4 text-center text-slate-500">{item.dateCreated}</td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Suggestion 2: Reset Password */}
                                <button
                                  onClick={() => handleResetPassword({ id: item.id, name: item.name, email: item.email, role: "TESDA Representative" })}
                                  disabled={updatingUserId === item.id}
                                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Reset Password to Temporary"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>

                                {/* Suggestion 3: Toggle Status */}
                                <button
                                  onClick={() => handleToggleStatus({ id: item.id, name: item.name, status: item.status })}
                                  disabled={updatingUserId === item.id}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title={item.status === "Active" ? "Suspend Account" : "Reactivate Account"}
                                >
                                  {item.status === "Active" ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                                </button>

                                <button
                                  onClick={() => setDeleteAccountTarget({ id: item.id, name: item.name, role: "TESDA Representative" })}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                            No TESDA Representatives registered matching search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB: SYSTEM-WIDE AUDIT LOGS & ACTIVITY (Suggestion 4) */}
          {/* ============================================================ */}
          {activeTab === "audit_logs" && (
            <div className="space-y-5">
              
              {/* Filter controls */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search logs by actor, action description, or barangay..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) => setAuditCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="All">All Event Categories ({auditLogs.length})</option>
                    <option value="User Provisioning">User Provisioning</option>
                    <option value="Youth Registration">Youth Registration</option>
                    <option value="Referral & Enrollment">Referral & Enrollment</option>
                    <option value="Program Update">Program Updates</option>
                    <option value="Announcement">Announcements</option>
                  </select>
                </div>
              </div>

              {/* Logs Stream Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-[#0A6B43]" />
                      Municipal Activity Stream & Audit Trail
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Chronological record of account provisions, youth registrations, and program referrals</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {auditLogs.length} Log Entries
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {paginatedAuditLogs.length > 0 ? (
                    paginatedAuditLogs.map((log) => (
                      <div key={log.id} className="p-4 px-6 hover:bg-slate-50/80 transition-colors flex items-start gap-3.5">
                        <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                          log.category === "User Provisioning" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          log.category === "Youth Registration" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          log.category === "Referral & Enrollment" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {log.category === "User Provisioning" && <Key className="w-4 h-4" />}
                          {log.category === "Youth Registration" && <Users className="w-4 h-4" />}
                          {log.category === "Referral & Enrollment" && <Award className="w-4 h-4" />}
                          {log.category === "Program Update" && <Briefcase className="w-4 h-4" />}
                          {log.category === "Announcement" && <Bell className="w-4 h-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <p className="text-xs font-extrabold text-slate-900">{log.action}</p>
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {log.timestamp}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-600">
                            <span className="font-medium">{log.target}</span>
                            {log.barangay && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md">
                                {log.barangay}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">by {log.actor}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      No audit events recorded for current filters.
                    </div>
                  )}
                </div>

                {/* Pagination Controls for Audit Logs (Limit 10 per page) */}
                {auditLogs.length > 0 && (
                  <div className="p-4 px-6 bg-slate-50/80 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      Showing <strong>{((auditPage - 1) * AUDIT_PER_PAGE) + 1}</strong> to <strong>{Math.min(auditPage * AUDIT_PER_PAGE, auditLogs.length)}</strong> of <strong>{auditLogs.length}</strong> log entries
                    </span>

                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                        disabled={auditPage === 1}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((pg) => {
                          if (
                            pg === 1 || 
                            pg === totalAuditPages || 
                            (pg >= auditPage - 1 && pg <= auditPage + 1)
                          ) {
                            return (
                              <button
                                key={pg}
                                onClick={() => setAuditPage(pg)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  auditPage === pg
                                    ? "bg-[#0A6B43] text-white shadow-xs"
                                    : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {pg}
                              </button>
                            );
                          } else if (pg === auditPage - 2 || pg === auditPage + 2) {
                            return <span key={pg} className="px-1 text-slate-400 font-bold">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setAuditPage(prev => Math.min(totalAuditPages, prev + 1))}
                        disabled={auditPage === totalAuditPages}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 cursor-pointer"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: CREATE OFFICIAL ACCOUNT FORM */}
          {/* ============================================================ */}
          {activeTab === "create_account" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Provision Barangay Leader Account</h3>
                      <p className="text-xs text-slate-500 font-medium">Create verified access credentials for SK Chairpersons and Barangay Captains across 17 Barangays</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    OAuth 2.0 Node
                  </span>
                </div>

                <form onSubmit={handleCreateAccountSubmit} className="p-6 md:p-8 space-y-6 text-xs font-semibold">
                  
                  {/* Section 1: Official Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      1. Official Credentials & Name
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Authorized Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Captain Danilo Santos"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Official Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. danilosantos.captain@sanluispampanga.gov.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Role & Barangay */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      2. Role & Territorial Zone Assignment (17 Barangays)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Assigned Official Role</label>
                        <select
                          value={role}
                          onChange={handleRoleChange}
                          className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="SK Chairperson">SK Chairperson</option>
                          <option value="Barangay Captain">Barangay Captain</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Barangay Assignment</label>
                        <select
                          value={barangayAssignment}
                          onChange={(e) => setBarangayAssignment(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                        >
                          {barangays.map(b => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Generated Password */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      3. Temporary Security Node
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Temporary Generated Password</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 text-[#0A6B43] font-mono font-bold rounded-xl tracking-wider focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden pr-20"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Generate New Password"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">The official will be prompted to update this password upon initial sign in.</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-[#0A6B43] to-[#075332] hover:from-[#075332] hover:to-[#053F26] text-white text-xs font-black rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Provision Account & Generate Credentials
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: CREATE TESDA REPRESENTATIVE FORM */}
          {/* ============================================================ */}
          {activeTab === "create_tesda" && (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
                
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Provision TESDA Partner Representative</h3>
                      <p className="text-xs text-slate-500 font-medium">Create verified access credentials for TVET technical training officers</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Municipal Partner
                  </span>
                </div>

                <form onSubmit={handleCreateTesdaSubmit} className="p-6 md:p-8 space-y-6 text-xs font-semibold">
                  
                  {/* Section 1: Partner Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      1. Representative Profile & Contact
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Authorized Full Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Evelyn Castor"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Official Email Address</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. evelyn.castor@tesda.gov.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Scope Assignment */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      2. Role & Jurisdiction
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Assigned Official Role</label>
                        <input
                          type="text"
                          readOnly
                          value="TESDA Representative"
                          className="w-full p-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed outline-hidden"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase">Jurisdiction Scope</label>
                        <input
                          type="text"
                          readOnly
                          value="Municipal-wide (All 17 San Luis Barangays)"
                          className="w-full p-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl cursor-not-allowed outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Generated Password */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                      3. Temporary Security Node
                    </h4>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Temporary Generated Password</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={tempPassword}
                          onChange={(e) => setTempPassword(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 text-[#0A6B43] font-mono font-bold rounded-xl tracking-wider focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden pr-20"
                        />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="absolute right-2.5 top-2.5 px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Generate New Password"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Provision TESDA Account & Generate Credentials
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================ */}
      {/* YOUTH PROFILE DETAIL MODAL (Suggestion 1) */}
      {/* ============================================================ */}
      {selectedYouthDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col text-xs font-semibold shadow-2xl">
            
            <div className="p-5 px-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-sm border border-emerald-200">
                  {selectedYouthDetail.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">{selectedYouthDetail.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">Barangay {selectedYouthDetail.barangay.replace(/^Barangay\s+/i, "")} · {selectedYouthDetail.purok}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedYouthDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-700">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Age</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedYouthDetail.age} years old</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Livelihood Status</span>
                  <span className="font-bold text-[#0A6B43] text-sm">{selectedYouthDetail.currentStatus}</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Education</span>
                  <span className="font-bold text-slate-900 text-xs">{selectedYouthDetail.educationalAttainment}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Declared Livelihood Goal</span>
                <p className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-slate-900 font-medium text-xs leading-relaxed">
                  "{selectedYouthDetail.livelihoodGoal || "Seeking technical-vocational training and local employment opportunities."}"
                </p>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Competencies & Skills</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedYouthDetail.skills && selectedYouthDetail.skills.length > 0 ? (
                    selectedYouthDetail.skills.map((s: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-800 text-xs font-bold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No skills listed yet</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-2">Areas of Interest</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedYouthDetail.interests && selectedYouthDetail.interests.length > 0 ? (
                    selectedYouthDetail.interests.map((it: string, idx: number) => (
                      <span key={idx} className="bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {it}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">No interests listed</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">Special Demographics</span>
                <div className="flex gap-2">
                  {selectedYouthDetail.soloParent && <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-xs font-bold">Solo Parent</span>}
                  {selectedYouthDetail.pwd && <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full text-xs font-bold">Person with Disability</span>}
                  {selectedYouthDetail.indigenous && <span className="bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full text-xs font-bold">Indigenous Youth</span>}
                  {!selectedYouthDetail.soloParent && !selectedYouthDetail.pwd && !selectedYouthDetail.indigenous && (
                    <span className="text-slate-400 italic">General Youth Demographic</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedYouthDetail(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* VIEW BARANGAY DETAILS MODAL */}
      {/* ============================================================ */}
      {isViewModalOpen && selectedBrgyDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl overflow-hidden max-h-[88vh] flex flex-col text-xs font-semibold shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-5 px-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black text-[#0A6B43] uppercase tracking-wider block">Administrative Roster</span>
                <h3 className="text-base font-black text-slate-900">Barangay {selectedBrgyDetails.name} Zone Summary</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Leaders summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">SK Chairperson</span>
                    <p className="font-extrabold text-sm text-slate-900 mt-1">{selectedBrgyDetails.sk.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{selectedBrgyDetails.sk.email}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedBrgyDetails.sk.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"
                    }`}>
                      {selectedBrgyDetails.sk.status}
                    </span>
                    {selectedBrgyDetails.sk.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.sk.id!, name: selectedBrgyDetails.sk.name, role: "SK Chairperson" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/90 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Barangay Captain</span>
                    <p className="font-extrabold text-sm text-slate-900 mt-1">{selectedBrgyDetails.cap.name}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{selectedBrgyDetails.cap.email}</p>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200">
                    <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      selectedBrgyDetails.cap.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"
                    }`}>
                      {selectedBrgyDetails.cap.status}
                    </span>
                    {selectedBrgyDetails.cap.id && (
                      <button
                        onClick={() => {
                          setDeleteAccountTarget({ id: selectedBrgyDetails.cap.id!, name: selectedBrgyDetails.cap.name, role: "Barangay Captain" });
                          setIsViewModalOpen(false);
                        }}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 text-[11px] font-bold hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete Account
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Councilors Table */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0A6B43]" />
                  SK Councilors Roster ({selectedBrgyDetails.councilors.length})
                </h4>
                {selectedBrgyDetails.councilors.length > 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">
                          <th className="p-3 pl-4">Councilor Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right pr-4">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedBrgyDetails.councilors.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-bold text-slate-900">{c.name}</td>
                            <td className="p-3 text-slate-500">{c.email}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-block text-[9px] font-bold uppercase px-2 py-0.2 rounded-full ${
                                c.status === "Active" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-slate-100 text-slate-500"
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 text-right pr-4 text-slate-400 font-medium">{c.dateCreated}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-6 text-center rounded-xl text-slate-400">
                    No councilors registered for this barangay yet.
                  </div>
                )}
              </div>

              {/* KK Members list */}
              <div>
                <h4 className="text-xs font-extrabold uppercase text-slate-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                  Registered KK Youth Residents ({selectedBrgyDetails.youth.length})
                </h4>
                {selectedBrgyDetails.youth.length > 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-extrabold sticky top-0">
                          <th className="p-3 pl-4">Member Name</th>
                          <th className="p-3">Age</th>
                          <th className="p-3">Purok</th>
                          <th className="p-3 pr-4">Attainment / Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedBrgyDetails.youth.map((y, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 pl-4 font-bold text-slate-900">{y.name}</td>
                            <td className="p-3 text-slate-500">{y.age} y/o</td>
                            <td className="p-3 text-slate-500">{y.purok}</td>
                            <td className="p-3 pr-4 text-slate-600 font-medium">{y.educationalAttainment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-6 text-center rounded-xl text-slate-400">
                    No KK youth registered for this barangay yet.
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden text-xs font-semibold shadow-2xl">
            
            <div className="p-5 px-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase">Rename Barangay Zone</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrgyName} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase">Administrative Barangay Name</label>
                <input
                  type="text"
                  required
                  value={editBrgyName}
                  onChange={(e) => setEditBrgyName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-emerald-200 rounded-3xl w-full max-w-md p-6 text-center space-y-5 shadow-2xl relative">
            
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center mx-auto mb-1 shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                {createdCredentials.isReset ? "Password Reset Successfully!" : "Account Provisioned Successfully!"}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {createdCredentials.isReset ? "New temporary password initialized in database" : "Official access credentials have been initialized in database"}
              </p>
            </div>
            
            <div className="text-left bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs text-slate-700 font-medium">
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Assigned Official Name</strong> <span className="text-slate-900 font-bold">{createdCredentials.name}</span></p>
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Provisioned Role</strong> <span className="text-[#0A6B43] font-bold">{createdCredentials.role}</span></p>
              {createdCredentials.barangay && (
                <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Barangay Zone</strong> <span className="text-slate-900 font-bold">{createdCredentials.barangay}</span></p>
              )}
              <div className="h-px bg-slate-200 my-2" />
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Registered Email</strong> <span className="text-blue-700 font-mono text-[11px] font-bold">{createdCredentials.email}</span></p>
              <p><strong className="text-slate-400 uppercase text-[9px] tracking-wider block">Temporary Password</strong> <span className="text-amber-700 font-mono text-sm font-bold tracking-wider">{createdCredentials.pass}</span></p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
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
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
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

    </div>
  );
};
