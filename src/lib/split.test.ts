import assert from "node:assert/strict";
import { test } from "node:test";
import { balances, equalShares, settleUp, spentUsd, type Expense } from "./split";

const rates = { USD: 1, THB: 33.62 };

test("equal shares add up to the total", () => {
  const s = equalShares(1000, ["a", "b", "c"]);
  assert.deepEqual(s.map((x) => x.amountCents), [334, 333, 333]);
});

test("balances and settle up across currencies", () => {
  const ex: Expense[] = [
    { amountCents: 9000, currency: "USD", paidById: "a", isSettlement: false, shares: equalShares(9000, ["a", "b", "c"]) },
    { amountCents: 100860, currency: "THB", paidById: "b", isSettlement: false, shares: equalShares(100860, ["a", "b", "c"]) },
  ];
  const b = balances(ex, rates);
  // a paid $90 and owes $30 + $10; b paid $30 (1008.60 THB) and owes $30 + $10.
  assert.equal(b.get("a"), 5000);
  assert.equal(b.get("b"), -1000);
  assert.equal(b.get("c"), -4000);
  const t = settleUp(b);
  assert.deepEqual(t, [
    { from: "c", to: "a", cents: 4000 },
    { from: "b", to: "a", cents: 1000 },
  ]);
  assert.equal(spentUsd(ex, rates), 12000);
});

test("a settlement clears the debt", () => {
  const ex: Expense[] = [
    { amountCents: 2000, currency: "USD", paidById: "a", isSettlement: false, shares: equalShares(2000, ["a", "b"]) },
    { amountCents: 1000, currency: "USD", paidById: "b", isSettlement: true, shares: [{ userId: "a", amountCents: 1000 }] },
  ];
  assert.deepEqual(settleUp(balances(ex, rates)), []);
  assert.equal(spentUsd(ex, rates), 2000);
});
