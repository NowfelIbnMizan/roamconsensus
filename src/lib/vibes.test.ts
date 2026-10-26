import { test } from "node:test";
import assert from "node:assert/strict";
import { vibesOf } from "./vibes";

test("a passing café or restaurant tip doesn't make a sight a food stop", () => {
  const terraces = vibesOf(
    "Tegalalang Rice Terraces",
    "Skip the street parking touts; drive to the official café lots like Alas Harum.",
    "EXPERIENCE",
  );
  assert.ok(!terraces.includes("food"));
  assert.ok(!vibesOf("Bukchon Hanok Village", "Find a restaurant serving samgyetang for lunch.", "EXPERIENCE").includes("food"));
});

test("real food sights still count", () => {
  assert.ok(vibesOf("Myeongdong", "Evening street food stalls", "EXPERIENCE").includes("food"));
  assert.ok(vibesOf("Chiang Mai Night Bazaar", "Huge night market, eat as you go", "EXPERIENCE").includes("food"));
  assert.ok(vibesOf("Some Café", "", "EXPERIENCE").includes("food"));
  assert.ok(vibesOf("Anything", "", "FOOD").includes("food"));
});
