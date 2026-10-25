// The shape of creator content in data/destinations/*.json, shared by the seed, `npm run check:data` and the admin
// panel's itinerary import.
import { z } from "zod";

export const slug = z.string().regex(/^[a-z0-9.-]+$/, "use lowercase letters, numbers, dots and dashes");
export const category = z.enum(["STAY", "EXPERIENCE", "FOOD", "ESIM", "GEAR", "TRANSIT"]);
export const url = z.string().url();

export const PlaceData = z.object({
  slug,
  name: z.string(),
  category,
  area: z.string().optional(),
  blurb: z.string().optional(),
  tip: z.string().optional(),
  website: url.optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const CreatorData = z.object({
  handle: slug,
  name: z.string(),
  platform: z.enum(["INSTAGRAM", "TIKTOK", "YOUTUBE", "BLOG"]),
  profileUrl: url,
  instagramUrl: url.optional(),
  facebookUrl: url.optional(),
  xUrl: url.optional(),
  tiktokUrl: url.optional(),
  youtubeUrl: url.optional(),
  pinterestUrl: url.optional(),
  websiteUrl: url.optional(),
  avatarUrl: url.optional(),
  bio: z.string().optional(),
});

export const ItineraryData = z.object({
  slug,
  title: z.string(),
  summary: z.string(),
  tier: z.enum(["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"]),
  days: z.number().int().positive(),
  creator: slug,
  sourceUrl: url,
  editorTake: z.string().optional(), // the site owner's own commentary
  items: z.array(
    z.object({
      day: z.number().int().positive(),
      name: z.string(),
      category,
      price: z.number().nonnegative().optional(), // omit when the creator gave no price
      priceNote: z.string().optional(),
      priceSource: url.optional(), // set when the price is our research, not the creator's
      sentiment: z.enum(["MUST_VISIT", "RECOMMENDED", "OPTIONAL", "AVOID"]).optional(),
      currency: z.string().length(3).default("USD"),
      unit: z.string().optional(),
      quantity: z.number().int().positive().default(1),
      note: z.string().optional(),
      place: slug.optional(),
      vendor: slug.optional(),
      ourUrl: url.optional(),
      creatorUrl: url.optional(),
    }),
  ),
});

/** What the admin panel's import box takes: one or more itineraries, plus any new places and creators they use. */
export const ImportData = z.object({
  places: z.array(PlaceData).default([]),
  creators: z.array(CreatorData).default([]),
  itineraries: z.array(ItineraryData).min(1, "add at least one itinerary"),
});
