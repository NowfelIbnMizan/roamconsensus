import { z } from "zod";
import type { CartItem } from "@/lib/cart-store";

/** The parts of the trip cart that sync to a signed-in traveller's account and that saved trips keep. */
export type CartData = {
  items: CartItem[];
  budgetCents: number | null;
  tripDays: number;
  packed: string[];
  startDate: string | null;
  done: string[];
};

// Items are the browser's own snapshots; only what the site reads back to find and refresh them is checked.
const Item = z
  .object({ id: z.string().max(300), name: z.string().max(300), itinerary: z.object({ slug: z.string().max(200) }) })
  .passthrough();

export const CartDataSchema = z.object({
  items: z.array(Item).max(300),
  budgetCents: z.number().int().nonnegative().nullable().catch(null),
  tripDays: z.number().int().min(0).max(60).catch(0),
  packed: z.array(z.string().max(200)).max(300).catch([]),
  startDate: z.string().max(10).nullable().catch(null),
  done: z.array(z.string().max(300)).max(300).catch([]),
});

/** Large enough for a 300-stop cart; anything bigger is refused rather than stored. */
export const MAX_CART_BYTES = 400_000;

/** Reads a `{ data, ...rest }` request body; `data` is null when the cart is missing, invalid or too big. */
export async function readCartBody(
  request: Request,
): Promise<{ data: CartData | null; body: Record<string, unknown> }> {
  const text = await request.text();
  if (text.length > MAX_CART_BYTES) return { data: null, body: {} };
  try {
    const body = JSON.parse(text);
    const parsed = CartDataSchema.safeParse(body?.data);
    return { data: parsed.success ? (parsed.data as unknown as CartData) : null, body };
  } catch {
    return { data: null, body: {} };
  }
}

/** One line for a saved trip: its cities and stop count. */
export function describeTrip(data: CartData) {
  const cities = [...new Set(data.items.map((i) => i.destination?.name).filter(Boolean))] as string[];
  return { stops: data.items.length, cities };
}

const union = (a: string[], b: string[]) => [...new Set([...a, ...b])];

/**
 * Joins the cart on this device with the account's cart the first time someone signs in here, so nothing picked
 * before signing in is lost. Account items come first; this device's settings win where both have one.
 */
export function mergeCarts(device: CartData, account: CartData): CartData {
  const ids = new Set(account.items.map((i) => i.id));
  return {
    items: [...account.items, ...device.items.filter((i) => !ids.has(i.id))],
    budgetCents: device.budgetCents ?? account.budgetCents,
    tripDays: Math.max(device.tripDays, account.tripDays),
    packed: union(account.packed, device.packed),
    startDate: device.startDate ?? account.startDate,
    done: union(account.done, device.done),
  };
}
