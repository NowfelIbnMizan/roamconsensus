import type { ItemCategory } from "@/generated/prisma/enums";

// Words that mark a stop as under a roof. NAME words are trusted in the place's name; BLURB words are strong enough
// to trust in its description too ("spa" would match "spacious", so everything is matched as whole words).
const NAME =
  /\b(museums?|galler(y|ies)|spa|massage|malls?|aquarium|teamlab|cinema|theat(re|er)|onsen|bathhouse|arcade|karaoke|library|bookshop|bookstore|puppet|exhibition|cooking (school|class)|tea ceremony|food (hall|court)|shopping (centre|center))\b/i;
// Food spots that are open-air: no use in the rain.
const OUTDOOR_FOOD = /\b(beach|rooftop|street|jalan|night market|deck|club|bar|sky|garden|golden gai)\b/i;
const BLURB = /\b(museum|art gallery|aquarium|indoor|cooking class|spa treatment|massage|air[- ]conditioned)\b/i;

type Spot = { name: string; blurb?: string | null; category: ItemCategory; creators: unknown[] };

export function isIndoor(p: Spot) {
  return NAME.test(p.name) || BLURB.test(p.blurb ?? "");
}

/**
 * Rainy-day backups: indoor things to do the creators recommend, most agreed-on first, then a couple of food spots
 * (eating is the classic rainy-day plan). Input should already be in consensus order.
 */
export function rainyDayPicks<T extends Spot>(consensus: T[], limit = 6) {
  const recommended = consensus.filter((p) => p.creators.length > 0);
  const things = recommended.filter((p) => p.category === "EXPERIENCE" && isIndoor(p));
  const food = recommended.filter((p) => p.category === "FOOD" && !OUTDOOR_FOOD.test(p.name)).slice(0, 2);
  return [...things.slice(0, limit - food.length), ...food].slice(0, limit);
}
