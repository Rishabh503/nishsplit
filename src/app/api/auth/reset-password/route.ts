import { NextResponse } from "next/server";
import { getUserByEmail, saveUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Email, OTP code, and new password are required" },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();
    const user = await getUserByEmail(trimmed);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    if (user.verificationOtp !== otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP reset code" },
        { status: 400 }
      );
    }

    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "OTP code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Set new password
    user.passwordHash = newPassword;
    user.verificationOtp = undefined;
    user.otpExpiresAt = undefined;
    user.isEmailVerified = true;
    await saveUser(user);

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset! You can now log in.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
