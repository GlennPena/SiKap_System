// In-memory token store for Password Reset OTPs
// In Next.js dev server, store on globalThis to prevent eviction across hot-reloads

interface ResetTokenData {
  userId: string;
  name: string;
  email: string;
  code: string;
  expiresAt: number; // Unix timestamp in ms
  attempts: number;
  lastRequestedAt: number;
}

const globalForReset = globalThis as unknown as {
  passwordResetStore?: Map<string, ResetTokenData>;
};

export const resetStore = globalForReset.passwordResetStore || new Map<string, ResetTokenData>();

if (process.env.NODE_ENV !== "production") {
  globalForReset.passwordResetStore = resetStore;
}

const MAX_ATTEMPTS = 5;
const EXPIRATION_MINUTES = 15;
const RATE_LIMIT_SECONDS = 30; // Min time between resend requests

export function savePasswordResetCode(
  email: string,
  userId: string,
  name: string,
  code: string
): { success: boolean; error?: string; expiresInMinutes: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const now = Date.now();

  const existing = resetStore.get(normalizedEmail);
  if (existing && now - existing.lastRequestedAt < RATE_LIMIT_SECONDS * 1000) {
    const waitSeconds = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - existing.lastRequestedAt)) / 1000);
    return {
      success: false,
      error: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
      expiresInMinutes: EXPIRATION_MINUTES
    };
  }

  const expiresAt = now + EXPIRATION_MINUTES * 60 * 1000;

  resetStore.set(normalizedEmail, {
    userId,
    name,
    email: normalizedEmail,
    code: code.trim(),
    expiresAt,
    attempts: 0,
    lastRequestedAt: now
  });

  return {
    success: true,
    expiresInMinutes: EXPIRATION_MINUTES
  };
}

export function verifyPasswordResetCode(
  email: string,
  code: string
): { valid: boolean; message?: string; userId?: string; name?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const entry = resetStore.get(normalizedEmail);

  if (!entry) {
    return {
      valid: false,
      message: "No active password recovery request found. Please request a new code."
    };
  }

  if (Date.now() > entry.expiresAt) {
    resetStore.delete(normalizedEmail);
    return {
      valid: false,
      message: "The verification code has expired. Please request a new one."
    };
  }

  if (entry.attempts >= MAX_ATTEMPTS) {
    resetStore.delete(normalizedEmail);
    return {
      valid: false,
      message: "Maximum invalid attempts exceeded. Please request a new verification code."
    };
  }

  if (entry.code !== code.trim()) {
    entry.attempts += 1;
    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      valid: false,
      message: remaining > 0 
        ? `Invalid verification code. ${remaining} attempt(s) remaining.` 
        : "Invalid verification code. Maximum attempts reached."
    };
  }

  return {
    valid: true,
    userId: entry.userId,
    name: entry.name
  };
}

export function consumePasswordResetCode(email: string): void {
  resetStore.delete(email.trim().toLowerCase());
}

export function getActiveResetEntry(email: string): ResetTokenData | undefined {
  const entry = resetStore.get(email.trim().toLowerCase());
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    resetStore.delete(email.trim().toLowerCase());
    return undefined;
  }
  return entry;
}
