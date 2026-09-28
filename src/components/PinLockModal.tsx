"use client";

import React, { useState } from "react";
import { AppSettings, UserRole } from "@/types";
import { Lock, Delete } from "lucide-react";

interface PinLockModalProps {
  isOpen: boolean;
  settings: AppSettings;
  activeUser: UserRole;
  onUnlock: () => void;
  onSwitchUser: (user: UserRole) => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  settings,
  activeUser,
  onUnlock,
  onSwitchUser,
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const currentUser = activeUser === "user1" ? settings.user1 : settings.user2;
  const correctPin = currentUser.pinHash || "1234";

  const handleKeyPress = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError(false);

      if (newPin === correctPin) {
        setTimeout(() => {
          setPin("");
          onUnlock();
        }, 150);
      } else if (newPin.length >= correctPin.length) {
        setError(true);
        setTimeout(() => {
          setPin("");
          setError(false);
        }, 600);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xs flex flex-col items-center text-center space-y-6">
        
        {/* User Avatar & Title */}
        <div className="space-y-2">
          <div className="relative inline-block">
            <div className="size-20 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-4xl shadow-md ring-4 ring-neutral-100 dark:ring-neutral-900">
              {currentUser.avatar}
            </div>
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-black text-white dark:bg-white dark:text-black border-2 border-white dark:border-black flex items-center justify-center">
              <Lock className="size-3.5" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {currentUser.name}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Enter passcode to unlock (Default: 1234)
            </p>
          </div>
        </div>

        {/* User Switcher Pill */}
        <div className="flex bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full p-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => {
              onSwitchUser("user1");
              setPin("");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeUser === "user1"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {settings.user1.avatar} {settings.user1.name}
          </button>
          <button
            type="button"
            onClick={() => {
              onSwitchUser("user2");
              setPin("");
            }}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
              activeUser === "user2"
                ? "bg-black text-white dark:bg-white dark:text-black shadow-xs"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            {settings.user2.avatar} {settings.user2.name}
          </button>
        </div>

        {/* PIN Dots */}
        <div className={`flex gap-3 my-1 ${error ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`size-3 rounded-full transition-all duration-200 ${
                idx < pin.length
                  ? error
                    ? "bg-rose-500 scale-110"
                    : "bg-black dark:bg-white scale-110"
                  : "bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-semibold text-rose-500">
            Incorrect passcode. Try again.
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 active:scale-95 border border-neutral-200 dark:border-neutral-800 text-lg font-bold text-neutral-900 dark:text-neutral-100 transition flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={onUnlock}
            className="h-12 rounded-xl bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-medium text-neutral-500 transition flex items-center justify-center"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 active:scale-95 border border-neutral-200 dark:border-neutral-800 text-lg font-bold text-neutral-900 dark:text-neutral-100 transition flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 active:scale-95 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 transition flex items-center justify-center"
          >
            <Delete className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
