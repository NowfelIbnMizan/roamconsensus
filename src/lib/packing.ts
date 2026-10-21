import type { CartItem } from "@/lib/cart-store";

type Rule = { words: string[]; items: string[] };

const ALWAYS = [
  "Passport (6+ months left) and a photo of it on your phone",
  "Travel insurance details",
  "Universal plug adapter",
  "Reef-safe sunscreen and a hat",
  "Insect repellent (DEET or picaridin)",
  "Rehydration salts and basic meds",
  "Light rain jacket (wet season is roughly Nov–Mar)",
];

/** Extra gear when a stop in the trip mentions one of the words. */
const RULES: Rule[] = [
  {
    words: ["hike", "mount", "volcano", "trek", "sunrise"],
    items: ["Hiking shoes with grip", "Headlamp for pre-dawn starts", "Warm layer: summits can be about 10°C"],
  },
  {
    words: ["beach", "surf", "snorkel", "bay", "island", "penida", "billabong"],
    items: ["Swimwear", "Sandals or flip-flops", "Quick-dry towel"],
  },
  {
    words: ["temple", "pura ", "palace", "heaven", "lempuyang", "tirta", "goa gajah"],
    items: ["Sarong and sash (or rent one at the gate)", "Top that covers your shoulders"],
  },
  {
    words: ["ferry", "boat", "penida", "lembongan", "gili"],
    items: ["Motion-sickness tablets", "Dry bag for the boat"],
  },
  { words: ["waterfall", "rafting", "river"], items: ["Water shoes", "Waterproof phone pouch"] },
  { words: ["beach club", "lounge", "cocktail", "dinner"], items: ["One smart outfit for beach clubs and dinners"] },
  { words: ["yoga", "spa", "retreat"], items: ["Comfy layers for yoga and spa days"] },
];

/** Packing list for a trip: the basics plus what its stops call for, each with the stops that need it. */
export function packingList(items: CartItem[]) {
  const list = ALWAYS.map((item) => ({ item, for: [] as string[] }));
  for (const rule of RULES) {
    const stops = items
      .filter((i) => rule.words.some((w) => ` ${i.name.toLowerCase()} `.includes(w)))
      .map((i) => i.name);
    if (stops.length) for (const item of rule.items) list.push({ item, for: stops });
  }
  return list;
}
