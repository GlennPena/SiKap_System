"use client";

import React, { useState, useEffect } from "react";
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
  ShieldCheck,
  Plus
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
  const [liveStats, setLiveStats] = useState({
    totalYouth: 0,
    totalPrograms: 0,
    totalApplications: 0,
    enrolledApplications: 0,
    barangaysRepresented: 0
  });

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setLiveStats(res.data);
        }
      })
      .catch(err => console.error("Error fetching landing stats:", err));
  }, []);

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
      a: "Our system uses Content-Based Filtering (CBF) algorithms to compare a youth's current skills, interests, and barangay location with the entry requirements and curriculum of available TESDA programs to calculate a precise compatibility score. Google Gemini is then utilized to generate a clear, natural-language explanation explaining exactly why a specific program is a great fit for their career goals."
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

      {/* Non-sticky Header */}
      <header className="relative w-full z-40 bg-white border-b border-emerald-100/80 shadow-2xs transition-all duration-200">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">

            {/* Logo & Brand ID */}
            <div className="flex items-center cursor-pointer select-none group" onClick={() => handleScrollToSection("hero")}>
              <SikapLogo size={48} logoSize={60} textSize={40} showText={true} showSubtext={false} gap="gap-1" />
            </div>

            {/* Right Action / Sign In Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={onEnterLogin}
                className="bg-[#0A6B43] hover:bg-[#075332] text-white text-base font-extrabold px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2.5 group cursor-pointer"
                id="landing-access-portals-btn"
              >
                <span>Sign In</span>
                <ArrowRight className="w-5 h-5 text-emerald-200 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Hero Section (1st 100vh: 80vh centered content + 20vh fading transition) */}
      <section id="hero" className="relative min-h-[100vh] flex flex-col justify-between bg-[#FAFBF9] overflow-hidden">

        {/* Hero Body Dots (Solid) */}
        <div
          className="absolute inset-x-0 top-0 bottom-[20vh] pointer-events-none z-0 opacity-80"
          style={{
            backgroundImage: "url('/worn-dots.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "500px 500px",
          }}
        />

        {/* Hero Content centered within the first 80vh */}
        <div className="min-h-[80vh] flex items-center justify-center w-full relative z-10 pt-2 sm:pt-4 pb-4">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">

              {/* Hero Left Content */}
              <div className="lg:col-span-7 space-y-7 sm:space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center bg-emerald-100/80 border border-emerald-200 text-[#075332] text-xs sm:text-sm font-black px-5 py-2 rounded-full uppercase tracking-wider shadow-2xs">
                  San Luis, Pampanga
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-6xl xl:text-[76px] font-black text-gray-900 leading-[1.05] tracking-tight">
                  <span className="block">Find the Right Path.</span>
                  <span className="block text-[#0A6B43] relative inline-block mt-1 sm:mt-2.5">
                    Build Your Future.
                    <span className="absolute left-0 -bottom-1 sm:-bottom-0.5 lg:-bottom-0.5 w-full h-3 sm:h-3.5 lg:h-4 bg-emerald-100/90 -z-10 rounded-full"></span>
                  </span>
                </h1>

                <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                  Find opportunities that turn your potential into possibilities.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1.5">
                  <button
                    onClick={onEnterLogin}
                    className="w-full sm:w-auto bg-[#0A6B43] hover:bg-[#075332] text-white text-base sm:text-lg font-black px-9 py-4.5 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                  >
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleScrollToSection("workflow")}
                    className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-200 hover:border-emerald-300 text-base sm:text-lg font-bold px-8 py-4.5 rounded-2xl shadow-2xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    How SiKap Works
                  </button>
                </div>
              </div>

              {/* Hero Right Visual Column */}
              <div className="lg:col-span-5 relative mt-5 lg:mt-0">
                <div className="absolute -inset-3 bg-emerald-100/35 rounded-3xl blur-xl -z-10"></div>

                {/* Interactive Demo Matching Mockup Card */}
                <div className="bg-white border-2 border-emerald-100/90 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-5.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-800 font-black text-sm shadow-inner border border-emerald-100">
                        KK
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-gray-900">Juan dela Cruz</h4>
                        <p className="text-xs sm:text-sm text-gray-400 font-bold">Purok 2, San Sebastian</p>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm bg-[#0A6B43] text-white px-3.5 py-1 rounded-full font-black uppercase tracking-wider shadow-2xs">
                      OSY Youth
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-emerald-50/70 rounded-2xl p-4.5 sm:p-5 border border-emerald-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-black text-[#075332] uppercase tracking-wide">Recommended Course</span>
                        <span className="text-xs sm:text-sm font-black text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg shadow-2xs border border-emerald-100">94% Match</span>
                      </div>
                      <p className="text-base sm:text-lg font-black text-gray-900 mt-2">Shielded Metal Arc Welding (SMAW) NC II</p>
                      <div className="flex items-center gap-4 mt-2.5 text-xs sm:text-sm text-gray-600 font-bold">
                        <span className="flex items-center gap-1">⏱ 3 Months</span>
                        <span className="flex items-center gap-1">📍 TESDA GPSAT Campus</span>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 rounded-2xl p-4.5 sm:p-5 border border-amber-200/70 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-1.5 font-black text-sm sm:text-base text-amber-900">
                        <Sparkles className="w-4.5 h-4.5 fill-amber-500 text-amber-500 shrink-0" />
                        Gemini Match Rationale
                      </div>
                      <p className="text-gray-700 font-medium text-xs sm:text-sm leading-relaxed">
                        "Juan has hands-on skills in metal fabrication. This vocational program will officially certify his qualifications under TESDA and unlock formal job opportunities in regional manufacturing hubs."
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-black text-gray-600 pt-0.5">
                    <span className="bg-gray-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-gray-200/60">✓ No Fees</span>
                    <span className="bg-gray-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-gray-200/60">✓ Free Starter Tools</span>
                    <span className="bg-gray-100 hover:bg-emerald-50 px-3.5 py-2 rounded-xl border border-gray-200/60">✓ Transport Allowance</span>
                  </div>
                </div>

                {/* Mini overlap card */}
                <div className="absolute -bottom-5 -left-5 bg-[#1C2B20] text-white p-5 sm:p-5.5 rounded-2xl shadow-2xl border border-emerald-700 hidden sm:flex items-center gap-4 max-w-[285px]">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-sm shrink-0 text-white shadow-xs">
                    ✓
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-black">Authorized Portals</p>
                    <p className="text-xs text-emerald-300 font-semibold mt-0.5">Dual synchronization for Youth & SK Officials</p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

        {/* 20vh Visible Fading Transition Area directly into Next Section */}
        <div className="h-[20vh] w-full relative pointer-events-none z-0 shrink-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/worn-dots.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "500px 500px",
              opacity: 0.8,
              maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.6) 40%, rgba(0,0,0,0) 100%)"
            }}
          />
        </div>
      </section>

      {/* Impact in San Luis - Philippines Regional Focus (Immediately follows the 20vh transition) */}
      <section id="impact-map" className="pt-0 pb-20 lg:pb-28 bg-[#FAFBF9] relative overflow-hidden">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Main Showcase Container (Clean & Borderless) */}
          <div className="relative rounded-3xl overflow-hidden bg-white shadow-xl transition-all duration-300">

            {/* Top Header inside Container */}
            <div className="pt-8 sm:pt-12 px-6 sm:px-12 pb-4 space-y-3">
              <div className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-xs sm:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                Bridging the gap to opportunity
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight max-w-4xl">
                The <span className="text-[#0A6B43]">opportunity gap</span> starts with finding the <span className="text-[#0A6B43] relative inline-block">right path<span className="absolute left-0 bottom-1.5 w-full h-3 bg-emerald-100/90 -z-10 rounded-full"></span></span>.
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium leading-relaxed max-w-3xl">
                Across the Philippines, millions of young people are outside formal education and face barriers to building the skills they need for their future.
              </p>
            </div>

            {/* Map Vector Graphic Area (Enlarged Philippines SVG Map) */}
            <div className="relative min-h-[500px] sm:min-h-[620px] lg:min-h-[720px] py-4 sm:py-8 w-full overflow-hidden bg-white flex items-center justify-center">

              {/* Philippines SVG Map Container */}
              <div className="relative aspect-square w-auto h-[480px] sm:h-[580px] lg:h-[680px] max-w-[95%] flex items-center justify-center">
                <img
                  src="/country.svg"
                  alt="Philippines Vector Map"
                  className="w-full h-full object-contain select-none opacity-95 filter drop-shadow-sm"
                />

                {/* Pulsing Pin & Mini Card positioned precisely at the white circle coordinates */}
                <div
                  className="absolute z-20"
                  style={{
                    top: "38.65%",
                    left: "43.75%",
                    transform: "translate(-50%, -50%)"
                  }}
                >
                  {/* Interactive Dot Group: Hovering only the dot scales the card */}
                  <div className="relative group flex items-center justify-center">

                    {/* Hit area & Pin */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center relative cursor-pointer">
                      {/* Expanding Radar Wave */}
                      <span className="absolute w-9 h-9 rounded-full bg-emerald-500/35 animate-ping group-hover:bg-emerald-500/50 transition-colors"></span>

                      {/* Glowing Aura Ring */}
                      <span className="absolute w-5 h-5 rounded-full bg-emerald-400/50 animate-pulse group-hover:scale-125 transition-transform"></span>

                      {/* Target Outer Ring with Solid Center */}
                      <span className="relative w-3.5 h-3.5 rounded-full bg-white border-2 border-[#0A6B43] shadow-md flex items-center justify-center group-hover:scale-110 group-hover:border-emerald-700 transition-transform">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0A6B43]"></span>
                      </span>
                    </div>

                    {/* Floating Mini Card: Scales up in place when dot is hovered */}
                    <div className="absolute left-9 sm:left-11 top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-md border border-emerald-200/90 py-2 px-4 rounded-xl shadow-xl flex items-center gap-2 whitespace-nowrap pointer-events-none transform origin-left transition-all duration-300 ease-out group-hover:scale-110 group-hover:shadow-2xl group-hover:border-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-[#0A6B43] animate-pulse"></span>
                      <span className="text-xs sm:text-sm font-black text-gray-900 tracking-tight">
                        San Luis, Pampanga
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Bottom Storytelling Statistics Grid (Clean & Borderless) */}
            <div className="bg-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 relative pt-2 pb-6 px-6 sm:px-12 gap-6">
              {/* Stat 1 */}
              <div className="p-4 sm:p-6 space-y-2 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">10.7M</p>
                <h4 className="text-sm sm:text-base font-extrabold text-gray-900">Out-of-School Youth</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Young Filipinos facing barriers to education, skills development, and employment.
                </p>
              </div>

              {/* Stat 2 */}
              <div className="p-4 sm:p-6 space-y-2 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">49%</p>
                <h4 className="text-sm sm:text-base font-extrabold text-gray-900">Want to Return to Education</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Nearly half of interviewed out-of-school youth expressed interest in returning to formal education.
                </p>
              </div>

              {/* Stat 3 */}
              <div className="p-4 sm:p-6 space-y-2 rounded-2xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <p className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">21%</p>
                <h4 className="text-sm sm:text-base font-extrabold text-gray-900">Plan to Pursue Employment</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Many young people are looking for pathways toward work and greater economic participation.
                </p>
              </div>

              {/* Stat 4 */}
              <div className="p-4 sm:p-6 space-y-2 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/60 transition-colors border border-emerald-100/60">
                <p className="text-4xl sm:text-5xl font-black text-[#0A6B43] tracking-tight">17</p>
                <h4 className="text-sm sm:text-base font-extrabold text-gray-900">San Luis Barangays</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  Bridging local youth directly to verified TESDA institute cohorts and sustainable careers.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Where Potential Meets Opportunity Section */}
      <section id="opportunity" className="py-24 lg:py-32 bg-[#0A4D30] text-white relative overflow-hidden">
        {/* Subtle background ambient lighting */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-amber-400/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

            {/* Left Part: Header */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                Where <span className="text-[#F5A623]">potential</span> meets <span className="text-[#F5A623]">opportunity</span>
              </h2>
            </div>

            {/* Right Part: Description Narrative (Matching Font Sizes, No Underlines) */}
            <div className="lg:col-span-7 space-y-6 lg:pt-2">
              <p className="text-lg sm:text-xl lg:text-2xl text-emerald-100/90 font-medium leading-relaxed">
                SiKap connects young people in San Luis, Pampanga with verified <span className="text-white font-bold">TESDA training opportunities</span> based on{" "}
                <strong className="text-white font-black">who they are</strong>,{" "}
                <strong className="text-white font-black">what they can do</strong>, and{" "}
                <strong className="text-white font-black">where they want to go</strong>.
              </p>

              <p className="text-lg sm:text-xl lg:text-2xl text-emerald-100/90 font-medium leading-relaxed">
                By bringing <span className="text-white font-bold">youth profiles</span> and <span className="text-white font-bold">training opportunities</span> together, SiKap makes it easier to discover programs that fit their skills, interests, education, and goals — and take the next step toward their future.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Workflow / Road map Section */}
      <section id="workflow" className="py-20 sm:py-28 bg-white border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left Column: Editorial Sticky Header */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <span className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                HOW SIKAP WORKS
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.12]">
                From profile to opportunity
              </h2>

              <p className="text-base sm:text-lg text-gray-500 font-normal leading-relaxed max-w-md">
                A simple path from discovering your strengths to finding the right training opportunity.
              </p>
            </div>

            {/* Right Column: Numbered Process Rows */}
            <div className="lg:col-span-7 divide-y divide-gray-200/70 border-t border-gray-200/70">

              {/* Step 01 */}
              <div className="py-8 sm:py-10 group">
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-700">01</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors">
                      Discover & Profile
                    </h3>
                    <p className="text-sm text-gray-500 font-normal leading-relaxed">
                      KK Youth register their educational background, current competencies, barangay location, and livelihood aspirations through a simple, guided profiling process.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 02 */}
              <div className="py-8 sm:py-10 group">
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-700">02</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors">
                      Match & Recommend
                    </h3>
                    <p className="text-sm text-gray-500 font-normal leading-relaxed">
                      SiKap's intelligent matching algorithm evaluates youth profiles against verified TESDA courses to highlight best-fit pathways with transparent, explainable rationales.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 03 */}
              <div className="py-8 sm:py-10 group">
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-700">03</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors">
                      Apply & Connect
                    </h3>
                    <p className="text-sm text-gray-500 font-normal leading-relaxed">
                      Youth explore recommended programs, compare course details and schedules, and apply directly to partner training centers with real-time slot tracking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 04 */}
              <div className="py-8 sm:py-10 group">
                <div className="flex items-start gap-5 sm:gap-6">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-gray-700">04</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors">
                      Train & Certify
                    </h3>
                    <p className="text-sm text-gray-500 font-normal leading-relaxed">
                      Partner training institutes confirm applications, automatically reserve cohort capacity, and guide candidates through skills training toward accredited certification.
                    </p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 sm:py-28 bg-[#FAFBF9] border-b border-gray-100">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left Column: Editorial Sticky Header */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
              <span className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                FREQUENTLY ASKED QUESTIONS
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.12]">
                Have questions about SiKap?
              </h2>

              <p className="text-base sm:text-lg text-gray-500 font-normal leading-relaxed max-w-md">
                Find clear answers regarding program eligibility, AI matchmaking, free TESDA certifications, and direct enrollment in San Luis, Pampanga.
              </p>
            </div>

            {/* Right Column: Minimalist Editorial Accordion Rows */}
            <div className="lg:col-span-7 divide-y divide-gray-200/70 border-t border-gray-200/70">
              {faqs.map((faq, i) => {
                const isOpen = activeFaqIndex === i;
                return (
                  <div key={i} className="py-6 sm:py-8 group">
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      className="w-full text-left flex items-start justify-between gap-6 cursor-pointer"
                    >
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors pr-2">
                        {faq.q}
                      </h3>
                      <div
                        className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${isOpen
                          ? "bg-[#0A6B43] border-[#0A6B43] text-white rotate-45 shadow-xs"
                          : "bg-white border-gray-200 text-gray-500 group-hover:border-[#0A6B43] group-hover:text-[#0A6B43]"
                          }`}
                      >
                        <Plus className="w-4 h-4 transition-transform duration-200" />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pt-4 pr-6 sm:pr-12 text-sm sm:text-base text-gray-600 font-normal leading-relaxed animate-in fade-in duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </section>

      {/* Call To Action Banner */}
      <section className="py-20 lg:py-28 bg-[#FAFBF9]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-[#0A4D30] border border-emerald-800/60 shadow-2xl p-8 sm:p-14 lg:p-20 text-center">

            {/* Ambient Lighting & Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.18),transparent_65%)] pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                START YOUR SKILLS PATHWAY
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                Ready to secure your vocational career pathway?
              </h2>

              <p className="text-base sm:text-lg text-emerald-100/80 font-normal leading-relaxed max-w-2xl mx-auto">
                Discover free TESDA-accredited training programs matched to your strengths, interests, and aspirations across San Luis, Pampanga.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={onEnterLogin}
                  className="w-full sm:w-auto bg-white hover:bg-emerald-50 text-[#0A4D30] font-black text-base sm:text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  Sign In to Portal
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollToSection("workflow")}
                  className="w-full sm:w-auto bg-emerald-900/50 hover:bg-emerald-900/80 text-white border border-emerald-500/30 font-bold text-base sm:text-lg px-8 py-4 rounded-2xl transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  How It Works
                </button>
              </div>

              {/* Trust Indicators / Badges */}
              <div className="pt-6 border-t border-emerald-800/60 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm font-semibold text-emerald-200/70">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  100% Free & Subsidized
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Accredited TESDA Courses
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  17 Barangays Covered
                </span>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="bg-[#0D1812] text-gray-400 pt-16 pb-12 border-t border-emerald-950">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 items-start">

            {/* Col 1: Brand & Municipal Scope (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => handleScrollToSection("hero")}>
                <SikapLogo size={38} variant="white" showText={true} showSubtext={false} />
                <div className="flex flex-col border-l border-emerald-800/80 pl-3 py-0.5 justify-center">
                  <span className="text-xs font-black text-white tracking-wider uppercase leading-tight">San Luis</span>
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest leading-tight mt-0.5">Pampanga</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 font-normal leading-relaxed max-w-md">
                Automating Katipunan ng Kabataan demographic skills mapping and direct vocational program pathways across the 17 Barangays of the Municipality of San Luis, Pampanga.
              </p>
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-800/60 text-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live in 17 Barangays • San Luis, Pampanga</span>
              </div>
            </div>

            {/* Col 2: Navigation Links (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Navigation</h4>
              <ul className="text-sm space-y-2.5 font-medium">
                <li>
                  <button onClick={() => handleScrollToSection("hero")} className="hover:text-white transition-colors cursor-pointer">
                    Overview
                  </button>
                </li>
                <li>
                  <button onClick={() => handleScrollToSection("impact-map")} className="hover:text-white transition-colors cursor-pointer">
                    Regional Context
                  </button>
                </li>
                <li>
                  <button onClick={() => handleScrollToSection("opportunity")} className="hover:text-white transition-colors cursor-pointer">
                    Opportunity Scope
                  </button>
                </li>
                <li>
                  <button onClick={() => handleScrollToSection("workflow")} className="hover:text-white transition-colors cursor-pointer">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => handleScrollToSection("faq")} className="hover:text-white transition-colors cursor-pointer">
                    FAQs
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Governance (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Governance</h4>
              <ul className="text-sm space-y-2.5 font-medium text-gray-400">
                <li>Sangguniang Kabataan</li>
                <li>SK Federation San Luis</li>
                <li>17 Barangay Councils</li>
                <li>San Luis Municipal Hall</li>
              </ul>
            </div>

            {/* Col 4: Strategic Partners & Portals (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-xs font-black text-white uppercase tracking-wider">Portals & Accreditation</h4>
              <ul className="text-sm space-y-2.5 font-medium text-gray-400">
                <li>TESDA Accredited Programs</li>
                <li>GPSAT Campus Network</li>
                <li>National Certification (NC II)</li>
              </ul>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onEnterLogin}
                  className="w-full bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Enter Portal
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Sub-footer */}
          <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
            <p>© 2026 Sangguniang Kabataan Federation of San Luis, Pampanga. Republic of the Philippines.</p>
            <p className="text-emerald-500 font-semibold">SiKap System • Skills Profiling & Matchmaking</p>
          </div>

        </div>
      </footer>

    </div>
  );
};
