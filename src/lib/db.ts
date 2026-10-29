import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    errorFormat: "minimal",
    log: [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

/**
 * Sanitizes any server or database error so internal details (such as database URLs,
 * hostnames, ports, Prisma invocation traces, or SQL queries) are never exposed to clients.
 */
export function sanitizeApiError(
  error: unknown,
  fallbackMessage = "Unable to complete your request right now. Please try again shortly."
): string {
  if (!error) return fallbackMessage;

  const rawMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
      ? error.message
      : typeof (error as any)?.message === "string"
      ? (error as any).message
      : "";

  const errName = (error as any)?.name || "";
  const errCode = (error as any)?.code || "";
  const lower = rawMessage.toLowerCase();

  // 1. Database connectivity / unreachable host / pool timeout
  if (
    errName === "PrismaClientInitializationError" ||
    errCode === "P1000" ||
    errCode === "P1001" ||
    errCode === "P1002" ||
    errCode === "P1008" ||
    errCode === "P1017" ||
    errCode === "P2024" ||
    lower.includes("can't reach database server") ||
    lower.includes("database server") ||
    lower.includes("connection") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound") ||
    lower.includes("neon.tech") ||
    lower.includes("supabase") ||
    lower.includes("postgres://") ||
    lower.includes("postgresql://")
  ) {
    return "Service temporarily unavailable due to a database connection issue. Please check your connection and try again shortly.";
  }

  // 2. Interactive transaction timeout / expired transaction
  if (
    errCode === "P2028" ||
    lower.includes("transaction already closed") ||
    lower.includes("expired transaction") ||
    lower.includes("transaction api error")
  ) {
    return "The request took too long to process due to a slow connection. Please try again.";
  }

  // 3. Unique constraint violation
  if (errCode === "P2002" || lower.includes("unique constraint")) {
    return "A record with this information already exists.";
  }

  // 4. Record not found
  if (errCode === "P2025") {
    return "The requested record could not be found.";
  }

  // 5. Any other Prisma / SQL / internal error
  if (
    errName.startsWith("Prisma") ||
    (typeof errCode === "string" && /^P\d{4}$/.test(errCode)) ||
    lower.includes("prisma") ||
    lower.includes("invocation") ||
    lower.includes("raw query failed") ||
    lower.includes("invalid `prisma.") ||
    lower.includes(":5432") ||
    lower.includes(":6543")
  ) {
    return fallbackMessage;
  }

  return rawMessage || fallbackMessage;
}
