import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { youtubeId, youtubeStart } from "@/lib/youtube";
import { UpdatedOn } from "@/components/updated-on";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Map as MapIcon } from "lucide-react";
import { SampleBanner } from "@/components/sample-banner";
import { CreatorChip, CreatorSocials } from "@/components/creator";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import type { CartItem } from "@/lib/cart-store";
import { toCartItem } from "@/lib/cart-item";
import { getItinerary, getItinerarySlugs } from "@/lib/data";
import { categoryLabel, sentimentLabel, tierLabel } from "@/lib/format";
import { Money, Price } from "@/components/money";
import { dayColor, dayLegs, googleMapsPlaceUrl, googleMapsRouteUrl, hasPin } from "@/lib/map";
import { DriveSummary, LegHint } from "@/components/road-time";
import { placeHref } from "@/lib/place";
import { TripMap, type MapGroup, type MapStop } from "@/components/trip-map";
import { EditorTake } from "@/components/editor-take";
import { CouponCode } from "@/components/coupon-code";
import { getEditor } from "@/lib/editor";
import { Thumb } from "@/components/thumb";
import { DayFaces, Snapshots } from "@/components/snapshots";

/** "Read the full guide on saltinourhair.com", or "Watch the full video on YouTube". */
function fullGuideLabel(url: string) {
  const host = new URL(url).hostname.replace(/^(www|m)\./, "");
  if (/youtube\.com|youtu\.be/.test(host)) return "Watch the full video on YouTube";
  if (/instagram\.com/.test(host)) return "See the full post on Instagram";
  if (/tiktok\.com/.test(host)) return "Watch the full video on TikTok";
  return `Read the full guide on ${host}`;
}

export async function generateStaticParams() {
  return getItinerarySlugs();
}

export async function generateMetadata({ params }: PageProps<"/itineraries/[slug]">): Promise<Metadata> {
  const it = await getItinerary((await params).slug);
  return it ? { title: it.title, description: it.summary } : {};
}

