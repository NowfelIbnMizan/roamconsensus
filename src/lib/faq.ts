import { costGuideOf } from "@/lib/costs";
import type { EsimPlanRow, getDestination } from "@/lib/data";
import { formatMoney, tierLabel } from "@/lib/format";
import { bestMonths } from "@/lib/seasons";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
export type Faq = { q: string; a: string };

const list = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`);
const usd = (dollars: number) => formatMoney(Math.round(dollars) * 100);

/**
 * Questions travellers ask about a destination, answered only from our own data (itineraries, consensus, seasons,
 * cost guides, eSIM plans). A question with no data behind it is left out rather than guessed.
 */
export function destinationFaq(d: Destination, esimPlans: EsimPlanRow[]): Faq[] {
  const faq: Faq[] = [];
  const who = (n: number) => (d.creatorCount > 1 ? ` (${n} of ${d.creatorCount} creators)` : "");

  if (d.routes.length) {
    const days = d.routes.map((r) => r.days).sort((a, b) => a - b);
    const counts = new Map<number, number>();
    for (const n of days) counts.set(n, (counts.get(n) ?? 0) + 1);
    const common = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
    faq.push({
      q: `How many days do you need in ${d.name}?`,
      a:
        days[0] === days.at(-1)
          ? `The creator itineraries we compare for ${d.name} cover ${days[0]} days.`
          : `The ${days.length} creator itineraries we compare for ${d.name} run from ${days[0]} to ${days.at(-1)} days.` +
            (common[1] > 1 ? ` The most common length is ${common[0]} days.` : ""),
    });
  }

  const guide = costGuideOf(d);
  const priced = d.routes
    .filter((r) => r.totalCents > 0 && r.unpricedCount === 0)
    .sort((a, b) => a.totalCents - b.totalCents);
  if (guide || priced.length) {
    const parts: string[] = [];
    if (guide) {
      const perDay = (s: keyof typeof guide.styles) => {
        const c = guide.styles[s];
        return usd(c.food + c.localTransport + c.activities + c.stayPerNight / 2);
      };
      parts.push(
        `Typical spend per person per day, including half a double room: backpacker about ${perDay("backpacker")}, mid-range about ${perDay("midrange")}, luxury about ${perDay("luxury")} (checked ${guide.checked}).`,
      );
    }
    if (priced.length) {
      const r = priced[0];
      parts.push(
        `The cheapest fully priced creator route is ${r.creator.name}'s "${r.title}": about ${formatMoney(r.totalCents)} per person for ${r.days} days (${tierLabel[r.tier].toLowerCase()}).`,
      );
    }
    faq.push({ q: `How much does a trip to ${d.name} cost?`, a: parts.join(" ") });
  }

  const best = bestMonths(d.months);
  if (best) {
    faq.push({
      q: `When is the best time to visit ${d.name}?`,
      a: `The best months for ${d.name} are ${best}, based on rainfall, temperature and crowds month by month.`,
    });
  }

  const top = (category: string, n: number) =>
    d.consensus.filter((p) => p.category === category && p.creators.length > 0).slice(0, n);
  const things = top("EXPERIENCE", 5);
  if (things.length) {
    faq.push({
      q: `What are the top things to do in ${d.name}?`,
      a: `The things creators recommend most in ${d.name}: ${list(things.map((p) => `${p.name}${who(p.creators.length)}`))}.`,
    });
  }
  const food = top("FOOD", 4);
  if (food.length) {
    faq.push({
      q: `Where should you eat in ${d.name}?`,
      a: `The food spots creators recommend most: ${list(food.map((p) => `${p.name}${p.area ? ` in ${p.area}` : ""}`))}.`,
    });
  }
  const stays = top("STAY", 4);
  if (stays.length) {
    const areas = [...new Set(stays.flatMap((p) => (p.area ? [p.area] : [])))];
    faq.push({
      q: `Where should you stay in ${d.name}?`,
      a:
        `Creators' hotel picks include ${list(stays.map((p) => p.name))}.` +
        (areas.length > 1 ? ` Popular areas to stay: ${list(areas)}.` : ""),
    });
  }

  if (esimPlans.length) {
    const providers = new Set(esimPlans.map((p) => p.provider)).size;
    const cheapest = esimPlans.find((p) => p.currency === "USD") ?? esimPlans[0];
    faq.push({
      q: `Which eSIM should you get for ${d.country}?`,
      a: `We compare ${esimPlans.length} ${d.country} eSIM plans from ${providers} providers. The cheapest is ${cheapest.provider} ${cheapest.name} at ${formatMoney(cheapest.priceCents, cheapest.currency)} for ${cheapest.days} days. Pick by how much data you use and how long you stay.`,
    });
  }

  return faq;
}

export function faqJsonLd(faq: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
