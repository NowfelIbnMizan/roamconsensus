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
