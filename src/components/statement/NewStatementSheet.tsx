"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, Loader2, Upload, X } from "lucide-react";
import { StatementSessionInput, StatementTxn } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { parseStatementFile } from "@/lib/statementParse";
import { shiftDate, summarizeStatement, txnsInWindow } from "@/lib/statement";

const QUICK_DAYS = [3, 7, 15, 30, 60, 90];

interface NewStatementSheetProps {
  onClose: () => void;
  onCreate: (input: StatementSessionInput) => Promise<string | null>;
}

export function NewStatementSheet({ onClose, onCreate }: NewStatementSheetProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [days, setDays] = useState("7");
  const [file, setFile] = useState<{ name: string; txns: StatementTxn[] } | null>(null);
  const [endDate, setEndDate] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayCount = Math.trunc(Number(days)) || 0;
  const firstDate = file?.txns.reduce((min, t) => (t.date < min ? t.date : min), file.txns[0].date) ?? "";
  const lastDate = file?.txns.reduce((max, t) => (t.date > max ? t.date : max), file.txns[0].date) ?? "";
  const preview = file && endDate && dayCount > 0 ? summarizeStatement(txnsInWindow(file.txns, endDate, dayCount)) : null;

  async function handleFile(f: File | undefined) {
    if (!f) return;
    setError(null);
    setParsing(true);
    try {
      const txns = await parseStatementFile(f);
      setFile({ name: f.name, txns });
      // Default the window to end on the statement's last transaction
      setEndDate(txns.reduce((max, t) => (t.date > max ? t.date : max), txns[0].date));
      if (!name) setName(f.name.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setFile(null);
      setError((err instanceof Error && err.message) || "Couldn't read this file");
    }
    setParsing(false);
  }

  async function handleCreate() {
    setError(null);
    if (!file) return setError("Upload a statement first");
    if (!name.trim()) return setError("Give this analysis a name");
    if (dayCount < 1) return setError("Enter how many days to analyse");
    setSaving(true);
    const err = await onCreate({ name, fileName: file.name, days: dayCount, endDate, txns: file.txns });
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar rounded-t-3xl border border-b-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 animate-sheet-up">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-5 pt-3 pb-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">New analysis</h2>
            <button onClick={onClose} aria-label="Close" className="size-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5">
          {/* File */}
          <input
            ref={fileInput}
            type="file"
            accept=".csv,.xls,.xlsx,.txt"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={parsing}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 text-left active:scale-[0.99] transition"
          >
            <div className="size-10 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              {parsing ? <Loader2 className="size-4 animate-spin" /> : file ? <FileSpreadsheet className="size-4" /> : <Upload className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{file ? file.name : "Upload bank statement"}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {file
                  ? `${file.txns.length} debits · ${firstDate} to ${lastDate}`
                  : "CSV, XLS or XLSX. Read on your phone, never uploaded raw."}
              </div>
            </div>
          </button>

          <Field label="Name">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa trip" className={inputClass} />
          </Field>

          <Field label="Days to analyse">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={inputClass}
            />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2">
              {QUICK_DAYS.map((d) => (
                <button key={d} onClick={() => setDays(String(d))} className={cn(chipClass, "shrink-0", dayCount === d && chipActive)}>
                  {d} days
                </button>
              ))}
            </div>
          </Field>

          {file && (
            <Field label="Ending on">
              <input
                type="date"
                value={endDate}
                min={firstDate}
                onChange={(e) => e.target.value && setEndDate(e.target.value)}
                className={inputClass}
              />
              {dayCount > 0 && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                  {shiftDate(endDate, -(dayCount - 1))} to {endDate}
                </p>
              )}
            </Field>
          )}

          {preview && (
            <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Spent in these days</div>
              <div className="text-2xl font-extrabold tabular-nums mt-0.5">{formatCurrency(preview.total)}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                {preview.count} {preview.count === 1 ? "transaction" : "transactions"}. You can mark your own transfers next.
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

          <button
            onClick={handleCreate}
            disabled={saving || parsing}
            className="w-full h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-bold active:scale-[0.99] transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "Analyse"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm outline-none focus:border-neutral-900 dark:focus:border-neutral-300 transition";
const chipClass =
  "px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 transition";
const chipActive = "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{label}</div>
      {children}
    </div>
  );
}
