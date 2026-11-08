"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home, Target, Award, User, Bell, Sparkles, Plus, CheckCircle,
  AlertTriangle, Phone, Mail, MapPin, Briefcase, Trash2, X, Globe, MessageSquare, LogOut,
  Calendar, CalendarDays, Clock, XCircle, Megaphone, Lock, Eye, EyeOff, Copy, RefreshCw, Edit, ShieldCheck, ShieldAlert, Send,

  BookmarkCheck, ChevronLeft, ChevronRight, Check, FileCheck, ArrowRight, ExternalLink, Bookmark, GraduationCap, Heart, Shield,
  Tag, Compass, FileText, Layers, Activity, Menu, Loader2, BookOpen, Maximize2,

  ClipboardList, Timer, Building2, Landmark, UserCheck, Coins, Users,
  TrendingUp, Handshake, Store, Gift, Wrench, AlertCircle, School, Zap, Star, Camera, Upload, Flame,
  Search, Filter, Settings
} from "lucide-react";
import { formatContactNumber, isProgramEnded, calculateAge, spellOutGender, parseVerificationIdImages } from "../lib/utils";
import { YouthProfile, TESDAProgram, SKAnnouncement, YouthScreen, ReferralPipelineItem, EDUCATIONAL_ATTAINMENT_OPTIONS, normalizeEducationalAttainment, DEFAULT_TESDA_REQUIREMENTS } from "../types";
import { FlameMatchScore, GeminiExplanationBox, PathwayTimeline, SikapLogo, NotificationBellButton, SiKapDatePicker } from "./ReusableComponents";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { motion, AnimatePresence, useInView, useAnimation } from "motion/react";
import { CustomSelect } from "./CustomSelect";
import { NotificationSettingsCard } from "./NotificationSettingsCard";
import { SettingsSidebarNav } from "./SettingsShared";
import { calculateContentBasedMatchScore, calculateDetailedCBFMatch, rankProgramsForYouth, getSuggestedSkillsForYouth, formatProgramTime, formatTrainingDays, formatProgramTimeslot, getProgramFullSchedule, formatProgramDate, formatProgramDateRange, getCBFMatchCategory, identifyTopMatchProgramIds, CBFMatchCategory } from "../lib/cbf-matcher";
import { normalizeSkills } from "../lib/cbf-normalization";
import { GeminiLongTermCareerPlan, getFallbackTagalogCareerPlan, getFallbackPersonalizedRationale, getFallbackPersonalized3StepPathway } from "../lib/gemini";
import { getBarangayZoneOptions, getBarangayZoneTypeLabel } from "../lib/barangay-data";
import { broadcastDataChange } from "../lib/realtime-sync";
import { validatePassword } from "../lib/password-policy";
import { TrainingVenueMapModal } from "./TrainingVenueMapModal";
import { extractLocationDisplay, resolveProgramCoordinates, extractLocationCoords, getMapNavigationLinks } from "../lib/training-venues";
import { CATEGORIES } from "../lib/cbf-taxonomy-data";

// --- KK PORTAL REAL-TIME SCROLL VELOCITY TRACKER ---
let portalScrollVelocity = 0;
let lastPortalScrollPos = 0;
let lastPortalScrollTime = typeof performance !== "undefined" ? performance.now() : 0;

export const updatePortalScrollVelocity = (currentPos: number) => {
  const currentTime = performance.now();
  const dt = currentTime - lastPortalScrollTime;
  const dy = currentPos - lastPortalScrollPos;

  if (dt > 0) {
    const instantVelocity = Math.abs(dy / dt); // px per ms
    portalScrollVelocity = Math.max(portalScrollVelocity * 0.6 + instantVelocity * 0.4, instantVelocity);
  }

  lastPortalScrollPos = currentPos;
  lastPortalScrollTime = currentTime;
};

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      updatePortalScrollVelocity(window.scrollY);
    },
    { passive: true }
  );

  setInterval(() => {
    portalScrollVelocity *= 0.75;
    if (portalScrollVelocity < 0.05) portalScrollVelocity = 0;
  }, 100);
}

export const getPortalSpeedFactor = () => {
  const maxVelocity = 3.5; // High speed flick/scroll
  const normalized = Math.min(portalScrollVelocity / maxVelocity, 1);
  // High scroll velocity -> faster appearance (down to 0.35x duration)
  // Normal / gentle scroll -> full smooth duration (1.0x duration)
  const factor = 1.0 - normalized * 0.65;
  return Math.max(0.35, Math.min(1.0, factor));
};

export const formatSkillTitleCase = (str: string): string => {
  if (!str) return "";
  return str
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      if (/^(nc|i|ii|iii|iv|v|vi|tesda|ict|it|css|smaw)$/i.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

export const ScrollRevealContext = React.createContext<boolean>(false);
export const useScrollReveal = () => React.useContext(ScrollRevealContext);

export const PortalScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  scale?: boolean;
}> = ({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  yOffset = 24,
  scale = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.15,
  });
  const controls = useAnimation();
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    if (!isInView) return;

    setHasEntered(true);
    const speedFactor = getPortalSpeedFactor();
    controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: Math.max(0.3, duration * speedFactor),
        delay: Math.max(0, delay * speedFactor),
        ease: [0.16, 1, 0.3, 1], // Smooth Apple-style cubic bezier ease-out
      },
    });
  }, [isInView, controls, delay, duration]);

  return (
    <ScrollRevealContext.Provider value={hasEntered}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: yOffset, scale: scale ? 0.97 : 1 }}
        animate={controls}
        className={className}
      >
        {children}
      </motion.div>
    </ScrollRevealContext.Provider>
  );
};

