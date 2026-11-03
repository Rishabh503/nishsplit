import { StatementTxn } from "@/types";
import { round2 } from "./personal";

/**
 * Reads a bank statement (CSV, XLS or XLSX) in the browser and returns its debits.
 * The file never leaves the device; only the parsed rows are saved.
 *
 * Banks lay their exports out differently, so the header row and columns are found by name:
 * a date column, a narration column, and either separate Withdrawal/Deposit columns or
 * one Amount column with a Dr/Cr marker.
 */
export async function parseStatementFile(file: File): Promise<StatementTxn[]> {
  const XLSX = await import("xlsx");
  const isCsv = /\.(csv|txt)$/i.test(file.name);
  // raw: true keeps CSV cells as text, so "03/04/26" isn't read as an American date
  const wb = isCsv
    ? XLSX.read(await file.text(), { type: "string", raw: true })
    : XLSX.read(await file.arrayBuffer(), { type: "array" });

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sheetName], { header: 1, raw: true, defval: "" });
    const txns = parseRows(rows);
    if (txns) return txns;
  }
  throw new Error("Couldn't find Date, Narration and Withdrawal/Debit columns in this file");
}

const norm = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z/]+/g, " ").trim();

interface Columns {
  date: number;
  desc: number;
  debit: number;
  credit: number; // -1 when absent
  amount: number; // single signed/marked amount column, -1 when absent
  drcr: number; // Dr/Cr marker column, -1 when absent
}

function findColumns(header: unknown[]): Columns | null {
  const h = header.map(norm);
  const find = (...tests: ((s: string) => boolean)[]) => {
    for (const test of tests) {
      const i = h.findIndex(test);
      if (i !== -1) return i;
    }
    return -1;
  };

  // Prefer the transaction date over the value date
  const date = find(
    (s) => /^(txn|tran|transaction|trans) ?date/.test(s) || s === "date",
    (s) => s.includes("date") && !s.includes("value"),
    (s) => s.includes("date")
  );
  const desc = find(
    (s) => /narration|description|particulars|remarks|details/.test(s),
    (s) => /transaction|txn/.test(s) && !s.includes("date") && !s.includes("id")
  );
  const debit = find((s) => /withdrawal|debit|^dr$|paid out|money out/.test(s) && !s.includes("credit"));
  const credit = find((s) => /deposit|credit|^cr$|paid in|money in/.test(s) && !s.includes("debit"));
  const drcr = find((s) => /^(dr ?\/ ?cr|cr ?\/ ?dr|type|txn type|transaction type|debit ?\/ ?credit)$/.test(s));
  const amount = debit === -1 ? find((s) => s.includes("amount") && !s.includes("balance")) : -1;

  if (date === -1 || desc === -1 || (debit === -1 && amount === -1)) return null;
  return { date, desc, debit, credit, amount, drcr };
}

function parseRows(rows: unknown[][]): StatementTxn[] | null {
  // The header is rarely on row 1: banks put account details above it
  const headerIdx = rows.slice(0, 60).findIndex((r) => findColumns(r) !== null);
  if (headerIdx === -1) return null;
  const cols = findColumns(rows[headerIdx])!;

  const txns: StatementTxn[] = [];
  for (const row of rows.slice(headerIdx + 1)) {
    const date = parseDate(row[cols.date]);
    if (!date) continue; // footers, separator lines, opening balance rows

    let out = 0;
    if (cols.debit !== -1) {
      out = parseAmount(row[cols.debit]);
    } else {
      const amt = parseAmount(row[cols.amount]);
      const marker = `${norm(row[cols.drcr])} ${String(row[cols.amount] ?? "").toLowerCase()}`;
      if (/\b(dr|debit|d)\b/.test(marker)) out = Math.abs(amt);
      else if (cols.drcr === -1 && !/\bcr\b/.test(marker) && amt < 0) out = -amt; // signed amounts: negative = out
    }
    if (!(out > 0)) continue;

    const description = String(row[cols.desc] ?? "").replace(/\s+/g, " ").trim();
    txns.push({ id: String(txns.length), date, description, amount: round2(out), category: null, ignored: false });
  }
  if (txns.length === 0) return null;
  // PhonePe and some banks list newest first; store oldest first so ids follow time within a day
  if (txns[0].date > txns[txns.length - 1].date) txns.reverse();
  return txns.map((t, i) => ({ ...t, id: String(i) }));
}

function parseAmount(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "").replace(/[,₹\s]|INR|Rs\.?/gi, "");
  const negative = /^\(.*\)$/.test(s) || s.startsWith("-");
  const n = parseFloat(s.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n)) return 0;
  return negative ? -n : n;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

const pad = (n: number) => String(n).padStart(2, "0");

function toIso(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1990 || y > 2100) return null;
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  // Rejects dates like 31 Feb
  return new Date(`${iso}T00:00:00Z`).getUTCDate() === d ? iso : null;
}

/** Indian statements write day first: 03/04/26, 03-04-2026, 03 Apr 2026, 03-Apr-26, plus ISO and Excel serials. */
function parseDate(v: unknown): string | null {
  if (typeof v === "number") {
    // Excel serial date (days since 1899-12-30)
    if (v < 30000 || v > 80000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000);
    return d.toISOString().slice(0, 10);
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return toIso(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{2,4})\b/);
  if (m) return toIso(+m[3], +m[2], +m[1]);
  m = s.match(/^(\d{1,2})[\-/ ]?([a-z]{3,4})[a-z]*[\-/ ,]*(\d{2,4})\b/i);
  if (m && MONTHS[m[2].toLowerCase()]) return toIso(+m[3], MONTHS[m[2].toLowerCase()], +m[1]);
  // Month first, as PhonePe and Paytm write it: "Nov 03, 2026"
  m = s.match(/^([a-z]{3,4})[a-z]*\.?[\-/ ](\d{1,2})[\-/ ,]+(\d{2,4})\b/i);
  if (m && MONTHS[m[1].toLowerCase()]) return toIso(+m[3], MONTHS[m[1].toLowerCase()], +m[2]);
  return null;
}
