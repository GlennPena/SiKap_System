import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyPasswordResetCode, consumePasswordResetCode } from "@/lib/password-reset-store";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, code, newPassword } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: "Missing email address or recovery code." },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "New password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    // Verify recovery code
    const verification = verifyPasswordResetCode(email, code);
    if (!verification.valid || !verification.userId) {
      return NextResponse.json(
        { success: false, message: verification.message || "Invalid or expired recovery code." },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user in database
    await db.user.update({
      where: { id: verification.userId },
      data: { passwordHash }
    });

    // Invalidate the code
    consumePasswordResetCode(email);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You may now sign in with your new credentials."
    });

  } catch (error: any) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
