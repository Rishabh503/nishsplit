import { NextResponse } from "next/server";
import { deleteStatementSession, getStatementOwner, updateStatementSession } from "@/lib/statementDb";
import { parseStatementInput } from "@/lib/statement";
import { isUuid } from "@/lib/personal";

const notFound = () => NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

/** Saves the whole session: name, window, and every transaction's category / ignored flag. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getStatementOwner(req);
  if (!user) return notFound();
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  const input = parseStatementInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ success: false, error: input }, { status: 400 });
  try {
    const data = await updateStatementSession(user.id, id, input);
    return data ? NextResponse.json({ success: true, data }) : notFound();
  } catch (error) {
    console.error("PUT /api/statements/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to save analysis" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getStatementOwner(req);
  if (!user) return notFound();
  const { id } = await params;
  if (!isUuid(id)) return notFound();
  try {
    return (await deleteStatementSession(user.id, id)) ? NextResponse.json({ success: true }) : notFound();
  } catch (error) {
    console.error("DELETE /api/statements/[id] failed:", error);
    return NextResponse.json({ success: false, error: "Failed to delete analysis" }, { status: 500 });
  }
}
