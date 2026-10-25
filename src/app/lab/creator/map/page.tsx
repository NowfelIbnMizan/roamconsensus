import Link from "next/link";
import { Thumb } from "@/components/thumb";
import { TripMap, type MapStop } from "@/components/trip-map";
import { db } from "@/lib/db";
import { tierLabel } from "@/lib/format";
import { Header, cover, load } from "../shared";

async function pins(slugs: string[]) {
  "use cache";
  return db.place.findMany({
    where: { destination: { slug: { in: slugs } }, lat: { not: null } },
    select: { lat: true, lng: true, destination: { select: { slug: true } } },
  });
}

/** C: their map. One pin per city they planned, then the trips under each city name. */
export default async function MapLab() {
  const lab = await load();
  const slugs = [...new Set(lab.trips.map((t) => t.destination.slug))];
  const places = await pins(slugs);
  const median = (xs: number[]) => xs.sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  const groups = slugs.map((slug) => ({ slug, trips: lab.trips.filter((t) => t.destination.slug === slug) }));
  const stops: MapStop[] = groups.flatMap(({ slug, trips }) => {
    const pins = places.filter((p) => p.destination.slug === slug);
    if (!pins.length) return [];
    return [
      {
        key: slug,
        lat: median(pins.map((p) => p.lat!)),
        lng: median(pins.map((p) => p.lng!)),
        label: String(trips.length),
        color: "#ad4a22",
        title: trips[0].destination.name,
        subtitle: `${trips.length} ${trips.length === 1 ? "trip" : "trips"}`,
        href: `/itineraries/${trips[0].slug}`,
        page: `/itineraries/${trips[0].slug}`,
      },
    ];
  });
  return (
    <div className="mx-auto max-w-5xl">
      <Header lab={lab} />
      <h2 className="mt-8 text-lg font-semibold">Where they have planned trips</h2>
      <TripMap stops={stops} className="mt-3 h-64 sm:h-80" />
      <div className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
        {groups.map(({ slug, trips }) => (
          <section key={slug}>
            <h3 className="text-xs font-medium tracking-wide text-accent uppercase">{trips[0].destination.name}</h3>
            {trips.map((t) => (
              <Link
                key={t.slug}
                href={`/itineraries/${t.slug}`}
                className="mt-1.5 flex items-center gap-3 hover:text-accent"
              >
                <Thumb url={cover(t)} category="EXPERIENCE" className="size-11 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.title}</span>
                  <span className="text-xs text-muted">
                    {t.days} days · {tierLabel[t.tier]}
                  </span>
                </span>
              </Link>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
