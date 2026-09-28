export interface BubuDuduMood {
  id: string;
  title: string;
  speech: string;
  gifUrl: string;
  fallbackEmoji: string;
  badgeText: string;
  badgeColor: string;
  actionLabel?: string;
}

export const getBubuDuduReaction = (
  netBalance: number,
  userName: string,
  partnerName: string,
  currencySymbol: string = "₹"
): BubuDuduMood => {
  const absAmount = Math.abs(netBalance).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

  if (Math.abs(netBalance) < 0.01) {
    // Settled up / Zero balance
    return {
      id: "settled",
      title: "All Settled & Zero Debt! 🥰",
      speech: `Bubu & Dudu are cuddling happily! You and ${partnerName} are totally even. No debts, 100% pure love! ❤️`,
      gifUrl: "/stickers/bubu_hug.gif",
      fallbackEmoji: "🐻❤️🐼",
      badgeText: "Peace & Love",
      badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      actionLabel: "Celebrate Duo Love 🎉",
    };
  }

  if (netBalance < -0.01) {
    // Current user owes money (Dudu owes Bubu)
    return {
      id: "you_owe",
      title: "Hey! Gib Money Back! 😾💸",
      speech: `Bubu is poking you repeatedly: "${userName}! You owe ${partnerName} ${currencySymbol}${absAmount}! Pay up now or no treats/boba today! 😤🐾"`,
      gifUrl: "/stickers/bubu_angry.gif",
      fallbackEmoji: "🐼💢🐻",
      badgeText: `Owes ${currencySymbol}${absAmount}`,
      badgeColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      actionLabel: `Settle ${currencySymbol}${absAmount} Now 💸`,
    };
  }

  // Current user is owed money (Bubu owes Dudu / Partner owes you)
  return {
    id: "you_are_owed",
    title: "Waiting For My Royal Treat 😎💰",
    speech: `Dudu is relaxing with sunglasses: "${partnerName} owes you ${currencySymbol}${absAmount}! Time to demand sweet treats, snacks, or dinner! 🍕👑"`,
    gifUrl: "/stickers/bubu_treat.gif",
    fallbackEmoji: "🐻🕶️🐼",
    badgeText: `Collect ${currencySymbol}${absAmount}`,
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    actionLabel: `Nudge ${partnerName} for Treats 📲`,
  };
};

export const BUBU_DUDU_SPLIT_STICKERS: Record<
  string,
  { title: string; subtitle: string; gifUrl: string; emoji: string }
> = {
  EQUAL_SPLIT: {
    title: "50/50 Fair & Square",
    subtitle: "Bubu & Dudu share everything equally!",
    gifUrl: "/stickers/bubu_dance.gif",
    emoji: "🍕🐻🐼",
  },
  I_PAID_FOR_HER: {
    title: "Treat Mode Activated! 💖",
    subtitle: "You pampered your partner 100%! Sugar hero energy!",
    gifUrl: "/stickers/bubu_pamper.gif",
    emoji: "🎁✨🐻",
  },
  SHE_PAID_FOR_ME: {
    title: "Spoiled Baby Mode 👑",
    subtitle: "Partner covered 100% for you! Say thank you with extra hugs!",
    gifUrl: "/stickers/bubu_pat.gif",
    emoji: "🥺🌸🐼",
  },
  CUSTOM_SPLIT: {
    title: "Math Genius Mode 🧮",
    subtitle: "Bubu with calculator crunching exact numbers!",
    gifUrl: "/stickers/bubu_math.gif",
    emoji: "🤓📊🐾",
  },
};

export const BUBU_DUDU_SETTLED_GIF = "/stickers/bubu_hug.gif";

export const BUBU_DUDU_EMPTY_STATE_GIF = "/stickers/bubu_sleep.gif";

export const BUBU_DUDU_QUOTES = [
  "Bubu rule #1: Boba tea expenses are non-negotiable! 🧋",
  "Dudu rule #2: Late settlements require 10 extra warm hugs! 🫂",
  "Splitwise who? Bubu & Dudu keep our love balanced! 💖",
  "A couple that splits bills together, travels the world together! ✈️🌍",
  "Warning: Stealing partner's french fries without paying is a crime! 🍟😾",
];
