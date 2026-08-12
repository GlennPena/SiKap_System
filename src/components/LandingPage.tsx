"use client";

import React, { useState } from "react";
import { TESDAProgram } from "../types";
import { 
  BookOpen, 
  Users, 
  ArrowRight, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Building2, 
  HelpCircle, 
  Activity, 
  Sparkles, 
  ShieldCheck
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";


interface LandingPageProps {
  programs: TESDAProgram[];
  onEnterLogin: () => void;
  addToast: (message: string, type: "success" | "error" | "info") => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  programs,
  onEnterLogin,
  addToast
}) => {
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(prev => (prev === index ? null : index));
  };

  const faqs = [
    {
      q: "What is SiKap and who is it for?",
      a: "SiKap (Sikap at Kakayahan) is an automated youth skills mapping and livelihood matching platform created for the Katipunan ng Kabataan (KK) of San Luis, Pampanga. It is specifically designed to help out-of-school youth (OSY) and unemployed youth find free, subsidized TESDA vocational courses."
    },
    {
      q: "Are the training programs free?",
      a: "Yes! All programs featured on the SiKap platform are fully subsidized, meaning there are absolutely no tuition or materials costs for the registered KK youth. Selected programs even offer daily allowances, starter toolkits, and transportation support."
    },
    {
      q: "How does the AI-Integrated Matching work?",
      a: "Our system uses Google Gemini models to compare a youth's current skills, interests, and barangay location with the entry requirements and curriculum of available TESDA programs. It generates a personalized match score and a clear, natural-language explanation explaining exactly why a specific program is a great fit for their career goals."
    },
    {
      q: "How do I apply for a program?",
      a: "Simply log in to the KK Youth Portal, view your matching pathways, and click 'Apply'. Your application goes directly to our TESDA training partners, who will review and confirm your slot enrollment without requiring manual SK official endorsement letters."
    },
    {
      q: "What happens when a program's slots are full?",
      a: "To ensure training quality, each cohort has strict slot limits. The system prevents new applications once slots are full. However, when TESDA partners accept or graduate students, slots are automatically updated, and you can explore alternative pathways in real-time."
    }
  ];

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#FAFBF9] min-h-screen text-gray-800" id="landing-page-root">
      
      {/* Dynamic Frosted Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleScrollToSection("hero")}>
              <SikapLogo size={36} showText={true} showSubtext={false} />
              <div className="hidden sm:block border-l border-gray-200 pl-2">
                <span className="text-[10px] font-black text-gray-900 tracking-wide block uppercase leading-none">San Luis</span>
                <span className="text-[8px] text-[#0A6B43] font-bold block uppercase tracking-wider mt-0.5">Pampanga</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <button onClick={() => handleScrollToSection("stats")} className="hover:text-[#0A6B43] transition-colors">Statistics</button>
              <button onClick={() => handleScrollToSection("workflow")} className="hover:text-[#0A6B43] transition-colors">How It Works</button>
              <button onClick={() => handleScrollToSection("faq")} className="hover:text-[#0A6B43] transition-colors">FAQs</button>
            </nav>

            {/* Portal Button */}
            <div className="flex items-center gap-3">
              <button 
                onClick={onEnterLogin}
                className="bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                id="landing-access-portals-btn"
              >
                <ShieldCheck className="w-4 h-4" />
                Access Portals
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-transparent pt-12 pb-20 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-100/70 border border-emerald-200 text-[#075332] text-[11px] font-extrabold px-3.5 py-1.5 rounded-full uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Out-of-School Youth (OSY) Portal · San Luis, Pampanga
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                Empowering Out-of-School Youth with <span className="text-[#0A6B43] relative inline-block">Smart Matchmaking<span className="absolute left-0 bottom-1 w-full h-1.5 bg-emerald-100 -z-10 rounded-full"></span></span> Career Pathways
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                SiKap is the specialized digital platform of San Luis, Pampanga dedicated exclusively to skills-mapping, TVET training, and direct livelihood referrals for out-of-school youth (OSY). Using advanced alignment systems to match OSY profiles to fully funded programs.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <button 
                  onClick={onEnterLogin}
                  className="w-full sm:w-auto bg-[#0A6B43] hover:bg-[#075332] text-white text-xs font-extrabold px-6 py-3.5 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Enter Authorized Portals
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleScrollToSection("workflow")}
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-6 py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  See Strategic Workflow
                </button>
              </div>

              {/* Quotes */}
              <p className="text-xs text-amber-600 font-extrabold italic tracking-wide">
                "Sa SiKap, may sapat na kakayahan ang kabataang San Luiseño!"
              </p>
            </div>

            {/* Hero Right Visual Column */}
            <div className="lg:col-span-5 relative">
              <div className="absolute -inset-4 bg-emerald-100/30 rounded-3xl blur-2xl -z-10"></div>
              
              {/* Interactive Demo Matching Mockup Card */}
              <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-gray-150 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-700 font-black text-xs shadow-inner">
                      KK
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-gray-800">Juan dela Cruz</h4>
                      <p className="text-[10px] text-gray-400 font-bold">Purok 2, San Sebastian</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-[#0A6B43] text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    OSY Youth
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#075332] uppercase">Recommended Course</span>
                      <span className="text-xs font-black text-emerald-700">94% Match</span>
                    </div>
                    <p className="text-xs font-extrabold text-gray-800 mt-1">Shielded Metal Arc Welding (SMAW) NC II</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500 font-bold">
                      <span>⏱ 3 Months</span>
                      <span>📍 TESDA GPSAT Campus</span>
                    </div>
                  </div>

                  <div className="bg-amber-50/50 rounded-xl p-3 border border-amber-100 text-[11px] text-amber-900 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 font-bold text-amber-800">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      Gemini Match Rationale
                    </div>
                    <p className="text-gray-700 font-medium text-[10px]">
                      "Juan has hands-on skills in metal fabrication. This vocational program will officially certify his qualifications under TESDA and unlock formal job opportunities in regional manufacturing hubs."
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 text-[10px] font-extrabold text-gray-400 pt-1">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md">✓ No Fees</span>
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md">✓ Free Starter Tools</span>
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md">✓ Transport Allowance</span>
                </div>
              </div>

              {/* Mini overlap card */}
              <div className="absolute -bottom-6 -left-6 bg-[#1C2B20] text-white p-4 rounded-xl shadow-lg border border-emerald-800 hidden sm:flex items-center gap-3 max-w-[220px]">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-xs shrink-0 text-white">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-black">Authorized Portals</p>
                  <p className="text-[9px] text-emerald-300 font-semibold mt-0.5">Dual synchronization for Youth & SK Officials</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Impact Stats Section */}
      <section id="stats" className="py-12 bg-[#1C2B20] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Real-time Platform Reach</h2>
            <p className="text-2xl font-extrabold">Active Status in San Luis, Pampanga</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="bg-emerald-950/40 p-6 rounded-2xl border border-emerald-800/40">
              <Users className="w-7 h-7 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-black text-white">150+</p>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mt-1">KK Youth Registered</p>
              <p className="text-[10px] text-gray-400 mt-1">Katipunan ng Kabataan Database</p>
            </div>

            <div className="bg-emerald-950/40 p-6 rounded-2xl border border-emerald-800/40">
              <BookOpen className="w-7 h-7 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-black text-white">6 Core</p>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mt-1">Active Programs</p>
              <p className="text-[10px] text-gray-400 mt-1">TESDA Accredited Syllabi</p>
            </div>

            <div className="bg-emerald-950/40 p-6 rounded-2xl border border-emerald-800/40">
              <Building2 className="w-7 h-7 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-black text-white">8</p>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mt-1">Barangays Covered</p>
              <p className="text-[10px] text-gray-400 mt-1">San Luis Local Governance</p>
            </div>

            <div className="bg-emerald-950/40 p-6 rounded-2xl border border-emerald-800/40">
              <TrendingUp className="w-7 h-7 mx-auto text-amber-500 mb-2" />
              <p className="text-3xl font-black text-white">85%</p>
              <p className="text-xs text-emerald-300 font-bold uppercase tracking-wider mt-1">Placement Goal</p>
              <p className="text-[10px] text-gray-400 mt-1">Subsidized career tracking</p>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Workflow / Road map Section */}
      <section id="workflow" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-black text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Referral Pipeline Roadmap
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
              The SiKap Strategic Workflow
            </h2>
            <p className="text-sm text-gray-500 font-medium">
              See the lifecycle of a skills matched referral pathway, from profile collection to graduation.
            </p>
          </div>

          <div className="relative">
            {/* Desktop connecting line */}
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 hidden lg:block -z-10"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              
              {/* Step 1 */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 relative hover:shadow-xs transition-shadow">
                <div className="absolute -top-4 left-6 bg-[#0A6B43] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                  1
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mt-2 uppercase tracking-wider">Profile Entry</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                  KK Youth register their educational background, purok addresses, current competencies, and livelihood aspirations.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 relative hover:shadow-xs transition-shadow">
                <div className="absolute -top-4 left-6 bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                  2
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mt-2 uppercase tracking-wider">AI Matchmaking</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                  The system generates detailed matches with Gemini-powered rationale explanations detailing exactly how programs fit user backgrounds.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 relative hover:shadow-xs transition-shadow">
                <div className="absolute -top-4 left-6 bg-emerald-800 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                  3
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mt-2 uppercase tracking-wider">Direct Application</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                  KK Youth select their matched programs and apply directly from their personal portal with complete freedom of choice.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-gray-50 border border-gray-150 rounded-2xl p-6 relative hover:shadow-xs transition-shadow">
                <div className="absolute -top-4 left-6 bg-[#1C2B20] text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-md">
                  4
                </div>
                <h4 className="font-extrabold text-gray-900 text-sm mt-2 uppercase tracking-wider">Slot Enrollment</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed font-medium">
                  TESDA partners accept the direct applications, which automatically decrements the remaining slots and registers the youth.
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-emerald-50/10 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-12 space-y-2">
            <span className="text-xs font-black text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase tracking-wider inline-block">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-black text-gray-900">Have Questions About SiKap?</h2>
            <p className="text-xs text-gray-500 font-medium">Find answers to quick questions regarding program policies, matching, and support.</p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, i) => {
              const isOpen = activeFaqIndex === i;
              return (
                <div 
                  key={i} 
                  className="bg-white border border-gray-150 rounded-xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full text-left p-4 sm:p-5 flex justify-between items-center gap-4 hover:bg-gray-50/50"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-[#0A6B43] shrink-0" />
                      {faq.q}
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-gray-100 bg-gray-50/40 text-xs text-gray-600 leading-relaxed font-semibold">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Quick CTA Banner */}
      <section className="bg-[#1C2B20] text-white py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black leading-tight">
            Ready to secure your vocational career pathway?
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 font-medium max-w-xl mx-auto leading-relaxed">
            Register or sign in to explore personalized match rationales and secure your TESDA cohort spot in San Luis, Pampanga.
          </p>
          <div className="pt-2">
            <button 
              onClick={onEnterLogin}
              className="bg-amber-500 hover:bg-amber-600 text-[#1C2B20] text-xs font-black px-8 py-3.5 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-gray-900 items-start">
            
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-[#0A6B43] text-white px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                  SiKap
                </span>
                <span className="text-xs font-bold text-white">SiKap Skills matching platform</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-md font-medium">
                Automating Katipunan ng Kabataan demographic skills mapping and direct program pathways across the 17 Barangays of the Municipality of San Luis, Pampanga.
              </p>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Local Government</h4>
              <ul className="text-xs space-y-2 font-medium">
                <li>Sangguniang Kabataan Federation</li>
                <li>Barangay Council Networks</li>
                <li>San Luis Municipal Hall, Pampanga</li>
              </ul>
            </div>

            <div className="md:col-span-4 space-y-3">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Strategic Partners</h4>
              <ul className="text-xs space-y-2 font-medium">
                <li>TESDA GPSAT</li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-extrabold uppercase tracking-widest">
            <p>© 2026 Sangguniang Kabataan Federation of San Luis, Pampanga. All Rights Reserved.</p>
            <p className="text-[#0A6B43]">Designed with premium performance and design craftsmanship</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
