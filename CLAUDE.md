@AGENTS.md

# Creatour: handoff notes for Claude sessions

Read this first. It replaces the project memory that plain sessions can't see. Last updated 2026-10-26 (main at PR #83).

## What the site is

- **Creatour** (https://creatour.co): travel planner that collects public itineraries from travel creators per city and shows where they **agree** ("3 of 4 creators agree"). Users build a trip in the **cart** (day plan, map, budget, exports). Not group-trip voting.
- Repo/package still named `roamconsensus` (old name). localStorage keys and HMAC salts keep `roamconsensus` on purpose: don't rename.
- 11 cities: Bali, Bangkok, Tokyo, Kyoto, Singapore, Seoul, Hanoi, Kuala Lumpur, Osaka, Chiang Mai, Phuket. 40+ itineraries.
- Owner: Nowfel (`NowfelIbnMizan`). Solo, non-developer.

## Stack

- Next.js 16 (`cacheComponents` on, read `node_modules/next/dist/docs/` before using APIs), React 19, Tailwind 4, Zustand cart (`src/lib/cart-store.ts`).
- Prisma 7 with `prisma.config.ts` + `@prisma/adapter-pg`; client in `src/generated/prisma`. DB = Neon Postgres (Singapore).
- Hosting: **Vercel Pro**, region `sin1`. `vercel.json` build = `scripts/migrate-deploy.sh && prisma db seed && next build`. Build prerenders from the DB, so it needs `DATABASE_URL`.
- Auth: Better Auth, Google only (`src/lib/auth.ts`). Admin at `/admin`: `ADMIN_PASSWORD` cookie or Google account listed in `ADMIN_EMAILS` (env only).
- Env vars: see `.env.example`. Never print or fetch secret values.
- Scripts: `npm run lint`, `npm test`, `npm run check:data` (content validator), `npm run build`.
- Local DB if needed: install postgres, create a DB, set `DATABASE_URL`, `npx prisma migrate deploy && npx prisma db seed`.

## How content works

- **The database is the source of truth.** Owner edits content in `/admin` (cities, places, creators, blog, import itineraries via pasted JSON).
- Seed (`prisma/seed.ts`) only **adds** itineraries/destinations from `data/` that are new (tracked in `SeedLog`). It never updates existing rows; admin deletions stay deleted.
- **Fixing data in existing rows = SQL data migration** in `prisma/migrations/` (runs on deploy). Only fill NULLs unless told otherwise.
- New city bundle = itineraries + when-to-go + 12+ before-you-go tips + eSIM JSON (`data/esim/<country>.json`, keep `"dataGb": null` for unlimited) + guide (Admin > eSIM plans) + budget (Admin > city page) + FAQ + map pins.
- Prices: researched price needs a source URL (`priceSource`); no source = "Price not listed". Never guess. Closed places stay on route, marked Closed, excluded from totals.
- Creator content: only their own public content, credited. Readable blogs via fetch: myglobalviewpoint, thebrokebackpacker, saltinourhair. Not: nomadicmatt, alexinwanderland, twowanderingsoles, findingtheuniverse, wanderlustcrew.

## Gotchas (each one burned us before)

1. **Preview builds hit the LIVE database.** A PR preview runs migrations + seed against production data. Pushing a branch = changing live data. Be sure before you push migrations.
2. **Prefer merging after the PR's Vercel preview is "Ready".** Both builds run migrations; overlap = advisory lock error (P1002). `scripts/migrate-deploy.sh` now retries P1002 (5x, 30s) so early merges usually survive (owner often merges early). If prod still fails: redeploy production.
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

## Limits and batching (owner rule, 2026-10-27)

Every push to any branch = a Vercel build = migrations + seed + full prerender reading the **live** Neon DB. Spend builds carefully.

- **Batch small fixes into one PR** (e.g. a bug sweep). Don't open a PR per tweak; collect them on one branch and push once.
- **Don't push mockup (`*-lab`) branches.** Build them locally, send screenshots with `SendUserFile`. Pushing one costs a full build.
- **Push only when ready for the owner to look.** Each extra push to an open PR = another preview build.
- Docs-only commits (`*.md`, `shots-lab/`) skip the build (`ignoreCommand` in `vercel.json`).
- Known limits:
  - **Neon**: owner upgraded from free (5 GB/month data transfer ran out). A full build reads ~8 MB since #99. Usage: console.neon.tech > project > Monitoring.
  - **Vercel Pro**: build minutes and image-optimizer quota (optimizer stays off, gotcha 5).
  - **Unsplash / Pexels APIs**: hourly request caps (Unsplash demo apps 50/hour). Photo lookups are cached in `PhotoCache`; don't bulk-refetch.
  - **OpenStreetMap tiles**: free, fair-use policy; no bulk tile loading. CARTO basemaps need a key now.
  - **Google Drive MCP**: can't fetch files over ~6 MB.
  - **Claude web fetch** in this container is flaky; owner can run extraction prompts in Gemini instead.
- Before adding anything that calls a paid or rate-limited service, tell the owner the cost and limit first.

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

- Home map-first (#57), no stats line under map (#81) · city place photo grid (#58) · route page folds (#61) · cart B (#62) · finder B (#63) · place page B (#64) · creator page B (#65).
- Trip mode `/today` = Up next card + tick list + day arrows (#67). Phone Trip tab = menu (cart / Trip mode / My trips); desktop "Today" link while travelling (#68).
- Header one line (#69). Site width `max-w-[96rem]` (1536px) since wide-desktop PR; wide screens get 2-column headers on creator, place and route pages and extra grid columns at `2xl`. Route + cart 2-col at `lg` with sticky map right (#70).
- City tabs: Before-you-go list + "Once you land" fold (#71) · When-to-go 12 month tiles (#72) · Budget 3 style cards + stacked bar (#73) · eSIM 2 questions -> 3 picks (#74) · Compare all-routes table, tick 2 to diff (#75) · Where to stay area list + sticky map, one hotel per row (#77, #79) · Top picks podium + add buttons (#78).
- My trips: Planning-now card + saved trip photo cards, account folded (#80).
- Creators list polish: city pills, style tags, most routes first (#85). Visa page A + tick-off "Before you fly" list + flag emojis, Windows flag font (#86). Quiz A + B's top card: all questions on one screen as pills (Where added, 1-2 days added), live matches (#87). About: kept layout, owner's travel photos in `public/about` (15, location data stripped, other faces blurred; 4 slots, one swaps every 4 s; captions from photo location data or the owner; list in `src/app/about/page.tsx`) + rewritten bio via data migration (#88). Owner shares new photos via a Google Drive folder; Drive MCP can't fetch files over ~6 MB. Blog B: text-first post rows with small square cover + sticky "Ready to plan?" city rail (route counts, quiz link); empty state keeps the rail (blog-redesign branch).
- Mockup branches (`*-lab`) are throwaway; delete when asked.
- **No redesign queued.** Ask the owner what's next.

## Open work (as of 2026-10-25)

- "Perfect cities" plan done: all 11 cities checked (pins, photos, prices, websites, open/closed, tips) and merged (#56, #82). Admin scorecard at `/admin/health`. Creator counts only include creators with a route (#83).
- Kyoto per-style budget still missing (no source; don't invent). Budgets, eSIM guides and About photos are edited in admin now (DB), not code.
- After polish: add creators to fill tier gaps (backpacker → luxury) and length gaps (1-2, 3-4, 5+ days). Example: Bali has no budget route and no 1-2 day route.

## Map of the code

- Pages: `src/app/` (`destinations/[slug]/(sections)` = city tabs, `itineraries`, `cart`, `creators`, `today`, `admin`).
- Data access: `src/lib/data.ts`, `src/lib/place.ts`, `src/lib/trip.ts`; content schema/check/load in `src/lib/content-*.ts`.
- Key components: `home-search`, `city-map`, `stop-details`, `day-plan`, `creator-hover`, `creator-trips`, `agree-pill`, `read-more`, `page-guide`, `photo`/`thumb`.
- Page tips text: `src/lib/guides.ts` (new tabs/pages need an entry).
- City place grid: `(sections)/place-list.tsx`. The city page renders only the top 20 + top 8 per category and links to `/destinations/[slug]/places` (full list) to keep big cities light on phones.
