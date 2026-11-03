"use client";

import React, { useCallback, useEffect, useImperativeHandle, useState } from "react";
import { ChevronRight, FileSpreadsheet, Loader2, Lock, Plus } from "lucide-react";
import { StatementSession, StatementSessionInput } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDayLabel } from "@/lib/personal";
import { summarizeStatement, txnsInWindow, windowRange } from "@/lib/statement";
import { NewStatementSheet } from "./NewStatementSheet";
import { StatementDetail } from "./StatementDetail";

export interface StatementViewHandle {
  openNew: () => void;
}

interface StatementViewProps {
  ref?: React.Ref<StatementViewHandle>;
  authToken: string;
}

export function StatementView({ ref, authToken }: StatementViewProps) {
  const [sessions, setSessions] = useState<StatementSession[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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
      const res = await api("/api/statements", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSessions(data.data);
      setStatus("ready");
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't load your analyses");
      setStatus("error");
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the fetch resolves
    load();
  }, [load]);

  useImperativeHandle(ref, () => ({ openNew: () => setCreating(true) }), []);

  const create = async (input: StatementSessionInput): Promise<string | null> => {
    try {
      const res = await api("/api/statements", { method: "POST", body: JSON.stringify(input) });
      const data = await res.json();
      if (!data.success) return data.error || "Couldn't save";
      setSessions((prev) => [data.data, ...prev]);
      setCreating(false);
      setOpenId(data.data.id);
      return null;
    } catch {
      return "No connection. Try again.";
    }
  };

  const save = useCallback(
    async (s: StatementSession): Promise<boolean> => {
      const name = s.name.trim();
      if (!name) return false;
      try {
        const res = await api(`/api/statements/${s.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...s, name }),
        });
        const data = await res.json();
        if (!data.success) return false;
        setSessions((prev) => prev.map((x) => (x.id === s.id ? data.data : x)));
        return true;
      } catch {
        return false;
      }
    },
    [api]
  );

  const remove = async (id: string) => {
    const res = await api(`/api/statements/${id}`, { method: "DELETE" }).catch(() => null);
    if (res?.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setOpenId(null);
    }
  };

  const open = sessions.find((s) => s.id === openId);
  if (open) {
    // Keyed by id so the detail keeps its own draft while saves update the list underneath
    return <StatementDetail key={open.id} session={open} onBack={() => setOpenId(null)} onSave={save} onDelete={remove} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <Lock className="size-3" />
            <span>Only you see this</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Statement analysis</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Upload a bank statement, pick the days, see where it went</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="shrink-0 h-8 px-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-semibold flex items-center gap-1 active:scale-95 transition"
        >
          <Plus className="size-3.5" />
          New
        </button>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-16 text-xs font-medium text-neutral-500">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Loading your analyses...</span>
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

      {status === "ready" &&
        (sessions.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <FileSpreadsheet className="size-6 mx-auto text-neutral-400 mb-2" />
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No analyses yet</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Download your statement as CSV or Excel and upload it here</p>
            <button onClick={() => setCreating(true)} className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold">
              New analysis
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const summary = summarizeStatement(txnsInWindow(s.txns, s.endDate, s.days));
              const range = windowRange(s.endDate, s.days);
              return (
                <button
                  key={s.id}
                  onClick={() => setOpenId(s.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-left shadow-xs active:scale-[0.99] transition"
                >
                  <div className="size-10 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
                    <FileSpreadsheet className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                      {s.days} {s.days === 1 ? "day" : "days"} · {formatDayLabel(range.start)} to {formatDayLabel(range.end)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold tabular-nums">{formatCurrency(summary.total)}</div>
                    {summary.uncategorized > 0 && (
                      <div className="text-[11px] text-neutral-400">{summary.uncategorized} uncategorised</div>
                    )}
                  </div>
                  <ChevronRight className="size-4 text-neutral-400 shrink-0" />
                </button>
              );
            })}
          </div>
        ))}

      {creating && <NewStatementSheet onClose={() => setCreating(false)} onCreate={create} />}
    </div>
  );
}
