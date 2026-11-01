"use client";

import Image from "next/image";
import { useState } from "react";

type Face = { handle: string; name: string; avatarUrl: string };

/**
 * The home page's row of creator photos. A photo whose link stops loading (Instagram and TikTok links expire) drops out
 * instead of turning into a letter, and the row hides when fewer than three photos are left.
 */
export function CreatorFaces({ faces, max = 6 }: { faces: Face[]; max?: number }) {
  const [broken, setBroken] = useState<string[]>([]);
  const shown = faces.filter((f) => !broken.includes(f.handle)).slice(0, max);
  if (shown.length < 3) return null;
  return (
    <span className="flex -space-x-2" aria-hidden>
      {shown.map((f) => (
        <span key={f.handle} className="relative block size-9 shrink-0 overflow-hidden rounded-full bg-line ring-2 ring-background">
          <Image
            src={f.avatarUrl}
            alt=""
            fill
            sizes="64px"
            unoptimized
            className="object-cover"
            onError={() => setBroken((b) => [...b, f.handle])}
          />
        </span>
      ))}
    </span>
  );
}
