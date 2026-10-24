"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { EsimPlanRow } from "@/lib/data";
import { useMoney } from "@/components/money";
import { DataEstimator } from "./data-estimator";

type Plan = EsimPlanRow;

const UNLIMITED = -1;
const DATA_OPTIONS = [0, 1, 3, 5, 10, 20, UNLIMITED]; // minimum GB; 0 = any
const DAY_OPTIONS = [0, 7, 15, 30];

const dataLabel = (gb: number) =>
  gb === 0 ? "Any data" : gb === UNLIMITED ? "Unlimited" : `${gb} GB+`;
const meetsData = (p: Plan, gb: number) =>
  gb === UNLIMITED
    ? p.dataMb === null
    : p.dataMb === null || p.dataMb >= gb * 1024;
/** Fixed options plus the current value, so an estimator pick like "7 GB+" still shows in the menu. */
const withValue = (options: number[], value: number) =>
  options.includes(value)
    ? options
    : [...options, value].sort((a, b) =>
        a === UNLIMITED ? 1 : b === UNLIMITED ? -1 : a - b,
      );

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

const PREVIEW = 8;

export function EsimTable({ plans }: { plans: Plan[] }) {
  const [minGb, setMinGb] = useState(0);
  const [minDays, setMinDays] = useState(0);
  const [hotspot, setHotspot] = useState(false);
  const [sort, setSort] = useState<keyof typeof SORTS>("price");
  const [provider, setProvider] = useState("");
  // The cheapest few answer most visits; the rest are one tap away.
  const [all, setAll] = useState(false);
  const { money, code, converting } = useMoney();
  // Plan prices are compared to the cent, so they keep their cents unless shown in another currency.
  const planPrice = (p: Plan) =>
    !converting || code === p.currency
      ? formatExact(p.priceCents, p.currency)
      : money(p.priceCents, p.currency);

  const providers = useMemo(
    () => [...new Set(plans.map((p) => p.provider))].sort(),
    [plans],
  );
  const shown = useMemo(
    () =>
      plans
        .filter(
          (p) =>
            meetsData(p, minGb) &&
            p.days >= minDays &&
            (!hotspot || p.hotspot === true) &&
            (!provider || p.provider === provider),
        )
        .sort((a, b) => SORTS[sort].key(a) - SORTS[sort].key(b)),
    [plans, minGb, minDays, hotspot, sort, provider],
  );

  return (
    <>
      <DataEstimator
        onApply={(gb, days) => {
          setMinGb(gb ?? UNLIMITED);
          setMinDays(days);
          document
            .getElementById("esim-plans")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <div id="esim-plans" className="mt-5 flex scroll-mt-4 flex-wrap gap-2">
        <select
          aria-label="Data"
          className={selectClass}
          value={minGb}
          onChange={(e) => setMinGb(+e.target.value)}
        >
          {withValue(DATA_OPTIONS, minGb).map((gb) => (
            <option key={gb} value={gb}>
              {dataLabel(gb)}
            </option>
          ))}
        </select>
        <select
          aria-label="Validity"
          className={selectClass}
          value={minDays}
          onChange={(e) => setMinDays(+e.target.value)}
        >
          {withValue(DAY_OPTIONS, minDays).map((d) => (
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
        <label className={`${selectClass} flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={hotspot}
            onChange={(e) => setHotspot(e.target.checked)}
          />
          Hotspot allowed
        </label>
        <span className="self-center text-sm text-muted">
          {shown.length} plans
        </span>
      </div>

      <ul className="mt-4 divide-y divide-line rounded-2xl border border-line bg-card">
        {(all ? shown : shown.slice(0, PREVIEW)).map((p) => {
          const perGb = pricePerGb(p);
          return (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4"
            >
              <div className="min-w-40 flex-1">
                <p className="font-medium">{p.provider}</p>
                <p className="text-xs text-muted">
                  {[
                    p.network,
                    p.speed,
                    p.hotspot === true
                      ? "Hotspot OK"
                      : p.hotspot === false
                        ? "No hotspot"
                        : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || p.name}
                </p>
                {p.notes && <p className="text-xs text-muted">{p.notes}</p>}
              </div>
              <div className="w-24">
                <p className="font-semibold tabular-nums">
                  {formatData(p.dataMb)}
                </p>
                <p className="text-xs text-muted">{p.days} days</p>
              </div>
              <div className="w-24 text-right">
                <p className="font-semibold tabular-nums">{planPrice(p)}</p>
                <p className="text-xs text-muted tabular-nums">
                  {perGb === null
                    ? `${money(Math.round(p.priceCents / p.days), p.currency)}/day`
                    : `${money(Math.round(perGb), p.currency)}/GB`}
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
        {shown.length === 0 && (
          <li className="p-4 text-sm text-muted">
            No plans match these filters.
          </li>
        )}
      </ul>
      {!all && shown.length > PREVIEW && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setAll(true)}
            className="rounded-full border border-line-strong bg-card px-4 py-2 text-sm font-medium hover:border-accent"
          >
            Show all {shown.length} plans
          </button>
        </div>
      )}
    </>
  );
}
