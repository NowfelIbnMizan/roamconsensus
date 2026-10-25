"use client";

import { useLayoutEffect, useRef, useState } from "react";

const clamp = {
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
} as const;

/** Text cut to a few lines, with "Read more" only when something is actually hidden. */
export function ReadMore({
  text,
  lines = 2,
  className = "",
}: {
  text: string;
  lines?: keyof typeof clamp;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    const check = () => setCut(el.scrollHeight > el.clientHeight + 1);
    check();
    // Width changes (rotating a phone) change where the text wraps.
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, text]);

  return (
    <div className={className}>
      <p ref={ref} className={`text-sm text-muted ${open ? "" : clamp[lines]}`}>
        {text}
      </p>
      {(cut || open) && (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="relative mt-0.5 text-xs font-medium text-accent hover:underline"
        >
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
