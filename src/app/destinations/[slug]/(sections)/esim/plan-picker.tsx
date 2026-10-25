"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { EsimPlanRow } from "@/lib/data";
import { useMoney } from "@/components/money";
import { useCart } from "@/lib/cart-store";

type Plan = EsimPlanRow;

const LENGTHS = [
  { days: 7, label: "1 week" },
  { days: 14, label: "2 weeks" },
  { days: 30, label: "1 month" },
];
// Rough GB per day; sources: jetpacglobal.com and finder.com.au data usage guides. Heavy = unlimited.
const USES = [
  { key: "light", label: "Light", hint: "Maps, chat", gbPerDay: 0.3 },
  { key: "normal", label: "Normal", hint: "+ Instagram", gbPerDay: 1 },
  { key: "heavy", label: "Heavy", hint: "Video, hotspot", gbPerDay: null },
] as const;
type Use = (typeof USES)[number]["key"];

const dayWord = (n: number) => `${n} day${n === 1 ? "" : "s"}`;
const formatData = (mb: number | null) =>
  mb === null ? "Unlimited" : mb < 1024 ? `${mb} MB` : `${+(mb / 1024).toFixed(1)} GB`;
const perGb = (p: Plan) => (p.dataMb ? (p.priceCents / p.dataMb) * 1024 : Infinity);
/** Null GB = unlimited only; otherwise unlimited plans fit too. */
const fitsData = (p: Plan, gb: number | null) =>
  gb === null ? p.dataMb === null : p.dataMb === null || p.dataMb >= gb * 1024;
const byPrice = (ps: Plan[]) => [...ps].sort((a, b) => a.priceCents - b.priceCents);

// Plan prices are compared to the cent, so don't round them like trip totals.
function formatExact(cents: number, currency: string) {
  const digits = cents % 100 ? 2 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(cents / 100);
}

function usePlanPrice() {
  const { money, code, converting } = useMoney();
  return (p: Plan) =>
    !converting || code === p.currency ? formatExact(p.priceCents, p.currency) : money(p.priceCents, p.currency);
}

function details(p: Plan) {
  return (
    [p.network, p.speed, p.hotspot === true ? "Hotspot OK" : p.hotspot === false ? "No hotspot" : null]
      .filter(Boolean)
      .join(" · ") || p.name
  );
}

function ViewPlan({ p }: { p: Plan }) {
  return (
    <a
      href={p.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-medium text-background"
    >
      View plan <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

function Chips<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label}>
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-3 py-1.5 text-left text-sm ${
              value === o.value ? "border-accent bg-accent-soft font-medium" : "border-line bg-card hover:border-accent"
            }`}
          >
            {o.label}
            {o.hint && <span className="block text-xs font-normal text-muted">{o.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Two questions (trip length, phone use) turn the country's plans into three picks; the rest stay folded. */
export function PlanPicker({ plans }: { plans: Plan[] }) {
  const price = usePlanPrice();
  const [days, setDays] = useState(7);
  const [use, setUse] = useState<Use>("normal");
  const [everything, setEverything] = useState(false);

  // Start from the trip length in the cart, when there is one.
  const tripDays = useCart((s) => s.tripDays);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the saved cart is only known after mount
    if (tripDays > 0) setDays((LENGTHS.find((l) => l.days >= tripDays) ?? LENGTHS[2]).days);
  }, [tripDays]);

  const rate = USES.find((u) => u.key === use)!.gbPerDay;
  const gb = rate === null ? null : Math.max(1, Math.ceil(rate * days));
  const fits = useMemo(() => byPrice(plans.filter((p) => p.days >= days && fitsData(p, gb))), [plans, days, gb]);

  const picks: { tag: string; plan: Plan }[] = [];
  const add = (tag: string, plan?: Plan) => {
    if (plan && !picks.some((x) => x.plan.id === plan.id)) picks.push({ tag, plan });
  };
  add("Cheapest that fits", fits[0]);
  add("Best value per GB", [...fits].filter((p) => p.dataMb).sort((a, b) => perGb(a) - perGb(b))[0]);
  add("No data worries", byPrice(plans.filter((p) => p.days >= days && p.dataMb === null))[0]);

  const list = everything ? byPrice(plans) : fits;

  return (
    <div className="mt-5 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="space-y-5 rounded-2xl border border-line bg-card p-4 lg:sticky lg:top-4">
        <Chips
          label="How long?"
          options={LENGTHS.map((l) => ({ value: l.days, label: l.label }))}
          value={days}
          onChange={setDays}
        />
        <Chips
          label="How much do you use?"
          options={USES.map((u) => ({ value: u.key, label: u.label, hint: u.hint }))}
          value={use}
          onChange={setUse}
        />
        <p className="text-sm">
          You need <strong>{gb === null ? "unlimited data" : `about ${gb} GB`}</strong> for {days} days.
        </p>
      </div>

      <div className="mt-5 lg:mt-0">
        {picks.length ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {picks.map(({ tag, plan: p }) => (
              <article key={p.id} className="flex flex-col rounded-2xl border border-line bg-card p-4">
                <p className="eyebrow text-accent">{tag}</p>
                <p className="mt-1 font-semibold">{p.provider}</p>
                <p className="text-xs text-muted">{details(p)}</p>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{price(p)}</p>
                <p className="text-sm text-muted">
                  {formatData(p.dataMb)} · {dayWord(p.days)}
                </p>
                <div className="mt-auto pt-4">
                  <ViewPlan p={p} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-card p-4 text-sm text-muted">
            No plan lasts {days} days. Try a shorter trip length.
          </p>
        )}

        <details className="group mt-4 rounded-2xl border border-line bg-card">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-medium [&::-webkit-details-marker]:hidden">
            Compare all {fits.length} plans that fit
            <ChevronDown className="ml-auto size-4 shrink-0 transition group-open:rotate-180" aria-hidden />
          </summary>
          <ul className="divide-y divide-line border-t border-line">
            {list.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {p.provider}{" "}
                    <span className="font-normal text-muted">
                      · {formatData(p.dataMb)} · {dayWord(p.days)}
                    </span>
                  </p>
                  <p className="text-xs text-muted">{details(p)}</p>
                  {p.notes && <p className="text-xs text-muted">{p.notes}</p>}
                </div>
                <p className="font-semibold tabular-nums">{price(p)}</p>
                <ViewPlan p={p} />
              </li>
            ))}
          </ul>
          {fits.length < plans.length && (
            <button
              type="button"
              onClick={() => setEverything(!everything)}
              className="w-full border-t border-line p-3 text-sm font-medium text-accent hover:underline"
            >
              {everything ? "Show only plans that fit" : `Show all ${plans.length} plans`}
            </button>
          )}
        </details>
      </div>
    </div>
  );
}
