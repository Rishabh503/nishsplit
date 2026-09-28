import { NextResponse } from "next/server";
import { getAllUsers, getUserByEmail, saveUser } from "@/lib/db";
import { AppUser, UserRole } from "@/types";
import { generate6DigitOtp } from "@/lib/utils";
import { sendOtpEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { name, email, password, avatar } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await getUserByEmail(trimmedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Check current capacity (Strictly max 2 users)
    const allUsers = await getAllUsers();
    if (allUsers.length >= 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Duo space is full! Only 2 users are permitted in this shared splitwise space.",
          isFull: true,
        },
        { status: 403 }
      );
    }

    // Determine role (user1 or user2)
    const assignedRole: UserRole = allUsers.some((u) => u.id === "user1") ? "user2" : "user1";

    const otp = generate6DigitOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    const newUser: AppUser = {
      id: assignedRole,
      name: name.trim(),
      email: trimmedEmail,
      passwordHash: password,
      avatar: avatar || (assignedRole === "user1" ? "🧑🏻‍💻" : "👩🏻‍💼"),
      isEmailVerified: false,
      verificationOtp: otp,
      otpExpiresAt,
      createdAt: new Date().toISOString(),
    };

    await saveUser(newUser);

    // Send real email via SMTP / Resend
    await sendOtpEmail({
      to: trimmedEmail,
      subject: "Email Verification Code",
      otp,
      type: "verification",
      userName: newUser.name,
    });

    return NextResponse.json({
      success: true,
      message: `Verification code sent to your email (${trimmedEmail}). Please check your inbox.`,
      email: trimmedEmail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
