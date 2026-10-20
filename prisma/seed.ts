// Sample data: fictional creators, placeholder affiliate IDs. Replace with real data before launch.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ItemCategory, type Tier } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const vendors = [
  { slug: "agoda", name: "Agoda", homepage: "https://www.agoda.com" },
  { slug: "booking", name: "Booking.com", homepage: "https://www.booking.com" },
  { slug: "klook", name: "Klook", homepage: "https://www.klook.com" },
  { slug: "getyourguide", name: "GetYourGuide", homepage: "https://www.getyourguide.com" },
  { slug: "amazon", name: "Amazon", homepage: "https://www.amazon.com" },
  { slug: "truely", name: "Truely eSIM", homepage: "https://www.truely.com" },
];

const places: { slug: string; name: string; category: ItemCategory; tip?: string }[] = [
  { slug: "fushimi-inari", name: "Fushimi Inari Taisha", category: "EXPERIENCE", tip: "Go at sunrise, crowds thin past Yotsutsuji intersection." },
  { slug: "arashiyama-bamboo", name: "Arashiyama Bamboo Grove", category: "EXPERIENCE", tip: "Before 7:30am or skip it." },
  { slug: "kinkakuji", name: "Kinkaku-ji (Golden Pavilion)", category: "EXPERIENCE" },
  { slug: "nishiki-market", name: "Nishiki Market", category: "FOOD", tip: "Closes around 6pm; many stalls shut Wednesdays." },
  { slug: "gion-walk", name: "Gion evening walk", category: "EXPERIENCE" },
  { slug: "kiyomizu-dera", name: "Kiyomizu-dera", category: "EXPERIENCE" },
  { slug: "tea-ceremony", name: "Tea ceremony", category: "EXPERIENCE" },
  { slug: "japan-esim", name: "Japan eSIM", category: "ESIM" },
  { slug: "icoca-card", name: "ICOCA transit card", category: "TRANSIT" },
];

type SeedItem = {
  day: number;
  name: string;
  category: ItemCategory;
  price: number;
  unit?: string;
  quantity?: number;
  place?: string;
  vendor?: string;
  note?: string;
};

const creators: {
  handle: string;
  name: string;
  platform: "INSTAGRAM" | "TIKTOK" | "YOUTUBE" | "BLOG";
  bio: string;
  code: string;
  itinerary: { slug: string; title: string; summary: string; tier: Tier; days: number; items: SeedItem[] };
}[] = [
  {
    handle: "packlightmika",
    name: "Mika on a Budget",
    platform: "TIKTOK",
    bio: "Hostels, 7-Eleven breakfasts, early alarms.",
    code: "MIKA10",
    itinerary: {
      slug: "kyoto-3-days-backpacker",
      title: "Kyoto in 3 days under $300",
      summary: "Temples at dawn, konbini meals, one big splurge on street food.",
      tier: "BACKPACKER",
      days: 3,
      items: [
        { day: 1, name: "Capsule hostel near Kyoto Station", category: "STAY", price: 28, unit: "night", quantity: 3, vendor: "booking" },
        { day: 1, name: "Fushimi Inari at sunrise", category: "EXPERIENCE", price: 0, place: "fushimi-inari" },
        { day: 1, name: "Nishiki Market grazing", category: "FOOD", price: 20, place: "nishiki-market" },
        { day: 2, name: "Arashiyama Bamboo Grove", category: "EXPERIENCE", price: 0, place: "arashiyama-bamboo" },
        { day: 2, name: "Gion at dusk", category: "EXPERIENCE", price: 0, place: "gion-walk" },
        { day: 3, name: "Kiyomizu-dera", category: "EXPERIENCE", price: 3, place: "kiyomizu-dera", vendor: "klook" },
        { day: 1, name: "ICOCA card top-up", category: "TRANSIT", price: 15, place: "icoca-card", vendor: "klook" },
        { day: 1, name: "Japan eSIM 5GB", category: "ESIM", price: 9, place: "japan-esim", vendor: "truely" },
      ],
    },
  },
  {
    handle: "slowtravelsam",
    name: "Slow Travel Sam",
    platform: "YOUTUBE",
    bio: "Mid-range comfort, long walks, good coffee.",
    code: "SAMTRAVELS",
    itinerary: {
      slug: "kyoto-4-days-midrange",
      title: "4 relaxed days in Kyoto",
      summary: "Boutique ryokan, guided Arashiyama morning, tea ceremony.",
      tier: "MIDRANGE",
      days: 4,
      items: [
        { day: 1, name: "Machiya boutique stay in Higashiyama", category: "STAY", price: 140, unit: "night", quantity: 4, vendor: "agoda" },
        { day: 1, name: "Fushimi Inari early hike", category: "EXPERIENCE", price: 0, place: "fushimi-inari" },
        { day: 2, name: "Arashiyama guided morning tour", category: "EXPERIENCE", price: 65, place: "arashiyama-bamboo", vendor: "getyourguide" },
        { day: 2, name: "Kinkaku-ji", category: "EXPERIENCE", price: 4, place: "kinkakuji" },
        { day: 3, name: "Tea ceremony in Gion", category: "EXPERIENCE", price: 45, place: "tea-ceremony", vendor: "klook" },
        { day: 3, name: "Nishiki Market lunch", category: "FOOD", price: 30, place: "nishiki-market" },
        { day: 4, name: "Kiyomizu-dera", category: "EXPERIENCE", price: 3, place: "kiyomizu-dera" },
        { day: 1, name: "Japan eSIM 10GB", category: "ESIM", price: 15, place: "japan-esim", vendor: "truely" },
        { day: 1, name: "Packable daypack", category: "GEAR", price: 35, vendor: "amazon" },
      ],
    },
  },
  {
    handle: "aurelia.journeys",
    name: "Aurelia Journeys",
    platform: "INSTAGRAM",
    bio: "Luxury ryokans and private guides.",
    code: "AURELIA",
    itinerary: {
      slug: "kyoto-3-days-luxury",
      title: "Kyoto luxe: 3 days of ryokan calm",
      summary: "Private guide, kaiseki dinners, sunrise shrine before the crowds.",
      tier: "LUXURY",
      days: 3,
      items: [
        { day: 1, name: "Riverside luxury ryokan, kaiseki included", category: "STAY", price: 650, unit: "night", quantity: 3, vendor: "agoda" },
        { day: 1, name: "Private sunrise Fushimi Inari", category: "EXPERIENCE", price: 180, place: "fushimi-inari", vendor: "getyourguide" },
        { day: 2, name: "Arashiyama bamboo + rickshaw", category: "EXPERIENCE", price: 120, place: "arashiyama-bamboo", vendor: "klook" },
        { day: 2, name: "Kinkaku-ji private entry", category: "EXPERIENCE", price: 60, place: "kinkakuji", vendor: "getyourguide" },
        { day: 3, name: "Gion geiko district walk with historian", category: "EXPERIENCE", price: 90, place: "gion-walk", vendor: "getyourguide" },
        { day: 3, name: "Private tea ceremony", category: "EXPERIENCE", price: 150, place: "tea-ceremony", vendor: "klook" },
        { day: 1, name: "Private airport transfer", category: "TRANSIT", price: 220, vendor: "klook" },
        { day: 1, name: "Japan eSIM unlimited", category: "ESIM", price: 25, place: "japan-esim", vendor: "truely" },
      ],
    },
  },
];

