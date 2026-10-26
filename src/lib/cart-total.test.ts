import { test } from "node:test";
import assert from "node:assert/strict";
import { lineTotal } from "./cart-store";
import { FALLBACK_RATES } from "./currency";

test("line totals are in USD whatever the price's currency", () => {
  assert.equal(lineTotal({ priceCents: 1500, quantity: 2 }), 3000);
  assert.equal(lineTotal({ priceCents: 1500, quantity: 2, currency: "USD" }), 3000);
  // IDR 15,000 entry is about a dollar, not $150.
  const idr = lineTotal({ priceCents: 1_500_000, quantity: 1, currency: "IDR" });
  assert.equal(idr, Math.round(1_500_000 / FALLBACK_RATES.IDR));
  assert.ok(idr < 200);
  assert.equal(lineTotal({ priceCents: null, quantity: 3, currency: "IDR" }), 0);
});
