import { PersonalExpense, PersonalExpenseInput, PersonalSummary } from "@/types";

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function todayISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function formatDayLabel(iso: string): string {
  const today = todayISO();
  const y = new Date(`${today}T00:00:00`);
  y.setDate(y.getDate() - 1);
  const yesterday = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, "0")}-${String(y.getDate()).padStart(2, "0")}`;
  if (iso === today) return "Today";
  if (iso === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(
    new Date(`${iso}T00:00:00`)
  );
}

/** How much the others in a split owe me (only meaningful when I paid). */
export const othersOwe = (e: PersonalExpense) => round2(e.amount - e.myShare);

/**
 * Money that has actually left my pocket for this expense.
 * - I paid the bill: the full bill until the others pay me back, then just my share.
 * - Someone else paid: nothing until I pay them my share.
 */
export function outOfPocket(e: PersonalExpense): number {
  if (!e.isSplit) return e.amount;
  if (e.settled) return e.myShare;
  return e.paidByMe ? e.amount : 0;
}

export function summarizePersonal(expenses: PersonalExpense[]): PersonalSummary {
  const s: PersonalSummary = { totalSpent: 0, cashOut: 0, upiOut: 0, toReceive: 0, toPay: 0, count: expenses.length };
  for (const e of expenses) {
    s.totalSpent += e.myShare;
    if (e.method === "cash") s.cashOut += outOfPocket(e);
    else s.upiOut += outOfPocket(e);
    if (e.isSplit && !e.settled) {
      if (e.paidByMe) s.toReceive += othersOwe(e);
      else s.toPay += e.myShare;
    }
  }
  return {
    ...s,
    totalSpent: round2(s.totalSpent),
    cashOut: round2(s.cashOut),
    upiOut: round2(s.upiOut),
    toReceive: round2(s.toReceive),
    toPay: round2(s.toPay),
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (id: string) => UUID_RE.test(id);

/** Validates and normalises a personal expense from the client. Returns an error string on failure. */
export function parsePersonalInput(body: unknown): PersonalExpenseInput | string {
  if (!body || typeof body !== "object") return "Invalid request body";
  const b = body as Record<string, unknown>;

  const title = String(b.title ?? "").trim().slice(0, 120);
  if (!title) return "Add a title for the expense";

  const amount = round2(Number(b.amount));
  if (!Number.isFinite(amount) || amount <= 0) return "Amount must be more than 0";

  const method = b.method === "cash" || b.method === "upi" ? b.method : null;
  if (!method) return "Pick Cash or UPI";

  const spentOn = String(b.spentOn ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(spentOn) || isNaN(Date.parse(spentOn))) return "Invalid date";

  const isSplit = b.isSplit === true;
  const note = String(b.note ?? "").trim().slice(0, 500);

  if (!isSplit) {
    return { title, amount, method, spentOn, isSplit, people: 1, myShare: amount, paidByMe: true, settled: true, splitWith: "", note };
  }

  const people = Math.trunc(Number(b.people));
  if (!Number.isFinite(people) || people < 2 || people > 100) return "A split needs 2 to 100 people";

  const myShare = round2(Number(b.myShare));
  if (!Number.isFinite(myShare) || myShare < 0 || myShare > amount) return "Your share must be between 0 and the total";

  return {
    title,
    amount,
    method,
    spentOn,
    isSplit,
    people,
    myShare,
    paidByMe: b.paidByMe !== false,
    settled: b.settled === true,
    splitWith: String(b.splitWith ?? "").trim().slice(0, 200),
    note,
  };
}
