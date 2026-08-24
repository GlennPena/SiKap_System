"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase, Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, SlidersHorizontal, Eye, MapPin, GraduationCap, Info, User, Trash2, Pencil, Bell, CheckCircle, Clock
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Selected applicant for detail view modal
  const [selectedApplicant, setSelectedApplicant] = useState<YouthProfile | null>(null);

  // Selected program for detail view modal
  const [viewingProgram, setViewingProgram] = useState<TESDAProgram | null>(null);

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
  const [progTrainingHours, setProgTrainingHours] = useState<number | "">("");
  const [progLocation, setProgLocation] = useState("");
  const [progCost, setProgCost] = useState<"Free" | "Subsidized" | "With Fee">("Free");
  const [progSlots, setProgSlots] = useState(30);
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

  // Editing program ID state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const handleNewProgramClick = () => {
    setEditingProgramId(null);
    setProgTitle("");
    setProgLevel("NC II");
    setProgTrainingHours("");
    setProgLocation("");
    setProgCost("Free");
    setProgSlots(30);
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
    
    // Format dates for time inputs (HH:mm)
    if (prog.startTime) {
      const d = new Date(prog.startTime);
      setProgStartTime(`${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
    } else setProgStartTime("");
    
    if (prog.endTime) {
      const d = new Date(prog.endTime);
      setProgEndTime(`${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`);
    } else setProgEndTime("");

    setProgRoom(prog.room || "");
    setProgInstructor(prog.instructor || "");
    
    // Format dates for date inputs (YYYY-MM-DD)
    if (prog.startDate) {
      setProgStartDate(new Date(prog.startDate).toISOString().split('T')[0]);
    } else setProgStartDate("");
    
    if (prog.endDate) {
      setProgEndDate(new Date(prog.endDate).toISOString().split('T')[0]);
    } else setProgEndDate("");

    setCurrentScreen(TESDAPartnerScreen.EDIT_PROGRAM);
  };

  // Form submission (Supports Add & Edit)
  const handleAddProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progTitle.trim()) {
      addToast("Please fill in the program title", "error");
      return;
    }
    
    if (!progTrainingHours || progTrainingHours <= 0) {
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
      id: editingProgramId || undefined
    };

    try {
      const method = editingProgramId ? "PUT" : "POST";
      const res = await fetch("/api/programs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || "Failed to save program");
      }

      if (editingProgramId) {
        setPrograms(prev => prev.map(p => p.id === editingProgramId ? data.data : p));
        addToast("TESDA training program updated successfully!", "success");
      } else {
        setPrograms(prev => [data.data, ...prev]);
        addToast("New TESDA training program posted successfully!", "success");
      }

      setEditingProgramId(null);
      setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
      
      // Reset Form
      setProgTitle("");
      setProgLevel("NC II");
      setProgTrainingHours("");
      setProgLocation("");
      setProgCost("Free");
      setProgSlots(30);
      setProgEligibility("");
      setProgTrainingDays([]);
      setProgStartTime("");
      setProgEndTime("");
      setProgRoom("");
      setProgInstructor("");
      setProgStartDate("");
      setProgEndDate("");
    } catch (err: any) {
      addToast(err.message, "error");
    }
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
              onClick={() => setCurrentScreen(TESDAPartnerScreen.PROGRAMS)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                currentScreen === TESDAPartnerScreen.PROGRAMS
                  ? "bg-teal-950 text-emerald-300 border-l-4 border-[#0F6E56]"
                  : "text-gray-300 hover:bg-[#1A4234] hover:text-white"
              }`}
            >
              <BookOpen className="w-4.5 h-4.5" />
              Programs
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
          <div
            onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
            className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-teal-950/60 transition-all cursor-pointer group border border-transparent hover:border-teal-800/40"
            title="Go to TESDA Partner Dashboard"
          >
            <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-xs border border-teal-500">
              {currentUser?.name?.charAt(0).toUpperCase() || "T"}
            </div>
            <div>
              <p className="text-xs font-bold leading-none group-hover:text-emerald-300 transition-colors">{currentUser?.name || "TESDA Representative"}</p>
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
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-30 px-8 py-4 flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Welcome, {currentUser?.name || "TESDA GPSAT"} 🏢</h1>
            <p className="text-xs text-gray-500 font-medium">Out-of-School Youth (OSY) Vocational & Livelihood Pipeline · San Luis, Pampanga</p>
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-gray-500 hover:text-[#0A6B43] bg-gray-50 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer ${
                  showNotifications ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-300" : ""
                }`}
                title="TESDA Partner Alerts"
              >
                <Bell className="w-5 h-5" />
                {!notificationsRead && (referrals.length > 0 || programs.length > 0) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/60 p-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-gray-900 text-sm">TESDA Alerts</span>
                      </div>
                      <button
                        onClick={() => {
                          setNotificationsRead(true);
                          addToast("Notifications marked as read", "info");
                        }}
                        className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      <div
                        onClick={() => { setCurrentScreen(TESDAPartnerScreen.DASHBOARD); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-[#0A6B43] shrink-0 mt-0.5">
                          <Users className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Youth Referrals & Applications</p>
                          <p className="text-[11px] text-gray-500 font-medium">{referrals.length} youth applications registered for TESDA programs.</p>
                        </div>
                      </div>

                      <div
                        onClick={() => { setCurrentScreen(TESDAPartnerScreen.DASHBOARD); setShowNotifications(false); }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-lg bg-teal-50 border border-teal-100 text-teal-700 shrink-0 mt-0.5">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-xs">Active Program Listings</p>
                          <p className="text-[11px] text-gray-500 font-medium">{programs.length} active training courses published on SiKap.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400">Click any notification to navigate to Dashboard</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setCurrentScreen(TESDAPartnerScreen.DASHBOARD)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-200"
              title="Go to TESDA Partner Dashboard"
            >
              <div className="w-9 h-9 rounded-full bg-teal-700 group-hover:bg-teal-800 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-teal-200 transition-all">
                {currentUser?.name?.charAt(0).toUpperCase() || "T"}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#0A6B43] leading-none transition-colors">{currentUser?.name || "TESDA Representative"}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">TESDA GPSAT Office</p>
              </div>
            </button>
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
                          <p className="text-[10px] text-gray-400 mt-1">⏱ {`${prog.trainingHours} hours`} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""} · {prog.cost}</p>
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
                                onClick={() => setViewingProgram(prog)}
                                className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                title="View Program Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
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

          {currentScreen === TESDAPartnerScreen.PROGRAMS && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Published Programs</h2>
                  <p className="text-xs text-gray-500">Manage your active TESDA training courses</p>
                </div>
                <button
                  onClick={handleNewProgramClick}
                  className="px-4 py-2 bg-[#0F6E56] hover:bg-[#0b513f] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Program
                </button>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-sm">No programs found</h3>
                  <p className="text-gray-500 text-xs mt-1">You haven't published any training courses yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {programs.map((prog) => (
                    <div key={prog.id} className="bg-white rounded-xl shadow-xs border border-gray-100 hover:border-[#D1FAE5] hover:shadow-md transition-all overflow-hidden flex flex-col group relative">
                      <div className="p-5 border-b border-gray-50 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#0F6E56] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                            {prog.type} Course
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prog.slotsRemaining > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {prog.slotsRemaining > 0 ? `${prog.slotsRemaining} Slots Left` : "Full"}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 group-hover:text-[#0F6E56] transition-colors">{prog.title}</h3>
                        <p className="text-[10px] text-gray-500 font-medium mb-3">⏱ {prog.trainingHours} Hours • {prog.cost}</p>
                        
                        <div className="space-y-1.5 mt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{prog.location}</span>
                          </div>
                          {prog.startDate && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate">{prog.startDate} to {prog.endDate || 'TBA'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-gray-50/50 p-3 flex items-center justify-between">
                        {deletingProgramId === prog.id ? (
                          <div className="flex items-center gap-2 w-full justify-end">
                            <button
                              onClick={() => {
                                handleDeleteProgram(prog.id, prog.title);
                                setDeletingProgramId(null);
                              }}
                              className="text-[10px] bg-red-600 hover:bg-red-700 text-white font-extrabold px-3 py-1 rounded shadow-2xs transition-colors cursor-pointer"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setDeletingProgramId(null)}
                              className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-3 py-1 rounded transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 w-full justify-end">
                            <button
                              onClick={() => setViewingProgram(prog)}
                              className="flex items-center gap-1 px-2.5 py-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors text-[10px] font-bold cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button
                              onClick={() => handleEditProgramClick(prog)}
                              className="flex items-center gap-1 px-2.5 py-1 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-[10px] font-bold cursor-pointer"
                              title="Edit Program"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              onClick={() => setDeletingProgramId(prog.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors text-[10px] font-bold cursor-pointer"
                              title="Delete Program"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Training Hours</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 240"
                          value={progTrainingHours}
                          onChange={(e) => setProgTrainingHours(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full p-2.5 pr-12 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                        />
                        <span className="absolute right-3 top-2.5 text-xs text-gray-400 font-medium">hours</span>
                      </div>
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
                      placeholder="e.g. San Luis Municipal Gym"
                      value={progLocation}
                      onChange={(e) => setProgLocation(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Training Days</label>
                    <div className="flex flex-wrap gap-2">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                        <label key={day} className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          progTrainingDays.includes(day)
                            ? "bg-teal-50 border-teal-200 text-teal-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>
                          <input
                            type="checkbox"
                            checked={progTrainingDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProgTrainingDays(prev => [...prev, day]);
                              } else {
                                setProgTrainingDays(prev => prev.filter(d => d !== day));
                              }
                            }}
                            className="hidden"
                          />
                          {day.substring(0, 3)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Start Time</label>
                      <input
                        type="text"
                        onFocus={(e) => e.target.type = 'time'}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        placeholder="Select Start Time"
                        value={progStartTime}
                        onChange={(e) => setProgStartTime(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-hidden font-sans placeholder:text-gray-400 placeholder:font-normal transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">End Time</label>
                      <input
                        type="text"
                        onFocus={(e) => e.target.type = 'time'}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        placeholder="Select End Time"
                        value={progEndTime}
                        onChange={(e) => setProgEndTime(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-hidden font-sans placeholder:text-gray-400 placeholder:font-normal transition-colors"
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
                        onFocus={(e) => e.target.type = 'date'}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        placeholder="Select Start Date"
                        value={progStartDate}
                        onChange={(e) => setProgStartDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-hidden font-sans placeholder:text-gray-400 placeholder:font-normal transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">End Date</label>
                      <input
                        type="text"
                        onFocus={(e) => e.target.type = 'date'}
                        onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                        placeholder="Select End Date"
                        value={progEndDate}
                        onChange={(e) => setProgEndDate(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 focus:text-gray-900 focus:ring-1 focus:ring-teal-500 focus:outline-hidden font-sans placeholder:text-gray-400 placeholder:font-normal transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Eligibility Requirements</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Must be KK registered resident of San Luis"
                      value={progEligibility}
                      onChange={(e) => setProgEligibility(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Required Documents</label>
                      <input
                        type="text"
                        placeholder="e.g. Resume, Valid ID, Brgy Clearance (comma separated)"
                        value={progRequiredDocuments}
                        onChange={(e) => setProgRequiredDocuments(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Required Skills</label>
                      <input
                        type="text"
                        placeholder="e.g. Basic Computer, English (comma separated)"
                        value={progRequiredSkills}
                        onChange={(e) => setProgRequiredSkills(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Person</label>
                      <input
                        type="text"
                        placeholder="e.g. Evelyn Castor"
                        value={progContactName}
                        onChange={(e) => setProgContactName(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +63 932 777 3344"
                        value={progContactPhone}
                        onChange={(e) => setProgContactPhone(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-teal-500 focus:outline-hidden"
                      />
                    </div>
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

                    {selectedApplicant.email && (
                      <div className="flex gap-2">
                        <Mail className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Registered Email</p>
                          <p className="text-xs text-gray-800 font-semibold">{selectedApplicant.email}</p>
                        </div>
                      </div>
                    )}

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
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Out-of-school Youth (OSY)
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

      {/* Program Details Modal */}
      {viewingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setViewingProgram(null)}
          />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
              <div>
                <span className="text-[10px] font-black text-[#0F6E56] bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider mb-2 inline-block border border-teal-100">
                  {viewingProgram.type} Course
                </span>
                <h3 className="text-xl font-black text-gray-900 leading-tight">{viewingProgram.title}</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">{viewingProgram.provider}</p>
              </div>
              <button
                onClick={() => setViewingProgram(null)}
                className="p-2 bg-white hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-xl transition-all shadow-2xs border border-gray-200 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 bg-white space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-[#0F6E56] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Training Hours</p>
                    <p className="text-sm font-black text-gray-800">{viewingProgram.trainingHours} Hours</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Slot Allocation</p>
                    <p className="text-sm font-black text-gray-800">{viewingProgram.slotsRemaining} / {viewingProgram.slotsTotal} Available</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Schedule & Location
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Training Days</p>
                    <p className="font-bold text-gray-900">{viewingProgram.trainingDays?.length ? viewingProgram.trainingDays.join(', ') : 'TBA'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Time Schedule</p>
                    <p className="font-bold text-gray-900">
                      {viewingProgram.startTime ? `${new Date(viewingProgram.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 'TBA'} 
                      {viewingProgram.endTime ? ` - ${new Date(viewingProgram.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Program Dates</p>
                    <p className="font-bold text-gray-900">
                      {viewingProgram.startDate ? new Date(viewingProgram.startDate).toLocaleDateString() : 'TBA'} 
                      {viewingProgram.endDate ? ` to ${new Date(viewingProgram.endDate).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Location</p>
                    <p className="font-bold text-gray-900">{viewingProgram.location}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  Eligibility & Requirements
                </h4>
                <p className="text-xs text-gray-600 font-medium leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {viewingProgram.eligibility || 'No specific eligibility requirements provided.'}
                </p>
                {viewingProgram.requiredDocuments && viewingProgram.requiredDocuments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-gray-900 mb-2">Required Documents:</p>
                    <ul className="list-disc pl-4 text-xs text-gray-600 font-medium space-y-1">
                      {viewingProgram.requiredDocuments.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <h4 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Contact Person</p>
                    <p className="font-bold text-gray-900">{viewingProgram.contactPerson || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400 mb-0.5">Contact Number</p>
                    <p className="font-bold text-gray-900">{viewingProgram.contactNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setViewingProgram(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
