"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Flame, Check, CheckCircle2, AlertCircle, ArrowRight, X, AlertTriangle, Lightbulb, Info, Sparkles, ChevronDown, ChevronUp, Clock, Calendar, ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { TESDAProgram } from "../types";
import { getProgramFullSchedule, formatProgramDateRange } from "../lib/cbf-matcher";
import { motion, AnimatePresence } from "motion/react";
import { calculateAge } from "../lib/utils";

// Flame match score component
export const FlameMatchScore: React.FC<{ score: number; className?: string; hasPrograms?: boolean }> = ({ score, className = "", hasPrograms = true }) => {
  if (!hasPrograms || score <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 bg-gray-50/80 ${className}`}>
        <span>N/A (No Programs)</span>
      </div>
    );
  }

  let flameColor = "text-gray-400 fill-gray-400";
  let textColor = "text-gray-500 bg-gray-100 border-gray-200";
  let label = "Low Match";

  if (score >= 90) {
    flameColor = "text-amber-500 fill-amber-500 animate-pulse";
    textColor = "text-emerald-700 bg-emerald-50 border-emerald-200";
    label = "Excellent Match";
  } else if (score >= 75) {
    flameColor = "text-amber-400 fill-amber-400";
    textColor = "text-teal-700 bg-teal-50 border-teal-200";
    label = "Good Match";
  } else if (score >= 50) {
    flameColor = "text-amber-400 fill-transparent";
    textColor = "text-amber-700 bg-amber-50 border-amber-200";
    label = "Fair Match";
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${textColor} ${className}`} id={`flame-match-${score}`}>
      {score >= 50 && <Flame className={`w-3.5 h-3.5 ${flameColor}`} />}
      <span>{score}% {label}</span>
    </div>
  );
};

