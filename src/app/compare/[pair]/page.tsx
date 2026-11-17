import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Money } from "@/components/money";
import { PageGuide } from "@/components/page-guide";
import { PageIntro } from "@/components/page-intro";
import { RouteCard } from "@/components/post-routes";
import { byDayCost } from "@/lib/collections";
import { getDestination, getDestinations } from "@/lib/data";
import { placeHref } from "@/lib/place";
import { breadcrumbJsonLd, canonical, clip, ldJson } from "@/lib/seo";
import { MIN_ROUTES, cityFacts, liveVersus, reasonsFor, versusHref, versusPair, type CityFacts } from "@/lib/versus";

type Props = PageProps<"/compare/[pair]">;

export async function generateStaticParams() {
  const pairs = liveVersus(await getDestinations());
  // Cache Components needs at least one path at build time; the placeholder just 404s.
  return pairs.length ? pairs.map(([a, b]) => ({ pair: `${a}-vs-${b}` })) : [{ pair: "none" }];
}

async function load(params: Props["params"]) {
  const pair = versusPair((await params).pair);
  if (!pair) return null;
  const [a, b] = await Promise.all(pair.map((slug) => getDestination(slug)));
  if (!a || !b || a.routes.length < MIN_ROUTES || b.routes.length < MIN_ROUTES) return null;
  return { a, b, fa: cityFacts(a), fb: cityFacts(b), path: versusHref(a.slug, b.slug) };
}

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const span = (low: number | null, high: number | null) =>
  low === null || high === null ? null : low === high ? count(low, "day", "days") : `${low} to ${high} days`;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await load(params);
  if (!page) return {};
  const { a, b, fa, fb } = page;
  const routes = fa.routes + fb.routes;
  return {
    title: `${a.name} vs ${b.name}: ${routes} creator itineraries compared`,
    description: clip(
      `${a.name} or ${b.name}? ${fa.routes} ${a.name} and ${fb.routes} ${b.name} itineraries from travel creators, side by side: trip length, cost a day, best months and the places most of them include.`,
    ),
    ...canonical(page.path),
  };
}

/** A day's cost range from the routes that price a hotel and most stops. */
function DayCost({ f }: { f: CityFacts }) {
  if (f.dayLowCents === null || f.dayHighCents === null) return <span className="text-muted">Not enough priced routes</span>;
  return (
    <>
      <Money cents={f.dayLowCents} />
      {f.dayHighCents !== f.dayLowCents && (
        <>
          {" to "}
          <Money cents={f.dayHighCents} />
        </>
      )}
      <span className="block text-xs font-normal text-muted">{count(f.pricedRoutes, "route", "routes")} with hotels priced</span>
    </>
  );
}

