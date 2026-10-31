"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, RotateCcw } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import { Thumb } from "@/components/thumb";
import type { QuizData } from "@/lib/data";
import { categoryLabel, mostlyPriced, tierLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import { VIBES, type VibeKey } from "@/lib/vibes";
import type { Tier } from "@/generated/prisma/enums";
import { usePrefs } from "@/lib/prefs";

// Most routes cover one city in 1-3 days, so the shortest choice has to be short.
const DAYS = [
  { label: "1–2 days", value: 2 },
  { label: "3–4 days", value: 4 },
  { label: "5–7 days", value: 7 },
  { label: "8–10 days", value: 10 },
  { label: "11+ days", value: 14 },
];
const tierOrder: Tier[] = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"];

type Answers = {
  days: number | null;
  tier: Tier | null;
  vibes: VibeKey[];
};
type Route = QuizData["routes"][number];

/** 0–100: vibes count most, then trip length, then budget style. */
function score(route: Route, a: Answers) {
  const reasons: string[] = [];
  let vibe = 1;
  if (a.vibes.length) {
    const share = a.vibes.reduce((s, v) => s + (route.vibes[v] ?? 0), 0) / a.vibes.length;
    vibe = Math.min(1, share * 2.5);
    const strong = a.vibes.filter((v) => (route.vibes[v] ?? 0) >= 0.15);
    if (strong.length)
      reasons.push(`Lots of ${strong.map((v) => VIBES.find((x) => x.key === v)!.label.toLowerCase()).join(" and ")}`);
  }
  const days = a.days ? Math.max(0, 1 - Math.abs(route.days - a.days) / a.days) : 1;
  if (a.days && Math.abs(route.days - a.days) <= 2) reasons.push(`${route.days} days fits your trip`);
  const gap = !a.tier ? 0 : Math.abs(tierOrder.indexOf(route.tier) - tierOrder.indexOf(a.tier));
  const tier = [1, 0.5, 0.15, 0][gap];
  if (gap === 0 && a.tier) reasons.push(`${tierLabel[route.tier]} style, like you`);
  return { pct: Math.round(vibe * 50 + days * 30 + tier * 20), reasons };
}

const pill = (on: boolean) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition ${
    on ? "bg-foreground font-medium text-background" : "border border-line bg-card hover:border-accent"
  }`;

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

/**
 * Every question on one screen as tap-to-toggle pills; the matches beside them (below on phones) update as you tap.
 * The top match gets a photo card, the next two a row each.
 */
export function Quiz({ data }: { data: QuizData }) {
  const [a, setA] = useState<Answers>({ days: null, tier: null, vibes: [] });
  const [city, setCity] = useState<string | null>(null);
  // Style starts from the traveller's profile (My trips), still one tap to change.
  const prefs = usePrefs();
  const prefsApplied = useRef(false);
  useEffect(() => {
    if (!prefs.ready || prefsApplied.current) return;
    prefsApplied.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the profile is only readable after mount
    if (prefs.tier) setA((x) => ({ ...x, tier: x.tier ?? (prefs.tier as Tier) }));
  }, [prefs]);
  const { money } = useMoney();
  // Below lg the matches sit under the questions; a bar shows the top pick until they scroll into view.
  const results = useRef<HTMLElement>(null);
  const [resultsSeen, setResultsSeen] = useState(false);
  useEffect(() => {
    const el = results.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setResultsSeen(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const cities = [...new Map(data.routes.map((r) => [r.destination.slug, r.destination])).values()].sort((x, y) =>
    x.name.localeCompare(y.name),
  );
  const answered = a.days !== null || a.tier !== null || a.vibes.length > 0 || city !== null;

  const ranked = data.routes
    .filter((r) => !city || r.destination.slug === city)
    .map((r) => ({ ...r, ...score(r, a) }))
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 3);
  const [top, ...rest] = ranked;
  const spots = data.places
    .filter((p) => !city || p.destination === city)
    .map((p) => ({
      ...p,
      hits: p.vibes.filter((v) => a.vibes.includes(v)).length,
    }))
    .filter((p) => p.hits > 0)
    .sort((x, y) => y.hits - x.hits || y.creatorCount - x.creatorCount || x.name.localeCompare(y.name))
    .slice(0, 8);
  const price = (r: Route) => (r.totalCents > 0 && mostlyPriced(r) ? ` · ${money(r.totalCents)}` : "");

  return (
    <div className="mt-6 space-y-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-5">
          <Question label="Where">
            <button type="button" aria-pressed={!city} className={pill(!city)} onClick={() => setCity(null)}>
              Anywhere
            </button>
            {cities.map((d) => (
              <button
                key={d.slug}
                type="button"
                aria-pressed={city === d.slug}
                className={pill(city === d.slug)}
                onClick={() => setCity(city === d.slug ? null : d.slug)}
              >
                {d.name}
              </button>
            ))}
          </Question>
          <Question label="How long">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                aria-pressed={a.days === d.value}
                className={pill(a.days === d.value)}
                onClick={() => setA({ ...a, days: a.days === d.value ? null : d.value })}
              >
                {d.label}
              </button>
            ))}
          </Question>
          <Question label="Budget style">
            {tierOrder.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={a.tier === t}
                className={pill(a.tier === t)}
                onClick={() => setA({ ...a, tier: a.tier === t ? null : t })}
              >
                {tierLabel[t]}
              </button>
            ))}
          </Question>
          <Question label="What do you love? Pick up to 3">
            {VIBES.map((v) => {
              const on = a.vibes.includes(v.key);
              return (
                <button
                  key={v.key}
                  type="button"
                  aria-pressed={on}
                  className={pill(on)}
                  onClick={() =>
                    setA({
                      ...a,
                      vibes: on ? a.vibes.filter((x) => x !== v.key) : [...a.vibes, v.key].slice(-3),
                    })
                  }
                >
                  {on && <Check className="size-3.5" aria-hidden />}
                  {v.label}
                </button>
              );
            })}
          </Question>
          {answered && (
            <button
              type="button"
              onClick={() => {
                setA({ days: null, tier: null, vibes: [] });
                setCity(null);
              }}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
            >
              <RotateCcw className="size-4" aria-hidden /> Start over
            </button>
          )}
        </div>

        <section
          ref={results}
          aria-live="polite"
          className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start"
        >
          <h2 className="eyebrow font-sans">{answered ? "Your best match" : "Tap to find your match"}</h2>
          {top && (
            <article className="relative mt-2 overflow-hidden rounded-2xl border border-accent bg-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent">
              <Thumb url={top.photoUrl} category="EXPERIENCE" sizes="420px" className="h-44 w-full" />
              <div className="p-4">
                {answered && <p className="text-sm font-medium text-accent">{top.pct}% match</p>}
                <h3 className="mt-0.5 text-xl font-semibold">
                  <Link
                    href={`/itineraries/${top.slug}`}
                    className="after:absolute after:inset-0 focus-visible:outline-none"
                  >
                    {top.title}
                  </Link>
                </h3>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                  <span className="relative z-10">
                    <CreatorChip creator={top.creator} />
                  </span>
                  · {top.destination.name} · {top.days} {top.days === 1 ? "day" : "days"} · {tierLabel[top.tier]}
                  {price(top)}
                </p>
                {top.reasons.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {top.reasons.map((x) => (
                      <li
                        key={x}
                        className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent"
                      >
                        <Check className="size-3" aria-hidden /> {x}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                  Open route and add to trip <ArrowRight className="size-4" aria-hidden />
                </span>
              </div>
            </article>
          )}
          {rest.length > 0 && (
            <>
              <h3 className="mt-5 text-sm font-semibold">Also a good fit</h3>
              <ol className="mt-2 space-y-2">
                {rest.map((r) => (
                  <li key={r.slug}>
                    <article className="relative flex gap-3 rounded-2xl border border-line bg-card p-3 hover:border-accent has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent">
                      <Thumb url={r.photoUrl} category="EXPERIENCE" className="size-16 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        {answered && <p className="text-xs font-medium text-accent">{r.pct}% match</p>}
                        <p className="font-semibold">
                          <Link
                            href={`/itineraries/${r.slug}`}
                            className="after:absolute after:inset-0 focus-visible:outline-none"
                          >
                            {r.title}
                          </Link>
                        </p>
                        <p className="text-sm text-muted">
                          {r.creator.name} · {r.days} {r.days === 1 ? "day" : "days"} · {tierLabel[r.tier]}
                          {price(r)}
                        </p>
                      </div>
                    </article>
                  </li>
                ))}
              </ol>
            </>
          )}
        </section>
      </div>

      {answered && top && !resultsSeen && (
        <div className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-[1101] flex items-center gap-2 rounded-2xl bg-foreground py-2 pl-4 pr-2 text-background shadow-lg sm:bottom-4 lg:hidden">
          <Link href={`/itineraries/${top.slug}`} className="min-w-0 flex-1 py-1">
            <span className="block text-xs opacity-80">Best match · {top.pct}%</span>
            <span className="block truncate text-sm font-semibold">{top.title}</span>
          </Link>
          <button
            type="button"
            onClick={() => results.current?.scrollIntoView({ behavior: "smooth" })}
            aria-label="See all matches"
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm opacity-80"
          >
            More <ArrowDown className="size-4" aria-hidden />
          </button>
          <Link
            href={`/itineraries/${top.slug}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl bg-background px-3 text-sm font-medium text-foreground"
          >
            Open <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}

      {spots.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold">Places made for you</h2>
          <p className="mt-1 text-sm text-muted">Mix these into any route from your trip plan.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {spots.map((p) => (
              <li key={`${p.destination}/${p.slug}`}>
                <Link
                  href={placeHref(p.destination, p.slug)}
                  className="block h-full rounded-2xl border border-line bg-card p-4 hover:border-accent"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[p.area, categoryLabel[p.category]].filter(Boolean).join(" · ")}
                    {p.creatorCount > 1 && ` · ${p.creatorCount} creators`}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1">
                    {p.vibes
                      .filter((v) => a.vibes.includes(v))
                      .map((v) => (
                        <span key={v} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                          {VIBES.find((x) => x.key === v)!.label}
                        </span>
                      ))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
