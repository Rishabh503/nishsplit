"use client";

import { useState } from "react";
import { Banknote, Minus, Plus, Smartphone, Trash2, X } from "lucide-react";
import { PersonalExpense, PersonalExpenseInput, PaymentMethod } from "@/types";
import { cn, formatCurrency } from "@/lib/utils";
import { round2, todayISO } from "@/lib/personal";

const QUICK_TITLES = ["Food", "Chai / Coffee", "Auto / Cab", "Groceries", "Snacks", "Shopping", "Tickets", "Drinks"];

interface PersonalExpenseSheetProps {
  initial: PersonalExpense | null;
  onClose: () => void;
  onSave: (input: PersonalExpenseInput) => Promise<string | null>;
  onDelete: (id: string) => Promise<void>;
}

export function PersonalExpenseSheet({ initial, onClose, onSave, onDelete }: PersonalExpenseSheetProps) {
  const initialEqualShare = initial ? round2(initial.amount / initial.people) : 0;

  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [method, setMethod] = useState<PaymentMethod>(initial?.method ?? "upi");
  const [spentOn, setSpentOn] = useState(initial?.spentOn ?? todayISO());
  const [isSplit, setIsSplit] = useState(initial?.isSplit ?? false);
  const [people, setPeople] = useState(initial?.isSplit ? initial.people : 2);
  const [customShare, setCustomShare] = useState(
    initial?.isSplit && initial.myShare !== initialEqualShare ? String(initial.myShare) : ""
  );
  const [shareMode, setShareMode] = useState<"equal" | "custom">(
    initial?.isSplit && initial.myShare !== initialEqualShare ? "custom" : "equal"
  );
  const [paidByMe, setPaidByMe] = useState(initial?.paidByMe ?? true);
  const [settled, setSettled] = useState(initial?.isSplit ? initial.settled : false);
  const [splitWith, setSplitWith] = useState(initial?.splitWith ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const total = Number(amount) || 0;
  const myShare = !isSplit ? total : shareMode === "equal" ? round2(total / people) : Number(customShare) || 0;
  const othersShare = round2(total - myShare);

  async function handleSave() {
    setError(null);
    if (total <= 0) return setError("Enter an amount");
    if (!title.trim()) return setError("What was it for?");
    if (isSplit && (myShare < 0 || myShare > total)) return setError("Your share can't be more than the total");
    setSaving(true);
    const err = await onSave({
      title,
      amount: total,
      method,
      spentOn,
      isSplit,
      people: isSplit ? people : 1,
      myShare,
      paidByMe: isSplit ? paidByMe : true,
      settled: isSplit ? settled : true,
      splitWith: isSplit ? splitWith : "",
      note,
    });
    setSaving(false);
    if (err) setError(err);
  }

  async function handleDelete() {
    if (!initial) return;
    if (!confirmDelete) return setConfirmDelete(true);
    setSaving(true);
    await onDelete(initial.id);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto no-scrollbar rounded-t-3xl border border-b-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 animate-sheet-up">
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-5 pt-3 pb-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">{initial ? "Edit expense" : "Add expense"}</h2>
            <button onClick={onClose} aria-label="Close" className="size-8 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-500">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-5">
          {/* Amount */}
          <div className="flex items-baseline gap-1 border-b border-neutral-200 dark:border-neutral-800 pb-2">
            <span className="text-3xl font-bold text-neutral-400">₹</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              autoFocus={!initial}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-4xl font-extrabold tracking-tight outline-none tabular-nums placeholder:text-neutral-300 dark:placeholder:text-neutral-700"
            />
          </div>

          {/* Title */}
          <Field label="What for?">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Dinner at Truffles"
              className={inputClass}
            />
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 -mx-5 px-5">
              {QUICK_TITLES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTitle(t)}
                  className={cn(chipClass, "shrink-0", title === t && chipActive)}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          {/* Method */}
          <Field label="Paid with">
            <div className="grid grid-cols-2 gap-2">
              <ToggleCard active={method === "upi"} onClick={() => setMethod("upi")} icon={<Smartphone className="size-4" />} label="UPI" />
              <ToggleCard active={method === "cash"} onClick={() => setMethod("cash")} icon={<Banknote className="size-4" />} label="Cash" />
            </div>
          </Field>

          <Field label="Date">
            <input type="date" value={spentOn} max={todayISO()} onChange={(e) => setSpentOn(e.target.value)} className={inputClass} />
          </Field>

          {/* Split toggle */}
          <button
            onClick={() => setIsSplit(!isSplit)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50"
          >
            <div className="text-left">
              <div className="text-sm font-semibold">Split with others</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">Group bill, only part of it is mine</div>
            </div>
            <span className={cn("w-11 h-6 rounded-full p-0.5 transition", isSplit ? "bg-black dark:bg-white" : "bg-neutral-300 dark:bg-neutral-700")}>
              <span className={cn("block size-5 rounded-full bg-white dark:bg-black transition-transform", isSplit && "translate-x-5")} />
            </span>
          </button>

          {isSplit && (
            <div className="space-y-5 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Field label="How many people (including you)?">
                <div className="flex items-center gap-3">
                  <button onClick={() => setPeople(Math.max(2, people - 1))} className={stepperClass} aria-label="Fewer people">
                    <Minus className="size-4" />
                  </button>
                  <span className="text-2xl font-bold tabular-nums w-10 text-center">{people}</span>
                  <button onClick={() => setPeople(Math.min(100, people + 1))} className={stepperClass} aria-label="More people">
                    <Plus className="size-4" />
                  </button>
                </div>
              </Field>

              <Field label="My share">
                <div className="flex gap-1.5 mb-2">
                  <button onClick={() => setShareMode("equal")} className={cn(chipClass, shareMode === "equal" && chipActive)}>
                    Equal split
                  </button>
                  <button onClick={() => setShareMode("custom")} className={cn(chipClass, shareMode === "custom" && chipActive)}>
                    Custom amount
                  </button>
                </div>
                {shareMode === "custom" ? (
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="My part of the bill"
                    value={customShare}
                    onChange={(e) => setCustomShare(e.target.value)}
                    className={inputClass}
                  />
                ) : (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {formatCurrency(total)} ÷ {people} = <strong className="text-neutral-900 dark:text-neutral-100">{formatCurrency(myShare)}</strong>
                  </p>
                )}
              </Field>

              <Field label="Who paid the bill?">
                <div className="grid grid-cols-2 gap-2">
                  <ToggleCard active={paidByMe} onClick={() => setPaidByMe(true)} label="I paid" />
                  <ToggleCard active={!paidByMe} onClick={() => setPaidByMe(false)} label="Someone else" />
                </div>
              </Field>

              <Field label="Split with (optional)">
                <input value={splitWith} onChange={(e) => setSplitWith(e.target.value)} placeholder="e.g. Rahul, Amit, Priya" className={inputClass} />
              </Field>

              <div
                className={cn(
                  "p-3.5 rounded-xl border text-sm",
                  paidByMe
                    ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                    : "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300"
                )}
              >
                {paidByMe ? (
                  <>Others owe you <strong>{formatCurrency(othersShare)}</strong></>
                ) : (
                  <>You owe <strong>{formatCurrency(myShare)}</strong> to whoever paid</>
                )}
                <label className="flex items-center gap-2 mt-2.5 font-medium">
                  <input type="checkbox" checked={settled} onChange={(e) => setSettled(e.target.checked)} className="size-4 accent-current" />
                  {paidByMe ? "I've already got it back" : "I've already paid my share"}
                </label>
              </div>
            </div>
          )}

          <Field label="Note (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything to remember" className={inputClass} />
          </Field>

          {error && <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>}

          <div className="flex gap-2.5 pt-1">
            {initial && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className={cn(
                  "h-12 px-4 rounded-xl border text-sm font-semibold flex items-center gap-1.5 transition",
                  confirmDelete
                    ? "bg-rose-600 border-rose-600 text-white"
                    : "border-neutral-200 dark:border-neutral-800 text-rose-600 dark:text-rose-400"
                )}
              >
                <Trash2 className="size-4" />
                {confirmDelete ? "Confirm" : "Delete"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-sm active:scale-[0.98] transition disabled:opacity-50"
            >
              {saving ? "Saving…" : isSplit ? `Save · my share ${formatCurrency(myShare)}` : "Save expense"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full h-11 px-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm outline-none focus:border-neutral-900 dark:focus:border-neutral-300 transition";
const chipClass =
  "px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-600 dark:text-neutral-400 transition";
const chipActive = "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white";
const stepperClass =
  "size-10 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-center justify-center active:scale-95 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">{label}</div>
      {children}
    </div>
  );
}

function ToggleCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold transition active:scale-[0.98]",
        active
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
          : "border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
