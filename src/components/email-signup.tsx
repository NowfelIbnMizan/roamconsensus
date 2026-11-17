"use client";

import { useActionState } from "react";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { subscribe, type SubscribeState } from "@/lib/subscribe";

/**
 * Email box for the footer list, or for emailing yourself the trip plan (pass tripPath). `city` is the city page the
 * visitor signed up on; it is saved with the address so the owner knows which cities people are waiting on.
 */
export function EmailSignup({
  tripPath,
  label,
  button,
  city,
}: {
  tripPath?: string;
  label: string;
  button: string;
  city?: string;
}) {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribe, null);
  return (
    <form action={action} className="w-full">
      <label className="block text-sm font-medium" htmlFor={tripPath ? "trip-email" : "list-email"}>
        {label}
      </label>
      <input type="hidden" name="source" value={tripPath ? "trip" : "footer"} />
      {tripPath && <input type="hidden" name="tripPath" value={tripPath} />}
      {city && <input type="hidden" name="city" value={city} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <div className="mt-1.5 flex gap-2">
        <input
          id={tripPath ? "trip-email" : "list-email"}
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-full border border-line bg-background px-4 py-2 text-sm placeholder:text-muted pointer-coarse:py-3"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-background disabled:opacity-60 pointer-coarse:py-3"
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
      <p className="mt-1.5 text-xs text-muted">Only Creatour emails. Unsubscribe anytime.</p>
    </form>
  );
}

/** The footer box. On a city's pages it names that city, so the ask matches what the visitor is looking at. */
export function FooterSignup({ cities }: { cities: { slug: string; name: string }[] }) {
  const slug = usePathname().match(/^\/destinations\/([^/]+)/)?.[1];
  const city = cities.find((c) => c.slug === slug);
  return (
    <EmailSignup
      // A fresh box per city, so a "You're on the list" note doesn't follow the visitor to the next city.
      key={city?.slug ?? "all"}
      city={city?.slug}
      label={city ? `When ${city.name} gets a new creator route.` : "When we add a city or creator route."}
      button="Sign up"
    />
  );
}
