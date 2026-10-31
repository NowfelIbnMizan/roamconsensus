"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

/**
 * A creator photo that swaps to `fallback` (their initial) if the link stops loading, e.g. an Instagram or TikTok
 * photo link, which expires after a few days.
 */
export function AvatarImage({ src, alt, sizes, fallback }: { src: string; alt: string; sizes: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (failed === src) return fallback;
  return (
    // Creators' own image hosts vary, so skip the optimizer rather than allow-list every one.
    <Image src={src} alt={alt} fill sizes={sizes} unoptimized className="object-cover" onError={() => setFailed(src)} />
  );
}
