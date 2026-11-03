"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  FileCheck,
  ShieldCheck,
  Upload,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Sparkles,
  MapPin,
  Award,
  Check,
  ZoomIn,
  Clock,
  ArrowLeft
} from "lucide-react";
import { motion } from "motion/react";
import { SikapLogo, Toast } from "./ReusableComponents";
import { CustomSelect } from "./CustomSelect";
import { AnimatedGridBackground } from "./AnimatedGridBackground";
import { sanitizeClientError } from "../lib/utils";

const PROVIDER_TYPE_OPTIONS = [
  {
    value: "Public TESDA Institute",
    label: "Public TESDA Technology Institution (TTI)"
  },
  {
    value: "Private TVET Institute",
    label: "Private Technical-Vocational Institute (TVI)"
  },
  {
    value: "LGU Training Center",
    label: "LGU / Community Skills Training Center"
  },
  {
    value: "HEI / SUC",
    label: "Higher Education Institution (HEI / College)"
  },
  {
    value: "NGO Foundation",
    label: "Non-Government / Livelihood Foundation"
  }
];

export const TESDAPartnerRegister: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Institution Details
  const [institutionName, setInstitutionName] = useState("");
  const [providerType, setProviderType] = useState("Private TVET Institute");
  const [campusAddress, setCampusAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Step 2: Representative & Account Credentials
  const [representativeName, setRepresentativeName] = useState("");
  const [representativePosition, setRepresentativePosition] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: CPTR Accreditation & Document Upload
  const [cptrNumber, setCptrNumber] = useState("");
  const [cptrFileName, setCptrFileName] = useState("");
  const [cptrDocument, setCptrDocument] = useState<string>("");
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [showCptrZoomModal, setShowCptrZoomModal] = useState(false);

  // Step 4: Terms & Submission
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage(
        "The uploaded file exceeds the 8MB size limit. Please upload a smaller file."
      );
      return;
    }

    setErrorMessage("");
    setIsUploadingFile(true);
    setCptrFileName(file.name);

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (isPdf) {
        setCptrDocument(dataUrl);
        setIsUploadingFile(false);
      } else {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const maxDim = 1600;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.85);
          setCptrDocument(compressed);
          setIsUploadingFile(false);
        };
        img.onerror = () => {
          setCptrDocument(dataUrl);
          setIsUploadingFile(false);
        };
        img.src = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const validateStep1 = () => {
    if (!institutionName.trim()) {
      setErrorMessage("Please enter your institution's official registered name.");
      return false;
    }
    if (!campusAddress.trim()) {
      setErrorMessage("Please specify your campus or training center address.");
      return false;
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 7) {
      setErrorMessage("Please enter a valid official telephone or mobile number.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep2 = () => {
    if (!representativeName.trim()) {
      setErrorMessage(
        "Please provide the authorized representative or registrar's full name."
      );
      return false;
    }
    if (!representativePosition.trim()) {
      setErrorMessage("Please provide the official position or designation.");
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      setErrorMessage("Please provide a valid institutional email address.");
      return false;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify your entries.");
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const validateStep3 = () => {
    if (!cptrNumber.trim()) {
      setErrorMessage(
        "Please enter your official Certificate of TVET Program Registration (CPTR) number."
      );
      return false;
    }
    if (!cptrDocument) {
      setErrorMessage(
        "Please upload an image or PDF copy of your CPTR certificate for verification."
      );
      return false;
    }
    setErrorMessage("");
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
    else if (currentStep === 3 && validateStep3()) setCurrentStep(4);
  };

  const handleSubmitRegistration = async () => {
    if (!termsAccepted) {
      setErrorMessage("Please read and accept the partnership undertaking to proceed.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        institutionName: institutionName.trim(),
        providerType,
        campusAddress: campusAddress.trim(),
        representativeName: representativeName.trim(),
        representativePosition: representativePosition.trim(),
        email: email.trim().toLowerCase(),
        contactNumber: contactNumber.trim(),
        password,
        cptrNumber: cptrNumber.trim().toUpperCase(),
        cptrDocument
      };

      const res = await fetch("/api/provider-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(
          data.message || "Failed to submit partner registration. Please try again."
        );
        setIsSubmitting(false);
        return;
      }

      setIsSubmittedSuccess(true);
      addToast(
        "Partner registration submitted! Your account is now Pending Verification.",
        "success"
      );
    } catch {
      setErrorMessage(
        "A network error occurred while submitting your registration. Please check your connection."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="font-sans antialiased w-full max-w-full overflow-x-clip"
      id="tesda-partner-register-root"
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
        {/* Left Panel: Onboarding Guide (Visible on xl+) */}
        <div className="hidden xl:flex xl:w-[42%] bg-[#0A4D30] rounded-[1.5rem] p-8 xl:p-10 flex-col justify-between shrink-0 relative overflow-hidden shadow-xl border border-emerald-800/60">
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
            style={{
              backgroundImage: "url('/redox-02.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "200px 200px"
            }}
          />

          <AnimatedGridBackground />

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.18),transparent_70%)] pointer-events-none z-0" />

          <div className="relative z-10 space-y-4 mt-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xs border border-white/20 text-amber-300 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Partner Accreditation</span>
            </div>

            <h1 className="text-3xl xl:text-4xl font-black leading-[1.08] tracking-tight text-white">
              Become a Verified SiKap Training Partner
            </h1>

            <p className="text-sm xl:text-base text-emerald-100/90 leading-relaxed font-medium">
              Register your TESDA Technology Institution or accredited TVET center to publish training cohorts and connect with San Luis youth.
            </p>
          </div>

          {/* 4-Step Verification Checklist on Left Panel */}
          <div className="relative z-10 my-auto py-4 space-y-3">
            {[
              {
                num: 1,
                title: "Institution & Campus Details",
                desc: "Official school name, classification, campus address, and contact line"
              },
              {
                num: 2,
                title: "Representative & Credentials",
                desc: "Authorized liaison name, official designation, and login email"
              },
              {
                num: 3,
                title: "CPTR Certificate Verification",
                desc: "TESDA Certificate of TVET Program Registration code and document"
              },
              {
                num: 4,
                title: "Administrator Review & Activation",
                desc: "Queued as Pending Verification for Super Admin approval"
              }
            ].map((item) => {
              const isActive = !isSubmittedSuccess && currentStep === item.num;
              const isDone = isSubmittedSuccess || currentStep > item.num;
              return (
                <div
                  key={item.num}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    isActive
                      ? "bg-white/15 border-amber-300/60 shadow-md"
                      : isDone
                      ? "bg-emerald-900/50 border-emerald-400/40"
                      : "bg-emerald-950/30 border-white/10 opacity-75"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                      isDone
                        ? "bg-emerald-400 text-slate-950"
                        : isActive
                        ? "bg-amber-400 text-slate-950"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : item.num}
                  </div>
                  <div>
                    <h4 className="text-xs xl:text-sm font-extrabold text-white">
                      {item.title}
                    </h4>
                    <p className="text-[11px] xl:text-xs text-emerald-100/80 font-medium mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative z-10 flex items-center justify-between text-xs text-emerald-200/90 font-semibold pt-2 border-t border-white/15">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Super Admin Verification Required</span>
            </span>
            <span>San Luis, Pampanga</span>
          </div>
        </div>

        {/* Right Panel: Registration Form */}
        <div className="flex-1 bg-white relative xl:h-full w-full flex flex-col items-center justify-between p-4 sm:p-6 md:px-10 lg:px-12 xl:px-16 py-4 overflow-y-auto">
          {/* Top Logo */}
          <div className="relative w-full flex justify-center shrink-0 pb-3 z-30">
            <Link href="/partners">
              <SikapLogo
                size={44}
                logoSize={46}
                textSize={38}
                showText={true}
                showSubtext={false}
                gap="gap-2"
                textClassName="translate-y-[1.5px]"
                disableHover={true}
              />
            </Link>
          </div>

          {/* Main Registration Card */}
          <div className="w-full max-w-2xl my-auto space-y-5">
            {!isSubmittedSuccess && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>TESDA Partner Registration</span>
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-2">
                      Register Your Training Institution
                    </h2>
                  </div>
                  <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Step {currentStep} of 4</span>
                  </span>
                </div>

                {/* Horizontal Stepper Bar */}
                <div className="grid grid-cols-4 gap-2 pt-2">
                  {[
                    { step: 1, label: "Institution" },
                    { step: 2, label: "Representative" },
                    { step: 3, label: "CPTR Verification" },
                    { step: 4, label: "Review & Submit" }
                  ].map((s) => (
                    <div key={s.step} className="space-y-1.5">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          currentStep >= s.step ? "bg-[#0A6B43]" : "bg-gray-200"
                        }`}
                      />
                      <span
                        className={`text-[11px] font-bold block truncate ${
                          currentStep === s.step
                            ? "text-[#0A6B43]"
                            : currentStep > s.step
                            ? "text-gray-700"
                            : "text-gray-400"
                        }`}
                      >
                        {s.step}. {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="font-semibold leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {isSubmittedSuccess ? (
              /* PENDING VERIFICATION CONFIRMATION SCREEN */
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#FAFBF9] rounded-3xl border border-emerald-200 p-6 sm:p-8 text-center space-y-5 shadow-lg"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0A6B43] border-4 border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <ShieldCheck className="w-9 h-9" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <div className="inline-flex items-center gap-1.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Status: Pending Verification</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Registration Submitted for Approval
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                    Thank you, <strong className="text-gray-900">{representativeName}</strong>! Your institutional registration for{" "}
                    <strong className="text-gray-900">{institutionName}</strong> (CPTR No.{" "}
                    <span className="font-mono font-bold text-[#0A6B43]">{cptrNumber}</span>) has been recorded with a{" "}
                    <strong className="text-amber-800">Pending Verification</strong> status.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200 text-left max-w-lg mx-auto text-xs space-y-2.5">
                  <div className="flex items-center gap-2 text-gray-900 font-extrabold">
                    <Sparkles className="w-4 h-4 text-[#0A6B43] shrink-0" />
                    <span>What Happens Next?</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-medium">
                    The SiKap Super Administrator (SK Federation President of San Luis) will inspect your institutional details and CPTR accreditation certificate. Once approved, your account will be activated and you can sign in to the TESDA Partner Dashboard to manage training programs and review youth applicants.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Link
                    href="/partners/login"
                    className="w-full sm:w-auto px-6 py-3 bg-[#0A6B43] hover:bg-[#075332] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all text-center"
                  >
                    Go to Partner Sign In
                  </Link>
                  <Link
                    href="/partners"
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-bold text-xs sm:text-sm rounded-xl transition-all text-center"
                  >
                    Return to Partner Overview
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="bg-[#FAFBF9] rounded-3xl border border-gray-200/90 p-5 sm:p-7 shadow-xs space-y-5">
                {/* STEP 1: INSTITUTION DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <Building2 className="w-4.5 h-4.5 text-[#0A6B43]" />
                        <span>Step 1: Institutional Information</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Provide your registered technical-vocational institution, training center, or college details.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Institution / Training Center Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Gonzalo Puyat School of Arts and Trades, Megatech TVET Center"
                          value={institutionName}
                          onChange={(e) => setInstitutionName(e.target.value)}
                          className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Provider Classification <span className="text-red-500">*</span>
                        </label>
                        <CustomSelect
                          value={providerType}
                          onChange={(val) => setProviderType(val)}
                          options={PROVIDER_TYPE_OPTIONS}
                          size="sm"
                          buttonClassName="h-11 !text-xs sm:!text-sm !rounded-xl font-medium bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Main Campus / Training Venue Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            placeholder="e.g. San Luis / Guagua / City of San Fernando, Pampanga"
                            value={campusAddress}
                            onChange={(e) => setCampusAddress(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Official Contact Number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            type="tel"
                            placeholder="e.g. +63 919 123 4567 or (045) 961-0000"
                            value={contactNumber}
                            onChange={(e) => setContactNumber(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: REPRESENTATIVE & CREDENTIALS */}
                {currentStep === 2 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <User className="w-4.5 h-4.5 text-[#0A6B43]" />
                        <span>Step 2: Representative &amp; Account Details</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Enter the details of the authorized TESDA representative or registrar who will manage this portal.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1.5">
                            Representative Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Evelyn M. Castor"
                            value={representativeName}
                            onChange={(e) => setRepresentativeName(e.target.value)}
                            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1.5">
                            Position / Designation <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Vocational School Registrar"
                            value={representativePosition}
                            onChange={(e) => setRepresentativePosition(e.target.value)}
                            className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Institutional Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                          <input
                            type="email"
                            placeholder="e.g. registrar@institution.edu.ph"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                          />
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium mt-1 block">
                          This email will serve as your login username once your registration is approved.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1.5">
                            Create Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="At least 6 characters"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full h-11 pl-10 pr-10 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1.5">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Repeat password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: CPTR ACCREDITATION VERIFICATION */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <Award className="w-4.5 h-4.5 text-amber-600" />
                        <span>Step 3: TESDA CPTR Verification</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Provide your Certificate of TVET Program Registration (CPTR) number and supporting document for Super Admin verification.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          CPTR / Program Registration Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. WTR-2024-03-01928 or CPTR-R03-PAM-2026"
                          value={cptrNumber}
                          onChange={(e) => setCptrNumber(e.target.value.toUpperCase())}
                          className="w-full h-11 px-4 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-gray-900 focus:border-[#0A6B43] focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all uppercase tracking-wider"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1.5">
                          Upload CPTR Certificate (JPG, PNG, or PDF) <span className="text-red-500">*</span>
                        </label>

                        {!cptrDocument ? (
                          <label className="border-2 border-dashed border-gray-300 hover:border-[#0A6B43] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-white hover:bg-emerald-50/30 transition-all cursor-pointer group">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,application/pdf"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0A6B43] shadow-2xs">
                              {isUploadingFile ? (
                                <RefreshCw className="w-5 h-5 animate-spin text-[#0A6B43]" />
                              ) : (
                                <Upload className="w-5 h-5" />
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#0A6B43] text-center">
                              Click to upload your TESDA CPTR Certificate
                            </span>
                            <span className="text-[11px] text-gray-400 text-center font-medium">
                              Max file size: 8MB. Ensure the institutional name and registration number are legible.
                            </span>
                          </label>
                        ) : (
                          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                              <div className="w-10 h-10 rounded-xl bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                                <FileCheck className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-900 block truncate">
                                  {cptrFileName || "CPTR_Certificate_Document"}
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-700 block">
                                  Attached for Administrator Verification ✓
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              {cptrDocument.startsWith("data:image/") && (
                                <button
                                  type="button"
                                  onClick={() => setShowCptrZoomModal(true)}
                                  className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <ZoomIn className="w-3.5 h-3.5 text-[#0A6B43]" />
                                  <span>Preview</span>
                                </button>
                              )}
                              <label className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition-colors flex items-center gap-1 cursor-pointer">
                                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                                <span>Replace</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp,application/pdf"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & SUBMIT */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in">
                    <div className="space-y-1">
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-4.5 h-4.5 text-[#0A6B43]" />
                        <span>Step 4: Review &amp; Submit for Approval</span>
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        Verify your institutional and representative information before submitting.
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-100">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Institution
                          </span>
                          <span className="font-extrabold text-gray-900 block text-sm">
                            {institutionName}
                          </span>
                          <span className="text-[11px] text-gray-500">{providerType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Campus Address &amp; Contact
                          </span>
                          <span className="font-bold text-gray-800 block">{campusAddress}</span>
                          <span className="text-[11px] text-gray-500">{contactNumber}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            Authorized Representative
                          </span>
                          <span className="font-bold text-gray-900 block">
                            {representativeName}
                          </span>
                          <span className="text-[11px] text-gray-600">
                            {representativePosition}
                          </span>
                          <span className="text-[11px] font-mono text-[#0A6B43] block mt-0.5">
                            {email}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            CPTR Accreditation
                          </span>
                          <span className="font-mono font-black text-emerald-800 block">
                            {cptrNumber}
                          </span>
                          <span className="text-[11px] text-amber-700 font-bold inline-flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>Initial Status: Pending Verification</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <label className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-emerald-50/30 flex items-start gap-3 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded text-[#0A6B43] focus:ring-[#0A6B43] accent-[#0A6B43]"
                      />
                      <div className="text-xs text-gray-700 leading-relaxed font-medium">
                        <strong className="text-gray-900 font-bold block mb-0.5">
                          Institutional Partnership Undertaking
                        </strong>
                        I certify that the institutional and representative details provided are accurate and that our training institution holds a valid TESDA Certificate of TVET Program Registration (CPTR). I understand that new accounts require SiKap Administrator verification before dashboard access is activated.
                      </div>
                    </label>
                  </div>
                )}

                {/* Step Navigation Buttons */}
                <div className="pt-3 border-t border-gray-200/80 flex items-center justify-between gap-3">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                      disabled={isSubmitting}
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-200/70 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                  ) : (
                    <Link
                      href="/partners"
                      className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </Link>
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <span>Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitRegistration}
                      disabled={isSubmitting || !termsAccepted}
                      className="px-6 py-3 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Submitting Registration...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Submit Partner Registration</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sign In Link */}
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-gray-700">
                Already have an approved partner account?{" "}
                <Link
                  href="/partners/login"
                  className="text-[#0A6B43] font-bold hover:text-[#075332] transition-colors underline underline-offset-2"
                >
                  Partner Sign In
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom Navigation Links */}
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

      {/* CPTR Preview Modal */}
      {showCptrZoomModal && cptrDocument && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-black/60 text-white flex items-center justify-between text-xs px-4">
              <span className="font-mono font-bold">
                CPTR Certificate Preview - {cptrNumber}
              </span>
              <button
                type="button"
                onClick={() => setShowCptrZoomModal(false)}
                className="text-gray-300 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={cptrDocument}
                alt="CPTR Certificate"
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

