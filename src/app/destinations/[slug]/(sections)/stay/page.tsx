import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BedDouble, MapPin } from "lucide-react";
import { AddItemButton } from "@/components/add-to-cart";
import { CreatorChip } from "@/components/creator";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
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

export default async function StayPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const areas = stayAreas(d);
  if (!areas.length) return <p className="text-muted">No creator stays listed for {d.name} yet.</p>;

  return (
    <>
      <h2 className="text-xl font-semibold">Where to stay in {d.name}</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        The areas creators actually slept in, with their hotels. &ldquo;Nearby&rdquo; counts the other spots creators
        recommend in the same area.
      </p>

      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-line bg-card sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Area</th>
              {d.creatorCount > 1 && <th className="px-4 py-2.5 font-medium">Creators stayed</th>}
              <th className="px-4 py-2.5 font-medium">From a night</th>
              <th className="px-4 py-2.5 font-medium">Nearby picks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {areas.map((a) => (
              <tr key={a.area}>
                <td className="px-4 py-3 font-semibold">
                  <a href={`#${encodeURIComponent(a.area)}`} className="hover:text-accent hover:underline">
                    {a.area}
                  </a>
                </td>
                {d.creatorCount > 1 && (
                  <td className="px-4 py-3 tabular-nums">
                    {a.creators.length} of {d.creatorCount}
                  </td>
                )}
                <td className="px-4 py-3 tabular-nums">
                  {a.from ? (
                    <Money cents={a.from.cents} currency={a.from.currency} />
                  ) : (
                    <span className="text-muted">Not listed</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">
                  {[a.todo.length && `${a.todo.length} to do`, a.food.length && `${a.food.length} to eat`]
                    .filter(Boolean)
                    .join(" · ") || "None listed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-5">
        {areas.map((a) => (
          <section
            key={a.area}
            id={encodeURIComponent(a.area)}
            className="scroll-mt-6 rounded-2xl border border-line bg-card p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 className="flex items-center gap-2 text-lg font-semibold">
                <MapPin className="size-4 text-accent" aria-hidden /> {a.area}
              </h3>
              <p className="text-sm text-muted">
                {d.creatorCount > 1 && (
                  <>
                    {a.creators.length} of {d.creatorCount} creators stayed here
                    {a.from && " · "}
                  </>
                )}
                {a.from && (
                  <>
                    from <Money cents={a.from.cents} currency={a.from.currency} /> a night
                  </>
                )}
              </p>
            </div>
            {a.todo.length + a.food.length > 0 && (
              <p className="mt-1 text-sm text-muted">
                Nearby:{" "}
                {[...a.todo, ...a.food].slice(0, 4).map((p, i) => (
                  <span key={p.slug}>
                    {i > 0 && ", "}
                    <Link href={placeHref(d.slug, p.slug)} className="underline hover:text-foreground">
                      {p.name}
                    </Link>
                  </span>
                ))}
                {a.todo.length + a.food.length > 4 && ` and ${a.todo.length + a.food.length - 4} more`}
              </p>
            )}
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {a.stays.map((p) => (
                <li key={p.slug} className="flex gap-3 rounded-xl border border-line p-3">
                  <Photo
                    photoKey={placePhotoKey(d.slug, p)}
                    query={placeQuery(p.name, d.name)}
                    category={p.category}
                    website={p.website}
                    alt={p.name}
                    sizes="160px"
                    credit={false}
                    className="size-20 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={placeHref(d.slug, p.slug)} className="font-medium leading-snug hover:text-accent">
                        {p.name}
                      </Link>
                      {p.cartItem && <AddItemButton item={p.cartItem} />}
                    </div>
                    {p.fromPrice && p.fromPrice.cents > 0 && (
                      <p className="text-sm tabular-nums">
                        <Money cents={p.fromPrice.cents} currency={p.fromPrice.currency} />
                        {p.fromPrice.unit && <span className="text-muted">/{p.fromPrice.unit}</span>}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {p.creators.map((c) => (
                        <CreatorChip key={c.handle} creator={c} />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-6 flex items-center gap-2 text-sm text-muted">
        <BedDouble className="size-4" aria-hidden /> Prices are what creators paid or the typical rate. Check current
        prices before you book.
      </p>
    </>
  );
}
