"use client";

import React, { useState } from "react";
import { UserPublicProfile } from "@/types";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Check,
  AlertCircle,
  Sun,
  Moon,
  Users,
} from "lucide-react";

interface AuthScreenProps {
  onAuthenticated: (token: string, user: UserPublicProfile) => void;
  registeredUsers: UserPublicProfile[];
  canRegister: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type AuthMode = "login" | "register" | "verify" | "forgot" | "reset";

const AVATAR_OPTIONS = ["🧑🏻‍💻", "👩🏻‍💼", "🧔🏻‍♂️", "👱🏻‍♀️", "🐱", "🐶", "🦊", "🐼", "🐻", "🐰", "👑", "✨"];

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthenticated,
  registeredUsers,
  canRegister,
  theme,
  onToggleTheme,
}) => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regAvatar, setRegAvatar] = useState("🧑🏻‍💻");

  // OTP Verification fields
  const [verifyEmail, setVerifyEmail] = useState("");
  const [otp, setOtp] = useState("");

  // Forgot / Reset fields
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError("Please enter your name/email and password");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Login failed");
      }
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // Quick Preset Login
  const handleQuickLogin = (email: string) => {
    setIdentifier(email);
    setPassword("12345");
  };

  // Handle Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError("Please fill out all registration fields");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          avatar: regAvatar,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }

      setVerifyEmail(data.email);
      setSuccessMsg(`Verification code sent to ${data.email}!`);
      setMode("verify");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Please enter the 6-digit verification code sent to your email");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, otp: otp.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }
      onAuthenticated(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Request Forgot Password OTP
  const handleRequestForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError("Please enter your registered email");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to send reset code");
      }
      setSuccessMsg(`Password reset OTP has been sent to ${data.email}. Please check your email inbox.`);
      setMode("reset");
    } catch (err: any) {
      setError(err.message || "Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPassword) {
      setError("Please enter the reset code and a new password");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Password reset failed");
      }
      setSuccessMsg("Password reset successfully! Please sign in with your new password.");
      setIdentifier(forgotEmail);
      setPassword(newPassword);
      setMode("login");
    } catch (err: any) {
      setError(err.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 bg-dot-pattern flex flex-col justify-center items-center p-4 transition-colors">
      {/* Top Bar with Theme Toggle */}
      <div className="fixed top-4 right-4 z-20">
        <button
          onClick={onToggleTheme}
          className="size-9 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition shadow-xs"
          title="Toggle theme"
        >
          {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-5 animate-in fade-in duration-300 my-auto">
        {/* Logo and Intro */}
        <div className="text-center space-y-1.5">
          <div className="size-12 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center font-bold text-lg mx-auto shadow-sm ring-4 ring-neutral-100 dark:ring-neutral-900 text-neutral-900 dark:text-neutral-100">
            N
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            NishSplit
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Private 2-Person Shared Expense Splitter
          </p>

          {/* 2-User Duo Space Capacity Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mt-2">
            <Users className="size-3 text-neutral-500" />
            <span>
              Duo Members: <strong>{registeredUsers.length}/2 Registered</strong>
            </span>
          </div>
        </div>

        {/* Main Auth Container Card */}
        <div className="bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <Check className="size-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN MODE */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Sign In to Your Space</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enter your email/name and password to access your expenses
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Email or Display Name
                  </label>
                  <div className="relative">
                    <User className="size-3.5 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. nishant@example.com or Nishant"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setMode("forgot");
                      }}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="size-3.5 text-neutral-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Preset Selector if default users exist */}
              {registeredUsers.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1.5">
                    Quick Select Profile:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {registeredUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleQuickLogin(u.email)}
                        className="flex items-center gap-1.5 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-left text-xs transition"
                      >
                        <span className="text-base">{u.avatar}</span>
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-neutral-900 dark:text-neutral-100 block truncate">
                            {u.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 truncate block">
                            {u.email}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>

              {/* Toggle to Register */}
              <div className="pt-2 text-center text-xs text-neutral-500">
                {canRegister ? (
                  <span>
                    New to this duo space?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMsg(null);
                        setMode("register");
                      }}
                      className="font-bold text-neutral-900 dark:text-neutral-100 hover:underline"
                    >
                      Register as Member #{registeredUsers.length + 1}
                    </button>
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-400">
                    Both 2 member slots are occupied. Sign in with your registered account.
                  </span>
                )}
              </div>
            </form>
          )}

          {/* 2. REGISTER MODE */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  Register as Member #{registeredUsers.length + 1}
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Create your profile to start splitting expenses
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nishant"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Your Email (Used for verification & recovery)
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1.5">
                    Pick Avatar
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setRegAvatar(emoji)}
                        className={`size-7 rounded-lg flex items-center justify-center text-xs transition ${
                          regAvatar === emoji
                            ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Sending verification code..." : "Send Verification Code"}
              </button>

              <div className="text-center text-xs text-neutral-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccessMsg(null);
                    setMode("login");
                  }}
                  className="font-bold text-neutral-900 dark:text-neutral-100 hover:underline"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* 3. VERIFY EMAIL OTP MODE */}
          {mode === "verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Verify Your Email</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enter the 6-digit code sent to <strong className="text-neutral-800 dark:text-neutral-200">{verifyEmail}</strong>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Verifying..." : "Verify & Enter App"}
              </button>

              <div className="text-center text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="hover:underline text-neutral-600 dark:text-neutral-400"
                >
                  Change Email / Back
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD MODE */}
          {mode === "forgot" && (
            <form onSubmit={handleRequestForgotOtp} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Reset Password</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enter your registered email to receive a recovery code
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                  Registered Email
                </label>
                <div className="relative">
                  <Mail className="size-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Sending reset code..." : "Send Reset Code"}
              </button>

              <div className="text-center text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="hover:underline text-neutral-600 dark:text-neutral-400"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 5. RESET PASSWORD MODE (Enter OTP + New Password) */}
          {mode === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Create New Password</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enter the 6-digit OTP code sent to <strong className="text-neutral-800 dark:text-neutral-200">{forgotEmail}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-2 text-center text-base tracking-widest font-bold text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 block mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold text-xs hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-[0.99] transition disabled:opacity-50 shadow-sm"
              >
                {loading ? "Updating..." : "Save New Password"}
              </button>

              <div className="text-center text-xs text-neutral-500">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="hover:underline text-neutral-600 dark:text-neutral-400"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
