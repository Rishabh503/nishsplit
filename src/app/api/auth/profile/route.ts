import { NextResponse } from "next/server";
import { validateSession, saveUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token, name, avatar, currentPassword, newPassword } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    if (name) {
      user.name = name.trim();
    }
    if (avatar) {
      user.avatar = avatar;
    }

    // Changing password
    if (newPassword) {
      if (!currentPassword || user.passwordHash !== currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 }
        );
      }
      user.passwordHash = newPassword;
    }

    await saveUser(user);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
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
      { success: false, error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}
