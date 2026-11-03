import { NextResponse } from "next/server";
import { createStatementSession, getStatementOwner, listStatementSessions } from "@/lib/statementDb";
import { parseStatementInput } from "@/lib/statement";

// 404 rather than 403 so the feature doesn't advertise itself to other users
const notAllowed = () => NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

export async function GET(req: Request) {
  const user = await getStatementOwner(req);
  if (!user) return notAllowed();
  try {
    const data = await listStatementSessions(user.id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/statements failed:", error);
    return NextResponse.json({ success: false, error: "Failed to load your analyses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getStatementOwner(req);
  if (!user) return notAllowed();
  const input = parseStatementInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ success: false, error: input }, { status: 400 });
  try {
    const data = await createStatementSession(user.id, input);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error("POST /api/statements failed:", error);
    return NextResponse.json({ success: false, error: "Failed to save analysis" }, { status: 500 });
  }
}
