"use client";

import { useEffect, useState } from "react";
import { Check, ExternalLink } from "lucide-react";

type Tip = { id: string; title: string; body: string; sourceUrl: string | null };

export function Checklist({ slug, topics }: { slug: string; topics: { topic: string; tips: Tip[] }[] }) {
  const key = `roamconsensus-checklist:${slug}`;
  const [done, setDone] = useState<Set<string>>(new Set());
  const total = topics.reduce((n, t) => n + t.tips.length, 0);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage only exists after mount
      setDone(new Set(JSON.parse(localStorage.getItem(key) ?? "[]")));
    } catch {}
  }, [key]);

  function toggle(id: string) {
    const next = new Set(done);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {}
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-accent transition-all" style={{ width: `${(done.size / total) * 100}%` }} />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {done.size}/{total} done
        </span>
      </div>
      <div className="mt-6 space-y-6">
        {topics.map(({ topic, tips }) => (
          <section key={topic}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">{topic}</h3>
            <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
              {tips.map((t) => {
                const checked = done.has(t.id);
                return (
                  <li key={t.id} className="flex gap-3 p-4">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={t.title}
                      onClick={() => toggle(t.id)}
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border ${
                        checked ? "border-accent bg-accent text-background" : "border-line"
                      }`}
                    >
                      {checked && <Check className="size-3.5" aria-hidden />}
                    </button>
                    <div className={checked ? "opacity-60" : ""}>
                      <p className={`font-medium ${checked ? "line-through" : ""}`}>{t.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{t.body}</p>
                      {t.sourceUrl && (
                        <a
                          href={t.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                        >
                          Official site · {new URL(t.sourceUrl).hostname}{" "}
                          <ExternalLink className="size-3" aria-hidden />
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
