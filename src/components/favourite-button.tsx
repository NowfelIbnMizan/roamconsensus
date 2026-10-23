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
  const label = on ? `Remove ${name} from favourites` : `Save ${name} to favourites`;
  return (
    <button
      type="button"
      onClick={() => (signedIn ? toggle(destination, place) : signInWithGoogle())}
      aria-pressed={signedIn ? on : undefined}
      aria-label={withLabel ? undefined : label}
      title={signedIn ? label : "Sign in to save favourites"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border text-sm ${
        withLabel ? "px-4 py-2" : "size-8"
      } ${on ? "border-accent-2/40 bg-accent-2/10 text-accent-2" : "border-line text-muted hover:text-accent-2"}`}
    >
      <Heart className={`size-4 ${on ? "fill-current" : ""}`} aria-hidden />
      {withLabel && (on ? "Saved" : "Save")}
    </button>
  );
}
