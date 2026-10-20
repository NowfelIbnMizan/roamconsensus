# Site data

Everything shown on the site comes from these files. Every Netlify build loads them into the database (`prisma/seed.ts`), so a merged change goes live on the next deploy.

- `vendors.json`: booking sites (Agoda, Klook, ...).
- `coupons.json`: promo codes. `type` is `PLATFORM` (ours), `PUBLIC` (brand promo) or `CREATOR` (needs `creator`). Optional `validFrom` / `validTo` dates.
- `destinations/<slug>.json`: one file per destination with its `places`, `creators` and `itineraries`.

Rules:
- Itineraries must come from a creator's real post: set `sourceUrl` to it. Never invent recommendations for a real person.
- `"sample": true` marks fictional demo content; the site shows a banner on it.
- Items that point at the same `place` slug count toward that place's creator consensus.
- `price` is in `currency` (default USD), per `unit` x `quantity`. Leave it out when the creator gave none; `priceNote` keeps their wording.
- `sentiment`: `MUST_VISIT`, `RECOMMENDED`, `OPTIONAL` or `AVOID` (creator says skip it; not counted as a recommendation). `note` holds the creator's key tip.
- `ourUrl` is our affiliate link, `creatorUrl` is the creator's own link; both need `vendor`.

Run `npm run db:seed` locally to check a change; mistakes (unknown vendor, place or creator) fail with a clear message.
