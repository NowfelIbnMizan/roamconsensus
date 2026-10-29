import Link from "next/link";
import { Check, X } from "lucide-react";
import { cityHealth } from "@/lib/admin/health";

export const metadata = { title: "City health" };

/** Every city against the same checklist, so "finished" means the same thing everywhere. */
export default async function HealthPage() {
  const cities = await cityHealth();
  const total = cities[0]?.checks.length ?? 0;

  return (
    <>
      <h1 className="font-display text-3xl">City health</h1>
      <p className="mt-1 text-sm text-muted">
        Each city against the same {total} checks. Green means done. Open a
        check to see what is still missing and where to fix it.
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cities.map((c) => (
          <li key={c.id}>
            <a
              href={`#${c.slug}`}
              className="block rounded-xl border border-line bg-card p-3 hover:bg-line/40"
            >
              <span className="block font-medium">{c.name}</span>
              <span
                className={`text-sm tabular-nums ${c.passed === total ? "text-emerald-800 dark:text-emerald-300" : "text-muted"}`}
              >
                {c.passed} of {total} done
              </span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-line">
                <span
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${(c.passed / total) * 100}%` }}
                />
              </span>
            </a>
          </li>
        ))}
      </ul>

      {cities.map((c) => (
        <section key={c.id} id={c.slug} className="mt-10 scroll-mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">{c.name}</h2>
            <Link
              href={`/admin/destinations/${c.id}`}
              className="text-sm text-accent underline"
            >
              Edit {c.name}
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
            {c.checks.map((ch) => {
              const ok = ch.done >= ch.total;
              return (
                <li key={ch.label}>
                  <details className="group p-3">
                    <summary
                      className={`flex items-center gap-3 ${ok ? "" : "cursor-pointer"}`}
                    >
                      {ok ? (
                        <Check
                          className="size-5 shrink-0 text-emerald-700 dark:text-emerald-300"
                          aria-label="Done"
                        />
                      ) : (
                        <X
                          className="size-5 shrink-0 text-red-700 dark:text-red-300"
                          aria-label="Not done"
                        />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="font-medium">{ch.label}</span>
                        <span className="block text-xs text-muted">
                          {ch.rule}
                        </span>
                      </span>
                      <span className="text-sm text-muted tabular-nums">
                        {ch.done}/{ch.total}
                      </span>
                    </summary>
                    {ch.missing.length > 0 && (
                      <ul className="mt-2 ml-8 list-disc space-y-0.5 pl-4 text-sm">
                        {ch.missing.slice(0, 60).map((m, i) => (
                          <li key={i}>
                            <Link href={m.href} className="hover:underline">
                              {m.name}
                            </Link>
                          </li>
                        ))}
                        {ch.missing.length > 60 && (
                          <li className="text-muted">
                            and {ch.missing.length - 60} more
                          </li>
                        )}
                      </ul>
                    )}
                  </details>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
