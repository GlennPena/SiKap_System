"use client";

import React from "react";
import { Check, X } from "lucide-react";
import { validatePassword } from "@/lib/password-policy";

interface PasswordChecklistProps {
  password: string;
  confirmPassword?: string;
  showMatchCheck?: boolean;
  className?: string;
}

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password = "",
  confirmPassword = "",
  showMatchCheck = true,
  className = ""
}) => {
  const result = validatePassword(password);
  const doMatch = Boolean(confirmPassword && password === confirmPassword);

  // Strength bar calculations
  let strengthColor = "bg-gray-200";
  let strengthWidth = "w-0";
  let strengthLabelColor = "text-gray-400";

  if (password.length > 0) {
    if (result.score === 1) {
      strengthColor = "bg-rose-500";
      strengthWidth = "w-1/3";
      strengthLabelColor = "text-rose-500";
    } else if (result.score === 2) {
      strengthColor = "bg-amber-500";
      strengthWidth = "w-2/3";
      strengthLabelColor = "text-amber-600";
    } else if (result.score === 3) {
      strengthColor = result.strength === "Strong" ? "bg-emerald-600" : "bg-emerald-500";
      strengthWidth = "w-full";
      strengthLabelColor = "text-[#0A6B43]";
    }
  }

  const items = [
    {
      id: "length",
      label: "At least 8 characters",
      valid: result.isLengthValid
    },
    {
      id: "case",
      label: "Uppercase & lowercase letters",
      valid: result.isCaseValid
    },
    {
      id: "chartype",
      label: "Number or symbol (0-9, @, #...)",
      valid: result.isCharTypeValid
    }
  ];

  if (showMatchCheck) {
    items.push({
      id: "match",
      label: "Passwords match",
      valid: doMatch
    });
  }

  return (
    <div className={`space-y-2 p-3 sm:p-3.5 bg-gray-50/90 border border-gray-200/80 rounded-xl ${className}`}>
      {/* Strength Bar */}
      {password.length > 0 && (
        <div className="space-y-1 pb-1 border-b border-gray-200/60">
          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-gray-500 uppercase tracking-wide">Security Strength:</span>
            <span className={`${strengthLabelColor} uppercase tracking-wider`}>
              {result.strength}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200/80 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 rounded-full ${strengthColor} ${strengthWidth}`} />
          </div>
        </div>
      )}

      {/* Checklist items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5 text-[11px]">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-1.5 transition-colors ${
              item.valid
                ? "text-emerald-700 font-bold"
                : "text-gray-500 font-medium"
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] transition-all ${
                item.valid
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-gray-200 text-gray-400"
              }`}
            >
              {item.valid ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : <div className="w-1 h-1 rounded-full bg-gray-400" />}
            </span>
            <span className="truncate leading-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

