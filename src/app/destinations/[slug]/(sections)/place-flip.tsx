"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";

/**
 * A place card's photo that turns into its description: on hover with a mouse, on tab with a keyboard, and on tap
 * on a phone (tap again to turn it back). Tailwind's hover only fires on devices that can hover, so a tap doesn't
 * leave it stuck open.
 */
export function PlaceFlip({
  name,
  about,
  children,
}: {
  name: string;
  about: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      data-open={open || undefined}
      className="group/flip relative overflow-hidden rounded-2xl"
    >
      {children}
      <button
        type="button"
        aria-expanded={open}
        aria-label={`About ${name}`}
        onClick={() => setOpen(!open)}
        className="absolute inset-0 z-[1] cursor-pointer rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-2 left-2 z-[1] flex size-6 items-center justify-center rounded-full bg-black/45 text-white transition group-data-open/flip:opacity-0 [@media(hover:hover)]:hidden"
      >
        <Info className="size-3.5" />
      </span>
      <div className="pointer-events-none absolute inset-0 z-[2] flex translate-y-2 flex-col justify-end bg-black/75 p-3 text-xs leading-relaxed text-white opacity-0 transition duration-200 group-hover/flip:translate-y-0 group-hover/flip:opacity-100 group-has-focus-visible/flip:translate-y-0 group-has-focus-visible/flip:opacity-100 group-data-open/flip:translate-y-0 group-data-open/flip:opacity-100 sm:text-sm">
        {about}
      </div>
    </div>
  );
}
