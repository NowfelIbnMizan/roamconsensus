import Link from "next/link";
import * as asia from "@/lib/asia-map";
import * as world from "@/lib/world-map";
import { distanceKm } from "@/lib/map";

type City = {
  slug: string;
  name: string;
  routes: number;
  lat: number;
  lng: number;
};
type Box = { x: number; y: number; w: number; h: number };

const FONT = 26;
const PAD = 40;
// Sizes above are tuned for a view about this wide; a wider view (cities on several continents) scales them up to match.
const VIEW = 900;
const MIN_VIEW = 420;

const inside = (map: typeof asia, c: City) => {
  const [x, y] = map.project(c.lat, c.lng);
  return x > 0 && x < map.MAP_W && y > 0 && y < map.MAP_H;
};

/** Cities closer than this (km) to some other city in a group share one map panel. */
const REGION_KM = 2000;

/** Groups cities into regions (Asia, Europe...) by chaining nearby ones, biggest region first. */
function regions(cities: City[]) {
  const groups: City[][] = [];
  for (const c of cities) {
    const near = groups.filter((g) => g.some((o) => distanceKm(o, c) < REGION_KM));
    const merged = [c, ...near.flat()];
    for (const g of near) groups.splice(groups.indexOf(g), 1);
    groups.push(merged);
  }
  return groups.sort((a, b) => b.length - a.length);
}

/**
 * The home page map: every city as a pin with its route count. Cities far apart (Southeast Asia, Japan and Korea, Spain) get a panel each,
 * so one map isn't stretched over a continent of empty land. A region inside East and Southeast Asia uses the
 * detailed Asia map, anywhere else the world map, so any new city shows up by itself.
 */
export function CityMap({ cities }: { cities: City[] }) {
  const [main, ...rest] = regions(cities);
  if (!main) return null;
  if (rest.length === 0) return <RegionMap cities={main} legend />;
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <RegionMap cities={main} legend />
      <div className="grid content-start gap-3 max-sm:grid-cols-2">
        {rest.map((r) => (
          <RegionMap key={r[0].slug} cities={r} small />
        ))}
      </div>
    </div>
  );
}

/**
 * One region: pins zoomed to fit. Pins that sit on top of each other (Kyoto and Osaka) are nudged apart, and each
 * label takes the first side that doesn't hit another pin or label, or the side that hits least.
 */
