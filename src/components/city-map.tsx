import Link from "next/link";
import * as asia from "@/lib/asia-map";
import * as world from "@/lib/world-map";

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
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

const inside = (map: typeof asia, c: City) => {
  const [x, y] = map.project(c.lat, c.lng);
  return x > 0 && x < map.MAP_W && y > 0 && y < map.MAP_H;
};

/**
 * The home page map: every city as a pin with its route count, zoomed to fit them. It uses the detailed East and
 * Southeast Asia map while every city is there, and the world map once a city added in admin is anywhere else, so
 * any new city shows up by itself. Pins that sit on top of each other (Kyoto and Osaka) are nudged apart, and each
 * label takes the first side that doesn't hit another pin or label.
 */
export function CityMap({ cities }: { cities: City[] }) {
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
  const pins = placed.map((p) => ({ ...p, r: (15 + Math.min(p.routes, 8)) * k }));

  for (let pass = 0; pass < 40; pass++)
    for (const a of pins)
      for (const b of pins) {
        if (a === b) continue;
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r + 6 * k;
        if (d >= min) continue;
        const push = (min - d) / 2 / d;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }

  const taken: Box[] = pins.map((p) => ({
    x: p.x - p.r,
    y: p.y - p.r,
    w: p.r * 2,
    h: p.r * 2,
  }));
  const labels = pins.map((p) => {
    const w = p.name.length * font * 0.56;
    const h = font;
    const gap = p.r + 8 * k;
    const sides = [
      { x: p.x + gap, y: p.y - h / 2, anchor: "start" },
      { x: p.x - gap - w, y: p.y - h / 2, anchor: "end" },
      { x: p.x - w / 2, y: p.y - gap - h, anchor: "middle" },
      { x: p.x - w / 2, y: p.y + gap, anchor: "middle" },
    ] as const;
    const pick =
      sides.find((s) => !taken.some((t) => overlaps({ ...s, w, h }, t))) ??
      sides[0];
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
  const x0 = Math.max(0, Math.min(...taken.map((t) => t.x)) - pad);
  const y0 = Math.max(0, Math.min(...taken.map((t) => t.y)) - pad);
  const x1 = Math.min(MAP_W, Math.max(...taken.map((t) => t.x + t.w)) + pad);
  const y1 = Math.min(MAP_H, Math.max(...taken.map((t) => t.y + t.h)) + pad);

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
    <figure className="relative overflow-hidden rounded-3xl border border-line bg-card">
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
              y={p.y + 8 * k}
              textAnchor="middle"
              fill="var(--card)"
              fontSize={22 * k}
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
      <figcaption className={`absolute ${corner} flex items-center gap-2 rounded-full border border-line bg-card/85 py-1 pr-3 pl-1 text-xs text-muted shadow-sm backdrop-blur-sm`}>
        <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-background tabular-nums">
          4
        </span>
        Creator routes per city
      </figcaption>
    </figure>
  );
}
