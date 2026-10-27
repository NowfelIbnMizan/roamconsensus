import type { CartItem } from "@/lib/cart-store";

/** What a shared trip link carries: item ids with quantity and day, and the trip length. Prices load fresh. */
export type SharedTrip = {
  days: number;
  items: { id: string; quantity: number; day: number | null; slug: string }[];
};

const toBase64Url = (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fromBase64Url = (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/"));

/**
 * Link payload: [days, itinerary slugs, rows of [slug index, id after "<slug>--", quantity, day]]. Ids that don't
 * start with their itinerary's slug (renamed in admin) are kept whole, marked with "~".
 */
export function encodeTrip(items: CartItem[], days: number) {
  const slugs = [...new Set(items.map((i) => i.itinerary.slug))];
  const rows = items.map((i) => {
    const prefix = `${i.itinerary.slug}--`;
    const rest = i.id.startsWith(prefix) ? i.id.slice(prefix.length) : `~${i.id}`;
    return [slugs.indexOf(i.itinerary.slug), rest, i.quantity, i.day ?? 0];
  });
  return toBase64Url(JSON.stringify([days, slugs, rows]));
}

export function decodeTrip(token: string): SharedTrip | null {
  try {
    const [days, slugs, rows] = JSON.parse(fromBase64Url(token)) as [
      number,
      string[],
      [number, string, number, number][],
    ];
    if (!Number.isInteger(days) || !Array.isArray(slugs) || !Array.isArray(rows)) return null;
    return {
      days: Math.min(60, Math.max(1, days)),
      items: rows
        .filter(([n, rest]) => typeof slugs[n] === "string" && typeof rest === "string")
        .slice(0, 200)
        .map(([n, rest, quantity, day]) => ({
          id: rest.startsWith("~") ? rest.slice(1) : `${slugs[n]}--${rest}`,
          slug: slugs[n],
          quantity: Math.max(1, Number(quantity) || 1),
          day: Number.isInteger(day) && day > 0 ? day : null,
        })),
    };
  } catch {
    return null;
  }
}

/** Short code for a trip payload: the first 8 characters of its SHA-256, base64url. Same on the server (api/share). */
export async function shortCode(payload: string) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload)));
  return toBase64Url(String.fromCharCode(...hash)).slice(0, 8);
}
