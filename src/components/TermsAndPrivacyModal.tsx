"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, Lock, X, Check } from "lucide-react";

interface TermsAndPrivacyModalProps {
  isOpen: boolean;
  initialTab?: "terms" | "privacy";
  onClose: () => void;
  municipality?: string;
}

export const TermsAndPrivacyModal: React.FC<TermsAndPrivacyModalProps> = ({
  isOpen,
  initialTab = "privacy",
  onClose,
  municipality = "San Luis, Pampanga",
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200"
    >
      <div
        className="bg-white border border-gray-200/90 rounded-2xl sm:rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-in fade-in zoom-in-95 duration-200 ease-out relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header Banner */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#0A6B43] to-[#042f2e] text-white p-5 sm:p-6 shrink-0 shadow-xs relative">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center shrink-0 shadow-xs backdrop-blur-xs">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-200" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 bg-emerald-400/20 px-2 py-0.5 rounded-md border border-emerald-300/30">
                    Official Policy
                  </span>
                  <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-emerald-100 truncate">
                    {municipality}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5 truncate leading-tight drop-shadow-xs">
                  SiKap Legal & Privacy Statements
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "privacy"
                  ? "bg-white text-[#0A6B43] shadow-xs font-black"
                  : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "terms"
                  ? "bg-white text-[#0A6B43] shadow-xs font-black"
                  : "bg-white/10 text-emerald-100 hover:bg-white/20 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Terms & Conditions</span>
            </button>
          </div>
        </div>

        {/* Scrollable Policy Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 text-gray-700 space-y-5 text-xs sm:text-sm leading-relaxed">
          {activeTab === "privacy" ? (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Republic Act No. 10173 • Data Privacy Act of 2012
                </span>
                <h4 className="text-base sm:text-lg font-black text-gray-900 mt-1.5">
                  SiKap Privacy Policy
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  Municipality of {municipality} — Youth Development & TVET Alignment Platform
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    1. Statement of Policy
                  </h5>
                  <p>
                    The Municipal Government of {municipality}, in partnership with the Sangguniang Kabataan (SK) and TESDA, is committed to safeguarding personal information in strict adherence to Republic Act No. 10173 (Data Privacy Act of 2012), its Implementing Rules and Regulations, and National Privacy Commission (NPC) circulars.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    2. Information Collected
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                    <li><strong className="text-gray-800">Personal Identity:</strong> Full legal name, birthdate, age, gender/sex, civil status, and residential purok/barangay in {municipality}.</li>
                    <li><strong className="text-gray-800">Contact Details:</strong> Verified email address and active mobile contact number.</li>
                    <li><strong className="text-gray-800">Socio-Demographic & Livelihood Profile:</strong> Educational attainment, current status (In-School, Out-of-School Youth / OSY, Working, or Unemployed), special sector classifications (Solo Parent, PWD, Indigenous Peoples), hobbies, skills, and vocational aspirations.</li>
                    <li><strong className="text-gray-800">Validation Documents:</strong> Official identification documents uploaded for identity verification.</li>
                    <li><strong className="text-gray-800">Training Telemetry:</strong> Course enrollments, attendance records, competency certifications, and referral progress with partner training institutions.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    3. Purpose & Legal Basis of Processing
                  </h5>
                  <p className="mb-1.5">
                    Data collection is conducted under explicit user consent and mandated public governance under the SK Reform Act (RA 10742, as amended by RA 11768) for the following lawful objectives:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                    <li>Maintaining the official Katipunan ng Kabataan directory across all 17 barangays of San Luis;</li>
                    <li>Algorithmic matching of youth skills and aspirations with accredited TESDA technical-vocational courses;</li>
                    <li>Facilitating official training enrollments, scholarship recommendations, and municipal job referral endorsements;</li>
                    <li>Generating anonymized municipal youth development statistics and local governance planning reports;</li>
                    <li>Notifying registered users of community development programs, enrollment openings, and disaster relief operations.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    4. Data Sharing & Disclosure
                  </h5>
                  <p>
                    SiKap does not commercialize or sell personal information. Information is shared strictly with authorized personnel, including local SK Council officers for demographic verification, accredited TESDA training centers for official course enrollment, and authorized municipal oversight bodies.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    5. AI-Assisted Recommendation Notice
                  </h5>
                  <p>
                    SiKap uses Content-Based Filtering and Google Gemini AI assistance to evaluate vocational interests and suggest personalized learning pathways. AI outputs provide advisory guidance and do not restrict youth from exploring alternative programs.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    6. Information Security & Retention
                  </h5>
                  <p>
                    Industry-standard security protocols, including HTTPS transmission encryption, bcrypt password hashing, session tokens, and role-based access controls, are implemented. Records are maintained for active youth members (ages 18–30) and securely archived or anonymized upon age completion or relocation.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    7. Your Rights as a Data Subject
                  </h5>
                  <p>
                    Under RA 10173, you retain the right to access your profile, request corrections, request erasure/blocking, and file formal inquiries. For assistance, contact the Municipal Administrator or the Sangguniang Kabataan Office at <span className="font-bold text-[#0A6B43]">sikap.system@gmail.com</span>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Municipal Youth Governance
                </span>
                <h4 className="text-base sm:text-lg font-black text-gray-900 mt-1.5">
                  SiKap Terms & Conditions
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  Terms of Service & Code of Conduct — {municipality}
                </p>
              </div>

              <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-gray-700">
                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    1. Acceptance of Terms
                  </h5>
                  <p>
                    By accessing the SiKap portal, registering an account, or participating in municipal training programs, you agree to comply with these Terms & Conditions, the SK Reform Act of 2015 (RA 10742 / RA 11768), and local municipal ordinances of {municipality}.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    2. User Eligibility & Accounts
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-gray-600">
                    <li><strong className="text-gray-800">Age & Residency:</strong> Youth membership is intended for Filipino citizens residing within the 17 barangays of San Luis aged 18 to 30.</li>
                    <li><strong className="text-gray-800">Accurate Information:</strong> Users must provide truthful demographic, educational, and contact records. Falsification of documents may result in account termination.</li>
                    <li><strong className="text-gray-800">Single Account:</strong> Each eligible youth is entitled to one validated SiKap identity. Impersonation is strictly prohibited.</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    3. Training Programs & Endorsements
                  </h5>
                  <p>
                    SiKap provides matching recommendations and digital application endorsements to accredited TESDA partner institutions. Acceptance into training programs is governed by course prerequisites, slot availability, and partner center screening guidelines. Enrolled students are expected to complete their enrolled courses diligently.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    4. Acceptable Platform Use
                  </h5>
                  <p>
                    Users must use SiKap exclusively for lawful educational, vocational, and civic development purposes. Any attempts to disrupt system infrastructure, harvest unauthorized records, or bypass access controls will lead to administrative sanctions and potential legal referral.
                  </p>
                </div>

                <div>
                  <h5 className="font-black text-xs sm:text-sm uppercase tracking-wide text-[#0A6B43] mb-1">
                    5. Modifications & Updates
                  </h5>
                  <p>
                    The Municipal Administration and the SK Federation of {municipality} reserve the right to revise these Terms to align with updated national policies or technical upgrades. Continued portal usage implies acceptance of revised guidelines.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 sm:p-5 bg-gray-50/90 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-gray-500 font-medium text-center sm:text-left">
            SiKap Youth Development Portal • {municipality}
          </p>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
