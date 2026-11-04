export interface PasswordValidationResult {
  isValid: boolean;
  isLengthValid: boolean;
  isCaseValid: boolean;
  isCharTypeValid: boolean;
  score: number;
  strength: "Too Weak" | "Fair" | "Good" | "Strong";
  errors: string[];
}

/**
 * Validates a password against standard enterprise security criteria:
 * 1. Minimum 8 characters.
 * 2. Combines both uppercase (A-Z) and lowercase (a-z) letters.
 * 3. Includes at least one number (0-9) or special symbol (!@#$%^&*...).
 */
export function validatePassword(password: string = ""): PasswordValidationResult {
  const pwd = typeof password === "string" ? password : "";
  const isLengthValid = pwd.length >= 8;
  const isLower = /[a-z]/.test(pwd);
  const isUpper = /[A-Z]/.test(pwd);
  const isCaseValid = isLower && isUpper;
  const isCharTypeValid = /[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd);

  const checks = [isLengthValid, isCaseValid, isCharTypeValid];
  const passedCount = checks.filter(Boolean).length;

  let strength: "Too Weak" | "Fair" | "Good" | "Strong" = "Too Weak";
  if (pwd.length === 0) {
    strength = "Too Weak";
  } else if (passedCount === 3) {
    strength = pwd.length >= 12 && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd) ? "Strong" : "Good";
  } else if (passedCount === 2) {
    strength = "Fair";
  } else {
    strength = "Too Weak";
  }

  const errors: string[] = [];
  if (!isLengthValid) errors.push("Password must be at least 8 characters long.");
  if (!isCaseValid) errors.push("Password must combine both uppercase and lowercase letters.");
  if (!isCharTypeValid) errors.push("Password must include at least one number or special character (0-9, @, #, etc.).");

  return {
    isValid: passedCount === 3,
    isLengthValid,
    isCaseValid,
    isCharTypeValid,
    score: passedCount,
    strength,
    errors
  };
}

