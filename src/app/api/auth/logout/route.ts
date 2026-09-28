import { NextResponse } from "next/server";
import { deleteSession, validateSession, saveUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (token) {
      await deleteSession(token);
    }
    return NextResponse.json({ success: true, message: "Logged out successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Logout failed" },
      { status: 500 }
    );
  }
}
