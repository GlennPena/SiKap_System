import { NextRequest, NextResponse } from "next/server";
import { checkLoginRateLimit } from "@/lib/login-rate-limiter";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email || !email.trim()) {
    return NextResponse.json({
      isLocked: false,
      failedAttempts: 0,
      remainingAttempts: 5,
      remainingSeconds: 0,
      remainingMinutes: 0
    });
  }

  const status = checkLoginRateLimit(email.trim());
  return NextResponse.json(status);
}
