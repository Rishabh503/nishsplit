"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Expense,
  Settlement,
  AppSettings,
  UserPublicProfile,
  BalanceSummary,
} from "@/types";
import { DEFAULT_SETTINGS, calculateBalance } from "@/lib/utils";
import { Header } from "@/components/Header";
import { BottomNav, NavTab } from "@/components/BottomNav";
import { BalanceCard } from "@/components/BalanceCard";
import { ExpenseList } from "@/components/ExpenseList";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { ExpenseDetailModal } from "@/components/ExpenseDetailModal";
import { SettleUpModal } from "@/components/SettleUpModal";
import { AnalyticsView } from "@/components/AnalyticsView";
import { SettingsView } from "@/components/SettingsView";
import { AuthScreen } from "@/components/AuthScreen";
import { Loader2 } from "lucide-react";

export default function Home() {
  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPublicProfile | null>(null);
  const [partner, setPartner] = useState<UserPublicProfile | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserPublicProfile[]>([]);
  const [canRegister, setCanRegister] = useState(true);

  // App data state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [currentTab, setCurrentTab] = useState<NavTab>("home");
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);

  // Theme setup
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("nishsplit_theme") as "light" | "dark" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      } else {
        document.documentElement.classList.add("dark");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    try {
      localStorage.setItem("nishsplit_theme", nextTheme);
    } catch (e) {
      // ignore
    }
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Check auth session
  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("nishsplit_session_token");
      const res = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();

      if (data.success) {
        setRegisteredUsers(data.registeredUsers || []);
        setCanRegister(!!data.canRegister);

        if (data.authenticated && data.user) {
          setAuthToken(token);
          setCurrentUser(data.user);
          setPartner(data.partner || null);
        } else {
          setAuthToken(null);
          setCurrentUser(null);
          setPartner(null);
        }
      }
    } catch (err) {
      console.error("Auth check failed:", err);
    }
  }, []);

  // Fetch expenses, settlements, and settings
  const fetchData = useCallback(async () => {
    try {
      const [expRes, setRes, settRes] = await Promise.all([
        fetch("/api/expenses"),
        fetch("/api/settlements"),
        fetch("/api/settings"),
      ]);

      const [expData, setData, settData] = await Promise.all([
        expRes.json(),
        setRes.json(),
        settRes.json(),
      ]);

      if (expData.success && Array.isArray(expData.data)) {
        setExpenses(expData.data);
      }
      if (setData.success && Array.isArray(setData.data)) {
        setSettlements(setData.data);
      }
      if (settData.success && settData.data) {
        setSettings(settData.data);
      }
    } catch (err) {
      console.error("Failed to load app data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Init
  useEffect(() => {
    const initApp = async () => {
      await checkAuth();
      await fetchData();
    };
    initApp();
  }, [checkAuth, fetchData]);

  // Handle Login / Registration Success
  const handleAuthenticated = (token: string, user: UserPublicProfile) => {
    try {
      localStorage.setItem("nishsplit_session_token", token);
    } catch (e) {
      // ignore
    }
    setAuthToken(token);
    setCurrentUser(user);
    checkAuth();
    fetchData();
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: authToken }),
        });
      }
    } catch (e) {
      // ignore
    }
    try {
      localStorage.removeItem("nishsplit_session_token");
    } catch (e) {
      // ignore
    }
    setAuthToken(null);
    setCurrentUser(null);
    setPartner(null);
    checkAuth();
  };

  // Handle Profile Update
  const handleUpdateProfile = async (profileData: {
    name?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    if (!authToken) return;
    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: authToken, ...profileData }),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update profile");
    }
    setCurrentUser(data.user);
    await checkAuth();
  };

  // Save / Update Expense
  const handleSaveExpense = async (expenseData: Partial<Expense>) => {
    const isEdit = !!expenseData.id && expenses.some((e) => e.id === expenseData.id);
    const url = isEdit ? `/api/expenses/${expenseData.id}` : "/api/expenses";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save expense");
    }

    await fetchData();
  };

  // Delete Expense
  const handleDeleteExpense = async (id: string) => {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete expense");
    }
    await fetchData();
  };

  // Save Settlement
  const handleSaveSettlement = async (settlementData: Partial<Settlement>) => {
    const res = await fetch("/api/settlements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settlementData),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save settlement");
    }
    await fetchData();
  };

  // Delete Settlement
  const handleDeleteSettlement = async (id: string) => {
    const res = await fetch(`/api/settlements?id=${id}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to delete settlement");
    }
    await fetchData();
  };

  // Save Settings
  const handleSaveSettings = async (newSettings: AppSettings) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save settings");
    }
    setSettings(data.data);
  };

  const handleResetData = async () => {
    await fetchData();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-center space-y-3">
        <div className="size-10 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-bold text-sm shadow-xs ring-2 ring-neutral-200 dark:ring-neutral-800">
          N
        </div>
        <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Opening your Duo Space...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> Show AuthScreen
  if (!currentUser || !authToken) {
    return (
      <AuthScreen
        onAuthenticated={handleAuthenticated}
        registeredUsers={registeredUsers}
        canRegister={canRegister}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  // Calculate balance from active user's perspective
  const balance: BalanceSummary = calculateBalance(expenses, settlements, currentUser.id);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 bg-dot-pattern flex flex-col transition-colors">
      {/* Header */}
      <Header
        settings={settings}
        user={currentUser}
        partner={partner}
        balance={balance}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-5 space-y-5 pb-28">
        {currentTab === "home" && (
          <>
            {/* Hero Balance Card */}
            <BalanceCard
              settings={settings}
              user={currentUser}
              partner={partner}
              balance={balance}
              onSettleUp={() => setIsSettleModalOpen(true)}
              onAddExpense={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
            />

            {/* Split Presets Quick Bar */}
            <div className="bg-white/70 dark:bg-neutral-950/70 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 shrink-0 pl-1">
                Quick Presets:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap transition"
                >
                  ⚖️ Split 50/50
                </button>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium whitespace-nowrap transition"
                >
                  🎁 Paid for {partner ? partner.name : "Partner"}
                </button>
              </div>
            </div>

            {/* Activity and Expense List */}
            <ExpenseList
              expenses={expenses}
              settlements={settlements}
              settings={settings}
              user={currentUser}
              partner={partner}
              onSelectExpense={(exp) => setSelectedExpense(exp)}
              onDeleteSettlement={handleDeleteSettlement}
              onOpenAddExpense={() => {
                setEditingExpense(null);
                setIsAddModalOpen(true);
              }}
            />
          </>
        )}

        {currentTab === "analytics" && (
          <AnalyticsView
            expenses={expenses}
            settlements={settlements}
            settings={settings}
            user={currentUser}
            partner={partner}
            balance={balance}
          />
        )}

        {currentTab === "settings" && (
          <SettingsView
            settings={settings}
            user={currentUser}
            partner={partner}
            onSaveSettings={handleSaveSettings}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
            expenses={expenses}
            settlements={settlements}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Floating Minimal Dock */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAddExpense={() => {
          setEditingExpense(null);
          setIsAddModalOpen(true);
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Add / Edit Expense Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        settings={settings}
        user={currentUser}
        partner={partner}
        initialExpense={editingExpense}
      />

      {/* Expense Detail Modal */}
      <ExpenseDetailModal
        expense={selectedExpense}
        settings={settings}
        user={currentUser}
        partner={partner}
        onClose={() => setSelectedExpense(null)}
        onEdit={(exp) => {
          setSelectedExpense(null);
          setEditingExpense(exp);
          setIsAddModalOpen(true);
        }}
        onDelete={handleDeleteExpense}
      />

      {/* Settle Up Modal */}
      <SettleUpModal
        isOpen={isSettleModalOpen}
        onClose={() => setIsSettleModalOpen(false)}
        settings={settings}
        user={currentUser}
        partner={partner}
        balance={balance}
        onSaveSettlement={handleSaveSettlement}
      />
    </div>
  );
}
