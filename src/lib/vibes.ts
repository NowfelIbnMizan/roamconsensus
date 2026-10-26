import type { ItemCategory } from "@/generated/prisma/enums";

/**
 * Trip styles for the quiz and trip finder. A stop matches a vibe when its text mentions one of the words (whole
 * words only). Vibes with `nameOnly` match the stop's own name, not its notes: "great sunset views" doesn't make a
 * temple a beach.
 */
export const VIBES = [
  {
    key: "beach",
    label: "Beaches & sunsets",
    emoji: "🏖️",
    words: ["beach", "bay", "surf", "sunset", "snorkel", "snorkelling", "island", "penida", "coast"],
    /** City sights that only sound coastal. */
    not: ["marina bay", "gardens by the bay", "marina bay sands"],
    nameOnly: true,
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
      "hiking",
      "trekking",
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
    /**
     * In a non-food stop's notes, only these count: "park at the café lot" or "find a restaurant nearby" doesn't make
     * rice terraces a food stop. The stop's own name still matches every word above.
     */
    detailWords: ["street food", "food tour", "hawker", "night market", "ramen", "sushi", "noodle", "takoyaki", "food stall"],
    category: "FOOD" as ItemCategory,
  },
  {
    key: "nightlife",
    label: "Beach clubs & nightlife",
    emoji: "🍹",
    words: ["beach club", "bar", "lounge", "party", "cocktail", "nightlife", "rooftop", "izakaya", "pub", "speakeasy"],
  },
  {
    key: "wellness",
    label: "Spa & wellness",
    emoji: "🧘",
    words: ["spa", "yoga", "massage", "wellness", "retreat", "healing", "onsen", "sauna", "jjimjilbang"],
  },
] as const;

export type VibeKey = (typeof VIBES)[number]["key"];

const escape = (w: string) => w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordsPattern = (words: readonly string[]) =>
  new RegExp(`(?:^|[^\\p{L}])(?:${words.map(escape).join("|")})(?:s|es)?(?![\\p{L}])`, "u");
const patterns = new Map(VIBES.map((v) => [v.key, wordsPattern(v.words)]));
const detailPatterns = new Map<VibeKey, RegExp>(
  VIBES.flatMap((v) => ("detailWords" in v ? [[v.key, wordsPattern(v.detailWords)] as const] : [])),
);

/** Vibes of a stop, from its own name (`name`) and its notes and place blurb (`detail`). */
export function vibesOf(name: string, detail: string, category: ItemCategory): VibeKey[] {
  return VIBES.filter((v) => {
    if ("category" in v && v.category === category) return true;
    const strict = detailPatterns.get(v.key);
    if (strict) return patterns.get(v.key)!.test(name.toLowerCase()) || strict.test(detail.toLowerCase());
    let text = ("nameOnly" in v ? name : `${name} ${detail}`).toLowerCase();
    if ("not" in v) for (const n of v.not) text = text.replaceAll(n, " ");
    return patterns.get(v.key)!.test(text);
  }).map((v) => v.key);
}
