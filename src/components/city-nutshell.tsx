import Link from "next/link";
import { BedDouble, CalendarDays, Star, Sun, TrainFront, Wallet, type LucideIcon } from "lucide-react";
import { Money } from "@/components/money";
import { costGuides } from "@/lib/costs";
import type { getDestination, getStays } from "@/lib/data";
import { placeHref } from "@/lib/place";
import { bestMonths } from "@/lib/seasons";

type Destination = NonNullable<Awaited<ReturnType<typeof getDestination>>>;
type Stays = Awaited<ReturnType<typeof getStays>>;

/** Where most creators slept: the area whose recommended stays come from the most creators. */
export function topStayArea(consensus: Destination["consensus"]) {
  const areas = new Map<string, { creators: Set<string>; stays: number }>();
  for (const p of consensus) {
    if (p.category !== "STAY" || !p.area || p.creators.length === 0) continue;
    const a = areas.get(p.area) ?? { creators: new Set(), stays: 0 };
    p.creators.forEach((c) => a.creators.add(c.handle));
    a.stays++;
    areas.set(p.area, a);
  }
  const [best, next] = [...areas].sort(([, a], [, b]) => b.creators.size - a.creators.size || b.stays - a.stays);
  // A tie at the top (say every creator slept somewhere else) names no clear base, so say nothing.
  if (!best || (next && next[1].creators.size === best[1].creators.size)) return null;
  return { area: best[0], creators: best[1].creators.size };
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

/**
 * The city at a glance, all worked out from the creators' routes, the climate table, the cost guide and the
 * before-you-go tips. A row whose data is missing is left out rather than guessed.
 */
export function CityNutshell({ d, stays }: { d: Destination; stays: Stays }) {
  const days = d.routes.map((r) => r.days);
  const [min, max] = [Math.min(...days), Math.max(...days)];
  const guide = costGuides[d.slug]?.styles.backpacker;
  const cheapestNight = stays.length ? stays.reduce((a, b) => (b.priceCents < a.priceCents ? b : a)) : null;
  const transport = d.tips.find((t) => /transport|getting around/i.test(t.topic));
  const base = topStayArea(d.consensus);
  const top = d.consensus.find((p) => p.skippedBy.length === 0 && p.creators.length > 0);
  const best = bestMonths(d.months);

  const rows: { icon: LucideIcon; label: string; value: React.ReactNode }[] = [];
  if (days.length)
    rows.push({
      icon: CalendarDays,
      label: "How long",
      value:
        min === max ? (
          `${min} days`
        ) : (
          <>
            {min}–{max} days <span className="text-muted">· most plan {median(days)}</span>
          </>
        ),
    });
  if (best)
    rows.push({
      icon: Sun,
      label: "Best time",
      value: <Link href={`/destinations/${d.slug}/when`}>{best}</Link>,
    });
  if (guide)
    rows.push({
      icon: Wallet,
      label: "Costs from",
      value: (
        <Link href={`/destinations/${d.slug}/budget`}>
          <Money
            cents={Math.round((guide.food + guide.localTransport + guide.activities + guide.stayPerNight / 2) * 100)}
          />
          <span className="text-muted"> a day, backpacking</span>
        </Link>
      ),
    });
  else if (cheapestNight)
    rows.push({
      icon: Wallet,
      label: "Stays from",
      value: (
        <>
          <Money cents={cheapestNight.priceCents} currency={cheapestNight.currency} />
          <span className="text-muted"> a night</span>
        </>
      ),
    });
  if (base)
    rows.push({
      icon: BedDouble,
      label: "Base yourself",
      value: (
        <Link href={`/destinations/${d.slug}/stay`}>
          {base.area}
          {d.creatorCount > 1 && (
            <span className="text-muted">
              {" "}
              · {base.creators} {base.creators === 1 ? "creator" : "creators"} stayed here
            </span>
          )}
        </Link>
      ),
    });
  if (transport)
    rows.push({
      icon: TrainFront,
      label: "Getting around",
      value: <Link href={`/destinations/${d.slug}/before`}>{transport.title}</Link>,
    });
  if (top)
    rows.push({
      icon: Star,
      label: "Don't miss",
      value: (
        <Link href={placeHref(d.slug, top.slug)}>
          {top.name}
          {d.creatorCount > 1 && (
            <span className="text-muted">
              {" "}
              · {top.creators.length} of {d.creatorCount} creators
            </span>
          )}
        </Link>
      ),
    });
  if (rows.length < 3) return null;

  return (
    <section className="mb-8 rounded-2xl border border-line bg-card p-4 sm:p-5" aria-labelledby="nutshell-heading">
      <h2 id="nutshell-heading" className="font-hand text-2xl leading-tight text-accent-2">
        {d.name} in a nutshell
      </h2>
      <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex gap-3">
            <Icon className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
              <dd className="font-medium [&_a]:hover:text-accent [&_a]:hover:underline">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
