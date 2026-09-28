"use client";

import React from "react";
import { Expense, UserPublicProfile, AppSettings } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Utensils,
  ShoppingCart,
  Car,
  Film,
  ShoppingBag,
  Zap,
  Home,
  HeartPulse,
  Gift,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Coffee,
  Sliders,
} from "lucide-react";

interface ExpenseCardProps {
  expense: Expense;
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  onClick: (expense: Expense) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  "Food & Dining": Utensils,
  Groceries: ShoppingCart,
  "Travel & Cab": Car,
  Entertainment: Film,
  Shopping: ShoppingBag,
  "Bills & Utilities": Zap,
  "Rent & Stay": Home,
  "Health & Wellness": HeartPulse,
  Gifts: Gift,
  Other: Layers,
};

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  expense,
  settings,
  user,
  partner,
  onClick,
}) => {
  const sym = settings.currencySymbol || "₹";
  const isPayerMe = expense.paidBy === user.id;

  const partnerName = partner ? partner.name : "Partner";
  const partnerAvatar = partner ? partner.avatar : "👩🏻‍💼";
  const payerName = isPayerMe ? user.name : partnerName;
  const payerAvatar = isPayerMe ? user.avatar : partnerAvatar;

  const activeUserShare = user.id === "user1" ? expense.user1Amount : expense.user2Amount;
  const activeUserPaid = isPayerMe ? expense.amount : 0;
  const activeUserNet = activeUserPaid - activeUserShare;

  const isLent = activeUserNet > 0.01;
  const isOwed = activeUserNet < -0.01;
  const isNeutral = Math.abs(activeUserNet) < 0.01;

  const IconComponent = CATEGORY_ICONS[expense.category] || Layers;

  let splitBadge = "50/50 Split";
  let SplitIcon = Scale;
  if (expense.splitType === "I_PAID_FOR_HER") {
    splitBadge = user.id === "user1" ? `Paid for ${partnerName}` : `${partnerName} paid for you`;
    SplitIcon = Gift;
  } else if (expense.splitType === "SHE_PAID_FOR_ME") {
    splitBadge = user.id === "user2" ? `Paid for ${partnerName}` : `${partnerName} paid for you`;
    SplitIcon = Coffee;
  } else if (expense.splitType === "CUSTOM_SPLIT") {
    splitBadge = "Custom Split";
    SplitIcon = Sliders;
  }

  return (
    <div
      onClick={() => onClick(expense)}
      className="group relative bg-white dark:bg-neutral-900/60 hover:bg-neutral-50 dark:hover:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:border-neutral-300 dark:hover:border-neutral-700 active:scale-[0.99] flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <div className="size-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shadow-xs">
            <IconComponent className="size-4" />
          </div>
          <span className="absolute -bottom-1 -right-1 text-[11px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-0.5">
            {payerAvatar}
          </span>
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate tracking-tight">
            {expense.title}
          </h3>

          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            <span>{formatDate(expense.date)}</span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate max-w-[130px]">
              <SplitIcon className="size-3 shrink-0" />
              <span className="truncate">{splitBadge}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="text-right shrink-0">
        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 block">
          {formatCurrency(expense.amount, sym)}
        </span>

        {isNeutral ? (
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">no balance</span>
        ) : isLent ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ArrowDownLeft className="size-3" />
            <span>get {formatCurrency(activeUserNet, sym)}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
            <ArrowUpRight className="size-3" />
            <span>owe {formatCurrency(Math.abs(activeUserNet), sym)}</span>
          </span>
        )}
      </div>
    </div>
  );
};
