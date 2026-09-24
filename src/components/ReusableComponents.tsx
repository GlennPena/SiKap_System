"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Flame, Check, CheckCircle2, AlertCircle, ArrowRight, X, AlertTriangle, Lightbulb, Info, Sparkles, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { TESDAProgram } from "../types";
import { getProgramFullSchedule, formatProgramDateRange } from "../lib/cbf-matcher";

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
    <div className={`bg-white p-5 rounded-xl border ${currentTheme.border} transition-all duration-200 hover:shadow-md ${currentTheme.shadow} flex items-start justify-between`} id={`metric-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">{title}</span>
        <h3 className="text-3xl font-bold text-gray-800 tracking-tight leading-none mb-1.5">{value}</h3>
        <span className="text-xs text-gray-500 block">{subtitle}</span>
      </div>
      <div className={`p-2.5 rounded-lg ${currentTheme.bg} ${currentTheme.text}`}>
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

