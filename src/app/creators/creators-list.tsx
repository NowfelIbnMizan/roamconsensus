"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { CreatorAvatar } from "@/components/creator-avatar";
import { CreatorSocials } from "@/components/creator";
import { ReadMore } from "@/components/read-more";
import { Thumb } from "@/components/thumb";
import { tierLabel } from "@/lib/format";
import type { getCreators } from "@/lib/data";

type Creator = Awaited<ReturnType<typeof getCreators>>[number];

// Each card previews a few routes; the creator's page lists them all.
const PREVIEW = 3;

const pill = (on: boolean) =>
  `inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm transition ${
    on ? "bg-foreground font-medium text-background" : "border border-line bg-card hover:border-accent"
  }`;

/** "Budget · Mid-range · 2-7 days": how this creator travels, at a glance. */
function styleLine(c: Creator) {
  const tiers = (Object.keys(tierLabel) as (keyof typeof tierLabel)[]).filter((t) =>
    c.itineraries.some((it) => it.tier === t),
  );
  const days = c.itineraries.map((it) => it.days);
  const lo = Math.min(...days);
  const hi = Math.max(...days);
  const span = lo === hi ? `${lo} ${lo === 1 ? "day" : "days"}` : `${lo}-${hi} days`;
  return [...tiers.map((t) => tierLabel[t]), span];
}

/** Creator cards with a city filter on top: pick a city, keep only creators with a route there, that route first. */
export function CreatorsList({ creators }: { creators: Creator[] }) {
  const cities = [
    ...new Map(creators.flatMap((c) => c.itineraries.map((it) => [it.destination.slug, it.destination]))).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const [city, setCity] = useState<string | null>(null);
  const shown = city ? creators.filter((c) => c.itineraries.some((it) => it.destination.slug === city)) : creators;

  return (
    <>
      <div className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button type="button" className={pill(!city)} aria-pressed={!city} onClick={() => setCity(null)}>
          Any city
        </button>
        {cities.map((d) => (
          <button
            key={d.slug}
            type="button"
            className={pill(city === d.slug)}
            aria-pressed={city === d.slug}
            onClick={() => setCity(city === d.slug ? null : d.slug)}
          >
            {d.name}
          </button>
        ))}
      </div>
      {city && (
        <p className="mt-3 text-sm text-muted">
          {shown.length} {shown.length === 1 ? "creator has" : "creators have"} a{" "}
          {cities.find((d) => d.slug === city)?.name} route.
        </p>
      )}

      <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {shown.map((c) => {
          const destinations = [
            ...new Map(c.itineraries.map((it) => [it.destination.slug, it.destination])).values(),
          ];
          const routes = city
            ? [
                ...c.itineraries.filter((it) => it.destination.slug === city),
                ...c.itineraries.filter((it) => it.destination.slug !== city),
              ]
            : c.itineraries;
          return (
            <li key={c.handle} className="flex flex-col rounded-2xl border border-line bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3 sm:gap-4">
                <CreatorAvatar creator={c} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold">
                    <Link href={`/creators/${c.handle}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted">
                    {c.itineraries.length} {c.itineraries.length === 1 ? "route" : "routes"} ·{" "}
                    {destinations.length > 3
                      ? `${destinations.length} cities`
                      : destinations.map((d) => d.name).join(", ")}
                  </p>
                </div>
                {/* Beside the name, so a lone website icon doesn't take a row of its own. */}
                <CreatorSocials creator={c} className="ml-auto max-w-[45%] shrink-0 justify-end" />
              </div>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Travel style">
                {styleLine(c).map((s) => (
                  <li key={s} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent">
                    {s}
                  </li>
                ))}
              </ul>
              {c.bio && <ReadMore text={c.bio} className="mt-3" />}
              <ul className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
                {/* Phones show one route per card to keep the list short; the rest are on the creator's page. */}
                {routes.slice(0, PREVIEW).map((it, n) => (
                  <li key={it.slug} className={n > 0 ? "hidden sm:block" : undefined}>
                    <Link href={`/itineraries/${it.slug}`} className="group flex items-center gap-3">
                      <Thumb url={it.coverUrl} alt={it.title} category="EXPERIENCE" className="size-10 rounded-lg sm:size-12" />
                      <span className="min-w-0">
                        <span className="block font-medium group-hover:underline">{it.title}</span>
                        <span className="text-muted">
                          {it.destination.name} · {it.days} {it.days === 1 ? "day" : "days"} · {tierLabel[it.tier]}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href={`/creators/${c.handle}`}
                className="mt-3 inline-flex items-center gap-1 self-start text-sm font-medium text-accent hover:underline"
              >
                See creator page
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
