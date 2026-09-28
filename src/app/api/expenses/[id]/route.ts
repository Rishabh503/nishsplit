import { NextResponse } from "next/server";
import { deleteExpense, saveExpense } from "@/lib/db";
import { Expense } from "@/types";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updatedExpense: Expense = {
      ...body,
      id,
      amount: Number(body.amount),
      user1Amount: Number(body.user1Amount || 0),
      user2Amount: Number(body.user2Amount || 0),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveExpense(updatedExpense);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ success: true, message: "Expense deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete expense" },
      { status: 500 }
    );
  }
}
