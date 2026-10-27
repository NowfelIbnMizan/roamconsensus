import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import { PHOTOS } from "../app/about/photo-list";

// A photo flagged with the wrong shape would be cropped sideways into the other kind of slot on the About page.
test("each About photo's wide flag matches the file", async () => {
  for (const p of PHOTOS) {
    const { width = 0, height = 0 } = await sharp(`public${p.src}`).metadata();
    assert.equal(!!p.wide, width > height, `${p.src} is ${width}x${height}`);
  }
});

test("About photos have at least two of each shape", () => {
  assert.ok(PHOTOS.filter((p) => p.wide).length >= 2);
  assert.ok(PHOTOS.filter((p) => !p.wide).length >= 2);
});
