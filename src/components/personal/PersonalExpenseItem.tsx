"use client";

import React, { useEffect, useState } from "react";
import { Banknote, Check, Pencil, Smartphone, Trash2, Users } from "lucide-react";
import { PersonalExpense } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { othersOwe } from "@/lib/personal";

interface PersonalExpenseItemProps {
  expense: PersonalExpense;
  onEdit: (e: PersonalExpense) => void;
  onDelete: (e: PersonalExpense) => Promise<void>;
  onToggleSettled: (e: PersonalExpense) => void;
}

export const PersonalExpenseItem: React.FC<PersonalExpenseItemProps> = ({ expense: e, onEdit, onDelete, onToggleSettled }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Drop the "Sure?" state if it isn't confirmed within a few seconds
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(false), 3000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const handleDelete = async () => {
    if (!confirmDelete) return setConfirmDelete(true);
    setDeleting(true);
    await onDelete(e);
    setDeleting(false);
  };

  const MethodIcon = e.method === "cash" ? Banknote : Smartphone;
  const meta = [
    e.method === "cash" ? "Cash" : "UPI",
    e.isSplit && `Split ${e.people} ways`,
    e.isSplit && e.splitWith && `with ${e.splitWith}`,
  ].filter(Boolean);

  const statusTone = !e.isSplit
    ? "text-neutral-500 dark:text-neutral-400"
    : e.settled
    ? "text-neutral-500 dark:text-neutral-400"
    : e.paidByMe
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-rose-600 dark:text-rose-400";

  const statusText = !e.isSplit
    ? e.note
    : e.settled
    ? e.paidByMe
      ? `Got ${formatCurrency(othersOwe(e))} back`
      : `Paid your ${formatCurrency(e.myShare)}`
    : e.paidByMe
    ? `You'll get ${formatCurrency(othersOwe(e))}`
    : `You owe ${formatCurrency(e.myShare)}`;

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden shadow-xs">
      <div className="flex items-center gap-3 p-3.5">
        <div className="size-10 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
          {e.isSplit ? <Users className="size-4" /> : <MethodIcon className="size-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm truncate text-neutral-900 dark:text-neutral-100">{e.title}</div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{meta.join(" · ")}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-bold text-sm tabular-nums text-neutral-900 dark:text-neutral-100">{formatCurrency(e.myShare)}</div>
          {e.isSplit && (
            <div className="text-[11px] text-neutral-400 dark:text-neutral-500 tabular-nums">of {formatCurrency(e.amount)}</div>
          )}
        </div>
      </div>

      {/* Action strip: split status + settle, edit, delete */}
      <div className="flex items-center gap-1.5 px-3.5 py-2 border-t border-neutral-100 dark:border-neutral-900 bg-neutral-50/70 dark:bg-neutral-900/30">
        <span className={`flex-1 min-w-0 truncate text-xs font-semibold flex items-center gap-1 ${statusTone}`}>
          {e.isSplit && e.settled && <Check className="size-3.5 shrink-0" />}
          {statusText}
        </span>

        {e.isSplit && (
          <button
            onClick={() => onToggleSettled(e)}
            className={`px-2.5 h-7 rounded-full text-[11px] font-semibold border transition active:scale-95 ${
              e.settled
                ? "border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
                : "bg-black text-white dark:bg-white dark:text-black border-transparent"
            }`}
          >
            {e.settled ? "Undo" : e.paidByMe ? "Got it" : "Paid"}
          </button>
        )}

        <button
          onClick={() => onEdit(e)}
          className="h-7 px-2.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 active:scale-95 transition"
        >
          <Pencil className="size-3" />
          Edit
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`h-7 px-2.5 rounded-full border text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition ${
            confirmDelete
              ? "bg-rose-600 border-rose-600 text-white"
              : "border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
          }`}
        >
          <Trash2 className="size-3" />
          {deleting ? "…" : confirmDelete ? "Sure?" : "Delete"}
        </button>
      </div>
    </div>
  );
};
