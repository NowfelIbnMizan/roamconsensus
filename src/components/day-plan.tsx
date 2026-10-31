"use client";

import { Thumb } from "@/components/thumb";
import Link from "next/link";
import { StopNote } from "@/components/stop-note";
import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, GripVertical, Minus, Plane, Plus, Trash2 } from "lucide-react";
import { lineTotal, type CartItem } from "@/lib/cart-store";
import { StopDetails } from "@/components/stop-details";
import { categoryLabel } from "@/lib/format";
import { dayColor, dayLegs, googleMapsPinUrl, googleMapsRouteUrl, hasPin } from "@/lib/map";
import { DriveSummary, LegHint } from "@/components/road-time";
import { useMoney } from "@/components/money";
import type { MapGroup, MapStop } from "@/components/trip-map";
import { cityOf } from "@/lib/trip";
import { transferHint, transferLinks } from "@/lib/transfer";

const UNPLANNED = "#a8a29e";

/** Days in the plan: the length the traveller set, or as many as their planned items use. */
export function planLength(items: CartItem[], tripDays: number) {
  return Math.max(1, tripDays || Math.max(0, ...items.map((i) => i.day ?? 0)));
}

const inDay = (items: CartItem[], day: number | null, days: number) =>
  items.filter((i) => (day === null ? !i.day || i.day > days : i.day === day));

/** Map pins and day chips for a plan: numbered per day like an itinerary, unplanned stops in grey. */
export function planMap(items: CartItem[], days: number) {
  const stops: MapStop[] = [];
  const groups: MapGroup[] = [];
  for (let d = 1; d <= days; d++) {
    const pinned = inDay(items, d, days).filter(hasPin);
    pinned.forEach((i, n) =>
      stops.push({
        key: i.id,
        lat: i.lat,
        lng: i.lng,
        label: String(n + 1),
        color: dayColor(d - 1),
        title: i.name,
        subtitle: `Day ${d} · ${categoryLabel[i.category]}`,
        href: googleMapsPinUrl(i),
        group: d,
      }),
    );
    if (pinned.length)
      groups.push({
        id: d,
        label: `Day ${d}`,
        color: dayColor(d - 1),
        routeUrl: googleMapsRouteUrl(pinned),
      });
  }
  for (const i of inDay(items, null, days).filter(hasPin))
    stops.push({
      key: i.id,
      lat: i.lat,
      lng: i.lng,
      label: "?",
      color: UNPLANNED,
      title: i.name,
      subtitle: "Not planned yet",
      href: googleMapsPinUrl(i),
    });
  return { stops, groups };
}

type Edit = {
  setDay: (id: string, day: number | null) => void;
  move: (id: string, dir: -1 | 1) => void;
  place: (id: string, day: number | null, before: string | null) => void;
  remove: (id: string) => void;
  setTripDays: (days: number) => void;
};

/** Between two days in different cities: how far apart they are and where to book the trip between them. */
function TravelDay({ from, to }: { from: { name: string; last?: CartItem }; to: { name: string; first?: CartItem } }) {
  const hint = transferHint(
    from.last && hasPin(from.last) ? from.last : null,
    to.first && hasPin(to.first) ? to.first : null,
  );
  return (
    <section className="rounded-2xl border border-dashed border-accent/50 bg-accent-soft/40 px-4 py-3">
      <h3 className="flex items-center gap-2 font-semibold">
        <Plane className="size-4 text-accent" aria-hidden /> {from.name} to {to.name}
      </h3>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint.text}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {transferLinks(from, to).map((l) => (
          <a
            key={l.site}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1 text-xs font-medium hover:border-accent"
          >
            {l.label} · {l.site} <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
      </div>
    </section>
  );
}

/** The traveller's own day-by-day plan. Read-only without `edit` (a shared trip). */
type DropTarget = { day: number | null; before: string | null };

/**
 * Drag a stop by its grip to another spot or day. Pointer events (not HTML drag and drop) so it works with touch;
 * the grip has touch-action: none, so the rest of the row still scrolls the page.
 */
function useDragStop(place: Edit["place"] | undefined) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<DropTarget | null>(null);

  const targetAt = (x: number, y: number): DropTarget | null => {
    const el = document.elementFromPoint(x, y);
    const day = (v: string | undefined) => (v ? Number(v) : null);
    const row = el?.closest<HTMLElement>("[data-drop-id]");
    if (row) {
      const { top, height } = row.getBoundingClientRect();
      const upper = y < top + height / 2;
      return {
        day: day(row.dataset.dropDay),
        before: upper ? row.dataset.dropId! : row.dataset.dropNext || null,
      };
    }
    const section = el?.closest<HTMLElement>("[data-drop-section]");
    return section ? { day: day(section.dataset.dropDay), before: null } : null;
  };

  const grip = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(id);
      setTarget(null);
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      if (dragging !== id) return;
      setTarget(targetAt(e.clientX, e.clientY));
      // Scroll while holding near the top or bottom edge (above the phone tab bar).
      if (e.clientY < 80) window.scrollBy(0, -14);
      else if (e.clientY > window.innerHeight - 110) window.scrollBy(0, 14);
    },
    onPointerUp: () => {
      if (dragging && target && place) place(dragging, target.day, target.before);
      setDragging(null);
      setTarget(null);
    },
    onPointerCancel: () => {
      setDragging(null);
      setTarget(null);
    },
  });

  return { dragging, target, grip };
}

