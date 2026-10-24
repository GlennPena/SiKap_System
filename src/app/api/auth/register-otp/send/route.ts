import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { saveRegisterOtpCode } from "@/lib/register-otp-store";
import { sendEmail, buildRegistrationOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, name } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email format." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive"
        }
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: "This email address is already registered in SiKap. Please log in or use password recovery." 
        },
        { status: 400 }
      );
    }

    // Generate secure 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to token store
    const saveResult = saveRegisterOtpCode(normalizedEmail, otpCode);
    if (!saveResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: saveResult.error || "Please wait before requesting another code.",
          waitSeconds: saveResult.waitSeconds
        },
        { status: 429 }
      );
    }

    // Build email payload
    const emailPayload = buildRegistrationOtpEmail({
      otpCode,
      name: name?.trim() || undefined,
      expiresInMinutes: saveResult.expiresInMinutes
    });

    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: emailPayload.subject,
      html: emailPayload.html,
      text: emailPayload.text
    });

    return NextResponse.json({
      success: true,
      message: emailSent
        ? "Verification code sent to your email address."
        : "Verification code generated.",
      expiresInMinutes: saveResult.expiresInMinutes,
      waitSeconds: 60,
      // Provide devCode fallback if email transport is unconfigured
      devCode: !emailSent ? otpCode : undefined
    });

  } catch (error: any) {
    console.error("Register OTP Send Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while sending verification code. Please try again." },
      { status: 500 }
    );
  }
}
