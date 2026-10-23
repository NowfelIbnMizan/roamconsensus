import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { Money } from "@/components/money";
import { Photo } from "@/components/photo";
import { UpdatedOn } from "@/components/updated-on";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";
import type { ItemCategory } from "@/generated/prisma/enums";

type Props = PageProps<"/destinations/[slug]/best">;
type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;

// Ranked lists people search for, each with how many entries to show.
const SECTIONS: { category: ItemCategory; heading: (name: string) => string; limit: number }[] = [
  { category: "EXPERIENCE", heading: (n) => `Best things to do in ${n}`, limit: 15 },
  { category: "FOOD", heading: (n) => `Where to eat in ${n}`, limit: 10 },
  { category: "STAY", heading: (n) => `Where to stay in ${n}`, limit: 8 },
];

/** Recommended (never "skip it") places of one category, most creators first. */
function ranked(d: Destination, category: ItemCategory, limit: number) {
  return d.consensus.filter((p) => p.category === category && p.creators.length > 0).slice(0, limit);
}

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  if (!d) return {};
  const count = ranked(d, "EXPERIENCE", 15).length;
  const who = d.creatorCount > 1 ? `${d.creatorCount} travel creators` : "a travel creator";
  return {
    title: `${count} best things to do in ${d.name}, according to ${who}`,
    description: `The spots ${who} recommend most in ${d.name}: things to do, where to eat and where to stay, with prices and who recommends each one.`,
    alternates: { canonical: `/destinations/${d.slug}/best` },
  };
}

export default async function BestPage({ params }: Props) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  const who = d.creatorCount > 1 ? `${d.creatorCount} travel creators` : "a travel creator";
  const sections = SECTIONS.map((s) => ({ ...s, places: ranked(d, s.category, s.limit) })).filter(
    (s) => s.places.length,
  );

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        The best of {d.name}, according to {who}
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        We read {d.routes.length} {d.name} itineraries and counted which places come up again and again. Higher on the
        list means more creators recommend it.
      </p>
      <nav className="mt-4 flex flex-wrap gap-2 text-sm" aria-label="Sections">
        {sections.map((s) => (
          <a
            key={s.category}
            href={`#${s.category.toLowerCase()}`}
            className="rounded-full border border-line px-3 py-1 hover:border-accent"
          >
            {s.heading(d.name)}
          </a>
        ))}
      </nav>

      {sections.map((s) => (
        <section key={s.category} id={s.category.toLowerCase()} className="mt-10 scroll-mt-6">
          <h3 className="text-xl font-semibold">{s.heading(d.name)}</h3>
          <ol className="mt-4 space-y-4">
            {s.places.map((p, i) => (
              <li key={p.slug} className="cv-row flex gap-3 rounded-2xl border border-line bg-card p-4 sm:gap-4">
                <Photo
                  photoKey={placePhotoKey(d.slug, p)}
                  query={placeQuery(p.name, d.name)}
                  category={p.category}
                  website={p.website}
                  alt={p.name}
                  sizes="192px"
                  credit={false}
                  className="size-20 shrink-0 rounded-xl sm:size-28"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold leading-snug">
                    <span className="mr-1.5 text-accent">{i + 1}.</span>
                    <Link href={placeHref(d.slug, p.slug)} className="hover:text-accent hover:underline">
                      {p.name}
                    </Link>
                  </h4>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    {p.area && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="size-3" aria-hidden /> {p.area}
                      </span>
                    )}
                    {d.creatorCount > 1 && (
                      <span>
                        {p.creators.length} of {d.creatorCount} creators recommend
                      </span>
                    )}
                    {p.fromPrice && (
                      <span>
                        {p.fromPrice.cents === 0 ? (
                          "Free"
                        ) : (
                          <>
                            from <Money cents={p.fromPrice.cents} currency={p.fromPrice.currency} />
                            {p.fromPrice.unit && `/${p.fromPrice.unit}`}
                          </>
                        )}
                      </span>
                    )}
                  </p>
                  {p.blurb && <p className="mt-1.5 text-sm">{p.blurb}</p>}
                  {p.tip && <p className="mt-1 text-sm text-muted">Tip: {p.tip}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.creators.map((c) => (
                      <CreatorChip key={c.handle} creator={c} />
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <div className="mt-12 rounded-2xl border border-line bg-card p-5">
        <p className="font-medium">Want it as a day-by-day plan?</p>
        <p className="mt-1 text-sm text-muted">
          Compare the full {d.name} itineraries and add stops to your trip cart.
        </p>
        <Link
          href={`/destinations/${d.slug}`}
          className="mt-3 inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          See {d.name} itineraries
        </Link>
      </div>
      <UpdatedOn date={d.updatedAt} />
    </>
  );
}