export default async function ItineraryPage({ params }: PageProps<"/itineraries/[slug]">) {
  const [it, editor] = await Promise.all([getItinerary((await params).slug), getEditor()]);
  if (!it) notFound();
  const fullGuide = fullGuideLabel(it.sourceUrl);
  const video = youtubeId(it.sourceUrl);

  // Places the creator says to skip stay listed but out of the route bundle.
  const skipped = new Set(
    it.schedule.flatMap(({ items }) => items.filter((i) => i.sentiment === "AVOID").map((i) => i.id)),
  );
  const cartItems = new Map<string, CartItem>(
    it.schedule.flatMap(({ items }) => items.map((i) => [i.id, toCartItem(i, it)])),
  );

  // Each day's stops are numbered in order; the same number shows on the map pin and in the list.
  const pinNumber = new Map<string, number>();
  const stops: MapStop[] = [];
  const groups: MapGroup[] = [];
  const drive = new Map<number, ReturnType<typeof dayLegs>>();
  for (const [index, { day, items }] of it.schedule.entries()) {
    const pinned = items.filter((i) => i.sentiment !== "AVOID").filter(hasPin);
    drive.set(day, dayLegs(pinned));
    pinned.forEach((i, n) => {
      pinNumber.set(i.id, n + 1);
      stops.push({
        key: i.id,
        lat: i.lat,
        lng: i.lng,
        label: String(n + 1),
        color: dayColor(index),
        title: i.name,
        subtitle: `Day ${day} · ${categoryLabel[i.category]}`,
        href: googleMapsPlaceUrl(i.name, it.destination.name),
        group: day,
        cartId: i.id,
      });
    });
    if (pinned.length)
      groups.push({ id: day, label: `Day ${day}`, color: dayColor(index), routeUrl: googleMapsRouteUrl(pinned) });
  }

  return (
    <>
      {it.destination.isSample && <SampleBanner />}
      <Link href={`/destinations/${it.destination.slug}`} className="text-sm text-muted hover:text-foreground">
        ← {it.destination.name}
      </Link>
      {it.coverUrl ? (
        <div className="relative mt-4 h-52 overflow-hidden rounded-2xl sm:h-72">
          <Thumb
            url={it.coverUrl}
            category="EXPERIENCE"
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="size-full"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="font-hand text-xl text-white/90">{tierLabel[it.tier]}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{it.title}</h1>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent">{tierLabel[it.tier]}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{it.title}</h1>
        </>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-muted">
        {/* Each "· part" is one unit, so a wrapped line never starts with a dangling dot. */}
        by <CreatorChip creator={it.creator} /> <span>· {it.days} days</span>{" "}
        <span>
          · <UpdatedOn date={it.updatedAt} className="text-sm" />
        </span>
        {it.totalCents > 0 && (
          <span>
            · <Money cents={it.totalCents} /> est.{it.unpricedCount > 0 && " for priced items"}
          </span>
        )}
      </p>
      <div className="mt-3">
        <CreatorSocials creator={it.creator} />
      </div>
      <p className="mt-3 max-w-2xl">{it.summary}</p>
      <Snapshots
        className="mt-6"
        shots={it.schedule.flatMap(({ day, items }) =>
          items
            .filter((i) => i.photoUrl && i.sentiment !== "AVOID")
            .map((i) => ({ id: i.id, url: i.photoUrl!, caption: i.name, label: `Day ${day}` })),
        )}
      />
      <a
        href={it.sourceUrl}
        rel="noopener noreferrer"
        target="_blank"
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent px-4 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-background"
      >
        {fullGuide} <ExternalLink className="size-3.5" aria-hidden />
      </a>
      {video && (
        <div className="mt-5 max-w-2xl">
          <YouTubeEmbed id={video} title={`${it.title} by ${it.creator.name}`} start={youtubeStart(it.sourceUrl)} />
        </div>
      )}
      {it.editorTake && <EditorTake editor={editor} take={it.editorTake} />}
      <p className="mt-3 text-sm">
        <Link href={`/creators/${it.creator.handle}`} className="text-muted underline hover:text-foreground">
          More from {it.creator.name}
        </Link>
      </p>
      <div className="mt-5">
        <AddRouteButton items={[...cartItems.values()].filter((c) => !skipped.has(c.id))} />
      </div>
      <PageGuide id="itinerary" className="mt-6" />

      {stops.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <MapIcon className="size-5 text-accent" aria-hidden /> Where you&apos;ll go
          </h2>
          <TripMap stops={stops} groups={groups} connect />
        </section>
      )}

      <div className="mt-10 space-y-8">
        {it.schedule.map(({ day, items }, index) => (
          <section key={day}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
                <DayFaces urls={items.flatMap((i) => (i.photoUrl && i.sentiment !== "AVOID" ? [i.photoUrl] : []))} />
                Day {day} <DriveSummary minutes={drive.get(day)?.total ?? 0} />
              </h2>
              {groups.find((g) => g.id === day)?.routeUrl && (
                <a
                  href={groups.find((g) => g.id === day)!.routeUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                >
                  Day {day} route in Google Maps <ExternalLink className="size-3.5" aria-hidden />
                </a>
              )}
            </div>
            <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
              {items.map((item) => (
                <li
                  key={item.id}
                  // Fixed columns (details | price | booking button | add) so every row lines up with the next.
                  className="cv-row grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 p-4 sm:grid-cols-[minmax(0,1fr)_11rem_10.5rem_2.25rem] sm:items-start sm:gap-x-4"
                >
                  <div className="col-span-3 flex min-w-0 gap-3 sm:col-span-1 sm:gap-4">
                    <Thumb
                      url={item.photoUrl}
                      category={item.category}
                      className={`size-16 rounded-xl sm:size-20 ${item.sentiment === "AVOID" ? "opacity-50 grayscale" : ""}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {pinNumber.has(item.id) && (
                          <span
                            className="mr-2 inline-flex size-5 items-center justify-center rounded-full align-[1px] text-[11px] font-semibold text-white"
                            style={{ background: dayColor(index) }}
                            title="Pin number on the map"
                          >
                            {pinNumber.get(item.id)}
                          </span>
                        )}
                        {item.placeSlug ? (
                          <Link
                            href={placeHref(it.destination.slug, item.placeSlug)}
                            className="hover:text-accent hover:underline"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          item.name
                        )}
                        {item.sentiment === "MUST_VISIT" && (
                          <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 align-middle text-xs font-medium text-accent">
                            {sentimentLabel.MUST_VISIT}
                          </span>
                        )}
                        {item.sentiment === "OPTIONAL" && (
                          <span className="ml-2 rounded-full bg-line px-2 py-0.5 align-middle text-xs text-muted">
                            {sentimentLabel.OPTIONAL}
                          </span>
                        )}
                        {item.sentiment === "AVOID" && (
                          <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 align-middle text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                            {sentimentLabel.AVOID}
                          </span>
                        )}
                      </p>
                      {item.note && <p className="mt-0.5 text-sm text-muted">{item.note}</p>}
                      <LegHint leg={drive.get(day)?.legs.get(item.id)} />
                      <p className="mt-0.5 text-xs text-muted">
                        {categoryLabel[item.category]}
                        {item.unit && ` · ${item.quantity} ${item.unit}${item.quantity > 1 ? "s" : ""}`}
                      </p>
                      {(item.couponCode || item.creditedTo) && (
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                          {item.couponCode && <CouponCode code={item.couponCode} note={item.couponNote} />}
                          {item.couponNote && <span className="text-muted">{item.couponNote}</span>}
                          {item.creditedTo && <span className="text-muted">via {item.creditedTo}&apos;s link</span>}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`min-w-0 text-sm tabular-nums [overflow-wrap:anywhere] sm:pt-0.5 sm:text-right ${item.priceCents === null ? "text-muted" : ""}`}
                  >
                    <Price item={item} />
                    {item.priceCents !== null && item.priceNote && (
                      <span className="block text-xs text-muted">{item.priceNote}</span>
                    )}
                    {item.priceSourceUrl && (
                      <a
                        href={item.priceSourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-muted underline decoration-dotted hover:text-accent"
                        title="The creator didn't list a price; this is the typical price from this source."
                      >
                        Typical price · {new URL(item.priceSourceUrl).hostname.replace(/^www\./, "")}
                      </a>
                    )}
                  </span>
                  <div className="flex justify-end sm:block">
                    {item.sentiment !== "AVOID" &&
                      (item.bookUrl ? (
                        <a
                          href={item.bookUrl}
                          rel="sponsored noopener noreferrer"
                          target="_blank"
                          title={item.bookIsSearch ? `Search ${item.vendor} for ${item.name}` : undefined}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium whitespace-nowrap text-background hover:opacity-90"
                        >
                          {item.bookIsSearch
                            ? `Find on ${item.vendor}`
                            : item.vendor
                              ? `Book on ${item.vendor}`
                              : "Book"}{" "}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      ) : (
                        item.website && (
                          <a
                            href={item.website}
                            rel="noopener noreferrer"
                            target="_blank"
                            className="inline-flex w-full items-center justify-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-foreground"
                          >
                            Website <ExternalLink className="size-3" aria-hidden />
                          </a>
                        )
                      ))}
                  </div>
                  <div className="flex justify-end">
                    {item.sentiment !== "AVOID" && <AddItemButton item={cartItems.get(item.id)!} />}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-line bg-card p-5">
        <p className="text-sm text-muted">
          This is a summary of {it.creator.name}&apos;s itinerary. Their guide has the photos, stories and tips that
          don&apos;t fit here.
        </p>
        <a
          href={it.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background"
        >
          {fullGuide} <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>
    </>
  );
}
