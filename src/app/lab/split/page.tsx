import { TripMap } from "@/components/trip-map";
import { DriveSummary } from "@/components/road-time";
import { dayColor } from "@/lib/map";
import { Head, load, Stop } from "../shared-route";

export default async function Split() {
  const l = await load();
  return (
    <>
      <Head l={l} />
      <nav className="sticky top-0 z-[500] -mx-4 mt-6 flex gap-2 overflow-x-auto bg-background/95 px-4 py-2 backdrop-blur [scrollbar-width:none]">
        {l.it.schedule.map(({ day }, index) => (
          <a
            key={day}
            href={`#day-${day}`}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-sm"
          >
            <span className="size-2 rounded-full" style={{ background: dayColor(index) }} />
            Day {day}
          </a>
        ))}
      </nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-16">
            <TripMap stops={l.stops} groups={l.groups} connect />
          </div>
        </div>
        <div className="min-w-0 space-y-8">
          {l.it.schedule.map(({ day, items }, index) => (
            <section key={day} id={`day-${day}`} className="scroll-mt-16">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <span className="size-2.5 rounded-full" style={{ background: dayColor(index) }} />
                Day {day} <DriveSummary minutes={l.drive.get(day) ?? 0} />
              </h2>
              <ul className="mt-2 divide-y divide-line">
                {items
                  .filter((i) => i.sentiment !== "AVOID")
                  .map((i) => (
                    <Stop key={i.id} l={l} i={i} color={dayColor(index)} />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
