import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savePasswordResetCode } from "@/lib/password-reset-store";
import { sendEmail, buildPasswordResetEmail } from "@/lib/email";

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) {
    return `${local[0]}*@${domain}`;
  }
  const first = local[0];
  const last = local[local.length - 1];
  const maskedLocal = `${first}${"*".repeat(Math.min(local.length - 2, 5))}${last}`;
  return `${maskedLocal}@${domain}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Look up user case-insensitively
    const user = await db.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive"
        }
      },
      include: {
        barangay: true
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "No registered account found with this email address. Please verify your credentials or register as a Katipunan ng Kabataan member."
        },
        { status: 404 }
      );
    }

    if (user.status && user.status.toLowerCase() === "suspended") {
      return NextResponse.json(
        {
          success: false,
          message: "This official account has been suspended. Please contact the Municipal Youth Development Office (MYDO) or your Punong Barangay."
        },
        { status: 403 }
      );
    }

    // Generate secure 6-digit numeric recovery code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to token store
    const saveResult = savePasswordResetCode(user.email, user.id, user.name, resetCode);
    if (!saveResult.success) {
      return NextResponse.json(
        { success: false, message: saveResult.error || "Rate limit reached. Please wait." },
        { status: 429 }
      );
    }

    // Format human-friendly role label
    let roleLabel = "Katipunan ng Kabataan Member";
    if (user.role === "SK_OFFICIAL") roleLabel = "SK Chairperson";
    if (user.role === "BARANGAY_CAPTAIN") roleLabel = "Barangay Captain";
    if (user.role === "TESDA_PARTNER") roleLabel = "TESDA Institutional Partner";
    if (user.role === "SUPER_ADMIN") roleLabel = "Municipal Super Administrator";

    const designation = user.barangay?.name 
      ? `${roleLabel} · Brgy. ${user.barangay.name.replace(/^Barangay\s+/i, "")}`
      : roleLabel;

    // Send recovery email
    const emailPayload = buildPasswordResetEmail({
      name: user.name,
      resetCode,
      expiresInMinutes: saveResult.expiresInMinutes
    });

    const emailSent = await sendEmail({
      to: user.email,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    });

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Security recovery code sent to your email address."
        : "Security recovery code generated.",
      maskedEmail: maskEmail(user.email),
      accountName: user.name,
      designation,
      expiresInMinutes: saveResult.expiresInMinutes,
      // Only provide devCode as a fallback if email sending failed or was unconfigured
      devCode: !emailSent ? resetCode : undefined
    });

  } catch (error: any) {
    console.error("Forgot password request error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while processing password recovery. Please try again." },
      { status: 500 }
    );
  }
}
