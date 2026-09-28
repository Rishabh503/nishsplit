"use client";

import React from "react";
import { UserPublicProfile, AppSettings, BalanceSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpRight, ArrowDownLeft, CheckCircle2, Handshake, Plus, Users } from "lucide-react";

interface BalanceCardProps {
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  balance: BalanceSummary;
  onSettleUp: () => void;
  onAddExpense: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  settings,
  user,
  partner,
  balance,
  onSettleUp,
  onAddExpense,
}) => {
  const sym = settings.currencySymbol || "₹";
  const partnerName = partner ? partner.name : "Partner";

  // Balance from the active user's perspective:
  const userNet = balance.netBalance;
  const isSettled = Math.abs(userNet) < 0.01;
  const isOwed = userNet > 0.01;
  const owesOther = userNet < -0.01;

  const totalPool = balance.user1TotalPaid + balance.user2TotalPaid || 1;
  const user1Percent = Math.round((balance.user1TotalPaid / totalPool) * 100);
  const user2Percent = 100 - user1Percent;

  return (
    <section className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm p-5 sm:p-6 shadow-xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700">
      {/* Hero Profile & Greeting */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <span>Duo Shared Space</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Hi, {user.name}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {partner ? (
              <>
                Sharing expenses with <strong className="text-neutral-800 dark:text-neutral-200">{partner.name}</strong>
              </>
            ) : (
              <>Waiting for your partner to join this duo space</>
            )}
          </p>
        </div>

        {/* User Avatar */}
        <div className="size-14 sm:size-16 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-2xl sm:text-3xl shadow-xs ring-4 ring-neutral-100 dark:ring-neutral-900 shrink-0">
          {user.avatar}
        </div>
      </div>

      {/* Net Balance Status */}
      <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>{isSettled ? "🐾 Status" : isOwed ? "🐼 Bubu Status" : "🐻 Dudu Status"}</span>
            <span className="text-neutral-300 dark:text-neutral-700">•</span>
            <span>
              {isSettled
                ? "All Settled"
                : isOwed
                ? `${partnerName} owes you`
                : `You owe ${partnerName}`}
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
              isSettled
                ? "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                : isOwed
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
            }`}
          >
            {isSettled ? (
              <>
                <CheckCircle2 className="size-3" />
                <span>Settled up</span>
              </>
            ) : isOwed ? (
              <>
                <ArrowDownLeft className="size-3" />
                <span>You get</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="size-3" />
                <span>Pay up 🐾</span>
              </>
            )}
          </span>
        </div>

        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          {isSettled ? "₹0.00" : formatCurrency(Math.abs(userNet), sym)}
        </div>
      </div>

      {/* Ratio Bar */}
      <div className="space-y-1.5 mb-5 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex justify-between font-medium">
          <span>
            {user.avatar} You: <strong className="text-neutral-900 dark:text-neutral-100">
              {formatCurrency(user.id === "user1" ? balance.user1TotalPaid : balance.user2TotalPaid, sym)}
            </strong>
          </span>
          <span>
            {partner ? partner.avatar : "👩🏻‍💼"} {partnerName}: <strong className="text-neutral-900 dark:text-neutral-100">
              {formatCurrency(user.id === "user1" ? balance.user2TotalPaid : balance.user1TotalPaid, sym)}
            </strong>
          </span>
        </div>
        <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${user.id === "user1" ? user1Percent : user2Percent}%` }}
            className="h-full bg-neutral-900 dark:bg-neutral-100 transition-all duration-500"
          />
          <div
            style={{ width: `${user.id === "user1" ? user2Percent : user1Percent}%` }}
            className="h-full bg-neutral-400 dark:bg-neutral-600 transition-all duration-500"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onSettleUp}
          disabled={isSettled}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition border ${
            isSettled
              ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800 cursor-not-allowed"
              : "bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 border-transparent shadow-xs active:scale-[0.98]"
          }`}
        >
          <Handshake className="size-4" />
          <span>Settle Up</span>
        </button>

        <button
          onClick={onAddExpense}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-800 transition active:scale-[0.98]"
        >
          <Plus className="size-4" />
          <span>Add Expense</span>
        </button>
      </div>
    </section>
  );
};
