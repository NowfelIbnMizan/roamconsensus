"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { CreatorChip } from "@/components/creator";
import { useMoney } from "@/components/money";
import type { QuizData } from "@/lib/data";
import { categoryLabel, tierLabel } from "@/lib/format";
import { placeHref } from "@/lib/place";
import { VIBES, type VibeKey } from "@/lib/vibes";
import type { Tier } from "@/generated/prisma/enums";

const DAYS = [
  { label: "3–4 days", value: 4 },
  { label: "5–7 days", value: 7 },
  { label: "8–10 days", value: 10 },
  { label: "11+ days", value: 14 },
];
const TIERS: (Tier | "ANY")[] = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY", "ANY"];
const tierOrder: Tier[] = ["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"];

type Answers = { days: number | null; tier: Tier | "ANY" | null; vibes: VibeKey[] };

/** 0–100: vibes count most, then trip length, then budget style. */
function score(route: QuizData["routes"][number], a: Answers) {
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
  const gap = !a.tier || a.tier === "ANY" ? 0 : Math.abs(tierOrder.indexOf(route.tier) - tierOrder.indexOf(a.tier));
  const tier = [1, 0.5, 0.15, 0][gap];
  if (gap === 0 && a.tier && a.tier !== "ANY") reasons.push(`${tierLabel[route.tier]} budget, like you`);
  return { pct: Math.round(vibe * 50 + days * 30 + tier * 20), reasons };
}

export function Quiz({ data }: { data: QuizData }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ days: null, tier: null, vibes: [] });
  const { money } = useMoney();

  const chip = (selected: boolean) =>
    `rounded-2xl border px-4 py-3 text-left transition ${
      selected ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-card hover:border-accent"
    }`;

  const steps = [
    {
      q: "How long is your trip?",
      done: a.days !== null,
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DAYS.map((d) => (
            <button
              key={d.value}
              type="button"
              className={chip(a.days === d.value)}
              onClick={() => {
                setA({ ...a, days: d.value });
                setStep(1);
              }}
            >
              {d.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      q: "What's your budget style?",
      done: a.tier !== null,
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TIERS.map((t) => (
            <button
              key={t}
              type="button"
              className={chip(a.tier === t)}
              onClick={() => {
                setA({ ...a, tier: t });
                setStep(2);
              }}
            >
              {t === "ANY" ? "No preference" : tierLabel[t]}
            </button>
          ))}
        </div>
      ),
    },
    {
      q: "What do you love doing? Pick up to 3.",
      done: a.vibes.length > 0,
      body: (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {VIBES.map((v) => {
            const on = a.vibes.includes(v.key);
            return (
              <button
                key={v.key}
                type="button"
                aria-pressed={on}
                className={chip(on)}
                onClick={() =>
                  setA({
                    ...a,
                    vibes: on ? a.vibes.filter((x) => x !== v.key) : [...a.vibes, v.key].slice(-3),
                  })
                }
              >
                <span className="mr-2" aria-hidden>
                  {v.emoji}
                </span>
                {v.label}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  if (step < steps.length) {
    const s = steps[step];
    return (
      <div className="mt-8">
        <div className="flex gap-1.5" aria-hidden>
          {steps.map((_, n) => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-accent" : "bg-line"}`} />
          ))}
        </div>
        <p className="mt-6 text-sm text-muted">
          Question {step + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-2xl font-semibold">{s.q}</h2>
        <div className="mt-5">{s.body}</div>
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground disabled:invisible"
          >
            <ArrowLeft className="size-4" aria-hidden /> Back
          </button>
          {step === steps.length - 1 && (
            <button
              type="button"
              onClick={() => setStep(steps.length)}
              disabled={!s.done}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-40"
            >
              <Sparkles className="size-4" aria-hidden /> Show my matches
            </button>
          )}
          {step < steps.length - 1 && s.done && (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1 text-sm font-medium text-accent"
            >
              Next <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    );
  }

  const ranked = data.routes
    .map((r) => ({ ...r, ...score(r, a) }))
    .sort((x, y) => y.pct - x.pct)
    .slice(0, 3);
  const spots = data.places
    .map((p) => ({ ...p, hits: p.vibes.filter((v) => a.vibes.includes(v)).length }))
    .filter((p) => p.hits > 0)
    .sort((x, y) => y.hits - x.hits || y.creatorCount - x.creatorCount || x.name.localeCompare(y.name))
    .slice(0, 8);

  return (
    <div className="mt-8 space-y-10">
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Your best matches</h2>
          <button
            type="button"
            onClick={() => {
              setA({ days: null, tier: null, vibes: [] });
              setStep(0);
            }}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
          >
            <RotateCcw className="size-4" aria-hidden /> Start over
          </button>
        </div>
        <ol className="mt-4 space-y-3">
          {ranked.map((r, n) => (
            <li key={r.slug}>
              <Link
                href={`/itineraries/${r.slug}`}
                className={`flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-5 transition hover:border-accent ${
                  n === 0 ? "border-accent" : "border-line"
                }`}
              >
                <div
                  className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-full ${
                    n === 0 ? "bg-accent text-background" : "bg-line"
                  }`}
                >
                  <span className="text-lg font-semibold leading-none">{r.pct}%</span>
                  <span className="text-[10px]">match</span>
                </div>
                <div className="min-w-0 flex-1">
                  {n === 0 && <p className="text-xs font-medium uppercase tracking-wide text-accent">Top pick</p>}
                  <p className="font-semibold">{r.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                    <CreatorChip creator={r.creator} link={false} /> · {r.destination.name} · {r.days} days ·{" "}
                    {tierLabel[r.tier]}
                    {r.totalCents > 0 && ` · ${money(r.totalCents)}`}
                  </p>
                  {r.reasons.length > 0 && <p className="mt-1 text-sm">{r.reasons.join(" · ")}</p>}
                </div>
                <ArrowRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {spots.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold">Spots made for you</h2>
          <p className="mt-1 text-sm text-muted">Mix these into any route from the trip cart.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {spots.map((p) => (
              <li key={`${p.destination}/${p.slug}`}>
                <Link
                  href={placeHref(p.destination, p.slug)}
                  className="block rounded-2xl border border-line bg-card p-4 hover:border-accent"
                >
                  <p className="font-medium">{p.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {[p.area, categoryLabel[p.category]].filter(Boolean).join(" · ")}
                    {p.creatorCount > 1 && ` · ${p.creatorCount} creators`}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-1">
                    {p.vibes
                      .filter((v) => a.vibes.includes(v))
                      .map((v) => {
                        const vibe = VIBES.find((x) => x.key === v)!;
                        return (
                          <span key={v} className="rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                            {vibe.emoji} {vibe.label}
                          </span>
                        );
                      })}
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
