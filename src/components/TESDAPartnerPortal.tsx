"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase, Users, Target, Check, X, FileText, Plus, LogOut, Award, Calendar, Phone, Mail, ArrowLeft,
  Search, ChevronDown, ChevronUp, BookOpen, SlidersHorizontal, Eye, MapPin, GraduationCap, Info, User,
  Trash2, Pencil, Bell, CheckCircle, Clock, AlertTriangle, Sparkles, Filter, ChevronRight, CheckCircle2,
  Building, UserCheck, ShieldCheck, Layers, ArrowUpRight, Archive
} from "lucide-react";
import { TESDAProgram, ReferralPipelineItem, TESDAPartnerScreen, YouthProfile } from "../types";
import { MetricCard, SikapLogo, ConfirmationModal } from "./ReusableComponents";

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
  
  // Dashboard Sub-tabs
  const [dashboardTab, setDashboardTab] = useState<"all" | "pending" | "enrolled" | "programs">("all");

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

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

  // Helper to detect if program term / duration is concluded
  const isProgramDurationDone = (prog?: TESDAProgram | null) => {
    if (!prog || !prog.endDate) return false;
    try {
      const end = new Date(prog.endDate);
      return !isNaN(end.getTime()) && end < new Date();
    } catch {
      return false;
    }
  };

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

  // Editing program ID state
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const handleNewProgramClick = () => {
    setEditingProgramId(null);
    setProgTitle("");
    setProgLevel("NC II");
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

  const handleOpenEditModal = (prog: TESDAProgram) => {
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
    
    // Format times
    if (prog.startTime) {
      const d = new Date(prog.startTime);
      setProgStartTime(!isNaN(d.getTime()) ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : prog.startTime);
    } else setProgStartTime("");
    
    if (prog.endTime) {
      const d = new Date(prog.endTime);
      setProgEndTime(!isNaN(d.getTime()) ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : prog.endTime);
    } else setProgEndTime("");

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

        if (newStatus === "Enrolled") {
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
        setReferrals(prev => prev.map(r => (r.programTitle === title && r.status === "Enrolled") ? { ...r, status: "Archived" } : r));
        addToast(data.message || `Program "${title}" and enrolled students archived in database.`, "success");
      } else {
        addToast(data.error || "Failed to delete program", "error");
      }
    } catch (err) {
      console.error("Error deleting program:", err);
      setPrograms(prev => prev.filter(p => p.id !== progId));
      addToast(`Program "${title}" has been archived.`, "success");
    }
  };

  const handleArchiveProgram = async (progId: string, title: string) => {
    try {
      const res = await fetch(`/api/programs?id=${progId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPrograms(prev => prev.filter(p => p.id !== progId));
        setReferrals(prev => prev.map(r => (r.programTitle === title && r.status === "Enrolled") ? { ...r, status: "Archived" } : r));
        addToast(data.message || `Program "${title}" and enrolled students have been concluded & archived. Ready for a new term!`, "success");
      } else {
        addToast(data.error || "Failed to archive program term", "error");
      }
    } catch (err) {
      console.error("Error archiving program:", err);
      addToast(`Network error: Could not archive "${title}".`, "error");
    }
  };

  // Computed Metrics
  const totalSlotsRemaining = useMemo(() => programs.reduce((acc, curr) => acc + curr.slotsRemaining, 0), [programs]);
  const totalSlotsAllocated = useMemo(() => programs.reduce((acc, curr) => acc + (curr.slotsTotal || 30), 0), [programs]);
  const pendingReferralsCount = useMemo(() => referrals.filter(r => r.status === "Pending").length, [referrals]);
  const enrolledReferralsCount = useMemo(() => referrals.filter(r => r.status === "Enrolled").length, [referrals]);

  // Unique Barangays from referrals
  const uniqueBarangays = useMemo(() => {
    const set = new Set(referrals.map(r => r.barangay).filter(Boolean));
    return Array.from(set).sort();
  }, [referrals]);

  // Filter referrals based on search, status, program, barangay, and dashboardTab
  const filteredReferrals = useMemo(() => {
    return referrals.filter(item => {
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
  }, [referrals, pipelineSearch, pipelineStatusFilter, pipelineProgramFilter, pipelineBarangayFilter, dashboardTab]);

  // Get all unique program titles from active programs and existing referrals
  const allProgramTitles = useMemo(() => Array.from(new Set([
    ...programs.map(p => p.title),
    ...referrals.map(r => r.programTitle)
  ])), [programs, referrals]);

  // Group the filtered referrals by program title
  const groupedReferrals: Record<string, ReferralPipelineItem[]> = useMemo(() => {
    const grouped: Record<string, ReferralPipelineItem[]> = {};
    allProgramTitles.forEach(title => {
      grouped[title] = [];
    });

    filteredReferrals.forEach(item => {
      if (!grouped[item.programTitle]) {
        grouped[item.programTitle] = [];
      }
      grouped[item.programTitle].push(item);
    });
    return grouped;
  }, [allProgramTitles, filteredReferrals]);

  const isSearchActive = pipelineSearch !== "" || pipelineStatusFilter !== "All" || pipelineProgramFilter !== "All" || pipelineBarangayFilter !== "All" || dashboardTab !== "all";

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
    return programs.filter(prog => {
      const matchesSearch = prog.title.toLowerCase().includes(programSearchQuery.toLowerCase()) ||
                            (prog.location && prog.location.toLowerCase().includes(programSearchQuery.toLowerCase())) ||
                            (prog.instructor && prog.instructor.toLowerCase().includes(programSearchQuery.toLowerCase()));
      const matchesLevel = programLevelFilter === "All" || prog.title.toUpperCase().includes(programLevelFilter);
      return matchesSearch && matchesLevel;
    });
  }, [programs, programSearchQuery, programLevelFilter]);

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
    <div className="min-h-screen bg-[#F8FAF9] flex font-sans text-slate-800 antialiased" id="tesda-portal-container">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#112F24] text-white flex flex-col justify-between shadow-xl shrink-0 z-20">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-emerald-900/50">
            <div className="flex items-center gap-2.5">
              <SikapLogo size={32} variant="white" showText={true} />
              <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-700/40">
                Partner
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/70 font-medium mt-2">TESDA Training & Livelihood Hub</p>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-5 space-y-1.5">
            <p className="px-3 text-[10px] font-black uppercase tracking-wider text-emerald-400/60 mb-2">Main Portals</p>
            
            <button
              onClick={() => {
                setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
                setDashboardTab("all");
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
              onClick={() => setCurrentScreen(TESDAPartnerScreen.PROGRAMS)}
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
                {programs.length}
              </span>
            </button>

            <button
              onClick={handleNewProgramClick}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                currentScreen === TESDAPartnerScreen.ADD_PROGRAM || currentScreen === TESDAPartnerScreen.EDIT_PROGRAM
                  ? "bg-gradient-to-r from-emerald-800/80 to-emerald-900 text-emerald-200 shadow-sm border-l-4 border-emerald-400"
                  : "text-emerald-100/75 hover:bg-emerald-900/40 hover:text-white"
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Post New Course</span>
            </button>
          </div>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-emerald-900/50 bg-[#0c241b]">
          <div className="flex items-center gap-3 mb-3 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/30">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-30 px-8 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-[#0A6B43] rounded-xl border border-emerald-100 hidden sm:block">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
                  {currentUser?.name || "TESDA GPSAT"} Portal
                </h1>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
                  San Luis Matchmaker
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Katipunan ng Kabataan (KK) Out-of-School Youth Technical-Vocational Admissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Action: New Program */}
            <button
              onClick={handleNewProgramClick}
              className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer hover:shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Post Training Course
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2.5 text-slate-600 hover:text-[#0A6B43] bg-slate-100/80 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer ${
                  showNotifications ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-300" : ""
                }`}
                title="TESDA Notifications"
              >
                <Bell className="w-4 h-4" />
                {!notificationsRead && pendingReferralsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
                    {pendingReferralsCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 py-2 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-emerald-50/70">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-slate-900 text-xs">TESDA Action Center</span>
                      </div>
                      <button
                        onClick={() => {
                          setNotificationsRead(true);
                          addToast("Notifications marked as read", "info");
                        }}
                        className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                      >
                        Mark read
                      </button>
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                      {pendingReferralsCount > 0 && (
                        <div
                          onClick={() => {
                            setCurrentScreen(TESDAPartnerScreen.DASHBOARD);
                            setDashboardTab("pending");
                            setShowNotifications(false);
                          }}
                          className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3 bg-amber-50/30"
                        >
                          <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">Pending Youth Applications ({pendingReferralsCount})</p>
                            <p className="text-[11px] text-slate-600 font-medium mt-0.5">Youth members are waiting for TESDA enrollment confirmation.</p>
                          </div>
                        </div>
                      )}

                      <div
                        onClick={() => {
                          setCurrentScreen(TESDAPartnerScreen.PROGRAMS);
                          setShowNotifications(false);
                        }}
                        className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="p-2 rounded-xl bg-emerald-100/70 text-[#0A6B43] shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Active Training Programs ({programs.length})</p>
                          <p className="text-[11px] text-slate-600 font-medium mt-0.5">{totalSlotsRemaining} open training slots available across courses.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* ============================================================ */}
          {/* SCREEN 1: DASHBOARD & PIPELINE */}
          {/* ============================================================ */}
          {currentScreen === TESDAPartnerScreen.DASHBOARD && (
            <div className="space-y-6">
              
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
                  value={programs.length}
                  subtitle={`${programs.filter(p => p.slotsRemaining > 0).length} active · ${programs.filter(p => p.slotsRemaining === 0).length} full`}
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
                  title="Total Pipeline"
                  value={referrals.length}
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
                  <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
                    <button
                      onClick={() => setDashboardTab("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        dashboardTab === "all"
                          ? "bg-white text-[#0A6B43] shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All Candidates ({referrals.length})
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
                      Course Roster ({programs.length})
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
                      {programs.map(p => (
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
              {dashboardTab !== "programs" && (
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
                      const originalProgram = programs.find(p => p.title === title);
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
                                <div className="flex items-center gap-3 text-xs text-emerald-200/80 mt-0.5 flex-wrap font-medium">
                                  {originalProgram?.trainingHours && (
                                    <span>⏱ {originalProgram.trainingHours} Hours</span>
                                  )}
                                  {originalProgram?.location && (
                                    <span>📍 {originalProgram.location}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Capacity Indicator & Actions */}
                            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                              {originalProgram && isProgramDurationDone(originalProgram) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProgramToArchive(originalProgram);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                  title="Conclude Term and Archive Student Records"
                                >
                                  <Archive className="w-3.5 h-3.5" /> Archive Term
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
                  {programs.map((prog) => (
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

                        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
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
                          {prog.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{prog.startDate} to {prog.endDate || "Ongoing"}</span>
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
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                              title="Conclude Term & Archive Students"
                            >
                              <Archive className="w-3 h-3" /> Archive
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
                            {prog.startDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="truncate">{prog.startDate} to {prog.endDate || "Ongoing"}</span>
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

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Training Hours *</label>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Start Time</label>
                          <input
                            type="time"
                            value={progStartTime}
                            onChange={(e) => setProgStartTime(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600 uppercase">End Time</label>
                          <input
                            type="time"
                            value={progEndTime}
                            onChange={(e) => setProgEndTime(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                          />
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                    <p className="text-sm font-black text-slate-900">{viewingProgram.trainingHours} Hours</p>
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
                    <p className="font-bold text-slate-900">{viewingProgram.trainingDays?.length ? viewingProgram.trainingDays.join(', ') : 'Mon - Fri'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Time Slot</p>
                    <p className="font-bold text-slate-900">{viewingProgram.startTime || "08:00"} - {viewingProgram.endTime || "17:00"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Venue / Room</p>
                    <p className="font-bold text-slate-900">{viewingProgram.location} {viewingProgram.room ? `(${viewingProgram.room})` : ""}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Instructor</p>
                    <p className="font-bold text-slate-900">{viewingProgram.instructor || "Assigned TESDA Trainer"}</p>
                  </div>
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Training Hours *</label>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">Start Time</label>
                      <input
                        type="time"
                        value={progStartTime}
                        onChange={(e) => setProgStartTime(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">End Time</label>
                      <input
                        type="time"
                        value={progEndTime}
                        onChange={(e) => setProgEndTime(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
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
        description={`The training duration for "${programToArchive?.title}" has completed. Archiving will remove it from the active course catalog to open a new term, and safely archive all enrolled student records as "Completed / Graduated" in the database. Their training records and certificates will remain preserved in the system.`}
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
        description={`Are you sure you want to delete "${programToDelete?.title}"? This will archive the training course and its student records in the database.`}
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
