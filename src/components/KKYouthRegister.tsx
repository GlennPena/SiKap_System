"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, ArrowRight, MapPin, Check, Sparkles, Clock, CheckCircle,
  User, Mail, Phone, Calendar, Award, GraduationCap, Plus, X,
  Upload, ShieldAlert, FileDigit, FileCheck, ChevronRight, ChevronLeft, ChevronDown,
  Eye, EyeOff, AlertCircle, ZoomIn, ShieldCheck, RefreshCw, FileText, Lock
} from "lucide-react";
import { YouthProfile, UserRole, EDUCATIONAL_ATTAINMENT_OPTIONS } from "../types";
import { SAN_LUIS_BARANGAYS, getBarangayJurisdiction, getBarangayZoneTypeLabel } from "../lib/barangay-data";
import { SiKapDatePicker } from "./ReusableComponents";
import { formatContactNumber, isValidContactNumber, calculateAge, sanitizeClientError } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { broadcastDataChange } from "../lib/realtime-sync";

interface KKYouthRegisterProps {
  onRegisterComplete: (newProfile: YouthProfile) => void;
  onBackToHome: () => void;
  onOpenLegal?: (tab: "terms" | "privacy") => void;
}

const BARANGAYS = SAN_LUIS_BARANGAYS;

interface CustomSelectOption {
  value: string;
  label: string;
}

const CustomSelect: React.FC<{
  value: string;
  onChange: (val: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, options, placeholder = "Select an option", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const normalizedOptions: CustomSelectOption[] = options.map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-3 sm:pl-4 pr-9 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden shadow-2xs cursor-pointer ${value ? "text-gray-900 border-gray-200" : "text-gray-400 border-gray-200"
          } ${className}`}
      >
        <span className="truncate block pr-1">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-1.5 w-full max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl z-50 py-1"
          >
            {normalizedOptions.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${isSelected
                    ? "bg-emerald-50 text-[#0A6B43] font-bold"
                    : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                    }`}
                >
                  <span className="break-words line-clamp-2 leading-snug">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



const GENDER_OPTIONS: CustomSelectOption[] = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" }
];

const VOCATIONAL_SECTOR_OPTIONS = [
  "Information & Communications Technology (ICT)",
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
  "Entrepreneurship & Management"
];

const VERIFICATION_ID_TYPE_OPTIONS: CustomSelectOption[] = [
  { value: "National ID", label: "National ID (PhilSys)" },
  { value: "Student ID / Enrollment Receipt", label: "Student ID / Enrollment Receipt" },
  { value: "SK Member Card", label: "Sangguniang Kabataan Member Card" },
  { value: "Barangay Clearance", label: "Barangay Clearance" },
  { value: "Voter's ID or Stub", label: "Voter's ID or Registration Stub" },
  { value: "Birth Certificate", label: "PSA Birth Certificate" }
];

