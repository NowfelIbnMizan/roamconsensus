"use client";

import { Check, ChevronRight, ExternalLink } from "lucide-react";
import { groupByVendor } from "@/lib/cart-export";
import { VendorBadge } from "@/components/vendor-badge";
import { useMoney } from "@/components/money";
import { Row, Summary, useLab } from "../shared";

/** A: what's left to do. Bookings first, grouped by site; things you just turn up for sit folded below. */
export default function Todo() {
  const { hydrated, cart } = useLab();
  const { money } = useMoney();
  if (!hydrated) return null;
  const groups = groupByVendor(cart.items);
  const book = groups.filter((g) => g.items[0].vendor !== null);
  const walkIn = groups.filter((g) => g.items[0].vendor === null).flatMap((g) => g.items);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-3xl font-semibold">My trip</h1>
      <Summary />
      <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-4 py-3 text-sm">
        <span className="font-semibold text-accent">0 of {book.reduce((n, g) => n + g.items.length, 0)} booked</span>
        <span className="text-muted">Tick each one once it&apos;s booked.</span>
      </div>
      <h2 className="text-lg font-semibold">To book</h2>
      {book.map((g) => (
        <section key={g.vendor} className="rounded-2xl border border-line bg-card">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <VendorBadge name={g.vendor} bookable />
            <span className="text-sm tabular-nums text-muted">{money(g.totalCents)}</span>
          </header>
          <ul className="divide-y divide-line px-4">
            {g.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
                <button aria-label="Mark booked" className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-line text-transparent hover:border-accent">
                  <Check className="size-3.5" aria-hidden />
                </button>
                <div className="min-w-0 flex-1"><Row i={i} day={i.day ?? undefined} /></div>
                <a href={i.bookUrl ?? "#"} className="hidden shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-background sm:inline-flex">
                  Book <ExternalLink className="size-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <details className="rounded-2xl border border-line bg-card">
        <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold">
          Just turn up ({walkIn.length})
          <ChevronRight className="size-4 text-muted" aria-hidden />
        </summary>
        <ul className="divide-y divide-line border-t border-line px-4">
          {walkIn.map((i) => <li key={i.id}><Row i={i} day={i.day ?? undefined} /></li>)}
        </ul>
      </details>
      <p className="text-sm text-muted">Day-by-day plan and map live on their own tab.</p>
    </div>
  );
}
