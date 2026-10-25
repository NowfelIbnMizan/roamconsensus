"use client";

import { useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * A route stop's row that opens its full details (note, price source, coupon, booking) in a dialog: a bottom sheet on
 * a phone, a centred card on a wider screen. The row stays one compact line; everything else waits for a tap.
 */
export function StopDetails({
  label,
  row,
  children,
  className = "flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-line/40 focus-visible:outline-2 focus-visible:outline-accent",
}: {
  label: string;
  row: ReactNode;
  children: ReactNode;
  /** The trigger's classes; a plain row by default. */
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={`${label}: details`}
        className={className}
      >
        {row}
      </button>
      <dialog
        ref={dialog}
        aria-label={label}
        // A click on the backdrop lands on the dialog itself, not on its content.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="m-0 mt-auto w-full max-w-none rounded-t-3xl border border-line bg-card p-0 text-foreground shadow-xl backdrop:bg-black/40 sm:m-auto sm:max-w-md sm:rounded-3xl"
      >
        <div className="relative max-h-[80vh] overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <span
            aria-hidden
            className="mx-auto mb-4 block h-1 w-10 rounded-full bg-line sm:hidden"
          />
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Close"
            className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full text-muted hover:bg-line"
          >
            <X className="size-4" aria-hidden />
          </button>
          {children}
        </div>
      </dialog>
    </>
  );
}
