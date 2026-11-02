import { AlertTriangle, Car, Plane } from "lucide-react";
import { formatMinutes, hopMode, PACKED_MINUTES, type Leg } from "@/lib/map";

/** "~35 min drive from the last stop", under a stop's name. */
export function LegHint({ leg }: { leg?: Leg }) {
  if (!leg) return null;
  if (leg.far)
    return (
      <p className="mt-0.5 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
        <Plane className="size-3" aria-hidden />
        {leg.km.toLocaleString("en-US")} km from the last stop: {hopMode(leg.km).text}. Give it its own day.
      </p>
    );
  return (
    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
      <Car className="size-3" aria-hidden />
      {leg.minutes === 0 ? "Same spot as the last stop" : `~${formatMinutes(leg.minutes)} drive from the last stop`}
      {leg.km > 0 && ` · ${leg.km} km`}
    </p>
  );
}

/** Day header note: total time on the road, flagged when the day is packed or mixes cities. */
export function DriveSummary({
  minutes,
  far = 0,
  flight = false,
}: {
  minutes: number;
  far?: number;
  flight?: boolean;
}) {
  if (far > 0)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
        {flight ? <Plane className="size-3" aria-hidden /> : <AlertTriangle className="size-3" aria-hidden />}
        {flight ? "Needs a flight: stops in different cities" : "Long transfer: stops in different cities"}
      </span>
    );
  if (minutes === 0) return null;
  const packed = minutes >= PACKED_MINUTES;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        packed ? "bg-amber-500/15 font-medium text-amber-700 dark:text-amber-300" : "bg-line text-muted"
      }`}
      title="Estimated from straight-line distance and typical traffic. Check Google Maps for the real time."
    >
      {packed ? <AlertTriangle className="size-3" aria-hidden /> : <Car className="size-3" aria-hidden />}
      {packed ? `Packed day: ~${formatMinutes(minutes)} on the road` : `~${formatMinutes(minutes)} on the road`}
    </span>
  );
}
