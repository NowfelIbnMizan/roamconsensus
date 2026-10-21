# Site data

Everything shown on the site comes from these files. Every Netlify build loads them into the database (`prisma/seed.ts`), so a merged change goes live on the next deploy.

- `vendors.json`: booking sites (Agoda, Klook, ...).
- `coupons.json`: promo codes. `type` is `PLATFORM` (ours), `PUBLIC` (brand promo) or `CREATOR` (needs `creator`). Optional `validFrom` / `validTo` dates.
- `destinations/<slug>.json`: one file per destination with its `places`, `creators` and `itineraries`.

Rules:
- Itineraries must come from a creator's real post: set `sourceUrl` to it. Never invent recommendations for a real person.
- Places can have `"website"`: the venue's official site. Its share image becomes the place photo (falls back to Unsplash).
- `"sample": true` marks fictional demo content; the site shows a banner on it.
- Items that point at the same `place` slug count toward that place's creator consensus.
- `price` is in `currency` (default USD), per `unit` x `quantity`. Leave it out when the creator gave none; `priceNote` keeps their wording. If the creator gave none but we found a typical price, set `price` plus `priceSource` (the URL it came from); `priceNote` then says what it covers, and the site labels it "Typical price".
- `sentiment`: `MUST_VISIT`, `RECOMMENDED`, `OPTIONAL` or `AVOID` (creator says skip it; not counted as a recommendation). `note` holds the creator's key tip.
- `ourUrl` is our affiliate link, `creatorUrl` is the creator's own link; both need `vendor`. Until an affiliate ID exists, `ourUrl` can be the plain booking page; swap in the affiliate link later. Items with no vendor are grouped in the cart by where you pay (entrance, venue, locally).

Run `npm run db:seed` locally to check a change; mistakes (unknown vendor, place or creator) fail with a clear message.

## eSIM plans

`data/esim/<country>.json` holds eSIM plans for one country (`"country"` must match the destinations' `country`), shown on each destination's eSIM tab. Each plan: `provider`, `name`, `dataGb` (null = unlimited), `days`, `price` (USD), optional `network`, `speed`, `hotspot`, `notes`, plus `url` (where to buy) and `sourceUrl` (where the price was seen). Update `checkedAt` when prices are rechecked.
