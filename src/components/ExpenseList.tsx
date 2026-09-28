"use client";

import React, { useState } from "react";
import { Expense, Settlement, UserPublicProfile, AppSettings } from "@/types";
import { ExpenseCard } from "./ExpenseCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Search, Handshake, Trash2, Plus, Receipt } from "lucide-react";

interface ExpenseListProps {
  expenses: Expense[];
  settlements: Settlement[];
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  onSelectExpense: (expense: Expense) => void;
  onDeleteSettlement: (id: string) => Promise<void>;
  onOpenAddExpense: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  settlements,
  settings,
  user,
  partner,
  onSelectExpense,
  onDeleteSettlement,
  onOpenAddExpense,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSplitType, setSelectedSplitType] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"expenses" | "settlements">("expenses");

  const sym = settings.currencySymbol || "₹";
  const partnerName = partner ? partner.name : "Partner";

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSplit =
      selectedSplitType === "ALL" || exp.splitType === selectedSplitType;

    return matchesSearch && matchesSplit;
  });

  return (
    <div className="space-y-4">
      {/* Activity / Settlements Tab Switcher */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("expenses")}
            className={`text-sm font-bold pb-1 transition-colors relative ${
              activeTab === "expenses"
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            Expenses ({expenses.length})
            {activeTab === "expenses" && (
              <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("settlements")}
            className={`text-sm font-bold pb-1 transition-colors relative ${
              activeTab === "settlements"
                ? "text-neutral-900 dark:text-neutral-100"
                : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            }`}
          >
            Settlements ({settlements.length})
            {activeTab === "settlements" && (
              <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-full" />
            )}
          </button>
        </div>

        <span className="text-xs text-neutral-400">All Time</span>
      </div>

      {activeTab === "expenses" ? (
        <>
          {/* Search bar & filter pills */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="size-3.5 text-neutral-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search expenses, notes, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Split Type Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              <button
                onClick={() => setSelectedSplitType("ALL")}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition border ${
                  selectedSplitType === "ALL"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                All Splits
              </button>
              <button
                onClick={() => setSelectedSplitType("EQUAL_SPLIT")}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition border ${
                  selectedSplitType === "EQUAL_SPLIT"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                ⚖️ 50/50
              </button>
              <button
                onClick={() => setSelectedSplitType("I_PAID_FOR_HER")}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition border ${
                  selectedSplitType === "I_PAID_FOR_HER"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                🎁 Paid for {partnerName}
              </button>
              <button
                onClick={() => setSelectedSplitType("SHE_PAID_FOR_ME")}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition border ${
                  selectedSplitType === "SHE_PAID_FOR_ME"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                ☕ {partnerName} paid
              </button>
              <button
                onClick={() => setSelectedSplitType("CUSTOM_SPLIT")}
                className={`px-3 py-1 rounded-full font-medium whitespace-nowrap transition border ${
                  selectedSplitType === "CUSTOM_SPLIT"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                    : "bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                🔢 Custom
              </button>
            </div>
          </div>

          {/* List of expenses */}
          {filteredExpenses.length > 0 ? (
            <div className="space-y-2">
              {filteredExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  settings={settings}
                  user={user}
                  partner={partner}
                  onClick={onSelectExpense}
                />
              ))}
            </div>
          ) : (
            <div className="p-7 text-center bg-neutral-50/80 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-3">
              <div className="size-20 rounded-2xl bg-white dark:bg-neutral-800 border border-pink-200 dark:border-pink-900/60 p-2 mx-auto flex items-center justify-center shadow-xs">
                <img
                  src="/stickers/bubu_sleep.gif"
                  alt="Bubu Dudu waiting"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {searchQuery || selectedSplitType !== "ALL"
                    ? "No matching expenses"
                    : "Bubu & Dudu are waiting for treats!"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {searchQuery || selectedSplitType !== "ALL"
                    ? "Try adjusting your search keywords or active filters"
                    : "No expenses recorded yet. Tap below to add your first bill!"}
                </p>
              </div>
              <button
                onClick={onOpenAddExpense}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-semibold shadow-xs hover:opacity-90 transition active:scale-95 cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>Add First Expense</span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* Settlements Tab */
        <div className="space-y-2.5">
          {settlements.length > 0 ? (
            settlements.map((settlement) => {
              const isPayerMe = settlement.fromUser === user.id;
              const payerName = isPayerMe ? user.name : partnerName;
              const payerAvatar = isPayerMe ? user.avatar : partner ? partner.avatar : "👩🏻‍💼";
              const receiverName = isPayerMe ? partnerName : user.name;
              const receiverAvatar = isPayerMe ? (partner ? partner.avatar : "👩🏻‍💼") : user.avatar;

              return (
                <div
                  key={settlement.id}
                  className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                      <Handshake className="size-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        <span>{payerAvatar} {payerName}</span>
                        <span className="text-neutral-400 font-normal">paid</span>
                        <span>{receiverAvatar} {receiverName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                        <span>{formatDate(settlement.date)}</span>
                        {settlement.notes && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[150px]">
                              {settlement.notes}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(settlement.amount, sym)}
                    </span>
                    <button
                      onClick={() => onDeleteSettlement(settlement.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                      title="Delete settlement"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
              <Handshake className="size-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">No settlements recorded</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Log direct payments using the &quot;Settle Up&quot; button.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
