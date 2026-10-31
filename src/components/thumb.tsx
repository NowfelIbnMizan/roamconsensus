import Image from "next/image";
import { BedDouble, Bus, Package, Smartphone, Ticket, Utensils, type LucideIcon } from "lucide-react";
import type { ItemCategory } from "@/generated/prisma/enums";

export const categoryIcon: Record<ItemCategory, LucideIcon> = {
  STAY: BedDouble,
  EXPERIENCE: Ticket,
  FOOD: Utensils,
  TRANSIT: Bus,
  ESIM: Smartphone,
  GEAR: Package,
};

// Hosts the image optimizer may fetch from (next.config.ts); venue sites can be anywhere, so they load as-is.
export const optimized = (url: string) => /^https:\/\/images\.(unsplash|pexels)\.com\//.test(url);

/**
 * A stop's photo for lists (itinerary, cart, trip mode). Without one, a quiet tile with the category's icon, so a
 * list still reads at a glance. Works in server and client components.
 */
export function Thumb({
  url,
  category,
  sizes = "96px",
  className = "size-20 rounded-xl",
  priority,
  alt,
}: {
  url?: string | null;
  category: ItemCategory;
  sizes?: string;
  className?: string;
  priority?: boolean;
  /** What the photo shows (the stop or route name), for search engines and screen readers. */
  alt: string;
}) {
  const Icon = categoryIcon[category];
  return (
    <div
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={url ? undefined : { background: "#a8957a29", color: "#a8957a" }}
    >
      {url ? (
        <Image
          src={url}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={!optimized(url)}
          className="object-cover"
        />
      ) : (
        <Icon className="absolute inset-0 m-auto size-1/3" strokeWidth={1.25} aria-hidden />
      )}
    </div>
  );
}
