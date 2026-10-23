"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, CloudRain, ExternalLink, Navigation, Plus } from "lucide-react";
import { lineTotal, useCart, useCartHydrated, type CartItem } from "@/lib/cart-store";
import { planLength } from "@/components/day-plan";
import { LegHint } from "@/components/road-time";
import { WeatherCard } from "@/components/weather-card";
import { useMoney } from "@/components/money";
import { categoryLabel } from "@/lib/format";
import { cityOf } from "@/lib/trip";
import { dayLegs, googleMapsRouteUrl, hasPin } from "@/lib/map";
import type { Weather } from "@/lib/weather";
import type { ItemCategory } from "@/generated/prisma/enums";

type RainyPick = { name: string; area: string | null; category: ItemCategory; href: string; cartItem: CartItem | null };
type CityInfo = { weather: Weather | null; rainyPicks: RainyPick[] };

const DAY_MS = 86_400_000;
const localToday = () => {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
};

/** Which trip day today is, from the start date; null before the trip starts, after it ends, or with no date. */
function tripDayToday(startDate: string | null, days: number) {
  if (!startDate) return null;
  const n = Math.floor((localToday() - Date.parse(`${startDate}T00:00:00Z`)) / DAY_MS) + 1;
  return n >= 1 && n <= days ? n : null;
}

