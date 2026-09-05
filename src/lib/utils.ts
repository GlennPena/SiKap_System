import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats Philippine contact numbers so they always start with "+63 9" and cannot be cleared below "+63 9".
 * Allows typing up to 9 additional digits after "+63 9" (total 11 digits: +63 9XX XXX XXXX).
 */
export function formatContactNumber(val: string): string {
  if (!val) return "+63 9";
  
  // Extract all digits
  const rawDigits = val.replace(/\D/g, "");
  
  let userDigits = "";
  if (rawDigits.startsWith("639")) {
    userDigits = rawDigits.slice(3);
  } else if (rawDigits.startsWith("09")) {
    userDigits = rawDigits.slice(2);
  } else if (rawDigits.startsWith("9")) {
    userDigits = rawDigits.slice(1);
  } else if (rawDigits.startsWith("63")) {
    userDigits = rawDigits.slice(2);
  } else if (rawDigits.startsWith("0")) {
    userDigits = rawDigits.slice(1);
  } else {
    userDigits = rawDigits;
  }
  
  // Limit to maximum 9 digits after +63 9
  const truncated = userDigits.slice(0, 9);
  
  // Format cleanly: +63 9XX XXX XXXX
  if (truncated.length === 0) {
    return "+63 9";
  } else if (truncated.length <= 2) {
    return `+63 9${truncated}`;
  } else if (truncated.length <= 5) {
    return `+63 9${truncated.slice(0, 2)} ${truncated.slice(2)}`;
  } else {
    return `+63 9${truncated.slice(0, 2)} ${truncated.slice(2, 5)} ${truncated.slice(5)}`;
  }
}

/**
 * Validates if the contact number is a complete 11-digit Philippine mobile number starting with +63 9.
 */
export function isValidContactNumber(val: string): boolean {
  const digits = val.replace(/\D/g, "");
  // Must have 11 digits total (639 + 8 digits = wait, 63 + 9 + 8 = 11 digits, e.g. 639171234567 is 12 digits: 63 (2) + 9 (1) + 9 (8) = 12 digits)
  // Let's count digits:
  // 63 917 123 4567 => 63 (2) + 10 digits = 12 digits total
  // 0917 123 4567 => 11 digits total
  // 917 123 4567 => 10 digits total
  // After +63 9, there should be 8 more digits (917 123 4567 = 9 digits after 9).
  // Total digits when starting with 639: 12 digits (639171234567).
  return digits.length === 12 && digits.startsWith("639");
}

export function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

/**
 * Calculates age based on a birth date string (YYYY-MM-DD).
 * Returns the integer age, or "" if invalid, empty, or a future date.
 */
export function calculateAge(dobString: string): number | "" {
  if (!dobString) return "";
  const parts = dobString.split("-");
  if (parts.length !== 3) return "";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "";

  const birthDate = new Date(year, month, day);
  if (
    birthDate.getFullYear() !== year ||
    birthDate.getMonth() !== month ||
    birthDate.getDate() !== day
  ) {
    return "";
  }

  const today = new Date();
  if (birthDate.getTime() > today.getTime()) return "";

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : "";
}

