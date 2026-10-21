import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CloudRain, Sun, Users } from "lucide-react";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { bestMonths, crowdLabel, monthNames, rateMonth, ratingLabel, type Rating } from "@/lib/seasons";

const ratingStyle: Record<Rating, { bar: string; badge: string }> = {
  great: { bar: "bg-accent", badge: "bg-accent-soft text-accent" },
  good: { bar: "bg-amber-400", badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  wet: { bar: "bg-sky-500/60", badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
};

const crowdDots = { LOW: 1, MEDIUM: 2, HIGH: 3 } as const;

export async function generateStaticParams() {
  return getDestinationSlugs();
}

export async function generateMetadata({ params }: PageProps<"/destinations/[slug]/when">): Promise<Metadata> {
  const d = await getDestination((await params).slug);
  return d
    ? { title: `Best time to visit ${d.name}`, description: `${d.name} weather and crowds month by month.` }
    : {};
}

export default async function WhenPage({ params }: PageProps<"/destinations/[slug]/when">) {
  const d = await getDestination((await params).slug);
  if (!d) notFound();
  if (d.months.length === 0) return <p className="text-muted">Month-by-month info for {d.name} is coming soon.</p>;

  const best = bestMonths(d.months);
  const maxRain = Math.max(1, ...d.months.map((m) => m.rainMm ?? 0));

  return (
    <>
      <h2 className="text-xl font-semibold">Best time to visit {d.name}</h2>
      {best && (
        <p className="mt-1 flex items-center gap-2 text-muted">
          <Sun className="size-4 text-accent" aria-hidden /> Best months:{" "}
          <strong className="text-foreground">{best}</strong>
        </p>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-card p-4 sm:p-6">
        <div className="grid grid-cols-12 gap-1 sm:gap-2" role="img" aria-label="Rainfall and crowds by month">
          {d.months.map((m) => {
            const rating = rateMonth(m);
            return (
              <div key={m.month} className="flex flex-col items-center">
                <span className="hidden text-[10px] tabular-nums text-muted sm:block">{m.rainMm ?? "–"}</span>
                <div className="flex h-28 w-full items-end sm:h-36">
                  <div
                    className={`w-full rounded-t-md ${ratingStyle[rating].bar}`}
                    style={{ height: `${Math.max(4, ((m.rainMm ?? 0) / maxRain) * 100)}%` }}
                    title={`${monthNames[m.month - 1]}: ${m.rainMm ?? "?"} mm rain`}
                  />
                </div>
                <span className="mt-1 text-xs font-medium sm:hidden">{monthNames[m.month - 1].slice(0, 1)}</span>
                <span className="mt-1 hidden text-xs font-medium sm:block">{monthNames[m.month - 1]}</span>
                {m.highC !== null && <span className="text-[10px] tabular-nums text-muted sm:text-xs">{m.highC}°</span>}
                {m.crowd && (
                  <span className="mt-1 flex gap-0.5" title={`Crowds: ${crowdLabel[m.crowd]}`}>
                    {[1, 2, 3].map((n) => (
                      <span
                        key={n}
                        className={`size-1 rounded-full sm:size-1.5 ${n <= crowdDots[m.crowd!] ? "bg-foreground" : "bg-line"}`}
                      />
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {(Object.keys(ratingStyle) as Rating[]).map((r) => (
            <li key={r} className="flex items-center gap-1.5">
              <span className={`size-2.5 rounded-sm ${ratingStyle[r].bar}`} /> {ratingLabel[r]}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <CloudRain className="size-3.5" aria-hidden /> Bar height = rainfall
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden /> Dots = crowds
          </li>
        </ul>
      </div>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {d.months.map((m) => {
          const rating = rateMonth(m);
          return (
            <li key={m.month} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{monthNames[m.month - 1]}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ratingStyle[rating].badge}`}>
                  {ratingLabel[rating]}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {[
                  m.highC !== null && `${m.highC}°${m.lowC !== null ? ` / ${m.lowC}°C` : "C"}`,
                  m.rainMm !== null && `${m.rainMm} mm rain`,
                  m.crowd && crowdLabel[m.crowd],
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {m.note && <p className="mt-2 text-sm">{m.note}</p>}
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs text-muted">
        Typical averages, not a forecast.
        {d.climateSourceUrl && (
          <>
            {" "}
            Weather:{" "}
            <a href={d.climateSourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              {new URL(d.climateSourceUrl).hostname.replace(/^www\./, "")}
            </a>
            .
          </>
        )}
      </p>
    </>
  );
}
