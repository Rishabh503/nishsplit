"use client";

import React, { useState, useEffect } from "react";
import { UserRole, AppSettings, BalanceSummary, Settlement, UserPublicProfile } from "@/types";
import { formatCurrency } from "@/lib/utils";
import confetti from "canvas-confetti";
import { X, Handshake, Check, ArrowRight } from "lucide-react";

interface SettleUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  balance: BalanceSummary;
  onSaveSettlement: (settlement: Partial<Settlement>) => Promise<void>;
}

export const SettleUpModal: React.FC<SettleUpModalProps> = ({
  isOpen,
  onClose,
  settings,
  user,
  partner,
  balance,
  onSaveSettlement,
}) => {
  const partnerId: UserRole = user.id === "user1" ? "user2" : "user1";
  const partnerName = partner ? partner.name : "Partner";
  const partnerAvatar = partner ? partner.avatar : "👩🏻‍💼";

  const [fromUser, setFromUser] = useState<UserRole>(user.id);
  const [toUser, setToUser] = useState<UserRole>(partnerId);
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("Settled via UPI / Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sym = settings.currencySymbol || "₹";

  useEffect(() => {
    if (isOpen) {
      const net = balance.netBalance; // relative to active user
      if (net > 0) {
        // Partner owes User -> fromUser is partner, toUser is user
        setFromUser(partnerId);
        setToUser(user.id);
        setAmount(net.toString());
      } else {
        // User owes Partner -> fromUser is user, toUser is partner
        setFromUser(user.id);
        setToUser(partnerId);
        setAmount(Math.abs(net) > 0 ? Math.abs(net).toString() : "");
      }
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("Settled via UPI / Cash");
      setError(null);
    }
  }, [isOpen, balance, user.id, partnerId]);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numAmount || numAmount <= 0) {
      setError("Please enter a valid settlement amount");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSaveSettlement({
        fromUser,
        toUser,
        amount: numAmount,
        currency: settings.currency || "INR",
        date,
        notes: notes.trim(),
      });

      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#18181b", "#71717a", "#10b981", "#3b82f6"],
        });
      } catch (err) {
        // ignore
      }

      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to record settlement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const payerName = fromUser === user.id ? user.name : partnerName;
  const payerAvatar = fromUser === user.id ? user.avatar : partnerAvatar;
  const receiverName = toUser === user.id ? user.name : partnerName;
  const receiverAvatar = toUser === user.id ? user.avatar : partnerAvatar;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Handshake className="size-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Record Settlement</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-7 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Bubu Dudu Settlement Mascot Header */}
          <div className="p-3 rounded-xl border border-pink-200/70 dark:border-pink-900/40 bg-pink-50/50 dark:bg-pink-950/20 flex items-center gap-3">
            <div className="size-12 rounded-lg bg-white dark:bg-neutral-900 border border-pink-200 dark:border-pink-900/60 p-1 shrink-0 flex items-center justify-center shadow-2xs">
              <img
                src="/stickers/bubu_hug.gif"
                alt="Bubu Dudu settle"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1">
                <span>Peace Treaty & Settlement</span>
                <span>🤝</span>
              </span>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Clearing dues restores 100% Bubu & Dudu peace!
              </p>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-around text-center">
            <div className="flex flex-col items-center">
              <span className="text-2xl">{payerAvatar}</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">{payerName}</span>
              <span className="text-[10px] text-neutral-500 uppercase">Payer</span>
            </div>

            <div className="flex flex-col items-center px-2">
              <ArrowRight className="size-4 text-neutral-400" />
              <button
                type="button"
                onClick={() => {
                  setFromUser(toUser);
                  setToUser(fromUser);
                }}
                className="text-[10px] text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 underline mt-1"
              >
                Swap
              </button>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl">{receiverAvatar}</span>
              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 mt-1">{receiverName}</span>
              <span className="text-[10px] text-neutral-500 uppercase">Receiver</span>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 text-center">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Settlement Amount
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
                autoFocus
                className="w-44 text-3xl font-extrabold bg-transparent text-neutral-900 dark:text-neutral-100 text-center focus:outline-none placeholder-neutral-300 dark:placeholder-neutral-700 tracking-tight"
              />
            </div>
            {Math.abs(balance.netBalance) > 0 && (
              <button
                type="button"
                onClick={() => setAmount(Math.abs(balance.netBalance).toString())}
                className="mt-2 text-xs text-neutral-600 dark:text-neutral-400 hover:underline font-medium"
              >
                Set full balance ({formatCurrency(Math.abs(balance.netBalance), sym)})
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
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
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Method / Note</label>
              <input
                type="text"
                placeholder="UPI, Cash, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Check className="size-3.5" />
            <span>{isSubmitting ? "Recording..." : "Record Payment & Settle"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
