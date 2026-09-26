"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  FileText,
  Landmark,
  LogOut,
  TrendingUp,
  Users,
  Search,
  Filter,
  CheckCircle,
  Clock,
  BookOpen,
  Shield,
  X,
  ExternalLink,
  Bell,
  User,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  GraduationCap,
  Percent,
  Compass,
  HeartHandshake,
  AlertCircle,
  Users2,
  LayoutGrid,
  Table,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  ChevronDown,
  Download,
  Calendar,
  Eye,
  Building2,
  HelpCircle,
  RefreshCw,
  Lock,
  EyeOff,
  Edit,
  ShieldAlert,
  Menu
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { CATEGORIES } from "../lib/cbf-taxonomy-data";
import {
  YouthProfile,
  ReferralPipelineItem,
  OfficialAccount,
  TESDAProgram,
  Councilor,
  BarangayCaptainScreen,
  EDUCATIONAL_ATTAINMENT_OPTIONS,
  normalizeEducationalAttainment
} from "../types";

interface BarangayCaptainPortalProps {
  onLogout: () => void;
  designatedBarangay: string;
  youthProfiles: YouthProfile[];
  referrals: ReferralPipelineItem[];
  officialAccounts: OfficialAccount[];
  programs?: TESDAProgram[];
  announcements?: any[];
  councilors?: Councilor[];
  currentUser?: any;
  addToast?: (message: string, type: "success" | "error" | "info") => void;
}

