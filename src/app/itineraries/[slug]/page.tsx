import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { StopDetails } from "@/components/stop-details";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { youtubeId, youtubeStart } from "@/lib/youtube";
import { UpdatedOn } from "@/components/updated-on";
import Link from "next/link";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { siteUrl } from "@/lib/email";
import { breadcrumbJsonLd, clip, ldJson } from "@/lib/seo";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Map as MapIcon,
} from "lucide-react";
import { SampleBanner } from "@/components/sample-banner";
import { CreatorChip } from "@/components/creator";
import { CreatorNoticeLine, SupportCreator } from "@/components/creator-notice";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import type { CartItem } from "@/lib/cart-store";
import { toCartItem } from "@/lib/cart-item";
import { getItinerary, getItinerarySlugs } from "@/lib/data";
import { categoryLabel, sentimentLabel, tierLabel } from "@/lib/format";
import { Money, Price } from "@/components/money";
import {
  dayColor,
  dayLegs,
  googleMapsPlaceUrl,
  googleMapsRouteUrl,
  hasPin,
} from "@/lib/map";
import { DriveSummary, LegHint } from "@/components/road-time";
import { placeHref } from "@/lib/place";
import { TripMap, type MapGroup, type MapStop } from "@/components/trip-map";
import { EditorTake } from "@/components/editor-take";
import { CouponCode } from "@/components/coupon-code";
import { getEditor } from "@/lib/editor";
import { Thumb } from "@/components/thumb";
import { Snapshots } from "@/components/snapshots";
import { convertCents, FALLBACK_RATES } from "@/lib/currency";

/** "Read the full guide on saltinourhair.com", or "Watch the full video on YouTube". */
function fullGuideLabel(url: string) {
  const host = new URL(url).hostname.replace(/^(www|m)\./, "");
  if (/youtube\.com|youtu\.be/.test(host))
    return "Watch the full video on YouTube";
  if (/instagram\.com/.test(host)) return "See the full post on Instagram";
  if (/tiktok\.com/.test(host)) return "Watch the full video on TikTok";
  return `Read the full guide on ${host}`;
}

/** Day numbers the creator gives no plan for, before schedule[index] (or, past the end, up to the route's length). */
function restDays(schedule: { day: number }[], index: number, days: number) {
  const from = (schedule[index - 1]?.day ?? 0) + 1;
  const to = schedule[index]?.day ?? days + 1;
  return Array.from({ length: Math.max(0, to - from) }, (_, n) => from + n);
}

function FreeDay({ day, creator }: { day: number; creator: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3">
      <span
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line text-sm font-semibold text-muted"
        aria-hidden
      >
        {day}
      </span>
      <p className="text-sm text-muted">
        <span className="font-semibold text-foreground">Day {day}</span> · Free
        day: {creator} gives no plan for it.
      </p>
    </div>
  );
}

type Stop = NonNullable<
  Awaited<ReturnType<typeof getItinerary>>
>["schedule"][number]["items"][number];

