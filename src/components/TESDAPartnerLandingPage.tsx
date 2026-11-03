"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Building2,
  BookOpen,
  Users,
  UserCheck,
  TrendingUp,
  ArrowRight,
  Check,
  CheckCircle2,
  ShieldCheck,
  Bell,
  Clock,
  MapPin,
  Award,
  Layers,
  FileCheck,
  Sparkles,
  ChevronUp,
  ChevronRight,
  GraduationCap,
  SlidersHorizontal,
  Activity,
  Flame,
  Calendar,
  Mail,
  Briefcase
} from "lucide-react";
import { SikapLogo } from "./ReusableComponents";
import { AnimatedGridBackground } from "./AnimatedGridBackground";
import { motion, AnimatePresence, useInView, useAnimation } from "motion/react";

const FadeIn = ({
  children,
  delay = 0,
  duration = 0.55,
  className = "",
  direction = "up",
  amount = "some",
  margin = "-50px"
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "hero-adaptive";
  amount?: number | "some" | "all";
  margin?: string;
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: margin as any, amount });
  const controls = useAnimation();

  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth >= 1280;
    }
    return true;
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const resolvedDirection = direction === "hero-adaptive" ? (isDesktop ? "left" : "up") : direction;

  const initial =
    resolvedDirection === "up"
      ? { opacity: 0, y: 24, x: 0 }
      : resolvedDirection === "left"
      ? { opacity: 0, x: -16, y: 0 }
      : { opacity: 0, x: 16, y: 0 };

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration,
          delay,
          ease: "easeOut"
        }
      });
    }
  }, [isInView, resolvedDirection, controls, duration, delay]);

  return (
    <motion.div ref={ref} initial={initial} animate={controls} className={className}>
      {children}
    </motion.div>
  );
};

