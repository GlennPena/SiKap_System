"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Briefcase, Eye, EyeOff, Shield, Award, Landmark, UserCheck, ArrowLeft, Sparkles } from "lucide-react";

export default function App() {
  const { data: session, status } = useSession();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [viewingLanding, setViewingLanding] = useState(true);
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

  // Sync state from Next.js API Routes
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/youth")
        .then(res => res.json())
        .then(res => { if (res.success && res.data) setYouthProfiles(res.data); })
        .catch(err => console.log("Error fetching youth profiles", err));

      fetch("/api/programs")
        .then(res => res.json())
        .then(res => { if (res.success && res.data) setPrograms(res.data); })
        .catch(err => console.log("Error fetching programs", err));

      fetch("/api/announcements")
        .then(res => res.json())
        .then(res => { if (res.success && res.data) setAnnouncements(res.data); })
        .catch(err => console.log("Error fetching announcements", err));

      fetch("/api/referrals")
        .then(res => res.json())
        .then(res => { if (res.success && res.data) setReferrals(res.data); })
        .catch(err => console.log("Error fetching referrals", err));

      fetch("/api/councilors")
        .then(res => res.json())
        .then(res => { if (res.success && res.data) setCouncilors(res.data); })
        .catch(err => console.log("Error fetching councilors", err));

      if ((session?.user as any)?.role === "SUPER_ADMIN" || (session?.user as any)?.role === "BARANGAY_CAPTAIN") {
        fetch("/api/users")
          .then(res => res.json())
          .then(res => { if (res.success && res.data) setOfficialAccounts(res.data); })
          .catch(err => console.log("Error fetching users", err));
      }
    }
  }, [status, session]);


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

  // Standard login trigger
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast("Please input valid credentials", "error");
      return;
    }

    const res = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (res?.error) {
      addToast("Invalid credentials", "error");
    } else {
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
  };

  const handleLogout = async () => {
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
    name: session?.user?.name || "Youth Member",
    age: 18,
    purok: "Purok 1",
    barangay: (session?.user as any)?.barangay || "",
    educationalAttainment: "High School Graduate",
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
    const found = youthProfiles.find(y =>
      (loggedInYouthId && y.id === loggedInYouthId) ||
      (y.userId && (session?.user as any)?.id && y.userId === (session?.user as any)?.id) ||
      (session?.user?.email && y.email && y.email.toLowerCase().trim() === session.user.email.toLowerCase().trim()) ||
      (session?.user?.name && y.name && y.name.toLowerCase().trim() === session.user.name.toLowerCase().trim())
    );

    if (found) return found;

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
    <div className="font-sans antialiased" id="sikap-application-root">
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
        viewingLanding ? (
          <LandingPage
            programs={programs}
            onEnterLogin={() => setViewingLanding(false)}
            addToast={addToast}
          />
        ) : (
          <div className="h-screen flex flex-col md:flex-row bg-white p-4 sm:p-6 gap-6 overflow-hidden">

            {/* Left panel as a card */}
            <div className="md:w-[45%] bg-[#0A6B43] rounded-[1.5rem] p-8 md:p-10 flex flex-col shrink-0 relative overflow-hidden shadow-xl">

              {/* Header Row: Welcome Text & Back Button inline */}
              <div className="flex items-start justify-between w-full relative z-10 mb-8">
                <div className="w-full mt-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.6rem] font-black leading-[1.05] tracking-tight text-white mb-2 whitespace-nowrap">
                    Your Path Continues Here
                  </h1>
                  <p className="text-base md:text-lg text-emerald-100/90 leading-relaxed font-medium pr-4 mt-2">
                    Sign in to explore opportunities matched to you.
                  </p>
                </div>
              </div>

              {/* Hero "Image" Mockup - tilted clockwise to face left, tall format */}
              <div className="absolute top-[28%] -left-[30%] w-[80%] max-w-[800px] transform scale-[1.3] origin-top-left">
                <div className="bg-white border-2 border-emerald-100/90 rounded-3xl p-8 shadow-2xl aspect-[3/4] min-h-[600px] overflow-hidden transition-transform duration-700 hover:rotate-0 [transform:perspective(1200px)_rotateX(0deg)_rotateY(-10deg)_rotateZ(9deg)]">
                  <div className="transform scale-[1.5] origin-top-right w-[68%] ml-auto space-y-6">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 font-black text-sm shadow-inner border border-emerald-100">
                          KK
                        </div>
                        <div>
                          <h4 className="text-base font-black text-gray-900">Juan dela Cruz</h4>
                          <p className="text-sm text-gray-400 font-bold">Purok 2, San Sebastian</p>
                        </div>
                      </div>
                      <span className="text-xs bg-[#0A6B43] text-white px-3 py-1.5 rounded-full font-black uppercase tracking-wider shadow-2xs">
                        OSY Youth
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#075332] uppercase tracking-wide">Recommended Course</span>
                          <span className="text-xs font-black text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-2xs border border-emerald-100">94% Match</span>
                        </div>
                        <p className="text-base font-black text-gray-900 mt-2">Shielded Metal Arc Welding (SMAW) NC II</p>
                      </div>

                      <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200/70 text-sm text-amber-950 leading-relaxed space-y-2">
                        <div className="flex items-center gap-1.5 font-black text-sm text-amber-900">
                          <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500 shrink-0" />
                          Gemini Match Rationale
                        </div>
                        <p className="text-gray-700 font-medium text-xs leading-relaxed">
                          "Juan has hands-on skills in metal fabrication. This vocational program will officially certify his qualifications under TESDA and unlock formal job opportunities in regional manufacturing hubs."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right panel */}
            <div className={`flex-1 bg-white relative min-h-[600px] h-full flex flex-col items-center justify-center p-6 md:px-12 md:py-8 overflow-hidden`}>

              {/* Logo centered at top - identical in both sign in and register */}
              <div className="absolute top-4 md:top-6 left-0 w-full flex justify-center z-50 pointer-events-auto">
                <SikapLogo size={48} logoSize={60} textSize={40} showText={true} showSubtext={false} gap="gap-1" disableHover={true} />
              </div>

              <div className={`w-full z-10 relative ${isSelfRegistering ? 'flex-1 flex flex-col min-h-0 max-w-2xl px-2 pt-[64px] md:pt-[78px] pb-10 md:pb-12' : 'max-w-md space-y-6'}`}>
                {isSelfRegistering ? (
                  <>
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
                    />
                    <div className="text-center pt-2 shrink-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-700">
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
                  </>
                ) : (
                  <>
                    <div className="text-left mb-10">
                      <h2 className="text-4xl font-black tracking-tight leading-[1.05] text-gray-900">Sign In</h2>
                      <p className="text-base text-gray-500 font-medium mt-2.5">Please login to continue</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleFormLogin} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Email</label>
                        <input
                          type="email"
                          placeholder="juan.delacruz@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-semibold text-gray-700">Password</label>
                          <button
                            type="button"
                            onClick={() => setIsForgotPasswordOpen(true)}
                            className="text-xs font-semibold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer"
                          >
                            Forgot?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>

                        {/* Remember Me Checkbox (nested closer to password) */}
                        <div className="flex items-center gap-2.5 pt-2">
                          <input
                            id="remember-me-checkbox"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-[#0A6B43] focus:ring-emerald-500 cursor-pointer accent-[#0A6B43]"
                          />
                          <label htmlFor="remember-me-checkbox" className="text-sm text-gray-600 font-medium select-none cursor-pointer">
                            Remember me
                          </label>
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full py-4 bg-[#0A6B43] hover:bg-[#075332] text-white text-base font-bold rounded-2xl shadow-md transition-colors cursor-pointer"
                        >
                          Login
                        </button>
                      </div>
                    </form>

                    {/* Registration Link */}
                    <div className="text-center mt-8">
                      <p className="text-sm font-semibold text-gray-700">
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
                  </>
                )}
              </div>

              {/* Back to Homepage link at the very bottom - identical in both sign in and register */}
              <div className="absolute bottom-4 md:bottom-6 left-0 w-full flex justify-center z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => setViewingLanding(true)}
                  className="text-sm font-bold text-gray-400 hover:text-[#0A6B43] cursor-pointer transition-colors"
                >
                  Back to Homepage
                </button>
              </div>
            </div>

          </div>
        )
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
