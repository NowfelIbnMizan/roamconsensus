import type { ItemCategory } from "@/generated/prisma/enums";

/** Trip styles for the quiz and trip finder. A stop matches a vibe when its text mentions one of the words. */
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
    words: [
      "temple",
      "pura ",
      "palace",
      "dance",
      "kecak",
      "market",
      " art ",
      "museum",
      "gajah",
      "lempuyang",
      "heaven",
      "wat ",
      "shrine",
      "castle",
      "old town",
      "gallery",
      "palace",
    ],
  },
  {
    key: "nature",
    label: "Nature & adventure",
    emoji: "🌋",
    words: [
      "hike",
      "mount",
      "volcano",
      "waterfall",
      "rice",
      "terrace",
      "rafting",
      "jungle",
      "sunrise",
      "trek",
      "garden",
      " park",
      "mountain",
      "forest",
      "doi ",
    ],
  },
  {
    key: "food",
    label: "Food & cafés",
    emoji: "🍜",
    words: [
      "cafe",
      "café",
      "coffee",
      "restaurant",
      "warung",
      "dinner",
      "brunch",
      "pizza",
      "kitchen",
      "street food",
      "food tour",
      "hawker",
      "night market",
      "ramen",
      "sushi",
      "noodle",
    ],
    category: "FOOD" as ItemCategory,
  },
  {
    key: "nightlife",
    label: "Beach clubs & nightlife",
    emoji: "🍹",
    words: ["beach club", " bar", "lounge", "party", "cocktail", "nightlife", "rooftop", "izakaya", "pub"],
  },
  {
    key: "wellness",
    label: "Spa & wellness",
    emoji: "🧘",
    words: ["spa", "yoga", "massage", "wellness", "retreat", "healing", "onsen", "sauna", "jjimjilbang"],
  },
] as const;

export type VibeKey = (typeof VIBES)[number]["key"];

export function vibesOf(text: string, category: ItemCategory): VibeKey[] {
  const t = ` ${text.toLowerCase()} `;
  return VIBES.filter((v) => ("category" in v && v.category === category) || v.words.some((w) => t.includes(w))).map(
    (v) => v.key,
  );
}
