import { NextResponse } from "next/server";
import { getUserByEmail, getAllUsers, createSession, saveUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Email or name and password are required" },
        { status: 400 }
      );
    }

    const trimmed = identifier.trim().toLowerCase();
    const allUsers = await getAllUsers();
    
    // Find by email or exact name
    const user = allUsers.find(
      (u) => u.email.toLowerCase() === trimmed || u.name.toLowerCase() === trimmed
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Account not found. Please verify your credentials or register." },
        { status: 401 }
      );
    }

    // Verify password
    if (user.passwordHash !== password) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Please try again or use Forgot Password." },
        { status: 401 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    await saveUser(user);

    // Create session token
    const token = await createSession(user.id);

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Login failed" },
      { status: 500 }
    );
  }
}
