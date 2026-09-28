"use client";

import React, { useState, useEffect } from "react";
import { Expense, SplitType, ExpenseCategory, UserRole, AppSettings, UserPublicProfile } from "@/types";
import { CATEGORIES, formatCurrency } from "@/lib/utils";
import { BUBU_DUDU_SPLIT_STICKERS } from "@/lib/bubuDuduData";
import {
  X,
  Scale,
  Gift,
  Coffee,
  Sliders,
  Check,
  Receipt,
  Sparkles,
} from "lucide-react";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Partial<Expense>) => Promise<void>;
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  initialExpense?: Expense | null;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  settings,
  user,
  partner,
  initialExpense,
}) => {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("Food & Dining");
  const [paidBy, setPaidBy] = useState<UserRole>(user.id);
  const [splitType, setSplitType] = useState<SplitType>("EQUAL_SPLIT");
  const [customUser1Amount, setCustomUser1Amount] = useState<string>("");
  const [customUser2Amount, setCustomUser2Amount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sym = settings.currencySymbol || "₹";
  const partnerName = partner ? partner.name : "Partner";
  const partnerAvatar = partner ? partner.avatar : "👩🏻‍💼";

  useEffect(() => {
    if (initialExpense) {
      setTitle(initialExpense.title);
      setAmount(initialExpense.amount.toString());
      setCategory(initialExpense.category);
      setPaidBy(initialExpense.paidBy);
      setSplitType(initialExpense.splitType);
      setCustomUser1Amount(initialExpense.user1Amount.toString());
      setCustomUser2Amount(initialExpense.user2Amount.toString());
      setDate(initialExpense.date);
      setNotes(initialExpense.notes || "");
    } else {
      setTitle("");
      setAmount("");
      setCategory("Food & Dining");
      setPaidBy(user.id);
      setSplitType("EQUAL_SPLIT");
      setCustomUser1Amount("");
      setCustomUser2Amount("");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    }
    setError(null);
  }, [isOpen, initialExpense, user]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  let calculatedUser1Share = 0;
  let calculatedUser2Share = 0;

  if (splitType === "EQUAL_SPLIT") {
    calculatedUser1Share = Math.round((numAmount / 2) * 100) / 100;
    calculatedUser2Share = Math.round((numAmount - calculatedUser1Share) * 100) / 100;
  } else if (splitType === "I_PAID_FOR_HER") {
    // User 1 paid for User 2 -> 100% on User 2
    calculatedUser1Share = 0;
    calculatedUser2Share = numAmount;
  } else if (splitType === "SHE_PAID_FOR_ME") {
    // User 2 paid for User 1 -> 100% on User 1
    calculatedUser1Share = numAmount;
    calculatedUser2Share = 0;
  } else if (splitType === "CUSTOM_SPLIT") {
    calculatedUser1Share = parseFloat(customUser1Amount) || 0;
    calculatedUser2Share = parseFloat(customUser2Amount) || 0;
  }

  const handleCustom1Change = (val: string) => {
    setCustomUser1Amount(val);
    const u1 = parseFloat(val) || 0;
    if (numAmount > 0 && u1 <= numAmount) {
      setCustomUser2Amount((Math.round((numAmount - u1) * 100) / 100).toString());
    }
  };

  const handleCustom2Change = (val: string) => {
    setCustomUser2Amount(val);
    const u2 = parseFloat(val) || 0;
    if (numAmount > 0 && u2 <= numAmount) {
      setCustomUser1Amount((Math.round((numAmount - u2) * 100) / 100).toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a description");
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    if (splitType === "CUSTOM_SPLIT") {
      const sum = calculatedUser1Share + calculatedUser2Share;
      if (Math.abs(sum - numAmount) > 0.05) {
        setError(`Custom shares (${sym}${sum}) must equal total amount (${sym}${numAmount})`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError(null);

      let finalPaidBy = paidBy;
      if (splitType === "I_PAID_FOR_HER") {
        finalPaidBy = "user1";
      } else if (splitType === "SHE_PAID_FOR_ME") {
        finalPaidBy = "user2";
      }

      await onSave({
        id: initialExpense?.id,
        title: title.trim(),
        amount: numAmount,
        currency: settings.currency || "INR",
        category,
        date,
        paidBy: finalPaidBy,
        splitType,
        user1Amount: calculatedUser1Share,
        user2Amount: calculatedUser2Share,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Receipt className="size-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {initialExpense ? "Edit Expense" : "New Expense"}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Amount */}
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-center">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Total Amount
            </label>
            <div className="flex items-center justify-center gap-1">
              <span className="text-2xl font-bold text-neutral-400">{sym}</span>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus={!initialExpense}
                className="w-44 text-3xl font-extrabold bg-transparent text-neutral-900 dark:text-neutral-100 text-center focus:outline-none placeholder-neutral-300 dark:placeholder-neutral-700 tracking-tight"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Dinner, Groceries, Flight tickets..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 transition"
            />
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Paid By
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaidBy("user1")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  paidBy === "user1"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <span>{user.id === "user1" ? user.avatar : partnerAvatar}</span>
                <span>{user.id === "user1" ? user.name : partnerName} paid</span>
              </button>

              <button
                type="button"
                onClick={() => setPaidBy("user2")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition ${
                  paidBy === "user2"
                    ? "bg-black text-white dark:bg-white dark:text-black border-transparent shadow-xs"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
                }`}
              >
                <span>{user.id === "user2" ? user.avatar : partnerAvatar}</span>
                <span>{user.id === "user2" ? user.name : partnerName} paid</span>
              </button>
            </div>
          </div>

          {/* 4 Splitting Options */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Split Mode
              </label>
              <span className="text-[10px] text-neutral-400">4 Splitting Rules</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSplitType("EQUAL_SPLIT")}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${
                  splitType === "EQUAL_SPLIT"
                    ? "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600"
                    : "bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Scale className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Split Equally (50/50)</span>
                    {splitType === "EQUAL_SPLIT" && <Check className="size-3 text-neutral-900 dark:text-neutral-100" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    50% each ({sym}{numAmount ? (numAmount / 2).toFixed(1) : "0"})
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType("I_PAID_FOR_HER");
                  setPaidBy("user1");
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${
                  splitType === "I_PAID_FOR_HER"
                    ? "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600"
                    : "bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Gift className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.id === "user1" ? user.name : partnerName} paid for {user.id === "user1" ? partnerName : user.name}
                    </span>
                    {splitType === "I_PAID_FOR_HER" && <Check className="size-3 text-neutral-900 dark:text-neutral-100" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    100% on {user.id === "user1" ? partnerName : user.name}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSplitType("SHE_PAID_FOR_ME");
                  setPaidBy("user2");
                }}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${
                  splitType === "SHE_PAID_FOR_ME"
                    ? "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600"
                    : "bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Coffee className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.id === "user2" ? user.name : partnerName} paid for {user.id === "user2" ? partnerName : user.name}
                    </span>
                    {splitType === "SHE_PAID_FOR_ME" && <Check className="size-3 text-neutral-900 dark:text-neutral-100" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    100% on {user.id === "user2" ? partnerName : user.name}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSplitType("CUSTOM_SPLIT")}
                className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition ${
                  splitType === "CUSTOM_SPLIT"
                    ? "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-400 dark:border-neutral-600"
                    : "bg-white dark:bg-neutral-900/40 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                }`}
              >
                <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <Sliders className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Custom Split</span>
                    {splitType === "CUSTOM_SPLIT" && <Check className="size-3 text-neutral-900 dark:text-neutral-100" />}
                  </div>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                    Specify exact shares
                  </p>
                </div>
              </button>
            </div>

            {/* Bubu & Dudu Animated Split Reaction Sticker */}
            {BUBU_DUDU_SPLIT_STICKERS[splitType] && (
              <div className="mt-2.5 p-2.5 rounded-xl border border-pink-200/70 dark:border-pink-900/40 bg-pink-50/50 dark:bg-pink-950/20 flex items-center gap-3 animate-in fade-in duration-200">
                <div className="size-12 rounded-lg bg-white dark:bg-neutral-900 border border-pink-200 dark:border-pink-900/60 p-1 shrink-0 flex items-center justify-center shadow-2xs overflow-hidden">
                  <img
                    src={BUBU_DUDU_SPLIT_STICKERS[splitType].gifUrl}
                    alt="Bubu Dudu split mode"
                    className="w-full h-full object-contain select-none"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {BUBU_DUDU_SPLIT_STICKERS[splitType].title}
                    </span>
                    <Sparkles className="size-3 text-pink-500" />
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                    {BUBU_DUDU_SPLIT_STICKERS[splitType].subtitle}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Custom Split Inputs */}
          {splitType === "CUSTOM_SPLIT" && (
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 space-y-2">
              <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block">
                Assign Shares ({sym})
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block mb-1">
                    {user.id === "user1" ? user.name : partnerName}&apos;s Share
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={customUser1Amount}
                    onChange={(e) => handleCustom1Change(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block mb-1">
                    {user.id === "user2" ? user.name : partnerName}&apos;s Share
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={customUser2Amount}
                    onChange={(e) => handleCustom2Change(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setCategory(cat.name as ExpenseCategory)}
                  className={`flex items-center gap-1.5 p-2 rounded-lg border text-xs transition ${
                    category === cat.name
                      ? "bg-black text-white dark:bg-white dark:text-black border-transparent font-medium"
                      : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Note (Optional)</label>
              <input
                type="text"
                placeholder="Details or memo..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? "Saving..." : initialExpense ? "Update Expense" : "Save & Split Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
