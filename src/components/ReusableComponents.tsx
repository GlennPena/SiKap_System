"use client";

import React, { useState } from "react";
import { Flame, Check, ArrowRight, X, AlertTriangle, Lightbulb, Info, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { TESDAProgram } from "../types";

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
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: "bg-emerald-50 border-emerald-300 text-emerald-800",
      icon: <Check className="w-5 h-5 text-emerald-600" />
    },
    error: {
      bg: "bg-red-50 border-red-300 text-red-800",
      icon: <X className="w-5 h-5 text-red-600" />
    },
    info: {
      bg: "bg-blue-50 border-blue-300 text-blue-800",
      icon: <Info className="w-5 h-5 text-blue-600" />
    }
  };

  const currentStyle = styles[type];

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-bounce ${currentStyle.bg}`} id="toast-notification">
      {currentStyle.icon}
      <span className="text-sm font-medium flex-1">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5">
        <X className="w-4 h-4" />
      </button>
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
  currentStep: number; // 1, 2, 3, or 4
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
      sub: "Long-term goal"
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : isActive
                      ? "bg-white border-[#0A6B43] text-[#0A6B43] shadow-md shadow-emerald-100 ring-4 ring-emerald-50 animate-pulse"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{step.num}</span>}
                </div>
                {step.num < 4 && (
                  <div
                    className={`w-0.5 h-12 transition-all ${
                      isCompleted ? "bg-emerald-600" : "bg-gray-100"
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
                    <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      {step.sub}
                    </span>
                  )}
                  {isCompleted && (
                    <span className="text-emerald-600 text-xs font-semibold">
                      {step.sub}
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

  // Horizontal timeline for desktop view
  return (
    <div className="w-full" id="pathway-timeline-desktop">
      <div className="relative flex justify-between items-center w-full">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-100 -z-10 rounded-full">
          <div
            className="h-full bg-emerald-600 rounded-full transition-all duration-500"
            style={{ width: `${((Math.min(currentStep, 4) - 1) / 3) * 100}%` }}
          />
        </div>

        {steps.map((step) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;

          return (
            <div
              key={step.num}
              onClick={() => onStepClick?.(step.num)}
              className="flex flex-col items-center text-center flex-1 relative cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-[#0A6B43] border-[#0A6B43] text-white"
                    : isActive
                    ? "bg-white border-[#0A6B43] text-[#0A6B43] font-bold shadow-md ring-4 ring-emerald-50"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <span className="text-xs font-bold">{step.num}</span>}
              </div>
              <div className="mt-2.5 px-2">
                <span className={`text-xs font-bold block ${isActive ? "text-gray-800" : isCompleted ? "text-gray-600" : "text-gray-400"}`}>
                  {step.title}
                </span>
                <span className={`text-[10px] mt-0.5 inline-block px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-100 font-bold"
                    : isCompleted
                    ? "text-emerald-600 font-medium"
                    : "text-gray-400 font-normal"
                }`}>
                  {isActive ? step.sub : isCompleted ? "Done" : step.sub}
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
          <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wider ${
            program.type === "Training"
              ? "bg-blue-50 text-blue-700 border border-blue-100"
              : program.type === "Employment"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-amber-50 text-amber-700 border border-amber-100"
          }`}>
            {program.type}
          </span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            📍 {program.location.includes("PTC") ? "TESDA GPSAT Campus" : "San Luis Satellite"}
          </span>
          <span className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
            ⏱ {program.duration} {program.startDate && program.endDate ? `(${program.startDate} – ${program.endDate})` : ""}
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
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              isFull
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

// Reusable logo component representing the uploaded SiKap logo
export const SikapLogo: React.FC<{
  size?: number;
  showText?: boolean;
  showSubtext?: boolean;
  variant?: "light" | "dark" | "white";
  className?: string;
}> = ({
  size = 40,
  showText = true,
  showSubtext = false,
  variant = "light",
  className = ""
}) => {
  const subtextColorClass = variant === "dark" ? "text-gray-300" : variant === "white" ? "text-white/80" : "text-gray-500";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Dynamic Emblem SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-xs"
      >
        {/* Leaf/Shield Outer Green Background */}
        <path
          d="M50 8C59 21 72 38 72 50C72 61 65 67 60 74C55 81 56 90 50 94C44 90 45 81 40 74C35 67 28 61 28 50C28 38 41 21 50 8Z"
          fill="#0D6C43"
        />
        {/* Center Upward Gold Arrow */}
        <path
          d="M50 22 L36 46 L44 46 L44 80 L56 80 L56 46 L64 46 Z"
          fill="#D99427"
        />
        {/* White Network Connections Triangle */}
        {/* Lines */}
        <line x1="50" y1="61" x2="44.5" y2="71" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="50" y1="61" x2="55.5" y2="71" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="44.5" y1="71" x2="55.5" y2="71" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        {/* Node Circles */}
        <circle cx="50" cy="61" r="2.5" fill="white" />
        <circle cx="44.5" cy="71" r="2.5" fill="white" />
        <circle cx="55.5" cy="71" r="2.5" fill="white" />
      </svg>

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className="flex items-baseline font-sans">
            <span className="text-[#0D6C43] font-extrabold tracking-tight" style={{ fontSize: `${size * 0.7}px` }}>Si</span>
            <span className="text-[#D99427] font-extrabold tracking-tight" style={{ fontSize: `${size * 0.7}px` }}>Kap</span>
          </div>
          {showSubtext && (
            <span
              className={`font-bold tracking-[0.12em] uppercase mt-1 ${subtextColorClass}`}
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

