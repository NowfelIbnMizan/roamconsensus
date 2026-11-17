import { test } from "node:test";
import assert from "node:assert/strict";
import { placeVerdict } from "./verdict";

const base = { name: "Tegalalang Rice Terraces", city: "Bali", avoid: 0 };

test("no verdict from one or two creators", () => {
  assert.equal(placeVerdict({ ...base, agree: 2, creators: 8 }), null);
  assert.equal(placeVerdict({ ...base, agree: 2, creators: 2 }), null);
});

test("the answer follows the share of creators, and says who skips", () => {
  assert.match(placeVerdict({ ...base, agree: 8, creators: 8 })!.answer, /^Yes\. All 8 creators with a Bali route include it\.$/);
  assert.match(placeVerdict({ ...base, agree: 7, creators: 8 })!.answer, /^Most creators say yes\. 7 of 8 creators/);
  const split = placeVerdict({ ...base, agree: 3, creators: 8, avoid: 1 })!.answer;
  assert.match(split, /^It splits creators\. 3 of 8 creators with a Bali route include it; the other 5 leave it out\. One of the other 5 says to skip it\.$/);
});

test("creators who warn count towards having a verdict", () => {
  assert.equal(placeVerdict({ ...base, agree: 0, creators: 8, avoid: 3 }), null);
  assert.match(placeVerdict({ ...base, agree: 2, creators: 8, avoid: 2 })!.answer, /2 of 8 creators .* the other 6 leave it out\. 2 of the other 6 say to skip it\.$/);
  assert.match(placeVerdict({ ...base, agree: 3, creators: 4, avoid: 1 })!.answer, /^Most creators say yes\. 3 of 4 creators with a Bali route include it\. The other one says to skip it\.$/);
});

test("titles fit a search result, or fall back", () => {
  assert.equal(placeVerdict({ ...base, agree: 7, creators: 8 })!.title, "Is Tegalalang Rice Terraces worth it? 7 of 8 creators go");
  const long = placeVerdict({ ...base, name: "West Nusa Penida (Kelingking Beach, Broken Beach, Angel's Billabong)", agree: 4, creators: 8 })!;
  assert.equal(long.title, "Is West Nusa Penida worth it? 4 of 8 creators go");
  const tooLong = placeVerdict({ ...base, name: "The Grand Palace and the Temple of the Emerald Buddha Complex", agree: 4, creators: 5 })!;
  assert.equal(tooLong.title, null);
});
