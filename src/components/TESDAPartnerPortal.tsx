"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase, Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, SlidersHorizontal, Eye, MapPin, GraduationCap, Info, User, Trash2, Pencil
} from "lucide-react";
import { TESDAProgram, ReferralPipelineItem, TESDAPartnerScreen, YouthProfile } from "../types";
import { MetricCard, SikapLogo } from "./ReusableComponents";

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

  // Selected applicant for detail view modal
  const [selectedApplicant, setSelectedApplicant] = useState<YouthProfile | null>(null);

  // Deleting program ID state
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);

  // Automatic archiving on component mount/load
  const archiveChecked = React.useRef(false);
  React.useEffect(() => {
    if (archiveChecked.current) return;
    
    let updated = false;
    const now = new Date();
    
    const nextReferrals = referrals.map(item => {
      if (item.status === "Enrolled") {
        const prog = programs.find(p => p.title === item.programTitle);
        if (prog && prog.endDate) {
          try {
            const end = new Date(prog.endDate);
            if (!isNaN(end.getTime()) && end < now) {
              updated = true;
              return { ...item, status: "Archived" as const };
            }
          } catch (e) {
            // ignore
          }
        }
      }
      return item;
    });

    if (updated) {
      archiveChecked.current = true;
      setReferrals(nextReferrals);
      const archivedCount = nextReferrals.filter((item, idx) => item.status === "Archived" && referrals[idx].status !== "Archived").length;
      addToast(`Automatically archived ${archivedCount} enrolled KK member(s) from completed training programs.`, "info");
    }
  }, [referrals, programs, setReferrals, addToast]);

  // Pipeline Search & Filter states
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [pipelineStatusFilter, setPipelineStatusFilter] = useState<string>("All");
  const [pipelineProgramFilter, setPipelineProgramFilter] = useState<string>("All");
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});

  const toggleProgramExpand = (title: string) => {
    setExpandedPrograms(prev => ({
      ...prev,
      [title]: prev[title] === false ? true : false
    }));
  };

  // Form states for adding program
  const [progTitle, setProgTitle] = useState("");
  const [progLevel, setProgLevel] = useState("NC II");
  const [progDuration, setProgDuration] = useState("3 months (240 hours)");
  const [progLocation, setProgLocation] = useState("San Luis Municipal Gym");
  const [progCost, setProgCost] = useState<"Free" | "Subsidized" | "With Fee">("Free");
  const [progSlots, setProgSlots] = useState(30);
  const [progEligibility, setProgEligibility] = useState("Must be KK registered resident of San Luis");
  const [progContactName, setProgContactName] = useState("Evelyn Castor");
  const [progContactPhone, setProgContactPhone] = useState("+63 932 777 3344");
  const [progScheduleDays, setProgScheduleDays] = useState("Mondays to Fridays");
  const [progScheduleTime, setProgScheduleTime] = useState("8:00 AM - 12:00 PM");
  const [progRoom, setProgRoom] = useState("Room A (Main Campus)");
  const [progInstructor, setProgInstructor] = useState("Engr. Danilo Santos");
  const [progStartDate, setProgStartDate] = useState("July 15, 2026");
  const [progEndDate, setProgEndDate] = useState("October 15, 2026");

  // Editing program ID state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const handleNewProgramClick = () => {
    setEditingProgramId(null);
    setProgTitle("");
    setProgLevel("NC II");
    setProgDuration("3 months (240 hours)");
    setProgLocation("San Luis Municipal Gym");
    setProgCost("Free");
    setProgSlots(30);
    setProgEligibility("Must be KK registered resident of San Luis");
    setProgContactName("Evelyn Castor");
    setProgContactPhone("+63 932 777 3344");
    setProgScheduleDays("Mondays to Fridays");
    setProgScheduleTime("8:00 AM - 12:00 PM");
    setProgRoom("Room A (Main Campus)");
    setProgInstructor("Engr. Danilo Santos");
    setProgStartDate("July 15, 2026");
    setProgEndDate("October 15, 2026");
    setCurrentScreen(TESDAPartnerScreen.ADD_PROGRAM);
  };

  const handleEditProgramClick = (prog: TESDAProgram) => {
    setEditingProgramId(prog.id);
    
    // Parse title & level (e.g. "Food Processing NC II" -> "Food Processing" & "NC II")
    const match = prog.title.match(/(.*)\s+(NC\s+I|NC\s+II|NC\s+III)$/i);
    if (match) {
      setProgTitle(match[1].trim());
      setProgLevel(match[2]);
    } else {
      setProgTitle(prog.title);
      setProgLevel("NC II");
    }

    setProgDuration(prog.duration || "");
    setProgLocation(prog.location || "");
    setProgCost(prog.cost || "Free");
    setProgSlots(prog.slotsTotal || 30);
    setProgEligibility(prog.eligibility || "");
    setProgContactName(prog.contactPerson || "Evelyn Castor");
    setProgContactPhone(prog.contactNumber || "+63 932 777 3344");
    setProgScheduleDays(prog.classScheduleDays || "");
    setProgScheduleTime(prog.classScheduleTime || "");
    setProgRoom(prog.room || "");
    setProgInstructor(prog.instructor || "");
    setProgStartDate(prog.startDate || "");
    setProgEndDate(prog.endDate || "");

    setCurrentScreen(TESDAPartnerScreen.EDIT_PROGRAM);
  };

  // Form submission (Supports Add & Edit)
  const handleAddProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      addToast("Please fill in the program title", "error");
      return;
    }

    const fullTitle = `${progTitle.trim()} ${progLevel}`.trim();

    if (editingProgramId) {
      // Update existing program
      const oldProg = programs.find(p => p.id === editingProgramId);
      if (oldProg) {
        const diffSlots = Number(progSlots) - oldProg.slotsTotal;
        setPrograms(prev => prev.map(p => {
          if (p.id === editingProgramId) {
            return {
              ...p,
              title: fullTitle,
              location: progLocation,
              duration: progDuration,
              cost: progCost,
              slotsTotal: Number(progSlots),
              slotsRemaining: Math.max(0, p.slotsRemaining + diffSlots),
              eligibility: progEligibility,
              contactPerson: progContactName,
              contactNumber: progContactPhone,
              classScheduleDays: progScheduleDays,
              classScheduleTime: progScheduleTime,
              room: progRoom,
              instructor: progInstructor,
              startDate: progStartDate,
              endDate: progEndDate
            };
          }
          return p;
        }));

        // If program title changed, update related referrals to maintain relationship mapping
        if (oldProg.title !== fullTitle) {
          setReferrals(prev => prev.map(r => {
            if (r.programTitle === oldProg.title) {
              return { ...r, programTitle: fullTitle };
            }
            return r;
          }));
        }
      }

      setEditingProgramId(null);
      setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
      addToast("TESDA training program updated successfully!", "success");
    } else {
      // Create new program
      const newProg: TESDAProgram = {
        id: `p-${Date.now()}`,
        title: fullTitle,
        provider: "TESDA GPSAT (Gonzalo Puyat School of Arts and Trades)",
        type: "Training",
        location: progLocation,
        duration: progDuration,
        cost: progCost,
        slotsTotal: Number(progSlots),
        slotsRemaining: Number(progSlots),
        youthMatched: 0,
        eligibility: progEligibility,
        contactPerson: progContactName,
        contactNumber: progContactPhone,
        activeStatus: "Active",
        requiredDocuments: [
          "PSA Birth Certificate (Original & Photocopy)",
          "4 copies of 1x1 Pictures (white background)",
          "High School Report Card / Diploma",
          "Certificate of Barangay Residency (San Luis)"
        ],
        classScheduleDays: progScheduleDays,
        classScheduleTime: progScheduleTime,
        room: progRoom,
        instructor: progInstructor,
        startDate: progStartDate,
        endDate: progEndDate
      };

      setPrograms(prev => [...prev, newProg]);
      setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
      addToast("New TESDA training program posted successfully!", "success");
    }

    // Reset Form
    setProgTitle("");
    setProgLevel("NC II");
    setProgDuration("3 months (240 hours)");
    setProgLocation("San Luis Municipal Gym");
    setProgCost("Free");
    setProgSlots(30);
    setProgEligibility("Must be KK registered resident of San Luis");
    setProgScheduleDays("Mondays to Fridays");
    setProgScheduleTime("8:00 AM - 12:00 PM");
    setProgRoom("Room A (Main Campus)");
    setProgInstructor("Engr. Danilo Santos");
    setProgStartDate("July 15, 2026");
    setProgEndDate("October 15, 2026");
  };

  // Change application status
  const handleUpdateReferralStatus = (refId: string, newStatus: "Enrolled" | "Declined") => {
    const targetReferral = referrals.find(item => item.id === refId);
    if (!targetReferral) return;

    if (newStatus === "Enrolled") {
      const associatedProgram = programs.find(p => p.title === targetReferral.programTitle);
      if (associatedProgram && associatedProgram.slotsRemaining <= 0) {
        addToast(`Cannot accept: "${targetReferral.programTitle}" is already full!`, "error");
        return;
      }

      // Automatically adjust slots (decrement by 1)
      setPrograms(prev => prev.map(p => {
        if (p.title === targetReferral.programTitle) {
          return {
            ...p,
            slotsRemaining: Math.max(0, p.slotsRemaining - 1)
          };
        }
        return p;
      }));
    }

    setReferrals(prev => prev.map(item => {
      if (item.id === refId) {
        return { ...item, status: newStatus };
      }
      return item;
    }));

    addToast(`Application status updated to "${newStatus}"`, "success");
  };

  const handleDeleteProgram = (progId: string, title: string) => {
    setPrograms(prev => prev.filter(p => p.id !== progId));
    addToast(`Program "${title}" has been successfully deleted.`, "success");
  };

  const totalSlots = programs.reduce((acc, curr) => acc + curr.slotsRemaining, 0);

  // Filter referrals based on search, status, and program
  const filteredReferrals = referrals.filter(item => {
    const matchesSearch = item.youthName.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                          item.barangay.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                          item.purok.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
                          item.programTitle.toLowerCase().includes(pipelineSearch.toLowerCase());
    const matchesStatus = pipelineStatusFilter === "All" || item.status === pipelineStatusFilter;
    const matchesProgram = pipelineProgramFilter === "All" || item.programTitle === pipelineProgramFilter;
    return matchesSearch && matchesStatus && matchesProgram;
  });

  // Get all unique program titles from active programs and existing referrals
  const allProgramTitles = Array.from(new Set([
    ...programs.map(p => p.title),
    ...referrals.map(r => r.programTitle)
  ]));

  // Group the filtered referrals by program title
  const groupedReferrals: Record<string, ReferralPipelineItem[]> = {};
  allProgramTitles.forEach(title => {
    groupedReferrals[title] = [];
  });

  filteredReferrals.forEach(item => {
    if (!groupedReferrals[item.programTitle]) {
      groupedReferrals[item.programTitle] = [];
    }
    groupedReferrals[item.programTitle].push(item);
  });

  const isSearchActive = pipelineSearch !== "" || pipelineStatusFilter !== "All" || pipelineProgramFilter !== "All";

  // Filter program titles to display:
  // - If search is active, only show programs that have at least 1 filtered referral.
  // - If search is not active, show all programs.
  const programTitlesToDisplay = allProgramTitles.filter(title => {
    const applicantsCount = groupedReferrals[title]?.length || 0;
    if (isSearchActive) {
      return applicantsCount > 0;
    }
    return true; // show all when not searching
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex" id="tesda-portal-container">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#112F24] text-white flex flex-col justify-between shadow-lg shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <SikapLogo size={32} variant="white" showText={true} />
            <span className="text-xs font-black text-emerald-300 uppercase tracking-widest border-l border-white/20 pl-2">Partner</span>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                currentScreen === TESDAPartnerScreen.DASHBOARD
                  ? "bg-teal-950 text-emerald-300 border-l-4 border-[#0F6E56]"
                  : "text-gray-300 hover:bg-[#1A4234] hover:text-white"
              }`}
            >
              <Briefcase className="w-4.5 h-4.5" />
              My Dashboard
            </button>
            <button
              onClick={handleNewProgramClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM
                  ? "bg-teal-950 text-emerald-300 border-l-4 border-[#0F6E56]"
                  : "text-gray-300 hover:bg-[#1A4234] hover:text-white"
              }`}
            >
              <Plus className="w-4.5 h-4.5" />
              Add Program
            </button>
          </nav>
        </div>

        <div className="p-6 border-t border-teal-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
              {currentUser?.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div>
              <p className="text-xs font-bold leading-none">{currentUser?.name || "TESDA Representative"}</p>
              <p className="text-[10px] text-teal-200 mt-0.5">{currentUser?.email || "GPSAT Office"}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-teal-900 hover:border-teal-700 hover:bg-teal-950/40 text-xs text-red-300 rounded-lg transition-colors font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Welcome, {currentUser?.name || "TESDA GPSAT"} 🏢</h1>
            <p className="text-xs text-gray-500 font-medium">Out-of-School Youth (OSY) Vocational & Livelihood Pipeline · San Luis, Pampanga</p>
          </div>
        </header>

        <div className="p-8">
          {currentScreen === TESDAPartnerScreen.DASHBOARD && (
            <div className="space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard
                  title="My Active Programs"
                  value={programs.length}
                  subtitle="published courses"
                  icon={<Briefcase className="w-5 h-5" />}
                  accent="teal"
                />
                <MetricCard
                  title="Total Slots Open"
                  value={totalSlots}
                  subtitle="available slots"
                  icon={<Target className="w-5 h-5" />}
                  accent="green"
                />
                <MetricCard
                  title="Direct Applications"
                  value={referrals.length}
                  subtitle="submitted directly"
                  icon={<Users className="w-5 h-5" />}
                  accent="gold"
                />
                <MetricCard
                  title="Enrolled Candidates"
                  value={referrals.filter(r => r.status === "Enrolled").length}
                  subtitle="attending classes"
                  icon={<Check className="w-5 h-5" />}
                  accent="charcoal"
                />
              </div>

              {/* Programs and referral list */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                              {/* My Active Programs table (40%) */}
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Published TESDA listings</h3>
                    <button
                      onClick={handleNewProgramClick}
                      className="text-xs font-bold text-[#0F6E56] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  <div className="space-y-3">
                    {programs.map((prog) => (
                      <div key={prog.id} className="p-3 border border-gray-100 rounded-lg flex justify-between items-start hover:border-gray-200 transition-colors relative group">
                        <div className="flex-1 pr-2">
                          <h4 className="font-bold text-gray-800 text-xs">{prog.title}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">⏱ {prog.duration} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""} · {prog.cost}</p>
                          {prog.endDate && (
                            <p className="text-[9px] text-purple-600 mt-0.5 font-semibold">
                              ⌛ Ends: {prog.endDate}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            prog.slotsRemaining > 0 ? "bg-teal-50 text-[#0F6E56]" : "bg-red-50 text-red-700"
                          }`}>
                            {prog.slotsRemaining > 0 ? `${prog.slotsRemaining} Slots` : "Full"}
                          </span>
                          
                          {deletingProgramId === prog.id ? (
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                onClick={() => {
                                  handleDeleteProgram(prog.id, prog.title);
                                  setDeletingProgramId(null);
                                }}
                                className="text-[9px] bg-red-600 hover:bg-red-700 text-white font-extrabold px-2 py-0.5 rounded shadow-2xs transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeletingProgramId(null)}
                                className="text-[9px] bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditProgramClick(prog)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Edit Program Listing"
                                id={`edit-program-btn-${prog.id}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingProgramId(prog.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete Program Listing"
                                id={`delete-program-btn-${prog.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Youth Applications pipeline list (60%) */}
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Application pipeline list</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Organized by training program and candidates</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-150 shrink-0">
                      <span className="w-2 h-2 bg-[#0F6E56] rounded-full animate-pulse" />
                      <span className="text-[10px] font-bold text-[#0F6E56] uppercase tracking-wider">
                        {filteredReferrals.length} match{filteredReferrals.length !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Search and Filters Bar */}
                  <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-100 mb-6 space-y-2.5">
                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Search Input */}
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search applicant name, purok, barangay..."
                          value={pipelineSearch}
                          onChange={(e) => setPipelineSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:border-[#0F6E56] focus:outline-hidden"
                        />
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative min-w-[120px]">
                        <select
                          value={pipelineStatusFilter}
                          onChange={(e) => setPipelineStatusFilter(e.target.value)}
                          className="w-full pl-3 pr-8 py-1.5 border border-gray-200 bg-white rounded-lg text-xs text-gray-600 focus:ring-1 focus:ring-teal-500 focus:outline-hidden cursor-pointer"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Enrolled">Enrolled</option>
                          <option value="Declined">Declined</option>
                        </select>
                      </div>

                      {/* Program Dropdown */}
                      <div className="relative min-w-[150px] max-w-[200px]">
                        <select
                          value={pipelineProgramFilter}
                          onChange={(e) => setPipelineProgramFilter(e.target.value)}
                          className="w-full pl-3 pr-8 py-1.5 border border-gray-200 bg-white rounded-lg text-xs text-gray-600 focus:ring-1 focus:ring-teal-500 focus:outline-hidden cursor-pointer truncate"
                        >
                          <option value="All">All Programs</option>
                          {programs.map(p => (
                            <option key={p.id} value={p.title}>{p.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Clear Filters indicator */}
                    {isSearchActive && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500 font-medium">
                          Showing {filteredReferrals.length} of {referrals.length} candidates
                        </span>
                        <button
                          onClick={() => {
                            setPipelineSearch("");
                            setPipelineStatusFilter("All");
                            setPipelineProgramFilter("All");
                          }}
                          className="text-xs text-red-600 hover:text-red-850 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Organized Program groups */}
                  <div className="space-y-4">
                    {programTitlesToDisplay.length === 0 ? (
                      <div className="text-center py-12 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/30">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 font-bold">No matching applicants found</p>
                        <p className="text-[10px] text-gray-400 mt-1">Try resetting your search query or filters</p>
                      </div>
                    ) : (
                      programTitlesToDisplay.map((title) => {
                        const programApplicants = groupedReferrals[title] || [];
                        const isExpanded = expandedPrograms[title] !== false; // expanded by default
                        
                        // Find matching program details for meta
                        const originalProgram = programs.find(p => p.title === title);
                        const slotsRemaining = originalProgram?.slotsRemaining;
                        const slotsTotal = originalProgram?.slotsTotal;

                        return (
                          <div key={title} className="border border-gray-100 rounded-xl overflow-hidden shadow-xs bg-white">
                            {/* Group Header */}
                            <div 
                              onClick={() => toggleProgramExpand(title)}
                              className={`flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F6E56] border border-teal-100 flex items-center justify-center shrink-0">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-800 text-xs truncate max-w-[180px] sm:max-w-[280px]" title={title}>
                                    {title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400 font-semibold">
                                      {programApplicants.length} candidate{programApplicants.length !== 1 ? "s" : ""}
                                    </span>
                                    {slotsRemaining !== undefined && (
                                      <>
                                        <span className="text-gray-300 text-[10px]">•</span>
                                        <span className={`text-[10px] font-bold ${slotsRemaining > 0 ? "text-emerald-600" : "text-red-500"}`}>
                                          {slotsRemaining} / {slotsTotal} slots left
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>

                            {/* Group Applicants List */}
                            {isExpanded && (
                              <div className="bg-white">
                                {programApplicants.length === 0 ? (
                                  <div className="p-4 text-center bg-gray-50/10">
                                    <p className="text-[11px] text-gray-400 font-medium">No candidates registered under this program yet.</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead>
                                        <tr className="border-b border-gray-150 text-gray-400 font-bold bg-gray-50/20 text-[9px] uppercase tracking-wider">
                                          <th className="py-2.5 px-4">Candidate</th>
                                          <th className="py-2.5 px-4">Residency</th>
                                          <th className="py-2.5 px-4">Date Applied</th>
                                          <th className="py-2.5 px-4">Status</th>
                                          <th className="py-2.5 px-4 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {programApplicants.map((item) => (
                                          <tr key={item.id} className="hover:bg-teal-50/10 transition-colors">
                                            {/* Candidate name & score */}
                                            <td className="py-2.5 px-4">
                                              <button 
                                                onClick={() => {
                                                  const matchedProfile = youthProfiles.find(y => y.name.toLowerCase() === item.youthName.toLowerCase());
                                                  if (matchedProfile) {
                                                    setSelectedApplicant(matchedProfile);
                                                  } else {
                                                    setSelectedApplicant({
                                                      id: item.id,
                                                      name: item.youthName,
                                                      age: 21,
                                                      purok: item.purok,
                                                      barangay: item.barangay,
                                                      educationalAttainment: "High School Graduate",
                                                      currentStatus: "Out-of-school",
                                                      skills: ["Basic Computer Literacy"],
                                                      interests: ["Vocational Training", "Employment"],
                                                      sectorPreference: "Information Technology",
                                                      livelihoodGoal: "Become a web developer or technician",
                                                      contactNumber: "+63 917 123 4567",
                                                      registeredDate: item.referralDate,
                                                      matchScore: item.matchScore,
                                                      soloParent: false,
                                                      pwd: false,
                                                      indigenous: false
                                                    });
                                                  }
                                                }}
                                                className="font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer flex items-center gap-1 text-left focus:outline-hidden"
                                                title="View Applicant Profile"
                                              >
                                                {item.youthName}
                                              </button>
                                              <div className="text-[10px] text-gray-400 mt-0.5 font-semibold">Match Score: {item.matchScore}%</div>
                                            </td>
                                            
                                            {/* Purok and Barangay */}
                                            <td className="py-2.5 px-4 text-gray-600 font-semibold">
                                              Purok {item.purok}, {item.barangay}
                                            </td>

                                            {/* Referral date */}
                                            <td className="py-2.5 px-4 text-gray-400 font-medium">
                                              {item.referralDate}
                                            </td>

                                            {/* Status */}
                                            <td className="py-2.5 px-4">
                                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                item.status === "Enrolled"
                                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                  : item.status === "Pending"
                                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                                  : "bg-red-50 text-red-700 border-red-200"
                                              }`}>
                                                {item.status}
                                              </span>
                                            </td>

                                            {/* Action buttons */}
                                            <td className="py-2.5 px-4 text-right">
                                              <div className="flex gap-1.5 justify-end items-center">
                                                <button
                                                  onClick={() => {
                                                    const matchedProfile = youthProfiles.find(y => y.name.toLowerCase() === item.youthName.toLowerCase());
                                                    if (matchedProfile) {
                                                      setSelectedApplicant(matchedProfile);
                                                    } else {
                                                      setSelectedApplicant({
                                                        id: item.id,
                                                        name: item.youthName,
                                                        age: 21,
                                                        purok: item.purok,
                                                        barangay: item.barangay,
                                                        educationalAttainment: "High School Graduate",
                                                        currentStatus: "Out-of-school",
                                                        skills: ["Basic Computer Literacy"],
                                                        interests: ["Vocational Training", "Employment"],
                                                        sectorPreference: "Information Technology",
                                                        livelihoodGoal: "Become a web developer or technician",
                                                        contactNumber: "+63 917 123 4567",
                                                        registeredDate: item.referralDate,
                                                        matchScore: item.matchScore,
                                                        soloParent: false,
                                                        pwd: false,
                                                        indigenous: false
                                                      });
                                                    }
                                                  }}
                                                  className="p-1 text-teal-600 hover:bg-teal-50 border border-teal-100 hover:border-teal-200 rounded-lg transition-all cursor-pointer"
                                                  title="View Profile details"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </button>

                                                {item.status === "Pending" ? (
                                                  <>
                                                    <button
                                                      onClick={() => handleUpdateReferralStatus(item.id, "Enrolled")}
                                                      className="p-1 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-lg transition-all cursor-pointer"
                                                      title="Accept Student"
                                                    >
                                                      <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => handleUpdateReferralStatus(item.id, "Declined")}
                                                      className="p-1 text-red-500 hover:bg-red-50 border border-red-100 hover:border-red-200 rounded-lg transition-all cursor-pointer"
                                                      title="Decline"
                                                    >
                                                      <X className="w-3.5 h-3.5" />
                                                    </button>
                                                  </>
                                                ) : (
                                                  <span className="text-gray-400 font-bold text-[9px] uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                                                    Processed
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {(currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM) && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
                  className="text-gray-400 hover:text-teal-700 font-medium text-xs flex items-center gap-1 bg-white border border-gray-100 shadow-3xs px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingProgramId ? "Edit Training Program" : "Add New Training Program"}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {editingProgramId
                      ? "Modify training program details, schedules, and active slots"
                      : "Post a vocational program with slot limits for youth matchmaking"}
                  </p>
                </div>
              </div>

              {/* Form container */}
              <div className="max-w-xl mx-auto bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6">
                <form onSubmit={handleAddProgramSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Training Course Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Shielded Metal Arc Welding"
                      value={progTitle}
                      onChange={(e) => setProgTitle(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Certification Level</label>
                      <select
                        value={progLevel}
                        onChange={(e) => setProgLevel(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="NC I">NC I</option>
                        <option value="NC II">NC II</option>
                        <option value="NC III">NC III</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Total Slot Allocation</label>
                      <input
                        type="number"
                        min={1}
                        value={progSlots}
                        onChange={(e) => setProgSlots(Number(e.target.value))}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Course Duration</label>
                      <input
                        type="text"
                        value={progDuration}
                        onChange={(e) => setProgDuration(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Cost structure</label>
                      <select
                        value={progCost}
                        onChange={(e) => setProgCost(e.target.value as any)}
                        className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Free">Free</option>
                        <option value="Subsidized">Subsidized</option>
                        <option value="With Fee">With Fee</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Class Location</label>
                    <input
                      type="text"
                      value={progLocation}
                      onChange={(e) => setProgLocation(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Class Days</label>
                      <input
                        type="text"
                        placeholder="e.g. Mondays to Fridays"
                        value={progScheduleDays}
                        onChange={(e) => setProgScheduleDays(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Class Hours/Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 8:00 AM - 12:00 PM"
                        value={progScheduleTime}
                        onChange={(e) => setProgScheduleTime(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Room / Facility</label>
                      <input
                        type="text"
                        placeholder="e.g. Room 101 / Shop A"
                        value={progRoom}
                        onChange={(e) => setProgRoom(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Instructor</label>
                      <input
                        type="text"
                        placeholder="e.g. Engr. Danilo Santos"
                        value={progInstructor}
                        onChange={(e) => setProgInstructor(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Start Date</label>
                      <input
                        type="text"
                        placeholder="e.g. July 15, 2026"
                        value={progStartDate}
                        onChange={(e) => setProgStartDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">End Date</label>
                      <input
                        type="text"
                        placeholder="e.g. October 15, 2026"
                        value={progEndDate}
                        onChange={(e) => setProgEndDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Eligibility Requirements</label>
                    <textarea
                      rows={2}
                      value={progEligibility}
                      onChange={(e) => setProgEligibility(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0F6E56] hover:bg-[#0b513f] text-white text-xs font-bold rounded-lg transition-all"
                    >
                      {editingProgramId ? "Update Course Details" : "Publish Course"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Applicant Details Modal */}
      {selectedApplicant && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-teal-100 shadow-xl overflow-hidden flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="bg-[#1C2B20] text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Applicant Profile Details</h3>
                  <p className="text-[10px] text-gray-300">Katipunan ng Kabataan Registered Candidate</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              {/* Applicant Card Profile Summary */}
              <div className="bg-teal-50/40 p-4 rounded-xl border border-teal-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#0F6E56] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0 uppercase">
                    {selectedApplicant.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-950 text-base">{selectedApplicant.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 font-semibold">{selectedApplicant.age} years old</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        Purok {selectedApplicant.purok}, {selectedApplicant.barangay}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200 shrink-0">
                  <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black text-center">Match Index</p>
                  <p className="text-lg font-black text-[#0F6E56] text-center mt-0.5">{selectedApplicant.matchScore || 0}%</p>
                </div>
              </div>

              {/* Two Column Layout details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Column 1: Core Profile Info */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                    Profile Info & Residency
                  </h5>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Phone className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Contact Number</p>
                        <p className="text-xs text-gray-800 font-semibold">{selectedApplicant.contactNumber || "None specified"}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <GraduationCap className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Educational Attainment</p>
                        <p className="text-xs text-gray-800 font-semibold">{selectedApplicant.educationalAttainment}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Info className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Status Class</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                          selectedApplicant.currentStatus === "Out-of-school" 
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}>
                          {selectedApplicant.currentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Calendar className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Date</p>
                        <p className="text-xs text-gray-500 font-semibold">{selectedApplicant.registeredDate || "N/A"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Demographic Badges */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Category Attributes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApplicant.soloParent && (
                        <span className="text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Solo Parent
                        </span>
                      )}
                      {selectedApplicant.pwd && (
                        <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          PWD
                        </span>
                      )}
                      {selectedApplicant.indigenous && (
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Indigenous
                        </span>
                      )}
                      {!selectedApplicant.soloParent && !selectedApplicant.pwd && !selectedApplicant.indigenous && (
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-150 px-2.5 py-1 rounded-full">
                          No special categories registered
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: Skills, Interests & Career path */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1.5">
                    Skills & Career Focus
                  </h5>

                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Declared Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplicant.skills && selectedApplicant.skills.length > 0 ? (
                          selectedApplicant.skills.map((s, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-teal-50 text-[#0F6E56] border border-teal-150 px-2 py-0.5 rounded-md">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No skills registered</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider mb-1.5">Aspirational Interests</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedApplicant.interests && selectedApplicant.interests.length > 0 ? (
                          selectedApplicant.interests.map((i, idx) => (
                            <span key={idx} className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded-md">
                              {i}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No interests declared</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Sector Preference</p>
                      <p className="text-xs text-gray-800 font-semibold mt-0.5">{selectedApplicant.sectorPreference || "General / Open"}</p>
                    </div>

                    <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Livelihood & Career Goal</p>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed italic">
                        "{selectedApplicant.livelihoodGoal || "Seeking matching vocational and livelihood opportunities."}"
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* ID Verification segment */}
              {(selectedApplicant.verificationIdType || selectedApplicant.verificationIdNumber) && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Government ID Verified</p>
                  <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-150 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{selectedApplicant.verificationIdType || "National ID / Brgy Clearance"}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mt-0.5">ID No: {selectedApplicant.verificationIdNumber || "Verified by Brgy Captain"}</p>
                    </div>
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md tracking-wider">
                      ID Authenticated
                    </span>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50/90 border-t border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              {/* Dynamic Referral Status Check */}
              {(() => {
                const activeRef = referrals.find(
                  r => r.youthName.toLowerCase() === selectedApplicant.name.toLowerCase()
                );

                if (!activeRef) return <div />;

                return (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Application:</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      activeRef.status === "Enrolled"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : activeRef.status === "Pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {activeRef.status}
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2.5">
                {/* If the candidate's referral is currently Pending, allow direct Accept/Decline within the modal */}
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
                        className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Decline Application
                      </button>
                      <button
                        onClick={() => {
                          handleUpdateReferralStatus(activeRef.id, "Enrolled");
                          setSelectedApplicant(null);
                        }}
                        className="px-4 py-1.5 bg-[#0F6E56] hover:bg-[#0b513f] text-white text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Accept & Enroll
                      </button>
                    </>
                  );
                })()}

                <button
                  onClick={() => setSelectedApplicant(null)}
                  className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};
