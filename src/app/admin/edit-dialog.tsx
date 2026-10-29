"use client";

import { Pencil, Plus, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * An Edit (or Add) button that opens its form in a pop-up. Saving closes the pop-up; the page refreshes behind it
 * with the change. The form inside is a normal server-action form, so nothing changes about how saving works.
 */
export function EditDialog({
  title,
  subtitle,
  label = "Edit",
  add,
  floating,
  openId,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  label?: string;
  /** Show a filled "Add" button instead of the small Edit chip. */
  add?: boolean;
  /** Sit on top of a photo card. */
  floating?: boolean;
  /** Opens by itself when the address has ?edit=<openId> (links from City health). */
  openId?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const url = new URL(location.href);
    if (!openId || url.searchParams.get("edit") !== openId) return;
    // After the tabs have switched to the right panel, or the pop-up opens inside a hidden one.
    const t = setTimeout(() => {
      ref.current?.showModal();
      url.searchParams.delete("edit");
      history.replaceState(null, "", url);
    }, 50);
    return () => clearTimeout(t);
  }, [openId]);
  const Icon = add || label.startsWith("Add") ? Plus : Pencil;
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className={
          add
            ? "inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background"
            : `inline-flex items-center gap-1 rounded-full border border-line bg-card px-2.5 py-1 text-xs font-medium shadow-sm hover:border-accent ${floating ? "absolute right-2 top-2 z-10" : ""}`
        }
      >
        <Icon className={add ? "size-4" : "size-3"} aria-hidden />
        {label}
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        // Saving submits the form, then closes; the action still runs and the page refreshes.
        onSubmit={(e) => {
          if (!e.defaultPrevented) setTimeout(() => ref.current?.close());
        }}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close();
        }}
        className="m-auto max-h-[85vh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-line bg-card p-5 text-foreground shadow-2xl backdrop:bg-foreground/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">{title}</h2>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Close" className="text-muted hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </dialog>
    </>
  );
}
