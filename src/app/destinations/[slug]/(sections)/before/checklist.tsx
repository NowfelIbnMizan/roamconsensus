"use client";

import { useEffect, useState } from "react";
import {
  Check,
  ChevronDown,
  ExternalLink,
  HandHeart,
  Plane,
} from "lucide-react";
import { StopDetails } from "@/components/stop-details";

type Tip = {
  id: string;
  topic: string;
  title: string;
  body: string;
  sourceUrl: string | null;
};

function useDone(slug: string) {
  const key = `roamconsensus-checklist:${slug}`;
  const [done, setDone] = useState<Set<string>>(new Set());
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after mount
      setDone(new Set(JSON.parse(localStorage.getItem(key) ?? "[]")));
    } catch {}
  }, [key]);
  const toggle = (id: string) => {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {}
  };
  return { done, toggle };
}

function Box({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${checked ? "border-accent bg-accent text-background" : "border-line bg-background"}`}
    >
      {checked && <Check className="size-3.5" aria-hidden />}
    </button>
  );
}

function Official({ url }: { url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
    >
      Official site <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

/** One tip as a title row; the body opens in a sheet. */
function TipRow({
  t,
  done,
  toggle,
}: {
  t: Tip;
  done: Set<string>;
  toggle: (id: string) => void;
}) {
  const checked = done.has(t.id);
  return (
    <li className="flex break-inside-avoid items-center gap-3 py-2.5">
      <Box checked={checked} onClick={() => toggle(t.id)} label={t.title} />
      <StopDetails
        label={t.title}
        row={
          <span
            className={`min-w-0 flex-1 text-left ${checked ? "text-muted line-through" : "font-medium"}`}
          >
            {t.title}
          </span>
        }
      >
        <p className="pr-8 font-display text-xl font-semibold">{t.title}</p>
        <p className="mt-3 text-muted">{t.body}</p>
        <Official url={t.sourceUrl} />
      </StopDetails>
    </li>
  );
}

function Progress({ n, total }: { n: number; total: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className="h-full bg-accent transition-all"
          style={{ width: `${(n / total) * 100}%` }}
        />
      </div>
      <span className="text-sm tabular-nums text-muted">
        {n}/{total} done
      </span>
    </div>
  );
}

const BEFORE = new Set(["Entry", "Health", "Money", "Connectivity", "Packing"]);
const INSURANCE = /insurance/i;
const flyFirst = (t: Tip) => BEFORE.has(t.topic) || INSURANCE.test(t.title);

/** Two lists: what to sort out before the flight, then what to know once there (folded). Ticks are saved on this
 * device. */
export function Checklist({ slug, tips }: { slug: string; tips: Tip[] }) {
  const { done, toggle } = useDone(slug);
  const before = tips.filter(flyFirst);
  const there = tips.filter((t) => !flyFirst(t));
  return (
    <div className="space-y-6">
      <Progress n={done.size} total={tips.length} />
      <section className="rounded-2xl border border-line bg-card p-5">
        <h3 className="flex items-center gap-2 font-semibold">
          <Plane className="size-5 text-accent" aria-hidden /> Sort out before
          you fly
          <span className="text-sm font-normal text-muted">
            · {before.filter((t) => done.has(t.id)).length}/{before.length}
          </span>
        </h3>
        <ul className="mt-2 divide-y divide-line lg:columns-2 lg:gap-x-10">
          {before.map((t) => (
            <TipRow key={t.id} t={t} done={done} toggle={toggle} />
          ))}
        </ul>
      </section>
      <details className="group rounded-2xl border border-line bg-card p-5">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold [&::-webkit-details-marker]:hidden">
          <HandHeart className="size-5 text-accent" aria-hidden /> Once you land
          <span className="text-sm font-normal text-muted">
            · {there.length} tips
          </span>
          <ChevronDown
            className="ml-auto size-5 text-muted transition group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-2 divide-y divide-line lg:columns-2 lg:gap-x-10">
          {there.map((t) => (
            <TipRow key={t.id} t={t} done={done} toggle={toggle} />
          ))}
        </ul>
      </details>
    </div>
  );
}
