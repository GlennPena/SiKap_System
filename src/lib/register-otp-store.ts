import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const EXPIRATION_MINUTES = 15;
const RATE_LIMIT_SECONDS = 60; // 60 seconds between resend requests
const VERIFICATION_VALIDITY_MINUTES = 60; // Verified status valid for 60 minutes to complete registration

/**
 * Stores a 6-digit registration verification code directly in PostgreSQL (Neon DB).
 * Being database-backed guarantees that every serverless container, device,
 * tablet, or mobile browser accesses the exact same valid token.
 */
export async function saveRegisterOtpCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string; expiresInMinutes: number; waitSeconds?: number }> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  try {
    // Check rate limiting from DB
    const existing = await db.appVerificationCode.findUnique({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "REGISTER"
        }
      }
    });

    if (existing) {
      const elapsedMs = now.getTime() - new Date(existing.lastRequestedAt).getTime();
      if (elapsedMs < RATE_LIMIT_SECONDS * 1000) {
        const waitSeconds = Math.ceil((RATE_LIMIT_SECONDS * 1000 - elapsedMs) / 1000);
        return {
          success: false,
          error: `Please wait ${waitSeconds}s before requesting a new verification code.`,
          expiresInMinutes: EXPIRATION_MINUTES,
          waitSeconds
        };
      }
    }

    const expiresAt = new Date(now.getTime() + EXPIRATION_MINUTES * 60 * 1000);
    const cleanCode = code.replace(/\D/g, "").trim();

    await db.appVerificationCode.upsert({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "REGISTER"
        }
      },
      create: {
        email: normalizedEmail,
        type: "REGISTER",
        code: cleanCode,
        expiresAt,
        attempts: 0,
        lastRequestedAt: now,
        isVerified: false
      },
      update: {
        code: cleanCode,
        expiresAt,
        attempts: 0,
        lastRequestedAt: now,
        isVerified: false,
        verifiedAt: null
      }
    });

    return {
      success: true,
      expiresInMinutes: EXPIRATION_MINUTES
    };
  } catch (error) {
    console.error("[register-otp-store] Error in saveRegisterOtpCode:", error);
    return {
      success: false,
      error: "Unable to save verification code. Please try again.",
      expiresInMinutes: EXPIRATION_MINUTES
    };
  }
}

/**
 * Verifies the 6-digit code for the specified email against PostgreSQL.
 */
export async function verifyRegisterOtpCode(
  email: string,
  code: string
): Promise<{ valid: boolean; message?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.replace(/\D/g, "").trim();

  try {
    const entry = await db.appVerificationCode.findUnique({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "REGISTER"
        }
      }
    });

    if (!entry) {
      return {
        valid: false,
        message: "No verification code requested for this email. Please request a new code."
      };
    }

    const now = new Date();
    if (now > new Date(entry.expiresAt)) {
      await db.appVerificationCode.delete({
        where: { id: entry.id }
      }).catch(() => {});
      return {
        valid: false,
        message: "The verification code has expired. Please request a new code."
      };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      await db.appVerificationCode.delete({
        where: { id: entry.id }
      }).catch(() => {});
      return {
        valid: false,
        message: "Too many failed attempts. For security, please request a new verification code."
      };
    }

    if (entry.code.trim() !== cleanCode) {
      const updated = await db.appVerificationCode.update({
        where: { id: entry.id },
        data: { attempts: { increment: 1 } }
      });
      const remaining = MAX_ATTEMPTS - updated.attempts;
      return {
        valid: false,
        message: remaining > 0
          ? `Incorrect verification code. ${remaining} attempt(s) remaining.`
          : "Incorrect code. Maximum attempts reached. Please request a new code."
      };
    }

    // Code is valid! Mark as verified
    await db.appVerificationCode.update({
      where: { id: entry.id },
      data: {
        isVerified: true,
        verifiedAt: now,
        attempts: 0
      }
    });

    return {
      valid: true,
      message: "Email address verified successfully."
    };
  } catch (error) {
    console.error("[register-otp-store] Error in verifyRegisterOtpCode:", error);
    return {
      valid: false,
      message: "An error occurred while verifying the code. Please try again."
    };
  }
}

/**
 * Checks if the email address has been successfully verified via OTP within the validity window.
 */
export async function isEmailVerifiedForRegistration(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const entry = await db.appVerificationCode.findUnique({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "REGISTER"
        }
      }
    });

    if (!entry || !entry.isVerified || !entry.verifiedAt) {
      return false;
    }

    const now = new Date();
    const elapsedMs = now.getTime() - new Date(entry.verifiedAt).getTime();
    if (elapsedMs > VERIFICATION_VALIDITY_MINUTES * 60 * 1000) {
      await db.appVerificationCode.delete({ where: { id: entry.id } }).catch(() => {});
      return false;
    }

    return true;
  } catch (error) {
    console.error("[register-otp-store] Error in isEmailVerifiedForRegistration:", error);
    return false;
  }
}

/**
 * Deletes the verification code entry after registration is successfully completed.
 */
export async function clearRegisterOtp(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await db.appVerificationCode.deleteMany({
    where: {
      email: normalizedEmail,
      type: "REGISTER"
    }
  }).catch(() => {});
}
