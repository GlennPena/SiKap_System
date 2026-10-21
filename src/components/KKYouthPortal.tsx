"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Home, Target, Award, User, Bell, Sparkles, Plus, CheckCircle,
  AlertTriangle, Phone, Mail, MapPin, Briefcase, Trash2, X, Globe, MessageSquare, LogOut,
  Calendar, Clock, XCircle, Megaphone, Lock, Eye, EyeOff, Copy, RefreshCw, Edit, ShieldCheck, ShieldAlert, Send,
  BookmarkCheck, ChevronRight, Check, FileCheck, ArrowRight, ExternalLink, Bookmark, GraduationCap, Heart, Shield,
  Tag, Compass, FileText, Layers, Activity, Menu, Loader2,
  ClipboardList, Timer, Building2, UserCheck, Coins, Users,
  TrendingUp, Handshake, Store, Gift, Wrench, AlertCircle, School, Zap, Star, Camera, Upload
} from "lucide-react";
import { formatContactNumber, isProgramEnded, calculateAge, spellOutGender } from "../lib/utils";
import { YouthProfile, TESDAProgram, SKAnnouncement, YouthScreen, ReferralPipelineItem, EDUCATIONAL_ATTAINMENT_OPTIONS, normalizeEducationalAttainment } from "../types";
import { FlameMatchScore, GeminiExplanationBox, PathwayTimeline, SikapLogo, NotificationBellButton, SiKapDatePicker } from "./ReusableComponents";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { motion, AnimatePresence } from "motion/react";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { calculateContentBasedMatchScore, calculateDetailedCBFMatch, rankProgramsForYouth, getSuggestedSkillsForYouth, formatProgramTime, formatTrainingDays, formatProgramTimeslot, getProgramFullSchedule, formatProgramDate, formatProgramDateRange } from "../lib/cbf-matcher";
import { normalizeSkills } from "../lib/cbf-normalization";
import { GeminiLongTermCareerPlan, getFallbackTagalogCareerPlan } from "../lib/gemini";

