import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, Snowflake, Sun } from "lucide-react";
import Link from "next/link";
import type { Weather } from "@/lib/weather";

const icons: Record<string, typeof Sun> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: Snowflake,
};
const Icon = ({ main, className }: { main: string; className: string }) => {
  const I = icons[main] ?? CloudFog;
  return <I className={className} aria-label={main} />;
};
const f = (c: number) => Math.round((c * 9) / 5 + 32);
const weekday = (date: string) =>
  new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/** Weather now and the next five days, for travellers already there or about to fly. */
export function WeatherCard({
  name,
  weather,
  rainyPicks = [],
}: {
  name: string;
  weather: Weather;
  /** Indoor backups, shown when rain is likely in the next few days. */
  rainyPicks?: { name: string; href: string }[];
}) {
  const { now, days } = weather;
  const rainSoon = ["Rain", "Thunderstorm", "Drizzle"].includes(now.main) || days.some((d) => d.rainChance >= 60);
  return (
    <section className="mb-8 rounded-2xl border border-line bg-card p-4" aria-label={`Weather in ${name}`}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <Icon main={now.main} className="size-10 text-accent" />
          <div>
            <p className="text-xs text-muted">{name} right now</p>
            <p className="text-2xl font-semibold tabular-nums">
              {now.tempC}°C <span className="text-base font-normal text-muted">/ {f(now.tempC)}°F</span>
            </p>
            <p className="text-xs capitalize text-muted">
              {now.description} · feels {now.feelsC}° · {now.humidity}% humidity
            </p>
          </div>
        </div>
        {days.length > 0 && (
          <ol className="flex flex-1 justify-between gap-2 sm:justify-end sm:gap-4">
            {days.map((d) => (
              <li key={d.date} className="flex min-w-11 flex-col items-center text-xs">
                <span className="text-muted">{weekday(d.date)}</span>
                <Icon main={d.main} className="my-1 size-5" />
                <span className="font-medium tabular-nums">{d.maxC}°</span>
                <span className="tabular-nums text-muted">{d.minC}°</span>
                {d.rainChance >= 30 && (
                  <span className="text-[10px] text-sky-700 dark:text-sky-400">{d.rainChance}%</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      {rainSoon && rainyPicks.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="font-medium">Rain in the forecast? Indoor picks: </span>
          {rainyPicks.map((p, i) => (
            <span key={p.href}>
              {i > 0 && ", "}
              <Link href={p.href} className="text-accent hover:underline">
                {p.name}
              </Link>
            </span>
          ))}
        </p>
      )}
      <p className="mt-2 text-xs text-muted">
        Forecast by{" "}
        <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer" className="underline">
          OpenWeather
        </a>
        , updated hourly.
      </p>
    </section>
  );
}
