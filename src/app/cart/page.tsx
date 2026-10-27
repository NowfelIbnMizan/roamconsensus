import type { Metadata } from "next";
import { PageGuide } from "@/components/page-guide";
import { canSendEmail } from "@/lib/email";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Trip plan" };

export default function CartPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Trip plan</h1>
      <p className="mt-2 mb-8 text-muted">
        Plan it day by day, then book. Prices are estimates from creators&apos; posts.
      </p>
      <PageGuide id="cart" />
      <CartView canEmail={canSendEmail()} />
    </>
  );
}
