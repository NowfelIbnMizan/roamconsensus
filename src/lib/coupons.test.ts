import { test } from "node:test";
import assert from "node:assert/strict";
import { pickOffer, type CouponCandidate, type OfferInput } from "./coupons";

const coupon = (over: Partial<CouponCandidate>): CouponCandidate => ({
  code: "X",
  type: "PUBLIC",
  description: null,
  creatorId: null,
  validFrom: null,
  validTo: null,
  active: true,
  ...over,
});

const base: OfferInput = {
  platformUrl: "https://vendor.test/?aid=us",
  creatorUrl: "https://vendor.test/?aid=mika",
  creator: { id: "c1", name: "Mika" },
  coupons: [],
};

test("platform code wins over public and creator", () => {
  const offer = pickOffer({
    ...base,
    coupons: [
      coupon({ code: "CRE", type: "CREATOR", creatorId: "c1" }),
      coupon({ code: "PUB", type: "PUBLIC" }),
      coupon({ code: "OURS", type: "PLATFORM" }),
    ],
  });
  assert.deepEqual(offer, { url: base.platformUrl, code: "OURS", description: null, source: "PLATFORM", creditedTo: null });
});

test("public code when no platform code", () => {
  const offer = pickOffer({ ...base, coupons: [coupon({ code: "BOOK2026" }), coupon({ code: "CRE", type: "CREATOR", creatorId: "c1" })] });
  assert.equal(offer?.code, "BOOK2026");
  assert.equal(offer?.url, base.platformUrl);
});

test("creator code uses creator link and credits them", () => {
  const offer = pickOffer({ ...base, coupons: [coupon({ code: "MIKA10", type: "CREATOR", creatorId: "c1" })] });
  assert.deepEqual(offer, { url: base.creatorUrl, code: "MIKA10", description: null, source: "CREATOR", creditedTo: "Mika" });
});

test("ignores another creator's code", () => {
  const offer = pickOffer({ ...base, coupons: [coupon({ code: "SAM", type: "CREATOR", creatorId: "c2" })] });
  assert.equal(offer?.code, null);
  assert.equal(offer?.url, base.platformUrl);
});

test("skips expired, future and inactive coupons", () => {
  const now = new Date("2026-10-20T00:00:00Z");
  const offer = pickOffer(
    {
      ...base,
      coupons: [
        coupon({ code: "OLD", type: "PLATFORM", validTo: new Date("2026-01-01") }),
        coupon({ code: "SOON", type: "PLATFORM", validFrom: new Date("2027-01-01") }),
        coupon({ code: "OFF", type: "PUBLIC", active: false }),
      ],
    },
    now,
  );
  assert.equal(offer?.code, null);
});

test("falls back to creator link when we have no link", () => {
  const offer = pickOffer({ ...base, platformUrl: null });
  assert.equal(offer?.url, base.creatorUrl);
  assert.equal(offer?.creditedTo, "Mika");
});

test("null when no links at all", () => {
  assert.equal(pickOffer({ ...base, platformUrl: null, creatorUrl: null }), null);
});
