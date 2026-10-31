import Image from "next/image";
import { Camera } from "lucide-react";
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
  /** Photographer credit over the image: a short line, or (false, for small tiles) a camera icon that shows it on hover. */
  credit?: boolean;
  priority?: boolean;
};

const badge =
  "absolute right-1.5 bottom-1.5 z-10 flex items-center gap-1 rounded-full bg-black/35 text-[10px] leading-none text-white/90 backdrop-blur-sm";

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
  const unoptimized =
    isPlaceholder || photo.source === "WEBSITE" || photo.source === "MANUAL";
  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      {isPlaceholder ? (
        // A drawn tile, not a photo: a background keeps it out of image search and alt-text checks.
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${photo.url})` }} aria-hidden />
      ) : (
        <Image
          src={photo.url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className="object-cover"
        />
      )}
      {photo.attribution &&
        // Small tiles usually sit inside a link, so their credit is a plain icon with the full credit as its tooltip.
        (credit ? (
          <a
            href={photo.creditUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            title={photo.attribution}
            className={`${badge} px-1.5 py-1 hover:bg-black/55 hover:text-white`}
          >
            <Camera className="size-2.5 shrink-0" aria-hidden />
            <span className="sr-only">{photo.attribution}</span>
            <span aria-hidden>{shortCredit(photo.attribution)}</span>
          </a>
        ) : (
          <span title={photo.attribution} className={`${badge} p-1`}>
            <Camera className="size-2.5" aria-hidden />
            <span className="sr-only">{photo.attribution}</span>
          </span>
        ))}
    </div>
  );
}

/** "Photo by Jane Doe on Unsplash" -> "Jane Doe · Unsplash"; venue photos keep just the site name. */
function shortCredit(attribution: string) {
  return attribution
    .replace(/^Photo (by|from) /, "")
    .replace(/ on (Unsplash|Pexels)$/, " · $1");
}
