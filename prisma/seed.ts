// Loads data/*.json into the database. Runs on every Netlify build.
// Upserts by slug/handle, so editing or adding a file and redeploying is enough.
// Rows that disappear from the files are removed only for itineraries' items; set SEED_RESET=1 to wipe everything first.
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const slug = z.string().regex(/^[a-z0-9.-]+$/, "use lowercase letters, numbers, dots and dashes");
const category = z.enum(["STAY", "EXPERIENCE", "FOOD", "ESIM", "GEAR", "TRANSIT"]);
const url = z.string().url();

const Vendors = z.array(z.object({ slug, name: z.string(), homepage: url }));

const Coupons = z.array(
  z.object({
    vendor: slug,
    code: z.string().min(1),
    type: z.enum(["PLATFORM", "PUBLIC", "CREATOR"]),
    description: z.string().optional(),
    creator: slug.optional(),
    validFrom: z.coerce.date().optional(),
    validTo: z.coerce.date().optional(),
    active: z.boolean().default(true),
  }),
);

const EsimFile = z.object({
  country: z.string(),
  checkedAt: z.coerce.date(),
  plans: z.array(
    z.object({
      provider: z.string(),
      name: z.string(),
      dataGb: z.number().positive().nullable(), // null = unlimited
      days: z.number().int().positive(),
      price: z.number().positive(),
      currency: z.string().length(3).default("USD"),
      network: z.string().optional(),
      speed: z.string().optional(),
      hotspot: z.boolean().optional(),
      notes: z.string().optional(),
      url,
      sourceUrl: url.optional(),
    }),
  ),
});

const Destination = z.object({
  slug,
  name: z.string(),
  country: z.string(),
  summary: z.string(),
  heroPhotoUrl: url.optional(),
  climateSourceUrl: url.optional(),
  months: z
    .array(
      z.object({
        month: z.number().int().min(1).max(12),
        highC: z.number().int().optional(),
        lowC: z.number().int().optional(),
        rainMm: z.number().int().nonnegative().optional(),
        crowd: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
        note: z.string().optional(),
      }),
    )
    .default([]),
  sample: z.boolean().default(false),
  places: z.array(
    z.object({
      slug,
      name: z.string(),
      category,
      area: z.string().optional(),
      blurb: z.string().optional(),
      tip: z.string().optional(),
      website: url.optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }),
  ),
  creators: z.array(
    z.object({
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
    }),
  ),
  itineraries: z.array(
    z.object({
      slug,
      title: z.string(),
      summary: z.string(),
      tier: z.enum(["BACKPACKER", "BUDGET", "MIDRANGE", "LUXURY"]),
      days: z.number().int().positive(),
      creator: slug,
      sourceUrl: url,
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
    }),
  ),
});

const dataDir = path.join(process.cwd(), "data");

