import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Users } from "lucide-react";
import { AllocationBar } from "@/components/allocation-bar";
import { Photo, PhotoCredit } from "@/components/photo";
import { SampleBanner } from "@/components/sample-banner";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { categoryLabel, formatMoney, tierLabel } from "@/lib/format";

// "West Nusa Penida (Kelingking Beach, …)" searches better without the parenthetical.
function placeQuery(place: string, destination: string) {
  return `${place.split(" (")[0].split(" / ")[0]} ${destination}`;
}

// Places with a website get their own cache key so a stock photo cached earlier doesn't shadow the venue's.
function placePhotoKey(destination: string, place: { slug: string; website: string | null }) {
  return `place:${destination}:${place.slug}${place.website ? ":site" : ""}`;
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
  const destination = await getDestination((await params).slug);
  if (!destination) notFound();
  const { creatorCount } = destination;

  return (
    <>
      {destination.isSample && <SampleBanner />}
      <Photo
        photoKey={`destination:${destination.slug}`}
        query={`${destination.name} ${destination.country}`}
        category="DESTINATION"
        alt={destination.name}
        sizes="(min-width: 1024px) 1024px, 100vw"
        className="mb-6 aspect-[21/9] rounded-2xl"
        priority
      />
      <p className="text-sm text-muted">{destination.country}</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        {destination.name}
      </h1>
      <p className="mt-3 max-w-2xl text-muted">{destination.summary}</p>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Users className="size-5 text-accent" aria-hidden />{" "}
          {creatorCount > 1 ? "Creator consensus" : "Recommended spots"}
        </h2>
        {creatorCount === 1 && (
          <p className="mt-1 text-sm text-muted">
            From one creator so far. Agreement counts appear once more creators
            cover {destination.name}.
          </p>
        )}
        <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
          {destination.consensus.map((p) => {
            const all = p.creators.length === creatorCount;
            return (
              <li
                key={p.slug}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex gap-3">
                  <Photo
                    photoKey={placePhotoKey(destination.slug, p)}
                    query={placeQuery(p.name, destination.name)}
                    category={p.category}
                    website={p.website}
                    alt={p.name}
                    // Landscape photos cropped to a square need ~2x the box width to stay sharp.
                    sizes="128px"
                    credit={false}
                    className="size-16 shrink-0 rounded-lg"
                  />
                  <div>
                    <p className="font-medium">
                      {p.name}{" "}
                      <span className="ml-1 text-xs text-muted">
                        {categoryLabel[p.category]}
                      </span>
                    </p>
                    {p.tip && <p className="text-sm text-muted">{p.tip}</p>}
                    {p.creators.length > 0 && (
                      <p className="text-xs text-muted">
                        {p.creators.map((c) => c.name).join(", ")}
                      </p>
                    )}
                    {p.skippedBy.length > 0 && (
                      <p className="text-xs text-red-700 dark:text-red-400">
                        {p.skippedBy.map((c) => c.name).join(", ")} says skip it
                      </p>
                    )}
                    <p className="text-[10px] text-muted">
                      <PhotoCredit
                        photoKey={placePhotoKey(destination.slug, p)}
                        query={placeQuery(p.name, destination.name)}
                        category={p.category}
                        website={p.website}
                      />
                    </p>
                  </div>
                </div>
                {creatorCount > 1 && p.creators.length > 0 && (
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 self-start rounded-full px-3 py-1 text-sm font-medium sm:self-center ${
                      all ? "bg-accent-soft text-accent" : "bg-line text-muted"
                    }`}
                  >
                    {all && <CheckCircle2 className="size-4" aria-hidden />}
                    {p.creators.length}/{creatorCount} creators
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Compare routes</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {destination.routes.map((r) => (
            <Link
              key={r.slug}
              href={`/itineraries/${r.slug}`}
              className="flex flex-col rounded-2xl border border-line bg-card p-5 transition hover:border-accent"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-accent">
                {tierLabel[r.tier]}
              </span>
              <h3 className="mt-1 font-semibold">{r.title}</h3>
              <p className="text-sm text-muted">
                by {r.creator.name} · {r.days} days
              </p>
              {r.totalCents > 0 ? (
                <>
                  <p className="mt-3 text-2xl font-semibold">
                    {formatMoney(r.totalCents)}
                  </p>
                  <p className="mb-4 text-xs text-muted">
                    est. per person
                    {r.unpricedCount > 0 &&
                      ` · ${r.unpricedCount} items unpriced`}
                  </p>
                  <div className="mt-auto">
                    <AllocationBar allocation={r.allocation} />
                  </div>
                </>
              ) : (
                <p className="mt-3 text-sm text-muted">
                  Creator didn&apos;t list prices
                </p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
