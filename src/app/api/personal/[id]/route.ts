import { NextResponse } from "next/server";
import {
  deletePersonalExpense,
  getRequestUser,
  setPersonalSettled,
  updatePersonalExpense,
} from "@/lib/personalDb";
import { isUuid, parsePersonalInput } from "@/lib/personal";

const unauthorized = () => NextResponse.json({ success: false, error: "Please log in again" }, { status: 401 });
const notFound = () => NextResponse.json({ success: false, error: "Expense not found" }, { status: 404 });

/** Full edit of a personal expense. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const input = parsePersonalInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ success: false, error: input }, { status: 400 });
  try {
    const data = await updatePersonalExpense(user.id, id, input);
    return data ? NextResponse.json({ success: true, data }) : notFound();
  } catch (error) {
    console.error("PUT /api/personal/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update expense" }, { status: 500 });
  }
}

/** Toggle the settled flag on a split: { settled: boolean } */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const body = await req.json().catch(() => null);
  if (typeof body?.settled !== "boolean") {
    return NextResponse.json({ success: false, error: "settled must be true or false" }, { status: 400 });
  }
  try {
    const data = await setPersonalSettled(user.id, id, body.settled);
    return data ? NextResponse.json({ success: true, data }) : notFound();
  } catch (error) {
    console.error("PATCH /api/personal/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  try {
    return (await deletePersonalExpense(user.id, id)) ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("DELETE /api/personal/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to delete expense" }, { status: 500 });
  }
}
