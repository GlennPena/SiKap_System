import { NextResponse } from "next/server";
import { verifyRegisterOtpCode } from "@/lib/register-otp-store";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || code.trim().length !== 6) {
      return NextResponse.json(
        { success: false, message: "Please enter the 6-digit verification code." },
        { status: 400 }
      );
    }

    const verificationResult = verifyRegisterOtpCode(email, code);

    if (!verificationResult.valid) {
      return NextResponse.json(
        { success: false, message: verificationResult.message || "Invalid verification code." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email address verified successfully."
    });

  } catch (error: any) {
    console.error("Register OTP Verify Error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while verifying the code. Please try again." },
      { status: 500 }
    );
  }
}
