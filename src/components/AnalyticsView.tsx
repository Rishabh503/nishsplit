"use client";

import React from "react";
import { Expense, Settlement, UserPublicProfile, AppSettings, BalanceSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Award, Wallet, PieChart, Users } from "lucide-react";

interface AnalyticsViewProps {
  expenses: Expense[];
  settlements: Settlement[];
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  balance: BalanceSummary;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  settlements,
  settings,
  user,
  partner,
  balance,
}) => {
  const sym = settings.currencySymbol || "₹";
  const partnerName = partner ? partner.name : "Partner";
  const partnerAvatar = partner ? partner.avatar : "👩🏻‍💼";

  const isUser1 = user.id === "user1";
  const myTotalPaid = isUser1 ? balance.user1TotalPaid : balance.user2TotalPaid;
  const partnerTotalPaid = isUser1 ? balance.user2TotalPaid : balance.user1TotalPaid;

  const totalPaid = myTotalPaid + partnerTotalPaid || 1;
  const myPaidPercent = Math.round((myTotalPaid / totalPaid) * 100);
  const partnerPaidPercent = 100 - myPaidPercent;

  // Category totals
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  const sortedCategories = Object.entries(categoryTotals).sort(
    ([, a], [, b]) => b - a
  );

  const highestExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  const avgExpense = expenses.length > 0 ? balance.totalSpent / expenses.length : 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-20">
      <div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Insights & Stats</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Spending breakdown and split statistics</p>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
            <Wallet className="size-3.5" />
            <span>Total Spent</span>
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(balance.totalSpent, sym)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">
            Across {expenses.length} expenses
          </span>
        </div>

        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-medium mb-1">
            <TrendingUp className="size-3.5" />
            <span>Average / Bill</span>
          </div>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(avgExpense, sym)}
          </p>
          <span className="text-[11px] text-neutral-400 mt-0.5 block">Per shared bill</span>
        </div>
      </div>

      {/* Spending Contribution Comparison */}
      <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Total Paid Contribution
          </h3>
          <span className="text-[11px] text-neutral-500">Duo Ratio</span>
        </div>

        <div className="space-y-3">
          {/* You */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <span>{user.avatar}</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name} (You)</span>
              </span>
              <span>
                <strong className="text-neutral-900 dark:text-neutral-100">{formatCurrency(myTotalPaid, sym)}</strong> ({myPaidPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${myPaidPercent}%` }}
                className="h-full bg-neutral-900 dark:bg-neutral-100 rounded-full transition-all duration-500"
              />
            </div>
          </div>

          {/* Partner */}
          <div>
            <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <span>{partnerAvatar}</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{partnerName}</span>
              </span>
              <span>
                <strong className="text-neutral-900 dark:text-neutral-100">{formatCurrency(partnerTotalPaid, sym)}</strong> ({partnerPaidPercent}%)
              </span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div
                style={{ width: `${partnerPaidPercent}%` }}
                className="h-full bg-neutral-500 dark:bg-neutral-400 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Spending by Category
          </h3>
          <span className="text-[11px] text-neutral-400">{sortedCategories.length} categories</span>
        </div>

        {sortedCategories.length > 0 ? (
          <div className="space-y-2.5">
            {sortedCategories.map(([category, catAmount]) => {
              const percent = Math.round((catAmount / (balance.totalSpent || 1)) * 100);
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-800 dark:text-neutral-200">{category}</span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      <strong className="text-neutral-900 dark:text-neutral-100">{formatCurrency(catAmount, sym)}</strong>{" "}
                      ({percent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-neutral-800 dark:bg-neutral-200 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-neutral-400 text-center py-4">No categories recorded yet</p>
        )}
      </div>

      {/* Highest Single Record Highlight */}
      {highestExpense && (
        <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
              <Award className="size-4" />
            </div>
            <div>
              <span className="text-[10px] font-semibold text-neutral-400 uppercase block">
                Highest Single Bill
              </span>
              <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{highestExpense.title}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            {formatCurrency(highestExpense.amount, sym)}
          </span>
        </div>
      )}
    </div>
  );
};
