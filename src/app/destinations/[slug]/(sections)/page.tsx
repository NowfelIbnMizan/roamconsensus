import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Users } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { AgreePill } from "@/components/agree-pill";
import { CreatorChip } from "@/components/creator";
import { AddItemButton } from "@/components/add-to-cart";
import { Photo } from "@/components/photo";
import {
  getDestination,
  getDestinationSlugs,
  getEsimPlans,
  getPosts,
  getStays,
} from "@/lib/data";
import { CityNutshell } from "@/components/city-nutshell";
import { destinationFaq } from "@/lib/faq";
import { FaqList } from "@/components/faq-list";
import { UpdatedOn } from "@/components/updated-on";
import { WeatherCard } from "@/components/weather-card";
import { getWeather } from "@/lib/weather";
import { rainyDayPicks } from "@/lib/indoor";
import { getEditor } from "@/lib/editor";
import { categoryLabel, mostlyPriced, tierLabel } from "@/lib/format";
import { Money } from "@/components/money";
import { categoryHex, googleMapsPlaceUrl, hasPin } from "@/lib/map";
import { TripMap, type MapStop } from "@/components/trip-map";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { FavouriteButton } from "@/components/favourite-button";
import { Thumb } from "@/components/thumb";
import { ConsensusFilter } from "./consensus-filter";
import { PlaceFlip } from "./place-flip";
import type { ItemCategory } from "@/generated/prisma/enums";

function FromPrice({
  p,
}: {
  p: { cents: number; unit: string | null; currency: string };
}) {
  if (p.cents === 0) return "Free";
  return (
    <>
      from <Money cents={p.cents} currency={p.currency} />
      {p.unit && `/${p.unit}`}
    </>
  );
}

/** One line in place of the full bar legend: where most of the money goes. */
function SpendNote({
  allocation,
}: {
  allocation: { category: ItemCategory; pct: number }[];
}) {
  const top = allocation.reduce((a, b) => (b.pct > a.pct ? b : a));
  return (
    <p className="mt-1.5 text-xs text-muted">
      Mostly {categoryLabel[top.category].toLowerCase()} ({Math.round(top.pct)}
      %)
    </p>
  );
}

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({
  params,
}: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? { title: `${d.name} itineraries compared`, description: d.summary }
    : {};
}