async function main() {
  await db.$transaction([
    db.affiliateLink.deleteMany(),
    db.coupon.deleteMany(),
    db.item.deleteMany(),
    db.itinerary.deleteMany(),
    db.place.deleteMany(),
    db.destination.deleteMany(),
    db.creator.deleteMany(),
    db.vendor.deleteMany(),
    db.photoCache.deleteMany(),
  ]);

  const vendorIds = new Map<string, string>();
  for (const v of vendors) vendorIds.set(v.slug, (await db.vendor.create({ data: v })).id);

  const kyoto = await db.destination.create({
    data: {
      slug: "kyoto",
      name: "Kyoto",
      country: "Japan",
      summary: "Shrines, bamboo groves and tea houses. Three creators, three budgets, one city.",
    },
  });

  const placeIds = new Map<string, string>();
  for (const p of places) {
    placeIds.set(p.slug, (await db.place.create({ data: { ...p, destinationId: kyoto.id } })).id);
  }

  await db.coupon.createMany({
    data: [
      { code: "ROAMKLOOK8", type: "PLATFORM", description: "8% off activities", vendorId: vendorIds.get("klook")! },
      { code: "BOOK2026", type: "PUBLIC", description: "Public promo", vendorId: vendorIds.get("booking")! },
      { code: "ROAMSIM15", type: "PLATFORM", description: "15% off eSIMs", vendorId: vendorIds.get("truely")! },
    ],
  });

  for (const c of creators) {
    const creator = await db.creator.create({
      data: {
        handle: c.handle,
        name: c.name,
        platform: c.platform,
        bio: c.bio,
        profileUrl: `https://example.com/@${c.handle}`,
      },
    });
    await db.coupon.create({
      data: { code: c.code, type: "CREATOR", creatorId: creator.id, vendorId: vendorIds.get("klook")! },
    });

    const it = c.itinerary;
    await db.itinerary.create({
      data: {
        slug: it.slug,
        title: it.title,
        summary: it.summary,
        tier: it.tier,
        days: it.days,
        sourceUrl: `https://example.com/@${c.handle}/kyoto`,
        destinationId: kyoto.id,
        creatorId: creator.id,
        items: {
          create: it.items.map((item, i) => {
            const vendorId = item.vendor ? vendorIds.get(item.vendor) : undefined;
            return {
              day: item.day,
              position: i,
              name: item.name,
              note: item.note,
              category: item.category,
              priceCents: Math.round(item.price * 100),
              unit: item.unit,
              quantity: item.quantity ?? 1,
              placeId: item.place ? placeIds.get(item.place) : undefined,
              vendorId,
              links: vendorId
                ? {
                    create: [
                      { vendorId, url: `${vendors.find((v) => v.slug === item.vendor)!.homepage}/?aid=ROAMCONSENSUS` },
                      { vendorId, creatorId: creator.id, url: `${vendors.find((v) => v.slug === item.vendor)!.homepage}/?aid=${c.handle}` },
                    ],
                  }
                : undefined,
            };
          }),
        },
      },
    });
  }

  console.log("Seeded Kyoto: 3 creators, 3 itineraries.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
