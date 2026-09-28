"use client";

import React, { useState } from "react";
import { Expense, UserPublicProfile, AppSettings } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BUBU_DUDU_SPLIT_STICKERS } from "@/lib/bubuDuduData";
import { X, Trash2, Edit2, FileText, AlertTriangle } from "lucide-react";

interface ExpenseDetailModalProps {
  expense: Expense | null;
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  onClose: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
}

export const ExpenseDetailModal: React.FC<ExpenseDetailModalProps> = ({
  expense,
  settings,
  user,
  partner,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!expense) return null;

  const sym = settings.currencySymbol || "₹";
  const isPayerMe = expense.paidBy === user.id;
  const partnerName = partner ? partner.name : "Partner";
  const partnerAvatar = partner ? partner.avatar : "👩🏻‍💼";
  const payerName = isPayerMe ? user.name : partnerName;
  const payerAvatar = isPayerMe ? user.avatar : partnerAvatar;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(expense.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <span className="text-xl">{payerAvatar}</span>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate max-w-[200px]">
                {expense.title}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">{expense.category}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-center">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase block mb-0.5">Total Bill</span>
            <span className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(expense.amount, sym)}
            </span>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Paid by <strong className="text-neutral-800 dark:text-neutral-200">{payerName}</strong> on {formatDate(expense.date)}
            </p>
          </div>

          <div className="bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              Split Breakdown
            </h4>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                  <span>{user.id === "user1" ? user.avatar : partnerAvatar}</span>
                  <span>{user.id === "user1" ? user.name : partnerName}&apos;s Share:</span>
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(expense.user1Amount, sym)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300">
                  <span>{user.id === "user2" ? user.avatar : partnerAvatar}</span>
                  <span>{user.id === "user2" ? user.name : partnerName}&apos;s Share:</span>
                </span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(expense.user2Amount, sym)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <span>🐾 Rule:</span>
              </span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                <span>{BUBU_DUDU_SPLIT_STICKERS[expense.splitType]?.emoji}</span>
                <span>
                  {expense.splitType === "EQUAL_SPLIT" && "50/50 Equal Split"}
                  {expense.splitType === "I_PAID_FOR_HER" && "100% on Partner"}
                  {expense.splitType === "SHE_PAID_FOR_ME" && "100% on User"}
                  {expense.splitType === "CUSTOM_SPLIT" && "Custom Split"}
                </span>
              </span>
            </div>
          </div>

          {expense.notes && (
            <div className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-xs text-neutral-700 dark:text-neutral-300 flex items-start gap-2">
              <FileText className="size-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>{expense.notes}</span>
            </div>
          )}

          {confirmDelete && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="size-4" />
                <span>Delete this expense?</span>
              </div>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                This will recalculate all running balances.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!confirmDelete && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  onClose();
                  onEdit(expense);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-xs font-semibold border border-neutral-200 dark:border-neutral-800 transition"
              >
                <Edit2 className="size-3.5" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900 transition"
              >
                <Trash2 className="size-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