const directionsUrl = (p: { lat: number; lng: number }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

export function TodayView() {
  const hydrated = useCartHydrated();
  const { items, tripDays, startDate, setStartDate, done, toggleDone, add, setDay } = useCart();
  const { price } = useMoney();
  const days = planLength(items, tripDays);
  const auto = tripDayToday(startDate, days);
  const [picked, setPicked] = useState<number | null>(null);
  const day = picked ?? auto ?? 1;
  const list = items.filter((i) => i.day === day);
  const city = cityOf(list) ?? cityOf(items);
  const [info, setInfo] = useState<{ slug: string; data: CityInfo } | null>(null);

  useEffect(() => {
    if (!city || info?.slug === city.slug) return;
    fetch(`/api/today?city=${encodeURIComponent(city.slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setInfo({ slug: city.slug, data }))
      .catch(() => {}); // offline: the plan still shows, just without weather
  }, [city, info?.slug]);

  if (!hydrated) return <p className="text-muted">Loading your trip…</p>;
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="font-medium">No trip planned yet.</p>
        <p className="mt-1 text-sm text-muted">Add a route to your trip cart, then come back here while you travel.</p>
        <Link href="/#destinations" className="mt-4 inline-block text-sm font-medium text-accent underline">
          Browse destinations
        </Link>
      </div>
    );

  const pinned = list.filter(hasPin);
  const { legs } = dayLegs(pinned);
  const next = list.find((i) => !done.includes(i.id));
  const data = info?.slug === city?.slug ? info?.data : null;
  const forecast =
    data?.weather?.days.find((d) => d.date === new Date().toISOString().slice(0, 10)) ?? data?.weather?.days[0];
  const rainy =
    data?.weather &&
    (["Rain", "Thunderstorm", "Drizzle"].includes(data.weather.now.main) || (forecast?.rainChance ?? 0) >= 60);
  const inPlan = new Set(items.map((i) => i.id));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{auto === day ? "Today" : "Trip mode"}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Day {day}
            {city && <span className="text-muted"> · {city.name}</span>}
          </h1>
        </div>
        <label className="text-sm text-muted">
          Trip starts{" "}
          <input
            type="date"
            value={startDate ?? ""}
            onChange={(e) => {
              setStartDate(e.target.value || null);
              setPicked(null);
            }}
            className="ml-1 rounded-lg border border-line bg-background px-2 py-1 text-foreground"
          />
        </label>
      </div>

      <nav
        className="mt-4 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Trip days"
      >
        {Array.from({ length: days }, (_, n) => n + 1).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setPicked(d)}
            aria-current={d === day ? "date" : undefined}
            className={`shrink-0 rounded-full border px-3 py-1 text-sm ${
              d === day ? "border-accent bg-accent-soft font-medium text-accent" : "border-line text-muted"
            }`}
          >
            Day {d}
            {d === auto && " · today"}
          </button>
        ))}
      </nav>
      {!startDate && (
        <p className="mt-2 text-xs text-muted">
          Set your start date and this page opens on today&apos;s plan by itself.
        </p>
      )}

      <div className="mt-6">{data?.weather && city && <WeatherCard name={city.name} weather={data.weather} />}</div>

      {rainy && data && data.rainyPicks.length > 0 && (
        <section className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <CloudRain className="size-5 text-sky-700 dark:text-sky-400" aria-hidden /> Rainy day? Indoor backups
          </h2>
          <p className="mt-1 text-sm text-muted">Spots under a roof that creators recommend in {city?.name}.</p>
          <ul className="mt-3 divide-y divide-line">
            {data.rainyPicks.map((p) => (
              <li key={p.href} className="flex items-center justify-between gap-3 py-2">
                <Link href={p.href} className="min-w-0 hover:underline">
                  <span className="font-medium">{p.name}</span>
                  <span className="block text-xs text-muted">
                    {[p.area, categoryLabel[p.category]].filter(Boolean).join(" · ")}
                  </span>
                </Link>
                {p.cartItem &&
                  (inPlan.has(p.cartItem.id) ? (
                    <span className="text-xs text-muted">In your plan</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        add([{ ...p.cartItem!, day: null }]);
                        setDay(p.cartItem!.id, day);
                      }}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1 text-xs font-medium"
                    >
                      <Plus className="size-3" aria-hidden /> Add to day {day}
                    </button>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {list.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">
          Nothing planned for day {day}. A free day!{" "}
          <Link href="/cart" className="text-accent underline">
            Plan it in your trip cart
          </Link>
        </p>
      ) : (
        <>
          <ol className="space-y-3">
            {list.map((item) => {
              const isDone = done.includes(item.id);
              const isNext = item.id === next?.id;
              return (
                <li
                  key={item.id}
                  className={`rounded-2xl border bg-card p-4 ${isNext ? "border-accent" : "border-line"} ${isDone ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDone(item.id)}
                      aria-pressed={isDone}
                      aria-label={isDone ? `Mark ${item.name} not done` : `Mark ${item.name} done`}
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                        isDone ? "border-accent bg-accent text-background" : "border-line"
                      }`}
                    >
                      {isDone && <Check className="size-4" aria-hidden />}
                    </button>
                    <div className="min-w-0 flex-1">
                      {isNext && <p className="text-xs font-semibold uppercase tracking-wide text-accent">Next</p>}
                      <p className={`font-semibold ${isDone ? "line-through" : ""}`}>{item.name}</p>
                      <p className="text-xs text-muted">
                        {categoryLabel[item.category]}
                        {lineTotal(item) > 0 && ` · ${price(item)}`}
                        {item.couponCode && (
                          <span className="ml-2 rounded border border-dashed border-accent px-1 font-mono text-accent">
                            {item.couponCode}
                          </span>
                        )}
                      </p>
                      <LegHint leg={legs.get(item.id)} />
                      <div className="mt-3 flex flex-wrap gap-2">
                        {hasPin(item) && (
                          <a
                            href={directionsUrl(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
                          >
                            <Navigation className="size-4" aria-hidden /> Directions
                          </a>
                        )}
                        {(item.bookUrl ?? item.website) && (
                          <a
                            href={(item.bookUrl ?? item.website)!}
                            target="_blank"
                            rel={item.bookUrl ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                            className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm"
                          >
                            {item.bookUrl ? (item.vendor ? `Book on ${item.vendor}` : "Book") : "Website"}
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {pinned.length > 1 && (
            <a
              href={googleMapsRouteUrl(pinned)!}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              Whole day&apos;s route in Google Maps <ExternalLink className="size-3.5" aria-hidden />
            </a>
          )}
        </>
      )}
      <p className="mt-8 text-xs text-muted">
        Works offline once opened: your plan is saved on this phone. Edit it in your{" "}
        <Link href="/cart" className="underline">
          trip cart
        </Link>
        .
      </p>
    </>
  );
}
