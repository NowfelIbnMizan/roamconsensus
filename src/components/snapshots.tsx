import Image from "next/image";
import { optimized } from "@/components/thumb";

export type Snapshot = {
  id: string;
  url: string;
  caption: string;
  label?: string;
  href?: string;
};

/** A swipeable row of captioned photos: the trip at a glance before the day-by-day list. */
export function Snapshots({ shots, className = "" }: { shots: Snapshot[]; className?: string }) {
  if (shots.length < 2) return null;
  return (
    <div
      className={`-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pt-1 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-1 ${className}`}
    >
      {shots.slice(0, 12).map((s) => {
        const card = (
          <>
            <div className="relative aspect-[4/5] w-36 bg-line sm:w-44">
              <Image
                src={s.url}
                alt={s.caption}
                fill
                sizes="176px"
                unoptimized={!optimized(s.url)}
                className="object-cover"
              />
            </div>
            <p className="w-36 truncate px-2.5 py-2 text-sm font-medium sm:w-44">{s.caption}</p>
            {s.label && <span className="sr-only">{s.label}</span>}
          </>
        );
        return (
          <figure key={s.id} className="polaroid shrink-0 snap-start">
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
