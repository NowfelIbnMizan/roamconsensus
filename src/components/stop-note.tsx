"use client";

import { useState } from "react";
import { NotebookPen } from "lucide-react";
import { useCart } from "@/lib/cart-store";

/** The traveller's own note on a cart stop, in handwriting. Editable in the cart; read-only elsewhere. */
export function StopNote({ id, note, editable = true }: { id: string; note?: string; editable?: boolean }) {
  const setNote = useCart((s) => s.setNote);
  const [draft, setDraft] = useState<string | null>(null);

  if (draft !== null)
    return (
      <form
        className="mt-2 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setNote(id, draft);
          setDraft(null);
        }}
      >
        <label htmlFor={`note-${id}`} className="sr-only">
          Note
        </label>
        <textarea
          id={`note-${id}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && setDraft(null)}
          maxLength={500}
          rows={2}
          autoFocus
          placeholder="Book a week ahead, go at sunrise…"
          className="w-full rounded-lg border border-line bg-background px-3 py-2 text-sm placeholder:text-muted"
        />
        <div className="flex gap-2">
          <button type="submit" className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-background">
            Save note
          </button>
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="rounded-full border border-line px-3 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      </form>
    );

  if (note)
    return (
      <p className="mt-1 flex items-start gap-1.5 font-hand text-lg leading-snug text-accent-2">
        <NotebookPen className="mt-1 size-3.5 shrink-0" aria-hidden />
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {note}
          {editable && (
            <button
              type="button"
              onClick={() => setDraft(note)}
              className="ml-2 font-sans text-xs text-muted underline hover:text-foreground"
            >
              Edit
            </button>
          )}
        </span>
      </p>
    );

  if (!editable) return null;
  return (
    <button
      type="button"
      onClick={() => setDraft("")}
      className="mt-1 inline-flex items-center gap-1 text-xs text-muted hover:text-foreground"
    >
      <NotebookPen className="size-3" aria-hidden /> Add note
    </button>
  );
}
