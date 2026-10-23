import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { googleLoginEnabled } from "@/lib/auth";
import { MyTrips } from "./my-trips";

export const metadata: Metadata = { title: "My trips", robots: { index: false } };

export default function MyTripsPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">My trips</h1>
      <p className="mt-2 mb-8 text-muted">Your trip cart on every device, plus copies of trips you saved.</p>
      <PageGuide id="my-trips" />
      {googleLoginEnabled() ? (
        <MyTrips />
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">
          Accounts are coming soon. Your trip cart is saved on this device for now.
        </p>
      )}
    </>
  );
}
