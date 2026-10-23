"use client";

import { useActionState } from "react";
import { Mail } from "lucide-react";
import { subscribe, type SubscribeState } from "@/lib/subscribe";

/** Email box for the footer list, or for emailing yourself the trip plan (pass tripPath). */
export function EmailSignup({ tripPath, label, button }: { tripPath?: string; label: string; button: string }) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);
  return (
    <form action={action} className="w-full">
      <label className="block text-sm font-medium" htmlFor={tripPath ? "trip-email" : "list-email"}>
        {label}
      </label>
      <input type="hidden" name="source" value={tripPath ? "trip" : "footer"} />
      {tripPath && <input type="hidden" name="tripPath" value={tripPath} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="mt-1.5 flex gap-2">
        <input
          id={tripPath ? "trip-email" : "list-email"}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          <Mail className="size-4" aria-hidden />
          {pending ? "Sending…" : button}
        </button>
      </div>
      {state && (
        <p className={`mt-1.5 text-xs ${state.ok ? "text-accent" : "text-red-600"}`} role="status">
          {state.message}
        </p>
      )}
      <p className="mt-1.5 text-[11px] text-muted">Only Creatour emails. Unsubscribe anytime.</p>
    </form>
  );
}
