// The "City health" scorecard in admin: every check a destination has to pass before it counts as finished.
import { costGuides } from "@/lib/costs";
import { getDestination, getEsimPlans } from "@/lib/data";
import { db } from "@/lib/db";
import { esimGuides } from "@/lib/esim-guides";
import { destinationFaq } from "@/lib/faq";
import { placePhotoKey } from "@/lib/place";

/** A place counts as checked for this long; after that it needs checking again. */
const CHECK_FRESH_DAYS = 180;
export const MIN_TIPS = 12;
export const LENGTHS = [
  { label: "1–2 days", min: 1, max: 2 },
  { label: "3–4 days", min: 3, max: 4 },
  { label: "5+ days", min: 5, max: Infinity },
] as const;
const TIERS = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"] as const;

export type Check = {
  label: string;
  /** What passing means, shown under the label. */
  rule: string;
  done: number;
  total: number;
  /** What still fails, each with where to fix it. */
  missing: { name: string; href: string }[];
};

export async function cityHealth() {
  const destinations = await db.destination.findMany({
    orderBy: { name: "asc" },
    include: {
      places: {
        include: {
          items: {
            select: { sentiment: true },
          },
        },
      },
      itineraries: {
        select: {
          id: true,
          title: true,
          tier: true,
          days: true,
          items: {
            select: {
              name: true,
              category: true,
              sentiment: true,
              priceCents: true,
              priceCheckedAt: true,
              placeId: true,
              place: { select: { closed: true } },
            },
          },
        },
      },
      _count: { select: { tips: true, months: true } },
    },
  });
  const photoKeys = destinations.flatMap((d) => [
    `destination:${d.slug}`,
    ...d.places.map((p) => placePhotoKey(d.slug, p)),
  ]);
  const photos = new Set(
    (
      await db.photoCache.findMany({
        where: { key: { in: photoKeys }, source: { not: "PLACEHOLDER" } },
        select: { key: true },
      })
    ).map((r) => r.key),
  );
  const fresh = Date.now() - CHECK_FRESH_DAYS * 86_400_000;

  return Promise.all(
    destinations.map(async (d) => {
      const edit = `/admin/destinations/${d.id}`;
      // Only places a route actually sends people to; spare places in the data don't need polishing.
      const used = d.places.filter((p) =>
        p.items.some((i) => i.sentiment !== "AVOID"),
      );
      const open = used.filter((p) => !p.closed);
      const place = (p: { name: string }) => ({ name: p.name, href: edit });
      const placeCheck = (
        label: string,
        rule: string,
        list: typeof used,
        ok: (p: (typeof used)[number]) => boolean,
      ): Check => ({
        label,
        rule,
        done: list.filter(ok).length,
        total: list.length,
        missing: list.filter((p) => !ok(p)).map(place),
      });

      const stops = d.itineraries.flatMap((it) =>
        it.items
          .filter((i) => i.sentiment !== "AVOID" && !i.place?.closed)
          .map((i) => ({
            ...i,
            href: `/admin/itineraries/${it.id}`,
            route: it.title,
          })),
      );
      const stopCheck = (
        label: string,
        rule: string,
        list: typeof stops,
        ok: (i: (typeof stops)[number]) => boolean,
      ): Check => ({
        label,
        rule,
        done: list.filter(ok).length,
        total: list.length,
        missing: list
          .filter((i) => !ok(i))
          .map((i) => ({ name: `${i.name} (${i.route})`, href: i.href })),
      });
      const one = (
        label: string,
        rule: string,
        ok: boolean,
        href = edit,
      ): Check => ({
        label,
        rule,
        done: ok ? 1 : 0,
        total: 1,
        missing: ok ? [] : [{ name: label, href }],
      });

      const [full, plans] = await Promise.all([
        getDestination(d.slug),
        getEsimPlans(d.country),
      ]);
      const faq = full ? destinationFaq(full, plans) : [];

      const checks: Check[] = [
        placeCheck(
          "Map pins",
          "Every place on a route has a pin (transfers and drives don't need one).",
          used.filter((p) => p.category !== "TRANSIT"),
          (p) => p.lat !== null,
        ),
        placeCheck(
          "Real photos",
          "The venue's own photo or a stock photo of the place, not a grey tile. Photos load when a page is first viewed.",
          used,
          (p) => photos.has(placePhotoKey(d.slug, p)),
        ),
        placeCheck(
          "Websites",
          "Every hotel and restaurant links its own site, or was checked and has none (Instagram-only warungs).",
          used.filter((p) => p.category === "STAY" || p.category === "FOOD"),
          (p) => Boolean(p.website) || p.checkedAt !== null,
        ),
        placeCheck(
          "About text",
          "Every place has its 1–2 sentence About.",
          used,
          (p) => Boolean(p.blurb),
        ),
        placeCheck(
          "Checked open",
          `Checked on Google Maps or its own site in the last ${CHECK_FRESH_DAYS} days (closed places are marked Closed).`,
          open,
          (p) => p.checkedAt !== null && p.checkedAt.getTime() > fresh,
        ),
        stopCheck(
          "Prices",
          "A price or Free on every stop, or checked and no source lists one.",
          stops,
          (i) => i.priceCents !== null || i.priceCheckedAt !== null,
        ),
        stopCheck(
          "Linked to a place",
          "Every sight, restaurant and hotel points at a place (pin, photo, consensus).",
          stops.filter((i) =>
            ["EXPERIENCE", "FOOD", "STAY"].includes(i.category),
          ),
          (i) => i.placeId !== null,
        ),
        {
          label: "Before you go",
          rule: `At least ${MIN_TIPS} tips.`,
          done: Math.min(d._count.tips, MIN_TIPS),
          total: MIN_TIPS,
          missing:
            d._count.tips < MIN_TIPS
              ? [{ name: `${MIN_TIPS - d._count.tips} more tips`, href: edit }]
              : [],
        },
        one("When to go", "All 12 months filled.", d._count.months === 12),
        one(
          "Budget",
          "Daily costs per travel style (src/lib/costs.ts).",
          Boolean(costGuides[d.slug]),
        ),
        one(
          "eSIM",
          "Plans and a guide for the country.",
          plans.length > 0 && Boolean(esimGuides[d.country]),
          "/admin/esim",
        ),
        {
          label: "FAQ",
          rule: "All 7 questions answered (they come from the data above).",
          done: faq.length,
          total: 7,
          missing:
            faq.length < 7
              ? [
                  {
                    name: `${7 - faq.length} questions have no data yet`,
                    href: edit,
                  },
                ]
              : [],
        },
        one(
          "Cover photo",
          "The city has a cover photo.",
          Boolean(d.heroPhotoUrl) || photos.has(`destination:${d.slug}`),
        ),
        {
          label: "Travel styles",
          rule: "A route for each style: backpacker, budget, mid-range, luxury.",
          done: TIERS.filter((t) => d.itineraries.some((it) => it.tier === t))
            .length,
          total: TIERS.length,
          missing: TIERS.filter(
            (t) => !d.itineraries.some((it) => it.tier === t),
          ).map((t) => ({
            name: `No ${t.toLowerCase()} route`,
            href: edit,
          })),
        },
        {
          label: "Trip lengths",
          rule: LENGTHS.map((l) => l.label).join(", ") + ".",
          done: LENGTHS.filter((l) =>
            d.itineraries.some((it) => it.days >= l.min && it.days <= l.max),
          ).length,
          total: LENGTHS.length,
          missing: LENGTHS.filter(
            (l) =>
              !d.itineraries.some((it) => it.days >= l.min && it.days <= l.max),
          ).map((l) => ({ name: `No ${l.label} route`, href: edit })),
        },
      ];
      return {
        id: d.id,
        slug: d.slug,
        name: d.name,
        checks,
        passed: checks.filter((c) => c.done >= c.total).length,
      };
    }),
  );
}
