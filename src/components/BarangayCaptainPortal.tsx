"use client";

import React, { useState, useMemo } from "react";
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
  AlertCircle
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import { YouthProfile, ReferralPipelineItem, OfficialAccount, TESDAProgram } from "../types";

interface BarangayCaptainPortalProps {
  onLogout: () => void;
  designatedBarangay: string;
  youthProfiles: YouthProfile[];
  referrals: ReferralPipelineItem[];
  officialAccounts: OfficialAccount[];
  programs?: TESDAProgram[];
  currentUser?: any;
}

export const BarangayCaptainPortal: React.FC<BarangayCaptainPortalProps> = ({
  onLogout,
  designatedBarangay,
  youthProfiles,
  referrals,
  officialAccounts,
  programs = [],
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<"dashboard" | "youth_list" | "tesda_programs">("dashboard");
  const [selectedYouth, setSelectedYouth] = useState<YouthProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Search & Filter state for Youth Directory
  const [youthSearch, setYouthSearch] = useState("");
  const [purokFilter, setPurokFilter] = useState("All");
  const [eduFilter, setEduFilter] = useState("All");

  // Search & Filter state for TESDA Programs
  const [tesdaSearch, setTesdaSearch] = useState("");
  const [tesdaTypeFilter, setTesdaTypeFilter] = useState("All");
  const [tesdaCostFilter, setTesdaCostFilter] = useState("All");

  const cleanBrgy = useMemo(() => {
    return designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
  }, [designatedBarangay]);

  // Dynamic captain info lookup
  const captainInfo = useMemo(() => {
    if (currentUser) {
      return {
        name: currentUser.name,
        email: currentUser.email
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

  // Filtered Youth Profiles for the Directory Tab
  const filteredYouthProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => {
      const matchesSearch = y.name.toLowerCase().includes(youthSearch.toLowerCase()) || 
                            y.skills.some(s => s.toLowerCase().includes(youthSearch.toLowerCase())) ||
                            y.purok.toLowerCase().includes(youthSearch.toLowerCase());
      const matchesPurok = purokFilter === "All" || y.purok === purokFilter;
      const matchesEdu = eduFilter === "All" || y.educationalAttainment === eduFilter;
      const matchesStatus = statusFilter === "All" || y.currentStatus === statusFilter;
      return matchesSearch && matchesPurok && matchesEdu && matchesStatus;
    });
  }, [localYouthProfiles, youthSearch, purokFilter, eduFilter, statusFilter]);

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

  // Filtered TESDA Programs for the TESDA Tab
  const filteredPrograms = useMemo(() => {
    return programs.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(tesdaSearch.toLowerCase()) ||
                            p.provider.toLowerCase().includes(tesdaSearch.toLowerCase()) ||
                            p.location.toLowerCase().includes(tesdaSearch.toLowerCase());
      const matchesType = tesdaTypeFilter === "All" || p.type === tesdaTypeFilter;
      const matchesCost = tesdaCostFilter === "All" || p.cost === tesdaCostFilter;
      return matchesSearch && matchesType && matchesCost;
    });
  }, [programs, tesdaSearch, tesdaTypeFilter, tesdaCostFilter]);

  // Dynamic local skills gap calculation
  const localSkillsGaps = useMemo(() => {
    const totalLocal = localYouthProfiles.length;
    if (totalLocal === 0) {
      return [
        { skill: "Computer Literacy", count: 0, percentage: 0 },
        { skill: "Food Processing", count: 0, percentage: 0 },
        { skill: "Electrical Installation", count: 0, percentage: 0 },
        { skill: "Welding / Metal Fab", count: 0, percentage: 0 },
        { skill: "Bread and Pastry", count: 0, percentage: 0 }
      ];
    }

    let computerCount = 0;
    let foodCount = 0;
    let electricalCount = 0;
    let weldingCount = 0;
    let bakingCount = 0;

    localYouthProfiles.forEach(y => {
      const skillsLower = y.skills.map(s => s.toLowerCase());
      const pref = y.sectorPreference.toLowerCase();

      if (pref.includes("it") || pref.includes("business")) {
        const hasItSkill = skillsLower.some(s => s.includes("design") || s.includes("office") || s.includes("word") || s.includes("excel") || s.includes("program") || s.includes("network") || s.includes("data"));
        if (!hasItSkill) computerCount++;
      }
      if (pref.includes("tourism") || pref.includes("food")) {
        const hasFoodSkill = skillsLower.some(s => s.includes("cook") || s.includes("prep") || s.includes("bake") || s.includes("pastry"));
        if (!hasFoodSkill) {
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
      return {
        skill,
        count,
        percentage: pct > 100 ? 100 : pct
      };
    };

    return [
      makeGap("Computer Literacy", computerCount),
      makeGap("Food Processing", foodCount),
      makeGap("Electrical Installation", electricalCount),
      makeGap("Welding / Metal Fab", weldingCount),
      makeGap("Bread and Pastry", bakingCount)
    ].sort((a, b) => b.count - a.count);
  }, [localYouthProfiles]);

  // KK Members Summary statistics
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
      // Status breakdown
      const status = y.currentStatus.toLowerCase();
      if (status.includes("in-school") || status.includes("student")) inSchool++;
      else if (status.includes("out-of-school") || status.includes("unemployed")) outOfSchool++;
      else if (status.includes("self-employed")) selfEmployed++;
      else if (status.includes("employed")) employed++;
      else if (status.includes("graduate")) graduate++;
      else outOfSchool++; // Default to out-of-school if unspecified and not school

      // Special sectors
      if (y.pwd) pwd++;
      if (y.soloParent) soloParent++;
      if (y.indigenous) indigenous++;

      // Purok breakdown
      purokBreakdown[y.purok] = (purokBreakdown[y.purok] || 0) + 1;

      // Education breakdown
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

  const formattedBrgyName = useMemo(() => {
    return designatedBarangay.startsWith("Barangay") ? designatedBarangay : `Barangay ${designatedBarangay}`;
  }, [designatedBarangay]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-800 flex flex-col" id="captain-portal-container">
      
      {/* Top Main Navigation Header */}
      <header className="bg-[#1C2B20] text-white px-8 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <SikapLogo size={32} variant="white" showText={true} />
          <span className="text-xs font-black text-amber-500 uppercase tracking-widest border-l border-white/20 pl-3">Executive Captain</span>
        </div>
        
        <div className="flex items-center gap-5 relative">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-2 text-emerald-200 hover:text-white bg-emerald-900/40 hover:bg-emerald-900/80 rounded-xl border border-emerald-700/50 transition-all cursor-pointer ${
                showNotifications ? "ring-2 ring-amber-400 bg-emerald-900" : ""
              }`}
              title="Barangay Executive Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              {!notificationsRead && (localYouthProfiles.length > 0 || programs.length > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#1C2B20] animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 py-3 text-xs overflow-hidden text-slate-800 animate-in fade-in-50 slide-in-from-top-2">
                  <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/70 p-3">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0A6B43]" />
                      <span className="font-extrabold text-gray-900 text-sm">Barangay Executive Alerts</span>
                    </div>
                    <button
                      onClick={() => {
                        setNotificationsRead(true);
                      }}
                      className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                    >
                      Mark all as read
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    <div
                      onClick={() => { setActiveTab("youth_list"); setShowNotifications(false); }}
                      className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[#0A6B43] shrink-0 mt-0.5">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-xs">Katipunan ng Kabataan Roster</p>
                        <p className="text-[11px] text-gray-500 font-medium">{localYouthProfiles.length} registered youth tracked in {formattedBrgyName}.</p>
                      </div>
                    </div>

                    <div
                      onClick={() => { setActiveTab("tesda_programs"); setShowNotifications(false); }}
                      className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 shrink-0 mt-0.5">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-xs">Available TESDA Programs</p>
                        <p className="text-[11px] text-gray-500 font-medium">{programs.length} active vocational courses open for registration.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400">Click any notification to navigate to tab</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile Avatar Click */}
          <div
            onClick={() => setActiveTab("dashboard")}
            className="flex items-center gap-3 text-right text-xs cursor-pointer group p-1.5 rounded-xl hover:bg-emerald-950/60 transition-all border border-transparent hover:border-emerald-800/40"
            title="Go to Captain Dashboard"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-amber-400">
              {captainInfo.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div className="hidden sm:block">
              <p className="font-extrabold text-white group-hover:text-amber-400 transition-colors leading-none">{captainInfo.name}</p>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5">{formattedBrgyName} Captain</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3.5 py-2 border border-emerald-900 hover:border-emerald-700 bg-emerald-950/40 hover:bg-emerald-900/40 text-xs text-red-300 rounded-xl transition-all font-bold uppercase tracking-wider"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Primary Sub-Nav Header */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shrink-0 shadow-xs">
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Landmark className="w-4.5 h-4.5 text-emerald-700" />
            {formattedBrgyName} Dashboard
          </h2>
          <p className="text-[11px] text-slate-500 font-medium">SikKap Authorized Executive Audit Portal</p>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "dashboard"
                ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("youth_list")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "youth_list"
                ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            KK Directory ({localYouthProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab("tesda_programs")}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === "tesda_programs"
                ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            TESDA Listings ({programs.length})
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Metric Cards Banner - "the same analytics" */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#D1FAE5] p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:border-[#A7F3D0] transition-all">
            <div className="p-3.5 rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-100">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">KK Youth Registered</span>
              <h4 className="text-2xl font-black text-gray-800 mt-0.5">{localYouthProfiles.length}</h4>
              <span className="text-[9px] font-bold text-[#0A6B43] bg-emerald-50/70 border border-emerald-100 px-1.5 py-0.5 rounded">Barangay Active</span>
            </div>
          </div>

          <div className="bg-white border border-[#D1FAE5] p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:border-[#A7F3D0] transition-all">
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <Award className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Sponsor Referrals</span>
              <h4 className="text-2xl font-black text-gray-800 mt-0.5">{localReferrals.length}</h4>
              <span className="text-[9px] font-bold text-amber-700 bg-amber-50/70 border border-amber-100 px-1.5 py-0.5 rounded">Roster Mapped</span>
            </div>
          </div>

          <div className="bg-white border border-[#D1FAE5] p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:border-[#A7F3D0] transition-all">
            <div className="p-3.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <Briefcase className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">TESDA Listings</span>
              <h4 className="text-2xl font-black text-gray-800 mt-0.5">{programs.length}</h4>
              <span className="text-[9px] font-bold text-teal-700 bg-teal-50/70 border border-teal-100 px-1.5 py-0.5 rounded">Municipal-wide</span>
            </div>
          </div>

          <div className="bg-white border border-[#D1FAE5] p-5 rounded-2xl shadow-xs flex items-center gap-4 hover:border-[#A7F3D0] transition-all">
            <div className="p-3.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200">
              <TrendingUp className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Skills Gaps Active</span>
              <h4 className="text-2xl font-black text-gray-800 mt-0.5">{localSkillsGaps.filter(g => g.count > 0).length}</h4>
              <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Categories Gapped</span>
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* TAB 1: EXECUTIVE DASHBOARD */}
        {/* ======================================= */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            
            {/* KK MEMBERS SUMMARY & SKILLS GAPS GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* SUMMARY OF KK MEMBERS BASED ON BARANGAY */}
              <div className="bg-white border border-[#D1FAE5] p-6 rounded-2xl shadow-xs lg:col-span-2 space-y-5">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Katipunan ng Kabataan Demographics</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Statistical breakdown of the youth residing in {formattedBrgyName}</p>
                  </div>
                  <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded">
                    Live Census Log
                  </span>
                </div>

                {localYouthProfiles.length > 0 ? (
                  <div className="space-y-6">
                    {/* Primary Status Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div className="bg-emerald-50 border-2 border-emerald-500 p-3.5 rounded-xl text-center shadow-xs">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-900 block flex items-center justify-center gap-1">
                          ★ OSY (Out-of-School)
                        </span>
                        <h5 className="text-xl font-black text-emerald-950 mt-1">{kkMembersSummary.outOfSchool}</h5>
                        <p className="text-[9px] text-emerald-700 mt-0.5 font-bold">
                          {Math.round((kkMembersSummary.outOfSchool / localYouthProfiles.length) * 100)}% of total
                        </p>
                      </div>
                      <div className="bg-blue-50/40 border border-blue-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800 block">Employed</span>
                        <h5 className="text-xl font-black text-blue-950 mt-1">{kkMembersSummary.employed}</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                          {Math.round((kkMembersSummary.employed / localYouthProfiles.length) * 100)}%
                        </p>
                      </div>
                      <div className="bg-indigo-50/40 border border-indigo-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-800 block">Self-Employed</span>
                        <h5 className="text-xl font-black text-indigo-950 mt-1">{kkMembersSummary.selfEmployed}</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                          {Math.round((kkMembersSummary.selfEmployed / localYouthProfiles.length) * 100)}%
                        </p>
                      </div>
                      <div className="bg-amber-50/40 border border-amber-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block">Graduates</span>
                        <h5 className="text-xl font-black text-amber-950 mt-1">{kkMembersSummary.graduate}</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                          {Math.round((kkMembersSummary.graduate / localYouthProfiles.length) * 100)}%
                        </p>
                      </div>
                      <div className="bg-slate-50/40 border border-slate-100 p-3.5 rounded-xl text-center">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 block">In-School</span>
                        <h5 className="text-xl font-black text-slate-900 mt-1">{kkMembersSummary.inSchool}</h5>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-bold">
                          {Math.round((kkMembersSummary.inSchool / localYouthProfiles.length) * 100)}%
                        </p>
                      </div>
                    </div>

                    {/* Breakdown columns: Purok, Education and Special Segments */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      
                      {/* Purok-wise Roster Distribution */}
                      <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" /> Purok Distribution
                        </h4>
                        <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                          {Object.entries(kkMembersSummary.purokBreakdown).map(([purok, count]) => {
                            const countNum = count as number;
                            return (
                              <div key={purok} className="flex justify-between items-center text-[11px] font-semibold">
                                <span className="text-slate-600 font-bold">{purok}</span>
                                <div className="flex items-center gap-2 flex-1 mx-3">
                                  <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-600 rounded-full" 
                                      style={{ width: `${(countNum / localYouthProfiles.length) * 100}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="text-slate-900 font-black">{countNum} youth</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Educational Attainment & Special Segments */}
                      <div className="space-y-4">
                        <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                          <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Educational Profiles
                          </h4>
                          <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1">
                            {Object.entries(kkMembersSummary.eduBreakdown).map(([edu, count]) => {
                              const countNum = count as number;
                              return (
                                <div key={edu} className="flex justify-between items-center text-[11px] font-semibold">
                                  <span className="text-slate-600 font-bold truncate max-w-[120px]" title={edu}>{edu}</span>
                                  <div className="flex items-center gap-2 flex-1 mx-3">
                                    <div className="h-1.5 bg-slate-200 rounded-full flex-1 overflow-hidden">
                                      <div 
                                        className="h-full bg-amber-500 rounded-full" 
                                        style={{ width: `${(countNum / localYouthProfiles.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                  <span className="text-slate-900 font-black">{countNum}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Special Demographics Metrics */}
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
                  <div className="p-12 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-150 rounded-xl bg-slate-50/50">
                    No KK Members registered in this barangay.
                  </div>
                )}
              </div>

              {/* TOP SKILLS GAPS IDENTIFIED */}
              <div className="bg-white border border-[#D1FAE5] p-6 rounded-2xl shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Skills Gaps Identified</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Skills deficiency metrics sorted by severity</p>
                  </div>

                  <div className="space-y-4">
                    {localSkillsGaps.map((gap) => {
                      const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                      return (
                        <div key={gap.skill} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-700">{gap.skill}</span>
                            <span className="text-emerald-700 font-black bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                              {gap.count} youth lacking
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
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

                <button
                  onClick={() => setActiveTab("youth_list")}
                  className="w-full mt-6 py-2.5 text-center border border-dashed border-emerald-200 hover:border-emerald-400 text-xs font-black uppercase tracking-wider text-[#0A6B43] bg-emerald-50/20 hover:bg-emerald-50/60 rounded-xl transition-all"
                >
                  Inspect Directory Roster
                </button>
              </div>

            </div>

            {/* RECENT YOUTH REGISTRATIONS SECTION */}
            <div className="bg-white border border-[#D1FAE5] p-6 rounded-2xl shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Recent Youth Registrations</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Most recent Sangguniang Kabataan registrants from your Barangay</p>
                </div>
                <button
                  onClick={() => setActiveTab("youth_list")}
                  className="text-xs font-bold text-[#0A6B43] hover:text-emerald-800 flex items-center gap-1 hover:underline uppercase tracking-wider"
                >
                  Open Full Directory Roster <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-black text-[10px] bg-slate-50 uppercase tracking-widest">
                      <th className="py-3 px-4 pl-5">Full Name</th>
                      <th className="py-3 px-4">Age / Purok</th>
                      <th className="py-3 px-4">Education Attainment</th>
                      <th className="py-3 px-4">Livelihood Interests</th>
                      <th className="py-3 px-4 text-center">Eligibility Match</th>
                      <th className="py-3 px-4 text-right pr-5">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {localYouthProfiles.length > 0 ? (
                      localYouthProfiles.slice(0, 5).map((y) => (
                        <tr key={y.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 pl-5 font-bold text-slate-950 text-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-black text-xs">
                                {y.name.charAt(0)}
                              </div>
                              {y.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {y.age} y/o · <span className="font-bold text-slate-800">{y.purok}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-emerald-50 text-[#0A6B43] font-black border border-emerald-100 px-2.5 py-1 rounded-full text-[10px]">
                              {y.educationalAttainment}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600">
                            {y.interests.join(", ")}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                              y.matchScore >= 90 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-amber-700 bg-amber-50 border border-amber-100"
                            }`}>
                              {y.matchScore}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right pr-5">
                            <button
                              onClick={() => setSelectedYouth(y)}
                              className="px-3 py-1.5 bg-[#1C2B20] hover:bg-emerald-800 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all shadow-xs"
                            >
                              Dossier
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 font-semibold">
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

        {/* ======================================= */}
        {/* TAB 2: KK YOUTH DIRECTORY (VIEW ONLY)   */}
        {/* ======================================= */}
        {activeTab === "youth_list" && (
          <div className="space-y-6">
            
            <div className="bg-white border border-[#D1FAE5] p-6 rounded-2xl shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">Katipunan ng Kabataan Directory</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Comprehensive database of local youth profiles registered under {formattedBrgyName}</p>
                </div>
                <div className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-black uppercase">
                  View-Only Access Enabled
                </div>
              </div>

              {/* SEARCH & FILTERS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs font-semibold">
                
                {/* Search Name/Skills */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name, skills, purok..."
                    value={youthSearch}
                    onChange={(e) => setYouthSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  />
                </div>

                {/* Filter Purok */}
                <div className="relative">
                  <select
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All Puroks</option>
                    {uniquePuroks.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Educational */}
                <div className="relative">
                  <select
                    value={eduFilter}
                    onChange={(e) => setEduFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All Education levels</option>
                    {uniqueEdus.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>
                </div>

                {/* Filter Status */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All OSY Youth Profiles</option>
                    <option value="Out-of-school">Out-of-school Youth (OSY)</option>
                  </select>
                </div>

              </div>

              {/* LIST TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-400 font-black text-[10px] bg-slate-50 uppercase tracking-widest">
                      <th className="py-3.5 px-4 pl-5">Full Name</th>
                      <th className="py-3.5 px-4">Age / Purok</th>
                      <th className="py-3.5 px-4">Current Status</th>
                      <th className="py-3.5 px-4">Education Profile</th>
                      <th className="py-3.5 px-4">Sector Preference</th>
                      <th className="py-3.5 px-4 text-center">Score</th>
                      <th className="py-3.5 px-4 text-right pr-5">Dossier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                    {filteredYouthProfiles.length > 0 ? (
                      filteredYouthProfiles.map((y) => (
                        <tr key={y.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 pl-5 font-bold text-slate-950 text-sm">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center font-black text-xs">
                                {y.name.charAt(0)}
                              </div>
                              {y.name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {y.age} y/o · <span className="font-bold text-slate-800">{y.purok}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Out-of-school (OSY)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                              {y.educationalAttainment}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-600 max-w-[120px] truncate" title={y.sectorPreference}>
                            {y.sectorPreference}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-slate-800">
                            {y.matchScore}%
                          </td>
                          <td className="py-3 px-4 text-right pr-5">
                            <button
                              onClick={() => setSelectedYouth(y)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg border border-slate-200 hover:border-emerald-200 transition-all"
                              title="Inspect Dossier"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                          No youth matching selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: TESDA PROGRAMS (VIEW ONLY)       */}
        {/* ======================================= */}
        {activeTab === "tesda_programs" && (
          <div className="space-y-6">
            
            <div className="bg-white border border-[#D1FAE5] p-6 rounded-2xl shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider">TESDA Municipal Programs</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Directory of technical, vocational, and livelihood training programs available within San Luis, Pampanga</p>
                </div>
                <div className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-black uppercase">
                  View-Only Registry Enabled
                </div>
              </div>

              {/* SEARCH & FILTERS PANEL */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                
                {/* Search Programs */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search program title, provider, location..."
                    value={tesdaSearch}
                    onChange={(e) => setTesdaSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  />
                </div>

                {/* Filter Program Type */}
                <div className="relative">
                  <select
                    value={tesdaTypeFilter}
                    onChange={(e) => setTesdaTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
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
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-xs"
                  >
                    <option value="All">All Costs</option>
                    <option value="Free">Free / 100% Scholarship</option>
                    <option value="Subsidized">Subsidized</option>
                    <option value="With Fee">With Fee</option>
                  </select>
                </div>

              </div>

              {/* LIST GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredPrograms.length > 0 ? (
                  filteredPrograms.map((prog) => (
                    <div key={prog.id} className="border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 bg-slate-50 hover:bg-white transition-all shadow-2xs relative flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            prog.type === "Training"
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : prog.type === "Employment"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {prog.type}
                          </span>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            prog.cost === "Free"
                              ? "bg-emerald-100 text-emerald-800"
                              : prog.cost === "Subsidized"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-slate-100 text-slate-800"
                          }`}>
                            {prog.cost}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-black text-sm text-slate-900 line-clamp-1" title={prog.title}>{prog.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{prog.provider}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-200 space-y-2 text-[11px] font-semibold text-slate-600">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {prog.location}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Duration: <strong className="text-slate-800">{prog.duration}</strong>
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold">
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider text-[8px] font-black">Remaining Slots</p>
                          <p className="text-xs font-black text-slate-800 mt-0.5">{prog.slotsRemaining} / {prog.slotsTotal}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-[#0A6B43] bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                          View Only
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-150 rounded-2xl bg-slate-50/50">
                    No TESDA programs match your current search filters.
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ======================================= */}
      {/* VIEW YOUTH DOSSIER MODAL (VIEW ONLY)     */}
      {/* ======================================= */}
      {selectedYouth && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1FAE5] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Header banner */}
            <div className="bg-[#1C2B20] text-white p-6 flex justify-between items-start shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-lg shadow-inner">
                  {selectedYouth.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider">{selectedYouth.name}</h3>
                  <p className="text-xs text-emerald-200 font-semibold mt-0.5">
                    {formattedBrgyName} · Purok {selectedYouth.purok}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedYouth(null)}
                className="p-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Contents */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs font-semibold text-slate-700 leading-relaxed">
              
              {/* Demographics Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">Exact Age</span>
                  <p className="text-base font-black text-slate-900 mt-1">{selectedYouth.age} Years Old</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">Status Node</span>
                  <p className="text-xs font-black text-[#0A6B43] mt-1.5 uppercase">{selectedYouth.currentStatus}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[9px] font-black uppercase tracking-wider">SikKap Score</span>
                  <p className="text-base font-black text-amber-500 mt-1">{selectedYouth.matchScore}% Match</p>
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
                      <p className="text-slate-400 text-[9px] font-black uppercase">Preferred Sector Preference</p>
                      <p className="text-[#0A6B43] text-xs font-black mt-0.5">{selectedYouth.sectorPreference || "Technical Vocational / Unspecified"}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Registered Contact Node</p>
                      <p className="text-slate-950 text-xs font-mono font-bold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedYouth.contactNumber || "None registered"}
                      </p>
                    </div>
                    {selectedYouth.email && (
                      <div>
                        <p className="text-slate-400 text-[9px] font-black uppercase">Registered Email Account</p>
                        <p className="text-slate-950 text-xs font-bold mt-0.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {selectedYouth.email}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Roster Entry Date</p>
                      <p className="text-slate-950 text-xs font-bold mt-0.5">{selectedYouth.registeredDate}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Special Demographics Flags</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[9px] font-black uppercase">
                        {selectedYouth.soloParent && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded">Solo Parent</span>
                        )}
                        {selectedYouth.pwd && (
                          <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded">PWD (Special Abilities)</span>
                        )}
                        {selectedYouth.indigenous && (
                          <span className="bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded">Indigenous Group</span>
                        )}
                        {!selectedYouth.soloParent && !selectedYouth.pwd && !selectedYouth.indigenous && (
                          <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded">No Flags Triggered</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: Skills and preferences */}
                <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-200 pb-2">
                    <Compass className="w-3.5 h-3.5 text-slate-400" /> Career & Skills Diagnostic
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Sector Preference</p>
                      <p className="text-slate-950 text-xs font-bold mt-0.5">{selectedYouth.sectorPreference}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Livelihood Focus Goal</p>
                      <p className="text-slate-950 text-xs font-bold mt-0.5">{selectedYouth.livelihoodGoal}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Livelihood Aspirations</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedYouth.interests.map(interest => (
                          <span key={interest} className="bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded text-[9px] font-black uppercase">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[9px] font-black uppercase">Stated Skills / Competencies</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {selectedYouth.skills.length > 0 ? (
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
                  <p className="font-bold uppercase tracking-wider text-[9px] text-amber-950">Barangay Captain Audit Ledger</p>
                  <p className="text-amber-900 mt-0.5">This dossier is synchronized with the Sangguniang Kabataan municipal registry. Changes must be proposed through authorized SK channels.</p>
                </div>
              </div>

            </div>

            {/* Footer close */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedYouth(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
