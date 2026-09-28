import { NextResponse } from "next/server";
import { getUserByEmail, saveUser } from "@/lib/db";
import { generate6DigitOtp } from "@/lib/utils";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required" },
        { status: 400 }
      );
    }

    const trimmed = email.trim().toLowerCase();
    const user = await getUserByEmail(trimmed);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No registered account found with this email" },
        { status: 404 }
      );
    }

    const otp = generate6DigitOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    user.verificationOtp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await saveUser(user);

    // Send real email
    const emailResult = await sendOtpEmail({
      to: trimmed,
      subject: "Password Recovery Code",
      otp,
      type: "reset",
      userName: user.name,
    });

    if (!emailResult.success && emailResult.error) {
      console.warn("Email delivery warning:", emailResult.error);
    }

    return NextResponse.json({
      success: true,
      message: `Password reset OTP has been sent to your email address (${trimmed}). Please check your inbox.`,
      email: trimmed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to initiate password reset" },
      { status: 500 }
    );
  }
}
