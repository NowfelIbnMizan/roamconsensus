// Loads data/*.json into the database. Runs on every Netlify build.
// An empty database gets everything. After that the admin panel owns content, and a deploy only adds itineraries
// and destinations that are new in data/ (see addNew).
// Rows that disappear from the files are removed only for itineraries' items; set SEED_RESET=1 to wipe everything first.
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { CreatorData, ItineraryData, PlaceData, slug, url } from "../src/lib/content-schema";
import { loadItinerary } from "../src/lib/content-load";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

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
  tips: z
    .array(z.object({ topic: z.string(), title: z.string(), body: z.string(), sourceUrl: url.optional() }))
    .default([]),
  sample: z.boolean().default(false),
  places: z.array(PlaceData),
  creators: z.array(CreatorData),
  itineraries: z.array(ItineraryData),
});

const dataDir = path.join(process.cwd(), "data");

function load<T extends z.ZodType>(schema: T, file: string): z.infer<T> {
  const result = schema.safeParse(JSON.parse(readFileSync(file, "utf8")));
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid data in ${path.relative(process.cwd(), file)}:\n${issues}`);
  }
  return result.data;
}

function loadEsimFiles() {
  const esimDir = path.join(dataDir, "esim");
  return readdirSync(esimDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => load(EsimFile, path.join(esimDir, f)));
}

const esimRows = (files: z.infer<typeof EsimFile>[]) =>
  files.flatMap(({ country, checkedAt, plans }) =>
    plans.map(({ dataGb, price, ...p }) => ({
      ...p,
      country,
      checkedAt,
      dataMb: dataGb === null ? null : Math.round(dataGb * 1024),
      priceCents: Math.round(price * 100),
    })),
  );

type Data = z.infer<typeof Destination>;

const logLoaded = (keys: string[]) =>
  db.seedLog.createMany({ data: keys.map((key) => ({ key })), skipDuplicates: true });

/**
 * Deploys on a database that already has content: add itineraries (and new destinations) that data/ has but the
 * seed has never loaded, with any creators, places and vendors they need. Nothing already in the database is
 * changed, and anything deleted in the admin panel stays deleted, since SeedLog remembers it was loaded once.
 * eSIM files are loaded for countries that have no plans in the database yet.
 */
async function addNew(vendors: z.infer<typeof Vendors>, destinations: Data[]) {
  const loaded = new Set((await db.seedLog.findMany({ select: { key: true } })).map((r) => r.key));
  const vendorIds = new Map((await db.vendor.findMany()).map((v) => [v.slug, v.id]));
  for (const v of vendors) if (!vendorIds.has(v.slug)) vendorIds.set(v.slug, (await db.vendor.create({ data: v })).id);

  let added = 0;
  for (const d of destinations) {
    const { places, creators, itineraries, sample, months, tips, ...fields } = d;
    const todo = itineraries.filter((it) => !loaded.has(`itinerary:${it.slug}`));
    const newDestination = !loaded.has(`destination:${d.slug}`);
    if (!todo.length && !newDestination) continue;

    let dest = await db.destination.findUnique({ where: { slug: d.slug } });
    if (!dest) {
      if (!newDestination) continue; // deleted in the admin panel: leave it gone
      dest = await db.destination.create({
        data: {
          ...fields,
          isSample: sample,
          months: { create: months },
          tips: { create: tips.map((t, position) => ({ ...t, position })) },
        },
      });
    }

    const placeIds = new Map(
      (await db.place.findMany({ where: { destinationId: dest.id } })).map((p) => [p.slug, p.id]),
    );
    const needed = new Set(todo.flatMap((it) => it.items.flatMap((i) => (i.place ? [i.place] : []))));
    for (const p of places)
      if (!placeIds.has(p.slug) && (needed.has(p.slug) || newDestination))
        placeIds.set(p.slug, (await db.place.create({ data: { ...p, destinationId: dest.id } })).id);

    const creatorIds = new Map((await db.creator.findMany()).map((c) => [c.handle, c.id]));
    for (const c of creators)
      if (!creatorIds.has(c.handle) && todo.some((it) => it.creator === c.handle))
        creatorIds.set(c.handle, (await db.creator.create({ data: c })).id);

    for (const it of todo) {
      if (await db.itinerary.findUnique({ where: { slug: it.slug } })) continue;
      await loadItinerary(db, it, dest.id, creatorIds, placeIds, vendorIds);
      console.log(`Added itinerary ${it.slug}.`);
      added++;
    }
    await logLoaded([`destination:${d.slug}`, ...todo.map((it) => `itinerary:${it.slug}`)]);
  }

  // eSIM plans for a country that has none yet (e.g. a new destination's country).
  const haveEsim = new Set(
    (await db.esimPlan.findMany({ distinct: ["country"], select: { country: true } })).map((r) => r.country),
  );
  const newEsim = loadEsimFiles().filter((f) => !haveEsim.has(f.country));
  if (newEsim.length) {
    await db.esimPlan.createMany({ data: esimRows(newEsim) });
    console.log(`Added eSIM plans for ${newEsim.map((f) => f.country).join(", ")}.`);
  }
  console.log(
    added
      ? `Added ${added} new itineraries from data/. Existing content was left as edited in the admin panel.`
      : "Database already has content and no new itineraries in data/; nothing to load. Set FORCE_SEED=1 to reload data/.",
  );
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
    await addNew(vendors, destinations);
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
    const { places, creators, itineraries, sample, months, tips, ...fields } = d;
    const dest = await db.destination.upsert({
      where: { slug: d.slug },
      create: { ...fields, isSample: sample },
      update: { ...fields, climateSourceUrl: fields.climateSourceUrl ?? null, isSample: sample },
    });

    await db.destinationMonth.deleteMany({ where: { destinationId: dest.id } });
    await db.destinationMonth.createMany({ data: months.map((m) => ({ ...m, destinationId: dest.id })) });
    await db.destinationTip.deleteMany({ where: { destinationId: dest.id } });
    await db.destinationTip.createMany({
      data: tips.map((t, position) => ({ ...t, position, destinationId: dest.id })),
    });

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
        closed: p.closed ?? false,
        checkedAt: p.checkedAt ?? null,
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

    for (const it of itineraries) await loadItinerary(db, it, dest.id, creatorIds, placeIds, vendorIds);
    await logLoaded([`destination:${d.slug}`, ...itineraries.map((it) => `itinerary:${it.slug}`)]);
    console.log(`Loaded ${d.slug}: ${itineraries.length} itineraries, ${creators.length} creators.`);
  }

  // eSIM plans are fully owned by data/esim/*.json, one file per country.
  const esimFiles = loadEsimFiles();
  await db.esimPlan.deleteMany();
  await db.esimPlan.createMany({ data: esimRows(esimFiles) });
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
