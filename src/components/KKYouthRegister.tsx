"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, MapPin, Check, Sparkles, Clock, CheckCircle,
  User, Mail, Phone, Calendar, Award, GraduationCap, Plus, X,
  Upload, ShieldAlert, FileDigit, FileCheck, ChevronRight, ChevronLeft, ChevronDown,
  Eye, EyeOff, AlertCircle
} from "lucide-react";
import { YouthProfile, UserRole, EDUCATIONAL_ATTAINMENT_OPTIONS } from "../types";
import { SikapLogo } from "./ReusableComponents";
import { formatContactNumber, isValidContactNumber, calculateAge } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface KKYouthRegisterProps {
  onRegisterComplete: (newProfile: YouthProfile) => void;
  onBackToHome: () => void;
}

const BARANGAYS = [
  "San Sebastian",
  "Sta. Cruz Pambilog",
  "San Nicolas",
  "Sto. Rosario",
  "San Jose",
  "San Juan",
  "Sta. Rita",
  "Sto. Niño",
  "San Agustin",
  "San Carlos",
  "San Isidro",
  "San Roque",
  "Sta. Cruz Población",
  "Sta. Lucia",
  "Sta. Monica",
  "Sta. Catalina",
  "Sto. Tomas"
];

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
        className={`w-full flex items-center justify-between pl-3 sm:pl-4 pr-9 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden shadow-2xs cursor-pointer ${
          value ? "text-gray-900 border-gray-200" : "text-gray-400 border-gray-200"
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
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface SiKapDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  max?: string;
  hasError?: boolean;
}

const SiKapDatePicker: React.FC<SiKapDatePickerProps> = ({
  value,
  onChange,
  max,
  hasError = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const monthSelectRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLDivElement>(null);
  const selectedYearButtonRef = useRef<HTMLButtonElement>(null);

  const initialDate = value ? new Date(value) : new Date(new Date().getFullYear() - 20, 0, 1);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      } else {
        if (monthSelectRef.current && !monthSelectRef.current.contains(e.target as Node)) {
          setIsMonthOpen(false);
        }
        if (yearSelectRef.current && !yearSelectRef.current.contains(e.target as Node)) {
          setIsYearOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  // Comprehensive years range: from current year down to 1920 (100+ years), scrolling in custom dropdown
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);

  // Auto-scroll the year dropdown to center on the active viewYear
  useEffect(() => {
    if (isYearOpen) {
      const timer = setTimeout(() => {
        selectedYearButtonRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isYearOpen]);

  const prevMonth = () => {
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const formatDisplay = (val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length !== 3) return val;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${MONTH_NAMES[m]} ${d}, ${y}`;
  };

  const maxDate = max ? new Date(max) : new Date();

  return (
    <div ref={containerRef} className="relative w-full min-w-0">
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMonthOpen(false);
          setIsYearOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all text-left focus:outline-hidden shadow-2xs cursor-pointer group ${
          isOpen
            ? "border-[#0A6B43] ring-2 ring-emerald-500/20 bg-white"
            : hasError
              ? "border-rose-300 bg-rose-50/30 text-gray-900"
              : value
                ? "border-gray-200 text-gray-900 bg-gray-50/80 hover:bg-white hover:border-gray-300"
                : "border-gray-200 text-gray-400 bg-gray-50/80 hover:bg-white hover:border-gray-300"
        } border`}
      >
        <span className="truncate block pr-2">
          {value ? formatDisplay(value) : "Select Date of Birth"}
        </span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
          isOpen ? "bg-emerald-100 text-[#0A6B43]" : "text-gray-400 group-hover:text-[#0A6B43]"
        }`}>
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 w-full sm:w-[320px] bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-xl z-50 p-3 sm:p-3.5 ring-1 ring-black/5"
          >
            {/* Top Branding Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#0A6B43]" />
                <span>Date of Birth</span>
              </span>
              <span className="text-[9px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                KK Youth
              </span>
            </div>

            {/* Header: Month & Year Selector + Prev/Next buttons */}
            <div className="flex items-center justify-between gap-1 mb-2.5 relative">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer shrink-0"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                {/* Custom Scrolling Month Dropdown */}
                <div ref={monthSelectRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthOpen(!isMonthOpen);
                      setIsYearOpen(false);
                    }}
                    className={`flex items-center gap-1 bg-gray-50/90 hover:bg-emerald-50/40 border text-xs font-bold text-gray-800 rounded-lg pl-2.5 pr-2 py-1 transition-all cursor-pointer ${
                      isMonthOpen ? "border-[#0A6B43] ring-1 ring-emerald-500/20 bg-white" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{MONTH_NAMES[viewMonth]}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMonthOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isMonthOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1.5 w-36 max-h-44 overflow-y-auto custom-scrollbar bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1"
                      >
                        {MONTH_NAMES.map((name, idx) => {
                          const isSelected = viewMonth === idx;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setViewMonth(idx);
                                setIsMonthOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 text-[#0A6B43] font-bold"
                                  : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                              }`}
                            >
                              <span>{name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Custom Scrolling Year Dropdown */}
                <div ref={yearSelectRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearOpen(!isYearOpen);
                      setIsMonthOpen(false);
                    }}
                    className={`flex items-center gap-1 bg-gray-50/90 hover:bg-emerald-50/40 border text-xs font-bold text-gray-800 rounded-lg pl-2.5 pr-2 py-1 transition-all cursor-pointer ${
                      isYearOpen ? "border-[#0A6B43] ring-1 ring-emerald-500/20 bg-white" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{viewYear}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isYearOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 sm:left-0 top-full mt-1.5 w-28 max-h-44 overflow-y-auto custom-scrollbar bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1"
                      >
                        {years.map(y => {
                          const isSelected = viewYear === y;
                          return (
                            <button
                              key={y}
                              ref={isSelected ? selectedYearButtonRef : null}
                              type="button"
                              onClick={() => {
                                setViewYear(y);
                                setIsYearOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 text-[#0A6B43] font-bold"
                                  : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                              }`}
                            >
                              <span>{y}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer shrink-0"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS_OF_WEEK.map((d, idx) => (
                <span
                  key={d}
                  className={`text-[10px] font-extrabold py-1 ${
                    idx === 0 ? "text-rose-400" : "text-gray-400"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="w-7 h-7 sm:w-8 sm:h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(viewYear, viewMonth, day);
                const isFuture = cellDate.getTime() > maxDate.getTime();
                const formattedCell = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = value === formattedCell;

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isFuture}
                    onClick={() => handleSelectDay(day)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#0A6B43] text-white font-bold shadow-xs scale-105 cursor-pointer"
                        : isFuture
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-[#0A6B43] cursor-pointer"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Age Status Indicator & Actions */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              {value && calculateAge(value) !== "" ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Age: <strong className="text-gray-800">{calculateAge(value)} yrs</strong>
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      Number(calculateAge(value)) >= 18 && Number(calculateAge(value)) <= 30
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}>
                      {Number(calculateAge(value)) >= 18 && Number(calculateAge(value)) <= 30
                        ? "KK Eligible"
                        : "Ineligible (18-30)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] text-gray-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between text-[10px] text-gray-400">
                  <span>Target youth age: 18 - 30</span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="text-[#0A6B43] font-bold hover:underline cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
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
  onBackToHome
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
  const [isDragging, setIsDragging] = useState(false);
  const [certifyAge, setCertifyAge] = useState(false);
  const [certifyResidency, setCertifyResidency] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stepContentRef.current) {
      stepContentRef.current.scrollTop = 0;
    }
  }, [currentStep]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRegIdFileName(file.name);
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
      setRegIdFileName(file.name);
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
        onRegisterComplete(data.data);
        setCurrentStep(5); // Go to "Pending Approval" screen
      } else {
        alert("Registration failed: " + data.message);
      }
    } catch (err) {
      alert("An error occurred during registration.");
      console.error(err);
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
        return !!regName.trim() && !!regGender && isValidContactNumber(regContact) && isAgeValid && emailRegex.test(regEmail) && !emailExists && isPasswordValid;
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
    <div className="flex flex-col h-full w-full min-h-0" id="kk-youth-self-registration-flow">
      <div className="w-full flex flex-col h-full min-h-0">

        {/* Stepper Progress - Anchored persistently at top */}
        {currentStep < 5 && (
          <div className="mb-2.5 sm:mb-4 bg-white border border-gray-150 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-xs shrink-0 w-full max-w-2xl mx-auto" id="kk-reg-stepper">
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
              {/* Step 0: Barangay & Purok Selection */}
              {currentStep === 0 && (
                <div className="flex-1 flex flex-col min-h-0 w-full" id="step-location-select">
              {/* Non-scrollable Step Header */}
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  LOCATION & PUROK SELECTION
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight pb-0.5 sm:pb-1">Select Your Barangay & Purok</h2>
                <p className="text-[11px] sm:text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-1 sm:pb-2">
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

                  <div className="max-h-[160px] sm:max-h-[190px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg sm:rounded-xl p-1.5 sm:p-2 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-2">
                      {BARANGAYS.map((brgy) => {
                        const isSelected = selectedBarangay === brgy;
                        return (
                          <button
                            key={brgy}
                            type="button"
                            onClick={() => setSelectedBarangay(brgy)}
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

                {/* Row 2: Purok Selection (2 Columns of Choices) */}
                <div className="space-y-1.5 flex flex-col">
                  <div className="flex items-center justify-between px-0.5 shrink-0">
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                      <span>Select Purok Sector *</span>
                    </label>
                    {regPurok && (
                      <span className="text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {regPurok}
                      </span>
                    )}
                  </div>

                  <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/50">
                    <div className="grid grid-cols-2 gap-2">
                      {["Purok 1", "Purok 2", "Purok 3", "Purok 4"].map((purok) => {
                        const isSelected = regPurok === purok;
                        return (
                          <button
                            key={purok}
                            type="button"
                            onClick={() => setRegPurok(purok)}
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
                                {purok}
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
              </div>
            </div>
          )}

          {/* Step 1: Personal Info Form */}
          {currentStep === 1 && (
            <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-personal-info">
              {/* Non-scrollable Step Header */}
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  PERSONAL PROFILE DETAILS
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight pb-0.5 sm:pb-1">Tell Us About Yourself</h2>
                <p className="text-[11px] sm:text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-1">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
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
                      />
                      {regDOB && calculateAge(regDOB) !== "" && (Number(calculateAge(regDOB)) < 18 || Number(calculateAge(regDOB)) > 30) && (
                        <p className="text-[10px] text-rose-500 font-semibold flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Ineligible age: KK membership requires age 18 to 30 (Calculated: {calculateAge(regDOB)} yrs).</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Gender *</label>
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

                  {/* Row 4: Email Address */}
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wide block">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="juan.delacruz@gmail.com"
                        className={`w-full px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gray-50/80 border rounded-lg sm:rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs ${(regEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail)) || emailExists
                          ? "border-rose-300 bg-rose-50/30"
                          : "border-gray-200"
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
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  EDUCATION & BACKGROUND
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight pb-0.5 sm:pb-1">Educational Attainment & Status</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-1">
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
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  INTERESTS & SKILLS MAPPING
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight pb-0.5 sm:pb-1">Skills & Preferences</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-1">
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
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  IDENTITY VERIFICATION
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight pb-0.5 sm:pb-1">Official KK Member Verification</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-1">
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
                            <div className="flex items-center justify-between bg-white border border-gray-150 p-2.5 rounded-lg max-w-sm mx-auto">
                              <div className="flex items-center gap-2 text-left">
                                <div className="w-8 h-8 rounded bg-emerald-100 text-[#0A6B43] flex items-center justify-center">
                                  <FileCheck className="w-4 h-4" />
                                </div>
                                <div className="truncate max-w-[200px]">
                                  <p className="text-xs font-bold text-gray-800 truncate">{regIdFileName}</p>
                                  <p className="text-[9px] text-emerald-600 font-bold">Successfully attached</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setRegIdFileName("");
                                  setRegIdImage("");
                                }}
                                className="text-gray-400 hover:text-red-500 p-1"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Image preview */}
                            {regIdImage && (
                              <div className="max-w-xs mx-auto border border-gray-100 rounded-lg overflow-hidden shadow-xs relative group bg-gray-50 p-1">
                                <img
                                  src={regIdImage}
                                  alt="ID Verification Document"
                                  className="max-h-28 w-auto mx-auto rounded object-contain"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <p className="text-[9px] text-white font-bold uppercase tracking-wider">Preview Document</p>
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
                          className="w-4 h-4 rounded-xs accent-[#0A6B43] accent-emerald-600 text-[#0A6B43] focus:ring-emerald-500 mt-0.5 cursor-pointer"
                        />
                        <span className="text-xs font-medium text-gray-700 leading-relaxed">
                          I agree to SiKap's Terms of Service and Privacy Policy, and consent to the collection and processing of my information for verification, youth profiling, and matching with relevant training opportunities.
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

                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-black text-amber-900 tracking-tight">
                    Registration Pending SK Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed max-w-md mx-auto">
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
                className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-lg sm:rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:border-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Consistent Continue / Submit Button with Right Arrow Icon */}
            {currentStep < 4 ? (
              <button
                type="button"
                disabled={!isStepValid(currentStep)}
                onClick={() => setCurrentStep(currentStep + 1)}
                className={`px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(currentStep)
                  ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!isStepValid(4) || isRegistering}
                onClick={(e) => handleSubmit(e as any)}
                className={`px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold rounded-lg sm:rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(4) && !isRegistering
                  ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer hover:-translate-y-0.5"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {isRegistering ? "Submitting..." : "Submit Profiling"}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