const toSlug = (s: string) =>
  s
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function load<T extends z.ZodType>(schema: T, file: string): z.infer<T> {
  const result = schema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid data in ${path.relative(process.cwd(), file)}:\n${issues}`);
  }
  return result.data;
}

async function main() {
  const vendors = load(Vendors, path.join(dataDir, "vendors.json"));
  const coupons = load(Coupons, path.join(dataDir, "coupons.json"));
  const destDir = path.join(dataDir, "destinations");
  const destinations = readdirSync(destDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => load(Destination, path.join(destDir, f)));

  // Check cross-references before touching the database, so a typo fails the build with a clear message.
  const vendorSlugs = new Set(vendors.map((v) => v.slug));
  const creatorHandles = new Set(destinations.flatMap((d) => d.creators.map((c) => c.handle)));
  const problems: string[] = [];
  for (const c of coupons) {
    if (!vendorSlugs.has(c.vendor)) problems.push(`coupons.json ${c.code}: unknown vendor "${c.vendor}"`);
    if (c.creator && !creatorHandles.has(c.creator))
      problems.push(`coupons.json ${c.code}: unknown creator "${c.creator}"`);
    if (c.type === "CREATOR" && !c.creator) problems.push(`coupons.json ${c.code}: CREATOR coupons need "creator"`);
  }
  for (const d of destinations) {
    const places = new Set(d.places.map((p) => p.slug));
    const creators = new Set(d.creators.map((c) => c.handle));
    for (const it of d.itineraries) {
      if (!creators.has(it.creator))
        problems.push(`${d.slug} ${it.slug}: creator "${it.creator}" not in this file's creators`);
      for (const item of it.items) {
        if (item.place && !places.has(item.place))
          problems.push(`${d.slug} ${it.slug} "${item.name}": unknown place "${item.place}"`);
        if (item.vendor && !vendorSlugs.has(item.vendor))
          problems.push(`${d.slug} ${it.slug} "${item.name}": unknown vendor "${item.vendor}"`);
        if ((item.ourUrl || item.creatorUrl) && !item.vendor)
          problems.push(`${d.slug} ${it.slug} "${item.name}": links need a vendor`);
      }
    }
  }
  if (problems.length) throw new Error(`Data problems:\n  ${problems.join("\n  ")}`);

  // The admin panel owns content once the database has any, so deploys must not overwrite those edits.
  // FORCE_SEED=1 loads the files anyway (e.g. to restore a backup laid out like data/).
  const force = process.env.FORCE_SEED === "1" || process.env.SEED_RESET === "1";
  if (!force && (await db.destination.count()) > 0) {
    console.log("Database already has content; skipping seed so admin edits are kept. Set FORCE_SEED=1 to load data/.");
    return;
  }

  if (process.env.SEED_RESET === "1") {
    console.log("SEED_RESET=1: wiping all data first.");
    await db.$transaction([
      db.affiliateLink.deleteMany(),
      db.coupon.deleteMany(),
      db.item.deleteMany(),
      db.itinerary.deleteMany(),
      db.place.deleteMany(),
      db.destination.deleteMany(),
      db.creator.deleteMany(),
      db.vendor.deleteMany(),
    ]);
  }

  const vendorIds = new Map<string, string>();
  for (const v of vendors) {
    const row = await db.vendor.upsert({ where: { slug: v.slug }, create: v, update: v });
    vendorIds.set(v.slug, row.id);
  }

  const creatorIds = new Map<string, string>();
  for (const d of destinations) {
    const { places, creators, itineraries, sample, months, ...fields } = d;
    const dest = await db.destination.upsert({
      where: { slug: d.slug },
      create: { ...fields, isSample: sample },
      update: { ...fields, climateSourceUrl: fields.climateSourceUrl ?? null, isSample: sample },
    });

    await db.destinationMonth.deleteMany({ where: { destinationId: dest.id } });
    await db.destinationMonth.createMany({ data: months.map((m) => ({ ...m, destinationId: dest.id })) });

    const placeIds = new Map<string, string>();
    for (const p of places) {
      // Explicit nulls so removing an optional field from the JSON clears it.
      const fields = {
        ...p,
        area: p.area ?? null,
        blurb: p.blurb ?? null,
        tip: p.tip ?? null,
        website: p.website ?? null,
        lat: p.lat ?? null,
        lng: p.lng ?? null,
      };
      const row = await db.place.upsert({
        where: { destinationId_slug: { destinationId: dest.id, slug: p.slug } },
        create: { ...fields, destinationId: dest.id },
        update: fields,
      });
      placeIds.set(p.slug, row.id);
    }

    for (const c of creators) {
      const row = await db.creator.upsert({ where: { handle: c.handle }, create: c, update: c });
      creatorIds.set(c.handle, row.id);
    }

    for (const { items, creator, ...it } of itineraries) {
      const data = { ...it, destinationId: dest.id, creatorId: creatorIds.get(creator)! };
      const itinerary = await db.itinerary.upsert({ where: { slug: it.slug }, create: data, update: data });
      // Replace items wholesale, but with ids built from itinerary + name so saved carts still match after a reseed.
      await db.item.deleteMany({ where: { itineraryId: itinerary.id } });
      const usedIds = new Set<string>();
      for (const [position, item] of items.entries()) {
        const vendorId = item.vendor ? vendorIds.get(item.vendor) : undefined;
        const base = `${it.slug}--${toSlug(item.name)}`;
        let id = base;
        for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
        usedIds.add(id);
        await db.item.create({
          data: {
            id,
            itineraryId: itinerary.id,
            day: item.day,
            position,
            name: item.name,
            note: item.note,
            category: item.category,
            priceCents: item.price === undefined ? null : Math.round(item.price * 100),
            priceNote: item.priceNote,
            priceSourceUrl: item.priceSource,
            sentiment: item.sentiment,
            currency: item.currency,
            unit: item.unit,
            quantity: item.quantity,
            placeId: item.place ? placeIds.get(item.place) : undefined,
            vendorId,
            links:
              vendorId && (item.ourUrl || item.creatorUrl)
                ? {
                    create: [
                      ...(item.ourUrl ? [{ vendorId, url: item.ourUrl }] : []),
                      ...(item.creatorUrl ? [{ vendorId, url: item.creatorUrl, creatorId: data.creatorId }] : []),
                    ],
                  }
                : undefined,
          },
        });
      }
    }
    console.log(`Loaded ${d.slug}: ${itineraries.length} itineraries, ${creators.length} creators.`);
  }

  // eSIM plans are fully owned by data/esim/*.json, one file per country.
  const esimDir = path.join(dataDir, "esim");
  const esimFiles = readdirSync(esimDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => load(EsimFile, path.join(esimDir, f)));
  await db.esimPlan.deleteMany();
  await db.esimPlan.createMany({
    data: esimFiles.flatMap(({ country, checkedAt, plans }) =>
      plans.map(({ dataGb, price, ...p }) => ({
        ...p,
        country,
        checkedAt,
        dataMb: dataGb === null ? null : Math.round(dataGb * 1024),
        priceCents: Math.round(price * 100),
      })),
    ),
  });
  console.log(`Loaded ${esimFiles.reduce((n, f) => n + f.plans.length, 0)} eSIM plans.`);

  // Coupons are fully owned by coupons.json. Clear them before pruning so no
  // coupon still points at a creator about to be removed.
  await db.coupon.deleteMany();

  // A destination whose file was deleted is removed (cascades to its places,
  // itineraries and items), then any creator left with no itineraries.
  const goneDestinations = await db.destination.deleteMany({
    where: { slug: { notIn: destinations.map((d) => d.slug) } },
  });
  const goneCreators = await db.creator.deleteMany({
    where: { handle: { notIn: [...creatorHandles] }, itineraries: { none: {} } },
  });
  if (goneDestinations.count || goneCreators.count) {
    console.log(
      `Removed ${goneDestinations.count} destinations and ${goneCreators.count} creators no longer in data/.`,
    );
  }

  await db.coupon.createMany({
    data: coupons.map(({ vendor, creator, ...c }) => ({
      ...c,
      vendorId: vendorIds.get(vendor)!,
      creatorId: creator ? (creatorIds.get(creator) ?? null) : null,
    })),
  });
  console.log(`Loaded ${vendors.length} vendors, ${coupons.length} coupons.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
