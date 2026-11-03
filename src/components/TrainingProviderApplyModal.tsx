"use client";

import React, { useState } from "react";
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
  FileText,
  Sparkles,
  MapPin,
  Award,
  Check,
  ZoomIn
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import { CustomSelect } from "./CustomSelect";

interface TrainingProviderApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

const PROVIDER_TYPE_OPTIONS = [
  { value: "Public TESDA Institute", label: "Public TESDA Technology Institution (TTI)" },
  { value: "Private TVET Institute", label: "Private Technical-Vocational Institute (TVI)" },
  { value: "LGU Training Center", label: "LGU / Community Skills Training Center" },
  { value: "HEI / SUC", label: "Higher Education Institution (HEI / College)" },
  { value: "NGO Foundation", label: "Non-Government / Livelihood Foundation" },
];

export const TrainingProviderApplyModal: React.FC<TrainingProviderApplyModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Institution Details
  const [institutionName, setInstitutionName] = useState("");
  const [providerType, setProviderType] = useState("Private TVET Institute");
  const [campusAddress, setCampusAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  // Step 2: Liaison Officer & Account
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

  if (!isOpen) return null;

  // File Upload Handler (with compression & base64 encoding)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("The uploaded file exceeds the 8MB size limit. Please upload a smaller file.");
      return;
    }

    setErrorMessage("");
    setIsUploadingFile(true);
    setCptrFileName(file.name);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      if (isPdf) {
        setCptrDocument(dataUrl);
        setIsUploadingFile(false);
      } else {
        // Compress image using canvas
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

  // Step Validations
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
      setErrorMessage("Please provide the authorized representative or registrar's full name.");
      return false;
    }
    if (!representativePosition.trim()) {
      setErrorMessage("Please provide the official position/designation.");
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
      setErrorMessage("Please enter your official Certificate of TVET Program Registration (CPTR) number.");
      return false;
    }
    if (!cptrDocument) {
      setErrorMessage("Please upload an image or PDF copy of your CPTR certificate for verification.");
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

  const handleSubmitApplication = async () => {
    if (!termsAccepted) {
      setErrorMessage("Please read and accept the partnership agreement to proceed.");
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
        cptrDocument,
      };

      const res = await fetch("/api/provider-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.message || "Failed to submit application. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmittedSuccess(true);
      if (onSuccessToast) {
        onSuccessToast("Application submitted successfully for SK President verification!");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage("A network error occurred while submitting your application. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#083321] via-[#0A6B43] to-[#125838] p-5 sm:p-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                  TVET Partner Accreditation
                </span>
                <span className="text-[10px] font-bold text-emerald-200">
                  Accredited TVET Institutions
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5 tracking-tight">
                Apply as a Training Provider
              </h2>
            </div>
          </div>

          {/* Stepper Bar */}
          {!isSubmittedSuccess && (
            <div className="grid grid-cols-4 gap-2 pt-5 border-t border-white/15 mt-4">
              {[
                { step: 1, label: "Institution" },
                { step: 2, label: "Representative" },
                { step: 3, label: "CPTR Certificate" },
                { step: 4, label: "Review & Submit" },
              ].map((s) => (
                <div key={s.step} className="flex flex-col items-center text-center">
                  <div
                    className={`w-7 h-7 rounded-full text-xs font-black flex items-center justify-center transition-all ${
                      currentStep === s.step
                        ? "bg-amber-400 text-slate-950 ring-2 ring-amber-300/60"
                        : currentStep > s.step
                        ? "bg-emerald-400 text-slate-950"
                        : "bg-white/20 text-white/70"
                    }`}
                  >
                    {currentStep > s.step ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
                  </div>
                  <span className="text-[10px] font-bold mt-1 text-emerald-100 hidden sm:block truncate w-full">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-7 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span className="font-semibold leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {isSubmittedSuccess ? (
            /* SUCCESS CONFIRMATION SCREEN */
            <div className="py-6 sm:py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-4 border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#0A6B43]">
                  Application Received
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                  Application Submitted for Verification!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                  Thank you! Your institutional registration for <strong className="text-gray-900 font-bold">{institutionName}</strong> and CPTR accreditation certificate (No. <span className="font-mono font-bold text-[#0A6B43]">{cptrNumber}</span>) have been queued for verification.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left max-w-md mx-auto text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Next Step: SK President Review</span>
                </div>
                <p className="text-amber-800 leading-relaxed font-medium text-[11px]">
                  The SK President of San Luis will inspect your CPTR credentials. Once verified, your account will be activated, and you can log in at any time to post and manage your vocational courses for Katipunan ng Kabataan youth.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: INSTITUTIONAL DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#0A6B43]" />
                      <span>Step 1: Institutional Profile</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Enter the registered technical-vocational school, training center, or college details.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Institution / Training Center Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Megatech Vocational Institute, Don Bosco TVET Center"
                        value={institutionName}
                        onChange={(e) => setInstitutionName(e.target.value)}
                        className="w-full h-10 px-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Provider Classification <span className="text-red-500">*</span>
                      </label>
                      <CustomSelect
                        value={providerType}
                        onChange={(val) => setProviderType(val)}
                        options={PROVIDER_TYPE_OPTIONS}
                        size="sm"
                        buttonClassName="h-10 !text-xs !rounded-xl font-medium bg-gray-50/80"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Main Campus / Training Venue Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          placeholder="e.g. MacArthur Highway, Brgy. San Nicolas, City of San Fernando, Pampanga"
                          value={campusAddress}
                          onChange={(e) => setCampusAddress(e.target.value)}
                          className="w-full h-10 pl-9 pr-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Official Landline or Mobile Contact <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          placeholder="e.g. +63 919 123 4567 or (045) 961-0000"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full h-10 pl-9 pr-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: REPRESENTATIVE & ACCOUNT */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#0A6B43]" />
                      <span>Step 2: Authorized Liaison & Login Credentials</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Provide the registrar or coordinator details who will manage this account.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Authorized Representative Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Evelyn M. Castor"
                          value={representativeName}
                          onChange={(e) => setRepresentativeName(e.target.value)}
                          className="w-full h-10 px-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Position / Designation <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. School Registrar, Training Director"
                          value={representativePosition}
                          onChange={(e) => setRepresentativePosition(e.target.value)}
                          className="w-full h-10 px-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Official Login Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          placeholder="e.g. registrar@megatech.edu.ph"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-10 pl-9 pr-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium mt-1 block">
                        This email will be used to log in to the Training Partner Portal.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Create Account Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-10 pl-9 pr-10 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
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

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                          <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Repeat password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-10 pl-9 pr-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CPTR ACCREDITATION & UPLOAD */}
              {currentStep === 3 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>Step 3: CPTR Accreditation & Document Upload</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Provide your official Certificate of TVET Program Registration (CPTR) issued by TESDA.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        CPTR / Program Registration Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. WTR-2024-03-01928 or CPTR-R03-PAM-2024"
                        value={cptrNumber}
                        onChange={(e) => setCptrNumber(e.target.value.toUpperCase())}
                        className="w-full h-10 px-3.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:border-emerald-500 focus:outline-none transition-colors uppercase tracking-wider"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">
                        Upload Certificate of TVET Program Registration (CPTR) <span className="text-red-500">*</span>
                      </label>

                      {!cptrDocument ? (
                        <label className="border-2 border-dashed border-gray-300 hover:border-[#0A6B43] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 bg-gray-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,application/pdf"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 group-hover:border-emerald-300 flex items-center justify-center text-gray-400 group-hover:text-[#0A6B43] shadow-xs transition-colors">
                            {isUploadingFile ? (
                              <RefreshCw className="w-5 h-5 animate-spin text-[#0A6B43]" />
                            ) : (
                              <Upload className="w-5 h-5" />
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-[#0A6B43] text-center">
                            Click to upload CPTR Document (JPG, PNG, PDF)
                          </span>
                          <span className="text-[10px] text-gray-400 text-center font-medium">
                            Max file size: 8MB. Ensure the official seal and program registration code are clearly visible.
                          </span>
                        </label>
                      ) : (
                        <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-gray-900 block truncate">
                                {cptrFileName || "CPTR_Certificate_Document"}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-700 block">
                                Ready for SK President Verification ✓
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
                    <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      <span>Step 4: Final Review & Partnership Undertaking</span>
                    </h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Please confirm your submitted details before forwarding to the SK President.
                    </p>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-gray-50/90 rounded-2xl border border-gray-200/80 p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-gray-200/70">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Institution
                        </span>
                        <span className="font-extrabold text-gray-900 block text-[13px]">{institutionName}</span>
                        <span className="text-[11px] text-gray-500">{providerType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Campus Location
                        </span>
                        <span className="font-bold text-gray-800 block text-xs">{campusAddress}</span>
                        <span className="text-[11px] text-gray-500">{contactNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Authorized Liaison
                        </span>
                        <span className="font-bold text-gray-900 block text-xs">{representativeName}</span>
                        <span className="text-[11px] text-gray-600">{representativePosition}</span>
                        <span className="text-[11px] font-mono text-[#0A6B43] block mt-0.5">{email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          CPTR Accreditation
                        </span>
                        <span className="font-mono font-black text-emerald-800 text-xs block">
                          {cptrNumber}
                        </span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{cptrFileName || "Certificate attached"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Undertaking */}
                  <label className="p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 flex items-start gap-3 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#0A6B43] focus:ring-[#0A6B43]"
                    />
                    <div className="text-[11px] text-gray-700 leading-relaxed font-medium">
                      <strong className="text-gray-900 font-bold block mb-0.5">
                        Partnership Undertaking & Compliance Commitment
                      </strong>
                      I hereby certify that all information supplied is truthful and that our training institution is officially authorized under TESDA regulations with active Certificate of TVET Program Registration (CPTR). We commit to admitting qualified Katipunan ng Kabataan youth, maintaining safe facilities, and issuing valid certificates upon graduation.
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Navigation */}
        {!isSubmittedSuccess && (
          <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3 shrink-0">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-200/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={isSubmitting || !termsAccepted}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer ml-auto disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Submitting Application...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Submit for SK President Verification</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* CPTR Zoom Modal */}
      {showCptrZoomModal && cptrDocument && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3 bg-black/60 text-white flex items-center justify-between text-xs px-4">
              <span className="font-mono font-bold">CPTR Certificate Preview - {cptrNumber}</span>
              <button
                type="button"
                onClick={() => setShowCptrZoomModal(false)}
                className="text-gray-300 hover:text-white p-1 rounded-md"
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