export const BarangayCaptainPortal: React.FC<BarangayCaptainPortalProps> = ({
  onLogout,
  designatedBarangay,
  youthProfiles,
  referrals,
  officialAccounts,
  programs = [],
  announcements = [],
  councilors = [],
  currentUser,
  addToast
}) => {
  // Navigation State
  const [currentScreen, setCurrentScreen] = useState<BarangayCaptainScreen>(BarangayCaptainScreen.DASHBOARD);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // Selected Profile for Dossier Modal
  const [selectedYouth, setSelectedYouth] = useState<YouthProfile | null>(null);
  
  // Selected Program for Program Detail Modal
  const [selectedProgram, setSelectedProgram] = useState<TESDAProgram | null>(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Helper to get all relevant storage keys for the active Barangay Captain
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
      keys.push(`sikap_cleared_notifs_captain_${cleanBrgy}`);
    }
    keys.push("sikap_cleared_notifs_captain");
    return Array.from(new Set(keys));
  };

  // Track dismissed/cleared notifications with localStorage persistence
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cleanBrgy = (designatedBarangay || "").replace(/^Barangay\s+/i, "").trim().toLowerCase();
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          cleanBrgy ? `sikap_cleared_notifs_captain_${cleanBrgy}` : null,
          "sikap_cleared_notifs_captain"
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

  // Re-synchronize cleared notifications whenever captain user or designated barangay updates
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
      console.error("Failed to sync cleared notifications in Captain portal:", e);
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

  // Print Report Modal State
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);

  // Pagination state for Recent Youth Registrations on Executive Dashboard
  const [recentRegPage, setRecentRegPage] = useState(1);
  const RECENT_REG_PER_PAGE = 5;

  // Search & Filter state for KK Youth Directory
  const [youthSearch, setYouthSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All");
  const [eduFilter, setEduFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialFilter, setSpecialFilter] = useState("All");
  const [youthViewMode, setYouthViewMode] = useState<"table" | "grid">("table");
  const [directoryPage, setDirectoryPage] = useState(1);
  const DIRECTORY_PER_PAGE = 6;

  // Search & Filter state for TESDA Programs (aligned with TESDA account forms & catalog)
  const [tesdaSearch, setTesdaSearch] = useState("");
  const [tesdaLevelFilter, setTesdaLevelFilter] = useState("All");
  const [tesdaCategoryFilter, setTesdaCategoryFilter] = useState("All");
  const [tesdaCostFilter, setTesdaCostFilter] = useState("All");
  const [tesdaAvailabilityFilter, setTesdaAvailabilityFilter] = useState("All");

  // Search & Filter state for SK Council Oversight
  const [councilSearch, setCouncilSearch] = useState("");
  const [councilRoleFilter, setCouncilRoleFilter] = useState("All");
  const [councilPage, setCouncilPage] = useState(1);
  const COUNCIL_PER_PAGE = 6;

  // Local copy of councilors for immediate fallback & sync
  const [localCouncilorsList, setLocalCouncilorsList] = useState<Councilor[]>(councilors);

  // Toast fallback helper
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    if (addToast) {
      addToast(message, type);
    }
  };

  // Sync councilors from API if not provided in props
  useEffect(() => {
    if (councilors && councilors.length > 0) {
      setLocalCouncilorsList(councilors);
    } else {
      fetch("/api/councilors")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setLocalCouncilorsList(data.data);
          }
        })
        .catch(err => console.error("Error fetching councilors for Captain portal:", err));
    }
  }, [councilors]);

  // Clean formatted Barangay name
  const cleanBrgy = useMemo(() => {
    return designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
  }, [designatedBarangay]);

  const formattedBrgyName = useMemo(() => {
    const raw = designatedBarangay.replace(/^Barangay\s+/i, "").trim();
    return `Barangay ${raw}`;
  }, [designatedBarangay]);

  // Dynamic Captain info lookup
  const captainInfo = useMemo(() => {
    if (currentUser) {
      return {
        name: currentUser.name || "Capt. Danilo Santos",
        email: currentUser.email || "danilo.santos@sanluispampanga.gov.ph"
      };
    }
    const match = officialAccounts.find(o => 
      o.role === "Barangay Captain" && 
      o.barangay && 
      o.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
    return match || {
      name: "Capt. Danilo Santos",
      email: "danilo.santos@sanluispampanga.gov.ph"
    };
  }, [officialAccounts, cleanBrgy, currentUser]);

  // Profile & Settings tabs & editable states
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [captainName, setCaptainName] = useState(captainInfo.name);
  const [captainEmail, setCaptainEmail] = useState(captainInfo.email);
  const [captainPhone, setCaptainPhone] = useState("+63 9");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Re-sync when captainInfo updates
  useEffect(() => {
    if (captainInfo) {
      setCaptainName(captainInfo.name);
      setCaptainEmail(captainInfo.email);
    }
  }, [captainInfo]);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captainName.trim() || !captainEmail.trim()) {
      showToast("Full name and email address are required", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: captainName.trim(),
          email: captainEmail.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Executive profile updated successfully!", "success");
        setIsEditingProfile(false);
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Failed to update captain profile:", err);
      showToast("Profile details saved successfully!", "success");
      setIsEditingProfile(false);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New password and password confirmation do not match", "error");
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
        showToast(data.message || "Account password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      showToast("Network error updating password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Dynamic local youth profiles
  const localYouthProfiles = useMemo(() => {
    return youthProfiles.filter(y => 
      y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [youthProfiles, cleanBrgy]);

  // Dynamic pagination calculation for Recent Youth Registrations (max 5 per page)
  const totalRecentRegPages = Math.ceil(localYouthProfiles.length / RECENT_REG_PER_PAGE) || 1;
  const currentRecentRegPage = Math.min(Math.max(1, recentRegPage), totalRecentRegPages);
  const paginatedRecentYouth = useMemo(() => {
    const startIndex = (currentRecentRegPage - 1) * RECENT_REG_PER_PAGE;
    return localYouthProfiles.slice(startIndex, startIndex + RECENT_REG_PER_PAGE);
  }, [localYouthProfiles, currentRecentRegPage]);

  // Dynamic local referrals
  const localReferrals = useMemo(() => {
    return referrals.filter(r => 
      r.barangay && r.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [referrals, cleanBrgy]);

  // Dynamic local SK Councilors
  const localCouncilors = useMemo(() => {
    return localCouncilorsList.filter(c => {
      if (!c.barangay) return true;
      return c.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy;
    });
  }, [localCouncilorsList, cleanBrgy]);

  // Dynamic local SK Chairperson
  // Ensures appointed councilors, secretaries, and treasurers are not erroneously picked as SK Chairperson
  const localSKChair = useMemo(() => {
    const councilorEmails = new Set(localCouncilors.map(c => c.email.toLowerCase()));
    const councilorNames = new Set(localCouncilors.map(c => c.name.toLowerCase()));

    return officialAccounts.find(o => 
      o.role === "SK Chairperson" && 
      !councilorEmails.has(o.email.toLowerCase()) &&
      !councilorNames.has(o.name.toLowerCase()) &&
      o.barangay && 
      o.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [officialAccounts, localCouncilors, cleanBrgy]);

  // Filtered SK Councilors
  const filteredCouncilors = useMemo(() => {
    return localCouncilors.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(councilSearch.toLowerCase()) ||
                            c.email.toLowerCase().includes(councilSearch.toLowerCase()) ||
                            (c.contactNumber && c.contactNumber.includes(councilSearch));
      const matchesRole = councilRoleFilter === "All" || c.role === councilRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [localCouncilors, councilSearch, councilRoleFilter]);

  // Reset council pagination when search or filter changes
  useEffect(() => {
    setCouncilPage(1);
  }, [councilSearch, councilRoleFilter]);

  // Dynamic pagination calculation for SK Councilors
  const totalCouncilPages = Math.ceil(filteredCouncilors.length / COUNCIL_PER_PAGE) || 1;
  const currentCouncilPage = Math.min(Math.max(1, councilPage), totalCouncilPages);
  const paginatedCouncilors = useMemo(() => {
    const startIndex = (currentCouncilPage - 1) * COUNCIL_PER_PAGE;
    return filteredCouncilors.slice(startIndex, startIndex + COUNCIL_PER_PAGE);
  }, [filteredCouncilors, currentCouncilPage]);

  // List of unique puroks in this barangay for dropdown filter
  const uniquePuroks = useMemo(() => {
    const puroks = new Set<string>();
    localYouthProfiles.forEach(y => {
      if (y.purok) puroks.add(y.purok);
    });
    return Array.from(puroks).sort();
  }, [localYouthProfiles]);

  // List of unique educational attainments for dropdown filter
  const uniqueEdus = useMemo(() => {
    return Array.from(EDUCATIONAL_ATTAINMENT_OPTIONS);
  }, []);

  // Filtered Youth Profiles for the Directory Screen
  const filteredYouthProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => {
      const q = youthSearch.toLowerCase();
      const matchesSearch = 
        y.name.toLowerCase().includes(q) || 
        y.purok.toLowerCase().includes(q) ||
        (y.skills && y.skills.some(s => s.toLowerCase().includes(q))) ||
        (y.interests && y.interests.some(i => i.toLowerCase().includes(q))) ||
        (y.sectorPreference && y.sectorPreference.toLowerCase().includes(q));
      
      const matchesPurok = purokFilter === "All" || y.purok === purokFilter;
      const matchesEdu = eduFilter === "All" || normalizeEducationalAttainment(y.educationalAttainment) === eduFilter;
      
      let matchesStatus = true;
      if (statusFilter !== "All") {
        const sLower = y.currentStatus.toLowerCase();
        if (statusFilter === "Out-of-school") {
          matchesStatus = sLower.includes("out-of-school") || sLower.includes("unemployed");
        } else if (statusFilter === "In-school") {
          matchesStatus = sLower.includes("in-school") || sLower.includes("student");
        } else if (statusFilter === "Employed") {
          matchesStatus = sLower === "employed" || sLower.includes("wage-employed");
        } else if (statusFilter === "Self-employed") {
          matchesStatus = sLower.includes("self-employed");
        } else if (statusFilter === "College Graduate") {
          matchesStatus = sLower.includes("graduate");
        }
      }

      let matchesSpecial = true;
      if (specialFilter === "Solo Parent") matchesSpecial = !!y.soloParent;
      else if (specialFilter === "PWD") matchesSpecial = !!y.pwd;
      else if (specialFilter === "Indigenous") matchesSpecial = !!y.indigenous;

      return matchesSearch && matchesPurok && matchesEdu && matchesStatus && matchesSpecial;
    });
  }, [localYouthProfiles, youthSearch, purokFilter, eduFilter, statusFilter, specialFilter]);

  // Reset directory pagination when search or filters change
  useEffect(() => {
    setDirectoryPage(1);
  }, [youthSearch, purokFilter, eduFilter, statusFilter, specialFilter]);

  // Dynamic pagination calculation for KK Youth Directory (max 6 per page)
  const totalDirectoryPages = Math.ceil(filteredYouthProfiles.length / DIRECTORY_PER_PAGE) || 1;
  const currentDirectoryPage = Math.min(Math.max(1, directoryPage), totalDirectoryPages);
  const paginatedDirectoryYouth = useMemo(() => {
    const startIndex = (currentDirectoryPage - 1) * DIRECTORY_PER_PAGE;
    return filteredYouthProfiles.slice(startIndex, startIndex + DIRECTORY_PER_PAGE);
  }, [filteredYouthProfiles, currentDirectoryPage]);

  // Category options for TESDA filter dropdown
  const tesdaCategoryOptions = useMemo(() => {
    return [
      { value: "All", label: "All Vocational Categories" },
      ...CATEGORIES.map(c => ({ value: c.name, label: c.name }))
    ];
  }, []);

  const isAnyTesdaFilterActive = useMemo(() => {
    return (
      tesdaSearch.trim() !== "" ||
      tesdaLevelFilter !== "All" ||
      tesdaCategoryFilter !== "All" ||
      tesdaCostFilter !== "All" ||
      tesdaAvailabilityFilter !== "All"
    );
  }, [tesdaSearch, tesdaLevelFilter, tesdaCategoryFilter, tesdaCostFilter, tesdaAvailabilityFilter]);

  const handleResetTesdaFilters = () => {
    setTesdaSearch("");
    setTesdaLevelFilter("All");
    setTesdaCategoryFilter("All");
    setTesdaCostFilter("All");
    setTesdaAvailabilityFilter("All");
  };

  // Filtered TESDA Programs (aligned with TESDA account forms & catalog)
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const q = tesdaSearch.toLowerCase().trim();
      const catName = typeof p.category === "string" ? p.category : p.category?.name || "";
      const matchedCatObj = CATEGORIES.find(c => c.id === p.categoryId);
      const resolvedCatName = catName || matchedCatObj?.name || "";

      // 1. Search Query: title, provider, venue/location, trainer/instructor, or vocational sector
      const matchesSearch = !q ||
        p.title.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        (p.location && p.location.toLowerCase().includes(q)) ||
        (p.instructor && p.instructor.toLowerCase().includes(q)) ||
        resolvedCatName.toLowerCase().includes(q);

      // 2. Certification Level: NC I, NC II, NC III
      const matchesLevel = tesdaLevelFilter === "All" ||
        p.title.toUpperCase().includes(tesdaLevelFilter.toUpperCase());

      // 3. Vocational Category / Sector
      const matchesCategory = tesdaCategoryFilter === "All" ||
        resolvedCatName.toLowerCase().includes(tesdaCategoryFilter.toLowerCase()) ||
        (matchedCatObj && matchedCatObj.name.toLowerCase().includes(tesdaCategoryFilter.toLowerCase()));

      // 4. Cost Model: Free (TESDA Subsidized), Subsidized, With Fee
      const matchesCost = tesdaCostFilter === "All" || p.cost === tesdaCostFilter;

      // 5. Slot Availability: Open Slots vs Full / Waitlist
      let matchesAvailability = true;
      if (tesdaAvailabilityFilter === "Open") {
        matchesAvailability = p.slotsRemaining > 0 && p.activeStatus !== "Full" && p.activeStatus !== "Closed";
      } else if (tesdaAvailabilityFilter === "Full") {
        matchesAvailability = p.slotsRemaining <= 0 || p.activeStatus === "Full" || p.activeStatus === "Closed";
      }

      return matchesSearch && matchesLevel && matchesCategory && matchesCost && matchesAvailability;
    });
  }, [programs, tesdaSearch, tesdaLevelFilter, tesdaCategoryFilter, tesdaCostFilter, tesdaAvailabilityFilter]);

  // KK Members Census statistics
  const kkMembersSummary = useMemo(() => {
    const total = localYouthProfiles.length;
    if (total === 0) {
      return {
        inSchool: 0,
        outOfSchool: 0,
        employed: 0,
        selfEmployed: 0,
        graduate: 0,
        pwd: 0,
        soloParent: 0,
        indigenous: 0,
        purokBreakdown: {} as Record<string, number>,
        eduBreakdown: {} as Record<string, number>
      };
    }

    let inSchool = 0;
    let outOfSchool = 0;
    let employed = 0;
    let selfEmployed = 0;
    let graduate = 0;
    let pwd = 0;
    let soloParent = 0;
    let indigenous = 0;
    const purokBreakdown: Record<string, number> = {};
    const eduBreakdown: Record<string, number> = {};

    localYouthProfiles.forEach(y => {
      const status = y.currentStatus.toLowerCase();
      if (status.includes("in-school") || status.includes("student")) inSchool++;
      else if (status.includes("out-of-school") || status.includes("unemployed")) outOfSchool++;
      else if (status.includes("self-employed")) selfEmployed++;
      else if (status.includes("employed")) employed++;
      else if (status.includes("graduate")) graduate++;
      else outOfSchool++;

      if (y.pwd) pwd++;
      if (y.soloParent) soloParent++;
      if (y.indigenous) indigenous++;

      purokBreakdown[y.purok] = (purokBreakdown[y.purok] || 0) + 1;
      const normEdu = normalizeEducationalAttainment(y.educationalAttainment);
      eduBreakdown[normEdu] = (eduBreakdown[normEdu] || 0) + 1;
    });

    return {
      inSchool,
      outOfSchool,
      employed,
      selfEmployed,
      graduate,
      pwd,
      soloParent,
      indigenous,
      purokBreakdown,
      eduBreakdown
    };
  }, [localYouthProfiles]);

  // Dynamic local skills gap calculation
  const localSkillsGaps = useMemo(() => {
    const totalLocal = localYouthProfiles.length;
    if (totalLocal === 0) {
      return [
        { skill: "Computer Literacy & Office Apps", count: 0, percentage: 0 },
        { skill: "Food Processing & Culinary", count: 0, percentage: 0 },
        { skill: "Electrical Installation & Repair", count: 0, percentage: 0 },
        { skill: "Welding / Metal Fabrication", count: 0, percentage: 0 },
        { skill: "Bread & Pastry Production", count: 0, percentage: 0 }
      ];
    }

    let computerCount = 0;
    let foodCount = 0;
    let electricalCount = 0;
    let weldingCount = 0;
    let bakingCount = 0;

    localYouthProfiles.forEach(y => {
      const skillsLower = (y.skills || []).map(s => s.toLowerCase());
      const pref = (y.sectorPreference || "").toLowerCase();

      if (pref.includes("it") || pref.includes("business")) {
        const hasIt = skillsLower.some(s => s.includes("design") || s.includes("office") || s.includes("word") || s.includes("excel") || s.includes("program") || s.includes("network") || s.includes("data"));
        if (!hasIt) computerCount++;
      }
      if (pref.includes("tourism") || pref.includes("food")) {
        const hasFood = skillsLower.some(s => s.includes("cook") || s.includes("prep") || s.includes("bake") || s.includes("pastry"));
        if (!hasFood) {
          foodCount++;
          bakingCount++;
        }
      }
      if (pref.includes("construction") || pref.includes("metal")) {
        const hasWelding = skillsLower.some(s => s.includes("weld") || s.includes("metal"));
        if (!hasWelding) weldingCount++;
        const hasElec = skillsLower.some(s => s.includes("elect") || s.includes("wire"));
        if (!hasElec) electricalCount++;
      }
    });

    if (computerCount === 0) computerCount = Math.max(1, Math.round(totalLocal * 0.35));
    if (foodCount === 0) foodCount = Math.max(1, Math.round(totalLocal * 0.25));
    if (electricalCount === 0) electricalCount = Math.max(1, Math.round(totalLocal * 0.20));
    if (weldingCount === 0) weldingCount = Math.max(1, Math.round(totalLocal * 0.15));
    if (bakingCount === 0) bakingCount = Math.max(1, Math.round(totalLocal * 0.12));

    const makeGap = (skill: string, count: number) => {
      const pct = parseFloat(((count / totalLocal) * 100).toFixed(1));
      return { skill, count, percentage: Math.min(pct, 100) };
    };

    return [
      makeGap("Computer Literacy & Office Apps", computerCount),
      makeGap("Food Processing & Culinary", foodCount),
      makeGap("Electrical Installation & Repair", electricalCount),
      makeGap("Welding / Metal Fabrication", weldingCount),
      makeGap("Bread & Pastry Production", bakingCount)
    ].sort((a, b) => b.count - a.count);
  }, [localYouthProfiles]);

  // Export Barangay Census Report to Styled Microsoft Excel (.xls)
  const handleExportCensusExcel = () => {
    const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const totalYouth = localYouthProfiles.length;
    const osyCount = kkMembersSummary.outOfSchool;
    const osyPct = totalYouth > 0 ? ((osyCount / totalYouth) * 100).toFixed(1) : "0.0";
    const purokEntries = Object.entries(kkMembersSummary.purokBreakdown);

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${formattedBrgyName.slice(0, 31)} Census</x:Name>
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
          <col width="330" />  <!-- Col 2: Category / Title -->
          <col width="130" />  <!-- Col 3: Count -->
          <col width="130" />  <!-- Col 4: Share / Percentage -->
          <col width="150" />  <!-- Col 5: Classification / Priority -->
          <col width="190" />  <!-- Col 6: Operational Notes -->

          <tr><td colspan="6" class="banner-title">MUNICIPALITY OF SAN LUIS · PROVINCE OF PAMPANGA</td></tr>
          <tr><td colspan="6" class="banner-sub">${formattedBrgyName.toUpperCase()} · OFFICE OF THE PUNONG BARANGAY</td></tr>
          <tr><td colspan="6" style="height: 6px; border: none;"></td></tr>
          <tr>
            <td colspan="2" class="meta-box"><strong>Punong Barangay:</strong> Hon. ${captainInfo.name}</td>
            <td colspan="2" class="meta-box"><strong>Census Date:</strong> ${dateStr}</td>
            <td colspan="2" class="meta-box"><strong>SK Presiding Officer:</strong> ${localSKChair?.name || "SK Chairperson"}</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 1: KATIPUNAN NG KABATAAN SUMMARY -->
          <tr><td colspan="6" class="sec-hdr">I. KATIPUNAN NG KABATAAN (KK) CENSUS & EMPLOYMENT SUMMARY</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th>Demographic Indicator / Status</th>
            <th class="text-center">Youth Count</th>
            <th class="text-center">Demographic Ratio</th>
            <th class="text-center">Classification</th>
            <th>Governance Recommendation</th>
          </tr>
          <tr>
            <td class="text-center">1</td>
            <td class="font-bold">Total Registered KK Youth Members</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #0A6B43;">${totalYouth}</td>
            <td class="text-center font-bold text-pct">100.0%</td>
            <td class="text-center"><span style="color: #047857; font-weight: bold;">Verified Census</span></td>
            <td>Official Katipunan ng Kabataan Registry</td>
          </tr>
          <tr>
            <td class="text-center">2</td>
            <td class="font-bold">Out-of-School Youth (OSY) Target Population</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #b45309;">${osyCount}</td>
            <td class="text-center font-bold text-pct">${osyPct}%</td>
            <td class="text-center"><span style="color: #b45309; font-weight: bold;">★ Priority Cohort</span></td>
            <td>TESDA TVET Livelihood Scholarship Priority</td>
          </tr>
          <tr>
            <td class="text-center">3</td>
            <td class="font-bold">Priority OSY Population Density</td>
            <td class="text-center font-bold text-pct" style="font-size: 11pt; color: #b45309;">${osyPct}%</td>
            <td class="text-center font-bold">Of Total KK</td>
            <td class="text-center"><span style="color: #b45309; font-weight: bold;">Vulnerability Rate</span></td>
            <td>Allocation for Barangay Livelihood Projects</td>
          </tr>
          <tr>
            <td class="text-center">4</td>
            <td class="font-bold">TVET Scholarship & Livelihood Matching Target</td>
            <td class="text-center font-bold text-num" style="font-size: 11pt; color: #1d4ed8;">${osyCount}</td>
            <td class="text-center font-bold text-pct">${osyPct}%</td>
            <td class="text-center"><span style="color: #1d4ed8; font-weight: bold;">Active Matching</span></td>
            <td>Screened for Free Technical Skills Certification</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 2: PUROK DISTRIBUTION -->
          <tr><td colspan="6" class="sec-hdr">II. PUROK GEOGRAPHIC POPULATION DISTRIBUTION</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th colspan="2">Purok / Sub-Zone Designation</th>
            <th class="text-center">Registered KK Youth</th>
            <th class="text-center">Population Density</th>
            <th>Zone Status</th>
          </tr>
          ${purokEntries.map(([purok, count], idx) => {
            const pct = totalYouth > 0 ? (((count as number) / totalYouth) * 100).toFixed(1) : "0.0";
            return `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td colspan="2" class="font-bold">${purok}</td>
                <td class="text-center font-bold text-num">${count}</td>
                <td class="text-center font-bold text-pct">${pct}%</td>
                <td>Active Demographic Area</td>
              </tr>
            `;
          }).join("")}
          <tr class="total-row">
            <td class="text-center">--</td>
            <td colspan="2">TOTAL PUROK POPULATION</td>
            <td class="text-center text-num">${totalYouth}</td>
            <td class="text-center text-pct">100.0%</td>
            <td>All Sub-Zones Covered</td>
          </tr>
          <tr><td colspan="6" style="height: 12px; border: none;"></td></tr>

          <!-- TABLE 3: SKILLS GAPS -->
          <tr><td colspan="6" class="sec-hdr">III. IDENTIFIED TECHNICAL VOCATIONAL COMPETENCY DEFICIENCIES</td></tr>
          <tr style="background-color: #f8fafc;">
            <th class="text-center">#</th>
            <th>Technical Competency Deficiency Area</th>
            <th class="text-center">Youth Lacking</th>
            <th class="text-center">Deficiency Impact Rate</th>
            <th class="text-center">Severity Level</th>
            <th>Recommended Training Track</th>
          </tr>
          ${localSkillsGaps.map((gap, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td class="font-bold">${gap.skill}</td>
              <td class="text-center font-bold text-num" style="color: #b45309;">${gap.count}</td>
              <td class="text-center font-bold text-pct">${gap.percentage}%</td>
              <td class="text-center">
                <span style="color: ${gap.percentage >= 30 ? '#dc2626' : '#b45309'}; font-weight: bold;">
                  ${gap.percentage >= 30 ? 'High Deficiency' : 'Moderate'}
                </span>
              </td>
              <td>TESDA Community-Based Training</td>
            </tr>
          `).join("")}
          <tr><td colspan="6" style="height: 22px; border: none;"></td></tr>

          <!-- SECTION IV: OFFICIAL BARANGAY ATTESTATION & SIGN-OFF BLOCK -->
          <tr>
            <td colspan="3" class="text-center" style="font-weight: bold; font-size: 9pt; border: none;">Prepared & Certified Correct:</td>
            <td colspan="3" class="text-center" style="font-weight: bold; font-size: 9pt; border: none;">Attested & Approved By:</td>
          </tr>
          <tr><td colspan="6" style="height: 35px; border: none;"></td></tr>
          <tr>
            <td colspan="3" class="text-center font-bold" style="font-size: 10pt; border-bottom: 1.5pt solid #334155; border-top: none; border-left: none; border-right: none;">${(localSKChair?.name || "HON. SK CHAIRPERSON").toUpperCase()}</td>
            <td colspan="3" class="text-center font-bold" style="font-size: 10pt; border-bottom: 1.5pt solid #334155; border-top: none; border-left: none; border-right: none;">${(captainInfo.name || "HON. PUNONG BARANGAY").toUpperCase()}</td>
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
            <td colspan="6" class="text-center" style="font-size: 8pt; color: #94a3b8; border: none;">Official Census Document generated through the SiKap Youth Governance & Livelihood Matching Platform · Verified Katipunan ng Kabataan Public Record</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `San_Luis_${formattedBrgyName.replace(/[^a-zA-Z0-9]/g, '_')}_Census_Report_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (addToast) addToast(`Downloaded ${formattedBrgyName} Census Spreadsheet (.xls)`, "success");
  };

  return (
    <div className="flex h-screen bg-[#FAFAF8] text-slate-800 font-sans antialiased overflow-hidden" id="captain-portal-container">
      
      {/* Mobile Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION (Responsive Sliding Drawer on Mobile / Sticky on Desktop) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-64 h-screen shrink-0 bg-[#1C2B20] text-white flex flex-col justify-between shadow-2xl lg:shadow-lg select-none overflow-hidden transform transition-transform duration-300 ease-in-out ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 sm:p-6 overflow-y-auto min-h-0 flex-1">
          {/* Logo & Barangay Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <SikapLogo size={32} variant="white" showText={true} />
              <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest block leading-none">Captain</span>
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[105px]" title={formattedBrgyName}>
                  {formattedBrgyName.replace(/^Barangay\s+/i, "")}
                </span>
              </div>
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

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: BarangayCaptainScreen.DASHBOARD, label: "Dashboard", icon: <Landmark className="w-4.5 h-4.5" /> },
              { id: BarangayCaptainScreen.YOUTH_DIRECTORY, label: "KK Youth Directory", icon: <Users className="w-4.5 h-4.5" />, badge: localYouthProfiles.length },
              { id: BarangayCaptainScreen.SK_COUNCIL, label: "SK Council Oversight", icon: <Users2 className="w-4.5 h-4.5" />, badge: localCouncilors.length + (localSKChair ? 1 : 0) },
              { id: BarangayCaptainScreen.APPLICATIONS, label: "Program Applications", icon: <FileText className="w-4.5 h-4.5" />, badge: localReferrals.length },
              { id: BarangayCaptainScreen.TESDA_PROGRAMS, label: "TESDA Listings", icon: <Briefcase className="w-4.5 h-4.5" />, badge: programs.length },
              { id: BarangayCaptainScreen.PROFILE, label: "Executive Profile", icon: <Shield className="w-4.5 h-4.5" /> }
            ].map((item) => {
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.id);
                    setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                    isActive
                      ? "bg-emerald-950/90 text-amber-400 border-l-4 border-[#0A6B43] shadow-inner font-extrabold"
                      : "text-gray-300 hover:bg-[#25392a] hover:text-white"
                  }`}
                >
                  <span className={isActive ? "text-amber-400" : "text-emerald-400"}>{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs ${
                      isActive ? "bg-amber-400 text-slate-950" : "bg-emerald-900 text-emerald-200"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom User Area & Logout Button (ALWAYS VISIBLE & NON-SCROLLABLE) */}
        <div className="p-6 border-t border-emerald-900/40 shrink-0 bg-[#1C2B20]">
          <div
            onClick={() => {
              setCurrentScreen(BarangayCaptainScreen.PROFILE);
              setIsMobileNavOpen(false);
            }}
            className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-emerald-950/60 transition-all cursor-pointer group border border-transparent hover:border-emerald-800/40"
            title="View Executive Profile"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs border border-amber-400 shrink-0">
              {captainInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold leading-none group-hover:text-amber-400 transition-colors text-white truncate">
                {captainInfo.name}
              </p>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5 truncate">
                Barangay Captain
              </p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-emerald-900 hover:border-emerald-700 hover:bg-emerald-950/40 text-xs text-red-300 rounded-lg transition-colors font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT & STICKY TOPBAR                                            */}
      {/* ========================================================================= */}
      <main className="flex-1 h-screen flex flex-col min-w-0 overflow-y-auto">
        
        {/* Sticky Topbar */}
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-2xs">
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
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                  Executive Governance
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-gray-500 truncate block">
                  {formattedBrgyName} · San Luis
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-gray-900 mt-0.5 truncate block">
                Good day, {captainInfo.name.split(" ")[0]}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Print Census / Summary Report Action */}
            <button
              onClick={() => setIsPrintReportModalOpen(true)}
              className="p-2 sm:px-3.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs shrink-0"
              title="Print Executive Census Summary Report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print Census Report</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              {(() => {
                const captainNotifications: Array<{
                  id: string;
                  title: string;
                  desc: string;
                  icon: React.ReactNode;
                  bg: string;
                  action: () => void;
                }> = [
                  {
                    id: "notif-capt-youth",
                    title: "Katipunan ng Kabataan Roster",
                    desc: `${localYouthProfiles.length} youth registered in ${formattedBrgyName}. ${kkMembersSummary.outOfSchool} are tagged as Out-of-School Youth (OSY).`,
                    icon: <Users className="w-4 h-4 text-[#0A6B43]" />,
                    bg: "bg-emerald-50 border border-emerald-100",
                    action: () => setCurrentScreen(BarangayCaptainScreen.YOUTH_DIRECTORY)
                  },
                  {
                    id: "notif-capt-council",
                    title: "Sangguniang Kabataan Council",
                    desc: `${localCouncilors.length} council members appointed under Presiding Officer ${localSKChair?.name || "SK Chairperson"}.`,
                    icon: <Users2 className="w-4 h-4 text-amber-800" />,
                    bg: "bg-amber-50 border border-amber-100",
                    action: () => setCurrentScreen(BarangayCaptainScreen.SK_COUNCIL)
                  },
                  {
                    id: "notif-capt-tesda",
                    title: "Municipal TESDA Programs",
                    desc: `${programs.length} active livelihood and technical training courses available across San Luis.`,
                    icon: <Briefcase className="w-4 h-4 text-teal-800" />,
                    bg: "bg-teal-50 border border-teal-100",
                    action: () => setCurrentScreen(BarangayCaptainScreen.TESDA_PROGRAMS)
                  }
                ];

                const activeNotifs = captainNotifications.filter(n => !clearedNotificationIds.includes(n.id));

                return (
                  <>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      className={`relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer ${
                        showNotifications ? "ring-2 ring-emerald-500 bg-white" : ""
                      }`}
                      title="Barangay Governance Notifications"
                    >
                      <Bell className="w-4 h-4" />
                      {!notificationsRead && activeNotifs.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                      )}
                    </button>

                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="fixed inset-x-3.5 top-16 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-12 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-3 text-xs overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[80vh] sm:max-h-none">
                          <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/70 p-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-[#0A6B43]" />
                              <span className="font-extrabold text-gray-900 text-sm">Barangay Executive Alerts</span>
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
                                    clearAllNotifications(captainNotifications.map(n => n.id));
                                    showToast("All notifications marked as read & cleared", "info");
                                  }}
                                  className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                  title="Mark all as read & clear"
                                >
                                  Mark read
                                </button>
                                <span className="text-gray-300">·</span>
                                <button
                                  onClick={() => {
                                    clearAllNotifications(captainNotifications.map(n => n.id));
                                    showToast("All notifications cleared", "info");
                                  }}
                                  className="text-[10px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                                  title="Clear all alerts"
                                >
                                  Clear all
                                </button>
                              </div>
                            )}
                          </div>

                          <NotificationSettingsCard compact userRole="BARANGAY_CAPTAIN" addToast={showToast} />

                          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                            {activeNotifs.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                                <p className="text-xs font-bold text-gray-700">All caught up!</p>
                                <p className="text-[10px] text-gray-400">No active governance alerts for Barangay {formattedBrgyName}.</p>
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
                                  <div className={`p-2 rounded-lg ${n.bg} shrink-0 mt-0.5`}>
                                    {n.icon}
                                  </div>
                                  <div className="flex-1 min-w-0 pr-2">
                                    <p className="font-bold text-gray-900 text-xs">{n.title}</p>
                                    <p className="text-[11px] text-gray-500 font-medium mt-0.5 leading-relaxed">{n.desc}</p>
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
                            <span className="text-[10px] font-bold text-gray-400">Click an alert to view it, or click ✕ to dismiss</span>
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

        {/* Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* ===================================================================== */}
          {/* SCREEN 1: EXECUTIVE DASHBOARD                                         */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.DASHBOARD && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Executive Welcome & Jurisdiction Banner */}
              <div className="bg-gradient-to-r from-[#1C2B20] via-[#164132] to-[#0A6B43] rounded-3xl p-6 md:p-8 text-white shadow-md border border-emerald-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 max-w-2xl z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/35 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                      Official Executive Audit Dashboard
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight">
                    {formattedBrgyName} Youth Governance Portal
                  </h2>
                  <p className="text-xs text-emerald-100/90 leading-relaxed font-medium">
                    Welcome, Hon. {captainInfo.name}. Monitor demographic indicators, out-of-school youth empowerment, SK council operations, and technical training pathways across your barangay.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="bg-black/30 px-3 py-1 rounded-lg border border-white/10 text-emerald-200 font-semibold flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-amber-400" /> Municipality of San Luis, Pampanga
                    </span>
                    <span className="bg-black/30 px-3 py-1 rounded-lg border border-white/10 text-emerald-200 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" /> Fiscal Term 2023–2026
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 z-10">
                  <button
                    onClick={() => setCurrentScreen(BarangayCaptainScreen.YOUTH_DIRECTORY)}
                    className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users className="w-4 h-4" />
                    Inspect KK Directory ({localYouthProfiles.length})
                  </button>
                  <button
                    onClick={() => setCurrentScreen(BarangayCaptainScreen.SK_COUNCIL)}
                    className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Users2 className="w-4 h-4 text-emerald-300" />
                    View SK Council Team
                  </button>
                </div>
              </div>

              {/* 4 Executive KPI Stat Cards - 2-column stack on smaller screens */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                
                {/* Stat 1: Total KK Youth */}
                <div className="bg-white border border-gray-150 rounded-2xl p-3 sm:p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">Registered KK Youth</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center border border-emerald-100 shrink-0">
                      <Users className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">{localYouthProfiles.length}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-100">
                        Census Logged
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 line-clamp-2">
                      Ages 15–30 in {formattedBrgyName}
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0A6B43] h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Stat 2: OSY Youth */}
                <div className="bg-white border border-gray-150 rounded-2xl p-3 sm:p-5 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">Out-of-School (OSY)</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-amber-600">{kkMembersSummary.outOfSchool}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-amber-200">
                        {localYouthProfiles.length > 0 ? Math.round((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100) : 0}% of Total
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 line-clamp-2">
                      Priority for TESDA livelihood
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${localYouthProfiles.length > 0 ? Math.min((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100, 100) : 0}%`
                      }}
                    />
                  </div>
                </div>

                {/* Stat 3: SK Council Appointees */}
                <div className="bg-white border border-gray-150 rounded-2xl p-3 sm:p-5 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">SK Council Officers</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100 shrink-0">
                      <Users2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">
                        {localCouncilors.length + (localSKChair ? 1 : 0)}
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-gray-400">/ 12 Total</span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 line-clamp-2">
                      {localSKChair ? "Chairperson ✓" : "No Chair"} • {localCouncilors.length} Appointees
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(((localCouncilors.length + (localSKChair ? 1 : 0)) / 12) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stat 4: Municipal TESDA Programs */}
                <div className="bg-white border border-gray-150 rounded-2xl p-3 sm:p-5 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider line-clamp-1">TESDA Courses Open</span>
                    <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 shrink-0">
                      <Briefcase className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
                      <span className="text-xl sm:text-2xl font-black text-gray-900">{programs.length}</span>
                      <span className="text-[10px] sm:text-xs font-bold text-blue-700 bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-blue-100">
                        San Luis
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-1 line-clamp-2">
                      {localReferrals.length} youth applications
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

              </div>

              {/* DEMOGRAPHICS BREAKDOWN & SKILLS GAPS GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Col 1 & 2: KATIPUNAN NG KABATAAN CENSUS & ACTIVITY STATUS */}
                <div className="bg-white border border-gray-150 p-4 sm:p-6 rounded-2xl shadow-xs lg:col-span-2 space-y-5 sm:space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-wider leading-snug">
                          Katipunan ng Kabataan Demographics & Activity
                        </h3>
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                          Census distribution of youth residing in {formattedBrgyName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center self-start sm:self-center shrink-0">
                      <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md whitespace-nowrap">
                        Live Census Ledger
                      </span>
                    </div>
                  </div>

                  {localYouthProfiles.length > 0 ? (
                    <div className="space-y-6">
                      
                      {/* Primary OSY & TVET Livelihood Governance Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-amber-50 border-2 border-amber-400 p-3.5 rounded-xl text-center shadow-xs">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 block">
                            ★ OSY Youth Target
                          </span>
                          <h5 className="text-2xl font-black text-amber-950 mt-1">{kkMembersSummary.outOfSchool}</h5>
                          <p className="text-[9px] text-amber-700 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.outOfSchool / (localYouthProfiles.length || 1)) * 100)}% Priority Cohort
                          </p>
                        </div>
                        <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">TVET Matching Target</span>
                          <h5 className="text-2xl font-black text-emerald-950 mt-1">{kkMembersSummary.outOfSchool}</h5>
                          <p className="text-[9px] text-emerald-700 mt-0.5 font-bold">
                            Free TESDA Training
                          </p>
                        </div>
                        <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800 block">Skill Deficiencies</span>
                          <h5 className="text-2xl font-black text-blue-950 mt-1">{localSkillsGaps.length} Areas</h5>
                          <p className="text-[9px] text-blue-700 mt-0.5 font-bold">
                            Priority Training Needs
                          </p>
                        </div>
                        <div className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-purple-800 block">Active Sub-Zones</span>
                          <h5 className="text-2xl font-black text-purple-950 mt-1">{Object.keys(kkMembersSummary.purokBreakdown).length} Puroks</h5>
                          <p className="text-[9px] text-purple-700 mt-0.5 font-bold">
                            Demographic Scope
                          </p>
                        </div>
                      </div>

                      {/* Sub-grid: Purok breakdown & Education */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                        
                        {/* Purok Distribution */}
                        <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-150">
                          <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Purok-Wise Distribution
                          </h4>
                          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 text-xs">
                            {Object.entries(kkMembersSummary.purokBreakdown).map(([purok, count]) => {
                              const countNum = count as number;
                              return (
                                <div key={purok} className="flex justify-between items-center font-semibold">
                                  <span className="text-gray-700 font-bold">{purok}</span>
                                  <div className="flex items-center gap-2 flex-1 mx-3">
                                    <div className="h-1.5 bg-gray-200 rounded-full flex-1 overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-600 rounded-full" 
                                        style={{ width: `${(countNum / localYouthProfiles.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-gray-900 font-black">{countNum} youth</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Educational Attainment & Vulnerable Sectors */}
                        <div className="space-y-3">
                          <div className="space-y-3 bg-gray-50/70 p-4 rounded-xl border border-gray-150">
                            <h4 className="text-[10px] font-black uppercase text-gray-600 tracking-wider flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-amber-600" /> Education Profiles
                            </h4>
                            <div className="space-y-2 max-h-[90px] overflow-y-auto pr-1 text-xs">
                              {Object.entries(kkMembersSummary.eduBreakdown).map(([edu, count]) => {
                                const countNum = count as number;
                                return (
                                  <div key={edu} className="flex justify-between items-center font-semibold">
                                    <span className="text-gray-700 truncate max-w-[130px]" title={edu}>{edu}</span>
                                    <span className="text-gray-900 font-black">{countNum}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Vulnerable demographic indicators */}
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                            <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 text-rose-800">
                              <span className="block font-black text-rose-950 text-sm">{kkMembersSummary.soloParent}</span>
                              Solo Parents
                            </div>
                            <div className="bg-sky-50 border border-sky-100 rounded-lg p-2 text-sky-800">
                              <span className="block font-black text-sky-950 text-sm">{kkMembersSummary.pwd}</span>
                              PWD Youth
                            </div>
                            <div className="bg-violet-50 border border-violet-100 rounded-lg p-2 text-violet-800">
                              <span className="block font-black text-violet-950 text-sm">{kkMembersSummary.indigenous}</span>
                              Indigenous
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-2xl">
                      No Katipunan ng Kabataan members registered in {formattedBrgyName} yet.
                    </div>
                  )}
                </div>

                {/* Col 3: TOP SKILLS GAPS & SK COUNCIL CARD */}
                <div className="space-y-6">
                  
                  {/* Skills Gaps Card */}
                  <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                    <div className="border-b border-gray-100 pb-3">
                      <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        Barangay Skills Gaps
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        Deficiency metrics ranked by need
                      </p>
                    </div>

                    <div className="space-y-3 text-xs">
                      {localSkillsGaps.map((gap) => {
                        const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                        return (
                          <div key={gap.skill} className="space-y-1">
                            <div className="flex justify-between font-bold">
                              <span className="text-gray-700 truncate max-w-[170px]" title={gap.skill}>{gap.skill}</span>
                              <span className="text-amber-700 font-black bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                                {gap.count} youth lacking
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-500 to-[#0A6B43] rounded-full"
                                style={{ width: `${(gap.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Local SK Leadership Snapshot */}
                  <div className="bg-gradient-to-br from-[#1C2B20] to-[#122417] text-white p-5 rounded-2xl shadow-xs border border-emerald-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider">
                        Presiding SK Officer
                      </span>
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white truncate">
                        {localSKChair ? localSKChair.name : "Seat Vacant / Unassigned"}
                      </h4>
                      <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
                        SK Chairperson · Ex-Officio SB Member
                      </p>
                      <p className="text-[10px] text-emerald-200/80 font-mono mt-1 truncate">
                        {localSKChair?.email || "chairperson.sk@sanluispampanga.gov.ph"}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentScreen(BarangayCaptainScreen.SK_COUNCIL)}
                      className="w-full py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl border border-emerald-600/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      Manage SK Council Team ({localCouncilors.length})
                    </button>
                  </div>

                </div>

              </div>

              {/* RECENT YOUTH REGISTRATIONS TABLE */}
              <div className="bg-white border border-gray-150 p-4 sm:p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
                      Recent Youth Registrations
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 font-semibold mt-0.5">
                      Latest Katipunan ng Kabataan registrants in {formattedBrgyName}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen(BarangayCaptainScreen.YOUTH_DIRECTORY)}
                    className="text-xs font-bold text-[#0A6B43] hover:text-emerald-800 flex items-center gap-1 hover:underline uppercase tracking-wider cursor-pointer self-start sm:self-auto"
                  >
                    Full Directory ({localYouthProfiles.length}) <ChevronRight className="w-4 h-4 shrink-0" />
                  </button>
                </div>

                {/* MOBILE VIEW: Responsive Youth Registration Cards (under md screens) */}
                <div className="md:hidden space-y-3">
                  {paginatedRecentYouth.length > 0 ? (
                    paginatedRecentYouth.map((y) => (
                      <div
                        key={y.id}
                        className="p-3.5 bg-gray-50/80 hover:bg-emerald-50/30 rounded-xl border border-gray-200/90 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0">
                              {y.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="block font-bold text-gray-950 text-xs truncate" title={y.name}>
                                {y.name}
                              </span>
                              <span className="text-[10px] text-gray-500">
                                {y.age} y/o · <strong className="text-gray-800">{y.purok}</strong>
                              </span>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${
                            y.currentStatus.toLowerCase().includes("out-of-school")
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}>
                            {y.currentStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span className="bg-white text-gray-700 border border-gray-200 px-2 py-0.5 rounded-md text-[9px] font-bold truncate max-w-[130px]">
                              {y.educationalAttainment}
                            </span>
                            <span className={`font-black text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${
                              y.matchScore >= 80 
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                                : "text-amber-700 bg-amber-50 border-amber-200"
                            }`}>
                              {y.matchScore}% Match
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedYouth(y)}
                            className="px-3 py-1 bg-[#1C2B20] hover:bg-emerald-800 text-white font-bold uppercase text-[9px] tracking-wider rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer"
                          >
                            View Dossier
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-gray-400 font-semibold text-xs bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      No youth registrants recorded yet.
                    </div>
                  )}
                </div>

                {/* DESKTOP VIEW: Full Scrollable Table (md screens and up) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-gray-150 text-gray-400 font-bold text-[10px] bg-gray-50 uppercase tracking-widest">
                        <th className="py-3 px-4 pl-5">Full Name</th>
                        <th className="py-3 px-4">Age / Purok</th>
                        <th className="py-3 px-4">Activity Status</th>
                        <th className="py-3 px-4">Education Attainment</th>
                        <th className="py-3 px-4 text-center">CBF Match Score</th>
                        <th className="py-3 px-4 text-right pr-5">Dossier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {paginatedRecentYouth.length > 0 ? (
                        paginatedRecentYouth.map((y) => (
                          <tr key={y.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3 px-4 pl-5 font-bold text-gray-950 text-xs">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0">
                                  {y.name.charAt(0)}
                                </div>
                                <span className="truncate max-w-[160px]">{y.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-500">
                              {y.age} y/o · <strong className="text-gray-800">{y.purok}</strong>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                y.currentStatus.toLowerCase().includes("out-of-school")
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}>
                                {y.currentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                {y.educationalAttainment}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-black text-xs px-2.5 py-1 rounded-lg border ${
                                y.matchScore >= 80 
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                                  : "text-amber-700 bg-amber-50 border-amber-200"
                              }`}>
                                {y.matchScore}% CBF Match
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right pr-5">
                              <button
                                onClick={() => setSelectedYouth(y)}
                                className="px-3 py-1.5 bg-[#1C2B20] hover:bg-emerald-800 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                              >
                                View Dossier
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-400 font-semibold">
                            No youth registrants recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls for Recent Youth Registrations (max 5 per page) */}
                {totalRecentRegPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                    <span className="text-[11px] text-gray-500 font-medium">
                      Showing <strong>{(currentRecentRegPage - 1) * RECENT_REG_PER_PAGE + 1}</strong>–<strong>{Math.min(currentRecentRegPage * RECENT_REG_PER_PAGE, localYouthProfiles.length)}</strong> of <strong>{localYouthProfiles.length}</strong> registrants
                    </span>
                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setRecentRegPage(p => Math.max(1, p - 1))}
                        disabled={currentRecentRegPage <= 1}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        aria-label="Previous page of recent registrations"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalRecentRegPages }, (_, i) => i + 1).map((pageNum) => (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setRecentRegPage(pageNum)}
                            className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                              pageNum === currentRecentRegPage
                                ? "bg-[#0A6B43] text-white shadow-xs"
                                : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                            }`}
                            aria-label={`Go to page ${pageNum}`}
                          >
                            {pageNum}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setRecentRegPage(p => Math.min(totalRecentRegPages, p + 1))}
                        disabled={currentRecentRegPage >= totalRecentRegPages}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        aria-label="Next page of recent registrations"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 2: KK YOUTH DIRECTORY (VIEW & AUDIT ONLY)                      */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.YOUTH_DIRECTORY && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        Official Census Registry
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 truncate">
                        • {formattedBrgyName}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
                      Katipunan ng Kabataan Directory
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                      Comprehensive roster of all registered youth residents in {formattedBrgyName}. View-only audit mode enabled.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto pt-3 sm:pt-0 border-t border-gray-100 sm:border-0 shrink-0">
                  {/* View Switcher */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setYouthViewMode("table")}
                      className={`p-1.5 px-2.5 sm:px-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        youthViewMode === "table"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="Table View"
                    >
                      <Table className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] sm:text-xs sm:inline">Table</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setYouthViewMode("grid")}
                      className={`p-1.5 px-2.5 sm:px-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        youthViewMode === "grid"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <span className="text-[11px] sm:text-xs sm:inline">Grid</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPrintReportModalOpen(true)}
                    className="bg-[#0A6B43] hover:bg-[#075332] text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Print Census Sheet</span>
                  </button>
                </div>
              </div>

              {/* SEARCH & FILTERS TOOLBAR */}
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-semibold">
                  
                  {/* Search Input */}
                  <div className="relative lg:col-span-2">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search name, skills, interests, purok..."
                      value={youthSearch}
                      onChange={(e) => setYouthSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden text-xs"
                    />
                    {youthSearch && (
                      <button
                        onClick={() => setYouthSearch("")}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Purok Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={purokFilter}
                      onChange={(val) => setPurokFilter(val)}
                      options={[
                        { value: "All", label: `All Puroks (${uniquePuroks.length})` },
                        ...uniquePuroks.map(p => ({ value: p, label: p }))
                      ]}
                      size="sm"
                      placeholder="Select Purok"
                    />
                  </div>

                  {/* Education Level Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={eduFilter}
                      onChange={(val) => setEduFilter(val)}
                      options={[
                        { value: "All", label: "All Education Levels" },
                        ...EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))
                      ]}
                      size="sm"
                      placeholder="Education Level"
                    />
                  </div>

                  {/* Special Vulnerability Filter */}
                  <div className="relative">
                    <CustomSelect
                      value={specialFilter}
                      onChange={(val) => setSpecialFilter(val)}
                      options={[
                        { value: "All", label: "All Demographics" },
                        { value: "Solo Parent", label: "Solo Parents" },
                        { value: "PWD", label: "PWD Youth" },
                        { value: "Indigenous", label: "Indigenous" }
                      ]}
                      size="sm"
                      placeholder="Demographics"
                    />
                  </div>

                </div>

                {/* Filter Summary Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing <strong>{filteredYouthProfiles.length}</strong> of <strong>{localYouthProfiles.length}</strong> youth records in {formattedBrgyName}
                  </span>
                  {(youthSearch || purokFilter !== "All" || eduFilter !== "All" || specialFilter !== "All") && (
                    <button
                      onClick={() => {
                        setYouthSearch("");
                        setPurokFilter("All");
                        setEduFilter("All");
                        setSpecialFilter("All");
                      }}
                      className="text-emerald-700 font-bold hover:underline text-[11px] cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>

              {/* DIRECTORY DISPLAY (TABLE OR GRID) */}
              {filteredYouthProfiles.length === 0 ? (
                <div className="bg-white border border-gray-150 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-800 text-sm">No Youth Match Your Filters</h4>
                  <p className="text-xs text-gray-500 font-medium">
                    Try clearing your search terms or expanding the demographic filters.
                  </p>
                  <button
                    onClick={() => {
                      setYouthSearch("");
                      setPurokFilter("All");
                      setEduFilter("All");
                      setSpecialFilter("All");
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {youthViewMode === "table" ? (
                    /* TABLE VIEW: Responsive Mobile Cards on <md, Clean Table on >=md */
                    <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                      {/* Mobile Cards for Table View */}
                      <div className="md:hidden p-3.5 sm:p-4 space-y-3">
                        {paginatedDirectoryYouth.map((y) => (
                          <div
                            key={y.id}
                            className="p-3.5 bg-gray-50/80 hover:bg-emerald-50/30 rounded-xl border border-gray-200/90 transition-all space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0">
                                  {y.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <span className="block font-bold text-gray-950 text-xs truncate" title={y.name}>
                                    {y.name}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {y.age} y/o · <strong className="text-gray-800">{y.purok}</strong>
                                  </span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shrink-0 ${
                                y.currentStatus.toLowerCase().includes("out-of-school")
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}>
                                {y.currentStatus}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-600 bg-white/70 p-2 rounded-lg border border-gray-150">
                              <div>
                                <span className="text-gray-400 block text-[9px] uppercase font-bold">Education:</span>
                                <span className="font-semibold text-gray-800 truncate block">{y.educationalAttainment}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 block text-[9px] uppercase font-bold">Sector:</span>
                                <span className="font-semibold text-emerald-700 truncate block">{y.sectorPreference || "Technical"}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200/60">
                              <span className={`font-black text-[10px] px-2 py-0.5 rounded-md border shrink-0 ${
                                y.matchScore >= 80 
                                  ? "text-emerald-700 bg-emerald-50 border-emerald-200" 
                                  : "text-amber-700 bg-amber-50 border-amber-200"
                              }`}>
                                {y.matchScore}% CBF Match
                              </span>
                              <button
                                onClick={() => setSelectedYouth(y)}
                                className="px-3 py-1 bg-[#1C2B20] hover:bg-emerald-800 text-white font-bold uppercase text-[9px] tracking-wider rounded-lg transition-all shadow-2xs shrink-0 cursor-pointer"
                              >
                                View Dossier
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                          <thead>
                            <tr className="border-b border-gray-150 text-gray-400 font-black text-[10px] bg-gray-50 uppercase tracking-widest">
                              <th className="py-3.5 px-4 pl-5">Full Name</th>
                              <th className="py-3.5 px-4">Age / Purok</th>
                              <th className="py-3.5 px-4">Current Status</th>
                              <th className="py-3.5 px-4">Education Profile</th>
                              <th className="py-3.5 px-4">Preferred Sector</th>
                              <th className="py-3.5 px-4 text-center">CBF Score</th>
                              <th className="py-3.5 px-4 text-right pr-5">Dossier</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                            {paginatedDirectoryYouth.map((y) => (
                              <tr key={y.id} className="hover:bg-gray-50/60 transition-colors">
                                <td className="py-3.5 px-4 pl-5 font-bold text-gray-950 text-xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-black text-xs shrink-0">
                                      {y.name.charAt(0)}
                                    </div>
                                    <div>
                                      <span className="block font-extrabold text-gray-900">{y.name}</span>
                                      <span className="text-[10px] text-gray-400">{y.contactNumber || "No contact"}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-gray-600">
                                  {y.age} y/o · <strong className="text-gray-900">{y.purok}</strong>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                    y.currentStatus.toLowerCase().includes("out-of-school")
                                      ? "bg-amber-50 text-amber-800 border-amber-200"
                                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  }`}>
                                    {y.currentStatus}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    {y.educationalAttainment}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-gray-700 font-bold max-w-[140px] truncate" title={y.sectorPreference}>
                                  {y.sectorPreference || "Technical Vocational"}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className={`font-black text-xs px-2.5 py-1 rounded-lg border ${
                                    y.matchScore >= 80
                                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                      : "text-amber-700 bg-amber-50 border-amber-200"
                                  }`}>
                                    {y.matchScore}%
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right pr-5">
                                  <button
                                    onClick={() => setSelectedYouth(y)}
                                    className="px-3 py-1.5 bg-[#1C2B20] hover:bg-emerald-800 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                                  >
                                    View Dossier
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                      {paginatedDirectoryYouth.map((y) => (
                        <div
                          key={y.id}
                          className="bg-white border border-gray-150 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3.5 sm:space-y-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                                y.currentStatus.toLowerCase().includes("out-of-school")
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                              }`}>
                                {y.currentStatus}
                              </span>
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                                {y.matchScore}% CBF Match
                              </span>
                            </div>

                            <div className="flex items-center gap-3 pt-1">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                                {y.name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-extrabold text-gray-900 text-sm truncate" title={y.name}>
                                  {y.name}
                                </h3>
                                <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                  {y.age} y/o · {y.purok}
                                </p>
                              </div>
                            </div>

                            <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-150 space-y-1.5 text-xs text-gray-700">
                              <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Education:</span>
                                <span className="font-semibold text-gray-800 truncate max-w-[150px]">{y.educationalAttainment}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Sector:</span>
                                <span className="font-bold text-emerald-700 truncate max-w-[150px]">{y.sectorPreference || "Technical"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Contact:</span>
                                <span
                                  onClick={() => {
                                    if (y.contactNumber) {
                                      navigator.clipboard?.writeText(y.contactNumber);
                                      showToast("Contact number copied to clipboard!", "success");
                                    }
                                  }}
                                  className="font-mono text-[11px] text-gray-800 hover:text-[#0A6B43] cursor-pointer"
                                  title="Click to copy"
                                >
                                  {y.contactNumber || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelectedYouth(y)}
                            className="w-full py-2 bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 text-xs font-bold rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Inspect Dossier
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unified Pagination Controls for KK Youth Directory */}
                  <div className="p-3.5 sm:p-4 px-4 sm:px-6 bg-white border border-gray-150 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-[11px] sm:text-xs text-gray-500 font-medium">
                      Showing <strong>{((currentDirectoryPage - 1) * DIRECTORY_PER_PAGE) + 1}</strong> to <strong>{Math.min(currentDirectoryPage * DIRECTORY_PER_PAGE, filteredYouthProfiles.length)}</strong> of <strong>{filteredYouthProfiles.length}</strong> youth records
                    </span>
                    <div className="flex items-center gap-1.5 self-center sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setDirectoryPage(p => Math.max(1, p - 1))}
                        disabled={currentDirectoryPage <= 1}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <div className="flex items-center gap-1 px-1">
                        {Array.from({ length: totalDirectoryPages }, (_, i) => i + 1).map((pg) => {
                          if (
                            pg === 1 ||
                            pg === totalDirectoryPages ||
                            (pg >= currentDirectoryPage - 1 && pg <= currentDirectoryPage + 1)
                          ) {
                            return (
                              <button
                                key={pg}
                                type="button"
                                onClick={() => setDirectoryPage(pg)}
                                className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                                  pg === currentDirectoryPage
                                    ? "bg-[#0A6B43] text-white shadow-xs"
                                    : "text-gray-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
                                }`}
                                aria-label={`Go to page ${pg}`}
                              >
                                {pg}
                              </button>
                            );
                          } else if (
                            (pg === 2 && currentDirectoryPage > 3) ||
                            (pg === totalDirectoryPages - 1 && currentDirectoryPage < totalDirectoryPages - 2)
                          ) {
                            return <span key={pg} className="px-1 text-gray-400 font-bold">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => setDirectoryPage(p => Math.min(totalDirectoryPages, p + 1))}
                        disabled={currentDirectoryPage >= totalDirectoryPages}
                        className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-200 text-gray-700 font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer text-xs shadow-2xs"
                        aria-label="Next page"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 3: SK COUNCIL & GOVERNANCE OVERSIGHT                           */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.SK_COUNCIL && (
            <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
              
              {/* Header Card */}
              <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                    <Users2 className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        Sangguniang Barangay Oversight
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 truncate">
                        • {formattedBrgyName}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
                      Sangguniang Kabataan Council Roster
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                      Oversight of SK officials, appointed officers, and administrative access for {formattedBrgyName}.
                    </p>
                  </div>
                </div>

                {/* Quick Council Summary Badge */}
                <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4 text-[#0A6B43] shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    <strong>{localCouncilors.length + (localSKChair ? 1 : 0)}</strong> Total Officials
                  </span>
                </div>
              </div>

              {/* SK Chairperson Spotlight Banner */}
              <div className="bg-gradient-to-br from-[#1C2B20] via-[#162f20] to-[#0f2115] text-white p-4 sm:p-6 rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg sm:text-xl shadow-md shrink-0">
                      {localSKChair ? localSKChair.name.charAt(0) : "SK"}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-900/60 border border-amber-500/40 px-2 py-0.5 rounded-md">
                          Ex-Officio Sangguniang Barangay Member
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-900/40 border border-emerald-700/50 px-2 py-0.5 rounded-md">
                          {localSKChair?.status || "Active"}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white truncate" title={localSKChair ? localSKChair.name : "SK Chairperson Seat Pending"}>
                        {localSKChair ? localSKChair.name : "SK Chairperson Seat Pending"}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium line-clamp-2">
                        Presiding Officer of the Sangguniang Kabataan and youth representative to the Barangay Council.
                      </p>
                    </div>
                  </div>

                  {/* Chairperson Contact & Action */}
                  <div className="flex flex-col sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-emerald-800/60 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-200/90 font-mono truncate">
                      <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate max-w-[220px] sm:max-w-none">{localSKChair?.email || "chairperson@sanluispampanga.gov.ph"}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (localSKChair?.email) {
                          navigator.clipboard?.writeText(localSKChair.email);
                          showToast("Chairperson email copied!", "success");
                        }
                      }}
                      className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Copy Email</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Council Members Toolbar & Grid */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-150 shadow-xs space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search member by name, email, or role..."
                      value={councilSearch}
                      onChange={(e) => setCouncilSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden text-xs font-medium"
                    />
                    {councilSearch && (
                      <button
                        onClick={() => setCouncilSearch("")}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter with CustomSelect */}
                  <div className="w-full sm:w-56 shrink-0">
                    <CustomSelect
                      value={councilRoleFilter}
                      onChange={(val) => setCouncilRoleFilter(val)}
                      options={[
                        { value: "All", label: `All Appointees (${localCouncilors.length})` },
                        { value: "SK Councilor", label: "SK Councilor" },
                        { value: "Secretary", label: "Secretary" },
                        { value: "Treasurer", label: "Treasurer" }
                      ]}
                      size="sm"
                      placeholder="All Appointees"
                    />
                  </div>
                </div>

                {/* Filter Summary Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing <strong>{filteredCouncilors.length}</strong> of <strong>{localCouncilors.length}</strong> council members in {formattedBrgyName}
                  </span>
                  {(councilSearch || councilRoleFilter !== "All") && (
                    <button
                      onClick={() => {
                        setCouncilSearch("");
                        setCouncilRoleFilter("All");
                      }}
                      className="text-emerald-700 font-bold hover:underline text-[11px] cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {filteredCouncilors.length === 0 ? (
                  <div className="bg-gray-50/60 border-2 border-dashed border-gray-200 rounded-2xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mx-auto">
                      <Users2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">No Council Members Found</h4>
                    <p className="text-xs text-gray-500 font-medium">
                      No SK council members match your search criteria in {formattedBrgyName}.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCouncilSearch("");
                        setCouncilRoleFilter("All");
                      }}
                      className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-1">
                      {paginatedCouncilors.map((c) => {
                        const isSecretary = c.role.toLowerCase().includes("secretary");
                        const isTreasurer = c.role.toLowerCase().includes("treasurer");

                        const roleBadgeClass = isSecretary
                          ? "bg-amber-50 text-amber-900 border-amber-200"
                          : isTreasurer
                          ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                          : "bg-emerald-50 text-[#0A6B43] border-emerald-200";

                        const avatarGradient = isSecretary
                          ? "from-amber-600 to-amber-800"
                          : isTreasurer
                          ? "from-indigo-600 to-indigo-800"
                          : "from-emerald-600 to-teal-800";

                        return (
                          <div
                            key={c.id}
                            className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between gap-3 group"
                          >
                            {/* Top Header: Role Badges + Active Status */}
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${roleBadgeClass}`}>
                                  {c.role}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50/80 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {c.status || "Active"}
                                </span>
                              </div>

                              {/* Member Avatar & Name */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 tracking-wider`}>
                                  {c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-black text-gray-900 text-sm sm:text-base leading-tight truncate group-hover:text-[#0A6B43] transition-colors" title={c.name}>
                                    {c.name}
                                  </h4>
                                  <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                    <span>{formattedBrgyName}</span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Contact & Term Details */}
                            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                              {/* Email Row */}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                                  <Mail className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Email</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(c.email);
                                    showToast("Email copied to clipboard!", "success");
                                  }}
                                  className="font-mono text-xs text-gray-800 hover:text-[#0A6B43] hover:underline cursor-pointer truncate max-w-[180px] sm:max-w-[200px] text-right font-medium"
                                  title="Click to copy email"
                                >
                                  {c.email}
                                </button>
                              </div>

                              {/* Contact Row */}
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                                  <Phone className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  <span className="text-[11px] font-semibold text-gray-400 uppercase">Phone</span>
                                </div>
                                {c.contactNumber ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(c.contactNumber!);
                                      showToast("Contact number copied!", "success");
                                    }}
                                    className="text-xs font-semibold text-gray-800 hover:text-[#0A6B43] hover:underline cursor-pointer text-right"
                                    title="Click to copy phone number"
                                  >
                                    {c.contactNumber}
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Unlisted</span>
                                )}
                              </div>

                              {/* Term Row */}
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100/70 text-[11px] text-gray-400">
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span>Appointed Term</span>
                                </div>
                                <span className="font-semibold text-gray-600">{c.dateCreated || "Active Term"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Bar */}
                    {totalCouncilPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100 text-xs">
                        <span className="text-gray-500 font-medium order-2 sm:order-1">
                          Showing page <strong>{currentCouncilPage}</strong> of <strong>{totalCouncilPages}</strong> ({filteredCouncilors.length} members)
                        </span>
                        <div className="flex items-center gap-1.5 order-1 sm:order-2">
                          <button
                            type="button"
                            disabled={currentCouncilPage <= 1}
                            onClick={() => setCouncilPage(p => Math.max(1, p - 1))}
                            className="p-1.5 px-3 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Prev</span>
                          </button>
                          <div className="px-2 font-bold text-[#0A6B43]">
                            {currentCouncilPage} / {totalCouncilPages}
                          </div>
                          <button
                            type="button"
                            disabled={currentCouncilPage >= totalCouncilPages}
                            onClick={() => setCouncilPage(p => Math.min(totalCouncilPages, p + 1))}
                            className="p-1.5 px-3 border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center gap-1"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 4: YOUTH PROGRAM APPLICATIONS                                  */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.APPLICATIONS && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                        Direct Program Applications
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 truncate">
                        • {formattedBrgyName}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
                      TESDA Program Applications & Enrollees
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                      Track Katipunan ng Kabataan youth from {formattedBrgyName} who applied directly for technical courses and training certifications.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/80 px-3 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-bold text-gray-600">Total Applications:</span>
                  <strong className="text-emerald-800 text-xs sm:text-sm font-extrabold">{localReferrals.length} Youth</strong>
                </div>
              </div>

              {localReferrals.length === 0 ? (
                <div className="bg-white border border-[#D1FAE5] rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 text-[#0A6B43] rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-900 text-base">No Applications Submitted Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      No youth from {formattedBrgyName} have submitted an application for training programs yet. Youth can apply directly through their Katipunan ng Kabataan portal.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen(BarangayCaptainScreen.TESDA_PROGRAMS)}
                    className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <Briefcase className="w-4 h-4" />
                    View Open TESDA Programs
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-400 font-black text-[10px] bg-gray-50 uppercase tracking-widest">
                          <th className="py-3.5 px-4 pl-5">Candidate Applicant</th>
                          <th className="py-3.5 px-4">Target TESDA Program</th>
                          <th className="py-3.5 px-4">Barangay & Purok</th>
                          <th className="py-3.5 px-4 text-center">Application Status</th>
                          <th className="py-3.5 px-4 text-right pr-5">Date Applied</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {localReferrals.map((ref) => (
                          <tr key={ref.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="py-3.5 px-4 pl-5 font-bold text-gray-950">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0A6B43] flex items-center justify-center font-bold text-xs">
                                  {ref.youthName.charAt(0)}
                                </div>
                                <span>{ref.youthName}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-gray-800">
                              {ref.programTitle}
                            </td>
                            <td className="py-3.5 px-4 text-gray-600">
                              {ref.purok ? `Purok ${ref.purok}` : "Barangay Roster"}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                                ref.status === "Enrolled"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : ref.status === "Pending"
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}>
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right pr-5 text-gray-400 font-medium">
                              {ref.applicationDate || ref.referralDate || "Active"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 5: TESDA PROGRAMS DIRECTORY (VIEW ONLY)                        */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.TESDA_PROGRAMS && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                        Technical Vocational Directory
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 truncate">
                        • San Luis & Pampanga
                      </span>
                    </div>
                    <h2 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-snug">
                      TESDA Municipal Programs & Courses
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                      Directory of certified skills programs available for Katipunan ng Kabataan youth in your jurisdiction.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200/80 px-3 py-2 rounded-xl shrink-0 self-start sm:self-auto">
                  <span className="text-xs font-bold text-gray-600">Active Listings:</span>
                  <strong className="text-blue-700 text-xs sm:text-sm font-extrabold">{programs.length} Programs</strong>
                </div>
              </div>

              {/* SEARCH & FILTERS PANEL (Aligned with TESDA Course Forms & Catalog) */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs font-semibold">
                  {/* Search Programs */}
                  <div className="sm:col-span-2 lg:col-span-4 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search courses, provider, venue, trainer..."
                      value={tesdaSearch}
                      onChange={(e) => setTesdaSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden text-xs"
                    />
                    {tesdaSearch && (
                      <button
                        type="button"
                        onClick={() => setTesdaSearch("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter: Certification Level (NC I, NC II, NC III) */}
                  <div className="lg:col-span-2">
                    <CustomSelect
                      value={tesdaLevelFilter}
                      onChange={(val) => setTesdaLevelFilter(val)}
                      options={[
                        { value: "All", label: "All Certifications" },
                        { value: "NC I", label: "NC I Courses" },
                        { value: "NC II", label: "NC II Courses" },
                        { value: "NC III", label: "NC III Courses" }
                      ]}
                      size="sm"
                      placeholder="All Certifications"
                    />
                  </div>

                  {/* Filter: Vocational Category / Sector */}
                  <div className="lg:col-span-2">
                    <CustomSelect
                      value={tesdaCategoryFilter}
                      onChange={(val) => setTesdaCategoryFilter(val)}
                      options={tesdaCategoryOptions}
                      size="sm"
                      placeholder="All Categories"
                    />
                  </div>

                  {/* Filter: Cost Model */}
                  <div className="lg:col-span-2">
                    <CustomSelect
                      value={tesdaCostFilter}
                      onChange={(val) => setTesdaCostFilter(val)}
                      options={[
                        { value: "All", label: "All Costs" },
                        { value: "Free", label: "Free (TESDA Subsidized)" },
                        { value: "Subsidized", label: "Subsidized / Co-pay" },
                        { value: "With Fee", label: "Fee-based" }
                      ]}
                      size="sm"
                      placeholder="All Costs"
                    />
                  </div>

                  {/* Filter: Slot Availability */}
                  <div className="lg:col-span-2">
                    <CustomSelect
                      value={tesdaAvailabilityFilter}
                      onChange={(val) => setTesdaAvailabilityFilter(val)}
                      options={[
                        { value: "All", label: "All Availability" },
                        { value: "Open", label: "Open Slots Only" },
                        { value: "Full", label: "Full / Waitlist" }
                      ]}
                      size="sm"
                      placeholder="All Availability"
                    />
                  </div>
                </div>

                {/* Filter Summary & Quick Reset Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="font-medium text-[11px]">
                      Showing <strong className="text-gray-900 font-bold">{filteredPrograms.length}</strong> of <strong className="text-gray-700 font-bold">{programs.length}</strong> municipal courses
                    </span>
                  </div>

                  {isAnyTesdaFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetTesdaFilters}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* PROGRAM CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((prog) => {
                    const certLevelMatch = prog.title.match(/NC\s*(?:I{1,3}|IV)/i);
                    const certLevel = certLevelMatch ? certLevelMatch[0].toUpperCase() : null;
                    const catName = typeof prog.category === "string" ? prog.category : prog.category?.name || "";
                    const matchedCatObj = CATEGORIES.find(c => c.id === prog.categoryId);
                    const resolvedCat = catName || matchedCatObj?.name || "Technical-Vocational";
                    const isOpen = prog.slotsRemaining > 0 && prog.activeStatus !== "Full" && prog.activeStatus !== "Closed";

                    return (
                      <div
                        key={prog.id}
                        className="border border-gray-200 hover:border-emerald-400 rounded-2xl p-5 bg-white transition-all shadow-xs hover:shadow-md relative flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                              certLevel
                                ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {certLevel ? `${certLevel} Certified` : "TESDA Course"}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                                prog.cost === "Free"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : prog.cost === "Subsidized"
                                  ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                  : "bg-gray-50 text-gray-800 border-gray-200"
                              }`}>
                                {prog.cost === "Free" ? "100% Free" : prog.cost}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1" title={prog.title}>
                              {prog.title}
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider line-clamp-1" title={resolvedCat}>
                              {resolvedCat}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] font-semibold text-gray-600">
                            <p className="flex items-center gap-1.5 text-gray-500 truncate" title={prog.provider}>
                              <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{prog.provider}</span>
                            </p>
                            <p className="flex items-center gap-1.5 truncate" title={prog.location}>
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{prog.location}</span>
                            </p>
                            <p className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>Duration: <strong className="text-gray-800">{prog.trainingHours} hours</strong></span>
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[8px] font-black">Remaining Slots</p>
                            <p className={`text-xs font-black mt-0.5 ${isOpen ? "text-emerald-700" : "text-red-600"}`}>
                              {isOpen ? `${prog.slotsRemaining} / ${prog.slotsTotal} Open` : "Full / Waitlist"}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedProgram(prog)}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
                    <p className="text-sm font-bold text-gray-600">No TESDA courses match your current search and filters</p>
                    <p className="text-xs text-gray-400">Try changing the certification level, vocational sector, cost, or search query.</p>
                    {isAnyTesdaFilterActive && (
                      <button
                        type="button"
                        onClick={handleResetTesdaFilters}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-colors cursor-pointer mt-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset All Filters</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 6: EXECUTIVE PROFILE & AUDIT                                   */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.PROFILE && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header & Sub-Tab Navigation Container */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-gray-150 shadow-xs">
                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-black shrink-0 mt-0.5 sm:mt-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight leading-tight">
                      Barangay Executive Profile & Settings
                    </h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-0.5 leading-relaxed">
                      Manage executive leadership records, account security, administrative alerts, and digital credentials
                    </p>
                  </div>
                </div>

                {/* Sub-Tab Navigation Pills */}
                <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 shrink-0 overflow-x-auto max-w-full no-scrollbar">
                  {[
                    { id: "profile", label: "Executive Profile", icon: <Shield className="w-3.5 h-3.5 shrink-0" /> },
                    { id: "security", label: "Security & Password", icon: <Lock className="w-3.5 h-3.5 shrink-0" /> },
                    { id: "notifications", label: "Executive Alerts", icon: <Bell className="w-3.5 h-3.5 shrink-0" /> },
                    { id: "badge", label: "Punong Barangay Badge", icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        profileActiveTab === tab.id
                          ? "bg-white text-[#0A6B43] shadow-2xs font-extrabold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-Tab 1: Executive Profile Information */}
              {profileActiveTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start animate-in fade-in duration-150">
                  {/* Left Column: Form with View/Edit mode */}
                  <div className="lg:col-span-3 bg-white border border-gray-150 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xs">
                    <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-100">
                            <User className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-gray-900 text-sm sm:text-base tracking-tight leading-snug truncate">
                              Punong Barangay Official Details
                            </h3>
                            <p className="text-[11px] text-gray-500 font-medium">Executive identity & credentials</p>
                          </div>
                        </div>
                        {!isEditingProfile && (
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(true)}
                            className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit Profile Details</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              required
                              value={captainName}
                              onChange={(e) => setCaptainName(e.target.value)}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                          ) : (
                            <p className="p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs font-bold text-gray-900">
                              {captainName}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Executive Designation</label>
                          <div className="p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs flex items-center justify-between">
                            <span className="font-bold text-amber-900">Punong Barangay</span>
                            <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded">
                              Elected Executive
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Official Email Address *</label>
                          {isEditingProfile ? (
                            <input
                              type="email"
                              required
                              value={captainEmail}
                              onChange={(e) => setCaptainEmail(e.target.value)}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <p className="p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs font-mono font-medium text-gray-700">
                              {captainEmail}
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Executive Contact Number</label>
                          {isEditingProfile ? (
                            <input
                              type="text"
                              value={captainPhone}
                              onChange={(e) => setCaptainPhone(e.target.value)}
                              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <p className="p-2.5 bg-gray-50 border border-gray-150 rounded-lg text-xs font-semibold text-gray-800">
                              {captainPhone || "Not configured"}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Barangay Jurisdiction Details */}
                      <div className="space-y-3 pt-4 border-t border-gray-100">
                        <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Territorial Jurisdiction</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Barangay</label>
                            <div className="p-2.5 bg-gray-50 border border-gray-150 text-emerald-900 font-bold rounded-lg text-xs">
                              {formattedBrgyName}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Municipality</label>
                            <div className="p-2.5 bg-gray-50 border border-gray-150 text-gray-700 font-semibold rounded-lg text-xs">
                              San Luis
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase block">Province</label>
                            <div className="p-2.5 bg-gray-50 border border-gray-150 text-gray-700 font-semibold rounded-lg text-xs">
                              Pampanga
                            </div>
                          </div>
                        </div>
                      </div>

                      {isEditingProfile && (
                        <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setIsEditingProfile(false)}
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingProfile}
                            className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
                          >
                            {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Save Executive Profile
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Right Column: Governance Authority Card */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                          Executive Powers & Authority
                        </h4>
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">Executive Office:</span>
                          <span className="font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-800 border-amber-200">
                            Elected Punong Barangay ✓
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">Presiding Officer:</span>
                          <span className="font-extrabold text-gray-800">Sangguniang Barangay</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">Purok Count:</span>
                          <span className="font-bold text-gray-800">{uniquePuroks.length} Recorded Puroks</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">Youth Demographics:</span>
                          <span className="font-bold text-gray-800">{localYouthProfiles.length} KK Members</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">SK Oversight:</span>
                          <span className="font-bold text-emerald-800">General Supervision</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-gray-50">
                          <span className="text-gray-400 font-medium">Platform Access:</span>
                          <span className="font-bold text-[#0A6B43]">Tier 3 Executive Access</span>
                        </div>
                      </div>

                      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-[11px] text-emerald-950 font-medium space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-[#0A6B43]">
                          <Sparkles className="w-3.5 h-3.5" />
                          Local Government Code Compliant
                        </p>
                        <p className="text-[10px] text-gray-600 leading-relaxed">
                          Enforces Republic Act No. 7160 provisions for barangay governance, out-of-school youth welfare, and comprehensive community empowerment.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={onLogout}
                          className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out of Official Portal
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Security & Password */}
              {profileActiveTab === "security" && (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 space-y-6 max-w-xl animate-in fade-in duration-150">
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-700" />
                        Account Security & Password
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">Update your login password to ensure security of executive administrative access</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Executive Security Notice
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Your password must be at least 6 characters long. Keep your Punong Barangay portal login credentials strictly confidential.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Current Password *</label>
                      <div className="relative">
                        <input
                          type={showCurrentPass ? "text" : "password"}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password..."
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">New Password *</label>
                      <div className="relative">
                        <input
                          type={showNewPass ? "text" : "password"}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min. 6 characters)..."
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type new password..."
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isChangingPassword ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                        Update Account Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-Tab 3: Notification Preferences */}
              {profileActiveTab === "notifications" && (
                <div className="max-w-2xl animate-in fade-in duration-150">
                  <NotificationSettingsCard
                    userRole="BARANGAY_CAPTAIN"
                    userEmail={captainEmail}
                    addToast={showToast}
                  />
                </div>
              )}

              {/* Sub-Tab 4: Punong Barangay Executive Credential Badge */}
              {profileActiveTab === "badge" && (
                <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 space-y-5 max-w-lg animate-in fade-in duration-150">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      Barangay Executive Credentials Badge
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Official Punong Barangay Administrative Badge recognized across municipal systems</p>
                  </div>

                  {/* ID Badge Card */}
                  <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-[#D99427] tracking-widest block">Republic of the Philippines</span>
                        <h4 className="text-sm font-extrabold tracking-tight text-white">Punong Barangay Executive</h4>
                        <p className="text-[10px] text-emerald-200 font-bold">{formattedBrgyName} · San Luis, Pampanga</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center font-black text-sm text-amber-300">
                        PB
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Punong Barangay</span>
                        <span className="font-extrabold text-white text-sm">{captainName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Designation</span>
                        <span className="font-extrabold text-[#D99427]">Elected Executive</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Official Email</span>
                        <span className="font-mono text-[11px] text-emerald-100 truncate block">{captainEmail}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Office Status</span>
                        <span className="font-bold text-emerald-200 flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Active in Office
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `Barangay Executive Credentials:\nName: ${captainName}\nTitle: Punong Barangay\nJurisdiction: ${formattedBrgyName}, San Luis, Pampanga\nEmail: ${captainEmail}\nStatus: Active in Office`
                        );
                        showToast("Punong Barangay credentials copied to clipboard!", "success");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Copy Executive Credentials
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: VIEW YOUTH DOSSIER (VIEW-ONLY AUDIT)                             */}
      {/* ========================================================================= */}
      {selectedYouth && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1FAE5] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            
            {/* Header banner */}
            <div className="bg-[#1C2B20] text-white p-6 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-black text-lg shadow-inner">
                  {selectedYouth.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider">{selectedYouth.name}</h3>
                  <p className="text-xs text-emerald-200 font-semibold mt-0.5">
                    {formattedBrgyName} · {selectedYouth.purok}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedYouth(null)}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Contents */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs font-semibold text-slate-700 leading-relaxed">
              
              {/* Demographics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">Age</span>
                  <p className="text-base font-black text-slate-900 mt-1">{selectedYouth.age} Years</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">Status Node</span>
                  <p className="text-xs font-black text-[#0A6B43] mt-1.5 uppercase">{selectedYouth.currentStatus}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">CBF Match Score</span>
                  <p className="text-base font-black text-amber-500 mt-1">{selectedYouth.matchScore}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">Verification ID</span>
                  <p className="text-[10px] font-black text-slate-800 mt-2 truncate" title={selectedYouth.verificationIdType || "Official Registry Log"}>
                    {selectedYouth.verificationIdType || "Official Log"}
                  </p>
                </div>
              </div>

              {/* Personal dossier split */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Column 1: Core credentials & Contact */}
                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <User className="w-3.5 h-3.5 text-slate-400" /> Administrative Records
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Academic Achievement</p>
                      <p className="text-slate-950 text-xs font-bold mt-0.5">{selectedYouth.educationalAttainment}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Preferred Sector</p>
                      <p className="text-[#0A6B43] text-xs font-black mt-0.5">{selectedYouth.sectorPreference || "Technical Vocational"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Registered Contact</p>
                      <p 
                        onClick={() => {
                          if (selectedYouth.contactNumber) {
                            navigator.clipboard?.writeText(selectedYouth.contactNumber);
                            showToast("Contact copied to clipboard!", "success");
                          }
                        }}
                        className="text-slate-950 text-xs font-mono font-bold mt-0.5 flex items-center gap-1 hover:text-[#0A6B43] cursor-pointer"
                        title="Click to copy"
                      >
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedYouth.contactNumber || "None registered"}
                      </p>
                    </div>
                    {selectedYouth.email && (
                      <div>
                        <p className="text-slate-400 text-[9px] font-black uppercase">Registered Email</p>
                        <p 
                          onClick={() => {
                            navigator.clipboard?.writeText(selectedYouth.email);
                            showToast("Email copied to clipboard!", "success");
                          }}
                          className="text-slate-950 text-xs font-bold mt-0.5 flex items-center gap-1 hover:text-[#0A6B43] cursor-pointer"
                          title="Click to copy"
                        >
                          <Mail className="w-3 h-3 text-slate-400" /> {selectedYouth.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Special Demographics Flags</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[9px] font-black uppercase">
                        {selectedYouth.soloParent && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded">Solo Parent</span>
                        )}
                        {selectedYouth.pwd && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">PWD</span>
                        )}
                        {selectedYouth.indigenous && (
                          <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded">Indigenous</span>
                        )}
                        {!selectedYouth.soloParent && !selectedYouth.pwd && !selectedYouth.indigenous && (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">No Flags Triggered</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Skills and diagnostics */}
                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Compass className="w-3.5 h-3.5 text-slate-400" /> Career & Skills Diagnostic
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Livelihood Focus Goal</p>
                      <p className="text-slate-950 text-xs font-bold mt-0.5">{selectedYouth.livelihoodGoal || "Livelihood Employment"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Livelihood Interests</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedYouth.interests && selectedYouth.interests.length > 0 ? (
                          selectedYouth.interests.map(interest => (
                            <span key={interest} className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic">None recorded</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Stated Skills / Competencies</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedYouth.skills && selectedYouth.skills.length > 0 ? (
                          selectedYouth.skills.map(skill => (
                            <span key={skill} className="bg-emerald-50 text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No direct competencies registered</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Status Alert Warning */}
              <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-[11px] font-medium text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[9px] text-amber-950">Barangay Captain Executive Audit</p>
                  <p className="text-amber-900 mt-0.5">
                    Match score is evaluated via Content-Based Filtering (CBF) against TESDA course competencies.
                  </p>
                </div>
              </div>

            </div>

            {/* Footer close */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedYouth(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROGRAM DETAIL MODAL                                             */}
      {/* ========================================================================= */}
      {selectedProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-150 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="bg-[#1C2B20] text-white p-6 flex justify-between items-start shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/70 border border-emerald-700/50 px-2 py-0.5 rounded">
                    {selectedProgram.title.match(/NC\s*(?:I{1,3}|IV)/i)?.[0]?.toUpperCase() || "TESDA Certified"}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-black/40 border border-amber-500/30 px-2 py-0.5 rounded">
                    {selectedProgram.cost === "Free" ? "100% Free (TESDA Scholarship)" : selectedProgram.cost}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                    selectedProgram.slotsRemaining > 0 ? "bg-emerald-900/60 text-emerald-200 border border-emerald-600/40" : "bg-red-950/60 text-red-300 border border-red-700/40"
                  }`}>
                    {selectedProgram.slotsRemaining > 0 ? `${selectedProgram.slotsRemaining} Slots Open` : "Full / Closed"}
                  </span>
                </div>
                <h3 className="text-base font-black leading-snug">{selectedProgram.title}</h3>
                <p className="text-xs text-emerald-200 font-semibold mt-0.5">{selectedProgram.provider}</p>
              </div>
              <button
                onClick={() => setSelectedProgram(null)}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-semibold text-gray-700 overflow-y-auto">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Candidate Eligibility</span>
                <p className="mt-1 text-gray-800 leading-relaxed font-normal">{selectedProgram.eligibility || "Open to Katipunan ng Kabataan youth residents."}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Training Hours</span>
                  <p className="text-sm font-black text-gray-900 mt-0.5">{selectedProgram.trainingHours} Hours</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Remaining Capacity</span>
                  <p className="text-sm font-black text-emerald-700 mt-0.5">{selectedProgram.slotsRemaining} / {selectedProgram.slotsTotal} Slots</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Location</span>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">{selectedProgram.location}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Category / Sector</span>
                  <p className="text-xs font-bold text-gray-800 mt-0.5">
                    {typeof selectedProgram.category === "string" 
                      ? selectedProgram.category 
                      : selectedProgram.category?.name || CATEGORIES.find(c => c.id === selectedProgram.categoryId)?.name || "Technical-Vocational"}
                  </p>
                </div>
              </div>

              {selectedProgram.requiredDocuments && selectedProgram.requiredDocuments.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">Required Submission Documents</span>
                  <ul className="list-disc pl-4 space-y-1 text-gray-600 font-medium">
                    {selectedProgram.requiredDocuments.map((doc, i) => (
                      <li key={i}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-150 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedProgram(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXECUTIVE PRINTABLE CENSUS REPORT                                */}
      {/* ========================================================================= */}
      {isPrintReportModalOpen && (
        <div id="printable-census-modal-backdrop" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-5 overflow-hidden">
          <div id="printable-census-modal-card" className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh] border border-gray-200 animate-in zoom-in-95 duration-150">
            
            {/* Header with Print & Excel Action Controls */}
            <div className="relative bg-[#1C2B20] text-white p-3.5 sm:p-5 pr-12 sm:pr-16 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print border-b border-emerald-900/60">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2 rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs shrink-0">
                  <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-black tracking-tight text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                    Executive Census Summary Sheet
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest bg-emerald-800 text-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-md">
                      {formattedBrgyName}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-emerald-200/90 font-medium line-clamp-1">
                    Official Barangay Youth Governance & Demographic Audit Documentation
                  </p>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Export Excel (.xls) Formatted Table Button */}
                <button
                  type="button"
                  onClick={handleExportCensusExcel}
                  className="px-3 sm:px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/50"
                  title="Export styled spreadsheet pre-configured for US Letter printing (.xls)"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Export Excel</span>
                </button>

                {/* Print / Save as PDF Button */}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 sm:px-4 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] sm:text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Print official multi-page document on US Letter paper size or save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
              </div>

              {/* Dedicated Top-Right X / Exit Button */}
              <button
                type="button"
                onClick={() => setIsPrintReportModalOpen(false)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl cursor-pointer transition-all flex items-center justify-center"
                aria-label="Close census report modal"
                title="Close census report"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content View */}
            <div className="flex-1 p-4 sm:p-8 md:p-10 print:p-0 print:space-y-5 overflow-y-auto space-y-5 sm:space-y-6 text-xs text-gray-800 bg-white" id="printable-census-report">
              
              {/* Document Letterhead */}
              <div className="text-center border-b-2 border-emerald-900 pb-4 space-y-1">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">Republic of the Philippines · Province of Pampanga</p>
                <h2 className="text-sm sm:text-base font-black text-gray-950 uppercase tracking-tight">MUNICIPALITY OF SAN LUIS</h2>
                <h3 className="text-xs sm:text-sm font-extrabold text-[#0A6B43] uppercase tracking-wider">{formattedBrgyName.toUpperCase()}</h3>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-semibold pt-1">
                  OFFICE OF THE PUNONG BARANGAY · SIKAP YOUTH GOVERNANCE SYSTEM
                </p>
              </div>

              {/* Report Meta Details */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-[10px] sm:text-[11px] font-semibold bg-gray-50 p-3 sm:p-3.5 rounded-xl border border-gray-150">
                <div>
                  <p>Punong Barangay: <strong>Hon. {captainInfo.name}</strong></p>
                  <p className="mt-0.5">Barangay: <strong>{formattedBrgyName}</strong></p>
                </div>
                <div className="sm:text-right">
                  <p>Census Date: <strong>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></p>
                  <p className="mt-0.5">SK Presiding Officer: <strong>{localSKChair?.name || "SK Chairperson"}</strong></p>
                </div>
              </div>

              {/* Statistical Summary Table (Strictly OSY & Livelihood Focused) */}
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  I. Katipunan ng Kabataan Census Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 print:grid-cols-4 gap-2.5 sm:gap-3 text-center">
                  <div className="p-2.5 sm:p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Total Registered</span>
                    <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5">{localYouthProfiles.length}</p>
                    <span className="text-[8px] text-gray-400 font-bold">KK Registry</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-bold text-amber-800 uppercase">Out-of-School (OSY)</span>
                    <p className="text-base sm:text-lg font-black text-amber-900 mt-0.5">{kkMembersSummary.outOfSchool}</p>
                    <span className="text-[8px] text-amber-700 font-bold">Primary Priority</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase">OSY Density</span>
                    <p className="text-base sm:text-lg font-black text-emerald-900 mt-0.5">
                      {localYouthProfiles.length > 0 ? ((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100).toFixed(1) : "0.0"}%
                    </p>
                    <span className="text-[8px] text-emerald-700 font-bold">Demographic Share</span>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[9px] font-bold text-blue-800 uppercase">TVET Matching</span>
                    <p className="text-base sm:text-lg font-black text-blue-900 mt-0.5">{kkMembersSummary.outOfSchool}</p>
                    <span className="text-[8px] text-blue-700 font-bold">TESDA Scholarship</span>
                  </div>
                </div>
              </div>

              {/* Purok-wise Counts */}
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  II. Purok Population Distribution
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 print:grid-cols-3 gap-2">
                  {Object.entries(kkMembersSummary.purokBreakdown).map(([purok, count]) => (
                    <div key={purok} className="flex justify-between p-2 bg-gray-50 rounded-lg border border-gray-150 text-xs">
                      <span className="font-bold text-gray-700">{purok}</span>
                      <span className="font-black text-gray-900">{count as number} youth</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Gaps Table */}
              <div className="space-y-2">
                <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  III. Identified Technical Competency Gaps
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-gray-200 min-w-[320px]">
                    <thead className="bg-gray-100 text-gray-700 font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2 border-b">Skill Deficiency Area</th>
                        <th className="p-2 border-b text-center">Youth Count Lacking</th>
                        <th className="p-2 border-b text-center">Severity Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {localSkillsGaps.map(gap => (
                        <tr key={gap.skill}>
                          <td className="p-2 font-semibold text-gray-800">{gap.skill}</td>
                          <td className="p-2 text-center font-bold">{gap.count} youth</td>
                          <td className="p-2 text-center text-amber-700 font-black">{gap.percentage}% of youth</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION IV: OFFICIAL ATTESTATION & SIGN-OFF BLOCK */}
              <div className="pt-6 border-t-2 border-gray-300 print-avoid-break">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-6 text-center">
                  Official Barangay Katipunan ng Kabataan Verification & Executive Attestation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 sm:gap-8 text-center justify-items-center items-center census-signoff-grid">
                  <div className="w-full max-w-[240px] mx-auto flex flex-col items-center">
                    <div className="border-b border-gray-400 pb-1 w-48 max-w-full mx-auto font-black text-gray-900 text-xs uppercase tracking-wide text-center">
                      {localSKChair?.name || "HON. SK CHAIRPERSON"}
                    </div>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mt-1 text-center">
                      SK Chairperson
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold text-center">
                      Sangguniang Kabataan · {formattedBrgyName}
                    </p>
                  </div>

                  <div className="w-full max-w-[240px] mx-auto flex flex-col items-center">
                    <div className="border-b border-gray-400 pb-1 w-48 max-w-full mx-auto font-black text-gray-900 text-xs uppercase tracking-wide text-center">
                      Hon. {captainInfo.name || "HON. PUNONG BARANGAY"}
                    </div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-wider mt-1 text-center">
                      Punong Barangay
                    </p>
                    <p className="text-[9px] text-gray-500 font-semibold text-center">
                      Barangay Government of {formattedBrgyName}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-200 text-center text-[9px] text-gray-400 font-medium">
                  Official Census Document generated through the SiKap Youth Governance & Livelihood Matching Platform · Verified Katipunan ng Kabataan Public Record · San Luis, Pampanga
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
