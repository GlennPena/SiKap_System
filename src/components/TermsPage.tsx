"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, ChevronUp } from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import { FadeIn } from "./FadeIn";

interface TermsPageProps {
  onBack?: () => void;
  onNavigate?: (tab: "terms" | "privacy" | "login" | "register") => void;
  backLabel?: string;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onBack, onNavigate, backLabel }) => {
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
    <div className="bg-[#FAFBF9] min-h-[100dvh] overscroll-y-none text-gray-800 w-full flex flex-col font-sans antialiased">
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
        <FadeIn direction="up">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0A6B43] tracking-tight mb-3">
            Terms and Conditions
          </h1>
          <hr className="border-t border-gray-200 mb-8" />
        </FadeIn>

        <div className="space-y-7 sm:space-y-8 text-gray-700 text-xs sm:text-sm leading-relaxed text-justify">
          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                1. Acceptance of Terms
              </h2>
              <p className="text-justify">
                By accessing the SiKap portal, creating an account, or participating in municipal training programs, you agree to comply with these Terms and Conditions, the Sangguniang Kabataan Reform Act of 2015 (Republic Act No. 10742, as amended by Republic Act No. 11768), the Local Government Code of 1991 (Republic Act No. 7160), and all applicable municipal ordinances of San Luis, Pampanga. If you do not agree to these terms, you must not proceed with registration or use of the platform.
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                2. Eligibility &amp; Katipunan ng Kabataan Membership
              </h2>
              <p className="text-justify">
                Registration and participation in subsidized training pathways are restricted to eligible youth members under Philippine law:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-justify">
                <li>
                  <strong>Age Requirement:</strong> You must be between eighteen (18) and thirty (30) years of age at the time of registration.
                </li>
                <li>
                  <strong>Residency Requirement:</strong> You must be a bona fide resident of one of the 17 barangays of San Luis, Pampanga for at least six (6) consecutive months.
                </li>
                <li>
                  <strong>Single Account:</strong> Each eligible youth is entitled to only one (1) validated account. Impersonation, falsified information, or multiple registrations will result in immediate termination of portal privileges.
                </li>
              </ul>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                3. Identity Verification &amp; Document Submission
              </h2>
              <p className="text-justify">
                Applicants are required to submit an authentic, legible government-recognized identity document (such as a PhilSys National ID, Student ID with Enrollment Receipt, Voter's ID or Stub, Driver's License, or Barangay Clearance) for residency and age validation.
              </p>
              <p className="text-justify">
                Falsification of documents, deliberate submission of altered files, or providing fraudulent claims constitutes grounds for account disqualification and potential legal liability under Article 172 of the Revised Penal Code (Falsification by Private Individuals).
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                4. Account Review &amp; Official Approval
              </h2>
              <p className="text-justify">
                Upon registration, accounts enter a Pending Review status while the Sangguniang Kabataan Chairperson and authorized Council Officers of your respective barangay verify your residency and age.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-justify">
                <li>
                  <strong>Pending Status:</strong> You may view your profile in read-only mode during the review period.
                </li>
                <li>
                  <strong>Active Status:</strong> Once approved, official endorsements, subsidized TESDA course slots, and youth welfare benefits are enabled.
                </li>
                <li>
                  <strong>Aging Out:</strong> Accounts automatically transition to archival status upon reaching age thirty-one (31) or upon permanent relocation outside San Luis, Pampanga.
                </li>
              </ul>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                5. Training Programs &amp; Referrals
              </h2>
              <p className="text-justify">
                SiKap provides digital application endorsements to accredited TESDA partner institutions. Acceptance into training programs is governed by course prerequisites, slot availability, and partner center screening guidelines.
              </p>
              <p className="text-justify">
                Because subsidized training slots are funded through public resources, enrolled youth scholars are expected to maintain regular attendance and complete their enrolled courses diligently.
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                6. AI-Assisted Recommendations
              </h2>
              <p className="text-justify">
                SiKap employs Content-Based Filtering and Google Gemini AI assistance to analyze training alignments and suggest personalized vocational pathways based on declared skills and career goals. AI-generated suggestions serve solely as educational guidance and do not restrict applicants from manually applying for alternative programs.
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                7. Acceptable Platform Use
              </h2>
              <p className="text-justify">
                Users must use SiKap exclusively for lawful educational, vocational, and civic development purposes. Users shall not attempt to breach system security, harvest unauthorized records, reverse-engineer code, inject malicious content, or share official credentials with unauthorized third parties.
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                8. System Availability &amp; Disclaimers
              </h2>
              <p className="text-justify">
                SiKap is provided on an "as-is, as-available" public service basis. The Municipal Government of San Luis and the Sangguniang Kabataan Federation shall not be held liable for temporary telecommunications interruptions, scheduled server maintenance, or schedule alterations made by external private partner centers.
              </p>
            </section>
          </FadeIn>

          <FadeIn direction="up" delay={0.05} margin="-30px">
            <section className="space-y-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900 text-left">
                9. Amendments to Terms
              </h2>
              <p className="text-justify">
                The Municipal Administration and the Sangguniang Kabataan Federation reserve the right to revise these Terms to align with updated national policies or municipal youth codes. Continued portal usage constitutes acceptance of revised guidelines.
              </p>
            </section>
          </FadeIn>
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
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Account
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
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
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Legal
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
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
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Navigation
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
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
