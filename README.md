# RoamConsensus

Compare travel creators' itineraries for one destination, see where they agree, and price routes side by side.

Stack: Next.js 16 (App Router, Cache Components), Tailwind CSS 4, Lucide, Prisma 7 + PostgreSQL.

## Setup

```bash
cp .env.example .env        # set DATABASE_URL
npm install                 # also runs prisma generate
npm run db:migrate          # apply migrations
npm run db:seed             # sample Kyoto data (fictional creators)
npm run dev
```

`npm run build` needs a reachable database: pages are prerendered from it.

## Routes

- `/` destinations
- `/destinations/[slug]` creator consensus + route comparison
- `/itineraries/[slug]` day-by-day plan with booking links
- `/creators/[handle]` creator profile
- `/cart` trip cart (localStorage): steppers, budget, vendor groups, TXT/Notion export
- `/disclosure` affiliate disclosure

## API

- `GET /api/coupons/resolve?itemId=` best link + code: platform code, then public promo, then creator code via creator link
- `GET /api/photos?query=&category=&key=&postUrl=` cache, OTA (stub), oEmbed thumbnail, Unsplash, Pexels, placeholder
- `GET /api/oembed?url=` YouTube / TikTok / Instagram embeds (Instagram needs `META_OEMBED_TOKEN`)

`npm test` runs the coupon fallback tests.

## Data model

See `prisma/schema.prisma`. Consensus counts distinct creators whose `Item`s point at the same `Place`.
