import Image from "next/image";
import { getPhoto, type PlaceholderCategory } from "@/lib/photos";

type Props = {
  photoKey: string;
  query: string;
  category: PlaceholderCategory;
  alt: string;
  sizes: string;
  className?: string;
  /** Show the photographer credit over the image. Small thumbnails pass false and use PhotoCredit instead. */
  credit?: boolean;
  priority?: boolean;
};

export async function Photo({ photoKey, query, category, alt, sizes, className = "", credit = true, priority }: Props) {
  const photo = await getPhoto({ key: photoKey, query, category });
  const isPlaceholder = photo.source === "PLACEHOLDER";
  return (
    <div className={`relative overflow-hidden bg-line ${className}`}>
      <Image
        src={photo.url}
        alt={isPlaceholder ? "" : alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={isPlaceholder}
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
export async function PhotoCredit({ photoKey, query, category }: Pick<Props, "photoKey" | "query" | "category">) {
  const photo = await getPhoto({ key: photoKey, query, category });
  if (!photo.attribution) return null;
  return (
    <a href={photo.creditUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
      {photo.attribution}
    </a>
  );
}
