"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ItemCategory } from "@/generated/prisma/enums";

export type CartItem = {
  id: string;
  name: string;
  category: ItemCategory;
  priceCents: number | null;
  priceNote?: string | null;
  currency: string;
  unit: string | null;
  quantity: number;
  vendor: string | null;
  bookUrl: string | null;
  website?: string | null; // venue's own site, for items with no booking link
  couponCode?: string | null; // optional: carts saved before codes existed lack it
  lat?: number | null; // map pin of the item's place; filled in by the cart refresh for older carts
  lng?: number | null;
  /** Day of the traveller's own plan; whole routes come in on the creator's days. */
  day?: number | null;
  itinerary: { slug: string; title: string };
};

type CartState = {
  items: CartItem[];
  budgetCents: number | null;
  /** Trip length the traveller set; 0 means "as many days as planned items use". */
  tripDays: number;
  add: (items: CartItem[]) => void;
  setDay: (id: string, day: number | null) => void;
  /** Moves an item before (-1) or after (+1) the neighbouring item planned for the same day. */
  move: (id: string, dir: -1 | 1) => void;
  setTripDays: (days: number) => void;
  refresh: (fresh: Record<string, CartItem>) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  setBudget: (cents: number | null) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      budgetCents: null,
      tripDays: 0,
      // Re-adding an item already in the cart leaves its quantity alone.
      add: (incoming) =>
        set((s) => {
          const existing = new Set(s.items.map((i) => i.id));
          return { items: [...s.items, ...incoming.filter((i) => !existing.has(i.id))] };
        }),
      // Swap saved snapshots for current data (prices, links, ids), keeping the traveller's quantity unless the
      // unit changed (a flat price that became per-day should start at the creator's day count).
      refresh: (fresh) =>
        set((s) => {
          const seen = new Set<string>();
          const items = s.items.flatMap((i) => {
            const f = fresh[i.id];
            // The plan (day) is the traveller's, so it survives a refresh like the quantity does.
            const next = !f
              ? i
              : {
                  ...f,
                  quantity: f.unit === i.unit ? i.quantity : f.quantity,
                  day: i.day === undefined ? f.day : i.day,
                };
            if (seen.has(next.id)) return [];
            seen.add(next.id);
            return [next];
          });
          return { items };
        }),
      setDay: (id, day) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, day } : i)) })),
      move: (id, dir) =>
        set((s) => {
          const items = [...s.items];
          const from = items.findIndex((i) => i.id === id);
          if (from < 0) return {};
          let to = from + dir;
          while (to >= 0 && to < items.length && (items[to].day ?? null) !== (items[from].day ?? null)) to += dir;
          if (to < 0 || to >= items.length) return {};
          [items[from], items[to]] = [items[to], items[from]];
          return { items };
        }),
      setTripDays: (tripDays) => set({ tripDays: Math.max(0, Math.min(60, tripDays)) }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setQuantity: (id, quantity) =>
        set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i)) })),
      setBudget: (budgetCents) => set({ budgetCents }),
      clear: () => set({ items: [] }),
    }),
    { name: "roamconsensus-cart", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

const subscribeHydration = (cb: () => void) => {
  const unsub = useCart.persist.onFinishHydration(cb);
  if (!useCart.persist.hasHydrated()) void useCart.persist.rehydrate();
  return unsub;
};

/** True once the cart has loaded from localStorage; false during SSR and the first client render. */
export function useCartHydrated() {
  return useSyncExternalStore(
    subscribeHydration,
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}

/** Unpriced items count as 0; callers show them separately. */
export const lineTotal = (i: Pick<CartItem, "priceCents" | "quantity">) => (i.priceCents ?? 0) * i.quantity;
