import type { Metadata } from "next";

export const metadata: Metadata = { title: "Affiliate disclosure" };

export default function DisclosurePage() {
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Affiliate disclosure</h1>
      <p>
        Creatour earns money through affiliate links. When you book a stay, tour, eSIM or product through a link
        on this site, we may receive a commission from the vendor (for example Agoda, Booking.com, Klook,
        GetYourGuide, Amazon or Truely). This never changes the price you pay.
      </p>
      <p>
        Where a creator has their own code or link and we have no better offer, we send you to the creator&apos;s
        link and credit them.
      </p>
      <p>
        Creatour is not affiliated with, endorsed by, or sponsored by the creators whose itineraries we
        summarise. Their names and content belong to them, and we link to the original posts.
      </p>
    </article>
  );
}
