"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: (string | CustomSelectOption)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  direction?: "down" | "up" | "auto";
  size?: "sm" | "md" | "lg";
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  id,
  ariaLabel,
  direction = "auto",
  size = "md"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle auto direction flip based on screen position
  useEffect(() => {
    if (isOpen && direction === "auto" && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      // If less than 220px below and more space above, open upward
      if (spaceBelow < 220 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    } else if (direction === "up") {
      setOpenUpward(true);
    } else {
      setOpenUpward(false);
    }
  }, [isOpen, direction]);

  // Normalize options to { value, label }
  const normalizedOptions: CustomSelectOption[] = options.map(opt =>
    typeof opt === "string" ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "Enter" || e.key === " ") {
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        const currentIndex = normalizedOptions.findIndex(opt => opt.value === value);
        let nextIndex = currentIndex;

        if (e.key === "ArrowDown") {
          nextIndex = currentIndex < normalizedOptions.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : normalizedOptions.length - 1;
        }

        const nextOption = normalizedOptions[nextIndex];
        if (nextOption && !nextOption.disabled) {
          onChange(nextOption.value);
        }
      }
    },
    [disabled, isOpen, normalizedOptions, onChange, value]
  );

  // Size specific styling
  const sizeStyles = {
    sm: "pl-2.5 pr-8 py-1.5 text-xs rounded-lg",
    md: "pl-3 sm:pl-4 pr-9 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg sm:rounded-xl",
    lg: "pl-4 pr-10 py-3 text-sm sm:text-base rounded-xl"
  };

  const chevronSizeStyles = {
    sm: "w-3.5 h-3.5 right-2",
    md: "w-4 h-4 right-3",
    lg: "w-4.5 h-4.5 right-3.5"
  };

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`} onKeyDown={handleKeyDown}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-gray-50/80 border text-left font-medium transition-all focus:ring-2 focus:ring-emerald-500 focus:border-[#0A6B43] focus:outline-hidden shadow-2xs ${
          disabled ? "opacity-50 cursor-not-allowed bg-gray-100" : "cursor-pointer hover:bg-gray-100/70"
        } ${sizeStyles[size]} ${
          value ? "text-gray-900 border-gray-200" : "text-gray-400 border-gray-200"
        } ${isOpen ? "ring-2 ring-emerald-500/20 border-[#0A6B43] bg-white" : ""} ${buttonClassName}`}
      >
        <span className="truncate block pr-1">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`${chevronSizeStyles[size]} text-gray-400 shrink-0 absolute top-1/2 -translate-y-1/2 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#0A6B43]" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            role="listbox"
            className={`absolute left-0 right-0 w-full max-h-52 sm:max-h-60 overflow-y-auto custom-scrollbar bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-xl z-50 py-1 ${
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
            } ${menuClassName}`}
          >
            {normalizedOptions.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm font-medium transition-colors flex items-center justify-between gap-2 ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed text-gray-400"
                      : "cursor-pointer"
                  } ${
                    isSelected
                      ? "bg-emerald-50 text-[#0A6B43] font-bold"
                      : "text-gray-700 hover:bg-gray-50 active:bg-emerald-50/40"
                  }`}
                >
                  <span className="break-words line-clamp-2 leading-snug">{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#0A6B43] shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
