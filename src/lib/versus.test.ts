import { test } from "node:test";
import assert from "node:assert/strict";
import { liveVersus, reasonsFor, versusFor, versusPair, type CityFacts } from "./versus";

const facts = (over: Partial<CityFacts>): CityFacts => ({
  routes: 2,
  creators: 2,
  minDays: 3,
  maxDays: 3,
  pricedRoutes: 0,
  dayLowCents: null,
  dayHighCents: null,
  guideDayCents: null,
  best: null,
  shared: 0,
  top: [],
  ...over,
});

test("a pair has one address", () => {
  assert.deepEqual(versusPair("phuket-vs-krabi"), ["phuket", "krabi"]);
  assert.equal(versusPair("krabi-vs-phuket"), null);
  assert.equal(versusPair("bangkok-vs-chiang-mai")?.[1], "chiang-mai");
});

test("a city lists the pairs it is in", () => {
  assert.deepEqual(versusFor("phuket").map((p) => p.other).sort(), ["bali", "krabi"]);
  assert.deepEqual(versusFor("hanoi"), []);
});

test("a pair needs both cities live with enough routes", () => {
  const city = (slug: string, itineraries: number) => ({ slug, _count: { itineraries } });
  const live = liveVersus([city("phuket", 4), city("krabi", 2), city("kyoto", 4), city("osaka", 1)]);
  assert.deepEqual(live, [["phuket", "krabi"]]);
});

test("reasons come only from numbers a city wins on", () => {
  assert.deepEqual(reasonsFor(facts({}), facts({})), []);
  const reasons = reasonsFor(facts({ routes: 5, minDays: 1, maxDays: 7, shared: 9 }), facts({}));
  assert.equal(reasons.length, 4);
  assert.match(reasons[0], /5, against 2/);
  assert.match(reasons[1], /start at 1 day\./);
});
