"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { planLength } from "@/components/day-plan";
import { useMoney } from "@/components/money";
import { lineTotal, useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";
import { categoryLabel } from "@/lib/format";

const DAY_MS = 86_400_000;

/** A plain, ink-friendly copy of the day plan. Opens the print dialog once, where "Save as PDF" makes the file. */
export function PrintTrip() {
  const hydrated = useCartHydrated();
  const { items, tripDays, startDate } = useCart();
  const { money, price } = useMoney();
  const printed = useRef(false);
  const days = planLength(items, tripDays);

  useEffect(() => {
    if (!hydrated || printed.current || items.length === 0) return;
    printed.current = true;
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, [hydrated, items.length]);

  if (!hydrated) return null;
  if (items.length === 0)
    return (
      <p className="text-muted">
        Your trip cart is empty.{" "}
        <Link href="/cart" className="underline">
          Back to the cart
        </Link>
      </p>
    );

  const date = (day: number) =>
    startDate
      ? new Date(Date.parse(`${startDate}T00:00:00Z`) + (day - 1) * DAY_MS).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
      : null;
  const sections: { title: string; list: CartItem[] }[] = [
    ...Array.from({ length: days }, (_, n) => ({
      title: [`Day ${n + 1}`, date(n + 1)].filter(Boolean).join(" · "),
      list: items.filter((i) => i.day === n + 1),
    })),
    { title: "Not planned yet", list: items.filter((i) => !i.day || i.day > days) },
  ].filter((s) => s.list.length);
  const total = items.reduce((s, i) => s + lineTotal(i), 0);
  const cities = [...new Set(items.flatMap((i) => (i.destination ? [i.destination.name] : [])))];

  return (
    <article className="mx-auto max-w-3xl text-[15px] print:max-w-none print:text-[11pt]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href="/cart" className="text-sm text-muted hover:text-foreground">
          ← Back to the cart
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          <Printer className="size-4" aria-hidden /> Print or save as PDF
        </button>
      </div>
      <header className="border-b border-line pb-3">
        <p className="font-hand text-xl text-accent-2">Creatour trip plan</p>
        <h1 className="text-3xl font-semibold tracking-tight">{cities.join(", ") || "My trip"}</h1>
        <p className="mt-1 text-muted">
          {days} {days === 1 ? "day" : "days"}
          {startDate && ` from ${date(1)}`} · {items.length} stops · about {money(total)}
        </p>
      </header>
      {sections.map((s) => (
        <section key={s.title} className="mt-5 break-inside-avoid">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <ol className="mt-1 divide-y divide-line border-y border-line">
            {s.list.map((i, n) => (
              <li key={i.id} className="flex gap-3 py-2">
                <span className="w-5 shrink-0 text-right font-semibold text-muted tabular-nums">{n + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap justify-between gap-x-3">
                    <span className="font-medium">{i.name}</span>
                    <span className="tabular-nums">{price(i)}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {categoryLabel[i.category]}
                    {i.destination && ` · ${i.destination.name}`} · from {i.itinerary.title}
                    {i.couponCode && ` · code ${i.couponCode}`}
                  </p>
                  {i.note && <p className="text-sm">Note: {i.note}</p>}
                  {(i.bookUrl ?? i.website) && <p className="text-xs break-all text-muted">{i.bookUrl ?? i.website}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="mt-6 text-xs text-muted">Prices are estimates from creators&apos; posts. Made with creatour.co</p>
    </article>
  );
}
