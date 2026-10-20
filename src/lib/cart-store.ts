"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ItemCategory } from "@/generated/prisma/enums";

export type CartItem = {
  id: string;
  name: string;
  category: ItemCategory;
  priceCents: number;
  currency: string;
  unit: string | null;
  quantity: number;
  vendor: string | null;
  bookUrl: string | null;
  couponCode?: string | null; // optional: carts saved before codes existed lack it
  itinerary: { slug: string; title: string };
};

type CartState = {
  items: CartItem[];
  budgetCents: number | null;
  add: (items: CartItem[]) => void;
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
      // Re-adding an item already in the cart leaves its quantity alone.
      add: (incoming) =>
        set((s) => {
          const existing = new Set(s.items.map((i) => i.id));
          return { items: [...s.items, ...incoming.filter((i) => !existing.has(i.id))] };
        }),
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
  return useSyncExternalStore(subscribeHydration, () => useCart.persist.hasHydrated(), () => false);
}

export const lineTotal = (i: Pick<CartItem, "priceCents" | "quantity">) => i.priceCents * i.quantity;