export function DayPlan({ items, days, edit }: { items: CartItem[]; days: number; edit?: Edit }) {
  const { price, money } = useMoney();
  const { dragging, target, grip } = useDragStop(edit?.place);
  const sections: { day: number | null; list: CartItem[] }[] = [
    ...Array.from({ length: days }, (_, n) => ({
      day: n + 1,
      list: inDay(items, n + 1, days),
    })),
    { day: null, list: inDay(items, null, days) },
  ];

  return (
    <div className="space-y-4">
      {edit && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Trip length</span>
          <button
            type="button"
            onClick={() => edit.setTripDays(days - 1)}
            disabled={days <= 1}
            aria-label="One day fewer"
            className="flex size-7 items-center justify-center rounded-full border border-line disabled:opacity-40"
          >
            <Minus className="size-3" aria-hidden />
          </button>
          <span className="w-14 text-center font-medium tabular-nums">
            {days} day{days > 1 && "s"}
          </span>
          <button
            type="button"
            onClick={() => edit.setTripDays(days + 1)}
            aria-label="One more day"
            className="flex size-7 items-center justify-center rounded-full border border-line"
          >
            <Plus className="size-3" aria-hidden />
          </button>
        </div>
      )}
      {sections.map(({ day, list }, n) => {
        if (day === null && list.length === 0) return null;
        const city = day === null ? null : cityOf(list);
        // The last earlier day with stops, to spot a change of city.
        const before = sections.slice(0, n).findLast((x) => x.day !== null && x.list.length > 0);
        const prevCity = before ? cityOf(before.list) : null;
        const moved = city && prevCity && city.slug !== prevCity.slug;
        const pinned = list.filter(hasPin);
        const { legs, total } = dayLegs(pinned);
        const routeUrl = pinned.length > 1 ? googleMapsRouteUrl(pinned) : null;
        const cost = list.reduce((sum, i) => sum + lineTotal(i), 0);
        let pin = 0;
        return (
          <div key={day ?? "unplanned"} className="space-y-4">
            {moved && before && (
              <TravelDay
                from={{
                  name: prevCity.name,
                  last: before.list.findLast(hasPin),
                }}
                to={{ name: city.name, first: list.find(hasPin) }}
              />
            )}
            {/* Each day folds to one line, like a creator's route; the first day and the unplanned stops start open. */}
            <details
              open={n === 0 || day === null}
              data-drop-section
              data-drop-day={day ?? ""}
              className={`group rounded-2xl border bg-card transition ${
                dragging && target?.day === day && target.before === null
                  ? "border-accent ring-2 ring-accent/40"
                  : "border-line"
              }`}
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{
                    background: day === null ? UNPLANNED : dayColor(day - 1),
                  }}
                  aria-hidden
                >
                  {day ?? "?"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-semibold">
                      {day === null ? "Not planned yet" : `Day ${day}`}
                      {city &&
                        sections.some(
                          (x) =>
                            x.day !== null && x.list.some((i) => i.destination && i.destination.slug !== city.slug),
                        ) && <span className="font-normal text-muted"> · {city.name}</span>}
                    </h3>
                    <span className="text-sm text-muted tabular-nums">
                      {list.length === 0 ? "Free day" : `${list.length} ${list.length === 1 ? "stop" : "stops"}`}
                      {cost > 0 && ` · ${money(cost)}`}
                    </span>
                    {day !== null && <DriveSummary minutes={total} />}
                  </span>
                  {list.length > 0 && (
                    <span className="mt-0.5 block truncate text-sm text-muted group-open:hidden">
                      {list.map((i) => i.name).join(" · ")}
                    </span>
                  )}
                </span>
                <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
              </summary>
              {list.length === 0 ? (
                <p className="border-t border-line px-4 py-3 text-sm text-muted">
                  Nothing planned
                  {edit && ". Drag a stop here, or pick this day on any stop"}.
                </p>
              ) : (
                <ul className="divide-y divide-line border-t border-line px-2 sm:px-3">
                  {list.map((item, n) => {
                    const number = hasPin(item) ? ++pin : null;
                    const link = item.bookUrl ?? item.website ?? null;
                    return (
                      <li
                        key={item.id}
                        data-drop-id={item.id}
                        data-drop-day={day ?? ""}
                        data-drop-next={list[n + 1]?.id ?? ""}
                        className={`flex items-center gap-1 py-2 ${dragging === item.id ? "opacity-40" : ""} ${
                          dragging && target?.before === item.id && dragging !== item.id
                            ? "shadow-[inset_0_3px_0_var(--accent)]"
                            : ""
                        }`}
                      >
                        {edit && (
                          <button
                            type="button"
                            {...grip(item.id)}
                            aria-label={`Drag ${item.name} to another spot or day`}
                            title="Drag to move"
                            className="flex h-12 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-muted hover:text-foreground active:cursor-grabbing"
                          >
                            <GripVertical className="size-4" aria-hidden />
                          </button>
                        )}
                        <StopDetails
                          label={item.name}
                          row={
                            <>
                              <span className="relative shrink-0 p-1">
                                <Thumb url={item.photoUrl} alt={item.name} category={item.category} className="size-12 rounded-lg" />
                                {number !== null && (
                                  <span
                                    className="absolute top-0 left-0 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-card"
                                    style={{
                                      background: day === null ? UNPLANNED : dayColor(day - 1),
                                    }}
                                  >
                                    {day === null ? "?" : number}
                                  </span>
                                )}
                              </span>
                              <span className="min-w-0 flex-1 py-1">
                                <span className="block truncate font-medium">{item.name}</span>
                                <span className="block truncate text-sm text-muted">
                                  {item.note ? (
                                    <span className="italic text-accent-2">{item.note}</span>
                                  ) : (
                                    item.itinerary.title
                                  )}
                                </span>
                              </span>
                              <span
                                className={`shrink-0 pr-1 text-right text-sm tabular-nums ${item.priceCents === null ? "text-muted" : ""}`}
                              >
                                {/* A creator's price wording can be long; the row says "No price", tapping shows it. */}
                                {item.priceCents === null ? "No price" : price(item)}
                              </span>
                            </>
                          }
                        >
                          <div className="pr-8">
                            <p className="eyebrow">{categoryLabel[item.category]}</p>
                            <p className="mt-1 font-display text-xl leading-snug font-semibold">{item.name}</p>
                            <p className="mt-1 text-sm text-muted">
                              From{" "}
                              <Link href={`/itineraries/${item.itinerary.slug}`} className="underline">
                                {item.itinerary.title}
                              </Link>
                            </p>
                            {day !== null && <LegHint leg={legs.get(item.id)} />}
                            <p className="mt-3 text-lg font-semibold tabular-nums">{price(item)}</p>
                            <StopNote id={item.id} note={item.note} editable={Boolean(edit)} />
                            {link && (
                              <a
                                href={link}
                                target="_blank"
                                rel={item.bookUrl ? "sponsored noopener noreferrer" : "noopener noreferrer"}
                                className="mt-4 flex w-fit items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
                              >
                                {item.bookUrl ? (item.vendor ? `Book on ${item.vendor}` : "Book") : "Website"}{" "}
                                <ExternalLink className="size-3.5" aria-hidden />
                              </a>
                            )}
                            {edit && (
                              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                                <label className="sr-only" htmlFor={`day-${item.id}`}>
                                  Day
                                </label>
                                <select
                                  id={`day-${item.id}`}
                                  value={day ?? ""}
                                  onChange={(e) => edit.setDay(item.id, e.target.value ? Number(e.target.value) : null)}
                                  className="rounded-lg border border-line bg-background px-2 py-1.5 text-sm"
                                >
                                  {Array.from({ length: days }, (_, d) => (
                                    <option key={d} value={d + 1}>
                                      Day {d + 1}
                                    </option>
                                  ))}
                                  <option value="">Not planned</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => edit.move(item.id, -1)}
                                  disabled={n === 0}
                                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm disabled:opacity-30"
                                >
                                  <ChevronUp className="size-4" aria-hidden /> Earlier
                                </button>
                                <button
                                  type="button"
                                  onClick={() => edit.move(item.id, 1)}
                                  disabled={n === list.length - 1}
                                  className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm disabled:opacity-30"
                                >
                                  <ChevronDown className="size-4" aria-hidden /> Later
                                </button>
                                <button
                                  type="button"
                                  onClick={() => edit.remove(item.id)}
                                  className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-rose-600"
                                >
                                  <Trash2 className="size-4" aria-hidden /> Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </StopDetails>
                      </li>
                    );
                  })}
                </ul>
              )}
              {routeUrl && (
                <p className="border-t border-line px-4 py-3 text-sm">
                  <a
                    href={routeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                  >
                    Route in Google Maps <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </p>
              )}
            </details>
          </div>
        );
      })}
    </div>
  );
}
