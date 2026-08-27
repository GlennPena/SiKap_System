"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users, Target, Briefcase, BarChart2, Bell, LogOut, Search, Plus, Filter,
  FileText, Megaphone, Settings, ArrowLeft, Mail, Phone, Calendar, Award,
  CheckCircle, ShieldAlert, Sparkles, AlertTriangle, TrendingUp, Users2, Trash2, Edit, X, RefreshCw,
  ShieldCheck, Eye, User, MapPin, XCircle, Ban, Copy, EyeOff, Check, Lock, Building, Shield
} from "lucide-react";
import {
  YouthProfile, TESDAProgram, SKAnnouncement, ReferralPipelineItem,
  SKOfficialScreen, UserRole, SkillGapData, Councilor
} from "../types";
import {
  MetricCard, FlameMatchScore, PathwayTimeline,
  OpportunityCard, EmptyState, Toast, ConfirmationModal, SikapLogo
} from "./ReusableComponents";
import { formatContactNumber, isValidContactNumber, formatTime12Hour } from "../lib/utils";
import { calculateContentBasedMatchScore } from "../lib/cbf-matcher";

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
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAge, setRegAge] = useState<number | string>(20);
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
  const [regSector, setRegSector] = useState("IT & Technology");
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
  const [annAudience, setAnnAudience] = useState<"All KK members" | "OSY only">("OSY only");
  const [annEventDate, setAnnEventDate] = useState("");
  const [annVenue, setAnnVenue] = useState("");
  const [annContactPerson, setAnnContactPerson] = useState("");
  const [annEventDatePicker, setAnnEventDatePicker] = useState("");
  const [annEventTimePicker, setAnnEventTimePicker] = useState("");
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);

  // Settings State
  const [settingsName, setSettingsName] = useState("Rhea Cruz");
  const [settingsPos, setSettingsPos] = useState("SK Chairperson");
  const [settingsEmail, setSettingsEmail] = useState("rheacruz.sk@sanluispampanga.gov.ph");
  const [settingsPhone, setSettingsPhone] = useState("+63 915 777 8888");
  const [prefMatchAlerts, setPrefMatchAlerts] = useState(true);
  const [prefSlots, setPrefSlots] = useState(true);
  const [prefWeekly, setPrefWeekly] = useState(true);

  // Settings tabs & password management state
  const [activeSettingsTab, setActiveSettingsTab] = useState<"profile" | "security" | "preferences" | "credentials">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Synchronize settings with current SK Chairperson of designatedBarangay
  useEffect(() => {
    if (currentUser) {
      setSettingsName(currentUser.name);
      setSettingsEmail(currentUser.email);
      return;
    }
    setSettingsName("SK Chairperson");
    setSettingsEmail("chairperson@sanluispampanga.gov.ph");
  }, [designatedBarangay, currentUser]);

  // Councilor management states
  const [councilorName, setCouncilorName] = useState("");
  const [councilorEmail, setCouncilorEmail] = useState("");
  const [councilorRole, setCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [councilorPassword, setCouncilorPassword] = useState("");
  const [councilorContact, setCouncilorContact] = useState("+63 9");
  const [showCouncilorPassword, setShowCouncilorPassword] = useState(false);
  const [createdCouncilorAccount, setCreatedCouncilorAccount] = useState<{ name: string; email: string; role: string; password: string; contactNumber?: string } | null>(null);

  const [isAddCouncilorOpen, setIsAddCouncilorOpen] = useState(false);
  const [editingCouncilorId, setEditingCouncilorId] = useState<string | null>(null);
  const [editCouncilorName, setEditCouncilorName] = useState("");
  const [editCouncilorEmail, setEditCouncilorEmail] = useState("");
  const [editCouncilorContact, setEditCouncilorContact] = useState("+63 9");
  const [editCouncilorRole, setEditCouncilorRole] = useState<"SK Councilor" | "Secretary" | "Treasurer">("SK Councilor");
  const [isEditCouncilorOpen, setIsEditCouncilorOpen] = useState(false);

  // ID Verification state
  const [verifyingYouth, setVerifyingYouth] = useState<YouthProfile | null>(null);

  // Pending Youth Pop-Up Modal state
  const [viewingPendingYouthModal, setViewingPendingYouthModal] = useState<YouthProfile | null>(null);

  // Expanded aspirations toggle state for table cells
  const [expandedAspirations, setExpandedAspirations] = useState<Record<string, boolean>>({});

  // Analytics sector filter state
  const [analyticsSectorFilter, setAnalyticsSectorFilter] = useState<string>("All");

  // Top Navbar Notification state
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  const toggleAspirationExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAspirations(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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

  const getSlotsForKeywords = (keywords: string[]) => {
    if (!programs || programs.length === 0) return 0;
    return programs
      .filter(p => keywords.some(k => p.title.toLowerCase().includes(k)))
      .reduce((sum, p) => sum + (p.slotsRemaining || 0), 0);
  };

  const localSkillsGaps = useMemo<SkillGapData[]>(() => {
    const totalLocal = localYouthProfiles.length;

    const computerSlots = getSlotsForKeywords(["computer", "it", "digital"]);
    const foodSlots = getSlotsForKeywords(["food", "processing", "cook"]);
    const electricalSlots = getSlotsForKeywords(["electr", "wire"]);
    const weldingSlots = getSlotsForKeywords(["weld", "metal", "smaw"]);
    const bakingSlots = getSlotsForKeywords(["bread", "pastry", "bake"]);

    if (totalLocal === 0) {
      return [
        { skill: "Computer Literacy", count: 0, percentage: 0, availableSlots: computerSlots, recommendedAction: "Organize Barangay-level digital tools workshop." },
        { skill: "Food Processing", count: 0, percentage: 0, availableSlots: foodSlots, recommendedAction: "Fund additional localized batch of Food Processing NC II." },
        { skill: "Electrical Installation", count: 0, percentage: 0, availableSlots: electricalSlots, recommendedAction: "Refer out-of-school youth to training slots at TESDA." },
        { skill: "Welding / Metal Fab", count: 0, percentage: 0, availableSlots: weldingSlots, recommendedAction: "Utilize SK budget to sponsor SMAW protective gear." },
        { skill: "Bread and Pastry", count: 0, percentage: 0, availableSlots: bakingSlots, recommendedAction: "Partner with local cooperative bakeries for placement." }
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

    const makeGap = (skill: string, count: number, availableSlots: number, action: string): SkillGapData => {
      const pct = totalLocal > 0 ? parseFloat(((count / totalLocal) * 100).toFixed(1)) : 0;
      return {
        skill,
        count,
        percentage: pct > 100 ? 100 : pct,
        availableSlots,
        recommendedAction: action
      };
    };

    return [
      makeGap("Computer Literacy", computerCount, computerSlots, `Organize Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")} digital tools and basic office suite workshop.`),
      makeGap("Food Processing", foodCount, foodSlots, `Fund additional localized batch of Food Processing NC II in ${designatedBarangay.replace(/^Barangay\s+/i, "")} community kitchen.`),
      makeGap("Electrical Installation", electricalCount, electricalSlots, `Refer out-of-school youth in ${designatedBarangay.replace(/^Barangay\s+/i, "")} to empty training slots at TESDA GPSAT campus.`),
      makeGap("Welding / Metal Fab", weldingCount, weldingSlots, `Utilize ${designatedBarangay.replace(/^Barangay\s+/i, "")} SK budget to sponsor tools & protective gears for priority SMAW enrollees.`),
      makeGap("Bread and Pastry", bakingCount, bakingSlots, `Partner with local cooperative bakeries in San Luis for job placement of ${designatedBarangay.replace(/^Barangay\s+/i, "")} graduates.`)
    ].sort((a, b) => b.count - a.count);
  }, [localYouthProfiles, designatedBarangay, programs]);

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
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regGoal.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail.trim() || !emailRegex.test(regEmail)) {
      addToast("Please enter a valid email address for KK member login credentials", "error");
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      addToast("Please enter a password with at least 6 characters for login", "error");
      return;
    }

    if (regAge === "" || Number(regAge) < 15 || Number(regAge) > 30) {
      addToast("Please enter a valid age between 15 and 30 years old", "error");
      return;
    }

    if (!isValidContactNumber(regContact)) {
      addToast("Please enter a valid 11-digit mobile contact number (+63 9XX XXX XXXX)", "error");
      return;
    }

    setIsRegistering(true);

    const brgyName = designatedBarangay.startsWith("Barangay ") 
      ? designatedBarangay.replace(/^Barangay\s+/i, "") 
      : designatedBarangay;

    const payload = {
      email: regEmail,
      password: regPassword,
      name: regName,
      age: Number(regAge),
      purok: regPurok,
      barangay: brgyName,
      educationalAttainment: regEdu,
      currentStatus: "Out-of-school",
      skills: regSkills,
      interests: regInterests,
      sectorPreference: regSector,
      livelihoodGoal: regGoal,
      contactNumber: regContact,
      soloParent: regSolo,
      pwd: regPwd,
      indigenous: regIndigenous,
      approvalStatus: "Approved"
    };

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        const createdProfile: YouthProfile = data.data;
        setYouthProfiles(prev => [createdProfile, ...prev]);
        setNewlyCreatedId(createdProfile.id);
        addToast(`Registered ${createdProfile.name} and provisioned login account!`, "success");
      } else {
        const newId = `y-${Date.now()}`;
        const fallbackProfile: YouthProfile = {
          id: newId,
          ...payload,
          barangay: `Barangay ${brgyName}`,
          registeredDate: "Just now",
          matchScore: 85,
          hasReferred: false,
          approvalStatus: "Approved" as const
        };
        setYouthProfiles(prev => [fallbackProfile, ...prev]);
        setNewlyCreatedId(newId);
        if (data.message) addToast(data.message, "info");
      }
    } catch (err) {
      console.error("Failed to register user in database:", err);
      const newId = `y-${Date.now()}`;
      const fallbackProfile: YouthProfile = {
        id: newId,
        ...payload,
        barangay: `Barangay ${brgyName}`,
        registeredDate: "Just now",
        matchScore: 85,
        hasReferred: false,
        approvalStatus: "Approved" as const
      };
      setYouthProfiles(prev => [fallbackProfile, ...prev]);
      setNewlyCreatedId(newId);
    } finally {
      setIsRegistering(false);
      setShowRegSuccess(true);
    }
  };

  // Reset form
  const resetRegForm = () => {
    setRegName("");
    setRegEmail("");
    setRegPassword("");
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
    setRegSector("IT & Technology");
    setRegGoal("");
    setRegSolo(false);
    setRegPwd(false);
    setRegIndigenous(false);
    setShowRegSuccess(false);
    setNewlyCreatedId(null);
  };

  // Post or Edit Announcement (DB Persisted)
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annBody.trim()) {
      addToast("Please fill in the announcement content", "error");
      return;
    }

    const isEditing = Boolean(editingAnnouncementId);

    const combinedEventDate = annEventDatePicker
      ? `${new Date(annEventDatePicker + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}${annEventTimePicker ? ` • ${formatTime12Hour(annEventTimePicker)}` : ""}`
      : annEventDate.trim() || undefined;

    const payload = {
      ...(isEditing ? { id: editingAnnouncementId } : {}),
      title: annTitle,
      body: annBody,
      category: annCategory,
      audience: annAudience,
      eventDate: combinedEventDate,
      venue: annVenue.trim() || undefined,
      contactPerson: annContactPerson.trim() || undefined
    };

    try {
      const res = await fetch("/api/announcements", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        if (isEditing) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? data.data : a));
          addToast("Announcement updated successfully!", "success");
        } else {
          setAnnouncements(prev => [data.data, ...prev]);
          addToast("Announcement posted and published to youth portal!", "success");
        }
      } else {
        if (isEditing) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? { ...a, ...payload } : a));
          addToast("Announcement updated successfully!", "success");
        } else {
          const fallback: SKAnnouncement = {
            id: `a-${Date.now()}`,
            title: annTitle,
            body: annBody,
            category: annCategory,
            audience: annAudience,
            eventDate: annEventDate.trim() || undefined,
            venue: annVenue.trim() || undefined,
            contactPerson: annContactPerson.trim() || undefined,
            status: "Active",
            datePosted: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            barangay: designatedBarangay
          };
          setAnnouncements(prev => [fallback, ...prev]);
          addToast("Announcement posted successfully!", "success");
        }
      }
    } catch (err) {
      console.error("Failed to persist announcement:", err);
      if (isEditing) {
        setAnnouncements(prev => prev.map(a => a.id === editingAnnouncementId ? { ...a, ...payload } : a));
        addToast("Announcement updated!", "info");
      } else {
        const fallback: SKAnnouncement = {
          id: `a-${Date.now()}`,
          title: annTitle,
          body: annBody,
          category: annCategory,
          audience: annAudience,
          eventDate: annEventDate.trim() || undefined,
          venue: annVenue.trim() || undefined,
          contactPerson: annContactPerson.trim() || undefined,
          status: "Active",
          datePosted: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
          barangay: designatedBarangay
        };
        setAnnouncements(prev => [fallback, ...prev]);
        addToast("Announcement posted successfully!", "success");
      }
    } finally {
      setShowAnnouncementModal(false);
      setEditingAnnouncementId(null);
      setAnnTitle("");
      setAnnBody("");
      setAnnEventDate("");
      setAnnEventDatePicker("");
      setAnnEventTimePicker("");
      setAnnVenue("");
      setAnnContactPerson("");
    }
  };

  const handleOpenEditAnnouncement = (ann: SKAnnouncement) => {
    setEditingAnnouncementId(ann.id);
    setAnnTitle(ann.title);
    setAnnBody(ann.body);
    setAnnCategory(ann.category);
    setAnnAudience(ann.audience);
    setAnnEventDate(ann.eventDate || "");
    setAnnVenue(ann.venue || "");
    setAnnContactPerson(ann.contactPerson || "");
    setShowAnnouncementModal(true);
  };

  const handleCancelAnnouncement = async (ann: SKAnnouncement) => {
    const newStatus = ann.status === "Cancelled" ? "Active" : "Cancelled";
    
    setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, status: newStatus } : a));
    addToast(newStatus === "Cancelled" ? "Announcement marked as Cancelled" : "Announcement reactivated", newStatus === "Cancelled" ? "info" : "success");

    try {
      await fetch("/api/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ann.id, status: newStatus })
      });
    } catch (err) {
      console.error("Failed to update announcement status in database:", err);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    addToast("Announcement deleted", "info");

    try {
      await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE"
      });
    } catch (err) {
      console.error("Failed to delete announcement from database:", err);
    }
  };

  const handleApproveYouth = async (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Approved" } : y));
    addToast("Youth profile has been successfully approved!", "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus: "Approved" })
      });
    } catch (err) {
      console.error("Failed to persist youth approval to database:", err);
    }
  };

  const handleRejectYouth = async (id: string) => {
    setYouthProfiles(prev => prev.map(y => y.id === id ? { ...y, approvalStatus: "Rejected" } : y));
    addToast("Youth profile has been rejected.", "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approvalStatus: "Rejected" })
      });
    } catch (err) {
      console.error("Failed to persist youth rejection to database:", err);
    }
  };

  const handleAddCouncilorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!councilorName.trim() || !councilorEmail.trim() || !councilorPassword.trim()) {
      addToast("Please fill in all required fields", "error");
      return;
    }

    if (!isValidContactNumber(councilorContact)) {
      addToast("Please provide a valid 11-digit mobile number (+63 9XX XXX XXXX)", "error");
      return;
    }

    const payload = {
      name: councilorName.trim(),
      email: councilorEmail.trim().toLowerCase(),
      role: councilorRole,
      password: councilorPassword.trim(),
      contactNumber: councilorContact,
      barangay: designatedBarangay
    };

    try {
      const res = await fetch("/api/councilors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success && data.data) {
        setCouncilors(prev => [data.data, ...prev]);
        setCreatedCouncilorAccount({
          name: councilorName,
          email: councilorEmail.toLowerCase(),
          role: councilorRole,
          password: councilorPassword,
          contactNumber: councilorContact
        });
        addToast(`Account provisioned for ${councilorRole} ${councilorName}!`, "success");
        setIsAddCouncilorOpen(false);
        setCouncilorName("");
        setCouncilorEmail("");
        setCouncilorContact("+63 9");
      } else {
        addToast(data.message || "Failed to create councilor account", "error");
      }
    } catch (err) {
      console.error("Error creating councilor account:", err);
      const fallback: Councilor = {
        id: `c-${Date.now()}`,
        name: councilorName,
        email: councilorEmail.toLowerCase(),
        role: councilorRole,
        contactNumber: councilorContact,
        barangay: designatedBarangay,
        status: "Active",
        dateCreated: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      setCouncilors(prev => [fallback, ...prev]);
      setCreatedCouncilorAccount({
        name: councilorName,
        email: councilorEmail.toLowerCase(),
        role: councilorRole,
        password: councilorPassword,
        contactNumber: councilorContact
      });
      addToast(`Provisioned account for ${councilorRole} ${councilorName}!`, "success");
      setIsAddCouncilorOpen(false);
      setCouncilorName("");
      setCouncilorEmail("");
      setCouncilorContact("+63 9");
    }
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
  const handleSaveProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim() || !settingsEmail.trim()) {
      addToast("Full name and email address are required", "error");
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsName.trim(),
          email: settingsEmail.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || "Profile updated in database!", "success");
      } else {
        addToast(data.message || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      addToast("Profile details saved successfully!", "success");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
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
        addToast(data.message || "Account password changed successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast(data.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      addToast("Failed to connect to server to change password", "error");
    } finally {
      setIsChangingPassword(false);
    }
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

  // Verified Youth Profiles ONLY for Youth Profiles Roster Tab
  const verifiedYouthProfiles = useMemo(() => {
    return localYouthProfiles.filter(y => y.approvalStatus === "Approved");
  }, [localYouthProfiles]);

  // Filtered Youth Profiles
  const filteredProfiles = useMemo(() => {
    return verifiedYouthProfiles.filter(y => {
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
  }, [verifiedYouthProfiles, searchQuery, eduFilter, ageFilter, purokFilter, matchStatusFilter]);

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

  // System Notifications Memo
  const systemNotifications = useMemo(() => {
    const list: { id: string; title: string; desc: string; time: string; type: "approval" | "announcement" | "skills" | "program"; targetScreen: SKOfficialScreen; icon: React.ReactNode }[] = [];

    if (pendingCount > 0) {
      list.push({
        id: "notif-pending",
        title: "Pending Youth Approvals",
        desc: `${pendingCount} Katipunan ng Kabataan self-registrations waiting for official verification.`,
        time: "Requires Review",
        type: "approval",
        targetScreen: SKOfficialScreen.PENDING_APPROVALS,
        icon: <Users className="w-4 h-4 text-[#0A6B43]" />
      });
    }

    if (localAnnouncements.length > 0) {
      list.push({
        id: "notif-announcement",
        title: "Active SK Broadcasts",
        desc: `${localAnnouncements.length} announcements actively broadcasted for Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}.`,
        time: "Active Feed",
        type: "announcement",
        targetScreen: SKOfficialScreen.ANNOUNCEMENTS,
        icon: <Megaphone className="w-4 h-4 text-emerald-600" />
      });
    }

    if (mostCriticalGapItem && mostCriticalGapItem.count > 0) {
      list.push({
        id: "notif-skills",
        title: "Most Critical Skill Gap",
        desc: `${mostCriticalGapItem.count} youth identified with core deficiency in ${mostCriticalGapItem.skill}.`,
        time: "Diagnostic Alert",
        type: "skills",
        targetScreen: SKOfficialScreen.SKILLS_GAP,
        icon: <BarChart2 className="w-4 h-4 text-amber-600" />
      });
    }

    if (programs.length > 0) {
      list.push({
        id: "notif-programs",
        title: "TESDA Program Registry",
        desc: `${programs.length} active vocational training programs published in San Luis.`,
        time: "Registry Live",
        type: "program",
        targetScreen: SKOfficialScreen.TESDA_PROGRAMS,
        icon: <Briefcase className="w-4 h-4 text-[#0A6B43]" />
      });
    }

    return list;
  }, [pendingCount, localAnnouncements, mostCriticalGapItem, programs, designatedBarangay]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex" id="sk-portal-container">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#1C2B20] text-white flex flex-col justify-between shadow-lg shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <SikapLogo size={32} variant="white" showText={true} />
            <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0">
              <span className="text-xs font-black text-[#D99427] uppercase tracking-widest block leading-none">Official</span>
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[105px]" title={designatedBarangay.replace(/^Barangay\s+/i, "")}>
                {designatedBarangay.replace(/^Barangay\s+/i, "")}
              </span>
            </div>
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
          <div
            onClick={() => setCurrentScreen(SKOfficialScreen.SETTINGS)}
            className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-emerald-950/60 transition-all cursor-pointer group border border-transparent hover:border-emerald-800/40"
            title="Go to Settings & Profile"
          >
            <div className="w-9 h-9 rounded-full bg-[#0A6B43] text-white flex items-center justify-center font-bold text-sm shadow-xs border border-emerald-500">
              {settingsName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-bold leading-none group-hover:text-[#D99427] transition-colors">{settingsName}</p>
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
        <header className="sticky top-0 bg-white border-b border-[#D1FAE5] z-30 px-8 py-4 flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Good morning, {settingsName.split(" ")[0]} 👋
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} · San Luis, Pampanga
            </p>
          </div>
          <div className="flex items-center gap-4 relative">
            {/* Notification Bell Icon & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className={`relative p-2 text-gray-500 hover:text-[#0A6B43] bg-gray-50 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer ${
                  showNotificationsDropdown ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-300" : ""
                }`}
                title="System Notifications"
              >
                <Bell className="w-5 h-5" />
                {!notificationsRead && systemNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {showNotificationsDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotificationsDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
                    <div className="p-4 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-[#0A6B43]" />
                        <h3 className="font-extrabold text-gray-900 text-sm">Notifications</h3>
                        {systemNotifications.length > 0 && (
                          <span className="bg-[#0A6B43] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {systemNotifications.length}
                          </span>
                        )}
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
                      {systemNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                          <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                          <p className="text-xs font-bold text-gray-700">All caught up!</p>
                          <p className="text-[10px] text-gray-400">No new alerts or pending tasks for Barangay {designatedBarangay}.</p>
                        </div>
                      ) : (
                        systemNotifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              setCurrentScreen(n.targetScreen);
                              setShowNotificationsDropdown(false);
                            }}
                            className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3"
                          >
                            <div className="p-2 rounded-lg bg-gray-50 border border-gray-100 shrink-0 mt-0.5">
                              {n.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-0.5">
                                <h4 className="font-extrabold text-gray-900 text-xs truncate">{n.title}</h4>
                                <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                                  {n.time}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{n.desc}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                      <span className="text-[10px] font-bold text-gray-400">Click any notification to navigate directly</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Icon / Badge Clickable Button */}
            <button
              onClick={() => setCurrentScreen(SKOfficialScreen.SETTINGS)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all cursor-pointer group border border-transparent hover:border-gray-200"
              title="Go to Settings & Profile"
            >
              <div className="w-9 h-9 rounded-full bg-[#0A6B43] group-hover:bg-[#075332] text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-emerald-200 transition-all">
                {settingsName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-bold text-gray-900 group-hover:text-[#0A6B43] leading-none transition-colors">{settingsName}</p>
                <p className="text-[10px] text-gray-400 font-medium mt-0.5">{settingsPos}</p>
              </div>
            </button>
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
                            <td className="py-3 px-3 max-w-[160px]">
                              {y.livelihoodGoal && y.livelihoodGoal.length > 15 ? (
                                <div>
                                  <p className={expandedAspirations[y.id] ? "text-xs font-medium text-gray-800 leading-relaxed bg-amber-50/80 p-2 rounded-lg border border-amber-200/80 my-1 shadow-2xs" : "text-xs font-semibold text-gray-700"}>
                                    {expandedAspirations[y.id] ? y.livelihoodGoal : `${y.livelihoodGoal.slice(0, 15)}...`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => toggleAspirationExpand(y.id, e)}
                                    className="text-[10px] font-extrabold text-[#0A6B43] hover:underline mt-0.5 inline-block cursor-pointer"
                                  >
                                    {expandedAspirations[y.id] ? "See Less ▲" : "See More ▼"}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-gray-600">{y.livelihoodGoal || "N/A"}</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS)}
                                  className="px-3.5 py-1.5 bg-[#0A6B43] hover:bg-[#075332] text-white font-bold text-[11px] rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
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
                              {programs.length > 0 ? (
                                <span className={`font-bold px-2 py-0.5 rounded-sm ${
                                  y.matchScore >= 90 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                                }`}>
                                  {y.matchScore}%
                                </span>
                              ) : (
                                <span className="font-semibold text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md">
                                  N/A
                                </span>
                              )}
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
                      {localSkillsGaps.every(g => g.count === 0) ? (
                        <div className="p-4 bg-emerald-50/40 border border-emerald-100/60 rounded-lg text-center space-y-1 my-1">
                          <p className="text-xs font-bold text-emerald-800">No Critical Skills Gaps</p>
                          <p className="text-[10px] text-gray-500 font-medium leading-relaxed">All registered youth in Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} have sufficient skill coverage for their preferred sectors.</p>
                        </div>
                      ) : (
                        localSkillsGaps.slice(0, 3).map((gap) => {
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
                        })
                      )}
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
                        <FlameMatchScore score={y.matchScore} hasPrograms={programs.length > 0} />
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
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setCurrentScreen(SKOfficialScreen.YOUTH_PROFILES)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-[#0A6B43] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Youth Profiles List
                </button>
              </div>

              {selectedYouth.approvalStatus === "Pending" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Account Registration Pending Verification</h4>
                      <p className="text-[11px] text-amber-700 font-medium">Review this Katipunan ng Kabataan member's credentials before approving their portal access.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setVerifyingYouth(selectedYouth)}
                      className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Inspect ID
                    </button>
                    <button
                      onClick={() => {
                        handleApproveYouth(selectedYouth.id);
                        setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all uppercase tracking-wide cursor-pointer"
                    >
                      Approve Profile
                    </button>
                    <button
                      onClick={() => {
                        handleRejectYouth(selectedYouth.id);
                        setCurrentScreen(SKOfficialScreen.PENDING_APPROVALS);
                      }}
                      className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all uppercase tracking-wide cursor-pointer"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

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

                  {/* Preferred Sector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Preferred Vocational Sector
                    </span>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-150 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0A6B43]">{selectedYouth.sectorPreference || "Technical Vocational / Unspecified"}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#0A6B43] text-white rounded-full">
                        Priority Focus
                      </span>
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
                      <span className="font-semibold text-gray-800">{selectedYouth.email || "No email registered"}</span>
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
                      <FlameMatchScore score={selectedYouth.matchScore} hasPrograms={programs.length > 0} />
                    </div>

                    {programs.length === 0 ? (
                      <div className="bg-gray-50/70 border border-gray-150 rounded-xl p-6 text-center space-y-2">
                        <Target className="w-8 h-8 text-emerald-700 mx-auto opacity-80" />
                        <p className="text-xs font-bold text-gray-800">No Published Training Programs</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-sm mx-auto">
                          There are currently 0 active training programs in the system database. Once TESDA partners publish new courses, Google Gemini will evaluate and display matching scores here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {programs.slice(0, 3).map((prog, idx) => {
                          const matchPoints = calculateContentBasedMatchScore(selectedYouth, prog);
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
                                <FlameMatchScore score={matchPoints} hasPrograms={programs.length > 0} className="self-start sm:self-auto" />
                              </div>

                              <p className="text-xs text-gray-500 leading-relaxed italic bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/60 text-[#1C2B20]">
                                "{getGeminiRationale(prog.id, selectedYouth.name)}"
                              </p>

                              <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-100/50 pt-2.5">
                                <span>⏱ {`${prog.trainingHours} hours`} {prog.startDate && prog.endDate ? `(${prog.startDate} – ${prog.endDate})` : ""} · Slots: {prog.slotsRemaining}/{prog.slotsTotal}</span>
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
                    )}
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
                      {programs.length === 0
                        ? `Content-filtering is processing ${regName || "youth"}'s skills profile... (0 active TESDA programs currently in database)`
                        : `Content-filtering is comparing ${regName || "youth"}'s skills profile to ${programs.length} available local TESDA modules...`}
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
                    
                    {(() => {
                      if (programs.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-6">
                            AI completed processing <strong className="text-gray-800">{regName}</strong>! Currently, there are <span className="text-amber-700 font-bold">0 active training programs</span> in the system database. Add TESDA programs to generate automated skill matches.
                          </p>
                        );
                      }

                      const tempYouth: YouthProfile = {
                        id: "temp",
                        name: regName,
                        age: Number(regAge),
                        purok: regPurok,
                        barangay: designatedBarangay,
                        educationalAttainment: regEdu,
                        currentStatus: "Out-of-school",
                        skills: regSkills,
                        interests: regInterests,
                        sectorPreference: regSector,
                        livelihoodGoal: regGoal,
                        contactNumber: regContact,
                        registeredDate: "Today",
                        matchScore: 85,
                        soloParent: regSolo,
                        pwd: regPwd,
                        indigenous: regIndigenous,
                        hasReferred: false
                      };

                      const matches = programs.map(p => ({
                        program: p,
                        score: calculateContentBasedMatchScore(tempYouth, p)
                      })).sort((a, b) => b.score - a.score);

                      const topFit = matches[0];
                      const compatibleCount = matches.filter(m => m.score >= 60).length;

                      return (
                        <p className="text-sm text-gray-500 max-w-md leading-relaxed mb-4">
                          AI completed processing <strong className="text-gray-800">{regName}</strong>! Identified <span className="text-[#0A6B43] font-bold">{compatibleCount} compatible skills {compatibleCount === 1 ? 'match' : 'matches'}</span> out of {programs.length} active programs. Top fit is <strong className="text-emerald-900">{topFit.program.title}</strong> ({topFit.score}% Match score).
                        </p>
                      );
                    })()}

                    {regEmail && (
                      <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 mb-6 text-left max-w-md w-full shadow-2xs">
                        <p className="text-[10px] font-extrabold text-[#0A6B43] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                          Provisioned KK Member Login Account
                        </p>
                        <div className="text-xs text-gray-800 space-y-1 mt-2 bg-white p-2.5 rounded-lg border border-emerald-100 font-sans">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium text-[11px]">Email:</span>
                            <span className="font-bold text-emerald-950">{regEmail}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-medium text-[11px]">Password:</span>
                            <span className="font-bold text-emerald-950">{regPassword}</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-800 mt-2 font-medium">
                          ✓ User account created in database. The member can now log in at the home page using these credentials.
                        </p>
                      </div>
                    )}
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
                            onChange={(e) => setRegAge(e.target.value === "" ? "" : Number(e.target.value))}
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
                          onChange={(e) => setRegContact(formatContactNumber(e.target.value))}
                          placeholder="+63 9xx xxx xxxx"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Account Provisioning Credentials */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Login Email Address *</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Portal Login</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. hazel.palma@sanluispampanga.gov.ph"
                          className="w-full p-2.5 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Account Password *</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">Min 6 chars</span>
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full p-2.5 border border-emerald-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
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
                        <label className="text-[11px] font-bold text-[#0A6B43] uppercase flex items-center justify-between">
                          <span>Current Status</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">System Focus</span>
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="Out-of-school Youth (OSY)"
                          className="w-full p-2.5 border border-emerald-300 bg-emerald-50/80 rounded-lg text-xs font-extrabold text-emerald-900 cursor-not-allowed shadow-2xs"
                        />
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase block">Preferred Sector *</label>
                        <select
                          value={regSector}
                          onChange={(e) => setRegSector(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="IT & Technology">IT & Technology</option>
                          <option value="Tourism & Food">Tourism & Food</option>
                          <option value="Construction & Metals">Construction & Metals</option>
                          <option value="Electrical & Electronics">Electrical & Electronics</option>
                          <option value="Tourism & Hospitality">Tourism & Hospitality</option>
                          <option value="Agriculture & Automotive">Agriculture & Automotive</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 uppercase block">Goal & Objective *</label>
                        <input
                          type="text"
                          required
                          value={regGoal}
                          onChange={(e) => setRegGoal(e.target.value)}
                          placeholder="e.g. Set up computer repair shop, enroll in Welding NC II"
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
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
                <p className="text-xs text-gray-500 font-medium">
                  {programs.length > 0
                    ? `${programs.length} active training programs · Managed and updated by TESDA GPSAT (Gonzalo Puyat School of Arts and Trades)`
                    : "Vocational Training Program Registry · San Luis, Pampanga"}
                </p>
              </div>

              {/* Grid lists / Empty State */}
              {programs.length === 0 ? (
                <div className="bg-white border border-[#D1FAE5] rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No Active TESDA Programs Published Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      There are currently no active vocational training programs published in the system database. As soon as partner institutions like <strong>TESDA GPSAT (Gonzalo Puyat School of Arts and Trades)</strong> add new courses, they will automatically appear here with real-time AI skill match recommendations.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {programs.map((prog) => (
                    <OpportunityCard
                      key={prog.id}
                      program={prog}
                      matchScore={calculateContentBasedMatchScore(selectedYouth, prog)}
                      geminiExplanation={getGeminiRationale(prog.id, selectedYouth.name)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentScreen === SKOfficialScreen.SKILLS_GAP && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Skills Gap Analytics</h2>
                  <p className="text-xs text-gray-500 font-medium">
                    Katipunan ng Kabataan competency diagnostic insights · Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={analyticsSectorFilter}
                    onChange={(e) => setAnalyticsSectorFilter(e.target.value)}
                    className="p-2 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="All">All Sector Categories</option>
                    <option value="IT">IT & Technology Focus</option>
                    <option value="Food">Food & Culinary Focus</option>
                    <option value="Metals">Construction & Trades Focus</option>
                  </select>
                  <button
                    onClick={() => {
                      addToast(`Diagnostic report generated for Barangay ${designatedBarangay}! Printing layout...`, "info");
                      window.print();
                    }}
                    className="bg-[#0A6B43] hover:bg-[#075332] text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    Print Summary
                  </button>
                </div>
              </div>

              {localYouthProfiles.length === 0 ? (
                <div className="bg-white border border-[#D1FAE5] rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <BarChart2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No Youth Registered Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      Skills gap analytics are calculated automatically from registered youth profiles in <strong>Barangay {designatedBarangay}</strong>. Once KK members register or self-verify, their skill gaps will analyze here.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Insights summaries */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-amber-50 text-amber-700 shrink-0 border border-amber-100">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Most Critical Gap</span>
                        <h4 className="font-extrabold text-gray-800 text-sm mt-0.5">{mostCriticalGapItem.skill}</h4>
                        <p className="text-xs text-gray-500 mt-1">{mostCriticalGapItem.count} registered youth identified with this core competency deficiency</p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 border border-emerald-100">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Highest Opportunity Sector</span>
                        <h4 className="font-extrabold text-gray-800 text-sm mt-0.5">{highestSector.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{highestSector.count} local youth express interests in this priority sector</p>
                      </div>
                    </div>

                    <div className="bg-white border border-[#D1FAE5] p-5 rounded-xl shadow-xs flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-red-50 text-red-600 shrink-0 border border-red-100">
                        <Users2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Unmatched Out-of-School Youth</span>
                        <h4 className="font-extrabold text-gray-800 text-sm mt-0.5">{unmatchedCount} KK Members</h4>
                        <p className="text-xs text-gray-500 mt-1">Requiring targeted skill training matching & referral support</p>
                      </div>
                    </div>
                  </div>

                  {/* Chart and Recommendation Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-3">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 text-sm">Competency Deficiency Analysis</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                          {localSkillsGaps.length} Identified Gaps
                        </span>
                      </div>
                      <div className="space-y-4">
                        {localSkillsGaps
                          .filter(g => {
                            if (analyticsSectorFilter === "All") return true;
                            if (analyticsSectorFilter === "IT") return g.skill.includes("Computer");
                            if (analyticsSectorFilter === "Food") return g.skill.includes("Food") || g.skill.includes("Bread");
                            if (analyticsSectorFilter === "Metals") return g.skill.includes("Welding") || g.skill.includes("Electrical");
                            return true;
                          })
                          .map((gap) => {
                            const maxCount = Math.max(...localSkillsGaps.map(g => g.count), 1);
                            return (
                              <div key={gap.skill} className="space-y-1.5">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-gray-800">{gap.skill}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                      {gap.availableSlots} Slots Available
                                    </span>
                                    <span className="text-gray-500 font-bold">{gap.count} youth ({gap.percentage}%)</span>
                                  </div>
                                </div>
                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-linear-to-r from-emerald-500 to-[#0A6B43] rounded-full transition-all duration-500"
                                    style={{ width: `${Math.max(8, (gap.count / maxCount) * 100)}%` }}
                                  />
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium italic">
                                  Action: {gap.recommendedAction}
                                </p>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-5 lg:col-span-2">
                      <h3 className="font-bold text-gray-800 text-sm mb-3.5">AI Strategic Policy Recommendations</h3>
                      <div className="space-y-4">
                        {[
                          {
                            title: `Fund TESDA ${highestSector.name === "Tourism and Food" ? "Food Processing" : highestSector.name === "IT and Business Services" ? "Computer Literacy" : "Construction Trades"} Batch`,
                            desc: `${highestSector.count} registered youth in Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")} match ${highestSector.name}. Requesting a dedicated localized training batch is highly advised.`,
                          },
                          {
                            title: `Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")} Digital Productivity Initiative`,
                            desc: `${mostCriticalGapItem.count} youth lack core computer literacy. Hosting a 3-day basic office productivity seminar at the barangay hall will bridge this gap.`,
                          },
                          {
                            title: "DTI & TESDA Entrepreneur Partnership",
                            desc: `Partner with local business centers to mentor ${Math.max(1, Math.round(localYouthProfiles.length * 0.25))} youth interested in self-employment and micro-business.`
                          }
                        ].map((rec, index) => (
                          <div key={index} className="flex gap-3 p-3 bg-gray-50/70 border border-gray-100 rounded-xl">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-emerald-200">
                              ✓
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{rec.title}</p>
                              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed font-medium">{rec.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
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

              {/* Announcements cards / Empty State */}
              {localAnnouncements.length === 0 ? (
                <div className="bg-white border border-[#D1FAE5] rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <Megaphone className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No SK Announcements Posted Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      There are currently no active announcements broadcast for <strong>Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}</strong>. Click below to create your first announcement for local KK youth members.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAnnouncementModal(true)}
                    className="inline-flex items-center gap-2 bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Post First Announcement
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {localAnnouncements.map((ann) => (
                    <div key={ann.id} className="bg-white border border-[#D1FAE5] rounded-xl p-5 shadow-xs relative flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full uppercase tracking-wider">
                              {ann.category}
                            </span>
                            {ann.status === "Cancelled" && (
                              <span className="text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full uppercase tracking-wider">
                                Cancelled
                              </span>
                            )}
                            {ann.eventDate && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#0A6B43]" />
                                {ann.eventDate}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-medium">{ann.datePosted}</span>
                        </div>
                        <h4 className="font-bold text-gray-800 text-sm mb-2">{ann.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-3">{ann.body}</p>

                        {(ann.venue || ann.contactPerson) && (
                          <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 space-y-1 mb-3 text-xs">
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
                      <div className="pt-3.5 border-t border-gray-50 flex justify-between items-center text-[10px] text-gray-400 font-medium">
                        <span>Target Audience: <span className="text-gray-700 font-semibold">{ann.audience}</span></span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenEditAnnouncement(ann)}
                            className="text-gray-400 hover:text-emerald-700 p-1"
                            title="Edit Announcement"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCancelAnnouncement(ann)}
                            className="text-gray-400 hover:text-amber-600 p-1"
                            title={ann.status === "Cancelled" ? "Reactivate Announcement" : "Cancel Announcement"}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAnnouncement(ann.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Permanently Delete Announcement"
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

          {currentScreen === SKOfficialScreen.SETTINGS && (
            <div className="space-y-6">
              {/* Header & Sub-Tab Navigation Container */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-150 shadow-xs">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Settings & Profile</h2>
                  <p className="text-xs text-gray-500 font-medium">Manage official account profile, security credentials, and system notifications</p>
                </div>
                
                {/* Settings Navigation Tabs */}
                <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200 shrink-0">
                  {[
                    { id: "profile", label: "Official Profile", icon: <User className="w-3.5 h-3.5" /> },
                    { id: "security", label: "Security & Password", icon: <Lock className="w-3.5 h-3.5" /> },
                    { id: "preferences", label: "Notifications", icon: <Bell className="w-3.5 h-3.5" /> },
                    { id: "credentials", label: "ID Badge", icon: <ShieldCheck className="w-3.5 h-3.5" /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSettingsTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeSettingsTab === tab.id
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

              {/* Tab 1: Profile Information */}
              {activeSettingsTab === "profile" && (
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 space-y-6 max-w-3xl animate-in fade-in duration-150">
                  <form onSubmit={handleSaveProfileSubmit} className="space-y-6">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0A6B43]" />
                        Official Personal Profile
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">Update your administrative profile details visible to municipal partners</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Official Position *</label>
                        <select
                          value={settingsPos}
                          onChange={(e) => setSettingsPos(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="SK Chairperson">SK Chairperson</option>
                          <option value="SK Councilor">SK Councilor</option>
                          <option value="SK Secretary">SK Secretary</option>
                          <option value="SK Treasurer">SK Treasurer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Official Email Address *</label>
                        <input
                          type="email"
                          required
                          value={settingsEmail}
                          onChange={(e) => setSettingsEmail(e.target.value)}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(formatContactNumber(e.target.value))}
                          className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Barangay Jurisdiction */}
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">Barangay Jurisdiction & Location</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Barangay Zone</label>
                          <input type="text" disabled value={`Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}`} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-emerald-900 font-bold rounded-lg text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Municipality</label>
                          <input type="text" disabled value="San Luis" className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-600 font-semibold rounded-lg text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase block">Province</label>
                          <input type="text" disabled value="Pampanga" className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-600 font-semibold rounded-lg text-xs" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-2"
                      >
                        {isSavingProfile ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 2: Security & Password */}
              {activeSettingsTab === "security" && (
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 space-y-6 max-w-xl animate-in fade-in duration-150">
                  <form onSubmit={handleChangePasswordSubmit} className="space-y-5">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-700" />
                        Account Security & Password
                      </h3>
                      <p className="text-xs text-gray-400 font-medium mt-1">Update your login password to ensure security of administrative access</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
                      <p className="font-bold flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-600" />
                        Password Security Notice
                      </p>
                      <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                        Your password must be at least 6 characters long. Make sure to share any credential updates with authorized SK council personnel only.
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
                        Update Account Password
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tab 3: System Notifications */}
              {activeSettingsTab === "preferences" && (
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 space-y-6 max-w-xl animate-in fade-in duration-150">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0A6B43]" />
                      System Notifications & Alerts
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Configure automated system notifications and municipal updates</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">New KK Self-Registration Alerts</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                          Receive instant notifications when Katipunan ng Kabataan members in Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} submit self-registrations.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefMatchAlerts}
                        onChange={(e) => {
                          setPrefMatchAlerts(e.target.checked);
                          addToast(`Self-registration alerts ${e.target.checked ? 'enabled' : 'disabled'}`, "info");
                        }}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">TESDA Slots Updates</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                          Notification when TESDA training slot availability changes or new programs are published.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefSlots}
                        onChange={(e) => {
                          setPrefSlots(e.target.checked);
                          addToast(`TESDA slot updates ${e.target.checked ? 'enabled' : 'disabled'}`, "info");
                        }}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-start justify-between p-3 bg-gray-50/70 hover:bg-gray-50 border border-gray-150 rounded-xl cursor-pointer transition-colors">
                      <div className="pr-4">
                        <p className="text-xs font-bold text-gray-800">Skills Gap Diagnostic Reports</p>
                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">
                          Receive automated weekly competency deficiency digests for Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")}.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={prefWeekly}
                        onChange={(e) => {
                          setPrefWeekly(e.target.checked);
                          addToast(`Weekly gap reports ${e.target.checked ? 'enabled' : 'disabled'}`, "info");
                        }}
                        className="w-4.5 h-4.5 rounded-sm text-emerald-600 focus:ring-emerald-500 mt-1 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 4: Official Jurisdiction ID Badge */}
              {activeSettingsTab === "credentials" && (
                <div className="bg-white border border-[#D1FAE5] rounded-xl shadow-xs p-6 space-y-5 max-w-md animate-in fade-in duration-150">
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm border-b border-gray-100 pb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      Official Jurisdiction Credentials Badge
                    </h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Official SK Administrative Badge recognized across municipal systems</p>
                  </div>

                  {/* ID Badge Card */}
                  <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-5 shadow-lg border border-emerald-700/50 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase text-[#D99427] tracking-widest block">Republic of the Philippines</span>
                        <h4 className="text-sm font-extrabold tracking-tight text-white">Sangguniang Kabataan Official</h4>
                        <p className="text-[10px] text-emerald-200 font-bold">Barangay {designatedBarangay.replace(/^Barangay\s+/i, "")} · San Luis, Pampanga</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-black text-sm text-white">
                        SK
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Official Name</span>
                        <span className="font-extrabold text-white text-sm">{settingsName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Designation</span>
                        <span className="font-extrabold text-[#D99427]">{settingsPos}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">System Email</span>
                        <span className="font-mono text-[11px] text-emerald-100 truncate block">{settingsEmail}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase block">Account Authority</span>
                        <span className="font-bold text-emerald-200 flex items-center gap-1 text-[11px]">
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Verified Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `SK Official Administrative Credentials:\nName: ${settingsName}\nPosition: ${settingsPos}\nBarangay: Barangay ${designatedBarangay}\nEmail: ${settingsEmail}\nStatus: Verified Active SK Official`
                        );
                        addToast("Official credentials copied to clipboard!", "success");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Copy Official Badge Credentials
                    </button>
                  </div>
                </div>
              )}
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

              {/* Councilors Table / Empty State */}
              {localCouncilors.length === 0 ? (
                <div className="bg-white border border-[#D1FAE5] rounded-xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mx-auto">
                    <Users2 className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-gray-800 text-base">No SK Councilors Added Yet</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                      There are currently no registered councilors or official personnel recorded for <strong>Barangay {designatedBarangay}</strong>. Click below to add your first SK Councilor, Secretary, or Treasurer.
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
                    className="inline-flex items-center gap-2 bg-[#0A6B43] hover:bg-[#075332] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Councilor
                  </button>
                </div>
              ) : (
                <div className="bg-white border border-[#D1FAE5] rounded-xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Login Email</th>
                          <th className="p-4">Contact Number</th>
                          <th className="p-4">Official Role</th>
                          <th className="p-4 text-center">Status</th>
                          <th className="p-4 text-right">Date Created</th>
                          <th className="p-4 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                        {localCouncilors.map((c) => (
                          <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-bold text-gray-900">{c.name}</td>
                            <td className="p-4 text-gray-800 font-bold text-[11px]">{c.email}</td>
                            <td className="p-4 text-gray-600 font-semibold text-[11px]">{c.contactNumber || "N/A"}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[10px] font-extrabold uppercase">
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
              )}
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
                            <td className="p-4 max-w-[160px]">
                              {y.livelihoodGoal && y.livelihoodGoal.length > 15 ? (
                                <div>
                                  <p className={expandedAspirations[`p-${y.id}`] ? "text-xs font-medium text-gray-800 leading-relaxed bg-emerald-50/70 p-2 rounded-lg border border-emerald-200/80 my-1 shadow-2xs" : "text-xs font-semibold text-gray-700"}>
                                    {expandedAspirations[`p-${y.id}`] ? y.livelihoodGoal : `${y.livelihoodGoal.slice(0, 15)}...`}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={(e) => toggleAspirationExpand(`p-${y.id}`, e)}
                                    className="text-[10px] font-extrabold text-[#0A6B43] hover:underline mt-0.5 inline-block cursor-pointer"
                                  >
                                    {expandedAspirations[`p-${y.id}`] ? "See Less ▲" : "See More ▼"}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-600 font-medium">{y.livelihoodGoal || "N/A"}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-3">
                                {/* Stacked Group 1: View & Inspect */}
                                <div className="flex flex-col gap-1.5">
                                  <button
                                    onClick={() => setViewingPendingYouthModal(y)}
                                    className="w-28 h-7 bg-[#0A6B43] hover:bg-[#075332] text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                                    title="View full Katipunan ng Kabataan member profile details"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> View Profile
                                  </button>
                                  <button
                                    onClick={() => setVerifyingYouth(y)}
                                    className="w-28 h-7 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/80 font-bold rounded-lg text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                    title="Inspect uploaded ID documents and attestations"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Inspect ID
                                  </button>
                                </div>

                                {/* Subtle Vertical Divider Line */}
                                <div className="w-px h-13 bg-gray-200 shrink-0" />

                                {/* Stacked Group 2: Approve & Reject */}
                                <div className="flex flex-col gap-1.5">
                                  <button
                                    onClick={() => handleApproveYouth(y.id)}
                                    className="w-24 h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all uppercase tracking-wide flex items-center justify-center cursor-pointer"
                                    title="Approve youth registration"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectYouth(y.id)}
                                    className="w-24 h-7 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] shadow-2xs transition-all uppercase tracking-wide flex items-center justify-center cursor-pointer"
                                    title="Reject youth registration"
                                  >
                                    Reject
                                  </button>
                                </div>
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
                {editingAnnouncementId ? "Edit Announcement" : "Post New Announcement"}
              </h3>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  setEditingAnnouncementId(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
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
                  </select>
                </div>
              </div>

              {/* Date & Time Picker Controls */}
              <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/70 space-y-2">
                <label className="text-[10px] font-extrabold text-[#0A6B43] uppercase tracking-wider block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0A6B43]" />
                  Event Date & Time Schedule (Picker)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Select Date</label>
                    <input
                      type="date"
                      value={annEventDatePicker}
                      onChange={(e) => setAnnEventDatePicker(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 font-semibold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase block">Select Time</label>
                    <input
                      type="time"
                      value={annEventTimePicker}
                      onChange={(e) => setAnnEventTimePicker(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 font-semibold focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {annEventDatePicker && (
                  <div className="pt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#0A6B43]">
                    <span>📅 Scheduled:</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-emerald-200 shadow-2xs">
                      {new Date(annEventDatePicker + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {annEventTimePicker ? ` • ${formatTime12Hour(annEventTimePicker)}` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Sebastian Covered Court"
                    value={annVenue}
                    onChange={(e) => setAnnVenue(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Person & Hotline</label>
                  <input
                    type="text"
                    placeholder="e.g. SK Chair Rhea Cruz (+63 915 777 8888)"
                    value={annContactPerson}
                    onChange={(e) => setAnnContactPerson(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase block">Body Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the announcement details, requirements, or agenda..."
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Login Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. mariasantos.sk@sanluispampanga.gov.ph"
                    value={councilorEmail}
                    onChange={(e) => setCouncilorEmail(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={councilorContact}
                    onChange={(e) => setCouncilorContact(formatContactNumber(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Official Role *</label>
                  <select
                    value={councilorRole}
                    onChange={(e) => setCouncilorRole(e.target.value as any)}
                    className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-bold text-gray-800"
                  >
                    <option value="SK Councilor">SK Councilor</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Assigned Barangay</label>
                  <input
                    type="text"
                    disabled
                    value={`Barangay ${designatedBarangay.replace(/^Barangay\s+/i, "")}`}
                    className="w-full p-2.5 border border-gray-200 bg-gray-50 text-emerald-900 font-bold rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block">Login Account Password *</label>
                  <button
                    type="button"
                    onClick={generateCouncilorPassword}
                    className="text-[10px] font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showCouncilorPassword ? "text" : "password"}
                    required
                    value={councilorPassword}
                    onChange={(e) => setCouncilorPassword(e.target.value)}
                    placeholder="Set temporary password..."
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-800 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCouncilorPassword(!showCouncilorPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showCouncilorPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCouncilorOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Create & Provision Account
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

      {/* Pending Youth Member Profile Preview Modal */}
      {viewingPendingYouthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-emerald-100 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Pending Youth Profile Details</h3>
                  <p className="text-xs text-gray-500 font-medium">Self-registration record awaiting verification</p>
                </div>
              </div>
              <button
                onClick={() => setViewingPendingYouthModal(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Member Card Header */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#0A6B43] border border-emerald-200 flex items-center justify-center font-bold text-lg shrink-0">
                  {viewingPendingYouthModal.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base leading-snug">{viewingPendingYouthModal.name}</h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    {viewingPendingYouthModal.age} y/o · {viewingPendingYouthModal.purok} · <span className="font-bold text-emerald-800">{viewingPendingYouthModal.barangay}</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      Awaiting Verification
                    </span>
                    <span className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                      {viewingPendingYouthModal.educationalAttainment}
                    </span>
                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {viewingPendingYouthModal.currentStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal & Verification Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2.5">
                <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Registration & Verification Information</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-700">
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Contact Number</span>
                    <span className="text-gray-900 font-bold">{viewingPendingYouthModal.contactNumber || "+63 917 123 4567"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">Registration Date</span>
                    <span className="text-gray-900 font-bold">{viewingPendingYouthModal.registeredDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">ID Document Submitted</span>
                    <span className="text-teal-800 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                      {viewingPendingYouthModal.verificationIdType || "In-Person Field Profiling"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-medium block text-[10px]">ID Reference Number</span>
                    <span className="text-gray-900 font-mono font-bold">{viewingPendingYouthModal.verificationIdNumber || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Registered Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {viewingPendingYouthModal.skills && viewingPendingYouthModal.skills.length > 0 ? (
                    viewingPendingYouthModal.skills.map((skill) => (
                      <span key={skill} className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No skills specified yet</span>
                  )}
                </div>
              </div>

              {/* Livelihood Objective */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">Livelihood Objective & Aspirations</span>
                <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-100 text-xs font-medium text-gray-800 leading-relaxed">
                  "{viewingPendingYouthModal.livelihoodGoal || "Seeking technical vocational training and livelihood placement."}"
                </div>
              </div>

              {/* AI Match Preview */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-150 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">AI Match Compatibility</span>
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">Content-Based Recommendation Analysis</p>
                </div>
                <FlameMatchScore score={viewingPendingYouthModal.matchScore} hasPrograms={programs.length > 0} />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setViewingPendingYouthModal(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setVerifyingYouth(viewingPendingYouthModal);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-3.5 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Inspect ID
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRejectYouth(viewingPendingYouthModal.id);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer uppercase tracking-wider font-extrabold"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleApproveYouth(viewingPendingYouthModal.id);
                    setViewingPendingYouthModal(null);
                  }}
                  className="px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer uppercase tracking-wider font-extrabold"
                >
                  Approve Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
