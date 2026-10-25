import Link from "next/link";
import { MapPin } from "lucide-react";
import { AgreePill } from "@/components/agree-pill";
import { AddItemButton } from "@/components/add-to-cart";
import { FavouriteButton } from "@/components/favourite-button";
import { Photo } from "@/components/photo";
import { Money } from "@/components/money";
import { getDestination } from "@/lib/data";
import { categoryLabel } from "@/lib/format";
import { placeHref, placePhotoKey, placeQuery } from "@/lib/place";

export async function bali() {
  const d = (await getDestination("bali"))!;
  return d;
}
type D = Awaited<ReturnType<typeof bali>>;
type P = D["consensus"][number];

export function Price({ p }: { p: P }) {
  if (!p.fromPrice) return null;
  return p.fromPrice.cents === 0 ? (
    "Free"
  ) : (
    <>
      from <Money cents={p.fromPrice.cents} currency={p.fromPrice.currency} />
    </>
  );
}

/** B: photo on top, details under it, two across on phones. */
export function GridCard({ d, p }: { d: D; p: P }) {
  return (
    <li className="group relative flex flex-col">
      <div className="relative">
        <Photo
          photoKey={placePhotoKey(d.slug, p)}
          query={placeQuery(p.name, d.name)}
          category={p.category}
          website={p.website}
          alt={p.name}
          sizes="(min-width: 768px) 300px, 50vw"
          credit={false}
          className="aspect-[4/3] w-full rounded-2xl"
        />
        <div className="absolute top-1.5 right-1.5 flex gap-1 rounded-full bg-card/90 px-1 backdrop-blur">
          <FavouriteButton destination={d.slug} place={p.slug} name={p.name} />
          {p.cartItem && p.skippedBy.length === 0 && (
            <AddItemButton item={p.cartItem} />
          )}
        </div>
      </div>
      <p className="mt-2 eyebrow">
        {p.area ?? categoryLabel[p.category]}
      </p>
      <Link
        href={placeHref(d.slug, p.slug)}
        className="mt-0.5 font-semibold leading-snug hover:text-accent"
      >
        {p.name}
      </Link>
      <p className="mt-0.5 text-sm text-muted tabular-nums">
        <Price p={p} />
      </p>
      <AgreePill
        className="mt-1.5"
        creators={p.creators}
        total={d.creatorCount}
        skippedBy={p.skippedBy}
      />
    </li>
  );
}

/** C: a tall card in a sideways row. */
export function SwipeCard({ d, p }: { d: D; p: P }) {
  return (
    <li className="relative w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-card sm:w-64">
      <Photo
        photoKey={placePhotoKey(d.slug, p)}
        query={placeQuery(p.name, d.name)}
        category={p.category}
        website={p.website}
        alt={p.name}
        sizes="256px"
        credit={false}
        className="aspect-[4/3] w-full"
      />
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={placeHref(d.slug, p.slug)}
            className="font-semibold leading-snug hover:text-accent"
          >
            {p.name}
          </Link>
          {p.cartItem && p.skippedBy.length === 0 && (
            <AddItemButton item={p.cartItem} />
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          {p.area && (
            <>
              <MapPin className="size-3" aria-hidden /> {p.area} ·
            </>
          )}{" "}
          <Price p={p} />
        </p>
        <AgreePill
          className="mt-2"
          creators={p.creators}
          total={d.creatorCount}
          skippedBy={p.skippedBy}
        />
      </div>
    </li>
  );
}
