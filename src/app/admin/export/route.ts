import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin/auth";

/** Drops null fields, since the data files leave optional values out instead. */
const clean = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined)) as T;

/**
 * Full backup of the site content, laid out like the repo's data/ folder (one key per file), so it can be
 * restored with a forced seed.
 */
export async function GET() {
  if (!(await isAdmin())) return new Response("Log in first.", { status: 401 });

  const [vendors, coupons, destinations, plans] = await Promise.all([
    db.vendor.findMany({ orderBy: { slug: "asc" } }),
    db.coupon.findMany({ include: { vendor: true, creator: true } }),
    db.destination.findMany({
      orderBy: { slug: "asc" },
      include: {
        places: { orderBy: { slug: "asc" } },
        itineraries: {
          orderBy: { slug: "asc" },
          include: {
            creator: true,
            items: {
              orderBy: [{ day: "asc" }, { position: "asc" }],
              include: { place: true, vendor: true, links: true },
            },
          },
        },
      },
    }),
    db.esimPlan.findMany({ orderBy: [{ country: "asc" }, { priceCents: "asc" }] }),
  ]);

  const files: Record<string, unknown> = {
    "vendors.json": vendors.map((v) => ({ slug: v.slug, name: v.name, homepage: v.homepage })),
    "coupons.json": coupons.map((c) =>
      clean({
        vendor: c.vendor.slug,
        code: c.code,
        type: c.type,
        description: c.description,
        creator: c.creator?.handle,
        validFrom: c.validFrom?.toISOString().slice(0, 10),
        validTo: c.validTo?.toISOString().slice(0, 10),
        active: c.active,
      }),
    ),
  };

  for (const d of destinations) {
    const creators = new Map(d.itineraries.map((it) => [it.creator.id, it.creator]));
    files[`destinations/${d.slug}.json`] = clean({
      slug: d.slug,
      name: d.name,
      country: d.country,
      summary: d.summary,
      heroPhotoUrl: d.heroPhotoUrl,
      sample: d.isSample || null,
      places: d.places.map((p) =>
        clean({
          slug: p.slug,
          name: p.name,
          category: p.category,
          area: p.area,
          blurb: p.blurb,
          tip: p.tip,
          website: p.website,
          lat: p.lat,
          lng: p.lng,
        }),
      ),
      creators: [...creators.values()].map((c) =>
        clean({
          handle: c.handle,
          name: c.name,
          platform: c.platform,
          profileUrl: c.profileUrl,
          instagramUrl: c.instagramUrl,
          facebookUrl: c.facebookUrl,
          xUrl: c.xUrl,
          tiktokUrl: c.tiktokUrl,
          youtubeUrl: c.youtubeUrl,
          pinterestUrl: c.pinterestUrl,
          websiteUrl: c.websiteUrl,
          avatarUrl: c.avatarUrl,
          bio: c.bio,
        }),
      ),
      itineraries: d.itineraries.map((it) => ({
        slug: it.slug,
        title: it.title,
        summary: it.summary,
        tier: it.tier,
        days: it.days,
        creator: it.creator.handle,
        sourceUrl: it.sourceUrl,
        items: it.items.map((i) =>
          clean({
            day: i.day,
            name: i.name,
            category: i.category,
            price: i.priceCents === null ? null : i.priceCents / 100,
            priceNote: i.priceNote,
            priceSource: i.priceSourceUrl,
            sentiment: i.sentiment,
            currency: i.currency,
            unit: i.unit,
            quantity: i.quantity,
            note: i.note,
            place: i.place?.slug,
            vendor: i.vendor?.slug,
            ourUrl: i.links.find((l) => l.creatorId === null)?.url,
            creatorUrl: i.links.find((l) => l.creatorId === it.creatorId)?.url,
          }),
        ),
      })),
    });
  }

  for (const country of new Set(plans.map((p) => p.country))) {
    const rows = plans.filter((p) => p.country === country);
    files[`esim/${country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`] = {
      country,
      checkedAt: new Date(Math.max(...rows.map((p) => p.checkedAt.getTime()))).toISOString().slice(0, 10),
      plans: rows.map((p) => ({
        // Null means unlimited here, so it stays when the other empty fields are dropped.
        dataGb: p.dataMb === null ? null : +(p.dataMb / 1024).toFixed(2),
        ...clean({
          provider: p.provider,
          name: p.name,
          days: p.days,
          price: p.priceCents / 100,
          currency: p.currency,
          network: p.network,
          speed: p.speed,
          hotspot: p.hotspot,
          notes: p.notes,
          url: p.url,
          sourceUrl: p.sourceUrl,
        }),
      })),
    };
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(files, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="roamconsensus-backup-${stamp}.json"`,
    },
  });
}
