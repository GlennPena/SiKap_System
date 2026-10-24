// In-memory token store for Registration Email Verification OTPs
// Pinned to globalThis in Next.js development to persist across hot-reloads

interface RegisterOtpData {
  email: string;
  code: string;
  expiresAt: number; // Unix timestamp in ms
  attempts: number;
  lastRequestedAt: number;
  isVerified: boolean;
  verifiedAt?: number;
}

const globalForOtp = globalThis as unknown as {
  registerOtpStore?: Map<string, RegisterOtpData>;
};

export const registerOtpStore = globalForOtp.registerOtpStore || new Map<string, RegisterOtpData>();

if (process.env.NODE_ENV !== "production") {
  globalForOtp.registerOtpStore = registerOtpStore;
}

const MAX_ATTEMPTS = 5;
const EXPIRATION_MINUTES = 15;
const RATE_LIMIT_SECONDS = 60; // 60 seconds between resend requests
const VERIFICATION_VALIDITY_MINUTES = 60; // Verified status valid for 60 minutes to complete registration

export function saveRegisterOtpCode(
  email: string,
  code: string
): { success: boolean; error?: string; expiresInMinutes: number; waitSeconds?: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();

  const existing = registerOtpStore.get(normalizedEmail);
  if (existing && now - existing.lastRequestedAt < RATE_LIMIT_SECONDS * 1000) {
    const waitSeconds = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - existing.lastRequestedAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
      expiresInMinutes: EXPIRATION_MINUTES,
      waitSeconds
    };
  }

  const expiresAt = now + EXPIRATION_MINUTES * 60 * 1000;

  registerOtpStore.set(normalizedEmail, {
    email: normalizedEmail,
    code: code.trim(),
    expiresAt,
    attempts: 0,
    lastRequestedAt: now,
    isVerified: false
  });

  return {
    success: true,
    expiresInMinutes: EXPIRATION_MINUTES
  };
}

export function verifyRegisterOtpCode(
  email: string,
  code: string
): { valid: boolean; message?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = registerOtpStore.get(normalizedEmail);

  if (!entry) {
    return {
      valid: false,
      message: "No verification code requested for this email. Please request a new code."
    };
  }

  if (Date.now() > entry.expiresAt) {
    registerOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      message: "The verification code has expired. Please request a new code."
    };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    registerOtpStore.delete(normalizedEmail);
    return {
      valid: false,
      message: "Too many failed attempts. For security, please request a new verification code."
    };
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      valid: false,
      message: remaining > 0 
        ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
        : "Incorrect code. Maximum attempts reached. Please request a new code."
    };
  }

  // Code is valid! Mark email as verified
  entry.isVerified = true;
  entry.verifiedAt = Date.now();
  entry.attempts = 0;

  return {
    valid: true,
    message: "Email verified successfully."
  };
}

export function isEmailVerifiedForRegistration(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = registerOtpStore.get(normalizedEmail);

  if (!entry || !entry.isVerified || !entry.verifiedAt) {
    return false;
  }

  // Check if verification has timed out
  const now = Date.now();
  if (now - entry.verifiedAt > VERIFICATION_VALIDITY_MINUTES * 60 * 1000) {
    registerOtpStore.delete(normalizedEmail);
    return false;
  }

  return true;
}

export function clearRegisterOtp(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  registerOtpStore.delete(normalizedEmail);
}
