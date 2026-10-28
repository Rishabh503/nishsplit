import { NextResponse } from "next/server";
import { createPersonalExpense, getRequestUser, listPersonalExpenses } from "@/lib/personalDb";
import { parsePersonalInput } from "@/lib/personal";

const unauthorized = () => NextResponse.json({ success: false, error: "Please log in again" }, { status: 401 });

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  try {
    const data = await listPersonalExpenses(user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/personal failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load your expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const input = parsePersonalInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ success: false, error: input }, { status: 400 });
  try {
    const data = await createPersonalExpense(user.id, input);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/personal failed:", error);
    return NextResponse.json({ success: false, error: "Failed to save expense" }, { status: 500 });
  }
}
