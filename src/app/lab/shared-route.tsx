import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import { CreatorChip } from "@/components/creator";
import { Money, Price } from "@/components/money";
import { DriveSummary } from "@/components/road-time";
import { Thumb } from "@/components/thumb";
import type { MapGroup, MapStop } from "@/components/trip-map";
import { toCartItem } from "@/lib/cart-item";
import { getItinerary } from "@/lib/data";
import { tierLabel } from "@/lib/format";
import { dayColor, dayLegs, googleMapsPlaceUrl, hasPin } from "@/lib/map";

export const SLUG = "bali-7-days-saltinourhair";

export async function load() {
  const it = (await getItinerary(SLUG))!;
  const stops: MapStop[] = [];
  const groups: MapGroup[] = [];
  const drive = new Map<number, number>();
  const pin = new Map<string, number>();
  it.schedule.forEach(({ day, items }, index) => {
    const pinned = items.filter((i) => i.sentiment !== "AVOID").filter(hasPin);
    drive.set(day, dayLegs(pinned).total);
    pinned.forEach((i, n) => {
      pin.set(i.id, n + 1);
      stops.push({
        key: i.id,
        lat: i.lat,
        lng: i.lng,
        label: String(n + 1),
        color: dayColor(index),
        title: i.name,
        subtitle: `Day ${day}`,
        href: googleMapsPlaceUrl(i.name, it.destination.name),
        group: day,
        cartId: i.id,
      });
    });
    if (pinned.length)
      groups.push({ id: day, label: `Day ${day}`, color: dayColor(index) });
  });
  const kept = it.schedule.flatMap((d) =>
    d.items.filter((i) => i.sentiment !== "AVOID"),
  );
  const total = kept.reduce((n, i) => n + (i.priceCents ?? 0) * (i.quantity || 1), 0);
  return { it, stops, groups, drive, pin, kept, total };
}
type L = Awaited<ReturnType<typeof load>>;

/** Title block both versions share: one line of facts instead of four tiles. */
export function Head({ l }: { l: L }) {
  const { it } = l;
  return (
    <header>
      <Link href={`/destinations/${it.destination.slug}`} className="text-sm text-muted">
        ← {it.destination.name}
      </Link>
      <p className="eyebrow mt-3">{tierLabel[it.tier]}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{it.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
        <CreatorChip creator={it.creator} /> · {it.days} days · {l.kept.length} stops ·{" "}
        <span className="font-medium text-foreground">
          ~<Money cents={l.total} currency={l.kept[0]?.currency ?? "USD"} />
        </span>
      </p>
      <p className="mt-3 max-w-2xl text-muted">{it.summary}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AddRouteButton items={l.kept.map((i) => toCartItem(i, it))} />
        <a
          href={it.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
        >
          Full guide <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </header>
  );
}

/** One stop as a single compact line. */
export function Stop({ l, i, color }: { l: L; i: L["kept"][number]; color: string }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="relative shrink-0">
        <Thumb url={i.photoUrl} category={i.category} className="size-12 rounded-lg" />
        {l.pin.has(i.id) && (
          <span
            className="absolute -top-1.5 -left-1.5 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-card"
            style={{ background: color }}
          >
            {l.pin.get(i.id)}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{i.name}</span>
        {i.note && <span className="block truncate text-sm text-muted">{i.note}</span>}
      </span>
      <span className="shrink-0 text-right text-sm tabular-nums">
        <Price item={i} />
      </span>
      <AddItemButton item={toCartItem(i, l.it)} />
    </li>
  );
}

/** B: every day folds; the first is open. The summary line carries the day's numbers. */
export function DayFold({ l, index, open }: { l: L; index: number; open?: boolean }) {
  const { day, items } = l.it.schedule[index];
  const kept = items.filter((i) => i.sentiment !== "AVOID");
  const cost = kept.reduce((n, i) => n + (i.priceCents ?? 0) * (i.quantity || 1), 0);
  return (
    <details open={open} className="group rounded-2xl border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
          style={{ background: dayColor(index) }}
        >
          {day}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">Day {day}</span>
          <span className="block truncate text-sm text-muted">
            {kept.length} stops · <Money cents={cost} currency={kept[0]?.currency ?? "USD"} />
            {" · "}
            {kept.map((i) => i.name).join(", ")}
          </span>
        </span>
        <DriveSummary minutes={l.drive.get(day) ?? 0} />
        <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="divide-y divide-line border-t border-line px-4">
        {kept.map((i) => (
          <Stop key={i.id} l={l} i={i} color={dayColor(index)} />
        ))}
      </ul>
    </details>
  );
}
