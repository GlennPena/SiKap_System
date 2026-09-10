"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft, MapPin, Check, Sparkles, Clock, CheckCircle,
  User, Mail, Phone, Calendar, Award, GraduationCap, Plus, X,
  Upload, ShieldAlert, FileDigit, FileCheck, ChevronRight, ChevronLeft
} from "lucide-react";
import { YouthProfile, UserRole } from "../types";
import { SikapLogo } from "./ReusableComponents";
import { formatContactNumber, isValidContactNumber, calculateAge } from "../lib/utils";

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
  const [regDOB, setRegDOB] = useState("2006-05-15");
  const [regAge, setRegAge] = useState<number | string>(() => calculateAge("2006-05-15") || 20);
  const [regContact, setRegContact] = useState("+63 9");
  const [regPurok, setRegPurok] = useState("Purok 2");

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

  const [regEdu, setRegEdu] = useState("College level");
  const [regStatus, setRegStatus] = useState("Out-of-school");

  const [skillInput, setSkillInput] = useState("");
  const [regSkills, setRegSkills] = useState<string[]>(["Computer"]);

  const [prefInput, setPrefInput] = useState("");
  const [regPreferences, setRegPreferences] = useState<string[]>(["Technology"]);
  const [regSector, setRegSector] = useState("Information & Communications Technology (ICT)");

  const [expInput, setExpInput] = useState("");
  const [regExperiences, setRegExperiences] = useState<string[]>([]);

  const [regGoal, setRegGoal] = useState("I want to become an IT professional");

  const [regSolo, setRegSolo] = useState(false);
  const [regPwd, setRegPwd] = useState(false);
  const [regIndigenous, setRegIndigenous] = useState(false);

  // ID Verification states
  const [regIdType, setRegIdType] = useState("National ID");
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
    { label: "CBF Signals", desc: "Skills, Prefs & Goal", icon: <Award className="w-4 h-4" /> },
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
    if (!regName.trim() || !regGoal.trim() || !regContact.trim() || !selectedBarangay || !regEmail.trim() || regPassword.length < 6) {
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
      age: regAge,
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
        return !!selectedBarangay;
      case 1: {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !!regName.trim() && isValidContactNumber(regContact) && regAge !== "" && Number(regAge) >= 15 && Number(regAge) <= 30 && emailRegex.test(regEmail) && regPassword.length >= 6;
      }
      case 2:
        return true; // Dropdowns and checkboxes have default values
      case 3:
        return !!regGoal.trim() && !!regSector.trim();
      case 4:
        return !!regIdNumber.trim() && !!regIdFileName && certifyAge && certifyResidency;
      default:
        return false;
    }
  };

  return (
    <div className="flex flex-col h-full w-full min-h-0" id="kk-youth-self-registration-flow">
      <div className="w-full flex flex-col h-full min-h-0">

        {/* Stepper Progress - Anchored persistently at top */}
        {currentStep < 5 && (
          <div className="mb-4 bg-white border border-gray-150 p-3 sm:p-4 rounded-2xl shadow-xs shrink-0 w-full max-w-xl mx-auto" id="kk-reg-stepper">
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
              <div
                className="bg-[#0A6B43] h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / 5) * 100}%` }}
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
                        <div
                          className="bg-[#0A6B43] h-full transition-all duration-300 ease-out"
                          style={{ width: idx < currentStep ? "100%" : "0%" }}
                        />
                      </div>
                    )}

                    {/* Step Node Icon Button */}
                    <button
                      type="button"
                      disabled={idx > currentStep && !isStepValid(currentStep)}
                      onClick={() => idx <= currentStep && setCurrentStep(idx)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 focus:outline-hidden relative z-10 ${isCompleted
                        ? "bg-[#0A6B43] border-[#0A6B43] text-white cursor-pointer hover:bg-[#075332] shadow-xs"
                        : isActive
                          ? "bg-white border-[#0A6B43] text-[#0A6B43] ring-4 ring-emerald-50 cursor-default"
                          : "bg-white border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      title={step.label}
                    >
                      {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : step.icon}
                    </button>

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
        <div className="flex-1 min-h-0 flex flex-col w-full max-w-xl mx-auto px-1 pt-3">
          {/* Step 0: Barangay Selection */}
          {currentStep === 0 && (
            <div className="flex-1 flex flex-col min-h-0 w-full animate-in fade-in slide-in-from-bottom-3 duration-250" id="step-location-select">
              {/* Non-scrollable Step Header */}
              <div className="text-center space-y-1.5 mb-3 shrink-0">
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                  LOCATION SELECTION
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.05] pb-1">Which Barangay Are You From?</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-3">
                  Please select your official residential barangay in San Luis, Pampanga
                </p>
              </div>

              {/* Scrollable Barangay Card Grid ONLY */}
              <div ref={stepContentRef} className="flex-1 min-h-0 max-h-[365px] overflow-y-auto custom-scrollbar py-1 pt-1">
                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
                  {BARANGAYS.map((brgy) => {
                    const isSelected = selectedBarangay === brgy;
                    return (
                      <button
                        key={brgy}
                        type="button"
                        onClick={() => setSelectedBarangay(brgy)}
                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex items-center justify-between ${isSelected
                          ? "border-[#0A6B43] bg-emerald-50/30 ring-1 ring-[#0A6B43]/50"
                          : "border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/5"
                          }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isSelected ? "bg-[#0A6B43] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100/30 group-hover:text-emerald-700"
                            }`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <span className={`text-xs font-bold ${isSelected ? "text-[#0A6B43]" : "text-gray-700"}`}>
                            {brgy}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-[#0A6B43] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
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
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.05] pb-1">Tell Us About Yourself</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-3">
                  Please provide your personal information to create your SiKap profile
                </p>
              </div>

              {/* Scrollable Form Fields ONLY */}
              <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 py-1">
                <div className="w-full max-w-xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Juan dela Cruz"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="juan.delacruz@gmail.com"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Date of Birth</label>
                      </div>
                      <input
                        type="date"
                        value={regDOB}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={(e) => handleDOBChange(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Age * (15-30)</label>
                          {regDOB && calculateAge(regDOB) !== "" && (
                            <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight">Auto</span>
                          )}
                        </div>
                        <input
                          type="number"
                          required
                          min={15}
                          max={30}
                          value={regAge}
                          onChange={(e) => setRegAge(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="20"
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Purok Sector *</label>
                        <select
                          value={regPurok}
                          onChange={(e) => setRegPurok(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        >
                          <option value="Purok 1">Purok 1</option>
                          <option value="Purok 2">Purok 2</option>
                          <option value="Purok 3">Purok 3</option>
                          <option value="Purok 4">Purok 4</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {regAge !== "" && (Number(regAge) < 15 || Number(regAge) > 30) && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] font-medium">
                      Note: Katipunan ng Kabataan (KK) membership requires an age between 15 and 30 years old.
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Password *</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Contact Number *</label>
                      <input
                        type="text"
                        required
                        value={regContact}
                        onChange={(e) => setRegContact(formatContactNumber(e.target.value))}
                        placeholder="+63 9xx xxx xxxx"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
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
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.05] pb-1">Educational Attainment & Status</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-3">
                  Providing these details helps map qualifying parameters for local scholarship priorities
                </p>
              </div>

              {/* Scrollable Form Fields ONLY */}
              <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 py-1">
                <div className="w-full max-w-xl mx-auto space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Highest Educational Attainment</label>
                      <select
                        value={regEdu}
                        onChange={(e) => setRegEdu(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      >
                        <option value="College level">College level</option>
                        <option value="SHS graduate">SHS graduate</option>
                        <option value="HS graduate">HS graduate</option>
                        <option value="Elementary level">Elementary level</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-black text-[#0A6B43] uppercase tracking-wide block flex items-center justify-between">
                        <span>Youth Status</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">System Target</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={regStatus}
                        className="w-full py-2.5 px-4 border-2 border-emerald-300 bg-emerald-50/80 rounded-xl text-sm font-extrabold text-emerald-900 cursor-not-allowed shadow-2xs"
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
                  <div className="space-y-4">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Sectoral Demographics</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs font-semibold">
                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer select-none">
                        <span className="text-xs font-bold text-gray-700">Solo Parent</span>
                        <input
                          type="checkbox"
                          checked={regSolo}
                          onChange={(e) => setRegSolo(e.target.checked)}
                          className="w-4 h-4 rounded-xs text-[#0A6B43] focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer select-none">
                        <span className="text-xs font-bold text-gray-700">PWD Member</span>
                        <input
                          type="checkbox"
                          checked={regPwd}
                          onChange={(e) => setRegPwd(e.target.checked)}
                          className="w-4 h-4 rounded-xs text-[#0A6B43] focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer select-none">
                        <span className="text-xs font-bold text-gray-700">Indigenous</span>
                        <input
                          type="checkbox"
                          checked={regIndigenous}
                          onChange={(e) => setRegIndigenous(e.target.checked)}
                          className="w-4 h-4 rounded-xs text-[#0A6B43] focus:ring-emerald-500"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-150 cursor-pointer select-none">
                        <span className="text-xs font-bold text-gray-700">None / General</span>
                        <input
                          type="checkbox"
                          checked={!regSolo && !regPwd && !regIndigenous}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRegSolo(false);
                              setRegPwd(false);
                              setRegIndigenous(false);
                            }
                          }}
                          className="w-4 h-4 rounded-xs text-[#0A6B43] focus:ring-emerald-500"
                        />
                      </label>
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
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.05] pb-1">Skills & Livelihood Goals</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-3">
                  Detail your skills and preferences to enable automated matching with active training centers.
                </p>
              </div>

              {/* Scrollable Form Fields ONLY */}
              <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 py-1">
                <div className="w-full max-w-xl mx-auto space-y-6">

                  {/* Preferred Vocational Sector */}
                  <div className="space-y-1.5 text-xs font-semibold">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center justify-between">
                      <span>Preferred Vocational Sector *</span>
                      <span className="text-[10px] text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded font-extrabold">Primary Field</span>
                    </label>
                    <select
                      value={regSector}
                      onChange={(e) => setRegSector(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                    >
                      <option value="Information & Communications Technology (ICT)">Information & Communications Technology (ICT)</option>
                      <option value="Agriculture, Forestry and Fishery">Agriculture, Forestry and Fishery</option>
                      <option value="Automotive and Land Transportation">Automotive and Land Transportation</option>
                      <option value="Construction">Construction</option>
                      <option value="Electrical and Electronics">Electrical and Electronics</option>
                      <option value="Heating, Ventilation, Airconditioning and Refrigeration (HVAC/R)">Heating, Ventilation, Airconditioning and Refrigeration (HVAC/R)</option>
                      <option value="Heavy Equipment Operation">Heavy Equipment Operation</option>
                      <option value="Metals and Engineering / Welding">Metals and Engineering / Welding</option>
                      <option value="Process Food and Beverages / Culinary">Process Food and Beverages / Culinary</option>
                      <option value="Tourism / Hotel and Restaurant Services">Tourism / Hotel and Restaurant Services</option>
                      <option value="Social, Community Development and other Services / Caregiving">Social, Community Development and other Services / Caregiving</option>
                      <option value="Human Health / Health Care">Human Health / Health Care</option>
                      <option value="Visual and Performing Arts / Creative">Visual and Performing Arts / Creative</option>
                      <option value="Garments and Textiles">Garments and Textiles</option>
                      <option value="Wholesale and Retail / Sales">Wholesale and Retail / Sales</option>
                      <option value="Logistics and Warehousing">Logistics and Warehousing</option>
                      <option value="Maritime">Maritime</option>
                      <option value="Utilities / Solar Power">Utilities / Solar Power</option>
                      <option value="Language and Culture">Language and Culture</option>
                      <option value="Entrepreneurship & Management">Entrepreneurship & Management</option>
                    </select>
                    <p className="text-[10px] text-gray-400 font-medium">Select your primary technical-vocational trade or industry interest for automated TESDA program matching.</p>
                  </div>

                  {/* 1. Skills (Multi-entry tags) */}
                  <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center justify-between">
                      <span>1. Technical & Practical Skills (Press Enter to Add)</span>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-extrabold">Skill Factor (50%)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="Type a skill (e.g. Computer, Programming, Welding, Cooking) and press Enter"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
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

                  {/* 2. Preferences (Multi-entry tags) */}
                  <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center justify-between">
                      <span>2. Interests & Vocational Preferences (Press Enter to Add)</span>
                      <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-extrabold">Preference Factor (25%)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={prefInput}
                        onChange={(e) => setPrefInput(e.target.value)}
                        onKeyDown={handleAddPreference}
                        placeholder="Type an interest/preference (e.g. Technology, Culinary, Electronics) and press Enter"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = prefInput.trim();
                          if (trimmed && !regPreferences.includes(trimmed)) {
                            setRegPreferences([...regPreferences, trimmed]);
                            setPrefInput("");
                          }
                        }}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2 min-h-[28px]">
                      {regPreferences.map((p) => (
                        <span key={p} className="bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                          {p}
                          <button type="button" onClick={() => handleRemovePreference(p)} className="hover:text-red-600 font-black p-0.5 text-xs cursor-pointer">
                            &times;
                          </button>
                        </span>
                      ))}
                      {regPreferences.length === 0 && (
                        <span className="text-gray-400 italic text-[11px]">No preferences added yet.</span>
                      )}
                    </div>
                  </div>

                  {/* 3. Experiences (Multi-entry tags) */}
                  <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center justify-between">
                      <span>3. Past Work / Practical Experiences (Press Enter to Add)</span>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-extrabold">Experience Factor (15%)</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={expInput}
                        onChange={(e) => setExpInput(e.target.value)}
                        onKeyDown={handleAddExperience}
                        placeholder="e.g. Computer Shop Helper, Worked in a bakery, Talyer assistant"
                        className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
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

                  {/* 4. Primary Livelihood / Career Goal */}
                  <div className="space-y-1.5 text-xs font-semibold pt-2 border-t border-gray-100">
                    <label className="text-sm font-black text-gray-800 uppercase tracking-wide flex items-center justify-between">
                      <span>4. Primary Career / Livelihood Goal *</span>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-extrabold">Goal Factor (10%)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={regGoal}
                      onChange={(e) => setRegGoal(e.target.value)}
                      placeholder="e.g. I want to become an IT professional / Set up a welding shop"
                      className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
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
                <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.05] pb-1">Official KK Member Verification</h2>
                <p className="text-xs text-gray-500 max-w-md mx-auto pt-0.5 pb-3">
                  Provide proof of identity to authorize your profile for official training referrals.
                </p>
              </div>

              {/* Scrollable Form Fields ONLY */}
              <div ref={stepContentRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2 py-1">
                <div className="w-full max-w-xl mx-auto space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                      <div className="space-y-1">
                        <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">Verification ID Type *</label>
                        <select
                          value={regIdType}
                          onChange={(e) => setRegIdType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        >
                          <option value="National ID">National ID (PhilSys)</option>
                          <option value="Student ID / Enrollment Receipt">Student ID / Enrollment Receipt</option>
                          <option value="SK Member Card">Sangguniang Kabataan Member Card</option>
                          <option value="Barangay Clearance">Barangay Clearance</option>
                          <option value="Voter's ID or Stub">Voter's ID or Registration Stub</option>
                          <option value="Birth Certificate">PSA Birth Certificate</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">ID Number / Reference Number *</label>
                        <input
                          type="text"
                          required
                          value={regIdNumber}
                          onChange={(e) => setRegIdNumber(e.target.value)}
                          placeholder="e.g. LRN, ID No., or Barcode Reference"
                          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden transition-all placeholder:text-gray-400 font-medium text-gray-900 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Drag and Drop Upload Zone */}
                    <div className="space-y-1.5 text-xs font-semibold">
                      <label className="text-sm font-black text-gray-800 uppercase tracking-wide block">
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
                    <div className="space-y-2.5 bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 text-xs font-semibold">
                      <h4 className="text-[10px] font-extrabold text-[#0a6b43] uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Statutory KK Membership Requirements
                      </h4>

                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            required
                            checked={certifyAge}
                            onChange={(e) => setCertifyAge(e.target.checked)}
                            className="w-4 h-4 rounded-xs text-emerald-600 focus:ring-emerald-500 mt-0.5"
                          />
                          <span className="text-xs font-semibold text-gray-700 leading-normal">
                            I certify that I am between <strong>15 and 30 years old</strong>, fitting the legal age bracket for Sangguniang Kabataan membership under RA 10742.
                          </span>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            required
                            checked={certifyResidency}
                            onChange={(e) => setCertifyResidency(e.target.checked)}
                            className="w-4 h-4 rounded-xs text-emerald-600 focus:ring-emerald-500 mt-0.5"
                          />
                          <span className="text-xs font-semibold text-gray-700 leading-normal">
                            I certify that I am an official resident of <strong>{selectedBarangay || "my selected barangay"}</strong>, San Luis, Pampanga.
                          </span>
                        </label>
                      </div>

                      {(!certifyAge || !certifyResidency) && (
                        <p className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-1 bg-amber-50 border border-amber-100 p-1.5 rounded">
                          <span>⚠</span> Both checkboxes are required to complete self-registration.
                        </p>
                      )}
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
        </div>

        {/* Unified Sticky Footer Buttons */}
        {currentStep < 5 && (
          <div className={`flex items-center pt-3 border-t border-gray-200 mt-2 shrink-0 w-full max-w-xl mx-auto ${currentStep === 0 ? "justify-end" : "justify-between"}`}>
            {/* Consistent Back Button with Left Arrow Icon (hidden on Step 1 / Location) */}
            {currentStep !== 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-5 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer hover:border-gray-300"
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
                className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(currentStep)
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
                className={`px-6 py-2.5 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${isStepValid(4) && !isRegistering
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

