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
- `/disclosure` affiliate disclosure

## Data model

See `prisma/schema.prisma`. Consensus counts distinct creators whose `Item`s point at the same `Place`.
