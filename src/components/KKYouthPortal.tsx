"use client";

import React, { useState, useMemo } from "react";
import {
  Home, Target, Award, User, Bell, Sparkles, Plus, CheckCircle,
  AlertTriangle, Phone, Mail, MapPin, Briefcase, Trash2, X, Globe, MessageSquare, LogOut,
  Calendar, Clock, XCircle
} from "lucide-react";
import { YouthProfile, TESDAProgram, SKAnnouncement, YouthScreen, ReferralPipelineItem } from "../types";
import { FlameMatchScore, GeminiExplanationBox, PathwayTimeline, SikapLogo } from "./ReusableComponents";
import { INITIAL_OFFICIALS } from "../data";

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

  // Filter announcements to only show municipal/global ones or ones matching the member's barangay
  const localAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (!ann.barangay) return true; // Municipal / Global announcement
      const annBrgy = ann.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = youthProfile.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return annBrgy === dbBrgy;
    });
  }, [announcements, youthProfile.barangay]);

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
  const handleAddSkillSubmit = (e: React.FormEvent) => {
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
    
    // update global profiles
    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          // dynamically upgrade matches when they add more skills for realism
          matchScore: Math.min(99, y.matchScore + 2)
        };
      }
      return y;
    }));

    addToast(`Added "${newSkillInput.trim()}" to your skills. Matches refreshed!`, "success");
    setNewSkillInput("");
    setShowAddSkillModal(false);
  };

  const handleRemoveSkillLocal = (skill: string) => {
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
    addToast("Skill removed", "info");
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
        matchScore: selectedProgramToApply.id === "p-01" ? 94 : 78,
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
            <span className="text-xs font-black text-amber-500 uppercase tracking-widest border-l border-white/20 pl-2">Youth</span>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              JD
            </div>
            <div>
              <p className="text-xs font-bold leading-none">{youthProfile.name}</p>
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
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Welcome, {youthProfile.name}! 👋</h1>
            <p className="text-xs text-gray-500 font-medium">Out-of-School Youth (OSY) Career & Livelihood Portal · San Luis, Pampanga</p>
          </div>
          
          <div className="flex items-center gap-4 relative" id="notification-bell-container">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {((referrals?.filter(r => r.youthName === youthProfile.name).length ?? 0) > 0 || localAnnouncements.length > 0) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-600 border border-white rounded-full animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-emerald-100 rounded-xl shadow-xl z-50 py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2">
                <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center">
                  <span className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Your Alerts</span>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] text-[#0A6B43] font-bold hover:underline"
                  >
                    Close
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {(() => {
                    const userApps = referrals?.filter(r => r.youthName === youthProfile.name) || [];
                    const notificationsList: Array<{ id: string; text: string; subtext: string; date: string; type: "pending" | "enrolled" | "declined" | "general" }> = [];

                    userApps.forEach(app => {
                      if (app.status === "Pending") {
                        notificationsList.push({
                          id: `notify-${app.id}-pending`,
                          text: `Requirements Submission Required`,
                          subtext: `Your application for "${app.programTitle}" is pending. Please proceed to the TESDA GPSAT (Gonzalo Puyat School of Arts and Trades) office to submit physical documents (Birth Cert, 1x1 Photos, Form 137).`,
                          date: app.referralDate || "Just Now",
                          type: "pending"
                        });
                      } else if (app.status === "Enrolled") {
                        notificationsList.push({
                          id: `notify-${app.id}-enrolled`,
                          text: `🎉 Enrollment Approved!`,
                          subtext: `Congratulations! You are officially accepted and enrolled in "${app.programTitle}". Training sessions will commence shortly.`,
                          date: "Just Now",
                          type: "enrolled"
                        });
                      } else if (app.status === "Declined") {
                        notificationsList.push({
                          id: `notify-${app.id}-declined`,
                          text: `❌ Application Declined`,
                          subtext: `Your application for "${app.programTitle}" was declined. Please verify your skills and profile info before re-applying.`,
                          date: "Just Now",
                          type: "declined"
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
                        type: "general"
                      });
                    });

                    if (notificationsList.length === 0) {
                      return (
                        <div className="p-4 text-center text-gray-400 italic">
                          No notifications or alerts.
                        </div>
                      );
                    }

                    return notificationsList.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-gray-50/70 transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 text-base leading-none">
                            {item.type === "enrolled" && "🎉"}
                            {item.type === "pending" && "📋"}
                            {item.type === "declined" && "❌"}
                            {item.type === "general" && "📢"}
                          </span>
                          <div className="space-y-0.5 flex-1">
                            <p className="font-bold text-gray-800 leading-tight text-[11px]">{item.text}</p>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">{item.subtext}</p>
                            <p className="text-[9px] text-gray-400 mt-1 font-semibold">{item.date}</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
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
                    <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Welcome Back</span>
                    <h3 className="font-extrabold text-2xl mt-1">Mabuhay, {youthProfile.name}! 👋</h3>
                    <p className="text-sm text-emerald-100/80 mt-2 leading-relaxed">
                      You are registered as an active Katipunan ng Kabataan member in {youthProfile.purok}, Barangay {youthProfile.barangay}. Use this portal to map your competencies, discover high-matching TESDA training programs, and track your active roadmap.
                    </p>
                  </div>
                  <div className="mt-4 flex gap-1.5">
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600 uppercase">
                      Pampanga Resident
                    </span>
                    <span className="bg-emerald-800 text-emerald-100 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-600 uppercase">
                      Age: {youthProfile.age}
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
                        if (app?.status === "Enrolled") return "Complete Welding NC II Class";
                        if (app?.status === "Pending") return "Awaiting Enrollment Approval";
                        if (app?.status === "Declined") return "Revise Profile & Re-apply";
                        return "Apply Directly for Welding NC II";
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
                      const scheduleDays = program?.classScheduleDays || "Mondays to Fridays";
                      const scheduleTime = program?.classScheduleTime || "8:00 AM - 12:00 PM";
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
                <div className="bg-white border border-[#D1FAE5] rounded-2xl p-6 shadow-xs space-y-4 md:col-span-3">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-xs uppercase font-bold text-[#D97706] tracking-wider block">Featured AI Match for You</span>
                      <h4 className="font-extrabold text-gray-800 text-lg mt-1">Welding NC II Training Course</h4>
                      <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 inline-block mt-1">
                        TESDA GPSAT Partner Program
                      </span>
                    </div>
                    <FlameMatchScore score={youthProfile.hasReferred ? 94 : youthProfile.matchScore} />
                  </div>

                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-sm italic text-emerald-950 leading-relaxed font-medium">
                      "Based on your welding skills and interest in trade work, this free 3-month course at TESDA GPSAT is your 94% fit. You will achieve NC II certificate immediately."
                    </p>
                  </div>

                  <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
                    <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1">
                      📋 Physical Requirements Needed Beforehand:
                    </p>
                    <ul className="list-disc pl-4 text-[10px] text-amber-800 space-y-0.5 font-semibold">
                      <li>PSA Birth Certificate (Original & Photocopy)</li>
                      <li>4 copies of 1x1 Pictures (white background, collar, with name tag)</li>
                      <li>High School Report Card / Form 137 or SHS Diploma</li>
                      <li>Certificate of Barangay Residency (San Luis, Pampanga)</li>
                      <li>Medical Certificate indicating you are physically fit</li>
                    </ul>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      <p>⏱ <strong>Duration:</strong> 3 months (268 hours)</p>
                      <p>📍 <strong>Location:</strong> TESDA PTC, San Fernando, Pampanga</p>
                    </div>
                    {(() => {
                      const featuredProg = programs.find(p => p.id === "p-01") || programs[0] || { id: "p-01", title: "Shielded Metal Arc Welding (SMAW) NC II", slotsRemaining: 0 };
                      const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === featuredProg.title);
                      const isEnrolled = app?.status === "Enrolled";
                      const isDeclined = app?.status === "Declined";
                      const isPending = app?.status === "Pending";
                      const isFull = !app && (featuredProg.slotsRemaining !== undefined && featuredProg.slotsRemaining <= 0);
                      
                      const overlapWarning = getOverlapWarning(featuredProg as TESDAProgram);
                      const isDisabled = !!app || isFull || !!overlapWarning || isUnverified;
                      
                      return (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <button
                            onClick={() => handleDirectApply(featuredProg as TESDAProgram)}
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
                      );
                    })()}
                  </div>
                  {(() => {
                    const featuredProg = programs.find(p => p.id === "p-01") || programs[0];
                    const overlapWarning = getOverlapWarning(featuredProg as TESDAProgram);
                    if (overlapWarning) {
                      return (
                        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold leading-relaxed">
                          ⚠️ <strong>Overlap Warning:</strong> {overlapWarning}
                        </p>
                      );
                    }
                    return null;
                  })()}
                </div>

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
                      {youthProfile.skills.map((s) => (
                        <span key={s} className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100">
                          {s}
                        </span>
                      ))}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localAnnouncements.map((ann) => (
                    <div key={ann.id} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-300 transition-colors">
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-2">
                          <span className="font-extrabold uppercase tracking-wide text-[#D97706] bg-amber-50 px-2.5 py-0.5 rounded-full">{ann.category}</span>
                          <span>{ann.datePosted}</span>
                        </div>
                        <h5 className="font-bold text-gray-800 text-sm">{ann.title}</h5>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{ann.body}</p>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-4 pt-2 border-t border-gray-50">
                        Target Audience: <span className="font-semibold text-gray-600">{ann.audience}</span>
                      </div>
                    </div>
                  ))}
                </div>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {programs.map((prog, idx) => {
                  // dynamic match scores
                  const score = idx === 0 
                    ? (youthProfile.hasReferred ? 94 : youthProfile.matchScore) 
                    : idx === 1 
                      ? Math.max(50, youthProfile.matchScore - 12) 
                      : Math.max(50, youthProfile.matchScore - 23);

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
                            {idx === 0
                              ? "Your welding skills are a strong match for this program. This is your fastest path to NC II certification."
                              : `Google Gemini identified a ${score}% compatibility score between your technical competencies and this local program.`}
                          </p>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-600">
                          <p>📍 <strong>Location:</strong> {prog.location}</p>
                          <p>⏱ <strong>Duration:</strong> {prog.duration} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""}</p>
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
                      const scheduleDays = program?.classScheduleDays || "Mondays to Fridays";
                      const scheduleTime = program?.classScheduleTime || "8:00 AM - 12:00 PM";
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* Profile details (3 cols) */}
              <div className="space-y-6 md:col-span-3">
                
                {/* User Card */}
                <div className="bg-white border border-gray-150 rounded-2xl p-6 flex items-center gap-6 shadow-xs">
                  <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 font-extrabold text-2xl flex items-center justify-center shrink-0">
                    JD
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-gray-900 text-lg">{youthProfile.name}</h4>
                    <p className="text-xs text-gray-500">{youthProfile.age} y/o · {youthProfile.purok} · Barangay {youthProfile.barangay}</p>
                    <div className="flex gap-2 pt-1.5">
                      <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200 rounded-full uppercase">
                        {youthProfile.currentStatus}
                      </span>
                      <span className="bg-emerald-50 text-[#0A6B43] text-[10px] font-bold px-2.5 py-0.5 border border-emerald-100 rounded-full uppercase">
                        {youthProfile.educationalAttainment}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account / Demographic Information details */}
                <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-3.5 text-xs text-gray-600">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block border-b border-gray-50 pb-2">Registered Profile Details</span>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-gray-400">Contact Number:</span>
                    <span className="font-bold text-gray-800">{youthProfile.contactNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-gray-400">Date Registered:</span>
                    <span className="font-bold text-gray-800">{youthProfile.registeredDate}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-gray-400">Municipality & Province:</span>
                    <span className="font-bold text-gray-800">San Luis, Pampanga</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-medium text-gray-400">Youth Organization Membership:</span>
                    <span className="font-bold text-[#0A6B43]">Katipunan ng Kabataan (KK) Verified</span>
                  </div>
                </div>
              </div>

              {/* Skills card (2 cols) */}
              <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs md:col-span-2 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Manage Competency Skills</span>
                    <button
                      onClick={() => {
                        if (isUnverified) {
                          addToast("Cannot add skills in View-Only Mode", "error");
                          return;
                        }
                        setShowAddSkillModal(true);
                      }}
                      disabled={isUnverified}
                      className={`text-xs font-bold ${isUnverified ? "text-gray-300 cursor-not-allowed" : "text-[#D97706] hover:underline cursor-pointer"}`}
                    >
                      + Add New
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {youthProfile.skills.map((s) => (
                      <span key={s} className="bg-amber-50 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full border border-amber-100 flex items-center gap-1.5">
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
                          className={`font-bold text-xs pl-1 ${isUnverified ? "text-amber-400 cursor-not-allowed" : "hover:text-red-500 cursor-pointer"}`}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-6 text-xs text-amber-900 leading-relaxed">
                  <strong>How mapping works:</strong> Registered skills are evaluated by our local matchmaking filters to determine optimal courses and apprenticeships sponsored by Sangguniang Kabataan and TESDA.
                </div>
              </div>

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