export const KKYouthRegister: React.FC<KKYouthRegisterProps> = ({
  onRegisterComplete,
  onBackToHome,
  onOpenLegal
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  // 0: Barangay Select, 1: Personal Info, 2: Education & Demographics, 3: Skills & Goals, 4: Verification, 5: Pending approval
  const [selectedBarangay, setSelectedBarangay] = useState<string>("");

  // Form states
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [regDOB, setRegDOB] = useState("");
  const [regAge, setRegAge] = useState<number | string>("");
  const [regGender, setRegGender] = useState("");
  const [regContact, setRegContact] = useState("");
  const [regPurok, setRegPurok] = useState("");
  const [selectedPurokBase, setSelectedPurokBase] = useState("");

  const [emailExists, setEmailExists] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail || !emailRegex.test(regEmail)) {
      setEmailExists(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(regEmail.trim())}`);
        const data = await res.json();
        setEmailExists(data.exists);
      } catch {
        setEmailExists(false);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regEmail]);

  // Email verification OTP states
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);

  // OTP resend countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (otpCountdown > 0) {
      interval = setInterval(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regEmail || !emailRegex.test(regEmail) || emailExists) return;

    setIsSendingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/register-otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), name: regName.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setOtpCountdown(data.waitSeconds || 60);
        if (data.devCode) {
          setDevCode(data.devCode);
        }
      } else {
        setOtpError(sanitizeClientError(data.message, "Failed to send verification code. Please try again."));
      }
    } catch {
      setOtpError("Network error sending verification code. Please check your connection.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6) return;

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/register-otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), code: otpCode.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setIsEmailVerified(true);
        setOtpError(null);
      } else {
        setOtpError(data.message || "Invalid verification code.");
      }
    } catch {
      setOtpError("Network error verifying code. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleDOBChange = (dob: string) => {
    setRegDOB(dob);
    if (dob) {
      const calculated = calculateAge(dob);
      if (calculated !== "") {
        setRegAge(calculated);
      }
    } else {
      setRegAge("");
    }
  };

  const [regEdu, setRegEdu] = useState<string>("");
  const [regStatus, setRegStatus] = useState("Out-of-school");

  const [skillInput, setSkillInput] = useState("");
  const [regSkills, setRegSkills] = useState<string[]>([]);

  const [prefInput, setPrefInput] = useState("");
  const [regPreferences, setRegPreferences] = useState<string[]>([]);
  const [regSector, setRegSector] = useState("");

  const [expInput, setExpInput] = useState("");
  const [regExperiences, setRegExperiences] = useState<string[]>([]);

  const [regGoal, setRegGoal] = useState("");

  const [regSolo, setRegSolo] = useState(false);
  const [regPwd, setRegPwd] = useState(false);
  const [regIndigenous, setRegIndigenous] = useState(false);
  const [regNone, setRegNone] = useState(false);

  // ID Verification states
  const [regIdType, setRegIdType] = useState("");
  const [regIdNumber, setRegIdNumber] = useState("");
  const [regIdFileName, setRegIdFileName] = useState("");
  const [regIdImage, setRegIdImage] = useState<string>("");
  const [showIdPreviewModal, setShowIdPreviewModal] = useState<boolean>(false);
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [termsModalTab, setTermsModalTab] = useState<"terms" | "privacy">("terms");
  const [isDragging, setIsDragging] = useState(false);
  const [certifyAge, setCertifyAge] = useState(false);
  const [certifyResidency, setCertifyResidency] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  useEffect(() => {
    if (showTermsModal || showIdPreviewModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showTermsModal, showIdPreviewModal]);

  useEffect(() => {
    if (!showIdPreviewModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowIdPreviewModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showIdPreviewModal]);

  useEffect(() => {
    if (!showTermsModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowTermsModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTermsModal]);

  const STEPS = [
    { label: "Location", desc: "Barangay Select", icon: <MapPin className="w-4 h-4" /> },
    { label: "Personal", desc: "Contact & Info", icon: <User className="w-4 h-4" /> },
    { label: "Background", desc: "Edu & Demographics", icon: <GraduationCap className="w-4 h-4" /> },
    { label: "Attributes", desc: "Skills, Prefs & Goal", icon: <Award className="w-4 h-4" /> },
    { label: "Verification", desc: "ID & Declaration", icon: <FileCheck className="w-4 h-4" /> }
  ];

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = skillInput.trim();
      if (trimmed && !regSkills.includes(trimmed)) {
        setRegSkills([...regSkills, trimmed]);
        setSkillInput("");
      }
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setRegSkills(regSkills.filter(s => s !== skill));
  };

  const handleAddPreference = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = prefInput.trim();
      if (trimmed && !regPreferences.includes(trimmed)) {
        setRegPreferences([...regPreferences, trimmed]);
        setPrefInput("");
      }
    }
  };

  const handleRemovePreference = (pref: string) => {
    setRegPreferences(regPreferences.filter(p => p !== pref));
  };

  const handleAddExperience = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = expInput.trim();
      if (trimmed && !regExperiences.includes(trimmed)) {
        setRegExperiences([...regExperiences, trimmed]);
        setExpInput("");
      }
    }
  };

  const handleRemoveExperience = (exp: string) => {
    setRegExperiences(regExperiences.filter(e => e !== exp));
  };

  const processAndCompressIdFile = (file: File) => {
    setRegIdFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const rawDataUrl = reader.result as string;
      if (!file.type.startsWith("image/")) {
        setRegIdImage(rawDataUrl);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL("image/jpeg", 0.78);
          setRegIdImage(compressed);
        } else {
          setRegIdImage(rawDataUrl);
        }
      };
      img.onerror = () => setRegIdImage(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processAndCompressIdFile(file); return; setRegIdFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processAndCompressIdFile(file); return; setRegIdFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegIdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regGoal.trim() || !regContact.trim() || !selectedBarangay || !regEmail.trim() || regPassword.length < 6 || regPassword !== regConfirmPassword) {
      return;
    }

    if (!isEmailVerified) {
      alert("Please verify your email address with the 6-digit security code before submitting your registration.");
      return;
    }

    if (!certifyAge || !certifyResidency) {
      return;
    }

    setIsRegistering(true);

    const generatedIdImage = regIdImage || `https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600`;

    const payload = {
      email: regEmail,
      password: regPassword,
      name: regName,
      birthdate: regDOB,
      age: regAge,
      gender: regGender,
      purok: regPurok,
      barangay: selectedBarangay,
      educationalAttainment: regEdu,
      currentStatus: regStatus,
      skills: regSkills,
      interests: regPreferences.length > 0 ? regPreferences : [regSector],
      sectorPreference: regSector,
      livelihoodGoal: regGoal,
      skillsRaw: regSkills,
      preferencesRaw: regPreferences.length > 0 ? regPreferences : [regSector],
      experiencesRaw: regExperiences,
      goalRaw: regGoal,
      contactNumber: regContact,
      soloParent: regSolo,
      pwd: regPwd,
      indigenous: regIndigenous,
      verificationIdType: regIdType,
      verificationIdNumber: regIdNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      verificationIdImage: generatedIdImage
    };

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        broadcastDataChange("youth", "registered");
        onRegisterComplete(data.data);
        setCurrentStep(5); // Go to "Pending Approval" screen
      } else {
        alert("Registration failed: " + sanitizeClientError(data.message, "Unable to complete registration right now. Please try again."));
      }
    } catch (err) {
      alert("An error occurred during registration.");
      // Do not log error details to the browser console
    } finally {
      setIsRegistering(false);
    }
  };

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return !!selectedBarangay && !!regPurok;
      case 1: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const computedAge = regDOB ? calculateAge(regDOB) : "";
        const isAgeValid = computedAge !== "" && Number(computedAge) >= 18 && Number(computedAge) <= 30;
        const isPasswordValid = regPassword.length >= 6 && regPassword === regConfirmPassword;
        return !!regName.trim() && !!regGender && isValidContactNumber(regContact) && isAgeValid && emailRegex.test(regEmail) && !emailExists && isPasswordValid && isEmailVerified;
      }
      case 2:
        return !!regEdu && (regSolo || regPwd || regIndigenous || regNone);
      case 3:
        return !!regGoal.trim() && !!regSector.trim();
      case 4:
        return !!regIdType && !!regIdNumber.trim() && !!regIdFileName && certifyAge && certifyResidency;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0 font-sans antialiased" id="kk-youth-self-registration-flow">
      <div className="w-full flex flex-col h-full min-h-0">

        {/* Stepper Progress - Anchored persistently at top */}
        {currentStep < 5 && (
          <div className="mb-2.5 sm:mb-4 bg-white border border-gray-200/90 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs shrink-0 w-full max-w-2xl mx-auto" id="kk-reg-stepper">
            {/* Mobile View Progress */}
            <div className="flex justify-between items-center md:hidden mb-2">
              <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Step {currentStep + 1} of 5
              </span>
              <span className="text-xs font-bold text-gray-700">
                {STEPS[currentStep]?.label}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden md:hidden">
              <motion.div
                className="bg-[#0A6B43] h-full"
                initial={false}
                animate={{ width: `${((currentStep + 1) / 5) * 100}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>

            {/* Desktop View Stepper */}
            <div className="hidden md:flex items-start justify-between relative px-2">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                  <div key={idx} className="flex-1 relative flex flex-col items-center">
                    {/* Connector Line between step icons */}
                    {idx < STEPS.length - 1 && (
                      <div className="absolute top-[18px] left-[50%] w-full h-[2px] bg-gray-200 -translate-y-1/2 z-0">
                        <motion.div
                          className="bg-[#0A6B43] h-full"
                          initial={false}
                          animate={{ width: idx < currentStep ? "100%" : "0%" }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                        />
                      </div>
                    )}

                    {/* Step Node Icon Button */}
                    <motion.button
                      type="button"
                      disabled={idx > currentStep && !isStepValid(currentStep)}
                      onClick={() => idx <= currentStep && setCurrentStep(idx)}
                      animate={{ scale: isActive ? 1.12 : 1 }}
                      whileHover={idx <= currentStep ? { scale: 1.15 } : {}}
                      whileTap={idx <= currentStep ? { scale: 0.95 } : {}}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors duration-200 focus:outline-hidden relative z-10 ${isCompleted
                        ? "bg-[#0A6B43] border-[#0A6B43] text-white cursor-pointer hover:bg-[#075332] shadow-xs"
                        : isActive
                          ? "bg-white border-[#0A6B43] text-[#0A6B43] ring-4 ring-emerald-50 cursor-default shadow-xs"
                          : "bg-white border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      title={step.label}
                    >
                      {isCompleted ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </motion.div>
                      ) : (
                        step.icon
                      )}
                    </motion.button>

                    {/* Step Labels */}
                    <span className={`text-[11px] font-bold mt-2 transition-colors text-center px-1 ${isActive ? "text-[#0A6B43]" : isCompleted ? "text-gray-800" : "text-gray-400"
                      }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step Views Area */}
        <div className="flex-1 min-h-0 flex flex-col w-full max-w-2xl mx-auto px-1.5 sm:px-2 pt-1 sm:pt-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="flex-1 min-h-0 flex flex-col w-full"
            >
              {/* Step 0: Barangay & Purok / Street Selection */}
              {currentStep === 0 && (() => {
                const currentJurisdiction = getBarangayJurisdiction(selectedBarangay);
                const zoneTypeLabel = getBarangayZoneTypeLabel(selectedBarangay);
                const activeZoneWithSitios = currentJurisdiction?.zones.find(
                  (z) => z.name === selectedPurokBase || (regPurok && (regPurok === z.name || regPurok.startsWith(z.name + " -")))
                );

                return (
                  <div className="flex-1 flex flex-col min-h-0 w-full" id="step-location-select">
                    {/* Non-scrollable Step Header */}
                    <div className="text-center mb-2.5 sm:mb-3 shrink-0">
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 sm:mb-1.5">
                        LOCATION & {zoneTypeLabel.toUpperCase()} SELECTION
                      </span>
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        Select Your Barangay & {zoneTypeLabel}
                      </h2>
                      <p className="text-[11px] sm:text-xs text-gray-500 max-w-md mx-auto mt-0.5 sm:mt-1">
                        Please select your official residential area in San Luis, Pampanga
                      </p>
                    </div>

                    {/* Selection 2-Row Container */}
                    <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-1.5 space-y-3.5 sm:space-y-4 max-w-xl mx-auto w-full">
                      {/* Row 1: Barangay Selection (2 Columns of Choices) */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex items-center justify-between px-0.5 shrink-0">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#0A6B43]" />
                            <span>Select Barangay *</span>
                          </label>
                          {selectedBarangay && (
                            <span className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 truncate">
                              {selectedBarangay}
                            </span>
                          )}
                        </div>

                        <div className="max-h-[160px] sm:max-h-[160px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg sm:rounded-xl p-1.5 sm:p-2 bg-gray-50/50">
                          <div className="grid grid-cols-2 gap-2">
                            {BARANGAYS.map((brgy) => {
                              const isSelected = selectedBarangay === brgy;
                              return (
                                <button
                                  key={brgy}
                                  type="button"
                                  onClick={() => {
                                    setSelectedBarangay(brgy);
                                    setRegPurok("");
                                    setSelectedPurokBase("");
                                  }}
                                  className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group flex items-center justify-between ${isSelected
                                    ? "border-gray-300 bg-emerald-50/80 ring-1 ring-emerald-600/30 shadow-2xs"
                                    : "border-gray-200 hover:border-gray-300 bg-white hover:bg-emerald-50/10"
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-1">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-[#0A6B43] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100/40 group-hover:text-emerald-700"
                                      }`}>
                                      <MapPin className="w-3 h-3" />
                                    </div>
                                    <span className={`text-[11px] font-bold truncate ${isSelected ? "text-[#0A6B43]" : "text-gray-700"}`}>
                                      {brgy}
                                    </span>
                                  </div>
                                  {isSelected && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Row 2: Purok / Street / Sitio Selection */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex items-center justify-between px-0.5 shrink-0">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                            <span>Select {zoneTypeLabel} Sector *</span>
                          </label>
                          {regPurok && (
                            <span className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 truncate max-w-[240px] sm:max-w-none">
                              {regPurok}
                            </span>
                          )}
                        </div>

                        {!selectedBarangay ? (
                          <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50/50">
                            <MapPin className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                            <p className="text-xs font-semibold text-gray-500">Please choose a Barangay first</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Available Puroks, Streets, and Sitios will appear here</p>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/50 space-y-2">
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                              <div className="grid grid-cols-2 gap-2">
                                {currentJurisdiction?.zones.map((zone) => {
                                  const isSelected = selectedPurokBase === zone.name || regPurok === zone.name || (regPurok && regPurok.startsWith(zone.name + " -"));
                                  return (
                                    <button
                                      key={zone.name}
                                      type="button"
                                      onClick={() => {
                                        setSelectedPurokBase(zone.name);
                                        if (!zone.sitios || zone.sitios.length === 0) {
                                          setRegPurok(zone.name);
                                        } else {
                                          if (!regPurok || !regPurok.startsWith(zone.name)) {
                                            setRegPurok(zone.name);
                                          }
                                        }
                                      }}
                                      className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group flex items-center justify-between ${
                                        isSelected
                                          ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-600/30 shadow-2xs"
                                          : "border-gray-200 hover:border-gray-300 bg-white hover:bg-emerald-50/10"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 pr-1">
                                        <div
                                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                                            isSelected
                                              ? "bg-[#0A6B43] text-white"
                                              : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100/40 group-hover:text-emerald-700"
                                          }`}
                                        >
                                          <MapPin className="w-3 h-3" />
                                        </div>
                                        <span className={`text-[11px] font-bold truncate ${isSelected ? "text-[#0A6B43]" : "text-gray-700"}`}>
                                          {zone.name}
                                        </span>
                                      </div>
                                      {isSelected && (
                                        <span className="w-3.5 h-3.5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Sitio Sub-selection for Puroks with Sitios (San Jose & San Carlos) */}
                            {activeZoneWithSitios && activeZoneWithSitios.sitios && activeZoneWithSitios.sitios.length > 0 && (
                              <div className="pt-2 border-t border-gray-200/90 animate-in fade-in duration-200">
                                <div className="flex items-center justify-between mb-1.5 px-0.5">
                                  <label className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wider flex items-center gap-1">
                                    <span>Sitios in {activeZoneWithSitios.name}</span>
                                    <span className="text-gray-400 font-normal lowercase">(specify sitio or center)</span>
                                  </label>
                                </div>
                                <div className="max-h-[140px] overflow-y-auto custom-scrollbar p-1.5 bg-white rounded-lg border border-gray-200 space-y-1">
                                  <button
                                    type="button"
                                    onClick={() => setRegPurok(activeZoneWithSitios.name)}
                                    className={`w-full p-2 rounded-md text-left text-[11px] font-medium flex items-center justify-between transition-colors ${
                                      regPurok === activeZoneWithSitios.name
                                        ? "bg-emerald-50 text-[#0A6B43] font-bold border border-emerald-200"
                                        : "hover:bg-gray-50 text-gray-700 border border-transparent"
                                    }`}
                                  >
                                    <span>{activeZoneWithSitios.name} (General / Center)</span>
                                    {regPurok === activeZoneWithSitios.name && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                                  </button>
                                  {activeZoneWithSitios.sitios.map((sitio) => {
                                    const fullValue = `${activeZoneWithSitios.name} - ${sitio}`;
                                    const isSelected = regPurok === fullValue;
                                    return (
                                      <button
                                        key={sitio}
                                        type="button"
                                        onClick={() => setRegPurok(fullValue)}
                                        className={`w-full p-2 rounded-md text-left text-[11px] font-medium flex items-center justify-between transition-colors ${
                                          isSelected
                                            ? "bg-emerald-50 text-[#0A6B43] font-bold border border-emerald-200"
                                            : "hover:bg-gray-50 text-gray-700 border border-transparent"
                                        }`}
                                      >
                                        <span>• {sitio}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Step 1: Personal Info Form */}
              {currentStep === 1 && (
                <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-personal-info">
                  {/* Non-scrollable Step Header */}
                  <div className="text-center mb-2.5 sm:mb-3 shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 sm:mb-1.5">
                      PERSONAL PROFILE DETAILS
                    </span>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Tell Us About Yourself</h2>
                    <p className="text-[11px] sm:text-xs text-gray-500 max-w-md mx-auto mt-0.5 sm:mt-1">
                      Please provide your personal information to create your SiKap profile
                    </p>
                  </div>

                  {/* Scrollable Form Fields ONLY */}
                  <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-1.5">
                    <div className="w-full max-w-xl mx-auto space-y-3.5 p-0.5">

                      {/* Row 1: Full Name */}
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="Juan dela Cruz"
                          className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        />
                      </div>

                      {/* Row 2: Date of Birth & Gender (2 Columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold relative z-20">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between h-4">
                            <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide inline-flex items-center h-full">Date of Birth *</label>
                            {regDOB && calculateAge(regDOB) !== "" && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 h-4 inline-flex items-center rounded border ${Number(calculateAge(regDOB)) >= 18 && Number(calculateAge(regDOB)) <= 30
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-rose-700 bg-rose-50 border-rose-200"
                                }`}>
                                {Number(calculateAge(regDOB)) >= 18 && Number(calculateAge(regDOB)) <= 30
                                  ? `${calculateAge(regDOB)} yrs`
                                  : `${calculateAge(regDOB)} yrs (Ineligible)`}
                              </span>
                            )}
                          </div>
                          <SiKapDatePicker
                            value={regDOB}
                            onChange={handleDOBChange}
                            max={new Date().toISOString().split("T")[0]}
                            hasError={!!(regDOB && calculateAge(regDOB) !== "" && (Number(calculateAge(regDOB)) < 18 || Number(calculateAge(regDOB)) > 30))}
                            label="Date of Birth"
                            badgeText="KK Youth"
                            showAgeIndicator={true}
                            defaultYear={new Date().getFullYear() - 20}
                            direction="down"
                            placeholder="Select date of birth"
                          />
                          {regDOB && calculateAge(regDOB) !== "" && (Number(calculateAge(regDOB)) < 18 || Number(calculateAge(regDOB)) > 30) && (
                            <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Ineligible age: KK membership requires age 18 to 30 (Calculated: {calculateAge(regDOB)} yrs).</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between h-4">
                            <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide inline-flex items-center h-full">Gender *</label>
                          </div>
                          <CustomSelect value={regGender} onChange={setRegGender} options={GENDER_OPTIONS} placeholder="Select Gender" />
                        </div>
                      </div>

                      {/* Row 3: Phone Number */}
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={regContact}
                          onChange={(e) => setRegContact(formatContactNumber(e.target.value))}
                          placeholder="+63 9"
                          className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs ${regContact && !isValidContactNumber(regContact) ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                            }`}
                        />
                        {regContact && !isValidContactNumber(regContact) && (
                          <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Incomplete number: Must be 11 digits starting with +63 9 (e.g. +63 912 345 6789).</span>
                          </p>
                        )}
                      </div>

                      {/* Row 4: Email Address with Inline Verification */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Email Address *</label>
                          {isEmailVerified && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsEmailVerified(false);
                                setOtpSent(false);
                                setOtpCode("");
                                setOtpError(null);
                                setDevCode(null);
                              }}
                              title="Click to change email"
                              className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Check className="w-3 h-3 stroke-[3]" /> Verified
                            </button>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            disabled={isEmailVerified}
                            value={regEmail}
                            onChange={(e) => {
                              setRegEmail(e.target.value);
                              setIsEmailVerified(false);
                              setOtpSent(false);
                              setOtpCode("");
                              setOtpError(null);
                              setDevCode(null);
                            }}
                            placeholder="juan.delacruz@gmail.com"
                            className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs ${
                              isEmailVerified
                                ? "bg-emerald-50/40 border-emerald-300 text-gray-800"
                                : (regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) || emailExists
                                  ? "bg-rose-50/30 border-rose-300"
                                  : "bg-gray-50/80 border-gray-200"
                            }`}
                          />
                          {isCheckingEmail && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-medium animate-pulse">
                              Checking...
                            </span>
                          )}
                        </div>
                        {regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) ? (
                          <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Invalid email format: Please enter a valid address (e.g. name@example.com).</span>
                          </p>
                        ) : emailExists ? (
                          <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Email already registered: This email address is already associated with an account.</span>
                          </p>
                        ) : null}

                        {/* Interactive Verification Section in the current placement */}
                        {regEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail) && !emailExists && !isCheckingEmail && !isEmailVerified && (
                          <div className="pt-1">
                            {!otpSent ? (
                              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Mail className="w-4 h-4 text-[#0A6B43] shrink-0" />
                                  <span className="font-medium text-[11px] sm:text-xs">
                                    Verify email ownership to continue registration.
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  disabled={isSendingOtp}
                                  onClick={handleSendOtp}
                                  className="w-full sm:w-auto px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                                >
                                  {isSendingOtp ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>Sending Code...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Mail className="w-3.5 h-3.5" />
                                      <span>Send Verification Code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div className="p-3.5 sm:p-4 bg-gray-50/80 border border-gray-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                                <div>
                                  <p className="text-[12px] text-gray-600 font-medium leading-relaxed">
                                    <strong className="text-gray-900 font-bold">Enter Verification Code.</strong> We sent a 6-digit code to{" "}
                                    <strong className="text-gray-900 font-bold">{regEmail}</strong>.
                                  </p>
                                </div>

                                {/* Clean 6-digit numeric input with a Verify button */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => {
                                          const val = e.target.value.replace(/\D/g, "");
                                          setOtpCode(val);
                                          if (otpError) setOtpError(null);
                                        }}
                                        placeholder="000000"
                                        className={`w-full h-11 px-4 bg-white rounded-xl font-mono text-center text-lg sm:text-xl font-bold tracking-[0.3em] transition-all shadow-2xs ${
                                          otpError
                                            ? "border border-rose-400 bg-rose-50/30 text-rose-900 focus:bg-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                                            : "border border-gray-300 text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden"
                                        }`}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      disabled={otpCode.length !== 6 || isVerifyingOtp}
                                      onClick={handleVerifyOtp}
                                      className="h-11 px-5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                    >
                                      {isVerifyingOtp ? (
                                        <>
                                          <RefreshCw className="w-4 h-4 animate-spin" />
                                          <span>Verifying...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4 stroke-[2.5]" />
                                          <span>Verify</span>
                                        </>
                                      )}
                                    </button>
                                  </div>

                                  {otpError && (
                                    <p className="text-xs font-semibold text-rose-600 flex items-center gap-1.5 pt-0.5 animate-in fade-in duration-150">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      <span>{otpError}</span>
                                    </p>
                                  )}
                                </div>

                                {/* Simple centered Resend Code Link */}
                                <div className="text-center pt-0.5">
                                  <p className="text-[12px] font-medium text-gray-600">
                                    Didn't receive code?{" "}
                                    <button
                                      type="button"
                                      disabled={otpCountdown > 0 || isSendingOtp}
                                      onClick={handleSendOtp}
                                      className="text-[#0A6B43] text-[12px] font-bold hover:text-[#075332] transition-colors cursor-pointer underline underline-offset-2 disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                    >
                                      {otpCountdown > 0 ? `Resend code (${otpCountdown}s)` : "Resend code"}
                                    </button>
                                  </p>
                                </div>

                                {devCode && (
                                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-mono flex items-center justify-between">
                                    <span>Demo code: <strong>{devCode}</strong></span>
                                    <button
                                      type="button"
                                      onClick={() => setOtpCode(devCode)}
                                      className="text-amber-900 underline font-sans text-[10px] font-bold cursor-pointer"
                                    >
                                      Auto-fill
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Row 5: Password & Confirm Password (2 Columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Password *</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full pl-3.5 sm:pl-4 pr-10 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs ${regPassword && regPassword.length < 6 ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden p-1 rounded-md transition-colors"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {regPassword && regPassword.length < 6 && (
                            <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Password too short: Must be at least 6 characters (Current: {regPassword.length}/6).</span>
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between h-4">
                            <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide inline-flex items-center h-full">Confirm Password *</label>
                            {regConfirmPassword && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 h-4 inline-flex items-center rounded border ${regPassword === regConfirmPassword
                                ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                : "text-rose-700 bg-rose-50 border-rose-200"
                                }`}>
                                {regPassword === regConfirmPassword ? "Match" : "No match"}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className={`w-full pl-3.5 sm:pl-4 pr-10 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs ${regConfirmPassword && regPassword !== regConfirmPassword ? "border-rose-300 bg-rose-50/30" : "border-gray-200"
                                }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-hidden p-1 rounded-md transition-colors"
                              title={showConfirmPassword ? "Hide password" : "Show password"}
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          {regConfirmPassword && regPassword !== regConfirmPassword && (
                            <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>Mismatch: Confirm password must match your password above.</span>
                            </p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Education & Demographics */}
              {currentStep === 2 && (
                <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-education-demographics">
                  {/* Non-scrollable Step Header */}
                  <div className="text-center mb-2.5 sm:mb-3 shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 sm:mb-1.5">
                      EDUCATION & BACKGROUND
                    </span>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Educational Attainment & Status</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5 sm:mt-1">
                      Tell us about your education to help us find relevant training opportunities
                    </p>
                  </div>

                  {/* Scrollable Form Fields ONLY */}
                  <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-1.5">
                    <div className="w-full max-w-xl mx-auto space-y-3.5 sm:space-y-6 p-0.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Highest Educational Attainment</label>
                          <CustomSelect value={regEdu} onChange={setRegEdu} options={[...EDUCATIONAL_ATTAINMENT_OPTIONS]} placeholder="Select Educational Attainment" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between h-4">
                            <label className="text-[10px] sm:text-[11px] font-black text-[#0A6B43] uppercase tracking-wide inline-flex items-center h-full">Youth Status</label>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 h-4 inline-flex items-center rounded border text-emerald-700 bg-emerald-50 border-emerald-200">System Target</span>
                          </div>
                          <input
                            type="text"
                            readOnly
                            value={regStatus}
                            className="w-full py-2 sm:py-2.5 px-3.5 sm:px-4 border border-emerald-600 bg-emerald-50/80 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium text-emerald-950 cursor-not-allowed shadow-2xs"
                          />
                        </div>
                      </div>

                      {/* OSY Program Notice */}
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#0A6B43] shrink-0 mt-0.5" />
                        <p className="font-medium text-[11px] leading-relaxed">
                          <strong className="font-extrabold text-[#075332]">Out-of-School Youth Focus:</strong> SiKap is specifically designed for Out-of-School Youth (OSY) in San Luis, Pampanga to access free TESDA skills training, allowance support, and direct livelihood referrals.
                        </p>
                      </div>

                      {/* Demographics Toggles */}
                      <div className="space-y-1.5 flex flex-col">
                        <div className="flex items-center justify-between px-0.5 shrink-0">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                            <span>Sectoral Demographics</span>
                          </label>
                        </div>

                        <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              {
                                key: "solo",
                                label: "Solo Parent",
                                isSelected: regSolo,
                                onClick: () => {
                                  setRegSolo(!regSolo);
                                  setRegNone(false);
                                }
                              },
                              {
                                key: "pwd",
                                label: "PWD Member",
                                isSelected: regPwd,
                                onClick: () => {
                                  setRegPwd(!regPwd);
                                  setRegNone(false);
                                }
                              },
                              {
                                key: "indigenous",
                                label: "Indigenous",
                                isSelected: regIndigenous,
                                onClick: () => {
                                  setRegIndigenous(!regIndigenous);
                                  setRegNone(false);
                                }
                              },
                              {
                                key: "none",
                                label: "None / General",
                                isSelected: regNone,
                                onClick: () => {
                                  const next = !regNone;
                                  setRegNone(next);
                                  if (next) {
                                    setRegSolo(false);
                                    setRegPwd(false);
                                    setRegIndigenous(false);
                                  }
                                }
                              }
                            ].map((sector) => {
                              return (
                                <button
                                  key={sector.key}
                                  type="button"
                                  onClick={sector.onClick}
                                  className={`p-2 sm:p-2.5 rounded-lg border text-left transition-all relative overflow-hidden group flex items-center justify-between ${sector.isSelected
                                    ? "border-gray-300 bg-emerald-50/80 ring-1 ring-emerald-600/30 shadow-2xs"
                                    : "border-gray-200 hover:border-gray-300 bg-white hover:bg-emerald-50/10"
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-1">
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${sector.isSelected ? "bg-[#0A6B43] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100/40 group-hover:text-emerald-700"
                                      }`}>
                                      <User className="w-3 h-3" />
                                    </div>
                                    <span className={`text-[11px] font-bold truncate ${sector.isSelected ? "text-[#0A6B43]" : "text-gray-700"}`}>
                                      {sector.label}
                                    </span>
                                  </div>
                                  {sector.isSelected && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Skills & Livelihood Goals */}
              {currentStep === 3 && (
                <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-skills-goals">
                  {/* Non-scrollable Step Header */}
                  <div className="text-center mb-2.5 sm:mb-3 shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 sm:mb-1.5">
                      INTERESTS & SKILLS MAPPING
                    </span>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Skills & Preferences</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5 sm:mt-1">
                      Tell us about your skills and goals to find suitable training.
                    </p>
                  </div>

                  {/* Scrollable Form Fields ONLY */}
                  <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-1.5">
                    <div className="w-full max-w-xl mx-auto space-y-3.5 sm:space-y-6 p-0.5">

                      {/* Preferred Vocational Sector */}
                      <div className="space-y-1">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Preferred Vocational Sector *</label>
                        <CustomSelect value={regSector} onChange={setRegSector} options={VOCATIONAL_SECTOR_OPTIONS} placeholder="Select Preferred Vocational Sector" />
                      </div>

                      {/* 1. Skills (Multi-entry tags) */}
                      <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">
                          Technical & Practical Skills *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                            placeholder="Type a skill (e.g. Computer, Welding, Cooking) and press Enter"
                            className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = skillInput.trim();
                              if (trimmed && !regSkills.includes(trimmed)) {
                                setRegSkills([...regSkills, trimmed]);
                                setSkillInput("");
                              }
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
                          {regSkills.map((s) => (
                            <span key={s} className="bg-emerald-50 text-[#0A6B43] border border-emerald-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                              {s}
                              <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-600 font-black p-0.5 text-xs cursor-pointer">
                                &times;
                              </button>
                            </span>
                          ))}
                          {regSkills.length === 0 && (
                            <span className="text-gray-400 italic text-[11px]">No skills added yet. Type a skill above and press Enter.</span>
                          )}
                        </div>
                      </div>

                      {/* 2. Experiences (Multi-entry tags) */}
                      <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">
                          Past Work / Practical Experiences (Optional)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={expInput}
                            onChange={(e) => setExpInput(e.target.value)}
                            onKeyDown={handleAddExperience}
                            placeholder="e.g. Computer Shop Helper, Worked in a bakery, Talyer assistant"
                            className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const trimmed = expInput.trim();
                              if (trimmed && !regExperiences.includes(trimmed)) {
                                setRegExperiences([...regExperiences, trimmed]);
                                setExpInput("");
                              }
                            }}
                            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
                          {regExperiences.map((exp) => (
                            <span key={exp} className="bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                              {exp}
                              <button type="button" onClick={() => handleRemoveExperience(exp)} className="hover:text-red-600 font-black p-0.5 text-xs cursor-pointer">
                                &times;
                              </button>
                            </span>
                          ))}
                          {regExperiences.length === 0 && (
                            <span className="text-gray-400 italic text-[11px]">Optional: Add past jobs, gigs, or informal assisting experience.</span>
                          )}
                        </div>
                      </div>

                      {/* 3. Primary Livelihood / Career Goal */}
                      <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                        <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">
                          Primary Career / Livelihood Goal *
                        </label>
                        <input
                          type="text"
                          required
                          value={regGoal}
                          onChange={(e) => setRegGoal(e.target.value)}
                          placeholder="e.g. I want to become an IT professional"
                          className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Verification & Declaration */}
              {currentStep === 4 && (
                <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-verification-declaration">
                  {/* Non-scrollable Step Header */}
                  <div className="text-center mb-2.5 sm:mb-3 shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-1 sm:mb-1.5">
                      IDENTITY VERIFICATION
                    </span>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">Official KK Member Verification</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-0.5 sm:mt-1">
                      Provide proof of identity to authorize your profile for official training referrals.
                    </p>
                  </div>

                  {/* Scrollable Form Fields ONLY */}
                  <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-2 sm:px-3 py-1.5">
                    <div className="w-full max-w-xl mx-auto space-y-3.5 sm:space-y-6 p-0.5">
                      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-6">

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                          <div className="space-y-1">
                            <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Verification ID Type *</label>
                            <CustomSelect value={regIdType} onChange={setRegIdType} options={VERIFICATION_ID_TYPE_OPTIONS} placeholder="Select Verification ID Type" />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">ID Number / Reference Number *</label>
                            <input
                              type="text"
                              required
                              value={regIdNumber}
                              onChange={(e) => setRegIdNumber(e.target.value)}
                              placeholder="e.g., LRN, ID, or Reference Number"
                              className="w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border border-gray-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                            />
                          </div>
                        </div>

                        {/* Drag and Drop Upload Zone */}
                        <div className="space-y-1.5 text-xs font-semibold">
                          <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">
                            Upload Proof of ID / Document Image *
                          </label>
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${isDragging
                              ? "border-[#0A6B43] bg-emerald-50/30"
                              : regIdFileName
                                ? "border-emerald-200 bg-emerald-50/5"
                                : "border-gray-200 hover:border-emerald-300 bg-white"
                              }`}
                          >
                            <input
                              type="file"
                              id="id-file-upload-input"
                              accept="image/*,.pdf"
                              onChange={handleFileChange}
                              className="hidden"
                            />

                            {!regIdFileName ? (
                              <label
                                htmlFor="id-file-upload-input"
                                className="flex flex-col items-center justify-center gap-2 cursor-pointer group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-emerald-50 text-gray-400 group-hover:text-[#0A6B43] flex items-center justify-center transition-colors">
                                  <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-700">
                                    Drag & drop your document here, or <span className="text-[#0A6B43] hover:underline">browse files</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                    Supports PNG, JPG, or PDF up to 5MB
                                  </p>
                                </div>
                              </label>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between bg-white border border-gray-200 p-2.5 rounded-xl max-w-md mx-auto shadow-2xs">
                                  <div
                                    onClick={() => setShowIdPreviewModal(true)}
                                    className="flex items-center gap-2.5 text-left cursor-pointer flex-1 min-w-0 group"
                                    title="Click to check uploaded image"
                                  >
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-[#0A6B43] group-hover:bg-[#0A6B43] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                                      <FileCheck className="w-5 h-5" />
                                    </div>
                                    <div className="truncate flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-800 truncate group-hover:text-[#0A6B43] transition-colors">{regIdFileName}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={() => setShowIdPreviewModal(true)}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0A6B43] rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Check image"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Check</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRegIdFileName("");
                                        setRegIdImage("");
                                      }}
                                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                      title="Remove file"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Clickable image preview thumbnail */}
                                {regIdImage && (
                                  <div
                                    onClick={() => setShowIdPreviewModal(true)}
                                    className="max-w-xs mx-auto border-2 border-emerald-100 hover:border-[#0A6B43] rounded-xl overflow-hidden shadow-xs relative group bg-slate-900/5 hover:bg-emerald-50/20 p-2 cursor-pointer transition-all hover:shadow-md"
                                    title="Click to check and expand ID image"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setShowIdPreviewModal(true);
                                      }
                                    }}
                                  >
                                    {regIdImage.startsWith("data:application/pdf") || regIdFileName.toLowerCase().endsWith(".pdf") ? (
                                      <div className="h-28 flex flex-col items-center justify-center gap-1 bg-white rounded-lg border border-slate-200">
                                        <FileDigit className="w-8 h-8 text-emerald-600" />
                                        <p className="text-[11px] font-bold text-slate-800">PDF Document Attached</p>
                                        <p className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                                          <ZoomIn className="w-3 h-3" /> Click to check preview
                                        </p>
                                      </div>
                                    ) : (
                                      <img
                                        src={regIdImage}
                                        alt="ID Verification Document"
                                        className="max-h-28 w-auto mx-auto rounded-lg object-contain transition-transform duration-200 group-hover:scale-[1.03]"
                                        referrerPolicy="no-referrer"
                                      />
                                    )}
                                    <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white p-2 rounded-xl">
                                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                        <ZoomIn className="w-4 h-4 text-white" />
                                      </div>
                                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">Click to Check</p>
                                      <p className="text-[9px] text-slate-200 font-medium text-center">Inspect clarity before submitting</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Attestations */}
                        <div className="space-y-3 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 text-xs font-semibold">
                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={certifyAge}
                              onChange={(e) => setCertifyAge(e.target.checked)}
                              className="w-4 h-4 rounded-xs accent-[#0A6B43] accent-emerald-600 text-[#0A6B43] focus:ring-emerald-500 mt-0.5 cursor-pointer"
                            />
                            <span className="text-xs font-medium text-gray-700 leading-relaxed">
                              I certify that the information I provided is true, accurate, and complete, and that I meet the requirements to register for SiKap.
                            </span>
                          </label>

                          <label className="flex items-start gap-2.5 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              required
                              checked={certifyResidency}
                              onChange={(e) => setCertifyResidency(e.target.checked)}
                              className="w-4 h-4 rounded-xs accent-[#0A6B43] accent-emerald-600 text-[#0A6B43] focus:ring-emerald-500 mt-0.5 cursor-pointer shrink-0"
                            />
                            <span className="text-xs font-medium text-gray-700 leading-relaxed">
                              I agree to SiKap's{" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onOpenLegal) {
                                    onOpenLegal("terms");
                                  } else {
                                    setTermsModalTab("terms");
                                    setShowTermsModal(true);
                                  }
                                }}
                                className="text-[#0A6B43] font-bold underline hover:text-emerald-800 transition-colors inline cursor-pointer"
                              >
                                Terms of Service
                              </button>{" "}
                              and{" "}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (onOpenLegal) {
                                    onOpenLegal("privacy");
                                  } else {
                                    setTermsModalTab("privacy");
                                    setShowTermsModal(true);
                                  }
                                }}
                                className="text-[#0A6B43] font-bold underline hover:text-emerald-800 transition-colors inline cursor-pointer"
                              >
                                Privacy Policy
                              </button>
                              , and consent to the collection and processing of my information for verification, youth profiling, and matching with relevant training opportunities.
                            </span>
                          </label>
                        </div>

                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Pending Approval Screen */}
              {currentStep === 5 && (
                <div className="flex-1 flex flex-col justify-center min-h-0 w-full animate-in zoom-in-95 duration-200" id="step-pending-approval">
                  <div className="space-y-6 max-w-lg mx-auto text-center py-8 px-6 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 border border-amber-300 flex items-center justify-center mx-auto shadow-xs">
                      <Clock className="w-9 h-9 animate-pulse" />
                    </div>

                    <div className="space-y-1.5">
                      <h2 className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
                        Registration Pending SK Verification
                      </h2>
                      <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed max-w-md mx-auto mt-1">
                        Thank you for registering! Your Katipunan ng Kabataan profile has been successfully submitted to Sangguniang Kabataan for <strong>{selectedBarangay}</strong>. It is now awaiting review and verification by your SK Chairperson. Once approved, your status will be set to active and you will get access to authorized job fairs and TESDA starters.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-amber-200/50 flex justify-center">
                      <button
                        type="button"
                        onClick={onBackToHome}
                        className="px-6 py-2.5 border border-amber-600 text-amber-900 hover:bg-amber-100/50 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Go back to Home
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Unified Sticky Footer Buttons */}
        {currentStep < 5 && (
          <div className={`flex items-center pt-3 border-t border-gray-200 mt-2 shrink-0 w-full max-w-2xl mx-auto ${currentStep === 0 ? "justify-end" : "justify-between"}`}>
            {/* Consistent Back Button with Left Arrow Icon (hidden on Step 1 / Location) */}
            {currentStep !== 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="group px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:border-gray-300"
              >
                <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                <span>Back</span>
              </button>
            )}

            {/* Consistent Continue / Submit Button with Right Arrow Icon */}
            {currentStep < 4 ? (
              <button
                type="button"
                disabled={!isStepValid(currentStep)}
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`group px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(currentStep)
                  ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <span>Continue</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isStepValid(currentStep) ? "group-hover:translate-x-1" : ""}`} />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isStepValid(4) || isRegistering}
                onClick={(e) => handleSubmit(e as any)}
                className={`group px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(4) && !isRegistering
                  ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                <span>{isRegistering ? "Submitting..." : "Submit Profiling"}</span>
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isStepValid(4) && !isRegistering ? "group-hover:translate-x-1" : ""}`} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expanded Document Check Modal */}
      {mounted && showIdPreviewModal && regIdImage && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIdPreviewModal(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="id-preview-modal-title"
        >
          <div
            className="bg-white border border-gray-200/90 rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-200 ease-out relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Header Banner */}
            <div className="bg-white px-5 sm:px-6 py-4.5 sm:py-5 shrink-0 border-b border-gray-100">
              <div className="flex items-center justify-between gap-4">
                <h3 id="id-preview-modal-title" className="text-xl sm:text-2xl font-black text-[#0A6B43] tracking-tight truncate leading-tight">
                  Check Uploaded Document
                </h3>

                <button
                  type="button"
                  onClick={() => setShowIdPreviewModal(false)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer shrink-0"
                  title="Close check"
                  aria-label="Close check"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Document Viewer Area */}
            <div className="flex-1 bg-slate-950 p-2 sm:p-4 flex items-center justify-center overflow-auto min-h-[280px] max-h-[60vh] sm:max-h-[64vh]">
              {regIdImage.startsWith("data:application/pdf") || regIdFileName.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={regIdImage}
                  title="PDF Document Preview"
                  className="w-full h-[55vh] rounded-lg bg-white border-0"
                />
              ) : (
                <img
                  src={regIdImage}
                  alt="Expanded ID Document Preview"
                  className="max-h-[58vh] max-w-full w-auto object-contain rounded-lg shadow-2xl transition-all"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Verification Metadata & Footer */}
            <div className="px-5 sm:px-6 py-4 bg-white border-t border-gray-200 space-y-3 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Selected ID Type</span>
                  <span className="font-extrabold text-gray-800 text-xs truncate block">{regIdType || "Not specified"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Entered Reference / ID No.</span>
                  <span className="font-mono font-bold text-gray-800 text-xs truncate block">{regIdNumber || "Not entered yet"}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  Ensure name and photo are clearly visible to avoid verification delays.
                </p>
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
                  <label
                    htmlFor="id-file-upload-input"
                    onClick={() => setShowIdPreviewModal(false)}
                    className="group px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-white hover:bg-gray-50 active:scale-95 text-gray-700 border border-gray-300 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4 transition-transform duration-200 group-hover:rotate-45" />
                    <span>Change File</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowIdPreviewModal(false)}
                    className="group px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Looks Good</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Terms of Service & Privacy Policy Modal */}
      {mounted && showTermsModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-[#0A6B43] to-emerald-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-200" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">Official Policy</span>
                    <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full text-white truncate max-w-[180px] sm:max-w-xs">
                      Barangay {selectedBarangay || "San Sebastian"}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight truncate text-white">
                    SiKap Legal & Privacy Statements
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center border-b border-gray-200 bg-gray-50/90 px-4 sm:px-6 shrink-0 pt-2 gap-2">
              <button
                type="button"
                onClick={() => setTermsModalTab("terms")}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  termsModalTab === "terms"
                    ? "border-[#0A6B43] text-[#0A6B43] font-black"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Terms of Service</span>
              </button>
              <button
                type="button"
                onClick={() => setTermsModalTab("privacy")}
                className={`flex items-center gap-2 pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  termsModalTab === "privacy"
                    ? "border-[#0A6B43] text-[#0A6B43] font-black"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Privacy Policy</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 text-gray-700 space-y-4 text-xs sm:text-sm leading-relaxed">
              {termsModalTab === "terms" ? (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Barangay {selectedBarangay || "San Sebastian"} • SK Youth Portal
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                      SiKap Terms of Service
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Katipunan ng Kabataan (KK) Youth Portal Terms
                    </p>
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>1. Acceptance of Terms</span>
                      </h5>
                      <p>
                        By creating an account, submitting your registration, or accessing the SiKap portal, you agree to be bound by these Terms of Service and all applicable laws and regulations of the Republic of the Philippines, including the SK Reform Act of 2015 (Republic Act No. 10742 as amended by Republic Act No. 11768) and the Local Government Code of 1991 (Republic Act No. 7160). If you do not agree to these Terms, you must not proceed with registration.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>2. Eligibility & Katipunan ng Kabataan Membership</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Age Requirement:</strong> Registration is open exclusively to Filipino citizens who are at least eighteen (18) years of age but not more than thirty (30) years of age at the time of application, in strict compliance with the legal definition of youth under Philippine law.</li>
                        <li><strong className="text-gray-800">Residency Requirement:</strong> You must be a bona fide resident of Barangay {selectedBarangay || "San Sebastian"} for at least six (6) months prior to registration.</li>
                        <li><strong className="text-gray-800">One Account per Youth:</strong> Each youth is permitted only one (1) official SiKap account linked to their validated identity. Duplicate accounts or impersonations will result in immediate disqualification and revocation of portal access.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>3. Identity Verification & Documentary Submissions</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Accurate Information:</strong> You certify that all personal profile details, contact numbers, educational background, employment status, and demographic classifications provided during registration are true, accurate, current, and complete.</li>
                        <li><strong className="text-gray-800">Valid Identification:</strong> You are required to submit an authentic, clear, and legible copy of a government-recognized identification card (e.g., National ID / PhilSys, Student ID, Voter's ID / Certificate, LRN Document, Passport, Driver's License, or Barangay Clearance).</li>
                        <li><strong className="text-gray-800">Penalties for Misrepresentation:</strong> Falsification of documents, deliberate submission of altered files, or providing fraudulent residency or age claims constitutes grounds for account termination and possible administrative or legal action under Article 172 of the Revised Penal Code.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>4. Official Verification Process & Portal Status</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Pending Review:</strong> Upon submission of your registration, your profile is placed in "Pending Review" status pending physical or electronic evaluation by the Sangguniang Kabataan (SK) Chairperson and authorized Council Officers of Barangay {selectedBarangay || "San Sebastian"}.</li>
                        <li><strong className="text-gray-800">Approval & Activation:</strong> You will only gain access to official government-sponsored training allocations, TESDA scholarship endorsements, job referrals, and youth welfare programs once your profile is verified and marked "Active".</li>
                        <li><strong className="text-gray-800">Revocation & Inactivation:</strong> The SK Council reserves the right to suspend or revoke an account if the member ages out (exceeds 30 years old), transfers permanent residency outside Barangay {selectedBarangay || "San Sebastian"}, or violates portal guidelines.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>5. Training Referrals & TESDA Partner Program Rules</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Skills Matching:</strong> SiKap utilizes youth profile attributes (hobbies, educational attainment, availability, and career aspirations) to recommend matched Technical-Vocational Education and Training (TVET) programs offered by accredited TESDA partners.</li>
                        <li><strong className="text-gray-800">No Guarantee of Employment:</strong> While SiKap provides referrals and endorsements to authorized training partners, acceptance into specific classes is subject to training center slots, prerequisites, and program schedules.</li>
                        <li><strong className="text-gray-800">Commitment to Completion:</strong> When a youth member formally commits to and enrolls in a subsidized training program, they are expected to maintain regular attendance and complete the module, ensuring public training funds are utilized responsibly.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>6. AI-Assisted Recommendation Disclaimer</span>
                      </h5>
                      <p>
                        SiKap employs algorithmic Content-Based Filtering (CBF) and Google Gemini AI assistance to analyze training alignments and generate personalized learning pathways. These AI-generated suggestions serve solely as educational and vocational guidance and do not restrict you from exploring other programs offered in your community.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>7. Code of Conduct & Platform Usage</span>
                      </h5>
                      <p>
                        You agree to use the SiKap portal only for lawful youth development purposes. You shall not attempt to breach security, inject malicious code, harvest data from other youth members, or disrupt system availability. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>8. Limitation of Liability</span>
                      </h5>
                      <p>
                        The Sangguniang Kabataan of Barangay {selectedBarangay || "San Sebastian"}, the Barangay Council, and partner training institutions provide this platform as a public governance and youth welfare service. While we endeavor to keep the system operational and accurate, the SK Council shall not be liable for technical interruptions, telecommunications downtime, or external partner schedule modifications.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>9. Amendments to Terms</span>
                      </h5>
                      <p>
                        The SK Council reserves the right to modify or replace these Terms to conform with updated national youth policies, municipal ordinances, or platform features. Continued use of SiKap after such changes constitutes acceptance of the updated Terms.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Republic Act No. 10173 • Data Privacy Act of 2012
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-gray-900 mt-1">
                      SiKap Privacy Policy
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Barangay {selectedBarangay || "San Sebastian"} — Sangguniang Kabataan Council
                    </p>
                  </div>

                  <div className="space-y-3.5 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>1. Statement of Policy</span>
                      </h5>
                      <p>
                        The Sangguniang Kabataan (SK) Council of Barangay {selectedBarangay || "San Sebastian"} is committed to protecting your personal data and upholding your fundamental rights as a data subject in full compliance with Republic Act No. 10173 (Data Privacy Act of 2012), its Implementing Rules and Regulations (IRR), and all issuances of the National Privacy Commission (NPC).
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>2. Information We Collect</span>
                      </h5>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Personal Identity:</strong> Full legal name, date of birth, age, sex/gender, civil status, and purok / address in Barangay {selectedBarangay || "San Sebastian"}.</li>
                        <li><strong className="text-gray-800">Contact Details:</strong> Mobile phone number and official login email address.</li>
                        <li><strong className="text-gray-800">Socio-Demographic Profile:</strong> Educational attainment, current employment status (e.g., In-School Youth, Out-of-School Youth / OSY, Working Youth, Unemployed), youth sector classification, hobbies, and career interests.</li>
                        <li><strong className="text-gray-800">Verification Documents:</strong> Identification card number, ID type, and digital image/file upload of your supporting identity document.</li>
                        <li><strong className="text-gray-800">Program & Training Data:</strong> Enrolled TESDA courses, training attendance, completion status, certificates attained, and referral history.</li>
                        <li><strong className="text-gray-800">Technical & Device Information:</strong> Login timestamps, IP address, and browser session identifiers used for fraud prevention and security audits.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>3. Purpose & Legal Basis of Processing</span>
                      </h5>
                      <p className="mb-1.5">
                        Your personal data is processed under the legal bases of Explicit Consent (Section 12.a and 13.a of RA 10173) and the performance of a public task mandated by law under RA 10742 (SK Reform Act of 2015):
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li>Establishing and maintaining the official registry of Katipunan ng Kabataan members in Barangay {selectedBarangay || "San Sebastian"};</li>
                        <li>Verifying youth age (18–30) and local barangay residency requirements;</li>
                        <li>Matching youth profiles with suitable TESDA livelihood courses and technical-vocational training;</li>
                        <li>Processing official endorsements, attendance tracking, and completion certification;</li>
                        <li>Generating anonymized statistical reports for youth development planning and municipal governance;</li>
                        <li>Communicating announcements regarding youth assemblies, job caravans, training slots, and emergency relief programs.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>4. Data Sharing & Disclosure</span>
                      </h5>
                      <p className="mb-1.5">
                        Your personal data will never be sold, rented, or traded for commercial marketing purposes. Data disclosure is limited to authorized stakeholders on a strict need-to-know basis:
                      </p>
                      <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                        <li><strong className="text-gray-800">Sangguniang Kabataan Council & Barangay Officials:</strong> The SK Chairperson and designated officers verify member identities and manage local community allocations.</li>
                        <li><strong className="text-gray-800">Accredited TESDA Partner Centers:</strong> When you apply for a training program, your name, contact details, educational background, and verification status are shared with the training provider solely to facilitate class enlistment and certification.</li>
                        <li><strong className="text-gray-800">Statutory Regulatory Authorities:</strong> Anonymized, aggregated demographic summaries may be submitted to the National Youth Commission (NYC), the Department of the Interior and Local Government (DILG), and the Local Youth Development Council (LYDC) as required by national reporting standards.</li>
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>5. Automated Profiling & Artificial Intelligence (AI)</span>
                      </h5>
                      <p>
                        SiKap utilizes automated recommendation algorithms and Google Gemini AI assistance to analyze your declared interests, skills, and educational background to suggest relevant vocational pathways. Automated recommendations do not carry binding legal decisions; final training selection and enrollment decisions remain entirely under the voluntary discretion of the youth member and partner institutions.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>6. Data Storage & Information Security Measures</span>
                      </h5>
                      <p>
                        We implement technical, physical, and organizational security measures, including HTTPS encryption in transit, hashed passwords via bcrypt, restricted role-based database access, and secure local/cloud storage. Uploaded ID images are stored in protected directories accessible solely to verified administrators during the validation phase.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>7. Data Retention, Disposal & Restoration Policy</span>
                      </h5>
                      <p>
                        Your personal information is retained in the active Katipunan ng Kabataan directory as long as you remain an eligible youth member (ages 15 to 30, and 18 to 30 for adult TVET matching) residing in Barangay {selectedBarangay || "San Sebastian"}. Upon reaching age thirty-one (31), permanent relocation, or deactivation, your record transitions into an Archived Status preserved for three (3) years in compliance with COA, TESDA, and DILG statutory audit rules. Following this period or upon an approved Right to Erasure request, sensitive personal data (encrypted contacts, government IDs, uploaded verification photos) is cryptographically scrubbed and purged. Deactivated or archived accounts may be restored within a thirty (30) day grace period by contacting your SK Chairperson or Municipal Administrator. Encrypted database disaster recovery backups are retained for 30 rolling days.
                      </p>
                    </div>

                    <div>
                      <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5 mb-1 text-[#0A6B43]">
                        <span>8. Your Rights as a Data Subject</span>
                      </h5>
                      <p className="mb-1.5">
                        Under the Data Privacy Act of 2012, you possess the right to be informed, right to access, right to rectification, right to erasure or blocking, and right to lodge a complaint with the National Privacy Commission (NPC).
                      </p>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                      <h5 className="font-black text-xs uppercase tracking-wide mb-1 text-[#0A6B43]">
                        9. Inquiries & Official Contact
                      </h5>
                      <div className="text-gray-700 space-y-0.5">
                        <p><strong>Office:</strong> Sangguniang Kabataan Council of Barangay {selectedBarangay || "San Sebastian"}</p>
                        <p><strong>Email:</strong> sikap.system@gmail.com</p>
                        <p><strong>Office Address:</strong> {selectedBarangay || "San Sebastian"} Barangay Hall, Sangguniang Kabataan Office</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 sm:p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-[11px] text-gray-500 hidden sm:block">
                Katipunan ng Kabataan (KK) — Barangay {selectedBarangay || "San Sebastian"}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-200/70 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCertifyResidency(true);
                    setShowTermsModal(false);
                  }}
                  className="px-5 py-2 text-xs font-black text-white bg-[#0A6B43] hover:bg-[#075332] rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>I Have Read & Agree</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

