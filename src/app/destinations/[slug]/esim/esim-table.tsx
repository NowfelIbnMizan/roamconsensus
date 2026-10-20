"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { EsimPlanRow } from "@/lib/data";
import { formatMoney } from "@/lib/format";

type Plan = EsimPlanRow;

const DATA_FILTERS = [
  { label: "Any data", test: () => true },
  { label: "1 GB+", test: (p: Plan) => p.dataMb === null || p.dataMb >= 1024 },
  { label: "3 GB+", test: (p: Plan) => p.dataMb === null || p.dataMb >= 3 * 1024 },
  { label: "5 GB+", test: (p: Plan) => p.dataMb === null || p.dataMb >= 5 * 1024 },
  { label: "10 GB+", test: (p: Plan) => p.dataMb === null || p.dataMb >= 10 * 1024 },
  { label: "Unlimited", test: (p: Plan) => p.dataMb === null },
];
const DAY_FILTERS = [0, 7, 15, 30];
const SORTS = {
  price: { label: "Lowest price", key: (p: Plan) => p.priceCents },
  perGb: { label: "Price per GB", key: (p: Plan) => pricePerGb(p) ?? Infinity },
  perDay: { label: "Price per day", key: (p: Plan) => p.priceCents / p.days },
  data: { label: "Most data", key: (p: Plan) => -(p.dataMb ?? Infinity) },
} as const;

function pricePerGb(p: Plan) {
  return p.dataMb ? (p.priceCents / p.dataMb) * 1024 : null;
}

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

function formatData(mb: number | null) {
  if (mb === null) return "Unlimited";
  return mb < 1024 ? `${mb} MB` : `${+(mb / 1024).toFixed(1)} GB`;
}

const selectClass = "rounded-lg border border-line bg-card px-3 py-1.5 text-sm";

export function EsimTable({ plans }: { plans: Plan[] }) {
  const [dataFilter, setDataFilter] = useState(0);
  const [minDays, setMinDays] = useState(0);
  const [sort, setSort] = useState<keyof typeof SORTS>("price");
  const [provider, setProvider] = useState("");

  const providers = useMemo(() => [...new Set(plans.map((p) => p.provider))].sort(), [plans]);
  const shown = useMemo(
    () =>
      plans
        .filter((p) => DATA_FILTERS[dataFilter].test(p) && p.days >= minDays && (!provider || p.provider === provider))
        .sort((a, b) => SORTS[sort].key(a) - SORTS[sort].key(b)),
    [plans, dataFilter, minDays, sort, provider],
  );

  return (
    <>
      <div className="mt-5 flex flex-wrap gap-2">
        <select
          aria-label="Data"
          className={selectClass}
          value={dataFilter}
          onChange={(e) => setDataFilter(+e.target.value)}
        >
          {DATA_FILTERS.map((f, i) => (
            <option key={f.label} value={i}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Validity"
          className={selectClass}
          value={minDays}
          onChange={(e) => setMinDays(+e.target.value)}
        >
          {DAY_FILTERS.map((d) => (
            <option key={d} value={d}>
              {d ? `${d}+ days` : "Any length"}
            </option>
          ))}
        </select>
        <select
          aria-label="Provider"
          className={selectClass}
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
        >
          <option value="">All providers</option>
          {providers.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Sort"
          className={selectClass}
          value={sort}
          onChange={(e) => setSort(e.target.value as keyof typeof SORTS)}
        >
          {Object.entries(SORTS).map(([k, s]) => (
            <option key={k} value={k}>
              {s.label}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-muted">{shown.length} plans</span>
      </div>

      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {shown.map((p) => {
          const perGb = pricePerGb(p);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
              <div className="min-w-40 flex-1">
                <p className="font-medium">{p.provider}</p>
                <p className="text-xs text-muted">
                  {[p.network, p.speed, p.hotspot === true ? "Hotspot OK" : p.hotspot === false ? "No hotspot" : null]
                    .filter(Boolean)
                    .join(" · ") || p.name}
                </p>
                {p.notes && <p className="text-xs text-muted">{p.notes}</p>}
              </div>
              <div className="w-24">
                <p className="font-semibold tabular-nums">{formatData(p.dataMb)}</p>
                <p className="text-xs text-muted">{p.days} days</p>
              </div>
              <div className="w-24 text-right">
                <p className="font-semibold tabular-nums">{formatExact(p.priceCents, p.currency)}</p>
                <p className="text-xs text-muted tabular-nums">
                  {perGb === null
                    ? `${formatMoney(Math.round(p.priceCents / p.days), p.currency)}/day`
                    : `${formatMoney(Math.round(perGb), p.currency)}/GB`}
                </p>
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-background"
              >
                View <ExternalLink className="size-3" aria-hidden />
              </a>
            </li>
          );
        })}
        {shown.length === 0 && <li className="p-4 text-sm text-muted">No plans match these filters.</li>}
      </ul>
    </>
  );
}
