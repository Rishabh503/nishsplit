import { NextResponse } from "next/server";
import { getExpenses, saveExpense } from "@/lib/db";
import { Expense } from "@/types";

export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, amount, currency, category, date, paidBy, splitType, user1Amount, user2Amount, notes } = body;

    if (!title || !amount || !paidBy || !splitType) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newExpense: Expense = {
      id: body.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: title.trim(),
      amount: Number(amount),
      currency: currency || "INR",
      category: category || "Other",
      date: date || new Date().toISOString().slice(0, 10),
      paidBy,
      splitType,
      user1Amount: Number(user1Amount || 0),
      user2Amount: Number(user2Amount || 0),
      notes: notes?.trim() || "",
      createdAt: body.createdAt || new Date().toISOString(),
    };

    const saved = await saveExpense(newExpense);
    return NextResponse.json({ success: true, data: saved });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save expense" },
      { status: 500 }
    );
  }
}