/** Everything about one stop, shown when its row is tapped. */
function StopCard({
  item,
  destination,
  leg,
}: {
  item: Stop;
  destination: string;
  leg?: { km: number; minutes: number };
}) {
  return (
    <div className="pr-8">
      <p className="eyebrow">{categoryLabel[item.category]}</p>
      <p className="mt-1 font-display text-xl leading-snug font-semibold">
        {item.name}
      </p>
      <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
        {item.sentiment === "MUST_VISIT" && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
            {sentimentLabel.MUST_VISIT}
          </span>
        )}
        {item.sentiment === "OPTIONAL" && (
          <span className="rounded-full bg-line px-2 py-0.5 text-muted">
            {sentimentLabel.OPTIONAL}
          </span>
        )}
        {item.sentiment === "AVOID" && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            {sentimentLabel.AVOID}
          </span>
        )}
      </p>
      {item.closedNote && (
        <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
          <span className="mr-1.5 rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-950">
            Closed
          </span>
          {item.closedNote !== "Closed" &&
            item.closedNote !== item.note &&
            item.closedNote}
        </p>
      )}
      {item.note && <p className="mt-3 text-sm">{item.note}</p>}
      <LegHint leg={leg} />
      <div className="mt-4 rounded-2xl bg-background px-4 py-3">
        <p className="text-lg font-semibold tabular-nums">
          <Price item={item} />
          {item.unit && (
            <span className="ml-1.5 text-sm font-normal text-muted">
              for {item.quantity} {item.unit}
              {item.quantity > 1 ? "s" : ""}
            </span>
          )}
        </p>
        {item.priceCents !== null &&
          item.priceNote &&
          // "Free" already says it.
          !(
            item.priceCents === 0 && /^free\b.{0,15}$/i.test(item.priceNote)
          ) && <p className="text-sm text-muted">{item.priceNote}</p>}
        {item.priceSourceUrl && (
          <a
            href={item.priceSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 block text-xs text-muted underline decoration-dotted hover:text-accent"
          >
            Typical price from{" "}
            {new URL(item.priceSourceUrl).hostname.replace(/^www\./, "")}
            {item.priceCheckedAt &&
              ` · checked ${new Date(item.priceCheckedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}`}
          </a>
        )}
        {(item.couponCode || item.creditedTo) && (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {item.couponCode && (
              <CouponCode code={item.couponCode} note={item.couponNote} />
            )}
            {item.couponNote && (
              <span className="text-muted">{item.couponNote}</span>
            )}
            {item.creditedTo && (
              <span className="text-muted">
                via {item.creditedTo}&apos;s link
              </span>
            )}
          </p>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {item.bookUrl ? (
            <a
              href={item.bookUrl}
              rel="sponsored noopener noreferrer"
              target="_blank"
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              {item.bookIsSearch
                ? `Find on ${item.vendor}`
                : item.vendor
                  ? `Book on ${item.vendor}`
                  : "Book"}{" "}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          ) : (
            item.website && (
              <a
                href={item.website}
                rel="noopener noreferrer"
                target="_blank"
                className="inline-flex items-center gap-1 rounded-full border border-line px-4 py-2 text-sm hover:bg-line/50"
              >
                Website <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )
          )}
        {item.placeSlug && (
          <Link
            href={placeHref(destination, item.placeSlug)}
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Open place <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return getItinerarySlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/itineraries/[slug]">): Promise<Metadata> {
  const it = await getItinerary((await params).slug);
  if (!it) return {};
  // "One week in Bali" alone matches few searches; add the city when missing and the creator's name.
  const city = it.title.toLowerCase().includes(it.destination.name.toLowerCase()) ? "" : ` in ${it.destination.name}`;
  const title = `${it.title}${city}`;
  return {
    // Titles past about 60 characters get cut in results, so the creator's name goes only where it fits.
    title: title.length + it.creator.name.length <= 50 ? `${title}, by ${it.creator.name}` : title,
    description: clip(it.summary),
    alternates: { canonical: `/itineraries/${it.slug}` },
  };
}

export default async function ItineraryPage({
  params,
}: PageProps<"/itineraries/[slug]">) {
  const [it, editor] = await Promise.all([
    getItinerary((await params).slug),
    getEditor(),
  ]);
  if (!it) notFound();
  const fullGuide = fullGuideLabel(it.sourceUrl);
  // The photo strip needs two photos to show; without it (or a video) the header stays one column.
  const photoCount = it.schedule
    .flatMap(({ items }) => items)
    .filter((i) => i.photoUrl && i.sentiment !== "AVOID").length;
  const video = youtubeId(it.sourceUrl);

  // Places the creator says to skip, and closed ones, stay listed but out of the route bundle (and its total).
  const skipped = new Set(
    it.schedule.flatMap(({ items }) =>
      items.filter((i) => i.sentiment === "AVOID" || i.closedNote).map((i) => i.id),
    ),
  );
  const cartItems = new Map<string, CartItem>(
    it.schedule.flatMap(({ items }) =>
      items.map((i) => [i.id, toCartItem(i, it)]),
    ),
  );

  // Each day's stops are numbered in order; the same number shows on the map pin and in the list.
  const pinNumber = new Map<string, number>();
  const stops: MapStop[] = [];
  const groups: MapGroup[] = [];
  const drive = new Map<number, ReturnType<typeof dayLegs>>();
  for (const { day, items } of it.schedule) {
    const pinned = items.filter((i) => i.sentiment !== "AVOID").filter(hasPin);
    drive.set(day, dayLegs(pinned));
    pinned.forEach((i, n) => {
      pinNumber.set(i.id, n + 1);
      stops.push({
        key: i.id,
        lat: i.lat,
        lng: i.lng,
        label: String(n + 1),
        color: dayColor(day - 1),
        title: i.name,
        subtitle: `Day ${day} · ${categoryLabel[i.category]}`,
        href: googleMapsPlaceUrl(i.name, it.destination.name),
        group: day,
        cartId: i.id,
      });
    });
    if (pinned.length)
      groups.push({
        id: day,
        label: `Day ${day}`,
        color: dayColor(day - 1),
        routeUrl: googleMapsRouteUrl(pinned),
      });
  }

  const kept = it.schedule.flatMap(({ items }) =>
    items.filter((i) => i.sentiment !== "AVOID" && !i.closedNote),
  );
  const priced = kept.filter((i) => i.priceCents !== null).length;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: it.title,
    description: it.summary,
    url: `${siteUrl()}/itineraries/${it.slug}`,
    author: { "@type": "Person", name: it.creator.name, url: it.creator.profileUrl },
    isBasedOn: it.sourceUrl,
    itinerary: {
      "@type": "ItemList",
      itemListElement: kept.map((i, n) => ({ "@type": "ListItem", position: n + 1, name: i.name })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson(jsonLd)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(
          breadcrumbJsonLd([
            ["Home", "/"],
            [it.destination.name, `/destinations/${it.destination.slug}`],
            [it.title, `/itineraries/${it.slug}`],
          ]),
        )}
      />
      {it.destination.isSample && <SampleBanner />}
      <Link
        href={`/destinations/${it.destination.slug}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {it.destination.name}
      </Link>
      {it.coverUrl ? (
        <div className="relative mt-4 h-52 overflow-hidden rounded-2xl sm:h-72">
          <Thumb
            url={it.coverUrl}
            alt={it.destination.name}
            category="EXPERIENCE"
            sizes="(min-width: 1536px) 1536px, 100vw"
            className="size-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="eyebrow text-white/85">{tierLabel[it.tier]}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {it.title}
            </h1>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent">
            {tierLabel[it.tier]}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{it.title}</h1>
        </>
      )}
      {/* Wide screens: the facts and buttons on the left, the trip in photos (and video) beside them. */}
      <div
        className={
          video || photoCount >= 2
            ? "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-start xl:gap-10"
            : ""
        }
      >
        <div>
          {/* One line of facts instead of a row of tiles. Each "· part" is one unit, so a wrapped line never starts with a
              dangling dot. */}
          <p className="mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
            by <CreatorChip creator={it.creator} />{" "}
            <span>
              · {it.days} {it.days === 1 ? "day" : "days"}
            </span>
            <span>· {kept.length} stops</span>
            {it.totalCents > 0 && (
              <span
                title={
                  priced < kept.length
                    ? `${priced} of ${kept.length} stops have a price`
                    : undefined
                }
              >
                ·{" "}
                <span className="font-medium text-foreground">
                  <Money cents={it.totalCents} />
                  {priced < kept.length && "+"}
                </span>
                {priced < kept.length && " in listed prices"}
              </span>
            )}
            <span>
              · <UpdatedOn date={it.updatedAt} className="text-sm" />
            </span>
          </p>
          <CreatorNoticeLine name={it.creator.name} className="mt-2 max-w-2xl" />
          <p className="mt-3 max-w-2xl">{it.summary}</p>
          {/* The main action comes straight after the summary; full width on phones. */}
          <div className="mt-4">
            <AddRouteButton
              items={[...cartItems.values()].filter((c) => !skipped.has(c.id))}
              className="w-full justify-center sm:w-auto"
            />
          </div>
          <a
            href={it.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-background"
          >
            {fullGuide} <ExternalLink className="size-3.5" aria-hidden />
          </a>
          {it.editorTake && <EditorTake editor={editor} take={it.editorTake} />}
          <p className="mt-3 text-sm">
            <Link
              href={`/creators/${it.creator.handle}`}
              className="inline-flex min-h-11 items-center text-muted underline hover:text-foreground sm:min-h-0"
            >
              More from {it.creator.name}
            </Link>
          </p>
          <PageGuide id="itinerary" className="mt-6" />
        </div>
        <div>
          <Snapshots
            className="mt-6 xl:mt-3"
            shots={it.schedule.flatMap(({ day, items }) =>
              items
                .filter((i) => i.photoUrl && i.sentiment !== "AVOID")
                .map((i) => ({
                  id: i.id,
                  url: i.photoUrl!,
                  caption: i.name,
                  label: `Day ${day}`,
                  href: i.placeSlug ? placeHref(it.destination.slug, i.placeSlug) : undefined,
                  card: (
                    <div className="max-h-[60vh] overflow-y-auto">
                      <p className="eyebrow">
                        Day {day} · {i.area ? `${i.area} · ` : ""}
                        {categoryLabel[i.category]}
                      </p>
                      <p className="mt-1 font-display text-lg font-semibold leading-snug">{i.name}</p>
                      <p className="text-sm text-muted tabular-nums">
                        <Price item={i} />
                      </p>
                      {i.note && (
                        <p className="mt-2 text-sm">
                          <span className="font-medium">{it.creator.name}:</span> {i.note}
                        </p>
                      )}
                      {i.blurb && <p className="mt-2 text-sm text-muted">{i.blurb}</p>}
                      {i.placeSlug && (
                        <Link
                          href={placeHref(it.destination.slug, i.placeSlug)}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                        >
                          Open place <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      )}
                    </div>
                  ),
                })),
            )}
          />
          {video && (
            <div className="mt-5 max-w-2xl">
              <YouTubeEmbed
                id={video}
                title={`${it.title} by ${it.creator.name}`}
                start={youtubeStart(it.sourceUrl)}
              />
            </div>
          )}
        </div>
      </div>

      {/* On wide screens the map sits beside the days and stays in view while you scroll them. */}
      {/* On phones the days come first and the map after them, so the plan starts right under the header. */}
      <div className="flex flex-col lg:mt-10 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
        {stops.length > 0 && (
          <section className="order-2 mt-10 lg:order-none lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:mt-0">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
              <MapIcon className="size-5 text-accent" aria-hidden /> Where
              you&apos;ll go
            </h2>
            <TripMap
              stops={stops}
              groups={groups}
              connect
              className="h-72 sm:h-96 lg:h-[calc(100vh-11rem)]"
            />
          </section>
        )}

        <div className="order-1 mt-10 space-y-3 lg:order-none lg:col-start-1 lg:row-start-1 lg:mt-0">
          {it.schedule.map(({ day, items }, index) => {
            const going = items.filter(
              (i) => i.sentiment !== "AVOID" && !i.closedNote,
            );
            // In USD, like the route total: prices can be in local currency.
            const cost = going.reduce(
              (n, i) =>
                n +
                convertCents((i.priceCents ?? 0) * i.quantity, i.currency, "USD", FALLBACK_RATES).cents,
              0,
            );
            const routeUrl = groups.find((g) => g.id === day)?.routeUrl;
            return (
              <Fragment key={day}>
                {restDays(it.schedule, index, it.days).map((rest) => (
                  <FreeDay key={rest} day={rest} creator={it.creator.name} />
                ))}
                {/* Each day folds to one line (its numbers and stops), so the whole route scans at a glance. */}
                <details
                  open={index === 0}
                  className="group rounded-2xl border border-line bg-card"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
                    <span
                      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: dayColor(day - 1) }}
                      aria-hidden
                    >
                      {day}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h2 className="font-semibold">Day {day}</h2>
                        <span className="text-sm text-muted tabular-nums">
                          {going.length} {going.length === 1 ? "stop" : "stops"}
                          {cost > 0 && (
                            <>
                              {" · "}
                              <Money cents={cost} />
                            </>
                          )}
                        </span>
                        <DriveSummary minutes={drive.get(day)?.total ?? 0} />
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-muted group-open:hidden">
                        {going.map((i) => i.name).join(" · ")}
                      </span>
                    </span>
                    <ChevronDown
                      className="size-5 shrink-0 text-muted transition group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <ul className="divide-y divide-line border-t border-line px-2 sm:px-3">
                    {items.map((item) => {
                      const skip = item.sentiment === "AVOID";
                      return (
                        <li
                          key={item.id}
                          className="flex items-center gap-2 py-2"
                        >
                          <StopDetails
                            label={item.name}
                            row={
                              <>
                                <span className="relative shrink-0 p-1">
                                  <Thumb
                                    url={item.photoUrl}
                                    alt={item.name}
                                    category={item.category}
                                    className={`size-14 rounded-lg ${skip ? "opacity-50 grayscale" : ""}`}
                                  />
                                  {pinNumber.has(item.id) && (
                                    <span
                                      className="absolute top-0 left-0 inline-flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white ring-2 ring-card"
                                      style={{ background: dayColor(day - 1) }}
                                      title="Pin number on the map"
                                    >
                                      {pinNumber.get(item.id)}
                                    </span>
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 py-1">
                                  <span className="block font-medium leading-snug">
                                    {item.name}
                                    {item.sentiment === "MUST_VISIT" && (
                                      <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-medium text-accent">
                                        {sentimentLabel.MUST_VISIT}
                                      </span>
                                    )}
                                    {skip && (
                                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 align-middle text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                                        {sentimentLabel.AVOID}
                                      </span>
                                    )}
                                    {item.closedNote && (
                                      <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 align-middle text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                                        Closed
                                      </span>
                                    )}
                                  </span>
                                  {item.note && (
                                    <span className="block truncate text-sm text-muted">
                                      {item.note}
                                    </span>
                                  )}
                                </span>
                                <span
                                  className={`shrink-0 pr-1 text-right text-sm tabular-nums ${item.priceCents === null ? "max-w-32 truncate text-muted" : ""}`}
                                >
                                  <Price item={item} />
                                </span>
                              </>
                            }
                          >
                            <StopCard
                              item={item}
                              destination={it.destination.slug}
                              leg={drive.get(day)?.legs.get(item.id)}
                            />
                          </StopDetails>
                          <div className="shrink-0">
                            {/* "Skip it" stays out of the whole-route bundle, but the traveller can still add it. */}
                            <AddItemButton item={cartItems.get(item.id)!} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  {routeUrl && (
                    <p className="border-t border-line px-4 py-3 text-sm">
                      <a
                        href={routeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
                      >
                        Open Day {day} in Google Maps{" "}
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </p>
                  )}
                </details>
              </Fragment>
            );
          })}
          {restDays(it.schedule, it.schedule.length, it.days).map((rest) => (
            <FreeDay key={rest} day={rest} creator={it.creator.name} />
          ))}
        </div>
      </div>

      <SupportCreator
        creator={it.creator}
        sourceUrl={it.sourceUrl}
        className="mt-10"
      />
    </>
  );
}
