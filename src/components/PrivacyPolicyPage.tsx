"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronUp } from "lucide-react";
import { SikapLogo } from "./ReusableComponents";

interface PrivacyPolicyPageProps {
  onBack?: () => void;
  onNavigate?: (tab: "terms" | "privacy" | "login" | "register") => void;
  backLabel?: string;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onBack, onNavigate, backLabel }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });

    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setShowScrollTop(scrollY > 150);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll, { capture: true } as any);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.documentElement.scrollTo({ top: 0, behavior: "smooth" });
    document.body.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-gray-800 w-full flex flex-col font-sans antialiased">
      {/* Header Navbar: White background matching landing page */}
      <header className="relative w-full z-40 bg-white border-b border-emerald-100/80 shadow-2xs transition-all duration-200">
        <div className="max-w-[1500px] mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Logo & Brand ID */}
            <div className="flex items-center select-none shrink-0 cursor-default">
              <div className="sm:hidden flex items-center">
                <SikapLogo
                  size={34}
                  logoSize={34}
                  textSize={28}
                  showText={true}
                  showSubtext={false}
                  gap="gap-1"
                  textClassName="translate-y-[0.5px]"
                  disableHover={true}
                />
              </div>
              <div className="hidden sm:flex items-center">
                <SikapLogo
                  size={58}
                  logoSize={58}
                  textSize={42}
                  showText={true}
                  showSubtext={false}
                  gap="gap-1"
                  textClassName="translate-y-[1.5px]"
                  disableHover={true}
                />
              </div>
            </div>

            {/* Right Action / Continue Button (similar format and design to Sign In button) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={handleBack}
                className="bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-base font-bold sm:font-extrabold px-3.5 sm:px-6 lg:px-7 py-2 sm:py-2.5 lg:py-3 rounded-xl shadow-xs sm:shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-1.5 sm:gap-2.5 group cursor-pointer shrink-0"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200 group-hover:translate-x-1.5 transition-transform duration-200 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content: Green header, thin gray line, ~20% horizontal padding/margin on desktop */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-8 md:px-[12%] lg:px-[20%] py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0A6B43] tracking-tight mb-4">
          Privacy Policy
        </h1>
        <hr className="border-t border-gray-200 mb-8" />

        <div className="space-y-8 text-gray-700 text-sm sm:text-base leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              1. Statement of Policy
            </h2>
            <p>
              The Municipal Government of San Luis, Pampanga, in partnership with the Sangguniang Kabataan (SK) and TESDA, is committed to safeguarding personal information in strict adherence to Republic Act No. 10173 (Data Privacy Act of 2012), its Implementing Rules and Regulations, and National Privacy Commission (NPC) issuances. This Privacy Policy details our practices concerning the collection, use, protection, and disclosure of personal data collected through the SiKap platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              2. Information We Collect
            </h2>
            <p>
              We collect only the personal information necessary to facilitate Katipunan ng Kabataan demographic profiling and technical-vocational program endorsements:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong>Personal Identity:</strong> Full legal name, date of birth, age, gender/sex, civil status, and residential address/purok within the 17 barangays of San Luis, Pampanga.
              </li>
              <li>
                <strong>Contact Information:</strong> Verified personal email address and 11-digit mobile contact number.
              </li>
              <li>
                <strong>Socio-Demographic Profile:</strong> Educational attainment, current youth classification (In-School Youth, Out-of-School Youth / OSY, Working Youth, Unemployed), special sector designations, hobbies, and career interests.
              </li>
              <li>
                <strong>Verification Artifacts:</strong> Identification document type, ID number, and digital image file upload for official identity validation.
              </li>
              <li>
                <strong>Program Data:</strong> Enrolled TESDA courses, training attendance, completion records, certificates attained, and referral history.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              3. Purpose &amp; Legal Basis of Processing
            </h2>
            <p>
              Your personal data is processed under the lawful bases of Explicit Consent (Sections 12.a and 13.a of RA 10173) and the statutory performance of a mandated public task under RA 10742 (Sangguniang Kabataan Reform Act of 2015):
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Compiling and maintaining the official directory of Katipunan ng Kabataan members across all 17 barangays of San Luis;</li>
              <li>Verifying youth age eligibility (18–30) and local barangay residency requirements;</li>
              <li>Matching youth profiles with accredited TESDA technical-vocational courses;</li>
              <li>Facilitating official municipal training endorsements and class enrollments;</li>
              <li>Generating anonymized statistical reports for youth development planning and local governance; and</li>
              <li>Disseminating community announcements, youth training caravans, and disaster relief notices.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              4. Data Sharing &amp; Disclosure
            </h2>
            <p>
              SiKap strictly does not sell, rent, monetize, or disclose your personal data to commercial advertisers. Information is shared strictly with authorized personnel:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong>Local SK Chairpersons &amp; Council Officers:</strong> Authorized solely to verify member credentials and manage barangay training allocations.
              </li>
              <li>
                <strong>Accredited TESDA Partner Centers:</strong> Provided candidate contact details and educational background solely to facilitate class admission and assessment certification.
              </li>
              <li>
                <strong>National Oversight Bodies (NYC, DILG):</strong> Receive strictly anonymized, aggregated demographic summaries for policy evaluation and statutory compliance.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              5. AI Recommendations
            </h2>
            <p>
              SiKap employs Content-Based Filtering and Google Gemini AI assistance to evaluate vocational interests and suggest personalized learning pathways based on declared skills and goals. AI-generated outputs serve as advisory recommendations and do not restrict applicants from exploring alternative programs.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              6. Information Security &amp; Storage
            </h2>
            <p>
              We implement industry-standard technical, physical, and organizational security measures, including HTTPS encryption in transit, bcrypt password hashing, session tokens, and strict role-based access control. Uploaded ID documents are stored in protected directories accessible solely to verified administrators during the validation phase.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              7. Data Retention &amp; Disposal
            </h2>
            <p>
              Personal data is maintained in the active Katipunan ng Kabataan registry for as long as a member remains an eligible youth resident (ages 18 to 30) of San Luis, Pampanga. Upon reaching age thirty-one (31) or upon permanent relocation outside the municipality, accounts are transitioned to an archived status and subsequently disposed of or anonymized in compliance with National Archives and NPC guidelines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              8. Your Rights as a Data Subject
            </h2>
            <p>
              Under the Data Privacy Act of 2012, registered youth possess the right to be informed, right to access, right to rectification, right to erasure or blocking, and the right to lodge a complaint with the National Privacy Commission (NPC).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              9. Contact &amp; Inquiries
            </h2>
            <p>
              For privacy-related inquiries, data access requests, or official communications, you may contact the Sangguniang Kabataan Council and Municipal Administration at:
            </p>
            <p className="text-sm">
              <strong>Email:</strong> sikap.system@gmail.com<br />
              <strong>Office:</strong> Sangguniang Kabataan Office, Municipal Hall, San Luis, Pampanga, Region III, Philippines
            </p>
          </section>
        </div>

        {/* Bottom Return to Previous Page Link */}
        <div className="pt-10 pb-4 flex items-center justify-start">
          <button
            type="button"
            onClick={handleBack}
            className="text-slate-500 hover:text-slate-800 font-bold text-[16px] transition-colors cursor-pointer select-none text-left flex items-center gap-2 group"
          >
            <span>{backLabel || "Return to Previous Page"}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 shrink-0" />
          </button>
        </div>
      </main>

      {/* Floating Scroll to Top Button (> arrow pointing up) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-50 bg-[#0A6B43] hover:bg-[#075332] text-white p-3 sm:p-3.5 rounded-full shadow-lg hover:shadow-2xl hover:-translate-y-1 active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center border border-emerald-400/30 group"
          title="Go to top"
        >
          <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
      )}

      {/* Identical Footer as Landing Page */}
      <footer className="bg-[#082D21] border-t border-emerald-950/60 pt-14 sm:pt-16 pb-8 mt-auto overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-4 text-center md:text-left">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-3.5 sm:gap-4 max-w-xl">
              <div className="select-none inline-flex items-center justify-center cursor-default">
                <div className="sm:hidden flex items-center">
                  <SikapLogo
                    size={34}
                    logoSize={34}
                    textSize={28}
                    variant="white"
                    showText={true}
                    showSubtext={false}
                    gap="gap-1"
                    textClassName="translate-y-[0.5px]"
                    disableHover={true}
                  />
                </div>
                <div className="hidden sm:flex items-center">
                  <SikapLogo
                    size={58}
                    logoSize={58}
                    textSize={42}
                    variant="white"
                    showText={true}
                    showSubtext={false}
                    gap="gap-1"
                    textClassName="translate-y-[1.5px]"
                    disableHover={true}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-400 font-medium text-center md:text-left max-w-xl leading-relaxed">
                SiKap helps young people in San Luis, Pampanga discover opportunities that fit their strengths and aspirations. By connecting youth profiles with relevant training programs, SiKap turns skills, interests, and goals into clearer pathways for learning, growth, and opportunity.
              </p>
            </div>

            {/* Links - Three Columns (Account, Legal, Navigation) */}
            <div className="flex flex-row flex-wrap items-start justify-center md:justify-end gap-8 sm:gap-10 lg:gap-16 pt-2 shrink-0">
              {/* Column 1: Account */}
              <div className="flex flex-col items-start gap-3 text-left">
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  Account
                </span>
                <div className="flex flex-col items-start gap-2.5 text-sm font-semibold text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("register");
                      else if (typeof window !== "undefined") window.location.href = "/?action=register";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Create an Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("login");
                      else if (typeof window !== "undefined") window.location.href = "/?action=login";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Column 2: Legal */}
              <div className="flex flex-col items-start gap-3 text-left">
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  Legal
                </span>
                <div className="flex flex-col items-start gap-2.5 text-sm font-semibold text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("terms");
                      else if (typeof window !== "undefined") window.location.href = "/terms";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms & Conditions
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("privacy");
                      else if (typeof window !== "undefined") window.location.href = "/privacy";
                    }}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </div>
              </div>

              {/* Column 3: Navigation */}
              <div className="flex flex-col items-start gap-3 text-left">
                <span className="text-sm font-bold uppercase tracking-wider text-white">
                  Navigation
                </span>
                <div className="flex flex-col items-start gap-2.5 text-sm font-semibold text-gray-400">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Home
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Why It Matters
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    What SiKap Offers
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    How SiKap Works
                  </button>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    FAQs
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sub-footer */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-emerald-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs font-medium text-gray-400 text-center sm:text-left">
            <p>© 2026 SiKap. All rights reserved.</p>
            <p>
              Designed and developed by <span className="font-bold text-white">BITWISE</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
