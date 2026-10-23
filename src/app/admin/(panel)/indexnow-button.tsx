"use client";

import { useActionState } from "react";
import { submitAllToIndexNow } from "@/lib/admin/actions";

export function IndexNowButton() {
  const [message, action, pending] = useActionState(submitAllToIndexNow, null);
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-3">
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Sending…" : "Tell Bing about every page"}
      </button>
      {message && <p className="text-sm text-muted">{message}</p>}
    </form>
  );
}
