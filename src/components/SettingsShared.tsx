"use client";

import React from "react";
import { GrowthPlantAnimation } from "./GrowthPlantAnimation";
import { motion } from "motion/react";
import { ShieldCheck, Check, Shield, Bell } from "lucide-react";

// ============================================================================
// 1. Settings Header Banner
// ============================================================================
export interface SettingsHeaderBannerProps {
  title?: string;
  subtitle: string;
  badge?: React.ReactNode;
}

export const SettingsHeaderBanner: React.FC<SettingsHeaderBannerProps> = ({
  title = "Settings",
  subtitle,
  badge,
}) => {
  return (
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
        {badge && <div className="mb-2">{badge}</div>}
        <h2 className="font-black text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight leading-tight drop-shadow-sm">
          {title}
        </h2>
        <p className="text-xs sm:text-sm lg:text-base text-emerald-100/90 mt-2 font-normal sm:font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// 2. Settings Vertical Sidebar Navigation
// ============================================================================
export interface SettingsTabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; fill?: string }>;
}

export interface SettingsSidebarNavProps {
  tabs: SettingsTabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  ariaLabel?: string;
}

export const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = "Settings navigation",
}) => {
  return (
    <aside className="w-full lg:w-fit shrink-0 lg:sticky lg:top-4">
      {/* Vertical Navigation Items List - Rectangular cards with rounded circular corners, separated */}
      <nav
        className="flex flex-row overflow-x-auto no-scrollbar gap-[5.6px] lg:flex-col lg:space-y-[5.6px] w-full lg:w-fit"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`group/pill w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap select-none shrink-0 border ${
                isActive
                  ? "bg-[#0A6B43] text-white shadow-xs border-transparent"
                  : "bg-white text-gray-700 border-transparent hover:border-gray-300 hover:text-[#0A6B43] hover:bg-emerald-50/70 shadow-2xs hover:shadow-xs hover:translate-x-0.5"
              }`}
            >
              <IconComponent
                fill={isActive ? "currentColor" : "none"}
                className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 ${
                  isActive
                    ? "text-white"
                    : "text-gray-400 group-hover/pill:text-[#0A6B43] group-hover/pill:scale-110"
                }`}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// ============================================================================
// 3. Security Guide Companion Card
// ============================================================================
export interface SettingsSecurityGuideCardProps {
  newPassword?: string;
  accountTypeLabel?: string;
  accountNotice?: string;
}

export const SettingsSecurityGuideCard: React.FC<SettingsSecurityGuideCardProps> = ({
  newPassword = "",
  accountTypeLabel = "Official LGU Account",
  accountNotice = "Your SiKap account is tied to official administrative records. Keep your credentials private and never share your password.",
}) => {
  const isPassLengthValid = newPassword.length >= 6;
  const isPassCaseValid = /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const isPassCharTypeValid = /[0-9]/.test(newPassword) || /[^A-Za-z0-9]/.test(newPassword);

  return (
    <div className="bg-[#0A6B43] rounded-2xl p-5 sm:p-6 shadow-md space-y-4 text-xs text-white">
      {/* Guide Card Header: Simple icon without container, no subheader, white divider */}
      <div className="flex items-center gap-2.5 border-b border-white/20 pb-3">
        <ShieldCheck className="w-5 h-5 text-white shrink-0" />
        <h4 className="font-bold text-white text-base leading-tight">Security Guide</h4>
      </div>

      {/* Guide Checklist with dynamic visual appearance and check animation */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
          Password Checklist
        </span>
        <div className="space-y-2.5">
          {/* Item 1: Length */}
          <div
            className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all duration-300 ${
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
                  className="w-5 h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                </div>
              )}
              <span className="text-xs">
                At least <strong>6 characters long</strong>
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
            className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all duration-300 ${
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
                  className="w-5 h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                </div>
              )}
              <span className="text-xs">
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
            className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border transition-all duration-300 ${
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
                  className="w-5 h-5 rounded-full bg-[#0A6B43] text-white flex items-center justify-center shrink-0 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </motion.div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white/30 bg-white/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                </div>
              )}
              <span className="text-xs">
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
            <span>{accountTypeLabel}</span>
          </div>
          <p className="text-[11px] text-white/90 leading-relaxed font-medium">
            {accountNotice}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. Official Notification Channels Companion Card
// ============================================================================
export interface SettingsNotificationChannelsCardProps {
  pushDescription?: string;
  emailDescription?: string;
}

export const SettingsNotificationChannelsCard: React.FC<SettingsNotificationChannelsCardProps> = ({
  pushDescription = "Real-time browser notifications for municipal announcements, program updates, and priority actions.",
  emailDescription = "Important administrative documents, official dispatches, and verification notices sent directly to your registered inbox.",
}) => {
  return (
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
            {pushDescription}
          </p>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="font-bold text-slate-800 text-[14px] block">Official Email Dispatch</span>
          <p className="text-[12px] text-slate-500 leading-relaxed font-medium">
            {emailDescription}
          </p>
        </div>
      </div>
    </div>
  );
};
