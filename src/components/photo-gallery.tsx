"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import type { Photo } from "@/lib/photos";

type Slide = Pick<Photo, "url" | "attribution" | "creditUrl">;

/**
 * Swipeable photos for a place: the main photo (server-rendered, so it shows instantly), then the owner's own photos,
 * then more stock shots fetched once the page is open.
 */
export function PhotoGallery({
  main,
  own,
  alt,
  destination,
  place,
  className = "",
}: {
  main: ReactNode;
  own: string[];
  alt: string;
  destination: string;
  place: string;
  className?: string;
}) {
  const [more, setMore] = useState<Slide[]>([]);
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/photos/gallery?d=${encodeURIComponent(destination)}&p=${encodeURIComponent(place)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMore)
      .catch(() => {});
  }, [destination, place]);

  const slides: Slide[] = [...own.map((url) => ({ url, attribution: null, creditUrl: null })), ...more];
  const total = slides.length + 1;
  const go = (n: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: el.clientWidth * Math.max(0, Math.min(total - 1, n)), behavior: "smooth" });
  };

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="h-full w-full shrink-0 snap-start">{main}</div>
        {slides.map((s, i) => (
          <figure key={s.url} className="relative h-full w-full shrink-0 snap-start bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- owner photos can be on any host */}
            <img src={s.url} alt={`${alt}, photo ${i + 2}`} loading="lazy" className="h-full w-full object-cover" />
            {s.attribution && (
              // A camera badge, like the site's other photos: the credit is its tooltip and link, not text over the photo.
              <a
                href={s.creditUrl ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                title={s.attribution}
                className="absolute right-1.5 bottom-1.5 z-10 flex items-center rounded-full bg-black/35 p-1.5 text-white/90 backdrop-blur-sm hover:bg-black/55"
              >
                <Camera className="size-3" aria-hidden />
                <span className="sr-only">{s.attribution}</span>
              </a>
            )}
          </figure>
        ))}
      </div>
      {total > 1 && (
        <>
          <span className="absolute top-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-xs text-white tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label="Previous photo"
            className="absolute top-1/2 left-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-0 sm:flex"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === total - 1}
            aria-label="Next photo"
            className="absolute top-1/2 right-2 hidden size-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white disabled:opacity-0 sm:flex"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
            {Array.from({ length: total }, (_, i) => (
              <span key={i} className={`size-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
