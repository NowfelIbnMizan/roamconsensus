import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Globe,
  MapPin,
  Navigation,
} from "lucide-react";
import { AddItemButton, AddRouteButton } from "@/components/add-to-cart";
import { FavouriteButton } from "@/components/favourite-button";
import { CreatorChip } from "@/components/creator";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Thumb } from "@/components/thumb";
import { Price } from "@/components/money";
import { Photo } from "@/components/photo";
import { PhotoGallery } from "@/components/photo-gallery";
import { TripMap, type MapStop } from "@/components/trip-map";
import { getPlace, getPlaceParams } from "@/lib/data";
import { categoryLabel, sentimentLabel } from "@/lib/format";
import {
  categoryHex,
  distanceKm,
  driveMinutes,
  formatMinutes,
  googleMapsPlaceUrl,
  hasPin,
} from "@/lib/map";
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
    description:
      p.blurb ??
      `${p.name} in ${where}, as recommended by travel creators, with prices and tips.`,
  };
}

const schemaType = { STAY: "LodgingBusiness", FOOD: "Restaurant" } as Record<
  string,
  string
>;

export default async function PlacePage({ params }: Props) {
  const p = await load(params);
  if (!p) notFound();
  const d = p.destination;
  const near = `${p.area ? `${p.area}, ` : ""}${d.name}`;
  const googleUrl = googleMapsPlaceUrl(p.name, near);
  const recommended = p.mentions.filter((m) => m.sentiment !== "AVOID");
  const faces = [
    ...new Map(p.mentions.map((m) => [m.creator.handle, m.creator])).values(),
  ];
  const agree = new Set(recommended.map((m) => m.creator.handle)).size;
  const days = p.mentions.map((m) => m.day);
  const firstDay = Math.min(...days);
  const lastDay = Math.max(...days);

  const nearby = hasPin(p)
    ? p.others
        .map((o) => ({ ...o, km: distanceKm(p, o) }))
        .filter((o) => o.km < 25)
        .sort((a, b) => a.km - b.km)
        .slice(0, 6)
    : [];
  const stops: MapStop[] = hasPin(p)
    ? [
        {
          key: p.slug,
          lat: p.lat,
          lng: p.lng,
          label: "★",
          color: "#1c1917",
          title: p.name,
          href: googleUrl,
        },
        ...nearby.map((o, n) => ({
          key: o.slug,
          lat: o.lat,
          lng: o.lng,
          label: String(n + 1),
          color: categoryHex[o.category],
          title: o.name,
          subtitle: [o.area, categoryLabel[o.category]]
            .filter(Boolean)
            .join(" · "),
          href: googleMapsPlaceUrl(
            o.name,
            `${o.area ? `${o.area}, ` : ""}${d.name}`,
          ),
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
    address: {
      "@type": "PostalAddress",
      addressLocality: p.area ?? d.name,
      addressCountry: d.country,
    },
    geo: hasPin(p)
      ? { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={`/destinations/${d.slug}`}
        className="text-sm text-muted hover:text-foreground"
      >
        ← {d.name}
      </Link>

      {/* Wide screens: the place on the left, its map and nearby picks beside it. */}
      <div className="xl:grid xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-start xl:gap-10">
        <div>
          <div className="mt-3 flex gap-4 sm:gap-6">
            <PhotoGallery
              main={
                <Photo
                  photoKey={placePhotoKey(d.slug, p)}
                  query={placeQuery(p.name, d.name)}
                  category={p.category}
                  website={p.website}
                  alt={p.name}
                  sizes="(min-width: 640px) 240px, 112px"
                  className="h-full"
                  priority
                />
              }
              own={p.photos.slice(1)}
              alt={p.name}
              destination={d.slug}
              place={p.slug}
              className="size-28 shrink-0 rounded-2xl sm:size-60"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                {p.name}
              </h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted">
                {p.area && (
                  <>
                    <MapPin className="size-3.5" aria-hidden /> {p.area} ·
                  </>
                )}{" "}
                {categoryLabel[p.category]}
                {p.fromPrice && (
                  <>
                    {" · "}
                    <span className="font-medium text-foreground tabular-nums">
                      <Price
                        item={{
                          priceCents: p.fromPrice.cents,
                          quantity: 1,
                          currency: p.fromPrice.currency,
                        }}
                      />
                      {p.fromPrice.unit && `/${p.fromPrice.unit}`}
                    </span>
                  </>
                )}
              </p>
              {agree > 0 && (
                <p
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${
                    agree === p.creatorCount
                      ? "bg-accent-soft text-accent"
                      : "bg-line text-muted"
                  }`}
                >
                  {agree === p.creatorCount && (
                    <CheckCircle2 className="size-4" aria-hidden />
                  )}
                  {agree} of {p.creatorCount}{" "}
                  {p.creatorCount === 1 ? "creator" : "creators"}
                </p>
              )}
              {p.blurb && (
                <p className="mt-3 hidden max-w-2xl text-pretty sm:block">
                  {p.blurb}
                </p>
              )}
            </div>
          </div>
          {p.blurb && <p className="mt-4 text-pretty sm:hidden">{p.blurb}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            {p.cartItem && (
              <AddRouteButton
                items={[p.cartItem]}
                label="Add to trip"
                doneLabel="In your trip"
                removeLabel="Remove from trip"
              />
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
            <FavouriteButton
              destination={d.slug}
              place={p.slug}
              name={p.name}
              withLabel
            />
          </div>
          <PageGuide id="place" className="mt-4" />
        </div>
          {stops.length > 0 && (
            <section className="mt-8 xl:mt-3">
              <h2 className="text-xl font-semibold">
                {nearby.length > 0 ? "Build a day around it" : "On the map"}
              </h2>
              <p className="mt-1 text-sm text-pretty text-muted">
                {firstDay === lastDay
                  ? `Creators visit on day ${firstDay}.`
                  : `Creators visit between day ${firstDay} and ${lastDay}.`}
                {p.tip && ` Tip: ${p.tip}`}
              </p>
              <div
                className={`mt-3 grid grid-cols-1 gap-4 ${nearby.length > 0 ? "md:grid-cols-[minmax(0,1fr)_340px]" : ""}`}
              >
                <TripMap stops={stops} className="h-64 md:h-full md:min-h-96" />
                {nearby.length > 0 && (
                  <ol className="divide-y divide-line rounded-2xl border border-line bg-card">
                    {nearby.map((o, n) => (
                      <li key={o.slug} className="flex items-center gap-3 p-2.5">
                        <span className="relative shrink-0">
                          <Thumb
                            url={o.photoUrl}
                            category={o.category}
                            className="size-12 rounded-lg"
                          />
                          <span
                            className="absolute -top-1.5 -left-1.5 inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-card"
                            style={{ background: categoryHex[o.category] }}
                            title="Pin number on the map"
                          >
                            {n + 1}
                          </span>
                        </span>
                        <Link
                          href={placeHref(d.slug, o.slug)}
                          className="min-w-0 flex-1 text-sm hover:text-accent"
                        >
                          <span className="block truncate font-medium">
                            {o.name}
                          </span>
                          <span className="text-xs text-muted">
                            ~
                            {formatMinutes(
                              driveMinutes(p as { lat: number; lng: number }, o)
                                .minutes,
                            )}{" "}
                            drive · {categoryLabel[o.category]}
                          </span>
                        </Link>
                        {o.cartItem && o.skippedBy.length === 0 && (
                          <span className="mr-1.5 shrink-0">
                            <AddItemButton
                              item={{ ...o.cartItem, photoUrl: o.photoUrl }}
                            />
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          )}
      </div>

      <details
        open={stops.length === 0}
        className="group mt-8 rounded-2xl border border-line bg-card"
      >
        <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex -space-x-2" aria-hidden>
            {faces.map((c) => (
              <CreatorAvatar
                key={c.handle}
                creator={c}
                size="sm"
                className="ring-2 ring-card"
              />
            ))}
          </span>
          <span className="flex-1 font-medium">
            What{" "}
            {faces.length === 1
              ? "1 creator says"
              : `${faces.length} creators say`}
          </span>
          <ChevronDown
            className="size-4 text-muted transition group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="divide-y divide-line border-t border-line">
          {p.mentions.map((m) => (
            <li key={m.id} className="flex gap-3 p-4 text-sm">
              <CreatorAvatar creator={m.creator} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5">
                  <CreatorChip creator={m.creator} />
                  <Link
                    href={`/itineraries/${m.itinerary.slug}`}
                    className="text-muted underline hover:text-foreground"
                  >
                    Day {m.day} · {m.itinerary.title}
                  </Link>
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
                {m.note && (
                  <p className="mt-1.5 text-muted">&ldquo;{m.note}&rdquo;</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </details>
    </>
  );
}