export const TESDAPartnerLandingPage: React.FC = () => {
  const { data: session, status } = useSession();
  const isAuthenticatedPartner =
    status === "authenticated" && (session?.user as any)?.role === "TESDA_PARTNER";

  const [activeFeatureIndex, setActiveFeatureIndex] = useState<number>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleScrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const whyPartnerCards = [
    {
      title: "Manage Training Programs",
      description:
        "Post, update, and manage your available technical-vocational training programs.",
      icon: BookOpen,
      badge: "Course Catalog",
      accent: "emerald"
    },
    {
      title: "Discover Potential Trainees",
      description:
        "Review youth profiles, qualifications, skills, and matching recommendations.",
      icon: Users,
      badge: "AI Skill Matching",
      accent: "amber"
    },
    {
      title: "Manage Applicants",
      description:
        "Monitor applications and update applicant statuses through one centralized platform.",
      icon: UserCheck,
      badge: "Unified Pipeline",
      accent: "emerald"
    },
    {
      title: "Expand Your Reach",
      description:
        "Make your training opportunities more visible to eligible youth in San Luis.",
      icon: TrendingUp,
      badge: "17 Barangays",
      accent: "amber"
    }
  ];

  const howItWorksSteps = [
    {
      num: "01",
      title: "Register Your Institution",
      desc: "Submit your representative and institutional information.",
      icon: Building2
    },
    {
      num: "02",
      title: "Verify Your Account",
      desc: "Wait for the SiKap administrator to review and approve your registration.",
      icon: ShieldCheck
    },
    {
      num: "03",
      title: "Manage Your Programs",
      desc: "Once approved, create and manage your available training programs.",
      icon: Layers
    },
    {
      num: "04",
      title: "Connect with Youth",
      desc: "Review applicants and manage training applications.",
      icon: Users
    }
  ];

  const partnerFeatures = [
    {
      id: "program-management",
      title: "Training Program Management",
      subtitle: "Publish & Control Cohort Capacity",
      description:
        "Create and maintain accredited technical-vocational courses with complete control over training hours, schedules, slot capacities, required documents, and venue locations.",
      bullets: [
        "Configure total slots with automatic real-time seat deduction upon enrollment",
        "Specify TESDA CPTR course codes, NC levels, and training schedules",
        "Set required documentary credentials and entry competencies"
      ],
      icon: BookOpen
    },
    {
      id: "applicant-management",
      title: "Applicant Management",
      subtitle: "Streamlined Admissions & Cohort Roster",
      description:
        "Review incoming youth applications from across all 17 barangays of San Luis in one organized queue—without paper endorsement bottlenecks.",
      bullets: [
        "Filter applicants by program cohort, barangay, or application status",
        "Approve qualified candidates or confirm official cohort enrollment in one click",
        "Export clean trainee rosters for institutional reporting"
      ],
      icon: UserCheck
    },
    {
      id: "youth-profile-review",
      title: "Youth Profile Review",
      subtitle: "Verified Background & AI Compatibility Insights",
      description:
        "Evaluate each applicant's educational attainment, existing technical skills, career goals, and Content-Based Filtering (CBF) compatibility score before making admission decisions.",
      bullets: [
        "View transparent skill-to-curriculum match percentages for every applicant",
        "Inspect verified barangay residency, age eligibility, and priority sector tags",
        "Identify motivated trainees whose career aspirations align with your course"
      ],
      icon: GraduationCap
    },
    {
      id: "status-monitoring",
      title: "Application Status Monitoring",
      subtitle: "End-to-End Cohort Tracking",
      description:
        "Monitor the real-time progress of every application from Pending Review and Approved to Enrolled, Declined, or Archived across all active cohorts.",
      bullets: [
        "Automated slot reservation prevents overbooking when cohorts reach capacity",
        "Clear stage indicators distinguish pre-enrolled approvals from enrolled trainees",
        "Instant synchronization with the KK Youth and Municipal dashboards"
      ],
      icon: Activity
    },
    {
      id: "notifications",
      title: "Notifications",
      subtitle: "Real-Time Institutional Alerts",
      description:
        "Stay informed whenever eligible KK Youth submit new training applications, when cohort slots fill up, or when administrative updates are posted.",
      bullets: [
        "Instant in-portal and push notification alerts for new youth applications",
        "Customizable notification preferences for email and browser alerts",
        "Immediate visibility into high-match candidates applying to your programs"
      ],
      icon: Bell
    }
  ];

  return (
    <div
      className="bg-[#FAFBF9] min-h-[100dvh] text-gray-800 w-full max-w-full overflow-x-clip flex flex-col"
      id="tesda-partner-landing-root"
    >
      {/* Navigation Bar */}
      <header className="relative w-full z-40 bg-white border-b border-emerald-100/80 shadow-2xs transition-all duration-200">
        <div className="max-w-[1500px] mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20 gap-2">
            {/* Left Side: SiKap Logo + Simple Grayish Label */}
            <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
              <Link
                href="/"
                className="flex items-center select-none shrink-0 cursor-pointer"
                title="SiKap Homepage"
              >
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
              </Link>
              <span className="hidden md:inline-block h-6 w-px bg-gray-200" />
              <span className="hidden md:inline-block text-xs sm:text-sm font-semibold text-gray-500 select-none">
                For Training Providers
              </span>
            </div>

            {/* Right Side: Action Buttons (For Youth & Sign In) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="bg-white hover:bg-emerald-50/80 text-[#0A6B43] border border-[#0A6B43] sm:border-2 text-[11px] sm:text-base font-bold px-2.5 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-xl shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all flex items-center justify-center cursor-pointer shrink-0 whitespace-nowrap"
                id="partner-nav-for-youth-btn"
              >
                <span>For Youth</span>
              </Link>
              <Link
                href={isAuthenticatedPartner ? "/partners/dashboard" : "/partners/login"}
                className="bg-[#0A6B43] hover:bg-[#075332] text-white border border-[#0A6B43] sm:border-2 text-[11px] sm:text-base font-bold sm:font-extrabold px-3 sm:px-6 lg:px-7 py-2 sm:py-2.5 lg:py-3 rounded-xl shadow-xs sm:shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-1.5 sm:gap-2.5 group cursor-pointer shrink-0 whitespace-nowrap"
                id="partner-nav-signin-btn"
              >
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-200 group-hover:translate-x-1.5 transition-transform duration-200 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* SECTION A – HERO */}
      <section
        id="partner-hero"
        className="relative min-h-[90vh] flex flex-col justify-between bg-[#FAFBF9] overflow-hidden"
      >
        {/* Subtle Dotted Background Pattern */}
        <div
          className="absolute inset-x-0 top-0 bottom-[15vh] pointer-events-none z-0 opacity-80"
          style={{
            backgroundImage: "url('/worn-dots.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "500px 500px"
          }}
        />

        <div className="flex-1 flex items-center justify-center w-full relative z-10 pt-8 sm:pt-12 lg:pt-16 pb-10 sm:pb-14">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-12 items-center">
              {/* Hero Left Content */}
              <div className="w-full xl:col-span-6 space-y-5 sm:space-y-7 flex flex-col items-center text-center xl:items-start xl:text-left max-w-3xl mx-auto xl:max-w-none xl:mx-0">
                <FadeIn direction="hero-adaptive" delay={0.08}>
                  <div className="inline-flex items-center gap-2 bg-emerald-100/80 border border-emerald-200/90 text-[#075332] text-[11px] sm:text-xs md:text-sm font-black px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-full uppercase tracking-wider shadow-2xs">
                    <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A6B43] shrink-0" />
                    <span>FOR TESDA PARTNERS &amp; TRAINING PROVIDERS</span>
                  </div>
                </FadeIn>

                <FadeIn direction="hero-adaptive" delay={0.16}>
                  <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[58px] font-black text-gray-900 leading-[1.08] tracking-tight">
                    <span className="block">Connect Your Training</span>
                    <span className="block">Programs with the </span>
                    <span className="text-[#0A6B43] relative inline-block mt-1">
                      Next Generation.
                      <span className="absolute left-0 -bottom-0.5 sm:-bottom-1 w-full h-3 sm:h-4 bg-emerald-100/90 -z-10 rounded-full" />
                    </span>
                  </h1>
                </FadeIn>

                <FadeIn direction="hero-adaptive" delay={0.24}>
                  <p className="text-sm sm:text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed font-medium">
                    Partner with SiKap to make technical-vocational training opportunities more accessible to young people in San Luis, Pampanga. Manage your programs, review applicants, and connect youth with opportunities that match their skills and aspirations.
                  </p>
                </FadeIn>

                <FadeIn direction="hero-adaptive" delay={0.32} className="w-full sm:w-auto">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center xl:justify-start gap-3 sm:gap-4 pt-2 w-full sm:w-auto">
                    <Link
                      href="/partners/register"
                      className="bg-[#0A6B43] hover:bg-[#075332] text-white text-sm sm:text-base md:text-lg font-black px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2.5 group cursor-pointer whitespace-nowrap"
                      id="hero-become-partner-btn"
                    >
                      <span>Become a SiKap Partner</span>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200 group-hover:translate-x-1.5 transition-transform duration-200 shrink-0" />
                    </Link>
                    <Link
                      href="/partners/login"
                      className="bg-white hover:bg-emerald-50/70 text-[#0A6B43] border border-[#0A6B43] sm:border-2 text-sm sm:text-base md:text-lg font-bold px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                      id="hero-partner-signin-btn"
                    >
                      <span>Partner Sign In</span>
                    </Link>
                  </div>
                </FadeIn>

                {/* Institutional Trust Strip */}
                <FadeIn direction="hero-adaptive" delay={0.4}>
                  <div className="pt-2 flex flex-wrap items-center justify-center xl:justify-start gap-x-6 gap-y-2 text-xs sm:text-sm font-bold text-gray-500">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0A6B43]" />
                      <span>CPTR Accredited Institutions</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>AI-Assisted Candidate Matching</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#0A6B43]" />
                      <span>San Luis, Pampanga</span>
                    </span>
                  </div>
                </FadeIn>
              </div>

              {/* Hero Right Column: Visual Mockup of the TESDA Partner Dashboard */}
              <FadeIn direction="right" delay={0.35} className="w-full xl:col-span-6 relative">
                <div className="absolute -inset-2 bg-emerald-400/15 rounded-3xl blur-2xl -z-10" />

                <div
                  className="bg-white rounded-2xl sm:rounded-3xl border border-emerald-100/90 shadow-2xl shadow-emerald-950/10 overflow-hidden"
                  aria-label="TESDA Partner Dashboard Visual Preview"
                >
                  {/* Mockup Top Window Header */}
                  <div className="bg-gradient-to-r from-[#083321] via-[#0A6B43] to-[#125838] px-4 sm:px-6 py-3.5 text-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-4.5 h-4.5 text-amber-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black tracking-tight truncate">
                            TESDA Partner Portal
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shrink-0">
                            Verified TTI
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-100/90 font-medium truncate">
                          Gonzalo Puyat School of Arts and Trades (GPSAT)
                        </p>
                      </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold bg-emerald-950/40 border border-emerald-400/30 text-emerald-200 px-2.5 py-1 rounded-lg shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live Cohort Sync
                    </span>
                  </div>

                  {/* Mockup Body */}
                  <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-[#FAFBF9]">
                    {/* Top Row: Active Training Programs & Total Applicants KPI Cards */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-emerald-100 shadow-2xs flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 block">
                            Active Training Programs
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                            6
                          </div>
                          <span className="text-[11px] font-bold text-[#0A6B43] inline-flex items-center gap-1 mt-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Open for KK Youth</span>
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50 text-[#0A6B43] shrink-0">
                          <BookOpen className="w-5 h-5" />
                        </div>
                      </div>

                      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-100 shadow-2xs flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 block">
                            Total Applicants
                          </span>
                          <div className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">
                            148
                          </div>
                          <span className="text-[11px] font-bold text-amber-700 inline-flex items-center gap-1 mt-1">
                            <Flame className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>92% Avg. Skill Match</span>
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                    </div>

                    {/* Middle Card: Program Management Preview */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-[#0A6B43]" />
                          <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                            Program Management
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          CPTR-R03-PAM-2026
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-black text-gray-900">
                              Shielded Metal Arc Welding (SMAW) NC II
                            </h4>
                            <span className="text-[10px] font-bold bg-emerald-100 text-[#075332] px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#0A6B43]" />
                              268 Hours
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#0A6B43]" />
                              TESDA GPSAT Campus
                            </span>
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              Free Tuition &amp; Toolkit
                            </span>
                          </div>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <div className="text-xs font-black text-gray-900">
                            22 / 25 <span className="text-gray-400 font-bold">Slots Filled</span>
                          </div>
                          <div className="w-full sm:w-28 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-[#0A6B43] rounded-full w-[88%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card: Recent Applications */}
                    <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-[#0A6B43]" />
                          <span className="text-xs font-black uppercase tracking-wider text-gray-800">
                            Recent Applications
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">
                          San Luis KK Youth
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {[
                          {
                            initials: "JD",
                            name: "Juan dela Cruz",
                            barangay: "Brgy. San Sebastian",
                            program: "SMAW NC II",
                            match: "94% Match",
                            status: "Pending Review",
                            statusStyle: "bg-amber-50 text-amber-800 border-amber-200"
                          },
                          {
                            initials: "MS",
                            name: "Maria Clara Santos",
                            barangay: "Brgy. Sta. Monica",
                            program: "Computer Systems Servicing NC II",
                            match: "91% Match",
                            status: "Approved",
                            statusStyle: "bg-blue-50 text-blue-800 border-blue-200"
                          },
                          {
                            initials: "CP",
                            name: "Carlo D. Pangilinan",
                            barangay: "Brgy. Sto. Tomas",
                            program: "Electrical Installation NC II",
                            match: "89% Match",
                            status: "Enrolled",
                            statusStyle: "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }
                        ].map((app, idx) => (
                          <div
                            key={idx}
                            className="py-2 first:pt-1 last:pb-0 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-[#0A6B43] font-black text-[11px] flex items-center justify-center shrink-0">
                                {app.initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-extrabold text-gray-900 truncate">
                                  {app.name}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-500 truncate">
                                  {app.barangay} • {app.program}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0A6B43] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Flame className="w-3 h-3 fill-amber-400 text-amber-500" />
                                {app.match}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${app.statusStyle}`}
                              >
                                {app.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Overlap Badge */}
                <div className="mt-3 sm:mt-0 sm:absolute sm:-bottom-5 sm:-left-5 bg-[#1C2B20] text-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl shadow-emerald-950/40 flex items-center gap-3 max-w-full sm:max-w-[330px] z-10">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-300">
                    <ShieldCheck className="w-4.5 h-4.5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs sm:text-sm font-black leading-tight text-white">
                      Verified Partner Ecosystem
                    </p>
                    <p className="text-[10px] sm:text-xs text-emerald-300 font-semibold leading-snug">
                      Direct applications from pre-profiled San Luis youth
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          </div>
        </div>

        {/* Fading Transition Area */}
        <div className="h-[10vh] w-full relative pointer-events-none z-0 shrink-0">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/worn-dots.png')",
              backgroundRepeat: "repeat",
              backgroundSize: "500px 500px",
              opacity: 0.8,
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)"
            }}
          />
        </div>
      </section>

      {/* SECTION B – WHY PARTNER WITH SIKAP? */}
      <section
        id="why-partner"
        className="py-16 sm:py-24 lg:py-28 bg-white border-y border-gray-100 relative overflow-hidden"
      >
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <FadeIn direction="up" delay={0.05}>
              <span className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-[10px] sm:text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                WHY PARTNER WITH SIKAP?
              </span>
            </FadeIn>

            <FadeIn direction="up" delay={0.12}>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Bring Your <span className="text-[#0A6B43]">Training Opportunities</span> Closer to Youth.
              </h2>
            </FadeIn>

            <FadeIn direction="up" delay={0.2}>
              <p className="text-xs sm:text-base md:text-lg text-gray-500 font-medium leading-relaxed">
                SiKap bridges accredited TVET providers with out-of-school and unemployed youth across San Luis, Pampanga through structured skills profiling and intelligent program matching.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {whyPartnerCards.map((card, idx) => {
              const IconComponent = card.icon;
              const isAmber = card.accent === "amber";
              return (
                <FadeIn
                  key={card.title}
                  direction="up"
                  delay={0.1 + idx * 0.08}
                  className="h-full"
                >
                  <div className="h-full bg-[#FAFBF9] hover:bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-7 border border-gray-200/80 hover:border-emerald-300 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                            isAmber
                              ? "bg-amber-50 text-amber-700 border border-amber-200/70"
                              : "bg-emerald-50 text-[#0A6B43] border border-emerald-200/70"
                          }`}
                        >
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            isAmber
                              ? "bg-amber-50/80 text-amber-800 border-amber-200/70"
                              : "bg-emerald-50/80 text-[#075332] border-emerald-200/70"
                          }`}
                        >
                          {card.badge}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 group-hover:text-[#0A6B43] transition-colors tracking-tight">
                        {card.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#0A6B43]">
                      <span> Institutional Portal</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION C – HOW IT WORKS */}
      <section
        id="how-it-works"
        className="py-16 sm:py-24 lg:py-28 bg-[#FAFBF9] relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-35 mix-blend-multiply"
          style={{
            backgroundImage: "url('/redox-02.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px"
          }}
        />

        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-start">
            {/* Left Column: Section Heading */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              <FadeIn direction="left" delay={0.1}>
                <span className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-[10px] sm:text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                  HOW IT WORKS
                </span>
              </FadeIn>

              <FadeIn direction="left" delay={0.18}>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                  Start Your <span className="text-[#0A6B43]">Partnership</span> with SiKap.
                </h2>
              </FadeIn>

              <FadeIn direction="left" delay={0.26}>
                <p className="text-xs sm:text-base md:text-lg text-gray-600 font-medium leading-relaxed max-w-xl">
                  A transparent, four-step onboarding workflow designed to uphold TESDA accreditation standards while connecting your programs with San Luis youth.
                </p>
              </FadeIn>

              <FadeIn direction="left" delay={0.34}>
                <div className="pt-2">
                  <Link
                    href="/partners/register"
                    className="inline-flex items-center gap-2 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl shadow-sm hover:shadow-md transition-all group"
                  >
                    <span>Register Your Institution</span>
                    <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right Column: Four-Step Process */}
            <div className="lg:col-span-7 divide-y divide-gray-200/80 border-t border-gray-200/80 bg-white/80 backdrop-blur-xs rounded-2xl sm:rounded-3xl p-4 sm:p-8 border shadow-sm">
              {howItWorksSteps.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <FadeIn
                    key={step.num}
                    direction="up"
                    delay={0.1 + i * 0.08}
                    className="py-5 sm:py-6 first:pt-2 last:pb-2 group"
                  >
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:bg-[#0A6B43] group-hover:border-[#0A6B43]">
                        <span className="text-xs sm:text-sm font-black text-[#0A6B43] transition-colors duration-200 group-hover:text-white">
                          {step.num}
                        </span>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight group-hover:text-[#0A6B43] transition-colors">
                            {step.title}
                          </h3>
                          <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#0A6B43] transition-colors shrink-0" />
                        </div>
                        <p className="text-xs sm:text-base text-gray-600 font-medium leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D – PARTNER FEATURES */}
      <section
        id="partner-features"
        className="py-16 sm:py-24 lg:py-28 bg-white border-t border-gray-100 relative overflow-hidden"
      >
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12 sm:mb-16">
            <FadeIn direction="up" delay={0.05}>
              <span className="inline-flex items-center bg-[#D1FAE5] border border-[#A7F3D0] text-[#0A4D30] text-[10px] sm:text-xs md:text-sm font-black px-4 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                PARTNER FEATURES
              </span>
            </FadeIn>

            <FadeIn direction="up" delay={0.12}>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                Purpose-Built Tools for <span className="text-[#0A6B43]">Training Providers</span>.
              </h2>
            </FadeIn>

            <FadeIn direction="up" delay={0.18}>
              <p className="text-xs sm:text-base md:text-lg text-gray-500 font-medium leading-relaxed">
                Approved TESDA representatives gain access to a dedicated institutional workspace designed to simplify program publication, trainee evaluation, and cohort management.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Side: Interactive Feature Selector Tabs */}
            <div className="lg:col-span-5 space-y-3">
              {partnerFeatures.map((feat, idx) => {
                const FeatIcon = feat.icon;
                const isSelected = activeFeatureIndex === idx;
                return (
                  <button
                    key={feat.id}
                    type="button"
                    onClick={() => setActiveFeatureIndex(idx)}
                    className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-[#0A4D30] text-white border-[#0A4D30] shadow-lg"
                        : "bg-[#FAFBF9] hover:bg-emerald-50/50 text-gray-800 border-gray-200/80 hover:border-emerald-200"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-white/15 text-amber-300 border border-white/20"
                          : "bg-white text-[#0A6B43] border border-emerald-100 shadow-2xs"
                      }`}
                    >
                      <FeatIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className={`text-sm sm:text-base font-extrabold tracking-tight ${
                            isSelected ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {feat.title}
                        </h3>
                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform ${
                            isSelected ? "text-amber-300 translate-x-0.5" : "text-gray-400"
                          }`}
                        />
                      </div>
                      <p
                        className={`text-xs mt-1 leading-relaxed font-medium ${
                          isSelected ? "text-emerald-100/90" : "text-gray-500"
                        }`}
                      >
                        {feat.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Side: Feature Detail + Visual Dashboard Illustration */}
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={partnerFeatures[activeFeatureIndex].id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="bg-[#FAFBF9] rounded-3xl border border-emerald-100 p-5 sm:p-8 shadow-xl space-y-6"
                >
                  {/* Top Narrative */}
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#0A6B43] bg-emerald-100/80 px-3 py-1 rounded-full">
                      <span>Capability 0{activeFeatureIndex + 1}</span>
                      <span>•</span>
                      <span>{partnerFeatures[activeFeatureIndex].subtitle}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                      {partnerFeatures[activeFeatureIndex].title}
                    </h3>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                      {partnerFeatures[activeFeatureIndex].description}
                    </p>
                  </div>

                  {/* Key Capability Bullets */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {partnerFeatures[activeFeatureIndex].bullets.map((bullet, bIdx) => (
                      <div
                        key={bIdx}
                        className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-gray-200/70 text-xs sm:text-sm font-semibold text-gray-700"
                      >
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>

                  {/* Contextual Dashboard Illustration Card */}
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <span className="text-[11px] font-black uppercase tracking-wider text-gray-500">
                        Partner Workspace Preview — {partnerFeatures[activeFeatureIndex].title}
                      </span>
                      <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Live Module
                      </span>
                    </div>

                    {activeFeatureIndex === 0 && (
                      <div className="space-y-2.5">
                        {[
                          {
                            title: "Shielded Metal Arc Welding (SMAW) NC II",
                            code: "CPTR-R03-2026-014",
                            slots: "22 / 25 Enrolled",
                            hours: "268 Hrs • Free Tuition"
                          },
                          {
                            title: "Computer Systems Servicing (CSS) NC II",
                            code: "CPTR-R03-2026-019",
                            slots: "18 / 25 Enrolled",
                            hours: "280 Hrs • Free Tuition"
                          }
                        ].map((prog, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                                {prog.title}
                              </p>
                              <p className="text-[11px] font-semibold text-gray-500">
                                {prog.code} • {prog.hours}
                              </p>
                            </div>
                            <span className="text-xs font-black text-[#0A6B43] bg-white px-3 py-1 rounded-lg border border-emerald-200 self-start sm:self-center">
                              {prog.slots}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeFeatureIndex === 1 && (
                      <div className="space-y-2.5">
                        <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs sm:text-sm font-extrabold text-gray-900">
                              Juan dela Cruz • Brgy. San Sebastian
                            </p>
                            <p className="text-[11px] font-semibold text-gray-500">
                              Applied for SMAW NC II • 94% Compatibility Match
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-[#0A6B43] text-white text-[11px] font-bold">
                              Approve Applicant
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-[11px] font-bold">
                              View Profile
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFeatureIndex === 2 && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#075332]">
                            Candidate Skill &amp; Goal Alignment
                          </span>
                          <span className="text-xs font-black text-[#0A6B43] bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                            94% Match
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium leading-relaxed">
                          Verified Skills: Metal Fabrication, Basic Blueprint Reading, Benchwork • Educational Attainment: Senior High School Graduate • Goal: Certified Industrial Welder
                        </p>
                      </div>
                    )}

                    {activeFeatureIndex === 3 && (
                      <div className="grid grid-cols-3 gap-2.5 text-center">
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/70">
                          <div className="text-lg font-black text-amber-800">14</div>
                          <div className="text-[10px] font-bold uppercase text-amber-700">
                            Pending Review
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/70">
                          <div className="text-lg font-black text-blue-800">19</div>
                          <div className="text-[10px] font-bold uppercase text-blue-700">
                            Approved
                          </div>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70">
                          <div className="text-lg font-black text-[#0A6B43]">115</div>
                          <div className="text-[10px] font-bold uppercase text-[#075332]">
                            Enrolled
                          </div>
                        </div>
                      </div>
                    )}

                    {activeFeatureIndex === 4 && (
                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200/80 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0A6B43] flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-extrabold text-gray-900">
                              New High-Match Applicant (94% Match)
                            </p>
                            <p className="text-[11px] font-medium text-gray-500 truncate">
                              Juan dela Cruz applied to Shielded Metal Arc Welding (SMAW) NC II
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-[#0A6B43] shrink-0">
                            Just now
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E – CALL TO ACTION */}
      <section
        id="partner-cta"
        className="pt-8 pb-14 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-32 bg-[#FAFBF9] relative overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: "url('/redox-02.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "200px 200px"
          }}
        />
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn
            duration={0.4}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A4D30] border border-emerald-800/60 shadow-2xl px-5 py-8 sm:px-10 sm:py-14 md:px-12 md:py-16 text-left"
          >
            <AnimatedGridBackground />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(52,211,153,0.15),transparent_70%)] pointer-events-none z-0" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8">
              <div className="space-y-3 sm:space-y-5 max-w-2xl">
                <FadeIn direction="left" delay={0.1}>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                    Ready to <span className="text-[#F5A623]">Partner</span> with <span className="text-[#F5A623]">SiKap</span>?
                  </h2>
                </FadeIn>

                <FadeIn direction="left" delay={0.2}>
                  <p className="text-xs sm:text-lg md:text-xl text-emerald-100/85 font-normal leading-relaxed">
                    Join SiKap in connecting the youth of San Luis with meaningful technical-vocational training opportunities.
                  </p>
                </FadeIn>
              </div>

              <FadeIn
                direction="right"
                delay={0.3}
                className="flex flex-col sm:flex-row items-stretch sm:items-center justify-start lg:justify-end gap-3 sm:gap-4 shrink-0"
              >
                <Link
                  href="/partners/register"
                  className="bg-[#F5A623] hover:bg-[#E59613] text-white font-black text-xs sm:text-base md:text-lg px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all inline-flex items-center justify-center gap-2.5 group cursor-pointer whitespace-nowrap"
                >
                  <span>Become a SiKap Partner</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-amber-100 group-hover:translate-x-1.5 transition-transform duration-200 shrink-0" />
                </Link>
                <Link
                  href="/partners/login"
                  className="bg-emerald-900/50 hover:bg-emerald-900/80 text-white border border-emerald-500/30 hover:border-emerald-500/50 font-bold text-xs sm:text-base md:text-lg px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>Already have an account? Sign In</span>
                </Link>
              </FadeIn>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* SECTION F – FOOTER */}
      <footer className="bg-[#082D21] border-t border-emerald-950/60 pt-14 sm:pt-16 pb-8 mt-auto overflow-hidden">
        <FadeIn className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-4 text-center md:text-left">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-3.5 sm:gap-4 max-w-xl">
              <Link href="/" className="select-none inline-flex items-center justify-center">
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
              </Link>
              <p className="text-xs sm:text-sm text-gray-400 font-medium text-center md:text-left max-w-xl leading-relaxed">
                SiKap partners with TESDA Technology Institutions and accredited TVET providers to connect young people in San Luis, Pampanga with verified technical-vocational training programs and sustainable livelihood pathways.
              </p>
            </div>

            {/* Footer Navigation Columns */}
            <div className="flex flex-row flex-wrap items-start justify-center md:justify-end gap-8 sm:gap-10 lg:gap-16 pt-2 shrink-0">
              {/* Column 1: Partner Portal */}
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  TESDA Partners
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
                  <Link href="/partners" className="hover:text-white transition-colors">
                    For TESDA Partners
                  </Link>
                  <Link href="/partners/register" className="hover:text-white transition-colors">
                    Partner Registration
                  </Link>
                  <Link href="/partners/login" className="hover:text-white transition-colors">
                    Partner Sign In
                  </Link>
                </div>
              </div>

              {/* Column 2: Platform & About */}
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Navigation
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
                  <Link href="/" className="hover:text-white transition-colors">
                    Home (KK Youth)
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleScrollToSection("why-partner")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact / About SiKap
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollToSection("how-it-works")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    How Partnership Works
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollToSection("partner-features")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Partner Features
                  </button>
                </div>
              </div>

              {/* Column 3: Legal */}
              <div className="flex flex-col items-start gap-2 sm:gap-2.5 text-left">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  Legal
                </span>
                <div className="flex flex-col items-start gap-2 text-xs font-medium text-gray-400">
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Terms &amp; Conditions
                  </Link>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
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
        </FadeIn>
      </footer>

      {/* Floating Scroll to Top Button */}
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
    </div>
  );
};

