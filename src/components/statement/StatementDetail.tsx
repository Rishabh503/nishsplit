"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, EyeOff, Loader2, Sparkles, Trash2 } from "lucide-react";
import { ExpenseCategory, StatementSession, StatementTxn } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDayLabel, round2 } from "@/lib/personal";
import { guessCategory, summarizeStatement, txnsInWindow, windowRange } from "@/lib/statement";

type Filter = "all" | "uncategorized" | "ignored" | ExpenseCategory;

/** Short chip labels for picking a category in one tap. */
const CATEGORY_CHIPS: { name: ExpenseCategory; label: string }[] = [
  { name: "Food & Dining", label: "🍔 Food" },
  { name: "Travel & Cab", label: "🚕 Travel" },
  { name: "Rent & Stay", label: "🏨 Stay" },
  { name: "Groceries", label: "🛒 Groceries" },
  { name: "Shopping", label: "🛍️ Shopping" },
  { name: "Entertainment", label: "🎬 Fun" },
  { name: "Bills & Utilities", label: "💡 Bills" },
  { name: "Health & Wellness", label: "💊 Health" },
  { name: "Gifts", label: "🎁 Gifts" },
  { name: "Other", label: "📦 Other" },
];

interface DaySummary {
  date: string;
  total: number;
  count: number;
  uncategorized: number;
}

interface StatementDetailProps {
  session: StatementSession;
  onBack: () => void;
  onSave: (s: StatementSession) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
}

