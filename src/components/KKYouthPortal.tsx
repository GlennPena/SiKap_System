"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Home, Target, Award, User, Bell, Sparkles, Plus, CheckCircle,
  AlertTriangle, Phone, Mail, MapPin, Briefcase, Trash2, X, Globe, MessageSquare, LogOut,
  Calendar, Clock, XCircle, Megaphone, Lock, Eye, EyeOff, Copy, RefreshCw, Edit, ShieldCheck, ShieldAlert, Send,
  BookmarkCheck, ChevronRight, Check, FileCheck, ArrowRight, ExternalLink, Bookmark
} from "lucide-react";
import { formatContactNumber } from "../lib/utils";
import { YouthProfile, TESDAProgram, SKAnnouncement, YouthScreen, ReferralPipelineItem } from "../types";
import { FlameMatchScore, GeminiExplanationBox, PathwayTimeline, SikapLogo } from "./ReusableComponents";
import { calculateContentBasedMatchScore, calculateDetailedCBFMatch, rankProgramsForYouth, getSuggestedSkillsForYouth, formatProgramTime } from "../lib/cbf-matcher";
import { GeminiLongTermCareerPlan } from "../lib/gemini";

interface KKYouthPortalProps {
  youthProfile: YouthProfile;
  setYouthProfiles: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  announcements: SKAnnouncement[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  referrals?: ReferralPipelineItem[];
  setReferrals?: React.Dispatch<React.SetStateAction<ReferralPipelineItem[]>>;
  currentUser?: any;
}

export const KKYouthPortal: React.FC<KKYouthPortalProps> = ({
  youthProfile,
  setYouthProfiles,
  programs,
  announcements,
  onLogout,
  addToast,
  referrals,
  setReferrals,
  currentUser
}) => {
  const isUnverified = youthProfile.approvalStatus === "Pending" || youthProfile.approvalStatus === "Rejected";

  const [activeTab, setActiveTab] = useState<YouthScreen>(YouthScreen.HOME);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProgramToApply, setSelectedProgramToApply] = useState<TESDAProgram | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Profile sub-tabs & editable states
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "skills" | "security" | "badge">("profile");
  const [editGoal, setEditGoal] = useState(youthProfile.livelihoodGoal || "");
  const [editSector, setEditSector] = useState(youthProfile.sectorPreference || "IT & Technology");
  const [editPhone, setEditPhone] = useState(youthProfile.contactNumber || "+63 9");
  const [editEdu, setEditEdu] = useState(youthProfile.educationalAttainment || "High School Level");
  const [editStatus, setEditStatus] = useState(youthProfile.currentStatus || "Out-of-School Youth");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);

  // Helper to reliably parse career plan whether object or JSON string
  const parseCareerPlan = (plan: any): GeminiLongTermCareerPlan | null => {
    if (!plan) return null;
    let obj = plan;
    if (typeof obj === "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        return null;
      }
    }
    if (typeof obj === "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        return null;
      }
    }
    if (obj && typeof obj === "object" && (obj.roadmapTitle || obj.summary)) {
      return {
        roadmapTitle: obj.roadmapTitle || "Post-Graduation Career Roadmap",
        summary: obj.summary || "Tailored career development and livelihood roadmap.",
        targetGoal: obj.targetGoal || "",
        programTitle: obj.programTitle || "",
        immediate30Days: Array.isArray(obj.immediate30Days) ? obj.immediate30Days : [],
        employmentTrack: {
          targetRoles: Array.isArray(obj.employmentTrack?.targetRoles) ? obj.employmentTrack.targetRoles : ["Entry-Level Specialist"],
          targetLocations: obj.employmentTrack?.targetLocations || "San Luis & Pampanga Area",
          estimatedSalary: obj.employmentTrack?.estimatedSalary || "₱15,000 – ₱20,000 / month",
          actionSteps: Array.isArray(obj.employmentTrack?.actionSteps) ? obj.employmentTrack.actionSteps : []
        },
        entrepreneurshipTrack: {
          businessConcept: obj.entrepreneurshipTrack?.businessConcept || "Local Home-Based Enterprise",
          starterFunding: obj.entrepreneurshipTrack?.starterFunding || "SK San Luis Youth Livelihood Grant",
          initialServices: Array.isArray(obj.entrepreneurshipTrack?.initialServices) ? obj.entrepreneurshipTrack.initialServices : []
        },
        longTerm1To2Years: Array.isArray(obj.longTerm1To2Years) ? obj.longTerm1To2Years : [],
        localSupportContacts: Array.isArray(obj.localSupportContacts) ? obj.localSupportContacts : ["SK Federation Livelihood Desk (San Luis, Pampanga)", "San Luis PESO Office"],
        generatedDate: obj.generatedDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      };
    }
    return null;
  };

  // Step 4 Gemini Long-Term Career Plan states
  const currentSavedPlan = parseCareerPlan(youthProfile.savedCareerPlan);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeminiLongTermCareerPlan | null>(currentSavedPlan);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  useEffect(() => {
    const parsed = parseCareerPlan(youthProfile.savedCareerPlan);
    if (parsed) {
      setGeneratedPlan(parsed);
      if (typeof window !== "undefined" && youthProfile.name) {
        localStorage.setItem(`sikap_career_plan_${youthProfile.name}`, JSON.stringify(parsed));
        if (youthProfile.id) localStorage.setItem(`sikap_career_plan_${youthProfile.id}`, JSON.stringify(parsed));
      }
    } else {
      setGeneratedPlan(null);
      if (typeof window !== "undefined") {
        if (youthProfile.name) localStorage.removeItem(`sikap_career_plan_${youthProfile.name}`);
        if (youthProfile.id) localStorage.removeItem(`sikap_career_plan_${youthProfile.id}`);
      }
    }
  }, [youthProfile.savedCareerPlan, youthProfile.name, youthProfile.id]);

  const handleGenerateCareerPlan = async (prog?: TESDAProgram | null) => {
    const existing = currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan) || generatedPlan;
    if (existing?.roadmapTitle) {
      addToast("Your official career plan is already generated and saved to your account.", "info");
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/career-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youthProfile,
          program: prog || null
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newPlan = parseCareerPlan(data.data) || data.data;
        setGeneratedPlan(newPlan);

        // Instantly cache in localStorage
        if (typeof window !== "undefined") {
          if (youthProfile.name) localStorage.setItem(`sikap_career_plan_${youthProfile.name}`, JSON.stringify(newPlan));
          if (youthProfile.id) localStorage.setItem(`sikap_career_plan_${youthProfile.id}`, JSON.stringify(newPlan));
        }

        // Automatically persist to PostgreSQL database
        try {
          const saveRes = await fetch("/api/youth", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: youthProfile.id,
              savedCareerPlan: newPlan
            })
          });
          const saveData = await saveRes.json();
          if (saveData.success) {
            setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: newPlan } : y));
            addToast("Google Gemini Career Plan generated & saved permanently to your account!", "success");
          }
        } catch (saveErr) {
          console.error("Auto-save career plan error:", saveErr);
        }
      } else {
        addToast(data.error || "Failed to generate career plan", "error");
      }
    } catch (err) {
      console.error("Error generating career plan:", err);
      addToast("Failed to connect to Google Gemini API. Please try again.", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveCareerPlanToIDCard = async (planToSave: GeminiLongTermCareerPlan) => {
    if (!planToSave) return;
    setIsSavingPlan(true);
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          savedCareerPlan: planToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: planToSave } : y));
        addToast("Career Roadmap successfully saved to your KK Digital ID Card!", "success");
      } else {
        addToast(data.error || "Failed to save career plan", "error");
      }
    } catch (err) {
      console.error("Error saving career plan:", err);
      addToast("Network error: Could not save plan.", "error");
    } finally {
      setIsSavingPlan(false);
    }
  };
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Filter announcements to only show active, unexpired ones matching member's barangay
  const localAnnouncements = useMemo(() => {
    const now = new Date().getTime();
    return announcements.filter(ann => {
      if (ann.status === "Cancelled") return false;

      if (ann.eventDate) {
        const parsed = Date.parse(ann.eventDate);
        if (!isNaN(parsed) && parsed < now - 86400000) {
          return false;
        }
      }

      if (!ann.barangay) return true; // Municipal / Global announcement
      const annBrgy = ann.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = youthProfile.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return annBrgy === dbBrgy;
    });
  }, [announcements, youthProfile.barangay]);

  const calculatedAge = useMemo(() => {
    if (!youthProfile.registeredDate) return youthProfile.age;
    const regDate = new Date(youthProfile.registeredDate);
    const now = new Date();
    if (isNaN(regDate.getTime())) return youthProfile.age;

    let years = now.getFullYear() - regDate.getFullYear();
    const m = now.getMonth() - regDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < regDate.getDate())) {
      years--;
    }
    return youthProfile.age + Math.max(0, years);
  }, [youthProfile.age, youthProfile.registeredDate]);

  const [liveGeminiAdvice, setLiveGeminiAdvice] = useState<string>("");
  const [liveGeminiBullets, setLiveGeminiBullets] = useState<string[]>([]);
  const [viewingProgramModal, setViewingProgramModal] = useState<{
    program: TESDAProgram;
    matchScore?: number;
  } | null>(null);

  const scoredPrograms = useMemo(() => {
    return programs
      .map(p => ({
        program: p,
        matchScore: calculateContentBasedMatchScore(youthProfile, p)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [programs, youthProfile]);

  useEffect(() => {
    if (youthProfile && programs.length > 0) {
      fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youth: youthProfile,
          programs: scoredPrograms.map(sp => sp.program),
          generateLLMAdvice: true
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.careerAdvice) setLiveGeminiAdvice(data.careerAdvice);
            if (Array.isArray(data.bulletAdvice) && data.bulletAdvice.length > 0) {
              setLiveGeminiBullets(data.bulletAdvice);
            }
          }
        })
        .catch(err => console.error("Error fetching Gemini advice:", err));
    }
  }, [youthProfile.skills, youthProfile.sectorPreference, youthProfile.livelihoodGoal, youthProfile.interests, scoredPrograms]);

  const skChairpersonName = useMemo(() => {
    return "Your SK Chairperson";
  }, [youthProfile.barangay]);

  // Helper to reliably match youth names regardless of accents or casing
  const isSameYouth = (rYouthName?: string, currentYouthName?: string) => {
    if (!rYouthName || !currentYouthName) return false;
    const n1 = rYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const n2 = currentYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  };

  // Get enrolled referrals and match them with program details
  const enrolledReferrals = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name) && r.status === "Enrolled") || [];
  const enrolledPrograms = enrolledReferrals.map(ref => {
    const program = programs.find(p => p.title === ref.programTitle);
    return {
      ref,
      program
    };
  });

  const getOverlapWarning = (prog: TESDAProgram): string | null => {
    if (enrolledPrograms.length === 0) return null;

    for (const ep of enrolledPrograms) {
      if (ep.program?.title === prog.title) continue;

      const enrolledStartStr = ep.program?.startDate;
      const enrolledEndStr = ep.program?.endDate;
      const progStartStr = prog.startDate;

      if (enrolledStartStr && enrolledEndStr && progStartStr) {
        const enrolledEnd = new Date(enrolledEndStr);
        const newStart = new Date(progStartStr);

        // If the date of the program is after their enrolled program is done
        if (newStart > enrolledEnd) {
          continue;
        }

        return `You cannot enroll in this program because your enrolled program "${ep.ref.programTitle}" (${enrolledStartStr} to ${enrolledEndStr}) is still ongoing at the start of this course (${progStartStr}).`;
      } else {
        return `You cannot enroll in this program due to a scheduling conflict with your enrolled program "${ep.ref.programTitle}".`;
      }
    }
    return null;
  };

  // Check if a youth has already completed this program or an identical/equivalent qualification
  const isProgramCompleted = (prog: TESDAProgram) => {
    return !!referrals?.some(r =>
      isSameYouth(r.youthName, youthProfile.name) &&
      r.status === "Archived" &&
      (
        r.programTitle.toLowerCase().trim() === prog.title.toLowerCase().trim() ||
        r.programId === prog.id ||
        (
          prog.title.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim().length > 3 &&
          r.programTitle.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim() ===
          prog.title.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim()
        )
      )
    );
  };

  const handleDeletePathway = async (referralId: string) => {
    try {
      await fetch(`/api/referrals?id=${referralId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting referral:", err);
    }
    if (setReferrals) {
      setReferrals(prev => {
        const filtered = prev.filter(r => r.id !== referralId);
        const hasAnyOther = filtered.some(r => r.youthName === youthProfile.name);
        if (!hasAnyOther) {
          setYouthProfiles(all => all.map(y => {
            if (y.id === youthProfile.id) {
              return { ...y, hasReferred: false };
            }
            return y;
          }));
        }
        return filtered;
      });
      addToast("Declined livelihood pathway removed successfully.", "success");
    }
  };

  const handleCancelApplication = async (referralId: string) => {
    if (isUnverified) {
      addToast("Cannot cancel applications in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    try {
      const res = await fetch(`/api/referrals?id=${referralId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success && data.error) {
        addToast(data.error || "Failed to cancel application", "error");
        return;
      }
    } catch (err) {
      console.error("Error cancelling referral:", err);
    }
    if (setReferrals) {
      setReferrals(prev => {
        const filtered = prev.filter(r => r.id !== referralId);
        const hasAnyOther = filtered.some(r => r.youthName === youthProfile.name);
        if (!hasAnyOther) {
          setYouthProfiles(all => all.map(y => {
            if (y.id === youthProfile.id) {
              return { ...y, hasReferred: false };
            }
            return y;
          }));
        }
        return filtered;
      });
      addToast("Application cancelled successfully.", "success");
    }
  };

  // local convenience updates
  const handleAddSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnverified) {
      addToast("Cannot add skills in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    if (!newSkillInput.trim()) return;

    if (youthProfile.skills.includes(newSkillInput.trim())) {
      addToast("Skill already exists in your profile", "info");
      return;
    }

    const updatedSkills = [...youthProfile.skills, newSkillInput.trim()];
    const tempYouth = { ...youthProfile, skills: updatedSkills };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : Math.min(99, youthProfile.matchScore + 3);
    
    // update global profiles
    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          matchScore: updatedMatchScore
        };
      }
      return y;
    }));

    // Persist skill addition to PostgreSQL
    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills,
          matchScore: updatedMatchScore
        })
      });
    } catch (err) {
      console.error("Error persisting skill addition:", err);
    }

    addToast(`Added "${newSkillInput.trim()}" to your skills. Matches refreshed!`, "success");
    setNewSkillInput("");
    setShowAddSkillModal(false);
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnverified) {
      addToast("Cannot edit profile details while awaiting SK Verification", "error");
      return;
    }

    const tempYouth = {
      ...youthProfile,
      livelihoodGoal: editGoal,
      sectorPreference: editSector,
      educationalAttainment: editEdu,
      currentStatus: editStatus
    };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : youthProfile.matchScore;

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          livelihoodGoal: editGoal,
          sectorPreference: editSector,
          contactNumber: editPhone,
          educationalAttainment: editEdu,
          currentStatus: editStatus,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, ...data.data, matchScore: updatedMatchScore } : y));
        addToast("Profile details updated in PostgreSQL database!", "success");
      } else {
        addToast(data.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast("Profile details updated successfully!", "success");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("Please fill in all password fields", "error");
      return;
    }
    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters long", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New password and password confirmation do not match", "error");
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
        addToast(data.message || "Account password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast(data.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      addToast("Network error updating password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRemoveSkillLocal = async (skill: string) => {
    if (isUnverified) {
      addToast("Cannot remove skills in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const updatedSkills = youthProfile.skills.filter(s => s !== skill);

    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return { ...y, skills: updatedSkills };
      }
      return y;
    }));

    // Persist skill removal to PostgreSQL
    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills
        })
      });
    } catch (err) {
      console.error("Error persisting skill removal:", err);
    }

    addToast(`Skill "${skill}" removed`, "info");
  };

  // Direct Apply to TESDA
  const handleDirectApply = (prog: TESDAProgram) => {
    if (isUnverified) {
      addToast("Cannot apply for programs in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    if (isProgramCompleted(prog)) {
      addToast(`You have already completed "${prog.title}" and earned your certification. You cannot re-take this qualification.`, "info");
      return;
    }
    if (prog.slotsRemaining <= 0) {
      addToast(`Sorry, "${prog.title}" is already full!`, "error");
      return;
    }

    setSelectedProgramToApply(prog);
    setShowApplyModal(true);
  };

  const confirmDirectApply = async () => {
    if (!selectedProgramToApply) return;
    if (selectedProgramToApply.slotsRemaining <= 0) {
      addToast(`Sorry, "${selectedProgramToApply.title}" is already full!`, "error");
      return;
    }

    const overlapWarning = getOverlapWarning(selectedProgramToApply);
    if (overlapWarning) {
      addToast(overlapWarning, "error");
      return;
    }

    const calculatedScore = calculateContentBasedMatchScore(youthProfile, selectedProgramToApply);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youthId: youthProfile.id,
          youthName: youthProfile.name,
          programId: selectedProgramToApply.id,
          programTitle: selectedProgramToApply.title,
          matchScore: calculatedScore
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (setReferrals) {
          setReferrals(prev => [data.data, ...prev.filter(r => r.id !== data.data.id)]);
        }
        setYouthProfiles(prev => prev.map(y => {
          if (y.id === youthProfile.id) {
            return { ...y, hasReferred: true };
          }
          return y;
        }));
        addToast(`Application for "${selectedProgramToApply.title}" submitted directly to TESDA successfully!`, "success");
      } else {
        addToast(data.error || "Failed to submit application", "error");
      }
    } catch (err) {
      console.error("Application submission error:", err);
      addToast("Failed to submit application. Please try again.", "error");
    } finally {
      setShowApplyModal(false);
      setViewingProgramModal(null);
      setSelectedProgramToApply(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex" id="youth-portal-container">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1C2B20] text-white flex flex-col justify-between shadow-lg shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <SikapLogo size={32} variant="white" showText={true} />
            <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0">
              <span className="text-xs font-black text-amber-500 uppercase tracking-widest block leading-none">Youth</span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[105px]" title={youthProfile.barangay.replace(/^Barangay\s+/i, "")}>
                {youthProfile.barangay.replace(/^Barangay\s+/i, "")}
              </span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: YouthScreen.HOME, label: "My Dashboard", icon: <Home className="w-4.5 h-4.5" /> },
              { id: YouthScreen.MATCHES, label: "Matched Programs", icon: <Target className="w-4.5 h-4.5" /> },
              { id: YouthScreen.PATHWAY, label: "Livelihood Pathway", icon: <Award className="w-4.5 h-4.5" /> },
              { id: YouthScreen.PROFILE, label: "My Profile & Skills", icon: <User className="w-4.5 h-4.5" /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                    isActive
                      ? "bg-emerald-950 text-emerald-300 border-l-4 border-[#0A6B43]"
                      : "text-gray-300 hover:bg-[#2A3E30] hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-emerald-900/40">
          <div
            onClick={() => setActiveTab(YouthScreen.PROFILE)}
            className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-emerald-950/60 transition-all cursor-pointer group border border-transparent hover:border-emerald-800/40"
            title="Go to My Profile"
          >
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {youthProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold leading-none group-hover:text-[#D99427] transition-colors">{youthProfile.name}</p>
              <p className="text-[10px] text-emerald-200 mt-0.5">{youthProfile.purok} · {youthProfile.barangay}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-emerald-900 hover:border-emerald-700 hover:bg-emerald-950/40 text-xs text-red-300 rounded-lg transition-colors font-semibold"
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
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Welcome, {youthProfile.name}! 👋</h1>
            <p className="text-xs text-gray-500 font-medium">Out-of-School Youth (OSY) Career & Livelihood Portal · San Luis, Pampanga</p>
          </div>
          
          <div className="flex items-center gap-4 relative" id="notification-bell-container">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 text-gray-500 hover:text-[#0A6B43] bg-gray-50 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer ${
                  showNotifications ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-300" : ""
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {!notificationsRead && ((referrals?.filter(r => r.youthName === youthProfile.name).length ?? 0) > 0 || localAnnouncements.length > 0) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white border border-emerald-100 rounded-2xl shadow-2xl z-50 py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                    <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/60 p-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <span className="font-extrabold text-gray-900 text-sm">Notifications & Alerts</span>
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

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {(() => {
                        const userApps = referrals?.filter(r => r.youthName === youthProfile.name) || [];
                        const notificationsList: Array<{ id: string; text: string; subtext: string; date: string; type: "pending" | "enrolled" | "declined" | "general"; targetTab: YouthScreen }> = [];

                        userApps.forEach(app => {
                          if (app.status === "Pending") {
                            notificationsList.push({
                              id: `notify-${app.id}-pending`,
                              text: `Requirements Submission Required`,
                              subtext: `Your application for "${app.programTitle}" is pending. Submit physical requirements at TESDA GPSAT.`,
                              date: app.referralDate || "Just Now",
                              type: "pending",
                              targetTab: YouthScreen.PATHWAY
                            });
                          } else if (app.status === "Enrolled") {
                            notificationsList.push({
                              id: `notify-${app.id}-enrolled`,
                              text: `🎉 Enrollment Approved!`,
                              subtext: `You are officially accepted into "${app.programTitle}". Training sessions will start soon.`,
                              date: "Just Now",
                              type: "enrolled",
                              targetTab: YouthScreen.PATHWAY
                            });
                          } else if (app.status === "Declined") {
                            notificationsList.push({
                              id: `notify-${app.id}-declined`,
                              text: `❌ Application Declined`,
                              subtext: `Your application for "${app.programTitle}" was declined.`,
                              date: "Just Now",
                              type: "declined",
                              targetTab: YouthScreen.PATHWAY
                            });
                          }
                        });

                        // Add announcements
                        localAnnouncements.forEach((ann, idx) => {
                          notificationsList.push({
                            id: `notify-ann-${idx}`,
                            text: ann.title,
                            subtext: ann.body,
                            date: ann.datePosted,
                            type: "general",
                            targetTab: YouthScreen.HOME
                          });
                        });

                        if (notificationsList.length === 0) {
                          return (
                            <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                              <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                              <p className="text-xs font-bold text-gray-700">No alerts right now</p>
                              <p className="text-[10px] text-gray-400">You are all caught up with your training applications!</p>
                            </div>
                          );
                        }

                        return notificationsList.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.targetTab);
                              setShowNotifications(false);
                            }}
                            className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                          >
                            <span className="mt-0.5 text-base leading-none">
                              {item.type === "enrolled" && "🎉"}
                              {item.type === "pending" && "📋"}
                              {item.type === "declined" && "❌"}
                              {item.type === "general" && "📢"}
                            </span>
                            <div className="space-y-0.5 flex-1">
                              <p className="font-bold text-gray-900 leading-tight text-xs">{item.text}</p>
                              <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.subtext}</p>
                              <p className="text-[9px] text-emerald-700 mt-1 font-semibold">{item.date}</p>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400">Click any alert to navigate to that tab</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setActiveTab(YouthScreen.PROFILE)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-200"
              title="Go to My Profile"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500 group-hover:bg-amber-600 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-amber-200 transition-all">
                {youthProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#0A6B43] leading-none transition-colors">{youthProfile.name}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Out-of-School Youth</p>
              </div>
            </button>
          </div>
        </header>

        {/* Outer content container */}
        <div className="p-8 max-w-6xl mx-auto w-full space-y-6">

          {isUnverified && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-amber-900 uppercase tracking-wide">Account Awaiting SK Verification</h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    Your registration as a Katipunan ng Kabataan member is currently being reviewed and verified by Sangguniang Kabataan (SK) Chairperson {skChairpersonName}. You can explore courses, matches, and pathways in <strong>View-Only Mode</strong>, but application submission and profile updates will be unlocked once verified.
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 bg-amber-100/50 border border-amber-250 px-3 py-1.5 rounded-xl">
                <span className="w-2 h-2 bg-amber-600 rounded-full animate-ping" />
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Pending Verification</span>
              </div>
            </div>
          )}

          {/* HOME TAB SCREEN */}
          {activeTab === YouthScreen.HOME && (
            <div className="space-y-6">
              
              {/* Upper Grid: Greeting & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Greeting / Intro */}
                <div className="bg-[#1C2B20] text-white p-6 rounded-2xl shadow-xs md:col-span-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Welcome</span>
                    <h3 className="font-extrabold text-2xl mt-1">Mabuhay, {youthProfile.name}! 👋</h3>
                    <p className="text-sm text-emerald-100/80 mt-2 leading-relaxed">
                      You are registered as an active Katipunan ng Kabataan member in {youthProfile.purok}, Barangay {youthProfile.barangay}. Use this portal to map your competencies, discover high-matching TESDA training programs, and track your active roadmap.
                    </p>
                  </div>
                  <div className="mt-4 flex gap-1.5 flex-wrap">
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600 uppercase">
                      {youthProfile.barangay ? `${youthProfile.barangay.startsWith("Barangay ") ? youthProfile.barangay : `Barangay ${youthProfile.barangay}`} Resident` : "San Luis Resident"}
                    </span>
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600 uppercase">
                      Age: {calculatedAge}
                    </span>
                  </div>
                </div>

                {/* Pathway status */}
                <div className="bg-white p-6 border border-[#D1FAE5] rounded-2xl shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">My Livelihood Status</span>
                    <span className="bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 border border-amber-200 rounded-full uppercase inline-block">
                      {youthProfile.currentStatus}
                    </span>
                    <p className="text-xs text-gray-500 mt-3 font-medium">Current active objective:</p>
                    <p className="text-sm font-bold text-[#D97706] mt-1">
                      {(() => {
                        const app = referrals?.find(r => r.youthName === youthProfile.name);
                        if (app?.status === "Enrolled") return `Enrolled in ${app.programTitle}`;
                        if (app?.status === "Pending") return `Application Pending: ${app.programTitle}`;
                        if (app?.status === "Declined") return "Revise Profile & Explore Opportunities";
                        if (programs && programs.length > 0) return `Apply Directly for ${programs[0].title}`;
                        return "Explore & Apply for Training Programs";
                      })()}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                    className="mt-4 bg-[#D97706] hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg text-center transition-colors w-full"
                  >
                    Track Pathway Progress →
                  </button>
                </div>

              </div>

              {/* ACTIVE ENROLLED CLASSES SECTION */}
              {enrolledPrograms.length > 0 && (
                <div className="bg-white border border-emerald-200 rounded-2xl shadow-xs overflow-hidden" id="active-classes-schedule-container">
                  <div className="bg-[#1C2B20] text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-white">
                      <span className="text-xl">🏫</span>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base tracking-tight text-white">My Active Class & Training Schedule</h4>
                        <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">TESDA GPSAT Official Enrollment Card</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-400/30 uppercase animate-pulse">
                      Status: Officially Enrolled
                    </span>
                  </div>
                  
                  <div className="p-6 divide-y divide-gray-100">
                    {enrolledPrograms.map(({ ref, program }) => {
                      // Fallback info if the program is custom-created without schedule defaults
                      const scheduleDays = (program?.trainingDays ? (Array.isArray(program.trainingDays) ? program.trainingDays.join(", ") : program.trainingDays) : "Monday to Friday");
                      const scheduleTime = program?.startTime && program?.endTime
                        ? `${formatProgramTime(program.startTime)} – ${formatProgramTime(program.endTime)}`
                        : (program?.startTime ? formatProgramTime(program.startTime) : "8:00 AM – 5:00 PM");
                      const room = program?.room || "Main Training Facility";
                      const instructor = program?.instructor || "TESDA Certified Instructor";
                      const provider = program?.provider || "TESDA Training Center";
                      const location = program?.location || "San Luis, Pampanga";

                      return (
                        <div key={ref.id} className="py-4 first:pt-0 last:pb-0 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <h5 className="font-black text-gray-900 text-base">{ref.programTitle}</h5>
                              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                                🏢 {provider}
                              </p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2.5 py-1 rounded-md font-bold uppercase">
                              Enrolled on {ref.referralDate || "Recently"}
                            </span>
                          </div>

                          {/* Grid details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Class Schedule Days</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-600" /> {scheduleDays}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Class Time / Hours</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-amber-600" /> {scheduleTime}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Room / Training Facility</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <span className="text-amber-600 font-bold">📍</span> {room}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Assigned Instructor</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <span className="text-amber-600 font-bold">👤</span> {instructor}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-gray-500 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100/40">
                            <p className="font-medium">
                              📍 <strong>Campus Location:</strong> {location}
                            </p>
                            {program && (
                              <p className="font-semibold text-emerald-800 flex items-center gap-2">
                                <span>📞 Contact Coordinator:</span> {program.contactPerson} ({program.contactNumber})
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Middle Grid: Best Match & Skills */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

                {/* Best Match Card (60%) */}
                {programs.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-3 text-center md:col-span-3 flex flex-col justify-center items-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mb-1">
                      <Target className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-gray-800 text-base">No Active TESDA Programs Published Yet</h4>
                    <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
                      There are currently no active training courses published in the system database. As soon as TESDA partners publish new training programs, our Gemini AI engine will automatically evaluate your registered skills and display your top match here.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const topMatchItem = scoredPrograms[0];
                    const featuredProg = topMatchItem?.program || programs[0];
                    const featuredScore = topMatchItem?.matchScore ?? calculateContentBasedMatchScore(youthProfile, featuredProg);
                    const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === featuredProg.title);
                    const isCompleted = isProgramCompleted(featuredProg);
                    const isEnrolled = app?.status === "Enrolled";
                    const isDeclined = app?.status === "Declined";
                    const isPending = app?.status === "Pending";
                    const isFull = !app && (featuredProg.slotsRemaining !== undefined && featuredProg.slotsRemaining <= 0);
                    
                    const overlapWarning = getOverlapWarning(featuredProg);
                    const isDisabled = isCompleted || !!app || isFull || !!overlapWarning || isUnverified;

                    return (
                      <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 md:col-span-3 ${isCompleted ? "border-purple-200" : "border-[#D1FAE5]"}`}>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs uppercase font-bold tracking-wider ${isCompleted ? "text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-200" : "text-[#D97706]"}`}>
                                {isCompleted ? "Completed Qualification • Top AI Match" : "Featured AI Match for You"}
                              </span>
                              {isCompleted && (
                                <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3 text-purple-600" />
                                  Certified Graduate
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-gray-800 text-lg mt-1">{featuredProg.title}</h4>
                            <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 inline-block mt-1">
                              {featuredProg.provider || "TESDA Partner Program"}
                            </span>
                          </div>
                          <FlameMatchScore score={featuredScore} />
                        </div>

                        <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200/80 space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              Gemini Match Rationale
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700/80">
                              Powered by Google Gemini
                            </span>
                          </div>
                          <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                            "{liveGeminiAdvice || `${youthProfile.name.split(' ')[0]} has practical background skills in ${youthProfile.skills.join(", ") || youthProfile.sectorPreference || "vocational trades"}. This ${featuredProg.title} program will officially certify their qualifications under TESDA and unlock formal job opportunities in ${youthProfile.sectorPreference || "their target industry"}.`}"
                          </p>
                        </div>

                        {/* Personalized 3-Bullet Advice Pathway */}
                        <div className="bg-linear-to-br from-[#F0FDF4] to-[#E8F5EF] p-4 rounded-xl border border-[#9FE1CB]/70 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Gemini Personalized 3-Step Pathway
                            </span>
                            <span className="text-[10px] font-extrabold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              AI Action Plan
                            </span>
                          </div>
                          <ul className="space-y-2 text-xs text-emerald-950 font-medium">
                            {(liveGeminiBullets && liveGeminiBullets.length === 3 ? liveGeminiBullets : [
                              `Leverage your background skills in ${youthProfile.skills.slice(0, 2).join(" & ") || youthProfile.sectorPreference || "vocational trades"} during early course modules.`,
                              `Successfully complete the certified NC II training at ${featuredProg.provider || "TESDA GPSAT"} to obtain nationwide accredited credentials.`,
                              `Utilize local SK Livelihood referrals in Barangay ${youthProfile.barangay || "San Luis"} to achieve "${youthProfile.livelihoodGoal || "certified employment"}".`
                            ]).map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2.5 bg-white/80 p-2.5 rounded-lg border border-emerald-100/80 shadow-2xs">
                                <span className="w-5 h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5 shadow-2xs">
                                  {bIdx + 1}
                                </span>
                                <span className="leading-relaxed text-emerald-950 font-semibold">{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {featuredProg.requiredDocuments && featuredProg.requiredDocuments.length > 0 && (
                          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                            <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                              📋 Physical Requirements Needed Beforehand:
                            </p>
                            <ul className="list-disc pl-4 text-[10px] text-amber-800 space-y-0.5 font-semibold">
                              {featuredProg.requiredDocuments.map((doc, dIdx) => (
                                <li key={dIdx}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                          <div className="space-y-1">
                            <p>⏱ <strong>Duration:</strong> {featuredProg.trainingHours} hours</p>
                            <p>📍 <strong>Location:</strong> {featuredProg.location}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            {isCompleted && (
                              <span className="text-xs font-extrabold text-purple-800 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                Course Completed & Certified
                              </span>
                            )}
                            <button
                              onClick={() => setViewingProgramModal({ program: featuredProg, matchScore: featuredScore })}
                              className="text-xs font-extrabold px-5 py-2.5 rounded-lg bg-[#0A6B43] hover:bg-[#075332] text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-emerald-200" />
                              View Details
                            </button>
                          </div>
                        </div>
                        {overlapWarning && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold leading-relaxed">
                            ⚠️ <strong>Overlap Warning:</strong> {overlapWarning}
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* My Skills Segment (40%) */}
                <div className="bg-white p-6 border border-[#D1FAE5] rounded-2xl shadow-xs flex flex-col justify-between md:col-span-2">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">My Registered Skills</span>
                      <button
                        onClick={() => {
                          if (isUnverified) {
                            addToast("Cannot add skills while account is awaiting SK verification", "error");
                            return;
                          }
                          setShowAddSkillModal(true);
                        }}
                        disabled={isUnverified}
                        className={`text-xs font-bold flex items-center gap-1 ${
                          isUnverified ? "text-gray-300 cursor-not-allowed" : "text-[#D97706] hover:underline cursor-pointer"
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {youthProfile.skills && youthProfile.skills.length > 0 ? (
                        youthProfile.skills.map((s) => (
                          <span key={s} className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1.5 shadow-2xs">
                            {s}
                            <button
                              onClick={() => handleRemoveSkillLocal(s)}
                              disabled={isUnverified}
                              title={`Remove ${s}`}
                              className={`font-bold text-xs pl-1 ${isUnverified ? "text-amber-400 cursor-not-allowed" : "hover:text-red-600 cursor-pointer"}`}
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic font-medium py-1">No skills added yet. Click "+ Add Skill" to register your competencies.</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 mt-6 italic">
                    Tip: Adding more technical or vocational skills updates your compatibility index in real-time.
                  </p>
                </div>

              </div>

              {/* Barangay Announcements Segment */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Sangguniang Kabataan Announcements</span>
                {localAnnouncements.length === 0 ? (
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs text-center flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center text-[#D97706]">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-gray-800 text-sm">No Active SK Announcements</h5>
                    <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">
                      There are currently no published announcements from Sangguniang Kabataan for Barangay {youthProfile.barangay}. Official youth updates and community notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localAnnouncements.map((ann) => (
                      <div key={ann.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-2 items-center flex-wrap gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold uppercase tracking-wide text-[#D97706] bg-amber-50 px-2.5 py-0.5 rounded-full">{ann.category}</span>
                              {ann.eventDate && (
                                <span className="font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#0A6B43]" />
                                  {ann.eventDate}
                                </span>
                              )}
                            </div>
                            <span>{ann.datePosted}</span>
                          </div>
                          <h5 className="font-bold text-gray-800 text-sm">{ann.title}</h5>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">{ann.body}</p>

                          {(ann.venue || ann.contactPerson) && (
                            <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/60 mt-3 space-y-1 text-xs">
                              {ann.venue && (
                                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                  <span>Venue: <strong className="text-gray-900">{ann.venue}</strong></span>
                                </div>
                              )}
                              {ann.contactPerson && (
                                <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                  <span>Contact: <strong className="text-gray-900">{ann.contactPerson}</strong></span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-4 pt-2 border-t border-gray-50 flex justify-between items-center">
                          <span>Target Audience: <span className="font-semibold text-gray-600">{ann.audience}</span></span>
                          {ann.barangay && <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Barangay {ann.barangay.replace(/^Barangay\s+/i, "")}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* MATCHES TAB SCREEN */}
          {activeTab === YouthScreen.MATCHES && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-gray-900 text-xl">Personalized Matches</h3>
                <p className="text-xs text-gray-500 mt-1">Based on your registered competencies, Purok residence, and vocational career goals.</p>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white border border-gray-150 rounded-2xl p-10 shadow-xs text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-[#0A6B43]">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 text-base">No Matching TESDA Programs Available Yet</h4>
                  <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">
                    There are currently no active training programs published in the system. As soon as TESDA partners publish new courses, Google Gemini will automatically analyze your profile and display your personalized matches here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {scoredPrograms.map(({ program: prog, matchScore: score }) => {

                    return (
                      <div key={prog.id} className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-all">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">{prog.provider}</span>
                              <h4 className="font-bold text-gray-800 text-sm mt-1">{prog.title}</h4>
                            </div>
                            <FlameMatchScore score={score} />
                          </div>

                          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                            <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                              Google Gemini identified a {score}% compatibility score between your technical competencies and this local program.
                            </p>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-600">
                            <p>📍 <strong>Location:</strong> {prog.location}</p>
                            <p>⏱ <strong>Duration:</strong> {`${prog.trainingHours} hours`} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""}</p>
                            <p>💰 <strong>Cost:</strong> {prog.cost}</p>
                            <p>🎓 <strong>Eligibility:</strong> {prog.eligibility}</p>
                          </div>

                          {prog.requiredDocuments && prog.requiredDocuments.length > 0 && (
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1.5">
                              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                📋 Required Documents Beforehand:
                              </p>
                              <ul className="list-disc pl-4 text-[10px] text-amber-800 space-y-0.5 font-semibold">
                                {prog.requiredDocuments.map((doc, dIdx) => (
                                  <li key={dIdx}>{doc}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {(() => {
                            const overlapWarning = getOverlapWarning(prog);
                            if (overlapWarning) {
                              return (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold leading-relaxed">
                                  ⚠️ <strong>Overlap Warning:</strong> {overlapWarning}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 pt-4 mt-6 border-t border-gray-100">
                          <span>Slots: <strong>{prog.slotsRemaining}/{prog.slotsTotal}</strong> left</span>
                          {(() => {
                            const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === prog.title);
                            const isCompleted = isProgramCompleted(prog);
                            const isEnrolled = app?.status === "Enrolled";
                            const isDeclined = app?.status === "Declined";
                            const isPending = app?.status === "Pending";

                            const isFull = !app && prog.slotsRemaining <= 0;
                            const overlapWarning = getOverlapWarning(prog);
                            
                            if (isCompleted) {
                              return (
                                <button
                                  disabled
                                  className="text-xs font-extrabold px-3.5 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 cursor-not-allowed shadow-2xs"
                                  title="You have already completed this course and earned your certification"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                                  Already Completed ✓
                                </button>
                              );
                            }

                            if (isEnrolled) {
                              return (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                                  <CheckCircle className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  Enrolled
                                </span>
                              );
                            }

                            if (isPending) {
                              return (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                  Application Pending
                                </span>
                              );
                            }

                            if (isDeclined) {
                              return (
                                <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  Declined
                                </span>
                              );
                            }

                            if (isFull) {
                              return (
                                <button
                                  disabled
                                  className="text-xs font-bold px-3.5 py-2 rounded-lg bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                >
                                  Slots Full
                                </button>
                              );
                            }

                            return (
                              <button
                                onClick={() => handleDirectApply(prog)}
                                disabled={isUnverified || !!overlapWarning}
                                className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs ${
                                  isUnverified || !!overlapWarning
                                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                    : "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer active:scale-98"
                                }`}
                                title={isUnverified ? "Cannot apply while awaiting SK verification" : overlapWarning || "Apply for this TESDA training program"}
                              >
                                <Send className="w-3.5 h-3.5" />
                                Apply
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PATHWAY TAB SCREEN */}
          {activeTab === YouthScreen.PATHWAY && (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-gray-900 text-xl">Your Livelihood Pathway</h3>
                <p className="text-xs text-gray-500 mt-1">Follow these stages to reach your professional career goal successfully.</p>
              </div>

              {(() => {
                const userApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name)) || [];
                if (userApps.length === 0) {
                  return (
                    <div className="bg-white border border-[#D1FAE5] p-8 rounded-2xl shadow-xs text-center space-y-4">
                      <div className="max-w-md mx-auto py-8">
                        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-bounce" />
                        <h4 className="font-extrabold text-gray-800 text-sm sm:text-base">No Active Pathways Yet</h4>
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                          You haven't applied for any programs yet. Browse our list of curated skills programs matching your profile, apply directly, and your custom tracking pathway will appear here.
                        </p>
                        <button
                          onClick={() => setActiveTab(YouthScreen.MATCHES)}
                          className="mt-5 text-xs font-extrabold px-4 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg transition-colors shadow-xs"
                        >
                          Discover Matched Programs
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="space-y-8">
                    {userApps.map((app) => {
                      const isEnrolled = app.status === "Enrolled";
                      const isPending = app.status === "Pending";
                      const isDeclined = app.status === "Declined";
                      const isArchived = app.status === "Archived";
                      
                      const program = programs.find(p => p.title === app.programTitle);
                      const provider = program?.provider || "TESDA Partner Training Center";
                      const location = program?.location || "San Luis, Pampanga";
                      const scheduleDays = (program?.trainingDays ? (Array.isArray(program.trainingDays) ? program.trainingDays.join(", ") : program.trainingDays) : "Monday to Friday");
                      
                      const scheduleTime = program?.startTime && program?.endTime
                        ? `${formatProgramTime(program.startTime)} – ${formatProgramTime(program.endTime)}`
                        : (program?.startTime ? formatProgramTime(program.startTime) : "8:00 AM – 5:00 PM");

                      const room = program?.room || "Main Training Facility";
                      const instructor = program?.instructor || "TESDA Certified Instructor";
                      const contactPerson = program?.contactPerson || "TESDA Registrar";
                      const contactNumber = program?.contactNumber || "N/A";
                      const trainingHours = program?.trainingHours ? `${program.trainingHours} hours` : "Standard Duration";
                      const dateRange = program?.startDate && program?.endDate
                        ? ` (${new Date(program.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${new Date(program.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
                        : "";
                      const requiredDocs = program?.requiredDocuments && program.requiredDocuments.length > 0
                        ? program.requiredDocuments
                        : [
                            "Original & Photocopy of Birth Certificate (PSA)",
                            "2 copies of 2x2 / 1x1 ID Pictures (white background, with name tag)",
                            "High School Diploma or Form 137 / Report Card",
                            "Certificate of Barangay Residency (San Luis, Pampanga)"
                          ];
                      
                      return (
                        <div key={app.id} className="bg-white border border-[#D1FAE5] p-6 sm:p-8 rounded-2xl shadow-xs space-y-6 relative overflow-hidden">
                          {/* Top Tag indicating Program */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                                {provider}
                              </span>
                              <h4 className="font-extrabold text-gray-900 text-base sm:text-lg mt-2">{app.programTitle}</h4>
                              <p className="text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                                <span>📍 {location}</span>
                                <span>•</span>
                                <span>⏱ {trainingHours}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 font-semibold">Status:</span>
                              <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                                isArchived
                                  ? "bg-purple-50 text-purple-700 border-purple-150"
                                  : isEnrolled
                                  ? "bg-emerald-50 text-[#0A6B43] border-emerald-150"
                                  : isDeclined
                                  ? "bg-red-50 text-red-700 border-red-150"
                                  : "bg-blue-50 text-blue-700 border-blue-150 animate-pulse"
                              }`}>
                                {isArchived ? "Archived (Completed)" : isEnrolled ? "Officially Enrolled" : isDeclined ? "Declined" : "Pending Approval"}
                              </span>
                              {isPending && (
                                <button
                                  onClick={() => handleCancelApplication(app.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-red-100 flex items-center gap-1 text-[11px] font-bold ml-1 cursor-pointer"
                                  title="Cancel Application"
                                  id={`cancel-application-header-${app.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Cancel Application</span>
                                </button>
                              )}
                              {isDeclined && (
                                <button
                                  onClick={() => handleDeletePathway(app.id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-red-100 flex items-center gap-1 text-[11px] font-bold ml-1 cursor-pointer"
                                  title="Delete Declined Pathway"
                                  id={`delete-pathway-header-${app.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Delete Pathway</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const hasSavedPlan = Boolean(generatedPlan || currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan));
                            return (
                              <PathwayTimeline
                                currentStep={isArchived ? (hasSavedPlan ? 5 : 4) : isEnrolled ? 3 : 2}
                                isMobile={false}
                              />
                            );
                          })()}

                          {/* Visual Feedback on Application Status with explicit Instructions */}
                          {(() => {
                            if (isPending) {
                              return (
                                <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-4 shadow-xs">
                                  <div className="flex items-start justify-between gap-3 border-b border-blue-100/80 pb-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                                        <Sparkles className="w-4 h-4 animate-pulse" />
                                      </div>
                                      <div>
                                        <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider block">
                                          Step 2 Status
                                        </span>
                                        <h5 className="font-extrabold text-blue-950 text-sm">
                                          Application Under Review
                                        </h5>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => handleCancelApplication(app.id)}
                                      className="text-[11px] bg-white hover:bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 border border-red-200 shadow-2xs hover:border-red-300 cursor-pointer"
                                      id={`cancel-pathway-box-${app.id}`}
                                    >
                                      <XCircle className="w-3.5 h-3.5" />
                                      Cancel Application
                                    </button>
                                  </div>

                                  <p className="text-xs text-blue-900 leading-relaxed font-medium">
                                    Your application for <strong className="text-blue-950 font-bold">{app.programTitle}</strong> at <strong className="text-blue-950 font-bold">{provider}</strong> has been received by TESDA. Please review the program details and submit your required documents below to finalize your enrollment:
                                  </p>

                                  {/* Program Details Overview Card */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/95 p-4 rounded-xl border border-blue-150 shadow-2xs">
                                    <div className="space-y-1.5">
                                      <p className="text-gray-600">
                                        🏢 <strong>Training Provider:</strong> <span className="text-gray-900 font-bold">{provider}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        📍 <strong>Location / Campus:</strong> <span className="text-gray-900 font-semibold">{location}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        ⏱ <strong>Course Duration:</strong> <span className="text-gray-900 font-semibold">{trainingHours}{dateRange}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        💰 <strong>Program Cost:</strong> <span className="font-bold text-emerald-700">{program?.cost || "100% Free / Subsidized"}</span>
                                      </p>
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className="text-gray-600">
                                        📅 <strong>Class Schedule:</strong> <span className="text-gray-900 font-semibold">{scheduleDays}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        🕒 <strong>Training Hours:</strong> <span className="text-gray-900 font-semibold">{scheduleTime}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        🏢 <strong>Facility / Room:</strong> <span className="text-gray-900 font-semibold">{room}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        👨‍🏫 <strong>Trainer / Instructor:</strong> <span className="text-gray-900 font-semibold">{instructor}</span>
                                      </p>
                                      <p className="text-gray-600">
                                        📞 <strong>Registrar Contact:</strong> <span className="text-gray-900 font-semibold">{contactPerson} ({contactNumber})</span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Required: Physical Documents for Verification */}
                                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 space-y-2.5 text-xs">
                                    <p className="font-extrabold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                      👉 Action Required to Complete Enrollment Verification:
                                    </p>
                                    <p className="leading-relaxed font-medium text-amber-900">
                                      Please bring and submit the following physical requirements to the <strong>{provider} Admissions Office ({location})</strong> or coordinate with <strong>{contactPerson} ({contactNumber})</strong>:
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-4 list-disc text-amber-950 font-semibold">
                                      {requiredDocs.map((doc: string, dIdx: number) => (
                                        <li key={dIdx}>{doc}</li>
                                      ))}
                                    </ul>
                                    <p className="text-[10px] text-amber-800 italic pt-1 border-t border-amber-200 font-medium">
                                      Once your physical documents are verified by the TESDA registrar, your enrollment will be officially approved and this pathway will advance to <strong>Step 3: Officially Enrolled & Active Training</strong>!
                                    </p>
                                  </div>
                                </div>
                              );
                            } else if (isDeclined) {
                              return (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3.5 shadow-2xs">
                                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-2">
                                      <p className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Application Declined</p>
                                      <button
                                        onClick={() => handleDeletePathway(app.id)}
                                        className="text-[11px] bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-red-200 cursor-pointer"
                                        id={`delete-pathway-box-${app.id}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Livelihood Pathway
                                      </button>
                                    </div>
                                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                                      Your application for <strong>{app.programTitle}</strong> was declined. Please verify your skills and profile info before re-applying, or message Sangguniang Kabataan for mentorship.
                                    </p>
                                    <p className="text-[10px] text-red-500 italic font-semibold">
                                      💡 You can delete this pathway card to clear your list and explore other matching livelihood programs!
                                    </p>
                                  </div>
                                </div>
                              );
                            } else if (isArchived) {
                              // STEP 4 IS UNLOCKED: Step 3 is completed!
                              const planToShow = generatedPlan || currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan);
                              const isSaved = Boolean(planToShow && planToShow.roadmapTitle);

                              return (
                                <div className="space-y-6 w-full">
                                  {/* Completion & Step 4 Banner */}
                                  <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
                                    <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                      <Award className="w-6 h-6 animate-bounce" />
                                    </div>
                                    <div className="space-y-1.5 flex-1">
                                      <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200 tracking-wider">
                                        Step 3 Complete • Step 4 Active
                                      </span>
                                      <h5 className="font-extrabold text-purple-950 text-base sm:text-lg">
                                        Training Completed & NC II Certified!
                                      </h5>
                                      <p className="text-xs text-purple-800 leading-relaxed font-medium">
                                        Congratulations! You have completed your certified training for <strong className="font-bold">{app.programTitle}</strong> at <strong className="font-bold">{provider}</strong>. You have achieved <strong>Step 4: Livelihood Placement & Career Launch</strong>.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Gemini Long-Term Post-Graduation Career Plan Section */}
                                  <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-6 sm:p-7 shadow-lg border border-emerald-700/60 space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                                          <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                                            Google Gemini AI • Step 4 Career Strategy
                                          </span>
                                        </div>
                                        <h4 className="text-lg sm:text-xl font-black text-white">
                                          {planToShow?.roadmapTitle || `Post-Graduation Career Roadmap`}
                                        </h4>
                                        <p className="text-xs text-emerald-100 font-medium leading-relaxed max-w-2xl">
                                          {planToShow?.summary || `A pragmatic, real-life career action plan tailored for your transition from ${app.programTitle} into employment and entrepreneurship in San Luis, Pampanga.`}
                                        </p>
                                      </div>

                                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                                        {isSaved ? (
                                          <span className="px-4 py-2 text-xs font-black rounded-xl bg-emerald-800/80 text-emerald-200 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs">
                                            <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                                            Saved Official Career Roadmap ✓
                                          </span>
                                        ) : planToShow ? (
                                          <button
                                            onClick={() => handleSaveCareerPlanToIDCard(planToShow)}
                                            disabled={isSavingPlan}
                                            className="px-4 py-2 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                          >
                                            {isSavingPlan ? (
                                              <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                Saving...
                                              </>
                                            ) : (
                                              <>
                                                <Bookmark className="w-3.5 h-3.5" />
                                                Save Plan to KK Digital ID Card
                                              </>
                                            )}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleGenerateCareerPlan(program)}
                                            disabled={isGeneratingPlan}
                                            className="px-4 py-2 bg-white hover:bg-gray-100 text-slate-900 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                          >
                                            {isGeneratingPlan ? (
                                              <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A6B43]" />
                                                Gemini is generating plan...
                                              </>
                                            ) : (
                                              <>
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                Generate Gemini Post-Graduation Career Plan
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Display Generated Plan Content */}
                                    {planToShow ? (
                                      <div className="space-y-5 animate-in fade-in duration-200">
                                        {/* Phase 1: Immediate 30 Days */}
                                        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4.5 border border-white/15 space-y-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 rounded-md">
                                              Phase 1 • First 30 Days
                                            </span>
                                            <h6 className="font-extrabold text-white text-xs uppercase tracking-wider">
                                              Credentialing & Jobseeker Registration
                                            </h6>
                                          </div>
                                          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                                            {planToShow.immediate30Days.map((stepItem: string, sIdx: number) => (
                                              <li key={sIdx} className="bg-black/20 p-3 rounded-lg border border-white/10 text-xs text-emerald-50 leading-relaxed flex items-start gap-2 font-medium">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                                  {sIdx + 1}
                                                </span>
                                                <span>{stepItem}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Phase 2: Dual Pathways (Wage Employment & Local Entrepreneurship) */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          {/* Track A: Wage Employment */}
                                          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4.5 border border-white/15 space-y-3 flex flex-col justify-between">
                                            <div className="space-y-2.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-400/20 border border-cyan-300/30 px-2 py-0.5 rounded-md">
                                                  Track A • Wage Employment
                                                </span>
                                                <span className="text-[11px] font-extrabold text-emerald-300">
                                                  💰 {planToShow.employmentTrack.estimatedSalary}
                                                </span>
                                              </div>
                                              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                                                📍 <strong>Target Placement:</strong> {planToShow.employmentTrack.targetLocations}
                                              </p>
                                              <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase block">Recommended Entry Job Roles:</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {planToShow.employmentTrack.targetRoles.map((role: string, rIdx: number) => (
                                                    <span key={rIdx} className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-md text-white border border-white/10">
                                                      💼 {role}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-emerald-100">
                                              {planToShow.employmentTrack.actionSteps.map((step: string, stIdx: number) => (
                                                <p key={stIdx} className="flex items-start gap-1.5 text-[11px]">
                                                  <span className="text-emerald-400 font-bold">✓</span> {step}
                                                </p>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Track B: Entrepreneurship & Freelancing */}
                                          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4.5 border border-white/15 space-y-3 flex flex-col justify-between">
                                            <div className="space-y-2.5">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 rounded-md">
                                                  Track B • Self-Employment & Freelance
                                                </span>
                                                <span className="text-[11px] font-bold text-amber-200">
                                                  🛠️ Starter Grants Available
                                                </span>
                                              </div>
                                              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                                                🏪 <strong>Business Concept:</strong> {planToShow.entrepreneurshipTrack.businessConcept}
                                              </p>
                                              <p className="text-xs text-amber-100 leading-relaxed font-medium">
                                                🎁 <strong>Funding & Grants:</strong> {planToShow.entrepreneurshipTrack.starterFunding}
                                              </p>
                                            </div>
                                            <div className="pt-2 border-t border-white/10 space-y-1.5">
                                              <span className="text-[10px] font-bold text-gray-300 uppercase block">Initial Services to Offer:</span>
                                              {planToShow.entrepreneurshipTrack.initialServices.map((srv: string, sIdx: number) => (
                                                <p key={sIdx} className="text-[11px] text-emerald-100 flex items-start gap-1.5 font-medium">
                                                  <span className="text-amber-400 font-bold">★</span> {srv}
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Phase 3 & Local Support Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-black/25 p-4 rounded-xl border border-white/10">
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider block">
                                              📈 1–2 Year Long-Term Elevation:
                                            </span>
                                            {planToShow.longTerm1To2Years.map((milestone: string, mIdx: number) => (
                                              <p key={mIdx} className="text-emerald-100 flex items-start gap-1.5 leading-relaxed font-medium">
                                                <span className="text-purple-400">◆</span> {milestone}
                                              </p>
                                            ))}
                                          </div>
                                          <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider block">
                                              🤝 Local Support Contacts in San Luis:
                                            </span>
                                            {planToShow.localSupportContacts.map((contact: string, cIdx: number) => (
                                              <p key={cIdx} className="text-emerald-100 flex items-start gap-1.5 leading-relaxed font-medium">
                                                <span className="text-emerald-400">📍</span> {contact}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-8 space-y-3 bg-black/20 rounded-xl border border-dashed border-white/20 p-6">
                                        <Sparkles className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
                                        <h5 className="font-extrabold text-white text-sm sm:text-base">
                                          Your Training is Certified! Ready to Build Your Post-Graduation Career Plan?
                                        </h5>
                                        <p className="text-xs text-emerald-100 max-w-lg mx-auto leading-relaxed font-medium">
                                          Click the button below to have Google Gemini AI analyze your completed <strong>{app.programTitle}</strong> credentials and build a real-life wage employment & local entrepreneurship plan in San Luis, Pampanga.
                                        </p>
                                        <button
                                          onClick={() => handleGenerateCareerPlan(program)}
                                          disabled={isGeneratingPlan}
                                          className="mt-3 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                                        >
                                          {isGeneratingPlan ? (
                                            <>
                                              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                              Generating your realistic Gemini plan...
                                            </>
                                          ) : (
                                            <>
                                              <Sparkles className="w-4 h-4 text-slate-950" />
                                              Generate Gemini Post-Graduation Career Plan
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="space-y-4 w-full">
                                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs font-bold text-emerald-800">Enrolled and Active</p>
                                      <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5 font-medium">
                                        Congratulations! Your application has been approved by the TESDA office. You have successfully completed Step 2! You are now officially enrolled in <strong>{app.programTitle}</strong> at <strong>{provider}</strong> and on track to complete your training (Step 3).
                                      </p>
                                    </div>
                                  </div>

                                  {/* Beautiful Academic Schedule Details inside Pathway card */}
                                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                      <span>🏫</span> Active Academic & Class Schedule:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <Calendar className="w-4 h-4 text-[#0A6B43] mt-0.5 shrink-0" />
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Class Days</span>
                                          <span className="text-xs font-bold text-gray-800">{scheduleDays}</span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <Clock className="w-4 h-4 text-[#0A6B43] mt-0.5 shrink-0" />
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Class Hours/Time</span>
                                          <span className="text-xs font-bold text-gray-800">{scheduleTime}</span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <span className="text-base text-amber-500 mt-0.5 shrink-0">📍</span>
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Room / Lab</span>
                                          <span className="text-xs font-bold text-gray-800">{room} ({location})</span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <span className="text-base text-amber-500 mt-0.5 shrink-0">👤</span>
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Professor / Instructor</span>
                                          <span className="text-xs font-bold text-gray-800">{instructor}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-[10px] text-gray-500 italic pt-1 border-t border-slate-100">
                                      Please report to class at {location} in your proper training attire with your trainee ID card.
                                    </div>
                                  </div>

                                  {/* Locked Step 4 Milestone Notice */}
                                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">
                                        <Lock className="w-3.5 h-3.5" />
                                      </div>
                                      <div>
                                        <span className="font-extrabold text-slate-800 block text-xs">
                                          Step 4: Livelihood Placement & Gemini Career Plan
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          This milestone and your Google Gemini Post-Graduation Career Plan will unlock once your Step 3 training is complete and certified.
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-md shrink-0 self-end sm:self-auto">
                                      Locked Milestone
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Goals segment */}
              <div className="bg-white p-6 border border-gray-150 rounded-2xl shadow-xs">
                <span className="text-xs uppercase font-bold text-gray-400 tracking-wider">Livelihood Landmark Goal</span>
                <p className="text-sm font-semibold text-emerald-950 italic mt-2 bg-emerald-50/50 p-4 rounded-xl leading-relaxed">
                  "{youthProfile.livelihoodGoal}"
                </p>
              </div>
            </div>
          )}

          {/* PROFILE TAB SCREEN */}
          {activeTab === YouthScreen.PROFILE && (
            <div className="space-y-6">
              {/* Header & Sub-Tab Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Profile & Skills</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage your personal demographics, livelihood goals, competency skills, and account security</p>
                </div>

                <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 shrink-0">
                  {[
                    { id: "profile", label: "Personal Details", icon: <User className="w-3.5 h-3.5" /> },
                    { id: "skills", label: "Skills & Competencies", icon: <Award className="w-3.5 h-3.5" /> },
                    { id: "security", label: "Security & Password", icon: <Lock className="w-3.5 h-3.5" /> },
                    { id: "badge", label: "KK Digital ID Card", icon: <ShieldCheck className="w-3.5 h-3.5" /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setProfileActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

              {/* Sub-Tab 1: Personal Details Form */}
              {profileActiveTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start animate-in fade-in duration-150">
                  <div className="lg:col-span-3 bg-white border border-gray-150 rounded-2xl p-6 space-y-6 shadow-xs">
                    <form onSubmit={handleSaveProfileDetails} className="space-y-5">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                          <User className="w-4 h-4 text-[#0A6B43]" />
                          Personal Demographics & Career Goals
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">Keep your contact and livelihood targets updated for optimal matchmaking</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name</label>
                          <input type="text" disabled value={youthProfile.name} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-600 font-bold rounded-lg text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Account Login Email</label>
                          <input type="email" disabled value={currentUser?.email || youthProfile.email || "Registered Email"} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-600 font-bold rounded-lg text-xs" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Phone Number *</label>
                          <input
                            type="text"
                            required
                            disabled={isUnverified}
                            value={editPhone}
                            onChange={(e) => setEditPhone(formatContactNumber(e.target.value))}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Preferred Vocational Sector *</label>
                          <select
                            disabled={isUnverified}
                            value={editSector}
                            onChange={(e) => setEditSector(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="IT & Technology">IT & Technology</option>
                            <option value="Food & Culinary">Food & Culinary</option>
                            <option value="Construction & Trades">Construction & Trades</option>
                            <option value="Automotive & Transport">Automotive & Transport</option>
                            <option value="Health & Beauty Care">Health & Beauty Care</option>
                            <option value="Agriculture & Farming">Agriculture & Farming</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Educational Attainment *</label>
                          <select
                            disabled={isUnverified}
                            value={editEdu}
                            onChange={(e) => setEditEdu(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Elementary Level">Elementary Level</option>
                            <option value="Elementary Graduate">Elementary Graduate</option>
                            <option value="High School Level">High School Level</option>
                            <option value="High School Graduate">High School Graduate</option>
                            <option value="Senior High School">Senior High School</option>
                            <option value="College Level">College Level</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Current Status *</label>
                          <select
                            disabled={isUnverified}
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Out-of-School Youth">Out-of-School Youth (OSY)</option>
                            <option value="In-School Youth">In-School Youth</option>
                            <option value="Working Student">Working Student</option>
                            <option value="Unemployed">Unemployed</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Livelihood & Career Goal *</label>
                        <textarea
                          rows={3}
                          required
                          disabled={isUnverified}
                          value={editGoal}
                          onChange={(e) => setEditGoal(e.target.value)}
                          placeholder="Describe your career aspiration or livelihood goal..."
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="submit"
                          disabled={isSavingProfile || isUnverified}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
                            isUnverified ? "bg-gray-300 cursor-not-allowed" : "bg-[#0A6B43] hover:bg-[#075332]"
                          }`}
                        >
                          {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Save Profile Changes
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Summary Card */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
                      <h4 className="font-bold text-gray-800 border-b border-gray-100 pb-2">Verification & Membership</h4>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400 font-medium">Barangay:</span>
                        <span className="font-extrabold text-gray-800">Barangay {youthProfile.barangay}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400 font-medium">Purok Zone:</span>
                        <span className="font-bold text-gray-800">{youthProfile.purok}</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-400 font-medium">KK Status:</span>
                        <span className={`font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border ${
                          youthProfile.approvalStatus === "Approved"
                            ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                            : youthProfile.approvalStatus === "Rejected"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {youthProfile.approvalStatus === "Approved" ? "Verified KK Member ✓" : youthProfile.approvalStatus === "Rejected" ? "Declined" : "Pending Verification"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: Skills & Competencies */}
              {profileActiveTab === "skills" && (
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        Manage Competency Skills & Qualifications
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Skills in your profile increase your match percentage with active TESDA programs</p>
                    </div>
                    <button
                      onClick={() => {
                        if (isUnverified) {
                          addToast("Cannot add skills in View-Only Mode", "error");
                          return;
                        }
                        setShowAddSkillModal(true);
                      }}
                      disabled={isUnverified}
                      className={`px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                        isUnverified ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      Add Custom Skill
                    </button>
                  </div>

                  {/* Active Registered Skills Tags */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Your Registered Skills</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {youthProfile.skills && youthProfile.skills.length > 0 ? (
                        youthProfile.skills.map((s) => (
                          <span key={s} className="bg-amber-50 text-amber-900 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-amber-200 flex items-center gap-2 shadow-2xs">
                            {s}
                            <button
                              onClick={() => {
                                if (isUnverified) {
                                  addToast("Cannot remove skills in View-Only Mode", "error");
                                  return;
                                }
                                handleRemoveSkillLocal(s);
                              }}
                              disabled={isUnverified}
                              className="font-bold text-xs text-amber-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer"
                              title="Remove skill"
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic font-medium py-2">No skills added yet. Select from suggestions below or click "+ Add Custom Skill".</p>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Personalized Vocational Skill Suggestions */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Recommended Skills for Your Profile
                      </h4>
                      {youthProfile.sectorPreference && (
                        <span className="text-[10px] font-extrabold bg-emerald-50 text-[#0A6B43] px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wide">
                          {youthProfile.sectorPreference} Sector
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      Tailored vocational skills matching your sector preference ({youthProfile.sectorPreference || "General"}) and available TESDA programs. Click to add and boost your match score:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {getSuggestedSkillsForYouth(youthProfile, programs).map((item) => {
                        const hasSkill = youthProfile.skills.includes(item.skill);
                        return (
                          <button
                            key={item.skill}
                            disabled={hasSkill || isUnverified}
                            onClick={async () => {
                              if (isUnverified) return;
                              const updatedSkills = [...youthProfile.skills, item.skill];
                              const tempYouth = { ...youthProfile, skills: updatedSkills };
                              const updatedMatchScore = programs && programs.length > 0
                                ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
                                : Math.min(99, youthProfile.matchScore + 3);
                              setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, skills: updatedSkills, matchScore: updatedMatchScore } : y));
                              addToast(`Added "${item.skill}" to your profile!`, "success");
                              try {
                                await fetch("/api/youth", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: youthProfile.id, skills: updatedSkills, matchScore: updatedMatchScore })
                                });
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              hasSkill
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : item.isHighMatch
                                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 shadow-2xs cursor-pointer"
                                : "bg-emerald-50 text-[#0A6B43] border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                            }`}
                            title={item.tag}
                          >
                            {hasSkill ? "✓ " : item.isHighMatch ? "★ " : "+ "}
                            {item.skill}
                            {!hasSkill && item.tag && (
                              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-xs ml-0.5 uppercase ${
                                item.isHighMatch ? "bg-amber-200/60 text-amber-900" : "bg-emerald-200/50 text-[#075332]"
                              }`}>
                                {item.tag}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Tab 3: Account Security */}
              {profileActiveTab === "security" && (
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs max-w-xl animate-in fade-in duration-150">
                  <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-700" />
                        Account Security & Password
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">Update your portal password to protect your account</p>
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
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Sub-Tab 4: KK Digital Membership ID Card */}
              {profileActiveTab === "badge" && (() => {
                const userCompletedApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Archived") || [];
                const userEnrolledApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Enrolled") || [];
                const savedPlan = currentSavedPlan || generatedPlan || parseCareerPlan(youthProfile.savedCareerPlan);

                return (
                  <div className="space-y-6 max-w-2xl animate-in fade-in duration-150">
                    <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs space-y-5">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                          Katipunan ng Kabataan Digital Membership Badge
                        </h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">Official youth organization membership credential for San Luis, Pampanga</p>
                      </div>

                      {/* Official Digital ID Card */}
                      <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-6 shadow-lg border border-emerald-700/50 space-y-5">
                        <div className="flex justify-between items-start">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest block">Republic of the Philippines</span>
                            <h4 className="text-base font-extrabold tracking-tight text-white">Katipunan ng Kabataan Member</h4>
                            <p className="text-[11px] text-emerald-200 font-bold">{youthProfile.purok} · Barangay {youthProfile.barangay}</p>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                            KK
                          </div>
                        </div>

                        <div className="pt-3 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-emerald-300 uppercase block">Member Name</span>
                            <span className="font-extrabold text-white text-sm">{youthProfile.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-emerald-300 uppercase block">KK ID Number</span>
                            <span className="font-mono text-amber-300 font-bold text-[11px]">KK-SANLUIS-{youthProfile.id.slice(-6).toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-emerald-300 uppercase block">SK Status</span>
                            <span className="font-bold text-emerald-200 flex items-center gap-1 text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> {youthProfile.approvalStatus === "Approved" ? "Verified KK Member" : "Pending Verification"}
                            </span>
                          </div>
                        </div>

                        {/* Completed TESDA Programs Section on ID Card */}
                        <div className="pt-3 border-t border-white/15 space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                            Accredited TVET Qualifications & Completed Programs:
                          </span>

                          {userCompletedApps.length > 0 ? (
                            <div className="space-y-1.5">
                              {userCompletedApps.map((compApp, cIdx) => (
                                <div key={cIdx} className="bg-black/25 px-3 py-2 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs font-bold text-white">{compApp.programTitle}</span>
                                  </div>
                                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-2 py-0.5 rounded-md uppercase">
                                    Certified NC II Graduate ✓
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : userEnrolledApps.length > 0 ? (
                            <div className="space-y-1.5">
                              {userEnrolledApps.map((enrApp, eIdx) => (
                                <div key={eIdx} className="bg-black/20 px-3 py-2 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                                  <span className="text-xs font-medium text-emerald-100">{enrApp.programTitle}</span>
                                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded-md">
                                    Active Trainee
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-200/80 italic font-medium">
                              No completed TESDA courses yet. Complete your active training to earn accredited qualification badges on your ID!
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            const completedStr = userCompletedApps.length > 0 ? `\nCertified Programs: ${userCompletedApps.map(a => a.programTitle).join(", ")}` : "";
                            navigator.clipboard?.writeText(
                              `Katipunan ng Kabataan Digital ID:\nName: ${youthProfile.name}\nID: KK-SANLUIS-${youthProfile.id.slice(-6).toUpperCase()}\nBarangay: Barangay ${youthProfile.barangay}\nPurok: ${youthProfile.purok}\nStatus: ${youthProfile.approvalStatus}${completedStr}`
                            );
                            addToast("Digital KK ID information copied to clipboard!", "success");
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-[#0A6B43]" />
                          Copy Digital ID Info
                        </button>
                      </div>
                    </div>

                    {/* Saved Gemini Career Plan Section under ID Card */}
                    {savedPlan ? (
                      <div className="bg-white border border-emerald-150 rounded-2xl p-6 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                              <Sparkles className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase text-[#0A6B43] tracking-wider block">
                                Verified Career Roadmap
                              </span>
                              <h4 className="font-extrabold text-gray-900 text-sm sm:text-base">
                                {savedPlan.roadmapTitle}
                              </h4>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 font-medium">
                            Saved on: {savedPlan.generatedDate || "Recently"}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {savedPlan.summary}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 space-y-1.5 text-xs">
                            <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                              💼 Wage Employment Track
                            </span>
                            <p className="text-emerald-950 font-bold">
                              {savedPlan.employmentTrack?.targetRoles?.join(", ")}
                            </p>
                            <p className="text-emerald-800 text-[11px]">
                              Est. Salary: <strong className="text-emerald-900">{savedPlan.employmentTrack?.estimatedSalary}</strong>
                            </p>
                          </div>

                          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 space-y-1.5 text-xs">
                            <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">
                              🛠️ Freelance & Enterprise Track
                            </span>
                            <p className="text-amber-950 font-bold">
                              {savedPlan.entrepreneurshipTrack?.businessConcept}
                            </p>
                            <p className="text-amber-800 text-[11px]">
                              {savedPlan.entrepreneurshipTrack?.starterFunding}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                          <button
                            onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                            className="text-[#0A6B43] hover:text-[#075332] font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Full Pathway & Steps</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `Career Roadmap: ${savedPlan.roadmapTitle}\nSummary: ${savedPlan.summary}\nTarget Salary: ${savedPlan.employmentTrack?.estimatedSalary}\nRoles: ${savedPlan.employmentTrack?.targetRoles?.join(", ")}`
                              );
                              addToast("Career Plan summary copied to clipboard!", "success");
                            }}
                            className="text-gray-500 hover:text-gray-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Summary</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          )}

        </div>

        {/* Floating Add Skill Modal (Centered Desktop style) */}
        {showAddSkillModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4 animate-in zoom-in-95 border border-emerald-100 shadow-2xl">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-800 text-sm">Add Competency Skill</h4>
                <button onClick={() => setShowAddSkillModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddSkillSubmit} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. Baking, Basic Computing, Carpentry"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="w-full bg-[#D97706] hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-lg transition-colors"
                >
                  Confirm & Refresh Matches
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Complete Program Details Modal Popup */}
        {viewingProgramModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" style={{ zIndex: 50 }}>
            <div className="bg-white w-full max-w-2xl rounded-2xl p-6 sm:p-7 space-y-5 animate-in zoom-in-95 border border-emerald-100 shadow-2xl max-h-[90vh] overflow-y-auto my-auto">
              {/* Modal Top Header */}
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-gray-100">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-150 tracking-wider inline-block mb-1.5">
                    {viewingProgramModal.program.provider || "TESDA Accredited Program"}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-xl leading-snug">
                    {viewingProgramModal.program.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 font-medium flex items-center gap-2">
                    <span>📍 {viewingProgramModal.program.location}</span>
                    <span>•</span>
                    <span>⏱ {viewingProgramModal.program.trainingHours} hours</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <FlameMatchScore score={viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program)} />
                  <button
                    onClick={() => setViewingProgramModal(null)}
                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 4-Factor Transparent CBF Score Breakdown */}
              {(() => {
                const breakdown = calculateDetailedCBFMatch(youthProfile, viewingProgramModal.program);
                return (
                  <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Transparent CBF Match Breakdown
                      </span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        breakdown.passedSkillGate
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : "bg-red-950/80 text-red-300 border-red-500/40"
                      }`}>
                        {breakdown.passedSkillGate ? "Passed Skill Gate ✓" : "Skill Gate Excluded ✗"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Skill (50%)</p>
                        <p className="text-sm font-black text-emerald-400 mt-0.5">{breakdown.skillPoints} pts</p>
                        <p className="text-[9px] text-gray-400">{breakdown.skillMatch}% Match</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Pref (25%)</p>
                        <p className="text-sm font-black text-blue-400 mt-0.5">{breakdown.preferencePoints} pts</p>
                        <p className="text-[9px] text-gray-400">{breakdown.preferenceMatch}% Match</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Exp (15%)</p>
                        <p className="text-sm font-black text-amber-400 mt-0.5">{breakdown.experiencePoints} pts</p>
                        <p className="text-[9px] text-gray-400">{breakdown.experienceMatch}% Match</p>
                      </div>
                      <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Goal (10%)</p>
                        <p className="text-sm font-black text-purple-400 mt-0.5">{breakdown.goalPoints} pts</p>
                        <p className="text-[9px] text-gray-400">{breakdown.goalMatch}% Match</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pt-1 border-t border-slate-800 gap-1">
                      <span className="text-gray-400 font-medium">Program Category: <strong className="text-slate-200">{breakdown.categoryName}</strong></span>
                      <span className="font-extrabold text-emerald-400 text-sm">Overall Fit: {breakdown.finalScore}%</span>
                    </div>
                  </div>
                );
              })()}

              {/* Gemini AI Compatibility Analysis */}
              <div className="bg-emerald-50/90 p-4 rounded-xl border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    Google Gemini AI Compatibility Analysis
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">
                    {viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program)}% Match Fit
                  </span>
                </div>
                <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                  "{liveGeminiAdvice || `${youthProfile.name.split(' ')[0]} possesses background competencies matching ${viewingProgramModal.program.title}. Enrolling in this course will officially certify their qualifications under TESDA.`}"
                </p>
              </div>

              {/* Complete Program Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-gray-50/80 p-4 rounded-xl border border-gray-150">
                <div className="space-y-2">
                  <p className="text-gray-700">📅 <strong>Training Schedule:</strong> {Array.isArray(viewingProgramModal.program.trainingDays) ? viewingProgramModal.program.trainingDays.join(", ") : (viewingProgramModal.program.trainingDays || "Monday – Friday")}</p>
                  <p className="text-gray-700">🕒 <strong>Hours:</strong> {viewingProgramModal.program.startTime ? formatProgramTime(viewingProgramModal.program.startTime) : "8:00 AM"} – {viewingProgramModal.program.endTime ? formatProgramTime(viewingProgramModal.program.endTime) : "5:00 PM"}</p>
                  <p className="text-gray-700">🏢 <strong>Facility / Room:</strong> {viewingProgramModal.program.room || "Main Training Facility"}</p>
                  <p className="text-gray-700">👨‍🏫 <strong>Trainer / Instructor:</strong> {viewingProgramModal.program.instructor || "TESDA Certified Trainer"}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-700">💰 <strong>Program Cost:</strong> <span className="font-extrabold text-emerald-700">{viewingProgramModal.program.cost || "100% Free / Subsidized"}</span></p>
                  <p className="text-gray-700">👥 <strong>Available Slots:</strong> <span className="font-bold text-gray-900">{viewingProgramModal.program.slotsRemaining} / {viewingProgramModal.program.slotsTotal}</span> open</p>
                  <p className="text-gray-700">📞 <strong>Contact Registrar:</strong> {viewingProgramModal.program.contactPerson || "TESDA Registrar"} ({viewingProgramModal.program.contactNumber || "N/A"})</p>
                  <p className="text-gray-700">🎓 <strong>Eligibility:</strong> {viewingProgramModal.program.eligibility || "Open to all KK Youth"}</p>
                </div>
              </div>

              {/* Physical Requirements */}
              {viewingProgramModal.program.requiredDocuments && viewingProgramModal.program.requiredDocuments.length > 0 && (
                <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 space-y-2">
                  <p className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                    📋 Physical Requirements Needed Beforehand:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4 list-disc text-xs text-amber-900 font-medium">
                    {viewingProgramModal.program.requiredDocuments.map((doc, dIdx) => (
                      <li key={dIdx}>{doc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Skills */}
              {viewingProgramModal.program.requiredSkills && viewingProgramModal.program.requiredSkills.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider">
                    💡 Recommended Prerequisite Competencies:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingProgramModal.program.requiredSkills.map((sk, sIdx) => (
                      <span key={sIdx} className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Action Footer */}
              {(() => {
                const prog = viewingProgramModal.program;
                const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === prog.title);
                const isCompleted = isProgramCompleted(prog);
                const isEnrolled = app?.status === "Enrolled";
                const isDeclined = app?.status === "Declined";
                const isFull = !app && prog.slotsRemaining <= 0;
                const overlapWarning = getOverlapWarning(prog);
                const isDisabled = isCompleted || !!app || isFull || !!overlapWarning || isUnverified;

                return (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setViewingProgramModal(null)}
                      className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Close Details
                    </button>

                    {isCompleted ? (
                      <button
                        disabled
                        className="w-full sm:w-auto text-xs font-extrabold px-6 py-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-2 cursor-not-allowed shadow-xs"
                      >
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        Already Completed & Certified ✓
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleDirectApply(viewingProgramModal.program);
                        }}
                        disabled={isDisabled}
                        className={`w-full sm:w-auto text-xs font-extrabold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                          app
                            ? isEnrolled
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                              : isDeclined
                              ? "bg-red-50 text-red-700 border border-red-200 cursor-default"
                              : "bg-blue-50 text-blue-700 border border-blue-200 cursor-default animate-pulse"
                            : isFull
                            ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            : overlapWarning
                            ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed"
                            : isUnverified
                            ? "bg-amber-100/60 text-amber-800 border border-amber-200 cursor-not-allowed"
                            : "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer active:scale-98"
                        }`}
                      >
                        {app ? (
                          isEnrolled ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                              Currently Enrolled
                            </>
                          ) : isDeclined ? (
                            <>
                              <XCircle className="w-4 h-4 text-red-500" />
                              Application Declined
                            </>
                          ) : (
                            <>
                              <Clock className="w-4 h-4 text-blue-600 animate-spin" />
                              Application Under Review
                            </>
                          )
                        ) : isFull ? (
                          "Class Slots Full"
                        ) : overlapWarning ? (
                          "Schedule Overlap Detected"
                        ) : isUnverified ? (
                          "Pending SK Verification"
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-white" />
                            Apply for this Program
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Direct Application Confirmation Modal (Centered Desktop style) */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" style={{ zIndex: 100 }}>
            <div className="bg-white rounded-xl p-6 shadow-2xl text-center space-y-4 max-w-[340px] animate-in zoom-in-95 border border-emerald-100">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
              <div>
                <h4 className="font-bold text-gray-800 text-sm sm:text-base">Apply for training?</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
                  This will submit your application directly to TESDA for the <strong className="text-gray-700">{selectedProgramToApply?.title || "selected training program"}</strong>.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedProgramToApply(null);
                  }}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDirectApply}
                  className="flex-1 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
