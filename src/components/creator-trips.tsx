"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Thumb } from "@/components/thumb";
import { tierLabel } from "@/lib/format";
import type { getCreator } from "@/lib/data";

type Trip = NonNullable<Awaited<ReturnType<typeof getCreator>>>["itineraries"][number];

/** A creator's trips as big photo cards: all of them first, or one city's via the pills. */
export function CreatorTrips({ trips }: { trips: Trip[] }) {
  const cities = [...new Map(trips.map((t) => [t.destination.slug, t.destination.name])).entries()];
  const [city, setCity] = useState("all");
  const shown = city === "all" ? trips : trips.filter((t) => t.destination.slug === city);
  return (
    <>
      {cities.length > 1 && (
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {[["all", `All ${trips.length}`], ...cities].map(([slug, name]) => (
            <button
              key={slug}
              type="button"
              onClick={() => setCity(slug)}
              aria-pressed={city === slug}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
                city === slug ? "bg-foreground text-background" : "border border-line bg-card hover:border-accent"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((t) => {
          const pics = (t.photos.length ? t.photos : t.coverUrl ? [t.coverUrl] : []).slice(0, 3);
          return (
            <li key={t.slug}>
              <Link
                href={`/itineraries/${t.slug}`}
                className="block overflow-hidden rounded-2xl border border-line bg-card hover:border-accent"
              >
                <div className="grid h-44 grid-cols-3 gap-0.5 sm:h-56">
                  {pics.length ? (
                    pics.map((url, n) => (
                      <Thumb
                        key={url}
                        url={url}
                        alt={t.title}
                        category="EXPERIENCE"
                        className={`h-full ${pics.length === 1 ? "col-span-3" : n === 0 ? "col-span-2 row-span-2" : ""}`}
                      />
                    ))
                  ) : (
                    <Thumb category="EXPERIENCE" className="col-span-3 h-full" />
                  )}
                </div>
                <div className="flex items-end justify-between gap-3 p-4">
                  <div>
                    <p className="text-lg font-semibold leading-snug">{t.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      {t.days} {t.days === 1 ? "day" : "days"} · {tierLabel[t.tier]} · {t.stops} stops
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                    Open plan <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
