import { NextResponse } from "next/server";
import { getSettlements, saveSettlement, deleteSettlement } from "@/lib/db";
import { Settlement } from "@/types";

export async function GET() {
  try {
    const settlements = await getSettlements();
    return NextResponse.json({ success: true, data: settlements });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch settlements" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromUser, toUser, amount, currency, date, notes } = body;

    if (!fromUser || !toUser || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required settlement fields" },
        { status: 400 }
      );
    }

    const newSettlement: Settlement = {
      id: body.id || `settle_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fromUser,
      toUser,
      amount: Number(amount),
      currency: currency || "INR",
      date: date || new Date().toISOString().slice(0, 10),
      notes: notes?.trim() || "Settlement recorded",
      createdAt: new Date().toISOString(),
    };

    const saved = await saveSettlement(newSettlement);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save settlement" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }
    await deleteSettlement(id);
    return NextResponse.json({ success: true, message: "Settlement deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete settlement" },
      { status: 500 }
    );
  }
}
