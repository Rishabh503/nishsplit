import { NextResponse } from "next/server";
import { validateSession, getAllUsers } from "@/lib/db";
import { UserPublicProfile } from "@/types";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const allUsers = await getAllUsers();

    // Map public profiles
    const publicProfiles: UserPublicProfile[] = allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      isEmailVerified: u.isEmailVerified,
    }));

    if (!token) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        usersCount: allUsers.length,
        canRegister: allUsers.length < 2,
        registeredUsers: publicProfiles,
      });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({
        success: true,
        authenticated: false,
        usersCount: allUsers.length,
        canRegister: allUsers.length < 2,
        registeredUsers: publicProfiles,
      });
    }

    // Find partner
    const partner = allUsers.find((u) => u.id !== user.id) || null;
    const partnerProfile: UserPublicProfile | null = partner
      ? {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar,
          isEmailVerified: partner.isEmailVerified,
        }
      : null;

    return NextResponse.json({
      success: true,
      authenticated: true,
      usersCount: allUsers.length,
      canRegister: allUsers.length < 2,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
      partner: partnerProfile,
      registeredUsers: publicProfiles,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}
