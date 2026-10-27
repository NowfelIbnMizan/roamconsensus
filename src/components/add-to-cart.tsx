"use client";

import { Check, Plus, Luggage, X } from "lucide-react";
import { useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";

export function AddRouteButton({
  items,
  label = "Add whole route to trip",
  doneLabel = "Whole route in your trip",
  removeLabel = "Remove route from trip",
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
          <Luggage className="size-4" aria-hidden />
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
      aria-label={added ? `Remove ${item.name} from trip` : `Add ${item.name} to trip`}
      title={added ? "In your trip: click to remove" : "Add to trip"}
      // Bare icon, no ring: the hover wash shows the tap area.
      className={`group -m-1.5 inline-flex size-10 items-center justify-center rounded-full transition-colors ${
        added ? "text-accent hover:bg-red-500/10 hover:text-red-600" : "text-accent hover:bg-accent-soft"
      }`}
    >
      {added ? (
        <>
          <Check className="size-5 group-hover:hidden" strokeWidth={2.25} aria-hidden />
          <X className="hidden size-5 group-hover:block" aria-hidden />
        </>
      ) : (
        <Plus className="size-5" strokeWidth={1.75} aria-hidden />
      )}
    </button>
  );
}
