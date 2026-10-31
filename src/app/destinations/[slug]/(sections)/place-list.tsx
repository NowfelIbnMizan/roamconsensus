import Link from "next/link";
import { AgreePill } from "@/components/agree-pill";
import { AddItemButton } from "@/components/add-to-cart";
import { FavouriteButton } from "@/components/favourite-button";
import { Photo } from "@/components/photo";
import { TripMap, type MapStop } from "@/components/trip-map";
import type { getDestination } from "@/lib/data";
import { categoryLabel } from "@/lib/format";
import { categoryHex, googleMapsPlaceUrl, hasPin } from "@/lib/map";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";
import { ConsensusFilter } from "./consensus-filter";
import { CONSENSUS_PREVIEW } from "./preview";
import { PlaceHover } from "@/components/place-hover";
import { FromPrice, MiniCard } from "./place-mini-card";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;

/** Cards kept per category on the city page, so a filter chip still shows a handful before "See all". */
const PER_CATEGORY = 8;

type Place = Destination["consensus"][number];

/**
 * The mini profile a place card shows on hover (sheet on phones): city page grid and its Top 5. Only the text it
 * needs goes to the browser; a server-rendered card per place doubled the page size.
 */
export function PlaceMiniCard({
  p,
  destination,
  creatorCount,
}: {
  p: Place;
  destination: string;
  creatorCount: number;
}) {
  return (
    <MiniCard
      eyebrow={[p.area, categoryLabel[p.category]].filter(Boolean).join(" · ")}
      name={p.name}
      fromPrice={p.fromPrice}
      blurb={p.blurb}
      tip={p.tip}
      picked={
        p.creators.length === 0
          ? null
          : creatorCount > 1
            ? `${p.creators.length} of ${creatorCount} creators recommend it`
            : `Picked by ${p.creators[0].name}`
      }
      href={placeHref(destination, p.slug)}
    />
  );
}

/**
 * The map and photo grid of every place creators recommend, most agreed-on first, with category chips.
 * `limit` (the city page) renders only the top rows overall plus the top few per category, and links to the full
 * list on /destinations/[slug]/places: Bali has over 100 places, too many cards for one phone page.
 */
export function PlaceList({ destination, limit = false }: { destination: Destination; limit?: boolean }) {
  const { creatorCount, consensus } = destination;
  const counts: Record<string, number> = {};
  for (const p of consensus) counts[p.category] = (counts[p.category] ?? 0) + 1;
  const categories = Object.keys(counts) as ItemCategory[];

  // Pins are numbered by list position, so "7" on the map is the 7th spot in the list.
  const rank = new Map(consensus.map((p, n) => [p.slug, n + 1]));
  const stops: MapStop[] = consensus.filter(hasPin).map((p) => ({
    key: p.slug,
    lat: p.lat,
    lng: p.lng,
    label: String(rank.get(p.slug)),
    color:
      p.skippedBy.length > p.creators.length
        ? "#a8a29e"
        : categoryHex[p.category],
    title: p.name,
    subtitle: [
      p.area,
      categoryLabel[p.category],
      creatorCount > 1 ? `${p.creators.length}/${creatorCount} creators` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: googleMapsPlaceUrl(
      p.name,
      `${p.area ? `${p.area}, ` : ""}${destination.name}`,
    ),
    cat: p.category,
    page: placeHref(destination.slug, p.slug),
    cartId: p.cartItem?.id,
  }));


  const allHref = `/destinations/${destination.slug}/places`;
  const seen: Record<string, number> = {};
  const shown = limit
    ? consensus.filter((p, n) => {
        seen[p.category] = (seen[p.category] ?? 0) + 1;
        return n < CONSENSUS_PREVIEW || seen[p.category] <= PER_CATEGORY;
      })
    : consensus;
  const shownCounts: Record<string, number> = {};
  for (const p of shown) shownCounts[p.category] = (shownCounts[p.category] ?? 0) + 1;

  return (
    <ConsensusFilter
      categories={categories}
      counts={counts}
      shown={limit ? shownCounts : undefined}
      moreHref={limit ? allHref : undefined}
      collapse={limit}
    >
      {stops.length > 0 && (
        <div className="mt-4">
          <TripMap
            stops={stops}
            legend={categories.map((c) => ({
              label: categoryLabel[c],
              color: categoryHex[c],
            }))}
          />
        </div>
      )}
      {/* The full list is long, so phones get one row per place with a small photo; the city page keeps the grid. */}
      <ul
        className={`mt-5 grid gap-x-3 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-6 lg:grid-cols-4 2xl:grid-cols-5 ${
          limit ? "grid-cols-2 gap-y-6" : "grid-cols-1 gap-y-3"
        }`}
      >
        {shown.map((p) => {
          const photo = (
            <Photo
              photoKey={placePhotoKey(destination.slug, p)}
              query={placeQuery(p.name, destination.name)}
              category={p.category}
              website={p.website}
              alt={p.name}
              sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 50vw"
              credit={false}
              className="aspect-square w-full sm:aspect-[4/3]"
            />
          );
          return (
            <li
              key={p.slug}
              data-cat={p.category}
              className={`cv-row flex ${limit ? "flex-col" : "items-start gap-3 sm:flex-col sm:gap-0"}`}
              style={{ containIntrinsicSize: `auto ${limit ? 300 : 110}px` }}
            >
              <div className={`relative ${limit ? "" : "w-28 shrink-0 sm:w-auto sm:self-stretch"}`}>
                <PlaceHover
                  href={placeHref(destination.slug, p.slug)}
                  name={p.name}
                  card={<PlaceMiniCard p={p} destination={destination.slug} creatorCount={creatorCount} />}
                >
                  {photo}
                </PlaceHover>
                {hasPin(p) && (
                  <span
                    className="pointer-events-none absolute top-2 left-2 z-[3] inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-white/80"
                    style={{ background: categoryHex[p.category] }}
                    title="Pin number on the map"
                  >
                    {rank.get(p.slug)}
                  </span>
                )}
                <div className="absolute top-1.5 right-1.5 z-[3] flex items-center rounded-full bg-card/90 px-1 backdrop-blur">
                  <FavouriteButton
                    destination={destination.slug}
                    place={p.slug}
                    name={p.name}
                  />
                  {p.cartItem && (
                    <AddItemButton item={p.cartItem} />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`eyebrow truncate ${limit ? "mt-2.5" : "sm:mt-2.5"}`}>
                  {p.area ?? categoryLabel[p.category]}
                </p>
                <Link
                  href={placeHref(destination.slug, p.slug)}
                  className="mt-0.5 block font-semibold leading-snug hover:text-accent hover:underline"
                >
                  {p.name}
                </Link>
                {p.fromPrice && (
                  <p className="mt-0.5 text-sm text-muted tabular-nums">
                    <FromPrice p={p.fromPrice} />
                  </p>
                )}
                <AgreePill
                  className="mt-1"
                  creators={p.creators}
                  total={creatorCount}
                  skippedBy={p.skippedBy}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </ConsensusFilter>
  );
}
