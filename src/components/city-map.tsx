import Link from "next/link";
import { LAND, MAP_H, MAP_W, project } from "@/lib/asia-map";

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
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * The home page map: every city as a pin with its route count, zoomed to fit them. Pins that sit on top of each
 * other (Kyoto and Osaka) are nudged apart, and each label takes the first side that doesn't hit another pin or
 * label, so new cities place themselves.
 */
export function CityMap({ cities }: { cities: City[] }) {
  const pins = cities
    .map((c) => {
      const [x, y] = project(c.lat, c.lng);
      return { ...c, x, y, r: 15 + Math.min(c.routes, 8) };
    })
    // The map only covers East and Southeast Asia; a city outside it waits for a bigger map.
    .filter((p) => p.x > 0 && p.x < MAP_W && p.y > 0 && p.y < MAP_H);
  if (!pins.length) return null;

  for (let pass = 0; pass < 40; pass++)
    for (const a of pins)
      for (const b of pins) {
        if (a === b) continue;
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy);
        const min = a.r + b.r + 6;
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
    const w = p.name.length * FONT * 0.56;
    const h = FONT;
    const gap = p.r + 8;
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

  const x0 = Math.max(0, Math.min(...taken.map((t) => t.x)) - PAD);
  const y0 = Math.max(0, Math.min(...taken.map((t) => t.y)) - PAD);
  const x1 = Math.min(MAP_W, Math.max(...taken.map((t) => t.x + t.w)) + PAD);
  const y1 = Math.min(MAP_H, Math.max(...taken.map((t) => t.y + t.h)) + PAD);

  return (
    <figure className="overflow-hidden rounded-3xl border border-line bg-card">
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
          strokeWidth="1"
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
              r={p.r + 10}
              fill="var(--accent)"
              opacity="0.12"
              className="transition group-hover:opacity-30 group-focus-visible:opacity-30"
            />
            <circle
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="var(--accent)"
              stroke="var(--card)"
              strokeWidth="3"
            />
            <text
              x={p.x}
              y={p.y + 8}
              textAnchor="middle"
              fill="var(--card)"
              fontSize="22"
              fontWeight="600"
            >
              {p.routes}
            </text>
            <text
              x={labels[i].x}
              y={labels[i].y}
              textAnchor={labels[i].anchor}
              fill="var(--foreground)"
              fontSize={FONT}
              fontWeight="600"
              paintOrder="stroke"
              stroke="var(--card)"
              strokeWidth="6"
              className="group-hover:fill-accent group-focus-visible:fill-accent group-focus-visible:underline"
            >
              {p.name}
            </text>
          </Link>
        ))}
      </svg>
      <figcaption className="border-t border-line px-4 py-2.5 text-xs text-muted">
        Number = creator routes in that city
      </figcaption>
    </figure>
  );
}
