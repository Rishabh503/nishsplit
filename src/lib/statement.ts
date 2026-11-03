import { ExpenseCategory, StatementSessionInput, StatementTxn } from "@/types";
import { CATEGORIES } from "./utils";
import { round2 } from "./personal";

/** The statement analyzer is Rishabh's alone; both the API and the UI check this. */
export const STATEMENT_OWNER_EMAIL = "rishabhtripathi2022@gmail.com";
export const isStatementOwner = (email?: string | null) => email?.trim().toLowerCase() === STATEMENT_OWNER_EMAIL;

const CATEGORY_NAMES = CATEGORIES.map((c) => c.name) as readonly ExpenseCategory[];

/** Adds n days to a YYYY-MM-DD date. */
export function shiftDate(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** First and last day of the analysed window: `days` days ending on `endDate`. */
export function windowRange(endDate: string, days: number) {
  return { start: shiftDate(endDate, -(days - 1)), end: endDate };
}

export function txnsInWindow(txns: StatementTxn[], endDate: string, days: number): StatementTxn[] {
  const { start, end } = windowRange(endDate, days);
  return txns.filter((t) => t.date >= start && t.date <= end);
}

export interface StatementSummary {
  total: number;
  count: number;
  ignoredTotal: number;
  ignoredCount: number;
  uncategorized: number;
  byCategory: { category: ExpenseCategory | null; total: number; count: number }[];
}

/** Totals for the transactions in the window, leaving out ignored ones. */
export function summarizeStatement(txns: StatementTxn[]): StatementSummary {
  const s: StatementSummary = { total: 0, count: 0, ignoredTotal: 0, ignoredCount: 0, uncategorized: 0, byCategory: [] };
  const groups = new Map<ExpenseCategory | null, { total: number; count: number }>();
  for (const t of txns) {
    if (t.ignored) {
      s.ignoredTotal += t.amount;
      s.ignoredCount++;
      continue;
    }
    s.total += t.amount;
    s.count++;
    if (!t.category) s.uncategorized++;
    const g = groups.get(t.category) ?? { total: 0, count: 0 };
    g.total += t.amount;
    g.count++;
    groups.set(t.category, g);
  }
  s.byCategory = [...groups.entries()]
    .map(([category, g]) => ({ category, total: round2(g.total), count: g.count }))
    .sort((a, b) => b.total - a.total);
  return { ...s, total: round2(s.total), ignoredTotal: round2(s.ignoredTotal) };
}

/**
 * Keyword rules for auto-categorising bank narrations, checked top to bottom.
 * Specific merchants come before broad ones ("amazon prime" before "amazon").
 */
const CATEGORY_RULES: [ExpenseCategory, string[]][] = [
  ["Entertainment", ["bookmyshow", "netflix", "spotify", "amazon prime", "primevideo", "hotstar", "jiocinema", "pvr", "inox", "cinepolis", "youtube", "steam", "playstation"]],
  ["Rent & Stay", ["oyo", "hotel", "airbnb", "booking.com", "agoda", "zostel", "hostel", "resort", "homestay", "treebo", "fabhotel", "rent", "nobroker"]],
  ["Travel & Cab", ["uber", "ola", "rapido", "irctc", "makemytrip", "goibibo", "cleartrip", "ixigo", "easemytrip", "redbus", "abhibus", "indigo", "air india", "akasa", "spicejet", "vistara", "airline", "airport", "metro", "fastag", "toll", "petrol", "fuel", "hpcl", "bpcl", "iocl", "indian oil", "shell", "parking", "zoomcar", "blusmart"]],
  ["Groceries", ["blinkit", "zepto", "bigbasket", "instamart", "dmart", "jiomart", "grofers", "more retail", "reliance fresh", "spencer", "grocer", "kirana", "supermarket", "milk", "dairy"]],
  ["Food & Dining", ["swiggy", "zomato", "eatsure", "restaurant", "resto", "cafe", "coffee", "starbucks", "chaayos", "dominos", "domino", "pizza", "mcdonald", "kfc", "burger", "subway", "haldiram", "bakery", "dhaba", "kitchen", "food", "biryani", "barbeque", "chai", "tea"]],
  ["Health & Wellness", ["pharmacy", "pharma", "chemist", "medical", "apollo", "medplus", "1mg", "pharmeasy", "netmeds", "hospital", "clinic", "diagnostic", "lab", "doctor", "cult.fit", "cultfit", "gym", "fitness"]],
  ["Bills & Utilities", ["airtel", "jio", "vodafone", "vi", "bsnl", "electricity", "bescom", "tata power", "adani", "msedcl", "recharge", "broadband", "act fibernet", "postpaid", "prepaid", "gas", "water bill", "dth", "tatasky", "tata play", "bill", "insurance", "lic"]],
  ["Shopping", ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "tatacliq", "croma", "reliance digital", "decathlon", "ikea", "zara", "h&m", "uniqlo", "lifestyle", "westside", "pantaloons", "mall", "store", "mart"]],
  ["Gifts", ["gift", "ferns", "fnp", "igp"]],
];

/** Best-guess category from a narration, or null when nothing matches. */
export function guessCategory(description: string): ExpenseCategory | null {
  const text = ` ${description.toLowerCase().replace(/[^a-z0-9.&]+/g, " ")} `;
  // Short keywords must be whole words so "ola" doesn't match "solar" or "rent" match "current".
  // Longer ones can sit inside merged UPI handles like "swiggyinstamart".
  const matches = (k: string) => (k.trim().length < 5 ? text.includes(` ${k.trim()} `) : text.includes(k));
  for (const [category, keywords] of CATEGORY_RULES) {
    if (keywords.some(matches)) return category;
  }
  return null;
}

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
const isIsoDate = (s: string) => ISO_RE.test(s) && !isNaN(Date.parse(s));

/** Validates a session from the client. Returns an error string on failure. */
export function parseStatementInput(body: unknown): StatementSessionInput | string {
  if (!body || typeof body !== "object") return "Invalid request body";
  const b = body as Record<string, unknown>;

  const name = String(b.name ?? "").trim().slice(0, 80);
  if (!name) return "Give this analysis a name";

  const fileName = String(b.fileName ?? "").trim().slice(0, 200);

  const days = Math.trunc(Number(b.days));
  if (!Number.isFinite(days) || days < 1 || days > 3660) return "Days must be between 1 and 3660";

  const endDate = String(b.endDate ?? "");
  if (!isIsoDate(endDate)) return "Invalid end date";

  if (!Array.isArray(b.txns)) return "No transactions found";
  if (b.txns.length > 20000) return "Statement is too large";

  const txns: StatementTxn[] = [];
  for (const raw of b.txns) {
    const t = (raw ?? {}) as Record<string, unknown>;
    const date = String(t.date ?? "");
    const amount = round2(Number(t.amount));
    if (!isIsoDate(date) || !Number.isFinite(amount) || amount <= 0) return "A transaction has a bad date or amount";
    const category = CATEGORY_NAMES.includes(t.category as ExpenseCategory) ? (t.category as ExpenseCategory) : null;
    txns.push({
      id: String(t.id ?? "").slice(0, 40) || String(txns.length),
      date,
      description: String(t.description ?? "").trim().slice(0, 300),
      amount,
      category,
      ignored: t.ignored === true,
    });
  }

  return { name, fileName, days, endDate, txns };
}
