import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Trip cart" };

export default function CartPage() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Trip cart</h1>
      <p className="mt-2 mb-8 text-muted">Grouped by where you book. Prices are estimates from creators&apos; posts.</p>
      <CartView />
    </>
  );
}
