"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import {
  Building2,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
  Clock,
  ShieldCheck,
  Award,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Flame
} from "lucide-react";
import { motion } from "motion/react";
import { Toast, SikapLogo } from "./ReusableComponents";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import { AnimatedGridBackground } from "./AnimatedGridBackground";
import { sanitizeClientError } from "../lib/utils";

export const TESDAPartnerLogin: React.FC = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [roleErrorNotice, setRoleErrorNotice] = useState<string | null>(null);

  // Rate limiting / lockout states
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Toast system
  const [toasts, setToasts] = useState<
    { id: string; message: string; type: "success" | "error" | "info" }[]
  >([]);
  const toastCounterRef = React.useRef(0);

  const addToast = (message: string, type: "success" | "error" | "info") => {
    const id = `${Date.now()}-${++toastCounterRef.current}`;
    const safeMessage = type === "error" ? sanitizeClientError(message) : message;
    setToasts((prev) => [...prev, { id, message: safeMessage, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Redirect already-authenticated TESDA_PARTNER users directly to the Partner Dashboard
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any).role;
      if (userRole === "TESDA_PARTNER") {
        if (typeof window !== "undefined") {
          const isRemembered =
            (session.user as any).rememberMe ??
            localStorage.getItem("sikap_remember_me") === "true";
          const isSessionActive =
            sessionStorage.getItem("sikap_session_active") === "true";
          if (isRemembered || isSessionActive) {
            router.replace("/partners/dashboard");
          }
        }
      }
    }
  }, [status, session, router]);

  // 1-second countdown interval for 5-minute cooldown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const checkLockoutStatus = async (userEmail: string) => {
    if (!userEmail.trim()) {
      setLockoutSeconds(0);
      return;
    }
    try {
      const res = await fetch(
        `/api/auth/login-status?email=${encodeURIComponent(userEmail.trim().toLowerCase())}`
      );
      const data = await res.json();
      if (data.isLocked) {
        setLockoutSeconds(data.remainingSeconds || 300);
      } else {
        setLockoutSeconds(0);
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

  const handlePartnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn || lockoutSeconds > 0) return;
    setPendingNotice(null);
    setRoleErrorNotice(null);

    if (!email.trim() || !password.trim()) {
      addToast("Please enter your institutional email and password.", "error");
      return;
    }

    setIsLoggingIn(true);
    try {
      // If a non-TESDA user is currently logged in, sign them out first before authenticating the partner account
      if (status === "authenticated" && (session?.user as any)?.role !== "TESDA_PARTNER") {
        await signOut({ redirect: false });
      }

      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        rememberMe: rememberMe ? "true" : "false",
        portalType: "PARTNER",
        redirect: false
      });

      if (res?.error) {
        const errorText =
          res.error === "CredentialsSignin" ? "Invalid email or password" : res.error;

        if (errorText.toLowerCase().includes("pending verification")) {
          setPendingNotice(errorText);
        } else if (errorText.toLowerCase().includes("access denied")) {
          setRoleErrorNotice(errorText);
        }

        addToast(errorText, "error");
        setIsLoggingIn(false);
        await checkLockoutStatus(email);
      } else {
        setLockoutSeconds(0);
        if (typeof window !== "undefined") {
          if (rememberMe) {
            localStorage.setItem("sikap_remember_me", "true");
            sessionStorage.removeItem("sikap_session_active");
          } else {
            localStorage.removeItem("sikap_remember_me");
            sessionStorage.setItem("sikap_session_active", "true");
          }
        }
        addToast("Successfully signed in to the TESDA Partner Portal!", "success");
        router.push("/partners/dashboard");
      }
    } catch {
      addToast("An error occurred during sign in. Please try again.", "error");
      setIsLoggingIn(false);
    }
  };

  const isNonPartnerAuthenticated =
    status === "authenticated" &&
    session?.user &&
    (session.user as any).role !== "TESDA_PARTNER";

  return (
    <div
      className="font-sans antialiased w-full max-w-full overflow-x-clip"
      id="tesda-partner-login-root"
    >
      {/* Toast Notifications */}
      <aside
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-[calc(100vw-2rem)] sm:max-w-md w-full items-end"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            message={t.message}
            type={t.type}
            onClose={() => removeToast(t.id)}
          />
        ))}
      </aside>

      <div className="min-h-[100dvh] xl:h-[100dvh] flex flex-col xl:flex-row bg-white p-3 sm:p-6 gap-6 xl:overflow-hidden">
        {/* Left Panel: TESDA Partner Showcase Card (Visible on xl+) */}
        <div className="hidden xl:flex xl:w-[45%] bg-[#0A4D30] rounded-[1.5rem] p-8 xl:p-10 flex-col justify-between shrink-0 relative overflow-hidden shadow-xl border border-emerald-800/60">
          {/* Redox Texture Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
            style={{
              backgroundImage: "url('/redox-02.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px"
            }}
          />

          {/* Animated 3D Grid Overlay */}
          <AnimatedGridBackground />

          {/* Subtle Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.18),transparent_70%)] pointer-events-none z-0" />

          {/* Top Narrative */}
          <div className="relative z-10 space-y-4 mt-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              <span>TESDA Partner Portal</span>
            </div>

            <motion.h1
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="text-3xl xl:text-[2.4rem] font-black leading-[1.08] tracking-tight text-white drop-shadow-xs"
            >
              Your Journey Starts Here
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
              className="text-base text-emerald-100/90 leading-relaxed font-medium pr-4"
            >
              Explore new possibilities and take the next step toward growth.
            </motion.p>
          </div>

          {/* Center Preview Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
            className="relative z-10 my-auto py-4"
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-emerald-100 space-y-4">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0A6B43] font-black text-xs shrink-0">
                    TTI
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900">
                      TESDA GPSAT Campus
                    </h4>
                    <p className="text-xs text-gray-400 font-bold">
                      CPTR-R03-PAM-2026 • Accredited Partner
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-[#0A6B43] text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Active Partner
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-100">
                  <span className="text-[10px] font-black text-[#075332] uppercase tracking-wider block">
                    Active Programs
                  </span>
                  <p className="text-2xl font-black text-gray-900 mt-1">6 Cohorts</p>
                  <span className="text-[11px] font-bold text-[#0A6B43] mt-0.5 block">
                    88% Slot Utilization
                  </span>
                </div>
                <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/70">
                  <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                    Matched Applicants
                  </span>
                  <p className="text-2xl font-black text-gray-900 mt-1">148 Youth</p>
                  <span className="text-[11px] font-bold text-amber-800 mt-0.5 block">
                    17 San Luis Barangays
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/70 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    Latest Matched Applicant
                  </span>
                  <p className="text-xs font-black text-gray-900 mt-0.5">
                    Juan dela Cruz → SMAW NC II
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-black text-[#0A6B43] bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  94% Match
                </span>
              </div>
            </div>
          </motion.div>

          {/* Bottom Trust Footer */}
          <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/90 font-semibold pt-2 border-t border-white/15">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Role-Verified Institutional Access</span>
            </span>
            <span>Municipality of San Luis, Pampanga</span>
          </div>
        </div>

        {/* Right Panel: Partner Sign In Form */}
        <div className="flex-1 bg-white relative xl:h-full w-full flex flex-col items-center justify-between p-4 sm:p-6 md:px-10 lg:px-14 xl:px-20 py-4 sm:py-6 overflow-y-auto">
          {/* Desktop Top Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="hidden md:flex relative w-full justify-center shrink-0 pb-3 z-30"
          >
            <Link href="/partners">
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
            </Link>
          </motion.div>

          <div className="w-full flex-1 flex justify-center items-center my-auto py-3">
            <div className="w-full z-10 relative max-w-md sm:max-w-lg xl:max-w-[520px] space-y-5">
              {/* Mobile Top Logo */}
              <div className="md:hidden flex flex-col items-center justify-center pt-1 pb-2">
                <Link href="/partners">
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
                </Link>
              </div>

              {/* Form Header */}
              <div className="text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/90 text-[#0A6B43] text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>For TESDA Partners &amp; Training Providers</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900">
                  Partner Sign In
                </h2>
                <p className="text-sm sm:text-base text-gray-500 font-medium">
                  Sign in with your approved TESDA representative or institutional account.
                </p>
              </div>

              {/* Notice if currently signed in as a non-partner role (e.g., KK Youth) */}
              {isNonPartnerAuthenticated && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-black uppercase tracking-wider text-amber-800">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Non-Partner Session Detected</span>
                  </div>
                  <p className="font-medium leading-relaxed">
                    You are currently signed in as <strong>{session?.user?.email}</strong> ({(session?.user as any)?.role}). KK Youth and non-partner accounts cannot access the TESDA Partner Dashboard. Sign in below with an approved institutional account or{" "}
                    <Link href="/" className="underline font-bold text-[#0A6B43]">
                      return to your portal
                    </Link>
                    .
                  </p>
                </div>
              )}

              {/* Pending Verification Callout */}
              {pendingNotice && (
                <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-left space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Pending Verification Status</span>
                  </div>
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    {pendingNotice}
                  </p>
                </div>
              )}

              {/* Role Restriction Callout */}
              {roleErrorNotice && (
                <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl text-left space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-2 text-rose-800 font-black text-xs uppercase tracking-wider">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Institutional Role Required</span>
                  </div>
                  <p className="text-xs text-rose-700 font-medium leading-relaxed">
                    {roleErrorNotice}{" "}
                    <Link href="/?action=login" className="underline font-bold">
                      Go to KK Youth Sign In →
                    </Link>
                  </p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handlePartnerLogin} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 block">
                    Institutional Email
                  </label>
                  <input
                    type="email"
                    placeholder="registrar@institution.edu.ph"
                    value={email}
                    disabled={isLoggingIn}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (lockoutSeconds > 0) {
                        checkLockoutStatus(e.target.value);
                      }
                    }}
                    onBlur={() => {
                      if (email.trim()) checkLockoutStatus(email);
                    }}
                    className="w-full px-4 sm:px-5 py-3 bg-gray-50/80 border border-gray-200 rounded-xl sm:rounded-2xl text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-gray-700">
                        Password
                      </label>
                      <button
                        type="button"
                        disabled={isLoggingIn}
                        onClick={() => setIsForgotPasswordOpen(true)}
                        className="text-xs sm:text-sm font-semibold text-[#0A6B43] hover:text-[#075332] transition-colors cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        disabled={isLoggingIn || lockoutSeconds > 0}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 sm:px-5 py-3 bg-gray-50/80 border border-gray-200 rounded-xl sm:rounded-2xl text-sm sm:text-base pr-12 focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        disabled={isLoggingIn || lockoutSeconds > 0}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center gap-2.5 pt-0.5">
                    <input
                      id="partner-remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      disabled={isLoggingIn || lockoutSeconds > 0}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[#0A6B43] focus:ring-emerald-500 cursor-pointer accent-[#0A6B43]"
                    />
                    <label
                      htmlFor="partner-remember-me"
                      className="text-sm text-gray-600 font-medium select-none cursor-pointer"
                    >
                      Remember me
                    </label>
                  </div>
                </div>

                {/* Cooldown Lockout Alert */}
                {lockoutSeconds > 0 && (
                  <div className="p-3.5 sm:p-4 bg-rose-50/90 border border-rose-200 rounded-xl sm:rounded-2xl text-left space-y-2 animate-in fade-in">
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
                      <span className="font-mono text-xs sm:text-sm bg-white px-2.5 py-0.5 rounded-lg border border-rose-300 text-rose-700 font-black">
                        {formatCooldown(lockoutSeconds)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <motion.button
                    whileHover={isLoggingIn || lockoutSeconds > 0 ? {} : { scale: 1.01 }}
                    whileTap={isLoggingIn || lockoutSeconds > 0 ? {} : { scale: 0.99 }}
                    type="submit"
                    disabled={isLoggingIn || lockoutSeconds > 0}
                    className={`w-full py-3.5 sm:py-4 text-white text-base font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 ${
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
                        <span>Signing in...</span>
                      </>
                    ) : lockoutSeconds > 0 ? (
                      <>
                        <Clock className="w-5 h-5 text-gray-500 animate-pulse" />
                        <span>Locked ({formatCooldown(lockoutSeconds)})</span>
                      </>
                    ) : (
                      <span>Partner Sign In</span>
                    )}
                  </motion.button>
                </div>
              </form>

              {/* Registration & KK Youth Links */}
              <div className="text-center pt-2 space-y-2.5">
                <p className="text-sm font-semibold text-gray-700">
                  Not yet a registered partner?{" "}
                  <Link
                    href="/partners/register"
                    className="text-[#0A6B43] font-bold hover:text-[#075332] transition-colors underline underline-offset-2"
                  >
                    Become a SiKap Partner
                  </Link>
                </p>
                <p className="text-xs text-gray-500 font-medium pt-2 border-t border-gray-100">
                  Are you a San Luis youth member?{" "}
                  <Link
                    href="/?action=login"
                    className="text-[#0A6B43] font-bold hover:text-[#075332] transition-colors underline underline-offset-2"
                  >
                    KK Youth Sign In →
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Back to Partner Landing Page */}
          <div className="relative w-full flex items-center justify-center gap-6 shrink-0 pt-4 pb-1 mt-auto z-30">
            <Link
              href="/partners"
              className="text-sm font-bold text-gray-400 hover:text-[#0A6B43] transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Partner Overview</span>
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/"
              className="text-sm font-bold text-gray-400 hover:text-[#0A6B43] transition-colors"
            >
              KK Youth Homepage
            </Link>
          </div>
        </div>
      </div>

      {/* Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        initialEmail={email}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccess={(resetEmail) => {
          setIsForgotPasswordOpen(false);
          setEmail(resetEmail);
          setPassword("");
          addToast(
            "Password reset successfully! Please sign in with your new password.",
            "success"
          );
        }}
        addToast={addToast}
      />
    </div>
  );
};

