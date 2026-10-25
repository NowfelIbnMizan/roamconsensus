@AGENTS.md

# Creatour: handoff notes for Claude sessions

Read this first. It replaces the project memory that plain sessions can't see. Last updated 2026-10-25.

## What the site is

- **Creatour** (https://creatour.co): travel planner that collects public itineraries from travel creators per city and shows where they **agree** ("3 of 4 creators agree"). Users build a trip in the **cart** (day plan, map, budget, exports). Not group-trip voting.
- Repo/package still named `roamconsensus` (old name). localStorage keys and HMAC salts keep `roamconsensus` on purpose: don't rename.
- 11 cities: Bali, Bangkok, Tokyo, Kyoto, Singapore, Seoul, Hanoi, Kuala Lumpur, Osaka, Chiang Mai, Phuket. 40+ itineraries.
- Owner: Nowfel (`NowfelIbnMizan`). Solo, non-developer.

## Stack

- Next.js 16 (`cacheComponents` on, read `node_modules/next/dist/docs/` before using APIs), React 19, Tailwind 4, Zustand cart (`src/lib/cart-store.ts`).
- Prisma 7 with `prisma.config.ts` + `@prisma/adapter-pg`; client in `src/generated/prisma`. DB = Neon Postgres (Singapore).
- Hosting: **Vercel Pro**, region `sin1`. `vercel.json` build = `prisma migrate deploy && prisma db seed && next build`. Build prerenders from the DB, so it needs `DATABASE_URL`.
- Auth: Better Auth, Google only (`src/lib/auth.ts`). Admin at `/admin`: `ADMIN_PASSWORD` cookie or Google account listed in `ADMIN_EMAILS` (env only).
- Env vars: see `.env.example`. Never print or fetch secret values.
- Scripts: `npm run lint`, `npm test`, `npm run check:data` (content validator), `npm run build`.
- Local DB if needed: install postgres, create a DB, set `DATABASE_URL`, `npx prisma migrate deploy && npx prisma db seed`.

## How content works

- **The database is the source of truth.** Owner edits content in `/admin` (cities, places, creators, blog, import itineraries via pasted JSON).
- Seed (`prisma/seed.ts`) only **adds** itineraries/destinations from `data/` that are new (tracked in `SeedLog`). It never updates existing rows; admin deletions stay deleted.
- **Fixing data in existing rows = SQL data migration** in `prisma/migrations/` (runs on deploy). Only fill NULLs unless told otherwise.
- New city bundle = itineraries + when-to-go + 12+ before-you-go tips + eSIM JSON (`data/esim/<country>.json`, keep `"dataGb": null` for unlimited) + guide (`src/lib/esim-guides.ts`) + budget (`src/lib/costs.ts`) + FAQ + map pins.
- Prices: researched price needs a source URL (`priceSource`); no source = "Price not listed". Never guess. Closed places stay on route, marked Closed, excluded from totals.
- Creator content: only their own public content, credited. Readable blogs via fetch: myglobalviewpoint, thebrokebackpacker, saltinourhair. Not: nomadicmatt, alexinwanderland, twowanderingsoles, findingtheuniverse, wanderlustcrew.

## Gotchas (each one burned us before)

1. **Preview builds hit the LIVE database.** A PR preview runs migrations + seed against production data. Pushing a branch = changing live data. Be sure before you push migrations.
2. **Merge only after the PR's Vercel preview is "Ready".** Both builds run `prisma migrate deploy`; overlap = advisory lock error (P1002) and production build fails. If it happens, redeploy production.
3. Keep the `<Suspense>` around `{children}` in `src/app/layout.tsx`. Removing it brought back runtime 500s (`NEXT_STATIC_GEN_BAILOUT`).
4. Never add `revalidatePath("/", "layout")`. It breaks runtime regen of `/itineraries/[slug]`. Admin saves use `updateTag("content")`.
5. **Never re-enable the Vercel image optimizer.** Custom loader `src/lib/image-loader.ts` resizes via Unsplash/Pexels URL params. Default optimizer blew the quota.
6. No prettier config. Never run prettier on all of `src`. Match each file's existing style and width.
7. Zod nested objects need `.passthrough()` or fields get stripped.
8. Overlays need `z-index > 1100` (phone tab bar is `z-[1100]`).
9. Repo is **public**: no emails (except `hello@creatour.co` in `src/lib/contact.ts`), no secrets, no personal Gmail anywhere.
10. **No affiliate/money claims.** Site is free and earns nothing. No affiliate IDs exist yet. When IDs arrive, add disclosure section + footer line in the same PR.
11. Never scrape creator photos or avatars. Avatars only after a creator's written OK.
12. Marketing copy: never claim creator partnerships or that the owner visited/tested a route. Framing = "fellow traveller".
13. The container can't reach `creatour.co` or `*.vercel.app` directly; use a web-fetch tool or the Vercel MCP for logs.

## Owner preferences

- **Replies: terse "caveman" style** (no filler, short sentences) unless he says "normal mode".
- **Beginner** at GitHub, Vercel, Postgres: give click-by-click steps ("Open vercel.com > project creatour > Deployments > ...").
- Design direction:
  - **Planner-first**: every page helps build a trip, no aimless exploring.
  - **Less text**: digestible bits, visuals, folds (`<details>`), "Show all" lists.
  - **Premium look (PR #51)**: flat pills, no tape/tilts/stamps/doodles/Caveat font, neutral creator pills, `eyebrow` utility, photo credit = camera badge. Light theme default.
  - Disclaimers/small print use the `fine-print` utility (Fraunces italic, muted).
- **Redesign workflow**: make 3 mockups (A/B/C, desktop + phone screenshots, on a `*-lab` branch), owner picks one, build the pick as **one PR**. Screenshots via preinstalled Playwright.
- Small PRs are fine (Vercel Pro). One PR per feature. Commit + push to the branch you were given.
- Don't open PRs that only add agent skills.
- Talk to him before spending credits on generated media.

## Redesign rounds done (pick = merged)

Home map-first (#57) · city place photo grid (#58) · route page folds (#61) · cart B (#62) · finder B (#63) · place page B (#64) · creator page B (#65).
**Next: Trip mode (`/today`)** redesign, same 3-mockup flow.

## Open work (as of 2026-10-25)

- "Perfect cities" plan: all 11 cities checked (pins, photos, prices, websites, open/closed, tips). Admin scorecard at `/admin/health`. Last batch of city fixes sat as local commits in another session (bundle in project files); ask the owner if it's merged before redoing it.
- Kyoto per-style budget still missing (no source; don't invent).
- After polish: add creators to fill tier gaps (backpacker → luxury) and length gaps (1-2, 3-4, 5+ days).

## Map of the code

- Pages: `src/app/` (`destinations/[slug]/(sections)` = city tabs, `itineraries`, `cart`, `creators`, `today`, `admin`).
- Data access: `src/lib/data.ts`, `src/lib/place.ts`, `src/lib/trip.ts`; content schema/check/load in `src/lib/content-*.ts`.
- Key components: `home-search`, `city-map`, `stop-details`, `day-plan`, `creator-hover`, `creator-trips`, `agree-pill`, `read-more`, `page-guide`, `photo`/`thumb`.
- Page tips text: `src/lib/guides.ts` (new tabs/pages need an entry).