export function StatementDetail({ session, onBack, onSave, onDelete }: StatementDetailProps) {
  const [draft, setDraft] = useState(session);
  const [daysText, setDaysText] = useState(String(session.days));
  const [filter, setFilter] = useState<Filter>("all");
  // Start on the first day that still needs categories, so it reads like working through the trip
  const [day, setDay] = useState<string>(() => {
    const pending = txnsInWindow(session.txns, session.endDate, session.days)
      .filter((t) => !t.ignored && !t.category)
      .map((t) => t.date)
      .sort();
    return pending[0] ?? "all";
  });
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const firstRender = useRef(true);
  const dayStrip = useRef<HTMLDivElement>(null);

  // Save a moment after the last change so tapping through categories is one request
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState("saving");
    const t = setTimeout(async () => setSaveState((await onSave(draft)) ? "saved" : "error"), 700);
    return () => clearTimeout(t);
  }, [draft, onSave]);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  // Keep the selected day chip in view
  useEffect(() => {
    dayStrip.current?.querySelector<HTMLElement>(`[data-day="${day}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [day]);

  const update = (patch: Partial<StatementSession>) => setDraft((d) => ({ ...d, ...patch }));
  const updateTxn = (id: string, patch: Partial<StatementTxn>) =>
    setDraft((d) => ({ ...d, txns: d.txns.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));

  const { firstDate, lastDate } = useMemo(() => {
    const dates = draft.txns.map((t) => t.date).sort();
    return { firstDate: dates[0] ?? "", lastDate: dates[dates.length - 1] ?? "" };
  }, [draft.txns]);

  const inWindow = useMemo(() => txnsInWindow(draft.txns, draft.endDate, draft.days), [draft.txns, draft.endDate, draft.days]);
  const summary = useMemo(() => summarizeStatement(inWindow), [inWindow]);
  const range = windowRange(draft.endDate, draft.days);

  // Days that have transactions, oldest first
  const days = useMemo(() => {
    const map = new Map<string, DaySummary>();
    for (const t of inWindow) {
      const d = map.get(t.date) ?? { date: t.date, total: 0, count: 0, uncategorized: 0 };
      if (!t.ignored) {
        d.total = round2(d.total + t.amount);
        d.count++;
        if (!t.category) d.uncategorized++;
      }
      map.set(t.date, d);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [inWindow]);

  // The window may have moved off the selected day
  const dayIdx = days.findIndex((d) => d.date === day);
  const selectedDay = dayIdx === -1 ? null : days[dayIdx];
  const dayTxns = useMemo(
    () => (selectedDay ? inWindow.filter((t) => t.date === selectedDay.date) : inWindow),
    [inWindow, selectedDay]
  );

  const visible = useMemo(() => {
    const list =
      filter === "all"
        ? dayTxns
        : filter === "ignored"
        ? dayTxns.filter((t) => t.ignored)
        : filter === "uncategorized"
        ? dayTxns.filter((t) => !t.ignored && !t.category)
        : dayTxns.filter((t) => !t.ignored && t.category === filter);
    // Oldest first; ids follow time within a day (the parser stores statements oldest first)
    return [...list].sort((a, b) => (a.date === b.date ? Number(a.id) - Number(b.id) : a.date.localeCompare(b.date)));
  }, [dayTxns, filter]);

  const groups = useMemo(() => {
    const byDay: { date: string; items: StatementTxn[]; total: number }[] = [];
    for (const t of visible) {
      const last = byDay[byDay.length - 1];
      if (last?.date === t.date) last.items.push(t);
      else byDay.push({ date: t.date, items: [t], total: 0 });
      byDay[byDay.length - 1].total += t.ignored ? 0 : t.amount;
    }
    return byDay;
  }, [visible]);

  const dayUncategorized = dayTxns.filter((t) => !t.ignored && !t.category).length;
  const dayNumber = (date: string) => days.findIndex((d) => d.date === date) + 1;

  // Only fills in transactions that have no category yet, so manual picks are kept
  const autoCategorize = (scope: StatementTxn[]) => {
    const ids = new Set(scope.filter((t) => !t.category && !t.ignored).map((t) => t.id));
    setDraft((d) => ({
      ...d,
      txns: d.txns.map((t) => (ids.has(t.id) ? { ...t, category: guessCategory(t.description) ?? "Other" } : t)),
    }));
  };

  const setDays = (text: string) => {
    setDaysText(text);
    const n = Math.trunc(Number(text));
    if (n >= 1 && n <= 3660) update({ days: n });
  };

  const goToDay = (date: string) => {
    setDay(date);
    setFilter("all");
  };

  const handleDelete = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    await onDelete(draft.id);
  };

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    ...(dayUncategorized > 0 ? [{ id: "uncategorized" as const, label: `To do · ${dayUncategorized}` }] : []),
    ...(dayTxns.some((t) => t.ignored) ? [{ id: "ignored" as const, label: "My transfers" }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="Back"
          className="size-9 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300 active:scale-95 transition"
        >
          <ArrowLeft className="size-4" />
        </button>
        <input
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          onBlur={() => !draft.name.trim() && update({ name: session.name })}
          aria-label="Analysis name"
          className="min-w-0 flex-1 bg-transparent text-xl font-bold tracking-tight outline-none border-b border-transparent focus:border-neutral-300 dark:focus:border-neutral-700"
        />
        <span className="shrink-0 text-[11px] font-medium text-neutral-500 flex items-center gap-1">
          {saveState === "saving" && <Loader2 className="size-3 animate-spin" />}
          {saveState === "saved" && <Check className="size-3" />}
          {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : <span className="text-rose-600">Not saved</span>}
        </span>
      </div>

      {/* Window */}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Days</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={daysText}
            onChange={(e) => setDays(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Ending on</span>
          <input
            type="date"
            value={draft.endDate}
            min={firstDate}
            onChange={(e) => e.target.value && update({ endDate: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      {/* Total */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm p-5 shadow-xs">
        <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Total spent</div>
        <div className="text-4xl font-extrabold tracking-tight tabular-nums">{formatCurrency(summary.total)}</div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {summary.count} {summary.count === 1 ? "transaction" : "transactions"} · {formatDayLabel(range.start)} to {formatDayLabel(range.end)}
        </p>
        {summary.ignoredCount > 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            {formatCurrency(summary.ignoredTotal)} in {summary.ignoredCount} own transfers left out
          </p>
        )}
        {(range.start < firstDate || range.end > lastDate) && (
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
            The statement only covers {firstDate} to {lastDate}
          </p>
        )}

        {/* Category breakdown for the whole window */}
        {summary.count > 0 && (
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">By category</span>
              {summary.uncategorized > 0 && (
                <button
                  onClick={() => autoCategorize(inWindow)}
                  className="h-7 px-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition"
                >
                  <Sparkles className="size-3" />
                  Categorise all {summary.uncategorized}
                </button>
              )}
            </div>
            {summary.byCategory.map((c) => {
              const id: Filter = c.category ?? "uncategorized";
              const pct = summary.total > 0 ? Math.round((c.total / summary.total) * 100) : 0;
              return (
                <button
                  key={id}
                  onClick={() => {
                    setDay("all");
                    setFilter(filter === id && day === "all" ? "all" : id);
                  }}
                  className={`w-full text-left space-y-1 rounded-lg -mx-1.5 px-1.5 py-1 transition ${filter === id && !selectedDay ? "bg-neutral-100 dark:bg-neutral-900" : ""}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${c.category ? "" : "text-neutral-400 italic"}`}>
                      {c.category ?? "Uncategorised"} <span className="font-normal text-neutral-400">· {c.count}</span>
                    </span>
                    <span className="tabular-nums font-semibold">
                      {formatCurrency(c.total)} <span className="font-normal text-neutral-400">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${c.category ? "bg-neutral-900 dark:bg-neutral-100" : "bg-neutral-400 dark:bg-neutral-600"}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Day strip */}
      {days.length > 0 && (
        <div ref={dayStrip} className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          <DayChip active={!selectedDay} onClick={() => goToDay("all")} dataDay="all" title="All days" sub={`${days.length} days`} total={summary.total} pending={summary.uncategorized} />
          {days.map((d, i) => (
            <DayChip
              key={d.date}
              dataDay={d.date}
              active={selectedDay?.date === d.date}
              onClick={() => goToDay(d.date)}
              title={`Day ${i + 1}`}
              sub={shortDate(d.date)}
              total={d.total}
              pending={d.uncategorized}
            />
          ))}
        </div>
      )}

      {/* Selected day header */}
      {selectedDay && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => dayIdx > 0 && goToDay(days[dayIdx - 1].date)}
            disabled={dayIdx <= 0}
            aria-label="Previous day"
            className="size-9 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex-1 min-w-0 text-center">
            <div className="text-sm font-bold">
              Day {dayIdx + 1} · {longDate(selectedDay.date)}
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums">
              {formatCurrency(selectedDay.total)} · {selectedDay.count} {selectedDay.count === 1 ? "payment" : "payments"}
              {dayUncategorized === 0 && selectedDay.count > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · all done ✓</span>}
            </div>
          </div>
          <button
            onClick={() => dayIdx < days.length - 1 && goToDay(days[dayIdx + 1].date)}
            disabled={dayIdx >= days.length - 1}
            aria-label="Next day"
            className="size-9 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center disabled:opacity-30 active:scale-95 transition"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1.5 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`${chipClass} ${filter === f.id ? chipActive : ""}`}>
              {f.label}
            </button>
          ))}
          {filter !== "all" && filter !== "ignored" && filter !== "uncategorized" && (
            <button onClick={() => setFilter("all")} className={`${chipClass} ${chipActive}`}>
              {filter} ✕
            </button>
          )}
        </div>
        {selectedDay && dayUncategorized > 0 && (
          <button
            onClick={() => autoCategorize(dayTxns)}
            className="shrink-0 h-8 px-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition"
          >
            <Sparkles className="size-3" />
            Categorise day
          </button>
        )}
      </div>
      <p className="-mt-3 px-1 text-[11px] text-neutral-500 dark:text-neutral-400">
        Tap a category for each payment. Tap <EyeOff className="inline size-3" /> on transfers between your own accounts.
      </p>

      {/* Transactions */}
      {groups.length === 0 ? (
        <div className="text-center py-10 px-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800 text-sm text-neutral-500">
          No transactions here
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.date} className="space-y-2">
            {!selectedDay && (
              <button onClick={() => goToDay(g.date)} className="w-full flex items-center justify-between px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                <span>
                  Day {dayNumber(g.date)} · {longDate(g.date)}
                </span>
                <span className="tabular-nums">{formatCurrency(round2(g.total))}</span>
              </button>
            )}
            {g.items.map((t) => (
              <TxnRow key={t.id} txn={t} onChange={(patch) => updateTxn(t.id, patch)} />
            ))}
          </section>
        ))
      )}

      {/* Next day shortcut once this one is done */}
      {selectedDay && dayUncategorized === 0 && dayIdx < days.length - 1 && (
        <button
          onClick={() => goToDay(days[dayIdx + 1].date)}
          className="w-full h-11 rounded-xl bg-black text-white dark:bg-white dark:text-black text-sm font-bold flex items-center justify-center gap-1 active:scale-[0.99] transition"
        >
          Next: Day {dayIdx + 2} · {shortDate(days[dayIdx + 1].date)}
          <ChevronRight className="size-4" />
        </button>
      )}

      <button
        onClick={handleDelete}
        className={`w-full h-11 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
          confirmDelete ? "bg-rose-600 border-rose-600 text-white" : "border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
        }`}
      >
        <Trash2 className="size-4" />
        {confirmDelete ? "Tap again to delete" : "Delete this analysis"}
      </button>
      <p className="text-center text-[11px] text-neutral-400">
        {draft.fileName} · {draft.txns.length} debits from {firstDate} to {lastDate}
      </p>
    </div>
  );
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`));
const longDate = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${iso}T00:00:00`));

function DayChip({
  active,
  onClick,
  dataDay,
  title,
  sub,
  total,
  pending,
}: {
  active: boolean;
  onClick: () => void;
  dataDay: string;
  title: string;
  sub: string;
  total: number;
  pending: number;
}) {
  return (
    <button
      data-day={dataDay}
      onClick={onClick}
      className={`relative shrink-0 min-w-[84px] px-3 py-2 rounded-xl border text-left transition active:scale-95 ${
        active
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
          : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
      }`}
    >
      <div className="text-[11px] font-bold">{title}</div>
      <div className={`text-[10px] ${active ? "opacity-70" : "text-neutral-500 dark:text-neutral-400"}`}>{sub}</div>
      <div className="text-xs font-semibold tabular-nums mt-0.5">{formatCurrency(total)}</div>
      {pending > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
          {pending}
        </span>
      ) : (
        total > 0 && (
          <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="size-3" />
          </span>
        )
      )}
    </button>
  );
}

function TxnRow({ txn: t, onChange }: { txn: StatementTxn; onChange: (patch: Partial<StatementTxn>) => void }) {
  return (
    <div
      className={`rounded-2xl border bg-white dark:bg-neutral-950 p-3.5 shadow-xs transition ${
        t.ignored
          ? "opacity-50 border-neutral-200 dark:border-neutral-800"
          : t.category
          ? "border-neutral-200 dark:border-neutral-800"
          : "border-amber-300 dark:border-amber-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium break-words text-neutral-900 dark:text-neutral-100 ${t.ignored ? "line-through" : ""}`}>
            {t.description || "No description"}
          </div>
        </div>
        <div className="font-bold text-sm tabular-nums shrink-0">{formatCurrency(t.amount)}</div>
      </div>

      {!t.ignored && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {CATEGORY_CHIPS.map((c) => (
            <button
              key={c.name}
              onClick={() => onChange({ category: t.category === c.name ? null : c.name })}
              className={`h-7 px-2.5 rounded-full border text-[11px] font-semibold transition active:scale-95 ${
                t.category === c.name
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-2">
        <button
          onClick={() => onChange({ ignored: !t.ignored })}
          className={`h-7 px-2.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition ${
            t.ignored
              ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
              : "border-transparent text-neutral-500 dark:text-neutral-400"
          }`}
        >
          <EyeOff className="size-3" />
          {t.ignored ? "Include again" : "My own transfer"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "mt-1 w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm outline-none focus:border-neutral-900 dark:focus:border-neutral-300 transition";
const chipClass =
  "px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-white/60 dark:bg-neutral-950/60";
const chipActive = "!bg-black !text-white !border-black dark:!bg-white dark:!text-black dark:!border-white";
