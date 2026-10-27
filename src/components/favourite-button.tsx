"use client";

import { Heart } from "lucide-react";
import { signInWithGoogle } from "@/lib/auth-client";
import { favouriteKey, useFavourites } from "@/lib/favourites";

/** ♥ on a place. Signed out, it opens Google sign-in; hidden while the site has sign-in turned off. */
export function FavouriteButton({
  destination,
  place,
  name,
  withLabel = false,
}: {
  destination: string;
  place: string;
  name: string;
  withLabel?: boolean;
}) {
  const { enabled, signedIn, toggle } = useFavourites();
  const on = useFavourites((s) => s.keys.has(favouriteKey(destination, place)));
  if (!enabled) return null;
  const label = on ? `Unlike ${name}` : `Like ${name}`;
  return (
    <button
      type="button"
      onClick={() => (signedIn ? toggle(destination, place) : signInWithGoogle())}
      aria-pressed={signedIn ? on : undefined}
      aria-label={withLabel ? undefined : label}
      title={signedIn ? label : "Sign in to like places"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full text-sm transition-colors ${
        withLabel
          ? `border px-4 py-2 ${on ? "border-accent-2/40 bg-accent-2/10" : "border-line"}`
          : "-m-1.5 size-10 hover:bg-accent-2/10"
      } ${on ? "text-accent-2" : "text-muted hover:text-accent-2"}`}
    >
      <Heart
        className={`${withLabel ? "size-4" : "size-5"} ${on ? "fill-current" : ""}`}
        strokeWidth={1.75}
        aria-hidden
      />
      {withLabel && (on ? "Liked" : "Like")}
    </button>
  );
}
