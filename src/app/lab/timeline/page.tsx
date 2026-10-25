import { TripMap } from "@/components/trip-map";
import { DayFold, Head, load } from "../shared-route";

export default async function Timeline() {
  const l = await load();
  return (
    <>
      <Head l={l} />
      <div className="mt-6">
        <TripMap stops={l.stops} groups={l.groups} connect />
      </div>
      <div className="mt-6 space-y-3">
        {l.it.schedule.map((d, index) => (
          <DayFold key={d.day} l={l} index={index} open={index === 0} />
        ))}
      </div>
    </>
  );
}
