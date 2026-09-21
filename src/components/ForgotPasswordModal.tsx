"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  KeyRound, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, 
  CheckCircle2, AlertCircle, RefreshCw, X, Sparkles, ShieldCheck
} from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialEmail = "",
  onClose,
  onSuccess,
  addToast,
}) => {
  const [step, setStep] = useState<"EMAIL" | "CODE" | "PASSWORD" | "SUCCESS">("EMAIL");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Account details returned after email lookup
  const [accountInfo, setAccountInfo] = useState<{
    name: string;
    designation: string;
    maskedEmail: string;
  } | null>(null);

  const [devCode, setDevCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  const codeInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail || "");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setErrorMsg(null);
      setDevCode(null);
      setAccountInfo(null);
      setStep("EMAIL");
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  if (!isOpen) return null;

  // STEP 1: Request code
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid registered email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to process recovery request.");
      }

      setAccountInfo({
        name: data.accountName || "Account Holder",
        designation: data.designation || "Registered User",
        maskedEmail: data.maskedEmail || cleanEmail,
      });

      if (data.devCode) {
        setDevCode(data.devCode);
      }

      setResendCountdown(60);
      setStep("CODE");
      addToast("Verification code dispatched to your email.", "info");

      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to send recovery code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify Code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setErrorMsg("Please enter the complete 6-digit numeric recovery code.");
      return;
    }

    // Advance to new password step
    setStep("PASSWORD");
  };

  // STEP 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Password confirmation does not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setStep("SUCCESS");
      addToast("Password reset successfully! You can now log in.", "success");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to reset password. Please check your code.");
      // If code was invalid, step back to code
      if (err.message?.toLowerCase().includes("code")) {
        setStep("CODE");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-emerald-100 rounded-3xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl flex flex-col text-slate-800 animate-in zoom-in-95 duration-150 relative">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#112F24] to-[#164132] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-emerald-200/80 hover:text-white hover:bg-white/10 p-1.5 rounded-xl transition-colors cursor-pointer"
            title="Close recovery"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Security Recovery
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                Account Password Recovery
              </h3>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {step !== "SUCCESS" && (
            <div className="flex items-center gap-1.5 mt-5">
              {[
                { s: "EMAIL", num: 1, label: "Email" },
                { s: "CODE", num: 2, label: "Verify" },
                { s: "PASSWORD", num: 3, label: "Password" },
              ].map((st, i) => {
                const isActive = step === st.s;
                const isPassed =
                  (st.s === "EMAIL" && (step === "CODE" || step === "PASSWORD")) ||
                  (st.s === "CODE" && step === "PASSWORD");

                return (
                  <React.Fragment key={st.s}>
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                          isActive
                            ? "bg-amber-400 text-slate-950"
                            : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-emerald-900/80 text-emerald-300 border border-emerald-700"
                        }`}
                      >
                        {isPassed ? "✓" : st.num}
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isActive ? "text-white" : "text-emerald-300/80"
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                    {i < 2 && (
                      <div
                        className={`flex-1 h-0.5 rounded-full ${
                          isPassed ? "bg-emerald-500" : "bg-emerald-900/80"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Error Alert Box */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: ENTER EMAIL */}
          {/* ============================================================ */}
          {step === "EMAIL" && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-4">
                  Please enter your registered SiKap email address. We will verify your account and issue a 6-digit recovery verification code.
                </p>

                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. rhea.cruz@sanluispampanga.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs font-medium pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1.5">
                  Applies to all accounts: KK Youth, SK Officials, Captains, TESDA, and Super Admin.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Checking Account...
                    </>
                  ) : (
                    <>
                      Send Recovery Code
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 2: ENTER 6-DIGIT CODE */}
          {/* ============================================================ */}
          {step === "CODE" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              {/* Account Match Badge */}
              {accountInfo && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                      Verified Account
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.2 rounded-full">
                      Active
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-xs">{accountInfo.name}</p>
                  <p className="text-[11px] text-emerald-800 font-medium">{accountInfo.designation}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Dispatched to: {accountInfo.maskedEmail}</p>
                </div>
              )}

              {/* Dev / Local Mode Helper */}
              {devCode && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Local / Intranet Environment Code:</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-amber-200 px-3 py-1.5 rounded-lg">
                    <span className="font-mono font-black text-lg text-[#0A6B43] tracking-widest">{devCode}</span>
                    <button
                      type="button"
                      onClick={() => setCode(devCode)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  6-Digit Recovery Verification Code
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-xl font-mono font-black tracking-widest px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                />
                <p className="text-[11px] text-slate-400 text-center font-medium mt-1.5">
                  Enter the 6-digit numeric security code sent to your email.
                </p>
              </div>

              {/* Resend Code Button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  disabled={resendCountdown > 0 || isLoading}
                  onClick={handleRequestCode}
                  className="text-xs font-bold text-[#0A6B43] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                  {resendCountdown > 0
                    ? `Resend code in ${resendCountdown}s`
                    : "Did not receive code? Resend Code"}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={code.trim().length !== 6}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Verify Code
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 3: NEW PASSWORD */}
          {/* ============================================================ */}
          {step === "PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed mb-3">
                  Identity verified! Create a new secure password for your account.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      New Password (minimum 6 characters)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPass ? "text" : "password"}
                        required
                        minLength={6}
                        autoFocus
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full text-xs font-medium pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full text-xs font-medium pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A6B43] bg-white text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation indicators */}
                <div className="pt-2 space-y-1 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${newPassword.length >= 6 ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span>{newPassword.length >= 6 ? "✓" : "•"}</span>
                    <span>At least 6 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmPassword ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                    <span>{newPassword && newPassword === confirmPassword ? "✓" : "•"}</span>
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("CODE")}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Set New Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 4: SUCCESS */}
          {/* ============================================================ */}
          {step === "SUCCESS" && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-200">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">
                  Password Reset Successful!
                </h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed max-w-xs mx-auto">
                  Your credentials have been securely updated in the database. You can now log in using your new password.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onSuccess(email)}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black bg-[#0A6B43] hover:bg-[#085435] text-white shadow-xs transition-colors cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
