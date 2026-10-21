"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";

// Rough MB per hour; sources: jetpacglobal.com and finder.com.au data usage guides.
const ACTIVITIES = [
  { key: "maps", label: "Maps & ride apps", mbPerHour: 5, hours: 2 },
  { key: "messaging", label: "WhatsApp & browsing", mbPerHour: 60, hours: 2 },
  { key: "social", label: "Instagram & TikTok", mbPerHour: 700, hours: 1 },
  { key: "calls", label: "Video calls & Zoom", mbPerHour: 350, hours: 0 },
  { key: "streaming", label: "HD streaming", mbPerHour: 3000, hours: 0 },
] as const;

type Key = (typeof ACTIVITIES)[number]["key"];

/** Suggests a data allowance from daily habits; `onApply` passes GB (null = unlimited) and trip length. */
export function DataEstimator({ onApply }: { onApply: (gb: number | null, days: number) => void }) {
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState<Record<Key, number>>(
    Object.fromEntries(ACTIVITIES.map((a) => [a.key, a.hours])) as Record<Key, number>,
  );

  // 15% buffer for app updates and background sync.
  const gb = (ACTIVITIES.reduce((s, a) => s + a.mbPerHour * hours[a.key], 0) * days * 1.15) / 1024;
  const unlimited = gb > 20;
  const suggestion = unlimited ? "an unlimited plan" : `about ${Math.max(1, Math.ceil(gb))} GB`;

  return (
    <details className="group mt-5 rounded-2xl border border-line bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-medium">
        <Calculator className="size-4 text-accent" aria-hidden />
        How much data do I need?
        <span className="ml-auto text-sm font-normal text-muted group-open:hidden">Estimate</span>
      </summary>
      <div className="border-t border-line p-4">
        <label className="flex items-center justify-between gap-4 text-sm">
          Trip length (days)
          <input
            type="number"
            min={1}
            max={90}
            value={days}
            onChange={(e) => setDays(Math.min(90, Math.max(1, +e.target.value || 1)))}
            className="w-20 rounded-lg border border-line bg-background px-2 py-1 text-right tabular-nums"
          />
        </label>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">Hours per day</p>
        <ul className="mt-2 space-y-3">
          {ACTIVITIES.map((a) => (
            <li key={a.key}>
              <label className="flex items-center gap-3 text-sm">
                <span className="w-40 shrink-0">{a.label}</span>
                <input
                  type="range"
                  min={0}
                  max={8}
                  step={0.5}
                  value={hours[a.key]}
                  onChange={(e) => setHours({ ...hours, [a.key]: +e.target.value })}
                  className="min-w-0 flex-1 accent-[var(--accent)]"
                />
                <span className="w-10 text-right tabular-nums text-muted">{hours[a.key]}h</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-soft px-4 py-3">
          <p className="text-sm">
            You&apos;ll want <strong>{suggestion}</strong> for {days} days.
          </p>
          <button
            type="button"
            onClick={() => onApply(unlimited ? null : Math.ceil(gb), days)}
            className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-background"
          >
            Show matching plans
          </button>
        </div>
      </div>
    </details>
  );
}
