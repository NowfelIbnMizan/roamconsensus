import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanCart, cleanItems } from "./cart-store";
import { csvCell } from "./csv";

const good = {
  id: "bali--pool",
  name: "Pool",
  category: "EXPERIENCE",
  priceCents: 1200,
  currency: "USD",
  unit: null,
  quantity: 2,
  vendor: null,
  bookUrl: null,
  itinerary: { slug: "bali", title: "Bali" },
};

test("cleanItems drops lines the trip plan can't show and keeps the rest", () => {
  const items = cleanItems([good, { id: "x", name: "No type" }, null, "junk", { ...good, id: "y", category: "NOPE" }]);
  assert.deepEqual(
    items.map((i) => i.id),
    ["bali--pool"],
  );
});

test("cleanItems tops up missing price, count and currency", () => {
  const [item] = cleanItems([{ id: "a", name: "A", category: "FOOD", quantity: 0, itinerary: { slug: "s" } }]);
  assert.equal(item.priceCents, null);
  assert.equal(item.quantity, 1);
  assert.equal(item.currency, "USD");
  assert.equal(item.itinerary.title, "");
});

test("cleanCart survives a cart that isn't one", () => {
  assert.deepEqual(cleanCart(null).items, []);
  assert.equal(cleanCart({ items: "no", tripDays: 999, startDate: "soon" }).tripDays, 60);
  assert.equal(cleanCart({ startDate: "soon" }).startDate, null);
  assert.equal(cleanCart({ startDate: "2026-12-01" }).startDate, "2026-12-01");
});

test("csvCell stops spreadsheet formulas and quotes commas", () => {
  assert.equal(csvCell("=HYPERLINK(1)"), "'=HYPERLINK(1)");
  assert.equal(csvCell("+1@example.com"), "'+1@example.com");
  assert.equal(csvCell('Ann "A", Lee'), '"Ann ""A"", Lee"');
  assert.equal(csvCell("ann@example.com"), "ann@example.com");
});
