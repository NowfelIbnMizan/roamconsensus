"use client";

import { Check, Plus, ShoppingBag, X } from "lucide-react";
import { useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";

export function AddRouteButton({
  items,
  label = "Add whole route to cart",
  doneLabel = "Whole route in cart",
  removeLabel = "Remove route from cart",
}: {
  items: CartItem[];
  label?: string;
  doneLabel?: string;
  removeLabel?: string;
}) {
  const hydrated = useCartHydrated();
  const inCart = useCart((s) => s.items);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const ids = new Set(inCart.map((i) => i.id));
  const all = hydrated && items.every((i) => ids.has(i.id));

  // A second click takes the route back out, so adding it is never a one-way step.
  return (
    <button
      type="button"
      onClick={() => (all ? items.forEach((i) => remove(i.id)) : add(items))}
      aria-pressed={all}
      title={all ? `Click to ${removeLabel.toLowerCase()}` : undefined}
      className={`group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
        all ? "bg-accent-soft text-accent ring-1 ring-accent/30 ring-inset" : "bg-foreground text-background"
      }`}
    >
      {all ? (
        <>
          <Check className="size-4 group-hover:hidden" aria-hidden />
          <X className="hidden size-4 group-hover:block" aria-hidden />
          <span className="group-hover:hidden">{doneLabel}</span>
          <span className="hidden group-hover:inline">{removeLabel}</span>
        </>
      ) : (
        <>
          <ShoppingBag className="size-4" aria-hidden />
          {label}
        </>
      )}
    </button>
  );
}

export function AddItemButton({ item }: { item: CartItem }) {
  const hydrated = useCartHydrated();
  const inCart = useCart((s) => s.items.some((i) => i.id === item.id));
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const added = hydrated && inCart;

  return (
    <button
      type="button"
      onClick={() => (added ? remove(item.id) : add([item]))}
      aria-pressed={added}
      aria-label={added ? `Remove ${item.name} from cart` : `Add ${item.name} to cart`}
      title={added ? "In your cart: click to remove" : "Add to cart"}
      className={`group inline-flex size-7 items-center justify-center rounded-full border ${
        added
          ? "border-accent-soft bg-accent-soft text-accent hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-600"
          : "border-line text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {added ? (
        <>
          <Check className="size-4 group-hover:hidden" aria-hidden />
          <X className="hidden size-4 group-hover:block" aria-hidden />
        </>
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
    </button>
  );
}
