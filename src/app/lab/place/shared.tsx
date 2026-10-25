import Link from "next/link";
import { Globe, Navigation } from "lucide-react";
import { AddRouteButton } from "@/components/add-to-cart";
import { FavouriteButton } from "@/components/favourite-button";
import { CreatorAvatar } from "@/components/creator-avatar";
import { Photo } from "@/components/photo";
import { Price } from "@/components/money";
import { getPlace } from "@/lib/data";
import { categoryHex, distanceKm, driveMinutes, formatMinutes, googleMapsPlaceUrl, hasPin } from "@/lib/map";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import { categoryLabel } from "@/lib/format";
import type { MapStop } from "@/components/trip-map";

/** Lab: the most-mentioned place on the site, so every mockup has real quotes to show. */
export async function load() {
  const p = (await getPlace("bali", "tegalalang-rice-terraces"))!;
  const d = p.destination;
  const googleUrl = googleMapsPlaceUrl(p.name, `${p.area ? `${p.area}, ` : ""}${d.name}`);
  const recommended = p.mentions.filter((m) => m.sentiment !== "AVOID");
  const creators = [...new Map(recommended.map((m) => [m.creator.handle, m.creator])).values()];
  const quotes = p.mentions.filter((m) => m.note);
  const days = p.mentions.map((m) => m.day);
  const nearby = hasPin(p)
    ? p.others
        .map((o) => ({
          ...o,
          km: distanceKm(p, o),
          drive: formatMinutes(driveMinutes(p as { lat: number; lng: number }, o).minutes),
        }))
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
          subtitle: categoryLabel[o.category],
          href: googleMapsPlaceUrl(o.name, d.name),
          page: placeHref(d.slug, o.slug),
        })),
      ]
    : [];
  return { p, d, googleUrl, creators, quotes, days, nearby, stops };
}
export type Lab = Awaited<ReturnType<typeof load>>;

export function Hero({ lab, className = "" }: { lab: Lab; className?: string }) {
  const { p, d } = lab;
  return (
    <Photo
      photoKey={placePhotoKey(d.slug, p)}
      query={placeQuery(p.name, d.name)}
      category={p.category}
      website={p.website}
      alt={p.name}
      sizes="(min-width: 768px) 900px, 100vw"
      className={className}
      priority
    />
  );
}

export function FromPrice({ lab }: { lab: Lab }) {
  const f = lab.p.fromPrice;
  if (!f) return <>Free</>;
  return (
    <>
      <Price item={{ priceCents: f.cents, quantity: 1, currency: f.currency }} />
      {f.unit && <span className="text-sm font-normal text-muted">/{f.unit}</span>}
    </>
  );
}

export function Actions({ lab, compact = false }: { lab: Lab; compact?: boolean }) {
  const { p, d, googleUrl } = lab;
  const ghost =
    "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-4 py-2 text-sm hover:border-accent";
  return (
    <>
      {p.cartItem && (
        <AddRouteButton items={[p.cartItem]} label="Add to trip" doneLabel="In your trip" removeLabel="Remove" />
      )}
      <a href={googleUrl} target="_blank" rel="noopener noreferrer" className={ghost}>
        <Navigation className="size-4" aria-hidden /> {compact ? "Maps" : "Google Maps"}
      </a>
      {!compact && p.website && (
        <a href={p.website} target="_blank" rel="noopener noreferrer" className={ghost}>
          <Globe className="size-4" aria-hidden /> Website
        </a>
      )}
      <FavouriteButton destination={d.slug} place={p.slug} name={p.name} withLabel={!compact} />
    </>
  );
}

export function Faces({ lab }: { lab: Lab }) {
  return (
    <span className="flex -space-x-2" aria-hidden>
      {lab.creators.map((c) => (
        <CreatorAvatar key={c.handle} creator={c} size="sm" className="ring-2 ring-background" />
      ))}
    </span>
  );
}

export function Back({ lab }: { lab: Lab }) {
  return (
    <Link href={`/destinations/${lab.d.slug}`} className="text-sm text-muted hover:text-foreground">
      ← {lab.d.name}
    </Link>
  );
}
