import Image from "next/image";
import { getPhoto, type PlaceholderCategory } from "@/lib/photos";

type Props = {
  photoKey: string;
  query: string;
  category: PlaceholderCategory;
  /** Venue's own site, tried before stock photos. */
  website?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  /** Show the photographer credit over the image. Small thumbnails pass false and use PhotoCredit instead. */
  credit?: boolean;
  priority?: boolean;
};

export async function Photo({
  photoKey,
  query,
  category,
  website,
  alt,
  sizes,
  className = "",
  credit = true,
  priority,
}: Props) {
  const photo = await getPhoto({ key: photoKey, query, category, website });
  const isPlaceholder = photo.source === "PLACEHOLDER";
  // Venue images can be on any host, so they skip the optimizer rather than opening it to every domain.
  const unoptimized = isPlaceholder || photo.source === "WEBSITE";
  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      <Image
        src={photo.url}
        alt={isPlaceholder ? "" : alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className="object-cover"
      />
      {credit && photo.attribution && (
        <a
          href={photo.creditUrl ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-0 bottom-0 rounded-tl-md bg-black/50 px-1.5 py-0.5 text-[10px] text-white/90 hover:text-white"
        >
          {photo.attribution}
        </a>
      )}
    </div>
  );
}

/** Credit line for photos shown too small to carry one. */
export async function PhotoCredit({
  photoKey,
  query,
  category,
  website,
}: Pick<Props, "photoKey" | "query" | "category" | "website">) {
  const photo = await getPhoto({ key: photoKey, query, category, website });
  if (!photo.attribution) return null;
  return (
    <a href={photo.creditUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
      {photo.attribution}
    </a>
  );
}
