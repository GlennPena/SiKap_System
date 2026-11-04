import { db } from "@/lib/db";

const MAX_ATTEMPTS = 5;
const EXPIRATION_MINUTES = 15;
const RATE_LIMIT_SECONDS = 30; // Min time between resend requests

export async function savePasswordResetCode(
  email: string,
  userId: string,
  name: string,
  code: string
): Promise<{ success: boolean; error?: string; expiresInMinutes: number }> {
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();

  try {
    const existing = await db.appVerificationCode.findUnique({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "RESET_PASSWORD"
        }
      }
    });

    if (existing) {
      const elapsedMs = now.getTime() - new Date(existing.lastRequestedAt).getTime();
      if (elapsedMs < RATE_LIMIT_SECONDS * 1000) {
        const waitSeconds = Math.ceil((RATE_LIMIT_SECONDS * 1000 - elapsedMs) / 1000);
        return {
          success: false,
          error: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
          expiresInMinutes: EXPIRATION_MINUTES
        };
      }
    }

    const expiresAt = new Date(now.getTime() + EXPIRATION_MINUTES * 60 * 1000);
    const cleanCode = code.replace(/\D/g, "").trim();

    await db.appVerificationCode.upsert({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "RESET_PASSWORD"
        }
      },
      create: {
        email: normalizedEmail,
        type: "RESET_PASSWORD",
        code: cleanCode,
        expiresAt,
        attempts: 0,
        lastRequestedAt: now,
        isVerified: false,
        metadata: JSON.stringify({ userId, name })
      },
      update: {
        code: cleanCode,
        expiresAt,
        attempts: 0,
        lastRequestedAt: now,
        isVerified: false,
        verifiedAt: null,
        metadata: JSON.stringify({ userId, name })
      }
    });

    return {
      success: true,
      expiresInMinutes: EXPIRATION_MINUTES
    };
  } catch (error) {
    console.error("[password-reset-store] Error in savePasswordResetCode:", error);
    return {
      success: false,
      error: "Unable to save reset code. Please try again.",
      expiresInMinutes: EXPIRATION_MINUTES
    };
  }
}

export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<{ valid: boolean; message?: string; userId?: string; name?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.replace(/\D/g, "").trim();

  try {
    const entry = await db.appVerificationCode.findUnique({
      where: {
        email_type: {
          email: normalizedEmail,
          type: "RESET_PASSWORD"
        }
      }
    });

    if (!entry) {
      return {
        valid: false,
        message: "No active password recovery request found. Please request a new code."
      };
    }

    const now = new Date();
    if (now > new Date(entry.expiresAt)) {
      await db.appVerificationCode.delete({ where: { id: entry.id } }).catch(() => {});
      return {
        valid: false,
        message: "The verification code has expired. Please request a new one."
      };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      await db.appVerificationCode.delete({ where: { id: entry.id } }).catch(() => {});
      return {
        valid: false,
        message: "Maximum invalid attempts exceeded. Please request a new verification code."
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
          ? "Invalid verification code. Please check and try again."
          : "Invalid verification code. Maximum attempts reached."
      };
    }

    let meta: { userId?: string; name?: string } = {};
    if (entry.metadata) {
      try {
        meta = JSON.parse(entry.metadata);
      } catch {}
    }

    return {
      valid: true,
      userId: meta.userId,
      name: meta.name
    };
  } catch (error) {
    console.error("[password-reset-store] Error in verifyPasswordResetCode:", error);
    return {
      valid: false,
      message: "An error occurred while verifying the reset code."
    };
  }
}

export async function consumePasswordResetCode(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  await db.appVerificationCode.deleteMany({
    where: {
      email: normalizedEmail,
      type: "RESET_PASSWORD"
    }
  }).catch(() => {});
}
