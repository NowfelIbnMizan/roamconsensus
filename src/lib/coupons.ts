import type { CouponType } from "@/generated/prisma/enums";

export type CouponCandidate = {
  code: string;
  type: CouponType;
  description: string | null;
  creatorId: string | null;
  validFrom: Date | null;
  validTo: Date | null;
  active: boolean;
};

export type OfferInput = {
  platformUrl: string | null;
  creatorUrl: string | null;
  creator: { id: string; name: string };
  coupons: CouponCandidate[]; // all coupons for the item's vendor
};

export type Offer = {
  url: string;
  code: string | null;
  description: string | null;
  source: CouponType | "NONE";
  /** Set when we send traffic through the creator's link, so they keep the credit. */
  creditedTo: string | null;
};

function isLive(c: CouponCandidate, now: Date) {
  return c.active && (!c.validFrom || c.validFrom <= now) && (!c.validTo || c.validTo >= now);
}

/**
 * 3-tier fallback:
 * 1. PLATFORM: our link + our exclusive code
 * 2. PUBLIC: our link + public brand promo
 * 3. CREATOR: creator's own link + their code (avoids hijacking their affiliate credit)
 * Otherwise our link without a code, or the creator's link if we have none.
 */
export function pickOffer(input: OfferInput, now = new Date()): Offer | null {
  const live = input.coupons.filter((c) => isLive(c, now));
  const find = (type: CouponType) => live.find((c) => c.type === type && (type !== "CREATOR" || c.creatorId === input.creator.id));

  if (input.platformUrl) {
    for (const type of ["PLATFORM", "PUBLIC"] as const) {
      const c = find(type);
      if (c) return { url: input.platformUrl, code: c.code, description: c.description, source: type, creditedTo: null };
    }
  }

  const creatorCoupon = find("CREATOR");
  if (creatorCoupon && input.creatorUrl) {
    return {
      url: input.creatorUrl,
      code: creatorCoupon.code,
      description: creatorCoupon.description,
      source: "CREATOR",
      creditedTo: input.creator.name,
    };
  }

  if (input.platformUrl) return { url: input.platformUrl, code: null, description: null, source: "NONE", creditedTo: null };
  if (input.creatorUrl) {
    return { url: input.creatorUrl, code: null, description: null, source: "NONE", creditedTo: input.creator.name };
  }
  return null;
}
