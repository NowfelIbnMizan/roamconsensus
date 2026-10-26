"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type AboutPhoto = { src: string; alt: string; caption: string };

// Slot shapes: one tall, two small, one wide. Any photo fills any slot (object-cover).
const SLOTS = ["row-span-2", "aspect-[4/3]", "aspect-[4/3]", "col-span-2 aspect-[16/9]"];
const EVERY_MS = 4000;

/**
 * Four photo slots. With more photos than slots, one slot swaps to an unseen photo every few seconds, round the
 * slots in turn. Holds still on hover and for people who prefer reduced motion.
 */
export function AboutPhotos({ photos, className = "" }: { photos: AboutPhoto[]; className?: string }) {
  const [shown, setShown] = useState(() => photos.slice(0, SLOTS.length).map((_, i) => i));
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (photos.length <= SLOTS.length || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let slot = 0;
    const id = setInterval(() => {
      const s = slot;
      slot = (slot + 1) % SLOTS.length;
      setShown((cur) => {
        const unseen = photos.map((_, i) => i).filter((i) => !cur.includes(i));
        const next = [...cur];
        next[s] = unseen[Math.floor(Math.random() * unseen.length)];
        return next;
      });
    }, EVERY_MS);
    return () => clearInterval(id);
  }, [photos, paused]);

  return (
    <div
      className={`grid grid-cols-2 gap-3 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {shown.map((n, slot) => {
        const p = photos[n];
        return (
          <figure key={slot} className={`relative overflow-hidden rounded-2xl bg-line ${SLOTS[slot]}`}>
            <Image
              key={p.src}
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 1024px) 560px, 50vw"
              className="fade-in object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pt-6 pb-2 text-xs font-medium text-white">
              {p.caption}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
