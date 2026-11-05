import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageGuide } from "@/components/page-guide";
import { PageIntro } from "@/components/page-intro";
import { RouteCard } from "@/components/post-routes";
import { byDayCost, sharedPlaces } from "@/lib/collections";
import { getCountries, getCountry } from "@/lib/countries";
import { placeHref } from "@/lib/place";
import { breadcrumbJsonLd, canonical, ldJson } from "@/lib/seo";

type Props = PageProps<"/countries/[country]">;

export async function generateStaticParams() {
  const countries = await getCountries();
  // Cache Components needs at least one path at build time; the placeholder just 404s.
  return countries.length ? countries.map((c) => ({ country: c.slug })) : [{ country: "none" }];
}

async function load(params: Props["params"]) {
  const c = await getCountry((await params).country);
  if (!c) return null;
  const routes = c.cities.flatMap((d) => d.routes);
  const creators = new Set(routes.map((r) => r.creator.name)).size;
  return { ...c, routes, creators };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await load(params);
  if (!c) return {};
  const names = c.cities.map((d) => d.name);
  return {
    title: `${c.name} itineraries: ${c.routes.length} creator routes in ${c.cities.length} cities`,
    description: `${c.routes.length} ${c.name} itineraries from ${c.creators} travel creators across ${names.slice(0, -1).join(", ")} and ${names.at(-1)}, compared side by side, with prices, maps and the places they agree on.`,
    ...canonical(`/countries/${c.slug}`),
  };
}

/** Every creator route in a country, city by city, with where each city's routes agree. */
export default async function CountryPage({ params }: Props) {
  const c = await load(params);
  if (!c) notFound();
  const path = `/countries/${c.slug}`;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={ldJson(breadcrumbJsonLd([["Home", "/"], [`${c.name} itineraries`, path]]))}
      />
      <p className="eyebrow">Country</p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{c.name} itineraries from travel creators</h1>
      <p className="mt-1 text-sm text-muted">
        {c.routes.length} {c.routes.length === 1 ? "route" : "routes"} across {c.cities.length}{" "}
        {c.cities.length === 1 ? "city" : "cities"}, from {c.creators}{" "}
        {c.creators === 1 ? "creator" : "creators"}.
      </p>
      <PageIntro path={path} className="mt-3" />
      <PageGuide id="country" className="mt-4" />

      <nav aria-label="Cities" className="mt-6 flex flex-wrap gap-2">
        {c.cities.map((d) => (
          <a
            key={d.slug}
            href={`#${d.slug}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3.5 py-1.5 text-sm hover:border-accent"
          >
            {d.name} <span className="text-xs text-muted">{d.routes.length}</span>
          </a>
        ))}
      </nav>

      {c.cities.map((d) => {
        const shared = sharedPlaces(d, d.routes).slice(0, 6);
        return (
          <section key={d.slug} id={d.slug} className="mt-12 scroll-mt-24">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold">
                {d.name}{" "}
                <span className="text-base font-normal text-muted">
                  {d.routes.length} {d.routes.length === 1 ? "route" : "routes"}
                </span>
              </h2>
              <Link
                href={`/destinations/${d.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {d.name} guide <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {[...d.routes].sort(byDayCost).map((r) => (
                <RouteCard key={r.slug} route={r} />
              ))}
            </div>
            {shared.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-muted">Where {d.name} routes agree</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {shared.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={placeHref(d.slug, p.slug)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm hover:border-accent"
                      >
                        {p.name}
                        <span className="text-xs text-muted">
                          {p.routes} of {d.routes.length}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
