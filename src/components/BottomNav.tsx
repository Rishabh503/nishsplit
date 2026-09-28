"use client";

import React from "react";
import { Home, Plus, BarChart3, Settings, Sun, Moon } from "lucide-react";

export type NavTab = "home" | "analytics" | "settings";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddExpense: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenAddExpense,
  theme,
  onToggleTheme,
}) => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
      <div className="flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border border-neutral-200 dark:border-neutral-800 rounded-full shadow-xl ring-1 ring-black/5 dark:ring-white/10 transition-all">
        {/* Home */}
        <button
          onClick={() => onSelectTab("home")}
          className={`size-10 rounded-full flex items-center justify-center transition-all ${
            currentTab === "home"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
          title="Expenses & Activity"
        >
          <Home className="size-4" />
        </button>

        {/* Analytics */}
        <button
          onClick={() => onSelectTab("analytics")}
          className={`size-10 rounded-full flex items-center justify-center transition-all ${
            currentTab === "analytics"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
          title="Insights & Stats"
        >
          <BarChart3 className="size-4" />
        </button>

        {/* Center Add Button */}
        <button
          onClick={onOpenAddExpense}
          className="size-11 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
          title="Add New Expense"
        >
          <Plus className="size-5 stroke-[2.5]" />
        </button>

        {/* Settings */}
        <button
          onClick={() => onSelectTab("settings")}
          className={`size-10 rounded-full flex items-center justify-center transition-all ${
            currentTab === "settings"
              ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900"
          }`}
          title="Settings & PIN"
        >
          <Settings className="size-4" />
        </button>

        <div className="w-[1px] h-5 bg-neutral-200 dark:border-neutral-800 my-auto mx-0.5" />

        {/* Theme Switcher Toggle */}
        <button
          onClick={onToggleTheme}
          className="size-10 rounded-full flex items-center justify-center text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-all"
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} mode`}
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>
    </nav>
  );
};