interface KKYouthPortalProps {
  youthProfile: YouthProfile;
  setYouthProfiles: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  setPrograms?: React.Dispatch<React.SetStateAction<TESDAProgram[]>>;
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
  setPrograms,
  announcements,
  onLogout,
  addToast,
  referrals,
  setReferrals,
  currentUser
}) => {
  const isUnverified = youthProfile.approvalStatus === "Pending" || youthProfile.approvalStatus === "Rejected";

  const [activeTab, setActiveTab] = useState<YouthScreen>(YouthScreen.HOME);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isUnverified && activeTab !== YouthScreen.HOME) {
      setActiveTab(YouthScreen.HOME);
    }
  }, [isUnverified, activeTab]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProgramToApply, setSelectedProgramToApply] = useState<TESDAProgram | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Profile Picture state and local caching helper
  const getProfilePictureStorageKey = () => {
    const id = youthProfile?.id || currentUser?.id || currentUser?.email || "active_youth";
    return `sikap_profile_photo_${id}`;
  };

  const [profilePictureUrl, setProfilePictureUrl] = useState<string>(() => {
    if (youthProfile?.profilePicture) return youthProfile.profilePicture;
    if (typeof window !== "undefined") {
      try {
        const id = youthProfile?.id || currentUser?.id || currentUser?.email || "active_youth";
        const cached = localStorage.getItem(`sikap_profile_photo_${id}`);
        if (cached) return cached;
      } catch {}
    }
    return "";
  });

  const [isUploadingPic, setIsUploadingPic] = useState(false);

  useEffect(() => {
    if (youthProfile?.profilePicture) {
      setProfilePictureUrl(youthProfile.profilePicture);
    } else if (typeof window !== "undefined") {
      try {
        const id = youthProfile?.id || currentUser?.id || currentUser?.email || "active_youth";
        const cached = localStorage.getItem(`sikap_profile_photo_${id}`);
        if (cached) setProfilePictureUrl(cached);
      } catch {}
    }
  }, [youthProfile?.profilePicture, youthProfile?.id]);

  const compressProfileImage = (file: File, maxDim = 400, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(e.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file (JPG, PNG, WebP).", "error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast("Image size must be less than 10MB.", "error");
      return;
    }

    setIsUploadingPic(true);
    try {
      const compressedDataUrl = await compressProfileImage(file, 400, 0.85);
      setProfilePictureUrl(compressedDataUrl);

      // Cache locally
      const storageKey = getProfilePictureStorageKey();
      try {
        localStorage.setItem(storageKey, compressedDataUrl);
      } catch {}

      // Update in database
      if (youthProfile.id && youthProfile.id !== "empty-youth-profile") {
        const res = await fetch("/api/youth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: youthProfile.id,
            profilePicture: compressedDataUrl
          })
        });
        const data = await res.json();
        if (data.success) {
          setYouthProfiles((prev) =>
            prev.map((y) => (y.id === youthProfile.id ? { ...y, profilePicture: compressedDataUrl } : y))
          );
          addToast("Profile picture updated successfully!", "success");
        } else {
          addToast("Profile picture saved locally.", "info");
        }
      } else {
        addToast("Profile picture updated!", "success");
      }
    } catch (err: any) {
      console.error("Profile picture upload error:", err);
      addToast("Failed to upload profile picture.", "error");
    } finally {
      setIsUploadingPic(false);
      e.target.value = "";
    }
  };

  const handleRemoveProfilePicture = async () => {
    setIsUploadingPic(true);
    try {
      setProfilePictureUrl("");
      const storageKey = getProfilePictureStorageKey();
      try {
        localStorage.removeItem(storageKey);
      } catch {}

      if (youthProfile.id && youthProfile.id !== "empty-youth-profile") {
        await fetch("/api/youth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: youthProfile.id,
            profilePicture: ""
          })
        });
        setYouthProfiles((prev) =>
          prev.map((y) => (y.id === youthProfile.id ? { ...y, profilePicture: "" } : y))
        );
      }
      addToast("Profile picture removed.", "info");
    } catch (err) {
      console.error("Error removing profile picture:", err);
      addToast("Failed to remove profile picture.", "error");
    } finally {
      setIsUploadingPic(false);
    }
  };

  // Helper to get all relevant storage keys for the active youth user
  const getStorageKeys = () => {
    const keys: string[] = [];
    const email = currentUser?.email || youthProfile?.email;
    if (email) {
      keys.push(`sikap_cleared_notifs_${email.toLowerCase().trim()}`);
    }
    if (currentUser?.id) {
      keys.push(`sikap_cleared_notifs_${currentUser.id}`);
    }
    if (youthProfile?.id && youthProfile.id !== "empty-youth-profile") {
      keys.push(`sikap_cleared_notifs_${youthProfile.id}`);
    }
    keys.push("sikap_cleared_notifs_youth");
    return Array.from(new Set(keys));
  };

  // Track dismissed/cleared notifications with localStorage persistence
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          youthProfile?.email ? `sikap_cleared_notifs_${youthProfile.email.toLowerCase().trim()}` : null,
          youthProfile?.id && youthProfile.id !== "empty-youth-profile" ? `sikap_cleared_notifs_${youthProfile.id}` : null,
          "sikap_cleared_notifs_youth"
        ].filter(Boolean) as string[];

        let loaded: string[] = [];
        for (const k of initialKeys) {
          const saved = localStorage.getItem(k);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) loaded.push(...parsed);
            } catch { }
          }
        }
        return Array.from(new Set(loaded));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Re-synchronize cleared notifications whenever youth profile or auth loads
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const keys = getStorageKeys();
      let loaded: string[] = [];
      for (const k of keys) {
        const saved = localStorage.getItem(k);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) loaded.push(...parsed);
          } catch { }
        }
      }
      if (loaded.length > 0) {
        setClearedNotificationIds(prev => Array.from(new Set([...prev, ...loaded])));
      }
    } catch (e) {
      console.error("Failed to load cleared notifications on profile sync:", e);
    }
  }, [currentUser?.email, currentUser?.id, youthProfile?.id, youthProfile?.email]);

  const dismissNotification = (id: string) => {
    setClearedNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
      } catch (e) {
        console.error("Failed to save cleared notification:", e);
      }
      return updated;
    });
  };

  const clearAllNotifications = (allIds: string[]) => {
    setClearedNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
        const email = currentUser?.email || youthProfile?.email;
        if (email) {
          localStorage.setItem(`sikap_notifs_read_${email.toLowerCase().trim()}`, "true");
        }
      } catch (e) {
        console.error("Failed to save cleared notifications:", e);
      }
      return updated;
    });
    setNotificationsRead(true);
  };

  // Profile sub-tabs & editable states
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "skills" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBirthdate, setEditBirthdate] = useState(youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "");
  const [editAge, setEditAge] = useState<number | string>(youthProfile.age || 20);
  const [editGender, setEditGender] = useState(spellOutGender(youthProfile.gender));
  const [editPurok, setEditPurok] = useState(youthProfile.purok || "Purok 1");
  const [editGoal, setEditGoal] = useState(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
  const [editSector, setEditSector] = useState(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
  const [editPhone, setEditPhone] = useState(youthProfile.contactNumber || "+63 9");
  const [editEdu, setEditEdu] = useState<string>(normalizeEducationalAttainment(youthProfile.educationalAttainment));
  const [editStatus, setEditStatus] = useState(youthProfile.currentStatus || "Out-of-school");
  const [editSoloParent, setEditSoloParent] = useState(Boolean(youthProfile.soloParent));
  const [editPwd, setEditPwd] = useState(Boolean(youthProfile.pwd));
  const [editIndigenous, setEditIndigenous] = useState(Boolean(youthProfile.indigenous));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Goal editable state inside Skills & Competencies sub-tab
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [careerGoalInput, setCareerGoalInput] = useState(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Interests & Prior Experiences input state & ID Photo Modal
  const [newPrefInput, setNewPrefInput] = useState("");
  const [newExpInput, setNewExpInput] = useState("");
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);

  // Re-synchronize edit states whenever youthProfile prop updates (e.g. async fetch from DB)
  useEffect(() => {
    if (youthProfile) {
      setEditBirthdate(youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "");
      setEditAge(youthProfile.age || 20);
      setEditGender(spellOutGender(youthProfile.gender));
      setEditPurok(youthProfile.purok || "Purok 1");
      setEditGoal(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
      setCareerGoalInput(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
      setEditSector(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
      setEditPhone(youthProfile.contactNumber || "+63 9");
      setEditEdu(normalizeEducationalAttainment(youthProfile.educationalAttainment));
      setEditStatus(youthProfile.currentStatus || "Out-of-school");
      setEditSoloParent(Boolean(youthProfile.soloParent));
      setEditPwd(Boolean(youthProfile.pwd));
      setEditIndigenous(Boolean(youthProfile.indigenous));
    }
  }, [youthProfile]);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
      const parsedTl: GeminiLongTermCareerPlan | undefined = obj.translatedPlanTl && typeof obj.translatedPlanTl === "object" && (obj.translatedPlanTl.roadmapTitle || obj.translatedPlanTl.summary)
        ? {
            roadmapTitle: obj.translatedPlanTl.roadmapTitle || "Plano para sa Trabaho at Negosyo",
            summary: obj.translatedPlanTl.summary || "",
            targetGoal: obj.translatedPlanTl.targetGoal || "",
            programTitle: obj.translatedPlanTl.programTitle || "",
            immediate30Days: Array.isArray(obj.translatedPlanTl.immediate30Days) ? obj.translatedPlanTl.immediate30Days : [],
            employmentTrack: {
              targetRoles: Array.isArray(obj.translatedPlanTl.employmentTrack?.targetRoles) ? obj.translatedPlanTl.employmentTrack.targetRoles : [],
              targetLocations: obj.translatedPlanTl.employmentTrack?.targetLocations || "",
              estimatedSalary: obj.translatedPlanTl.employmentTrack?.estimatedSalary || "",
              actionSteps: Array.isArray(obj.translatedPlanTl.employmentTrack?.actionSteps) ? obj.translatedPlanTl.employmentTrack.actionSteps : []
            },
            entrepreneurshipTrack: {
              businessConcept: obj.translatedPlanTl.entrepreneurshipTrack?.businessConcept || "",
              starterFunding: obj.translatedPlanTl.entrepreneurshipTrack?.starterFunding || "",
              initialServices: Array.isArray(obj.translatedPlanTl.entrepreneurshipTrack?.initialServices) ? obj.translatedPlanTl.entrepreneurshipTrack.initialServices : []
            },
            longTerm1To2Years: Array.isArray(obj.translatedPlanTl.longTerm1To2Years) ? obj.translatedPlanTl.longTerm1To2Years : [],
            localSupportContacts: Array.isArray(obj.translatedPlanTl.localSupportContacts) ? obj.translatedPlanTl.localSupportContacts : [],
            generatedDate: obj.translatedPlanTl.generatedDate || ""
          }
        : undefined;

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
        generatedDate: obj.generatedDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        translatedPlanTl: parsedTl
      };
    }
    return null;
  };

  // Helper to extract cached/saved Tagalog plan from database object or localStorage
  const getInitialTagalogPlan = (): GeminiLongTermCareerPlan | null => {
    // 1. From database youthProfile.savedCareerPlan
    if (youthProfile.savedCareerPlan) {
      const parsedDb = parseCareerPlan(youthProfile.savedCareerPlan);
      if (parsedDb?.translatedPlanTl) {
        return parsedDb.translatedPlanTl;
      }
    }
    // 2. From localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = (youthProfile.name && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.name}`))
          || (youthProfile.id && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.id}`));
        if (rawLocal) {
          const parsedLocal = parseCareerPlan(JSON.parse(rawLocal));
          if (parsedLocal) return parsedLocal;
        }
      } catch (e) {
        console.warn("Failed to read local career plan translation:", e);
      }
    }
    return null;
  };

  // Step 4 Gemini Long-Term Career Plan states
  const currentSavedPlan = parseCareerPlan(youthProfile.savedCareerPlan);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeminiLongTermCareerPlan | null>(currentSavedPlan);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [careerPlanLang, setCareerPlanLang] = useState<"en" | "tl">("en");
  const [translatedPlanTl, setTranslatedPlanTl] = useState<GeminiLongTermCareerPlan | null>(() => getInitialTagalogPlan());
  const [isTranslatingPlan, setIsTranslatingPlan] = useState<boolean>(false);

  const handleToggleCareerPlanLang = async (lang: "en" | "tl") => {
    if (lang === "en") {
      setCareerPlanLang("en");
      return;
    }
    setCareerPlanLang("tl");

    // 1. If we already have the translation loaded in React state, use it instantly (0 tokens)
    if (translatedPlanTl) {
      return;
    }

    // 2. Check if database already has the translation
    const plan = currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan) || generatedPlan;
    if (plan?.translatedPlanTl) {
      setTranslatedPlanTl(plan.translatedPlanTl);
      return;
    }

    // 3. Check localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = (youthProfile.name && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.name}`))
          || (youthProfile.id && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.id}`));
        if (rawLocal) {
          const parsedLocal = parseCareerPlan(JSON.parse(rawLocal));
          if (parsedLocal) {
            setTranslatedPlanTl(parsedLocal);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed reading local translation:", e);
      }
    }

    // 4. Only if NO translation exists anywhere, generate via Gemini API once
    if (plan) {
      const fallback = getFallbackTagalogCareerPlan(plan, youthProfile);
      setTranslatedPlanTl(fallback);

      setIsTranslatingPlan(true);
      try {
        const res = await fetch("/api/career-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            youthProfile,
            translatePlan: plan
          })
        });
        const data = await res.json();
        if (data.success && data.data) {
          const newTranslatedPlan = parseCareerPlan(data.data) || data.data;
          setTranslatedPlanTl(newTranslatedPlan);

          // Save to localStorage immediately
          if (typeof window !== "undefined") {
            if (youthProfile.name) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.name}`, JSON.stringify(newTranslatedPlan));
            if (youthProfile.id) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.id}`, JSON.stringify(newTranslatedPlan));
          }

          // Persist directly to deployed PostgreSQL database under savedCareerPlan
          const fullPlanWithTranslation: GeminiLongTermCareerPlan = {
            ...plan,
            translatedPlanTl: newTranslatedPlan
          };
          try {
            const saveRes = await fetch("/api/youth", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: youthProfile.id,
                savedCareerPlan: fullPlanWithTranslation
              })
            });
            const saveData = await saveRes.json();
            if (saveData.success) {
              setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: fullPlanWithTranslation } : y));
              setGeneratedPlan(fullPlanWithTranslation);
            }
          } catch (dbErr) {
            console.error("Failed to save translated plan to database:", dbErr);
          }
        }
      } catch (err) {
        console.warn("Using local Tagalog translation fallback for career plan:", err);
      } finally {
        setIsTranslatingPlan(false);
      }
    }
  };

  useEffect(() => {
    const parsed = parseCareerPlan(youthProfile.savedCareerPlan);
    if (parsed) {
      setGeneratedPlan(parsed);
      if (typeof window !== "undefined" && youthProfile.name) {
        localStorage.setItem(`sikap_career_plan_${youthProfile.name}`, JSON.stringify(parsed));
        if (youthProfile.id) localStorage.setItem(`sikap_career_plan_${youthProfile.id}`, JSON.stringify(parsed));
      }
      // If database plan includes Tagalog translation, sync it to state & localStorage
      if (parsed.translatedPlanTl) {
        setTranslatedPlanTl(parsed.translatedPlanTl);
        if (typeof window !== "undefined") {
          if (youthProfile.name) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.name}`, JSON.stringify(parsed.translatedPlanTl));
          if (youthProfile.id) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.id}`, JSON.stringify(parsed.translatedPlanTl));
        }
      }
    } else {
      setGeneratedPlan(null);
      setTranslatedPlanTl(null);
      if (typeof window !== "undefined") {
        if (youthProfile.name) {
          localStorage.removeItem(`sikap_career_plan_${youthProfile.name}`);
          localStorage.removeItem(`sikap_career_plan_tl_${youthProfile.name}`);
        }
        if (youthProfile.id) {
          localStorage.removeItem(`sikap_career_plan_${youthProfile.id}`);
          localStorage.removeItem(`sikap_career_plan_tl_${youthProfile.id}`);
        }
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
    // Ensure existing Tagalog translation is preserved when saving to Digital ID Card
    const fullPlanToSave: GeminiLongTermCareerPlan = {
      ...planToSave,
      translatedPlanTl: translatedPlanTl || planToSave.translatedPlanTl
    };
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          savedCareerPlan: fullPlanToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: fullPlanToSave } : y));
        setGeneratedPlan(fullPlanToSave);
        addToast("Career Roadmap successfully saved to your Digital ID Card!", "success");
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

  const [liveGeminiAdvice, setLiveGeminiAdvice] = useState<string>(youthProfile?.savedMatchAdvice?.careerAdvice || "");
  const [liveGeminiBullets, setLiveGeminiBullets] = useState<string[]>(youthProfile?.savedMatchAdvice?.bulletAdvice || []);
  const [featuredAdviceTl, setFeaturedAdviceTl] = useState<string>(youthProfile?.savedMatchAdvice?.careerAdviceTl || "");
  const [featuredBulletsTl, setFeaturedBulletsTl] = useState<string[]>(youthProfile?.savedMatchAdvice?.bulletAdviceTl || []);
  const [featuredLang, setFeaturedLang] = useState<"en" | "tl">("en");
  const [isLoadingFeaturedAI, setIsLoadingFeaturedAI] = useState<boolean>(!youthProfile?.savedMatchAdvice?.careerAdvice);
  const [viewingProgramModal, setViewingProgramModal] = useState<{
    program: TESDAProgram;
    matchScore?: number;
  } | null>(null);

  // Lock background scroll when Program Details modal is open to keep scrollbars strictly inside modal
  useEffect(() => {
    if (viewingProgramModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [viewingProgramModal]);

  // Helper to reliably match youth names regardless of accents or casing
  const isSameYouth = (rYouthName?: string, currentYouthName?: string) => {
    if (!rYouthName || !currentYouthName) return false;
    const n1 = rYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const n2 = currentYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
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

  // Scored programs with completed qualification indicator
  const scoredPrograms = useMemo(() => {
    return programs
      .map(p => ({
        program: p,
        matchScore: calculateContentBasedMatchScore(youthProfile, p),
        isCompleted: isProgramCompleted(p)
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [programs, youthProfile, referrals]);

  // Actionable uncompleted programs for featured recommendation and upskilling
  const uncompletedScoredPrograms = useMemo(() => {
    return scoredPrograms.filter(sp => !sp.isCompleted);
  }, [scoredPrograms]);

  // Completed programs where the member is already certified
  const completedScoredPrograms = useMemo(() => {
    return scoredPrograms.filter(sp => sp.isCompleted);
  }, [scoredPrograms]);

  // Programs ordered for Matches tab: Actionable uncompleted first, completed qualifications below
  const matchesTabPrograms = useMemo(() => {
    return [...scoredPrograms].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return b.matchScore - a.matchScore;
    });
  }, [scoredPrograms]);

  useEffect(() => {
    // Only fetch AI match rationale once actual youth profile is resolved and has a registered barangay
    if (!youthProfile || youthProfile.id === "empty-youth-profile" || !youthProfile.barangay) {
      setIsLoadingFeaturedAI(false);
      return;
    }
    // Target the actionable uncompleted program first so Gemini provides advice on the next upskilling course
    const targetProgramsForAdvice = uncompletedScoredPrograms.length > 0
      ? uncompletedScoredPrograms.map(sp => sp.program)
      : scoredPrograms.map(sp => sp.program);

    if (targetProgramsForAdvice.length > 0) {
      const targetProg = targetProgramsForAdvice[0];
      const savedAdvice = youthProfile.savedMatchAdvice;

      // 1. Check if database already has saved match advice for this specific top program
      if (
        savedAdvice &&
        savedAdvice.careerAdvice &&
        (savedAdvice.programId === targetProg.id || savedAdvice.programTitle === targetProg.title)
      ) {
        setLiveGeminiAdvice(savedAdvice.careerAdvice);
        setLiveGeminiBullets(Array.isArray(savedAdvice.bulletAdvice) ? savedAdvice.bulletAdvice : []);
        setFeaturedAdviceTl(savedAdvice.careerAdviceTl || "");
        setFeaturedBulletsTl(Array.isArray(savedAdvice.bulletAdviceTl) ? savedAdvice.bulletAdviceTl : []);
        setIsLoadingFeaturedAI(false);
        return;
      }

      // 2. Check local client cache as an instant fallback
      const localKey = `sikap_saved_advice_${youthProfile.id}_${targetProg.id}`;
      try {
        const cached = localStorage.getItem(localKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.careerAdvice) {
            setLiveGeminiAdvice(parsed.careerAdvice);
            setLiveGeminiBullets(parsed.bulletAdvice || []);
            setFeaturedAdviceTl(parsed.careerAdviceTl || "");
            setFeaturedBulletsTl(parsed.bulletAdviceTl || []);
            setIsLoadingFeaturedAI(false);
            return;
          }
        }
      } catch (e) {
        // ignore storage read issues
      }

      // 3. If no saved advice exists for this program, generate fresh advice and persist to DB
      setIsLoadingFeaturedAI(true);
      fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youth: youthProfile,
          programs: targetProgramsForAdvice,
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
            if (data.careerAdviceTl) setFeaturedAdviceTl(data.careerAdviceTl);
            if (Array.isArray(data.bulletAdviceTl) && data.bulletAdviceTl.length > 0) {
              setFeaturedBulletsTl(data.bulletAdviceTl);
            }

            // Also cache in localStorage for immediate client-side retrieval
            try {
              const advicePayload = {
                programId: targetProg.id,
                programTitle: targetProg.title,
                careerAdvice: data.careerAdvice,
                bulletAdvice: data.bulletAdvice,
                careerAdviceTl: data.careerAdviceTl,
                bulletAdviceTl: data.bulletAdviceTl,
                generatedAt: new Date().toISOString()
              };
              localStorage.setItem(localKey, JSON.stringify(advicePayload));
            } catch (storageErr) {
              // ignore
            }
          }
        })
        .catch(err => console.error("Error fetching Gemini advice:", err))
        .finally(() => {
          setIsLoadingFeaturedAI(false);
        });
    } else {
      setIsLoadingFeaturedAI(false);
    }
  }, [youthProfile?.id, youthProfile?.barangay, youthProfile?.skills, youthProfile?.sectorPreference, youthProfile?.livelihoodGoal, youthProfile?.interests, youthProfile?.savedMatchAdvice, uncompletedScoredPrograms, scoredPrograms]);

  const skChairpersonName = useMemo(() => {
    return "Your SK Chairperson";
  }, [youthProfile.barangay]);

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

  const handleDeletePathway = async (referralId: string) => {
    const targetRef = referrals?.find(r => r.id === referralId);
    try {
      await fetch(`/api/referrals?id=${referralId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting referral:", err);
    }
    if (targetRef && (targetRef.status === "Pending" || targetRef.status === "Enrolled") && setPrograms) {
      setPrograms(prev => prev.map(p => {
        if (p.title === targetRef.programTitle || p.id === targetRef.programId) {
          return { ...p, slotsRemaining: Math.min(p.slotsTotal, p.slotsRemaining + 1) };
        }
        return p;
      }));
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
    const targetRef = referrals?.find(r => r.id === referralId);
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
    if (targetRef && (targetRef.status === "Pending" || targetRef.status === "Enrolled") && setPrograms) {
      setPrograms(prev => prev.map(p => {
        if (p.title === targetRef.programTitle || p.id === targetRef.programId) {
          return { ...p, slotsRemaining: Math.min(p.slotsTotal, p.slotsRemaining + 1) };
        }
        return p;
      }));
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

  // Helper to convert strings to Title Case for newly added skills, interests, and experiences
  const toTitleCase = (str: string): string => {
    if (!str) return "";
    return str
      .trim()
      .split(/\s+/)
      .map(word => {
        // If word is an acronym (2-5 uppercase letters/digits like IT, HVAC, CNC, SMAW), keep as uppercase
        if (word.length >= 2 && word.length <= 5 && word === word.toUpperCase() && /^[A-Z0-9/]+$/.test(word)) {
          return word;
        }
        return word
          .split("-")
          .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join("-");
      })
      .join(" ");
  };

  // local convenience updates
  const handleAddSkillSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isUnverified) {
      addToast("Cannot add skills in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const formattedSkill = toTitleCase(newSkillInput);
    if (!formattedSkill) return;

    if (youthProfile.skills.includes(formattedSkill)) {
      addToast("Skill already exists in your profile", "info");
      return;
    }

    const updatedSkills = [...youthProfile.skills, formattedSkill];
    const updatedNormalized = normalizeSkills(updatedSkills);
    const tempYouth = {
      ...youthProfile,
      skills: updatedSkills,
      skillsRaw: updatedSkills,
      skillsNormalized: updatedNormalized
    };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : Math.min(99, youthProfile.matchScore + 3);

    // update global profiles immediately with normalized skills
    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        };
      }
      return y;
    }));

    // Persist skill addition to PostgreSQL
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save skill");
      }
      addToast(`Added "${formattedSkill}" to your skills. Matches refreshed!`, "success");
    } catch (err: any) {
      console.error("Error persisting skill addition:", err);
      addToast("Failed to save skill: " + (err.message || "Network error"), "error");
    }

    setNewSkillInput("");
    setShowAddSkillModal(false);
  };

  const handleDOBChange = (dob: string) => {
    const clean = dob ? String(dob).split("T")[0] : "";
    setEditBirthdate(clean);
    if (clean) {
      const calculated = calculateAge(clean);
      if (calculated !== "") {
        setEditAge(calculated);
      }
    }
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnverified) {
      addToast("Cannot edit profile details while awaiting SK Verification", "error");
      return;
    }

    const calculatedAge = editBirthdate ? calculateAge(editBirthdate) : "";
    const ageNum = calculatedAge !== "" ? Number(calculatedAge) : (parseInt(String(editAge), 10) || youthProfile.age || 20);

    const tempYouth: YouthProfile = {
      ...youthProfile,
      birthdate: editBirthdate || youthProfile.birthdate,
      age: ageNum,
      gender: editGender,
      purok: editPurok,
      sectorPreference: editSector,
      contactNumber: editPhone,
      educationalAttainment: editEdu,
      currentStatus: editStatus,
      soloParent: editSoloParent,
      pwd: editPwd,
      indigenous: editIndigenous
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
          birthdate: editBirthdate,
          age: ageNum,
          gender: editGender,
          purok: editPurok,
          sectorPreference: editSector,
          contactNumber: editPhone,
          educationalAttainment: editEdu,
          currentStatus: editStatus,
          soloParent: editSoloParent,
          pwd: editPwd,
          indigenous: editIndigenous,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, ...tempYouth, matchScore: updatedMatchScore } : y));
        addToast("Profile demographics updated successfully!", "success");
        setIsEditingProfile(false);
      } else {
        addToast(data.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast("Failed to save profile changes.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    const cleanDob = youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "";
    setEditBirthdate(cleanDob);
    const computed = cleanDob ? calculateAge(cleanDob) : "";
    setEditAge(computed !== "" ? computed : (youthProfile.age || 20));
    setEditGender(spellOutGender(youthProfile.gender));
    setEditPurok(youthProfile.purok || "Purok 1");
    setEditGoal(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
    setEditSector(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
    setEditPhone(youthProfile.contactNumber || "+63 9");
    setEditEdu(normalizeEducationalAttainment(youthProfile.educationalAttainment));
    setEditStatus(youthProfile.currentStatus || "Out-of-school");
    setEditSoloParent(Boolean(youthProfile.soloParent));
    setEditPwd(Boolean(youthProfile.pwd));
    setEditIndigenous(Boolean(youthProfile.indigenous));
    setIsEditingProfile(false);
  };

  const handleSaveCareerGoal = async () => {
    if (isUnverified) {
      addToast("Cannot edit career goal while awaiting SK Verification", "error");
      return;
    }
    if (!careerGoalInput.trim()) {
      addToast("Please provide your livelihood & career goal", "error");
      return;
    }

    setIsSavingGoal(true);
    try {
      const tempYouth: YouthProfile = {
        ...youthProfile,
        livelihoodGoal: careerGoalInput.trim(),
        goalRaw: careerGoalInput.trim()
      };

      const updatedMatchScore = programs && programs.length > 0
        ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
        : youthProfile.matchScore;

      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          livelihoodGoal: careerGoalInput.trim(),
          goalRaw: careerGoalInput.trim(),
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? {
          ...y,
          livelihoodGoal: careerGoalInput.trim(),
          goalRaw: careerGoalInput.trim(),
          matchScore: updatedMatchScore
        } : y));
        setEditGoal(careerGoalInput.trim());
        addToast("Livelihood & Career Goal updated successfully!", "success");
        setIsEditingGoal(false);
      } else {
        addToast(data.error || "Failed to save career goal", "error");
      }
    } catch (err) {
      console.error("Error saving career goal:", err);
      addToast("Failed to save career goal: Network error", "error");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleAddPreference = async (pref: string) => {
    const formatted = toTitleCase(pref);
    if (!formatted) return;
    const currentPrefs = youthProfile.preferencesRaw || youthProfile.interests || [];
    if (currentPrefs.includes(formatted)) {
      addToast("Vocational interest already exists in your profile", "info");
      return;
    }
    const updatedPrefs = [...currentPrefs, formatted];

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, preferencesRaw: updatedPrefs, interests: updatedPrefs } : y));
    setNewPrefInput("");
    addToast(`Added vocational interest "${formatted}"`, "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, preferencesRaw: updatedPrefs })
      });
    } catch (err) {
      console.error("Failed to add preference:", err);
    }
  };

  const handleRemovePreference = async (pref: string) => {
    if (isUnverified) {
      addToast("Cannot edit preferences in View-Only Mode", "error");
      return;
    }
    const currentPrefs = youthProfile.preferencesRaw || youthProfile.interests || [];
    const updatedPrefs = currentPrefs.filter(p => p !== pref);

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, preferencesRaw: updatedPrefs, interests: updatedPrefs } : y));
    addToast(`Removed vocational interest "${pref}"`, "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, preferencesRaw: updatedPrefs })
      });
    } catch (err) {
      console.error("Failed to remove preference:", err);
    }
  };

  const handleAddExperience = async (exp: string) => {
    const formatted = toTitleCase(exp);
    if (!formatted) return;
    const currentExps = youthProfile.experiencesRaw || [];
    if (currentExps.includes(formatted)) {
      addToast("Prior experience already exists in your profile", "info");
      return;
    }
    const updatedExps = [...currentExps, formatted];

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, experiencesRaw: updatedExps } : y));
    setNewExpInput("");
    addToast(`Added prior work/practical experience "${formatted}"`, "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, experiencesRaw: updatedExps })
      });
    } catch (err) {
      console.error("Failed to add experience:", err);
    }
  };

  const handleRemoveExperience = async (exp: string) => {
    if (isUnverified) {
      addToast("Cannot edit experiences in View-Only Mode", "error");
      return;
    }
    const currentExps = youthProfile.experiencesRaw || [];
    const updatedExps = currentExps.filter(e => e !== exp);

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, experiencesRaw: updatedExps } : y));
    addToast(`Removed prior experience "${exp}"`, "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, experiencesRaw: updatedExps })
      });
    } catch (err) {
      console.error("Failed to remove experience:", err);
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
    const updatedNormalized = normalizeSkills(updatedSkills);
    const tempYouth = {
      ...youthProfile,
      skills: updatedSkills,
      skillsRaw: updatedSkills,
      skillsNormalized: updatedNormalized
    };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : youthProfile.matchScore;

    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        };
      }
      return y;
    }));

    // Persist skill removal to PostgreSQL
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove skill");
      }
      addToast(`Skill "${skill}" removed`, "info");
    } catch (err: any) {
      console.error("Error persisting skill removal:", err);
      addToast("Failed to remove skill: " + (err.message || "Network error"), "error");
    }
  };

  // Direct Apply to TESDA
  const handleDirectApply = (prog: TESDAProgram) => {
    if (isUnverified) {
      addToast("Cannot apply for programs in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    if (isProgramEnded(prog)) {
      addToast(`Sorry, "${prog.title}" has already ended or concluded its period.`, "error");
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
    if (isProgramEnded(selectedProgramToApply)) {
      addToast(`Sorry, "${selectedProgramToApply.title}" has already ended or concluded its period.`, "error");
      return;
    }
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
        if (setPrograms) {
          setPrograms(prev => prev.map(p => {
            if (p.id === selectedProgramToApply.id || p.title === selectedProgramToApply.title) {
              return { ...p, slotsRemaining: Math.max(0, p.slotsRemaining - 1) };
            }
            return p;
          }));
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
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#FAFAF8] flex w-full font-sans antialiased" id="youth-portal-container">

      {/* Mobile Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Responsive Sliding Drawer on Mobile / Sticky on Desktop) */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-[17%] lg:min-w-[250px] xl:min-w-[260px] h-[100dvh] max-h-[100dvh] shrink-0 bg-[#082D21] text-white flex flex-col justify-between shadow-2xl lg:shadow-none border-r border-white/10 select-none overflow-y-auto overflow-x-hidden transform transition-transform duration-300 ease-in-out font-sans ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 flex-1">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-6 px-0.5 pt-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <SikapLogo size={28} logoSize={30} textSize={22} variant="white" showText={true} />
              <div className="border-l border-white/20 pl-2 space-y-0.5 min-w-0 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-black text-amber-400 uppercase tracking-widest block leading-none">Member</span>
                <span className="text-[8.5px] sm:text-[9px] font-bold text-emerald-300 uppercase tracking-wider block truncate leading-none mt-1 max-w-[85px] sm:max-w-[95px] xl:max-w-[105px]" title={youthProfile.barangay || "San Luis"}>
                  {(youthProfile.barangay || "San Luis").replace(/^Barangay\s+/i, "")}
                </span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="lg:hidden p-1 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 relative">
            {[
              {
                id: YouthScreen.HOME,
                label: "Dashboard",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-300 shrink-0" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                )
              },
              {
                id: YouthScreen.MATCHES,
                label: "Matched Programs",
                activeIcon: (
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="6" fill="currentColor" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                )
              },
              {
                id: YouthScreen.PATHWAY,
                label: "Livelihood Pathway",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-400 shrink-0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                )
              },
              {
                id: YouthScreen.PROFILE,
                label: "My Profile & Skills",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-400 shrink-0" viewBox="0 0 24 24">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const isLocked = isUnverified && tab.id !== YouthScreen.HOME;

              return (
                <div key={tab.id} className="relative">
                  {/* Animated Active Page Indicator Bar on far-left edge */}
                  {isActive && !isLocked && (
                    <motion.span
                      layoutId="youthActiveIndicator"
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#02513B] rounded-r-full shadow-[0_0_8px_rgba(2,81,59,0.8)] z-20 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Animated Active Pill Background */}
                  {isActive && !isLocked && (
                    <motion.div
                      layoutId="youthActiveBackground"
                      className="absolute inset-0 bg-[#02513B] rounded-xl pointer-events-none z-0 shadow-sm border border-emerald-400/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        addToast("Locked in View-Only Mode while awaiting verification", "info");
                        return;
                      }
                      setActiveTab(tab.id);
                      setIsMobileNavOpen(false);
                    }}
                    aria-disabled={isLocked}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors duration-200 text-left group tracking-tight outline-none focus:outline-none ${
                      isLocked
                        ? "text-emerald-200/60 cursor-not-allowed select-none hover:text-white/75 hover:bg-white/[0.04]"
                        : isActive
                        ? "text-emerald-300 cursor-pointer"
                        : "text-gray-300/80 hover:bg-white/5 hover:text-white cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className={`transition-colors duration-200 shrink-0 ${
                        isActive && !isLocked
                          ? "text-emerald-300"
                          : isLocked
                          ? "text-current"
                          : "text-gray-400 group-hover:text-gray-200"
                      }`}>
                        {isActive && !isLocked ? tab.activeIcon : tab.inactiveIcon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {/* Lock icon appears on hover on the right part of selector when locked */}
                    {isLocked && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pl-2 text-current">
                        <Lock className="w-4 h-4 shrink-0" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Avatar, Name & Sign Out in One Row */}
        <div className="p-3 sm:p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0 bg-[#082D21]">
          {/* Break line with horizontal padding */}
          <div className="px-1 pb-2.5 pt-1">
            <div className="h-[1px] w-full bg-white/20 rounded-full" />
          </div>

          {/* Avatar, Name, and Sign Out Button in One Row */}
          <div className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-xl">
            {/* User Profile Info (Avatar + Complete Name - Static without hover effect) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar without hover effect */}
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-amber-400/40 shrink-0 select-none overflow-hidden">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt={youthProfile?.name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : youthProfile?.name ? (
                  youthProfile.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  "KK"
                )}
              </div>

              {/* Complete Name without truncation or hover effect */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {youthProfile?.name || "Youth Member"}
                </p>
              </div>
            </div>

            {/* Sign Out Button (Only element with hover effect) */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2.5 text-gray-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group/logout"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-300 shrink-0" />
              ) : (
                <LogOut className="w-5 h-5 group-hover/logout:text-red-300 transition-colors shrink-0" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="flex-1 h-[100dvh] max-h-[100dvh] flex flex-col min-w-0 overflow-y-auto pb-12 sm:pb-6">
        <header className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 z-30 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg lg:text-3xl font-black text-[#0A6B43] tracking-tight leading-tight truncate">
                {activeTab === YouthScreen.HOME && "Dashboard"}
                {activeTab === YouthScreen.MATCHES && "Matched Programs"}
                {activeTab === YouthScreen.PATHWAY && "Livelihood Pathway"}
                {activeTab === YouthScreen.PROFILE && "My Profile & Skills"}
              </h1>
            </div>
          </div>

          <div className="flex items-center relative shrink-0" id="notification-bell-container">
            {/* Notification Bell (Enlarged) */}
            <div className="relative">
              {(() => {
                const userApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name)) || [];
                const rawNotifications: Array<{ id: string; text: string; subtext: string; date: string; type: "pending" | "enrolled" | "declined" | "general"; targetTab: YouthScreen }> = [];

                userApps.forEach(app => {
                  if (app.status === "Pending") {
                    rawNotifications.push({
                      id: `notify-${app.id}-pending`,
                      text: `Requirements Submission Required`,
                      subtext: `Your application for "${app.programTitle}" is pending. Submit physical requirements at TESDA GPSAT.`,
                      date: app.referralDate || "Just Now",
                      type: "pending",
                      targetTab: YouthScreen.PATHWAY
                    });
                  } else if (app.status === "Enrolled") {
                    rawNotifications.push({
                      id: `notify-${app.id}-enrolled`,
                      text: `Enrollment Approved!`,
                      subtext: `You are officially accepted into "${app.programTitle}". Training sessions will start soon.`,
                      date: "Just Now",
                      type: "enrolled",
                      targetTab: YouthScreen.PATHWAY
                    });
                  } else if (app.status === "Declined") {
                    rawNotifications.push({
                      id: `notify-${app.id}-declined`,
                      text: `Application Declined`,
                      subtext: `Your application for "${app.programTitle}" was declined.`,
                      date: "Just Now",
                      type: "declined",
                      targetTab: YouthScreen.PATHWAY
                    });
                  }
                });

                localAnnouncements.forEach((ann, idx) => {
                  const annId = ann.id || `ann-${(ann.title || "").replace(/[^a-zA-Z0-9]/g, "_")}-${idx}`;
                  rawNotifications.push({
                    id: `notify-ann-${annId}`,
                    text: ann.title,
                    subtext: ann.body,
                    date: ann.datePosted,
                    type: "general",
                    targetTab: YouthScreen.HOME
                  });
                });

                const notificationsList = rawNotifications.filter(item => !clearedNotificationIds.includes(item.id));

                return (
                  <>
                    <NotificationBellButton
                      isOpen={showNotifications}
                      onClick={() => setShowNotifications(!showNotifications)}
                      unreadCount={!notificationsRead ? notificationsList.length : 0}
                      title="Notifications"
                      size="lg"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs"
                    />

                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="fixed inset-x-3.5 top-20 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-14 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white border border-emerald-100 rounded-2xl shadow-2xl py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                          <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/60 p-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-[#0A6B43]" />
                              <span className="font-extrabold text-gray-900 text-sm">Notifications & Alerts</span>
                              {notificationsList.length > 0 && (
                                <span className="bg-[#0A6B43] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                  {notificationsList.length}
                                </span>
                              )}
                            </div>
                            {notificationsList.length > 0 && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    clearAllNotifications(rawNotifications.map(n => n.id));
                                    addToast("All notifications marked as read & cleared", "info");
                                  }}
                                  className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                  title="Mark all notifications as read and clear them"
                                >
                                  Mark all read
                                </button>
                                <span className="text-gray-300">·</span>
                                <button
                                  onClick={() => {
                                    clearAllNotifications(rawNotifications.map(n => n.id));
                                    addToast("All notifications cleared", "info");
                                  }}
                                  className="text-[10px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                                  title="Clear all alerts"
                                >
                                  Clear all
                                </button>
                              </div>
                            )}
                          </div>

                          <NotificationSettingsCard compact userRole="KK_YOUTH" addToast={addToast} />

                          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                            {notificationsList.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                                <p className="text-xs font-bold text-gray-700">No alerts right now</p>
                                <p className="text-[10px] text-gray-400">You are all caught up with your training applications!</p>
                              </div>
                            ) : (
                              notificationsList.map((item) => (
                                <div
                                  key={item.id}
                                  onClick={() => {
                                    dismissNotification(item.id);
                                    if (!isUnverified) {
                                      setActiveTab(item.targetTab);
                                    } else {
                                      addToast("Locked in View-Only Mode while awaiting verification", "info");
                                    }
                                    setShowNotifications(false);
                                  }}
                                  className="p-3.5 hover:bg-emerald-50/50 transition-colors cursor-pointer flex items-start gap-3 group relative"
                                >
                                  <span className="mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-150">
                                    {item.type === "enrolled" && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                                    {item.type === "pending" && <ClipboardList className="w-3.5 h-3.5 text-blue-600" />}
                                    {item.type === "declined" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                    {item.type === "general" && <Megaphone className="w-3.5 h-3.5 text-amber-500" />}
                                  </span>
                                  <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                                    <p className="font-bold text-gray-900 leading-tight text-xs">{item.text}</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.subtext}</p>
                                    <p className="text-[9px] text-emerald-700 mt-1 font-semibold">{item.date}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismissNotification(item.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 hover:bg-gray-100 p-1 rounded-md transition-all shrink-0 -mr-1"
                                    title="Dismiss alert"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400">Click an alert to view it, or click close to dismiss</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Outer content container */}
        <div className="px-2 sm:px-3 lg:px-4 py-4 sm:py-6 max-w-[1420px] mx-auto w-full space-y-5 sm:space-y-6">

          {isUnverified && (
            <div className="bg-[#FEEDC9] border border-amber-200/80 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <Clock className="w-4 h-4 text-[#753B07] shrink-0" />
                <p className="text-xs sm:text-sm text-[#753B07] leading-relaxed">
                  <span className="font-bold">View-only mode.</span>{" "}
                  <span>Your registration is awaiting verification. Full access will be available once approved.</span>
                </p>
              </div>
              <span className="bg-[#E48212] text-white text-xs font-bold px-3.5 py-1 rounded-full shrink-0 shadow-2xs animate-pulse">
                Pending
              </span>
            </div>
          )}

          {/* HOME TAB SCREEN */}
          {activeTab === YouthScreen.HOME && (
            <div className="space-y-5 sm:space-y-6">

              {/* Full-Width Rectangular Greeting Card Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content - Header and Subheader Only */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Mabuhay, {youthProfile.name}!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Discover TESDA training opportunities that match your skills, interests, and career goals.
                  </p>
                </div>
              </div>

              {/* ACTIVE ENROLLED CLASSES SECTION */}
              {enrolledPrograms.length > 0 && (
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden" id="active-classes-schedule-container">
                  <div className="bg-[#1C2B20] text-white p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 text-white">
                      <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                        <School className="w-4.5 h-4.5 text-emerald-300" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base tracking-tight text-white">My Active Class & Training Schedule</h4>
                        <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider">TESDA GPSAT Official Enrollment Card</p>
                      </div>
                    </div>
                    <span className="self-start sm:self-auto bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-400/30 uppercase animate-pulse">
                      Status: Officially Enrolled
                    </span>
                  </div>

                  <div className="p-4 sm:p-6 divide-y divide-gray-150">
                    {enrolledPrograms.map(({ ref, program }) => {
                      // Fallback info if the program is custom-created without schedule defaults
                      const scheduleDays = formatTrainingDays(program?.trainingDays);
                      const timeslot = formatProgramTimeslot(program?.startTime, program?.endTime);
                      const room = program?.room || "Main Training Facility";
                      const instructor = program?.instructor || "TESDA Certified Instructor";
                      const provider = program?.provider || "TESDA Training Center";
                      const location = program?.location || "San Luis, Pampanga";

                      return (
                        <div key={ref.id} className="py-4 first:pt-0 last:pb-0 space-y-3.5">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <h5 className="font-black text-gray-900 text-sm sm:text-base">{ref.programTitle}</h5>
                              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span>{provider}</span>
                              </p>
                            </div>
                            <span className="text-[10px] bg-emerald-50 text-[#0A6B43] border border-emerald-200 px-2.5 py-1 rounded-md font-bold uppercase shrink-0">
                              Enrolled on {ref.applicationDate || ref.referralDate || "Recently"}
                            </span>
                          </div>

                          {/* Grid details */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-gray-50/70 p-3.5 sm:p-4 rounded-xl border border-gray-150">
                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Class Schedule Days</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" /> {scheduleDays}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Class Time & Session</span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-gray-800 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> {timeslot.formattedRange}
                                </p>
                                {timeslot.sessionType !== "Custom" && (
                                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${timeslot.sessionType === "Morning" ? "bg-amber-100 text-amber-900 border border-amber-200" :
                                    timeslot.sessionType === "Afternoon" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                      timeslot.sessionType === "Full Day" ? "bg-emerald-100 text-emerald-900 border border-emerald-200" :
                                        "bg-purple-100 text-purple-900 border border-purple-200"
                                    }`}>
                                    {timeslot.sessionType}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Room / Training Facility</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{room}</span>
                              </p>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Assigned Instructor</span>
                              <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>{instructor}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-600 bg-emerald-50/40 p-3 rounded-xl border border-emerald-150">
                            <p className="font-medium flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span><strong>Campus Location:</strong> {location}</span>
                            </p>
                            {program && (
                              <p className="font-semibold text-emerald-800 flex items-center gap-1.5 flex-wrap">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Contact Coordinator: {program.contactPerson} ({program.contactNumber})</span>
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
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">

                {/* Best Match Card (60%) */}
                {programs.length === 0 ? (
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-3 text-center lg:col-span-3 flex flex-col justify-center items-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-[#0A6B43] mb-1">
                      <Target className="w-6 h-6" />
                    </div>
                    <h4 className="font-extrabold text-gray-800 text-base">No Active TESDA Programs Published Yet</h4>
                    <p className="text-xs text-gray-500 max-w-md leading-relaxed font-medium">
                      There are currently no active training courses published in the system database. As soon as TESDA partners publish new training programs, our Content-Based Filtering (CBF) engine will automatically evaluate your registered skills and display your top match here.
                    </p>
                  </div>
                ) : (
                  (() => {
                    // If member has already completed all available programs matching them
                    if (uncompletedScoredPrograms.length === 0) {
                      return (
                        <div className="bg-linear-to-br from-[#112F24] via-[#164132] to-[#0A6B43] text-white rounded-2xl p-5 sm:p-7 shadow-[0_12px_36px_-6px_rgba(10,107,67,0.3)] space-y-4 sm:space-y-5 lg:col-span-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-amber-400" />
                                  Milestone Achieved
                                </span>
                                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-700">
                                  Step 3 Complete • Certified Graduate
                                </span>
                              </div>
                              <h4 className="font-extrabold text-white text-lg sm:text-2xl tracking-tight">
                                All Matching Qualifications Certified!
                              </h4>
                              <p className="text-xs text-emerald-100 font-medium leading-relaxed max-w-xl mt-1">
                                Outstanding work, {youthProfile.name.split(" ")[0]}! You have successfully completed and attained official certification for all training courses currently aligned with your competencies.
                              </p>
                            </div>
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner self-start sm:self-auto">
                              <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                            </div>
                          </div>

                          {/* Placement & Roadmap Notice */}
                          <div className="bg-white/10 backdrop-blur-xs p-3.5 sm:p-4 rounded-xl border border-white/15 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Active Next Step: Livelihood Placement & Career Launch
                              </span>
                            </div>
                            <p className="text-xs text-emerald-50 leading-relaxed">
                              Your certifications have unlocked <strong>Step 4: Livelihood Placement</strong>. Access your AI-generated 30-day employment roadmap, local micro-grant opportunities, and digital credentials.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 pt-2">
                            <button
                              onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                              className="text-xs font-black px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                            >
                              <Sparkles className="w-4 h-4 text-slate-950" />
                              View Step 4 Career Plan
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setActiveTab(YouthScreen.PROFILE);
                                setProfileActiveTab("badge");
                              }}
                              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white border border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                            >
                              <ShieldCheck className="w-4 h-4 text-emerald-300" />
                              View KK Digital Credential
                            </button>

                            <button
                              onClick={() => setActiveTab(YouthScreen.MATCHES)}
                              className="text-xs font-semibold px-4 py-2.5 rounded-xl text-emerald-200 hover:text-white transition-colors cursor-pointer text-center sm:text-left"
                            >
                              Browse Full Course Directory →
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // Otherwise, pick top uncompleted matching program as the featured upskilling course
                    const topMatchItem = uncompletedScoredPrograms[0];
                    const featuredProg = topMatchItem?.program || programs[0];
                    const featuredScore = topMatchItem?.matchScore ?? calculateContentBasedMatchScore(youthProfile, featuredProg);
                    const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === featuredProg.title);
                    const isCompleted = false; // uncompletedScoredPrograms excludes completed courses
                    const isEnded = isProgramEnded(featuredProg);
                    const isFull = !app && (featuredProg.slotsRemaining !== undefined && featuredProg.slotsRemaining <= 0);

                    const overlapWarning = getOverlapWarning(featuredProg);

                    return (
                      <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 lg:col-span-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-wider text-[#D97706] bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                                {featuredLang === "tl" ? "Tampok na AI Match para sa Iyo" : "Featured AI Match for You"}
                              </span>

                              {/* Language Toggle for OSY */}
                              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-250 text-[10px] font-bold">
                                <button
                                  type="button"
                                  onClick={() => setFeaturedLang("en")}
                                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${featuredLang === "en"
                                    ? "bg-white text-gray-900 shadow-2xs font-extrabold"
                                    : "text-gray-500 hover:text-gray-800"
                                    }`}
                                  title="Basahin sa Ingles (English)"
                                >
                                  English
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFeaturedLang("tl")}
                                  className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${featuredLang === "tl"
                                    ? "bg-[#0A6B43] text-white shadow-2xs font-extrabold"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                                  title="Isalin sa Tagalog"
                                >
                                  <span>🇵🇭</span>
                                  <span>Tagalog</span>
                                </button>
                              </div>
                            </div>
                            <h4 className="font-extrabold text-gray-900 text-base sm:text-lg mt-1 leading-snug">{featuredProg.title}</h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                              <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-150 inline-block">
                                {featuredProg.provider || "TESDA Partner Program"}
                              </span>
                              {isEnded && (
                                <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-purple-600" />
                                  Term Ended
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 self-start sm:self-auto">
                            <FlameMatchScore score={featuredScore} />
                          </div>
                        </div>

                        {isLoadingFeaturedAI ? (
                          <div className="space-y-3.5 animate-in fade-in duration-300">
                            {/* Loading Gemini Match Rationale Skeleton */}
                            <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 text-[#0A6B43] animate-spin" />
                                  <span>{featuredLang === "tl" ? "Sinusuri ang Iyong Profile at Kasanayan..." : "Analyzing Youth Profile & Competencies..."}</span>
                                </span>
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 animate-pulse">
                                  <Sparkles className="w-3 h-3 text-amber-500" />
                                  <span>Google Gemini AI Generating</span>
                                </span>
                              </div>
                              <div className="space-y-2 animate-pulse pt-1">
                                <div className="h-3 bg-emerald-200/70 rounded-full w-full"></div>
                                <div className="h-3 bg-emerald-200/70 rounded-full w-11/12"></div>
                                <div className="h-3 bg-emerald-200/50 rounded-full w-4/5"></div>
                              </div>
                              <p className="text-[11px] text-emerald-900 font-medium italic pt-0.5 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                <span>{featuredLang === "tl"
                                  ? `Bumubuo ang Google Gemini AI ng personalized na payo para sa iyo sa Barangay ${youthProfile.barangay || "San Luis"}...`
                                  : `Google Gemini AI is formulating personalized match advice for your profile in Barangay ${youthProfile.barangay || "San Luis"}...`}</span>
                              </p>
                            </div>

                            {/* Loading 3-Step Pathway Skeleton */}
                            <div className="bg-linear-to-br from-[#F0FDF4] to-[#E8F5EF] p-3.5 sm:p-4 rounded-xl border border-[#9FE1CB]/70 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  <span>{featuredLang === "tl" ? "Inihahanda ang 3 Hakbang na Plano..." : "Building 3-Step Action Plan..."}</span>
                                </span>
                                <span className="text-[10px] font-bold text-gray-400">
                                  {featuredLang === "tl" ? "Saglit lamang..." : "Please wait..."}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {[1, 2, 3].map((step) => (
                                  <div key={step} className="flex items-center gap-2.5 bg-white/70 p-2.5 rounded-xl border border-emerald-100/70 animate-pulse">
                                    <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {step}
                                    </span>
                                    <div className="h-3 bg-emerald-100/90 rounded-full w-3/4"></div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Gemini Match Rationale */}
                            <div className="bg-emerald-50/90 p-3.5 sm:p-4 rounded-xl border border-emerald-200/80 space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                  {featuredLang === "tl" ? "Paliwanag ng Gemini AI sa Kursong Ito" : "Gemini Match Rationale"}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-700/80">
                                  Powered by Google Gemini
                                </span>
                              </div>
                              <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                                &ldquo;{
                                  featuredLang === "tl"
                                    ? (featuredAdviceTl || `Bilang miyembro ng Katipunan ng Kabataan sa Barangay ${youthProfile.barangay || "San Luis"}, si ${youthProfile.name.split(' ')[0]} ay may praktikal na kasanayan sa ${youthProfile.skills.join(", ") || youthProfile.sectorPreference || "mga bokasyonal na gawain"}. Ang kursong ${featuredProg.title} ay magbibigay sa iyo ng opisyal na sertipiko mula sa TESDA upang makapasok sa trabaho sa ${youthProfile.sectorPreference || "napiling hanapbuhay"}.`)
                                    : (liveGeminiAdvice || `As a Katipunan ng Kabataan member from Barangay ${youthProfile.barangay || "San Luis"}, ${youthProfile.name.split(' ')[0]} has practical background skills in ${youthProfile.skills.join(", ") || youthProfile.sectorPreference || "vocational trades"}. This ${featuredProg.title} program will officially certify their qualifications under TESDA and unlock formal job opportunities in ${youthProfile.sectorPreference || "their target industry"}.`)
                                }&rdquo;
                              </p>
                            </div>

                            {/* Personalized 3-Bullet Advice Pathway */}
                            <div className="bg-linear-to-br from-[#F0FDF4] to-[#E8F5EF] p-3.5 sm:p-4 rounded-xl border border-[#9FE1CB]/70 space-y-2.5 shadow-2xs">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  {featuredLang === "tl" ? "3 Hakbang na Plano para sa Iyo" : "Gemini Personalized 3-Step Pathway"}
                                </span>
                                <span className="text-[10px] font-extrabold text-[#D97706] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  {featuredLang === "tl" ? "Plano ng AI" : "AI Action Plan"}
                                </span>
                              </div>
                              <ul className="space-y-2 text-xs text-emerald-950 font-medium">
                                {(featuredLang === "tl"
                                  ? (featuredBulletsTl && featuredBulletsTl.length === 3
                                    ? featuredBulletsTl
                                    : [
                                      `Gamitin ang iyong mga natutunang kasanayan sa ${youthProfile.skills.slice(0, 2).join(" at ") || youthProfile.sectorPreference || "bokasyonal na larangan"} sa simula ng kurso.`,
                                      `Tapusin ang pagsasanay sa ${featuredProg.provider || "TESDA GPSAT"} para makakuha ng pambansang sertipikasyon (NC II).`,
                                      `Gamitin ang tulong ng SK sa Barangay ${youthProfile.barangay || "San Luis"} para makapasok sa trabaho at maabot ang pangarap na "${youthProfile.livelihoodGoal || "matatag na hanapbuhay"}".`
                                    ])
                                  : (liveGeminiBullets && liveGeminiBullets.length === 3
                                    ? liveGeminiBullets
                                    : [
                                      `Leverage your background skills in ${youthProfile.skills.slice(0, 2).join(" & ") || youthProfile.sectorPreference || "vocational trades"} during early course modules.`,
                                      `Successfully complete the certified NC II training at ${featuredProg.provider || "TESDA GPSAT"} to obtain nationwide accredited credentials.`,
                                      `Utilize the support and referrals of the SK in Barangay ${youthProfile.barangay || "San Luis"} to enter employment and achieve your dream of "${youthProfile.livelihoodGoal || "sustainable livelihood"}".`
                                    ])
                                ).map((bullet, bIdx) => (
                                  <li key={bIdx} className="flex items-start gap-2.5 bg-white/80 p-2.5 sm:p-3 rounded-xl border border-emerald-100/80 shadow-2xs">
                                    <span className="w-5 h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center font-extrabold text-[10px] shrink-0 mt-0.5 shadow-2xs">
                                      {bIdx + 1}
                                    </span>
                                    <span className="leading-relaxed text-emerald-950 font-semibold">{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </>
                        )}

                        {featuredProg.requiredDocuments && featuredProg.requiredDocuments.length > 0 && (
                          <div className="bg-amber-50/70 p-3 sm:p-3.5 rounded-xl border border-amber-200">
                            <p className="text-[11px] font-bold text-amber-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Physical Requirements Needed Beforehand:</span>
                            </p>
                            <ul className="list-disc pl-4 text-[10px] text-amber-800 space-y-0.5 font-semibold">
                              {featuredProg.requiredDocuments.map((doc, dIdx) => (
                                <li key={dIdx}>{doc}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-150">
                          <div className="space-y-1">
                            <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <strong>Duration:</strong> {featuredProg.trainingHours} hours</p>
                            <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <strong>Location:</strong> {featuredProg.location}</p>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => setViewingProgramModal({ program: featuredProg, matchScore: featuredScore })}
                              className="w-full sm:w-auto text-xs font-extrabold px-5 py-2.5 rounded-xl bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-emerald-200" />
                              {isEnded ? "View Details (Ended)" : "View Details & Apply"}
                            </button>
                          </div>
                        </div>
                        {overlapWarning && (
                          <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold leading-relaxed flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span><strong>Overlap Warning:</strong> {overlapWarning}</span>
                          </p>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Right Column: Livelihood Status & Skills (40% on lg) */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6 flex flex-col">

                  {/* My Livelihood Status Card */}
                  <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">My Livelihood Status</span>
                        <span className="bg-amber-50 text-amber-700 text-xs font-black px-3 py-1 border border-amber-200 rounded-full uppercase inline-block">
                          {youthProfile.currentStatus}
                        </span>
                      </div>

                      <div className="bg-gray-50/80 rounded-xl p-3.5 space-y-1">
                        <span className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider block">
                          Current active objective
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-[#D97706] leading-snug">
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
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <button
                        onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                        className="w-full bg-[#D97706] hover:bg-amber-700 active:scale-95 text-white text-xs font-bold py-2.5 px-4 rounded-xl text-center transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                      >
                        <span>Track Pathway Progress</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* My Skills Segment */}
                  <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">My Registered Skills</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {youthProfile.skills?.length || 0}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (isUnverified) {
                              addToast("Cannot add skills while account is awaiting SK verification", "error");
                              return;
                            }
                            setShowAddSkillModal(true);
                          }}
                          disabled={isUnverified}
                          className={`text-xs font-bold flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${isUnverified
                            ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                            : "border-amber-200 text-[#D97706] hover:bg-amber-50 active:scale-95 cursor-pointer shadow-2xs"
                            }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Skill
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {youthProfile.skills && youthProfile.skills.length > 0 ? (
                          youthProfile.skills.map((s) => (
                            <span key={s} className="bg-amber-50 text-amber-900 text-xs font-semibold px-2.5 sm:px-3 py-1 rounded-xl border border-amber-200/80 flex items-center gap-1.5 shadow-2xs">
                              <span>{s}</span>
                              <button
                                onClick={() => handleRemoveSkillLocal(s)}
                                disabled={isUnverified}
                                title={`Remove ${s}`}
                                className={`w-4 h-4 flex items-center justify-center rounded-full text-xs font-black transition-colors ${isUnverified ? "text-amber-400 cursor-not-allowed" : "text-amber-700 hover:bg-red-100 hover:text-red-700 cursor-pointer"
                                  }`}
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        ) : (
                          <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center w-full">
                            <p className="text-xs text-gray-400 font-medium">No skills added yet.</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">Tap &ldquo;Add Skill&rdquo; to register your vocational competencies.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-400 mt-4 sm:mt-6 italic leading-relaxed">
                      Tip: Adding more technical or vocational skills updates your compatibility index in real-time.
                    </p>
                  </div>

                </div>

              </div>

              {/* Barangay Announcements Segment */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Sangguniang Kabataan Announcements</span>
                  {localAnnouncements.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                      {localAnnouncements.length} {localAnnouncements.length === 1 ? "Update" : "Updates"}
                    </span>
                  )}
                </div>

                {localAnnouncements.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-[0_6px_25px_rgb(0,0,0,0.05)] text-center flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl border border-amber-100 flex items-center justify-center text-[#D97706]">
                      <Megaphone className="w-6 h-6" />
                    </div>
                    <h5 className="font-extrabold text-gray-800 text-sm">No Active SK Announcements</h5>
                    <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">
                      There are currently no published announcements from Sangguniang Kabataan for Barangay {youthProfile.barangay}. Official youth updates and community notices will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {localAnnouncements.map((ann) => (
                      <div key={ann.id} className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_6px_25px_rgb(0,0,0,0.05)] flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between text-[10px] text-gray-400 mb-2.5 items-center flex-wrap gap-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold uppercase tracking-wide text-[#D97706] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                                {ann.category}
                              </span>
                              {ann.eventDate && (
                                <span className="font-bold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#0A6B43]" />
                                  {ann.eventDate}
                                </span>
                              )}
                            </div>
                            <span className="font-medium">{ann.datePosted}</span>
                          </div>
                          <h5 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{ann.title}</h5>
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{ann.body}</p>

                          {(ann.venue || ann.contactPerson) && (
                            <div className="bg-emerald-50/50 p-2.5 sm:p-3 rounded-xl border border-emerald-100/60 mt-3 space-y-1.5 text-xs">
                              {ann.venue && (
                                <div className="flex items-start sm:items-center gap-1.5 text-gray-700 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5 sm:mt-0" />
                                  <span>Venue: <strong className="text-gray-900">{ann.venue}</strong></span>
                                </div>
                              )}
                              {ann.contactPerson && (
                                <div className="flex items-start sm:items-center gap-1.5 text-gray-700 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5 sm:mt-0" />
                                  <span>Contact: <strong className="text-gray-900">{ann.contactPerson}</strong></span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-4 pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                          <span>Target Audience: <span className="font-semibold text-gray-700">{ann.audience}</span></span>
                          {ann.barangay && (
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 w-fit">
                              Barangay {ann.barangay.replace(/^Barangay\s+/i, "")}
                            </span>
                          )}
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
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Personalized Matches
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Based on your registered competencies, Purok residence, and vocational career goals.
                  </p>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center text-[#0A6B43]">
                    <Target className="w-6 h-6" />
                  </div>
                  <h4 className="font-extrabold text-gray-800 text-base">No Matching TESDA Programs Available Yet</h4>
                  <p className="text-xs text-gray-500 max-w-md font-medium leading-relaxed">
                    There are currently no active training programs published in the system. As soon as TESDA partners publish new courses, the Content-Based Filtering (CBF) system will automatically analyze your profile and display your personalized matches here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {matchesTabPrograms.map(({ program: prog, matchScore: score }) => {

                    return (
                      <div key={prog.id} className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="flex justify-between items-start gap-3">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">{prog.provider}</span>
                                {isProgramEnded(prog) && (
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5 text-purple-600" />
                                    Term Ended
                                  </span>
                                )}
                              </div>
                              <h4 className="font-bold text-gray-800 text-sm mt-1">{prog.title}</h4>
                            </div>
                            <FlameMatchScore score={score} />
                          </div>

                          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                            <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                              Content-Based Filtering (CBF) identified a {score}% compatibility score between your technical competencies and this local program.
                            </p>
                          </div>

                          <div className="space-y-1.5 text-xs text-gray-600">
                            <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span><strong>Location:</strong> {prog.location}</span></p>
                            <p className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span><strong>Duration:</strong> {`${prog.trainingHours} hours`} {(prog.startDate || prog.endDate) ? `(${formatProgramDateRange(prog.startDate, prog.endDate)})` : ""}</span></p>
                            <p className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span><strong>Cost:</strong> {prog.cost}</span></p>
                            <p className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" /> <span><strong>Eligibility:</strong> {prog.eligibility}</span></p>
                          </div>

                          {prog.requiredDocuments && prog.requiredDocuments.length > 0 && (
                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 space-y-1.5">
                              <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>Required Documents Beforehand:</span>
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
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5 font-semibold leading-relaxed flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                  <span><strong>Overlap Warning:</strong> {overlapWarning}</span>
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

                            if (isProgramEnded(prog)) {
                              return (
                                <button
                                  disabled
                                  className="text-xs font-extrabold px-3.5 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 cursor-not-allowed shadow-2xs"
                                  title="This training program's term has ended or is closed"
                                >
                                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                                  Term Ended
                                </button>
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
                                className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-xs ${isUnverified || !!overlapWarning
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
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Your Livelihood Pathway
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Follow these stages to reach your professional career goal successfully.
                  </p>
                </div>
              </div>

              {(() => {
                const userApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name)) || [];
                if (userApps.length === 0) {
                  return (
                    <div className="bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center space-y-4">
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
                      const scheduleDays = formatTrainingDays(program?.trainingDays);
                      const timeslot = formatProgramTimeslot(program?.startTime, program?.endTime);

                      const room = program?.room || "Main Training Facility";
                      const instructor = program?.instructor || "TESDA Certified Instructor";
                      const contactPerson = program?.contactPerson || "TESDA Registrar";
                      const contactNumber = program?.contactNumber || "N/A";
                      const trainingHours = program?.trainingHours ? `${program.trainingHours} hours` : "Standard Duration";
                      const dateRange = (program?.startDate || program?.endDate)
                        ? ` (${formatProgramDateRange(program.startDate, program.endDate)})`
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
                        <div key={app.id} className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden">
                          {/* Top Tag indicating Program - Mobile Optimized Responsive Header */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-gray-100">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold">
                                <Building2 className="w-3 h-3 text-[#0A6B43] shrink-0" />
                                <span className="truncate max-w-[260px] sm:max-w-none">{provider}</span>
                              </span>
                              <h4 className="font-extrabold text-gray-900 text-base sm:text-lg lg:text-xl mt-1.5 leading-snug break-words">
                                {app.programTitle}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-gray-600 font-medium">
                                <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs text-gray-700">
                                  <MapPin className="w-3 h-3 text-[#0A6B43] shrink-0" />
                                  <span>{location}</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200/80 px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs text-gray-700">
                                  <Timer className="w-3 h-3 text-[#0A6B43] shrink-0" />
                                  <span>{trainingHours}</span>
                                </span>
                              </div>
                            </div>

                            {/* Status & Actions - Mobile Optimized Layout */}
                            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 pt-2.5 sm:pt-0 border-t border-gray-100/90 sm:border-0 w-full sm:w-auto shrink-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Status:</span>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full border shadow-2xs ${isArchived
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : isEnrolled
                                    ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                    : isDeclined
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                                  }`}>
                                  {isArchived ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                      <span>Archived (Completed)</span>
                                    </>
                                  ) : isEnrolled ? (
                                    <>
                                      <CheckCircle className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                      <span>Officially Enrolled</span>
                                    </>
                                  ) : isDeclined ? (
                                    <>
                                      <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                      <span>Declined</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                      <span>Pending Approval</span>
                                    </>
                                  )}
                                </span>
                              </div>

                              {isPending && (
                                <button
                                  onClick={() => handleCancelApplication(app.id)}
                                  className="p-1.5 sm:px-2.5 sm:py-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-red-200 flex items-center gap-1 text-[11px] font-bold cursor-pointer ml-auto sm:ml-0"
                                  title="Cancel Application"
                                  id={`cancel-application-header-${app.id}`}
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span className="inline">Cancel Application</span>
                                </button>
                              )}
                              {isDeclined && (
                                <button
                                  onClick={() => handleDeletePathway(app.id)}
                                  className="p-1.5 sm:px-2.5 sm:py-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-red-200 flex items-center gap-1 text-[11px] font-bold cursor-pointer ml-auto sm:ml-0"
                                  title="Delete Declined Pathway"
                                  id={`delete-pathway-header-${app.id}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="inline">Delete Pathway</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {(() => {
                            const hasSavedPlan = Boolean(generatedPlan || currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan));
                            return (
                              <PathwayTimeline
                                currentStep={isArchived ? (hasSavedPlan ? 5 : 4) : isEnrolled ? 3 : 2}
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
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Training Provider:</strong> <span className="text-gray-900 font-bold">{provider}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Location / Campus:</strong> <span className="text-gray-900 font-semibold">{location}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Course Duration:</strong> <span className="text-gray-900 font-semibold">{trainingHours}{dateRange}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Coins className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Program Cost:</strong> <span className="font-bold text-emerald-700">{program?.cost || "100% Free / Subsidized"}</span></span>
                                      </p>
                                    </div>
                                    <div className="space-y-1.5">
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Class Schedule:</strong> <span className="text-gray-900 font-semibold">{scheduleDays}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Training Hours:</strong> <span className="text-gray-900 font-semibold">{timeslot.formattedRange}{timeslot.sessionType !== "Custom" ? ` (${timeslot.sessionType})` : ""}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Building2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Facility / Room:</strong> <span className="text-gray-900 font-semibold">{room}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Trainer / Instructor:</strong> <span className="text-gray-900 font-semibold">{instructor}</span></span>
                                      </p>
                                      <p className="text-gray-600 flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                        <span><strong>Registrar Contact:</strong> <span className="text-gray-900 font-semibold">{contactPerson} ({contactNumber})</span></span>
                                      </p>
                                    </div>
                                  </div>

                                  {/* Action Required: Physical Documents for Verification */}
                                  <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-4 space-y-2.5 text-xs">
                                    <p className="font-extrabold text-amber-950 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                                      <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                      <span>Action Required to Complete Enrollment Verification:</span>
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
                                    <p className="text-[10px] text-red-500 italic font-semibold flex items-center gap-1.5">
                                      <Sparkles className="w-3 h-3 text-red-400 shrink-0" />
                                      <span>You can delete this pathway card to clear your list and explore other matching livelihood programs!</span>
                                    </p>
                                  </div>
                                </div>
                              );
                            } else if (isArchived) {
                              // STEP 4 IS UNLOCKED: Step 3 is completed!
                              const planToShow = generatedPlan || currentSavedPlan || parseCareerPlan(youthProfile.savedCareerPlan);
                              const isSaved = Boolean(planToShow && planToShow.roadmapTitle);
                              const displayPlan = (careerPlanLang === "tl" && planToShow)
                                ? (translatedPlanTl || getFallbackTagalogCareerPlan(planToShow, youthProfile))
                                : planToShow;

                              return (
                                <div className="space-y-5 sm:space-y-6 w-full">
                                  {/* Completion & Step 4 Banner */}
                                  <div className="bg-linear-to-br from-purple-50 via-purple-50/80 to-indigo-50/50 border border-purple-200/90 rounded-2xl p-3.5 sm:p-5 md:p-6 flex items-start gap-3 sm:gap-4 shadow-xs">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs sm:shadow-sm mt-0.5">
                                      <Award className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
                                    </div>
                                    <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] sm:text-[10px] font-black uppercase text-purple-700 bg-purple-100/90 px-2.5 py-0.5 rounded-full border border-purple-200/90 tracking-wider inline-flex items-center gap-1.5 shadow-2xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                          Step 3 Complete • Step 4 Active
                                        </span>
                                      </div>
                                      <h5 className="font-black text-purple-950 text-sm sm:text-base md:text-lg leading-tight tracking-tight">
                                        Training Completed & NC II Certified!
                                      </h5>
                                      <p className="text-xs sm:text-[13px] text-purple-900/90 leading-relaxed font-medium break-words">
                                        Congratulations! You have completed your certified training for <strong className="font-bold text-purple-950">{app.programTitle}</strong> at <strong className="font-bold text-purple-950">{provider}</strong>.
                                      </p>
                                      <div className="pt-0.5">
                                        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-purple-900 bg-purple-100/90 border border-purple-200/80 px-2.5 py-1 rounded-lg">
                                          <Award className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                                          <span>Achieved <strong className="font-extrabold text-purple-950">Step 4: Livelihood Placement & Career Launch</strong></span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Gemini Long-Term Post-Graduation Career Plan Section */}
                                  <div className="bg-linear-to-br from-[#1C2B20] to-[#0A6B43] text-white rounded-2xl p-4 sm:p-6 lg:p-7 shadow-lg border border-emerald-700/60 space-y-5 sm:space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 border-b border-white/15 pb-4">
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse shrink-0" />
                                          <span className="text-[10px] sm:text-xs font-black text-amber-300 uppercase tracking-wider">
                                            Google Gemini AI • Step 4 Career Strategy
                                          </span>
                                          {planToShow && (
                                            <div className="inline-flex items-center rounded-lg bg-black/40 p-0.5 border border-white/20 ml-1">
                                              <button
                                                type="button"
                                                onClick={() => handleToggleCareerPlanLang("en")}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer ${careerPlanLang === "en"
                                                  ? "bg-white text-slate-900 shadow-xs"
                                                  : "text-emerald-200 hover:text-white"
                                                  }`}
                                              >
                                                English
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleToggleCareerPlanLang("tl")}
                                                disabled={isTranslatingPlan}
                                                className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all cursor-pointer flex items-center gap-1 ${careerPlanLang === "tl"
                                                  ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                                                  : "text-emerald-200 hover:text-white"
                                                  }`}
                                              >
                                                {isTranslatingPlan ? (
                                                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                                ) : (
                                                  <span>🇵🇭 Tagalog</span>
                                                )}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <h4 className="text-base sm:text-lg md:text-xl font-black text-white leading-snug">
                                          {displayPlan?.roadmapTitle || (careerPlanLang === "tl" ? "Plano para sa Trabaho at Negosyo" : `Post-Graduation Career Roadmap`)}
                                        </h4>
                                        <p className="text-xs text-emerald-100 font-medium leading-relaxed max-w-2xl">
                                          {displayPlan?.summary || (careerPlanLang === "tl" ? `Praktikal at totoong gabay sa hanapbuhay mula sa ${app.programTitle} patungo sa trabaho o negosyo sa San Luis, Pampanga.` : `A pragmatic, real-life career action plan tailored for your transition from ${app.programTitle} into employment and entrepreneurship in San Luis, Pampanga.`)}
                                        </p>
                                      </div>

                                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto">
                                        {isSaved ? (
                                          <span className="w-full sm:w-auto justify-center px-4 py-2.5 text-xs font-black rounded-xl bg-emerald-800/80 text-emerald-200 border border-emerald-500/40 flex items-center gap-1.5 shadow-xs text-center">
                                            <BookmarkCheck className="w-4 h-4 text-emerald-300" />
                                            {careerPlanLang === "tl" ? "Nai-save na Plano sa Digital ID ✓" : "Saved Official Career Roadmap ✓"}
                                          </span>
                                        ) : planToShow ? (
                                          <button
                                            onClick={() => handleSaveCareerPlanToIDCard(planToShow)}
                                            disabled={isSavingPlan}
                                            className="w-full sm:w-auto justify-center px-4 py-2.5 text-xs font-black rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 transition-all shadow-md flex items-center gap-1.5 cursor-pointer text-center"
                                          >
                                            {isSavingPlan ? (
                                              <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                {careerPlanLang === "tl" ? "Sine-save..." : "Saving..."}
                                              </>
                                            ) : (
                                              <>
                                                <Bookmark className="w-3.5 h-3.5" />
                                                {careerPlanLang === "tl" ? "I-save sa Digital ID Card" : "Save Plan to Digital ID Card"}
                                              </>
                                            )}
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleGenerateCareerPlan(program)}
                                            disabled={isGeneratingPlan}
                                            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white hover:bg-gray-100 active:scale-95 text-slate-900 text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer text-center"
                                          >
                                            {isGeneratingPlan ? (
                                              <>
                                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0A6B43]" />
                                                {careerPlanLang === "tl" ? "Bumubuo ng plano ang Gemini..." : "Gemini is generating plan..."}
                                              </>
                                            ) : (
                                              <>
                                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                                {careerPlanLang === "tl" ? "Gumawa ng Plano sa Gemini AI" : "Generate Gemini Post-Graduation Career Plan"}
                                              </>
                                            )}
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Display Generated Plan Content */}
                                    {planToShow && displayPlan ? (
                                      <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                                        {/* Phase 1: Immediate 30 Days */}
                                        <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 sm:p-4.5 border border-white/15 space-y-2.5">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 rounded-md">
                                              {careerPlanLang === "tl" ? "Yugto 1 • Unang 30 Araw" : "Phase 1 • First 30 Days"}
                                            </span>
                                            <h6 className="font-extrabold text-white text-xs uppercase tracking-wider">
                                              {careerPlanLang === "tl" ? "Mga Sertipiko at Pagpaparehistro sa Trabaho" : "Credentialing & Jobseeker Registration"}
                                            </h6>
                                          </div>
                                          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                                            {displayPlan.immediate30Days.map((stepItem: string, sIdx: number) => (
                                              <li key={sIdx} className="bg-black/25 p-3 rounded-xl border border-white/10 text-xs text-emerald-50 leading-relaxed flex items-start gap-2.5 font-medium">
                                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 shadow-2xs">
                                                  {sIdx + 1}
                                                </span>
                                                <span className="leading-snug">{stepItem}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>

                                        {/* Phase 2: Dual Pathways (Wage Employment & Local Entrepreneurship) */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
                                          {/* Track A: Wage Employment */}
                                          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 sm:p-4.5 border border-white/15 space-y-3 flex flex-col justify-between">
                                            <div className="space-y-2.5">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/10">
                                                <span className="text-[10px] font-black uppercase text-cyan-300 bg-cyan-400/20 border border-cyan-300/30 px-2 py-0.5 rounded-md w-fit">
                                                  {careerPlanLang === "tl" ? "Opsyon A • Trabaho at Suweldo" : "Track A • Wage Employment"}
                                                </span>
                                                <span className="text-[11px] font-extrabold text-emerald-300 bg-emerald-500/15 border border-emerald-400/25 px-2.5 py-0.5 rounded-md flex items-center gap-1 w-fit">
                                                  <Coins className="w-3 h-3 text-emerald-300 shrink-0" />
                                                  <span>{displayPlan.employmentTrack.estimatedSalary}</span>
                                                </span>
                                              </div>
                                              <p className="text-xs text-emerald-100 font-medium leading-relaxed flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                                <span><strong>{careerPlanLang === "tl" ? "Lugar na Pwedeng Aplayan:" : "Target Placement:"}</strong> {displayPlan.employmentTrack.targetLocations}</span>
                                              </p>
                                              <div className="space-y-1.5">
                                                <span className="text-[10px] font-bold text-gray-300 uppercase block tracking-wider">
                                                  {careerPlanLang === "tl" ? "Mga Trabahong Bagay Sayo:" : "Recommended Entry Job Roles:"}
                                                </span>
                                                <div className="flex flex-wrap gap-1.5">
                                                  {displayPlan.employmentTrack.targetRoles.map((role: string, rIdx: number) => (
                                                    <span key={rIdx} className="text-[11px] font-bold bg-white/15 px-2.5 py-1 rounded-lg text-white border border-white/10 shadow-2xs flex items-center gap-1.5">
                                                      <Briefcase className="w-3 h-3 text-cyan-300 shrink-0" />
                                                      <span>{role}</span>
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="pt-2.5 border-t border-white/10 space-y-1.5 text-xs text-emerald-100">
                                              {displayPlan.employmentTrack.actionSteps.map((step: string, stIdx: number) => (
                                                <p key={stIdx} className="flex items-start gap-2 text-[11px] sm:text-xs leading-relaxed">
                                                  <span className="text-emerald-400 font-bold shrink-0 mt-0.5">✓</span>
                                                  <span>{step}</span>
                                                </p>
                                              ))}
                                            </div>
                                          </div>

                                          {/* Track B: Entrepreneurship & Freelancing */}
                                          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3.5 sm:p-4.5 border border-white/15 space-y-3 flex flex-col justify-between">
                                            <div className="space-y-2.5">
                                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/10">
                                                <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-400/20 border border-amber-300/30 px-2 py-0.5 rounded-md w-fit">
                                                  {careerPlanLang === "tl" ? "Opsyon B • Sariling Negosyo at Raket" : "Track B • Self-Employment & Freelance"}
                                                </span>
                                                <span className="text-[11px] font-bold text-amber-200 bg-amber-400/15 border border-amber-300/25 px-2.5 py-0.5 rounded-md flex items-center gap-1.5 w-fit">
                                                  <Wrench className="w-3 h-3 text-amber-300 shrink-0" />
                                                  <span>{careerPlanLang === "tl" ? "May Paunang Tulong / Puhunan" : "Starter Grants Available"}</span>
                                                </span>
                                              </div>
                                              <p className="text-xs text-emerald-100 font-medium leading-relaxed flex items-center gap-1">
                                                <Store className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                                <span><strong>{careerPlanLang === "tl" ? "Ideya sa Negosyo:" : "Business Concept:"}</strong> {displayPlan.entrepreneurshipTrack.businessConcept}</span>
                                              </p>
                                              <div className="bg-amber-400/10 p-2.5 sm:p-3 rounded-xl border border-amber-300/20">
                                                <p className="text-xs text-amber-100 leading-relaxed font-medium flex items-center gap-1">
                                                  <Gift className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                                  <span><strong>{careerPlanLang === "tl" ? "Tulong Pinansyal at Puhunan:" : "Funding & Grants:"}</strong> {displayPlan.entrepreneurshipTrack.starterFunding}</span>
                                                </p>
                                              </div>
                                            </div>
                                            <div className="pt-2.5 border-t border-white/10 space-y-1.5">
                                              <span className="text-[10px] font-bold text-gray-300 uppercase block tracking-wider">
                                                {careerPlanLang === "tl" ? "Mga Serbisyo o Produktong Pwedeng Simulan:" : "Initial Services to Offer:"}
                                              </span>
                                              {displayPlan.entrepreneurshipTrack.initialServices.map((srv: string, sIdx: number) => (
                                                <p key={sIdx} className="text-[11px] sm:text-xs text-emerald-100 flex items-start gap-2 font-medium leading-relaxed">
                                                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
                                                  <span>{srv}</span>
                                                </p>
                                              ))}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Phase 3 & Local Support Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 text-xs bg-black/25 p-3.5 sm:p-4.5 rounded-xl border border-white/10">
                                          <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1.5">
                                              <TrendingUp className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                                              <span>{careerPlanLang === "tl" ? "1–2 Taon na Pag-asenso sa Karera:" : "1–2 Year Long-Term Elevation:"}</span>
                                            </span>
                                            {displayPlan.longTerm1To2Years.map((milestone: string, mIdx: number) => (
                                              <p key={mIdx} className="text-emerald-100 flex items-start gap-2 leading-relaxed font-medium text-[11px] sm:text-xs">
                                                <span className="text-purple-400 shrink-0 mt-0.5">◆</span>
                                                <span>{milestone}</span>
                                              </p>
                                            ))}
                                          </div>
                                          <div className="space-y-2">
                                            <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider flex items-center gap-1.5">
                                              <Handshake className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                              <span>{careerPlanLang === "tl" ? "Mga Malalapit na Tanggapan sa San Luis:" : "Local Support Contacts in San Luis:"}</span>
                                            </span>
                                            {displayPlan.localSupportContacts.map((contact: string, cIdx: number) => (
                                              <p key={cIdx} className="text-emerald-100 flex items-start gap-2 leading-relaxed font-medium text-[11px] sm:text-xs">
                                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                                <span>{contact}</span>
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 sm:py-8 space-y-3 bg-black/20 rounded-xl border border-dashed border-white/20 p-4 sm:p-6">
                                        <Sparkles className="w-9 h-9 sm:w-10 sm:h-10 text-amber-400 mx-auto animate-pulse" />
                                        <h5 className="font-extrabold text-white text-sm sm:text-base leading-snug">
                                          Your Training is Certified! Ready to Build Your Post-Graduation Career Plan?
                                        </h5>
                                        <p className="text-xs text-emerald-100 max-w-lg mx-auto leading-relaxed font-medium">
                                          Click the button below to have Google Gemini AI analyze your completed <strong>{app.programTitle}</strong> credentials and build a real-life wage employment & local entrepreneurship plan in San Luis, Pampanga.
                                        </p>
                                        <button
                                          onClick={() => handleGenerateCareerPlan(program)}
                                          disabled={isGeneratingPlan}
                                          className="w-full sm:w-auto mt-3 px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center justify-center gap-2"
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
                                      <School className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                      <span>Active Academic & Class Schedule:</span>
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
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Class Hours & Session</span>
                                          <span className="text-xs font-bold text-gray-800">
                                            {timeslot.formattedRange}{timeslot.sessionType !== "Custom" ? ` (${timeslot.sessionType})` : ""}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                                        <div>
                                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Room / Lab</span>
                                          <span className="text-xs font-bold text-gray-800">{room} ({location})</span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                                        <User className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
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
              {/* Profile Hero & Identity Card */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 80% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Botanical Plant Leaves */}
                <GrowthPlantAnimation />

                {/* Identity Header Content */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                    {/* Avatar Initials Badge with Verification Indicator & Profile Picture Upload */}
                    <div className="relative shrink-0 group">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-[#0A6B43] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg border-2 border-emerald-300/40 relative overflow-hidden">
                        {profilePictureUrl ? (
                          <img
                            src={profilePictureUrl}
                            alt={youthProfile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : youthProfile.name ? (
                          youthProfile.name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase())
                            .join("")
                        ) : (
                          "KK"
                        )}

                        {/* Hover / Active Change Photo Overlay */}
                        <label
                          htmlFor="hero-profile-pic-input"
                          className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white"
                          title="Change Profile Picture"
                        >
                          {isUploadingPic ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-5 h-5 text-emerald-300" />
                              <span className="text-[9px] font-black tracking-wider uppercase mt-0.5 text-white">Change</span>
                            </>
                          )}
                        </label>
                        <input
                          id="hero-profile-pic-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePictureUpload}
                          disabled={isUploadingPic}
                        />
                      </div>

                      {/* Verification Badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md z-10"
                        title={youthProfile.approvalStatus === "Approved" ? "Verified KK Member" : "Verification Pending"}
                      >
                        {youthProfile.approvalStatus === "Approved" ? (
                          <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </div>

                    {/* Member Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-black text-xl sm:text-2xl lg:text-3xl text-white tracking-tight leading-tight">
                          {youthProfile.name}
                        </h2>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                            youthProfile.approvalStatus === "Approved"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                              : youthProfile.approvalStatus === "Rejected"
                              ? "bg-red-500/20 text-red-300 border-red-400/40"
                              : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 shrink-0" />
                          <span>
                            {youthProfile.approvalStatus === "Approved"
                              ? "Verified KK Member"
                              : youthProfile.approvalStatus === "Rejected"
                              ? "Declined"
                              : "Pending Verification"}
                          </span>
                        </span>
                      </div>

                      {/* Location & Status Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-100/90 font-medium">
                        <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                          <MapPin className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span>Barangay {youthProfile.barangay || "San Luis"} • {youthProfile.purok || "Purok 1"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-md backdrop-blur-xs">
                          <GraduationCap className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span>{youthProfile.currentStatus || "Youth Resident"}</span>
                        </span>
                      </div>

                      {/* Quick Contact & Demographics Strip */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-emerald-100/80 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span>{youthProfile.contactNumber || "No phone"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-none">{currentUser?.email || youthProfile.email || "No email"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-300 shrink-0" />
                          <span>Age: {youthProfile.age} yrs</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Digital ID Action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t border-white/10 sm:border-0">
                    <button
                      type="button"
                      onClick={() => setProfileActiveTab("badge")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-[#0A6B43] hover:bg-emerald-50 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      <span>View Official Digital ID</span>
                    </button>
                    <span className="text-[10px] text-emerald-200/70 font-semibold hidden sm:inline">
                      Official SK LGU Credential
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div className="flex items-center overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <div
                  className="inline-flex items-center gap-1.5 sm:gap-2 bg-white p-1.5 sm:p-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] shrink-0"
                >
                  {[
                    { id: "profile", label: "Personal Details", icon: User },
                    { id: "skills", label: "Skills & Competencies", icon: Award },
                    { id: "security", label: "Security & Password", icon: Lock },
                    { id: "notifications", label: "Alerts & Notifications", icon: Bell },
                    { id: "badge", label: "Digital ID Card", icon: ShieldCheck },
                  ].map((tab) => {
                    const isActive = profileActiveTab === tab.id;
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setProfileActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all duration-200 ease-out select-none ${
                          isActive
                            ? "bg-[#0A6B43] text-white shadow-xs"
                            : "bg-transparent text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50/70"
                        }`}
                      >
                        <IconComponent
                          fill={isActive ? "currentColor" : "none"}
                          className={`w-4 h-4 shrink-0 transition-all duration-200 ease-out ${
                            isActive
                              ? `text-white ${
                                  tab.id === "security"
                                    ? "[&>path]:fill-none"
                                    : tab.id === "badge"
                                    ? "[&>path:last-child]:stroke-[#0A6B43] [&>path:last-child]:fill-none"
                                    : ""
                                }`
                              : "text-gray-500 hover:text-[#0A6B43]"
                          }`}
                        />
                        <span className="transition-colors duration-200 ease-out">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {/* Sub-Tab 1: Personal Details Dossier */}
                {profileActiveTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start pb-24"
                  >
                    {/* Left Column: Personal Dossier Info or Active Edit Form */}
                    <div className="lg:col-span-3 bg-white rounded-2xl p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                      {!isEditingProfile ? (
                        /* Read-Only Dossier Mode */
                        <div className="space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div>
                              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                                <User className="w-4.5 h-4.5 text-[#0A6B43]" />
                                Personal Demographics & Profile
                              </h3>
                              <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Official member record registered with Katipunan ng Kabataan
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (isUnverified) {
                                  addToast("Cannot edit profile details while awaiting SK Verification", "error");
                                  return;
                                }
                                setIsEditingProfile(true);
                              }}
                              disabled={isUnverified}
                              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
                                isUnverified ? "bg-gray-300 cursor-not-allowed" : "bg-[#0A6B43] hover:bg-[#075332]"
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit Details</span>
                            </button>
                          </div>

                          {/* Basic Information Dossier */}
                          <div className="space-y-2.5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                              Basic Demographics
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Full Name</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.name}</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Login Email</span>
                                <p className="text-sm font-bold text-slate-800 truncate" title={currentUser?.email || youthProfile.email || "Registered Email"}>
                                  {currentUser?.email || youthProfile.email || "Registered Email"}
                                </p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Contact Phone</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.contactNumber || "Not recorded"}</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Date of Birth</span>
                                <p className="text-sm font-bold text-slate-800">
                                  {youthProfile.birthdate
                                    ? (() => {
                                        try {
                                          const d = new Date(youthProfile.birthdate);
                                          return isNaN(d.getTime()) ? String(youthProfile.birthdate) : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                                        } catch {
                                          return String(youthProfile.birthdate);
                                        }
                                      })()
                                    : "Not recorded"}
                                </p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Age</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.age} years old</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Sex / Gender</span>
                                <p className="text-sm font-bold text-slate-800">{spellOutGender(youthProfile.gender) || "Not recorded"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Residence & Location */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                              Residence & Location
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Barangay</span>
                                <p className="text-sm font-bold text-slate-800">Barangay {youthProfile.barangay || "San Luis"}</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Purok / Zone</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.purok || "Purok 1"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Education & Employment Profile */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                              Education & Employment Profile
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Educational Attainment</span>
                                <p className="text-sm font-bold text-slate-800">{normalizeEducationalAttainment(youthProfile.educationalAttainment) || "High School"}</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Current Status</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.currentStatus || "Out-of-School Youth"}</p>
                              </div>
                              <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70 space-y-1 sm:col-span-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Preferred Vocational Sector</span>
                                <p className="text-sm font-bold text-slate-800">{youthProfile.sectorPreference || "General / Multi-Sector"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Special Inclusivity Badges */}
                          <div className="space-y-2.5 pt-1">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                              Special Inclusivity & Priority Classifications
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className={`p-3 rounded-xl border flex items-center justify-between ${youthProfile.soloParent ? "bg-purple-50/80 border-purple-200 text-purple-900" : "bg-slate-50/60 border-slate-200/60 text-slate-400"}`}>
                                <span className="text-xs font-bold">Solo Parent</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${youthProfile.soloParent ? "bg-purple-200/70 text-purple-800" : "bg-slate-200/60 text-slate-500"}`}>
                                  {youthProfile.soloParent ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className={`p-3 rounded-xl border flex items-center justify-between ${youthProfile.pwd ? "bg-blue-50/80 border-blue-200 text-blue-900" : "bg-slate-50/60 border-slate-200/60 text-slate-400"}`}>
                                <span className="text-xs font-bold">PWD (Disability)</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${youthProfile.pwd ? "bg-blue-200/70 text-blue-800" : "bg-slate-200/60 text-slate-500"}`}>
                                  {youthProfile.pwd ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className={`p-3 rounded-xl border flex items-center justify-between ${youthProfile.indigenous ? "bg-amber-50/80 border-amber-200 text-amber-900" : "bg-slate-50/60 border-slate-200/60 text-slate-400"}`}>
                                <span className="text-xs font-bold">Indigenous (IP)</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${youthProfile.indigenous ? "bg-amber-200/70 text-amber-800" : "bg-slate-200/60 text-slate-500"}`}>
                                  {youthProfile.indigenous ? "Yes" : "No"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Edit Form Mode */
                        <form onSubmit={handleSaveProfileDetails} className="space-y-6">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              <Edit className="w-4.5 h-4.5 text-[#0A6B43]" />
                              Edit Profile Details
                            </h3>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Discard
                            </button>
                          </div>

                          {/* Section 1: Basic Information */}
                          <div className="space-y-3.5">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Basic Information
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Full Name</label>
                                <input type="text" disabled value={youthProfile.name} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Account Login Email</label>
                                <input type="email" disabled value={currentUser?.email || youthProfile.email || "Registered Email"} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Date of Birth *</label>
                                <SiKapDatePicker
                                  value={editBirthdate}
                                  onChange={handleDOBChange}
                                  disabled={!isEditingProfile || isUnverified}
                                  max={new Date().toISOString().split("T")[0]}
                                  placeholder="Select date of birth"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Age (Years Old)</label>
                                <input
                                  type="number"
                                  disabled
                                  readOnly
                                  value={editAge || (editBirthdate ? calculateAge(editBirthdate) : youthProfile.age) || ""}
                                  className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default"
                                  title="Age is automatically determined from your Date of Birth"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Sex / Gender *</label>
                                <CustomSelect
                                  disabled={!isEditingProfile || isUnverified}
                                  value={editGender}
                                  onChange={(val) => setEditGender(val)}
                                  options={[
                                    { value: "Male", label: "Male" },
                                    { value: "Female", label: "Female" }
                                  ]}
                                  size="md"
                                  placeholder="Select Gender"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Contact Phone Number *</label>
                                <input
                                  type="text"
                                  required
                                  disabled={!isEditingProfile || isUnverified}
                                  value={editPhone}
                                  onChange={(e) => setEditPhone(formatContactNumber(e.target.value))}
                                  className={`w-full p-2.5 border rounded-lg text-sm font-medium transition-colors ${isEditingProfile
                                    ? "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                    : "bg-gray-50 border-gray-200 text-gray-500 cursor-default"
                                    }`}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 2: Residence & Location */}
                          <div className="space-y-3.5 pt-1">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Residence & Location
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Registered Barangay</label>
                                <input type="text" disabled value={`Barangay ${youthProfile.barangay || "San Luis"}`} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-sm cursor-default" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Purok / Zone *</label>
                                <CustomSelect
                                  disabled={!isEditingProfile || isUnverified}
                                  value={editPurok}
                                  onChange={(val) => setEditPurok(val)}
                                  options={["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6", "Purok 7"]}
                                  size="md"
                                  placeholder="Select Purok"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 3: Education & Background */}
                          <div className="space-y-3.5 pt-1">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Education & Employment Profile
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Educational Attainment *</label>
                                <CustomSelect
                                  disabled={!isEditingProfile || isUnverified}
                                  value={normalizeEducationalAttainment(editEdu)}
                                  onChange={(val) => setEditEdu(val)}
                                  options={EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))}
                                  size="md"
                                  placeholder="Select Educational Attainment"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Current Youth Status *</label>
                                <CustomSelect
                                  disabled={!isEditingProfile || isUnverified}
                                  value={editStatus}
                                  onChange={(val) => setEditStatus(val)}
                                  options={[
                                    { value: "Out-of-school", label: "Out-of-School Youth (OSY)" },
                                    { value: "In-school", label: "In-School Youth" },
                                    { value: "Employed", label: "Employed" },
                                    { value: "Self-employed", label: "Self-Employed / Freelance" },
                                    { value: "Unemployed", label: "Unemployed Jobseeker" },
                                    { value: "Working Student", label: "Working Student" },
                                    { value: "Graduate", label: "TVET / College Graduate" }
                                  ]}
                                  size="md"
                                  placeholder="Select Status"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Preferred Vocational Sector *</label>
                                <CustomSelect
                                  disabled={!isEditingProfile || isUnverified}
                                  value={editSector}
                                  onChange={(val) => setEditSector(val)}
                                  options={[
                                    "Information & Communications Technology (ICT)",
                                    "IT & Digital",
                                    "Agriculture, Forestry and Fishery",
                                    "Automotive and Land Transportation",
                                    "Construction",
                                    "Electrical and Electronics",
                                    "Heating, Ventilation, Airconditioning and Refrigeration (HVAC/R)",
                                    "Heavy Equipment Operation",
                                    "Metals and Engineering / Welding",
                                    "Process Food and Beverages / Culinary",
                                    "Tourism / Hotel and Restaurant Services",
                                    "Social, Community Development and other Services / Caregiving",
                                    "Human Health / Health Care",
                                    "Visual and Performing Arts / Creative",
                                    "Garments and Textiles",
                                    "Wholesale and Retail / Sales",
                                    "Logistics and Warehousing",
                                    "Maritime",
                                    "Utilities / Solar Power",
                                    "Language and Culture",
                                    "Entrepreneurship & Management",
                                    "General / Multi-Sector"
                                  ]}
                                  size="md"
                                  placeholder="Select Vocational Sector"
                                  buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section 4: Special Inclusivity & Priority Classifications */}
                          <div className="space-y-3.5 pt-1">
                            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                              <Heart className="w-3.5 h-3.5 text-[#0A6B43]" />
                              Special Inclusivity & Priority Classifications
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <label className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                                } ${editSoloParent ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                                }`}>
                                <input
                                  type="checkbox"
                                  disabled={!isEditingProfile || isUnverified}
                                  checked={editSoloParent}
                                  onChange={(e) => setEditSoloParent(e.target.checked)}
                                  className="w-4.5 h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                                />
                                <span className="text-sm font-medium">Solo Parent</span>
                              </label>

                              <label className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                                } ${editPwd ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                                }`}>
                                <input
                                  type="checkbox"
                                  disabled={!isEditingProfile || isUnverified}
                                  checked={editPwd}
                                  onChange={(e) => setEditPwd(e.target.checked)}
                                  className="w-4.5 h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                                />
                                <span className="text-sm font-medium">PWD (Disability)</span>
                              </label>

                              <label className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                                } ${editIndigenous ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                                }`}>
                                <input
                                  type="checkbox"
                                  disabled={!isEditingProfile || isUnverified}
                                  checked={editIndigenous}
                                  onChange={(e) => setEditIndigenous(e.target.checked)}
                                  className="w-4.5 h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                                />
                                <span className="text-sm font-medium">Indigenous (IP)</span>
                              </label>
                            </div>
                          </div>

                          <div className="pt-2 flex justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSavingProfile}
                              className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSavingProfile || isUnverified}
                              className={`px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer ${isUnverified ? "bg-gray-300 cursor-not-allowed" : "bg-[#0A6B43] hover:bg-[#075332]"
                                }`}
                            >
                              {isSavingProfile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Save Profile Changes
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Right Column: Summary & Verification Card */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Profile Photo Management Card */}
                      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-sm space-y-4">
                        <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                            <Camera className="w-4.5 h-4.5 text-[#0A6B43]" />
                            Official Profile Picture
                          </h4>
                          {profilePictureUrl && (
                            <span className="text-[11px] font-bold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-[#0A6B43] flex items-center justify-center text-white font-black text-2xl shadow-md border-2 border-emerald-200 overflow-hidden shrink-0">
                            {profilePictureUrl ? (
                              <img
                                src={profilePictureUrl}
                                alt={youthProfile.name}
                                className="w-full h-full object-cover"
                              />
                            ) : youthProfile.name ? (
                              youthProfile.name
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((n) => n[0]?.toUpperCase())
                                .join("")
                            ) : (
                              "KK"
                            )}
                            {isUploadingPic && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <label
                                htmlFor="tab-profile-pic-input"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0A6B43] text-white hover:bg-[#075332] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{profilePictureUrl ? "Change Photo" : "Upload Photo"}</span>
                              </label>
                              <input
                                id="tab-profile-pic-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePictureUpload}
                                disabled={isUploadingPic}
                              />

                              {profilePictureUrl && (
                                <button
                                  type="button"
                                  onClick={handleRemoveProfilePicture}
                                  disabled={isUploadingPic}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Remove</span>
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                              Square JPEG, PNG, or WebP. Auto-optimized for Katipunan ng Kabataan Digital ID & official records.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-sm">
                        <div className="border-b border-gray-100 pb-3">
                          <h4 className="font-bold text-gray-800 flex items-center gap-2 text-base">
                            <ShieldCheck className="w-4.5 h-4.5 text-[#0A6B43]" />
                            Membership & Verification
                          </h4>
                        </div>

                        <div className="flex justify-between items-center py-3.5 border-b border-gray-100">
                          <span className="text-gray-500 font-medium">SK Verification:</span>
                          <span className={`font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${youthProfile.approvalStatus === "Approved"
                            ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                            : youthProfile.approvalStatus === "Rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                            {youthProfile.approvalStatus === "Approved" ? "VERIFIED KK MEMBER" : youthProfile.approvalStatus === "Rejected" ? "DECLINED" : "PENDING VERIFICATION"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-3.5 border-b border-gray-100">
                          <span className="text-gray-500 font-medium">Registered Date:</span>
                          <span className="font-medium text-gray-700">{youthProfile.registeredDate || "Registered"}</span>
                        </div>

                        <div className="flex justify-between items-center py-3.5 border-b border-gray-100">
                          <span className="text-gray-500 font-medium">Verified Date:</span>
                          <span className="font-medium text-gray-700">
                            {youthProfile.approvalStatus === "Approved"
                              ? ((youthProfile as any).approvalDate || (youthProfile as any).verifiedDate || youthProfile.registeredDate || "Verified")
                              : "Pending Approval"}
                          </span>
                        </div>

                        {/* Special Badges */}
                        {(youthProfile.soloParent || youthProfile.pwd || youthProfile.indigenous) && (
                          <div className="py-3.5 border-b border-gray-100 flex justify-between items-center">
                            <span className="text-gray-500 font-medium text-xs">Priority Classification:</span>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {youthProfile.soloParent && (
                                <span className="bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                                  Solo Parent
                                </span>
                              )}
                              {youthProfile.pwd && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                                  PWD
                                </span>
                              )}
                              {youthProfile.indigenous && (
                                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                                  Indigenous (IP)
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Submitted Government ID Details */}
                        <div className="pt-3.5 space-y-2.5">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Submitted Verification ID</span>
                          <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-medium">ID Type:</span>
                              <span className="font-medium text-gray-800 text-right">{youthProfile.verificationIdType || "Government / Student ID"}</span>
                            </div>

                            {youthProfile.verificationIdNumber && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 font-medium">ID Number:</span>
                                <span className="font-medium text-gray-800 text-right font-mono text-xs">
                                  {youthProfile.verificationIdNumber}
                                </span>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-medium">ID Photo Attached:</span>
                              {youthProfile.verificationIdImage ? (
                                <div
                                  className="w-16 h-11 rounded-lg bg-gray-200 overflow-hidden border border-gray-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center"
                                  onClick={() => setShowIdPhotoModal(true)}
                                  title="Click to view full ID photo"
                                >
                                  <img
                                    src={youthProfile.verificationIdImage}
                                    alt="ID Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">No image submitted</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fast Link to Digital ID Card */}
                        <div className="pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setProfileActiveTab("badge")}
                            className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] border border-emerald-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                            <span>View Official Digital ID Card</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sub-Tab 2: Skills, Interests & Prior Experiences - Balanced 2-Column Grid */}
                {profileActiveTab === "skills" && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="space-y-6 pb-24"
                  >
                    {/* Top: Livelihood & Career Goal Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              <Target className="w-4.5 h-4.5 text-[#0A6B43]" />
                              Livelihood & Career Goal
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              15% Match Weight
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 font-medium mt-0.5">
                            Your overarching career aspiration or livelihood ambition
                          </p>
                        </div>
                        {!isEditingGoal ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (isUnverified) {
                                addToast("Cannot edit career goal while awaiting SK Verification", "error");
                                return;
                              }
                              setIsEditingGoal(true);
                            }}
                            disabled={isUnverified}
                            className={`px-4 py-2 h-9 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            <Edit className="w-4 h-4" />
                            Edit Goal
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCareerGoalInput(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
                                setIsEditingGoal(false);
                              }}
                              disabled={isSavingGoal}
                              className="px-4 py-2 h-9 min-w-[100px] rounded-lg text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveCareerGoal}
                              disabled={isSavingGoal || isUnverified}
                              className="px-4 py-2 h-9 min-w-[100px] bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isSavingGoal ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Save Goal
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {isEditingGoal ? (
                          <textarea
                            rows={3}
                            required
                            value={careerGoalInput}
                            onChange={(e) => setCareerGoalInput(e.target.value)}
                            placeholder="Describe your career aspiration or livelihood goal..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 shadow-2xs focus:outline-hidden"
                          />
                        ) : (
                          <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-gray-800 text-sm leading-relaxed font-medium">
                            {youthProfile.goalRaw || youthProfile.livelihoodGoal ? (
                              <span>{youthProfile.goalRaw || youthProfile.livelihoodGoal}</span>
                            ) : (
                              <span className="italic text-gray-400">No career goal specified yet. Click &quot;Edit Goal&quot; to define your livelihood aspiration.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle: 2-Column Balanced Grid: Skills + Interests */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 1. Competency Skills & Qualifications Card */}
                      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <Award className="w-4.5 h-4.5 text-amber-500" />
                                Competency Skills
                              </h3>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                50% Match Weight
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Scored directly by the CBF AI matching engine</p>
                          </div>

                          {/* Add Skill Inline Input */}
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              disabled={isUnverified}
                              placeholder={isUnverified ? "Awaiting verification..." : "e.g. Baking, Basic Computing..."}
                              value={newSkillInput}
                              onChange={(e) => setNewSkillInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (isUnverified) {
                                    addToast("Cannot add skills while account is awaiting SK verification", "error");
                                    return;
                                  }
                                  handleAddSkillSubmit();
                                }
                              }}
                              className={`flex-1 px-3 py-2 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                            />
                            <button
                              type="button"
                              disabled={isUnverified}
                              onClick={() => {
                                if (isUnverified) {
                                  addToast("Cannot add skills while account is awaiting SK verification", "error");
                                  return;
                                }
                                handleAddSkillSubmit();
                              }}
                              className={`px-4 py-2 h-10 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>

                          {/* Active Registered Skills Tags */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {youthProfile.skills && youthProfile.skills.length > 0 ? (
                              youthProfile.skills.map((s) => (
                                <span key={s} className="bg-amber-50 text-amber-900 text-xs font-bold px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                                  <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
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
                                    className="font-bold text-xs text-amber-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                                    title="Remove skill"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 italic font-medium py-1">No competency skills added yet.</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 2. Vocational Interests & Sector Preferences Card */}
                      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 flex flex-col justify-between">
                        <div className="space-y-4">
                          <div className="border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                                <Compass className="w-4.5 h-4.5 text-[#0A6B43]" />
                                Vocational Interests
                              </h3>
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                20% Match Weight
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Fields and industries you are passionate about</p>
                          </div>

                          {/* Add Preference Inline Input */}
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              disabled={isUnverified}
                              placeholder={isUnverified ? "Awaiting verification..." : "e.g. Graphic Design, Web Dev..."}
                              value={newPrefInput}
                              onChange={(e) => setNewPrefInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (isUnverified) {
                                    addToast("Cannot add interests while account is awaiting SK verification", "error");
                                    return;
                                  }
                                  handleAddPreference(newPrefInput);
                                }
                              }}
                              className={`flex-1 px-3 py-2 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                            />
                            <button
                              type="button"
                              disabled={isUnverified}
                              onClick={() => {
                                if (isUnverified) {
                                  addToast("Cannot add interests while account is awaiting SK verification", "error");
                                  return;
                                }
                                handleAddPreference(newPrefInput);
                              }}
                              className={`px-4 py-2 h-10 bg-[#0A6B43] hover:bg-[#075332] text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {(youthProfile.preferencesRaw && youthProfile.preferencesRaw.length > 0 ? youthProfile.preferencesRaw : (youthProfile.interests || [])).length > 0 ? (
                              (youthProfile.preferencesRaw && youthProfile.preferencesRaw.length > 0 ? youthProfile.preferencesRaw : (youthProfile.interests || [])).map((pref) => (
                                <span key={pref} className="bg-emerald-50 text-emerald-950 text-xs font-bold px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                                  <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  {pref}
                                  <button
                                    onClick={() => handleRemovePreference(pref)}
                                    disabled={isUnverified}
                                    className="font-bold text-xs text-emerald-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                                    title="Remove interest"
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))
                            ) : (
                              <p className="text-xs text-gray-400 italic font-medium py-1">No vocational interests listed.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: 3. Prior Work & Practical Experiences Card */}
                    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                            <Briefcase className="w-4.5 h-4.5 text-blue-600" />
                            Prior Work & Practical Experiences
                          </h3>
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            15% Match Weight
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">Informal gigs, past employment, hands-on hobbies, or volunteer work</p>
                      </div>

                      {/* Add Experience Inline Input */}
                      <div className="flex items-center gap-2 w-full max-w-xl">
                        <input
                          type="text"
                          disabled={isUnverified}
                          placeholder={isUnverified ? "Awaiting verification to add experiences..." : "e.g. Phone Repair, Store Assistant, Cooking Helper..."}
                          value={newExpInput}
                          onChange={(e) => setNewExpInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (isUnverified) {
                                addToast("Cannot add experiences while account is awaiting SK verification", "error");
                                return;
                              }
                              handleAddExperience(newExpInput);
                            }
                          }}
                          className={`flex-1 px-3 py-2 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                        />
                        <button
                          type="button"
                          disabled={isUnverified}
                          onClick={() => {
                            if (isUnverified) {
                              addToast("Cannot add experiences while account is awaiting SK verification", "error");
                              return;
                            }
                            handleAddExperience(newExpInput);
                          }}
                          className={`px-4 py-2 h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {youthProfile.experiencesRaw && youthProfile.experiencesRaw.length > 0 ? (
                          youthProfile.experiencesRaw.map((exp) => (
                            <span key={exp} className="bg-blue-50 text-blue-950 text-xs font-bold px-3 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                              <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              {exp}
                              <button
                                onClick={() => handleRemoveExperience(exp)}
                                disabled={isUnverified}
                                className="font-bold text-xs text-blue-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                                title="Remove experience"
                              >
                                &times;
                              </button>
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic font-medium py-1">No prior work experiences listed.</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sub-Tab 3: Account Security - Balanced 2-Column Layout */}
                {profileActiveTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-4xl pb-24"
                  >
                    <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
                      <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                        <div className="border-b border-gray-100 pb-3">
                          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                            <Lock className="w-4.5 h-4.5 text-[#0A6B43]" />
                            Account Security & Password
                          </h3>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Current Password *</label>
                          <div className="relative">
                            <input
                              type={showCurrentPass ? "text" : "password"}
                              required
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              placeholder="Enter current password..."
                              className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPass(!showCurrentPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">New Password *</label>
                          <div className="relative">
                            <input
                              type={showNewPass ? "text" : "password"}
                              required
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Enter new password (min. 6 characters)..."
                              className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPass(!showNewPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block">Confirm New Password *</label>
                          <div className="relative">
                            <input
                              type={showConfirmPass ? "text" : "password"}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Re-type new password..."
                              className="w-full px-3 py-2 pr-10 h-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPass(!showConfirmPass)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            className="px-4 py-2 h-10 bg-[#0A6B43] hover:bg-[#075332] text-white text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            {isChangingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Update Password
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Security Overview & Guidelines Card */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 text-xs">
                        <div className="border-b border-gray-100 pb-2.5">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                            Security Best Practices
                          </h4>
                        </div>
                        <ul className="space-y-2 text-gray-600 font-medium">
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                            <span>At least 6 characters long</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                            <span>Use uppercase and lowercase letters</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                            <span>Include numbers or symbols</span>
                          </li>
                        </ul>

                        <div className="pt-2 border-t border-gray-100">
                          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/80 text-emerald-950">
                            <p className="font-bold text-[11px] uppercase tracking-wider text-[#0A6B43]">LGU Verified Credentials</p>
                            <p className="text-[11px] text-emerald-800 mt-0.5">
                              Your SiKap account is linked to your Katipunan ng Kabataan profile and TESDA TVET placements. Keep your password confidential.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sub-Tab 4: Notifications & Alerts Preferences - Balanced 2-Column Layout */}
                {profileActiveTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-4xl pb-24"
                  >
                    <div className="lg:col-span-3">
                      <NotificationSettingsCard
                        userRole="KK_YOUTH"
                        userEmail={currentUser?.email}
                        addToast={addToast}
                        className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6 animate-in fade-in duration-150"
                      />
                    </div>
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 text-xs">
                        <div className="border-b border-gray-100 pb-2.5">
                          <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                            <Bell className="w-4 h-4 text-[#0A6B43]" />
                            Official Notification Channels
                          </h4>
                        </div>
                        <div className="space-y-3 text-gray-600 font-medium">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="font-bold text-slate-800 text-xs block">Web Push Alerts</span>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Real-time browser notifications for application updates, enrollment approvals, and newly announced scholarships.
                            </p>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                            <span className="font-bold text-slate-800 text-xs block">Official Email Dispatch</span>
                            <p className="text-[11px] text-slate-500 leading-relaxed">
                              Important administrative documents, training commencement notices, and verification codes sent directly to your registered inbox.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Sub-Tab 4: Digital ID Card */}
                {profileActiveTab === "badge" && (() => {
                  const userCompletedApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Archived") || [];
                  const userEnrolledApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Enrolled") || [];
                  const savedPlan = currentSavedPlan || generatedPlan || parseCareerPlan(youthProfile.savedCareerPlan);
                  const cardGender = spellOutGender(youthProfile.gender);
                  const formattedBirthdate = youthProfile.birthdate
                    ? (() => {
                        try {
                          const d = new Date(youthProfile.birthdate);
                          return isNaN(d.getTime())
                            ? String(youthProfile.birthdate)
                            : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                        } catch {
                          return String(youthProfile.birthdate);
                        }
                      })()
                    : "Not recorded";

                  return (
                    <motion.div
                      key="badge"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="space-y-6 max-w-2xl"
                    >
                    <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                          <ShieldCheck className="w-4.5 h-4.5 text-[#0A6B43]" />
                          Digital ID Card
                        </h3>
                        <p className="text-sm text-gray-400 font-medium mt-0.5">
                          Official Katipunan ng Kabataan identification credential for San Luis, Pampanga
                        </p>
                      </div>

                      {/* Official Digital ID Card */}
                      <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto bg-white rounded-2xl border-2 border-emerald-800/20 shadow-md overflow-hidden relative">
                        {/* Top Section: Organization Header */}
                        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-gray-100 gap-2 sm:gap-3">
                          {/* Left Logo: Municipality of San Luis Seal */}
                          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                            <img
                              src="/san-luis-seal.png"
                              alt="Municipality of San Luis Seal"
                              className="w-full h-full object-contain"
                            />
                          </div>

                          {/* Centered Institutional Information */}
                          <div className="text-center flex-1 px-1 min-w-0">
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                              Republic of the Philippines
                            </p>
                            <p className="text-xs sm:text-sm md:text-[15px] font-black uppercase tracking-wide text-gray-900 leading-tight my-0.5">
                              Municipality of San Luis
                            </p>
                            <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                              Sangguniang Kabataan
                            </p>
                          </div>

                          {/* Right Logo: Sangguniang Kabataan */}
                          <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                            <img
                              src="/sk-logo.png"
                              alt="Sangguniang Kabataan Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Second Section: Full-Width Title Bar */}
                        <div className="bg-[#0A6B43] text-white py-1 px-3 text-center shadow-xs">
                          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest block">
                            Katipunan ng Kabataan Identification Card
                          </span>
                        </div>

                        {/* Main Content Area: Two Columns */}
                        <div className="p-3.5 sm:p-4 flex flex-row items-start gap-3.5 sm:gap-4.5 bg-gradient-to-b from-white to-gray-50/60">
                          {/* Left Column: Rectangular Profile Photo Area + Complete ID Number in One Row */}
                          <div className="flex flex-col items-center shrink-0 w-32 sm:w-36">
                            <div className="w-24 sm:w-28 h-30 sm:h-34 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs group">
                              {profilePictureUrl ? (
                                <img
                                  src={profilePictureUrl}
                                  alt={youthProfile.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                    <User className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                                  </div>
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">No Photo</span>
                                </div>
                              )}

                              {/* Hover / Direct upload overlay for Digital ID Card */}
                              <label
                                htmlFor="id-card-profile-pic-input"
                                className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white"
                                title="Change ID Photo"
                              >
                                {isUploadingPic ? (
                                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                                ) : (
                                  <>
                                    <Camera className="w-5 h-5 text-emerald-300" />
                                    <span className="text-[9px] font-black tracking-wider uppercase mt-0.5 text-white">
                                      {profilePictureUrl ? "Change" : "Add Photo"}
                                    </span>
                                  </>
                                )}
                              </label>
                              <input
                                id="id-card-profile-pic-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleProfilePictureUpload}
                                disabled={isUploadingPic}
                              />
                            </div>

                            {/* ID Number in one row without ellipsis */}
                            <div className="mt-2 text-center w-full">
                              <span className="font-mono text-[9px] sm:text-[9.5px] font-bold text-[#0A6B43] tracking-tight bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap inline-block">
                                ID: {youthProfile.id.toUpperCase().startsWith("KK-") ? youthProfile.id.toUpperCase() : `KK-SANLUIS-${youthProfile.id.length > 8 ? youthProfile.id.slice(-6).toUpperCase() : youthProfile.id.toUpperCase()}`}
                              </span>
                            </div>
                          </div>

                          {/* Right Column: Member's Information in compact rows and columns */}
                          <div className="flex-1 w-full space-y-2.5 min-w-0">
                            {/* Member Name (Uppercase) */}
                            <div className="border-b border-gray-100 pb-1.5">
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Name</span>
                              <h4 className="text-sm sm:text-base font-black uppercase text-gray-900 tracking-tight leading-tight mt-0.5 truncate">
                                {youthProfile.name}
                              </h4>
                            </div>

                            {/* Compact Grid: Phone Number (5 cols), Gender (3 cols), Birthday (4 cols) */}
                            <div className="grid grid-cols-12 gap-2">
                              <div className="col-span-5 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
                                <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                                  {youthProfile.contactNumber || "N/A"}
                                </span>
                              </div>

                              <div className="col-span-3 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block whitespace-nowrap">Gender</span>
                                <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                                  {cardGender}
                                </span>
                              </div>

                              <div className="col-span-4 min-w-0">
                                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Birthday</span>
                                <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                                  {formattedBirthdate}
                                </span>
                              </div>
                            </div>

                            {/* Address */}
                            <div className="border-t border-gray-100 pt-1.5">
                              <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Address</span>
                              <span className="text-xs font-bold text-gray-800 block leading-snug mt-0.5">
                                {youthProfile.purok ? `${youthProfile.purok}, ` : ""}Barangay {youthProfile.barangay || "San Isidro"}, San Luis, Pampanga
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Completed TESDA Programs Section on ID Card if any */}
                        {userCompletedApps.length > 0 && (
                          <div className="px-4 py-2 bg-emerald-50/70 border-t border-emerald-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-[#0A6B43] min-w-0">
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <span className="text-[10px] uppercase tracking-wider">TVET Qualifications:</span>
                              <span className="font-semibold text-gray-800 text-[11px] truncate">{userCompletedApps.map(a => a.programTitle).join(", ")}</span>
                            </div>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0A6B43] text-white shrink-0">
                              Graduate ✓
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Button: Moved to Bottom Right */}
                      <div className="flex justify-end pt-3 w-full">
                        <button
                          onClick={() => {
                            const fullIdStr = youthProfile.id.toUpperCase().startsWith("KK-") ? youthProfile.id.toUpperCase() : `KK-SANLUIS-${youthProfile.id.length > 8 ? youthProfile.id.slice(-6).toUpperCase() : youthProfile.id.toUpperCase()}`;
                            const completedStr = userCompletedApps.length > 0 ? `\nCertified Programs: ${userCompletedApps.map(a => a.programTitle).join(", ")}` : "";
                            navigator.clipboard?.writeText(
                              `Katipunan ng Kabataan Digital ID Card:\nName: ${youthProfile.name.toUpperCase()}\nID: ${fullIdStr}\nPhone: ${youthProfile.contactNumber || "N/A"}\nGender: ${cardGender}\nBirthday: ${formattedBirthdate}\nAddress: ${youthProfile.purok ? `${youthProfile.purok}, ` : ""}Barangay ${youthProfile.barangay || "San Isidro"}, San Luis, Pampanga${completedStr}`
                            );
                            addToast("Digital ID Card information copied to clipboard!", "success");
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4 text-[#0A6B43]" />
                          Copy Digital ID Info
                        </button>
                      </div>
                    </div>

                    {/* Saved Gemini Career Plan Section under ID Card */}
                    {savedPlan ? (
                      <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                              <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                            </div>
                            <div>
                              <span className="text-xs font-black uppercase text-[#0A6B43] tracking-wider block">
                                Verified Career Roadmap
                              </span>
                              <h4 className="font-extrabold text-gray-900 text-base sm:text-lg">
                                {savedPlan.roadmapTitle}
                              </h4>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            Saved on: {savedPlan.generatedDate || "Recently"}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                          {savedPlan.summary}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 space-y-1.5 text-sm">
                            <span className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                              <Briefcase className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Wage Employment Track</span>
                            </span>
                            <p className="text-emerald-950 font-bold">
                              {savedPlan.employmentTrack?.targetRoles?.join(", ")}
                            </p>
                            <p className="text-emerald-800 text-[13px]">
                              Est. Salary: <strong className="text-emerald-900">{savedPlan.employmentTrack?.estimatedSalary}</strong>
                            </p>
                          </div>

                          <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-100 space-y-1.5 text-sm">
                            <span className="text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Freelance & Enterprise Track</span>
                            </span>
                            <p className="text-amber-950 font-bold">
                              {savedPlan.entrepreneurshipTrack?.businessConcept}
                            </p>
                            <p className="text-amber-800 text-[13px]">
                              {savedPlan.entrepreneurshipTrack?.starterFunding}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-sm">
                          <button
                            onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                            className="text-[#0A6B43] hover:text-[#075332] font-bold text-sm flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Full Pathway & Steps</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(
                                `Career Roadmap: ${savedPlan.roadmapTitle}\nSummary: ${savedPlan.summary}\nTarget Salary: ${savedPlan.employmentTrack?.estimatedSalary}\nRoles: ${savedPlan.employmentTrack?.targetRoles?.join(", ")}`
                              );
                              addToast("Career Plan summary copied to clipboard!", "success");
                            }}
                            className="text-gray-500 hover:text-gray-700 font-bold text-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-4 h-4" />
                            <span>Copy Summary</span>
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
        )}

        </div>

        {/* Floating Add Skill Modal */}
        {showAddSkillModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddSkillModal(false);
            }}
          >
            <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200 ease-out border border-emerald-100 shadow-2xl">
              <div className="flex justify-between items-center pb-2.5 border-b border-gray-150">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-gray-900 text-base">Add Competency Skill</h4>
                </div>
                <button
                  onClick={() => setShowAddSkillModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleAddSkillSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase block">Skill or Trade Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Baking, Basic Computing, Carpentry"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <p className="text-xs text-gray-400">Enter a technical skill, vocational trade, or practical knowledge.</p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2 border-t border-gray-150">
                  <button
                    type="button"
                    onClick={() => setShowAddSkillModal(false)}
                    className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-[#D97706] hover:bg-amber-700 active:scale-95 text-white text-sm font-bold py-2.5 px-5 rounded-xl shadow-xs transition-colors cursor-pointer text-center"
                  >
                    Confirm & Refresh Matches
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Program Details Modal Popup */}
        {viewingProgramModal && (
          <div
            className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
            style={{ zIndex: 50 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingProgramModal(null);
            }}
          >
            <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-emerald-100 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Top Header (Pinned at Top) */}
              <div className="p-4 sm:p-5 sm:px-6 border-b border-gray-150 shrink-0 bg-white">
                <div className="flex items-start justify-between gap-3">
                  {/* Badges / Provider Row */}
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-150 tracking-wider">
                      {viewingProgramModal.program.provider || "TESDA Accredited Program"}
                    </span>
                    {isProgramEnded(viewingProgramModal.program) && (
                      <span className="text-[10px] font-extrabold uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 tracking-wider inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-600" />
                        Training Term Concluded
                      </span>
                    )}
                  </div>

                  {/* Actions & Close Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:block">
                      <FlameMatchScore score={viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program)} />
                    </div>
                    <button
                      onClick={() => setViewingProgramModal(null)}
                      className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      aria-label="Close modal"
                      title="Close modal"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Title and Mobile Match Score */}
                <div className="mt-2.5 flex items-start justify-between gap-3">
                  <h3 className="font-extrabold text-gray-900 text-base sm:text-xl leading-snug flex-1 min-w-0 break-words">
                    {viewingProgramModal.program.title}
                  </h3>
                  <div className="sm:hidden block shrink-0 pt-0.5">
                    <FlameMatchScore score={viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program)} />
                  </div>
                </div>

                {/* Location and Duration Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-600 font-medium">
                  <span className="inline-flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate max-w-[220px] sm:max-w-none">{viewingProgramModal.program.location}</span>
                  </span>
                  <span className="hidden sm:inline text-gray-300">•</span>
                  <span className="inline-flex items-center gap-1.5 shrink-0">
                    <Timer className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>{viewingProgramModal.program.trainingHours} hours</span>
                  </span>
                </div>
              </div>

              {/* Modal Scrollable Body */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
                {/* 4-Factor Transparent CBF Score Breakdown */}
                {(() => {
                  const breakdown = calculateDetailedCBFMatch(youthProfile, viewingProgramModal.program);
                  return (
                    <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                        <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 shrink-0" />
                          <span>Transparent CBF Match Breakdown</span>
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border shrink-0 ${breakdown.passedSkillGate
                          ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                          : "bg-red-950/80 text-red-300 border-red-500/40"
                          }`}>
                          {breakdown.passedSkillGate ? "Passed Skill Gate ✓" : "Skill Gate Excluded ✗"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/80">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Skill (50%)</p>
                          <p className="text-sm sm:text-base font-black text-emerald-400 mt-0.5">{breakdown.skillPoints} pts</p>
                          <p className="text-[9px] text-gray-400">{breakdown.skillMatch}% Match</p>
                        </div>
                        <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/80">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Pref (25%)</p>
                          <p className="text-sm sm:text-base font-black text-blue-400 mt-0.5">{breakdown.preferencePoints} pts</p>
                          <p className="text-[9px] text-gray-400">{breakdown.preferenceMatch}% Match</p>
                        </div>
                        <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/80">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Exp (15%)</p>
                          <p className="text-sm sm:text-base font-black text-amber-400 mt-0.5">{breakdown.experiencePoints} pts</p>
                          <p className="text-[9px] text-gray-400">{breakdown.experienceMatch}% Match</p>
                        </div>
                        <div className="bg-slate-800/80 p-2 sm:p-2.5 rounded-lg border border-slate-700/80">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Goal (10%)</p>
                          <p className="text-sm sm:text-base font-black text-purple-400 mt-0.5">{breakdown.goalPoints} pts</p>
                          <p className="text-[9px] text-gray-400">{breakdown.goalMatch}% Match</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs pt-2 border-t border-slate-800 gap-1.5">
                        <span className="text-gray-400 font-medium">Program Category: <strong className="text-slate-200">{breakdown.categoryName}</strong></span>
                        <span className="font-extrabold text-emerald-400 text-xs sm:text-sm">Overall Fit: {breakdown.finalScore}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Gemini AI Match Rationale */}
                <div className="bg-emerald-50/90 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/80 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
                      Gemini AI Match Rationale
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      {viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program)}% CBF Match Fit
                    </span>
                  </div>
                  <p className="text-xs italic text-emerald-950 leading-relaxed font-medium">
                    &ldquo;{featuredLang === "tl" && featuredAdviceTl
                      ? featuredAdviceTl
                      : (liveGeminiAdvice || `As a Katipunan ng Kabataan member from Barangay ${youthProfile.barangay || "San Luis"}, ${youthProfile.name.split(' ')[0]} possesses background competencies matching ${viewingProgramModal.program.title}. Enrolling in this course will officially certify their qualifications under TESDA.`)}&rdquo;
                  </p>
                </div>

                {/* Complete Program Details Grid */}
                <div className="bg-gray-50/80 rounded-xl sm:rounded-2xl border border-gray-200/80 p-3.5 sm:p-4.5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-200/60">
                    <span className="text-[11px] font-extrabold uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-4 h-4 text-[#0A6B43] shrink-0" />
                      Program Specifications & Logistics
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified Schedule
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                    {/* Course Duration */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Timer className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Course Duration</span>
                        <p className="font-bold text-gray-800 leading-snug break-words">
                          {viewingProgramModal.program.trainingHours} Hours
                          {(viewingProgramModal.program.startDate || viewingProgramModal.program.endDate) && (
                            <span className="text-gray-500 font-normal block sm:inline sm:ml-1 text-[11px]">
                              ({formatProgramDateRange(viewingProgramModal.program.startDate, viewingProgramModal.program.endDate)})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Training Schedule */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Training Schedule</span>
                        <p className="font-bold text-gray-800 leading-snug break-words">
                          {formatTrainingDays(viewingProgramModal.program.trainingDays)}
                        </p>
                      </div>
                    </div>

                    {/* Timeslot & Session */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Timeslot & Session</span>
                        <p className="font-bold text-gray-800 leading-snug break-words">
                          {(() => {
                            const ts = formatProgramTimeslot(viewingProgramModal.program.startTime, viewingProgramModal.program.endTime);
                            return `${ts.formattedRange}${ts.sessionType !== "Custom" ? ` (${ts.sessionType})` : ""}`;
                          })()}
                        </p>
                      </div>
                    </div>

                    {/* Facility / Room */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Facility / Room</span>
                        <p className="font-bold text-gray-800 leading-snug break-words">
                          {viewingProgramModal.program.room || "Main Training Facility"}
                        </p>
                      </div>
                    </div>

                    {/* Trainer / Instructor */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Trainer / Instructor</span>
                        <p className="font-bold text-gray-800 leading-snug break-words">
                          {viewingProgramModal.program.instructor || "TESDA Certified Trainer"}
                        </p>
                      </div>
                    </div>

                    {/* Program Cost */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Program Cost</span>
                        <p className="font-black text-emerald-700 leading-snug break-words">
                          {viewingProgramModal.program.cost || "100% Free / Subsidized"}
                        </p>
                      </div>
                    </div>

                    {/* Available Slots */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Available Slots</span>
                        <p className="font-bold text-gray-900 leading-snug break-words">
                          <span className="font-black text-[#0A6B43]">{viewingProgramModal.program.slotsRemaining}</span>
                          <span className="text-gray-500 font-medium"> / {viewingProgramModal.program.slotsTotal} open</span>
                        </p>
                      </div>
                    </div>

                    {/* Contact Registrar */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Phone className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Contact Registrar</span>
                        <p className="font-bold text-gray-800 leading-snug break-words text-[11px] sm:text-xs">
                          {viewingProgramModal.program.contactPerson || "TESDA Registrar"}
                          {viewingProgramModal.program.contactNumber && (
                            <span className="text-emerald-700 font-semibold block sm:inline sm:ml-1">
                              ({viewingProgramModal.program.contactNumber})
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Eligibility */}
                    <div className="sm:col-span-2 bg-white p-2.5 sm:p-3 rounded-xl border border-gray-150 flex items-start gap-2.5 shadow-2xs">
                      <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-emerald-50 border border-emerald-100/80 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight block">Eligibility</span>
                        <p className="font-bold text-gray-800 leading-snug break-words text-[11px] sm:text-xs">
                          {viewingProgramModal.program.eligibility || "Open to all Katipunan ng Kabataan (KK) Youth"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical Requirements */}
                {viewingProgramModal.program.requiredDocuments && viewingProgramModal.program.requiredDocuments.length > 0 && (
                  <div className="bg-amber-50/90 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-amber-200/80 space-y-2 shadow-2xs">
                    <p className="text-[11px] font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      Physical Requirements Needed Beforehand:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-amber-950 font-medium">
                      {viewingProgramModal.program.requiredDocuments.map((doc, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-amber-200/60 shadow-2xs">
                          <span className="text-amber-600 font-bold shrink-0 leading-snug">•</span>
                          <span className="leading-snug break-words">{doc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills */}
                {viewingProgramModal.program.requiredSkills && viewingProgramModal.program.requiredSkills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                      Recommended Prerequisite Competencies:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProgramModal.program.requiredSkills.map((sk, sIdx) => (
                        <span key={sIdx} className="text-[11px] font-semibold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-2xs">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Action Footer (Pinned at Bottom) */}
              {(() => {
                const prog = viewingProgramModal.program;
                const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === prog.title);
                const isCompleted = isProgramCompleted(prog);
                const isEnrolled = app?.status === "Enrolled";
                const isDeclined = app?.status === "Declined";
                const isEnded = isProgramEnded(prog);
                const isFull = !app && prog.slotsRemaining <= 0;
                const overlapWarning = getOverlapWarning(prog);
                const isDisabled = isCompleted || !!app || isFull || isEnded || !!overlapWarning || isUnverified;

                return (
                  <div className="p-3.5 sm:p-5 border-t border-gray-150 shrink-0 bg-gray-50/95 rounded-b-2xl sm:rounded-b-3xl">
                    <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-3">
                      <button
                        onClick={() => setViewingProgramModal(null)}
                        className="w-full sm:w-auto px-5 py-2.5 sm:py-3 border border-gray-250 text-gray-700 bg-white hover:bg-gray-100 text-xs font-bold rounded-xl transition-all cursor-pointer text-center shadow-2xs active:scale-98"
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
                      ) : isEnded && !app ? (
                        <button
                          disabled
                          className="w-full sm:w-auto text-xs font-extrabold px-6 py-3 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-2 cursor-not-allowed shadow-xs"
                        >
                          <Clock className="w-4 h-4 text-purple-600" />
                          Program Term Ended
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleDirectApply(viewingProgramModal.program);
                          }}
                          disabled={isDisabled}
                          className={`w-full sm:w-auto text-xs font-extrabold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${app
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
                                  : "bg-[#0A6B43] hover:bg-[#075332] active:scale-98 text-white cursor-pointer"
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
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Direct Application Confirmation Modal (Centered Desktop style) */}
        {showApplyModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ zIndex: 100 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowApplyModal(false);
                setSelectedProgramToApply(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-[360px] w-full animate-in fade-in zoom-in-95 duration-200 ease-out border border-emerald-100">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
                <CheckCircle className="w-9 h-9 text-[#0A6B43]" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-base">Apply for training?</h4>
                <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
                  This will submit your application directly to TESDA for the <strong className="text-gray-800">{selectedProgramToApply?.title || "selected training program"}</strong>.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setShowApplyModal(false);
                    setSelectedProgramToApply(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 active:scale-98 transition-all cursor-pointer shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDirectApply}
                  className="flex-1 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-98 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Verification ID Full Photo Modal */}
        {showIdPhotoModal && youthProfile.verificationIdImage && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
            style={{ zIndex: 110 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowIdPhotoModal(false);
            }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-2xl space-y-4 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200 ease-out border border-gray-200 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0A6B43]" />
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{youthProfile.verificationIdType || "Government ID"} Attached</h4>
                    <p className="text-[11px] text-gray-500 font-medium">Uploaded for SK Verification</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIdPhotoModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-gray-900 flex items-center justify-center p-2 min-h-[260px]">
                <img
                  src={youthProfile.verificationIdImage}
                  alt="Full Government ID"
                  className="max-h-[65vh] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>

              <div className="flex justify-between items-center pt-2 text-xs">
                <span className="font-mono text-gray-600 font-bold">
                  {youthProfile.verificationIdNumber ? `ID No: ${youthProfile.verificationIdNumber}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setShowIdPhotoModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
