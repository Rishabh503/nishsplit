import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Expense, Settlement, BalanceSummary, AppSettings, AppUser, UserRole } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_SETTINGS: AppSettings = {
  currency: "INR",
  currencySymbol: "₹",
};

export const INITIAL_USERS: AppUser[] = [
  {
    id: "user1",
    name: "Rishabh",
    email: "rishabhtripathi2022@gmail.com",
    passwordHash: "12345",
    avatar: "🧑🏻‍💻",
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user2",
    name: "Niyati",
    email: "chughniyati@gmail.com",
    passwordHash: "12345",
    avatar: "👩🏻‍💼",
    isEmailVerified: true,
    createdAt: new Date().toISOString(),
  },
];

export const CATEGORIES = [
  { name: "Food & Dining", icon: "Utensils", color: "bg-amber-500/10 text-amber-500" },
  { name: "Groceries", icon: "ShoppingCart", color: "bg-emerald-500/10 text-emerald-500" },
  { name: "Travel & Cab", icon: "Car", color: "bg-blue-500/10 text-blue-500" },
  { name: "Entertainment", icon: "Film", color: "bg-purple-500/10 text-purple-500" },
  { name: "Shopping", icon: "ShoppingBag", color: "bg-pink-500/10 text-pink-500" },
  { name: "Bills & Utilities", icon: "Zap", color: "bg-yellow-500/10 text-yellow-500" },
  { name: "Rent & Stay", icon: "Home", color: "bg-indigo-500/10 text-indigo-500" },
  { name: "Health & Wellness", icon: "HeartPulse", color: "bg-rose-500/10 text-rose-500" },
  { name: "Gifts", icon: "Gift", color: "bg-teal-500/10 text-teal-500" },
  { name: "Other", icon: "Layers", color: "bg-neutral-500/10 text-neutral-500" },
] as const;

export function formatCurrency(amount: number, symbol = "₹"): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: absAmount % 1 === 0 ? 0 : 2,
  }).format(absAmount);

  return `${isNegative ? "-" : ""}${symbol}${formatted}`;
}

export function formatDate(dateString: string): string {
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(d);
  } catch {
    return dateString;
  }
}

export function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculates net balance and summaries.
 * Positive netBalance for activeUser => activeUser is owed money
 * Negative netBalance for activeUser => activeUser owes money
 */
export function calculateBalance(
  expenses: Expense[],
  settlements: Settlement[],
  activeUserId: UserRole = "user1"
): BalanceSummary {
  let user1TotalPaid = 0;
  let user2TotalPaid = 0;
  let user1TotalShare = 0;
  let user2TotalShare = 0;
  let totalSpent = 0;

  for (const exp of expenses) {
    totalSpent += exp.amount;
    if (exp.paidBy === "user1") {
      user1TotalPaid += exp.amount;
    } else {
      user2TotalPaid += exp.amount;
    }
    user1TotalShare += exp.user1Amount || 0;
    user2TotalShare += exp.user2Amount || 0;
  }

  let rawUser1Net = user1TotalPaid - user1TotalShare;

  for (const set of settlements) {
    if (set.fromUser === "user2" && set.toUser === "user1") {
      rawUser1Net -= set.amount;
    } else if (set.fromUser === "user1" && set.toUser === "user2") {
      rawUser1Net += set.amount;
    }
  }

  const netBalance = activeUserId === "user1" ? rawUser1Net : -rawUser1Net;

  return {
    netBalance: Math.round(netBalance * 100) / 100,
    rawUser1Net: Math.round(rawUser1Net * 100) / 100,
    user1TotalPaid: Math.round(user1TotalPaid * 100) / 100,
    user2TotalPaid: Math.round(user2TotalPaid * 100) / 100,
    user1TotalShare: Math.round(user1TotalShare * 100) / 100,
    user2TotalShare: Math.round(user2TotalShare * 100) / 100,
    totalExpensesCount: expenses.length,
    totalSpent: Math.round(totalSpent * 100) / 100,
  };
}

export const INITIAL_SAMPLE_EXPENSES: Expense[] = [
  {
    id: "exp_1",
    title: "Dinner at Little Italy",
    amount: 1450,
    currency: "INR",
    category: "Food & Dining",
    date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    paidBy: "user1",
    splitType: "EQUAL_SPLIT",
    user1Amount: 725,
    user2Amount: 725,
    notes: "Split 50/50 for dinner & dessert",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "exp_2",
    title: "Grocery Mart Shopping",
    amount: 880,
    currency: "INR",
    category: "Groceries",
    date: new Date(Date.now() - 86400000 * 4).toISOString().slice(0, 10),
    paidBy: "user2",
    splitType: "EQUAL_SPLIT",
    user1Amount: 440,
    user2Amount: 440,
    notes: "Snacks, milk, vegetables",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: "exp_3",
    title: "Movie Tickets & Popcorn",
    amount: 600,
    currency: "INR",
    category: "Entertainment",
    date: new Date(Date.now() - 86400000 * 6).toISOString().slice(0, 10),
    paidBy: "user1",
    splitType: "I_PAID_FOR_HER",
    user1Amount: 0,
    user2Amount: 600,
    notes: "Rishabh paid for Niyati's ticket & combo",
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "exp_4",
    title: "Uber Ride to Airport",
    amount: 520,
    currency: "INR",
    category: "Travel & Cab",
    date: new Date(Date.now() - 86400000 * 8).toISOString().slice(0, 10),
    paidBy: "user2",
    splitType: "SHE_PAID_FOR_ME",
    user1Amount: 520,
    user2Amount: 0,
    notes: "Niyati booked Uber cab for Rishabh",
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];
