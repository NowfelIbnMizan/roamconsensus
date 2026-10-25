import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CreatorSocials } from "@/components/creator";
import { CreatorAvatar } from "@/components/creator-avatar";
import { getCreator } from "@/lib/data";

/** Lab: the creator with the most trips, so every mockup has a long list to tame. */
export async function load() {
  const c = (await getCreator("thebrokebackpacker"))!;
  const trips = c.itineraries;
  const cities = new Set(trips.map((t) => t.destination.slug)).size;
  const days = trips.reduce((n, t) => n + t.days, 0);
  return { c, trips, cities, days };
}
export type Lab = Awaited<ReturnType<typeof load>>;
export type Trip = Lab["trips"][number];

/** Compact header: face, name, one facts line, bio, socials. */
export function Header({ lab }: { lab: Lab }) {
  const { c, trips, cities, days } = lab;
  return (
    <>
      <Link href="/creators" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> All creators
      </Link>
      <div className="mt-3 flex items-center gap-4">
        <CreatorAvatar creator={c} size="lg" />
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.name}</h1>
          <p className="text-sm text-muted">
            {trips.length} trips · {cities} cities · {days} days of plans
          </p>
        </div>
      </div>
      {c.bio && <p className="mt-3 max-w-2xl text-pretty">{c.bio}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CreatorSocials creator={c} />
      </div>
    </>
  );
}

export function cover(t: Trip) {
  return t.photos[0] ?? t.coverUrl ?? null;
}