/* --- ENROLLED ACTIVE PROGRAM MINI-MAP --- */
export const EnrolledProgramMiniMap: React.FC<{
  program?: TESDAProgram | null;
  locationString?: string;
  onOpenFullMap: () => void;
}> = ({ program, locationString, onOpenFullMap }) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  const rawLocation = program?.location || locationString;
  const cleanDisplayName = extractLocationDisplay(rawLocation) || "San Luis, Pampanga";
  const coords = resolveProgramCoordinates(rawLocation, program?.latitude, program?.longitude);
  const navLinks = getMapNavigationLinks(coords.lat, coords.lng, cleanDisplayName);

  useEffect(() => {
    let isSubscribed = true;

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default;
        if (!isSubscribed || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = L.map(mapContainerRef.current, {
          center: [coords.lat, coords.lng],
          zoom: 14,
          zoomControl: false,
          attributionControl: false,
          dragging: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        const customPinIcon = L.divIcon({
          className: "enrolled-mini-pin-icon",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-full">
              <div class="w-9 h-9 rounded-2xl bg-[#082D21] text-white flex items-center justify-center shadow-xl border-2 border-white ring-4 ring-[#082D21]/20">
                <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        L.marker([coords.lat, coords.lng], { icon: customPinIcon }).addTo(map);

        mapInstanceRef.current = map;
      } catch (err) {
        console.error("Error initializing enrolled program mini map:", err);
      }
    };

    initMap();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords.lat, coords.lng]);

  return (
    <div className="isolate relative z-0 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full shadow-2xs">
      {/* Map Canvas with Floating Elements & Scrollable Zoom */}
      <div className="relative flex-1 min-h-[160px] w-full bg-slate-100 overflow-hidden">
        {/* Floating Pill: Training Venue Map */}
        <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 text-gray-800 text-[10px] font-extrabold uppercase tracking-wider shadow-md border border-gray-200/80 backdrop-blur-xs">
            <MapPin className="w-3 h-3 text-[#0A6B43] shrink-0" />
            <span>Training Venue Map</span>
          </span>
        </div>

        {/* Floating Icon Button: Expand Map */}
        <button
          type="button"
          onClick={onOpenFullMap}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/95 text-gray-700 hover:text-[#0A6B43] hover:bg-white flex items-center justify-center shadow-md border border-gray-200/80 transition-all cursor-pointer hover:scale-110 active:scale-95"
          title="Expand Map"
          aria-label="Expand Map"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Leaflet Container (Scrollable, draggable zoom) */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} />
      </div>

      {/* Footer: Expand Map, Google Maps, and Waze located on the right part */}
      <div className="py-3 sm:py-3.5 px-4 bg-white border-t border-gray-200 flex items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs font-semibold text-gray-600 shrink-0 leading-normal">
        <button
          type="button"
          onClick={onOpenFullMap}
          className="inline-flex items-center gap-1.5 hover:text-[#0A6B43] hover:underline cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95"
          title="Expand Map"
        >
          <span>Expand Map</span>
          <Maximize2 className="w-3 h-3" />
        </button>
        <span className="text-gray-300">•</span>
        <a
          href={navLinks.googleMaps}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 hover:text-[#0A6B43] hover:underline transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span>Google Maps</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <span className="text-gray-300">•</span>
        <a
          href={navLinks.waze}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 hover:text-[#0A6B43] hover:underline transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span>Waze</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  );
};

/* --- SCROLL-REACTIVE DASHBOARD CARD COMPONENTS --- */

export const DashboardDonutVisual: React.FC<{
  matchDistribution: {
    total: number;
    excellent: number;
    strong: number;
    moderate: number;
    low: number;
    pctExcellent: number;
    pctStrong: number;
    pctModerate: number;
    pctLow: number;
    excellentProgram?: { id: string; title: string } | null;
    strongProgram?: { id: string; title: string } | null;
    moderateProgram?: { id: string; title: string } | null;
    lowProgram?: { id: string; title: string } | null;
  };
  hoveredSlice: number | null;
  setHoveredSlice: (idx: number | null) => void;
  onProgramClick?: (progId: string) => void;
}> = ({ matchDistribution, hoveredSlice, setHoveredSlice, onProgramClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [donutProgress, setDonutProgress] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Wait until distribution data is calculated and ready
    if (!matchDistribution || matchDistribution.total <= 0) return;
    if (hasAnimatedRef.current) return;

    let animationFrameId: number;
    let observer: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;
      setHasStarted(true);

      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      setDonutProgress(0);
      let startTime: number | null = null;
      const duration = 1600; // 1.6s smooth cubic ease-out

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t = Math.min(1, elapsed / duration);
        const p = 1 - Math.pow(1 - t, 3);
        setDonutProgress(p);

        if (t < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setDonutProgress(1);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    // IntersectionObserver to start as soon as it enters viewport
    const el = containerRef.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            startAnimation();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(el);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [matchDistribution?.total]);

  // Center text counting animation for total matches only
  const animatedTotalMatches = Math.round((matchDistribution.total || 0) * donutProgress);

  const donutSlices = [
    { label: "Excellent Match", count: matchDistribution.excellent, pct: matchDistribution.pctExcellent, color: "#0A6B43", prog: matchDistribution.excellentProgram },
    { label: "Strong Match", count: matchDistribution.strong, pct: matchDistribution.pctStrong, color: "#10b981", prog: matchDistribution.strongProgram },
    { label: "Moderate Match", count: matchDistribution.moderate, pct: matchDistribution.pctModerate, color: "#f59e0b", prog: matchDistribution.moderateProgram },
    { label: "Low Match", count: matchDistribution.low, pct: matchDistribution.pctLow, color: "#94a3b8", prog: matchDistribution.lowProgram },
  ];
  const R = 48;
  const C = 2 * Math.PI * R; // ~301.59
  const total = matchDistribution.total || 1;
  let accumulated = 0;

  return (
    <div ref={containerRef} className="flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-8 lg:gap-14 xl:gap-16 py-2 sm:py-3 lg:py-6 px-2">
      {/* Donut Chart SVG */}
      <div className="relative w-36 h-36 sm:w-36 sm:h-36 lg:w-44 lg:h-44 shrink-0 flex items-center justify-center">
        <svg className="w-36 h-36 sm:w-36 sm:h-36 lg:w-44 lg:h-44 -rotate-90 transform" viewBox="0 0 130 130">
          {/* Base track ring */}
          <circle cx="65" cy="65" r={R} fill="none" stroke="#F1F5F9" strokeWidth="18" />
          {matchDistribution.total > 0 && donutSlices.map((s, idx) => {
            if (s.count <= 0) return null;
            const fullSliceLen = (s.count / total) * C;
            const sliceLen = fullSliceLen * donutProgress;
            const strokeDash = `${sliceLen} ${C - sliceLen}`;
            const offset = -accumulated;
            accumulated += sliceLen;
            const isHovered = hoveredSlice === idx;

            return (
              <circle
                key={idx}
                cx="65"
                cy="65"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={isHovered ? 21 : 18}
                strokeDasharray={strokeDash}
                strokeDashoffset={offset}
                onMouseEnter={() => setHoveredSlice(idx)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => {
                  if (s.count > 0 && s.prog?.id && onProgramClick) {
                    onProgramClick(s.prog.id);
                  }
                }}
                className={`transition-[stroke-width] duration-150 ${s.count > 0 ? "cursor-pointer" : "cursor-default"}`}
              />
            );
          })}
        </svg>

        {/* Center Text inside Donut: Original count at rest (with counting animation for total matches only), only percentage on hover */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
          {hoveredSlice !== null && donutSlices[hoveredSlice] ? (
            <span
              className="text-base sm:text-lg lg:text-xl font-bold leading-none animate-in fade-in zoom-in-95 duration-150"
              style={{
                color: donutSlices[hoveredSlice].color
              }}
            >
              {donutSlices[hoveredSlice].pct}%
            </span>
          ) : (
            <div className="flex flex-col items-center justify-center animate-in fade-in duration-150">
              <span className="text-xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-none tabular-nums">
                {animatedTotalMatches}
              </span>
              <span className="text-[9.5px] sm:text-[11px] lg:text-xs text-gray-500 font-normal leading-tight mt-0.5 sm:mt-1 lg:mt-1.5 whitespace-nowrap">
                Total matches
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Clean Legend */}
      <div className="w-full sm:w-auto min-w-[180px] sm:min-w-[200px] lg:min-w-[250px] space-y-1.5 lg:space-y-2.5">
        {donutSlices.map((s, idx) => {
          const isHovered = hoveredSlice === idx;
          const hasResults = s.count > 0;
          return (
            <div
              key={s.label}
              onMouseEnter={() => setHoveredSlice(idx)}
              onMouseLeave={() => setHoveredSlice(null)}
              onClick={() => {
                if (hasResults && s.prog?.id && onProgramClick) {
                  onProgramClick(s.prog.id);
                }
              }}
              title={
                hasResults
                  ? `Click to view ${s.prog?.title ? `"${s.prog.title}"` : "matched program"}`
                  : `${s.label}: 0 programs`
              }
              style={{
                animationDelay: hasStarted ? `${180 + idx * 120}ms` : "0ms",
                animationFillMode: "both"
              }}
              className={`flex items-center justify-between gap-4 sm:gap-8 lg:gap-10 py-1.5 px-3 lg:py-2.5 lg:px-6 lg:-mx-4 rounded-xl lg:rounded-full transition-all ${
                hasStarted ? "animate-legend-pill" : "opacity-0"
              } ${
                hasResults ? "cursor-pointer active:scale-98" : "cursor-default"
              } ${
                isHovered
                  ? "bg-gray-100 shadow-2xs scale-[1.02]"
                  : "hover:bg-gray-50/70"
              }`}
            >
              <div className="flex items-center gap-2.5 lg:gap-3">
                <span
                  className={`w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 rounded-[3px] shrink-0 transition-transform ${isHovered ? "scale-125 shadow-xs" : ""}`}
                  style={{ backgroundColor: s.color }}
                />
                <span className={`text-xs lg:text-sm ${isHovered ? "font-bold text-gray-950" : "font-medium text-gray-700 lg:text-gray-800"}`}>
                  {s.label}
                </span>
              </div>
              <span className={`text-xs lg:text-sm ${isHovered ? "font-extrabold text-gray-950 scale-110" : "font-semibold text-gray-900"}`}>
                {s.count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardRecommendedProgramsList: React.FC<{
  topMatches: Array<{ program: TESDAProgram; matchScore: number }>;
  onProgramClick: (progId: string) => void;
}> = ({ topMatches, onProgramClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [barProgress, setBarProgress] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    // Wait until topMatches has items
    if (!topMatches || topMatches.length === 0) return;
    if (hasAnimatedRef.current) return;

    let animationFrameId: number;
    let observer: IntersectionObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      setBarProgress(0);
      let startTime: number | null = null;
      const duration = 1600; // 1.6s smooth cubic ease-out

      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const t = Math.min(1, elapsed / duration);
        const p = 1 - Math.pow(1 - t, 3);
        setBarProgress(p);

        if (t < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setBarProgress(1);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    };

    const el = containerRef.current;
    if (el && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            startAnimation();
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(el);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (observer) observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [topMatches?.length]);

  const getBarClasses = (s: number) => {
    if (s >= 90) return "bg-[#0A6B43] group-hover:bg-[#075332]";
    if (s >= 75) return "bg-emerald-500 group-hover:bg-emerald-600";
    if (s >= 50) return "bg-amber-500 group-hover:bg-amber-600";
    return "bg-slate-400 group-hover:bg-slate-500";
  };

  return (
    <div ref={containerRef} className="space-y-4 py-2">
      {topMatches.map(({ program: prog, matchScore: score }) => {
        // Starts with the percentage counting up in sync with the bar width animation
        const calculatedScore = Math.round(score * barProgress);
        const animatedBarWidth = Math.min(100, Math.max(0, score * barProgress));

        return (
          <div
            key={prog.id}
            onClick={() => onProgramClick(prog.id)}
            className="group cursor-pointer py-2 -mx-2 px-2.5 rounded-xl transition-all hover:bg-gray-50/70"
            title="Click to view this program in Matched Programs"
          >
            <div className="grid grid-cols-[165px_1fr_40px] sm:grid-cols-[250px_1fr_44px] items-center gap-3 sm:gap-6">
              {/* Left: Program Title */}
              <span
                className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#0A6B43] transition-colors break-words leading-snug pr-2"
                title={prog.title}
              >
                {prog.title}
              </span>

              {/* Center: Progress bar */}
              <div className="w-full h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden border border-gray-200/60">
                <div
                  className={`h-full rounded-full transition-colors duration-200 ${getBarClasses(score)}`}
                  style={{ width: `${animatedBarWidth}%` }}
                />
              </div>

              {/* Right: Calculated Percentage Number Counting Up */}
              <span className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#0A6B43] transition-colors text-right shrink-0 tabular-nums">
                {calculatedScore}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DashboardRegisteredSkillsList: React.FC<{
  skills: string[];
  isUnverified: boolean;
  onRemoveSkill: (skill: string) => void;
}> = ({ skills, isUnverified, onRemoveSkill }) => {
  const isRevealed = useScrollReveal();

  return (
    <div className="flex flex-wrap gap-2 content-start flex-1 min-h-[90px] mb-3 sm:mb-0">
      {skills.map((s, idx) => (
        <span
          key={s}
          style={{
            animationDelay: isRevealed ? `${180 + idx * 120}ms` : "0ms",
            animationFillMode: "both"
          }}
          className={`${
            isRevealed ? "animate-pill-pop" : "opacity-0"
          } bg-amber-50/90 text-amber-950 text-xs font-semibold px-3.5 py-1 rounded-full border border-amber-200/90 flex items-center gap-1.5 shadow-2xs hover:bg-amber-100/70 hover:scale-105 transition-all`}
        >
          <span>{formatSkillTitleCase(s)}</span>
          <button
            onClick={() => onRemoveSkill(s)}
            disabled={isUnverified}
            title={`Remove ${s}`}
            className={`w-3.5 h-3.5 flex items-center justify-center rounded-full text-xs font-black transition-colors ${
              isUnverified ? "text-amber-400 cursor-not-allowed" : "text-amber-700 hover:bg-red-100 hover:text-red-700 cursor-pointer"
            }`}
          >
            &times;
          </button>
        </span>
      ))}
    </div>
  );
};

const DashboardCompletedStepIcon: React.FC<{ num: number }> = ({ num }) => {
  if (num === 1) {
    return (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" fill="white" stroke="white" strokeWidth="2" />
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2z" fill="white" stroke="white" strokeWidth="2" strokeLinejoin="round" />
        <polyline points="16 11 18 13 22 9" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (num === 2) {
    return (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" fill="white" stroke="white" />
        <path d="M14 2v4a2 2 0 0 0 2 2h4" fill="#0A6B43" stroke="#0A6B43" />
        <path d="m9 15 2 2 4-4" fill="none" stroke="#0A6B43" strokeWidth="2.5" />
      </svg>
    );
  }
  if (num === 3) {
    return (
      <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" fill="white" stroke="white" />
        <path d="M22 10v6" stroke="white" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" fill="white" stroke="white" />
        <path d="m9.5 14.5 1.8 1.8 3.5-3.5" fill="none" stroke="#0A6B43" strokeWidth="2.5" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" fill="white" stroke="white" />
      <circle cx="12" cy="8" r="6" fill="white" stroke="white" />
      <path d="m9.5 8 1.8 1.8 3.5-3.5" fill="none" stroke="#0A6B43" strokeWidth="2.5" />
    </svg>
  );
};

export const DashboardLivelihoodPathway: React.FC<{
  steps: Array<{ num: number; label: string; status: "done" | "current" | "not_done"; statusText?: string }>;
  onNavigateToPathway?: (stepNum?: number) => void;
}> = ({ steps, onNavigateToPathway }) => {
  const isRevealed = useScrollReveal();

  return (
    <div className="py-5 px-1 sm:px-2">
      <div className="flex w-full items-start">
        {steps.map((st, idx) => {
          const isDone = st.status === "done";
          const isCurrent = st.status === "current";

          const StepIcon = st.num === 1 ? UserCheck : st.num === 2 ? FileCheck : st.num === 3 ? GraduationCap : TrendingUp;
          const nextStep = steps[idx + 1];
          const connectorWidth: "100%" | "50%" | "0%" =
            isDone && nextStep?.status === "done"
              ? "100%"
              : isDone && nextStep?.status === "current"
              ? "100%"
              : isDone
              ? "50%"
              : "0%";

          return (
            <div
              key={st.num}
              onClick={() => onNavigateToPathway?.(st.num)}
              title="Click to view Livelihood Pathway"
              className={`flex-1 relative flex flex-col items-center text-center px-1 sm:px-2 min-w-0 ${
                onNavigateToPathway ? "cursor-pointer group" : ""
              }`}
            >
              {/* Connecting Gray Line with Green Progress Fill */}
              {idx < steps.length - 1 && (
                <div className="absolute top-[18px] sm:top-5 -translate-y-1/2 left-1/2 w-full h-[3px] sm:h-[3.5px] bg-gray-300 rounded-full z-0 overflow-hidden pointer-events-none">
                  <div
                    className={`h-full bg-[#0A6B43] rounded-full ${
                      !isRevealed
                        ? "w-0"
                        : connectorWidth === "100%"
                        ? "animate-pathway-line-full"
                        : connectorWidth === "50%"
                        ? "animate-pathway-line-half"
                        : ""
                    }`}
                    style={{
                      width: !isRevealed || connectorWidth === "0%" ? "0%" : undefined,
                      animationDelay: isRevealed ? `${1200 + idx * 800}ms` : "0ms",
                      animationFillMode: "both"
                    }}
                  />
                </div>
              )}

              {/* Node Circle Header */}
              <div
                style={{
                  animationDelay: isRevealed ? `${180 + idx * 160}ms` : "0ms",
                  animationFillMode: "both"
                }}
                className={`${isRevealed ? "animate-pathway-circle" : "opacity-0"} relative z-10 flex items-center justify-center`}
              >
                {isDone ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0A6B43] text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 hover:scale-110 active:scale-95 relative">
                    <DashboardCompletedStepIcon num={st.num} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white border border-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  </div>
                ) : isCurrent ? (
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping-gentle absolute inline-flex h-full w-full rounded-xl bg-orange-300 pointer-events-none" />
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-orange-500 flex items-center justify-center bg-orange-50 text-orange-600 shadow-sm relative z-10 transition-transform group-hover:scale-110 hover:scale-110 active:scale-95">
                      <StepIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-orange-600" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white border border-white flex items-center justify-center shadow-xs">
                        <Clock className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center transition-transform group-hover:scale-110 hover:scale-110 active:scale-95 relative">
                    <StepIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-200 text-gray-500 border border-white flex items-center justify-center">
                      <Lock className="w-2 h-2" />
                    </span>
                  </div>
                )}
              </div>

              {/* Centered Text Content */}
              <div
                style={{
                  animationDelay: isRevealed ? `${700 + idx * 160}ms` : "0ms",
                  animationFillMode: "both"
                }}
                className={`${isRevealed ? "animate-pathway-text" : "opacity-0"} pt-3 sm:pt-3.5 space-y-0.5 w-full flex flex-col items-center text-center`}
              >
                <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest block group-hover:text-emerald-700 transition-colors">
                  STEP {st.num}
                </span>
                <h5 className="font-extrabold text-xs sm:text-sm text-gray-900 leading-snug group-hover:text-[#0A6B43] transition-colors">
                  {st.label}
                </h5>
                <p
                  className={`text-[10px] sm:text-[11px] font-semibold pt-0.5 ${
                    isDone
                      ? "text-[#0A6B43]"
                      : isCurrent
                      ? "text-orange-600"
                      : "text-gray-400 font-medium"
                  }`}
                >
                  {st.statusText || (isDone ? "Completed" : isCurrent ? "In Progress" : "Pending")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardQuickActionsList: React.FC<{
  actions: Array<{ label: string; onClick: () => void }>;
}> = ({ actions }) => {
  const isRevealed = useScrollReveal();

  return (
    <div className="grid grid-cols-1 gap-3">
      {actions.map((action, idx) => (
        <button
          key={action.label}
          onClick={action.onClick}
          style={{
            animationDelay: isRevealed ? `${180 + idx * 140}ms` : "0ms",
            animationFillMode: "both",
          }}
          className={`${
            isRevealed ? "animate-quick-action" : "opacity-0"
          } w-full p-3.5 rounded-xl border border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/20 active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer text-left`}
        >
          <span className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-[#0A6B43] inline-block origin-left transition-all duration-200 group-hover:scale-105 group-hover:translate-x-0.5">
            {action.label}
          </span>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0A6B43] group-hover:translate-x-1 transition-all shrink-0" />
        </button>
      ))}
    </div>
  );
};

interface KKYouthPortalProps {
  youthProfile: YouthProfile;
  setYouthProfiles: React.Dispatch<React.SetStateAction<YouthProfile[]>>;
  programs: TESDAProgram[];
  setPrograms?: React.Dispatch<React.SetStateAction<TESDAProgram[]>>;
  announcements: SKAnnouncement[];
  onLogout: () => void;
  addToast: (msg: string, type: "success" | "error" | "info") => void;
  referrals?: ReferralPipelineItem[];
  setReferrals?: React.Dispatch<React.SetStateAction<ReferralPipelineItem[]>>;
  currentUser?: any;
}

export interface StoredCareerRoadmap extends GeminiLongTermCareerPlan {
  id: string;
  isPrimary: boolean;
}

export const KKYouthPortal: React.FC<KKYouthPortalProps> = ({
  youthProfile,
  setYouthProfiles,
  programs,
  setPrograms,
  announcements,
  onLogout,
  addToast,
  referrals,
  setReferrals,
  currentUser
}) => {
  const isUnverified = youthProfile.approvalStatus === "Pending" || youthProfile.approvalStatus === "Rejected";

  const [activeTab, setActiveTab] = useState<YouthScreen>(YouthScreen.HOME);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isUnverified && activeTab !== YouthScreen.HOME) {
      setActiveTab(YouthScreen.HOME);
    }
  }, [isUnverified, activeTab]);

  const handleSignOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onLogout();
    } catch {
      setIsLoggingOut(false);
    }
  };
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedProgramToApply, setSelectedProgramToApply] = useState<TESDAProgram | null>(null);
  const [referralToCancel, setReferralToCancel] = useState<ReferralPipelineItem | null>(null);
  const [isCancellingApplication, setIsCancellingApplication] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const isSubmittingAppRef = useRef(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Helper to get all relevant storage keys for the active youth user
  const getStorageKeys = () => {
    const keys: string[] = [];
    const email = currentUser?.email || youthProfile?.email;
    if (email) {
      keys.push(`sikap_cleared_notifs_${email.toLowerCase().trim()}`);
    }
    if (currentUser?.id) {
      keys.push(`sikap_cleared_notifs_${currentUser.id}`);
    }
    if (youthProfile?.id && youthProfile.id !== "empty-youth-profile") {
      keys.push(`sikap_cleared_notifs_${youthProfile.id}`);
    }
    keys.push("sikap_cleared_notifs_youth");
    return Array.from(new Set(keys));
  };

  const getReadStorageKey = () => {
    const email = currentUser?.email || youthProfile?.email;
    if (email) return `sikap_read_notifs_${email.toLowerCase().trim()}`;
    if (youthProfile?.id && youthProfile.id !== "empty-youth-profile") return `sikap_read_notifs_${youthProfile.id}`;
    return "sikap_read_notifs_youth";
  };

  // Track read notification IDs with localStorage persistence
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const key = (currentUser?.email || youthProfile?.email) ? `sikap_read_notifs_${(currentUser?.email || youthProfile?.email).toLowerCase().trim()}` : "sikap_read_notifs_youth";
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Track dismissed/cleared notifications with localStorage persistence
  const [clearedNotificationIds, setClearedNotificationIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const initialKeys = [
          currentUser?.email ? `sikap_cleared_notifs_${currentUser.email.toLowerCase().trim()}` : null,
          youthProfile?.email ? `sikap_cleared_notifs_${youthProfile.email.toLowerCase().trim()}` : null,
          youthProfile?.id && youthProfile.id !== "empty-youth-profile" ? `sikap_cleared_notifs_${youthProfile.id}` : null,
          "sikap_cleared_notifs_youth"
        ].filter(Boolean) as string[];

        let loaded: string[] = [];
        for (const k of initialKeys) {
          const saved = localStorage.getItem(k);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) loaded.push(...parsed);
            } catch { }
          }
        }
        return Array.from(new Set(loaded));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Re-synchronize cleared notifications whenever youth profile, auth, or storage updates
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncNotificationsFromStorage = () => {
      try {
        const keys = getStorageKeys();
        let loaded: string[] = [];
        for (const k of keys) {
          const saved = localStorage.getItem(k);
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (Array.isArray(parsed)) loaded.push(...parsed);
            } catch { }
          }
        }
        if (loaded.length > 0) {
          setClearedNotificationIds(prev => Array.from(new Set([...prev, ...loaded])));
        }

        const readKey = getReadStorageKey();
        const readSaved = localStorage.getItem(readKey);
        if (readSaved) {
          const parsed = JSON.parse(readSaved);
          if (Array.isArray(parsed)) {
            setReadNotificationIds(prev => Array.from(new Set([...prev, ...parsed])));
          }
        }
      } catch (e) {
        console.error("Failed to load cleared notifications on profile sync:", e);
      }
    };

    syncNotificationsFromStorage();
    window.addEventListener("storage", syncNotificationsFromStorage);
    return () => window.removeEventListener("storage", syncNotificationsFromStorage);
  }, [currentUser?.email, currentUser?.id, youthProfile?.id, youthProfile?.email]);

  const markAsRead = (id: string) => {
    setReadNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read notification:", e);
      }
      return updated;
    });
  };

  const markAllAsRead = (allIds: string[]) => {
    setReadNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read notifications:", e);
      }
      return updated;
    });
    addToast("All notifications marked as read", "success");
  };

  const dismissNotification = (id: string) => {
    setClearedNotificationIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
      } catch (e) {
        console.error("Failed to save cleared notification:", e);
      }
      return updated;
    });
  };

  const clearAllNotifications = (allIds: string[]) => {
    setClearedNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        const keys = getStorageKeys();
        keys.forEach(k => {
          localStorage.setItem(k, JSON.stringify(updated));
        });
      } catch (e) {
        console.error("Failed to save cleared notifications:", e);
      }
      return updated;
    });
    // Also mark them as read
    setReadNotificationIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem(getReadStorageKey(), JSON.stringify(updated));
      } catch {}
      return updated;
    });
    addToast("All notifications cleared", "info");
  };

  // Profile sub-tabs & editable states
  const [profileActiveTab, setProfileActiveTab] = useState<"profile" | "skills" | "security" | "notifications" | "badge">("profile");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editBirthdate, setEditBirthdate] = useState(youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "");
  const [editAge, setEditAge] = useState<number | string>(youthProfile.age || 20);
  const [editGender, setEditGender] = useState(spellOutGender(youthProfile.gender));
  const [editPurok, setEditPurok] = useState(youthProfile.purok || "Purok 1");
  const [editGoal, setEditGoal] = useState(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
  const [editSector, setEditSector] = useState(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
  const [editPhone, setEditPhone] = useState(youthProfile.contactNumber || "+63 9");
  const [editEdu, setEditEdu] = useState<string>(normalizeEducationalAttainment(youthProfile.educationalAttainment));
  const [editStatus, setEditStatus] = useState(youthProfile.currentStatus || "Out-of-school");
  const [editSoloParent, setEditSoloParent] = useState(Boolean(youthProfile.soloParent));
  const [editPwd, setEditPwd] = useState(Boolean(youthProfile.pwd));
  const [editIndigenous, setEditIndigenous] = useState(Boolean(youthProfile.indigenous));
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Goal editable state inside Skills & Competencies sub-tab
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [careerGoalInput, setCareerGoalInput] = useState(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  // Interests & Prior Experiences input state & ID Photo Modal
  const [newPrefInput, setNewPrefInput] = useState("");
  const [newExpInput, setNewExpInput] = useState("");
  const [showIdPhotoModal, setShowIdPhotoModal] = useState(false);
  const [idPhotoModalSide, setIdPhotoModalSide] = useState<"front" | "back">("front");

  // Dashboard hover states
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null);

  // Re-synchronize edit states whenever youthProfile prop updates (e.g. async fetch from DB)
  useEffect(() => {
    if (youthProfile) {
      setEditBirthdate(youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "");
      setEditAge(youthProfile.age || 20);
      setEditGender(spellOutGender(youthProfile.gender));
      setEditPurok(youthProfile.purok || "Purok 1");
      setEditGoal(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
      setCareerGoalInput(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
      setEditSector(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
      setEditPhone(youthProfile.contactNumber || "+63 9");
      setEditEdu(normalizeEducationalAttainment(youthProfile.educationalAttainment));
      setEditStatus(youthProfile.currentStatus || "Out-of-school");
      setEditSoloParent(Boolean(youthProfile.soloParent));
      setEditPwd(Boolean(youthProfile.pwd));
      setEditIndigenous(Boolean(youthProfile.indigenous));
    }
  }, [youthProfile]);

  // Security password states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Real-time password criteria validation for Security Guide checklist
  const isPassLengthValid = newPassword.length >= 6;
  const isPassCaseValid = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const isPassCharTypeValid = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);
  const isAllPasswordCriteriaMet = isPassLengthValid && isPassCaseValid && isPassCharTypeValid;
  const doPasswordsMatch = Boolean(confirmPassword && newPassword === confirmPassword);

  // Helper to reliably parse career plan whether object or JSON string
  const parseCareerPlan = (plan: any): GeminiLongTermCareerPlan | null => {
    if (!plan) return null;
    let obj = plan;
    if (typeof obj === "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        return null;
      }
    }
    if (typeof obj === "string") {
      try {
        obj = JSON.parse(obj);
      } catch (e) {
        return null;
      }
    }
    if (obj && typeof obj === "object" && (obj.roadmapTitle || obj.summary)) {
      const parsedTl: GeminiLongTermCareerPlan | undefined = obj.translatedPlanTl && typeof obj.translatedPlanTl === "object" && (obj.translatedPlanTl.roadmapTitle || obj.translatedPlanTl.summary)
        ? {
          roadmapTitle: obj.translatedPlanTl.roadmapTitle || "Plano para sa Trabaho at Negosyo",
          summary: obj.translatedPlanTl.summary || "",
          targetGoal: obj.translatedPlanTl.targetGoal || "",
          programTitle: obj.translatedPlanTl.programTitle || "",
          immediate30Days: Array.isArray(obj.translatedPlanTl.immediate30Days) ? obj.translatedPlanTl.immediate30Days : [],
          employmentTrack: {
            targetRoles: Array.isArray(obj.translatedPlanTl.employmentTrack?.targetRoles) ? obj.translatedPlanTl.employmentTrack.targetRoles : [],
            targetLocations: obj.translatedPlanTl.employmentTrack?.targetLocations || "",
            estimatedSalary: obj.translatedPlanTl.employmentTrack?.estimatedSalary || "",
            actionSteps: Array.isArray(obj.translatedPlanTl.employmentTrack?.actionSteps) ? obj.translatedPlanTl.employmentTrack.actionSteps : []
          },
          entrepreneurshipTrack: {
            businessConcept: obj.translatedPlanTl.entrepreneurshipTrack?.businessConcept || "",
            starterFunding: obj.translatedPlanTl.entrepreneurshipTrack?.starterFunding || "",
            initialServices: Array.isArray(obj.translatedPlanTl.entrepreneurshipTrack?.initialServices) ? obj.translatedPlanTl.entrepreneurshipTrack.initialServices : []
          },
          longTerm1To2Years: Array.isArray(obj.translatedPlanTl.longTerm1To2Years) ? obj.translatedPlanTl.longTerm1To2Years : [],
          localSupportContacts: Array.isArray(obj.translatedPlanTl.localSupportContacts) ? obj.translatedPlanTl.localSupportContacts : [],
          generatedDate: obj.translatedPlanTl.generatedDate || ""
        }
        : undefined;

      return {
        roadmapTitle: obj.roadmapTitle || "Post-Graduation Career Roadmap",
        summary: obj.summary || "Tailored career development and livelihood roadmap.",
        targetGoal: obj.targetGoal || "",
        programTitle: obj.programTitle || "",
        immediate30Days: Array.isArray(obj.immediate30Days) ? obj.immediate30Days : [],
        employmentTrack: {
          targetRoles: Array.isArray(obj.employmentTrack?.targetRoles) ? obj.employmentTrack.targetRoles : ["Entry-Level Specialist"],
          targetLocations: obj.employmentTrack?.targetLocations || "San Luis & Pampanga Area",
          estimatedSalary: obj.employmentTrack?.estimatedSalary || "₱15,000 – ₱20,000 / month",
          actionSteps: Array.isArray(obj.employmentTrack?.actionSteps) ? obj.employmentTrack.actionSteps : []
        },
        entrepreneurshipTrack: {
          businessConcept: obj.entrepreneurshipTrack?.businessConcept || "Local Home-Based Enterprise",
          starterFunding: obj.entrepreneurshipTrack?.starterFunding || "SK San Luis Youth Livelihood Grant",
          initialServices: Array.isArray(obj.entrepreneurshipTrack?.initialServices) ? obj.entrepreneurshipTrack.initialServices : []
        },
        longTerm1To2Years: Array.isArray(obj.longTerm1To2Years) ? obj.longTerm1To2Years : [],
        localSupportContacts: Array.isArray(obj.localSupportContacts) ? obj.localSupportContacts : ["SK Federation Livelihood Desk (San Luis, Pampanga)", "San Luis PESO Office"],
        generatedDate: obj.generatedDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        translatedPlanTl: parsedTl
      };
    }
    return null;
  };

  // Helper to parse multiple saved career plans (supports both array and legacy single object)
  const parseCareerPlansList = (raw: any): StoredCareerRoadmap[] => {
    if (!raw) return [];
    let obj = raw;
    if (typeof obj === "string") {
      try { obj = JSON.parse(obj); } catch { return []; }
    }
    if (typeof obj === "string") {
      try { obj = JSON.parse(obj); } catch { return []; }
    }
    if (!obj) return [];

    if (Array.isArray(obj)) {
      return obj
        .map((item, idx) => {
          const parsed = parseCareerPlan(item);
          if (!parsed) return null;
          return {
            ...parsed,
            id: item.id || `roadmap-${idx}-${(item.programTitle || 'plan').replace(/\s+/g, '-').toLowerCase()}`,
            isPrimary: item.isPrimary !== undefined ? Boolean(item.isPrimary) : idx === 0
          };
        })
        .filter((item): item is StoredCareerRoadmap => item !== null);
    }

    const single = parseCareerPlan(obj);
    if (single) {
      return [{
        ...single,
        id: (obj as any).id || "primary-roadmap",
        isPrimary: true
      }];
    }
    return [];
  };

  // Helper to extract cached/saved Tagalog plan from database object or localStorage
  const getInitialTagalogPlan = (): GeminiLongTermCareerPlan | null => {
    // 1. From database youthProfile.savedCareerPlan
    if (youthProfile.savedCareerPlan) {
      const parsedDb = parseCareerPlan(youthProfile.savedCareerPlan);
      if (parsedDb?.translatedPlanTl) {
        return parsedDb.translatedPlanTl;
      }
    }
    // 2. From localStorage
    if (typeof window !== "undefined") {
      try {
        const rawLocal = (youthProfile.name && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.name}`))
          || (youthProfile.id && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.id}`));
        if (rawLocal) {
          const parsedLocal = parseCareerPlan(JSON.parse(rawLocal));
          if (parsedLocal) return parsedLocal;
        }
      } catch (e) {
        console.warn("Failed to read local career plan translation:", e);
      }
    }
    return null;
  };

  // Step 4 Gemini Long-Term Career Plan states
  const [savedRoadmaps, setSavedRoadmaps] = useState<StoredCareerRoadmap[]>(() => {
    return parseCareerPlansList(youthProfile.savedCareerPlan);
  });
  const currentSavedPlan = savedRoadmaps.find(r => r.isPrimary) || savedRoadmaps[0] || parseCareerPlan(youthProfile.savedCareerPlan);
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(() => {
    const list = parseCareerPlansList(youthProfile.savedCareerPlan);
    const primary = list.find(r => r.isPrimary) || list[0];
    return primary?.id || null;
  });

  const [credentialsCompartment, setCredentialsCompartment] = useState<"id_card" | "training_history" | "roadmaps">("id_card");
  const [credentialsHistoryFilter, setCredentialsHistoryFilter] = useState<"all" | "completed" | "enrolled">("all");
  const [viewingCertificateApp, setViewingCertificateApp] = useState<ReferralPipelineItem | null>(null);
  const [selectedPathwayAppId, setSelectedPathwayAppId] = useState<string | null>(null);

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeminiLongTermCareerPlan | null>(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);

  const normalizeTitle = (t?: string) => (t || "").toLowerCase().replace(/\s+/g, " ").trim();

  // Helper to reliably get career plan specifically associated with a program
  const getPlanForProgram = (programTitle?: string): GeminiLongTermCareerPlan | null => {
    if (!programTitle) return null;
    const cleanTitle = normalizeTitle(programTitle);

    // 1. Check newly generated plan in memory if it matches this program
    if (generatedPlan && normalizeTitle(generatedPlan.programTitle) === cleanTitle) {
      return generatedPlan;
    }

    // 2. Check saved roadmaps list
    const matchingRoadmap = savedRoadmaps.find(r => normalizeTitle(r.programTitle) === cleanTitle);
    if (matchingRoadmap) {
      return matchingRoadmap;
    }

    // 3. Check legacy single savedCareerPlan
    const single = parseCareerPlan(youthProfile.savedCareerPlan);
    if (single && normalizeTitle(single.programTitle) === cleanTitle) {
      return single;
    }

    // 4. Check localStorage for this specific program and youth
    if (typeof window !== "undefined") {
      try {
        const idKey = youthProfile.id ? `sikap_career_plan_${youthProfile.id}_${cleanTitle}` : null;
        const nameKey = youthProfile.name ? `sikap_career_plan_${youthProfile.name}_${cleanTitle}` : null;
        const rawLocal = (idKey && localStorage.getItem(idKey)) || (nameKey && localStorage.getItem(nameKey));
        if (rawLocal) {
          const parsedLocal = parseCareerPlan(JSON.parse(rawLocal));
          if (parsedLocal && normalizeTitle(parsedLocal.programTitle) === cleanTitle) {
            return parsedLocal;
          }
        }
      } catch {}
    }

    return null;
  };
  const [careerPlanLang, setCareerPlanLang] = useState<"en" | "tl">("en");
  const [translatedPlanTl, setTranslatedPlanTl] = useState<GeminiLongTermCareerPlan | null>(() => getInitialTagalogPlan());
  const [isTranslatingPlan, setIsTranslatingPlan] = useState<boolean>(false);

  // Sync savedRoadmaps whenever youthProfile.savedCareerPlan changes
  useEffect(() => {
    const list = parseCareerPlansList(youthProfile.savedCareerPlan);
    setSavedRoadmaps(list);
    if (!selectedRoadmapId || !list.some(r => r.id === selectedRoadmapId)) {
      const primary = list.find(r => r.isPrimary) || list[0];
      setSelectedRoadmapId(primary?.id || null);
    }
  }, [youthProfile.savedCareerPlan]);

  // Map Modal State for Viewing Training Provider Venue
  const [mapModalProgram, setMapModalProgram] = useState<TESDAProgram | null>(null);
  const [isVenueMapOpen, setIsVenueMapOpen] = useState(false);

  const handleOpenVenueMap = (prog?: TESDAProgram | null) => {
    if (!prog) return;
    setMapModalProgram(prog);
    setIsVenueMapOpen(true);
  };

  const handleToggleCareerPlanLang = async (lang: "en" | "tl", programTitle?: string) => {
    if (lang === "en") {
      setCareerPlanLang("en");
      return;
    }
    setCareerPlanLang("tl");

    const plan = getPlanForProgram(programTitle);
    if (!plan) return;

    // 1. If this plan already has the translation loaded in React state or plan object
    if (plan.translatedPlanTl) {
      setTranslatedPlanTl(plan.translatedPlanTl);
      return;
    }

    // 2. Check localStorage with program-specific key
    if (typeof window !== "undefined") {
      try {
        const cleanTitle = normalizeTitle(programTitle || plan.programTitle);
        const rawLocal = (youthProfile.name && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.name}_${cleanTitle}`))
          || (youthProfile.id && localStorage.getItem(`sikap_career_plan_tl_${youthProfile.id}_${cleanTitle}`));
        if (rawLocal) {
          const parsedLocal = parseCareerPlan(JSON.parse(rawLocal));
          if (parsedLocal) {
            setTranslatedPlanTl(parsedLocal);
            return;
          }
        }
      } catch (e) {
        console.warn("Failed reading local translation:", e);
      }
    }

    // 3. Only if NO translation exists anywhere, generate via Gemini API once
    const fallback = getFallbackTagalogCareerPlan(plan, youthProfile);
    setTranslatedPlanTl(fallback);

    setIsTranslatingPlan(true);
    try {
      const res = await fetch("/api/career-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youthProfile,
          translatePlan: plan
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const newTranslatedPlan = parseCareerPlan(data.data) || data.data;
        setTranslatedPlanTl(newTranslatedPlan);

        const cleanTitle = normalizeTitle(programTitle || plan.programTitle);
        // Save to localStorage immediately
        if (typeof window !== "undefined") {
          if (youthProfile.name) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.name}_${cleanTitle}`, JSON.stringify(newTranslatedPlan));
          if (youthProfile.id) localStorage.setItem(`sikap_career_plan_tl_${youthProfile.id}_${cleanTitle}`, JSON.stringify(newTranslatedPlan));
        }

        const fullPlanWithTranslation: GeminiLongTermCareerPlan = {
          ...plan,
          translatedPlanTl: newTranslatedPlan
        };

        const currentList = parseCareerPlansList(youthProfile.savedCareerPlan);
        const updatedList = currentList.map(r => normalizeTitle(r.programTitle) === cleanTitle ? { ...r, translatedPlanTl: newTranslatedPlan } : r);

        try {
          const saveRes = await fetch("/api/youth", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: youthProfile.id,
              savedCareerPlan: updatedList
            })
          });
          const saveData = await saveRes.json();
          if (saveData.success) {
            setSavedRoadmaps(updatedList);
            setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: JSON.stringify(updatedList) } : y));
            if (generatedPlan && normalizeTitle(generatedPlan.programTitle) === cleanTitle) {
              setGeneratedPlan(fullPlanWithTranslation);
            }
          }
        } catch (dbErr) {
          console.error("Failed to save translated plan to database:", dbErr);
        }
      }
    } catch (err) {
      console.warn("Using local Tagalog translation fallback for career plan:", err);
    } finally {
      setIsTranslatingPlan(false);
    }
  };

  const handleGenerateCareerPlan = async (prog?: TESDAProgram | null, targetProgramTitle?: string) => {
    const targetTitle = prog?.title || targetProgramTitle || "";
    const cleanTitle = normalizeTitle(targetTitle);
    const existing = getPlanForProgram(targetTitle);
    if (existing?.roadmapTitle) {
      addToast("Your official career plan for this program is already generated and saved to your account.", "info");
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const res = await fetch("/api/career-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youthProfile,
          program: prog || (targetTitle ? { title: targetTitle } : null)
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const rawPlan = parseCareerPlan(data.data) || data.data;
        const newPlan: GeminiLongTermCareerPlan = {
          ...rawPlan,
          programTitle: targetTitle || rawPlan.programTitle || "Skills Training Program"
        };
        setGeneratedPlan(newPlan);

        // Instantly cache in localStorage with program-specific key
        if (typeof window !== "undefined") {
          if (youthProfile.name) localStorage.setItem(`sikap_career_plan_${youthProfile.name}_${cleanTitle}`, JSON.stringify(newPlan));
          if (youthProfile.id) localStorage.setItem(`sikap_career_plan_${youthProfile.id}_${cleanTitle}`, JSON.stringify(newPlan));
        }

        // Create roadmap item and combine with existing roadmaps so other programs are never lost
        const newRoadmapItem: StoredCareerRoadmap = {
          ...newPlan,
          id: `roadmap-${Date.now()}-${cleanTitle.replace(/[^a-z0-9]/g, "-").slice(0, 30)}`,
          isPrimary: savedRoadmaps.length === 0,
          generatedDate: newPlan.generatedDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        };

        const currentList = parseCareerPlansList(youthProfile.savedCareerPlan);
        const updatedList: StoredCareerRoadmap[] = [
          newRoadmapItem,
          ...currentList.filter(r => normalizeTitle(r.programTitle) !== cleanTitle)
        ];

        setSavedRoadmaps(updatedList);
        setSelectedRoadmapId(newRoadmapItem.id);

        // Automatically persist to PostgreSQL database
        try {
          const saveRes = await fetch("/api/youth", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: youthProfile.id,
              savedCareerPlan: updatedList
            })
          });
          const saveData = await saveRes.json();
          if (saveData.success) {
            setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: JSON.stringify(updatedList) } : y));
            addToast("Google Gemini Career Plan generated & saved permanently to your account!", "success");
          }
        } catch (saveErr) {
          console.error("Auto-save career plan error:", saveErr);
        }
      } else {
        addToast(data.error || "Failed to generate career plan", "error");
      }
    } catch (err) {
      console.error("Error generating career plan:", err);
      addToast("Failed to connect to Google Gemini API. Please try again.", "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveCareerPlanToIDCard = async (planToSave: GeminiLongTermCareerPlan) => {
    if (!planToSave) return;
    setIsSavingPlan(true);

    const newId = `roadmap-${Date.now()}`;
    const newRoadmapItem: StoredCareerRoadmap = {
      ...planToSave,
      id: newId,
      isPrimary: savedRoadmaps.length === 0,
      generatedDate: planToSave.generatedDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      translatedPlanTl: translatedPlanTl || planToSave.translatedPlanTl || undefined
    };

    const existingFiltered = savedRoadmaps.filter(r => 
      !r.programTitle || !planToSave.programTitle || normalizeTitle(r.programTitle) !== normalizeTitle(planToSave.programTitle)
    );
    const updatedList: StoredCareerRoadmap[] = [...existingFiltered, newRoadmapItem];

    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          savedCareerPlan: updatedList
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedRoadmaps(updatedList);
        setSelectedRoadmapId(newId);
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: JSON.stringify(updatedList) } : y));
        addToast("Career Roadmap saved to your Digital ID & Credentials Hub!", "success");
      } else {
        addToast(data.error || "Failed to save career plan", "error");
      }
    } catch (err) {
      console.error("Save career plan error:", err);
      addToast("Failed to save career plan. Please try again.", "error");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleSetPrimaryRoadmap = async (roadmapId: string) => {
    const updated = savedRoadmaps.map(r => ({
      ...r,
      isPrimary: r.id === roadmapId
    }));
    setSavedRoadmaps(updated);
    const chosen = updated.find(r => r.id === roadmapId);
    if (chosen) setGeneratedPlan(chosen);

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          savedCareerPlan: updated
        })
      });
      setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: JSON.stringify(updated) } : y));
      addToast(`"${chosen?.roadmapTitle || 'Roadmap'}" set as primary career focus!`, "success");
    } catch (e) {
      console.error("Failed to update primary roadmap:", e);
    }
  };

  const handleDeleteRoadmap = async (roadmapId: string) => {
    const updated = savedRoadmaps.filter(r => r.id !== roadmapId);
    if (updated.length > 0 && !updated.some(r => r.isPrimary)) {
      updated[0].isPrimary = true;
    }
    setSavedRoadmaps(updated);
    const nextPrimary = updated.find(r => r.isPrimary) || updated[0] || null;
    setSelectedRoadmapId(nextPrimary?.id || null);
    if (nextPrimary) setGeneratedPlan(nextPrimary);

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          savedCareerPlan: updated
        })
      });
      setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, savedCareerPlan: JSON.stringify(updated) } : y));
      addToast("Career roadmap removed from your portfolio.", "info");
    } catch (e) {
      console.error("Failed to delete roadmap:", e);
    }
  };

  const parseImmediateStep = (stepText: string, idx: number = 0) => {
    if (!stepText) return { title: "", desc: "" };
    if (stepText.includes(": ")) {
      const parts = stepText.split(": ");
      if (parts[0].length <= 60) {
        return { title: parts[0].trim(), desc: parts.slice(1).join(": ").trim() };
      }
    }
    if (stepText.includes(" - ")) {
      const parts = stepText.split(" - ");
      if (parts[0].length <= 60 && !parts[0].toLowerCase().includes("tesda")) {
        return { title: parts[0].trim(), desc: parts.slice(1).join(" - ").trim() };
      }
    }
    if (stepText.includes(" – ")) {
      const parts = stepText.split(" – ");
      if (parts[0].length <= 60 && !parts[0].toLowerCase().includes("tesda")) {
        return { title: parts[0].trim(), desc: parts.slice(1).join(" – ").trim() };
      }
    }
    const dotIndex = stepText.indexOf(". ");
    if (dotIndex > 10 && dotIndex < 60) {
      return { title: stepText.slice(0, dotIndex).trim(), desc: stepText.slice(dotIndex + 2).trim() };
    }
    const lower = stepText.toLowerCase();
    let title = idx === 0 ? "Claim NC II Certification & SIL Credentials" : idx === 1 ? "PESO & NSRP Jobseeker Registration" : "Professional Resume & Portfolio Preparation";
    if (lower.includes("certificate") || lower.includes("claim") || lower.includes("tesda") || lower.includes("nc ii") || idx === 0) {
      title = careerPlanLang === "tl" ? "Kuhanin ang Opisyal na Sertipiko" : "Claim NC II & SIL Credentials";
    } else if (lower.includes("peso") || lower.includes("register") || lower.includes("jobseeker") || lower.includes("nsrp") || idx === 1) {
      title = careerPlanLang === "tl" ? "Pagpaparehistro sa PESO at NSRP" : "PESO & NSRP Jobseeker Registration";
    } else if (lower.includes("cv") || lower.includes("resume") || lower.includes("portfolio") || lower.includes("prepare") || idx === 2) {
      title = careerPlanLang === "tl" ? "Paghahanda ng Propesyonal na CV" : "Build Professional Resume & Portfolio";
    }
    return { title, desc: stepText };
  };

  // Render Step 4 Gemini AI Career & Livelihood Guide (unlocked during Enrolled stage for active trainees)
  const renderMotivationalCareerGuideCard = (programTitle: string, prog?: TESDAProgram | null) => {
    // Only show a plan that was specifically generated for this program; wait for user to generate one if not yet created
    const planToShow = getPlanForProgram(programTitle);
    const isSaved = Boolean(planToShow && planToShow.roadmapTitle && (
      savedRoadmaps.some(r => normalizeTitle(r.programTitle) === normalizeTitle(programTitle)) ||
      (parseCareerPlan(youthProfile.savedCareerPlan) && normalizeTitle(parseCareerPlan(youthProfile.savedCareerPlan)?.programTitle) === normalizeTitle(programTitle))
    ));
    const displayPlan = (careerPlanLang === "tl" && planToShow)
      ? (planToShow.translatedPlanTl || (translatedPlanTl && normalizeTitle(translatedPlanTl.programTitle) === normalizeTitle(programTitle) ? translatedPlanTl : null) || getFallbackTagalogCareerPlan(planToShow, youthProfile))
      : planToShow;

    return (
      <div id="pathway-career-guide-card" className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 space-y-5 sm:space-y-6 relative overflow-hidden animate-in fade-in duration-200">
        {/* Card Title & Language Switcher Row */}
        <div className="space-y-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-[20px] font-black text-gray-900 tracking-tight leading-tight">
              {careerPlanLang === "tl"
                ? `Mga Oportunidad sa Trabaho Pagkatapos ng ${programTitle}`
                : `Career Opportunities After ${programTitle}`}
            </h3>
            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-full bg-gray-100 p-0.5 border border-gray-200 shrink-0 shadow-2xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => handleToggleCareerPlanLang("en", programTitle)}
                className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer ${
                  careerPlanLang === "en"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => handleToggleCareerPlanLang("tl", programTitle)}
                disabled={isTranslatingPlan}
                className={`px-3 py-1 text-xs font-extrabold rounded-full transition-all cursor-pointer flex items-center gap-1 ${
                  careerPlanLang === "tl"
                    ? "bg-white text-gray-900 shadow-xs"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {isTranslatingPlan ? (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <span>Tagalog</span>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
            {careerPlanLang === "tl"
              ? "Galugarin ang mga posibleng landas sa karera, oportunidad sa kabuhayan, at mga inirekumendang susunod na hakbang batay sa iyong natapos na training."
              : "Explore potential career paths, livelihood opportunities, and recommended next steps based on your completed training."}
          </p>
          <div className="border-t border-gray-100 my-2" />
        </div>

        {/* Display Plan Content */}
        {planToShow && displayPlan ? (
          <div className="space-y-5 sm:space-y-6 pt-2">
            {/* First 30 Days */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-3.5 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
              <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#0A6B43] tracking-widest block">
                {careerPlanLang === "tl" ? "UNANG 30 ARAW PAGKATAPOS NG TRAINING" : "FIRST 30 DAYS AFTER TRAINING"}
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight -mt-1">
                {careerPlanLang === "tl" ? "Mga Sertipiko at Pagpaparehistro sa Trabaho" : "Credentialing & Jobseeker Registration"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 items-start">
                {displayPlan.immediate30Days.map((stepItem: string, sIdx: number) => {
                  const parsed = parseImmediateStep(stepItem, sIdx);
                  return (
                    <div key={sIdx} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#0A6B43] text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        {sIdx + 1}
                      </span>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h5 className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
                          {parsed.title}
                        </h5>
                        {parsed.desc && (
                          <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                            {parsed.desc}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Track A & Track B Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* Track A: Wage Employment */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap min-h-[32px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 text-[#0A6B43] font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">
                      <Briefcase className="w-3.5 h-3.5 text-[#0A6B43]" />
                      <span>{careerPlanLang === "tl" ? "TRACK A · TRABAHO AT SUWELDO" : "TRACK A · WAGE EMPLOYMENT"}</span>
                    </span>
                    <span className="text-amber-900 font-black text-xs bg-amber-100/70 px-3 py-1 rounded-lg">
                      {displayPlan.employmentTrack.estimatedSalary}
                    </span>
                  </div>

                  {/* Target Areas with clean top and bottom divider and 30% reduced vertical padding */}
                  <div className="border-y border-gray-200/80 py-2.5 flex items-start gap-2 text-xs text-gray-700 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                    <span className="leading-relaxed"><strong className="text-gray-900">Target areas:</strong> {displayPlan.employmentTrack.targetLocations}</span>
                  </div>

                  <div className="space-y-2 flex flex-col justify-center min-h-[56px] pb-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {careerPlanLang === "tl" ? "MGA TRABAHONG BAGAY SAYO" : "ENTRY ROLES"}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {displayPlan.employmentTrack.targetRoles.map((role: string, rIdx: number) => (
                        <span key={rIdx} className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs text-gray-800 font-semibold shadow-2xs">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="border-t border-gray-200/80" />
                  </div>

                  <div className="space-y-2 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {careerPlanLang === "tl" ? "MGA HAKBANG" : "NEXT MOVES"}
                    </span>
                    <div className="space-y-2">
                      {displayPlan.employmentTrack.actionSteps.map((step: string, stIdx: number) => (
                        <div key={stIdx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed font-medium">
                          <CheckCircle className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Track B: Self-Employment & Freelance */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap min-h-[32px]">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 text-[#0A6B43] font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">
                      <Store className="w-3.5 h-3.5 text-[#0A6B43]" />
                      <span>{careerPlanLang === "tl" ? "TRACK B · SARILING NEGOSYO AT RAKET" : "TRACK B · SELF-EMPLOYMENT & FREELANCE"}</span>
                    </span>
                  </div>

                  <div className="border-t border-gray-200/80" />
                  <div className="flex items-start gap-2 text-xs text-gray-800 font-medium">
                    <Briefcase className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                    <span className="leading-relaxed"><strong className="text-gray-900">{careerPlanLang === "tl" ? "Ideya sa Negosyo:" : "Business concept:"}</strong> {displayPlan.entrepreneurshipTrack.businessConcept}</span>
                  </div>

                  {/* Funding highlight box (stays yellow/amber without border as requested) */}
                  <div className="bg-amber-100/60 rounded-xl p-3 sm:p-3.5 flex items-center gap-2.5 text-xs text-amber-950 font-semibold shadow-2xs">
                    <Coins className="w-4 h-4 text-amber-700 shrink-0" />
                    <span><strong>{careerPlanLang === "tl" ? "Tulong Pinansyal:" : "Funding:"}</strong> {displayPlan.entrepreneurshipTrack.starterFunding}</span>
                  </div>

                  <div className="pt-2">
                    <div className="border-t border-gray-200/80" />
                  </div>

                  <div className="space-y-2 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      {careerPlanLang === "tl" ? "MGA SERBISYONG PWEDENG SIMULAN" : "SERVICES TO OFFER"}
                    </span>
                    <div className="space-y-2">
                      {displayPlan.entrepreneurshipTrack.initialServices.map((srv: string, sIdx: number) => (
                        <div key={sIdx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed font-medium">
                          <Star className="w-3.5 h-3.5 text-[#0A6B43] fill-emerald-500 shrink-0 mt-0.5" />
                          <span>{srv}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Long-term elevation & Local support */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              {/* 1-2 Year Long-Term Elevation */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="text-xs font-black uppercase tracking-wider text-[#0A6B43] flex items-center gap-2 min-h-[28px]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0A6B43]" />
                  <span>{careerPlanLang === "tl" ? "1–2 TAON NA PAG-ASENSO SA KARERA" : "1–2 YEAR LONG-TERM ELEVATION"}</span>
                </span>
                <div className="border-t border-gray-200/80" />
                <div className="space-y-2 pt-1">
                  {displayPlan.longTerm1To2Years.map((milestone: string, mIdx: number) => (
                    <div key={mIdx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0A6B43] shrink-0 mt-1.5" />
                      <span className="flex-1">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Support */}
              <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5 sm:p-6 space-y-3 shadow-2xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="text-xs font-black uppercase tracking-wider text-[#0A6B43] flex items-center gap-2 min-h-[28px]">
                  <Landmark className="w-3.5 h-3.5 text-[#0A6B43]" />
                  <span>{careerPlanLang === "tl" ? "MGA MALALAPIT NA TANGGAPAN SA SAN LUIS" : "LOCAL SUPPORT IN SAN LUIS"}</span>
                </span>
                <div className="border-t border-gray-200/80" />
                <div className="space-y-2 pt-1">
                  {displayPlan.localSupportContacts.map((contact: string, cIdx: number) => (
                    <div key={cIdx} className="flex items-start gap-2.5 text-xs text-gray-700 leading-relaxed font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0 mt-0.5" />
                      <span className="flex-1">{contact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Right Action Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              {isSaved ? (
                <button
                  type="button"
                  onClick={() => {
                    setProfileActiveTab("badge");
                    setCredentialsCompartment("roadmaps");
                    setActiveTab(YouthScreen.PROFILE);
                  }}
                  className="group/cred inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-extrabold text-xs shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  <span className="transition-transform duration-200 group-hover/cred:translate-x-0.5 inline-block">
                    View Credentials Hub
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-white transition-transform duration-200 group-hover/cred:translate-x-1.5 group-hover/cred:scale-115 shrink-0" />
                </button>
              ) : (
                <button
                  onClick={() => handleSaveCareerPlanToIDCard(planToShow)}
                  disabled={isSavingPlan}
                  className="group/save inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-extrabold text-xs shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {isSavingPlan ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{careerPlanLang === "tl" ? "Sine-save..." : "Saving..."}</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 transition-transform duration-200 group-hover/save:scale-115 group-hover/save:-rotate-6 shrink-0" />
                      <span className="transition-transform duration-200 group-hover/save:translate-x-0.5 inline-block">
                        {careerPlanLang === "tl" ? "I-save sa Digital ID Card" : "Save Plan to Digital ID Card"}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 sm:py-10 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-4 sm:p-6 flex flex-col items-center">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-400 fill-yellow-400 mb-5 sm:mb-6" />
            <h5 className="font-extrabold text-gray-900 text-[14px] sm:text-[16px] leading-snug mb-1">
              {careerPlanLang === "tl" ? "Handa Ka Na Ba Para sa Susunod na Hakbang sa Iyong Karera?" : "Ready for Your Next Career Step?"}
            </h5>
            <p className="text-[14px] text-gray-600 max-w-lg mx-auto leading-relaxed font-medium mb-6">
              {careerPlanLang === "tl"
                ? "I-click sa ibaba upang bumuo ng career strategy na angkop sa iyong mga natutunan at kredensyal."
                : "Click below to generate a tailored career strategy for your credentials."}
            </p>
            <button
              onClick={() => handleGenerateCareerPlan(prog, programTitle)}
              disabled={isGeneratingPlan}
              className="w-full sm:w-auto h-11 px-7 sm:px-8 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 text-white font-semibold text-[14px] rounded-xl transition-all shadow-sm hover:shadow-md cursor-pointer inline-flex items-center justify-center gap-3"
            >
              {isGeneratingPlan ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white shrink-0 mr-1.5" />
                  <span>{careerPlanLang === "tl" ? "Bumubuo ng career plan..." : "Building your career plan..."}</span>
                </>
              ) : (
                <span>{careerPlanLang === "tl" ? "Buuin ang Aking Career Plan" : "Build My Career Plan"}</span>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Filter announcements to only show active, unexpired ones matching member's barangay
  const localAnnouncements = useMemo(() => {
    const now = new Date().getTime();
    return announcements.filter(ann => {
      if (ann.status === "Cancelled") return false;

      if (ann.eventDate) {
        const parsed = Date.parse(ann.eventDate);
        if (!isNaN(parsed) && parsed < now - 86400000) {
          return false;
        }
      }

      if (!ann.barangay) return true; // Municipal / Global announcement
      const annBrgy = ann.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      const dbBrgy = youthProfile.barangay.replace(/^Barangay\s+/i, "").trim().toLowerCase();
      return annBrgy === dbBrgy;
    });
  }, [announcements, youthProfile.barangay]);

  const calculatedAge = useMemo(() => {
    if (!youthProfile.registeredDate) return youthProfile.age;
    const regDate = new Date(youthProfile.registeredDate);
    const now = new Date();
    if (isNaN(regDate.getTime())) return youthProfile.age;

    let years = now.getFullYear() - regDate.getFullYear();
    const m = now.getMonth() - regDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < regDate.getDate())) {
      years--;
    }
    return youthProfile.age + Math.max(0, years);
  }, [youthProfile.age, youthProfile.registeredDate]);

  const [topMatchAdviceMap, setTopMatchAdviceMap] = useState<Record<string, {
    careerAdvice: string;
    bulletAdvice: string[];
    careerAdviceTl: string;
    bulletAdviceTl: string[];
  }>>(() => {
    const initial: Record<string, {
      careerAdvice: string;
      bulletAdvice: string[];
      careerAdviceTl: string;
      bulletAdviceTl: string[];
    }> = {};
    const saved = youthProfile?.savedMatchAdvice;
    if (saved) {
      if (saved.byProgramId && typeof saved.byProgramId === "object") {
        Object.entries(saved.byProgramId).forEach(([progId, entry]) => {
          if (entry && entry.careerAdvice) {
            initial[progId] = {
              careerAdvice: entry.careerAdvice,
              bulletAdvice: Array.isArray(entry.bulletAdvice) ? entry.bulletAdvice : [],
              careerAdviceTl: entry.careerAdviceTl || "",
              bulletAdviceTl: Array.isArray(entry.bulletAdviceTl) ? entry.bulletAdviceTl : [],
            };
          }
        });
      }
      if (saved.programId && saved.careerAdvice && !initial[saved.programId]) {
        initial[saved.programId] = {
          careerAdvice: saved.careerAdvice,
          bulletAdvice: Array.isArray(saved.bulletAdvice) ? saved.bulletAdvice : [],
          careerAdviceTl: saved.careerAdviceTl || "",
          bulletAdviceTl: Array.isArray(saved.bulletAdviceTl) ? saved.bulletAdviceTl : [],
        };
      }
    }
    return initial;
  });
  const [programLangMap, setProgramLangMap] = useState<Record<string, "en" | "tl">>({});
  const getProgramLang = (progId: string): "en" | "tl" => programLangMap[progId] || "en";
  const setProgramLang = (progId: string, lang: "en" | "tl") => {
    setProgramLangMap(prev => ({ ...prev, [progId]: lang }));
  };
  const [isLoadingFeaturedAI, setIsLoadingFeaturedAI] = useState<boolean>(!youthProfile?.savedMatchAdvice?.careerAdvice);
  const fetchingTopAdviceIdsRef = useRef<Set<string>>(new Set());
  const [viewingProgramModal, setViewingProgramModal] = useState<{
    program: TESDAProgram;
    matchScore?: number;
  } | null>(null);

  // Matched Programs tab search & filter states
  const [matchesSearchQuery, setMatchesSearchQuery] = useState("");
  const [matchesPillFilter, setMatchesPillFilter] = useState<string>("ALL");
  const [matchesSectorFilter, setMatchesSectorFilter] = useState<string>("ALL");
  const [matchesCostFilter, setMatchesCostFilter] = useState<string>("ALL");
  const [matchesAvailabilityFilter, setMatchesAvailabilityFilter] = useState<string>("ALL");

  // Lock background scroll when Program Details modal is open to keep scrollbars strictly inside modal
  useEffect(() => {
    if (viewingProgramModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [viewingProgramModal]);

  // Helper to reliably match youth referrals using unique ID, email, or exact normalized name
  const isSameYouth = (rYouthName?: string, currentYouthName?: string, rYouthId?: string, rEmail?: string) => {
    // 1. If youth IDs are available on both sides, rely on unique ID
    if (rYouthId && youthProfile?.id) {
      return rYouthId === youthProfile.id;
    }
    // 2. If emails are available, rely on unique email
    const cleanREmail = (rEmail || "").toLowerCase().trim();
    const cleanYEmail = (youthProfile?.email || currentUser?.email || "").toLowerCase().trim();
    if (cleanREmail && cleanYEmail) {
      return cleanREmail === cleanYEmail;
    }
    // 3. Fallback only when unique identifiers are completely absent on both sides
    if (rYouthId || youthProfile?.id || cleanREmail || cleanYEmail) {
      return false;
    }
    if (!rYouthName || !currentYouthName) return false;
    const n1 = rYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const n2 = currentYouthName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return n1 === n2;
  };

  // Check if a youth has already completed this program or an identical/equivalent qualification
  const isProgramCompleted = (prog: TESDAProgram) => {
    return !!referrals?.some(r =>
      isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail) &&
      r.status === "Archived" &&
      (
        r.programTitle.toLowerCase().trim() === prog.title.toLowerCase().trim() ||
        r.programId === prog.id ||
        (
          prog.title.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim().length > 3 &&
          r.programTitle.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim() ===
          prog.title.toLowerCase().replace(/nc\s*(i|ii|iii|iv)/gi, "").trim()
        )
      )
    );
  };

  // Check if youth has declared matching competencies or preferences
  const hasEnoughMatchingData = useMemo(() => {
    const hasSkills = Boolean(youthProfile.skills && youthProfile.skills.length > 0);
    const hasSector = Boolean(youthProfile.sectorPreference && youthProfile.sectorPreference.trim().length > 0);
    const hasInterests = Boolean(youthProfile.interests && youthProfile.interests.length > 0);
    return hasSkills || hasSector || hasInterests;
  }, [youthProfile.skills, youthProfile.sectorPreference, youthProfile.interests]);

  // Scored programs with detailed CBF breakdown and completed qualification indicator
  const scoredPrograms = useMemo(() => {
    return programs
      .map(p => {
        const breakdown = calculateDetailedCBFMatch(youthProfile, p);
        const matchScore = breakdown.excluded ? 0 : breakdown.finalScore;
        return {
          program: p,
          matchScore,
          breakdown,
          isCompleted: isProgramCompleted(p)
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }, [programs, youthProfile, referrals]);

  // Actionable uncompleted programs for featured recommendation and upskilling
  const uncompletedScoredPrograms = useMemo(() => {
    return scoredPrograms.filter(sp => !sp.isCompleted);
  }, [scoredPrograms]);

  // Completed programs where the member is already certified
  const completedScoredPrograms = useMemo(() => {
    return scoredPrograms.filter(sp => sp.isCompleted);
  }, [scoredPrograms]);

  // Active uncompleted programs matching the youth's competencies (score > 0 and term not ended)
  const activeMatchingPrograms = useMemo(() => {
    return uncompletedScoredPrograms.filter(sp => !isProgramEnded(sp.program) && sp.matchScore > 0);
  }, [uncompletedScoredPrograms]);

  // Programs ordered for Matches tab: Actionable uncompleted first, completed qualifications below
  const matchesTabPrograms = useMemo(() => {
    return [...scoredPrograms].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return b.matchScore - a.matchScore;
    });
  }, [scoredPrograms]);

  // Determine Top Match programs using consistent tie / near-tie rule (exact ties or within 2 percentage points of highest CBF score)
  const topMatchProgramIds = useMemo(() => {
    return identifyTopMatchProgramIds(scoredPrograms);
  }, [scoredPrograms]);

  // Categorize training programs into mutually exclusive tiers with Top Matches having absolute priority
  const categorizedMatchedPrograms = useMemo(() => {
    // Order programs: uncompleted first, then completed, sorted descending by score
    const sorted = [...scoredPrograms].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return b.matchScore - a.matchScore;
    });

    return sorted.map(item => {
      let categoryKey = "low-matches";
      let categoryLabel = "Low Match";
      let isTopMatch = false;

      // 1. Top Matches must have score >= 50 (strictly never Low Match or 0%)
      if (topMatchProgramIds.has(item.program.id) && item.matchScore >= 50) {
        categoryKey = "top-matches";
        categoryLabel = "Top Matches";
        isTopMatch = true;
      } else if (item.matchScore <= 0 || isNaN(item.matchScore)) {
        // "others only are literal 0% match"
        categoryKey = "not-enough-data";
        categoryLabel = "Others";
        isTopMatch = false;
      } else if (item.matchScore >= 90) {
        categoryKey = "excellent-matches";
        categoryLabel = "Excellent Match";
      } else if (item.matchScore >= 75) {
        categoryKey = "strong-matches";
        categoryLabel = "Strong Match";
      } else if (item.matchScore >= 50) {
        categoryKey = "moderate-matches";
        categoryLabel = "Moderate Match";
      } else {
        // Low Match: score > 0 && score < 50 (never Top Match)
        categoryKey = "low-matches";
        categoryLabel = "Low Match";
        isTopMatch = false;
      }

      return {
        ...item,
        categoryKey,
        categoryLabel,
        isTopMatch,
      };
    });
  }, [scoredPrograms, topMatchProgramIds]);

  // Total count of programs within each match category
  const matchCategoryCounts = useMemo(() => {
    let topMatches = 0;
    let otherMatches = 0;
    let others = 0;

    categorizedMatchedPrograms.forEach(item => {
      if (item.isTopMatch) {
        topMatches++;
      } else if (item.matchScore > 0 && item.categoryKey !== "not-enough-data") {
        otherMatches++;
      } else {
        others++;
      }
    });

    return {
      "top-matches": topMatches,
      "other-matches": otherMatches,
      "not-enough-data": others,
    };
  }, [categorizedMatchedPrograms]);

  // Programs included in "All Matches": all matches with score > 0 (Top Matches, Excellent, Strong, Moderate, Low Matches)
  // "Others" (literal 0% matches) are excluded from All Matches
  const allPositiveMatches = useMemo(() => {
    return categorizedMatchedPrograms.filter(item =>
      item.matchScore > 0 && item.categoryKey !== "not-enough-data"
    );
  }, [categorizedMatchedPrograms]);

  const hasPositiveMatches = allPositiveMatches.length > 0;

  // Clickable pill definitions: All Matches, Top Matches, Other Matches (and Others for literal 0%)
  const availableMatchPills = useMemo(() => {
    const allMatchesCount = hasPositiveMatches
      ? allPositiveMatches.length
      : categorizedMatchedPrograms.length;

    const pills = [
      {
        key: "ALL",
        label: "All Matches",
        count: allMatchesCount,
      },
      {
        key: "top-matches",
        label: "Top Matches",
        count: matchCategoryCounts["top-matches"] || 0,
      },
      {
        key: "other-matches",
        label: "Other Matches",
        count: matchCategoryCounts["other-matches"] || 0,
      },
      {
        key: "not-enough-data",
        label: "Others",
        count: matchCategoryCounts["not-enough-data"] || 0,
      },
    ];

    // Only show a pill if its category has at least one matching program; hide categories with zero results
    return pills.filter(p => p.count > 0);
  }, [hasPositiveMatches, allPositiveMatches.length, categorizedMatchedPrograms.length, matchCategoryCounts]);

  // Active pill filter with safe fallback if selected pill becomes empty
  const activeMatchPill = useMemo(() => {
    const exists = availableMatchPills.some(p => p.key === matchesPillFilter);
    return exists ? matchesPillFilter : "ALL";
  }, [availableMatchPills, matchesPillFilter]);

  // Extract all categories and sectors we have in the system for dropdown filter
  const availableProgramSectors = useMemo(() => {
    const sectors = new Set<string>();
    CATEGORIES.forEach(c => {
      if (c.name && c.name.trim()) sectors.add(c.name.trim());
    });
    programs.forEach(prog => {
      const sec = typeof prog.category === "string" ? prog.category : prog.category?.name;
      if (sec && sec.trim()) sectors.add(sec.trim());
    });
    return Array.from(sectors).sort();
  }, [programs]);

  // Final filtered list of program cards for Grid display
  const filteredMatchedPrograms = useMemo(() => {
    return categorizedMatchedPrograms.filter(item => {
      const prog = item.program;

      // 1. Pill Filter:
      // When "ALL" (All Matches): display all matches (score > 0). If none matches at all, fallback to showing all programs.
      // When "top-matches": display Top Matches only
      // When "other-matches": display all non-top positive matches (score > 0)
      // When "not-enough-data": display literal 0% matches
      if (activeMatchPill === "ALL") {
        if (hasPositiveMatches) {
          const isPositiveMatch =
            item.categoryKey !== "not-enough-data" &&
            item.matchScore > 0;
          if (!isPositiveMatch) return false;
        }
      } else if (activeMatchPill === "top-matches") {
        if (!item.isTopMatch) return false;
      } else if (activeMatchPill === "other-matches") {
        if (item.isTopMatch || item.matchScore <= 0 || item.categoryKey === "not-enough-data") return false;
      } else if (activeMatchPill === "not-enough-data") {
        if (item.matchScore > 0 && item.categoryKey !== "not-enough-data") return false;
      }

      // 2. Sector Dropdown Filter
      if (matchesSectorFilter !== "ALL") {
        const sec = typeof prog.category === "string" ? prog.category : prog.category?.name;
        const cbfCat = item.breakdown?.categoryName;
        const matchesSec =
          (sec && sec.toLowerCase() === matchesSectorFilter.toLowerCase()) ||
          (cbfCat && cbfCat.toLowerCase() === matchesSectorFilter.toLowerCase());
        if (!matchesSec) return false;
      }

      // 3. Program Cost Dropdown Filter
      if (matchesCostFilter !== "ALL") {
        if (prog.cost !== matchesCostFilter) return false;
      }

      // 4. Availability / Status Dropdown Filter
      if (matchesAvailabilityFilter !== "ALL") {
        if (matchesAvailabilityFilter === "available" && prog.slotsRemaining <= 0) return false;
        if (matchesAvailabilityFilter === "active" && isProgramEnded(prog)) return false;
        if (matchesAvailabilityFilter === "completed" && !item.isCompleted) return false;
      }

      // 5. Search Bar Query
      if (matchesSearchQuery.trim()) {
        const q = matchesSearchQuery.toLowerCase().trim();
        const sec = (typeof prog.category === "string" ? prog.category : prog.category?.name || "").toLowerCase();
        const title = (prog.title || "").toLowerCase();
        const provider = (prog.provider || "").toLowerCase();
        const location = (prog.location || "").toLowerCase();
        const eligibility = (prog.eligibility || "").toLowerCase();
        const skills = (prog.requiredSkills || []).map(s => s.toLowerCase()).join(" ");
        const matchedSkills = (item.breakdown.matchedSkills || []).map(s => s.toLowerCase()).join(" ");

        const matches =
          title.includes(q) ||
          provider.includes(q) ||
          sec.includes(q) ||
          location.includes(q) ||
          eligibility.includes(q) ||
          skills.includes(q) ||
          matchedSkills.includes(q);

        if (!matches) return false;
      }

      return true;
    });
  }, [
    categorizedMatchedPrograms,
    activeMatchPill,
    hasPositiveMatches,
    matchesSectorFilter,
    matchesCostFilter,
    matchesAvailabilityFilter,
    matchesSearchQuery,
  ]);

  // Distribution of positive training matches across 4 categories:
  // Excellent Match (>= 90), Strong Match (75-89), Moderate Match (50-74), Low Match (1-49)
  // Unrated (<= 0) are excluded
  const matchDistribution = useMemo(() => {
    let excellent = 0; // score >= 90
    let strong = 0;    // score >= 75 && score < 90
    let moderate = 0;  // score >= 50 && score < 75
    let low = 0;       // score > 0 && score < 50

    let excellentProgram: { id: string; title: string } | null = null;
    let strongProgram: { id: string; title: string } | null = null;
    let moderateProgram: { id: string; title: string } | null = null;
    let lowProgram: { id: string; title: string } | null = null;

    scoredPrograms.forEach(sp => {
      const progInfo = { id: sp.program.id, title: sp.program.title };
      if (sp.matchScore >= 90) {
        excellent++;
        if (!excellentProgram || (!sp.isCompleted && excellentProgram)) {
          excellentProgram = progInfo;
        }
      } else if (sp.matchScore >= 75) {
        strong++;
        if (!strongProgram || (!sp.isCompleted && strongProgram)) {
          strongProgram = progInfo;
        }
      } else if (sp.matchScore >= 50) {
        moderate++;
        if (!moderateProgram || (!sp.isCompleted && moderateProgram)) {
          moderateProgram = progInfo;
        }
      } else if (sp.matchScore > 0) {
        low++;
        if (!lowProgram || (!sp.isCompleted && lowProgram)) {
          lowProgram = progInfo;
        }
      }
    });

    const total = excellent + strong + moderate + low;
    return {
      excellent,
      strong,
      moderate,
      low,
      total,
      pctExcellent: total > 0 ? Math.round((excellent / total) * 100) : 0,
      pctStrong: total > 0 ? Math.round((strong / total) * 100) : 0,
      pctModerate: total > 0 ? Math.round((moderate / total) * 100) : 0,
      pctLow: total > 0 ? Math.max(0, 100 - Math.round((excellent / total) * 100) - Math.round((strong / total) * 100) - Math.round((moderate / total) * 100)) : 0,
      excellentProgram,
      strongProgram,
      moderateProgram,
      lowProgram,
    };
  }, [scoredPrograms]);

  // Pagination for Matched Programs Tab - 8 programs per page (4 balanced pairs per page for 2-column layout)
  const MATCHES_PER_PAGE = 8;
  const [matchesPage, setMatchesPage] = useState<number>(1);
  const skipPageResetRef = useRef(false);

  // Pagination page numbers generator helper
  const getPaginationItems = (currentPage: number, totalPages: number): (number | string)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  };

  const totalMatchesResults = filteredMatchedPrograms.length;
  const totalMatchesPages = Math.ceil(totalMatchesResults / MATCHES_PER_PAGE) || 1;
  const currentMatchesPage = Math.min(Math.max(1, matchesPage), totalMatchesPages);

  const paginatedMatchedPrograms = useMemo(() => {
    if (totalMatchesResults <= MATCHES_PER_PAGE) {
      return filteredMatchedPrograms;
    }
    const start = (currentMatchesPage - 1) * MATCHES_PER_PAGE;
    return filteredMatchedPrograms.slice(start, start + MATCHES_PER_PAGE);
  }, [filteredMatchedPrograms, currentMatchesPage, totalMatchesResults]);

  // Reset to page 1 whenever filters, search, or profile preferences change (unless program navigation explicitly requested a page)
  useEffect(() => {
    if (skipPageResetRef.current) {
      skipPageResetRef.current = false;
      return;
    }
    setMatchesPage(1);
  }, [
    activeMatchPill,
    matchesSearchQuery,
    matchesSectorFilter,
    matchesAvailabilityFilter,
    matchesCostFilter,
    youthProfile?.skills,
    youthProfile?.sectorPreference,
  ]);

  // Navigate directly to a specific matched program card and its residing pagination page
  const handleNavigateToMatchedProgram = (targetProgId: string) => {
    skipPageResetRef.current = true;
    setMatchesSearchQuery("");
    setMatchesPillFilter("ALL");
    setMatchesSectorFilter("ALL");
    setMatchesCostFilter("ALL");
    setMatchesAvailabilityFilter("ALL");

    const targetList = hasPositiveMatches ? allPositiveMatches : categorizedMatchedPrograms;
    const targetIndex = targetList.findIndex(item => item.program.id === targetProgId);

    if (targetIndex >= 0) {
      const targetPage = Math.floor(targetIndex / MATCHES_PER_PAGE) + 1;
      setMatchesPage(targetPage);
    } else {
      setMatchesPage(1);
    }

    setActiveTab(YouthScreen.MATCHES);

    setTimeout(() => {
      const cardEl = document.getElementById(`matched-program-card-${targetProgId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "center" });
        cardEl.classList.add("ring-2", "ring-[#0A6B43]", "ring-offset-2");
        setTimeout(() => {
          cardEl.classList.remove("ring-2", "ring-[#0A6B43]", "ring-offset-2");
        }, 2500);
      } else {
        document.getElementById("matched-programs-card-container")?.scrollIntoView({ behavior: "smooth" });
      }
    }, 250);
  };

  useEffect(() => {
    // Only fetch AI match rationale once actual youth profile is resolved and has a registered barangay
    if (!youthProfile || youthProfile.id === "empty-youth-profile" || !youthProfile.barangay) {
      setIsLoadingFeaturedAI(false);
      return;
    }

    // Identify all Top Match programs so every Top Match card receives its own Gemini AI rationale & 3-step pathway
    const topMatchPrograms = categorizedMatchedPrograms
      .filter(item => item.isTopMatch && item.matchScore >= 50)
      .map(item => item.program);

    const targetProgramsForAdvice = topMatchPrograms.length > 0
      ? topMatchPrograms
      : activeMatchingPrograms.length > 0
        ? [activeMatchingPrograms[0].program]
        : [];

    if (targetProgramsForAdvice.length === 0) {
      setIsLoadingFeaturedAI(false);
      return;
    }

    let isCancelled = false;
    const savedAdvice = youthProfile.savedMatchAdvice;
    const resolvedFromCache: Record<string, {
      careerAdvice: string;
      bulletAdvice: string[];
      careerAdviceTl: string;
      bulletAdviceTl: string[];
    }> = {};
    const programsToFetch: TESDAProgram[] = [];

    for (const targetProg of targetProgramsForAdvice) {
      // 1. Check if database already has saved match advice for this specific program (either in byProgramId map or top-level)
      const dbEntry = savedAdvice?.byProgramId?.[targetProg.id]
        || ((savedAdvice?.programId === targetProg.id || savedAdvice?.programTitle === targetProg.title) ? savedAdvice : null);

      if (dbEntry && dbEntry.careerAdvice) {
        resolvedFromCache[targetProg.id] = {
          careerAdvice: dbEntry.careerAdvice,
          bulletAdvice: Array.isArray(dbEntry.bulletAdvice) ? dbEntry.bulletAdvice : [],
          careerAdviceTl: dbEntry.careerAdviceTl || "",
          bulletAdviceTl: Array.isArray(dbEntry.bulletAdviceTl) ? dbEntry.bulletAdviceTl : [],
        };
        continue;
      }

      // 2. Check local client cache as an instant fallback
      const localKey = `sikap_saved_advice_${youthProfile.id}_${targetProg.id}`;
      let foundInLocal = false;
      try {
        const cached = localStorage.getItem(localKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.careerAdvice) {
            resolvedFromCache[targetProg.id] = {
              careerAdvice: parsed.careerAdvice,
              bulletAdvice: Array.isArray(parsed.bulletAdvice) ? parsed.bulletAdvice : [],
              careerAdviceTl: parsed.careerAdviceTl || "",
              bulletAdviceTl: Array.isArray(parsed.bulletAdviceTl) ? parsed.bulletAdviceTl : [],
            };
            foundInLocal = true;
          }
        }
      } catch (e) {
        // ignore storage read issues
      }
      if (foundInLocal) continue;

      // 3. Otherwise queue this Top Match program for Gemini AI generation
      const fetchKey = `${youthProfile.id}_${targetProg.id}`;
      if (!fetchingTopAdviceIdsRef.current.has(fetchKey)) {
        programsToFetch.push(targetProg);
      }
    }

    if (Object.keys(resolvedFromCache).length > 0) {
      setTopMatchAdviceMap(prev => ({ ...prev, ...resolvedFromCache }));
    }

    if (programsToFetch.length === 0) {
      setIsLoadingFeaturedAI(false);
      return;
    }

    setIsLoadingFeaturedAI(true);

    (async () => {
      for (const targetProg of programsToFetch) {
        if (isCancelled) break;
        const fetchKey = `${youthProfile.id}_${targetProg.id}`;
        fetchingTopAdviceIdsRef.current.add(fetchKey);
        const localKey = `sikap_saved_advice_${youthProfile.id}_${targetProg.id}`;

        try {
          const res = await fetch("/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              youth: youthProfile,
              programs: [targetProg],
              targetProgram: targetProg,
              generateLLMAdvice: true
            })
          });
          const data = await res.json();
          if (data.success && data.careerAdvice) {
            const newEntry = {
              careerAdvice: data.careerAdvice,
              bulletAdvice: Array.isArray(data.bulletAdvice) ? data.bulletAdvice : [],
              careerAdviceTl: data.careerAdviceTl || "",
              bulletAdviceTl: Array.isArray(data.bulletAdviceTl) ? data.bulletAdviceTl : [],
            };

            setTopMatchAdviceMap(prev => ({
              ...prev,
              [targetProg.id]: newEntry
            }));

            // Also cache in localStorage for immediate client-side retrieval
            try {
              const advicePayload = {
                programId: targetProg.id,
                programTitle: targetProg.title,
                ...newEntry,
                generatedAt: new Date().toISOString()
              };
              localStorage.setItem(localKey, JSON.stringify(advicePayload));
            } catch (storageErr) {
              // ignore
            }
          }
        } catch (err) {
          console.error(`Error fetching Gemini advice for ${targetProg.title}:`, err);
          fetchingTopAdviceIdsRef.current.delete(fetchKey);
        }
      }
      if (!isCancelled) {
        setIsLoadingFeaturedAI(false);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [youthProfile?.id, youthProfile?.barangay, youthProfile?.skills, youthProfile?.sectorPreference, youthProfile?.livelihoodGoal, youthProfile?.interests, youthProfile?.savedMatchAdvice, categorizedMatchedPrograms, activeMatchingPrograms]);

  const skChairpersonName = useMemo(() => {
    return "Your SK Chairperson";
  }, [youthProfile.barangay]);

  // Get enrolled referrals and match them with program details
  const enrolledReferrals = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail) && r.status === "Enrolled") || [];
  const enrolledPrograms = enrolledReferrals.map(ref => {
    const program = programs.find(p => p.title === ref.programTitle);
    return {
      ref,
      program
    };
  });

  const getOverlapWarning = (prog: TESDAProgram): string | null => {
    if (enrolledPrograms.length === 0) return null;

    for (const ep of enrolledPrograms) {
      if (ep.program?.title === prog.title) continue;

      const enrolledStartStr = ep.program?.startDate;
      const enrolledEndStr = ep.program?.endDate;
      const progStartStr = prog.startDate;

      if (enrolledStartStr && enrolledEndStr && progStartStr) {
        const enrolledEnd = new Date(enrolledEndStr);
        const newStart = new Date(progStartStr);

        // If the date of the program is after their enrolled program is done
        if (newStart > enrolledEnd) {
          continue;
        }

        return `You cannot enroll in this program because your enrolled program "${ep.ref.programTitle}" (${enrolledStartStr} to ${enrolledEndStr}) is still ongoing at the start of this program (${progStartStr}).`;
      } else {
        return `You cannot enroll in this program due to a scheduling conflict with your enrolled program "${ep.ref.programTitle}".`;
      }
    }
    return null;
  };

  const getProgramDescription = (prog?: TESDAProgram | null): string | null => {
    if (!prog) return null;
    if ((prog as any).description && typeof (prog as any).description === "string" && (prog as any).description.trim()) {
      return (prog as any).description.trim();
    }
    if (prog.category && typeof prog.category === "object" && (prog.category as any).description) {
      return (prog.category as any).description;
    }
    const c = prog.category;
    if (typeof c === "string" && c.trim()) {
      const found = CATEGORIES.find(cat => cat.id === c || cat.slug === c || cat.name.toLowerCase() === c.toLowerCase());
      if (found?.description) return found.description;
    }
    if (prog.categoryId) {
      const found = CATEGORIES.find(cat => cat.id === String(prog.categoryId));
      if (found?.description) return found.description;
    }
    return null;
  };

  const handleDeletePathway = async (referralId: string) => {
    const targetRef = referrals?.find(r => r.id === referralId);
    try {
      await fetch(`/api/referrals?id=${referralId}`, { method: "DELETE" });
    } catch (err) {
      console.error("Error deleting referral:", err);
    }
    if (targetRef && (targetRef.status === "Pending" || targetRef.status === "Enrolled") && setPrograms) {
      setPrograms(prev => prev.map(p => {
        if (p.title === targetRef.programTitle || p.id === targetRef.programId) {
          return { ...p, slotsRemaining: Math.min(p.slotsTotal, p.slotsRemaining + 1) };
        }
        return p;
      }));
    }
    if (setReferrals) {
      setReferrals(prev => {
        const filtered = prev.filter(r => r.id !== referralId);
        const hasAnyOther = filtered.some(r => r.youthName === youthProfile.name);
        if (!hasAnyOther) {
          setYouthProfiles(all => all.map(y => {
            if (y.id === youthProfile.id) {
              return { ...y, hasReferred: false };
            }
            return y;
          }));
        }
        return filtered;
      });
      addToast("Declined livelihood pathway removed successfully.", "success");
      broadcastDataChange("referrals", "deleted");
      broadcastDataChange("programs", "slots_updated");
    }
  };

  const handleCancelApplication = (referralId: string) => {
    if (isUnverified) {
      addToast("Cannot cancel applications in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const targetRef = referrals?.find(r => r.id === referralId);
    if (!targetRef) {
      addToast("Application record could not be found.", "error");
      return;
    }
    setReferralToCancel(targetRef);
  };

  const confirmCancelApplication = async () => {
    if (!referralToCancel || isCancellingApplication) return;
    const referralId = referralToCancel.id;
    setIsCancellingApplication(true);
    if (isUnverified) {
      addToast("Cannot cancel applications in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const targetRef = referrals?.find(r => r.id === referralId);
    try {
      const res = await fetch(`/api/referrals?id=${referralId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || (!data.success && data.error)) {
        addToast(data.error || "Failed to cancel application. Please try again.", "error");
        setIsCancellingApplication(false);
        return;
      }
    } catch (err) {
      console.error("Error cancelling referral:", err);
      addToast("Network error while cancelling application. Please try again.", "error");
      setIsCancellingApplication(false);
      return;
    }
    setIsCancellingApplication(false);
    setReferralToCancel(null);
    if (false) {
      try {
        if (false) {
          addToast("Failed to cancel application", "error");
        return;
      }
    } catch (err) {
      if (false) {
      }
    }
    }
    if (targetRef && (targetRef.status === "Pending" || targetRef.status === "Enrolled") && setPrograms) {
      setPrograms(prev => prev.map(p => {
        if (p.title === targetRef.programTitle || p.id === targetRef.programId) {
          return { ...p, slotsRemaining: Math.min(p.slotsTotal, p.slotsRemaining + 1) };
        }
        return p;
      }));
    }
    if (setReferrals) {
      setReferrals(prev => {
        const filtered = prev.filter(r => r.id !== referralId);
        const hasAnyOther = filtered.some(r => r.youthName === youthProfile.name);
        if (!hasAnyOther) {
          setYouthProfiles(all => all.map(y => {
            if (y.id === youthProfile.id) {
              return { ...y, hasReferred: false };
            }
            return y;
          }));
        }
        return filtered;
      });
      addToast("Application cancelled successfully.", "success");
      broadcastDataChange("referrals", "cancelled");
      broadcastDataChange("programs", "slots_updated");
    }
  };

  // Helper to convert strings to Title Case for newly added skills, interests, experiences, and modal requirements/eligibility
  const toTitleCase = (str: string): string => {
    if (!str) return "";
    return str
      .trim()
      .split(/\s+/)
      .map(word => {
        // Strip common punctuation to check if it's an acronym or special term
        const stripped = word.replace(/[^a-zA-Z0-9]/g, "");
        if (
          (stripped.length >= 2 && stripped.length <= 6 && stripped === stripped.toUpperCase() && /^[A-Z0-9]+$/.test(stripped)) ||
          (stripped.length >= 3 && stripped.endsWith("s") && stripped.slice(0, -1) === stripped.slice(0, -1).toUpperCase() && /^[A-Z0-9]+s$/.test(stripped)) ||
          /^FeLS|CBTM|TMI|PSA|TOR|NCs|NTTCs$/i.test(stripped)
        ) {
          return word;
        }
        return word
          .split("-")
          .map(part => part.replace(/([a-zA-Z])([a-zA-Z]*)/, (_, f, r) => f.toUpperCase() + r.toLowerCase()))
          .join("-");
      })
      .join(" ");
  };

  // local convenience updates
  const handleAddSkillSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (isUnverified) {
      addToast("Cannot add skills in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const formattedSkill = toTitleCase(newSkillInput);
    if (!formattedSkill) return;

    if (youthProfile.skills.includes(formattedSkill)) {
      addToast("Skill already exists in your profile", "info");
      return;
    }

    const updatedSkills = [...youthProfile.skills, formattedSkill];
    const updatedNormalized = normalizeSkills(updatedSkills);
    const tempYouth = {
      ...youthProfile,
      skills: updatedSkills,
      skillsRaw: updatedSkills,
      skillsNormalized: updatedNormalized
    };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : Math.min(99, youthProfile.matchScore + 3);

    // update global profiles immediately with normalized skills
    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        };
      }
      return y;
    }));

    // Persist skill addition to PostgreSQL
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save skill");
      }
      addToast(`Added "${formattedSkill}" to your skills. Matches refreshed!`, "success");
    } catch (err: any) {
      console.error("Error persisting skill addition:", err);
      addToast("Failed to save skill: " + (err.message || "Network error"), "error");
    }

    setNewSkillInput("");
    setShowAddSkillModal(false);
  };

  const handleDOBChange = (dob: string) => {
    const clean = dob ? String(dob).split("T")[0] : "";
    setEditBirthdate(clean);
    if (clean) {
      const calculated = calculateAge(clean);
      if (calculated !== "") {
        setEditAge(calculated);
      }
    }
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUnverified) {
      addToast("Cannot edit profile details while awaiting SK Verification", "error");
      return;
    }

    const calculatedAge = editBirthdate ? calculateAge(editBirthdate) : "";
    const ageNum = calculatedAge !== "" ? Number(calculatedAge) : (parseInt(String(editAge), 10) || youthProfile.age || 20);

    const tempYouth: YouthProfile = {
      ...youthProfile,
      birthdate: editBirthdate || youthProfile.birthdate,
      age: ageNum,
      gender: editGender,
      purok: editPurok,
      sectorPreference: editSector,
      contactNumber: editPhone,
      educationalAttainment: editEdu,
      currentStatus: editStatus,
      soloParent: editSoloParent,
      pwd: editPwd,
      indigenous: editIndigenous
    };

    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : youthProfile.matchScore;

    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          birthdate: editBirthdate,
          age: ageNum,
          gender: editGender,
          purok: editPurok,
          sectorPreference: editSector,
          contactNumber: editPhone,
          educationalAttainment: editEdu,
          currentStatus: editStatus,
          soloParent: editSoloParent,
          pwd: editPwd,
          indigenous: editIndigenous,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, ...tempYouth, matchScore: updatedMatchScore } : y));
        addToast("Profile demographics updated successfully!", "success");
        setIsEditingProfile(false);
      } else {
        addToast(data.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      addToast("Failed to save profile changes.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    const cleanDob = youthProfile.birthdate ? String(youthProfile.birthdate).split("T")[0] : "";
    setEditBirthdate(cleanDob);
    const computed = cleanDob ? calculateAge(cleanDob) : "";
    setEditAge(computed !== "" ? computed : (youthProfile.age || 20));
    setEditGender(spellOutGender(youthProfile.gender));
    setEditPurok(youthProfile.purok || "Purok 1");
    setEditGoal(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
    setEditSector(youthProfile.sectorPreference || "Information & Communications Technology (ICT)");
    setEditPhone(youthProfile.contactNumber || "+63 9");
    setEditEdu(normalizeEducationalAttainment(youthProfile.educationalAttainment));
    setEditStatus(youthProfile.currentStatus || "Out-of-school");
    setEditSoloParent(Boolean(youthProfile.soloParent));
    setEditPwd(Boolean(youthProfile.pwd));
    setEditIndigenous(Boolean(youthProfile.indigenous));
    setIsEditingProfile(false);
  };

  const handleSaveCareerGoal = async () => {
    if (isUnverified) {
      addToast("Cannot edit career goal while awaiting SK Verification", "error");
      return;
    }
    if (!careerGoalInput.trim()) {
      addToast("Please provide your livelihood & career goal", "error");
      return;
    }

    setIsSavingGoal(true);
    try {
      const tempYouth: YouthProfile = {
        ...youthProfile,
        livelihoodGoal: careerGoalInput.trim(),
        goalRaw: careerGoalInput.trim()
      };

      const updatedMatchScore = programs && programs.length > 0
        ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
        : youthProfile.matchScore;

      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          livelihoodGoal: careerGoalInput.trim(),
          goalRaw: careerGoalInput.trim(),
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (data.success) {
        setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? {
          ...y,
          livelihoodGoal: careerGoalInput.trim(),
          goalRaw: careerGoalInput.trim(),
          matchScore: updatedMatchScore
        } : y));
        setEditGoal(careerGoalInput.trim());
        addToast("Livelihood & Career Goal updated successfully!", "success");
        setIsEditingGoal(false);
      } else {
        addToast(data.error || "Failed to save career goal", "error");
      }
    } catch (err) {
      console.error("Error saving career goal:", err);
      addToast("Failed to save career goal: Network error", "error");
    } finally {
      setIsSavingGoal(false);
    }
  };

  const handleAddPreference = async (pref: string) => {
    const formatted = toTitleCase(pref);
    if (!formatted) return;
    const currentPrefs = youthProfile.preferencesRaw || youthProfile.interests || [];
    if (currentPrefs.includes(formatted)) {
      addToast("Vocational interest already exists in your profile", "info");
      return;
    }
    const updatedPrefs = [...currentPrefs, formatted];

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, preferencesRaw: updatedPrefs, interests: updatedPrefs } : y));
    setNewPrefInput("");
    addToast(`Added vocational interest "${formatted}"`, "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, preferencesRaw: updatedPrefs })
      });
    } catch (err) {
      console.error("Failed to add preference:", err);
    }
  };

  const handleRemovePreference = async (pref: string) => {
    if (isUnverified) {
      addToast("Cannot edit preferences in View-Only Mode", "error");
      return;
    }
    const currentPrefs = youthProfile.preferencesRaw || youthProfile.interests || [];
    const updatedPrefs = currentPrefs.filter(p => p !== pref);

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, preferencesRaw: updatedPrefs, interests: updatedPrefs } : y));
    addToast(`Removed vocational interest "${pref}"`, "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, preferencesRaw: updatedPrefs })
      });
    } catch (err) {
      console.error("Failed to remove preference:", err);
    }
  };

  const handleAddExperience = async (exp: string) => {
    const formatted = toTitleCase(exp);
    if (!formatted) return;
    const currentExps = youthProfile.experiencesRaw || [];
    if (currentExps.includes(formatted)) {
      addToast("Prior experience already exists in your profile", "info");
      return;
    }
    const updatedExps = [...currentExps, formatted];

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, experiencesRaw: updatedExps } : y));
    setNewExpInput("");
    addToast(`Added prior work/practical experience "${formatted}"`, "success");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, experiencesRaw: updatedExps })
      });
    } catch (err) {
      console.error("Failed to add experience:", err);
    }
  };

  const handleRemoveExperience = async (exp: string) => {
    if (isUnverified) {
      addToast("Cannot edit experiences in View-Only Mode", "error");
      return;
    }
    const currentExps = youthProfile.experiencesRaw || [];
    const updatedExps = currentExps.filter(e => e !== exp);

    setYouthProfiles(prev => prev.map(y => y.id === youthProfile.id ? { ...y, experiencesRaw: updatedExps } : y));
    addToast(`Removed prior experience "${exp}"`, "info");

    try {
      await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: youthProfile.id, experiencesRaw: updatedExps })
      });
    } catch (err) {
      console.error("Failed to remove experience:", err);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addToast("Please fill in all password fields", "error");
      return;
    }
    if (!isPassLengthValid) {
      addToast("New password must be at least 8 characters long", "error");
      return;
    }
    if (!isPassCaseValid) {
      addToast("New password must combine uppercase and lowercase letters", "error");
      return;
    }
    if (!isPassCharTypeValid) {
      addToast("New password must include numbers or symbols", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New password and password confirmation do not match", "error");
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        addToast(data.message || "Account password updated successfully!", "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        addToast(data.message || "Failed to change password", "error");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      addToast("Network error updating password", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRemoveSkillLocal = async (skill: string) => {
    if (isUnverified) {
      addToast("Cannot remove skills in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    const updatedSkills = youthProfile.skills.filter(s => s !== skill);
    const updatedNormalized = normalizeSkills(updatedSkills);
    const tempYouth = {
      ...youthProfile,
      skills: updatedSkills,
      skillsRaw: updatedSkills,
      skillsNormalized: updatedNormalized
    };
    const updatedMatchScore = programs && programs.length > 0
      ? Math.max(...programs.map(p => calculateContentBasedMatchScore(tempYouth, p)))
      : youthProfile.matchScore;

    setYouthProfiles(prev => prev.map(y => {
      if (y.id === youthProfile.id) {
        return {
          ...y,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        };
      }
      return y;
    }));

    // Persist skill removal to PostgreSQL
    try {
      const res = await fetch("/api/youth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: youthProfile.id,
          skills: updatedSkills,
          skillsRaw: updatedSkills,
          skillsNormalized: updatedNormalized,
          matchScore: updatedMatchScore
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to remove skill");
      }
      addToast(`Skill "${skill}" removed`, "info");
    } catch (err: any) {
      console.error("Error persisting skill removal:", err);
      addToast("Failed to remove skill: " + (err.message || "Network error"), "error");
    }
  };

  // Direct Apply to TESDA
  const handleDirectApply = (prog: TESDAProgram) => {
    if (isUnverified) {
      addToast("Cannot apply for programs in View-Only Mode (Awaiting SK Verification)", "error");
      return;
    }
    if (isProgramEnded(prog)) {
      addToast(`Sorry, "${prog.title}" has already ended or concluded its period.`, "error");
      return;
    }
    if (isProgramCompleted(prog)) {
      addToast(`You have already completed "${prog.title}" and earned your certification. You cannot re-take this qualification.`, "info");
      return;
    }
    if (prog.slotsRemaining <= 0) {
      addToast(`Sorry, "${prog.title}" is already full!`, "error");
      return;
    }

    const existingApp = referrals?.find(
      r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail) && (r.programId === prog.id || r.programTitle === prog.title)
    );
    if (existingApp) {
      addToast(`You have already submitted an application for "${prog.title}".`, "info");
      return;
    }
    setSelectedProgramToApply(prog);
    setShowApplyModal(true);
  };

  const confirmDirectApply = async () => {
    if (!selectedProgramToApply || isSubmittingApplication || isSubmittingAppRef.current) return;
    const existingApp = referrals?.find(
      r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail) && (r.programId === selectedProgramToApply.id || r.programTitle === selectedProgramToApply.title)
    );
    if (existingApp) {
      addToast(`You have already submitted an application for "${selectedProgramToApply.title}".`, "info");
      isSubmittingAppRef.current = false;
      setIsSubmittingApplication(false);
      setShowApplyModal(false);
      setViewingProgramModal(null);
      setSelectedProgramToApply(null);
      return;
    }
    if (isProgramEnded(selectedProgramToApply)) {
      addToast(`Sorry, "${selectedProgramToApply.title}" has already ended or concluded its period.`, "error");
      return;
    }
    if (selectedProgramToApply.slotsRemaining <= 0) {
      addToast(`Sorry, "${selectedProgramToApply.title}" is already full!`, "error");
      return;
    }

    const overlapWarning = getOverlapWarning(selectedProgramToApply);
    if (overlapWarning) {
      addToast(overlapWarning, "error");
      return;
    }

    const calculatedScore = calculateContentBasedMatchScore(youthProfile, selectedProgramToApply);
    isSubmittingAppRef.current = true;
    setIsSubmittingApplication(true);

    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youthId: youthProfile.id,
          youthName: youthProfile.name,
          programId: selectedProgramToApply.id,
          programTitle: selectedProgramToApply.title,
          matchScore: calculatedScore
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (setReferrals) {
          setReferrals(prev => [
            data.data,
            ...prev.filter(
              r =>
                r.id !== data.data.id &&
                !(
                  isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail) &&
                  (r.programId === selectedProgramToApply.id || r.programTitle === selectedProgramToApply.title)
                )
            )
          ]);
        }
        if (setPrograms && !data.alreadyExisted) {
          setPrograms(prev => prev.map(p => {
            if (p.id === selectedProgramToApply.id || p.title === selectedProgramToApply.title) {
              return { ...p, slotsRemaining: Math.max(0, p.slotsRemaining - 1) };
            }
            return p;
          }));
        }
        setYouthProfiles(prev => prev.map(y => {
          if (y.id === youthProfile.id) {
            return { ...y, hasReferred: true };
          }
          return y;
        }));
        addToast(`Application for "${selectedProgramToApply.title}" submitted directly to TESDA successfully!`, "success");
        broadcastDataChange("referrals", "created");
        broadcastDataChange("programs", "slots_updated");
      } else {
        addToast(data.error || "Failed to submit application", "error");
      }
    } catch (err) {
      console.error("Application submission error:", err);
      addToast("Failed to submit application. Please try again.", "error");
    } finally {
      isSubmittingAppRef.current = false;
      setIsSubmittingApplication(false);
      setShowApplyModal(false);
      setViewingProgramModal(null);
      setSelectedProgramToApply(null);
    }
  };

  return (
    <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] overflow-hidden overscroll-none bg-[#FAFAF8] flex w-full font-sans antialiased" id="youth-portal-container">

      {/* Mobile & Tablet Navigation Backdrop Overlay */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 xl:hidden transition-opacity"
          onClick={() => setIsMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation (Responsive Sliding Drawer on Mobile & Tablet / Sticky on Desktop) */}
      <aside
        className={`fixed xl:static inset-y-0 left-0 z-50 w-72 sm:w-80 xl:w-[17%] xl:min-w-[260px] h-[100dvh] max-h-[100dvh] shrink-0 bg-[#082D21] text-white flex flex-col justify-between shadow-2xl xl:shadow-none border-r border-white/10 select-none overflow-y-auto overscroll-y-contain overflow-x-hidden transform transition-transform duration-300 ease-in-out font-sans ${isMobileNavOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
          }`}
      >
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-y-contain min-h-0 flex-1">
          {/* Logo Header */}
          <div className="flex items-center justify-between mb-6 px-0.5 pt-0.5">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 sidebar-brand-container">
              <SikapLogo size={36} logoSize={38} textSize={27} variant="white" showText={true} disableHover={true} className="sidebar-brand-logo" />
              <div className="border-l border-white/20 pl-2 sm:pl-2.5 min-w-0 shrink-0 flex flex-col justify-center sidebar-brand-divider">
                <span className="text-[10px] sm:text-[13px] font-black text-amber-400 uppercase tracking-wider block leading-tight sidebar-brand-position">Youth</span>
                <span className="text-[9px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide block truncate leading-tight mt-0.5 max-w-[95px] sm:max-w-[120px] xl:max-w-[135px] sidebar-brand-barangay" title={youthProfile.barangay || "San Luis"}>
                  {(youthProfile.barangay || "San Luis").replace(/^Barangay\s+/i, "")}
                </span>
              </div>
            </div>

            {/* Mobile/Tablet Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(false)}
              className="xl:hidden p-1 text-emerald-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5 relative">
            {[
              {
                id: YouthScreen.HOME,
                label: "Dashboard",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-300 shrink-0" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect width="7" height="7" x="3" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="3" rx="2" />
                    <rect width="7" height="7" x="14" y="14" rx="2" />
                    <rect width="7" height="7" x="3" y="14" rx="2" />
                  </svg>
                )
              },
              {
                id: YouthScreen.MATCHES,
                label: "Matched Programs",
                activeIcon: (
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="6" fill="currentColor" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                )
              },
              {
                id: YouthScreen.PATHWAY,
                label: "Livelihood Pathway",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-400 shrink-0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                ),
                inactiveIcon: (
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="6" />
                    <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                  </svg>
                )
              },
              {
                id: YouthScreen.PROFILE,
                label: "Settings",
                activeIcon: (
                  <svg className="w-5 h-5 fill-current text-emerald-400 shrink-0" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
                    />
                  </svg>
                ),
                inactiveIcon: (
                  <Settings className="w-5 h-5 shrink-0" />
                )
              }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const isLocked = isUnverified && tab.id !== YouthScreen.HOME;

              return (
                <div key={tab.id} className="relative">
                  {/* Animated Active Page Indicator Bar on far-left edge */}
                  {isActive && !isLocked && (
                    <motion.span
                      layoutId="youthActiveIndicator"
                      className="absolute -left-4 sm:-left-5 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#02513B] rounded-r-full shadow-[0_0_8px_rgba(2,81,59,0.8)] z-20 pointer-events-none"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Animated Active Pill Background */}
                  {isActive && !isLocked && (
                    <motion.div
                      layoutId="youthActiveBackground"
                      className="absolute inset-0 bg-[#02513B] rounded-xl pointer-events-none z-0 shadow-sm border border-emerald-400/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      aria-hidden="true"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (isLocked) {
                        addToast("Locked in View-Only Mode while awaiting verification", "info");
                        return;
                      }
                      setActiveTab(tab.id);
                      setIsMobileNavOpen(false);
                    }}
                    aria-disabled={isLocked}
                    className={`relative z-10 w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium transition-colors duration-200 text-left group tracking-tight outline-none focus:outline-none ${isLocked
                      ? "text-emerald-200/60 cursor-not-allowed select-none hover:text-white/75 hover:bg-white/[0.04]"
                      : isActive
                        ? "text-emerald-300 cursor-pointer"
                        : "text-gray-300/80 hover:bg-white/5 hover:text-white cursor-pointer"
                      }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <span className={`transition-colors duration-200 shrink-0 ${isActive && !isLocked
                        ? "text-emerald-300"
                        : isLocked
                          ? "text-current"
                          : "text-gray-400 group-hover:text-gray-200"
                        }`}>
                        {isActive && !isLocked ? tab.activeIcon : tab.inactiveIcon}
                      </span>
                      <span className="truncate">{tab.label}</span>
                    </div>

                    {/* Lock icon appears on hover on the right part of selector when locked */}
                    {isLocked && (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0 pl-2 text-current">
                        <Lock className="w-4 h-4 shrink-0" />
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Avatar, Name & Sign Out in One Row */}
        <div className="p-3 sm:p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shrink-0 bg-[#082D21]">
          {/* Break line with horizontal padding */}
          <div className="px-1 pb-2.5 pt-1">
            <div className="h-[1px] w-full bg-white/20 rounded-full" />
          </div>

          {/* Avatar, Name, and Sign Out Button in One Row */}
          <div className="flex items-center justify-between gap-2.5 px-2 py-1.5 rounded-xl">
            {/* User Profile Info (Avatar + Complete Name - Static without hover effect) */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Avatar without hover effect */}
              <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs border border-amber-400/40 shrink-0 select-none overflow-hidden">
                {youthProfile?.name ? (
                  youthProfile.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  "KK"
                )}
              </div>

              {/* Complete Name and Email without hover effect */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white leading-snug break-words">
                  {youthProfile?.name || currentUser?.name || "Youth Member"}
                </p>
                <p className="text-xs text-gray-400 truncate leading-tight mt-0.5" title={youthProfile?.email || currentUser?.email || "youth.member@sanluispampanga.gov.ph"}>
                  {youthProfile?.email || currentUser?.email || "youth.member@sanluispampanga.gov.ph"}
                </p>
              </div>
            </div>

            {/* Sign Out Button (Only element with hover effect) */}
            <button
              type="button"
              disabled={isLoggingOut}
              onClick={handleSignOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2.5 text-gray-400 hover:text-red-300 hover:bg-red-500/15 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed group/logout"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin text-red-300 shrink-0" />
              ) : (
                <LogOut className="w-5 h-5 group-hover/logout:text-red-300 transition-colors shrink-0" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main
        onScroll={(e) => updatePortalScrollVelocity(e.currentTarget.scrollTop)}
        className="flex-1 h-full max-h-full flex flex-col min-w-0 overflow-y-auto overscroll-y-contain pb-12 sm:pb-6"
      >
        <header className="sticky top-0 bg-white/95 backdrop-blur-xs border-b border-gray-100 z-40 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
            {/* Mobile & Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              className="xl:hidden p-2 -ml-1 text-gray-700 hover:text-[#0A6B43] hover:bg-emerald-50 rounded-xl transition-colors shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[24px] xl:text-3xl font-black text-[#0A6B43] tracking-tight leading-tight truncate">
                {activeTab === YouthScreen.HOME && "Dashboard"}
                {activeTab === YouthScreen.MATCHES && "Matched Programs"}
                {activeTab === YouthScreen.PATHWAY && "Livelihood Pathway"}
                {activeTab === YouthScreen.PROFILE && "Settings"}
              </h1>
            </div>
          </div>

          <div className="flex items-center relative shrink-0" id="notification-bell-container">
            {/* Notification Bell (Enlarged) */}
            <div className="relative">
              {(() => {
                const userApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail)) || [];
                const rawNotifications: Array<{ id: string; text: string; subtext: string; date: string; type: "pending" | "enrolled" | "declined" | "general"; targetTab: YouthScreen }> = [];

                // Official Katipunan ng Kabataan (KK) Account Verification Alert
                if (youthProfile.approvalStatus === "Approved") {
                  rawNotifications.push({
                    id: `notify-account-approved-${youthProfile.id}`,
                    text: "KK Membership Approved!",
                    subtext: `Your Katipunan ng Kabataan account has been verified and approved by Barangay ${youthProfile.barangay || "San Luis"} SK Officials. You now have full access to municipal youth programs.`,
                    date: youthProfile.registeredDate || "Verified",
                    type: "enrolled",
                    targetTab: YouthScreen.HOME
                  });
                } else if (youthProfile.approvalStatus === "Rejected") {
                  rawNotifications.push({
                    id: `notify-account-rejected-${youthProfile.id}`,
                    text: "Registration Verification Update",
                    subtext: `Your Katipunan ng Kabataan registration for Barangay ${youthProfile.barangay || "San Luis"} could not be approved. Please connect with your SK Chairperson with your valid ID.`,
                    date: "Action Required",
                    type: "declined",
                    targetTab: YouthScreen.PROFILE
                  });
                } else if (youthProfile.approvalStatus === "Pending") {
                  rawNotifications.push({
                    id: `notify-account-pending-${youthProfile.id}`,
                    text: "Registration Pending SK Verification",
                    subtext: `Your Katipunan ng Kabataan account is awaiting verification by Barangay ${youthProfile.barangay || "San Luis"} SK Officials. Full catalog application will unlock upon approval.`,
                    date: youthProfile.registeredDate || "Pending Review",
                    type: "pending",
                    targetTab: YouthScreen.PROFILE
                  });
                }

                userApps.forEach(app => {
                  if (app.status === "Pending") {
                    rawNotifications.push({
                      id: `notify-${app.id}-pending`,
                      text: `Requirements Submission Required`,
                      subtext: `Your application for "${app.programTitle}" is pending. Submit physical requirements at TESDA GPSAT.`,
                      date: app.referralDate || "Just Now",
                      type: "pending",
                      targetTab: YouthScreen.PATHWAY
                    });
                  } else if (app.status === "Enrolled") {
                    rawNotifications.push({
                      id: `notify-${app.id}-enrolled`,
                      text: `Enrollment Approved!`,
                      subtext: `You are officially accepted into "${app.programTitle}". Training sessions will start soon.`,
                      date: "Just Now",
                      type: "enrolled",
                      targetTab: YouthScreen.PATHWAY
                    });
                  } else if (app.status === "Declined") {
                    rawNotifications.push({
                      id: `notify-${app.id}-declined`,
                      text: `Application Declined`,
                      subtext: `Your application for "${app.programTitle}" was declined.`,
                      date: "Just Now",
                      type: "declined",
                      targetTab: YouthScreen.PATHWAY
                    });
                  } else if (app.status === "Archived" || (app as any).status === "Completed") {
                    rawNotifications.push({
                      id: `notify-${app.id}-completed`,
                      text: `Certified Graduate: ${app.programTitle} 🎓`,
                      subtext: `Congratulations! You have completed this course. Your verified credential is archived in your Digital ID & Credentials Hub.`,
                      date: app.referralDate || "Completed",
                      type: "enrolled",
                      targetTab: YouthScreen.PROFILE
                    });
                  }
                });

                // Published TESDA Scholarship Program Offerings
                programs.filter(p => p.activeStatus === "Active").slice(0, 2).forEach(prog => {
                  rawNotifications.push({
                    id: `notify-prog-${prog.id}`,
                    text: `New Program: ${prog.title}`,
                    subtext: `${prog.provider} opened ${prog.slotsRemaining} scholarship slot(s). Check requirements and apply.`,
                    date: "Available Now",
                    type: "general",
                    targetTab: YouthScreen.PATHWAY
                  });
                });

                localAnnouncements.forEach((ann, idx) => {
                  const annId = ann.id || `ann-${(ann.title || "").replace(/[^a-zA-Z0-9]/g, "_")}-${idx}`;
                  rawNotifications.push({
                    id: `notify-ann-${annId}`,
                    text: ann.title,
                    subtext: ann.body,
                    date: ann.datePosted,
                    type: "general",
                    targetTab: YouthScreen.HOME
                  });
                });

                const notificationsList = rawNotifications.filter(item => !clearedNotificationIds.includes(item.id));
                const unreadCount = notificationsList.filter(item => !readNotificationIds.includes(item.id)).length;

                return (
                  <>
                    <NotificationBellButton
                      isOpen={showNotifications}
                      onClick={() => setShowNotifications(!showNotifications)}
                      unreadCount={unreadCount}
                      title="Notifications"
                      size="lg"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shadow-xs"
                    />

                    {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="fixed inset-x-3.5 top-20 mx-auto sm:mx-0 sm:inset-x-auto sm:right-0 sm:top-14 w-auto sm:w-96 max-w-sm sm:max-w-none sm:absolute z-50 bg-white border border-emerald-100 rounded-2xl shadow-2xl py-3 text-xs overflow-hidden animate-in fade-in-50 slide-in-from-top-2 flex flex-col max-h-[80vh] sm:max-h-none">
                          <div className="px-4 pb-2 border-b border-gray-100 flex justify-between items-center bg-emerald-50/60 p-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <Bell className="w-4 h-4 text-[#0A6B43]" />
                              <span className="font-extrabold text-gray-900 text-sm">Notifications & Alerts</span>
                              {unreadCount > 0 && (
                                <span className="bg-[#0A6B43] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                  {unreadCount}
                                </span>
                              )}
                            </div>
                            {notificationsList.length > 0 && (
                              <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => markAllAsRead(notificationsList.map(n => n.id))}
                                      className="text-[10px] font-bold text-[#0A6B43] hover:underline cursor-pointer"
                                      title="Mark all notifications as read"
                                    >
                                      Mark all read
                                    </button>
                                    <span className="text-gray-300">·</span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => clearAllNotifications(notificationsList.map(n => n.id))}
                                  className="text-[10px] font-bold text-gray-500 hover:text-rose-600 cursor-pointer transition-colors"
                                  title="Clear all alerts"
                                >
                                  Clear all
                                </button>
                              </div>
                            )}
                          </div>

                          <NotificationSettingsCard compact userRole="KK_YOUTH" addToast={addToast} />

                          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                            {notificationsList.length === 0 ? (
                              <div className="p-8 text-center text-gray-400 font-medium space-y-1">
                                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto opacity-60" />
                                <p className="text-xs font-bold text-gray-700">No alerts right now</p>
                                <p className="text-[10px] text-gray-400">You are all caught up with your training applications!</p>
                              </div>
                            ) : (
                              notificationsList.map((item) => {
                                const isRead = readNotificationIds.includes(item.id);
                                return (
                                  <div
                                    key={item.id}
                                    onClick={() => {
                                      markAsRead(item.id);
                                      if (!isUnverified || item.targetTab === YouthScreen.HOME || item.targetTab === YouthScreen.PROFILE) {
                                        setActiveTab(item.targetTab);
                                      } else {
                                        addToast("Locked in View-Only Mode while awaiting verification", "info");
                                      }
                                      setShowNotifications(false);
                                    }}
                                    className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 group relative ${
                                      isRead ? "bg-white hover:bg-gray-50/80" : "bg-emerald-50/30 hover:bg-emerald-50/60"
                                    }`}
                                  >
                                    <span className="mt-0.5 shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 border border-gray-150 relative">
                                      {item.type === "enrolled" && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                                      {item.type === "pending" && <ClipboardList className="w-3.5 h-3.5 text-blue-600" />}
                                      {item.type === "declined" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                      {item.type === "general" && <Megaphone className="w-3.5 h-3.5 text-amber-500" />}
                                      {!isRead && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#0A6B43] rounded-full ring-2 ring-white" />
                                      )}
                                    </span>
                                    <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                                      <p className={`leading-tight text-xs ${isRead ? "font-semibold text-gray-700" : "font-extrabold text-gray-900"}`}>
                                        {item.text}
                                      </p>
                                      <p className={`text-[11px] leading-relaxed ${isRead ? "text-gray-400 font-normal" : "text-gray-600 font-medium"}`}>
                                        {item.subtext}
                                      </p>
                                      <p className="text-[9px] text-emerald-700 mt-1 font-semibold">{item.date}</p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0 -mr-1">
                                      {!isRead && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(item.id);
                                          }}
                                          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-emerald-700 hover:bg-emerald-100/70 p-1.5 sm:p-1 rounded-md transition-all"
                                          title="Mark as read"
                                        >
                                          <Check className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          dismissNotification(item.id);
                                        }}
                                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-gray-400 hover:text-rose-600 hover:bg-gray-100 p-1.5 sm:p-1 rounded-md transition-all shrink-0"
                                        title="Clear alert"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className="p-2.5 bg-gray-50 text-center border-t border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400">Click an alert to view it, or click close to dismiss</span>
                          </div>
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </header>

        {/* Outer content container */}
        <div className="px-2 sm:px-3 lg:px-4 py-4 sm:py-6 max-w-[1420px] mx-auto w-full space-y-5 sm:space-y-6">

          {isUnverified && (
            <div className="bg-[#FEEDC9] border border-amber-200/80 rounded-xl sm:rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <Clock className="w-4 h-4 text-[#753B07] shrink-0" />
                <p className="text-xs sm:text-sm text-[#753B07] leading-relaxed">
                  <span className="font-bold">View-only mode.</span>{" "}
                  <span>Your registration is awaiting verification. Full access will be available once approved.</span>
                </p>
              </div>
              <span className="bg-[#E48212] text-white text-xs font-bold px-3.5 py-1 rounded-full shrink-0 shadow-2xs animate-pulse">
                Pending
              </span>
            </div>
          )}

          {/* HOME TAB SCREEN */}
          {activeTab === YouthScreen.HOME && (
            <div className="space-y-5 sm:space-y-6">

              {/* ROW 1 — GREETINGS CARD */}
              <PortalScrollReveal delay={0.05}>
                <div
                  className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                  style={{
                    background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                  }}
                >
                  {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                  <GrowthPlantAnimation />

                  {/* Content - Header and Subheader Only */}
                  <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                    <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                      Mabuhay, {youthProfile.name}!
                    </h2>
                    <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                      {isUnverified
                        ? "Explore your Content-Based Filtering (CBF) training matches below. Program applications will unlock once verified by your Barangay SK Chairman."
                        : "Discover TESDA training opportunities that match your skills, interests, and career goals."}
                    </p>
                  </div>
                </div>
              </PortalScrollReveal>

              {/* ACTIVE ENROLLED CLASSES SCHEDULE BANNER (When Officially Enrolled) */}
              {enrolledPrograms.length > 0 && (
                <div className="space-y-6" id="active-classes-schedule-container">
                  {enrolledPrograms.map(({ ref, program }) => {
                    const scheduleDays = formatTrainingDays(program?.trainingDays);
                    const timeslot = formatProgramTimeslot(program?.startTime, program?.endTime);
                    const room = program?.room || "Main Training Facility";
                    const instructor = program?.instructor || "TESDA Certified Instructor";
                    const provider = (program?.provider || program?.centerName) || "TESDA Training Center";
                    const location = extractLocationDisplay(program?.location) || "San Luis, Pampanga";

                    return (
                      <PortalScrollReveal key={ref.id} delay={0.06}>
                        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-emerald-100/80">
                          {/* Header: Dark Green #082D21 with Program Title and Program Provider, and Orange "Officially Enrolled" Pill */}
                          <div className="bg-[#082D21] text-white p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="text-white min-w-0">
                              <h4 className="text-[18px] font-extrabold tracking-tight text-white leading-tight break-words">
                                {ref.programTitle}
                              </h4>
                              <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                                {provider}
                              </p>
                            </div>
                            <span className="self-start sm:self-auto inline-flex items-center gap-2 bg-[#F5A623]/20 text-[#F5A623] text-[10px] sm:text-[11px] font-extrabold px-3 py-1 rounded-full border border-[#F5A623]/40 uppercase tracking-wider shadow-2xs shrink-0">
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5A623] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5A623]"></span>
                              </span>
                              <span>Officially Enrolled</span>
                            </span>
                          </div>

                          <div className="p-4 sm:p-6">
                            {/* 2-Column Responsive Layout: 30% Map | 70% Details */}
                            <div className="flex flex-col lg:flex-row items-stretch gap-5 sm:gap-6">
                              {/* Left Column (30%): Map showing program location */}
                              <div className="w-full lg:w-[30%] flex flex-col shrink-0 min-h-[260px]">
                                <EnrolledProgramMiniMap
                                  program={program}
                                  locationString={program?.location}
                                  onOpenFullMap={() => handleOpenVenueMap(program || { id: "enrolled", title: ref.programTitle, provider, location } as any)}
                                />
                              </div>

                              {/* Right Column (70%): Details (Program Title, Provider, and Enrolled on removed) */}
                              <div className="w-full lg:w-[70%] min-w-0 flex flex-col space-y-3.5">
                                {/* Card 1: Class & Training Specifications */}
                                <div className="border border-gray-200/90 rounded-2xl bg-white p-4 sm:p-5 space-y-2.5 shadow-2xs">
                                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                    Class &amp; Training Specifications
                                  </span>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-gray-400 font-medium">
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <Timer className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Total Training Hours:</strong>{" "}
                                        {program?.trainingHours ? `${program.trainingHours} Hours` : "Flexible"}
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Period:</strong>{" "}
                                        {(program?.startDate && program?.endDate)
                                          ? formatProgramDateRange(program.startDate, program.endDate)
                                          : "Flexible Schedule"}
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Days:</strong>{" "}
                                        {scheduleDays}
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Hours:</strong>{" "}
                                        {timeslot.formattedRange}
                                        {timeslot.sessionType !== "Custom" ? ` (${timeslot.sessionType})` : ""}
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Mode:</strong>{" "}
                                        {program?.deliveryMode || "Face-to-Face"}
                                      </span>
                                    </li>
                                    <li className="flex items-center gap-2 leading-relaxed">
                                      <UserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Instructor:</strong>{" "}
                                        {instructor}
                                      </span>
                                    </li>
                                  </ul>
                                </div>

                                {/* Card 2: Location, Training Facility (not clickable) */}
                                <div className="border border-gray-200/90 rounded-2xl bg-white p-4 sm:p-5 space-y-2.5 shadow-2xs">
                                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                    Location &amp; Training Facility
                                  </span>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-gray-400 font-medium">
                                    <li className="flex items-start gap-2 leading-relaxed">
                                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Location:</strong>{" "}
                                        {location}
                                        {program?.centerName && (
                                          <span className="text-gray-400 font-normal block sm:inline sm:ml-1 text-[12px]">
                                            ({program.centerName})
                                          </span>
                                        )}
                                      </span>
                                    </li>
                                    <li className="flex items-start gap-2 leading-relaxed">
                                      <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                      <span>
                                        <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Facility:</strong>{" "}
                                        {room}
                                      </span>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </PortalScrollReveal>
                    );
                  })}
                </div>
              )}

              {/* ROW 2 — TRAINING MATCHES (60%) AND ANNOUNCEMENTS (40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 sm:gap-6 items-stretch">
                
                {/* Left: 60% width — Training Matches Donut Chart */}
                <PortalScrollReveal delay={0.08} className="lg:col-span-6 flex flex-col">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    {/* Header */}
                    <div className="pb-3 border-b border-gray-100">
                      <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Your Training Matches</h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Programs matched to your skills, interests, and goals</p>
                    </div>

                    {/* Chart and Legend Layout */}
                    {programs.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                          <Target className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-bold text-gray-800">No Training Programs Available</h5>
                        <p className="text-xs text-gray-400 max-w-sm font-medium">
                          TESDA programs will appear automatically here once published by training partners.
                        </p>
                      </div>
                    ) : (
                      <DashboardDonutVisual
                        matchDistribution={matchDistribution}
                        hoveredSlice={hoveredSlice}
                        setHoveredSlice={setHoveredSlice}
                        onProgramClick={handleNavigateToMatchedProgram}
                      />
                    )}
                  </div>
                </div>
              </PortalScrollReveal>

                {/* Right: 40% width — Announcements */}
                <PortalScrollReveal delay={0.12} className="lg:col-span-4 flex flex-col">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full" id="dashboard-announcements-container">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Announcements</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Latest community bulletins and training updates</p>
                      </div>
                      {localAnnouncements.length > 0 && (
                        <span className="text-[10px] font-black text-[#D97706] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {localAnnouncements.length}
                        </span>
                      )}
                    </div>

                    {localAnnouncements.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-2 min-h-[220px]">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                          <Megaphone className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-bold text-gray-800">No Active Announcements</h5>
                        <p className="text-xs text-gray-400 max-w-sm font-medium">
                          There are currently no active bulletins published for Barangay {youthProfile.barangay || "San Luis"}.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {localAnnouncements.map((ann) => (
                          <div key={ann.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-150/80 hover:bg-gray-50 transition-colors space-y-1.5">
                            <div className="flex items-center justify-between gap-1 text-[10px] flex-wrap">
                              <span className="font-extrabold text-[#D97706] uppercase tracking-wide bg-amber-100/60 px-1.5 py-0.5 rounded border border-amber-200">
                                {ann.category}
                              </span>
                              <span className="text-gray-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-400" />
                                {ann.datePosted}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-900 text-xs leading-snug line-clamp-1">{ann.title}</h5>
                            <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">{ann.body}</p>
                            {ann.eventDate && (
                              <p className="text-[10px] font-bold text-[#0A6B43] flex items-center gap-1 pt-0.5">
                                <Calendar className="w-3 h-3 text-[#0A6B43]" />
                                Event: {ann.eventDate}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </PortalScrollReveal>

              </div>

              {/* ROW 3 — RECOMMENDED PROGRAMS (50%) AND REGISTERED SKILLS (50%) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
                
                {/* Left: 50% width — Recommended Programs Horizontal Bar Graph */}
                <PortalScrollReveal delay={0.08} className="flex flex-col">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Recommended Programs</h4>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Top vocational courses curated for your profile</p>
                      </div>
                      <button
                        onClick={() => setActiveTab(YouthScreen.MATCHES)}
                        className="group text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-200 text-[#0A6B43] bg-emerald-50/60 hover:bg-[#0A6B43] hover:text-white active:scale-95 cursor-pointer transition-all shadow-2xs"
                      >
                        <span>View All</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1 group-hover:scale-110" />
                      </button>
                    </div>

                    {(() => {
                      const candidates = uncompletedScoredPrograms.filter(p => p.matchScore > 0);
                      const topMatches = (candidates.length > 0 ? candidates : scoredPrograms.filter(p => p.matchScore > 0))
                        .slice(0, 3);

                      if (topMatches.length === 0) {
                        return (
                          <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                              <Target className="w-6 h-6" />
                            </div>
                            <h5 className="text-sm font-bold text-gray-800">No Training Matches Found Yet</h5>
                            <p className="text-xs text-gray-400 max-w-sm font-medium">
                              Add skills or update your sector preferences in your profile to discover matched courses.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <DashboardRecommendedProgramsList
                          topMatches={topMatches}
                          onProgramClick={handleNavigateToMatchedProgram}
                        />
                      );
                    })()}
                  </div>
                </div>
              </PortalScrollReveal>

                {/* Right: 50% width — Registered Skills */}
                <PortalScrollReveal delay={0.12} className="flex flex-col">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full">
                  <div className="flex flex-col h-full">
                    {/* Header with number counter beside header title */}
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Registered Skills</h4>
                          <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-emerald-50 text-[#0A6B43] border border-emerald-200 text-xs font-black flex items-center justify-center leading-none">
                            {youthProfile.skills?.length || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Your recorded technical abilities and qualifications</p>
                      </div>
                      <button
                        onClick={() => {
                          if (isUnverified) {
                            addToast("Cannot add skills while account is awaiting SK verification", "error");
                            return;
                          }
                          setShowAddSkillModal(true);
                        }}
                        disabled={isUnverified}
                        className={`group text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                          isUnverified
                            ? "border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50"
                            : "border-emerald-200 text-[#0A6B43] bg-emerald-50/60 hover:bg-[#0A6B43] hover:text-white active:scale-95 cursor-pointer shadow-2xs"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" />
                        <span>Add Skill</span>
                      </button>
                    </div>

                    {/* Skills Badges Container - Pill size with staggered entrance animation */}
                    {youthProfile.skills && youthProfile.skills.length > 0 ? (
                      <DashboardRegisteredSkillsList
                        skills={youthProfile.skills}
                        isUnverified={isUnverified}
                        onRemoveSkill={handleRemoveSkillLocal}
                      />
                    ) : (
                      <div className="py-8 text-center flex flex-col items-center justify-center space-y-2 w-full">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-1">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <h5 className="text-sm font-bold text-gray-800">No Skills Added Yet</h5>
                        <p className="text-xs text-gray-400 max-w-sm font-medium">
                          Tap &ldquo;Add Skill&rdquo; to register your vocational competencies.
                        </p>
                      </div>
                    )}

                    {/* Tip & Guidance - Positioned to the bottom with line break */}
                    <div className="mt-6 sm:mt-auto pt-3 border-t border-gray-100">
                      <p className="text-[11px] text-gray-400 italic">
                        Tip: Registering skills that align with TESDA standards increases your match accuracy automatically.
                      </p>
                    </div>
                  </div>
                </div>
              </PortalScrollReveal>

              </div>

              {/* ROW 4 — LIVELIHOOD PATHWAY (60%) AND QUICK ACTIONS (40%) */}
              <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 sm:gap-6 items-stretch">
                
                {/* Left: 60% width — My Livelihood Pathway */}
                {(() => {
                  const rawUserApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail)) || [];
                  const seenProgKeys = new Set<string>();
                  const userApps = rawUserApps.filter(r => {
                    const key = (r.programId || r.programTitle || r.id).toLowerCase().trim();
                    if (seenProgKeys.has(key)) return false;
                    seenProgKeys.add(key);
                    return true;
                  });

                  // Sort user applications by latest date descending
                  const sortedApps = [...userApps].sort((a, b) => {
                    const timeA = new Date(a.rawDate || (a as any).createdAt || a.applicationDate || a.referralDate || 0).getTime();
                    const timeB = new Date(b.rawDate || (b as any).createdAt || b.applicationDate || b.referralDate || 0).getTime();
                    return timeB - timeA;
                  });

                  // Base Dashboard strictly on the active / currently taking program, independent of what is selected on Livelihood Pathways
                  const enrolledApp = sortedApps.find(a => a.status === "Enrolled");
                  const approvedApp = sortedApps.find(a => a.status === "Approved");
                  const archivedApp = sortedApps.find(a => a.status === "Archived");
                  const pendingApp = sortedApps.find(a => a.status === "Pending");

                  const targetApp = enrolledApp || approvedApp || archivedApp || pendingApp || sortedApps[0] || null;

                  const isEnrolled = targetApp?.status === "Enrolled";
                  const isApproved = targetApp?.status === "Approved";
                  const isPending = targetApp?.status === "Pending";
                  const isArchived = targetApp?.status === "Archived";
                  const isDeclined = targetApp?.status === "Declined";

                  const steps = [
                    {
                      num: 1,
                      label: "Register Profile",
                      status: isUnverified ? ("current" as const) : ("done" as const),
                      statusText: isUnverified ? "In Progress" : "Completed",
                    },
                    {
                      num: 2,
                      label: "Apply / Enroll",
                      status: (isEnrolled || isArchived)
                        ? ("done" as const)
                        : (isApproved || isPending || (!isUnverified && targetApp))
                          ? ("current" as const)
                          : (!isUnverified && !targetApp)
                            ? ("current" as const)
                            : ("not_done" as const),
                      statusText: (isEnrolled || isArchived)
                        ? "Completed"
                        : isApproved
                          ? "Submit Docs"
                          : isPending
                            ? "In Review"
                            : isDeclined
                              ? "Declined"
                              : (!isUnverified)
                                ? "In Progress"
                                : "Pending",
                    },
                    {
                      num: 3,
                      label: "Training Course",
                      status: isArchived
                        ? ("done" as const)
                        : isEnrolled
                          ? ("current" as const)
                          : ("not_done" as const),
                      statusText: isArchived ? "Completed" : isEnrolled ? "In Progress" : "Pending",
                    },
                    {
                      num: 4,
                      label: "AI Career Guide",
                      status: isArchived
                        ? ("done" as const)
                        : ("not_done" as const),
                      statusText: isArchived ? "Completed" : "Pending",
                    }
                  ];

                  return (
                    <PortalScrollReveal delay={0.08} className="lg:col-span-6 flex flex-col">
                      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="pb-3 border-b border-gray-100">
                          <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">My Livelihood Pathway</h4>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">
                            Step-by-step roadmap from skills training to career placement
                          </p>
                        </div>

                        {/* Modern Stepped Progress Stepper (Centered Layout) */}
                        <DashboardLivelihoodPathway
                          steps={steps}
                          onNavigateToPathway={() => {
                            if (targetApp) {
                              setSelectedPathwayAppId(targetApp.id);
                            }
                            setActiveTab(YouthScreen.PATHWAY);
                            setTimeout(() => {
                              const el = document.getElementById("pathway-training-journey-card");
                              if (el) {
                                el.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }, 100);
                          }}
                        />
                      </div>
                    </div>
                  </PortalScrollReveal>
                  );
                })()}

                {/* Right: 40% width — Quick Actions */}
                <PortalScrollReveal delay={0.12} className="lg:col-span-4 flex flex-col">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-gray-100">
                      <h4 className="text-[18px] font-extrabold text-gray-900 tracking-tight">Quick Actions</h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">Fast shortcuts to explore programs, matches, and profile settings</p>
                    </div>

                    <DashboardQuickActionsList
                      actions={[
                        {
                          label: "Explore Training Programs",
                          onClick: () => setActiveTab(YouthScreen.MATCHES),
                        },
                        {
                          label: "View My Matches",
                          onClick: () => setActiveTab(YouthScreen.MATCHES),
                        },
                        {
                          label: "Update My Profile",
                          onClick: () => {
                            setActiveTab(YouthScreen.PROFILE);
                            setProfileActiveTab("profile");
                          },
                        },
                        {
                          label: "View Announcements",
                          onClick: () => {
                            const el = document.getElementById("dashboard-announcements-container");
                            if (el) {
                              el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          },
                        },
                      ]}
                    />
                  </div>
                </div>
              </PortalScrollReveal>

              </div>

            </div>
          )}

          {/* MATCHES TAB SCREEN */}
          {activeTab === YouthScreen.MATCHES && (
            <motion.div
              key="matches-screen"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
              <div
                className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                style={{
                  background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                }}
              >
                {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                <GrowthPlantAnimation />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                  <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                    Personalized Matches
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                    Based on your registered competencies, Purok residence, and vocational career goals.
                  </p>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 sm:p-14 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 text-center flex flex-col items-center justify-center space-y-2">
                  <GraduationCap className="w-12 h-12 text-gray-400 mb-1" strokeWidth={1.75} />
                  <h4 className="font-extrabold text-gray-900 text-[18px] tracking-tight">More Opportunities Coming Soon</h4>
                  <p className="text-[14px] text-gray-500 max-w-md font-medium leading-relaxed">
                    Check back soon for training programs that match your skills and interests.
                  </p>
                </div>
              ) : (
                /* Card enclosure container matching the SiKap clean card aesthetics */
                <div id="matched-programs-card-container" className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6">
                  {/* Card Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-[26px] font-black text-gray-900 tracking-tight leading-none">
                        Matched Programs
                      </h3>
                    </div>
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                        {filteredMatchedPrograms.length} of {scoredPrograms.length} {scoredPrograms.length === 1 ? "Program" : "Programs"}
                      </span>
                    </div>
                  </div>

                  {/* Search Bar & Filter Controls Row (Filters hidden on Mobile & Tablet, visible on Desktop xl:) */}
                  <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={matchesSearchQuery}
                        onChange={(e) => setMatchesSearchQuery(e.target.value)}
                        placeholder="Search by program title, skill, provider, or sector..."
                        className="w-full pl-10 pr-9 py-2.5 bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#0A6B43] rounded-xl text-xs sm:text-sm text-gray-800 placeholder-gray-400 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/15"
                      />
                      {matchesSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setMatchesSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Filter Dropdowns - hidden on mobile and tablet, visible on desktop xl: */}
                    <div className="hidden xl:flex items-center gap-2 flex-wrap xl:flex-nowrap">
                      {/* Sector Filter */}
                      <select
                        value={matchesSectorFilter}
                        onChange={(e) => setMatchesSectorFilter(e.target.value)}
                        className="w-auto shrink-0 px-3 py-2.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 focus:border-[#0A6B43] rounded-xl text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/15 transition-all"
                      >
                        <option value="ALL">All Sector</option>
                        {availableProgramSectors.map(sec => (
                          <option key={sec} value={sec}>{sec}</option>
                        ))}
                      </select>

                      {/* Availability Filter */}
                      <select
                        value={matchesAvailabilityFilter}
                        onChange={(e) => setMatchesAvailabilityFilter(e.target.value)}
                        className="w-auto shrink-0 px-3 py-2.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 focus:border-[#0A6B43] rounded-xl text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/15 transition-all"
                      >
                        <option value="ALL">All Availability</option>
                        <option value="available">Has Open Slots</option>
                        <option value="active">Active Term Only</option>
                        <option value="completed">Completed Qualifications</option>
                      </select>

                      {/* Cost Filter */}
                      <select
                        value={matchesCostFilter}
                        onChange={(e) => setMatchesCostFilter(e.target.value)}
                        className="w-auto shrink-0 px-3 py-2.5 bg-gray-50/80 hover:bg-gray-50 border border-gray-200 focus:border-[#0A6B43] rounded-xl text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0A6B43]/15 transition-all"
                      >
                        <option value="ALL">All Cost</option>
                        <option value="Free">Free</option>
                        <option value="Subsidized">Subsidized</option>
                        <option value="With Fee">With Fee</option>
                      </select>
                    </div>
                  </div>

                  {/* Clickable Pill Filters: Top Matches, Highly Recommended, Good Matches, Potential Matches, Limited Matches, Others */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {availableMatchPills.map(pill => {
                      const isSelected = activeMatchPill === pill.key;
                      return (
                        <button
                          key={pill.key}
                          type="button"
                          onClick={() => setMatchesPillFilter(pill.key === activeMatchPill ? "ALL" : pill.key)}
                          className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? "text-white"
                              : "bg-gray-100/90 hover:bg-gray-200/80 text-gray-700 border border-transparent hover:border-gray-200 hover:scale-105"
                          }`}
                        >
                          {isSelected && (
                            <motion.span
                              layoutId="activeMatchedPillIndicator"
                              className="absolute inset-0 bg-[#0A6B43] rounded-full shadow-xs ring-2 ring-[#0A6B43]/20"
                              transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            />
                          )}
                          <span className="relative z-10">{pill.label}</span>
                          <span
                            className={`relative z-10 text-[10px] font-black px-1.5 py-0.5 rounded-full transition-colors ${
                              isSelected ? "bg-white/25 text-white" : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {pill.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Card Results: ONLY Grid View (No Table View) */}
                  {filteredMatchedPrograms.length === 0 ? (
                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-base">No matching programs found</h4>
                      <p className="text-xs text-gray-500 max-w-sm">
                        No training programs match your active filters or search terms. Try clearing your search or switching category pills.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setMatchesSearchQuery("");
                          setMatchesPillFilter("ALL");
                          setMatchesSectorFilter("ALL");
                          setMatchesCostFilter("ALL");
                          setMatchesAvailabilityFilter("ALL");
                        }}
                        className="text-xs font-bold text-[#0A6B43] bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (() => {
                    const renderMatchedProgramCard = ({ program: prog, matchScore: score, breakdown: itemBreakdown, isTopMatch }: typeof categorizedMatchedPrograms[number]) => {
                        const categoryMeta = getCBFMatchCategory(score, hasEnoughMatchingData);
                        const cbfBreakdown = itemBreakdown || calculateDetailedCBFMatch(youthProfile, prog);

                        const cardLang = getProgramLang(prog.id);
                        const progAdvice = topMatchAdviceMap[prog.id];
                        const topRationale = isTopMatch && progAdvice && (cardLang === "tl" ? progAdvice.careerAdviceTl : progAdvice.careerAdvice)
                          ? (cardLang === "tl" ? progAdvice.careerAdviceTl : progAdvice.careerAdvice)
                          : getFallbackPersonalizedRationale(youthProfile, prog, cardLang);

                        const topBullets = isTopMatch && progAdvice && (cardLang === "tl" ? (progAdvice.bulletAdviceTl?.length === 3 ? progAdvice.bulletAdviceTl : null) : (progAdvice.bulletAdvice?.length === 3 ? progAdvice.bulletAdvice : null))
                          ? (cardLang === "tl" ? progAdvice.bulletAdviceTl : progAdvice.bulletAdvice)
                          : getFallbackPersonalized3StepPathway(youthProfile, prog, cardLang);

                        return (
                          <motion.div
                            layout="position"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            key={prog.id}
                            id={`matched-program-card-${prog.id}`}
                            className={`group bg-white rounded-2xl px-3.5 py-4.5 sm:p-6 border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col justify-between hover:shadow-[0_16px_36px_rgb(0,0,0,0.1)] hover:-translate-y-1.5 transition-all duration-200 relative ${
                              isTopMatch
                                ? "shadow-[0_12px_36px_rgba(10,107,67,0.12)]"
                                : ""
                            }`}
                          >
                            <div className="space-y-4">
                              {/* Top Match Banner (only for Top Matches) */}
                              {isTopMatch && (
                                <div className="flex items-center justify-between pb-3 -mt-1 border-b border-emerald-100">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-linear-to-r from-amber-500 via-amber-400 to-[#0A6B43] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs shrink-0">
                                      <span>Top Match</span>
                                    </span>
                                    {isProgramEnded(prog) && (
                                      <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs shrink-0">
                                        <Clock className="w-3 h-3 text-purple-600" />
                                        <span>Term Ended</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-[10px] sm:text-[11px] font-bold shadow-2xs shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => setProgramLang(prog.id, "en")}
                                      className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${cardLang === "en" ? "bg-[#0A6B43] text-white font-extrabold shadow-2xs" : "text-gray-500 hover:text-[#0A6B43]"}`}
                                      title="Read in English"
                                    >
                                      <span className="xl:hidden">EN</span>
                                      <span className="hidden xl:inline">English</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setProgramLang(prog.id, "tl")}
                                      className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${cardLang === "tl" ? "bg-[#0A6B43] text-white font-extrabold shadow-2xs" : "text-gray-500 hover:text-[#0A6B43]"}`}
                                      title="Isalin sa Tagalog"
                                    >
                                      <span className="xl:hidden">TAG</span>
                                      <span className="hidden xl:inline">Tagalog</span>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Card Header: Title & Match Score */}
                              <div className="flex justify-between items-start gap-3 pb-3 border-b border-gray-100">
                                <div className="flex-1 min-w-0">
                                  <h4
                                    onClick={() => setViewingProgramModal({ program: prog, matchScore: score })}
                                    className="font-extrabold text-gray-900 text-[22px] leading-tight tracking-tight group-hover:text-[#0A6B43] cursor-pointer transition-colors duration-200"
                                    title="Click to view full program specifications"
                                  >
                                    {prog.title}
                                  </h4>

                                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                    <p className="text-[14px] font-semibold text-gray-500 break-words">
                                      {(prog.provider || prog.centerName) || "TESDA Pampanga (GPSAT)"}
                                    </p>
                                  </div>
                                </div>
                                <div className="shrink-0 pt-0.5">
                                  <FlameMatchScore score={score} hasEnoughData={hasEnoughMatchingData} isTopMatch={isTopMatch} />
                                </div>
                              </div>

                              {/* CONDITIONAL AI RATIONALE & PATHWAY vs MATCH CATEGORY */}
                              {isTopMatch ? (
                                <div className="space-y-3">
                                  {/* Gemini Match Rationale */}
                                  <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200/90 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between gap-1 flex-wrap">
                                      <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                        Gemini Match Rationale
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">
                                        Powered by Google Gemini
                                      </span>
                                    </div>
                                    <p className="text-xs italic text-emerald-950 leading-relaxed font-medium text-justify">
                                      &ldquo;{topRationale}&rdquo;
                                    </p>
                                  </div>

                                  {/* Personalized 3-Step Pathway */}
                                  <div className="bg-emerald-50/60 p-3 sm:p-3.5 rounded-xl border border-emerald-200/90 shadow-2xs space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-[#0A6B43]" />
                                        Personalized 3-Step Pathway
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">Action Plan</span>
                                    </div>
                                    <div className="space-y-2 pt-0.5">
                                      {topBullets.map((rawStep, sIdx) => {
                                        const step = rawStep.replace(/^(?:Step|Hakbang)\s*\d+[:\-–—\.\s]*/i, "").trim();
                                        return (
                                          <div
                                            key={sIdx}
                                            className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-emerald-200/80 shadow-2xs"
                                          >
                                            <span className="w-5 h-5 rounded-full bg-[#0A6B43] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                              {sIdx + 1}
                                            </span>
                                            <span className="flex-1 break-words text-xs text-gray-800 font-medium leading-snug">
                                              {step}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Non-Top Match: Match Category + Relevant Matched Skills / Preferences ONLY */
                                <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200/80 space-y-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                                      <Target className="w-3.5 h-3.5 text-[#0A6B43]" />
                                      Match Category
                                    </span>
                                  </div>
                                  <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                                    {categoryMeta.description}
                                  </p>

                                  {/* Relevant Matched Skills or Preferences */}
                                  {cbfBreakdown.matchedSkills && cbfBreakdown.matchedSkills.length > 0 && (
                                    <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                        Matching Competencies ({cbfBreakdown.matchedSkills.length})
                                      </span>
                                      <div className="flex flex-wrap gap-1">
                                        {cbfBreakdown.matchedSkills.map((sk, sIdx) => (
                                          <span key={sIdx} className="text-[11px] font-semibold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1 shadow-2xs">
                                            <Check className="w-3 h-3 text-[#0A6B43]" />
                                            {sk}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Program Description with Centered Top & Bottom Breaklines */}
                              {(() => {
                                const progDesc = getProgramDescription(prog);
                                if (!progDesc) return null;
                                return (
                                  <div className="space-y-4">
                                    <hr className="border-gray-200/80" />
                                    <div className="bg-gray-50/70 p-3 sm:p-3.5 rounded-xl border border-gray-200/80 space-y-1 shadow-2xs">
                                      <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-[#0A6B43]" />
                                        Program Description
                                      </span>
                                      <p className="text-xs sm:text-[13px] text-gray-700 font-medium leading-relaxed">
                                        {progDesc}
                                      </p>
                                    </div>
                                    <hr className="border-gray-200/80" />
                                  </div>
                                );
                              })()}

                              {/* 2-Column Program Specifications */}
                              <div className="divide-y divide-gray-100 px-3 sm:px-4">
                                {/* Row 1: Total Training Hours & Training Period */}
                                <div className="grid grid-cols-2 gap-x-4 pb-2.5">
                                  {/* Total Training Hours */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <Timer className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Total Training Hours
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                        {prog.trainingHours ? `${prog.trainingHours} Hours` : "Flexible"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Training Period */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Training Period
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate" title={(prog.startDate && prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}>
                                        {(prog.startDate && prog.endDate) ? formatProgramDateRange(prog.startDate, prog.endDate) : "Flexible Schedule"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 2: Training Days & Training Hours */}
                                <div className="grid grid-cols-2 gap-x-4 py-2.5">
                                  {/* Training Days */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Training Days
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate" title={formatTrainingDays(prog.trainingDays)}>
                                        {formatTrainingDays(prog.trainingDays)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Training Hours (Timeslot) */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Training Hours
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                        {(() => {
                                          const ts = formatProgramTimeslot(prog.startTime, prog.endTime);
                                          return `${ts.formattedRange}${ts.sessionType !== "Custom" ? ` (${ts.sessionType})` : ""}`;
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 3: Delivery Mode & Cost */}
                                <div className="grid grid-cols-2 gap-x-4 py-2.5">
                                  {/* Delivery Mode */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Delivery Mode
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">
                                        {prog.deliveryMode || "Face-to-Face"}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Cost */}
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Cost
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-[#0A6B43] truncate">
                                        {prog.cost || "Free"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                {/* Row 4: Venue */}
                                <div className="pt-2.5">
                                  <div className="min-w-0 flex items-start gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0 space-y-0.5 flex-1">
                                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 tracking-wider uppercase block">
                                        Venue
                                      </span>
                                      <p className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 break-words leading-snug">
                                        {extractLocationDisplay(prog.location) || "San Luis, Pampanga"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card Footer: Slots and Action Buttons (Mobile & Tablet optimized to prevent overlap) */}
                            <div className="flex justify-between items-center text-xs pt-3 sm:pt-4 mt-4 sm:mt-5 border-t border-gray-100 gap-1.5 sm:gap-2">
                              <div className="flex items-center gap-1 xl:gap-1.5 shrink-0">
                                <span className="text-gray-500 font-medium hidden xl:inline">Slots:</span>
                                <span className="font-bold text-gray-800 bg-gray-50 px-1.5 xl:px-2 py-0.5 rounded-md border border-gray-200 text-[10px] xl:text-[11px] whitespace-nowrap shrink-0">
                                  <span className="xl:hidden">{prog.slotsRemaining}/{prog.slotsTotal}</span>
                                  <span className="hidden xl:inline">{prog.slotsRemaining} / {prog.slotsTotal} left</span>
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingProgramModal({ program: prog, matchScore: score })}
                                  className="group/details text-[11px] xl:text-xs font-bold text-gray-700 hover:text-[#0A6B43] px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-lg xl:rounded-xl border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all flex items-center justify-center gap-1 xl:gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap shrink-0 active:scale-95"
                                  title="View full specifications & breakdown"
                                >
                                  <Eye className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-gray-500 group-hover/details:text-[#0A6B43] group-hover/details:scale-120 transition-all duration-200 shrink-0" />
                                  <span className="transition-transform duration-200 group-hover/details:scale-105 inline-block">Details</span>
                                </button>

                                {(() => {
                                  const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === prog.title);
                                  const isCompleted = isProgramCompleted(prog);
                                  const isEnrolled = app?.status === "Enrolled";
                                  const isApproved = app?.status === "Approved";
                                  const isDeclined = app?.status === "Declined";
                                  const isPending = app?.status === "Pending";

                                  const isFull = !app && prog.slotsRemaining <= 0;
                                  const overlapWarning = getOverlapWarning(prog);

                                  if (isCompleted) {
                                    return (
                                      <button
                                        disabled
                                        className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 xl:gap-1.5 cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
                                        title="You have already completed this program and earned your certification"
                                      >
                                        <CheckCircle className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-purple-600 shrink-0" />
                                        <span>Completed ✓</span>
                                      </button>
                                    );
                                  }

                                  if (isEnrolled) {
                                    return (
                                      <span className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center gap-1 xl:gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                                        <CheckCircle className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-[#0A6B43]" />
                                        <span>Enrolled</span>
                                      </span>
                                    );
                                  }

                                  if (isApproved) {
                                    return (
                                      <span className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1 xl:gap-1.5 shadow-2xs whitespace-nowrap shrink-0 animate-pulse">
                                        <FileText className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-orange-600 shrink-0" />
                                        <span>Submit Docs</span>
                                      </span>
                                    );
                                  }

                                  if (isPending) {
                                    return (
                                      <span className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 xl:gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                                        <Clock className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-amber-600 animate-pulse shrink-0" />
                                        <span>Pending</span>
                                      </span>
                                    );
                                  }

                                  if (isDeclined) {
                                    return (
                                      <span className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 xl:gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                                        <XCircle className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-rose-500 shrink-0" />
                                        <span>Declined</span>
                                      </span>
                                    );
                                  }

                                  if (isProgramEnded(prog)) {
                                    return (
                                      <button
                                        disabled
                                        className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1 xl:gap-1.5 cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
                                        title="This training program's term has ended or is closed"
                                      >
                                        <Clock className="w-3 h-3 xl:w-3.5 xl:h-3.5 text-purple-600 shrink-0" />
                                        <span>Term Ended</span>
                                      </button>
                                    );
                                  }

                                  if (isFull) {
                                    return (
                                      <button
                                        disabled
                                        className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-3.5 py-1.5 xl:py-2 rounded-lg xl:rounded-xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed whitespace-nowrap shrink-0"
                                      >
                                        Slots Full
                                      </button>
                                    );
                                  }

                                  const isApplyDisabled = isUnverified || !!overlapWarning;

                                  if (isApplyDisabled) {
                                    return (
                                      <button
                                        disabled
                                        className="text-[11px] xl:text-xs font-bold px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-lg xl:rounded-xl flex items-center gap-1 xl:gap-1.5 shadow-xs whitespace-nowrap shrink-0 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none"
                                        title={isUnverified ? "Cannot apply while awaiting SK verification" : overlapWarning || "Apply for this TESDA training program"}
                                      >
                                        <Send className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 text-gray-400" />
                                        <span className="whitespace-nowrap">Apply Now</span>
                                      </button>
                                    );
                                  }

                                  return (
                                    <button
                                      onClick={() => handleDirectApply(prog)}
                                      className="group/apply text-[11px] xl:text-xs font-bold px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-lg xl:rounded-xl flex items-center gap-1 xl:gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0 bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer active:scale-95"
                                      title="Apply for this TESDA training program"
                                    >
                                      <Send className="w-3 h-3 xl:w-3.5 xl:h-3.5 transition-transform duration-200 group-hover/apply:translate-x-1 group-hover/apply:-translate-y-0.5 group-hover/apply:scale-110 shrink-0" />
                                      <span className="whitespace-nowrap transition-transform duration-200 group-hover/apply:translate-x-0.5 group-hover/apply:scale-105 inline-block">Apply Now</span>
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        );
                      };

                      const topMatchesList = paginatedMatchedPrograms.filter(item => item.isTopMatch);
                      const otherMatchesList = paginatedMatchedPrograms.filter(item => !item.isTopMatch && item.matchScore > 0 && item.categoryKey !== "not-enough-data");

                      return (
                        <>
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={activeMatchPill + "_" + currentMatchesPage + "_" + matchesSectorFilter + "_" + matchesCostFilter + "_" + matchesAvailabilityFilter + "_" + matchesSearchQuery}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -12 }}
                              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            >
                              {activeMatchPill === "ALL" ? (
                                <div id="matched-programs-card-container" className="space-y-8">
                                  {/* Top Matches Inline Category */}
                                  {topMatchesList.length > 0 && (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between pb-2.5 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm uppercase tracking-wider">Top Matches</h3>
                                          <span className="text-[10px] font-bold text-[#0A6B43] bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 leading-none">
                                            {matchCategoryCounts["top-matches"] || topMatchesList.length}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium hidden sm:inline">Highest compatibility with your profile</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {topMatchesList.map(renderMatchedProgramCard)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Other Matches Inline Category */}
                                  {otherMatchesList.length > 0 && (
                                    <div className="space-y-4">
                                      <div className="flex items-center justify-between pt-2 pb-2.5 border-b border-gray-200">
                                        <div className="flex items-center gap-2">
                                          <h3 className="font-extrabold text-gray-800 text-xs sm:text-sm uppercase tracking-wider">Other Matches</h3>
                                          <span className="text-[10px] font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded-full border border-gray-200 leading-none">
                                            {matchCategoryCounts["other-matches"] || otherMatchesList.length}
                                          </span>
                                        </div>
                                        <span className="text-xs text-gray-400 font-medium hidden sm:inline">Additional viable programs for your skills</span>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {otherMatchesList.map(renderMatchedProgramCard)}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div id="matched-programs-card-container" className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {paginatedMatchedPrograms.map(renderMatchedProgramCard)}
                                </div>
                              )}
                            </motion.div>
                          </AnimatePresence>

                    {/* Pagination Controls - only rendered if results > 9 */}
                    {totalMatchesResults > MATCHES_PER_PAGE && (
                      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-xs text-gray-500 font-medium">
                          Showing <span className="font-bold text-gray-900">{(currentMatchesPage - 1) * MATCHES_PER_PAGE + 1}</span> to{" "}
                          <span className="font-bold text-gray-900">{Math.min(totalMatchesResults, currentMatchesPage * MATCHES_PER_PAGE)}</span> of{" "}
                          <span className="font-bold text-gray-900">{totalMatchesResults}</span> programs
                        </p>

                        <div className="flex items-center gap-1.5 flex-wrap justify-center">
                          <button
                            type="button"
                            disabled={currentMatchesPage === 1}
                            onClick={() => {
                              setMatchesPage(p => Math.max(1, p - 1));
                              document.getElementById("matched-programs-card-container")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Prev</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {getPaginationItems(currentMatchesPage, totalMatchesPages).map((item, idx) => {
                              if (item === "...") {
                                return (
                                  <span key={`matches-ellipsis-${idx}`} className="w-7 text-center text-xs text-gray-400 select-none">
                                    ...
                                  </span>
                                );
                              }
                              const pageNum = Number(item);
                              const isSelected = pageNum === currentMatchesPage;
                              return (
                                <button
                                  key={`matches-page-${pageNum}`}
                                  type="button"
                                  onClick={() => {
                                    setMatchesPage(pageNum);
                                    document.getElementById("matched-programs-card-container")?.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className={`min-w-8 h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-[#0A6B43] text-white shadow-xs font-black"
                                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 shadow-2xs"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            disabled={currentMatchesPage === totalMatchesPages}
                            onClick={() => {
                              setMatchesPage(p => Math.min(totalMatchesPages, p + 1));
                              document.getElementById("matched-programs-card-container")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="h-8 px-2.5 sm:px-3 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
                </div>
              )}

            </motion.div>
          )}

          {/* PATHWAY TAB SCREEN */ }
          { activeTab === YouthScreen.PATHWAY && (
                      <div className="space-y-6">
                        {/* Full-Width Rectangular Banner with Circular Gradient Background & Botanical Plant Growth */}
                        <div
                          className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
                          style={{
                            background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
                          }}
                        >
                          {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
                          <GrowthPlantAnimation />

                          {/* Content */}
                          <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
                            <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
                              Your Livelihood Pathway
                            </h2>
                            <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
                              Follow these stages to reach your professional career goal successfully.
                            </p>
                          </div>
                        </div>

                        {(() => {
                          const rawUserApps = referrals?.filter(r => isSameYouth(r.youthName, youthProfile.name, r.youthId, (r as any).email || r.youthEmail)) || [];
                          const seenProgKeys = new Set<string>();
                          const userApps = rawUserApps.filter(r => {
                            const key = (r.programId || r.programTitle || r.id).toLowerCase().trim();
                            if (seenProgKeys.has(key)) return false;
                            seenProgKeys.add(key);
                            return true;
                          });
                          if (userApps.length === 0) {
                            return (
                              <div className="space-y-6">
                                {/* Training Journey Card (Always visible showing verified progress) */}
                                <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden animate-in fade-in duration-200" id="pathway-training-journey-card">
                                  <div>
                                    <h3 className="text-[26px] font-black text-gray-900 tracking-tight leading-none">
                                      Training Journey
                                    </h3>
                                  </div>

                                  <PathwayTimeline
                                    currentStep={isUnverified ? 1 : 2}
                                    appStatus={undefined}
                                    hasGeneratedPlan={false}
                                    isUnverified={isUnverified}
                                    isGeneratingPlan={false}
                                    onStepClick={(step) => {
                                      if (step === 2) setActiveTab(YouthScreen.MATCHES);
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }

                          // Sort user applications by latest date descending
                          const sortedUserApps = [...userApps].sort((a, b) => {
                            const timeA = new Date(a.rawDate || (a as any).createdAt || a.applicationDate || a.referralDate || 0).getTime();
                            const timeB = new Date(b.rawDate || (b as any).createdAt || b.applicationDate || b.referralDate || 0).getTime();
                            return timeB - timeA;
                          });

                          // Default to the latest pathway (or user manually selected pathway)
                          const activeApp = (selectedPathwayAppId && sortedUserApps.find(a => a.id === selectedPathwayAppId))
                            || sortedUserApps[0]
                            || userApps[0];

                          const app = activeApp;
                          const isEnrolled = app.status === "Enrolled";
                          const isApproved = app.status === "Approved";
                          const isPending = app.status === "Pending";
                          const isDeclined = app.status === "Declined";
                          const isArchived = app.status === "Archived";

                          const program = programs.find(p => (app.programId && p.id === app.programId) || p.title === app.programTitle || p.title.replace(/\s+/g, ' ') === app.programTitle?.replace(/\s+/g, ' ')) || (app.program as any);
                          const provider = program?.provider || "TESDA Partner Training Center";
                          const location = extractLocationDisplay(program?.location) || "San Luis, Pampanga";
                          const scheduleDays = formatTrainingDays(program?.trainingDays);
                          const timeslot = formatProgramTimeslot(program?.startTime, program?.endTime);

                          const room = program?.room || "Main Training Facility";
                          const instructor = program?.instructor || "TESDA Certified Instructor";
                          const contactPerson = program?.contactPerson || "TESDA Registrar";
                          const contactNumber = program?.contactNumber || "N/A";
                          const trainingHours = program?.trainingHours ? `${program.trainingHours} hours` : "Standard Duration";
                          const dateRange = (program?.startDate || program?.endDate)
                            ? ` (${formatProgramDateRange(program.startDate, program.endDate)})`
                            : "";
                          const requiredDocs = program?.requiredDocuments && program.requiredDocuments.length > 0 ? program.requiredDocuments : DEFAULT_TESDA_REQUIREMENTS;

                          return (
                            <div className="space-y-6">
                              {/* Focused Active Pathway Card */}
                                <React.Fragment key={app.id}>
                                  {/* 1. Training Journey Card (At the top of the pathway) */}
                                  <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden animate-in fade-in duration-200" id="pathway-training-journey-card">
                                    <div>
                                      <h3 className="text-[26px] font-black text-gray-900 tracking-tight leading-none">
                                        Training Journey
                                      </h3>
                                    </div>

                                    {(() => {
                                      const planForThisApp = getPlanForProgram(app.programTitle);
                                      const hasSavedPlan = Boolean(planForThisApp && planForThisApp.roadmapTitle);
                                      const effectiveEndDate = program?.endDate || (app.program as any)?.endDate || app.completionDate || app.rawDate || app.applicationDate;
                                      const formattedCompletion = effectiveEndDate ? formatProgramDate(effectiveEndDate) : formatProgramDate(new Date());
                                      return (
                                        <PathwayTimeline
                                          currentStep={isArchived ? (hasSavedPlan ? 5 : 4) : isEnrolled ? 3 : 2}
                                          appStatus={app.status}
                                          applicationDate={app.applicationDate || app.referralDate}
                                          trainingHours={trainingHours}
                                          provider={provider}
                                          completionDate={formattedCompletion}
                                          hasGeneratedPlan={hasSavedPlan}
                                          isUnverified={isUnverified}
                                          isGeneratingPlan={isGeneratingPlan}
                                          onStepClick={(step) => {
                                            if (step === 2 && !isEnrolled && !isArchived) {
                                              const el = document.getElementById("pathway-requirements-card");
                                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                            } else if (step === 3 && !isArchived) {
                                              const el = document.getElementById("pathway-program-details-card");
                                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                            } else if (step === 4 || (step === 3 && isArchived)) {
                                              const el = document.getElementById("pathway-career-guide-card");
                                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                                            }
                                          }}
                                        />
                                      );
                                    })()}
                                  </div>

                                  {/* Your Livelihood Pathways Card (Placed below Training Journey) */}
                                  {userApps.length > 1 && (
                                    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 space-y-4 sm:space-y-5 relative overflow-hidden animate-in fade-in duration-200" id="pathway-livelihood-pathways-card">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5">
                                          <h3 className="text-[20px] sm:text-[22px] font-black text-gray-900 tracking-tight leading-none">
                                            Your Livelihood Pathways
                                          </h3>
                                          <span className="w-6 h-6 rounded-full border border-amber-400 bg-amber-50/80 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
                                            {userApps.length}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveTab(YouthScreen.MATCHES)}
                                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-300 bg-white hover:bg-emerald-50/70 hover:border-emerald-400 active:scale-95 text-xs font-extrabold text-[#0A6B43] shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-[#0A6B43] stroke-[2.5]" />
                                          <span>Apply to Another Program</span>
                                        </button>
                                      </div>

                                      {/* 3-Columns Grid in Web view with consistent container sizing */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4.5 items-stretch">
                                        {sortedUserApps.map((item) => {
                                          const isSelected = activeApp.id === item.id;
                                          const itemArchived = item.status === "Archived";
                                          const itemEnrolled = item.status === "Enrolled";
                                          const itemDeclined = item.status === "Declined";
                                          const itemApproved = item.status === "Approved";
                                          const prog = programs.find(p => (item.programId && p.id === item.programId) || p.title === item.programTitle || p.title.replace(/\s+/g, " ") === item.programTitle?.replace(/\s+/g, " ")) || (item.program as any);
                                          const itemProvider = prog?.provider || "TESDA Partner Center";

                                          return (
                                            <button
                                              key={item.id}
                                              type="button"
                                              onClick={() => setSelectedPathwayAppId(item.id)}
                                              className={`group relative text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-start gap-3 ${
                                                isSelected
                                                  ? "bg-[#0A6B43] border-2 border-[#0A6B43] text-white shadow-md ring-2 ring-[#0A6B43]/20"
                                                  : "bg-white hover:bg-gray-50/80 border border-gray-200/90 hover:border-gray-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5"
                                              }`}
                                            >
                                              {/* Top Left Status Pill */}
                                              <div className="flex items-center justify-start w-full">
                                                {itemArchived ? (
                                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                                                    isSelected
                                                      ? "bg-white text-green-700 border border-green-200 shadow-xs"
                                                      : "bg-green-50 text-green-700 border border-green-300"
                                                  }`}>
                                                    <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                                    <span>Graduate</span>
                                                  </span>
                                                ) : itemEnrolled ? (
                                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                                                    isSelected
                                                      ? "bg-white text-[#0A6B43] border border-emerald-200 shadow-xs"
                                                      : "bg-emerald-50 text-[#0A6B43] border border-emerald-300"
                                                  }`}>
                                                    <Clock className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                                    <span>Active</span>
                                                  </span>
                                                ) : itemDeclined ? (
                                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                                                    isSelected
                                                      ? "bg-white text-red-700 border border-red-200 shadow-xs"
                                                      : "bg-red-50 text-red-700 border border-red-200"
                                                  }`}>
                                                    <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                                    <span>Declined</span>
                                                  </span>
                                                ) : itemApproved ? (
                                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                                                    isSelected
                                                      ? "bg-white text-orange-700 border border-orange-200 shadow-xs"
                                                      : "bg-orange-50 text-orange-700 border border-orange-200"
                                                  }`}>
                                                    <FileText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                                    <span>Submit Required Documents</span>
                                                  </span>
                                                ) : (
                                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-2xs ${
                                                    isSelected
                                                      ? "bg-white text-blue-700 border border-blue-200 shadow-xs"
                                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                                  }`}>
                                                    <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                                    <span>Application Received</span>
                                                  </span>
                                                )}
                                              </div>

                                              {/* Program Title & Provider (Bigger, complete, no ellipses) */}
                                              <div className="space-y-1.5 w-full">
                                                <h5 className={`text-sm sm:text-base font-extrabold break-words leading-snug tracking-tight transition-colors ${
                                                  isSelected ? "text-white" : "text-gray-900 group-hover:text-[#0A6B43]"
                                                }`}
                                                >
                                                  {item.programTitle}
                                                </h5>
                                                <p className={`text-xs sm:text-[13px] font-semibold break-words leading-normal ${
                                                  isSelected ? "text-emerald-100" : "text-gray-500"
                                                }`}>
                                                  {itemProvider}
                                                </p>
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* 2. Program Details Card (Photo 1 layout: MiniMap + Specifications, with Title, Provider & Status badge header) */}
                                  {!isArchived && (
                                    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden animate-in fade-in duration-200" id="pathway-program-details-card">
                                    {/* Card Header: Program Title & Provider on Left, Status Badge on Right (no "Status:" label) */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-extrabold text-gray-900 text-[18px] sm:text-[20px] leading-tight break-words">
                                          {app.programTitle}
                                        </h4>
                                        <p className="text-[14px] font-semibold text-gray-500 mt-0.5">
                                          {provider}
                                        </p>
                                      </div>

                                      {/* Status Badge without label */}
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full border shadow-2xs ${
                                          isArchived
                                            ? "bg-purple-50 text-purple-700 border-purple-200"
                                            : isEnrolled
                                              ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                                              : isApproved
                                                ? "bg-orange-50 text-orange-700 border-orange-200 animate-pulse"
                                                : isDeclined
                                                  ? "bg-red-50 text-red-700 border-red-200"
                                                  : "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                                        }`}>
                                          {isArchived ? (
                                            <>
                                              <CheckCircle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                              <span>Archived (Completed)</span>
                                            </>
                                          ) : isEnrolled ? (
                                            <>
                                              <CheckCircle className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                                              <span>Officially Enrolled</span>
                                            </>
                                          ) : isApproved ? (
                                            <>
                                              <FileText className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                              <span>Documents Required</span>
                                            </>
                                          ) : isDeclined ? (
                                            <>
                                              <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                              <span>Declined</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-pulse" />
                                              <span>Application Received</span>
                                            </>
                                          )}
                                        </span>

                                        {(isPending || isApproved) && (
                                          <button
                                            onClick={() => handleCancelApplication(app.id)}
                                            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full border border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                                            title="Cancel Application"
                                            id={`cancel-application-header-${app.id}`}
                                          >
                                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                            <span>Cancel Application</span>
                                          </button>
                                        )}
                                        {isDeclined && (
                                          <button
                                            onClick={() => handleDeletePathway(app.id)}
                                            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold px-3 py-1.5 rounded-full border border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 transition-all shadow-2xs cursor-pointer active:scale-95"
                                            title="Delete Declined Pathway"
                                            id={`delete-pathway-header-${app.id}`}
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                            <span>Delete Pathway</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* 2-Column Responsive Layout: 30% Map | 70% Details (Matching Photo 1) */}
                                    <div className="flex flex-col lg:flex-row items-stretch gap-5 sm:gap-6">
                                      {/* Left Column (30%): Map showing program location */}
                                      <div className="w-full lg:w-[30%] flex flex-col shrink-0 min-h-[260px]">
                                        <EnrolledProgramMiniMap
                                          program={program}
                                          locationString={program?.location || location}
                                          onOpenFullMap={() => handleOpenVenueMap(program || { id: "pathway", title: app.programTitle, provider, location } as any)}
                                        />
                                      </div>

                                      {/* Right Column (70%): Details */}
                                      <div className="w-full lg:w-[70%] min-w-0 flex flex-col space-y-3.5">
                                        {/* Card 1: Class & Training Specifications */}
                                        <div className="border border-gray-200/90 rounded-2xl bg-white p-4 sm:p-5 space-y-2.5 shadow-2xs">
                                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                            Class &amp; Training Specifications
                                          </span>
                                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-gray-400 font-medium">
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <Timer className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Total Training Hours:</strong>{" "}
                                                {program?.trainingHours ? `${program.trainingHours} Hours` : trainingHours || "Flexible"}
                                              </span>
                                            </li>
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Period:</strong>{" "}
                                                {(program?.startDate && program?.endDate)
                                                  ? formatProgramDateRange(program.startDate, program.endDate)
                                                  : dateRange || "Flexible Schedule"}
                                              </span>
                                            </li>
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Days:</strong>{" "}
                                                {scheduleDays}
                                              </span>
                                            </li>
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Hours:</strong>{" "}
                                                {timeslot.formattedRange}
                                                {timeslot.sessionType !== "Custom" ? ` (${timeslot.sessionType})` : ""}
                                              </span>
                                            </li>
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Mode:</strong>{" "}
                                                {program?.deliveryMode || "Face-to-Face"}
                                              </span>
                                            </li>
                                            <li className="flex items-center gap-2 leading-relaxed">
                                              <UserCheck className="w-4 h-4 text-gray-400 shrink-0" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Instructor:</strong>{" "}
                                                {instructor}
                                              </span>
                                            </li>
                                          </ul>
                                        </div>

                                        {/* Card 2: Location, Training Facility */}
                                        <div className="border border-gray-200/90 rounded-2xl bg-white p-4 sm:p-5 space-y-2.5 shadow-2xs">
                                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-700 uppercase tracking-wider block">
                                            Location &amp; Training Facility
                                          </span>
                                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-[12px] text-gray-400 font-medium">
                                            <li className="flex items-start gap-2 leading-relaxed">
                                              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Location:</strong>{" "}
                                                {location}
                                                {program?.centerName && (
                                                  <span className="text-gray-400 font-normal block sm:inline sm:ml-1 text-[12px]">
                                                    ({program.centerName})
                                                  </span>
                                                )}
                                              </span>
                                            </li>
                                            <li className="flex items-start gap-2 leading-relaxed">
                                              <Building2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                              <span>
                                                <strong className="text-gray-400 font-bold uppercase text-[12px]">Training Facility:</strong>{" "}
                                                {room}
                                              </span>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                    </div>

                                    {isPending && (
                                      <>
                                        <hr className="border-t border-gray-100 mt-2 mb-5 sm:mb-6" />
                                        <div className="border border-blue-200/90 rounded-2xl bg-blue-50/60 p-4 sm:p-5 space-y-2 shadow-2xs">
                                          <span className="text-[10px] sm:text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0 animate-pulse" />
                                            <span>Application Received</span>
                                          </span>
                                          <p className="text-[12px] text-blue-950 font-medium leading-relaxed">
                                            Your application has been received by <strong className="font-bold text-blue-950">{provider}</strong> and is currently awaiting initial review. You will be notified once it is accepted to submit your physical documents.
                                          </p>
                                        </div>
                                      </>
                                    )}

                                    {isApproved && (
                                      <>
                                        {/* Breakline before Action Required with generous spacing */}
                                        <hr className="border-t border-gray-100 mt-2 mb-5 sm:mb-6" />

                                        {/* Action Required to Complete Enrollment Verification (Orange Card) */}
                                        <div className="border border-orange-300 rounded-2xl bg-orange-50 p-4 sm:p-5 space-y-3.5 shadow-2xs" id="pathway-requirements-card">
                                          <span className="text-[10px] sm:text-[11px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">
                                            <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                            <span>Action Required to Complete Enrollment Verification:</span>
                                          </span>
                                          <hr className="border-t border-orange-200 mt-1 mb-2.5 sm:mb-3" />
                                          <p className="text-[12px] text-orange-950 font-medium leading-relaxed pt-1.5 sm:pt-2">
                                           Your application for <strong className="text-orange-950 font-bold">{app.programTitle}</strong> has been received! Please submit the required physical documents to the{" "}
                                           <button
                                             type="button"
                                             onClick={() => handleOpenVenueMap(program || { id: "admissions", title: app.programTitle, provider, location } as any)}
                                             className="text-orange-950 underline underline-offset-2 font-bold hover:text-orange-700 cursor-pointer inline transition-colors"
                                             title="View on Interactive Map"
                                           >
                                             {provider}
                                           </button>{" "}
                                           Admissions Office:
                                         </p>
                                         <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 pl-4 list-disc text-[12px] text-orange-950 font-semibold">
                                           {requiredDocs.map((doc: string, dIdx: number) => (
                                             <li key={dIdx} className="leading-relaxed">{toTitleCase(doc)}</li>
                                           ))}
                                         </ul>
                                         <p className="text-[11px] text-orange-800 italic pt-2 border-t border-orange-200 font-medium leading-normal">
                                           Once your physical documents are verified by the TESDA registrar, your enrollment will be officially approved and this pathway will advance to <strong className="font-bold text-orange-900 not-italic">Step 3: Officially Enrolled &amp; Active Training</strong>!
                                         </p>
                                        </div>
                                      </>
                                    )}
                                </div>
                              )}

                                    {/* Active Stage Details & Actions Card (For Declined, Archived/Step 4, and Enrolled stages) */}
                                   {!isPending && !isApproved && (() => {

                                         if (isDeclined) {
  return (
    <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 sm:space-y-6 relative overflow-hidden animate-in fade-in duration-200">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3.5 shadow-2xs">
      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-1" />
      <div className="flex-1 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-2">
          <p className="text-xs font-extrabold text-red-800 uppercase tracking-wider">Application Declined</p>
          <button
            onClick={() => handleDeletePathway(app.id)}
            className="w-full sm:w-auto justify-center text-[11px] bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-red-200 cursor-pointer"
            id={`delete-pathway-box-${app.id}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Livelihood Pathway
          </button>
        </div>
        <p className="text-xs text-red-700 leading-relaxed font-medium">
          Your application for <strong>{app.programTitle}</strong> was declined. Please verify your skills and profile info before re-applying, or message Sangguniang Kabataan for mentorship.
        </p>
        <p className="text-[10px] text-red-500 italic font-semibold flex items-start sm:items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-red-400 shrink-0" />
          <span>You can delete this pathway card to clear your list and explore other matching livelihood programs!</span>
        </p>
      </div>
    </div>
    </div>
  );
} else if (isArchived) {
  return renderMotivationalCareerGuideCard(app.programTitle, program);
} else {
  return renderMotivationalCareerGuideCard(app.programTitle, program);
}
                          })()}
                                </React.Fragment>
                      </div>
                    );
                  }) ()}

              {/* Goals segment - Livelihood Goal */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100/80 space-y-3.5 sm:space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-100">
                  <h4 className="text-[20px] font-extrabold text-gray-900 tracking-tight">
                    Livelihood Goal
                  </h4>
                  <button
                    type="button"
                    onClick={() => setActiveTab(YouthScreen.PROFILE)}
                    className="text-[11px] sm:text-xs font-bold text-[#0A6B43] hover:text-[#075332] bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shadow-2xs active:scale-95"
                  >
                    <Edit className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Update in Profile</span>
                  </button>
                </div>

                {/* Content */}
                {(() => {
                  const rawGoal = youthProfile.goalRaw || youthProfile.livelihoodGoal || "";
                  const isPlaceholder = !rawGoal || rawGoal.toLowerCase().includes("configure");

                  return (
                    <div className="p-3.5 sm:p-5 rounded-xl bg-gray-50/70 border border-gray-100 space-y-1 sm:space-y-1.5 transition-all">
                      <div className="text-[9.5px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        Current Objective
                      </div>
                      <p className="text-xs sm:text-base font-bold text-gray-900 leading-relaxed">
                        {isPlaceholder ? (
                          <span className="text-gray-400 font-medium italic">
                            &ldquo;Configure your career goals&rdquo;
                          </span>
                        ) : (
                          <span>&ldquo;{rawGoal}&rdquo;</span>
                        )}
                      </p>
                    </div>
                  );
                })()}

                {/* Footer */}
                <div className="pt-2.5 sm:pt-3 border-t border-gray-100">
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium leading-relaxed">
                    Your training matches are regularly updated based on how well they fit your skills, interests, and goals.
                  </p>
                </div>
              </div>
            </div >
          )}

{/* PROFILE TAB SCREEN */ }
{
  activeTab === YouthScreen.PROFILE && (
    <div className="space-y-6">
      {/* Settings Header Banner with Circular Gradient Background & Botanical Plant Growth */}
      <div
        className="w-full text-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_12px_36px_-6px_rgba(4,26,19,0.28)] relative overflow-hidden"
        style={{
          background: "radial-gradient(circle at 75% 50%, #106348 0%, #082D21 55%, #041A13 100%)",
        }}
      >
        {/* Animated Botanical Growth / Plant Leaves on the Right, Facing Left */}
        <GrowthPlantAnimation />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center max-w-xl sm:max-w-2xl lg:max-w-3xl">
          <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
            Settings
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
            Manage your personal profile, competencies, security, and notification preferences.
          </p>
        </div>
      </div>

      {/* 2-Column Settings Layout: Left Vertical Sidebar + Right Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* Left Vertical Sidebar Navigation */}
        <SettingsSidebarNav
          tabs={[
            { id: "profile", label: "Personal Details", icon: User },
            { id: "skills", label: "Skills & Competencies", icon: Award },
            { id: "security", label: "Security & Password", icon: Lock },
            { id: "notifications", label: "Alerts & Notifications", icon: Bell },
            { id: "badge", label: "Digital ID Card", icon: ShieldCheck },
          ]}
          activeTab={profileActiveTab}
          onTabChange={(tabId) => setProfileActiveTab(tabId as any)}
        />

        {/* Right Main Content Area */}
        <main className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
          {/* Sub-Tab 1: Personal Details Dossier */}
          {profileActiveTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-6 w-full"
            >
              {/* Left Column: Personal Dossier Info or Active Edit Form */}
              <div className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              {!isEditingProfile ? (
                /* Read-Only Dossier Mode */
                <div className="space-y-6">
                  {/* Header: matching Edit Mode height and alignment */}
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                      <User className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                      Personal Profile Details
                    </h3>
                  </div>

                  {/* Section 1: Basic Information */}
                  <div className="space-y-3.5">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Basic Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      {/* Full Name */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Full Name</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 break-words leading-tight">{youthProfile.name}</p>
                        </div>
                      </div>

                      {/* Account Login Email */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Account Login Email</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 break-words truncate leading-tight" title={currentUser?.email || youthProfile.email || "Registered Email"}>
                            {currentUser?.email || youthProfile.email || "Registered Email"}
                          </p>
                        </div>
                      </div>

                      {/* Date of Birth */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Date of Birth *</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">
                            {youthProfile.birthdate
                              ? (() => {
                                try {
                                  const d = new Date(youthProfile.birthdate);
                                  return isNaN(d.getTime()) ? String(youthProfile.birthdate) : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                                } catch {
                                  return String(youthProfile.birthdate);
                                }
                              })()
                              : "Not recorded"}
                          </p>
                        </div>
                      </div>

                      {/* Age (Years Old) */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Age (Years Old)</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">{youthProfile.age}</p>
                        </div>
                      </div>

                      {/* Sex / Gender */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Sex / Gender *</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">{spellOutGender(youthProfile.gender) || "Male"}</p>
                        </div>
                      </div>

                      {/* Contact Phone Number */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Contact Phone Number *</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">{youthProfile.contactNumber || "Not recorded"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Residence & Location */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Residence & Location
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      {/* Registered Barangay */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Registered Barangay</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">Barangay {youthProfile.barangay || "San Luis"}</p>
                        </div>
                      </div>

                      {/* Purok / Zone */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">
                          {getBarangayZoneTypeLabel(youthProfile.barangay)} / Zone *
                        </span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">
                            {youthProfile.purok || (getBarangayZoneTypeLabel(youthProfile.barangay) === "Street" ? "F. Carlos St." : "Purok 1")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Education & Employment Profile */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Education & Employment Profile
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      {/* Educational Attainment */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Educational Attainment *</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">
                            {normalizeEducationalAttainment(youthProfile.educationalAttainment) || "College Level (Undergraduate)"}
                          </p>
                        </div>
                      </div>

                      {/* Current Youth Status */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Current Youth Status *</span>
                        <div className="min-h-[28px] sm:h-[42px] flex items-center">
                          <p className="text-xs sm:text-[16px] font-semibold text-gray-900 leading-tight">
                            {youthProfile.currentStatus || "Out-of-School Youth (OSY)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Special Inclusivity & Priority Classifications */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Special Inclusivity & Priority Classifications
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3 sm:px-4">
                      {/* Solo Parent */}
                      <div className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all min-h-[36px] sm:h-[42px] ${
                        youthProfile.soloParent ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                      }`}>
                        <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs border flex items-center justify-center shrink-0 ${
                          youthProfile.soloParent ? "bg-[#0A6B43] border-[#0A6B43] text-white" : "border-gray-300 bg-white"
                        }`}>
                          {youthProfile.soloParent && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">Solo Parent</span>
                      </div>

                      {/* PWD (Disability) */}
                      <div className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all min-h-[36px] sm:h-[42px] ${
                        youthProfile.pwd ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                      }`}>
                        <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs border flex items-center justify-center shrink-0 ${
                          youthProfile.pwd ? "bg-[#0A6B43] border-[#0A6B43] text-white" : "border-gray-300 bg-white"
                        }`}>
                          {youthProfile.pwd && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">PWD (Disability)</span>
                      </div>

                      {/* Indigenous (IP) */}
                      <div className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all min-h-[36px] sm:h-[42px] ${
                        youthProfile.indigenous ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                      }`}>
                        <div className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs border flex items-center justify-center shrink-0 ${
                          youthProfile.indigenous ? "bg-[#0A6B43] border-[#0A6B43] text-white" : "border-gray-300 bg-white"
                        }`}>
                          {youthProfile.indigenous && <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs sm:text-sm font-medium">Indigenous (IP)</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action: Edit Details Button with Hover Animation */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnverified) {
                          addToast("Cannot edit profile details while awaiting SK Verification", "error");
                          return;
                        }
                        handleCancelEdit();
                        setIsEditingProfile(true);
                      }}
                      disabled={isUnverified}
                      className={`group/edit px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98 ${
                        isUnverified ? "bg-gray-300 cursor-not-allowed" : "bg-[#0A6B43] hover:bg-[#075332]"
                      }`}
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/edit:rotate-12 group-hover/edit:scale-120" />
                      <span>Edit Details</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Edit Form Mode */
                <form onSubmit={handleSaveProfileDetails} className="space-y-6">
                  <div className="border-b border-gray-100 pb-3">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                      <Edit className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                      Edit Profile Details
                    </h3>
                  </div>

                  {/* Section 1: Basic Information */}
                  <div className="space-y-3.5">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Basic Information
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Full Name</label>
                        <input type="text" disabled value={youthProfile.name} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-xs sm:text-sm cursor-default" />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Account Login Email</label>
                        <input type="email" disabled value={currentUser?.email || youthProfile.email || "Registered Email"} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-xs sm:text-sm cursor-default" />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Date of Birth *</label>
                        <SiKapDatePicker
                          value={editBirthdate}
                          onChange={handleDOBChange}
                          disabled={!isEditingProfile || isUnverified}
                          max={new Date().toISOString().split("T")[0]}
                          placeholder="Select date of birth"
                          showAgeIndicator={true}
                          defaultYear={new Date().getFullYear() - 20}
                          direction="down"
                          buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Age (Years Old)</label>
                        <input
                          type="number"
                          disabled
                          readOnly
                          value={editAge || (editBirthdate ? calculateAge(editBirthdate) : youthProfile.age) || ""}
                          className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-xs sm:text-sm cursor-default"
                          title="Age is automatically determined from your Date of Birth"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Sex / Gender *</label>
                        <CustomSelect
                          disabled={!isEditingProfile || isUnverified}
                          value={editGender}
                          onChange={(val) => setEditGender(val)}
                          options={[
                            { value: "Male", label: "Male" },
                            { value: "Female", label: "Female" }
                          ]}
                          size="md"
                          placeholder="Select Gender"
                          buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Contact Phone Number *</label>
                        <input
                          type="text"
                          required
                          disabled={!isEditingProfile || isUnverified}
                          value={editPhone}
                          onChange={(e) => setEditPhone(formatContactNumber(e.target.value))}
                          className={`w-full p-2.5 border rounded-lg text-xs sm:text-sm font-medium transition-colors ${isEditingProfile
                            ? "bg-white border-gray-300 text-gray-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            : "bg-gray-50 border-gray-200 text-gray-500 cursor-default"
                            }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Residence & Location */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Residence & Location
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Registered Barangay</label>
                        <input type="text" disabled value={`Barangay ${youthProfile.barangay || "San Luis"}`} className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 font-medium rounded-lg text-xs sm:text-sm cursor-default" />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">
                          {getBarangayZoneTypeLabel(youthProfile.barangay)} / Zone *
                        </label>
                        <CustomSelect
                          disabled={!isEditingProfile || isUnverified}
                          value={editPurok}
                          onChange={(val) => setEditPurok(val)}
                          options={getBarangayZoneOptions(youthProfile.barangay)}
                          size="md"
                          placeholder={`Select ${getBarangayZoneTypeLabel(youthProfile.barangay)}`}
                          buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Education & Background */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Education & Employment Profile
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-3 sm:px-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Educational Attainment *</label>
                        <CustomSelect
                          disabled={!isEditingProfile || isUnverified}
                          value={normalizeEducationalAttainment(editEdu)}
                          onChange={(val) => setEditEdu(val)}
                          options={EDUCATIONAL_ATTAINMENT_OPTIONS.map(edu => ({ value: edu, label: edu }))}
                          size="md"
                          placeholder="Select Educational Attainment"
                          buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label className="text-[10px] sm:text-[12px] font-semibold text-gray-500 uppercase tracking-wide block">Current Youth Status *</label>
                        <CustomSelect
                          disabled={!isEditingProfile || isUnverified}
                          value={editStatus}
                          onChange={(val) => setEditStatus(val)}
                          options={[
                            { value: "Out-of-school", label: "Out-of-School Youth (OSY)" },
                            { value: "In-school", label: "In-School Youth" },
                            { value: "Employed", label: "Employed" },
                            { value: "Self-employed", label: "Self-Employed / Freelance" },
                            { value: "Unemployed", label: "Unemployed Jobseeker" },
                            { value: "Working Student", label: "Working Student" },
                            { value: "Graduate", label: "TVET / College Graduate" }
                          ]}
                          size="md"
                          placeholder="Select Status"
                          buttonClassName={isEditingProfile ? "!bg-white !text-gray-900 !border-gray-300" : ""}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Special Inclusivity & Priority Classifications */}
                  <div className="space-y-3.5 pt-1">
                    <div className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider pb-1.5 border-b border-gray-100 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-[#0A6B43]" />
                      Special Inclusivity & Priority Classifications
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-3 sm:px-4">
                      <label className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                        } ${editSoloParent ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                        }`}>
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile || isUnverified}
                          checked={editSoloParent}
                          onChange={(e) => setEditSoloParent(e.target.checked)}
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-medium">Solo Parent</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                        } ${editPwd ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                        }`}>
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile || isUnverified}
                          checked={editPwd}
                          onChange={(e) => setEditPwd(e.target.checked)}
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-medium">PWD (Disability)</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl border transition-all ${!isEditingProfile || isUnverified ? "cursor-default" : "cursor-pointer"
                        } ${editIndigenous ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium" : "bg-gray-50/80 border-gray-200 text-gray-500 font-medium"
                        }`}>
                        <input
                          type="checkbox"
                          disabled={!isEditingProfile || isUnverified}
                          checked={editIndigenous}
                          onChange={(e) => setEditIndigenous(e.target.checked)}
                          className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-xs accent-[#0A6B43] text-[#0A6B43] cursor-pointer"
                        />
                        <span className="text-xs sm:text-sm font-medium">Indigenous (IP)</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile || isUnverified}
                      className={`group/save px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98 ${isUnverified ? "bg-gray-300 cursor-not-allowed" : "bg-[#0A6B43] hover:bg-[#075332]"
                        }`}
                    >
                      {isSavingProfile ? (
                        <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/save:scale-125 group-hover/save:rotate-6" />
                      )}
                      <span>Save Profile Changes</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Right Column: Summary & Verification Card */}
            <div className="xl:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-xs sm:text-sm">
                <div className="border-b border-gray-100 pb-2.5 sm:pb-3">
                  <h4 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
                    <ShieldCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                    Membership & Verification
                  </h4>
                </div>

                <div className="flex justify-between items-center py-2 sm:py-3.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">SK Verification:</span>
                  <span className={`font-extrabold text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full border ${youthProfile.approvalStatus === "Approved"
                    ? "bg-emerald-50 text-[#0A6B43] border-emerald-200"
                    : youthProfile.approvalStatus === "Rejected"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    {youthProfile.approvalStatus === "Approved" ? "VERIFIED KK MEMBER" : youthProfile.approvalStatus === "Rejected" ? "DECLINED" : "PENDING VERIFICATION"}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 sm:py-3.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Registered Date:</span>
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">{youthProfile.registeredDate || "Registered"}</span>
                </div>

                <div className="flex justify-between items-center py-2 sm:py-3.5 border-b border-gray-100">
                  <span className="text-gray-500 font-medium text-xs sm:text-sm">Verified Date:</span>
                  <span className="font-medium text-gray-700 text-xs sm:text-sm">
                    {youthProfile.approvalStatus === "Approved"
                      ? ((youthProfile as any).approvalDate || (youthProfile as any).verifiedDate || youthProfile.registeredDate || "Verified")
                      : "Pending Approval"}
                  </span>
                </div>

                {/* Special Badges */}
                {(youthProfile.soloParent || youthProfile.pwd || youthProfile.indigenous) && (
                  <div className="py-2 sm:py-3.5 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-gray-500 font-medium text-[11px] sm:text-xs">Priority Classification:</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {youthProfile.soloParent && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md">
                          Solo Parent
                        </span>
                      )}
                      {youthProfile.pwd && (
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md">
                          PWD
                        </span>
                      )}
                      {youthProfile.indigenous && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md">
                          Indigenous (IP)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Submitted Government ID / In-Person Verification Details */}
                <div className="pt-2.5 sm:pt-3.5 space-y-2 sm:space-y-2.5">
                  <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    {youthProfile.verificationIdType?.toLowerCase().includes("in-person") || youthProfile.verificationIdType?.toLowerCase().includes("sk") || (!youthProfile.verificationIdImage && youthProfile.approvalStatus === "Approved")
                      ? "Official Verification Status"
                      : "Submitted Verification ID"}
                  </span>

                  {youthProfile.verificationIdType?.toLowerCase().includes("in-person") || youthProfile.verificationIdType?.toLowerCase().includes("sk") || (!youthProfile.verificationIdImage && youthProfile.approvalStatus === "Approved") ? (
                    <div className="bg-emerald-50/70 p-3 sm:p-4 rounded-xl border border-emerald-200 space-y-2 sm:space-y-2.5">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-emerald-900 font-medium">Registration Mode:</span>
                        <span className="font-bold text-[#0A6B43] flex items-center gap-1.5 text-xs sm:text-sm">
                          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A6B43] shrink-0" />
                          SK Chairman Registered (In-Person)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="text-emerald-900 font-medium">Verification Status:</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#0A6B43] border border-emerald-300 font-extrabold text-[10px] sm:text-xs">
                          Face-to-Face Verified
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-emerald-800/90 leading-relaxed pt-1 border-t border-emerald-200/60 font-medium">
                        Physical identity and barangay residency verified face-to-face during on-site Katipunan ng Kabataan registration with the SK Chairperson. No digital ID upload required.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-gray-50/70 p-3 sm:p-4 rounded-xl border border-gray-200 space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <span className="text-gray-500 font-medium">ID Type:</span>
                        <span className="font-medium text-gray-800 text-right">{youthProfile.verificationIdType || "Government / Student ID"}</span>
                      </div>

                      {youthProfile.verificationIdNumber && (
                        <div className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="text-gray-500 font-medium">ID Number:</span>
                          <span className="font-medium text-gray-800 text-right font-mono text-xs sm:text-sm">
                            {youthProfile.verificationIdNumber}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
                        <span className="text-gray-500 font-medium">ID Document Attached:</span>
                        {youthProfile.verificationIdImage ? (() => {
                          const parsedProfileId = parseVerificationIdImages(youthProfile.verificationIdImage);
                          if (parsedProfileId.isDualPhoto && parsedProfileId.back) {
                            return (
                              <div className="flex items-center gap-2">
                                <div
                                  className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-gray-200 overflow-hidden border border-gray-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center"
                                  onClick={() => {
                                    setIdPhotoModalSide("front");
                                    setShowIdPhotoModal(true);
                                  }}
                                  title="Click to view Front ID photo"
                                >
                                  <img src={parsedProfileId.front} alt="Front ID Preview" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[8px] font-extrabold px-1 rounded">FRONT</span>
                                </div>
                                <div
                                  className="relative w-14 h-10 sm:w-16 sm:h-11 rounded-lg bg-gray-200 overflow-hidden border border-gray-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center"
                                  onClick={() => {
                                    setIdPhotoModalSide("back");
                                    setShowIdPhotoModal(true);
                                  }}
                                  title="Click to view Back ID photo"
                                >
                                  <img src={parsedProfileId.back} alt="Back ID Preview" className="w-full h-full object-cover" />
                                  <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[8px] font-extrabold px-1 rounded">BACK</span>
                                </div>
                              </div>
                            );
                          }
                          if (parsedProfileId.isPdf) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  setIdPhotoModalSide("front");
                                  setShowIdPhotoModal(true);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-[#0A6B43] border border-emerald-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View PDF Document</span>
                              </button>
                            );
                          }
                          return (
                            <div
                              className="w-13 h-9 sm:w-16 sm:h-11 rounded-lg bg-gray-200 overflow-hidden border border-gray-300 shadow-2xs shrink-0 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-emerald-500 transition-all flex items-center justify-center"
                              onClick={() => {
                                setIdPhotoModalSide("front");
                                setShowIdPhotoModal(true);
                              }}
                              title="Click to view full ID photo"
                            >
                              <img
                                src={parsedProfileId.front}
                                alt="ID Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          );
                        })() : (
                          <span className="text-[11px] sm:text-xs text-gray-400 italic">No image submitted</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 2: Skills, Interests & Prior Experiences - Balanced 2-Column Grid */}
        {profileActiveTab === "skills" && (
          <motion.div
            key="skills"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="space-y-6 pb-6 w-full"
          >
            {/* Top: Livelihood & Career Goal Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-3.5 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-gray-100 pb-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
                      <Target className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43] shrink-0" />
                      <span>Livelihood & Career Goal</span>
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5 leading-snug">
                    Your overarching career aspiration or livelihood ambition
                  </p>
                </div>
                {!isEditingGoal ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (isUnverified) {
                        addToast("Cannot edit career goal while awaiting SK Verification", "error");
                        return;
                      }
                      setIsEditingGoal(true);
                    }}
                    disabled={isUnverified}
                    className={`w-full sm:w-auto px-3.5 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Edit Goal</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCareerGoalInput(youthProfile.goalRaw || youthProfile.livelihoodGoal || "");
                        setIsEditingGoal(false);
                      }}
                      disabled={isSavingGoal}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9 min-w-[90px] sm:min-w-[100px] rounded-lg text-xs sm:text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveCareerGoal}
                      disabled={isSavingGoal || isUnverified}
                      className="px-3.5 sm:px-4 py-1.5 sm:py-2 h-8 sm:h-9 min-w-[90px] sm:min-w-[100px] bg-[#0A6B43] hover:bg-[#075332] text-white rounded-lg text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingGoal ? <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      Save Goal
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {isEditingGoal ? (
                  <textarea
                    rows={3}
                    required
                    value={careerGoalInput}
                    onChange={(e) => setCareerGoalInput(e.target.value)}
                    placeholder="Describe your career aspiration or livelihood goal..."
                    className="w-full p-3 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-gray-900 bg-white focus:ring-1 focus:ring-emerald-500 shadow-2xs focus:outline-hidden"
                  />
                ) : (
                  <div className="p-3 sm:p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 text-gray-800 text-xs sm:text-sm leading-relaxed font-medium">
                    {youthProfile.goalRaw || youthProfile.livelihoodGoal ? (
                      <span>{youthProfile.goalRaw || youthProfile.livelihoodGoal}</span>
                    ) : (
                      <span className="italic text-gray-400">No career goal specified yet. Click &quot;Edit Goal&quot; to define your livelihood aspiration.</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 1. Competency Skills & Qualifications Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 sm:space-y-5 w-full">
              <div className="space-y-3.5 sm:space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                      <Award className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-500" />
                      Competency Skills
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Scored directly by the CBF AI matching engine</p>
                </div>

                {/* Add Skill Inline Input */}
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    disabled={isUnverified}
                    placeholder={isUnverified ? "Awaiting verification..." : "e.g. Baking, Basic Computing..."}
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isUnverified) {
                          addToast("Cannot add skills while account is awaiting SK verification", "error");
                          return;
                        }
                        handleAddSkillSubmit();
                      }
                    }}
                    className={`flex-1 px-3 py-2 h-9 sm:h-10 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                  />
                  <button
                    type="button"
                    disabled={isUnverified}
                    onClick={() => {
                      if (isUnverified) {
                        addToast("Cannot add skills while account is awaiting SK verification", "error");
                        return;
                      }
                      handleAddSkillSubmit();
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Add
                  </button>
                </div>

                {/* Active Registered Skills Tags */}
                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {youthProfile.skills && youthProfile.skills.length > 0 ? (
                    youthProfile.skills.map((s) => (
                      <span key={s} className="bg-amber-50 text-amber-900 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg border border-amber-200 flex items-center gap-1.5 shadow-2xs">
                        <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600 shrink-0" />
                        {formatSkillTitleCase(s)}
                        <button
                          onClick={() => {
                            if (isUnverified) {
                              addToast("Cannot remove skills in View-Only Mode", "error");
                              return;
                            }
                            handleRemoveSkillLocal(s);
                          }}
                          disabled={isUnverified}
                          className="font-bold text-[11px] sm:text-xs text-amber-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                          title="Remove skill"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] sm:text-xs text-gray-400 italic font-medium py-1">No competency skills added yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Preferred Vocational Interests Card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 sm:space-y-5 w-full">
              <div className="space-y-3.5 sm:space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                      <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                      Preferred Vocational Interests
                    </h3>
                  </div>
                  <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Fields and industries you are passionate about</p>
                </div>

                {/* Add Preference Inline Input */}
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    disabled={isUnverified}
                    placeholder={isUnverified ? "Awaiting verification..." : "e.g. Graphic Design, Web Dev..."}
                    value={newPrefInput}
                    onChange={(e) => setNewPrefInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (isUnverified) {
                          addToast("Cannot add interests while account is awaiting SK verification", "error");
                          return;
                        }
                        handleAddPreference(newPrefInput);
                      }
                    }}
                    className={`flex-1 px-3 py-2 h-9 sm:h-10 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                  />
                  <button
                    type="button"
                    disabled={isUnverified}
                    onClick={() => {
                      if (isUnverified) {
                        addToast("Cannot add interests while account is awaiting SK verification", "error");
                        return;
                      }
                      handleAddPreference(newPrefInput);
                    }}
                    className={`px-3.5 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-10 bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                  {(youthProfile.preferencesRaw && youthProfile.preferencesRaw.length > 0 ? youthProfile.preferencesRaw : (youthProfile.interests || [])).length > 0 ? (
                    (youthProfile.preferencesRaw && youthProfile.preferencesRaw.length > 0 ? youthProfile.preferencesRaw : (youthProfile.interests || [])).map((pref) => (
                      <span key={pref} className="bg-emerald-50 text-emerald-950 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                        <Compass className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                        {pref}
                        <button
                          onClick={() => handleRemovePreference(pref)}
                          disabled={isUnverified}
                          className="font-bold text-[11px] sm:text-xs text-emerald-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                          title="Remove interest"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] sm:text-xs text-gray-400 italic font-medium py-1">No preferred vocational interests listed.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom: 3. Prior Work & Practical Experiences Card - Full Width Row */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 sm:space-y-5 w-full">
              <div className="border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-600 shrink-0" />
                    <span>Prior Work & Practical Experiences</span>
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">Informal gigs, past employment, hands-on hobbies, or volunteer work</p>
              </div>

              {/* Add Experience Inline Input */}
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  disabled={isUnverified}
                  placeholder={isUnverified ? "Awaiting verification to add experiences..." : "e.g. Phone Repair, Store Assistant, Cooking Helper..."}
                  value={newExpInput}
                  onChange={(e) => setNewExpInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (isUnverified) {
                        addToast("Cannot add experiences while account is awaiting SK verification", "error");
                        return;
                      }
                      handleAddExperience(newExpInput);
                    }
                  }}
                  className={`flex-1 px-3 py-2 h-9 sm:h-10 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${isUnverified ? "bg-gray-100 cursor-not-allowed text-gray-400" : ""}`}
                />
                <button
                  type="button"
                  disabled={isUnverified}
                  onClick={() => {
                    if (isUnverified) {
                      addToast("Cannot add experiences while account is awaiting SK verification", "error");
                      return;
                    }
                    handleAddExperience(newExpInput);
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 h-9 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${isUnverified ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {youthProfile.experiencesRaw && youthProfile.experiencesRaw.length > 0 ? (
                  youthProfile.experiencesRaw.map((exp) => (
                    <span key={exp} className="bg-blue-50 text-blue-950 text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                      <Briefcase className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
                      {exp}
                      <button
                        onClick={() => handleRemoveExperience(exp)}
                        disabled={isUnverified}
                        className="font-bold text-[11px] sm:text-xs text-blue-600 hover:text-red-600 transition-colors p-0.5 cursor-pointer leading-none"
                        title="Remove experience"
                      >
                        &times;
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-[11px] sm:text-xs text-gray-400 italic font-medium py-1">No prior work experiences listed.</p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 3: Account Security - Balanced 2-Column Layout */}
        {profileActiveTab === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full pb-6"
          >
            <div className="xl:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                    <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                    Account Security & Password
                  </h3>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide block">Current Password *</label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password..."
                      className="w-full px-3 py-2 pr-10 h-9 sm:h-10 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide block">New Password *</label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)..."
                      className="w-full px-3 py-2 pr-10 h-9 sm:h-10 border border-gray-200 rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide block">Confirm New Password *</label>
                    {confirmPassword.length > 0 && (
                      <span className={`text-[10px] sm:text-[11px] font-bold ${doPasswordsMatch ? "text-[#0A6B43]" : "text-rose-500"}`}>
                        {doPasswordsMatch ? "Passwords match ✓" : "Passwords do not match"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password..."
                      className={`w-full px-3 py-2 pr-10 h-9 sm:h-10 border rounded-lg text-xs sm:text-sm font-medium text-gray-800 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden ${
                        confirmPassword.length > 0 && !doPasswordsMatch ? "border-rose-300 bg-rose-50/20" : "border-gray-200"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !isAllPasswordCriteriaMet || !doPasswordsMatch || !currentPassword}
                    className={`group/pwd px-4 sm:px-5 py-2 sm:py-2.5 h-9 sm:h-10 text-white text-xs sm:text-sm font-bold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isChangingPassword || !isAllPasswordCriteriaMet || !doPasswordsMatch || !currentPassword
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                        : "bg-[#0A6B43] hover:bg-[#075332] active:scale-98"
                    }`}
                  >
                    {isChangingPassword ? (
                      <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 group-hover/pwd:rotate-12 group-hover/pwd:scale-115" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Security Guide & Best Practices Companion Card - Solid #0A6B43 Background, Simple Icon (No Container), White Fonts & Dividers, No Subheader */}
            <div className="xl:col-span-5">
              <div className="bg-[#0A6B43] rounded-2xl p-5 sm:p-6 shadow-md space-y-4 text-xs text-white">
                {/* Guide Card Header: Simple icon without container, no subheader, white divider */}
                <div className="flex items-center gap-2.5 border-b border-white/20 pb-3">
                  <ShieldCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white shrink-0" />
                  <h4 className="font-bold text-white text-sm sm:text-base leading-tight">Security Guide</h4>
                </div>

                {/* Guide Checklist with dynamic visual appearance and check animation */}
                <div className="space-y-2.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider block">
                    Password Checklist
                  </span>
                  <div className="space-y-2.5">
                    {/* Item 1: Length */}
                    <div
                      className={`flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                        isPassLengthValid
                          ? "bg-white text-[#0A6B43] border-white shadow-sm font-bold scale-[1.01]"
                          : "bg-white/10 border-white/15 text-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isPassLengthValid ? (
                          <motion.div
                            key="check-len"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                          >
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                          </motion.div>
                        ) : (
                          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          </div>
                        )}
                        <span className="text-[11px] sm:text-xs">
                          At least <strong>8 characters long</strong>
                        </span>
                      </div>
                      {isPassLengthValid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] font-black text-[#0A6B43] bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                        >
                          ✓ Passed
                        </motion.span>
                      )}
                    </div>

                    {/* Item 2: Uppercase & Lowercase */}
                    <div
                      className={`flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                        isPassCaseValid
                          ? "bg-white text-[#0A6B43] border-white shadow-sm font-bold scale-[1.01]"
                          : "bg-white/10 border-white/15 text-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isPassCaseValid ? (
                          <motion.div
                            key="check-case"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                          >
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                          </motion.div>
                        ) : (
                          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          </div>
                        )}
                        <span className="text-[11px] sm:text-xs">
                          Combine <strong>uppercase & lowercase letters</strong>
                        </span>
                      </div>
                      {isPassCaseValid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] font-black text-[#0A6B43] bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                        >
                          ✓ Passed
                        </motion.span>
                      )}
                    </div>

                    {/* Item 3: Numbers or Symbols */}
                    <div
                      className={`flex items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl border transition-all duration-300 ${
                        isPassCharTypeValid
                          ? "bg-white text-[#0A6B43] border-white shadow-sm font-bold scale-[1.01]"
                          : "bg-white/10 border-white/15 text-white font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isPassCharTypeValid ? (
                          <motion.div
                            key="check-char"
                            initial={{ scale: 0, rotate: -45 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                          >
                            <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                          </motion.div>
                        ) : (
                          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                          </div>
                        )}
                        <span className="text-[11px] sm:text-xs">
                          Include <strong>numbers or symbols</strong> (0-9, @, #)
                        </span>
                      </div>
                      {isPassCharTypeValid && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-[10px] font-black text-[#0A6B43] bg-emerald-100/90 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                        >
                          ✓ Passed
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Guide Callout Tip */}
                <div className="pt-2 border-t border-white/20">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/15 text-white space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-white">
                      <Shield className="w-3.5 h-3.5 text-white" />
                      <span>Official LGU Account</span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                      Your SiKap account is tied to your official Katipunan ng Kabataan profile and TESDA scholarship records. Keep your credentials private and never share your password.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 4: Notifications & Alerts Preferences - Balanced 2-Column Layout */}
        {profileActiveTab === "notifications" && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full pb-6"
          >
            <div className="xl:col-span-7">
              <NotificationSettingsCard
                userRole="KK_YOUTH"
                userEmail={currentUser?.email}
                addToast={addToast}
                className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-6 animate-in fade-in duration-150"
              />
            </div>
            <div className="xl:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4 text-xs">
                <div className="border-b border-gray-100 pb-2.5">
                  <h4 className="font-bold text-gray-800 text-[16px] flex items-center gap-2">
                    <Bell className="w-4.5 h-4.5 text-[#0A6B43]" />
                    Official Notification Channels
                  </h4>
                </div>
                <div className="space-y-3 text-gray-600 font-medium">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-800 text-[14px] block">Web Push Alerts</span>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                      Real-time browser notifications for application updates, enrollment approvals, and newly announced scholarships.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="font-bold text-slate-800 text-[14px] block">Official Email Dispatch</span>
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
                      Important administrative documents, training commencement notices, and verification codes sent directly to your registered inbox.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Tab 4: Digital ID & Credentials Hub */}
        {profileActiveTab === "badge" && (() => {
          const userCompletedApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Archived") || [];
          const userEnrolledApps = referrals?.filter(r => r.youthName === youthProfile.name && r.status === "Enrolled") || [];
          const cardGender = spellOutGender(youthProfile.gender);
          const formattedBirthdate = youthProfile.birthdate
            ? (() => {
              try {
                const d = new Date(youthProfile.birthdate);
                return isNaN(d.getTime())
                  ? String(youthProfile.birthdate)
                  : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
              } catch {
                return String(youthProfile.birthdate);
              }
            })()
            : "Not recorded";

          const totalCertifiedHours = userCompletedApps.reduce((acc, app) => {
            const prog = programs.find(p => p.id === app.programId || p.title === app.programTitle);
            return acc + (prog?.trainingHours || 0);
          }, 0);

          const activeRoadmap: StoredCareerRoadmap | null = savedRoadmaps.find(r => r.id === selectedRoadmapId)
            || savedRoadmaps.find(r => r.isPrimary)
            || savedRoadmaps[0]
            || (currentSavedPlan ? { ...currentSavedPlan, id: "primary-roadmap", isPrimary: true } : null);

          const historyRecords = credentialsHistoryFilter === "completed"
            ? userCompletedApps
            : credentialsHistoryFilter === "enrolled"
              ? userEnrolledApps
              : [...userCompletedApps, ...userEnrolledApps];

          return (
            <motion.div
              key="badge"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="space-y-6 w-full pb-6"
            >
              {/* Compartment Navigation Header */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-[#0A6B43]" />
                      Digital ID & Credentials Hub
                    </h3>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Unified repository for your Katipunan ng Kabataan identity, accredited TVET certifications, and personalized career roadmaps.
                    </p>
                  </div>
                  <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-[#0A6B43] border border-emerald-200">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified Citizen Record
                  </span>
                </div>

                {/* 3 Navigations directly inside Digital ID & Credentials Hub box, each with its own box */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Official Digital ID */}
                  <button
                    type="button"
                    onClick={() => setCredentialsCompartment("id_card")}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      credentialsCompartment === "id_card"
                        ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-xs font-extrabold"
                        : "bg-gray-50/80 text-gray-700 border-gray-200 shadow-2xs hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>Official Digital ID</span>
                  </button>

                  {/* Training Credentials */}
                  <button
                    type="button"
                    onClick={() => setCredentialsCompartment("training_history")}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      credentialsCompartment === "training_history"
                        ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-xs font-extrabold"
                        : "bg-gray-50/80 text-gray-700 border-gray-200 shadow-2xs hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span className="truncate">Training Credentials</span>
                    {userCompletedApps.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        credentialsCompartment === "training_history"
                          ? "bg-white text-[#0A6B43]"
                          : "bg-emerald-100 text-[#0A6B43]"
                      }`}>
                        {userCompletedApps.length}
                      </span>
                    )}
                  </button>

                  {/* Career Roadmaps */}
                  <button
                    type="button"
                    onClick={() => setCredentialsCompartment("roadmaps")}
                    className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                      credentialsCompartment === "roadmaps"
                        ? "bg-[#0A6B43] text-white border-[#0A6B43] shadow-xs font-extrabold"
                        : "bg-gray-50/80 text-gray-700 border-gray-200 shadow-2xs hover:border-gray-300 hover:text-gray-900 hover:bg-gray-100/80"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="truncate">Career Roadmaps</span>
                    {savedRoadmaps.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                        credentialsCompartment === "roadmaps"
                          ? "bg-white text-[#0A6B43]"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {savedRoadmaps.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* COMPARTMENT 1: Official Digital ID Card */}
              {credentialsCompartment === "id_card" && (
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
                        <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#0A6B43]" />
                        Official Katipunan ng Kabataan Identification Card
                      </h4>
                      <p className="text-[11px] sm:text-xs text-gray-400 font-medium mt-0.5">
                        Municipality of San Luis, Pampanga • Certified Youth Member
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Active Member
                    </span>
                  </div>

                  {/* The Physical-Style Digital ID Card */}
                  <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto bg-white rounded-2xl border-2 border-emerald-800/20 shadow-md overflow-hidden relative">
                    {/* Top Section: Organization Header */}
                    <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3 bg-white border-b border-gray-100 gap-2 sm:gap-3">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                        <img src="/san-luis-seal.png" alt="San Luis Seal" className="w-full h-full object-contain" />
                      </div>
                      <div className="text-center flex-1 px-1 min-w-0">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                          Republic of the Philippines
                        </p>
                        <p className="text-xs sm:text-sm md:text-[15px] font-black uppercase tracking-wide text-gray-900 leading-tight my-0.5">
                          Municipality of San Luis
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-tight">
                          Sangguniang Kabataan
                        </p>
                      </div>
                      <div className="w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center">
                        <img src="/sk-logo.png" alt="SK Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    {/* Second Section: Title Bar */}
                    <div className="bg-[#0A6B43] text-white py-1 px-3 text-center shadow-xs">
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest block">
                        Katipunan ng Kabataan Identification Card
                      </span>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-3.5 sm:p-4 flex flex-row items-start gap-3.5 sm:gap-4.5 bg-gradient-to-b from-white to-gray-50/60">
                      <div className="flex flex-col items-center shrink-0 w-32 sm:w-36">
                        <div className="w-24 sm:w-28 h-30 sm:h-34 rounded-xl border-2 border-gray-200 bg-gray-100 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
                          <div className="flex flex-col items-center justify-center p-2 text-center">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                              <User className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">KK Member</span>
                          </div>
                        </div>
                        <div className="mt-2 text-center w-full">
                          <span className="font-mono text-[9px] sm:text-[9.5px] font-bold text-[#0A6B43] tracking-tight bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap inline-block">
                            ID: {youthProfile.id.toUpperCase().startsWith("KK-") ? youthProfile.id.toUpperCase() : `KK-SANLUIS-${youthProfile.id.length > 8 ? youthProfile.id.slice(-6).toUpperCase() : youthProfile.id.toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-2.5 min-w-0">
                        <div className="border-b border-gray-100 pb-1.5">
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Name</span>
                          <h4 className="text-sm sm:text-base font-black uppercase text-gray-900 tracking-tight leading-tight mt-0.5 truncate">
                            {youthProfile.name}
                          </h4>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Phone Number</span>
                            <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                              {youthProfile.contactNumber || "N/A"}
                            </span>
                          </div>
                          <div className="col-span-3 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block whitespace-nowrap">Gender</span>
                            <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                              {cardGender}
                            </span>
                          </div>
                          <div className="col-span-4 min-w-0">
                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Birthday</span>
                            <span className="text-xs font-bold text-gray-800 block truncate mt-0.5">
                              {formattedBirthdate}
                            </span>
                          </div>
                        </div>

                        <div className="border-t border-gray-100 pt-1.5">
                          <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Address</span>
                          <span className="text-xs font-bold text-gray-800 block leading-snug mt-0.5">
                            {youthProfile.purok ? `${youthProfile.purok}, ` : ""}Barangay {youthProfile.barangay || "San Isidro"}, San Luis, Pampanga
                          </span>
                        </div>
                      </div>
                    </div>

                    {userCompletedApps.length > 0 && (
                      <div className="px-4 py-2 bg-emerald-50/70 border-t border-emerald-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-[#0A6B43] min-w-0">
                          <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="text-[10px] uppercase tracking-wider">TVET Qualifications:</span>
                          <span className="font-semibold text-gray-800 text-[11px] truncate">{userCompletedApps.map(a => a.programTitle).join(", ")}</span>
                        </div>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-[#0A6B43] text-white shrink-0">
                          Graduate ✓
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ID Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500">
                    <p className="text-[11px] text-gray-400 text-center sm:text-left">
                      Official credentials recognized across municipal youth programs and TESDA partner centers.
                    </p>
                    <button
                      onClick={() => {
                        const fullIdStr = youthProfile.id.toUpperCase().startsWith("KK-") ? youthProfile.id.toUpperCase() : `KK-SANLUIS-${youthProfile.id.length > 8 ? youthProfile.id.slice(-6).toUpperCase() : youthProfile.id.toUpperCase()}`;
                        const completedStr = userCompletedApps.length > 0 ? `\nCertified Programs: ${userCompletedApps.map(a => a.programTitle).join(", ")}` : "";
                        navigator.clipboard?.writeText(
                          `Katipunan ng Kabataan Digital ID Card:\nName: ${youthProfile.name.toUpperCase()}\nID: ${fullIdStr}\nPhone: ${youthProfile.contactNumber || "N/A"}\nGender: ${cardGender}\nBirthday: ${formattedBirthdate}\nAddress: ${youthProfile.purok ? `${youthProfile.purok}, ` : ""}Barangay ${youthProfile.barangay || "San Isidro"}, San Luis, Pampanga${completedStr}`
                        );
                        addToast("Digital ID Card information copied to clipboard!", "success");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0A6B43]" />
                      Copy Digital ID Info
                    </button>
                  </div>
                </div>
              )}

              {/* COMPARTMENT 2: Training Credentials & History Folder */}
              {credentialsCompartment === "training_history" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center shrink-0 border border-emerald-200">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {userCompletedApps.length}
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          Certified Qualifications
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {totalCertifiedHours}
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          Total Certified Hours
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                          {userEnrolledApps.length}
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          Ongoing Programs
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                      <div>
                        <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                          <GraduationCap className="w-4.5 h-4.5 text-[#0A6B43]" />
                          TVET History & Credentials Portfolio
                        </h4>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                          Verified records of completed technical-vocational programs and training certifications.
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 bg-gray-100/80 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setCredentialsHistoryFilter("all")}
                          className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            credentialsHistoryFilter === "all"
                              ? "bg-white text-gray-900 shadow-2xs font-extrabold"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          All ({userCompletedApps.length + userEnrolledApps.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCredentialsHistoryFilter("completed")}
                          className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            credentialsHistoryFilter === "completed"
                              ? "bg-white text-emerald-800 shadow-2xs font-extrabold"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Graduates ({userCompletedApps.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCredentialsHistoryFilter("enrolled")}
                          className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                            credentialsHistoryFilter === "enrolled"
                              ? "bg-white text-blue-800 shadow-2xs font-extrabold"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Enrolled ({userEnrolledApps.length})
                        </button>
                      </div>
                    </div>

                    {historyRecords.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {historyRecords.map(app => {
                          const prog = programs.find(p => p.id === app.programId || p.title === app.programTitle);
                          const isCompleted = app.status === "Archived";
                          const categoryName = typeof prog?.category === "string"
                            ? prog.category
                            : (prog?.category?.name || "Technical Vocational");

                          return (
                            <div
                              key={app.id}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                isCompleted
                                  ? "bg-emerald-50/20 border-emerald-200/80 hover:border-emerald-300 hover:shadow-xs"
                                  : "bg-blue-50/20 border-blue-200/80 hover:border-blue-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {isCompleted ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                                        <CheckCircle className="w-3 h-3 text-[#0A6B43]" />
                                        Official TVET Graduate ✓
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                                        <Clock className="w-3 h-3 text-blue-700" />
                                        Currently In-Training
                                      </span>
                                    )}
                                    <span className="text-xs text-gray-500 font-medium">
                                      {isCompleted ? "Completed" : "Enrolled"}: {app.applicationDate || "Verified Term"}
                                    </span>
                                  </div>

                                  <h4 className="font-extrabold text-gray-900 text-[18px] leading-tight break-words">
                                    {app.programTitle}
                                  </h4>
                                  <p className="text-[14px] font-semibold text-gray-500 mt-0.5">
                                    {prog?.provider || "TESDA Partner Training Center"}
                                  </p>
                                </div>

                                <div className="shrink-0 text-left sm:text-right bg-white px-3 py-1.5 rounded-xl border border-gray-200/80 shadow-2xs self-start">
                                  <div className="text-xs font-extrabold text-[#0A6B43]">
                                    {prog?.trainingHours || 0} Training Hours
                                  </div>
                                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    {categoryName}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 mt-3 border-t border-gray-100 text-xs">
                                <div className="text-gray-600 flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">{extractLocationDisplay(prog?.location) || "San Luis, Pampanga"}</span>
                                </div>
                                <div className="text-gray-600 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">Trainer: {prog?.instructor || "TESDA Certified Trainer"}</span>
                                </div>
                                <div className="text-gray-600 flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                  <span className="truncate">Schedule: {prog?.trainingDays ? formatTrainingDays(prog.trainingDays) : "Regular Cohort"}</span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 mt-3 border-t border-gray-100">
                                {isCompleted ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setViewingCertificateApp(app)}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0A6B43] hover:bg-[#075332] text-white shadow-xs transition-colors cursor-pointer"
                                    >
                                      <Award className="w-3.5 h-3.5 text-amber-300" />
                                      <span>View Official Certificate</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const prog = programs.find(p => p.id === app.programId || p.title === app.programTitle);
                                        const certStatement = `Official TVET Credential:\nTrainee: ${youthProfile.name.toUpperCase()}\nProgram: ${app.programTitle}\nProvider: ${prog?.provider || 'TESDA Partner Center'}\nHours: ${prog?.trainingHours || 0} Hours\nStatus: Verified Graduate ✓`;
                                        navigator.clipboard?.writeText(certStatement);
                                        addToast("TVET Credential details copied to clipboard!", "success");
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                                      <span>Copy Credential Info</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                                      <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                      <span>Training is active. Complete this program to receive your official certificate.</span>
                                    </span>
                                    {prog && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenVenueMap(prog)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors cursor-pointer"
                                      >
                                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                        <span>View Venue Map</span>
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-8 sm:p-10 text-center rounded-2xl bg-gray-50/70 border border-dashed border-gray-200 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0A6B43] flex items-center justify-center mx-auto border border-emerald-100">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <h5 className="font-extrabold text-gray-900 text-sm sm:text-base">
                          {credentialsHistoryFilter === "completed"
                            ? "No Completed Programs Yet"
                            : credentialsHistoryFilter === "enrolled"
                              ? "No Current Enrolled Programs"
                              : "No Training Program Records Yet"}
                        </h5>
                        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                          {credentialsHistoryFilter === "completed"
                            ? "When your training program concludes and TESDA certifies your graduation, your official TVET Certificate of Completion will be archived here."
                            : "Explore our catalog of free TESDA-certified skills training and livelihood programs matching your profile to get started."}
                        </p>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveTab(YouthScreen.MATCHES)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span>Browse Matched Programs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* COMPARTMENT 3: Verified Career Roadmaps */}
              {credentialsCompartment === "roadmaps" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {savedRoadmaps.length > 0 && (
                    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          Your Saved Career Roadmaps ({savedRoadmaps.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab(YouthScreen.MATCHES)}
                          className="text-xs font-bold text-[#0A6B43] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Generate Another Roadmap</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                        {savedRoadmaps.map((r) => {
                          const isSelected = (activeRoadmap?.id === r.id) || (selectedRoadmapId === r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setSelectedRoadmapId(r.id)}
                              className={`shrink-0 px-3.5 py-2 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                                isSelected
                                  ? "bg-emerald-50 border-[#0A6B43] text-[#0A6B43] shadow-xs ring-2 ring-[#0A6B43]/10"
                                  : "bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-extrabold truncate max-w-[200px] sm:max-w-[260px]">
                                    {r.roadmapTitle}
                                  </span>
                                  {r.isPrimary && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                      ⭐ Primary
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-gray-400 font-medium">
                                  {r.generatedDate || "Saved Plan"}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeRoadmap ? (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                            <Sparkles className="w-4.5 h-4.5 text-amber-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] sm:text-xs font-black uppercase text-[#0A6B43] tracking-wider">
                                Verified Career Roadmap
                              </span>
                              {activeRoadmap.isPrimary ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                                  ⭐ Primary Focus
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryRoadmap(activeRoadmap.id)}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 hover:bg-emerald-50 text-gray-600 hover:text-[#0A6B43] border border-gray-200 transition-colors cursor-pointer"
                                >
                                  Set as Primary
                                </button>
                              )}
                            </div>
                            <h4 className="font-extrabold text-gray-900 text-base sm:text-lg">
                              {activeRoadmap.roadmapTitle}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                            Saved on: {activeRoadmap.generatedDate || "Recently"}
                          </span>
                          {savedRoadmaps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteRoadmap(activeRoadmap.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete this roadmap"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
                        {activeRoadmap.summary}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-100 space-y-1.5 text-xs sm:text-sm">
                          <span className="text-[10px] sm:text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                            <span>Wage Employment Track</span>
                          </span>
                          <p className="text-emerald-950 font-bold text-xs sm:text-sm">
                            {activeRoadmap.employmentTrack?.targetRoles?.join(", ")}
                          </p>
                          <p className="text-emerald-800 text-[11px] sm:text-[13px]">
                            Est. Salary: <strong className="text-emerald-900">{activeRoadmap.employmentTrack?.estimatedSalary}</strong>
                          </p>
                        </div>

                        <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-xl border border-amber-100 space-y-1.5 text-xs sm:text-sm">
                          <span className="text-[10px] sm:text-xs font-black uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                            <span>Freelance & Enterprise Track</span>
                          </span>
                          <p className="text-amber-950 font-bold text-xs sm:text-sm">
                            {activeRoadmap.entrepreneurshipTrack?.businessConcept}
                          </p>
                          <p className="text-amber-800 text-[11px] sm:text-[13px]">
                            {activeRoadmap.entrepreneurshipTrack?.starterFunding}
                          </p>
                        </div>
                      </div>

                      {/* Milestone Horizon Preview */}
                      {(activeRoadmap.immediate30Days?.length > 0 || activeRoadmap.longTerm1To2Years?.length > 0) && (
                        <div className="pt-2 border-t border-gray-100 space-y-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                            Pathway Horizons
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {activeRoadmap.immediate30Days?.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs">
                                <span className="font-extrabold text-[#0A6B43] block">Phase 1: Immediate 30 Days</span>
                                <span className="font-semibold text-gray-800 block text-[11px] mt-0.5 line-clamp-2">{activeRoadmap.immediate30Days[0]}</span>
                              </div>
                            )}
                            {activeRoadmap.longTerm1To2Years?.length > 0 && (
                              <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                                <span className="font-extrabold text-amber-800 block">Phase 2: 1 to 2 Years Horizon</span>
                                <span className="font-semibold text-gray-800 block text-[11px] mt-0.5 line-clamp-2">{activeRoadmap.longTerm1To2Years[0]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-gray-100 text-xs sm:text-sm">
                        <button
                          onClick={() => setActiveTab(YouthScreen.PATHWAY)}
                          className="text-[#0A6B43] hover:text-[#075332] font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>View Full Pathway & Next Steps</span>
                          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              `Career Roadmap: ${activeRoadmap.roadmapTitle}\nSummary: ${activeRoadmap.summary}\nTarget Salary: ${activeRoadmap.employmentTrack?.estimatedSalary}\nRoles: ${activeRoadmap.employmentTrack?.targetRoles?.join(", ")}`
                            );
                            addToast("Career Plan summary copied to clipboard!", "success");
                          }}
                          className="text-gray-500 hover:text-gray-700 font-bold text-xs sm:text-sm flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>Copy Summary</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-center border border-dashed border-gray-200 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h5 className="font-extrabold text-gray-900 text-base">
                        No Saved Career Roadmaps Yet
                      </h5>
                      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                        Generate personalized AI Career Roadmaps tailored to your vocational interests and skills. You can save multiple roadmaps and designate your primary career focus here.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab(YouthScreen.MATCHES)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A6B43] hover:bg-[#075332] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Explore Matched Programs & Create Roadmap</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Official Certificate of Training Completion Modal */}
              {viewingCertificateApp && (() => {
                const certProg = programs.find(p => p.id === viewingCertificateApp.programId || p.title === viewingCertificateApp.programTitle);
                const certSerial = `CERT-SLP-${viewingCertificateApp.id.length > 8 ? viewingCertificateApp.id.slice(-8).toUpperCase() : viewingCertificateApp.id.toUpperCase()}`;
                const certDate = viewingCertificateApp.applicationDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
                const certHours = certProg?.trainingHours || 240;

                return (
                  <div
                    className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) setViewingCertificateApp(null);
                    }}
                  >
                    <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-800/20 relative animate-in zoom-in-95 duration-200">
                      <div className="bg-[#0A6B43] px-4 sm:px-6 py-3 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-300" />
                          <span className="font-extrabold text-xs sm:text-sm uppercase tracking-wider">
                            Official Training Completion Certificate
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingCertificateApp(null)}
                          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-6 sm:p-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-center space-y-6">
                        <div className="border-4 border-double border-emerald-900/40 p-6 sm:p-8 rounded-2xl bg-white shadow-xs space-y-6 relative overflow-hidden">
                          <div className="absolute top-2 left-2 text-[#0A6B43]/30 font-serif text-lg">❖</div>
                          <div className="absolute top-2 right-2 text-[#0A6B43]/30 font-serif text-lg">❖</div>
                          <div className="absolute bottom-2 left-2 text-[#0A6B43]/30 font-serif text-lg">❖</div>
                          <div className="absolute bottom-2 right-2 text-[#0A6B43]/30 font-serif text-lg">❖</div>

                          <div className="flex items-center justify-center gap-4 sm:gap-6 border-b border-gray-100 pb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                              <img src="/san-luis-seal.png" alt="San Luis Seal" className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                Republic of the Philippines • Province of Pampanga
                              </p>
                              <h3 className="text-sm sm:text-lg font-black uppercase text-gray-900 tracking-wide">
                                Municipality of San Luis
                              </h3>
                              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0A6B43]">
                                Sangguniang Kabataan • Technical Vocational Education & Training
                              </p>
                            </div>
                            <div className="w-12 h-12 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center">
                              <img src="/sk-logo.png" alt="SK Logo" className="w-full h-full object-contain" />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
                              Certificate of Training Completion
                            </span>
                            <p className="text-xs text-gray-500 font-medium pt-2">
                              This is to proudly certify that
                            </p>
                            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#0A6B43] tracking-tight uppercase underline decoration-2 decoration-emerald-600/30 underline-offset-4 py-1">
                              {youthProfile.name}
                            </h2>
                            <p className="text-xs text-gray-600 max-w-lg mx-auto leading-relaxed pt-1">
                              has successfully completed all prescribed coursework, competencies, and practical requirements for the Technical-Vocational skills program:
                            </p>
                            <div className="py-2">
                              <div className="text-base sm:text-xl font-black text-gray-900 uppercase bg-gray-50 py-2 px-4 rounded-xl border border-gray-200/80 inline-block">
                                {viewingCertificateApp.programTitle}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500">
                              Administered by <strong className="text-gray-800">{certProg?.provider || "TESDA Partner Training Center"}</strong> with a certified duration of <strong className="text-emerald-800">{certHours} Training Hours</strong>.
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                            <div className="text-center space-y-1">
                              <div className="w-32 sm:w-40 h-8 mx-auto border-b border-gray-400 flex items-end justify-center pb-0.5">
                                <span className="text-[10px] font-serif italic text-gray-600">Official Municipal Seal</span>
                              </div>
                              <span className="text-xs font-black text-gray-900 block">Sangguniang Kabataan</span>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">Municipal Chairperson</span>
                            </div>

                            <div className="text-center space-y-1">
                              <div className="w-32 sm:w-40 h-8 mx-auto border-b border-gray-400 flex items-end justify-center pb-0.5">
                                <span className="text-[10px] font-serif italic text-gray-600">TESDA Accredited</span>
                              </div>
                              <span className="text-xs font-black text-gray-900 block">{certProg?.instructor || "Vocational Lead Trainer"}</span>
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">Training Center Administrator</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-dashed border-gray-200 text-[10px] text-gray-400 font-mono">
                            <span>Reference No: {certSerial}</span>
                            <span>Date of Issuance: {certDate}</span>
                            <span className="text-emerald-700 font-bold">Status: Verified & Concluded ✓</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="px-5 py-2.5 rounded-xl bg-[#0A6B43] hover:bg-[#075332] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-4 h-4" />
                            <span>Print / Save as PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingCertificateApp(null)}
                            className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
                          >
                            Close Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          );
        })()}
        </AnimatePresence>
      </main>
    </div>
  </div>
)
}

        </div >

  {/* Floating Add Skill Modal */}
  {showAddSkillModal && (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setNewSkillInput("");
          setShowAddSkillModal(false);
        }
      }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 ease-out border border-gray-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)]">
        {/* Green Card Header */}
        <div className="bg-[#0A6B43] px-5 sm:px-6 py-4 sm:py-4.5 flex justify-between items-center text-white">
          <h4 className="font-extrabold text-white text-xl sm:text-[22px] tracking-tight">Add Skill</h4>
          <button
            type="button"
            onClick={() => {
              setNewSkillInput("");
              setShowAddSkillModal(false);
            }}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-5 sm:p-6 pb-4 sm:pb-5">
          <form onSubmit={handleAddSkillSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Skill or Competency Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g., Bread & Pastry, Basic Computing, Carpentry..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setNewSkillInput("");
                      setShowAddSkillModal(false);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#0A6B43] focus:ring-2 focus:ring-[#0A6B43]/15 transition-all"
                />
                {newSkillInput && (
                  <button
                    type="button"
                    onClick={() => setNewSkillInput("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full transition-colors cursor-pointer"
                    title="Clear input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="space-y-1.5 pt-0.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Quick suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Basic Computer",
                  "Bread & Pastry",
                  "Cookery",
                  "Electrical Installation",
                  "Automotive Servicing",
                  "Welding"
                ]
                  .filter((sug) => !youthProfile.skills?.some(s => s.toLowerCase() === sug.toLowerCase()))
                  .slice(0, 6)
                  .map((sug) => {
                    const isSelected = newSkillInput.trim().toLowerCase() === sug.toLowerCase();
                    return (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setNewSkillInput(sug)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-[#0A6B43] border-emerald-300 font-bold shadow-2xs"
                            : "bg-gray-50/80 hover:bg-emerald-50/60 hover:text-[#0A6B43] hover:border-emerald-200 text-gray-600 border-gray-200/80 font-medium"
                        }`}
                      >
                        + {sug}
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Compact Footer without Cancel button */}
            <div className="flex items-center justify-end pt-2.5 border-t border-gray-100">
              <button
                type="submit"
                disabled={!newSkillInput.trim()}
                className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Skill</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )}

{/* Complete Program Details Modal Popup */}
{viewingProgramModal && (() => {
    const modalProg = viewingProgramModal.program;
    const modalScore = viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, modalProg);
    const isModalTopMatch = topMatchProgramIds.has(modalProg.id) && modalScore >= 50;
    const modalCategoryMeta = getCBFMatchCategory(modalScore, hasEnoughMatchingData);
    const modalProgSector = (() => {
      const c = modalProg.category;
      if (typeof c === "string" && c.trim()) {
        const found = CATEGORIES.find(cat => cat.id === c || cat.slug === c || cat.name.toLowerCase() === c.toLowerCase());
        if (found) return found.name;
        return c;
      }
      if (c && typeof c === "object" && c.name) {
        return c.name;
      }
      if (modalProg.categoryId) {
        const found = CATEGORIES.find(cat => cat.id === String(modalProg.categoryId));
        if (found) return found.name;
      }
      const detailed = calculateDetailedCBFMatch(youthProfile, modalProg);
      if (detailed && detailed.categoryName) {
        return detailed.categoryName;
      }
      return modalProg.type ? `${modalProg.type} Training` : "Technical-Vocational Training";
    })();

    return (
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden animate-in fade-in duration-200"
        style={{ zIndex: 50 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) setViewingProgramModal(null);
        }}
      >
        <div className="relative bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-gray-200 shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Modal Top Header (Pinned at Top) */}
          <div className="p-4 sm:p-5 sm:px-6 border-b border-gray-200 shrink-0 bg-white">
            <div className="flex items-center justify-between gap-3">
              {/* Upper Top: Top Match Badge or Category Match Badge */}
              <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                {isModalTopMatch ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-linear-to-r from-amber-500 via-amber-400 to-[#0A6B43] text-white text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
                    Top Match
                  </span>
                ) : (
                  <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-md border tracking-wider ${
                    modalCategoryMeta.label === "Others" || modalCategoryMeta.label === "Not Match" || modalScore <= 0
                      ? "bg-gray-100 text-gray-600 border-gray-300"
                      : `${modalCategoryMeta.badgeBg} ${modalCategoryMeta.badgeText} ${modalCategoryMeta.badgeBorder}`
                  }`}>
                    {modalCategoryMeta.label === "Others" || modalScore <= 0 ? "Not Match" : modalCategoryMeta.label}
                  </span>
                )}
                {isProgramEnded(modalProg) && (
                  <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 tracking-wider inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-600" />
                    Term Ended
                  </span>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => setViewingProgramModal(null)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
                aria-label="Close modal"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Header: Title and % Match in Top Right */}
            <div className="mt-2.5 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-gray-900 text-[22px] leading-tight break-words">
                  {modalProg.title}
                </h3>
                {/* Subheader: Program Provider */}
                <div className="mt-0.5 flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                  <span className="font-semibold text-gray-500">
                    {(modalProg.provider || modalProg.centerName) || "TESDA Pampanga (GPSAT)"}
                  </span>
                </div>
              </div>
              <div className="shrink-0 pt-0.5">
                <FlameMatchScore
                  score={modalScore}
                  hasEnoughData={hasEnoughMatchingData}
                  isTopMatch={isModalTopMatch}
                />
              </div>
            </div>
          </div>

          {/* Modal Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain modal-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">
            {isUnverified && (
              <div className="bg-amber-50 border border-amber-200/90 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium shadow-2xs">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You are previewing this program in <strong>View-Only mode</strong>. Direct enrollment will unlock once your account is verified by your Barangay SK Chairman.</span>
              </div>
            )}

            {/* Program Description & Overview from Database */}
            {(() => {
              const desc = getProgramDescription(modalProg);
              if (!desc) return null;
              return (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-2.5 shadow-2xs">
                  <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                    <span>PROGRAM DESCRIPTION &amp; OVERVIEW</span>
                  </span>
                  <p className="text-xs sm:text-[13px] text-gray-700 font-normal leading-relaxed">
                    {desc}
                  </p>
                </div>
              );
            })()}
      

      {/* CONDITIONAL: Gemini AI Match Rationale & 3-Step Pathway ONLY for Top Match programs */}
      {(() => {
        const modalProgId = viewingProgramModal.program.id;
        const modalScore = viewingProgramModal.matchScore || calculateContentBasedMatchScore(youthProfile, viewingProgramModal.program);
        const isModalTopMatch = topMatchProgramIds.has(modalProgId) && modalScore >= 50;
        const modalCategoryMeta = getCBFMatchCategory(modalScore, hasEnoughMatchingData);
        const modalBreakdown = calculateDetailedCBFMatch(youthProfile, viewingProgramModal.program);
        const modalLang = getProgramLang(modalProgId);
        const modalProgAdvice = topMatchAdviceMap[modalProgId];

        const modalRationale = isModalTopMatch && modalProgAdvice && (modalLang === "tl" ? modalProgAdvice.careerAdviceTl : modalProgAdvice.careerAdvice)
          ? (modalLang === "tl" ? modalProgAdvice.careerAdviceTl : modalProgAdvice.careerAdvice)
          : getFallbackPersonalizedRationale(youthProfile, viewingProgramModal.program, modalLang);

        const modalBullets = isModalTopMatch && modalProgAdvice && (modalLang === "tl" ? (modalProgAdvice.bulletAdviceTl?.length === 3 ? modalProgAdvice.bulletAdviceTl : null) : (modalProgAdvice.bulletAdvice?.length === 3 ? modalProgAdvice.bulletAdvice : null))
          ? (modalLang === "tl" ? modalProgAdvice.bulletAdviceTl : modalProgAdvice.bulletAdvice)
          : getFallbackPersonalized3StepPathway(youthProfile, viewingProgramModal.program, modalLang);

        if (isModalTopMatch) {
          return (
            <div className="space-y-3">
              {/* Top Match Designation Banner in Modal */}
              <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-linear-to-r from-amber-500/10 via-emerald-50 to-emerald-100/50 border border-emerald-200">
                <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#0A6B43]">
                  <span className="xl:hidden">Top Match</span>
                  <span className="hidden xl:inline">Top Match Designation</span>
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-[10px] sm:text-[11px] font-bold shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setProgramLang(modalProgId, "en")}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${modalLang === "en" ? "bg-[#0A6B43] text-white font-extrabold shadow-2xs" : "text-gray-500 hover:text-[#0A6B43]"}`}
                    title="Read in English"
                  >
                    <span className="xl:hidden">EN</span>
                    <span className="hidden xl:inline">English</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramLang(modalProgId, "tl")}
                    className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${modalLang === "tl" ? "bg-[#0A6B43] text-white font-extrabold shadow-2xs" : "text-gray-500 hover:text-[#0A6B43]"}`}
                    title="Isalin sa Tagalog"
                  >
                    <span className="xl:hidden">TAG</span>
                    <span className="hidden xl:inline">Tagalog</span>
                  </button>
                </div>
              </div>

              {/* Gemini AI Match Rationale */}
              <div className="bg-emerald-50/90 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/80 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
                    Gemini Match Rationale
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">
                    Powered by Google Gemini
                  </span>
                </div>
                <p className="text-xs italic text-emerald-950 leading-relaxed font-medium text-justify">
                  &ldquo;{modalRationale}&rdquo;
                </p>
              </div>

              {/* Personalized 3-Step Pathway */}
              <div className="bg-emerald-50/60 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#0A6B43] tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#0A6B43]" />
                    Personalized 3-Step Pathway
                  </span>
                  <span className="text-[10px] font-bold text-gray-400">Action Plan</span>
                </div>
                <div className="space-y-2">
                  {modalBullets.map((rawStep, sIdx) => {
                    const step = rawStep.replace(/^(?:Step|Hakbang)\s*\d+[:\-–—\.\s]*/i, "").trim();
                    return (
                      <div
                        key={sIdx}
                        className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white border border-emerald-200/80 shadow-2xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#0A6B43] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {sIdx + 1}
                        </span>
                        <span className="flex-1 break-words text-xs text-gray-800 font-medium leading-snug">
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // Non-Top Match: Match Category + Relevant Matched Skills / Preferences without Gemini Rationale or Pathway
        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
            <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
              <span>MATCH CATEGORY</span>
            </span>
            <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
              {modalCategoryMeta.description}
            </p>

            {/* Relevant matched skills or preferences */}
            {modalBreakdown.matchedSkills && modalBreakdown.matchedSkills.length > 0 && (
              <div className="pt-2.5 border-t border-gray-100 space-y-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  RELEVANT MATCHED COMPETENCIES ({modalBreakdown.matchedSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {modalBreakdown.matchedSkills.map((sk, sIdx) => (
                    <span key={sIdx} className="text-xs font-semibold text-[#0A6B43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-150 flex items-center gap-1 shadow-2xs">
                      <Check className="w-3 h-3 text-[#0A6B43]" />
                      {toTitleCase(sk)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}


      {/* Program Schedule & Details Grid */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ClipboardList className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
          <span>PROGRAM SCHEDULE &amp; DETAILS</span>
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
          {/* Total Training Hours */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Timer className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Total Training Hours</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {viewingProgramModal.program.trainingHours} Hours
              </p>
            </div>
          </div>

          {/* Training Period */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <CalendarDays className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Training Period</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {formatProgramDateRange(viewingProgramModal.program.startDate, viewingProgramModal.program.endDate) || "Flexible Schedule"}
              </p>
            </div>
          </div>

          {/* Training Schedule */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Training Schedule</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {formatTrainingDays(viewingProgramModal.program.trainingDays)}
              </p>
            </div>
          </div>

          {/* Training Hours (formerly Timeslot & Session) */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Training Hours</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {(() => {
                  const ts = formatProgramTimeslot(viewingProgramModal.program.startTime, viewingProgramModal.program.endTime);
                  return `${ts.formattedRange}${ts.sessionType !== "Custom" ? ` (${ts.sessionType})` : ""}`;
                })()}
              </p>
            </div>
          </div>

          {/* Trainer / Instructor */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <UserCheck className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Trainer / Instructor</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {viewingProgramModal.program.instructor || "TESDA Certified Trainer"}
              </p>
            </div>
          </div>

          {/* Program Cost */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Coins className="w-3.5 h-3.5 text-gray-500" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Program Cost</span>
              <p className="text-[13px] font-black text-emerald-700 leading-snug break-words">
                {viewingProgramModal.program.cost || "100% Free / Subsidized"}
              </p>
            </div>
          </div>

          {/* Delivery Mode */}
          {viewingProgramModal.program.deliveryMode && (
            <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
              <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Delivery Mode</span>
                <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                  {viewingProgramModal.program.deliveryMode}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Training Venue & Location Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 space-y-3 shadow-2xs">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
          <span>TRAINING VENUE &amp; LOCATION</span>
        </span>

        {/* Map Canvas with Floating Elements & Expand Button */}
        <div className="h-[260px] sm:h-[290px] w-full">
          <EnrolledProgramMiniMap
            program={viewingProgramModal.program}
            locationString={viewingProgramModal.program.location}
            onOpenFullMap={() => handleOpenVenueMap(viewingProgramModal.program)}
          />
        </div>

        {/* Venue Details: Location and Facility / Room */}
        <div className="space-y-2.5 text-xs pt-1">
          {/* Location */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Training Venue / Location</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {extractLocationDisplay(viewingProgramModal.program.location) || viewingProgramModal.program.location || "San Luis, Pampanga"}
              </p>
            </div>
          </div>

          {/* Facility / Room */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-start gap-2.5 shadow-2xs">
            <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-normal block">Facility / Room</span>
              <p className="text-[13px] font-bold text-gray-800 leading-snug break-words">
                {viewingProgramModal.program.room || "Main Training Facility"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card: PROGRAM DESCRIPTION */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
          <span>PROGRAM DESCRIPTION</span>
        </span>
        <ul className="space-y-2 text-xs sm:text-[13px] text-gray-700 font-normal">
          {(() => {
            const raw = viewingProgramModal.program.eligibility;
            const items = raw && raw.trim() && raw.trim().toLowerCase() !== "open to all"
              ? raw.split(/[;\n]+/).map(s => s.trim()).filter(Boolean)
              : [
                  `${viewingProgramModal.program.title} is a TESDA-certified qualification that equips individuals with the knowledge and practical skills to perform industry-standard technical operations and workplace competencies. Open to all Katipunan ng Kabataan (KK) youth in San Luis, Pampanga.`
                ];
            return items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                <span>{toTitleCase(item)}</span>
              </li>
            ));
          })()}
        </ul>
      </div>

      {/* Card: REQUIRED REQUIREMENTS (Matching exact spec with automatic title case) */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-2xs">
        <span className="text-[11px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />
          <span>REQUIRED REQUIREMENTS</span>
        </span>
        <ul className="space-y-2 text-xs sm:text-[13px] text-gray-700 font-normal">
          {(() => {
            const docs = (viewingProgramModal.program.requiredDocuments && viewingProgramModal.program.requiredDocuments.length > 0)
              ? viewingProgramModal.program.requiredDocuments
              : DEFAULT_TESDA_REQUIREMENTS;
            return docs.map((doc, idx) => (
              <li key={idx} className="flex items-start gap-2.5 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                <span>{toTitleCase(doc)}</span>
              </li>
            ));
          })()}
        </ul>
      </div>
    </div>

    {/* Modal Action Footer (Pinned at Bottom) */}
    {(() => {
        const prog = viewingProgramModal.program;
        const app = referrals?.find(r => r.youthName === youthProfile.name && r.programTitle === prog.title);
        const isCompleted = isProgramCompleted(prog);
        const isEnrolled = app?.status === "Enrolled";
        const isApproved = app?.status === "Approved";
        const isDeclined = app?.status === "Declined";
        const isPending = app?.status === "Pending";
        const isEnded = isProgramEnded(prog);
        const isFull = !app && prog.slotsRemaining <= 0;
        const overlapWarning = getOverlapWarning(prog);

        return (
          <div className="p-3.5 sm:p-5 border-t border-gray-200 shrink-0 bg-gray-50/95 rounded-b-2xl sm:rounded-b-3xl">
            <div className="flex justify-between items-center gap-2.5 sm:gap-3">
              {/* Slot Indicator in current position of Close Details (Left side) */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>Slots:</span>
                <span className="font-bold text-gray-800 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-xs shadow-2xs">
                  <strong className="text-[#0A6B43]">{prog.slotsRemaining}</strong> / {prog.slotsTotal} open
                </span>
              </div>

              {isCompleted ? (
                <button
                  disabled
                  className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
                  title="You have already completed this program and earned your certification"
                >
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span>Completed ✓</span>
                </button>
              ) : isEnded && !app ? (
                <button
                  disabled
                  className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center gap-1 sm:gap-1.5 cursor-not-allowed shadow-2xs whitespace-nowrap shrink-0"
                  title="This training program's term has ended or is closed"
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600 shrink-0" />
                  <span>Term Ended</span>
                </button>
              ) : isEnrolled ? (
                <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-50 text-[#0A6B43] border border-emerald-200 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#0A6B43]" />
                  <span>Enrolled</span>
                </span>
              ) : isApproved ? (
                <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs whitespace-nowrap shrink-0 animate-pulse">
                  <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-600 shrink-0" />
                  <span>Submit Docs</span>
                </span>
              ) : isPending ? (
                <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs whitespace-nowrap shrink-0 animate-pulse">
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 animate-pulse shrink-0" />
                  <span>Application Received</span>
                </span>
              ) : isDeclined ? (
                <span className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center gap-1 sm:gap-1.5 shadow-2xs whitespace-nowrap shrink-0">
                  <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 shrink-0" />
                  <span>Declined</span>
                </span>
              ) : isFull ? (
                <button
                  disabled
                  className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed whitespace-nowrap shrink-0"
                >
                  Slots Full
                </button>
              ) : (isUnverified || !!overlapWarning) ? (
                <button
                  disabled
                  className="text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 shadow-xs whitespace-nowrap shrink-0 bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none"
                  title={isUnverified ? "Cannot apply while awaiting SK verification" : overlapWarning || "Apply for this TESDA training program"}
                >
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-gray-400" />
                  <span className="whitespace-nowrap">Apply Now</span>
                </button>
              ) : (
                <button
                  onClick={() => handleDirectApply(viewingProgramModal.program)}
                  className="group/apply text-[11px] sm:text-xs font-bold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-xs whitespace-nowrap shrink-0 bg-[#0A6B43] hover:bg-[#075332] text-white cursor-pointer active:scale-95"
                  title="Apply for this TESDA training program"
                >
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover/apply:translate-x-1 group-hover/apply:-translate-y-0.5 group-hover/apply:scale-110 shrink-0" />
                  <span className="whitespace-nowrap transition-transform duration-200 group-hover/apply:translate-x-0.5 group-hover/apply:scale-105 inline-block">Apply Now</span>
                </button>
              )}
            </div>
          </div>
        );
      })()}
        </div>
      </div>
    );
  })()}

  {/* Direct Application Confirmation Modal (Centered Desktop style) */ }
  {
    showApplyModal && (
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        style={{ zIndex: 100 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            isSubmittingAppRef.current = false;
      setIsSubmittingApplication(false);
      setShowApplyModal(false);
            setSelectedProgramToApply(null);
          }
        }}
      >
        <div className="bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-[360px] w-full animate-in fade-in zoom-in-95 duration-200 ease-out border border-emerald-100">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto shadow-2xs">
            <CheckCircle className="w-9 h-9 text-[#0A6B43]" />
          </div>
          <div>
            <h4 className="font-extrabold text-gray-900 text-base">Apply for training?</h4>
            <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
              This will submit your application directly to TESDA for the <strong className="text-gray-800">{selectedProgramToApply?.title || "selected training program"}</strong>.
            </p>
          </div>
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={() => {
                isSubmittingAppRef.current = false;
      setIsSubmittingApplication(false);
      setShowApplyModal(false);
                setSelectedProgramToApply(null);
              }}
              disabled={isSubmittingApplication}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 active:scale-98 transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={confirmDirectApply}
              disabled={isSubmittingApplication}
              className="flex-1 py-2.5 bg-[#0A6B43] hover:bg-[#075332] active:scale-98 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmittingApplication ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Apply Now</span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* Cancel Application Confirmation Modal */}
  {referralToCancel && (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ zIndex: 100 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isCancellingApplication) {
          setReferralToCancel(null);
        }
      }}
    >
      <div className="bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4 max-w-[380px] w-full animate-in fade-in zoom-in-95 duration-200 ease-out border border-red-100">
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto shadow-2xs">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h4 className="font-extrabold text-gray-900 text-base">Cancel Application?</h4>
          <p className="text-xs text-gray-500 leading-relaxed mt-2 font-medium">
            Are you sure you want to cancel your application for <strong className="text-gray-800">{referralToCancel.programTitle}</strong>? Your reserved training slot will be released and you will need to re-apply if you change your mind.
          </p>
        </div>
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            disabled={isCancellingApplication}
            onClick={() => setReferralToCancel(null)}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 active:scale-98 transition-all cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Application
          </button>
          <button
            type="button"
            disabled={isCancellingApplication}
            onClick={confirmCancelApplication}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:scale-98 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isCancellingApplication ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Yes, Cancel</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Verification ID Full Photo Modal */ }
  {
    showIdPhotoModal && youthProfile.verificationIdImage && (() => {
      const parsedModalId = parseVerificationIdImages(youthProfile.verificationIdImage);
      const activeSrc = parsedModalId.isDualPhoto && idPhotoModalSide === "back" && parsedModalId.back
        ? parsedModalId.back
        : parsedModalId.front;
      return (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          style={{ zIndex: 110 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIdPhotoModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-w-xl w-full animate-in fade-in zoom-in-95 duration-200 ease-out border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0A6B43]" />
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm">{youthProfile.verificationIdType || "Government ID"} Attached</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Uploaded for SK Verification</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {parsedModalId.isDualPhoto && parsedModalId.back && (
                  <div className="inline-flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setIdPhotoModalSide("front")}
                      className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                        idPhotoModalSide === "front" ? "bg-[#0A6B43] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Front Side
                    </button>
                    <button
                      type="button"
                      onClick={() => setIdPhotoModalSide("back")}
                      className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition-all cursor-pointer ${
                        idPhotoModalSide === "back" ? "bg-[#0A6B43] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Back Side
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowIdPhotoModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-gray-900 flex items-center justify-center p-2 min-h-[260px]">
              {parsedModalId.isPdf ? (
                <iframe
                  src={parsedModalId.front}
                  title="PDF Government ID"
                  className="w-full h-[60vh] rounded-lg bg-white border-0"
                />
              ) : (
                <img
                  src={activeSrc}
                  alt="Full Government ID"
                  className="max-h-[62vh] w-auto object-contain rounded-lg shadow-sm"
                />
              )}
            </div>

            <div className="flex justify-between items-center pt-2 text-xs">
              <span className="font-mono text-gray-600 font-bold">
                {youthProfile.verificationIdNumber ? `ID No: ${youthProfile.verificationIdNumber}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setShowIdPhotoModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      );
    })()
  }

        {/* Training Venue Interactive Map Viewer Modal */}
        <TrainingVenueMapModal
          isOpen={isVenueMapOpen}
          onClose={() => {
            setIsVenueMapOpen(false);
            setMapModalProgram(null);
          }}
          mode="viewer"
          programTitle={mapModalProgram?.title}
          provider={mapModalProgram?.provider || "TESDA Partner"}
          initialLocation={mapModalProgram?.location}
          initialLat={mapModalProgram?.latitude || (mapModalProgram?.location ? extractLocationCoords(mapModalProgram.location)?.lat : undefined)}
          initialLng={mapModalProgram?.longitude || (mapModalProgram?.location ? extractLocationCoords(mapModalProgram.location)?.lng : undefined)}
          room={mapModalProgram?.room}
          instructor={mapModalProgram?.instructor}
          contactPerson={mapModalProgram?.contactPerson}
          contactNumber={mapModalProgram?.contactNumber}
        />

      </main >
    </div >
  );
};
