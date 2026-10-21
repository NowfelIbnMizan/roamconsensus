import type { ItemCategory } from "@/generated/prisma/enums";

/** Trip styles for the quiz. A stop matches a vibe when its text mentions one of the words. */
export const VIBES = [
  {
    key: "beach",
    label: "Beaches & sunsets",
    emoji: "🏖️",
    words: ["beach", "bay", "surf", "sunset", "snorkel", "island", "penida", "billabong", "coast"],
  },
  {
    key: "culture",
    label: "Temples & culture",
    emoji: "🛕",
    words: ["temple", "pura ", "palace", "dance", "kecak", "market", " art ", "museum", "gajah", "lempuyang", "heaven"],
  },
  {
    key: "nature",
    label: "Nature & adventure",
    emoji: "🌋",
    words: ["hike", "mount", "volcano", "waterfall", "rice", "terrace", "rafting", "jungle", "sunrise", "trek"],
  },
  {
    key: "food",
    label: "Food & cafés",
    emoji: "🍜",
    words: ["cafe", "café", "coffee", "restaurant", "warung", "dinner", "brunch", "pizza", "kitchen"],
    category: "FOOD" as ItemCategory,
  },
  {
    key: "nightlife",
    label: "Beach clubs & nightlife",
    emoji: "🍹",
    words: ["beach club", " bar", "lounge", "party", "cocktail", "nightlife"],
  },
  {
    key: "wellness",
    label: "Spa & wellness",
    emoji: "🧘",
    words: ["spa", "yoga", "massage", "wellness", "retreat", "healing"],
  },
] as const;

export type VibeKey = (typeof VIBES)[number]["key"];

export function vibesOf(text: string, category: ItemCategory): VibeKey[] {
  const t = ` ${text.toLowerCase()} `;
  return VIBES.filter((v) => ("category" in v && v.category === category) || v.words.some((w) => t.includes(w))).map(
    (v) => v.key,
  );
}
