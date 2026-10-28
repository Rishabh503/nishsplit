export type UserRole = 'user1' | 'user2';

export interface AppUser {
  id: UserRole;
  name: string;
  email: string;
  passwordHash: string;
  avatar: string;
  isEmailVerified: boolean;
  verificationOtp?: string;
  otpExpiresAt?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface UserPublicProfile {
  id: UserRole;
  name: string;
  email: string;
  avatar: string;
  isEmailVerified: boolean;
}

export type SplitType = 
  | 'EQUAL_SPLIT'      // Split 50/50 (whoever paid, the other pays half)
  | 'I_PAID_FOR_HER'   // User 1 paid 100% for User 2 (User 2 owes 100%)
  | 'SHE_PAID_FOR_ME'  // User 2 paid 100% for User 1 (User 1 owes 100%)
  | 'CUSTOM_SPLIT';    // Exact amounts specified for each user

export type ExpenseCategory = 
  | 'Food & Dining'
  | 'Groceries'
  | 'Travel & Cab'
  | 'Entertainment'
  | 'Shopping'
  | 'Bills & Utilities'
  | 'Rent & Stay'
  | 'Health & Wellness'
  | 'Gifts'
  | 'Other';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string; // ISO date string YYYY-MM-DD
  paidBy: UserRole; // 'user1' or 'user2'
  splitType: SplitType;
  user1Amount: number; // User 1's share
  user2Amount: number; // User 2's share
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  fromUser: UserRole;
  toUser: UserRole;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface AppSettings {
  currency: string;
  currencySymbol: string;
  neonDbConnected?: boolean;
  neonDbUrl?: string;
}

export interface BalanceSummary {
  netBalance: number; // relative to active user: positive means active user is owed, negative means active user owes
  rawUser1Net: number; // user1 perspective
  user1TotalPaid: number;
  user2TotalPaid: number;
  user1TotalShare: number;
  user2TotalShare: number;
  totalExpensesCount: number;
  totalSpent: number;
}

/* Personal (non-shared) expense tracker, one list per user */

export type PaymentMethod = 'cash' | 'upi';

export interface PersonalExpense {
  id: string;
  userId: UserRole;
  title: string;
  amount: number; // Full bill. For a group split this is the whole group bill.
  method: PaymentMethod;
  spentOn: string; // YYYY-MM-DD
  isSplit: boolean;
  people: number; // People in the split, including me
  myShare: number; // What this expense actually cost me
  paidByMe: boolean; // true: I paid the bill (others owe me). false: someone else paid (I owe my share)
  settled: boolean; // Split only: I got my money back / I paid my share
  splitWith: string;
  note: string;
  createdAt: string;
}

export type PersonalExpenseInput = Omit<PersonalExpense, 'id' | 'userId' | 'createdAt'>;

export interface PersonalSummary {
  totalSpent: number;
  cashOut: number;
  upiOut: number;
  toReceive: number;
  toPay: number;
  count: number;
}
