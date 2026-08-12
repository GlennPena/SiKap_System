"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, MapPin, Check, Sparkles, Clock, CheckCircle, 
  User, Mail, Phone, Calendar, Award, GraduationCap, Plus, X,
  Upload, ShieldAlert, FileDigit, FileCheck, ChevronRight
} from "lucide-react";
import { YouthProfile, UserRole } from "../types";
import { SikapLogo } from "./ReusableComponents";

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
  const [regAge, setRegAge] = useState<number>(20);
  const [regDOB, setRegDOB] = useState("2006-05-15");
  const [regContact, setRegContact] = useState("+63 9");
  const [regPurok, setRegPurok] = useState("Purok 2");
  
  const [regEdu, setRegEdu] = useState("College level");
  const [regStatus, setRegStatus] = useState("Out-of-school");
  
  const [skillInput, setSkillInput] = useState("");
  const [regSkills, setRegSkills] = useState<string[]>(["Basic computing"]);
  const [regSector, setRegSector] = useState("IT & Technology");
  const [regGoal, setRegGoal] = useState("");
  
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

  const STEPS = [
    { label: "Location", desc: "Barangay Select", icon: <MapPin className="w-4 h-4" /> },
    { label: "Personal", desc: "Contact & Info", icon: <User className="w-4 h-4" /> },
    { label: "Background", desc: "Edu & Demographics", icon: <GraduationCap className="w-4 h-4" /> },
    { label: "Interests", desc: "Skills & Goals", icon: <Award className="w-4 h-4" /> },
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regGoal.trim() || !regContact.trim() || !selectedBarangay) {
      return;
    }

    if (!certifyAge || !certifyResidency) {
      return;
    }

    const generatedIdImage = regIdImage || `https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&q=80&w=600`;

    const newId = `y-self-${Date.now()}`;
    const newProfile: YouthProfile = {
      id: newId,
      name: regName,
      age: regAge,
      purok: regPurok,
      barangay: selectedBarangay,
      educationalAttainment: regEdu,
      currentStatus: regStatus,
      skills: regSkills.length > 0 ? regSkills : ["Communication skills"],
      interests: [regSector, "Vocational Training"],
      sectorPreference: regSector,
      livelihoodGoal: regGoal,
      contactNumber: regContact,
      registeredDate: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
      matchScore: Math.floor(Math.random() * 20) + 75,
      soloParent: regSolo,
      pwd: regPwd,
      indigenous: regIndigenous,
      hasReferred: false,
      approvalStatus: "Pending",
      verificationIdType: regIdType,
      verificationIdNumber: regIdNumber || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      verificationIdImage: generatedIdImage
    };

    onRegisterComplete(newProfile);
    setCurrentStep(5); // Go to "Pending Approval" screen
  };

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 0:
        return !!selectedBarangay;
      case 1:
        return !!regName.trim() && !!regContact.trim() && regAge >= 15 && regAge <= 30;
      case 2:
        return true; // Dropdowns and checkboxes have default values
      case 3:
        return !!regGoal.trim();
      case 4:
        return !!regIdNumber.trim() && !!regIdFileName && certifyAge && certifyResidency;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-between" id="kk-youth-self-registration-flow">
      <div className="max-w-2xl mx-auto w-full">
        {/* Logo and Header */}
        {currentStep < 5 && (
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-150" id="kk-reg-header">
            <div className="flex items-center gap-2">
              <SikapLogo size={32} showText={true} />
              <span className="text-xs font-black text-[#0A6B43] uppercase tracking-widest border-l border-gray-200 pl-2">OSY Registration</span>
            </div>
            <button
              onClick={onBackToHome}
              className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </button>
          </div>
        )}

        {/* Stepper Progress */}
        {currentStep < 5 && (
          <div className="mb-8 bg-white border border-gray-150 p-4 rounded-2xl shadow-xs" id="kk-reg-stepper">
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
            <div className="hidden md:flex items-center justify-between relative px-2">
              {STEPS.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isActive = idx === currentStep;
                return (
                  <React.Fragment key={idx}>
                    {/* Step Node */}
                    <div className="flex flex-col items-center flex-1 relative z-10">
                      <button
                        type="button"
                        disabled={idx > currentStep && !isStepValid(currentStep)}
                        onClick={() => idx <= currentStep && setCurrentStep(idx)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 focus:outline-hidden ${
                          isCompleted
                            ? "bg-[#0A6B43] border-[#0A6B43] text-white cursor-pointer"
                            : isActive
                            ? "bg-white border-[#0A6B43] text-[#0A6B43] ring-4 ring-emerald-50 cursor-default"
                            : "bg-white border-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                      </button>
                      <span className={`text-[11px] font-bold mt-2 transition-colors ${
                        isActive ? "text-[#0A6B43]" : isCompleted ? "text-gray-700" : "text-gray-400"
                      }`}>
                        {step.label}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">
                        {step.desc}
                      </span>
                    </div>

                    {/* Connector Line */}
                    {idx < STEPS.length - 1 && (
                      <div className="flex-1 h-0.5 bg-gray-150 relative -mt-5">
                        <div 
                          className="bg-[#0A6B43] h-full transition-all duration-300"
                          style={{ width: idx < currentStep ? "100%" : "0%" }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 0: Barangay Selection */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-250" id="step-location-select">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                Location Selection
              </span>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Which barangay are you from?</h2>
              <p className="text-xs text-gray-500 font-medium max-w-md mx-auto">
                Please select your official residential barangay in San Luis, Pampanga. This will route your application to the correct SK Chairperson for swift validation.
              </p>
            </div>

            {/* 2x4 Barangay Card Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
              {BARANGAYS.map((brgy) => {
                const isSelected = selectedBarangay === brgy;
                return (
                  <button
                    key={brgy}
                    type="button"
                    onClick={() => setSelectedBarangay(brgy)}
                    className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex items-center justify-between ${
                      isSelected
                        ? "border-[#0A6B43] bg-emerald-50/30 ring-1 ring-[#0A6B43]/50"
                        : "border-gray-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#0A6B43] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-emerald-100/30 group-hover:text-emerald-700"
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

            <div className="flex justify-center pt-4 border-t border-gray-100">
              <button
                type="button"
                disabled={!selectedBarangay}
                onClick={() => setCurrentStep(1)}
                className={`px-8 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
                  selectedBarangay
                    ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Continue to Personal Info
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Personal Info Form */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-personal-info">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                Personal Profile Details
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Tell us about yourself</h2>
              <p className="text-xs text-gray-500 font-semibold flex items-center justify-center gap-1">
                Barangay: <span className="text-emerald-700 font-extrabold flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {selectedBarangay}</span>
              </p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Juan dela Cruz"
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase block">Age * (15-30)</label>
                    <input
                      type="number"
                      required
                      min={15}
                      max={30}
                      value={regAge}
                      onChange={(e) => setRegAge(Number(e.target.value))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase block">Purok Sector *</label>
                    <select
                      value={regPurok}
                      onChange={(e) => setRegPurok(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="Purok 1">Purok 1</option>
                      <option value="Purok 2">Purok 2</option>
                      <option value="Purok 3">Purok 3</option>
                      <option value="Purok 4">Purok 4</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">Date of Birth</label>
                  <input
                    type="date"
                    value={regDOB}
                    onChange={(e) => setRegDOB(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden text-gray-600 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    placeholder="+63 9xx xxx xxxx"
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Back to Location
                </button>
                <button
                  type="button"
                  disabled={!isStepValid(1)}
                  onClick={() => setCurrentStep(2)}
                  className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                    isStepValid(1)
                      ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Education & Demographics */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-education-demographics">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                Education & Background
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Educational Attainment & Status</h2>
              <p className="text-xs text-gray-500 font-semibold max-w-md mx-auto">
                Providing this details helps map qualifying parameters for local scholarship priorities.
              </p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">Highest Educational Attainment</label>
                  <select
                    value={regEdu}
                    onChange={(e) => setRegEdu(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="College level">College level</option>
                    <option value="SHS graduate">SHS graduate</option>
                    <option value="HS graduate">HS graduate</option>
                    <option value="Elementary level">Elementary level</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#0A6B43] uppercase block flex items-center justify-between">
                    <span>Youth Status</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black">OSY System Priority</span>
                  </label>
                  <select
                    value={regStatus}
                    onChange={(e) => setRegStatus(e.target.value)}
                    className="w-full p-2.5 border border-emerald-300 bg-emerald-50/30 rounded-lg text-xs font-bold text-gray-800 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Out-of-school">Out-of-school Youth (OSY)</option>
                    <option value="Employed">Employed</option>
                    <option value="Self-employed">Self-employed</option>
                  </select>
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
                <label className="text-[11px] font-bold text-gray-400 uppercase block">Sectoral Demographics</label>
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

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Skills & Livelihood Goals */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-skills-goals">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                Interests & Skills Mapping
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Skills & Livelihood Interest</h2>
              <p className="text-xs text-gray-500 font-semibold max-w-md mx-auto">
                Detail your tech preference to enable high-quality automated matching with active training centers.
              </p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
              {/* Skill input */}
              <div className="space-y-1.5 text-xs font-semibold">
                <label className="text-[11px] font-bold text-gray-400 uppercase block">
                  Add Your Technical Skills (Press Enter to Add)
                </label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Type a skill (e.g. Cooking, Wiring, Photoshop) and press Enter"
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {regSkills.map((s) => (
                    <span key={s} className="bg-emerald-50 text-[#0A6B43] border border-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => handleRemoveSkill(s)} className="hover:text-red-600 p-0.5">
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Livelihood Preference & Goals */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold">
                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">Preferred Sector</label>
                  <select
                    value={regSector}
                    onChange={(e) => setRegSector(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="IT & Technology">IT & Technology</option>
                    <option value="Tourism & Food">Tourism & Food</option>
                    <option value="Construction & Metals">Construction & Metals</option>
                    <option value="Electrical & Electronics">Electrical & Electronics</option>
                    <option value="Tourism & Hospitality">Tourism & Hospitality</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">What is your primary livelihood milestone or goal? *</label>
                  <input
                    type="text"
                    required
                    value={regGoal}
                    onChange={(e) => setRegGoal(e.target.value)}
                    placeholder="e.g. Set up computer repair shop, enroll in Welding NC II"
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!isStepValid(3)}
                  onClick={() => setCurrentStep(4)}
                  className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                    isStepValid(3)
                      ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Verification & Declaration */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200" id="step-verification-declaration">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                Identity Verification
              </span>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Official KK Member Verification</h2>
              <p className="text-xs text-gray-500 font-semibold max-w-md mx-auto">
                Provide proof of identity to authorize your profile for official training referrals.
              </p>
            </div>

            <div className="bg-white border border-gray-150 rounded-2xl shadow-xs p-6 md:p-8 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 uppercase block">Verification ID Type *</label>
                    <select
                      value={regIdType}
                      onChange={(e) => setRegIdType(e.target.value)}
                      className="w-full p-2.5 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
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
                    <label className="text-[11px] font-bold text-gray-400 uppercase block">ID Number / Reference Number *</label>
                    <input
                      type="text"
                      required
                      value={regIdNumber}
                      onChange={(e) => setRegIdNumber(e.target.value)}
                      placeholder="e.g. LRN, ID No., or Barcode Reference"
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Drag and Drop Upload Zone */}
                <div className="space-y-1.5 text-xs font-semibold">
                  <label className="text-[11px] font-bold text-gray-400 uppercase block">
                    Upload Proof of ID / Document Image *
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                      isDragging
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

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!isStepValid(4)}
                    className={`px-5 py-2.5 text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
                      isStepValid(4)
                        ? "bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    Submit Profiling
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Step 5: Pending Approval Screen */}
        {currentStep === 5 && (
          <div className="space-y-6 max-w-lg mx-auto text-center py-8 px-6 bg-amber-50 border border-amber-200 rounded-3xl shadow-sm animate-in zoom-in-95 duration-200" id="step-pending-approval">
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
        )}
      </div>

      {/* Footer copyright */}
      {currentStep < 5 && (
        <div className="text-center text-[10px] text-gray-400 mt-12" id="kk-reg-footer">
          <p>© 2026 Sangguniang Kabataan Federation of San Luis, Pampanga.</p>
        </div>
      )}
    </div>
  );
};
