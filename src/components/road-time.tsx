import { AlertTriangle, Car } from "lucide-react";
import { formatMinutes, PACKED_MINUTES } from "@/lib/map";

/** "~35 min drive from the last stop", under a stop's name. */
export function LegHint({ leg }: { leg?: { km: number; minutes: number } }) {
  if (!leg) return null;
  return (
    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
      <Car className="size-3" aria-hidden />
      {leg.minutes === 0 ? "Same spot as the last stop" : `~${formatMinutes(leg.minutes)} drive from the last stop`}
      {leg.km > 0 && ` · ${leg.km} km`}
    </p>
  );
}

/** Day header note: total time on the road, flagged when the day is packed. */
export function DriveSummary({ minutes }: { minutes: number }) {
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
