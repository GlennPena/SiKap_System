import { NextResponse } from "next/server";
import { verifyPasswordResetCode } from "@/lib/password-reset-store";

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
        { success: false, message: "Please enter the complete 6-digit recovery code." },
        { status: 400 }
      );
    }

    const verification = verifyPasswordResetCode(email, code);
    if (!verification.valid) {
      return NextResponse.json(
        { 
          success: false, 
          message: verification.message || "Invalid or expired recovery code. Please check and try again." 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Recovery code verified successfully."
    });

  } catch (error: any) {
    console.error("Verify code error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to verify recovery code. Please try again." },
      { status: 500 }
    );
  }
}
