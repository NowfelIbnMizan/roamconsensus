"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Map as MapIcon, Luggage } from "lucide-react";
import { DayPlan, planMap } from "@/components/day-plan";
import { useMoney } from "@/components/money";
import { TripMap } from "@/components/trip-map";
import { lineTotal, useCart, type CartItem } from "@/lib/cart-store";
import { decodeTrip } from "@/lib/share";

export function SharedTripView() {
  const token = useSearchParams().get("t") ?? "";
  const trip = useMemo(() => decodeTrip(token), [token]);
  const [items, setItems] = useState<CartItem[] | null>(null);
  const { money } = useMoney();
  const router = useRouter();
  const add = useCart((s) => s.add);
  const setTripDays = useCart((s) => s.setTripDays);

  // The link carries ids only; names, prices and pins load fresh.
  useEffect(() => {
    if (!trip) return;
    fetch("/api/cart/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: trip.items.map((i) => ({ id: i.id, name: "", slug: i.slug })) }),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((fresh: Record<string, CartItem>) =>
        setItems(
          trip.items.flatMap((i) => (fresh[i.id] ? [{ ...fresh[i.id], quantity: i.quantity, day: i.day }] : [])),
        ),
      )
      .catch(() => setItems([]));
  }, [trip]);

  const { stops, groups } = useMemo(() => planMap(items ?? [], trip?.days ?? 1), [items, trip]);

  if (!trip) return <p className="text-muted">This trip link doesn&apos;t open. Part of it may be cut off. Ask for the link again.</p>;
  if (!items) return <p className="text-muted">Loading the trip…</p>;
  if (items.length === 0) return <p className="text-muted">The places in this trip are no longer listed.</p>;

  const total = items.reduce((s, i) => s + lineTotal(i), 0);

  function save() {
    if (useCart.getState().items.length === 0) setTripDays(trip!.days);
    add(items!);
    router.push("/cart");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4">
        <p>
          <span className="text-2xl font-semibold tabular-nums">{money(total)}</span>{" "}
          <span className="text-sm text-muted">
            est. · {trip.days} day{trip.days > 1 && "s"} · {items.length} stops
          </span>
        </p>
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          <Luggage className="size-4" aria-hidden /> Save to my trip
        </button>
      </div>
      {stops.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapIcon className="size-5 text-accent" aria-hidden /> On the map
          </h2>
          <TripMap stops={stops} groups={groups} connect className="h-64 sm:h-80" />
        </section>
      )}
      <DayPlan items={items} days={trip.days} />
      <p className="text-sm text-muted">
        Want your own?{" "}
        <Link href="/#destinations" className="font-medium text-accent underline">
          Browse creator routes
        </Link>
      </p>
    </div>
  );
}
