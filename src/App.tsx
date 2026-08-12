"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [viewingLanding, setViewingLanding] = useState(true);
  
  // New Super Admin & Councilor states
  const [barangays, setBarangays] = useState(INITIAL_BARANGAYS);
  const [officialAccounts, setOfficialAccounts] = useState(INITIAL_OFFICIALS);
  const [councilors, setCouncilors] = useState(INITIAL_COUNCILORS);
  const [designatedBarangay, setDesignatedBarangay] = useState<string>("San Sebastian");
  const [isSelfRegistering, setIsSelfRegistering] = useState(false);
  const [loggedInYouthId, setLoggedInYouthId] = useState<string>("y-01");

  // Shared state synchronized across portals
  const [youthProfiles, setYouthProfiles] = useState(INITIAL_YOUTH_PROFILES);
  const [programs, setPrograms] = useState(INITIAL_TESDA_PROGRAMS);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [referrals, setReferrals] = useState(INITIAL_REFERRALS);

  // Sync state from Next.js API Routes
  useEffect(() => {
    fetch("/api/youth")
      .then(res => res.json())
      .then(res => { if (res.success && res.data) setYouthProfiles(res.data); })
      .catch(err => console.log("Using initial youth profiles", err));

    fetch("/api/programs")
      .then(res => res.json())
      .then(res => { if (res.success && res.data) setPrograms(res.data); })
      .catch(err => console.log("Using initial programs", err));

    fetch("/api/announcements")
      .then(res => res.json())
      .then(res => { if (res.success && res.data) setAnnouncements(res.data); })
      .catch(err => console.log("Using initial announcements", err));

    fetch("/api/referrals")
      .then(res => res.json())
      .then(res => { if (res.success && res.data) setReferrals(res.data); })
      .catch(err => console.log("Using initial referrals", err));
  }, []);


  // Dynamic lookups for quick login aligning with designatedBarangay
  const activeBrgyChairperson = useMemo(() => {
    const cleanBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    return officialAccounts.find(o => 
      o.role === "SK Chairperson" && 
      o.barangay && 
      o.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [designatedBarangay, officialAccounts]);

  const activeBrgyYouth = useMemo(() => {
    const cleanBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    return youthProfiles.find(y => 
      y.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [designatedBarangay, youthProfiles]);

  const activeBrgyCaptain = useMemo(() => {
    const cleanBrgy = designatedBarangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
    return officialAccounts.find(o => 
      o.role === "Barangay Captain" && 
      o.barangay && 
      o.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase() === cleanBrgy
    );
  }, [designatedBarangay, officialAccounts]);

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
  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      addToast("Please input valid credentials", "error");
      return;
    }

    // Role detection fallback/match for testing
    const emailLower = email.toLowerCase();
    
    // Check dynamic officials database
    const matchedOfficial = officialAccounts.find(o => o.email.toLowerCase() === emailLower);
    if (matchedOfficial) {
      if (matchedOfficial.role === "SK Chairperson") {
        setCurrentUserRole(UserRole.SK_OFFICIAL);
        setDesignatedBarangay(matchedOfficial.barangay);
        addToast(`Successfully logged in as SK Chairperson ${matchedOfficial.name} (${matchedOfficial.barangay})!`, "success");
        return;
      } else if (matchedOfficial.role === "Barangay Captain") {
        setCurrentUserRole(UserRole.BARANGAY_CAPTAIN);
        addToast(`Successfully logged in as Barangay Captain ${matchedOfficial.name} (${matchedOfficial.barangay})!`, "success");
        return;
      }
    }

    if (emailLower === "superadmin@sikap.gov.ph" && password === "superadmin2026") {
      setCurrentUserRole(UserRole.SUPER_ADMIN);
      addToast("Successfully logged in as Super Administrator!", "success");
    } else if (emailLower.includes("official") || emailLower.includes("rhea")) {
      setCurrentUserRole(UserRole.SK_OFFICIAL);
      setDesignatedBarangay("San Sebastian");
      addToast("Successfully logged in as SK Official Rhea Cruz!", "success");
    } else if (emailLower.includes("youth") || emailLower.includes("juan")) {
      setCurrentUserRole(UserRole.KK_YOUTH);
      setLoggedInYouthId("y-01");
      addToast("Successfully logged in as KK Member Juan dela Cruz!", "success");
    } else if (emailLower.includes("partner") || emailLower.includes("tesda")) {
      setCurrentUserRole(UserRole.TESDA_PARTNER);
      addToast("Successfully logged in as TESDA Partner!", "success");
    } else if (emailLower.includes("captain") || emailLower.includes("cap")) {
      setCurrentUserRole(UserRole.BARANGAY_CAPTAIN);
      addToast("Successfully logged in as Barangay Captain Danilo Santos!", "success");
    } else {
      // Check if they matched a registered KK member name in the email address
      const matchedYouth = youthProfiles.find(y => emailLower.includes(y.name.toLowerCase().split(" ")[0]));
      if (matchedYouth) {
        setCurrentUserRole(UserRole.KK_YOUTH);
        setLoggedInYouthId(matchedYouth.id);
        addToast(`Successfully logged in as KK Member ${matchedYouth.name}!`, "success");
      } else {
        // Default to SK Official for convenient testing
        setCurrentUserRole(UserRole.SK_OFFICIAL);
        setDesignatedBarangay("San Sebastian");
        addToast("Logged in successfully (Defaulted to SK Official)", "success");
      }
    }
  };

  const handleQuickRoleSelect = (role: UserRole) => {
    setCurrentUserRole(role);
    if (role === UserRole.KK_YOUTH) {
      if (activeBrgyYouth) {
        setLoggedInYouthId(activeBrgyYouth.id);
        addToast(`Successfully logged in as KK Member ${activeBrgyYouth.name} (${activeBrgyYouth.barangay})!`, "success");
      } else {
        setLoggedInYouthId("y-01");
        addToast("Successfully logged in as KK Member Juan dela Cruz (San Sebastian)!", "success");
      }
      return;
    } else if (role === UserRole.SK_OFFICIAL) {
      const matchingChair = activeBrgyChairperson;
      const name = matchingChair ? matchingChair.name : "Rhea Cruz";
      addToast(`Prototype quick-login: Authenticated as SK Chairperson ${name} (${designatedBarangay})`, "success");
      return;
    } else if (role === UserRole.BARANGAY_CAPTAIN) {
      const matchingCaptain = activeBrgyCaptain;
      const name = matchingCaptain ? matchingCaptain.name : "Capt. Danilo Santos";
      addToast(`Prototype quick-login: Authenticated as Barangay Captain ${name} (${designatedBarangay})`, "success");
      return;
    }
    addToast(`Prototype quick-login: Authenticated as ${role}`, "success");
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
    setEmail("");
    setPassword("");
    setViewingLanding(true);
    addToast("Logged out successfully.", "info");
  };

  // Find dynamic logged-in youth's profile for the Youth Portal view
  const activeYouthProfile = youthProfiles.find(y => y.id === loggedInYouthId) || youthProfiles[0];

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
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
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

                {/* Target Barangay Select for testing */}
                <div className="mt-4 pt-3 border-t border-gray-150 space-y-1.5 bg-emerald-50/25 p-2.5 rounded-lg">
                  <label className="text-[9px] font-black uppercase text-[#0A6B43] block">
                    Target Barangay (for Quick Login & Portal Testing)
                  </label>
                  <select
                    value={designatedBarangay}
                    onChange={(e) => setDesignatedBarangay(e.target.value)}
                    className="w-full p-1.5 border border-[#A7F3D0] bg-white rounded-md text-xs font-bold text-gray-700 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
                  >
                    {barangays.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prototype Role Picker Grid */}
                <div className="space-y-2.5 pt-4 border-t border-gray-150">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">
                    Quick Access Portal Demo Roles
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { role: UserRole.SK_OFFICIAL, label: "SK Official", desc: activeBrgyChairperson ? activeBrgyChairperson.name : "Chairperson Cruz", icon: <Shield className="w-4 h-4 text-[#0A6B43]" /> },
                      { role: UserRole.KK_YOUTH, label: "Youth Member", desc: activeBrgyYouth ? activeBrgyYouth.name : "Juan dela Cruz", icon: <Award className="w-4 h-4 text-[#D97706]" /> },
                      { role: UserRole.TESDA_PARTNER, label: "TESDA Partner", desc: "GPSAT Rep", icon: <Briefcase className="w-4 h-4 text-[#0F6E56]" /> },
                      { role: UserRole.BARANGAY_CAPTAIN, label: "Brgy Captain", desc: "Danilo Santos", icon: <Landmark className="w-4 h-4 text-[#1C2B20]" /> },
                      { role: UserRole.SUPER_ADMIN, label: "Super Admin", desc: "System Manager", icon: <Shield className="w-4 h-4 text-[#0D1B3E]" /> }
                    ].map((tile) => (
                      <button
                        key={tile.role}
                        onClick={() => handleQuickRoleSelect(tile.role)}
                        className="p-3 border border-gray-150 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-xl text-left transition-all flex flex-col justify-between"
                      >
                        <div className="flex justify-between items-start w-full">
                          {tile.icon}
                          <UserCheck className="w-3.5 h-3.5 text-gray-300" />
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-extrabold text-gray-800">{tile.label}</p>
                          <p className="text-[9px] text-gray-400 font-medium mt-0.5">{tile.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
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
              designatedBarangay={designatedBarangay}
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
              onLogout={handleLogout}
              designatedBarangay={designatedBarangay}
              youthProfiles={youthProfiles}
              referrals={referrals}
              officialAccounts={officialAccounts}
              programs={programs}
            />
          )}

          {currentUserRole === UserRole.SUPER_ADMIN && (
            <SuperAdminPortal
              barangays={barangays}
              setBarangays={setBarangays}
              officialAccounts={officialAccounts}
              setOfficialAccounts={setOfficialAccounts}
              youthProfiles={youthProfiles}
              setYouthProfiles={setYouthProfiles}
              programs={programs}
              councilors={councilors}
              onLogout={handleLogout}
              addToast={addToast}
            />
          )}
        </div>
      )}
    </div>
  );
}
