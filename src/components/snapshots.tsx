import Image from "next/image";
import { optimized } from "@/components/thumb";

const tilts = ["-rotate-2", "rotate-1", "-rotate-1", "rotate-2"];

export type Snapshot = { id: string; url: string; caption: string; label?: string; href?: string };

/** A swipeable row of taped polaroids: the trip at a glance before the day-by-day list. */
export function Snapshots({ shots, className = "" }: { shots: Snapshot[]; className?: string }) {
  if (shots.length < 2) return null;
  return (
    <div
      className={`-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pt-4 pb-5 [scrollbar-width:none] sm:mx-0 sm:px-1 ${className}`}
    >
      {shots.slice(0, 12).map((s, n) => {
        const card = (
          <>
            <div className="relative aspect-[4/5] w-36 overflow-hidden bg-line sm:w-44">
              <Image
                src={s.url}
                alt={s.caption}
                fill
                sizes="176px"
                unoptimized={!optimized(s.url)}
                className="object-cover"
              />
            </div>
            <p className="w-36 truncate py-1.5 text-center font-hand text-lg leading-tight sm:w-44">{s.caption}</p>
            {s.label && <span className="sr-only">{s.label}</span>}
          </>
        );
        return (
          <figure
            key={s.id}
            className={`polaroid ${n % 2 ? "tape tape-alt" : "tape"} shrink-0 snap-start ${tilts[n % tilts.length]}`}
          >
            {s.href ? <a href={s.href}>{card}</a> : card}
          </figure>
        );
      })}
    </div>
  );
}

/** Up to four overlapping round photos, a quick preview of a day. */
export function DayFaces({ urls }: { urls: string[] }) {
  if (!urls.length) return null;
  return (
    <span className="flex -space-x-2.5" aria-hidden>
      {urls.slice(0, 4).map((url, n) => (
        <span key={n} className="relative size-8 overflow-hidden rounded-full bg-line ring-2 ring-background">
          <Image src={url} alt="" fill sizes="32px" unoptimized={!optimized(url)} className="object-cover" />
        </span>
      ))}
    </span>
  );
}
