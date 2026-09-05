"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Award,
  Briefcase,
  ChevronRight,
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
  Eye,
  Calendar,
  Building2,
  HelpCircle,
  RefreshCw
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import {
  YouthProfile,
  ReferralPipelineItem,
  OfficialAccount,
  TESDAProgram,
  Councilor,
  BarangayCaptainScreen
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
  
  // Selected Profile for Dossier Modal
  const [selectedYouth, setSelectedYouth] = useState<YouthProfile | null>(null);
  
  // Selected Program for Program Detail Modal
  const [selectedProgram, setSelectedProgram] = useState<TESDAProgram | null>(null);

  // Notifications State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Print Report Modal State
  const [isPrintReportModalOpen, setIsPrintReportModalOpen] = useState(false);

  // Search & Filter state for KK Youth Directory
  const [youthSearch, setYouthSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All");
  const [eduFilter, setEduFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [specialFilter, setSpecialFilter] = useState("All");
  const [youthViewMode, setYouthViewMode] = useState<"table" | "grid">("table");

  // Search & Filter state for TESDA Programs
  const [tesdaSearch, setTesdaSearch] = useState("");
  const [tesdaTypeFilter, setTesdaTypeFilter] = useState("All");
  const [tesdaCostFilter, setTesdaCostFilter] = useState("All");

  // Search & Filter state for SK Council Oversight
  const [councilSearch, setCouncilSearch] = useState("");
  const [councilRoleFilter, setCouncilRoleFilter] = useState("All");

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

  // Dynamic local youth profiles
  const localYouthProfiles = useMemo(() => {
    return youthProfiles.filter(y => 
      y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [youthProfiles, cleanBrgy]);

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
    const edus = new Set<string>();
    localYouthProfiles.forEach(y => {
      if (y.educationalAttainment) edus.add(y.educationalAttainment);
    });
    return Array.from(edus).sort();
  }, [localYouthProfiles]);

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
      const matchesEdu = eduFilter === "All" || y.educationalAttainment === eduFilter;
      
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

  // Filtered TESDA Programs
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const q = tesdaSearch.toLowerCase();
      const catName = typeof p.category === "string" ? p.category : p.category?.name || "";
      const matchesSearch = 
        p.title.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q);
      
      const matchesType = tesdaTypeFilter === "All" || p.type === tesdaTypeFilter;
      const matchesCost = tesdaCostFilter === "All" || p.cost === tesdaCostFilter;
      return matchesSearch && matchesType && matchesCost;
    });
  }, [programs, tesdaSearch, tesdaTypeFilter, tesdaCostFilter]);

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
      eduBreakdown[y.educationalAttainment] = (eduBreakdown[y.educationalAttainment] || 0) + 1;
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

  return (
    <div className="flex h-screen bg-[#FAFAF8] text-slate-800 font-sans antialiased overflow-hidden" id="captain-portal-container">
      
      {/* ========================================================================= */}
      {/* SIDEBAR NAVIGATION (FIXED & CONSISTENT WITH SYSTEM ARCHITECTURE)          */}
      {/* ========================================================================= */}
      <aside className="w-64 h-screen shrink-0 sticky top-0 bg-[#1C2B20] text-white flex flex-col justify-between shadow-lg z-20 select-none overflow-hidden">
        <div className="p-6 overflow-y-auto min-h-0 flex-1">
          {/* Logo & Barangay Brand */}
          <div className="flex items-center gap-2 mb-8">
            <SikapLogo size={32} variant="white" showText={true} />
            <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block leading-none">Captain</span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[105px]" title={formattedBrgyName}>
                {formattedBrgyName.replace(/^Barangay\s+/i, "")}
              </span>
            </div>
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
            onClick={() => setCurrentScreen(BarangayCaptainScreen.PROFILE)}
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
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-30 px-8 py-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Executive Governance
              </span>
              <span className="text-xs font-bold text-gray-500">
                {formattedBrgyName} · San Luis, Pampanga
              </span>
            </div>
            <h1 className="text-base font-black text-gray-900 mt-0.5">
              Good day, {captainInfo.name.split(" ")[0]} 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Print Census / Summary Report Action */}
            <button
              onClick={() => setIsPrintReportModalOpen(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Print Executive Census Summary Report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Print Census Report</span>
            </button>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200 transition-all cursor-pointer ${
                  showNotifications ? "ring-2 ring-emerald-500 bg-white" : ""
                }`}
                title="Barangay Governance Notifications"
              >
                <Bell className="w-4 h-4" />
                {!notificationsRead && (localYouthProfiles.length > 0 || programs.length > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 py-3 text-xs overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/70 p-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-gray-900 text-sm">Barangay Executive Alerts</span>
                      </div>
                      <button
                        onClick={() => setNotificationsRead(true)}
                        className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      <div
                        onClick={() => { setCurrentScreen(BarangayCaptainScreen.YOUTH_DIRECTORY); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[#0A6B43] shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Katipunan ng Kabataan Roster</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {localYouthProfiles.length} youth registered in {formattedBrgyName}. {kkMembersSummary.outOfSchool} are tagged as Out-of-School Youth (OSY).
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setCurrentScreen(BarangayCaptainScreen.SK_COUNCIL); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-800 shrink-0 mt-0.5">
                          <Users2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Sangguniang Kabataan Council</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {localCouncilors.length} council members appointed under Presiding Officer {localSKChair?.name || "SK Chairperson"}.
                          </p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setCurrentScreen(BarangayCaptainScreen.TESDA_PROGRAMS); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-800 shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Municipal TESDA Programs</p>
                          <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                            {programs.length} active livelihood and technical training courses available across San Luis.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
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

              {/* 4 Executive KPI Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Stat 1: Total KK Youth */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Registered KK Youth</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center border border-emerald-100">
                      <Users className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-gray-900">{localYouthProfiles.length}</span>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        Census Logged
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      Ages 15–30 residing in {formattedBrgyName}
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#0A6B43] h-full rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* Stat 2: OSY Youth */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:border-amber-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Out-of-School (OSY)</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-100">
                      <AlertCircle className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-amber-600">{kkMembersSummary.outOfSchool}</span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        {localYouthProfiles.length > 0 ? Math.round((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100) : 0}% of Total
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      High priority for TESDA livelihood programs
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
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:border-teal-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">SK Council Officers</span>
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center border border-teal-100">
                      <Users2 className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-gray-900">
                        {localCouncilors.length + (localSKChair ? 1 : 0)}
                      </span>
                      <span className="text-xs font-bold text-gray-400">/ 10 Total</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      {localSKChair ? "Chairperson ✓" : "No Chair"} • {localCouncilors.length} Appointees
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(((localCouncilors.length + (localSKChair ? 1 : 0)) / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stat 4: Municipal TESDA Programs */}
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TESDA Courses Open</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
                      <Briefcase className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-gray-900">{programs.length}</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        San Luis
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium mt-1">
                      {localReferrals.length} local youth applications submitted
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
                <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs lg:col-span-2 space-y-6">
                  <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#0A6B43]" />
                        Katipunan ng Kabataan Demographics & Activity
                      </h3>
                      <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                        Census distribution of youth residing in {formattedBrgyName}
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                      Live Census Ledger
                    </span>
                  </div>

                  {localYouthProfiles.length > 0 ? (
                    <div className="space-y-6">
                      
                      {/* Primary 5-Status Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="bg-amber-50 border-2 border-amber-400 p-3 rounded-xl text-center shadow-xs">
                          <span className="text-[9px] font-black uppercase tracking-wider text-amber-900 block">
                            ★ OSY Youth
                          </span>
                          <h5 className="text-xl font-black text-amber-950 mt-1">{kkMembersSummary.outOfSchool}</h5>
                          <p className="text-[9px] text-amber-700 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100)}% of total
                          </p>
                        </div>
                        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800 block">Employed</span>
                          <h5 className="text-xl font-black text-blue-950 mt-1">{kkMembersSummary.employed}</h5>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.employed / localYouthProfiles.length) * 100)}%
                          </p>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-800 block">Self-Employed</span>
                          <h5 className="text-xl font-black text-indigo-950 mt-1">{kkMembersSummary.selfEmployed}</h5>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.selfEmployed / localYouthProfiles.length) * 100)}%
                          </p>
                        </div>
                        <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">Graduates</span>
                          <h5 className="text-xl font-black text-emerald-950 mt-1">{kkMembersSummary.graduate}</h5>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.graduate / localYouthProfiles.length) * 100)}%
                          </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 block">In-School</span>
                          <h5 className="text-xl font-black text-slate-900 mt-1">{kkMembersSummary.inSchool}</h5>
                          <p className="text-[9px] text-gray-400 mt-0.5 font-bold">
                            {Math.round((kkMembersSummary.inSchool / localYouthProfiles.length) * 100)}%
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
              <div className="bg-white border border-gray-150 p-6 rounded-2xl shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-wider">
                      Recent Youth Registrations
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold mt-0.5">
                      Latest Katipunan ng Kabataan registrants in {formattedBrgyName}
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen(BarangayCaptainScreen.YOUTH_DIRECTORY)}
                    className="text-xs font-bold text-[#0A6B43] hover:text-emerald-800 flex items-center gap-1 hover:underline uppercase tracking-wider cursor-pointer"
                  >
                    Full Directory ({localYouthProfiles.length}) <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
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
                      {localYouthProfiles.length > 0 ? (
                        localYouthProfiles.slice(0, 5).map((y) => (
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
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 2: KK YOUTH DIRECTORY (VIEW & AUDIT ONLY)                      */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.YOUTH_DIRECTORY && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Official Census Registry
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      • {formattedBrgyName}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#0A6B43]" />
                    Katipunan ng Kabataan Directory
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Comprehensive roster of all registered youth residents in {formattedBrgyName}. View-only audit mode enabled.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                  {/* View Switcher */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                    <button
                      onClick={() => setYouthViewMode("table")}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        youthViewMode === "table"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="Table View"
                    >
                      <Table className="w-4 h-4" />
                      <span className="hidden md:inline">Table</span>
                    </button>
                    <button
                      onClick={() => setYouthViewMode("grid")}
                      className={`p-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        youthViewMode === "grid"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-gray-500 hover:text-gray-800"
                      }`}
                      title="Grid Cards View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                      <span className="hidden md:inline">Grid</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsPrintReportModalOpen(true)}
                    className="bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
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
                    <select
                      value={purokFilter}
                      onChange={(e) => setPurokFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs font-semibold"
                    >
                      <option value="All">All Puroks ({uniquePuroks.length})</option>
                      {uniquePuroks.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs font-semibold"
                    >
                      <option value="All">All Activity Statuses</option>
                      <option value="Out-of-school">Out-of-school (OSY)</option>
                      <option value="In-school">In-school / Student</option>
                      <option value="Employed">Employed</option>
                      <option value="Self-employed">Self-employed</option>
                      <option value="College Graduate">College Graduate</option>
                    </select>
                  </div>

                  {/* Special Vulnerability Filter */}
                  <div className="relative">
                    <select
                      value={specialFilter}
                      onChange={(e) => setSpecialFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs font-semibold"
                    >
                      <option value="All">All Demographics</option>
                      <option value="Solo Parent">Solo Parents</option>
                      <option value="PWD">PWD Youth</option>
                      <option value="Indigenous">Indigenous</option>
                    </select>
                  </div>

                </div>

                {/* Filter Summary Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
                  <span className="text-gray-500 font-medium">
                    Showing <strong>{filteredYouthProfiles.length}</strong> of <strong>{localYouthProfiles.length}</strong> youth records in {formattedBrgyName}
                  </span>
                  {(youthSearch || purokFilter !== "All" || statusFilter !== "All" || specialFilter !== "All") && (
                    <button
                      onClick={() => {
                        setYouthSearch("");
                        setPurokFilter("All");
                        setStatusFilter("All");
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
                <div className="bg-white border border-gray-150 rounded-2xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
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
                      setStatusFilter("All");
                      setSpecialFilter("All");
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : youthViewMode === "table" ? (
                /* TABLE VIEW */
                <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
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
                        {filteredYouthProfiles.map((y) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredYouthProfiles.map((y) => (
                    <div
                      key={y.id}
                      className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
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

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 3: SK COUNCIL & GOVERNANCE OVERSIGHT                           */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.SK_COUNCIL && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Sangguniang Barangay Oversight
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      • {formattedBrgyName}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Users2 className="w-6 h-6 text-[#0A6B43]" />
                    Sangguniang Kabataan Council Roster
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Oversight of SK officials, appointed officers, and administrative access for {formattedBrgyName}.
                  </p>
                </div>
              </div>

              {/* SK Chairperson Spotlight Banner */}
              <div className="bg-gradient-to-r from-[#1C2B20] to-[#122417] text-white p-6 rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      {localSKChair ? localSKChair.name.charAt(0) : "SK"}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-900/60 border border-amber-500/40 px-2.5 py-0.5 rounded-md">
                          Ex-Officio Sangguniang Barangay Member
                        </span>
                        <span className="text-[10px] font-bold text-emerald-300">
                          {localSKChair?.status || "Active"}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">
                        {localSKChair ? localSKChair.name : "SK Chairperson Seat Pending"}
                      </h3>
                      <p className="text-xs text-emerald-100/80 font-medium">
                        Presiding Officer of the Sangguniang Kabataan and youth representative to the Barangay Council.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                        <span className="text-emerald-200 font-mono">
                          Email: <strong className="text-white">{localSKChair?.email || "chairperson@sanluispampanga.gov.ph"}</strong>
                        </span>
                        <span className="text-emerald-200">
                          Jurisdiction: <strong className="text-white">{formattedBrgyName}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        if (localSKChair?.email) {
                          navigator.clipboard?.writeText(localSKChair.email);
                          showToast("Chairperson email copied!", "success");
                        }
                      }}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      Copy Email
                    </button>
                  </div>
                </div>
              </div>

              {/* Council Members Toolbar & Grid */}
              <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search council member name or email..."
                      value={councilSearch}
                      onChange={(e) => setCouncilSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden text-xs"
                    />
                  </div>

                  {/* Role filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {["All", "SK Councilor", "Secretary", "Treasurer"].map((rf) => (
                      <button
                        key={rf}
                        onClick={() => setCouncilRoleFilter(rf)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          councilRoleFilter === rf
                            ? "bg-[#0A6B43] text-white shadow-2xs font-extrabold"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {rf === "All" ? "All Appointees" : rf}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredCouncilors.length === 0 ? (
                  <div className="p-10 text-center text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-2xl">
                    No council members registered or matching filter in {formattedBrgyName}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {filteredCouncilors.map((c) => {
                      const isSecretary = c.role.toLowerCase().includes("secretary");
                      const isTreasurer = c.role.toLowerCase().includes("treasurer");

                      const roleBadgeClass = isSecretary
                        ? "bg-amber-50 text-amber-900 border-amber-200"
                        : isTreasurer
                        ? "bg-indigo-50 text-indigo-900 border-indigo-200"
                        : "bg-emerald-50 text-emerald-900 border-emerald-200";

                      return (
                        <div
                          key={c.id}
                          className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:border-emerald-300 transition-all space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${roleBadgeClass}`}>
                              {c.role}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              {c.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                              {c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-extrabold text-gray-900 text-sm truncate" title={c.name}>
                                {c.name}
                              </h4>
                              <p className="text-[11px] text-gray-400 truncate">
                                {formattedBrgyName}
                              </p>
                            </div>
                          </div>

                          <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-150 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Email:</span>
                              <span
                                onClick={() => {
                                  navigator.clipboard?.writeText(c.email);
                                  showToast("Email copied to clipboard!", "success");
                                }}
                                className="font-mono text-[11px] text-gray-800 hover:text-[#0A6B43] hover:underline cursor-pointer truncate max-w-[170px]"
                                title="Click to copy"
                              >
                                {c.email}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Contact:</span>
                              <span
                                onClick={() => {
                                  if (c.contactNumber) {
                                    navigator.clipboard?.writeText(c.contactNumber);
                                    showToast("Contact copied to clipboard!", "success");
                                  }
                                }}
                                className="font-semibold text-[11px] text-gray-800 hover:text-[#0A6B43] cursor-pointer"
                                title="Click to copy"
                              >
                                {c.contactNumber || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-gray-200/50 text-[10px] text-gray-400">
                              <span>Appointed:</span>
                              <span className="font-semibold text-gray-600">{c.dateCreated || "Active Term"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 4: YOUTH PROGRAM APPLICATIONS                                  */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.APPLICATIONS && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Direct Program Applications
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      • {formattedBrgyName}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#0A6B43]" />
                    TESDA Program Applications & Enrollees
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Track Katipunan ng Kabataan youth from {formattedBrgyName} who applied directly for technical courses and training certifications.
                  </p>
                </div>

                <div className="text-xs font-bold text-gray-500">
                  Total Applications: <strong className="text-emerald-700 text-sm">{localReferrals.length} Youth</strong>
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
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                      Technical Vocational Directory
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      • San Luis & Pampanga
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    TESDA Municipal Programs & Courses
                  </h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Directory of certified skills programs available for Katipunan ng Kabataan youth in your jurisdiction.
                  </p>
                </div>

                <div className="text-xs font-bold text-gray-500">
                  Active Listings: <strong className="text-blue-700 text-sm">{programs.length} Programs</strong>
                </div>
              </div>

              {/* SEARCH & FILTERS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold bg-white p-4 rounded-2xl border border-gray-150 shadow-xs">
                {/* Search Programs */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search program title, provider, location..."
                    value={tesdaSearch}
                    onChange={(e) => setTesdaSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:bg-white focus:outline-hidden text-xs"
                  />
                </div>

                {/* Filter Program Type */}
                <div className="relative">
                  <select
                    value={tesdaTypeFilter}
                    onChange={(e) => setTesdaTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All Program Types</option>
                    <option value="Training">Training Courses</option>
                    <option value="Employment">Employment Programs</option>
                    <option value="Entrepreneurship">Entrepreneurship Grants</option>
                  </select>
                </div>

                {/* Filter Program Cost */}
                <div className="relative">
                  <select
                    value={tesdaCostFilter}
                    onChange={(e) => setTesdaCostFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All Costs</option>
                    <option value="Free">Free / 100% Scholarship</option>
                    <option value="Subsidized">Subsidized</option>
                    <option value="With Fee">With Fee</option>
                  </select>
                </div>
              </div>

              {/* PROGRAM CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((prog) => (
                    <div
                      key={prog.id}
                      className="border border-gray-200 hover:border-emerald-400 rounded-2xl p-5 bg-white transition-all shadow-xs hover:shadow-md relative flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                            prog.type === "Training"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : prog.type === "Employment"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {prog.type}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            prog.cost === "Free"
                              ? "bg-emerald-100 text-emerald-800"
                              : prog.cost === "Subsidized"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {prog.cost}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm text-gray-900 line-clamp-1" title={prog.title}>
                            {prog.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            {prog.provider}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-100 space-y-2 text-[11px] font-semibold text-gray-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {prog.location}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" /> Duration: <strong className="text-gray-800">{prog.trainingHours} hours</strong>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-[10px] font-bold">
                        <div>
                          <p className="text-gray-400 uppercase tracking-wider text-[8px] font-black">Remaining Slots</p>
                          <p className="text-xs font-black text-gray-800 mt-0.5">{prog.slotsRemaining} / {prog.slotsTotal}</p>
                        </div>
                        <button
                          onClick={() => setSelectedProgram(prog)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-emerald-800 font-bold text-[11px] rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors cursor-pointer"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-400 font-semibold border-2 border-dashed border-gray-200 rounded-2xl bg-white">
                    No TESDA programs match your current search filters.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================== */}
          {/* SCREEN 6: EXECUTIVE PROFILE & AUDIT                                   */}
          {/* ===================================================================== */}
          {currentScreen === BarangayCaptainScreen.PROFILE && (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
              
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs">
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Shield className="w-6 h-6 text-[#0A6B43]" />
                  Barangay Executive Profile & Authority
                </h2>
                <p className="text-xs text-gray-500 font-medium mt-1">
                  Official administrative records under Republic Act No. 7160 (Local Government Code of 1991).
                </p>
              </div>

              {/* Profile Card */}
              <div className="bg-white p-8 rounded-2xl border border-gray-150 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-100 pb-6">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-400 shrink-0">
                    {captainInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div className="space-y-1.5 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        Elected Punong Barangay
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        Active In Office
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900">{captainInfo.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Barangay Captain · {formattedBrgyName}, Municipality of San Luis, Pampanga
                    </p>
                    <p className="text-xs font-mono text-gray-600 pt-1">
                      {captainInfo.email}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Jurisdiction Details</span>
                    <p className="text-gray-800">Barangay: <strong>{formattedBrgyName}</strong></p>
                    <p className="text-gray-800">Municipality: <strong>San Luis, Pampanga</strong></p>
                    <p className="text-gray-800">Province: <strong>Pampanga, Region III</strong></p>
                    <p className="text-gray-800">Purok Count: <strong>{uniquePuroks.length} Recorded Puroks</strong></p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Governance Powers</span>
                    <p className="text-gray-800">Presiding Officer: <strong>Sangguniang Barangay</strong></p>
                    <p className="text-gray-800">SK Oversight: <strong>General Administrative Supervision</strong></p>
                    <p className="text-gray-800">Youth Registry Status: <strong>{localYouthProfiles.length} Total KK Members</strong></p>
                    <p className="text-gray-800">Platform Clearance: <strong>Tier 3 Executive Access</strong></p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={onLogout}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out of Official Portal
                  </button>
                </div>
              </div>

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
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-black/35 px-2 py-0.5 rounded">
                  {selectedProgram.type} · {selectedProgram.cost}
                </span>
                <h3 className="text-base font-black mt-2 leading-snug">{selectedProgram.title}</h3>
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
                    {typeof selectedProgram.category === "string" ? selectedProgram.category : selectedProgram.category?.name || "Vocational"}
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-gray-200 animate-in zoom-in-95 duration-150">
            
            {/* Header with Print Action */}
            <div className="bg-[#1C2B20] text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider">Executive Census Summary Sheet</h3>
                  <p className="text-[10px] text-emerald-200">Official Barangay Governance Documentation</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Now
                </button>
                <button
                  onClick={() => setIsPrintReportModalOpen(false)}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Content View */}
            <div className="flex-1 p-8 overflow-y-auto space-y-6 text-xs text-gray-800 bg-white" id="printable-census-report">
              
              {/* Document Letterhead */}
              <div className="text-center border-b-2 border-emerald-900 pb-4 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Republic of the Philippines · Province of Pampanga</p>
                <h2 className="text-base font-black text-gray-950 uppercase tracking-tight">MUNICIPALITY OF SAN LUIS</h2>
                <h3 className="text-sm font-extrabold text-[#0A6B43] uppercase tracking-wider">{formattedBrgyName.toUpperCase()}</h3>
                <p className="text-[10px] text-gray-400 font-semibold pt-1">
                  OFFICE OF THE PUNONG BARANGAY · SIKKAP YOUTH GOVERNANCE SYSTEM
                </p>
              </div>

              {/* Report Meta Details */}
              <div className="flex justify-between items-center text-[11px] font-semibold bg-gray-50 p-3.5 rounded-xl border border-gray-150">
                <div>
                  <p>Punong Barangay: <strong>Hon. {captainInfo.name}</strong></p>
                  <p className="mt-0.5">Barangay: <strong>{formattedBrgyName}</strong></p>
                </div>
                <div className="text-right">
                  <p>Census Date: <strong>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</strong></p>
                  <p className="mt-0.5">SK Presiding Officer: <strong>{localSKChair?.name || "SK Chairperson"}</strong></p>
                </div>
              </div>

              {/* Statistical Summary Table */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  I. Katipunan ng Kabataan Census Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-[9px] font-bold text-gray-500 uppercase">Total Youth</span>
                    <p className="text-lg font-black text-gray-900 mt-0.5">{localYouthProfiles.length}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <span className="text-[9px] font-bold text-amber-800 uppercase">Out-of-School (OSY)</span>
                    <p className="text-lg font-black text-amber-900 mt-0.5">{kkMembersSummary.outOfSchool}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <span className="text-[9px] font-bold text-blue-800 uppercase">Employed / Wage</span>
                    <p className="text-lg font-black text-blue-900 mt-0.5">{kkMembersSummary.employed}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-[9px] font-bold text-emerald-800 uppercase">In-School / Students</span>
                    <p className="text-lg font-black text-emerald-900 mt-0.5">{kkMembersSummary.inSchool}</p>
                  </div>
                </div>
              </div>

              {/* Purok-wise Counts */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  II. Purok Population Distribution
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-900 border-b border-gray-200 pb-1">
                  III. Identified Technical Competency Gaps
                </h4>
                <table className="w-full text-left text-xs border border-gray-200">
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

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs font-semibold">
                <div>
                  <div className="border-b border-gray-800 pb-1 w-48 mx-auto" />
                  <p className="font-black text-gray-950 mt-1">{localSKChair?.name || "SK Chairperson"}</p>
                  <p className="text-[10px] text-gray-500">SK Chairperson, {formattedBrgyName}</p>
                </div>
                <div>
                  <div className="border-b border-gray-800 pb-1 w-48 mx-auto" />
                  <p className="font-black text-gray-950 mt-1">Hon. {captainInfo.name}</p>
                  <p className="text-[10px] text-gray-500">Punong Barangay, {formattedBrgyName}</p>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => setIsPrintReportModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Census Sheet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
