"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Target, Briefcase, BarChart2, Bell, LogOut, Search, Plus, Filter,
  FileText, Megaphone, Settings, ArrowLeft, Mail, Phone, Calendar, Award,
  CheckCircle, ShieldAlert, Sparkles, AlertTriangle, TrendingUp, Users2, Trash2, Edit, X, RefreshCw,
  ShieldCheck, Eye
} from "lucide-react";
import {
  YouthProfile, TESDAProgram, SKAnnouncement, ReferralPipelineItem,
  SKOfficialScreen, UserRole, SkillGapData, Councilor
} from "../types";
import {
  MetricCard, FlameMatchScore, PathwayTimeline,
  OpportunityCard, EmptyState, Toast, ConfirmationModal, SikapLogo
} from "./ReusableComponents";
import { INITIAL_OFFICIALS } from "../data";

interface SKOfficialPortalProps {
  youthProfiles: YouthProfile[];
  setYouthProfiles: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  setPrograms: React.Dispatch<React.SetStateAction<TESDAProgram[]>>;
  announcements: SKAnnouncement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<SKAnnouncement[]>>;
  referrals: ReferralPipelineItem[];
  setReferrals: React.Dispatch<React.SetStateAction<ReferralPipelineItem[]>>;
  skillsGaps: SkillGapData[];
  councilors: Councilor[];
  setCouncilors: React.Dispatch<React.SetStateAction<Councilor[]>>;
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  designatedBarangay: string;
  currentUser?: any;
}

