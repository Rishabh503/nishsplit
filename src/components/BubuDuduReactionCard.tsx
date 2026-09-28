"use client";

import React, { useState } from "react";
import { UserPublicProfile, AppSettings, BalanceSummary } from "@/types";
import { getBubuDuduReaction, BUBU_DUDU_QUOTES } from "@/lib/bubuDuduData";
import { Sparkles, MessageCircle, Heart, Check, Copy, AlertCircle } from "lucide-react";

interface BubuDuduReactionCardProps {
  settings: AppSettings;
  user: UserPublicProfile;
  partner: UserPublicProfile | null;
  balance: BalanceSummary;
  onSettleUp: () => void;
}

export const BubuDuduReactionCard: React.FC<BubuDuduReactionCardProps> = ({
  settings,
  user,
  partner,
  balance,
  onSettleUp,
}) => {
  const [copied, setCopied] = useState(false);
  const [poked, setPoked] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const sym = settings.currencySymbol || "₹";
  const partnerName = partner ? partner.name : "Partner";
  const userNet = balance.netBalance;

  const mood = getBubuDuduReaction(userNet, user.name, partnerName, sym);

  React.useEffect(() => {
    setImgError(false);
  }, [mood.gifUrl]);

  const handleCopyReminder = () => {
    const absAmt = Math.abs(userNet).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
    let text = "";
    if (userNet < -0.01) {
      text = `🐾 *Bubu & Dudu Alert!* 🐻🐼\nHey ${partnerName}! I know I owe you ${sym}${absAmt}. Don't poke me, settling up soon on NishSplit! 💖`;
    } else if (userNet > 0.01) {
      text = `🐾 *Bubu & Dudu Nudge!* 🐻🐼\nHey ${partnerName}! You owe me ${sym}${absAmt} on NishSplit! Time to buy me treats & snacks! 🍕🧋`;
    } else {
      text = `🐾 *Bubu & Dudu Love!* 🐻🐼\nHey ${partnerName}! Our expenses are 100% settled up! We are totally even! 🥰✨`;
    }

    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePoke = () => {
    setPoked(true);
    setQuoteIndex((prev) => (prev + 1) % BUBU_DUDU_QUOTES.length);
    setTimeout(() => setPoked(false), 800);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-pink-200/60 dark:border-pink-900/40 bg-linear-to-br from-pink-50/70 via-rose-50/40 to-amber-50/50 dark:from-pink-950/20 dark:via-neutral-900/60 dark:to-amber-950/20 backdrop-blur-md p-4 sm:p-5 shadow-xs transition-all hover:shadow-md">
      {/* Decorative background glow */}
      <div className="absolute -top-10 -right-10 size-32 bg-pink-400/10 dark:bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 size-32 bg-amber-400/10 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border bg-white/80 dark:bg-neutral-900/80 shadow-2xs">
          <span className="text-sm">🐾</span>
          <span className="bg-linear-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent">
            Bubu & Dudu Live Mood
          </span>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${mood.badgeColor}`}
        >
          {mood.badgeText}
        </span>
      </div>

      {/* Content Grid */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Animated Sticker Box */}
        <div
          onClick={handlePoke}
          role="button"
          tabIndex={0}
          title="Tap to poke Bubu & Dudu!"
          className={`relative group shrink-0 size-24 sm:size-28 rounded-2xl bg-white/90 dark:bg-neutral-900/90 border border-pink-200 dark:border-pink-900/50 p-2 shadow-sm flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 ${
            poked ? "animate-bounce" : ""
          }`}
        >
          {!imgError ? (
            <img
              src={mood.gifUrl}
              alt="Bubu and Dudu animation"
              className="w-full h-full object-contain rounded-xl select-none pointer-events-none"
              onError={() => setImgError(true)}
              loading="eager"
            />
          ) : (
            <div className="text-4xl select-none">{mood.fallbackEmoji}</div>
          )}

          {/* Poke heart badge */}
          <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white p-1 rounded-full shadow-xs transform scale-0 group-hover:scale-100 transition-transform">
            <Heart className="size-2.5 fill-current" />
          </div>

          <div className="absolute bottom-1 right-1 text-[9px] bg-black/60 text-white px-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
            Poke!
          </div>
        </div>

        {/* Speech Bubble & Interactive Dialogue */}
        <div className="flex-1 text-center sm:text-left space-y-2 w-full">
          <div className="flex items-center justify-center sm:justify-start gap-1.5">
            <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100">
              {mood.title}
            </h3>
            {poked && (
              <span className="text-xs text-rose-500 font-bold animate-ping">
                ❤️ Poked!
              </span>
            )}
          </div>

          <div className="relative bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl p-3 text-xs sm:text-[13px] text-neutral-700 dark:text-neutral-300 shadow-2xs leading-relaxed">
            <p>{mood.speech}</p>
          </div>

          {/* Quick Actions for Bubu & Dudu */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            {userNet < -0.01 && (
              <button
                type="button"
                onClick={onSettleUp}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>{mood.actionLabel}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyReminder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    Copied to clipboard!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Send Cute WhatsApp Nudge</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePoke}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-pink-600 dark:text-pink-400 hover:bg-pink-100/50 dark:hover:bg-pink-950/40 transition active:scale-95 cursor-pointer"
            >
              <Heart className="size-3 fill-current" />
              <span>Couple Quote</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Quote Footer */}
      <div className="mt-3 pt-2.5 border-t border-pink-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 italic">
        <span>✨ {BUBU_DUDU_QUOTES[quoteIndex]}</span>
        <button
          type="button"
          onClick={handlePoke}
          className="text-neutral-400 hover:text-pink-500 transition not-italic text-[10px] underline ml-2 shrink-0 cursor-pointer"
        >
          Next tip
        </button>
      </div>
    </div>
  );
};
