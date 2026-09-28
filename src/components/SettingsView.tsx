"use client";

import React, { useState } from "react";
import { AppSettings, Expense, Settlement, UserPublicProfile } from "@/types";
import {
  User,
  Database,
  RefreshCw,
  Check,
  Lock,
  HardDriveDownload,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from "lucide-react";

interface SettingsViewProps {
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  onSaveSettings: (settings: AppSettings) => Promise<void>;
  onUpdateProfile: (data: { name?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  onLogout: () => void;
  expenses: Expense[];
  settlements: Settlement[];
  onResetData: () => Promise<void>;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee (₹)" },
  { code: "USD", symbol: "$", label: "US Dollar ($)" },
  { code: "EUR", symbol: "€", label: "Euro (€)" },
  { code: "GBP", symbol: "£", label: "British Pound (£)" },
  { code: "AED", symbol: "AED", label: "UAE Dirham (AED)" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar (CA$)" },
  { code: "AUD", symbol: "AU$", label: "Australian Dollar (AU$)" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar (S$)" },
];

const AVATAR_OPTIONS = ["🧑🏻‍💻", "👩🏻‍💼", "🧔🏻‍♂️", "👱🏻‍♀️", "🐱", "🐶", "🦊", "🐼", "🐻", "🐰", "👑", "✨"];

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  user,
  partner,
  onSaveSettings,
  onUpdateProfile,
  onLogout,
  expenses,
  settlements,
  onResetData,
}) => {
  // User profile state
  const [userName, setUserName] = useState(user.name);
  const [userAvatar, setUserAvatar] = useState(user.avatar);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // App settings state
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol);

  // Neon DB
  const [neonUrl, setNeonUrl] = useState(settings.neonDbUrl || "");
  const [testingDb, setTestingDb] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCurrencyChange = (code: string) => {
    const found = CURRENCIES.find((c) => c.code === code);
    if (found) {
      setCurrency(found.code);
      setCurrencySymbol(found.symbol);
    }
  };

  const handleSaveProfileAndSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(null);
      setSaveError(null);

      // 1. Update Profile & Password if changed
      await onUpdateProfile({
        name: userName.trim(),
        avatar: userAvatar,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      // 2. Update General App Settings
      const newSettings: AppSettings = {
        currency,
        currencySymbol,
        neonDbConnected: settings.neonDbConnected,
        neonDbUrl: neonUrl.trim(),
      };
      await onSaveSettings(newSettings);

      setCurrentPassword("");
      setNewPassword("");
      setSaveSuccess("Profile and preferences saved successfully!");
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: any) {
      setSaveError(err.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNeonDb = async (migrate = false) => {
    if (!neonUrl.trim()) {
      setDbStatus({ success: false, message: "Please enter your Neon DB connection string" });
      return;
    }
    try {
      setTestingDb(true);
      setDbStatus(null);
      const res = await fetch("/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionString: neonUrl.trim(), migrate }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus({ success: true, message: data.message });
      } else {
        setDbStatus({ success: false, message: data.error });
      }
    } catch (err: any) {
      setDbStatus({ success: false, message: err.message || "Failed to connect to Neon DB" });
    } finally {
      setTestingDb(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      settings,
      user,
      partner,
      expenses,
      settlements,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nishsplit_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    let csv = "ID,Date,Title,Category,Amount,Paid By,Split Type,User 1 Share,User 2 Share,Notes\n";
    for (const exp of expenses) {
      csv += `"${exp.id}","${exp.date}","${exp.title.replace(/"/g, '""')}","${exp.category}",${exp.amount},"${exp.paidBy}","${exp.splitType}",${exp.user1Amount},${exp.user2Amount},"${(exp.notes || "").replace(/"/g, '""')}"\n`;
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nishsplit_expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-24">
      <div>
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Account & Settings</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">Manage your profile, password & Neon cloud sync</p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <AlertCircle className="size-4" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfileAndSettings} className="space-y-4">
        {/* Your Profile Card */}
        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              <User className="size-3.5" />
              <span>Your Profile ({user.name})</span>
            </div>
            {user.isEmailVerified && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3" />
                <span>Verified Email</span>
              </span>
            )}
          </div>

          <div>
            <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
              Registered Email (Account Recovery)
            </label>
            <input
              type="text"
              disabled
              value={user.email}
              className="w-full bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">Display Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          <div>
            <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1.5">Avatar Emoji</label>
            <div className="flex gap-1.5 flex-wrap">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setUserAvatar(emoji)}
                  className={`size-7 rounded-lg flex items-center justify-center text-xs transition ${
                    userAvatar === emoji
                      ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Change Password Sub-section */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <span className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
              <KeyRound className="size-3" />
              <span>Change Password</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <div>
                <label className="text-[10px] text-neutral-500 dark:text-neutral-400 block mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Partner Information Card (Read-only for other user) */}
        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              <span>Partner Profile</span>
            </div>
            <span className="text-[10px] text-neutral-400">Protected Details</span>
          </div>

          {partner ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <span className="text-2xl">{partner.avatar}</span>
              <div>
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 block">
                  {partner.name}
                </span>
                <span className="text-[11px] text-neutral-500 block">
                  {partner.email}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-500 py-2">
              No partner registered yet. Share the app URL to invite your partner to sign up!
            </p>
          )}
        </div>

        {/* Currency Settings */}
        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-2">
          <label className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">
            Default Currency
          </label>
          <select
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Neon DB PostgreSQL Cloud Connection */}
        <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="size-4 text-neutral-500" />
              <div>
                <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 block">Neon DB (PostgreSQL)</span>
                <span className="text-[11px] text-neutral-500">Cloud database synchronization</span>
              </div>
            </div>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                settings.neonDbConnected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
              }`}
            >
              {settings.neonDbConnected ? "Connected" : "Local File Store"}
            </span>
          </div>

          <div>
            <label className="text-[11px] text-neutral-500 dark:text-neutral-400 block mb-1">
              Neon Connection String
            </label>
            <input
              type="password"
              placeholder="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
              value={neonUrl}
              onChange={(e) => setNeonUrl(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
            />
          </div>

          {dbStatus && (
            <div
              className={`p-2.5 rounded-lg border text-xs font-medium ${
                dbStatus.success
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                  : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800"
              }`}
            >
              {dbStatus.message}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleTestNeonDb(false)}
              disabled={testingDb}
              className="flex-1 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-xs font-medium rounded-lg transition border border-neutral-200 dark:border-neutral-700"
            >
              {testingDb ? "Testing..." : "Test Connection"}
            </button>
            <button
              type="button"
              onClick={() => handleTestNeonDb(true)}
              disabled={testingDb}
              className="flex-1 py-1.5 px-3 bg-neutral-900 hover:bg-black text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-black text-xs font-medium rounded-lg transition shadow-xs"
            >
              Migrate Data
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition shadow-xs"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </button>
      </form>

      {/* Backup & Reset Actions */}
      <div className="bg-white dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 space-y-2.5">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Export & Backup
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 transition"
          >
            <HardDriveDownload className="size-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 transition"
          >
            <FileSpreadsheet className="size-3.5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button
            onClick={() => {
              if (confirm("Reset to sample expenses?")) {
                onResetData();
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className="size-3.5" />
            <span>Reset Data</span>
          </button>

          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-xs font-semibold transition"
          >
            <LogOut className="size-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
