import type { Metadata } from "next";
import { Suspense } from "react";
import { SharedTripView } from "./shared-trip";

export const metadata: Metadata = {
  title: "A trip plan shared with you",
  description: "A day-by-day trip plan built from travel creators' itineraries.",
  robots: { index: false },
};

export default function TripPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">A trip plan shared with you</h1>
      <p className="mt-1 text-muted">Built from travel creators&apos; itineraries on Creatour.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading the trip…</p>}>
          <SharedTripView />
        </Suspense>
      </div>
    </>
  );
}
