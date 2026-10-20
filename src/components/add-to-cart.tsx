"use client";

import { Check, Plus, ShoppingBag } from "lucide-react";
import { useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";

export function AddRouteButton({ items }: { items: CartItem[] }) {
  const hydrated = useCartHydrated();
  const inCart = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const ids = new Set(inCart.map((i) => i.id));
  const all = hydrated && items.every((i) => ids.has(i.id));

  return (
    <button
      type="button"
      onClick={() => add(items)}
      disabled={all}
      className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
    >
      {all ? <Check className="size-4" aria-hidden /> : <ShoppingBag className="size-4" aria-hidden />}
      {all ? "Whole route in cart" : "Add whole route to cart"}
    </button>
  );
}

export function AddItemButton({ item }: { item: CartItem }) {
  const hydrated = useCartHydrated();
  const inCart = useCart((s) => s.items.some((i) => i.id === item.id));
  const add = useCart((s) => s.add);
  const added = hydrated && inCart;

  return (
    <button
      type="button"
      onClick={() => add([item])}
      disabled={added}
      aria-label={added ? `${item.name} is in your cart` : `Add ${item.name} to cart`}
      className="inline-flex size-7 items-center justify-center rounded-full border border-line text-muted hover:border-accent hover:text-accent disabled:border-accent-soft disabled:bg-accent-soft disabled:text-accent"
    >
      {added ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
    </button>
  );
}
