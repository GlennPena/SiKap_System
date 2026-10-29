/**
 * In-Memory Rate Limiter for Login Password Attempts
 * 
 * Enforces security policy:
 * - 5 wrong password attempts -> 5-minute lockout cooldown
 * - Successful login immediately resets the attempt counter
 * - Persisted on globalThis to prevent eviction during Next.js hot-reloads
 */

interface LoginAttemptData {
  email: string;
  failedAttempts: number;
  lastFailedAt: number;
  lockedUntil: number | null;
}

const globalForLoginLimiter = globalThis as unknown as {
  loginAttemptStore?: Map<string, LoginAttemptData>;
};

export const loginAttemptStore = globalForLoginLimiter.loginAttemptStore || new Map<string, LoginAttemptData>();

if (process.env.NODE_ENV !== "production") {
  globalForLoginLimiter.loginAttemptStore = loginAttemptStore;
}

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
export const ATTEMPT_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes to purge stale counters

export interface LoginRateLimitStatus {
  isLocked: boolean;
  failedAttempts: number;
  remainingAttempts: number;
  remainingSeconds: number;
  remainingMinutes: number;
  message?: string;
}

/**
 * Checks the current lockout status for an email without incrementing attempts.
 */
export function checkLoginRateLimit(rawEmail?: string | null): LoginRateLimitStatus {
  if (!rawEmail) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutes: 0
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const entry = loginAttemptStore.get(email);
  const now = Date.now();

  if (!entry) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutes: 0
    };
  }

  // Check if active lockout is in progress
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const remainingMs = entry.lockedUntil - now;
    const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
    const remainingMinutes = Math.ceil(remainingSeconds / 60);

    const timeDisplay = remainingSeconds > 60
      ? `${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}`
      : `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}`;

    return {
      isLocked: true,
      failedAttempts: entry.failedAttempts,
      remainingAttempts: 0,
      remainingSeconds,
      remainingMinutes,
      message: `Too many failed password attempts. Account locked. Please wait ${timeDisplay} before trying again.`
    };
  }

  // If lockout duration has elapsed, clear lockout
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    loginAttemptStore.delete(email);
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutes: 0
    };
  }

  // If last failed attempt was over 15 minutes ago, clear stale attempts
  if (now - entry.lastFailedAt > ATTEMPT_EXPIRATION_MS) {
    loginAttemptStore.delete(email);
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutes: 0
    };
  }

  const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - entry.failedAttempts);

  return {
    isLocked: false,
    failedAttempts: entry.failedAttempts,
    remainingAttempts,
    remainingSeconds: 0,
    remainingMinutes: 0
  };
}

/**
 * Records a failed password attempt and applies a 5-minute lockout if limit is reached.
 */
export function recordFailedLoginAttempt(rawEmail?: string | null): LoginRateLimitStatus {
  if (!rawEmail) {
    return {
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      remainingSeconds: 0,
      remainingMinutes: 0
    };
  }

  const email = rawEmail.trim().toLowerCase();
  const now = Date.now();
  let entry = loginAttemptStore.get(email);

  // If previous lockout expired or stale, reset
  if (entry && entry.lockedUntil && now >= entry.lockedUntil) {
    entry = undefined;
  } else if (entry && now - entry.lastFailedAt > ATTEMPT_EXPIRATION_MS) {
    entry = undefined;
  }

  const newCount = (entry?.failedAttempts || 0) + 1;

  if (newCount >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptStore.set(email, {
      email,
      failedAttempts: newCount,
      lastFailedAt: now,
      lockedUntil
    });

    const remainingSeconds = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return {
      isLocked: true,
      failedAttempts: newCount,
      remainingAttempts: 0,
      remainingSeconds,
      remainingMinutes: 5,
      message: "Too many failed password attempts (5/5). Account locked for 5 minutes."
    };
  }

  loginAttemptStore.set(email, {
    email,
    failedAttempts: newCount,
    lastFailedAt: now,
    lockedUntil: null
  });

  const remainingAttempts = MAX_LOGIN_ATTEMPTS - newCount;
  return {
    isLocked: false,
    failedAttempts: newCount,
    remainingAttempts,
    remainingSeconds: 0,
    remainingMinutes: 0,
    message: "Invalid email or password"
  };
}

/**
 * Clears failed attempts upon successful password authentication.
 */
export function clearFailedLoginAttempts(rawEmail?: string | null): void {
  if (!rawEmail) return;
  const email = rawEmail.trim().toLowerCase();
  loginAttemptStore.delete(email);
}
