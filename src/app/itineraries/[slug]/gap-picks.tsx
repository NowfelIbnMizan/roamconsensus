import Link from "next/link";
import { AddItemButton } from "@/components/add-to-cart";
import { Thumb } from "@/components/thumb";
import type { Gap } from "@/lib/gaps";
import { placeHref } from "@/lib/place";

const missing: Record<Gap["category"], string> = {
  STAY: "No hotel in this route",
  FOOD: "No food stop this day",
  EXPERIENCE: "No sights this day",
};

/** Other creators' picks near a day's stops, for what the route leaves out. Never mixed into the creator's own list. */
export function GapPicks({
  gaps,
  day,
  creator,
  city,
  photos,
}: {
  gaps: Gap[];
  day: number;
  creator: string;
  city: string;
  photos: Map<string, string | null>;
}) {
  return (
    <div className="border-t border-dashed border-line bg-background/60 px-4 py-3">
      <p className="eyebrow">Fill the gap</p>
      <p className="fine-print mt-0.5">Not in {creator}&apos;s route. Picked by other creators on Creatour.</p>
      {gaps.map((g) => (
        <div key={g.category} className="mt-3">
          <p className="text-sm font-medium">{missing[g.category]}</p>
          <ul className="mt-1 space-y-1">
            {g.picks.map(({ place, others, km }) => (
              <li key={place.slug} className="flex items-center gap-3 py-1">
                <Thumb
                  url={photos.get(place.slug) ?? null}
                  alt={place.name}
                  category={place.category}
                  className="size-10 shrink-0 rounded-lg"
                />
                <span className="min-w-0 flex-1">
                  <Link
                    href={placeHref(city, place.slug)}
                    className="block truncate text-sm font-medium hover:text-accent hover:underline"
                  >
                    {place.name}
                  </Link>
                  <span className="block truncate text-xs text-muted">
                    {others} other {others === 1 ? "creator" : "creators"}
                    {km !== null && ` · ${km < 1 ? "under 1" : Math.round(km)} km away`}
                  </span>
                </span>
                <span className="shrink-0">
                  {place.cartItem && <AddItemButton item={{ ...place.cartItem, day }} />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