// Metric card component
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  accent: "green" | "gold" | "teal" | "charcoal" | "red";
}> = ({ title, value, subtitle, icon, accent }) => {
  const themes = {
    green: {
      border: "border-emerald-100 hover:border-emerald-300",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      shadow: "shadow-emerald-50"
    },
    gold: {
      border: "border-amber-100 hover:border-amber-300",
      bg: "bg-amber-50",
      text: "text-amber-700",
      shadow: "shadow-amber-50"
    },
    teal: {
      border: "border-teal-100 hover:border-teal-300",
      bg: "bg-teal-50",
      text: "text-teal-700",
      shadow: "shadow-teal-50"
    },
    charcoal: {
      border: "border-gray-100 hover:border-gray-300",
      bg: "bg-gray-50",
      text: "text-gray-800",
      shadow: "shadow-gray-50"
    },
    red: {
      border: "border-red-100 hover:border-red-300",
      bg: "bg-red-50",
      text: "text-red-700",
      shadow: "shadow-red-50"
    }
  };

  const currentTheme = themes[accent];

  return (
    <div className={`bg-white p-3.5 sm:p-5 rounded-xl border ${currentTheme.border} transition-all duration-200 hover:shadow-md ${currentTheme.shadow} flex items-start justify-between gap-2`} id={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-0.5 sm:mb-1 truncate">{title}</span>
        <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight leading-none mb-1 sm:mb-1.5">{value}</h3>
        <span className="text-[10px] sm:text-xs text-gray-500 block truncate">{subtitle}</span>
      </div>
      <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${currentTheme.bg} ${currentTheme.text}`}>
        {icon}
      </div>
    </div>
  );
};

// Toast Notification component
export interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, duration = 4000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  // Smooth entrance transition on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  // Dismiss with smooth exit animation
  const handleDismiss = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 280);
  }, [isExiting, onClose]);

  // Real-time progress bar and auto-close timer with pause-on-hover
  useEffect(() => {
    if (isExiting) return;

    const intervalMs = 25;
    const step = (intervalMs / duration) * 100;

    const interval = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            handleDismiss();
            return 0;
          }
          return Math.max(0, prev - step);
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPaused, isExiting, duration, handleDismiss]);

  const config = {
    success: {
      title: "Success",
      border: "border-emerald-200/90 shadow-emerald-950/5",
      bg: "bg-white/95",
      badgeBg: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20",
      titleColor: "text-emerald-700",
      barColor: "bg-emerald-500",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
    },
    error: {
      title: "Notice",
      border: "border-rose-200/90 shadow-rose-950/5",
      bg: "bg-white/95",
      badgeBg: "bg-rose-500/10 text-rose-600 border border-rose-500/20",
      titleColor: "text-rose-700",
      barColor: "bg-rose-500",
      icon: <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
    },
    info: {
      title: "Information",
      border: "border-blue-200/90 shadow-blue-950/5",
      bg: "bg-white/95",
      badgeBg: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
      titleColor: "text-blue-700",
      barColor: "bg-blue-500",
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />
    }
  }[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`
        relative overflow-hidden rounded-xl border shadow-xl backdrop-blur-md
        w-full max-w-sm sm:max-w-md pointer-events-auto
        transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isVisible && !isExiting ? "translate-x-0 opacity-100 scale-100" : "translate-x-10 opacity-0 scale-95"}
        ${config.bg} ${config.border}
      `}
      id="toast-notification"
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        <div className={`p-1.5 rounded-lg shrink-0 ${config.badgeBg} shadow-2xs mt-0.5`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black tracking-wider uppercase ${config.titleColor}`}>
              {config.title}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
            {message}
          </p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1 rounded-lg transition-colors shrink-0 -mr-1 -mt-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Real-time countdown progress bar */}
      <div className="w-full bg-slate-100/70 h-1 overflow-hidden">
        <div
          className={`h-full transition-[width] duration-75 ease-linear ${config.barColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

// Confirmation modal component
export const ConfirmationModal: React.FC<{
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "green" | "red" | "teal";
  onConfirm: () => void;
  onCancel: () => void;
}> = ({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "green",
  onConfirm,
  onCancel
}) => {
    if (!isOpen) return null;

    const buttonColors = {
      green: "bg-[#0A6B43] hover:bg-[#075332] text-white focus:ring-emerald-500",
      red: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      teal: "bg-[#0F6E56] hover:bg-[#0b513f] text-white focus:ring-teal-500"
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs" id="confirmation-modal">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150 border border-emerald-50">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">{description}</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-lg shadow-xs transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${buttonColors[confirmVariant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

// Empty State component
export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-gray-200 rounded-xl bg-white/50" id="empty-state">
      <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
        <Sparkles className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 bg-[#0A6B43] hover:bg-[#075332] text-white text-sm font-medium rounded-lg shadow-sm transition-all flex items-center gap-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Gemini Explanation Box component
export const GeminiExplanationBox: React.FC<{
  explanation: string;
  score: number;
  programTitle: string;
}> = ({ explanation, score, programTitle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-[#E8F5EF]/60 border border-[#9FE1CB]/70 rounded-lg p-3.5 mt-3 transition-all duration-200" id={`gemini-box-${programTitle.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-1.5 text-emerald-800">
          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold tracking-wide uppercase">Gemini AI Match Rationale</span>
        </div>
        <button className="text-emerald-700 hover:text-emerald-900 p-0.5">
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {!isCollapsed && (
        <div>
          <p className="text-xs italic text-[#1C2B20] leading-relaxed mb-2">
            "{explanation}"
          </p>
          <div className="text-[10px] text-emerald-600/80 font-medium flex items-center gap-1">
            <span>Powered by Google Gemini 3.5 Flash</span>
            <span>•</span>
            <span>Content-based Match Rank: {score}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Pathway Timeline component (Desktop Horizontal & Mobile Vertical)
export const PathwayTimeline: React.FC<{
  currentStep: number; // 1, 2, 3, 4, or 5 (5 = all steps completed including step 4 plan saved)
  onStepClick?: (step: number) => void;
  isMobile?: boolean;
}> = ({ currentStep, onStepClick, isMobile = false }) => {
  const steps = [
    {
      num: 1,
      title: "Register Profile",
      desc: "Katipunan ng Kabataan details encoded",
      sub: "Done ✓"
    },
    {
      num: 2,
      title: "Enroll in TESDA",
      desc: "Apply directly to matched program",
      sub: "Action needed"
    },
    {
      num: 3,
      title: "Complete Training",
      desc: "Complete 3-month course & pass NC II exam",
      sub: "Est. 3 months"
    },
    {
      num: 4,
      title: "Livelihood Placement",
      desc: "Apprenticeship or starting enterprise",
      sub: "Career Plan Strategy"
    }
  ];

  if (isMobile) {
    // Vertical timeline for mobile view
    return (
      <div className="space-y-6" id="pathway-timeline-mobile">
        {steps.map((step) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;

          return (
            <div
              key={step.num}
              onClick={() => onStepClick?.(step.num)}
              className={`flex gap-4 cursor-pointer group ${onStepClick ? "" : "pointer-events-none"}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all relative z-10 ${isCompleted
                    ? "bg-[#0A6B43] border-[#0A6B43] text-white"
                    : isActive
                      ? "bg-white border-[#0A6B43] text-[#0A6B43] shadow-md ring-4 ring-emerald-100 animate-pulse font-bold"
                      : "bg-white border-gray-300 text-gray-400"
                    }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{step.num}</span>}
                </div>
                {step.num < 4 && (
                  <div
                    className={`w-1 h-12 rounded-full transition-all ${isCompleted ? "bg-[#0A6B43]" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
              <div className="flex-1 pt-0.5 pb-4">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-bold ${isActive ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                    {step.title}
                  </h4>
                  {isActive && (
                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {step.sub}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-[#0A6B43] text-xs font-semibold">
                      {step.num === 4 ? "Plan Saved ✓" : "Done ✓"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const progressPercent = currentStep >= 5 ? 100 : Math.max(0, ((Math.min(currentStep, 4) - 1) / 3) * 100);

  // Horizontal timeline for desktop view
  return (
    <div className="w-full py-2" id="pathway-timeline-desktop">
      <div className="relative flex justify-between items-center w-full">
        {/* Connecting track & progress line */}
        <div className="absolute top-[18px] left-[12%] right-[12%] h-1 bg-gray-200 rounded-full z-0">
          <div
            className="h-full bg-[#0A6B43] rounded-full transition-all duration-500 shadow-xs"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;

          return (
            <div
              key={step.num}
              onClick={() => onStepClick?.(step.num)}
              className="flex flex-col items-center text-center flex-1 relative z-10 cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${isCompleted
                  ? "bg-[#0A6B43] border-[#0A6B43] text-white shadow-xs"
                  : isActive
                    ? "bg-white border-[#0A6B43] text-[#0A6B43] font-extrabold shadow-md ring-4 ring-emerald-100/80"
                    : "bg-white border-gray-300 text-gray-400"
                  }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{step.num}</span>}
              </div>
              <div className="mt-2.5 px-2">
                <span className={`text-xs font-bold block ${isActive ? "text-gray-900" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                  {step.title}
                </span>
                <span className={`text-[10px] mt-0.5 inline-block px-2 py-0.5 rounded-full ${isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 font-extrabold"
                  : isCompleted
                    ? "bg-emerald-50 text-[#0A6B43] font-bold border border-emerald-100"
                    : "text-gray-400 font-medium"
                  }`}>
                  {isActive ? step.sub : isCompleted ? (step.num === 4 ? "Plan Saved ✓" : "Done ✓") : step.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Opportunity Card component
export const OpportunityCard: React.FC<{
  program: TESDAProgram;
  matchScore: number;
  geminiExplanation: string;
  onAction?: (program: TESDAProgram) => void;
  actionLabel?: string;
  isMobile?: boolean;
}> = ({ program, matchScore, geminiExplanation, onAction, actionLabel = "Apply Now", isMobile = false }) => {
  const isFull = program.slotsRemaining === 0;

  return (
    <div className={`bg-white border ${isFull ? 'border-gray-200' : 'border-[#D1FAE5]'} p-4 rounded-xl shadow-xs transition-all hover:shadow-md hover:border-emerald-300 flex flex-col justify-between`} id={`opp-card-${program.id}`}>
      <div>
        <div className="flex justify-between items-start gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              TS
            </span>
            <span className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
              {program.provider}
            </span>
          </div>
          <FlameMatchScore score={matchScore} />
        </div>

        <h4 className="font-bold text-gray-800 text-sm leading-snug mb-1.5">{program.title}</h4>

        <div className="flex flex-wrap gap-2 mb-3.5">
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wider ${program.type === "Training"
            ? "bg-blue-50 text-blue-700 border border-blue-100"
            : program.type === "Employment"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}>
            {program.type}
          </span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            📍 {program.location?.includes("PTC") ? "TESDA GPSAT Campus" : (program.location || "San Luis Satellite")}
          </span>
          <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#0A6B43]" /> {getProgramFullSchedule(program)}
          </span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            ⏱ {program.trainingHours} hours {(program.startDate || program.endDate) ? `(${formatProgramDateRange(program.startDate, program.endDate)})` : ""}
          </span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            💰 {program.cost}
          </span>
        </div>

        {/* Slot tracker progress bar */}
        <div className="mb-3.5">
          <div className="flex justify-between text-[11px] text-gray-400 font-medium mb-1">
            <span>Slots remaining</span>
            <span className={isFull ? "text-red-500 font-bold" : "text-gray-600"}>
              {isFull ? "FULL" : `${program.slotsRemaining} of ${program.slotsTotal}`}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isFull ? "bg-red-400" : "bg-[#0A6B43]"}`}
              style={{ width: `${((program.slotsTotal - program.slotsRemaining) / program.slotsTotal) * 100}%` }}
            />
          </div>
        </div>

        {/* Gemini explanation box */}
        <GeminiExplanationBox
          explanation={geminiExplanation}
          score={matchScore}
          programTitle={program.title}
        />
      </div>

      <div className="mt-4 pt-3.5 border-t border-gray-50 flex items-center justify-between gap-3">
        <span className="text-xs text-gray-400 font-medium">
          👥 {program.youthMatched} matches identified
        </span>
        {onAction && (
          <button
            disabled={isFull}
            onClick={() => onAction(program)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${isFull
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
              : "bg-[#0A6B43] hover:bg-[#075332] text-white shadow-xs"
              }`}
          >
            {isFull ? "Slots Filled" : actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

// Reusable logo component representing the official uploaded SiKap logo
export const SikapLogo: React.FC<{
  size?: number;
  logoSize?: number;
  textSize?: number;
  showText?: boolean;
  showSubtext?: boolean;
  variant?: "light" | "dark" | "white";
  className?: string;
  textClassName?: string;
  gap?: string;
  textScale?: number;
  disableHover?: boolean;
  orientation?: "horizontal" | "vertical";
}> = ({
  size = 40,
  logoSize,
  textSize,
  showText = true,
  showSubtext = false,
  variant = "light",
  className = "",
  textClassName = "",
  gap = "gap-2",
  textScale = 0.85,
  disableHover = false,
  orientation = "horizontal"
}) => {
    const effectiveLogoSize = logoSize ?? size;
    const effectiveTextSize = textSize ?? (size * textScale);
    const siColorClass = variant === "white" || variant === "dark" ? "text-white" : "text-[#0D6C43]";
    const kapColorClass = variant === "white" ? "text-[#F5A623]" : "text-[#D99427]";
    const subtextColorClass = variant === "dark" ? "text-gray-300" : variant === "white" ? "text-white/80" : "text-gray-500";
    const isVertical = orientation === "vertical";

    return (
      <div className={`flex ${isVertical ? 'flex-col items-center text-center' : 'items-center'} ${gap} select-none ${disableHover ? '' : 'group cursor-pointer transition-transform duration-200 hover:scale-105'} ${className}`}>
        {/* Official SiKap Emblem Logo */}
        <img
          src="/sikap-logo.png"
          alt="SiKap System Logo"
          style={{ width: `${effectiveLogoSize}px`, height: `${effectiveLogoSize}px` }}
          className="shrink-0 object-contain filter drop-shadow-xs transition-transform duration-200"
        />

        {showText && (
          <div className={`flex flex-col ${isVertical ? 'items-center text-center' : 'justify-center'} leading-none transition-transform duration-200 ${textClassName}`}>
            <div className="flex items-center justify-center font-sans leading-none">
              <span className={`${siColorClass} font-extrabold tracking-tight leading-none`} style={{ fontSize: `${effectiveTextSize}px` }}>Si</span>
              <span className={`${kapColorClass} font-extrabold tracking-tight leading-none`} style={{ fontSize: `${effectiveTextSize}px` }}>Kap</span>
            </div>
            {showSubtext && (
              <span
                className={`font-bold tracking-[0.12em] uppercase ${isVertical ? 'mt-1.5' : 'mt-1'} ${subtextColorClass}`}
                style={{ fontSize: `${size * 0.22}px` }}
              >
                Youth Skills & Livelihood Matching
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

const DATE_PICKER_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DATE_PICKER_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface SiKapDatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  label?: string;
  badgeText?: string;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
  showAgeIndicator?: boolean;
  align?: "left" | "right";
}

export const SiKapDatePicker: React.FC<SiKapDatePickerProps> = ({
  value,
  onChange,
  min,
  max,
  placeholder = "Select Date",
  label = "Select Date",
  badgeText = "Calendar",
  hasError = false,
  className = "",
  disabled = false,
  showAgeIndicator = false,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const monthSelectRef = useRef<HTMLDivElement>(null);
  const yearSelectRef = useRef<HTMLDivElement>(null);
  const selectedYearButtonRef = useRef<HTMLButtonElement>(null);

  const initialDate = value ? new Date(value) : (max ? new Date(max) : new Date());
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsMonthOpen(false);
        setIsYearOpen(false);
      } else {
        if (monthSelectRef.current && !monthSelectRef.current.contains(e.target as Node)) {
          setIsMonthOpen(false);
        }
        if (yearSelectRef.current && !yearSelectRef.current.contains(e.target as Node)) {
          setIsYearOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentYear = new Date().getFullYear();
  const maxYear = max ? new Date(max).getFullYear() : currentYear + 15;
  const minYear = min ? Math.min(new Date(min).getFullYear(), currentYear - 50) : 1920;
  const years = Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) => maxYear - i);

  useEffect(() => {
    if (isYearOpen) {
      const timer = setTimeout(() => {
        selectedYearButtonRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isYearOpen]);

  const prevMonth = () => {
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    setIsMonthOpen(false);
    setIsYearOpen(false);
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const handleSelectDay = (day: number) => {
    const yStr = String(viewYear);
    const mStr = String(viewMonth + 1).padStart(2, "0");
    const dStr = String(day).padStart(2, "0");
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
    setIsMonthOpen(false);
    setIsYearOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const formatDisplay = (val: string) => {
    if (!val) return "";
    const parts = val.split("-");
    if (parts.length !== 3) return val;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${DATE_PICKER_MONTHS[m]} ${d}, ${y}`;
  };

  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
          setIsMonthOpen(false);
          setIsYearOpen(false);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left focus:outline-hidden shadow-2xs group ${
          disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            : isOpen
              ? "border-[#0A6B43] ring-2 ring-emerald-500/20 bg-white cursor-pointer"
              : hasError
                ? "border-rose-300 bg-rose-50/30 text-gray-900 cursor-pointer"
                : value
                  ? "border-gray-200 text-gray-900 bg-white hover:border-gray-300 cursor-pointer"
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-300 cursor-pointer"
        } border`}
      >
        <span className="truncate block pr-2">
          {value ? formatDisplay(value) : placeholder}
        </span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
          isOpen ? "bg-emerald-100 text-[#0A6B43]" : "text-gray-400 group-hover:text-[#0A6B43]"
        }`}>
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1.5 w-full sm:w-[320px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 sm:p-3.5 ring-1 ring-black/5`}
          >
            {/* Top Branding Bar */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#0A6B43]" />
                <span>{label}</span>
              </span>
              <span className="text-[9px] font-extrabold text-[#0A6B43] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                {badgeText}
              </span>
            </div>

            {/* Header: Month & Year Selector + Prev/Next buttons */}
            <div className="flex items-center justify-between gap-1 mb-2.5 relative">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer shrink-0"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                {/* Month Dropdown */}
                <div ref={monthSelectRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMonthOpen(!isMonthOpen);
                      setIsYearOpen(false);
                    }}
                    className={`flex items-center gap-1 bg-gray-50/90 hover:bg-emerald-50/40 border text-xs font-bold text-gray-800 rounded-lg pl-2.5 pr-2 py-1 transition-all cursor-pointer ${
                      isMonthOpen ? "border-[#0A6B43] ring-1 ring-emerald-500/20 bg-white" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{DATE_PICKER_MONTHS[viewMonth]}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isMonthOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isMonthOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute left-0 top-full mt-1.5 w-36 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1"
                      >
                        {DATE_PICKER_MONTHS.map((name, idx) => {
                          const isSelected = viewMonth === idx;
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => {
                                setViewMonth(idx);
                                setIsMonthOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 text-[#0A6B43] font-bold"
                                  : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                              }`}
                            >
                              <span>{name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Year Dropdown */}
                <div ref={yearSelectRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsYearOpen(!isYearOpen);
                      setIsMonthOpen(false);
                    }}
                    className={`flex items-center gap-1 bg-gray-50/90 hover:bg-emerald-50/40 border text-xs font-bold text-gray-800 rounded-lg pl-2.5 pr-2 py-1 transition-all cursor-pointer ${
                      isYearOpen ? "border-[#0A6B43] ring-1 ring-emerald-500/20 bg-white" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span>{viewYear}</span>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {isYearOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 sm:left-0 top-full mt-1.5 w-28 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1"
                      >
                        {years.map(y => {
                          const isSelected = viewYear === y;
                          return (
                            <button
                              key={y}
                              ref={isSelected ? selectedYearButtonRef : null}
                              type="button"
                              onClick={() => {
                                setViewYear(y);
                                setIsYearOpen(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-emerald-50 text-[#0A6B43] font-bold"
                                  : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                              }`}
                            >
                              <span>{y}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-[#0A6B43] hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer shrink-0"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DATE_PICKER_DAYS.map((d, idx) => (
                <span
                  key={d}
                  className={`text-[10px] font-extrabold py-1 ${
                    idx === 0 ? "text-rose-400" : "text-gray-400"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="w-7 h-7 sm:w-8 sm:h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(viewYear, viewMonth, day);
                const isPastMin = minDate && cellDate < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                const isFutureMax = maxDate && cellDate > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                const isDisabled = Boolean(isPastMin || isFutureMax);

                const formattedCell = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isSelected = value === formattedCell;

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectDay(day)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 text-xs font-semibold rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#0A6B43] text-white font-bold shadow-xs scale-105 cursor-pointer"
                        : isDisabled
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-700 hover:bg-emerald-50 hover:text-[#0A6B43] cursor-pointer"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions & Age Indicator */}
            <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              {showAgeIndicator && value && calculateAge(value) !== "" ? (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-500 font-medium">
                      Age: <strong className="text-gray-800">{calculateAge(value)} yrs</strong>
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      Number(calculateAge(value)) >= 18 && Number(calculateAge(value)) <= 30
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-rose-700 bg-rose-50 border-rose-200"
                    }`}>
                      {Number(calculateAge(value)) >= 18 && Number(calculateAge(value)) <= 30
                        ? "KK Eligible"
                        : "Ineligible (18-30)"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-[10px] text-gray-400 hover:text-rose-600 font-semibold transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <div className="w-full flex items-center justify-between text-[10px] text-gray-400">
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const yStr = String(today.getFullYear());
                      const mStr = String(today.getMonth() + 1).padStart(2, "0");
                      const dStr = String(today.getDate()).padStart(2, "0");
                      onChange(`${yStr}-${mStr}-${dStr}`);
                      setIsOpen(false);
                    }}
                    className="text-gray-500 hover:text-[#0A6B43] font-semibold cursor-pointer"
                  >
                    Today
                  </button>
                  <div className="flex items-center gap-2">
                    {value && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="text-[#0A6B43] font-bold hover:underline cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface SiKapTimePickerProps {
  value: string; // "HH:MM" 24-hour format
  onChange: (val: string) => void;
  placeholder?: string;
  label?: string;
  badgeText?: string;
  hasError?: boolean;
  className?: string;
  disabled?: boolean;
  align?: "left" | "right";
}

export const SiKapTimePicker: React.FC<SiKapTimePickerProps> = ({
  value,
  onChange,
  placeholder = "Select Time",
  label = "Schedule Time",
  badgeText,
  hasError = false,
  className = "",
  disabled = false,
  align = "left",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse 24-hour "HH:MM" into 12-hour components
  const parseTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(":")) {
      return { hour12: 8, minute: 0, period: "AM" as "AM" | "PM" };
    }
    const parts = timeStr.split(":");
    const h24 = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || "0", 10);
    const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const hour12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return { hour12, minute: m, period };
  };

  const [selectedHour, setSelectedHour] = useState<number>(() => parseTime(value).hour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(() => parseTime(value).minute);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">(() => parseTime(value).period);

  useEffect(() => {
    if (value) {
      const parsed = parseTime(value);
      setSelectedHour(parsed.hour12);
      setSelectedMinute(parsed.minute);
      setSelectedPeriod(parsed.period);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDisplayTime = (timeStr: string) => {
    if (!timeStr || !timeStr.includes(":")) return "";
    const { hour12, minute, period } = parseTime(timeStr);
    const mStr = minute < 10 ? `0${minute}` : `${minute}`;
    return `${hour12}:${mStr} ${period}`;
  };

  const getSessionType = (h24: number) => {
    if (h24 < 12) return "Morning";
    if (h24 < 17) return "Afternoon";
    return "Evening";
  };

  const commitTime = (h12: number, m: number, p: "AM" | "PM") => {
    let h24 = h12 % 12;
    if (p === "PM") h24 += 12;
    const time24 = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(time24);
  };

  const handleHourSelect = (h: number) => {
    setSelectedHour(h);
    commitTime(h, selectedMinute, selectedPeriod);
  };

  const handleMinuteSelect = (m: number) => {
    setSelectedMinute(m);
    commitTime(selectedHour, m, selectedPeriod);
  };

  const handlePeriodSelect = (p: "AM" | "PM") => {
    setSelectedPeriod(p);
    commitTime(selectedHour, selectedMinute, p);
  };

  const handlePresetSelect = (h24: number, m: number) => {
    const p: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    setSelectedHour(h12);
    setSelectedMinute(m);
    setSelectedPeriod(p);
    const time24 = `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    onChange(time24);
  };

  const handleNow = () => {
    const now = new Date();
    const h24 = now.getHours();
    // round minute to nearest 5
    const m = Math.round(now.getMinutes() / 5) * 5 % 60;
    handlePresetSelect(h24, m);
  };

  const currentH24 = (selectedHour % 12) + (selectedPeriod === "PM" ? 12 : 0);
  const activeSession = getSessionType(currentH24);

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left focus:outline-hidden shadow-2xs group ${
          disabled
            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
            : isOpen
              ? "border-[#0A6B43] ring-2 ring-emerald-500/20 bg-white cursor-pointer"
              : hasError
                ? "border-rose-300 bg-rose-50/30 text-gray-900 cursor-pointer"
                : value
                  ? "border-gray-200 text-gray-900 bg-white hover:border-gray-300 cursor-pointer"
                  : "border-gray-200 text-gray-400 bg-white hover:border-gray-300 cursor-pointer"
        } border`}
      >
        <span className="truncate block pr-2">
          {value ? formatDisplayTime(value) : placeholder}
        </span>
        <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors shrink-0 ${
          isOpen ? "bg-emerald-100 text-[#0A6B43]" : "text-gray-400 group-hover:text-[#0A6B43]"
        }`}>
          <Clock className="w-3.5 h-3.5" />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1.5 w-full sm:w-[320px] bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-3 sm:p-3.5 ring-1 ring-black/5`}
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-[#0A6B43]" />
                <span>{label}</span>
              </span>
              <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                activeSession === "Morning" ? "bg-amber-50 text-amber-800 border-amber-200" :
                activeSession === "Afternoon" ? "bg-blue-50 text-blue-800 border-blue-200" :
                "bg-purple-50 text-purple-800 border-purple-200"
              }`}>
                {badgeText || activeSession}
              </span>
            </div>

            {/* Time Selection Display & AM/PM Toggle */}
            <div className="flex items-center justify-between bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100/80 mb-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selected Time</p>
                <p className="text-base font-black text-[#0A6B43]">
                  {selectedHour}:{selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute} {selectedPeriod}
                </p>
              </div>

              {/* AM / PM Pill Selector */}
              <div className="flex items-center p-0.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handlePeriodSelect("AM")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === "AM"
                      ? "bg-[#0A6B43] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePeriodSelect("PM")}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    selectedPeriod === "PM"
                      ? "bg-[#0A6B43] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Hour Selector Grid */}
            <div className="mb-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                <span>Hour</span>
                <span className="text-[9px] text-[#0A6B43] font-semibold">{selectedHour} {selectedPeriod}</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-center">
                {hoursList.map(h => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourSelect(h)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedHour === h
                        ? "bg-[#0A6B43] text-white shadow-xs scale-105"
                        : "text-gray-700 bg-gray-50/70 hover:bg-emerald-50 hover:text-[#0A6B43]"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute Selector Grid */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                <span>Minute</span>
                <span className="text-[9px] text-[#0A6B43] font-semibold">:{selectedMinute < 10 ? `0${selectedMinute}` : selectedMinute}</span>
              </div>
              <div className="grid grid-cols-6 gap-1 text-center">
                {minutesList.map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteSelect(m)}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedMinute === m
                        ? "bg-[#0A6B43] text-white shadow-xs scale-105"
                        : "text-gray-700 bg-gray-50/70 hover:bg-emerald-50 hover:text-[#0A6B43]"
                    }`}
                  >
                    {m < 10 ? `0${m}` : m}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Session Presets */}
            <div className="pt-2 border-t border-gray-100 mb-2.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Session Presets</p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handlePresetSelect(8, 0)}
                  className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate"
                  title="8:00 AM (Morning)"
                >
                  🌅 8:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(13, 0)}
                  className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/80 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate"
                  title="1:00 PM (Afternoon)"
                >
                  ☀️ 1:00 PM
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect(17, 30)}
                  className="px-1.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 rounded-md text-[10px] font-bold transition-all cursor-pointer truncate"
                  title="5:30 PM (Evening)"
                >
                  🌙 5:30 PM
                </button>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleNow}
                className="text-[10px] text-gray-500 hover:text-[#0A6B43] font-semibold cursor-pointer"
              >
                Current Time
              </button>
              <div className="flex items-center gap-2">
                {value && (
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-[#0A6B43] hover:bg-[#075332] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export interface NotificationBellButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
  className?: string;
  title?: string;
  size?: "sm" | "md" | "lg";
}

export const NotificationBellButton: React.FC<NotificationBellButtonProps> = ({
  isOpen,
  onClick,
  unreadCount = 0,
  className = "",
  title = "Notifications",
  size = "md"
}) => {
  const [isRinging, setIsRinging] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsRinging(true);
    setRippleKey((prev) => prev + 1);
    onClick();
    setTimeout(() => setIsRinging(false), 700);
  };

  const sizeClasses = {
    sm: "p-2 rounded-lg",
    md: "p-2.5 rounded-xl",
    lg: "p-3 rounded-2xl"
  }[size];

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-4.5 h-4.5",
    lg: "w-5 h-5"
  }[size];

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center transition-all cursor-pointer group active:scale-90 select-none overflow-visible ${sizeClasses} ${
        isOpen
          ? "bg-emerald-50 text-[#0A6B43] ring-2 ring-emerald-400 shadow-sm"
          : "text-slate-600 hover:text-[#0A6B43] bg-slate-100/80 hover:bg-emerald-50/80"
      } ${className}`}
      title={title}
      aria-label={title}
    >
      {/* Ripple pulse wave expanding on click */}
      {isRinging && (
        <span
          key={rippleKey}
          className="absolute inset-0 rounded-xl bg-emerald-500/25 animate-pulse-wave pointer-events-none"
        />
      )}

      {/* Bell icon with dynamic ringing rotation animation */}
      <span
        className={`inline-flex items-center justify-center origin-top ${
          isRinging ? "animate-bell-ring" : "group-hover:rotate-12 group-hover:scale-105 transition-transform duration-200"
        }`}
      >
        <Bell
          className={`${iconSizes} transition-colors ${
            isOpen ? "fill-emerald-600/20 text-[#0A6B43]" : "text-current"
          }`}
        />
      </span>

      {/* Unread Counter Badge with bounce animation */}
      {unreadCount > 0 && (
        <span
          className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-white shadow-xs ${
            isRinging ? "animate-badge-bounce" : ""
          }`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};

export { CustomSelect } from "./CustomSelect";
export type { CustomSelectOption, CustomSelectProps } from "./CustomSelect";


