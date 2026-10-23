import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, MapPin, Sun, Users } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { CreatorChip } from "@/components/creator";
import { AddItemButton } from "@/components/add-to-cart";
import { Photo, PhotoCredit } from "@/components/photo";
import { getDestination, getDestinationSlugs, getEsimPlans, getPosts } from "@/lib/data";
import { destinationFaq } from "@/lib/faq";
import { FaqList } from "@/components/faq-list";
import { UpdatedOn } from "@/components/updated-on";
import { WeatherCard } from "@/components/weather-card";
import { getWeather } from "@/lib/weather";
import { rainyDayPicks } from "@/lib/indoor";
import { getEditor } from "@/lib/editor";
import { categoryLabel, tierLabel } from "@/lib/format";
import { Money } from "@/components/money";
import { categoryHex, googleMapsPlaceUrl, hasPin } from "@/lib/map";
import { TripMap, type MapStop } from "@/components/trip-map";
import { bestMonths } from "@/lib/seasons";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { ConsensusFilter } from "./consensus-filter";
import type { ItemCategory } from "@/generated/prisma/enums";

function FromPrice({ p }: { p: { cents: number; unit: string | null; currency: string } }) {
  if (p.cents === 0) return "Free";
  return (
    <>
      from <Money cents={p.cents} currency={p.currency} />
      {p.unit && `/${p.unit}`}
    </>
  );
}

/** One line in place of the full bar legend: where most of the money goes. */
function SpendNote({ allocation }: { allocation: { category: ItemCategory; pct: number }[] }) {
  const top = allocation.reduce((a, b) => (b.pct > a.pct ? b : a));
  return (
    <p className="mt-1.5 text-xs text-muted">
      Mostly {categoryLabel[top.category].toLowerCase()} ({Math.round(top.pct)}%)
    </p>
  );
}

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d ? { title: `${d.name} itineraries compared`, description: d.summary } : {};
}

