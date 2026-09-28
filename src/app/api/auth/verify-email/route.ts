import { NextResponse } from "next/server";
import { getUserByEmail, saveUser, createSession } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: "Email and verification OTP are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();
    const user = await getUserByEmail(trimmedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found" },
        { status: 404 }
      );
    }

    // Check OTP
    if (user.verificationOtp !== otp.trim()) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code. Please check your email." },
        { status: 400 }
      );
    }

    // Check expiry
    if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Mark verified
    user.isEmailVerified = true;
    user.verificationOtp = undefined;
    user.otpExpiresAt = undefined;
    user.lastLoginAt = new Date().toISOString();
    await saveUser(user);

    // Create session token
    const token = await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Email verification failed" },
      { status: 500 }
    );
  }
}
