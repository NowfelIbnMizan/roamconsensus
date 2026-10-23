"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ClipboardCopy,
  Download,
  ExternalLink,
  Map as MapIcon,
  Minus,
  Navigation,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { lineTotal, useCart, useCartHydrated } from "@/lib/cart-store";
import { groupByVendor, toNotionMarkdown, toText } from "@/lib/cart-export";
import { VendorBadge } from "@/components/vendor-badge";
import { categoryLabel } from "@/lib/format";
import { encodeTrip } from "@/lib/share";
import { EmailSignup } from "@/components/email-signup";
import { TripMap } from "@/components/trip-map";
import { DayPlan, planLength, planMap } from "@/components/day-plan";
import { useMoney } from "@/components/money";
import { PackingList } from "@/components/packing-list";
import type { ItemCategory } from "@/generated/prisma/enums";

export function CartView({ canEmail = false }: { canEmail?: boolean }) {
  const hydrated = useCartHydrated();
  const { items, budgetCents, tripDays, refresh, remove, setQuantity, setBudget, clear, setDay, move, setTripDays } =
    useCart();
  const { money, price, code, toLocal, fromLocal } = useMoney();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [view, setView] = useState<"plan" | "book">("plan");
  const refreshed = useRef(false);

  // Once per visit, pull current prices and links for what was saved earlier.
  useEffect(() => {
    if (!hydrated || refreshed.current) return;
    refreshed.current = true;
    const saved = useCart.getState().items;
    if (saved.length === 0) return;
    fetch("/api/cart/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: saved.map((i) => ({ id: i.id, name: i.name, slug: i.itinerary.slug })) }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh) => fresh && refresh(fresh))
      .catch(() => {});
  }, [hydrated, refresh]);

  const days = planLength(items, tripDays);
  const { stops, groups } = useMemo(() => planMap(items, days), [items, days]);

  if (!hydrated) return <p className="text-muted">Loading your cart…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="font-medium">Your trip cart is empty.</p>
        <p className="mt-1 text-sm text-muted">Add a whole route or single items from any itinerary.</p>
        <Link href="/#destinations" className="mt-4 inline-block text-sm font-medium text-accent underline">
          Browse destinations
        </Link>
      </div>
    );
  }

  const totalCents = items.reduce((s, i) => s + lineTotal(i), 0);
  const byCategory = new Map<ItemCategory, number>();
  for (const i of items) byCategory.set(i.category, (byCategory.get(i.category) ?? 0) + lineTotal(i));
  const allocation = [...byCategory]
    .map(([category, cents]) => ({ category, pct: totalCents ? (cents / totalCents) * 100 : 0 }))
    .filter((a) => a.pct > 0)
    .sort((a, b) => b.pct - a.pct);
  const unpriced = items.filter((i) => i.priceCents === null).length;
  const remaining = budgetCents === null ? null : budgetCents - totalCents;

  function download() {
    const url = URL.createObjectURL(new Blob([toText(items)], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "trip-checklist.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function share() {
    const url = `${location.origin}/trip?t=${encodeTrip(items, days)}`;
    if (navigator.share && matchMedia("(pointer: coarse)").matches) {
      await navigator.share({ title: "My trip plan", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2500);
  }

  async function copyNotion() {
    await navigator.clipboard.writeText(toNotionMarkdown(items));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-full border border-line bg-card p-1 text-sm" role="tablist">
            {(
              [
                ["plan", "Day by day"],
                ["book", "By booking site"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 ${view === v ? "bg-foreground font-medium text-background" : "text-muted"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/today"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              <Navigation className="size-4" aria-hidden /> Trip mode
            </Link>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
            >
              <Share2 className="size-4" aria-hidden /> {shared ? "Link copied" : "Share my trip"}
            </button>
          </div>
        </div>

        {canEmail && items.length > 0 && (
          <div className="rounded-2xl border border-line bg-card p-4">
            <EmailSignup
              tripPath={`/trip?t=${encodeTrip(items, days)}`}
              label="Email this trip to yourself, to open on your phone later"
              button="Email me"
            />
          </div>
        )}

        {stops.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <MapIcon className="size-5 text-accent" aria-hidden /> Your trip on the map
            </h2>
            <TripMap stops={stops} groups={groups} connect className="h-64 sm:h-80" />
          </section>
        )}

        {view === "plan" ? (
          <DayPlan items={items} days={days} edit={{ setDay, move, remove, setTripDays }} />
        ) : (
          groupByVendor(items).map((group) => (
            <section key={group.vendor} className="rounded-2xl border border-line bg-card">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2>
                  <VendorBadge name={group.vendor} bookable={group.items[0].vendor !== null} />
                </h2>
                <span className="text-sm tabular-nums text-muted">
                  {group.items.some((i) => i.priceCents !== null) ? money(group.totalCents) : "Price on site"}
                </span>
              </header>
              <ul className="divide-y divide-line">
                {group.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                    <div className="min-w-0 basis-full sm:basis-auto sm:flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted">
                        {categoryLabel[item.category]} · from{" "}
                        <Link href={`/itineraries/${item.itinerary.slug}`} className="underline">
                          {item.itinerary.title}
                        </Link>
                        {item.couponCode && (
                          <span className="ml-2 rounded border border-dashed border-accent px-1 font-mono text-accent">
                            {item.couponCode}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="mr-auto flex items-center gap-1 sm:mr-0" aria-label={`Quantity for ${item.name}`}>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label="Decrease"
                        className="flex size-7 items-center justify-center rounded-full border border-line disabled:opacity-40"
                      >
                        <Minus className="size-3" aria-hidden />
                      </button>
                      <span className="w-16 text-center text-sm tabular-nums">
                        {item.quantity} {item.unit ? `${item.unit}${item.quantity > 1 ? "s" : ""}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                        aria-label="Increase"
                        className="flex size-7 items-center justify-center rounded-full border border-line"
                      >
                        <Plus className="size-3" aria-hidden />
                      </button>
                    </div>
                    {item.priceCents === null ? (
                      <span className="max-w-40 rounded-full bg-amber-500/15 px-2 py-0.5 text-right text-xs text-amber-700 dark:text-amber-300">
                        {item.priceNote ?? "Varies · pay on site"}
                      </span>
                    ) : (
                      <span className="min-w-16 max-w-40 text-right text-sm tabular-nums">{price(item)}</span>
                    )}
                    <div className="flex items-center gap-2">
                      {item.bookUrl ? (
                        <a
                          href={item.bookUrl}
                          target="_blank"
                          rel="sponsored noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                        >
                          {item.vendor ? `Book on ${item.vendor}` : "Book"}{" "}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        item.website && (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 text-xs text-muted hover:text-foreground"
                          >
                            Website <ExternalLink className="size-3" aria-hidden />
                          </a>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Remove ${item.name}`}
                        className="text-muted hover:text-rose-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <PackingList items={items} />
      </div>

      <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Estimated total</p>
          <p className="text-3xl font-semibold tabular-nums">{money(totalCents)}</p>
          {unpriced > 0 && (
            <p className="text-xs text-muted">
              Plus {unpriced} item{unpriced > 1 ? "s" : ""} priced on site
            </p>
          )}

          <label className="mt-4 block text-sm text-muted" htmlFor="budget">
            Your budget ({code})
          </label>
          <input
            id="budget"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 1500"
            value={budgetCents === null ? "" : Math.round(toLocal(budgetCents))}
            onChange={(e) => setBudget(e.target.value === "" ? null : fromLocal(Number(e.target.value)))}
            className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2"
          />
          {remaining !== null && (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className={remaining < 0 ? "h-full bg-rose-500" : "h-full bg-accent"}
                  style={{ width: `${Math.min(100, budgetCents ? (totalCents / budgetCents) * 100 : 100)}%` }}
                />
              </div>
              <p className={`mt-1 text-sm ${remaining < 0 ? "text-rose-600" : "text-muted"}`}>
                {remaining < 0 ? `${money(-remaining)} over budget` : `${money(remaining)} left`}
              </p>
            </>
          )}

          <div className="mt-5">
            <AllocationBar allocation={allocation} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={copyNotion}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm"
          >
            <ClipboardCopy className="size-4" aria-hidden /> {copied ? "Copied" : "Copy checklist for Notion"}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line px-4 py-2 text-sm"
          >
            <Download className="size-4" aria-hidden /> Download .txt checklist
          </button>
          <button type="button" onClick={clear} className="mt-2 text-sm text-muted underline">
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
