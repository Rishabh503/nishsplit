"use client";

import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import { Loader2, Lock, Plus, Receipt, RefreshCw } from "lucide-react";
import { PersonalExpense, PersonalExpenseInput, UserPublicProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDayLabel, round2, summarizePersonal, todayISO } from "@/lib/personal";
import { PersonalSummaryCard } from "./PersonalSummaryCard";
import { PersonalExpenseItem } from "./PersonalExpenseItem";
import { PersonalExpenseSheet } from "./PersonalExpenseSheet";

type Filter = "all" | "upi" | "cash" | "splits";

export interface PersonalViewHandle {
  openAdd: () => void;
}

interface PersonalViewProps {
  ref?: React.Ref<PersonalViewHandle>;
  authToken: string;
  user: UserPublicProfile;
}

export function PersonalView({ ref, authToken, user }: PersonalViewProps) {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sheet, setSheet] = useState<{ open: boolean; editing: PersonalExpense | null }>({ open: false, editing: null });
  // Read on the client so "today" follows the phone's date
  const [today, setToday] = useState("");

  const api = useCallback(
    (path: string, init?: RequestInit) =>
      fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, ...init?.headers },
      }),
    [authToken]
  );

  const load = useCallback(async () => {
    try {
      const res = await api("/api/personal", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExpenses(data.data);
      setStatus("ready");
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't load your expenses");
      setStatus("error");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only date
    setToday(todayISO());
    load();
  }, [load]);

  useImperativeHandle(ref, () => ({ openAdd: () => setSheet({ open: true, editing: null }) }), []);

  const summary = useMemo(() => summarizePersonal(expenses), [expenses]);
  const todaySpent = useMemo(
    () => round2(expenses.filter((e) => e.spentOn === today).reduce((s, e) => s + e.myShare, 0)),
    [expenses, today]
  );
  const pendingCount = expenses.filter((e) => e.isSplit && !e.settled).length;

  const visible = useMemo(() => {
    if (filter === "splits") {
      // Pending splits first, then settled ones
      return expenses.filter((e) => e.isSplit).sort((a, b) => Number(a.settled) - Number(b.settled));
    }
    return filter === "all" ? expenses : expenses.filter((e) => e.method === filter);
  }, [expenses, filter]);

  const groups = useMemo(() => {
    if (filter === "splits") {
      return [
        { key: "pending", label: `Pending (${pendingCount})`, items: visible.filter((e) => !e.settled), total: null },
        { key: "settled", label: "Settled", items: visible.filter((e) => e.settled), total: null },
      ].filter((g) => g.items.length > 0);
    }
    const byDay: { key: string; label: string; items: PersonalExpense[]; total: number | null }[] = [];
    for (const e of visible) {
      const last = byDay[byDay.length - 1];
      if (last?.key === e.spentOn) {
        last.items.push(e);
        last.total = round2((last.total ?? 0) + e.myShare);
      } else {
        byDay.push({ key: e.spentOn, label: formatDayLabel(e.spentOn), items: [e], total: e.myShare });
      }
    }
    return byDay;
  }, [visible, filter, pendingCount]);

  const saveExpense = async (input: PersonalExpenseInput): Promise<string | null> => {
    const editing = sheet.editing;
    try {
      const res = await api(editing ? `/api/personal/${editing.id}` : "/api/personal", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!data.success) return data.error || "Couldn't save";
    } catch {
      return "No connection. Try again.";
    }
    setSheet({ open: false, editing: null });
    await load();
    return null;
  };

  const deleteExpense = async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setSheet({ open: false, editing: null });
    const res = await api(`/api/personal/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) await load();
  };

  const toggleSettled = async (e: PersonalExpense) => {
    const settled = !e.settled;
    setExpenses((prev) => prev.map((x) => (x.id === e.id ? { ...x, settled } : x)));
    const res = await api(`/api/personal/${e.id}`, { method: "PATCH", body: JSON.stringify({ settled }) }).catch(() => null);
    if (!res?.ok) setExpenses((prev) => prev.map((x) => (x.id === e.id ? { ...x, settled: e.settled } : x)));
  };

  const openAdd = () => setSheet({ open: true, editing: null });
  const openEdit = (e: PersonalExpense) => setSheet({ open: true, editing: e });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "upi", label: "UPI" },
    { id: "cash", label: "Cash" },
    { id: "splits", label: pendingCount > 0 ? `Splits · ${pendingCount}` : "Splits" },
  ];

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <Lock className="size-3" />
            <span>Only you see this</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {user.avatar} My Spends
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Your own cash &amp; UPI spending, separate from the duo split</p>
        </div>
        <button
          onClick={load}
          aria-label="Refresh"
          className="size-9 shrink-0 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300 active:scale-95 transition"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-16 text-xs font-medium text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Loading your spends...</span>
        </div>
      )}

      {status === "error" && (
        <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-sm text-rose-700 dark:text-rose-400">
          {error}.{" "}
          <button onClick={load} className="underline font-semibold">
            Try again
          </button>
        </div>
      )}

      {status === "ready" && (
        <>
          <PersonalSummaryCard summary={summary} todaySpent={todaySpent} onOpenSplits={() => setFilter("splits")} />

          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap transition ${
                    filter === f.id
                      ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                      : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 bg-white/60 dark:bg-neutral-950/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={openAdd}
              className="shrink-0 h-8 px-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
            >
              <Plus className="size-3.5" />
              Add
            </button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
              <Receipt className="size-6 mx-auto text-neutral-400 mb-2" />
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {filter === "splits" ? "No split expenses yet" : "Nothing logged yet"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Tap Add to log a cash or UPI expense</p>
              <button onClick={openAdd} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold">
                Add expense
              </button>
            </div>
          ) : (
            groups.map((g) => (
              <section key={g.key} className="space-y-2">
                <div className="flex items-center justify-between px-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  <span>{g.label}</span>
                  {g.total !== null && <span className="tabular-nums">{formatCurrency(g.total)}</span>}
                </div>
                {g.items.map((e) => (
                  <PersonalExpenseItem
                    key={e.id}
                    expense={e}
                    onEdit={openEdit}
                    onDelete={(x) => deleteExpense(x.id)}
                    onToggleSettled={toggleSettled}
                  />
                ))}
              </section>
            ))
          )}
        </>
      )}

      {sheet.open && (
        <PersonalExpenseSheet
          key={sheet.editing?.id ?? "new"}
          initial={sheet.editing}
          onClose={() => setSheet({ open: false, editing: null })}
          onSave={saveExpense}
          onDelete={deleteExpense}
        />
      )}
    </div>
  );
}
