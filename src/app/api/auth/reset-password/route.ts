import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyPasswordResetCode, consumePasswordResetCode } from "@/lib/password-reset-store";
import { validatePassword } from "@/lib/password-policy";

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

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { success: false, message: passwordCheck.errors[0] || "New password does not meet security requirements." },
        { status: 400 }
      );
    }

    // Verify recovery code
    const verification = await verifyPasswordResetCode(email, code);
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
    await consumePasswordResetCode(email);

    return NextResponse.json({
      success: true,
      message: "Your password has been successfully updated. You may now sign in with your new credentials."
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Failed to reset password. Please try again later." },
      { status: 500 }
    );
  }
}
