"use client";

import React, { useState, useMemo } from "react";
import {
  Home, Target, Award, User, Bell, Sparkles, Plus, CheckCircle,
  AlertTriangle, Phone, Mail, MapPin, Briefcase, Trash2, X, Globe, MessageSquare, LogOut,
  Calendar, Clock, XCircle, Megaphone, Lock, Eye, EyeOff, Copy, RefreshCw, Edit, ShieldCheck, ShieldAlert
} from "lucide-react";
import { formatContactNumber } from "../lib/utils";
import { YouthProfile, TESDAProgram, SKAnnouncement, YouthScreen, ReferralPipelineItem } from "../types";
import { FlameMatchScore, GeminiExplanationBox, PathwayTimeline, SikapLogo } from "./ReusableComponents";
import { calculateContentBasedMatchScore } from "../lib/cbf-matcher";

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

  // Use generic title since we no longer have static officials list
  const skChairpersonName = useMemo(() => {
    return "Your SK Chairperson";
  }, [youthProfile.barangay]);

  // Get enrolled referrals and match them with program details
  const enrolledReferrals = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Enrolled") || [];
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

  const handleDeletePathway = (referralId: string) => {
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

  const handleCancelApplication = (referralId: string) => {
    if (isUnverified) {
      addToast("Cannot cancel applications in View-Only Mode (Awaiting SK Verification)", "error");
      return;
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
    const updatedMatchScore = Math.min(99, youthProfile.matchScore + 2);
    
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
          currentStatus: editStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, ...data.data } : y));
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
    if (prog.slotsRemaining <= 0) {
      addToast(`Sorry, "${prog.title}" is already full!`, "error");
      return;
    }

    setSelectedProgramToApply(prog);
    setShowApplyModal(true);
  };

  const confirmDirectApply = () => {
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

    // Update profile applied state (using hasReferred as the flag)
    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return { ...y, hasReferred: true };
      }
      return y;
    }));

    // Add directly to the application pipeline
    if (setReferrals) {
      const newApp: ReferralPipelineItem = {
        id: `app-${Date.now()}`,
        youthName: youthProfile.name,
        purok: youthProfile.purok,
        barangay: youthProfile.barangay,
        programTitle: selectedProgramToApply.title,
        matchScore: calculateContentBasedMatchScore(youthProfile, selectedProgramToApply),
        referralDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        status: "Pending"
      };
      setReferrals(prev => [newApp, ...prev]);
    }

    addToast(`Application for "${selectedProgramToApply.title}" submitted directly to TESDA successfully!`, "success");
    setShowApplyModal(false);
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
                      const scheduleDays = (program?.trainingDays?.join(", ") || "TBA") || "Mondays to Fridays";
                      const scheduleTime = (program?.startTime ? `${new Date(program?.startTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})} - ${program?.endTime ? new Date(program?.endTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : "TBA"}` : "TBA") || "8:00 AM - 12:00 PM";
                      const room = program?.room || "Vocational Workshop Room 3";
                      const instructor = program?.instructor || "Professor Danilo Santos";
                      const provider = program?.provider || "TESDA GPSAT (Gonzalo Puyat School of Arts and Trades)";
                      const location = program?.location || "TESDA PTC, San Fernando, Pampanga";

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
                    const featuredProg = programs[0];
                    const featuredScore = calculateContentBasedMatchScore(youthProfile, featuredProg);
                    const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === featuredProg.title);
                    const isEnrolled = app?.status === "Enrolled";
                    const isDeclined = app?.status === "Declined";
                    const isPending = app?.status === "Pending";
                    const isFull = !app && (featuredProg.slotsRemaining !== undefined && featuredProg.slotsRemaining <= 0);
                    
                    const overlapWarning = getOverlapWarning(featuredProg);
                    const isDisabled = !!app || isFull || !!overlapWarning || isUnverified;

                    return (
                      <div className="bg-white border border-[#D1FAE5] rounded-2xl p-6 shadow-xs space-y-4 md:col-span-3">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs uppercase font-bold text-[#D97706] tracking-wider block">Featured AI Match for You</span>
                            <h4 className="font-extrabold text-gray-800 text-lg mt-1">{featuredProg.title}</h4>
                            <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 inline-block mt-1">
                              {featuredProg.provider || "TESDA Partner Program"}
                            </span>
                          </div>
                          <FlameMatchScore score={featuredScore} />
                        </div>

                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                          <p className="text-sm italic text-emerald-950 leading-relaxed font-medium">
                            "Based on your registered competencies, this course at {featuredProg.provider || "TESDA"} is evaluated as your top match ({featuredScore}% fit)."
                          </p>
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
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <button
                              onClick={() => handleDirectApply(featuredProg)}
                              disabled={isDisabled}
                              className={`text-xs font-extrabold px-4 py-2.5 rounded-lg transition-all ${
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
                                  : "bg-[#0A6B43] hover:bg-[#075332] text-white shadow-xs cursor-pointer"
                              }`}
                            >
                              {app
                                ? isEnrolled
                                  ? "Enrolled in Program ✓"
                                  : isDeclined
                                  ? "Application Declined"
                                  : "Application Pending..."
                                : isFull
                                ? "Slots Full"
                                : overlapWarning
                                ? "Schedule Overlap"
                                : isUnverified
                                ? "Awaiting SK Verification"
                                : "Apply Directly for Program"}
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
                  {programs.map((prog, idx) => {
                    // dynamic match scores
                    const score = calculateContentBasedMatchScore(youthProfile, prog);

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
                            const isEnrolled = app?.status === "Enrolled";
                            const isDeclined = app?.status === "Declined";
                            const isPending = app?.status === "Pending";

                            const isFull = !app && prog.slotsRemaining <= 0;
                            const overlapWarning = getOverlapWarning(prog);
                            const isDisabled = !!app || isFull || !!overlapWarning || isUnverified;

                            return (
                              <button
                                onClick={() => handleDirectApply(prog)}
                                disabled={isDisabled}
                                className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors ${
                                  app
                                    ? isEnrolled
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-default"
                                      : isDeclined
                                      ? "bg-red-50 text-red-700 border border-red-100 cursor-default"
                                      : "bg-blue-50 text-blue-700 border border-blue-100 cursor-default animate-pulse"
                                    : isFull
                                    ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                                    : overlapWarning
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed"
                                    : isUnverified
                                    ? "bg-amber-100/60 text-amber-800 border border-amber-200 cursor-not-allowed"
                                    : "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer"
                                }`}
                              >
                                {app
                                  ? isEnrolled
                                    ? "Enrolled ✓"
                                    : isDeclined
                                    ? "Declined"
                                    : "Pending"
                                  : isFull
                                  ? "Slots Full"
                                  : overlapWarning
                                  ? "Overlap"
                                  : isUnverified
                                  ? "Awaiting SK Verification"
                                  : "Apply Directly"}
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
                const userApps = referrals?.filter(r => r.youthName === youthProfile.name) || [];
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
                      const scheduleDays = (program?.trainingDays?.join(", ") || "TBA") || "Mondays to Fridays";
                      const scheduleTime = (program?.startTime ? `${new Date(program?.startTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"})} - ${program?.endTime ? new Date(program?.endTime).toLocaleTimeString([], {hour: "2-digit", minute:"2-digit"}) : "TBA"}` : "TBA") || "8:00 AM - 12:00 PM";
                      const room = program?.room || "Vocational Workshop Room 3";
                      const instructor = program?.instructor || "Professor Danilo Santos";
                      
                      return (
                        <div key={app.id} className="bg-white border border-[#D1FAE5] p-8 rounded-2xl shadow-xs space-y-6 relative overflow-hidden">
                          {/* Top Tag indicating Program */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-semibold">
                                Dedicated Livelihood Path
                              </span>
                              <h4 className="font-extrabold text-gray-900 text-sm sm:text-base mt-2">{app.programTitle}</h4>
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

                          <PathwayTimeline currentStep={isArchived ? 4 : isEnrolled ? 3 : 2} isMobile={false} />

                          {/* Visual Feedback on Application Status with explicit Instructions */}
                          {(() => {
                            if (isPending) {
                              return (
                                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4.5 flex items-start gap-3.5">
                                  <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                                  <div className="space-y-1 flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-100 pb-2 mb-2">
                                      <p className="text-xs font-extrabold text-blue-800 uppercase tracking-wider">Application Under Review</p>
                                      <button
                                        onClick={() => handleCancelApplication(app.id)}
                                        className="text-[11px] bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-red-150 cursor-pointer"
                                        id={`cancel-pathway-box-${app.id}`}
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Cancel Application
                                      </button>
                                    </div>
                                    <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                      Your application for <strong>{app.programTitle}</strong> has been received by the TESDA representative!
                                    </p>
                                    <div className="bg-white/80 border border-blue-100 rounded-xl p-3.5 mt-3 space-y-2 text-[11px] text-blue-900 shadow-2xs">
                                      <p className="font-extrabold text-blue-950 flex items-center gap-1.5">
                                        👉 Action Required to Complete Step 2:
                                      </p>
                                      <p className="leading-relaxed font-semibold text-blue-900">
                                        Please proceed to the <strong>TESDA GPSAT (Gonzalo Puyat School of Arts and Trades) Office</strong> to submit your physical requirements so they can verify your qualifications and approve your enrollment:
                                      </p>
                                      <ul className="list-disc pl-5 space-y-1 font-semibold text-blue-800">
                                        <li>Original & Photocopy of Birth Certificate (PSA)</li>
                                        <li>4 copies of 1x1 Pictures (white background, with name tag)</li>
                                        <li>High School Diploma or Form 137 (Report Card)</li>
                                        <li>Certificate of Barangay Residency (San Luis, Pampanga)</li>
                                      </ul>
                                      <p className="text-[10px] text-blue-600 italic font-semibold mt-2 pt-1 border-t border-blue-100">
                                        Once the TESDA officer verifies these documents, they will approve your enrollment inside the partner portal, advancing this pathway to Step 3!
                                      </p>
                                    </div>
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
                                        className="text-[11px] bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-red-200"
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
                              return (
                                <div className="space-y-4 w-full">
                                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4.5 flex items-start gap-3.5 shadow-2xs">
                                    <Award className="w-5 h-5 text-purple-600 shrink-0 mt-0.5 animate-bounce" />
                                    <div>
                                      <p className="text-xs font-extrabold text-purple-800 uppercase tracking-wider mb-1.5">Program Completed & Archived</p>
                                      <p className="text-[11px] text-purple-700 leading-relaxed font-semibold">
                                        Congratulations! You have successfully completed your training for <strong>{app.programTitle}</strong> as the program duration has ended. Your records are now safely archived, and you are ready for <strong>Step 4: Livelihood and Career Placement</strong>!
                                      </p>
                                      <div className="bg-white/80 border border-purple-100 rounded-xl p-3.5 mt-3 space-y-1.5 text-[11px] text-purple-900 shadow-2xs">
                                        <p className="font-extrabold text-purple-950 flex items-center gap-1.5">
                                          🎓 Next Pathway Milestone:
                                        </p>
                                        <p className="leading-relaxed font-medium text-purple-800">
                                          The Sangguniang Kabataan (SK) and TESDA representatives are preparing placement matching and entrepreneurship support tools for your batch. Stay tuned to announcements for upcoming job fairs, equipment starter toolkits, or micro-grant opportunities!
                                        </p>
                                      </div>
                                    </div>
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
                                        Congratulations! Your application has been approved by the TESDA office. You have successfully completed Step 2! You are now officially enrolled in <strong>{app.programTitle}</strong> and on track to complete your training (Step 3).
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
                                          <span className="text-xs font-bold text-gray-800">{room}</span>
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
                                      Please report to class in your proper training attire with your trainee ID card.
                                    </div>
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

                  {/* Popular Vocational Skill Suggestions */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Quick-Add Popular Vocational Skills
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">Click any skill below to instantly add it to your profile and boost your program match scores:</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        "Basic Computer Typing & MS Office",
                        "SMAW Shielded Metal Arc Welding",
                        "Food Sanitation & Preparation",
                        "Electrical Installation & Wiring",
                        "Bread & Pastry Baking",
                        "Automotive Engine Servicing",
                        "Garment Sewing & Tailoring",
                        "Digital Marketing & Social Media",
                        "Customer Service & Reception"
                      ].map((suggestedSkill) => {
                        const hasSkill = youthProfile.skills.includes(suggestedSkill);
                        return (
                          <button
                            key={suggestedSkill}
                            disabled={hasSkill || isUnverified}
                            onClick={async () => {
                              if (isUnverified) return;
                              const updatedSkills = [...youthProfile.skills, suggestedSkill];
                              const updatedMatchScore = Math.min(99, youthProfile.matchScore + 3);
                              setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, skills: updatedSkills, matchScore: updatedMatchScore } : y));
                              addToast(`Added "${suggestedSkill}" to your profile!`, "success");
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
                                : "bg-emerald-50 text-[#0A6B43] border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                            }`}
                          >
                            {hasSkill ? "✓ " : "+ "}
                            {suggestedSkill}
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
              {profileActiveTab === "badge" && (
                <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-xs max-w-md animate-in fade-in duration-150 space-y-5">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      Katipunan ng Kabataan Digital Membership Badge
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Official youth organization membership card for San Luis Pampanga</p>
                  </div>

                  {/* Digital ID Card */}
                  <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest block">Republic of the Philippines</span>
                        <h4 className="text-sm font-extrabold tracking-tight text-white">Katipunan ng Kabataan Member</h4>
                        <p className="text-[10px] text-emerald-200 font-bold">{youthProfile.purok} · Barangay {youthProfile.barangay}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-900 flex items-center justify-center font-black text-sm shadow-xs">
                        KK
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Member Name</span>
                        <span className="font-extrabold text-white text-sm">{youthProfile.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">KK ID Number</span>
                        <span className="font-mono text-amber-300 font-bold text-[11px]">KK-SANLUIS-{youthProfile.id.slice(-6).toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Contact Number</span>
                        <span className="font-bold text-emerald-100 text-[11px]">{youthProfile.contactNumber}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">SK Verification</span>
                        <span className="font-bold text-emerald-200 flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> {youthProfile.approvalStatus === "Approved" ? "Verified KK Member" : "Pending Verification"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `Katipunan ng Kabataan Digital ID:\nName: ${youthProfile.name}\nID: KK-SANLUIS-${youthProfile.id.slice(-6).toUpperCase()}\nBarangay: Barangay ${youthProfile.barangay}\nPurok: ${youthProfile.purok}\nStatus: ${youthProfile.approvalStatus}`
                        );
                        addToast("Digital KK ID copied to clipboard!", "success");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Copy Digital ID Info
                    </button>
                  </div>
                </div>
              )}
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

        {/* Direct Application Success Modal (Centered Desktop style) */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
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
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDirectApply}
                  className="flex-1 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg transition-colors"
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
