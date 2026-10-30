import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { AddItemButton } from "@/components/add-to-cart";
import { AgreePill } from "@/components/agree-pill";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
import { UpdatedOn } from "@/components/updated-on";
import { siteUrl } from "@/lib/email";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";

type Props = PageProps<"/destinations/[slug]/best">;
type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Place = Destination["consensus"][number];

// Ranked lists people search for, each with how many entries to show.
const SECTIONS: {
  category: ItemCategory;
  short: string;
  heading: (name: string) => string;
  limit: number;
}[] = [
  {
    category: "EXPERIENCE",
    short: "Things to do",
    heading: (n) => `Best things to do in ${n}`,
    limit: 15,
  },
  {
    category: "FOOD",
    short: "Eat",
    heading: (n) => `Where to eat in ${n}`,
    limit: 10,
  },
  {
    category: "STAY",
    short: "Stay",
    heading: (n) => `Where to stay in ${n}`,
    limit: 8,
  },
];

/** Recommended (never "skip it") places of one category, most creators first. */
function ranked(d: Destination, category: ItemCategory, limit: number) {
  return d.consensus
    .filter((p) => p.category === category && p.creators.length > 0)
    .slice(0, limit);
}

function PlacePhoto({
  d,
  p,
  sizes,
  className,
}: {
  d: Destination;
  p: Place;
  sizes: string;
  className: string;
}) {
  return (
    <Photo
      photoKey={placePhotoKey(d.slug, p)}
      query={placeQuery(p.name, d.name)}
      category={p.category}
      website={p.website}
      alt={p.name}
      sizes={sizes}
      credit={false}
      className={className}
    />
  );
}

/** Rank, name and the add-to-trip button, shared by the big and small cards. */
function PickTitle({ d, p, n }: { d: Destination; p: Place; n: number }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <h4 className="font-semibold leading-snug">
        <span className="mr-1.5 text-accent">{n}.</span>
        <Link
          href={placeHref(d.slug, p.slug)}
          className="hover:text-accent hover:underline"
        >
          {p.name}
        </Link>
      </h4>
      {p.cartItem && <AddItemButton item={p.cartItem} />}
    </div>
  );
}

function PickMeta({ p }: { p: Place }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
      {p.area && (
        <span className="inline-flex items-center gap-0.5">
          <MapPin className="size-3" aria-hidden /> {p.area}
        </span>
      )}
      {p.fromPrice && (
        <span>
          {p.fromPrice.cents === 0 ? (
            "Free"
          ) : (
            <>
              from{" "}
              <Money
                cents={p.fromPrice.cents}
                currency={p.fromPrice.currency}
              />
              {p.fromPrice.unit && `/${p.fromPrice.unit}`}
            </>
          )}
        </span>
      )}
    </p>
  );
}

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return {};
  const count = ranked(d, "EXPERIENCE", 15).length;
  const who =
    d.creatorCount > 1
      ? `${d.creatorCount} travel creators`
      : "a travel creator";
  return {
    title: `${count} best things to do in ${d.name} (${d.creatorCount > 1 ? `${d.creatorCount} creators` : "creator"} pick)`,
    description: `The spots ${who} recommend most in ${d.name}: things to do, where to eat and where to stay, with prices and who recommends each one.`,
    alternates: { canonical: `/destinations/${d.slug}/best` },
  };
}

export default async function BestPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const who =
    d.creatorCount > 1
      ? `${d.creatorCount} travel creators`
      : "a travel creator";
  const sections = SECTIONS.map((s) => ({
    ...s,
    places: ranked(d, s.category, s.limit),
  })).filter((s) => s.places.length);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best things to do in ${d.name}`,
    itemListElement: ranked(d, "EXPERIENCE", 15).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: placeHref(d.slug, p.slug),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The best of {d.name}, according to {who}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Ranked by how many of {d.routes.length} {d.name} routes
            recommend each place.
          </p>
        </div>
        <a
          href={`https://www.pinterest.com/pin/create/button/?${new URLSearchParams(
            {
              url: `${siteUrl()}/destinations/${d.slug}/best`,
              media: `${siteUrl()}/destinations/${d.slug}/pin`,
              description: `The best things to do in ${d.name}, according to ${who}`,
            },
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#e60023] px-4 py-1.5 text-sm font-medium text-white"
        >
          Save to Pinterest
        </a>
      </div>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Sections">
        {sections.map((s) => (
          <a
            key={s.category}
            href={`#${s.category.toLowerCase()}`}
            className="rounded-full border border-line bg-card px-3 py-1 hover:border-accent"
          >
            {s.short} · {s.places.length}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section
          key={s.category}
          id={s.category.toLowerCase()}
          className="mt-10 scroll-mt-6"
        >
          <h3 className="text-xl font-semibold">{s.heading(d.name)}</h3>
          {/* The top three get big photo cards on wider screens, photo rows on phones; the rest stay short. */}
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {s.places.slice(0, 3).map((p, i) => (
              <li
                key={p.slug}
                className="flex gap-3 overflow-hidden rounded-2xl border border-line bg-card p-3 md:block md:p-0"
              >
                <PlacePhoto
                  d={d}
                  p={p}
                  sizes="(min-width: 768px) 420px, 192px"
                  className="size-24 shrink-0 rounded-xl md:aspect-[4/3] md:size-auto md:w-full md:rounded-none"
                />
                <div className="min-w-0 flex-1 space-y-1.5 md:p-4">
                  <PickTitle d={d} p={p} n={i + 1} />
                  <PickMeta p={p} />
                  {p.blurb && <p className="line-clamp-2 text-sm md:line-clamp-3">{p.blurb}</p>}
                  <AgreePill creators={p.creators} total={d.creatorCount} />
                </div>
              </li>
            ))}
          </ol>
          {s.places.length > 3 && (
            <ol
              start={4}
              className="mt-3 grid gap-x-6 gap-y-1 rounded-2xl border border-line bg-card p-2 md:grid-cols-2"
            >
              {s.places.slice(3).map((p, i) => (
                <li
                  key={p.slug}
                  className="cv-row flex min-w-0 items-center gap-3 rounded-xl p-2"
                >
                  <PlacePhoto
                    d={d}
                    p={p}
                    sizes="112px"
                    className="size-14 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <PickTitle d={d} p={p} n={i + 4} />
                    <PickMeta p={p} />
                    <AgreePill creators={p.creators} total={d.creatorCount} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      <div className="mt-12 rounded-2xl border border-line bg-card p-5">
        <p className="font-medium">Want it as a day-by-day plan?</p>
        <p className="mt-1 text-sm text-muted">
          Compare the full {d.name} routes and add stops to your trip.
        </p>
        <Link
          href={`/destinations/${d.slug}`}
          className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          See {d.name} routes
        </Link>
      </div>
      <UpdatedOn date={d.updatedAt} />
    </>
  );
}
