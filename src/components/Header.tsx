"use client";

import React from "react";
import { UserPublicProfile, AppSettings, BalanceSummary } from "@/types";
import { LogOut, Sun, Moon, ShieldCheck } from "lucide-react";

interface HeaderProps {
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  balance: BalanceSummary;
  onLogout: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  user,
  partner,
  balance,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-neutral-200/80 dark:border-neutral-800/80 px-4 py-3 transition-colors">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-bold text-sm shadow-xs text-neutral-900 dark:text-neutral-100 ring-2 ring-neutral-200/50 dark:ring-neutral-800/50">
            N
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">
                NishSplit
              </span>
              <span className="px-1.5 py-0.2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
                Private Duo
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <span>Logged in as:</span>
              <strong className="text-neutral-800 dark:text-neutral-200">{user.name}</strong>
              {user.isEmailVerified && <ShieldCheck className="size-3 text-emerald-500" />}
            </p>
          </div>
        </div>

        {/* User Pill & Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* User Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            <span className="text-sm">{user.avatar}</span>
            <span className="max-w-[70px] truncate">{user.name}</span>
          </div>

          {/* Theme Quick Toggle */}
          <button
            onClick={onToggleTheme}
            className="size-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition shadow-xs"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="size-8 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition shadow-xs"
            title="Sign Out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
