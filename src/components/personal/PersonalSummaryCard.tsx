"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, Smartphone } from "lucide-react";
import { PersonalSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface PersonalSummaryCardProps {
  summary: PersonalSummary;
  todaySpent: number;
  onOpenSplits: () => void;
}

export function PersonalSummaryCard({ summary, todaySpent, onOpenSplits }: PersonalSummaryCardProps) {
  const outTotal = summary.cashOut + summary.upiOut || 1;
  const cashPercent = Math.round((summary.cashOut / outTotal) * 100);
  const hasPending = summary.toReceive > 0 || summary.toPay > 0;

  return (
    <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm p-5 shadow-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Total spent
        </span>
        <span className="px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
          Today {formatCurrency(todaySpent)}
        </span>
      </div>
      <div className="text-4xl font-extrabold tracking-tight tabular-nums">{formatCurrency(summary.totalSpent)}</div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
        Your share across {summary.count} {summary.count === 1 ? "expense" : "expenses"}
      </p>

      <div className="grid grid-cols-2 gap-2.5 mt-5">
        <MethodTile icon={<Banknote className="size-4" />} label="Cash" amount={summary.cashOut} />
        <MethodTile icon={<Smartphone className="size-4" />} label="UPI" amount={summary.upiOut} />
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${cashPercent}%` }} className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500" />
          <div style={{ width: `${100 - cashPercent}%` }} className="h-full bg-neutral-400 dark:bg-neutral-600 transition-all duration-500" />
        </div>
        <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>Cash {summary.cashOut + summary.upiOut > 0 ? cashPercent : 0}%</span>
          <span>UPI {summary.cashOut + summary.upiOut > 0 ? 100 - cashPercent : 0}%</span>
        </div>
      </div>

      {hasPending && (
        <button
          onClick={onOpenSplits}
          className="mt-4 w-full grid grid-cols-2 gap-2.5 text-left active:scale-[0.99] transition"
        >
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              <ArrowDownLeft className="size-3" /> You&apos;ll get
            </div>
            <div className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatCurrency(summary.toReceive)}
            </div>
          </div>
          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              <ArrowUpRight className="size-3" /> You owe
            </div>
            <div className="text-lg font-bold tabular-nums text-rose-700 dark:text-rose-400">
              {formatCurrency(summary.toPay)}
            </div>
          </div>
        </button>
      )}
    </section>
  );
}

function MethodTile({ icon, label, amount }: { icon: React.ReactNode; label: string; amount: number }) {
  return (
    <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
      <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-xl font-bold tracking-tight tabular-nums mt-1">{formatCurrency(amount)}</div>
      <div className="text-[10px] text-neutral-400 dark:text-neutral-500">paid out</div>
    </div>
  );
}
