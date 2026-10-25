import type { CartItem } from "@/lib/cart-store";

/** The city most of these stops are in. */
export function cityOf(items: CartItem[]) {
  const count = new Map<string, { slug: string; name: string; n: number }>();
  for (const i of items)
    if (i.destination) {
      const c = count.get(i.destination.slug) ?? { ...i.destination, n: 0 };
      count.set(c.slug, { ...c, n: c.n + 1 });
    }
  return [...count.values()].sort((a, b) => b.n - a.n)[0] ?? null;
}

const DAY_MS = 86_400_000;
const localToday = () => {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Which trip day today is, from the start date; null before the trip starts, after it ends, or with no date. */
export function tripDayToday(startDate: string | null, days: number) {
  if (!startDate) return null;
  const n =
    Math.floor((localToday() - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS) +
    1;
  return n >= 1 && n <= days ? n : null;
}