/** Two cities side by side, from their creator routes and guides only: the numbers, then the places, then the routes. */
export default async function VersusPage({ params }: Props) {
  const page = await load(params);
  if (!page) notFound();
  const { a, b, fa, fb, path } = page;
  const sides = [
    { d: a, f: fa, reasons: reasonsFor(fa, fb) },
    { d: b, f: fb, reasons: reasonsFor(fb, fa) },
  ];
  const rows: { label: string; cells: React.ReactNode[] }[] = [
    { label: "Creator routes", cells: sides.map(({ f }) => `${f.routes} from ${count(f.creators, "creator", "creators")}`) },
    { label: "Trip length", cells: sides.map(({ f }) => span(f.minDays, f.maxDays)) },
    { label: "Cost a day, per person", cells: sides.map(({ f }) => <DayCost key="cost" f={f} />) },
    ...(fa.guideDayCents !== null && fb.guideDayCents !== null
      ? [
          {
            label: "Typical mid-range day",
            cells: sides.map(({ f }) => (
              <>
                <Money cents={f.guideDayCents!} />
                <span className="block text-xs font-normal text-muted">with half a double room</span>
              </>
            )),
          },
        ]
      : []),
    ...(fa.best && fb.best ? [{ label: "Best months", cells: sides.map(({ f }) => f.best) }] : []),
    { label: "Places 2+ creators pick", cells: sides.map(({ f }) => String(f.shared)) },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(breadcrumbJsonLd([["Home", "/"], [`${a.name} vs ${b.name}`, path]]))}
      />
      <p className="eyebrow">City vs city</p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {a.name} or {b.name}?
      </h1>
      <p className="mt-2 max-w-2xl text-muted">
        {a.name} has {count(fa.routes, "creator route", "creator routes")} to compare, {b.name} has {fb.routes}. Here is
        how they differ on days, cost and the places creators include.
      </p>
      <PageIntro path={path} className="mt-3" />
      <PageGuide id="versus" className="mt-4" />

      {sides.some((s) => s.reasons.length > 0) && (
        <section aria-label="Which to pick" className="mt-6 grid gap-3 sm:grid-cols-2">
          {sides.map(({ d, reasons }) => (
            <div key={d.slug} className="rounded-2xl border border-line bg-card p-4 sm:p-5">
              <h2 className="text-xl font-semibold">Pick {d.name} if</h2>
              {reasons.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-sm">
                  {reasons.map((r) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      {r}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No number sets it apart yet. Its places and routes are below.</p>
              )}
              <Link
                href={`/destinations/${d.slug}`}
                className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                See {d.name} routes <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          ))}
        </section>
      )}

      <section aria-labelledby="glance" className="mt-10">
        <h2 id="glance" className="text-xl font-semibold">
          At a glance
        </h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <td className="p-3 sm:p-4" />
                {sides.map(({ d }) => (
                  <th key={d.slug} scope="col" className="p-3 font-display text-lg font-semibold sm:p-4">
                    {d.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row" className="w-1/3 p-3 align-top font-normal text-muted sm:p-4">
                    {row.label}
                  </th>
                  {row.cells.map((cell, n) => (
                    <td key={sides[n].d.slug} className="p-3 align-top font-medium tabular-nums sm:p-4">
                      {cell ?? <span className="font-normal text-muted">Not listed</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine-print mt-2">
          Counted from the creator routes on this site. Cost a day is each route&apos;s total divided by its days.
        </p>
      </section>

      <section aria-labelledby="places" className="mt-10">
        <h2 id="places" className="text-xl font-semibold">
          Places creators include most
        </h2>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          {sides.map(({ d, f }) => (
            <div key={d.slug}>
              <h3 className="font-semibold">{d.name}</h3>
              <ol className="mt-2 divide-y divide-line border-y border-line">
                {f.top.map((p, n) => (
                  <li key={p.slug}>
                    <Link href={placeHref(d.slug, p.slug)} className="group flex min-h-11 items-center gap-3 py-2 text-sm">
                      <span className="w-4 text-muted tabular-nums">{n + 1}</span>
                      <span className="min-w-0 flex-1 font-medium group-hover:text-accent">{p.name}</span>
                      {d.creatorCount > 1 && (
                        <span className="shrink-0 text-xs text-muted">
                          {p.creators.length} of {d.creatorCount}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
              <Link
                href={`/destinations/${d.slug}/best`}
                className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {d.name} top picks <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {sides.map(({ d }) => (
        <section key={d.slug} className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">
              {d.name} routes{" "}
              <span className="text-base font-normal text-muted">cheapest a day first</span>
            </h2>
            {d.routes.length > 2 && (
              <Link
                href={`/destinations/${d.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                All {d.routes.length} {d.name} routes <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {[...d.routes]
              .sort(byDayCost)
              .slice(0, 2)
              .map((r) => (
                <RouteCard key={r.slug} route={r} />
              ))}
          </div>
        </section>
      ))}

      <section className="mt-10 rounded-2xl border border-line bg-card p-4 sm:p-5">
        <h2 className="text-xl font-semibold">Doing both?</h2>
        <p className="mt-1 text-sm text-muted">
          Add a route from each city to your trip. The second city&apos;s days go after the first.
        </p>
        <Link
          href={`/itineraries?where=${a.slug},${b.slug}`}
          className="mt-3 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm font-medium hover:border-accent hover:text-accent"
        >
          Find routes for {a.name} and {b.name} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </>
  );
}
