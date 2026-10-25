import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { getDestinations, getSiteStats } from "@/lib/data";
import { CITY_XY, LAND } from "../asia-map";

// Where each label sits, so the Japan and Malaysia clusters don't overlap.
const SIDE: Record<string, "l" | "r" | "t" | "b"> = {
  tokyo: "r",
  kyoto: "t",
  osaka: "b",
  seoul: "l",
  "kuala-lumpur": "l",
  singapore: "r",
  phuket: "l",
  bangkok: "r",
  "chiang-mai": "t",
  hanoi: "r",
  bali: "r",
};

export default async function MapFirst() {
  const [destinations, stats] = await Promise.all([
    getDestinations(),
    getSiteStats(),
  ]);
  const routes = destinations.reduce((n, d) => n + d._count.itineraries, 0);
  return (
    <section className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr] md:gap-10 md:py-6">
      <div>
        <p className="eyebrow">
          {destinations.length} cities · {routes} routes ·{" "}
          {stats.creators.length} creators
        </p>
        <h1 className="mt-2 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">
          Where are you going?
        </h1>
        <p className="mt-3 max-w-md text-muted">
          Tap a city or search. You get the routes travel creators agree on, day
          by day.
        </p>
        <HomeSearch
          cities={destinations.map(({ slug, name, country }) => ({
            slug,
            name,
            country,
          }))}
        />
      </div>
      <div className="overflow-hidden rounded-3xl border border-line bg-card">
        <svg
          viewBox="10 90 890 800"
          className="block h-auto w-full"
          role="img"
          aria-label="Map of the cities on Creatour"
        >
          <path
            d={LAND}
            fill="var(--line)"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
          {destinations.map((d) => {
            const xy = CITY_XY[d.slug];
            if (!xy) return null;
            const [x, y] = xy;
            const side = SIDE[d.slug] ?? "r";
            const r = 15 + Math.min(d._count.itineraries, 8);
            const tx = side === "l" ? x - r - 8 : side === "r" ? x + r + 8 : x;
            const ty =
              side === "t" ? y - r - 12 : side === "b" ? y + r + 30 : y + 8;
            const anchor =
              side === "l" ? "end" : side === "r" ? "start" : "middle";
            return (
              <Link
                key={d.slug}
                href={`/destinations/${d.slug}`}
                className="group"
              >
                <circle
                  cx={x}
                  cy={y}
                  r={r + 10}
                  fill="var(--accent)"
                  opacity="0.12"
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="var(--accent)"
                  stroke="var(--card)"
                  strokeWidth="3"
                />
                <text
                  x={x}
                  y={y + 8}
                  textAnchor="middle"
                  fill="var(--card)"
                  fontSize="22"
                  fontWeight="600"
                >
                  {d._count.itineraries}
                </text>
                <text
                  x={tx}
                  y={ty}
                  textAnchor={anchor}
                  fill="var(--foreground)"
                  fontSize="26"
                  fontWeight="600"
                  className="group-hover:fill-accent"
                  paintOrder="stroke"
                  stroke="var(--card)"
                  strokeWidth="6"
                >
                  {d.name}
                </text>
              </Link>
            );
          })}
        </svg>
        <p className="border-t border-line px-4 py-2.5 text-xs text-muted">
          Number = creator routes in that city
        </p>
      </div>
    </section>
  );
}