function RegionMap({ cities, legend = false, small = false }: { cities: City[]; legend?: boolean; small?: boolean }) {
  const { LAND, MAP_W, MAP_H, project } = cities.every((c) => inside(asia, c)) ? asia : world;
  const placed = cities
    .map((c) => {
      const [x, y] = project(c.lat, c.lng);
      return { ...c, x, y };
    })
    .filter((p) => p.x > 0 && p.x < MAP_W && p.y > 0 && p.y < MAP_H);
  if (!placed.length) return null;
  const span = Math.max(
    Math.max(...placed.map((p) => p.x)) - Math.min(...placed.map((p) => p.x)),
    Math.max(...placed.map((p) => p.y)) - Math.min(...placed.map((p) => p.y)),
  );
  const k = Math.max(1, span / VIEW);
  const font = FONT * k;
  const pins = placed.map((p) => ({ ...p, r: (12 + Math.min(p.routes, 8) * 0.8) * k }));

  for (let pass = 0; pass < 40; pass++)
    for (const a of pins)
      for (const b of pins) {
        if (a === b) continue;
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r + 14 * k;
        if (d >= min) continue;
        const push = (min - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }

  // Each pin's soft halo counts too, so a label never sits on a neighbour's halo.
  const taken: Box[] = pins.map((p) => {
    const r = p.r + 6 * k;
    return { x: p.x - r, y: p.y - r, w: r * 2, h: r * 2 };
  });
  const labels = pins.map((p) => {
    const w = p.name.length * font * 0.56;
    const h = font;
    const gap = p.r + 8 * k;
    const d = gap * 0.75;
    // Sides in order of preference: right, left, above, below, then the diagonals.
    const sides = [
      { x: p.x + gap, y: p.y - h / 2, anchor: "start" },
      { x: p.x - gap - w, y: p.y - h / 2, anchor: "end" },
      { x: p.x - w / 2, y: p.y - gap - h, anchor: "middle" },
      { x: p.x - w / 2, y: p.y + gap, anchor: "middle" },
      { x: p.x + d, y: p.y - d - h, anchor: "start" },
      { x: p.x + d, y: p.y + d, anchor: "start" },
      { x: p.x - d - w, y: p.y - d - h, anchor: "end" },
      { x: p.x - d - w, y: p.y + d, anchor: "end" },
    ] as const;
    const hit = (s: Box) =>
      taken.reduce((sum, t) => {
        const ox = Math.min(s.x + s.w, t.x + t.w) - Math.max(s.x, t.x);
        const oy = Math.min(s.y + s.h, t.y + t.h) - Math.max(s.y, t.y);
        return sum + (ox > 0 && oy > 0 ? ox * oy : 0);
      }, 0);
    // A label must read as its own pin's: clearly nearer to it than to any other pin. Take the first such side that
    // hits nothing but a sliver of a halo, else the side that overlaps least.
    const gapTo = (s: Box, q: { x: number; y: number; r: number }) =>
      Math.hypot(Math.max(s.x - q.x, 0, q.x - s.x - s.w), Math.max(s.y - q.y, 0, q.y - s.y - s.h)) - q.r;
    const own = (s: Box) => pins.every((q) => q === p || gapTo(s, q) > gapTo(s, p) * 2 + 6 * k);
    const boxes = sides.map((s) => ({ s, box: { x: s.x, y: s.y, w, h } }));
    const pick = (
      boxes.find((b) => own(b.box) && hit(b.box) <= w * h * 0.1) ??
      boxes.find((b) => hit(b.box) === 0) ??
      boxes.reduce((best, b) => (hit(b.box) < hit(best.box) ? b : best))
    ).s;
    taken.push({ x: pick.x, y: pick.y, w, h });
    return {
      x:
        pick.anchor === "end"
          ? pick.x + w
          : pick.anchor === "middle"
            ? p.x
            : pick.x,
      y: pick.y + h * 0.8,
      anchor: pick.anchor,
    };
  });

  const pad = PAD * k;
  let x0 = Math.max(0, Math.min(...taken.map((t) => t.x)) - pad);
  let y0 = Math.max(0, Math.min(...taken.map((t) => t.y)) - pad);
  let x1 = Math.min(MAP_W, Math.max(...taken.map((t) => t.x + t.w)) + pad);
  let y1 = Math.min(MAP_H, Math.max(...taken.map((t) => t.y + t.h)) + pad);
  // A small region (two cities in Spain) keeps enough land around it to see where it is.
  const grow = (lo: number, hi: number, min: number, max: number) => {
    const extra = Math.max(0, min - (hi - lo)) / 2;
    return [Math.max(0, lo - extra), Math.min(max, hi + extra)];
  };
  [x0, x1] = grow(x0, x1, MIN_VIEW, MAP_W);
  [y0, y1] = grow(y0, y1, MIN_VIEW * 0.75, MAP_H);

  // The map key goes in the first corner with no pins or labels in it (top-left on today's Asia map).
  const corners = [
    { at: "top-3 left-3", hit: (fx: number, fy: number) => fx < 0.45 && fy < 0.14 },
    { at: "top-3 right-3", hit: (fx: number, fy: number) => fx > 0.55 && fy < 0.14 },
    { at: "bottom-3 left-3", hit: (fx: number, fy: number) => fx < 0.45 && fy > 0.86 },
    { at: "bottom-3 right-3", hit: (fx: number, fy: number) => fx > 0.55 && fy > 0.86 },
  ];
  const corner =
    corners.find(({ hit }) =>
      taken.every(
        (t) =>
          !hit((t.x - x0) / (x1 - x0), (t.y - y0) / (y1 - y0)) &&
          !hit((t.x + t.w - x0) / (x1 - x0), (t.y + t.h - y0) / (y1 - y0)),
      ),
    )?.at ?? "top-3 left-3";

  return (
    <figure className={`relative overflow-hidden border border-line bg-card ${small ? "rounded-2xl" : "rounded-3xl"}`}>
      <svg
        viewBox={`${x0} ${y0} ${x1 - x0} ${y1 - y0}`}
        className="block h-auto w-full"
        role="group"
        aria-label="Map of the cities on Creatour"
      >
        <path
          d={LAND}
          fill="var(--line)"
          stroke="var(--line-strong)"
          strokeWidth={k}
        />
        {pins.map((p, i) => (
          <Link
            key={p.slug}
            href={`/destinations/${p.slug}`}
            aria-label={`${p.name}, ${p.routes} routes`}
            className="group outline-none"
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r + 10 * k}
              fill="var(--accent)"
              opacity="0.12"
              className="transition group-hover:opacity-30 group-focus-visible:opacity-30"
            />
            {/* A slow pulse ring, staggered per pin, so the numbers read as tappable. */}
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--accent)"
              className="pin-pulse"
              style={{ animationDelay: `${(i % 6) * 0.4}s` }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--accent)"
              stroke="var(--card)"
              strokeWidth={3 * k}
              className="origin-center transition-transform [transform-box:fill-box] group-hover:scale-110 group-focus-visible:scale-110"
            />
            <text
              x={p.x}
              y={p.y + 6.5 * k}
              textAnchor="middle"
              fill="var(--card)"
              fontSize={18 * k}
              fontWeight="600"
            >
              {p.routes}
            </text>
            <text
              x={labels[i].x}
              y={labels[i].y}
              textAnchor={labels[i].anchor}
              fill="var(--foreground)"
              fontSize={font}
              fontWeight="600"
              paintOrder="stroke"
              stroke="var(--card)"
              strokeWidth={6 * k}
              className="group-hover:fill-accent group-focus-visible:fill-accent group-focus-visible:underline"
            >
              {p.name}
            </text>
          </Link>
        ))}
      </svg>
      {/* Map key: a sample pin and what its number means. */}
      {legend && (
        <figcaption className={`absolute ${corner} flex items-center gap-2 rounded-full border border-line bg-card/85 py-1 pr-3 pl-1 text-xs text-muted shadow-sm backdrop-blur-sm`}>
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-background tabular-nums">
            4
          </span>
          Creator routes per city
        </figcaption>
      )}
    </figure>
  );
}
