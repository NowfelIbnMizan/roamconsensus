"use client";

import Link from "next/link";
import { useState } from "react";
import { ClipboardCopy, Download, ExternalLink, Minus, Plus, Trash2 } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { lineTotal, useCart, useCartHydrated } from "@/lib/cart-store";
import { groupByVendor, toNotionMarkdown, toText } from "@/lib/cart-export";
import { categoryLabel, formatMoney } from "@/lib/format";
import type { ItemCategory } from "@/generated/prisma/enums";

export function CartView() {
  const hydrated = useCartHydrated();
  const { items, budgetCents, remove, setQuantity, setBudget, clear } = useCart();
  const [copied, setCopied] = useState(false);

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
    .sort((a, b) => b.pct - a.pct);
  const remaining = budgetCents === null ? null : budgetCents - totalCents;

  function download() {
    const url = URL.createObjectURL(new Blob([toText(items)], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "trip-checklist.txt" });
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyNotion() {
    await navigator.clipboard.writeText(toNotionMarkdown(items));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        {groupByVendor(items).map((group) => (
          <section key={group.vendor} className="rounded-2xl border border-line bg-card">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="font-semibold">{group.vendor}</h2>
              <span className="text-sm tabular-nums text-muted">{formatMoney(group.totalCents)}</span>
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
                  <span className="w-16 text-right text-sm tabular-nums">
                    {item.priceCents === 0 ? "Free" : formatMoney(lineTotal(item), item.currency)}
                  </span>
                  <div className="flex items-center gap-2">
                    {item.bookUrl && (
                      <a
                        href={item.bookUrl}
                        target="_blank"
                        rel="sponsored noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-background"
                      >
                        Book <ExternalLink className="size-3" aria-hidden />
                      </a>
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
        ))}
      </div>

      <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-line bg-card p-5">
          <p className="text-sm text-muted">Estimated total</p>
          <p className="text-3xl font-semibold tabular-nums">{formatMoney(totalCents)}</p>

          <label className="mt-4 block text-sm text-muted" htmlFor="budget">
            Your budget (USD)
          </label>
          <input
            id="budget"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="e.g. 1500"
            value={budgetCents === null ? "" : budgetCents / 100}
            onChange={(e) => setBudget(e.target.value === "" ? null : Math.round(Number(e.target.value) * 100))}
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
                {remaining < 0 ? `${formatMoney(-remaining)} over budget` : `${formatMoney(remaining)} left`}
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
