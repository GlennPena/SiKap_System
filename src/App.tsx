"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { UserRole } from "./types";
import {
  INITIAL_YOUTH_PROFILES, INITIAL_TESDA_PROGRAMS,
  INITIAL_ANNOUNCEMENTS, INITIAL_REFERRALS, SKILLS_GAPS,
  INITIAL_BARANGAYS, INITIAL_OFFICIALS, INITIAL_COUNCILORS
} from "./data";
import { SKOfficialPortal } from "./components/SKOfficialPortal";
import { KKYouthPortal } from "./components/KKYouthPortal";
import { TESDAPartnerPortal } from "./components/TESDAPartnerPortal";
import { BarangayCaptainPortal } from "./components/BarangayCaptainPortal";
import { LandingPage } from "./components/LandingPage";
import { SuperAdminPortal } from "./components/SuperAdminPortal";
import { KKYouthRegister } from "./components/KKYouthRegister";
import { Toast, SikapLogo } from "./components/ReusableComponents";
import { ForgotPasswordModal } from "./components/ForgotPasswordModal";
import { TermsPage } from "./components/TermsPage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { AnimatedGridBackground } from "./components/AnimatedGridBackground";
import { onRealtimeSync, broadcastDataChange } from "./lib/realtime-sync";
import { Briefcase, Eye, EyeOff, Shield, Award, Landmark, UserCheck, ArrowLeft, Loader2, ShieldAlert, Clock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const MatchBadge: React.FC = () => {
  const [matchState, setMatchState] = useState<"analyzing" | "calculating" | "complete">("analyzing");
  const [calcScore, setCalcScore] = useState(0);

  useEffect(() => {
    // Stage 1: Display "Analyzing..." briefly while card settles
    const analyzeTimer = setTimeout(() => {
      setMatchState("calculating");
    }, 550);

    return () => clearTimeout(analyzeTimer);
  }, []);

  useEffect(() => {
    if (matchState === "calculating") {
      let current = 0;
      const target = 94;
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 8) + 7;
        if (current >= target) {
          setCalcScore(target);
          setMatchState("complete");
          clearInterval(interval);
        } else {
          setCalcScore(current);
        }
      }, 38); // Balanced, readable calculation count-up over ~380ms

      return () => clearInterval(interval);
    }
  }, [matchState]);

  if (matchState === "analyzing") {
    return (
      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-1.5 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
        Analyzing...
      </span>
    );
  }

  if (matchState === "calculating") {
    return (
      <span className="text-xs font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs font-mono">
        {calcScore}% Calculating...
      </span>
    );
  }

  return (
    <motion.span
      initial={{ scale: 0.8 }}
      animate={{ scale: [1, 1.28, 0.92, 1] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-md border border-emerald-200 flex items-center gap-1"
    >
      94% Match
    </motion.span>
  );
};

export default function App() {
  const { data: session, status } = useSession();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [viewingLanding, setViewingLanding] = useState(true);
  const [viewingLegal, setViewingLegal] = useState<{ tab: "terms" | "privacy"; returnTo: "landing" | "register" | "login" } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Derive active user role immediately to eliminate render flickers on page refresh
  const activeUserRole = useMemo(() => {
    if (currentUserRole) return currentUserRole;
    if (status === "authenticated" && session?.user) {
      if (typeof window !== "undefined") {
        const isRemembered = (session.user as any).rememberMe ?? (localStorage.getItem("sikap_remember_me") === "true");
        const isSessionActive = sessionStorage.getItem("sikap_session_active") === "true";
        if (!isRemembered && !isSessionActive) {
          return null;
        }
      }
      const roleStr = (session.user as any).role;
      if (roleStr === "SUPER_ADMIN") return UserRole.SUPER_ADMIN;
      if (roleStr === "SK_OFFICIAL") return UserRole.SK_OFFICIAL;
      if (roleStr === "BARANGAY_CAPTAIN") return UserRole.BARANGAY_CAPTAIN;
      if (roleStr === "TESDA_PARTNER") return UserRole.TESDA_PARTNER;
      if (roleStr === "KK_YOUTH") return UserRole.KK_YOUTH;
    }
    return null;
  }, [currentUserRole, session, status]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      if (typeof window !== "undefined") {
        const isRemembered = (session.user as any).rememberMe ?? (localStorage.getItem("sikap_remember_me") === "true");
        const isSessionActive = sessionStorage.getItem("sikap_session_active") === "true";

        // If user did NOT check Remember Me and this is a new browser session (sessionStorage cleared upon browser close):
        if (!isRemembered && !isSessionActive) {
          signOut({ redirect: false }).then(() => {
            setCurrentUserRole(null);
            setViewingLanding(true);
          });
          return;
        }
      }

      const roleStr = (session.user as any).role;
      if (roleStr === "SUPER_ADMIN") setCurrentUserRole(UserRole.SUPER_ADMIN);
      else if (roleStr === "SK_OFFICIAL") setCurrentUserRole(UserRole.SK_OFFICIAL);
      else if (roleStr === "BARANGAY_CAPTAIN") setCurrentUserRole(UserRole.BARANGAY_CAPTAIN);
      else if (roleStr === "TESDA_PARTNER") setCurrentUserRole(UserRole.TESDA_PARTNER);
      else if (roleStr === "KK_YOUTH") setCurrentUserRole(UserRole.KK_YOUTH);
    } else if (status === "unauthenticated") {
      setCurrentUserRole(null);
    }
    if (status === "authenticated") {
      setIsLoggingIn(false);
    }
  }, [session, status]);

  // New Super Admin & Councilor states
  const [barangays, setBarangays] = useState(INITIAL_BARANGAYS);
  const [officialAccounts, setOfficialAccounts] = useState<any[]>([]);
  const [councilors, setCouncilors] = useState<any[]>([]);
  const [designatedBarangay, setDesignatedBarangay] = useState<string>("San Sebastian");
  const [isSelfRegistering, setIsSelfRegistering] = useState(false);
  const [loggedInYouthId, setLoggedInYouthId] = useState<string>("");

  // Shared state synchronized across portals
  const [youthProfiles, setYouthProfiles] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);

  // Real-time synchronization lock to prevent overlapping fetch requests
  const isSyncingRef = useRef(false);

  // Centralized real-time sync function across all system data
  const syncAllData = useCallback(async () => {
    if (status !== "authenticated" || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const isSuperAdminOrCaptain = (session?.user as any)?.role === "SUPER_ADMIN" || (session?.user as any)?.role === "BARANGAY_CAPTAIN";

      const [youthRes, progRes, annRes, refRes, counRes, usersRes] = await Promise.all([
        fetch("/api/youth").then(r => r.json()).catch(() => null),
        fetch("/api/programs").then(r => r.json()).catch(() => null),
        fetch("/api/announcements").then(r => r.json()).catch(() => null),
        fetch("/api/referrals").then(r => r.json()).catch(() => null),
        fetch("/api/councilors").then(r => r.json()).catch(() => null),
        isSuperAdminOrCaptain ? fetch("/api/users").then(r => r.json()).catch(() => null) : Promise.resolve(null),
      ]);

      // Only update state if data actually changed to eliminate unnecessary re-renders
      if (youthRes?.success && Array.isArray(youthRes.data)) {
        setYouthProfiles(prev => {
          if (JSON.stringify(prev) === JSON.stringify(youthRes.data)) return prev;
          return youthRes.data;
        });
      }
      if (progRes?.success && Array.isArray(progRes.data)) {
        setPrograms(prev => {
          if (JSON.stringify(prev) === JSON.stringify(progRes.data)) return prev;
          return progRes.data;
        });
      }
      if (annRes?.success && Array.isArray(annRes.data)) {
        setAnnouncements(prev => {
          if (JSON.stringify(prev) === JSON.stringify(annRes.data)) return prev;
          return annRes.data;
        });
      }
      if (refRes?.success && Array.isArray(refRes.data)) {
        setReferrals(prev => {
          if (JSON.stringify(prev) === JSON.stringify(refRes.data)) return prev;
          return refRes.data;
        });
      }
      if (counRes?.success && Array.isArray(counRes.data)) {
        setCouncilors(prev => {
          if (JSON.stringify(prev) === JSON.stringify(counRes.data)) return prev;
          return counRes.data;
        });
      }
      if (usersRes?.success && Array.isArray(usersRes.data)) {
        setOfficialAccounts(prev => {
          if (JSON.stringify(prev) === JSON.stringify(usersRes.data)) return prev;
          return usersRes.data;
        });
      }
    } catch (err) {
      console.log("Real-time sync error:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [status, session]);

  // 1. Listen for instant cross-tab and in-window broadcast mutations (<10ms)
  useEffect(() => {
    if (status !== "authenticated") return;
    const unsubscribe = onRealtimeSync(() => {
      syncAllData();
    });
    return unsubscribe;
  }, [status, syncAllData]);

  // 2. Real-time background sync loop (polls every 3.5s while active) & instant focus revalidation
  useEffect(() => {
    if (status !== "authenticated") return;

    // Immediate initial sync
    syncAllData();

    // Continuous real-time polling every 3.5 seconds
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncAllData();
      }
    }, 3500);

    // Instant revalidation when user switches back to tab
    const handleRevalidate = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncAllData();
      }
    };
    window.addEventListener("focus", handleRevalidate);
    document.addEventListener("visibilitychange", handleRevalidate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleRevalidate);
      document.removeEventListener("visibilitychange", handleRevalidate);
    };
  }, [status, syncAllData]);


  // Simple toast system
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);
  const toastCounterRef = React.useRef(0);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = `${Date.now()}-${++toastCounterRef.current}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Login form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Rate limiting / lockout states
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [lockoutMessage, setLockoutMessage] = useState<string | null>(null);
  const [attemptWarning, setAttemptWarning] = useState<string | null>(null);

  // 1-second countdown interval for 5-minute cooldown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          setLockoutMessage(null);
          setAttemptWarning(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Query rate-limit / lockout status from the server
  const checkLockoutStatus = async (userEmail: string) => {
    if (!userEmail.trim()) {
      setLockoutSeconds(0);
      setLockoutMessage(null);
      setAttemptWarning(null);
      return;
    }
    try {
      const res = await fetch(`/api/auth/login-status?email=${encodeURIComponent(userEmail.trim().toLowerCase())}`);
      const data = await res.json();
      if (data.isLocked) {
        setLockoutSeconds(data.remainingSeconds || 300);
        setLockoutMessage(data.message || "Account locked due to 5 wrong password attempts. Please wait 5 minutes.");
        setAttemptWarning(null);
      } else {
        setLockoutSeconds(0);
        setLockoutMessage(null);
        if (data.failedAttempts > 0) {
          setAttemptWarning(`Warning: ${data.remainingAttempts} attempt${data.remainingAttempts > 1 ? "s" : ""} remaining before a 5-minute lockout.`);
        } else {
          setAttemptWarning(null);
        }
      }
    } catch {
      // silent fallback
    }
  };

  const formatCooldown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Standard login trigger
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || lockoutSeconds > 0) return;
    if (!email.trim() || !password.trim()) {
      addToast("Please input valid credentials", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (res?.error) {
        const errorText = res.error === "CredentialsSignin" ? "Invalid email or password" : res.error;
        addToast(errorText, "error");
        setIsLoggingIn(false);
        // Refresh rate-limit & lockout status from server
        await checkLockoutStatus(email);
      } else {
        setLockoutSeconds(0);
        setLockoutMessage(null);
        setAttemptWarning(null);
        if (typeof window !== "undefined") {
          if (rememberMe) {
            localStorage.setItem("sikap_remember_me", "true");
            sessionStorage.removeItem("sikap_session_active");
          } else {
            localStorage.removeItem("sikap_remember_me");
            sessionStorage.setItem("sikap_session_active", "true");
          }
        }
        addToast("Successfully logged in!", "success");
      }
    } catch {
      addToast("An error occurred during login", "error");
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingIn(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("sikap_remember_me");
      sessionStorage.removeItem("sikap_session_active");
    }
    await signOut({ redirect: false });
    setCurrentUserRole(null);
    setEmail("");
    setPassword("");
    setViewingLanding(true);
    addToast("Logged out successfully.", "info");
  };

  // Find dynamic logged-in youth's profile for the Youth Portal view
  const defaultEmptyYouthProfile: any = {
    id: "empty-youth-profile",
    userId: (session?.user as any)?.id || "",
    name: session?.user?.name || "Youth Member",
    email: session?.user?.email || "",
    age: 18,
    purok: "Purok 1",
    barangay: (session?.user as any)?.barangay || "",
    educationalAttainment: "Junior High School Graduate",
    currentStatus: "Out-of-school",
    skills: [],
    interests: [],
    sectorPreference: "General",
    livelihoodGoal: "Configure your career goals",
    contactNumber: "",
    registeredDate: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    matchScore: 85,
    soloParent: false,
    pwd: false,
    indigenous: false,
    hasReferred: false,
    approvalStatus: "Approved"
  };

  const activeYouthProfile = useMemo(() => {
    const sessionEmail = session?.user?.email?.toLowerCase().trim();
    const sessionUserId = (session?.user as any)?.id;

    // 1. Highest priority: Match by unique authenticated user ID
    if (sessionUserId) {
      const byUserId = youthProfiles.find(y => y.userId && y.userId === sessionUserId);
      if (byUserId) return byUserId;
    }

    // 2. High priority: Match by unique email address
    if (sessionEmail) {
      const byEmail = youthProfiles.find(y => y.email && y.email.toLowerCase().trim() === sessionEmail);
      if (byEmail) return byEmail;
    }

    // 3. Match by explicit loggedInYouthId if specified
    if (loggedInYouthId) {
      const byId = youthProfiles.find(y => y.id === loggedInYouthId);
      if (byId) return byId;
    }

    // 4. Fallback ONLY if session has NO email and NO userId (mock testing without credentials):
    if (!sessionEmail && !sessionUserId && session?.user?.name) {
      const sessionName = session.user.name.toLowerCase().trim();
      const byName = youthProfiles.find(y => y.name && y.name.toLowerCase().trim() === sessionName);
      if (byName) return byName;
    }

    if (!session?.user && youthProfiles.length > 0) {
      return youthProfiles[0];
    }

    return {
      ...defaultEmptyYouthProfile,
      name: session?.user?.name || "Youth Member",
      barangay: (session?.user as any)?.barangay || "",
      email: session?.user?.email || ""
    };
  }, [youthProfiles, loggedInYouthId, session?.user]);

  // Prevent flash of landing page while session is loading or authenticating
  if (status === "loading" || (status === "authenticated" && !activeUserRole)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 select-none" id="sikap-session-loader">
        <div className="flex flex-col items-center gap-6">
          <SikapLogo size={52} logoSize={68} textSize={44} showText={true} showSubtext={true} disableHover={true} />
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white border border-slate-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
            <div className="w-2 h-2 rounded-full bg-[#0A6B43] animate-ping" />
            <span>Loading SiKap...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans antialiased w-full max-w-full overflow-x-hidden" id="sikap-application-root">
      {/* Toast Alert stack */}
      <aside
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-md w-full items-end"
      >
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </aside>

      {activeUserRole === null ? (
        <>
          {viewingLanding && !viewingLegal && (
            <LandingPage
              programs={programs}
              onEnterLogin={() => {
                setIsSelfRegistering(false);
                setViewingLanding(false);
              }}
              onEnterSignUp={() => {
                setIsSelfRegistering(true);
                setViewingLanding(false);
              }}
              onOpenLegal={(tab) => {
                setViewingLegal({ tab, returnTo: "landing" });
              }}
              addToast={addToast}
            />
          )}

          {!viewingLanding && (
            <div className={`min-h-screen md:h-screen flex flex-col md:flex-row bg-white p-3 sm:p-6 gap-6 overflow-y-auto md:overflow-hidden ${viewingLegal ? 'hidden' : ''}`}>

            {/* Left panel as a card (Hidden on small mobile screens to maximize form focus and prevent vertical cutoff) */}
            <div className="hidden md:flex md:w-[45%] bg-[#0A4D30] rounded-[1.5rem] p-8 md:p-10 flex-col shrink-0 relative overflow-hidden shadow-xl border border-emerald-800/60">

              {/* Redox Texture Overlay (Identical to Landing Page CTA) */}
              <div
                className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
                style={{
                  backgroundImage: "url('/redox-02.png')",
                  backgroundRepeat: "repeat",
                  backgroundSize: "200px 200px",
                }}
              />

              {/* Animated 3D Grid Overlay (Identical to Landing Page CTA) */}
              <AnimatedGridBackground />

              {/* Subtle Radial Lighting behind text */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.18),transparent_70%)] pointer-events-none z-0" />

              {/* Header Row: Welcome Text */}
              <div className="flex items-start justify-between w-full relative z-10 mb-8">
                <div className="w-full mt-2">
                  <motion.h1
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.48, ease: "easeOut" }}
                    className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.6rem] font-black leading-[1.05] tracking-tight text-white mb-2 drop-shadow-xs"
                  >
                    Your Path Continues Here
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.48, ease: "easeOut", delay: 0.08 }}
                    className="text-base md:text-lg text-emerald-100/95 leading-relaxed font-medium pr-4 mt-2"
                  >
                    Explore more opportunities specially matched to you
                  </motion.p>
                </div>
              </div>

              {/* Hero "Image" Mockup - OSY CARD entering subtly into destination */}
              <motion.div
                initial={{ opacity: 0, x: -30, y: 30 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.72, ease: "easeOut", delay: 0.1 }}
                className="absolute top-[28%] -left-[30%] w-[80%] max-w-[800px] transform scale-[1.3] origin-top-left z-10 pointer-events-auto"
              >
                <div className="bg-white rounded-3xl p-8 shadow-2xl aspect-[3/4] min-h-[600px] overflow-hidden transition-transform duration-700 hover:rotate-0 [transform:perspective(1200px)_rotateX(0deg)_rotateY(-10deg)_rotateZ(9deg)]">
                  <div className="transform scale-[1.5] origin-top-right w-[68%] ml-auto space-y-6">
                    <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-800 font-black text-sm shadow-inner border border-emerald-100 shrink-0">
                          KK
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900">Juan dela Cruz</h4>
                          <p className="text-sm text-gray-400 font-bold">Purok 2, San Sebastian</p>
                        </div>
                      </div>
                      <span className="text-[12px] bg-[#0A6B43] text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold uppercase tracking-wider shadow-2xs shrink-0 self-start mt-0.5">
                        OSY Youth
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#075332] uppercase tracking-wide">Recommended Program</span>
                          <MatchBadge />
                        </div>
                        <p className="text-base font-black text-gray-900 mt-2">Shielded Metal Arc Welding (SMAW) NC II</p>
                      </div>

                      <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/70 text-sm text-amber-950 leading-relaxed space-y-2">
                        <div className="font-black text-sm text-amber-900">
                          Gemini Match Rationale
                        </div>
                        <p className="text-gray-700 font-medium text-xs leading-relaxed">
                          "You have hands-on skills in metal fabrication. This vocational program will officially certify your qualifications under TESDA and unlock formal job opportunities in regional manufacturing hubs."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right panel */}
            <div className="flex-1 bg-white relative min-h-[520px] md:min-h-[600px] w-full flex flex-col items-center justify-start md:justify-center p-4 sm:p-6 md:px-10 lg:px-14 xl:px-20 pt-3 sm:pt-6 md:py-8 overflow-y-auto md:overflow-hidden">

              {/* Logo centered at top - sliding down from above (desktop, or mobile when registering) */}
              <motion.div
                initial={{ opacity: 0, y: -25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`${isSelfRegistering ? 'flex' : 'hidden md:flex'} absolute top-2 sm:top-3 md:top-5 lg:top-7 left-0 w-full justify-center z-50 pointer-events-auto`}
              >
                <SikapLogo
                  size={46}
                  logoSize={48}
                  textSize={42}
                  showText={true}
                  showSubtext={false}
                  gap="gap-2.5"
                  textClassName="translate-y-[1.5px]"
                  disableHover={true}
                />
              </motion.div>

              <AnimatePresence mode="wait">
                {isSelfRegistering ? (
                  <motion.div
                    key="register-form-view"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="w-full z-10 relative flex-1 flex flex-col min-h-0 max-w-2xl lg:max-w-3xl xl:max-w-4xl px-1 sm:px-2 pt-[68px] sm:pt-[78px] md:pt-[88px] pb-4 sm:pb-6 md:pb-8"
                  >
                    <KKYouthRegister
                      onRegisterComplete={(newProfile) => {
                        setYouthProfiles(prev => [newProfile, ...prev]);
                        setLoggedInYouthId(newProfile.id);
                        setCurrentUserRole(UserRole.KK_YOUTH);
                        setIsSelfRegistering(false);
                        setViewingLanding(false);
                        addToast(`Welcome ${newProfile.name}! Registered successfully. Your account is view-only pending SK Chairperson verification.`, "success");
                      }}
                      onBackToHome={() => setIsSelfRegistering(false)}
                      onOpenLegal={(tab) => {
                        setViewingLegal({ tab, returnTo: "register" });
                      }}
                    />
                    <div className="text-center pt-4 sm:pt-5 pb-1 shrink-0">
                      <p className="text-[14px] font-semibold text-gray-700">
                        Have a SiKap account?{" "}
                        <button
                          type="button"
                          onClick={() => setIsSelfRegistering(false)}
                          className="text-[#0A6B43] font-bold hover:text-[#075332] transition-colors cursor-pointer underline underline-offset-2"
                        >
                          Sign in here
                        </button>
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="signin-form-view"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                    className="w-full flex justify-center items-center"
                  >
                    <div className="w-full z-10 relative max-w-md sm:max-w-lg lg:max-w-xl xl:max-w-[540px] space-y-5 sm:space-y-6 lg:space-y-8 pt-0 md:pt-0 pb-4 md:pb-0">
                      {/* Mobile centered SiKap logo and text - positioned higher with ample separation */}
                      <div className="md:hidden flex flex-col items-center justify-center pt-0 pb-6 mb-12 sm:mb-16">
                        <SikapLogo
                          size={40}
                          logoSize={48}
                          textSize={32}
                          showText={true}
                          showSubtext={true}
                          orientation="vertical"
                          gap="gap-1.5"
                          disableHover={true}
                        />
                      </div>

                      <div className="text-left mb-6 sm:mb-8 lg:mb-10">
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.05] text-gray-900">Sign In</h2>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-500 font-medium mt-2 lg:mt-3">Please login to continue</p>
                      </div>

                      {/* Login Form */}
                      <form onSubmit={handleFormLogin} className="space-y-5 sm:space-y-6 lg:space-y-7">
                        <div className="space-y-1 lg:space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-sm lg:text-base font-semibold text-gray-700">Email</label>
                          </div>
                          <input
                            type="email"
                            placeholder="juan.delacruz@gmail.com"
                            value={email}
                            disabled={isLoggingIn}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (attemptWarning || lockoutSeconds > 0) {
                                checkLockoutStatus(e.target.value);
                              }
                            }}
                            onBlur={() => {
                              if (email.trim()) checkLockoutStatus(email);
                            }}
                            className="w-full px-4 sm:px-5 py-2.5 sm:py-3 lg:py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl lg:rounded-2xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-3 sm:space-y-3.5">
                          <div className="space-y-1 lg:space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-sm lg:text-base font-semibold text-gray-700">Password</label>
                              <button
                                type="button"
                                disabled={isLoggingIn}
                                onClick={() => setIsForgotPasswordOpen(true)}
                                className="text-xs sm:text-sm font-semibold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Forgot?
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                disabled={isLoggingIn || lockoutSeconds > 0}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 lg:py-3.5 bg-gray-50/80 border border-gray-200 rounded-xl lg:rounded-2xl text-sm sm:text-base pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                              <button
                                type="button"
                                disabled={isLoggingIn || lockoutSeconds > 0}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center disabled:opacity-50"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>

                          {/* Remember Me Checkbox */}
                          <div className="flex items-center gap-2.5 pt-0.5">
                            <input
                              id="remember-me-checkbox"
                              type="checkbox"
                              checked={rememberMe}
                              disabled={isLoggingIn || lockoutSeconds > 0}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-4 w-4 sm:h-4.5 sm:w-4.5 rounded border-gray-300 text-[#0A6B43] focus:ring-emerald-500 cursor-pointer accent-[#0A6B43] disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <label htmlFor="remember-me-checkbox" className="text-sm lg:text-base text-gray-600 font-medium select-none cursor-pointer">
                              Remember me
                            </label>
                          </div>
                        </div>

                        {/* Cooldown Lockout Alert Box */}
                        {lockoutSeconds > 0 ? (
                          <div className="p-3.5 sm:p-4 bg-rose-50/90 border border-rose-200 rounded-xl lg:rounded-2xl text-left space-y-2 animate-in fade-in duration-200 shadow-2xs">
                            <div className="flex items-center gap-2 text-rose-800 font-black text-xs sm:text-sm uppercase tracking-wide">
                              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>Account Temporarily Locked</span>
                            </div>
                            <p className="text-xs sm:text-sm text-rose-700 font-medium leading-relaxed">
                              You entered the wrong password 5 times. For your security, this account is locked for 5 minutes.
                            </p>
                            <div className="pt-1 flex items-center justify-between border-t border-rose-200/70 text-xs text-rose-900 font-bold">
                              <span className="flex items-center gap-1.5 text-rose-800">
                                <Clock className="w-3.5 h-3.5 text-rose-600" />
                                <span>Cooldown remaining:</span>
                              </span>
                              <span className="font-mono text-xs sm:text-sm bg-white px-2.5 py-0.5 rounded-lg border border-rose-300 text-rose-700 font-black shadow-2xs">
                                {formatCooldown(lockoutSeconds)}
                              </span>
                            </div>
                          </div>
                        ) : attemptWarning ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl lg:rounded-2xl text-left flex items-center gap-2.5 animate-in fade-in duration-200">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs sm:text-sm font-semibold text-amber-800">{attemptWarning}</span>
                          </div>
                        ) : null}

                        <div className="pt-2 lg:pt-3">
                          <motion.button
                            whileHover={isLoggingIn || lockoutSeconds > 0 ? {} : { scale: 1.015 }}
                            whileTap={isLoggingIn || lockoutSeconds > 0 ? {} : { scale: 0.985 }}
                            type="submit"
                            disabled={isLoggingIn || lockoutSeconds > 0}
                            className={`w-full py-3.5 sm:py-4 lg:py-4.5 text-white text-base lg:text-lg font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 ${
                              lockoutSeconds > 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                : isLoggingIn
                                ? "bg-[#0A6B43] opacity-80 cursor-not-allowed"
                                : "bg-[#0A6B43] hover:bg-[#075332] cursor-pointer"
                            }`}
                          >
                            {isLoggingIn ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Logging in...</span>
                              </>
                            ) : lockoutSeconds > 0 ? (
                              <>
                                <Clock className="w-5 h-5 text-gray-500 animate-pulse" />
                                <span>Locked ({formatCooldown(lockoutSeconds)})</span>
                              </>
                            ) : (
                              <span>Login</span>
                            )}
                          </motion.button>
                        </div>
                      </form>

                      {/* Registration Link */}
                      <div className="text-center mt-6 sm:mt-8 lg:mt-10">
                        <p className="text-[14px] font-semibold text-gray-700">
                          New to SiKap?{" "}
                          <button
                            type="button"
                            onClick={() => setIsSelfRegistering(true)}
                            className="text-[#0A6B43] font-bold hover:text-[#075332] transition-colors cursor-pointer underline underline-offset-2"
                          >
                            Register Here
                          </button>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to Homepage link at the bottom - responsive flow */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                className="relative md:absolute mt-4 md:mt-0 bottom-auto md:bottom-6 lg:bottom-8 left-0 w-full flex justify-center z-30 pointer-events-auto pb-4 md:pb-0"
              >
                <button
                  type="button"
                  onClick={() => setViewingLanding(true)}
                  className="text-sm font-bold text-gray-400 hover:text-[#0A6B43] cursor-pointer transition-colors"
                >
                  Back to Homepage
                </button>
              </motion.div>
            </div>

          </div>
        )}

          {/* Dedicated Legal Pages (Terms & Conditions, Privacy Policy) */}
          {viewingLegal && (
            viewingLegal.tab === "terms" ? (
              <TermsPage
                onBack={() => {
                  const ret = viewingLegal.returnTo;
                  setViewingLegal(null);
                  if (ret === "landing") {
                    setViewingLanding(true);
                  }
                }}
                onNavigate={(tab) => {
                  if (tab === "privacy") {
                    setViewingLegal({ tab: "privacy", returnTo: viewingLegal.returnTo });
                  } else if (tab === "terms") {
                    setViewingLegal({ tab: "terms", returnTo: viewingLegal.returnTo });
                  } else if (tab === "register") {
                    setViewingLegal(null);
                    setIsSelfRegistering(true);
                    setViewingLanding(false);
                  } else if (tab === "login") {
                    setViewingLegal(null);
                    setIsSelfRegistering(false);
                    setViewingLanding(false);
                  }
                }}
              />
            ) : (
              <PrivacyPolicyPage
                onBack={() => {
                  const ret = viewingLegal.returnTo;
                  setViewingLegal(null);
                  if (ret === "landing") {
                    setViewingLanding(true);
                  }
                }}
                onNavigate={(tab) => {
                  if (tab === "terms") {
                    setViewingLegal({ tab: "terms", returnTo: viewingLegal.returnTo });
                  } else if (tab === "privacy") {
                    setViewingLegal({ tab: "privacy", returnTo: viewingLegal.returnTo });
                  } else if (tab === "register") {
                    setViewingLegal(null);
                    setIsSelfRegistering(true);
                    setViewingLanding(false);
                  } else if (tab === "login") {
                    setViewingLegal(null);
                    setIsSelfRegistering(false);
                    setViewingLanding(false);
                  }
                }}
              />
            )
          )}
        </>
      ) : (
        // Authenticated portals
        <div>
          {activeUserRole === UserRole.SK_OFFICIAL && (
            <SKOfficialPortal
              currentUser={session?.user}
              designatedBarangay={(session?.user as any)?.barangay || designatedBarangay}
              youthProfiles={youthProfiles}
              setYouthProfiles={setYouthProfiles}
              programs={programs}
              setPrograms={setPrograms}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
              referrals={referrals}
              setReferrals={setReferrals}
              skillsGaps={SKILLS_GAPS}
              councilors={councilors}
              setCouncilors={setCouncilors}
              onLogout={handleLogout}
              addToast={addToast}
            />
          )}

          {activeUserRole === UserRole.KK_YOUTH && (
            <KKYouthPortal
              currentUser={session?.user}
              youthProfile={activeYouthProfile}
              setYouthProfiles={setYouthProfiles}
              programs={programs}
              setPrograms={setPrograms}
              announcements={announcements}
              onLogout={handleLogout}
              addToast={addToast}
              referrals={referrals}
              setReferrals={setReferrals}
            />
          )}

          {activeUserRole === UserRole.TESDA_PARTNER && (
            <TESDAPartnerPortal
              currentUser={session?.user}
              programs={programs}
              setPrograms={setPrograms}
              referrals={referrals}
              setReferrals={setReferrals}
              youthProfiles={youthProfiles}
              onLogout={handleLogout}
              addToast={addToast}
            />
          )}

          {activeUserRole === UserRole.BARANGAY_CAPTAIN && (
            <BarangayCaptainPortal
              currentUser={session?.user}
              onLogout={handleLogout}
              designatedBarangay={(session?.user as any)?.barangay || designatedBarangay}
              youthProfiles={youthProfiles}
              referrals={referrals}
              officialAccounts={officialAccounts}
              programs={programs}
              announcements={announcements}
              councilors={councilors}
              addToast={addToast}
            />
          )}

          {activeUserRole === UserRole.SUPER_ADMIN && (
            <SuperAdminPortal
              currentUser={session?.user}
              barangays={barangays}
              setBarangays={setBarangays}
              officialAccounts={officialAccounts}
              setOfficialAccounts={setOfficialAccounts}
              youthProfiles={youthProfiles}
              setYouthProfiles={setYouthProfiles}
              programs={programs}
              councilors={councilors}
              setCouncilors={setCouncilors}
              referrals={referrals}
              announcements={announcements}
              onLogout={handleLogout}
              addToast={addToast}
            />
          )}
        </div>
      )}

      {/* Account Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialEmail={email}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(resetEmail) => {
          setIsForgotPasswordOpen(false);
          setEmail(resetEmail);
          setPassword("");
          addToast("Password reset successfully! Please sign in with your new password.", "success");
        }}
        addToast={addToast}
      />
    </div>
  );
}
