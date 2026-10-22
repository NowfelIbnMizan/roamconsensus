import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronRight, Globe, MapPin, Navigation } from "lucide-react";
import { AddRouteButton } from "@/components/add-to-cart";
import { CreatorChip } from "@/components/creator";
import { Price } from "@/components/money";
import { Photo, PhotoCredit } from "@/components/photo";
import { TripMap, type MapStop } from "@/components/trip-map";
import { getPlace, getPlaceParams } from "@/lib/data";
import { categoryLabel, sentimentLabel } from "@/lib/format";
import { categoryHex, distanceKm, driveMinutes, formatMinutes, googleMapsPlaceUrl, hasPin } from "@/lib/map";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";

type Props = PageProps<"/destinations/[slug]/places/[place]">;

export async function generateStaticParams() {
  return getPlaceParams();
}

async function load(params: Props["params"]) {
  const { slug, place } = await params;
  return getPlace(slug, place);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await load(params);
  if (!p) return {};
  const where = [p.area, p.destination.name].filter(Boolean).join(", ");
  return {
    title: `${p.name}, ${where}: what travel creators say`,
    description: p.blurb ?? `${p.name} in ${where}, as recommended by travel creators, with prices and tips.`,
  };
}

const schemaType = { STAY: "LodgingBusiness", FOOD: "Restaurant" } as Record<string, string>;

export default async function PlacePage({ params }: Props) {
  const p = await load(params);
  if (!p) notFound();
  const d = p.destination;
  const near = `${p.area ? `${p.area}, ` : ""}${d.name}`;
  const googleUrl = googleMapsPlaceUrl(p.name, near);
  const recommended = p.mentions.filter((m) => m.sentiment !== "AVOID");
  const agree = new Set(recommended.map((m) => m.creator.handle)).size;

  const nearby = hasPin(p)
    ? p.others
        .map((o) => ({ ...o, km: distanceKm(p, o) }))
        .filter((o) => o.km < 25)
        .sort((a, b) => a.km - b.km)
        .slice(0, 6)
    : [];
  const stops: MapStop[] = hasPin(p)
    ? [
        { key: p.slug, lat: p.lat, lng: p.lng, label: "★", color: "#1c1917", title: p.name, href: googleUrl },
        ...nearby.map((o, n) => ({
          key: o.slug,
          lat: o.lat,
          lng: o.lng,
          label: String(n + 1),
          color: categoryHex[o.category],
          title: o.name,
          subtitle: [o.area, categoryLabel[o.category]].filter(Boolean).join(" · "),
          href: googleMapsPlaceUrl(o.name, `${o.area ? `${o.area}, ` : ""}${d.name}`),
          page: placeHref(d.slug, o.slug),
        })),
      ]
    : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType[p.category] ?? "TouristAttraction",
    name: p.name,
    description: p.blurb ?? undefined,
    url: p.website ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: p.area ?? d.name, addressCountry: d.country },
    geo: hasPin(p) ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href={`/destinations/${d.slug}`} className="text-sm text-muted hover:text-foreground">
        ← {d.name}
      </Link>

      <div className="mt-4 grid gap-6 md:grid-cols-[1fr_340px]">
        <div>
          <Photo
            photoKey={placePhotoKey(d.slug, p)}
            query={placeQuery(p.name, d.name)}
            category={p.category}
            website={p.website}
            alt={p.name}
            sizes="(min-width: 768px) 640px, 100vw"
            className="aspect-[16/10] rounded-2xl"
            priority
          />
        </div>
        <div>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
            {p.area && (
              <>
                <MapPin className="size-3.5" aria-hidden /> {p.area} ·
              </>
            )}{" "}
            {categoryLabel[p.category]}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.name}</h1>
          {p.creatorCount > 1 && agree > 0 && (
            <p
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${
                agree === p.creatorCount ? "bg-accent-soft text-accent" : "bg-line text-muted"
              }`}
            >
              {agree === p.creatorCount && <CheckCircle2 className="size-4" aria-hidden />}
              {agree} of {p.creatorCount} creators recommend it
            </p>
          )}
          {p.blurb && <p className="mt-3">{p.blurb}</p>}
          {p.tip && <p className="mt-2 text-sm text-muted">Tip: {p.tip}</p>}
          {p.fromPrice && (
            <p className="mt-3 text-lg font-semibold tabular-nums">
              <Price item={{ priceCents: p.fromPrice.cents, quantity: 1, currency: p.fromPrice.currency }} />
              {p.fromPrice.unit && <span className="text-sm font-normal text-muted">/{p.fromPrice.unit}</span>}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {p.cartItem && p.skippedBy.length === 0 && (
              <AddRouteButton items={[p.cartItem]} label="Add to trip cart" doneLabel="In your trip cart" removeLabel="Remove from cart" />
            )}
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent"
            >
              <Navigation className="size-4" aria-hidden /> Google Maps
            </a>
            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm hover:border-accent"
              >
                <Globe className="size-4" aria-hidden /> Website
              </a>
            )}
          </div>
          <p className="mt-2 text-[10px] text-muted">
            <PhotoCredit
              photoKey={placePhotoKey(d.slug, p)}
              query={placeQuery(p.name, d.name)}
              category={p.category}
              website={p.website}
            />
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">What creators say</h2>
        <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
          {p.mentions.map((m) => (
            <li key={m.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex flex-wrap items-center gap-1.5 text-sm">
                  <CreatorChip creator={m.creator} />
                  <span className="text-muted">
                    Day {m.day} of{" "}
                    <Link href={`/itineraries/${m.itinerary.slug}`} className="underline hover:text-foreground">
                      {m.itinerary.title}
                    </Link>
                  </span>
                  {m.sentiment && m.sentiment !== "RECOMMENDED" && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.sentiment === "AVOID"
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                          : "bg-accent-soft text-accent"
                      }`}
                    >
                      {sentimentLabel[m.sentiment]}
                    </span>
                  )}
                </p>
                <span className="text-sm tabular-nums text-muted">
                  <Price item={m} />
                </span>
              </div>
              {m.name !== p.name && <p className="mt-2 font-medium">{m.name}</p>}
              {m.note && <p className="mt-1 text-sm text-muted">&ldquo;{m.note}&rdquo;</p>}
            </li>
          ))}
        </ul>
      </section>

      {stops.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">On the map{nearby.length > 0 && " and nearby"}</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_300px]">
            <TripMap stops={stops} className="h-72" />
            {nearby.length > 0 && (
              <ol className="space-y-2">
                {nearby.map((o, n) => (
                  <li key={o.slug}>
                    <Link
                      href={placeHref(d.slug, o.slug)}
                      className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 text-sm hover:border-accent"
                    >
                      <span
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ background: categoryHex[o.category] }}
                      >
                        {n + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{o.name}</span>
                        <span className="text-xs text-muted">
                          ~{formatMinutes(driveMinutes(p as { lat: number; lng: number }, o).minutes)} drive ·{" "}
                          {categoryLabel[o.category]}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}
    </>
  );
}
