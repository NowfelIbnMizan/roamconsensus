import { test } from "node:test";
import assert from "node:assert/strict";
import { dayLegs } from "./map";

const chiangMai = { id: "a", lat: 18.79, lng: 98.98 };
const ubud = { id: "b", lat: -8.51, lng: 115.26 };
const monkeyForest = { id: "c", lat: -8.519, lng: 115.259 };

test("a hop to another city is not counted as driving", () => {
  const { total, far, legs } = dayLegs([chiangMai, ubud, monkeyForest]);
  assert.equal(far, 1);
  assert.equal(legs.get("b")?.far, true);
  assert.ok(total < 60, `expected a short drive, got ${total} min`);
});

test("stops in one city add up", () => {
  const { total, far } = dayLegs([ubud, { id: "d", lat: -8.43, lng: 115.28 }]);
  assert.equal(far, 0);
  assert.ok(total > 0);
});

test("a hop of thousands of km needs a flight", () => {
  assert.equal(dayLegs([chiangMai, ubud]).flight, true);
});
