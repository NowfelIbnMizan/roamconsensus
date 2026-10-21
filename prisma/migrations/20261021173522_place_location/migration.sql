-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;

-- Approximate pins for the Bali places that already exist (live data isn't reseeded). Editable in admin.
UPDATE "Place" SET "lat" = -8.8062, "lng" = 115.2252 WHERE "slug" = 'marriotts-bali-nusa-dua-gardens' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.7953, "lng" = 115.2335 WHERE "slug" = 'nusa-dua-beach-geger-beach-pandawa-beach' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8001, "lng" = 115.2299 WHERE "slug" = 'bali-collection' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8291, "lng" = 115.0849 WHERE "slug" = 'uluwatu-temple' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8285, "lng" = 115.0857 WHERE "slug" = 'kecak-dance-performance' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.7716, "lng" = 115.2213 WHERE "slug" = 'bumbu-bali' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6795, "lng" = 115.2638 WHERE "slug" = 'ferry-from-sanur-to-nusa-penida' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.7503, "lng" = 115.4746 WHERE "slug" = 'west-nusa-penida' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.7681, "lng" = 115.6203 WHERE "slug" = 'diamond-beach' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6826, "lng" = 115.4887 WHERE "slug" = 'maruti-beach-club' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5073, "lng" = 115.263 WHERE "slug" = 'ubud-art-market' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.242, "lng" = 115.375 WHERE "slug" = 'mount-batur-sunrise-hike' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.4335, "lng" = 115.2788 WHERE "slug" = 'tegalalang-rice-terraces' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5232, "lng" = 115.2873 WHERE "slug" = 'goa-gajah-and-pura-gunung-lebah' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5025, "lng" = 115.256 WHERE "slug" = 'copper-kitchen-and-bar' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5056, "lng" = 115.2556 WHERE "slug" = 'alchemy-umah-pizza-warung-di-koi' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.513, "lng" = 115.261 WHERE "slug" = 'no-mas-bar-cp-lounge' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.511, "lng" = 115.264 WHERE "slug" = 'ubud-yoga' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6212, "lng" = 115.0868 WHERE "slug" = 'pura-tanah-lot' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6611, "lng" = 115.1386 WHERE "slug" = 'canggu-beach-clubs' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6455, "lng" = 115.1388 WHERE "slug" = 'the-shady-shack' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6845, "lng" = 115.162 WHERE "slug" = 'coffee-cartel' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.686, "lng" = 115.164 WHERE "slug" = 'prana-spa' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6795, "lng" = 115.1532 WHERE "slug" = 'w-hotel' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.6738, "lng" = 115.16 WHERE "slug" = 'merah-putih' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8384, "lng" = 115.1294 WHERE "slug" = 'the-edge' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8487, "lng" = 115.169 WHERE "slug" = 'green-bowl-beach' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.8467, "lng" = 115.1525 WHERE "slug" = 'sundays-beach-club' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.678, "lng" = 115.1615 WHERE "slug" = 'sarong' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.507, "lng" = 115.262 WHERE "slug" = 'ubud-shopping' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5068, "lng" = 115.2627 WHERE "slug" = 'royal-ubud-palace-fire-show' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.412, "lng" = 115.587 WHERE "slug" = 'tirta-gangga-water-palace' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.3906, "lng" = 115.6311 WHERE "slug" = 'gates-of-heaven' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.49, "lng" = 115.24 WHERE "slug" = 'ubud-rafting' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.5752, "lng" = 115.2899 WHERE "slug" = 'tegenungan-waterfall' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
UPDATE "Place" SET "lat" = -8.4153, "lng" = 115.3155 WHERE "slug" = 'tirta-empul-temple' AND "lat" IS NULL AND "destinationId" IN (SELECT "id" FROM "Destination" WHERE "slug" = 'bali');
