"use client";

import { CalendarDays, MoreHorizontal, Share2, Wallet } from "lucide-react";
import { useCart, useCartHydrated, lineTotal, type CartItem } from "@/lib/cart-store";
import { planLength } from "@/components/day-plan";
import { useMoney } from "@/components/money";
import { Thumb } from "@/components/thumb";
import { dayColor } from "@/lib/map";

/** Lab only: the cart and its numbers, shared by the three mockups. */
export function useLab() {
  const hydrated = useCartHydrated();
  const cart = useCart();
  const days = planLength(cart.items, cart.tripDays);
  const total = cart.items.reduce((s, i) => s + lineTotal(i), 0);
  const byDay = Array.from({ length: days }, (_, n) => cart.items.filter((i) => i.day === n + 1));
  const unplanned = cart.items.filter((i) => !i.day || i.day > days);
  return { hydrated, cart, days, total, byDay, unplanned };
}

/** One line of trip facts with a budget meter: replaces the sidebar's three boxes. */
export function Summary({ sticky = false }: { sticky?: boolean }) {
  const { cart, days, total } = useLab();
  const { money } = useMoney();
  const budget = cart.budgetCents ?? 200000;
  const pct = Math.min(100, (total / budget) * 100);
  return (
    <div
      className={`rounded-2xl border border-line bg-card p-4 ${sticky ? "sticky top-2 z-10 shadow-sm" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-2xl font-semibold tabular-nums">{money(total)}</p>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          <CalendarDays className="size-4" aria-hidden /> {days} days · {cart.items.length} stops
        </p>
        <div className="ml-auto flex gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-background">
            <Share2 className="size-4" aria-hidden /> Share
          </button>
          <button
            aria-label="More: calendar, print, checklist"
            className="flex size-9 items-center justify-center rounded-full border border-line"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
        <Wallet className="size-3.5" aria-hidden />
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        {money(budget - total)} left of {money(budget)}
      </div>
    </div>
  );
}

export function Row({ i, day }: { i: CartItem; day?: number }) {
  const { price } = useMoney();
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="relative shrink-0">
        <Thumb url={i.photoUrl} category={i.category} className="size-12 rounded-lg" />
        {day && (
          <span
            className="absolute -top-1 -left-1 size-3 rounded-full ring-2 ring-card"
            style={{ background: dayColor(day - 1) }}
          />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{i.name}</span>
        <span className="block truncate text-xs text-muted">{i.itinerary.title}</span>
      </span>
      <span className={`shrink-0 text-sm tabular-nums ${i.priceCents === null ? "text-muted" : ""}`}>
        {i.priceCents === null ? "On site" : price(i)}
      </span>
    </div>
  );
}
