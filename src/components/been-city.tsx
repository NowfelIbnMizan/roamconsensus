"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { usePrefs } from "@/lib/prefs";

/** A city card on "Where to next?": cities the traveller has been to (My trips) move to the end, marked. */
export function BeenCity({ slug, children }: { slug: string; children: ReactNode }) {
  const been = usePrefs().been.includes(slug);
  return (
    <li className={`relative ${been ? "order-1 opacity-70" : ""}`}>
      {children}
      {been && (
        <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium shadow-sm">
          <Check className="size-3.5 text-accent" aria-hidden /> Been there
        </span>
      )}
    </li>
  );
}
