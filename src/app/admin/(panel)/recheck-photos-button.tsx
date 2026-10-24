"use client";

import { useActionState } from "react";
import { recheckPhotos } from "@/lib/admin/actions";

export function RecheckPhotosButton() {
  const [message, action, pending] = useActionState(recheckPhotos, null);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Checking…" : "Re-check photos"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
