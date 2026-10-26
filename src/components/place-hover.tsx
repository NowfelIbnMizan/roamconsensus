"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { CreatorHover } from "@/components/creator-hover";

/**
 * A place card's photo with a mini profile, like the creator cards: it floats beside the photo while a mouse rests
 * on it, and opens as a bottom sheet when the photo is tapped on a phone. A click with a mouse goes to the place page.
 */
export function PlaceHover({
  href,
  name,
  card,
  infoAt = "bottom-2 left-2",
  children,
}: {
  href: string;
  name: string;
  card: ReactNode;
  /** Where the phone-only "i" badge sits, so it clears the card's own text. */
  infoAt?: string;
  children: ReactNode;
}) {
  return (
    <CreatorHover className="flex w-full" label={name} card={card}>
      <Link
        href={href}
        aria-label={name}
        className="relative block w-full overflow-hidden rounded-2xl"
      >
        {children}
        <span
          aria-hidden
          className={`pointer-events-none absolute ${infoAt} flex size-6 items-center justify-center rounded-full bg-black/45 text-white [@media(hover:hover)]:hidden`}
        >
          <Info className="size-3.5" />
        </span>
      </Link>
    </CreatorHover>
  );
}
