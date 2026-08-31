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
import { Briefcase, Eye, EyeOff, Shield, Award, Landmark, UserCheck, ArrowLeft } from "lucide-react";

export default function App() {
  const { data: session, status } = useSession();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [viewingLanding, setViewingLanding] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  
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
        
      if ((session?.user as any)?.role === "SUPER_ADMIN") {
        fetch("/api/users")
          .then(res => res.json())
          .then(res => { if (res.success && res.data) setOfficialAccounts(res.data); })
          .catch(err => console.log("Error fetching users", err));
      }
    }
  }, [status, session]);


  // Simple toast system
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);
  
  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = Date.now().toString();
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
    barangay: "San Sebastian",
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

  const activeYouthProfile = youthProfiles.find(y => 
    y.id === loggedInYouthId || 
    (session?.user?.name && y.name && y.name.toLowerCase().trim() === session.user.name.toLowerCase().trim()) ||
    (session?.user?.email && y.email && y.email.toLowerCase().trim() === session.user.email.toLowerCase().trim()) ||
    (y.userId && (session?.user as any)?.id && y.userId === (session?.user as any)?.id)
  ) || youthProfiles[0] || defaultEmptyYouthProfile;

  return (
    <div className="font-sans antialiased" id="sikap-application-root">
      {/* Toast Alert stack */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast
              message={t.message}
              type={t.type}
              onClose={() => removeToast(t.id)}
            />
          </div>
        ))}
      </div>

      {currentUserRole === null ? (
        isSelfRegistering ? (
          <KKYouthRegister
            onRegisterComplete={(newProfile) => {
              setYouthProfiles(prev => [newProfile, ...prev]);
              setLoggedInYouthId(newProfile.id);
              setCurrentUserRole(UserRole.KK_YOUTH);
              setIsSelfRegistering(false);
              setViewingLanding(false);
              addToast(`Welcome ${newProfile.name}! Registered successfully. Your account is view-only pending SK Chairperson verification.`, "success");
            }}
            onBackToHome={() => {
              setIsSelfRegistering(false);
              setViewingLanding(true);
            }}
          />
        ) : viewingLanding ? (
          <LandingPage
            programs={programs}
            onEnterLogin={() => setViewingLanding(false)}
            addToast={addToast}
          />
        ) : (
          // Split layout login screen
          <div className="min-h-screen flex flex-col md:flex-row">
            
            {/* Left panel */}
            <div className="md:w-1/2 bg-[#1C2B20] text-white p-8 md:p-16 flex flex-col justify-between shrink-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <SikapLogo size={36} variant="white" showText={true} />
                  <span className="text-xs font-black text-emerald-100 uppercase tracking-widest ml-1.5 border-l border-emerald-500/30 pl-2">San Luis</span>
                </div>
                
                {/* Back to Home Button */}
                <button
                  type="button"
                  onClick={() => setViewingLanding(true)}
                  className="flex items-center gap-1.5 text-xs font-extrabold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-all shadow-xs"
                  id="login-back-to-home-btn"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Home
                </button>
              </div>

              <div className="max-w-md my-12">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                  AI-Integrated Youth Skills & Livelihood Matching System
                </h1>
                <p className="text-amber-500 font-semibold mt-3 text-lg">
                  "Your skills. Your pathway. Your future."
                </p>
                <p className="text-sm text-gray-300 mt-4 leading-relaxed">
                  SiKap automates skills mapping for the Katipunan ng Kabataan members across the Municipality of San Luis, Pampanga. Connecting out-of-school youth to active TESDA programs with Google Gemini explanation rationales.
                </p>
              </div>

              <div className="text-xs text-gray-400">
                <p>© 2026 Sangguniang Kabataan Federation of San Luis, Pampanga.</p>
                <p className="mt-1">Powered by content-based filtering algorithms & Gemini AI models.</p>
              </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 bg-[#FAFAF8] p-8 md:p-16 flex flex-col justify-center items-center">
              <div className="w-full max-w-md bg-white border border-[#D1FAE5] rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
                
                <div className="text-center">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                    Authorized Sign In
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">Sign in to SiKap</h2>
                  <p className="text-xs text-gray-500 mt-1">Sangguniang Kabataan Youth database portals</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleFormLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="rhea.cruz@sanluispampanga.gov.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-gray-500 uppercase">Password</label>
                      <a href="#forgot" onClick={(e) => { e.preventDefault(); addToast("Password recovery link sent if registered.", "info"); }} className="text-[10px] font-bold text-[#0A6B43] hover:underline">
                        Forgot?
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2.5 border border-gray-200 rounded-lg text-xs pr-10 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Simple Remember Me Checkbox */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      id="remember-me-checkbox"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-[#0A6B43] focus:ring-emerald-500 cursor-pointer accent-[#0A6B43]"
                    />
                    <label htmlFor="remember-me-checkbox" className="text-xs text-gray-600 select-none cursor-pointer">
                      Remember me
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-500 font-medium">
                    Out-of-School Youth (OSY) in San Luis?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSelfRegistering(true)}
                      className="font-extrabold text-[#0A6B43] hover:underline cursor-pointer"
                    >
                      Register Profile Here
                    </button>
                  </p>
                </div>

              </div>
            </div>

          </div>
        )
      ) : (
        // Authenticated portals
        <div>
          {currentUserRole === UserRole.SK_OFFICIAL && (
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

          {currentUserRole === UserRole.KK_YOUTH && (
            <KKYouthPortal
              currentUser={session?.user}
              youthProfile={activeYouthProfile}
              setYouthProfiles={setYouthProfiles}
              programs={programs}
              announcements={announcements}
              onLogout={handleLogout}
              addToast={addToast}
              referrals={referrals}
              setReferrals={setReferrals}
            />
          )}

          {currentUserRole === UserRole.TESDA_PARTNER && (
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

          {currentUserRole === UserRole.BARANGAY_CAPTAIN && (
            <BarangayCaptainPortal
              currentUser={session?.user}
              onLogout={handleLogout}
              designatedBarangay={(session?.user as any)?.barangay || designatedBarangay}
              youthProfiles={youthProfiles}
              referrals={referrals}
              officialAccounts={officialAccounts}
              programs={programs}
            />
          )}

          {currentUserRole === UserRole.SUPER_ADMIN && (
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
    </div>
  );
}
