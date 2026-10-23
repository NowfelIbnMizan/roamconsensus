import { cacheLife, cacheTag } from "next/cache";

export type Weather = {
  now: { tempC: number; feelsC: number; main: string; description: string; humidity: number };
  days: { date: string; minC: number; maxC: number; main: string; rainChance: number }[];
};

type Current = {
  main: { temp: number; feels_like: number; humidity: number };
  weather?: { main: string; description: string }[];
};

type Forecast = {
  city: { timezone: number };
  list: { dt: number; main: { temp_min: number; temp_max: number }; weather: { main: string }[]; pop: number }[];
};

/**
 * Current weather and a 5-day outlook from OpenWeather's free API, cached for an hour per spot.
 * Null without OPENWEATHER_API_KEY or when the API fails, so the box simply hides.
 */
export async function getWeather(lat: number, lng: number): Promise<Weather | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("weather");
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return null;
  const q = `lat=${lat.toFixed(3)}&lon=${lng.toFixed(3)}&units=metric&appid=${key}`;
  const get = <T>(path: string): Promise<T | null> =>
    fetch(`https://api.openweathermap.org/data/2.5/${path}?${q}`, { signal: AbortSignal.timeout(5000) })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
  const [current, forecast] = await Promise.all([get<Current>("weather"), get<Forecast>("forecast")]);
  if (!current?.main || !forecast?.list) return null;

  // Group the 3-hourly forecast by local date; the condition shown is the one nearest midday.
  const byDate = new Map<string, Forecast["list"]>();
  for (const f of forecast.list) {
    const date = new Date((f.dt + forecast.city.timezone) * 1000).toISOString().slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), f]);
  }
  const hour = (f: Forecast["list"][number]) => new Date((f.dt + forecast.city.timezone) * 1000).getUTCHours();
  const days = [...byDate]
    .filter(([, fs]) => fs.length >= 4) // skip a partial last day
    .slice(0, 5)
    .map(([date, fs]) => ({
      date,
      minC: Math.round(Math.min(...fs.map((f) => f.main.temp_min))),
      maxC: Math.round(Math.max(...fs.map((f) => f.main.temp_max))),
      main: [...fs].sort((a, b) => Math.abs(hour(a) - 13) - Math.abs(hour(b) - 13))[0].weather[0]?.main ?? "Clouds",
      rainChance: Math.round(Math.max(...fs.map((f) => f.pop)) * 100),
    }));

  return {
    now: {
      tempC: Math.round(current.main.temp),
      feelsC: Math.round(current.main.feels_like),
      main: current.weather?.[0]?.main ?? "Clouds",
      description: current.weather?.[0]?.description ?? "",
      humidity: current.main.humidity,
    },
    days,
  };
}
