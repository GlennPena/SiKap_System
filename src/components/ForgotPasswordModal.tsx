"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, 
  AlertCircle, RefreshCw, X, Sparkles, ShieldCheck
} from "lucide-react";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string) => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
}

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}*${local[local.length - 1]}@${domain}`;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialEmail = "",
  onClose,
  onSuccess,
  addToast,
}) => {
  const [step, setStep] = useState<"EMAIL" | "CODE" | "PASSWORD">("EMAIL");
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
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
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
      setEmailError(null);
      setCodeError(null);
      setIsVerifyingCode(false);
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
    setEmailError(null);
    setCodeError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setEmailError("Please enter a valid registered email address.");
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
      setEmailError(err.message || "No registered account found with this email address.");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify Code with API and inline error validation
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setCodeError(null);

    const cleanCode = code.trim();
    if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setCodeError("Please enter the complete 6-digit numeric recovery code.");
      codeInputRef.current?.focus();
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: cleanCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid or expired recovery code.");
      }

      // Valid code: proceed to step 3
      setStep("PASSWORD");
    } catch (err: any) {
      setCodeError(err.message || "Invalid or expired recovery code.");
      codeInputRef.current?.focus();
    } finally {
      setIsVerifyingCode(false);
    }
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

      // Immediate success: invoke onSuccess callback which closes modal and triggers success notification
      onSuccess(email.trim().toLowerCase());
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
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div className="bg-white border border-gray-200/90 rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-200 ease-out relative">
        {/* Modal Top Header Banner */}
        <div className="bg-[#0A4D30] text-white px-5 sm:px-6 py-4.5 sm:py-5 shrink-0 shadow-xs border-b border-emerald-900/40">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate leading-tight drop-shadow-xs">
              Account Password Recovery
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
              title="Close recovery"
              aria-label="Close recovery"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {/* Stepper Progress Counter in Main Content */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
              <div className="flex items-center justify-between gap-2">
                {[
                  { s: "EMAIL", num: 1, label: "Account Email" },
                  { s: "CODE", num: 2, label: "Verification Code" },
                  { s: "PASSWORD", num: 3, label: "New Password" },
                ].map((st, i) => {
                  const isActive = step === st.s;
                  const isPassed =
                    (st.s === "EMAIL" && (step === "CODE" || step === "PASSWORD")) ||
                    (st.s === "CODE" && step === "PASSWORD");

                  return (
                    <React.Fragment key={st.s}>
                      <div className="flex items-center gap-2 shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-2xs ${
                            isActive
                              ? "bg-[#0A6B43] text-white shadow-xs font-black ring-2 ring-emerald-600/30"
                              : isPassed
                              ? "bg-emerald-200 text-[#075332] font-black"
                              : "bg-gray-100 text-gray-400 border border-gray-200"
                          }`}
                        >
                          {isPassed ? "✓" : st.num}
                        </div>
                        <span
                          className={`text-xs font-semibold ${
                            isActive
                              ? "text-[#075332] font-black"
                              : isPassed
                              ? "text-emerald-800"
                              : "text-gray-400 hidden sm:inline"
                          }`}
                        >
                          {st.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          className={`flex-1 h-0.5 rounded-full transition-all ${
                            isPassed ? "bg-emerald-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

          {/* Error Alert Box */}
          {/* Error Alert Box (for general errors not tied to inline email field) */}
          {errorMsg && !emailError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150 shadow-2xs">
              <AlertCircle className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-semibold leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: ENTER EMAIL */}
          {/* ============================================================ */}
          {step === "EMAIL" && (
            <form onSubmit={handleRequestCode} className="space-y-4 sm:space-y-5">
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5 sm:p-4">
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  Enter your registered email to receive a 6-digit recovery code.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. juan.delacruz@sanluispampanga.gov.ph"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError(null);
                    }}
                    className={`w-full text-xs sm:text-sm font-medium pl-10.5 pr-4 py-3 rounded-xl border transition-all placeholder:text-gray-400 ${
                      emailError
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:border-[#0A6B43] focus:ring-2 focus:ring-[#0A6B43]/20"
                    }`}
                  />
                </div>
                {emailError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{emailError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Checking Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Code</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
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
            <form onSubmit={handleVerifyCode} className="space-y-4 sm:space-y-5">
              {/* Simple Account Notification Card */}
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5 sm:p-4">
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  We found your SiKap account and sent a 6-digit recovery code to{" "}
                  <strong className="text-gray-900 font-bold">
                    {accountInfo?.maskedEmail || maskEmail(email)}
                  </strong>{" "}
                  to verify your identity.
                </p>
              </div>

              {/* Dev / Local Mode Helper */}
              {devCode && (
                <div className="p-3.5 sm:p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Intranet / Local Demo Testing Code:</span>
                  </div>
                  <div className="flex items-center justify-between bg-white border border-amber-200/90 px-3.5 py-2 rounded-xl shadow-2xs">
                    <span className="font-mono font-black text-xl text-[#0A6B43] tracking-widest">{devCode}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(devCode);
                        if (codeError) setCodeError(null);
                      }}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Fill Code
                    </button>
                  </div>
                </div>
              )}

              {/* Centered type field with dotted placeholder, maintaining matching height and size */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider text-center">
                  6-Digit Verification Code
                </label>
                <div className="w-full">
                  <input
                    ref={codeInputRef}
                    type="text"
                    maxLength={6}
                    required
                    autoFocus
                    placeholder="• • • • • •"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      if (codeError) setCodeError(null);
                    }}
                    className={`w-full text-center text-xl sm:text-2xl font-mono font-bold tracking-[0.35em] px-4 py-3 rounded-xl border transition-all placeholder:text-gray-300 placeholder:tracking-[0.35em] ${
                      codeError
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                        : "border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:border-[#0A6B43] focus:ring-2 focus:ring-[#0A6B43]/20"
                    }`}
                  />
                </div>
                {codeError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center justify-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{codeError}</span>
                  </p>
                )}
              </div>

              {/* Resend Code Link matching Register Here style */}
              <div className="text-center pt-0.5">
                <p className="text-[12px] font-medium text-gray-600">
                  Did not receive code?{" "}
                  <button
                    type="button"
                    disabled={resendCountdown > 0 || isLoading || isVerifyingCode}
                    onClick={handleRequestCode}
                    className="text-[#0A6B43] text-[12px] font-bold hover:text-[#075332] transition-colors cursor-pointer underline underline-offset-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                  >
                    {resendCountdown > 0 ? `Resend Code (${resendCountdown}s)` : "Resend Code"}
                  </button>
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setCodeError(null);
                    setStep("EMAIL");
                  }}
                  className="group px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-300 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>Change Email</span>
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingCode || code.trim().length !== 6}
                  className="group px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifyingCode ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Code</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 3: NEW PASSWORD */}
          {/* ============================================================ */}
          {step === "PASSWORD" && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="bg-gray-50/80 border border-gray-200/80 rounded-2xl p-3.5 sm:p-4">
                <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                  Identity verified! Set a new password to regain access to your account.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    New Password (minimum 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={6}
                      autoFocus
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium pl-10.5 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:border-[#0A6B43] focus:ring-2 focus:ring-[#0A6B43]/20 transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full text-xs sm:text-sm font-medium pl-10.5 pr-11 py-3 rounded-xl border border-gray-200 bg-gray-50/70 text-gray-900 focus:bg-white focus:outline-none focus:border-[#0A6B43] focus:ring-2 focus:ring-[#0A6B43]/20 transition-all placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Validation indicators */}
              <div className="p-3 bg-gray-50/80 border border-gray-200/70 rounded-xl space-y-1.5 text-xs">
                <div className={`flex items-center gap-2 ${newPassword.length >= 6 ? "text-emerald-700 font-bold" : "text-gray-400 font-medium"}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white border border-current shrink-0">
                    {newPassword.length >= 6 ? "✓" : "•"}
                  </span>
                  <span>At least 6 characters long</span>
                </div>
                <div className={`flex items-center gap-2 ${newPassword && newPassword === confirmPassword ? "text-emerald-700 font-bold" : "text-gray-400 font-medium"}`}>
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white border border-current shrink-0">
                    {newPassword && newPassword === confirmPassword ? "✓" : "•"}
                  </span>
                  <span>Password confirmation matches</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStep("CODE")}
                  className="group px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-300 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="group px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Set New Password</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
