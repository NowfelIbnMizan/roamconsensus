import Link from "next/link";
import { MapPinOff } from "lucide-react";

/** Shown for a bad link or a page that was removed: says what happened and offers the two ways back into planning. */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <MapPinOff className="mx-auto mb-4 size-10 text-muted" strokeWidth={1.25} aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">Can&apos;t find that page</h1>
      <p className="mt-2 text-muted">It may have moved, or the link got cut off.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/#destinations"
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Pick a city
        </Link>
        <Link href="/itineraries" className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent">
          Find a route
        </Link>
      </div>
    </section>
  );
}