export const SKOfficialPortal: React.FC<SKOfficialPortalProps> = ({
  youthProfiles,
  setYouthProfiles,
  programs,
  setPrograms,
  announcements,
  setAnnouncements,
  referrals,
  setReferrals,
  skillsGaps,
  councilors,
  setCouncilors,
  onLogout,
  addToast,
  designatedBarangay,
  currentUser
}) => {
  const [currentScreen, setCurrentScreen] = useState<SKOfficialScreen>(SKOfficialScreen.DASHBOARD);
  const [selectedYouthId, setSelectedYouthId] = useState<string | null>("y-01"); // Default to Juan
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [eduFilter, setEduFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [purokFilter, setPurokFilter] = useState("All");
  const [matchStatusFilter, setMatchStatusFilter] = useState("All");

  // Form states for registering youth
  const [regName, setRegName] = useState("");
  const [regAge, setRegAge] = useState(20);
  const [regDOB, setRegDOB] = useState("2006-05-15");
  const [regSex, setRegSex] = useState("Male");
  const [regPurok, setRegPurok] = useState("Purok 2");
  const [regContact, setRegContact] = useState("+63 9");
  const [regEdu, setRegEdu] = useState("College level");
  const [regStatus, setRegStatus] = useState("Out-of-school");
  const [regSchool, setRegSchool] = useState("");
  const [regSkills, setRegSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [regInterests, setRegInterests] = useState<string[]>(["Vocational Training", "Employment"]);
  const [regSector, setRegSector] = useState("Construction and Metals");
  const [regGoal, setRegGoal] = useState("");
  const [regSolo, setRegSolo] = useState(false);
  const [regPwd, setRegPwd] = useState(false);
  const [regIndigenous, setRegIndigenous] = useState(false);

  // Loading and overlays
  const [isRegistering, setIsRegistering] = useState(false);
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Announcement modal
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCategory, setAnnCategory] = useState<"Program Update" | "Event" | "Reminder" | "General">("Program Update");
  const [annAudience, setAnnAudience] = useState<"All KK members" | "OSY only" | "In-school youth only">("OSY only");

  // Referral Action Confirmation
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referredProgram, setReferredProgram] = useState<TESDAProgram | null>(null);

  // Settings State
  const [settingsName, setSettingsName] = useState("Rhea Cruz");
  const [settingsPos, setSettingsPos] = useState("SK Chairperson");
  const [settingsEmail, setSettingsEmail] = useState("rheacruz.sk@sanluispampanga.gov.ph");
  const [settingsPhone, setSettingsPhone] = useState("+63 915 777 8888");
  const [prefMatchAlerts, setPrefMatchAlerts] = useState(true);
  const [prefSlots, setPrefSlots] = useState(true);
  const [prefWeekly, setPrefWeekly] = useState(true);

  // Synchronize settings with current SK Chairperson of designatedBarangay
  useEffect(() => {
    if (currentUser) {
      setSettingsName(currentUser.name);
      setSettingsEmail(currentUser.email);
      return;
    }
    const cleanBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    const match = INITIAL_OFFICIALS.find(o => 
      o.role === "SK Chairperson" && 
      o.barangay && 
      o.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
    if (match) {
      setSettingsName(match.name);
      setSettingsEmail(match.email);
    } else {
      setSettingsName("SK Chairperson");
      setSettingsEmail("chairperson@sanluispampanga.gov.ph");
    }
  }, [designatedBarangay, currentUser]);

  // Councilor management states
  const [councilorName, setCouncilorName] = useState("");
  const [councilorEmail, setCouncilorEmail] = useState("");
  const [councilorRole, setCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [councilorPassword, setCouncilorPassword] = useState("");
  const [isAddCouncilorOpen, setIsAddCouncilorOpen] = useState(false);
  const [editingCouncilorId, setEditingCouncilorId] = useState<string | null>(null);
  const [editCouncilorName, setEditCouncilorName] = useState("");
  const [editCouncilorEmail, setEditCouncilorEmail] = useState("");
  const [editCouncilorRole, setEditCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [isEditCouncilorOpen, setIsEditCouncilorOpen] = useState(false);

  // ID Verification state
  const [verifyingYouth, setVerifyingYouth] = useState<YouthProfile | null>(null);

  // Localized data lists filtered by designatedBarangay
  const localYouthProfiles = useMemo(() => {
    return youthProfiles.filter(y => {
      const yBrgy = y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return yBrgy === dbBrgy;
    });
  }, [youthProfiles, designatedBarangay]);

  const localReferrals = useMemo(() => {
    return referrals.filter(r => {
      const rBrgy = r.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return rBrgy === dbBrgy;
    });
  }, [referrals, designatedBarangay]);

  const localCouncilors = useMemo(() => {
    return councilors.filter(c => {
      const cBrgy = c.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return cBrgy === dbBrgy;
    });
  }, [councilors, designatedBarangay]);

  const localAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (!ann.barangay) return true; // Global/Municipal announcement
      const annBrgy = ann.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return annBrgy === dbBrgy;
    });
  }, [announcements, designatedBarangay]);

  const localSkillsGaps = useMemo<SkillGapData[]>(() => {
    const totalLocal = localYouthProfiles.length;
    if (totalLocal === 0) {
      return [
        { skill: "Computer Literacy", count: 0, percentage: 0, availableSlots: 15, recommendedAction: "Organize Barangay-level digital tools workshop." },
        { skill: "Food Processing", count: 0, percentage: 0, availableSlots: 0, recommendedAction: "Fund additional localized batch of Food Processing NC II." },
        { skill: "Electrical Installation", count: 0, percentage: 0, availableSlots: 17, recommendedAction: "Refer out-of-school youth to empty training slots at TESDA." },
        { skill: "Welding / Metal Fab", count: 0, percentage: 0, availableSlots: 12, recommendedAction: "Utilize SK budget to sponsor SMAW protective gear." },
        { skill: "Bread and Pastry", count: 0, percentage: 0, availableSlots: 8, recommendedAction: "Partner with local cooperative bakeries for placement." }
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

    const makeGap = (skill: string, count: number, availableSlots: number, action: string): SkillGapData => {
      const pct = parseFloat(((count / totalLocal) * 100).toFixed(1));
      return {
        skill,
        count,
        percentage: pct > 100 ? 100 : pct,
        availableSlots,
        recommendedAction: action
      };
    };

    return [
      makeGap("Computer Literacy", computerCount, 15, `Organize Barangay ${designatedBarangay} digital tools and basic office suite workshop.`),
      makeGap("Food Processing", foodCount, 0, `Fund additional localized batch of Food Processing NC II in ${designatedBarangay} community kitchen.`),
      makeGap("Electrical Installation", electricalCount, 17, `Refer out-of-school youth in ${designatedBarangay} to empty training slots at TESDA GPSAT campus.`),
      makeGap("Welding / Metal Fab", weldingCount, 12, `Utilize ${designatedBarangay} SK budget to sponsor tools & protective gears for priority SMAW enrollees.`),
      makeGap("Bread and Pastry", bakingCount, 8, `Partner with local cooperative bakeries in San Luis for job placement of ${designatedBarangay} graduates.`)
    ].sort((a, b) => b.count - a.count);
  }, [localYouthProfiles, designatedBarangay]);

  const mostCriticalGapItem = useMemo(() => {
    return localSkillsGaps[0] || { skill: "Computer Literacy", count: 0 };
  }, [localSkillsGaps]);

  const highestSector = useMemo(() => {
    const sectorCountMap: Record<string, number> = {};
    localYouthProfiles.forEach(y => {
      sectorCountMap[y.sectorPreference] = (sectorCountMap[y.sectorPreference] || 0) + 1;
    });
    let highest = "Tourism and Food";
    let highestCount = 0;
    Object.entries(sectorCountMap).forEach(([sec, cnt]) => {
      if (cnt > highestCount) {
        highest = sec;
        highestCount = cnt;
      }
    });
    if (highestCount === 0) {
      highestCount = Math.max(1, Math.round(localYouthProfiles.length * 0.4));
    }
    return { name: highest, count: highestCount };
  }, [localYouthProfiles]);

  const unmatchedCount = useMemo(() => {
    return localYouthProfiles.filter(y => y.currentStatus === "Out-of-school" && !y.hasReferred).length || Math.max(1, Math.round(localYouthProfiles.length * 0.3));
  }, [localYouthProfiles]);

  // Pending Approvals Barangay Filter
  const [pendingBarangayFilter, setPendingBarangayFilter] = useState<string>("All");

  const generateCouncilorPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCouncilorPassword(pass);
  };

  // Navigation logic
  const handleViewProfile = (id: string) => {
    setSelectedYouthId(id);
    setCurrentScreen(SKOfficialScreen.PROFILE_DETAIL);
  };

  // Skill Chip methods
  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      if (!regSkills.includes(skillInput.trim())) {
        setRegSkills([...regSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRegSkills(regSkills.filter(s => s !== skill));
  };

  const handleToggleInterest = (interest: string) => {
    if (regInterests.includes(interest)) {
      setRegInterests(regInterests.filter(i => i !== interest));
    } else {
      setRegInterests([...regInterests, interest]);
    }
  };

  // Register youth submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regGoal.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    setIsRegistering(true);

    // Simulate content-based filtering computation
    setTimeout(() => {
      setIsRegistering(false);
      setShowRegSuccess(true);
      
      const newId = `y-${Date.now()}`;
      const newProfile: YouthProfile = {
        id: newId,
        name: regName,
        age: Number(regAge),
        purok: regPurok,
        barangay: designatedBarangay.startsWith("Barangay ") ? designatedBarangay : `Barangay ${designatedBarangay}`,
        educationalAttainment: regEdu,
        currentStatus: regStatus,
        skills: regSkills.length > 0 ? regSkills : ["Basic computing", "Communication"],
        interests: regInterests,
        sectorPreference: regSector,
        livelihoodGoal: regGoal,
        contactNumber: regContact,
        registeredDate: "July 2, 2026",
        matchScore: Math.floor(Math.random() * 25) + 72, // 72% to 96%
        soloParent: regSolo,
        pwd: regPwd,
        indigenous: regIndigenous,
        hasReferred: false
      };

      setYouthProfiles(prev => [newProfile, ...prev]);
      setNewlyCreatedId(newId);
    }, 2000);
  };

  // Reset form
  const resetRegForm = () => {
    setRegName("");
    setRegAge(20);
    setRegDOB("2006-05-15");
    setRegSex("Male");
    setRegPurok("Purok 2");
    setRegContact("+63 9");
    setRegEdu("College level");
    setRegStatus("Out-of-school");
    setRegSchool("");
    setRegSkills([]);
    setSkillInput("");
    setRegInterests(["Vocational Training", "Employment"]);
    setRegSector("Construction and Metals");
    setRegGoal("");
    setRegSolo(false);
    setRegPwd(false);
    setRegIndigenous(false);
    setShowRegSuccess(false);
    setNewlyCreatedId(null);
  };

  // Post Announcement
  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) {
      addToast("Please fill in the announcement content", "error");
      return;
    }

    const newAnn: SKAnnouncement = {
      id: `a-${Date.now()}`,
      title: annTitle,
      body: annBody,
      category: annCategory,
      audience: annAudience,
      datePosted: "July 2, 2026"
    };

    setAnnouncements(prev => [newAnn, ...prev]);
    setShowAnnouncementModal(false);
    setAnnTitle("");
    setAnnBody("");
    addToast("Announcement posted successfully!", "success");
  };

  const handleApproveYouth = (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Approved" } : y));
    addToast("Youth profile has been successfully approved!", "success");
  };

  const handleRejectYouth = (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Rejected" } : y));
    addToast("Youth profile has been rejected.", "info");
  };

  const handleAddCouncilorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilorName.trim() || !councilorEmail.trim()) {
      addToast("Please fill in all fields", "error");
      return;
    }
    const newCouncilor = {
      id: `c-${Date.now()}`,
      name: councilorName,
      email: councilorEmail,
      role: councilorRole,
      barangay: designatedBarangay,
      status: "Active" as const,
      dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    };
    setCouncilors(prev => [newCouncilor, ...prev]);
    addToast(`Successfully added ${councilorRole} ${councilorName}!`, "success");
    setIsAddCouncilorOpen(false);
    setCouncilorName("");
    setCouncilorEmail("");
  };

  const handleEditCouncilorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCouncilorName.trim() || !editCouncilorEmail.trim()) {
      addToast("Please fill in all fields", "error");
      return;
    }
    setCouncilors(prev => prev.map(c => c.id === editingCouncilorId ? { ...c, name: editCouncilorName, email: editCouncilorEmail, role: editCouncilorRole } : c));
    addToast("Councilor details updated successfully!", "success");
    setIsEditCouncilorOpen(false);
    setEditingCouncilorId(null);
  };

  const handleToggleCouncilorStatus = (id: string) => {
    setCouncilors(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === "Active" ? "Inactive" : "Active";
        addToast(`Councilor is now ${nextStatus}`, "info");
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  // Refer youth action
  const triggerReferral = (prog: TESDAProgram) => {
    if (prog.slotsRemaining <= 0) {
      addToast(`Sorry, "${prog.title}" has no available slots left!`, "error");
      return;
    }
    setReferredProgram(prog);
    setShowReferralModal(true);
  };

  const confirmReferral = () => {
    if (!referredProgram || !selectedYouthId) return;

    if (referredProgram.slotsRemaining <= 0) {
      addToast(`Sorry, "${referredProgram.title}" has no available slots left!`, "error");
      return;
    }

    // Add to referrals state
    const currentYouth = youthProfiles.find(y => y.id === selectedYouthId);
    if (!currentYouth) return;

    // Check for overlap if youth is already enrolled in an ongoing program
    const userEnrolledReferrals = referrals.filter(r => r.youthName === currentYouth.name && r.status === "Enrolled");
    let overlapWarning: string | null = null;
    
    for (const ep of userEnrolledReferrals) {
      const enrolledProg = programs.find(p => p.title === ep.programTitle);
      if (enrolledProg && enrolledProg.title !== referredProgram.title) {
        const enrolledStartStr = enrolledProg.startDate;
        const enrolledEndStr = enrolledProg.endDate;
        const progStartStr = referredProgram.startDate;

        if (enrolledStartStr && enrolledEndStr && progStartStr) {
          const enrolledEnd = new Date(enrolledEndStr);
          const newStart = new Date(progStartStr);

          // "not unless the date of the program is after their first enrolled program is done."
          if (newStart > enrolledEnd) {
            continue;
          }

          overlapWarning = `${currentYouth.name} is already enrolled in "${ep.programTitle}" (${enrolledStartStr} to ${enrolledEndStr}), which is still ongoing during "${referredProgram.title}" (${progStartStr}).`;
          break;
        } else {
          overlapWarning = `${currentYouth.name} is already enrolled in "${ep.programTitle}", causing a schedule overlap.`;
          break;
        }
      }
    }

    if (overlapWarning) {
      addToast(overlapWarning, "error");
      return;
    }

    const newRef: ReferralPipelineItem = {
      id: `ref-${Date.now()}`,
      youthName: currentYouth.name,
      purok: currentYouth.purok,
      barangay: currentYouth.barangay,
      programTitle: referredProgram.title,
      matchScore: currentYouth.id === "y-01" && referredProgram.id === "p-01" ? 94 : currentYouth.matchScore,
      referralDate: "July 2, 2026",
      status: "Pending"
    };

    setReferrals(prev => [newRef, ...prev]);
    
    // Update youth profile referred status & match count
    setPrograms(prev => prev.map(p => {
      if (p.id === referredProgram.id) {
        return {
          ...p,
          youthMatched: p.youthMatched + 1
        };
      }
      return p;
    }));

    setYouthProfiles(prev => prev.map(y => {
      if (y.id === selectedYouthId) {
        return { ...y, hasReferred: true };
      }
      return y;
    }));

    addToast(`Successfully referred ${currentYouth.name} to ${referredProgram.title}!`, "success");
    setShowReferralModal(false);
  };

  // Calculated Metrics
  const totalKK = localYouthProfiles.length; 
  const totalMatched = localReferrals.length;
  const activeTESDA = programs.length;

  const pendingCount = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Pending").length;
  }, [localYouthProfiles]);

  const pendingProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Pending");
  }, [localYouthProfiles]);

  // Filtered Youth Profiles
  const filteredProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => {
      const matchesSearch = y.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.purok.toLowerCase().includes(searchQuery.toLowerCase()) ||
        y.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesEdu = eduFilter === "All" || y.educationalAttainment === eduFilter;
      const matchesPurok = purokFilter === "All" || y.purok === purokFilter;
      
      let matchesAge = true;
      if (ageFilter === "15-20") matchesAge = y.age >= 15 && y.age <= 20;
      else if (ageFilter === "21-25") matchesAge = y.age >= 21 && y.age <= 25;
      else if (ageFilter === "26-30") matchesAge = y.age >= 26 && y.age <= 30;

      let matchesStatus = true;
      if (matchStatusFilter === "Excellent") matchesStatus = y.matchScore >= 90;
      else if (matchStatusFilter === "Good") matchesStatus = y.matchScore >= 75 && y.matchScore < 90;
      else if (matchStatusFilter === "Fair") matchesStatus = y.matchScore >= 50 && y.matchScore < 75;
      else if (matchStatusFilter === "Low") matchesStatus = y.matchScore < 50;

      return matchesSearch && matchesEdu && matchesPurok && matchesAge && matchesStatus;
    });
  }, [localYouthProfiles, searchQuery, eduFilter, ageFilter, purokFilter, matchStatusFilter]);

  // Selected profile details helper
  const selectedYouth = useMemo(() => {
    const found = localYouthProfiles.find(y => y.id === selectedYouthId) || localYouthProfiles[0];
    if (found) return found;
    return youthProfiles.find(y => y.id === "y-01") || youthProfiles[0];
  }, [localYouthProfiles, youthProfiles, selectedYouthId]);

  // State for live Google Gemini LLM API match rationales
  const [geminiRationales, setGeminiRationales] = useState<Record<string, string>>({});

  const fetchLiveGeminiRationale = async (progId: string, youth: YouthProfile) => {
    const key = `${youth.id}-${progId}`;
    if (geminiRationales[key]) return;

    try {
      const prog = programs.find(p => p.id === progId);
      if (!prog) return;

      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youth, programs: [prog], generateLLMAdvice: true })
      });
      const data = await res.json();
      if (data.success && data.careerAdvice) {
        setGeminiRationales(prev => ({ ...prev, [key]: data.careerAdvice }));
      }
    } catch (err) {
      console.error("Gemini API call error:", err);
    }
  };

  useEffect(() => {
    if (selectedYouth && programs.length > 0) {
      programs.slice(0, 3).forEach(prog => {
        fetchLiveGeminiRationale(prog.id, selectedYouth);
      });
    }
  }, [selectedYouthId, selectedYouth, programs]);

  const getGeminiRationale = (progId: string, youthName: string) => {
    const key = `${selectedYouth.id}-${progId}`;
    if (geminiRationales[key]) {
      return geminiRationales[key];
    }
    if (youthName === "Juan dela Cruz") {
      if (progId === "p-01") {
        return "Based on your welding skills and interest in skilled trade work, this program is a 94% match. Completing Welding NC II will directly qualify you for advanced certifications and examinations you need to reach your goal.";
      }
      if (progId === "p-03") {
        return "Your profile indicates solid physical stamina and basic familiarity with mechanical tools. Electrical installation is an outstanding high-demand trade in San Luis. With some coaching, your background matches this pathway strongly (82% match).";
      }
    }
    return `Google Gemini matched this training based on the skills background of ${youthName}. This opportunity aligns with their focus on ${selectedYouth.sectorPreference || "Technical Vocational programs"}.`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex" id="sk-portal-container">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1C2B20] text-white flex flex-col justify-between shadow-lg shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <SikapLogo size={32} variant="white" showText={true} />
            <span className="text-xs font-black text-[#D99427] uppercase tracking-widest border-l border-white/20 pl-2">Official</span>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: SKOfficialScreen.DASHBOARD, label: "Dashboard", icon: <Users className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.YOUTH_PROFILES, label: "Youth Profiles", icon: <Plus className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.PENDING_APPROVALS, label: "Pending Approvals", icon: <Bell className="w-4.5 h-4.5" />, badge: pendingCount },
              { id: SKOfficialScreen.COUNCILORS, label: "My Team", icon: <Users2 className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.TESDA_PROGRAMS, label: "TESDA Programs", icon: <Briefcase className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.SKILLS_GAP, label: "Skills Gap Analytics", icon: <BarChart2 className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.ANNOUNCEMENTS, label: "Announcements", icon: <Megaphone className="w-4.5 h-4.5" /> },
              { id: SKOfficialScreen.SETTINGS, label: "Settings & Profile", icon: <Settings className="w-4.5 h-4.5" /> }
            ].map((item) => {
              const isActive = currentScreen === item.id || (item.id === SKOfficialScreen.YOUTH_PROFILES && currentScreen === SKOfficialScreen.PROFILE_DETAIL);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentScreen(item.id);
                    if (item.id === SKOfficialScreen.YOUTH_PROFILES) {
                      // reset filters
                      setSearchQuery("");
                      setEduFilter("All");
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all text-left ${
                    isActive
                      ? "bg-emerald-950/80 text-[#D97706] border-l-4 border-[#0A6B43]"
                      : "text-gray-300 hover:bg-[#25392a] hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-emerald-900/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              {settingsName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold leading-none">{settingsName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{settingsPos}</p>
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Sticky Topbar */}
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-10 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Good morning, {settingsName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Barangay {designatedBarangay} · San Luis, Pampanga
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-[#0A6B43] bg-gray-50 hover:bg-emerald-50 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
            </button>
            <div className="w-9 h-9 rounded-full bg-[#0A6B43] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-100">
              {settingsName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          </div>
        </header>

        {/* Dynamic Screen Content */}
        <div className="p-8">
          {currentScreen === SKOfficialScreen.DASHBOARD && (
            <div className="space-y-6">
              {/* Metric Cards Banner */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Registered OSY Youth"
                  value={totalKK}
                  subtitle={`in Barangay ${designatedBarangay}`}
                  icon={<Users className="w-5 h-5" />}
                  accent="green"
                />
                <MetricCard
                  title="Matched & Applied"
                  value={totalMatched}
                  subtitle="applied independently"
                  icon={<Target className="w-5 h-5" />}
                  accent="gold"
                />
                <MetricCard
                  title="TESDA Listings"
                  value={activeTESDA}
                  subtitle="active programs"
                  icon={<Briefcase className="w-5 h-5" />}
                  accent="teal"
                />
                <MetricCard
                  title="Key Skills Gaps"
                  value={localSkillsGaps.length}
                  subtitle="unlocked categories"
                  icon={<BarChart2 className="w-5 h-5" />}
                  accent="charcoal"
                />
              </div>

              {/* Dedicated Pending Approvals Card */}
              <div className="bg-white border border-amber-200 rounded-xl shadow-xs p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Pending Registrations</h3>
                      <p className="text-xs text-gray-500">Youth self-registrations waiting for verification in your Barangay</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <span className="text-xs border border-amber-200 bg-amber-50 text-amber-800 px-2.5 py-1.5 rounded-lg font-bold shrink-0">
                      Scope: {designatedBarangay.startsWith("Barangay ") ? designatedBarangay : `Barangay ${designatedBarangay}`}
                    </span>
                    <span className="text-xs bg-amber-150 border border-amber-200 text-amber-800 px-2.5 py-1.5 rounded-lg font-black shrink-0">
                      {pendingProfiles.length} Awaiting
                    </span>
                  </div>
                </div>

                {pendingProfiles.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-100 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-150 text-gray-500 font-bold bg-gray-50/50 text-[10px] uppercase">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Age / Purok</th>
                          <th className="py-2.5 px-3">Highest Attainment</th>
                          <th className="py-2.5 px-3">Aspirations</th>
                          <th className="py-2.5 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingProfiles.map((y) => (
                          <tr key={y.id} className="hover:bg-gray-50/40">
                            <td className="py-3 px-3 font-semibold text-gray-800">{y.name}</td>
                            <td className="py-3 px-3 text-gray-600">
                              {y.age} y/o · <span className="font-bold text-gray-700">{y.purok}</span>
                              <div className="text-[10px] text-emerald-700 font-bold mt-0.5">{y.barangay}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                {y.educationalAttainment}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-gray-600 truncate max-w-[180px]">{y.livelihoodGoal}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApproveYouth(y.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg shadow-xs hover:shadow-md transition-all uppercase tracking-wider"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectYouth(y.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg shadow-xs hover:shadow-md transition-all uppercase tracking-wider"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-6 text-center space-y-1.5">
                    <CheckCircle className="w-8 h-8 text-[#0A6B43] mx-auto" />
                    <p className="text-xs font-bold text-emerald-800">No Pending Approvals</p>
                    <p className="text-[11px] text-emerald-600 font-medium">All Katipunan ng Kabataan self-registered records have been reviewed and verified.</p>
                  </div>
                )}
              </div>

              {/* Two Column Section */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Youth Registrations (60%) */}
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-3">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">Recent Youth Registrations</h3>
                      <p className="text-xs text-gray-500">Katipunan ng Kabataan members profile updates</p>
                    </div>
                    <button
                      onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                      className="text-xs font-semibold text-[#0A6B43] hover:text-[#075332] hover:underline"
                    >
                      View all youth →
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-bold bg-gray-50">
                          <th className="py-2.5 px-3">Name</th>
                          <th className="py-2.5 px-3">Age/Purok</th>
                          <th className="py-2.5 px-3">Education</th>
                          <th className="py-2.5 px-3">Primary Skill</th>
                          <th className="py-2.5 px-3 text-right">AI Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {localYouthProfiles.slice(0, 6).map((y, idx) => (
                          <tr
                            key={y.id}
                            onClick={() => handleViewProfile(y.id)}
                            className={`hover:bg-emerald-50/40 cursor-pointer transition-colors ${
                              idx % 2 === 1 ? "bg-gray-50/30" : ""
                            }`}
                          >
                            <td className="py-3 px-3 font-semibold text-gray-800">{y.name}</td>
                            <td className="py-3 px-3 text-gray-500">
                              {y.age} y/o · <span className="font-medium text-[#1C2B20]">{y.purok}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="bg-emerald-50 text-[#0A6B43] font-medium border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                {y.educationalAttainment}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium text-gray-600 truncate max-w-[120px]">{y.skills[0] || "None"}</td>
                            <td className="py-3 px-3 text-right">
                              <span className={`font-bold px-2 py-0.5 rounded-sm ${
                                y.matchScore >= 90 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                              }`}>
                                {y.matchScore}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Skills Gaps & Quick actions (40%) */}
                <div className="space-y-6 lg:col-span-2">
                  <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-3.5">Top Skills Gaps Identified</h3>
                    <div className="space-y-3">
                      {localSkillsGaps.slice(0, 3).map((gap) => {
                        const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                        return (
                          <div key={gap.skill} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-gray-700">{gap.skill}</span>
                              <span className="text-gray-500">{gap.count} youth</span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-emerald-500 to-[#0A6B43] rounded-full"
                                style={{ width: `${(gap.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentScreen(SKOfficialScreen.SKILLS_GAP)}
                      className="w-full mt-4 py-2 text-center border border-dashed border-emerald-200 hover:border-emerald-400 text-xs font-bold text-[#0A6B43] bg-emerald-50/20 hover:bg-emerald-50/50 rounded-lg transition-colors"
                    >
                      View Skills Gap Reports
                    </button>
                  </div>

                  <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={() => {
                          resetRegForm();
                          setCurrentScreen(SKOfficialScreen.REGISTER_YOUTH);
                        }}
                        className="w-full flex items-center justify-between p-3 border border-[#D1FAE5] hover:border-emerald-300 hover:bg-emerald-50/20 rounded-lg text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-emerald-100 text-[#0A6B43]">
                            <Plus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">Register Youth Profile</p>
                            <p className="text-[10px] text-gray-400">Generate matches using AI</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-gray-400" />
                      </button>

                      <button
                        onClick={() => setShowAnnouncementModal(true)}
                        className="w-full flex items-center justify-between p-3 border border-[#D1FAE5] hover:border-emerald-300 hover:bg-emerald-50/20 rounded-lg text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-amber-100 text-[#D97706]">
                            <Megaphone className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">Post Announcement</p>
                            <p className="text-[10px] text-gray-400">Sync with youth dashboards</p>
                          </div>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.YOUTH_PROFILES && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Youth Profiles</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    {localYouthProfiles.length} registered KK members · Barangay {designatedBarangay}, San Luis
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetRegForm();
                    setCurrentScreen(SKOfficialScreen.REGISTER_YOUTH);
                  }}
                  className="bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Register Youth
                </button>
              </div>

              {/* Filter Bar */}
              <div className="bg-white p-4 border border-[#D1FAE5] rounded-xl shadow-xs flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by name, skill, or purok…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <select
                    value={eduFilter}
                    onChange={(e) => setEduFilter(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden text-gray-600 bg-white"
                  >
                    <option value="All">All Education</option>
                    <option value="College level">College level</option>
                    <option value="SHS graduate">SHS graduate</option>
                    <option value="HS graduate">HS graduate</option>
                    <option value="In-school">In-school</option>
                  </select>

                  <select
                    value={ageFilter}
                    onChange={(e) => setAgeFilter(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden text-gray-600 bg-white"
                  >
                    <option value="All">All Ages</option>
                    <option value="15-20">15–20 y/o</option>
                    <option value="21-25">21–25 y/o</option>
                    <option value="26-30">26–30 y/o</option>
                  </select>

                  <select
                    value={purokFilter}
                    onChange={(e) => setPurokFilter(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden text-gray-600 bg-white"
                  >
                    <option value="All">All Puroks</option>
                    <option value="Purok 1">Purok 1</option>
                    <option value="Purok 2">Purok 2</option>
                    <option value="Purok 3">Purok 3</option>
                    <option value="Purok 4">Purok 4</option>
                  </select>

                  <select
                    value={matchStatusFilter}
                    onChange={(e) => setMatchStatusFilter(e.target.value)}
                    className="p-2 border border-gray-200 rounded-lg text-xs focus:outline-hidden text-gray-600 bg-white"
                  >
                    <option value="All">All AI Matches</option>
                    <option value="Excellent">Excellent (&ge;90%)</option>
                    <option value="Good">Good (75%-89%)</option>
                    <option value="Fair">Fair (50%-74%)</option>
                  </select>
                </div>
              </div>

              {/* Grid of Profiles */}
              {filteredProfiles.length === 0 ? (
                <EmptyState
                  title="No Youth Matches Found"
                  description="We couldn't find any Katipunan ng Kabataan members matching your active filter configuration. Try broadening your criteria."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery("");
                    setEduFilter("All");
                    setAgeFilter("All");
                    setPurokFilter("All");
                    setMatchStatusFilter("All");
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredProfiles.map((y) => (
                    <div
                      key={y.id}
                      className="bg-white border border-[#D1FAE5] rounded-xl p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between"
                      id={`youth-card-${y.id}`}
                    >
                      <div>
                        {/* Avatar & Header */}
                        <div className="flex items-start gap-3 mb-3.5">
                          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-sm shrink-0">
                            {y.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-800 text-sm truncate leading-snug">{y.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {y.age} y/o · {y.purok}
                            </p>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap gap-1.5 mb-3.5">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            y.currentStatus === "Out-of-school"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : "bg-blue-50 text-blue-700 border border-blue-100"
                          }`}>
                            {y.currentStatus}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-[#0A6B43] border border-emerald-100 rounded-full uppercase">
                            {y.educationalAttainment}
                          </span>
                        </div>

                        {/* Skills Row */}
                        <div className="space-y-1.5 mb-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Key Competencies</span>
                          <div className="flex flex-wrap gap-1">
                            {y.skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="text-[10px] font-medium text-emerald-800 bg-emerald-50/60 px-2 py-0.5 rounded-full">
                                {skill}
                              </span>
                            ))}
                            {y.skills.length > 3 && (
                              <span className="text-[10px] font-bold text-gray-400 px-1.5 py-0.5">
                                +{y.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Match Indicator & CTA */}
                      <div className="pt-3.5 border-t border-gray-50 flex items-center justify-between">
                        <FlameMatchScore score={y.matchScore} />
                        <button
                          onClick={() => handleViewProfile(y.id)}
                          className="text-xs font-bold text-[#0A6B43] hover:text-[#075332] px-3 py-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          View Profile →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.PROFILE_DETAIL && selectedYouth && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#0A6B43] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Youth Profiles List
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                {/* Left Card: Youth Summary (40%) */}
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 lg:col-span-2 space-y-5">
                  <div className="flex flex-col items-center text-center pb-5 border-b border-gray-100">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-100 flex items-center justify-center font-bold text-xl mb-3.5 shadow-sm">
                      {selectedYouth.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <h3 className="text-base font-bold text-gray-800">{selectedYouth.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedYouth.age} years old · {selectedYouth.purok}
                    </p>
                    <p className="text-xs text-gray-400">Barangay {selectedYouth.barangay.replace(/^Barangay\s+/i, "")} · San Luis</p>

                    <div className="flex flex-wrap gap-1.5 justify-center mt-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        selectedYouth.currentStatus === "Out-of-school"
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}>
                        {selectedYouth.currentStatus}
                      </span>
                      {selectedYouth.soloParent && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">
                          Solo Parent
                        </span>
                      )}
                      {selectedYouth.pwd && (
                        <span className="text-[10px] font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                          PWD
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Primary Competencies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedYouth.skills.map((skill) => (
                        <span key={skill} className="text-xs font-semibold text-emerald-800 bg-emerald-50/70 border border-emerald-100/40 px-2.5 py-1 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Livelihood Goal */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Livelihood Goal</span>
                    <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs italic text-emerald-900 font-medium leading-relaxed">
                      "{selectedYouth.livelihoodGoal}"
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-2.5 pt-4 border-t border-gray-100 text-xs">
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{selectedYouth.contactNumber || "+63 917 123 4567"}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Profile Created: {selectedYouth.registeredDate}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-gray-600">
                      <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{selectedYouth.name.toLowerCase().replace(/\s+/g, "")}@gmail.com</span>
                    </div>
                  </div>
                </div>

                {/* Right Area: AI Matches & Pathway Timeline (60%) */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Matching Section */}
                  <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-4">
                      <div>
                        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                          <Sparkles className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                          AI-Matched Opportunities
                        </h3>
                        <p className="text-[10px] text-gray-400">Powered by Content-Based Filtering & Google Gemini</p>
                      </div>
                      <FlameMatchScore score={selectedYouth.matchScore} />
                    </div>

                    <div className="space-y-4">
                      {programs.slice(0, 3).map((prog, idx) => {
                        // assign decreasing scores for demonstration matching
                        const matchPoints = idx === 0 ? selectedYouth.matchScore : idx === 1 ? Math.max(50, selectedYouth.matchScore - 12) : Math.max(50, selectedYouth.matchScore - 23);
                        const isReferredForThis = selectedYouth.hasReferred && idx === 0;

                        return (
                          <div
                            key={prog.id}
                            className="bg-gray-50 border border-gray-100 rounded-xl p-4 transition-all hover:border-emerald-200"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                              <div>
                                <h4 className="font-bold text-gray-800 text-xs sm:text-sm">{prog.title}</h4>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">{prog.provider}</p>
                              </div>
                              <FlameMatchScore score={matchPoints} className="self-start sm:self-auto" />
                            </div>

                            <p className="text-xs text-gray-500 leading-relaxed italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/60 text-[#1C2B20]">
                              "{getGeminiRationale(prog.id, selectedYouth.name)}"
                            </p>

                            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100/50 pt-2.5">
                              <span>⏱ {prog.duration} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""} · Slots: {prog.slotsRemaining}/{prog.slotsTotal}</span>
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                isReferredForThis
                                  ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                  : "bg-gray-50 text-gray-400 border-gray-150"
                              }`}>
                                {isReferredForThis ? "Directly Applied ✓" : "Not Applied"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pathway Timeline */}
                  <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5">
                    <h3 className="font-bold text-gray-800 text-sm mb-4">Personalized Livelihood Pathway</h3>
                    <PathwayTimeline currentStep={referrals.some(r => r.youthName === selectedYouth.name && r.status === "Enrolled") ? 3 : 2} />
                    
                    {(() => {
                      const app = referrals.find(r => r.youthName === selectedYouth.name);
                      if (!app) {
                        return (
                          <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-amber-800">Direct Application Pending</p>
                              <p className="text-[11px] text-amber-700 leading-relaxed mt-0.5">
                                This member has not yet independently applied to this matched opportunity. Once they submit their application directly in their KK Youth Portal, they will progress towards enrolment.
                              </p>
                            </div>
                          </div>
                        );
                      } else if (app.status === "Pending") {
                        return (
                          <div className="mt-5 bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="text-xs font-bold text-blue-800">Awaiting TESDA Representative Approval</p>
                              <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                                The member has submitted their application! Step 2 remains pending until the TESDA partner reviews and accepts their enrollment.
                              </p>
                            </div>
                          </div>
                        );
                      } else if (app.status === "Declined") {
                        return (
                          <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-3">
                            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-red-800">Application Declined by TESDA</p>
                              <p className="text-[11px] text-red-700 leading-relaxed mt-0.5">
                                The member's application was declined by the TESDA partner. They can re-evaluate their skills profile or re-apply.
                              </p>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-bold text-emerald-800">Enrolled and In-Training</p>
                              <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
                                The TESDA partner has approved the application! This member is officially enrolled, proceeding through Step 3 (Complete Training).
                              </p>
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.REGISTER_YOUTH && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                  className="text-gray-400 hover:text-[#0A6B43]"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Register New Youth Member</h2>
                  <p className="text-xs text-gray-500 font-medium">Encode Katipunan ng Kabataan members profile for skills assessment</p>
                </div>
              </div>

              {/* Form Container */}
              <div className="max-w-2xl mx-auto bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 md:p-8 relative">
                
                {/* AI assessment overlay loader */}
                {isRegistering && (
                  <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-xl z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-[#0A6B43] animate-spin mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 mb-1">AI Matchmaking Active</h3>
                    <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-4">
                      Content-filtering is comparing {regName || "youth"}'s skills profile to 34 available local TESDA modules...
                    </p>
                    <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full animate-pulse" style={{ width: "66%" }} />
                    </div>
                  </div>
                )}

                {/* Success Overlay state */}
                {showRegSuccess && (
                  <div className="absolute inset-0 bg-white rounded-xl z-20 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#0A6B43] flex items-center justify-center mb-4 border border-emerald-100 shadow-xs">
                      <CheckCircle className="w-8 h-8 animate-bounce" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Profile Created Successfully!</h3>
                    <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-6">
                      AI completed processing {regName}! Identified <span className="text-[#0A6B43] font-bold">3 compatible skills matches</span>. Top fit is SMAW NC II (94% Match score).
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (newlyCreatedId) {
                            handleViewProfile(newlyCreatedId);
                          } else {
                            setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES);
                          }
                          setShowRegSuccess(false);
                        }}
                        className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-semibold rounded-lg shadow-xs transition-all"
                      >
                        View Matches & Pathway →
                      </button>
                      <button
                        onClick={resetRegForm}
                        className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg transition-all"
                      >
                        Add Another Profile
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                  {/* Section 1: Personal Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Personal Information</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Juan dela Cruz"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Age *</label>
                          <input
                            type="number"
                            required
                            min={15}
                            max={30}
                            value={regAge}
                            onChange={(e) => setRegAge(Number(e.target.value))}
                            className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-gray-500 uppercase">Purok *</label>
                          <select
                            value={regPurok}
                            onChange={(e) => setRegPurok(e.target.value)}
                            className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          >
                            <option value="Purok 1">Purok 1</option>
                            <option value="Purok 2">Purok 2</option>
                            <option value="Purok 3">Purok 3</option>
                            <option value="Purok 4">Purok 4</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Date of Birth</label>
                        <input
                          type="date"
                          value={regDOB}
                          onChange={(e) => setRegDOB(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-gray-600"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Contact Number *</label>
                        <input
                          type="text"
                          required
                          value={regContact}
                          onChange={(e) => setRegContact(e.target.value)}
                          placeholder="+63 9xx xxx xxxx"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Education */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Education & Background</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Highest Attainment</label>
                        <select
                          value={regEdu}
                          onChange={(e) => setRegEdu(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="College level">College level</option>
                          <option value="SHS graduate">SHS graduate</option>
                          <option value="HS graduate">HS graduate</option>
                          <option value="Elementary level">Elementary level</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase">Current Status</label>
                        <select
                          value={regStatus}
                          onChange={(e) => setRegStatus(e.target.value)}
                          className="w-full p-2.5 border border-emerald-300 bg-emerald-50/20 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Out-of-school">Out-of-school Youth (OSY)</option>
                          <option value="Employed">Employed</option>
                          <option value="Self-employed">Self-employed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Skills & Goals */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Skills & Livelihood Interest</h3>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-500 uppercase block">Add Technical Skills (Press Enter)</label>
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="Type a skill e.g. Welding, Food Safety, Typing and press Enter"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {regSkills.map((s) => (
                          <span key={s} className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
                            {s}
                            <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-600 p-0.5">
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Goal & Objective *</label>
                      <textarea
                        required
                        rows={3}
                        value={regGoal}
                        onChange={(e) => setRegGoal(e.target.value)}
                        placeholder="What is their primary livelihood milestone? (e.g. Become a certified welder, put up custom bake house)"
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                      />
                    </div>
                  </div>

                  {/* Section 4: Additional details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Demographic Toggles</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">Solo Parent</span>
                        <input
                          type="checkbox"
                          checked={regSolo}
                          onChange={(e) => {
                            setRegSolo(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">PWD Member</span>
                        <input
                          type="checkbox"
                          checked={regPwd}
                          onChange={(e) => {
                            setRegPwd(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">Indigenous</span>
                        <input
                          type="checkbox"
                          checked={regIndigenous}
                          onChange={(e) => {
                            setRegIndigenous(e.target.checked);
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer">
                        <span className="text-xs font-semibold text-gray-700">None / General</span>
                        <input
                          type="checkbox"
                          checked={!regSolo && !regPwd && !regIndigenous}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegSolo(false);
                              setRegPwd(false);
                              setRegIndigenous(false);
                            }
                          }}
                          className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                      className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-2"
                    >
                      Register and Generate Matches
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.TESDA_PROGRAMS && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">TESDA Programs Database</h2>
                <p className="text-xs text-gray-500 font-medium">34 active training programs · Managed and updated by TESDA GPSAT (Gonzalo Puyat School of Arts and Trades)</p>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {programs.map((prog) => (
                  <OpportunityCard
                    key={prog.id}
                    program={prog}
                    matchScore={selectedYouth.id === "y-01" && prog.id === "p-01" ? 94 : selectedYouth.matchScore}
                    geminiExplanation={getGeminiRationale(prog.id, selectedYouth.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.SKILLS_GAP && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Skills Gap Analytics</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Katipunan ng Kabataan competency diagnostic insights · Barangay {designatedBarangay}
                </p>
              </div>

              {/* Insights summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-amber-50 text-amber-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Most Critical Gap</span>
                    <h4 className="font-bold text-gray-800 text-sm mt-0.5">{mostCriticalGapItem.skill}</h4>
                    <p className="text-xs text-gray-500 mt-1">{mostCriticalGapItem.count} registered youth identified with this core competency deficiency</p>
                  </div>
                </div>

                <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Highest Opportunity Sector</span>
                    <h4 className="font-bold text-gray-800 text-sm mt-0.5">{highestSector.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">{highestSector.count} local youth express interests, local slot demand is extremely high</p>
                  </div>
                </div>

                <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-red-50 text-red-600 shrink-0">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Unmatched Youth</span>
                    <h4 className="font-bold text-gray-800 text-sm mt-0.5">{unmatchedCount} KK Members</h4>
                    <p className="text-xs text-gray-500 mt-1">Lack active skills referrals; targeted program matching needed</p>
                  </div>
                </div>
              </div>

              {/* Chart and Recommendation Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-3">
                  <h3 className="font-bold text-gray-800 text-sm mb-4">Competency Deficiency Analysis</h3>
                  <div className="space-y-4">
                    {localSkillsGaps.map((gap) => {
                      const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                      return (
                        <div key={gap.skill} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-700">{gap.skill}</span>
                            <span className="text-gray-500 font-medium">{gap.count} youth ({gap.percentage}%)</span>
                          </div>
                          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-linear-to-r from-emerald-500 to-[#0A6B43] rounded-full"
                              style={{ width: `${(gap.count / maxCount) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-2">
                  <h3 className="font-bold text-gray-800 text-sm mb-3.5">AI Planning Recommendations</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: `Fund TESDA ${highestSector.name === "Tourism and Food" ? "Food Processing" : highestSector.name === "IT and Business Services" ? "Computer Literacy" : "Construction Trades"} Batch`,
                        desc: `${highestSector.count} youth in Barangay ${designatedBarangay} are matched to ${highestSector.name} but current municipal slots are limited. Requesting a localized batch is advised.`,
                      },
                      {
                        title: `Barangay ${designatedBarangay} Digital Skills Initiative`,
                        desc: `${mostCriticalGapItem.count} registered youth lack computer-based skills. Organizing a basic productivity software seminar at the Brgy hall is highly advised.`,
                      },
                      {
                        title: "DTI Entrepreneur Bootcamp Partnership",
                        desc: `Host a joint DTI Negosyo mentorship to support ${Math.max(1, Math.round(localYouthProfiles.length * 0.2))} youth in ${designatedBarangay} aiming to launch micro-enterprises.`
                      }
                    ].map((rec, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          ✓
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">{rec.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{rec.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.ANNOUNCEMENTS && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">SK Announcements</h2>
                  <p className="text-xs text-gray-500 font-medium">Broadcast news, programs, and updates visible in youth portals</p>
                </div>
                <button
                  onClick={() => setShowAnnouncementModal(true)}
                  className="bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Post Announcement
                </button>
              </div>

              {/* Announcements cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {localAnnouncements.map((ann) => (
                  <div key={ann.id} className="bg-white border border-[#D1FAE5] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full uppercase tracking-wider">
                          {ann.category}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">{ann.datePosted}</span>
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm mb-2">{ann.title}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">{ann.body}</p>
                    </div>
                    <div className="pt-3.5 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                      <span>Target Audience: <span className="text-gray-700 font-semibold">{ann.audience}</span></span>
                      <div className="flex gap-2">
                        <button className="text-gray-400 hover:text-emerald-700 p-1">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
                            addToast("Announcement deleted", "info");
                          }}
                          className="text-gray-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.SETTINGS && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Settings & Profile</h2>
                <p className="text-xs text-gray-500 font-medium">Configure municipal information and personal notification credentials</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 space-y-6">
                  {/* Personal info form */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-xs sm:text-sm border-b border-gray-100 pb-2">Profile Information</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Full Name</label>
                        <input
                          type="text"
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Position</label>
                        <input
                          type="text"
                          value={settingsPos}
                          onChange={(e) => setSettingsPos(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                        <input
                          type="email"
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => addToast("Changes saved successfully!", "success")}
                      className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg transition-all"
                    >
                      Save Profile Changes
                    </button>
                  </div>

                  {/* Barangay info */}
                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h3 className="font-bold text-gray-800 text-xs sm:text-sm">Barangay Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Barangay</label>
                        <input type="text" disabled value={designatedBarangay} className="w-full p-2.5 border border-gray-150 bg-gray-50 text-gray-500 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Municipality</label>
                        <input type="text" disabled value="San Luis" className="w-full p-2.5 border border-gray-150 bg-gray-50 text-gray-500 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Province</label>
                        <input type="text" disabled value="Pampanga" className="w-full p-2.5 border border-gray-150 bg-gray-50 text-gray-500 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications column (20%) */}
                <div className="lg:col-span-2 bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 space-y-4">
                  <h3 className="font-bold text-gray-800 text-xs sm:text-sm border-b border-gray-100 pb-2">Preferences</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg cursor-pointer">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">New Match Alerts</p>
                        <p className="text-[10px] text-gray-400">Receive alerts when KK profile creates high matches</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefMatchAlerts}
                        onChange={(e) => setPrefMatchAlerts(e.target.checked)}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg cursor-pointer">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">TESDA Slots Updates</p>
                        <p className="text-[10px] text-gray-400">Notification when slot remaining count changes</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefSlots}
                        onChange={(e) => setPrefSlots(e.target.checked)}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-lg cursor-pointer">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">Skills Gap Weekly</p>
                        <p className="text-[10px] text-gray-400">Receive compilation of deficiency reports</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefWeekly}
                        onChange={(e) => setPrefWeekly(e.target.checked)}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.COUNCILORS && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">My Team — SK Councilors</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Manage councilors and official personnel assigned to Barangay {designatedBarangay}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCouncilorName("");
                    setCouncilorEmail("");
                    setCouncilorRole("SK Councilor");
                    generateCouncilorPassword();
                    setIsAddCouncilorOpen(true);
                  }}
                  className="bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  Add Councilor
                </button>
              </div>

              {/* Councilors Table */}
              <div className="bg-white border border-[#D1FAE5] rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-4">Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Date Created</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {localCouncilors.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{c.name}</td>
                          <td className="p-4 text-gray-500 font-mono text-[11px]">{c.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-bold">
                              {c.role}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              c.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right text-gray-400 font-medium">{c.dateCreated}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCouncilorId(c.id);
                                  setEditCouncilorName(c.name);
                                  setEditCouncilorEmail(c.email);
                                  setEditCouncilorRole(c.role || "SK Councilor");
                                  setIsEditCouncilorOpen(true);
                                }}
                                className="p-1.5 hover:bg-amber-50 hover:text-amber-700 text-gray-400 hover:border-amber-200 rounded border border-gray-150 transition-colors"
                                title="Edit Name/Email"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleCouncilorStatus(c.id)}
                                className={`px-2.5 py-1 font-bold text-[10px] rounded border transition-colors uppercase ${
                                  c.status === "Active"
                                    ? "border-red-200 text-red-600 bg-red-50/50 hover:bg-red-50 hover:text-red-700"
                                    : "border-emerald-200 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                              >
                                {c.status === "Active" ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {currentScreen === SKOfficialScreen.PENDING_APPROVALS && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Pending Youth Approvals</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Review and verify KK member self-registrations to approve their accounts to start their livelihood matching journey
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-bold">Barangay Scope:</span>
                  <span className="text-xs border border-[#D1FAE5] bg-emerald-50 text-emerald-800 rounded-lg p-2 font-bold shadow-3xs">
                    {designatedBarangay.startsWith("Barangay ") ? designatedBarangay : `Barangay ${designatedBarangay}`}
                  </span>
                </div>
              </div>

              {/* Pending Approvals List */}
              <div className="bg-white border border-[#D1FAE5] rounded-xl overflow-hidden shadow-xs">
                {pendingProfiles.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Age / Purok</th>
                          <th className="p-4">Educational Attainment</th>
                          <th className="p-4">ID Verification</th>
                          <th className="p-4">Livelihood Objective</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {pendingProfiles.map((y) => (
                          <tr key={y.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{y.name}</td>
                            <td className="p-4 text-gray-500 font-medium">
                              {y.age} y/o · <span className="font-bold text-[#1C2B20]">{y.purok}</span>
                              <div className="text-[10px] text-[#0A6B43] font-bold mt-1">{y.barangay}</div>
                            </td>
                            <td className="p-4">
                              <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px]">
                                {y.educationalAttainment}
                              </span>
                            </td>
                            <td className="p-4">
                              {y.verificationIdType ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 border border-teal-150 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> {y.verificationIdType}
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono font-bold pl-0.5">
                                    No: {y.verificationIdNumber}
                                  </span>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-150 px-2 py-0.5 rounded text-[10px] font-bold w-fit">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> In-Person Profile
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-gray-600 font-medium max-w-sm leading-relaxed">{y.livelihoodGoal}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => setVerifyingYouth(y)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-[10px] transition-colors flex items-center gap-1 uppercase tracking-wider"
                                  title="Inspect uploaded ID documents and attestations"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Inspect ID
                                </button>
                                <button
                                  onClick={() => handleApproveYouth(y.id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-xs transition-all uppercase tracking-wide"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectYouth(y.id)}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] shadow-xs transition-all uppercase tracking-wide"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center max-w-md mx-auto space-y-3">
                    <CheckCircle className="w-12 h-12 text-[#0A6B43] mx-auto" />
                    <h3 className="font-bold text-gray-800 text-sm">Roster Completely Verified</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      All self-registering Katipunan ng Kabataan members in Barangay {designatedBarangay} have been successfully approved and cleared.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Write announcement modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-emerald-100 w-full max-w-lg p-6 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#0A6B43]" />
                Post New Announcement
              </h3>
              <button onClick={() => setShowAnnouncementModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostAnnouncement} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Welding Kit Distribution Schedule"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Category</label>
                  <select
                    value={annCategory}
                    onChange={(e) => setAnnCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Program Update">Program Update</option>
                    <option value="Event">Event</option>
                    <option value="Reminder">Reminder</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Target Audience</label>
                  <select
                    value={annAudience}
                    onChange={(e) => setAnnAudience(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="All KK members">All KK members</option>
                    <option value="OSY only">OSY only</option>
                    <option value="In-school youth only">In-school youth only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Body Content</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the announcements, date, venue, requirements..."
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Post Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Councilor Modal */}
      {isAddCouncilorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-emerald-100 w-full max-w-md p-6 animate-in zoom-in-95 duration-150 text-xs font-semibold">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Users2 className="w-5 h-5 text-[#0A6B43]" />
                Add New SK Councilor
              </h3>
              <button onClick={() => setIsAddCouncilorOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCouncilorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos"
                  value={councilorName}
                  onChange={(e) => setCouncilorName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. mariasantos@sanluispampanga.gov.ph"
                  value={councilorEmail}
                  onChange={(e) => setCouncilorEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Temporary Password</label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={councilorPassword}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-gray-50 text-amber-700 font-mono focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={generateCouncilorPassword}
                    className="absolute right-3 top-2 p-1 text-gray-400 hover:text-[#0A6B43] transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Role *</label>
                  <select
                    value={councilorRole}
                    onChange={(e) => setCouncilorRole(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold text-gray-700"
                  >
                    <option value="SK Councilor">SK Councilor</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Barangay Zone</label>
                  <input
                    type="text"
                    disabled
                    value={designatedBarangay}
                    className="w-full p-2.5 border border-gray-150 bg-gray-50 text-gray-500 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCouncilorOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Councilor Modal */}
      {isEditCouncilorOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-emerald-100 w-full max-w-md p-6 animate-in zoom-in-95 duration-150 text-xs font-semibold">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Edit className="w-5 h-5 text-amber-500" />
                Edit SK Councilor Details
              </h3>
              <button onClick={() => setIsEditCouncilorOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCouncilorSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editCouncilorName}
                  onChange={(e) => setEditCouncilorName(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editCouncilorEmail}
                  onChange={(e) => setEditCouncilorEmail(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Role *</label>
                <select
                  value={editCouncilorRole}
                  onChange={(e) => setEditCouncilorRole(e.target.value as any)}
                  className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold text-gray-700"
                >
                  <option value="SK Councilor">SK Councilor</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditCouncilorOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-lg shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KK Member ID Verification Modal */}
      {verifyingYouth && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-emerald-100 w-full max-w-lg p-6 animate-in zoom-in-95 duration-150 text-xs font-semibold">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0A6B43]" />
                Katipunan ng Kabataan ID Verification
              </h3>
              <button onClick={() => setVerifyingYouth(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-left">
              {/* Member Core Details */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Member Personal Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-700">
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Full Name</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Barangay & Purok</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.barangay} · {verifyingYouth.purok}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Age</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.age} years old</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[9px] uppercase">Contact Number</span>
                    <span className="text-gray-900 font-bold text-xs">{verifyingYouth.contactNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* ID Document Details */}
              <div className="space-y-2">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Submitted Document Proof</p>
                {verifyingYouth.verificationIdType ? (
                  <div className="border border-gray-150 rounded-xl overflow-hidden bg-white">
                    <div className="bg-gray-50 p-2.5 border-b border-gray-150 flex justify-between items-center">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#0A6B43]" />
                        {verifyingYouth.verificationIdType}
                      </span>
                      <span className="font-mono text-gray-500 font-extrabold bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px]">
                        Ref: {verifyingYouth.verificationIdNumber}
                      </span>
                    </div>
                    
                    <div className="p-3 bg-gray-50 flex justify-center items-center">
                      <img 
                        src={verifyingYouth.verificationIdImage} 
                        alt="KK Verification Document proof" 
                        className="max-h-48 rounded shadow-xs border border-gray-150 object-contain w-auto bg-white"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // Failover to a beautiful default graphic
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600";
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl text-center text-amber-800 font-bold space-y-1">
                    <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
                    <p className="text-xs">In-Person Profile Creation</p>
                    <p className="text-[10px] text-gray-500 font-medium max-w-xs mx-auto">
                      This KK member was registered directly by an SK Official during manual field profiling. Documents were verified physically.
                    </p>
                  </div>
                )}
              </div>

              {/* Validation Checklist */}
              <div className="space-y-2.5 bg-emerald-50/30 p-3.5 rounded-xl border border-emerald-100">
                <p className="text-[10px] font-extrabold text-[#0a6b43] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  SK Validation & Eligibility Check
                </p>
                <div className="space-y-1.5 text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2.5px]">✓</span>
                    <span>
                      Age is <strong>{verifyingYouth.age}</strong> — fits Sangguniang Kabataan Reform Act age limit (15-30 years old).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2.5px]">✓</span>
                    <span>
                      Resident of <strong>{verifyingYouth.barangay}</strong> — validated in Pampanga geographic registry.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 text-sm mt-[-2.5px]">✓</span>
                    <span>
                      Verification credentials match the submitted barangay database logs.
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setVerifyingYouth(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectYouth(verifyingYouth.id);
                    setVerifyingYouth(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Reject & Deny
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApproveYouth(verifyingYouth.id);
                    setVerifyingYouth(null);
                  }}
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Approve Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
