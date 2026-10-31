"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
export type AboutPhoto = { src: string; alt: string; caption: string; wide: boolean; focus?: string };

// Two portrait slots over two landscape ones. A photo only goes in a slot of its own shape, so nothing is cropped
// sideways into the wrong orientation.
const SLOTS = [
  { wide: false, shape: "aspect-[3/4]" },
  { wide: false, shape: "aspect-[3/4]" },
  { wide: true, shape: "aspect-[4/3]" },
  { wide: true, shape: "aspect-[4/3]" },
];
const EVERY_MS = 5000;

type Slot = { now: number; before: number | null };

function firstSlots(photos: AboutPhoto[]): Slot[] {
  const used = new Set<number>();
  return SLOTS.map(({ wide }) => {
    const n = photos.findIndex((p, i) => !used.has(i) && !!p.wide === wide);
    used.add(n);
    return { now: n, before: null };
  });
}

/**
 * Four photo slots. With more photos than slots, one slot at a time cross-fades to an unseen photo of the same shape,
 * round the slots in turn. The next photo is loaded before it fades in, and the old one stays underneath until it
 * has, so there is never a blank flash. Holds still on hover and for people who prefer reduced motion.
 */
export function AboutPhotos({ photos, className = "" }: { photos: AboutPhoto[]; className?: string }) {
  const [slots, setSlots] = useState(() => firstSlots(photos));
  const [paused, setPaused] = useState(false);
  // What's on screen now, for the timer to read without restarting on every swap.
  const shown = useRef(slots);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    shown.current = slots;
  }, [slots]);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let turn = 0;
    let live = true;
    const id = setInterval(() => {
      // The page has a phone copy and a desktop copy; the hidden one doesn't fetch photos nobody sees.
      if (!box.current?.offsetParent) return;
      const s = turn;
      turn = (turn + 1) % SLOTS.length;
      const showing = shown.current.map((x) => x.now);
      const unseen = photos
        .map((p, i) => ({ p, i }))
        .filter(({ p, i }) => !!p.wide === SLOTS[s].wide && !showing.includes(i))
        .map(({ i }) => i);
      if (!unseen.length) return;
      const n = unseen[Math.floor(Math.random() * unseen.length)];
      const img = new window.Image();
      img.src = photos[n].src;
      img
        .decode()
        .catch(() => {})
        .then(() => {
          if (live) setSlots((cur) => cur.map((x, i) => (i === s ? { now: n, before: x.now } : x)));
        });
    }, EVERY_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [photos, paused]);

  return (
    <div
      ref={box}
      className={`grid grid-cols-2 gap-3 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slots.map(({ now, before }, s) => {
        const p = photos[now];
        if (!p) return null;
        return (
          <figure key={s} className={`relative overflow-hidden rounded-2xl bg-line ${SLOTS[s].shape}`}>
            {before !== null && (
              <Image
                key={photos[before].src}
                src={photos[before].src}
                alt={photos[before].alt}
                fill
                sizes="(min-width: 1024px) 280px, 50vw"
                className="object-cover"
                style={photos[before].focus ? { objectPosition: photos[before].focus } : undefined}
              />
            )}
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 1024px) 280px, 50vw"
              className={`object-cover ${before !== null ? "crossfade" : ""}`}
              style={p.focus ? { objectPosition: p.focus } : undefined}
            />
            <figcaption
              key={`${p.src}-caption`}
              className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white ${before !== null ? "crossfade" : ""}`}
            >
              {p.caption}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