export default async function DestinationPage({
  params,
}: PageProps<"/destinations/[slug]">) {
  const [destination, editor] = await Promise.all([
    getDestination((await params).slug),
    getEditor(),
  ]);
  if (!destination) notFound();
  const { creatorCount, consensus } = destination;
  const [esimPlans, posts, stays, weather] = await Promise.all([
    getEsimPlans(destination.country),
    getPosts(destination.slug),
    getStays(destination.slug),
    destination.center
      ? getWeather(destination.center.lat, destination.center.lng)
      : null,
  ]);
  const faq = destinationFaq(destination, esimPlans);

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
    cartId: p.skippedBy.length === 0 ? p.cartItem?.id : undefined,
  }));

  // The answer up front: the spots most creators share, before the photo-and-tabs scroll to the full list.
  const agreed = consensus
    .filter((p) => p.creators.length >= 2 && p.skippedBy.length === 0)
    .slice(0, 5);

  return (
    <>
      <CityNutshell d={destination} stays={stays} />
      {creatorCount > 1 && agreed.length >= 3 && (
        <section
          className="mb-8 rounded-2xl border border-line bg-card p-4 sm:p-5"
          aria-labelledby="agreed-heading"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="agreed-heading" className="text-xl font-semibold">
              Top 5 the creators agree on
            </h2>
            <a
              href="#agree"
              className="text-sm font-medium text-accent hover:underline"
            >
              All {consensus.length} places ↓
            </a>
          </div>
          <ol className="-mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
            {agreed.map((p, i) => (
              <li key={p.slug} className="w-40 shrink-0 snap-start sm:w-auto">
                <Link
                  href={placeHref(destination.slug, p.slug)}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-xl"
                >
                  <Photo
                    photoKey={placePhotoKey(destination.slug, p)}
                    query={placeQuery(p.name, destination.name)}
                    category={p.category}
                    website={p.website}
                    alt=""
                    sizes="(min-width: 640px) 220px, 160px"
                    credit={false}
                    className="size-full transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <span className="absolute top-2.5 left-3 font-display text-2xl font-semibold text-white drop-shadow">
                    {i + 1}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-2.5 text-white">
                    <span className="block font-semibold leading-tight text-balance">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-white/85">
                      {p.creators.length} of {creatorCount} creators
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
      {weather && (
        <WeatherCard
          name={destination.name}
          weather={weather}
          rainyPicks={rainyDayPicks(consensus, 4).map((p) => ({
            name: p.name,
            href: placeHref(destination.slug, p.slug),
          }))}
        />
      )}
      <section>
        <h2 className="text-xl font-semibold">Pick your route</h2>
        <p className="mt-1 text-sm text-muted">
          Day-by-day plans from independent creators.
          <span className="md:hidden"> Swipe to compare.</span>
        </p>
        <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {destination.routes.map((r) => (
            // The title link stretches over the whole card, so the creator name can open its own profile card.
            <article
              key={r.slug}
              className="relative flex min-w-[78%] snap-start flex-col overflow-hidden rounded-2xl border border-line bg-card p-5 transition hover:border-accent sm:min-w-[320px] md:min-w-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent"
            >
              {r.photos.length > 0 && (
                <div className="-mx-5 -mt-5 mb-4 grid h-32 grid-cols-3 gap-0.5">
                  {r.photos.map((url, n) => (
                    <Thumb
                      key={url}
                      url={url}
                      category="EXPERIENCE"
                      sizes="(min-width: 768px) 360px, 80vw"
                      // One photo fills the strip; two split 2:1; three sit side by side.
                      className={`h-full ${r.photos.length === 1 ? "col-span-3" : r.photos.length === 2 && n === 0 ? "col-span-2" : ""}`}
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-accent">
                  {tierLabel[r.tier]}
                </span>
                <span className="text-xs text-muted">{r.days} days</span>
              </div>
              <h3 className="mt-1 font-semibold">
                <Link
                  href={`/itineraries/${r.slug}`}
                  className="after:absolute after:inset-0 focus-visible:outline-none"
                >
                  {r.title}
                </Link>
              </h3>
              <p className="relative z-10 mt-1 flex flex-wrap items-center gap-1.5 self-start text-sm text-muted">
                by <CreatorChip creator={r.creator} />
              </p>
              {r.editorTake && (
                <p className="mt-2 line-clamp-2 border-l-2 border-accent pl-2 text-sm text-muted">
                  <span className="font-medium text-foreground">
                    {editor.name}&apos;s take:{" "}
                  </span>
                  {r.editorTake}
                </p>
              )}
              {r.totalCents > 0 && mostlyPriced(r) ? (
                <>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                    <Money cents={r.totalCents} />
                  </p>
                  <p className="mb-4 text-xs text-muted">
                    est. per person
                    {r.unpricedCount > 0 &&
                      ` + ${r.unpricedCount} without prices`}
                  </p>
                  <div className="mt-auto">
                    <AllocationBar allocation={r.allocation} legend={false} />
                    {r.allocation.length > 0 && (
                      <SpendNote allocation={r.allocation} />
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  {r.totalCents > 0
                    ? `Partly priced (${r.stops - r.unpricedCount} of ${r.stops} stops)`
                    : "Creator didn't list prices"}
                </p>
              )}
              <p className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
                See the full plan <ArrowRight className="size-4" aria-hidden />
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="agree" className="mt-12 scroll-mt-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="size-5 text-accent" aria-hidden />{" "}
          {creatorCount > 1 ? "What creators agree on" : "Recommended spots"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {creatorCount > 1
            ? "Most agreed-on first. Tap + to save one."
            : `From one creator so far.`}{" "}
          <Link
            href={`/destinations/${destination.slug}/best`}
            className="font-medium text-accent hover:underline"
          >
            Top picks, ranked
          </Link>
        </p>
        <ConsensusFilter categories={categories} counts={counts}>
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
          <ul className="mt-5 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
            {consensus.map((p) => {
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
                  className="cv-row flex flex-col"
                  style={{ containIntrinsicSize: "auto 300px" }}
                >
                  <div className="relative">
                    {p.blurb || p.tip ? (
                      <PlaceFlip
                        name={p.name}
                        about={
                          <>
                            {p.blurb && (
                              <span className="line-clamp-6 sm:line-clamp-5">
                                {p.blurb}
                              </span>
                            )}
                            {p.tip && (
                              <span className="mt-1.5 line-clamp-3 text-white/80">
                                Tip: {p.tip}
                              </span>
                            )}
                          </>
                        }
                      >
                        {photo}
                      </PlaceFlip>
                    ) : (
                      <div className="overflow-hidden rounded-2xl">{photo}</div>
                    )}
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
                      {p.cartItem && p.skippedBy.length === 0 && (
                        <AddItemButton item={p.cartItem} />
                      )}
                    </div>
                  </div>
                  <p className="eyebrow mt-2.5 truncate">
                    {p.area ?? categoryLabel[p.category]}
                  </p>
                  <Link
                    href={placeHref(destination.slug, p.slug)}
                    className="mt-0.5 font-semibold leading-snug hover:text-accent hover:underline"
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
                </li>
              );
            })}
          </ul>
        </ConsensusFilter>
      </section>

      {posts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold">From the blog</h2>
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
            {posts.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="flex items-center justify-between gap-3 p-4 hover:text-accent"
                >
                  <span>
                    <span className="font-medium">{p.title}</span>
                    {p.excerpt && (
                      <span className="mt-0.5 line-clamp-1 block text-sm text-muted">
                        {p.excerpt}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqList
        title={`${destination.name} questions travellers ask`}
        faq={faq}
      />
      <UpdatedOn date={destination.updatedAt} />
    </>
  );
}
