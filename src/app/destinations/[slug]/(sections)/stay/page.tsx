import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddItemButton } from "@/components/add-to-cart";
import { CreatorChip } from "@/components/creator";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
import { TripMap, type MapStop } from "@/components/trip-map";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";

type Props = PageProps<"/destinations/[slug]/stay">;
type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Place = Destination["consensus"][number];

/**
 * Areas the creators slept in, most creators first. Each area also counts the other spots creators recommend there,
 * which says more about its feel than a made-up "vibe" line would.
 */
function stayAreas(d: Destination) {
  const recommended = d.consensus.filter((p) => p.creators.length > 0 && p.skippedBy.length === 0);
  type Area = { stays: Place[]; creators: Map<string, Place["creators"][number]> };
  const areas = new Map<string, Area>();
  for (const p of recommended) {
    if (p.category !== "STAY" || !p.area) continue;
    const a: Area = areas.get(p.area) ?? { stays: [], creators: new Map() };
    a.stays.push(p);
    p.creators.forEach((c) => a.creators.set(c.handle, c));
    areas.set(p.area, a);
  }
  return [...areas]
    .map(([area, a]) => {
      const nearby = recommended.filter((p) => p.area === area && p.category !== "STAY");
      const nightly = a.stays
        .map((p) => p.fromPrice)
        .filter((f) => f && f.cents > 0 && f.unit === "night")
        .sort((x, y) => x!.cents - y!.cents);
      return {
        area,
        stays: a.stays,
        creators: [...a.creators.values()],
        from: nightly[0] ?? null,
        todo: nearby.filter((p) => p.category === "EXPERIENCE"),
        food: nearby.filter((p) => p.category === "FOOD"),
      };
    })
    .sort((a, b) => b.creators.length - a.creators.length || b.stays.length - a.stays.length);
}

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? {
        title: `Where to stay in ${d.name}: the areas travel creators pick`,
        description: `The ${d.name} neighbourhoods travel creators stayed in, with their hotels, nightly prices and what's nearby.`,
      }
    : {};
}

// One colour per area, shared by its number badge and its map pins.
const AREA_COLORS = ["#0f6b62", "#e0703f", "#7c3aed", "#2563eb", "#b45309", "#be185d", "#4d7c0f", "#475569"];

export default async function StayPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const areas = stayAreas(d);
  if (!areas.length) return <p className="text-muted">No creator stays listed for {d.name} yet.</p>;
  const color = (i: number) => AREA_COLORS[i % AREA_COLORS.length];
  const stops: MapStop[] = areas.flatMap((a, i) =>
    a.stays
      .filter((p) => p.lat !== null && p.lng !== null)
      .map((p) => ({
        key: p.slug,
        lat: p.lat!,
        lng: p.lng!,
        label: String(i + 1),
        color: color(i),
        title: p.name,
        subtitle: a.area,
        page: placeHref(d.slug, p.slug),
        cartId: p.cartItem?.id,
      })),
  );

  return (
    <>
      <h2 className="text-xl font-semibold">Where to stay in {d.name}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">The areas creators actually slept in, with their hotels.</p>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-8">
        {stops.length > 0 && (
          <div className="mb-5 lg:sticky lg:top-4 lg:col-start-2 lg:row-start-1 lg:mb-0">
            <TripMap
              stops={stops}
              legend={areas.map((a, i) => ({ label: a.area, color: color(i) }))}
              className="h-72 sm:h-96 lg:h-[calc(100vh-11rem)]"
            />
          </div>
        )}
        <div className="space-y-4 lg:col-start-1 lg:row-start-1">
          {areas.map((a, i) => {
            const nearby = [...a.todo, ...a.food];
            return (
              <section
                key={a.area}
                id={encodeURIComponent(a.area)}
                className="scroll-mt-6 rounded-2xl border border-line bg-card p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="flex items-center gap-2 font-semibold">
                    <span
                      aria-hidden
                      className="flex size-6 shrink-0 items-center justify-center rounded-full text-xs text-white"
                      style={{ background: color(i) }}
                    >
                      {i + 1}
                    </span>
                    {a.area}
                  </h3>
                  <p className="text-sm text-muted">
                    {d.creatorCount > 1 && (
                      <>
                        {a.creators.length} of {d.creatorCount} creators
                        {a.from && " · "}
                      </>
                    )}
                    {a.from && (
                      <>
                        from <Money cents={a.from.cents} currency={a.from.currency} />
                      </>
                    )}
                  </p>
                </div>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {a.stays.map((p) => (
                    <li key={p.slug} className="flex min-w-0 items-center gap-3">
                      <Photo
                        photoKey={placePhotoKey(d.slug, p)}
                        query={placeQuery(p.name, d.name)}
                        category={p.category}
                        website={p.website}
                        alt={p.name}
                        sizes="112px"
                        credit={false}
                        className="size-14 shrink-0 rounded-lg"
                      />
                      <div className="min-w-0 flex-1">
                        <Link
                          href={placeHref(d.slug, p.slug)}
                          className="block truncate font-medium hover:text-accent"
                        >
                          {p.name}
                        </Link>
                        {p.fromPrice && p.fromPrice.cents > 0 ? (
                          <p className="text-sm tabular-nums">
                            <Money cents={p.fromPrice.cents} currency={p.fromPrice.currency} />
                            {p.fromPrice.unit && <span className="text-muted">/{p.fromPrice.unit}</span>}
                          </p>
                        ) : (
                          <p className="text-sm text-muted">Price not listed</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {p.creators.map((c) => (
                            <CreatorChip key={c.handle} creator={c} />
                          ))}
                        </div>
                      </div>
                      {p.cartItem && <AddItemButton item={p.cartItem} />}
                    </li>
                  ))}
                </ul>
                {nearby.length > 0 && (
                  <p className="mt-3 text-sm text-muted">
                    Nearby:{" "}
                    {nearby.slice(0, 3).map((p, n) => (
                      <span key={p.slug}>
                        {n > 0 && ", "}
                        <Link href={placeHref(d.slug, p.slug)} className="underline hover:text-foreground">
                          {p.name}
                        </Link>
                      </span>
                    ))}
                    {nearby.length > 3 && ` and ${nearby.length - 3} more`}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </div>
      <p className="fine-print mt-6">Prices are what creators paid or the typical rate. Check before you book.</p>
    </>
  );
}
