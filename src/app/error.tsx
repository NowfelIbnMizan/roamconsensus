"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * Shown when a page breaks while rendering. "Try again" covers a passing glitch; if the trip saved on this device is
 * what breaks the page, trying again never helps, so the second button starts that trip over (an account's copy stays).
 */
export default function PageError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  function startOver() {
    if (!confirm("Clear the trip plan saved on this device? Trips saved to your account are not affected.")) return;
    try {
      localStorage.removeItem("roamconsensus-cart");
      localStorage.removeItem("roamconsensus-cart-sync");
    } catch {}
    location.reload();
  }

  return (
    <section className="mx-auto max-w-md py-16 text-center">
      <TriangleAlert className="mx-auto mb-4 size-10 text-muted" strokeWidth={1.25} aria-hidden />
      <h1 className="text-2xl font-semibold tracking-tight">This page hit a problem</h1>
      <p className="mt-2 text-muted">It&apos;s on our side, not yours. Try again first.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={startOver}
          className="rounded-full border border-line px-4 py-2 text-sm hover:border-accent"
        >
          Clear the trip on this device
        </button>
      </div>
      <p className="fine-print mt-4">Still stuck? Clearing the trip on this device fixes most cases.</p>
    </section>
  );
}
