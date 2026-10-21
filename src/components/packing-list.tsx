"use client";

import { useState } from "react";
import { Backpack, Check, ChevronDown } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-store";
import { packingList } from "@/lib/packing";

export function PackingList({ items }: { items: CartItem[] }) {
  const packed = useCart((s) => s.packed);
  const toggle = useCart((s) => s.togglePacked);
  const [open, setOpen] = useState(false);
  const list = packingList(items);
  const done = list.filter((l) => packed.includes(l.item)).length;

  return (
    <section className="rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <Backpack className="size-5 text-accent" aria-hidden />
        <span className="flex-1">
          <span className="block font-semibold">Packing list</span>
          <span className="text-xs text-muted">
            Made from your stops · {done}/{list.length} packed
          </span>
        </span>
        <ChevronDown className={`size-4 text-muted transition ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul className="divide-y divide-line border-t border-line">
          {list.map((l) => {
            const on = packed.includes(l.item);
            return (
              <li key={l.item}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(l.item)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left"
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                      on ? "border-accent bg-accent text-background" : "border-line"
                    }`}
                  >
                    {on && <Check className="size-3.5" aria-hidden />}
                  </span>
                  <span className={on ? "text-muted line-through" : ""}>
                    <span className="block text-sm">{l.item}</span>
                    {l.for.length > 0 && (
                      <span className="block text-xs text-muted">
                        For {l.for.slice(0, 2).join(", ")}
                        {l.for.length > 2 && ` +${l.for.length - 2} more`}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