export default async function DestinationPage({ params }: PageProps<"/destinations/[slug]">) {
  const [destination, editor] = await Promise.all([getDestination((await params).slug), getEditor()]);
  if (!destination) notFound();
  const { creatorCount, consensus } = destination;
  const [esimPlans, posts, weather] = await Promise.all([
    getEsimPlans(destination.country),
    getPosts(destination.slug),
    destination.center ? getWeather(destination.center.lat, destination.center.lng) : null,
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
    color: p.skippedBy.length > p.creators.length ? "#a8a29e" : categoryHex[p.category],
    title: p.name,
    subtitle: [
      p.area,
      categoryLabel[p.category],
      creatorCount > 1 ? `${p.creators.length}/${creatorCount} creators` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    href: googleMapsPlaceUrl(p.name, `${p.area ? `${p.area}, ` : ""}${destination.name}`),
    cat: p.category,
    page: placeHref(destination.slug, p.slug),
    cartId: p.skippedBy.length === 0 ? p.cartItem?.id : undefined,
  }));

  const best = bestMonths(destination.months);
  // The answer up front: the spots most creators share, before the photo-and-tabs scroll to the full list.
  const agreed = consensus.filter((p) => p.creators.length >= 2 && p.skippedBy.length === 0).slice(0, 5);

  return (
    <>
      {creatorCount > 1 && agreed.length >= 3 && (
        <section className="mb-8 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-labelledby="agreed-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="agreed-heading" className="font-hand text-2xl leading-tight text-accent-2">
              Top 5 the creators agree on
            </h2>
            <a href="#agree" className="text-sm font-medium text-accent hover:underline">
              All {consensus.length} places ↓
            </a>
          </div>
          <ol className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {agreed.map((p, i) => (
              <li key={p.slug} className="flex items-baseline gap-2.5">
                <span className="w-4 shrink-0 text-right font-display text-lg font-semibold text-accent-2">{i + 1}</span>
                <span className="min-w-0">
                  <Link href={placeHref(destination.slug, p.slug)} className="font-medium hover:text-accent">
                    {p.name}
                  </Link>
                  <span className="text-sm whitespace-nowrap text-muted">
                    {" "}
                    · {p.creators.length} of {creatorCount} creators
                  </span>
                </span>
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
      {best && (
        <Link
          href={`/destinations/${destination.slug}/when`}
          className="mb-8 flex items-center gap-2 rounded-2xl border border-line bg-card px-4 py-3 text-sm transition hover:border-accent"
        >
          <Sun className="size-4 shrink-0 text-accent" aria-hidden />
          <span>
            Best time to go: <strong>{best}</strong>
          </span>
          <span className="ml-auto flex items-center gap-1 whitespace-nowrap font-medium text-accent">
            Month by month <ArrowRight className="size-4" aria-hidden />
          </span>
        </Link>
      )}
      <section>
        <h2 className="text-xl font-semibold">Pick your route</h2>
        <p className="mt-1 text-sm text-muted">
          Full day-by-day plans from real creators.<span className="md:hidden"> Swipe to compare.</span>
        </p>
        <div className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible">
          {destination.routes.map((r) => (
            <Link
              key={r.slug}
              href={`/itineraries/${r.slug}`}
              className="flex min-w-[78%] snap-start flex-col rounded-2xl border border-line bg-card p-5 transition hover:border-accent sm:min-w-[320px] md:min-w-0"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-accent">{tierLabel[r.tier]}</span>
                <span className="text-xs text-muted">{r.days} days</span>
              </div>
              <h3 className="mt-1 font-semibold">{r.title}</h3>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                by <CreatorChip creator={r.creator} link={false} />
              </p>
              {r.editorTake && (
                <p className="mt-2 line-clamp-2 border-l-2 border-accent pl-2 text-sm text-muted">
                  <span className="font-medium text-foreground">{editor.name}&apos;s take: </span>
                  {r.editorTake}
                </p>
              )}
              {r.totalCents > 0 ? (
                <>
                  <p className="mt-3 text-2xl font-semibold tabular-nums">
                    <Money cents={r.totalCents} />
                  </p>
                  <p className="mb-4 text-xs text-muted">
                    est. per person
                    {r.unpricedCount > 0 && ` + ${r.unpricedCount} without prices`}
                  </p>
                  <div className="mt-auto">
                    <AllocationBar allocation={r.allocation} legend={false} />
                    {r.allocation.length > 0 && <SpendNote allocation={r.allocation} />}
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">Creator didn&apos;t list prices</p>
              )}
              <p className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
                See the full plan <ArrowRight className="size-4" aria-hidden />
              </p>
            </Link>
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
            ? "Every spot the creators recommend, most agreed-on first. Tap + to add one to your trip cart."
            : `From one creator so far. Agreement counts appear once more creators cover ${destination.name}.`}{" "}
          <Link href={`/destinations/${destination.slug}/best`} className="font-medium text-accent hover:underline">
            Top picks, ranked
          </Link>
        </p>
        <ConsensusFilter categories={categories} counts={counts}>
          {stops.length > 0 && (
            <div className="mt-4">
              <TripMap
                stops={stops}
                legend={categories.map((c) => ({ label: categoryLabel[c], color: categoryHex[c] }))}
              />
            </div>
          )}
          <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
            {consensus.map((p) => {
              const all = p.creators.length === creatorCount;
              return (
                <li key={p.slug} data-cat={p.category} className="cv-row flex gap-3 p-4 sm:gap-4">
                  <Photo
                    photoKey={placePhotoKey(destination.slug, p)}
                    query={placeQuery(p.name, destination.name)}
                    category={p.category}
                    website={p.website}
                    alt={p.name}
                    // Landscape photos cropped to a square need ~2x the box width to stay sharp.
                    sizes="192px"
                    credit={false}
                    className="size-20 shrink-0 rounded-xl sm:size-24"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold leading-snug">
                          {hasPin(p) && (
                            <span
                              className="mr-1.5 inline-flex size-5 items-center justify-center rounded-full align-[1px] text-[11px] font-semibold text-white"
                              style={{ background: categoryHex[p.category] }}
                              title="Pin number on the map"
                            >
                              {rank.get(p.slug)}
                            </span>
                          )}
                          <Link
                            href={placeHref(destination.slug, p.slug)}
                            className="hover:text-accent hover:underline"
                          >
                            {p.name}
                          </Link>
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted">
                          {p.area && (
                            <>
                              <MapPin className="size-3" aria-hidden /> {p.area} ·
                            </>
                          )}{" "}
                          {categoryLabel[p.category]}
                          {creatorCount > 1 && p.creators.length > 0 && (
                            <span
                              className={`ml-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${
                                all ? "bg-accent-soft text-accent" : "bg-line text-muted"
                              }`}
                            >
                              {all && <CheckCircle2 className="size-3" aria-hidden />}
                              {p.creators.length}/{creatorCount} creators
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        {p.cartItem && p.skippedBy.length === 0 && <AddItemButton item={p.cartItem} />}
                        {p.fromPrice && (
                          <span className="whitespace-nowrap text-xs font-medium tabular-nums">
                            <FromPrice p={p.fromPrice} />
                          </span>
                        )}
                      </div>
                    </div>
                    {p.blurb && <p className="mt-1.5 line-clamp-3 text-sm text-muted">{p.blurb}</p>}
                    {p.tip && <p className="mt-1 text-sm text-muted">{p.tip}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {p.creators.map((c) => (
                        <CreatorChip key={c.handle} creator={c} />
                      ))}
                      {p.skippedBy.length > 0 && (
                        <span className="flex flex-wrap items-center gap-1.5 text-xs text-red-700 dark:text-red-400">
                          {p.skippedBy.map((c) => (
                            <CreatorChip key={c.handle} creator={c} />
                          ))}
                          says skip it
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      <PhotoCredit
                        photoKey={placePhotoKey(destination.slug, p)}
                        query={placeQuery(p.name, destination.name)}
                        category={p.category}
                        website={p.website}
                      />
                    </p>
                  </div>
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
                    {p.excerpt && <span className="mt-0.5 line-clamp-1 block text-sm text-muted">{p.excerpt}</span>}
                  </span>
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <FaqList title={`${destination.name} questions travellers ask`} faq={faq} />
      <UpdatedOn date={destination.updatedAt} />
    </>
  );
}
