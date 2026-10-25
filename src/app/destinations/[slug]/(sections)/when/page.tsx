import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Sun } from "lucide-react";
import { getDestination, getDestinationSlugs } from "@/lib/data";
import { WeatherCard } from "@/components/weather-card";
import { getWeather } from "@/lib/weather";
import { rainyDayPicks } from "@/lib/indoor";
import { placeHref } from "@/lib/place";
import { bestMonths } from "@/lib/seasons";
import { MonthPicker } from "./month-picker";

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
  const weather = d.center ? await getWeather(d.center.lat, d.center.lng) : null;
  const card = weather && (
    <WeatherCard
      name={d.name}
      weather={weather}
      rainyPicks={rainyDayPicks(d.consensus, 4).map((p) => ({ name: p.name, href: placeHref(d.slug, p.slug) }))}
    />
  );
  if (d.months.length === 0)
    return (
      <>
        {card}
        <p className="text-muted">Month-by-month info for {d.name} is coming soon.</p>
      </>
    );

  const best = bestMonths(d.months);

  return (
    <>
      {card}
      <h2 className="text-xl font-semibold">Best time to visit {d.name}</h2>
      {best && (
        <p className="mt-1 flex items-center gap-2 text-muted">
          <Sun className="size-4 text-accent" aria-hidden /> Best months:{" "}
          <strong className="text-foreground">{best}</strong>
        </p>
      )}

      <MonthPicker months={d.months} name={d.name} slug={d.slug} />

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
