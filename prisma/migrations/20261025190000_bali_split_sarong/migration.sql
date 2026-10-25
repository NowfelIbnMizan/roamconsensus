-- Sarong's own site says the Seminyak restaurant will reopen next year somewhere else.
UPDATE "Place" p SET "closed" = true, "checkedAt" = '2026-10-25',
  "tip" = 'Closed: Sarong''s own site says it will reopen next year in a new location.'
FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'bali' AND p.slug = 'sarong';

-- "Alchemy / Umah Pizza / Warung Di Koi" was three restaurants in one stop; now three places and three stops.
UPDATE "Place" p SET "slug" = 'alchemy', "name" = 'Alchemy', "area" = 'Penestanan',
  "blurb" = 'Raw-vegan cafe in Penestanan, known for its build-your-own salad and breakfast bar.',
  "lat" = -8.508, "lng" = 115.251, "checkedAt" = '2026-10-25'
FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'bali' AND p.slug = 'alchemy-umah-pizza-warung-di-koi';

INSERT INTO "Place" ("id", "slug", "name", "category", "area", "blurb", "lat", "lng", "checkedAt", "destinationId")
SELECT 'bali-umah-pizza', 'umah-pizza', 'Umah Pizza', 'FOOD', 'Ubud', 'Small wood-fired pizza place on Jalan Bisma.',
  -8.507059, 115.259179, '2026-10-25', d.id FROM "Destination" d WHERE d.slug = 'bali'
ON CONFLICT DO NOTHING;
INSERT INTO "Place" ("id", "slug", "name", "category", "area", "blurb", "lat", "lng", "destinationId")
SELECT 'bali-warung-de-koi', 'warung-de-koi', 'Warung de Koi', 'FOOD', 'Tampaksiring',
  'Local warung on the road to Tirta Empul temple, about 15 km north-east of Ubud.', -8.4175, 115.31722, d.id
FROM "Destination" d WHERE d.slug = 'bali'
ON CONFLICT DO NOTHING;

UPDATE "Item" SET "name" = 'Alchemy', "note" = 'Alchemy for raw/vegan.'
WHERE "id" = 'bali-one-week-racheloffduty--alchemy-umah-pizza-warung-di-koi';
UPDATE "Item" SET "position" = "position" + 2
WHERE "itineraryId" = (SELECT "itineraryId" FROM "Item" WHERE "id" = 'bali-one-week-racheloffduty--alchemy-umah-pizza-warung-di-koi')
  AND "position" > (SELECT "position" FROM "Item" WHERE "id" = 'bali-one-week-racheloffduty--alchemy-umah-pizza-warung-di-koi');
INSERT INTO "Item" ("id", "day", "position", "name", "note", "category", "sentiment", "itineraryId", "placeId")
SELECT v.id, a."day", a."position" + v.n, v.name, v.note, 'FOOD', 'RECOMMENDED', a."itineraryId", p.id
FROM "Item" a
CROSS JOIN (VALUES
  ('bali-one-week-racheloffduty--umah-pizza', 1, 'Umah Pizza', 'Umah for cozy pizza.', 'umah-pizza'),
  ('bali-one-week-racheloffduty--warung-di-koi', 2, 'Warung Di Koi', 'Warung Di Koi for solid mie goreng.', 'warung-de-koi')
) AS v(id, n, name, note, place)
JOIN "Place" p ON p.slug = v.place
JOIN "Destination" d ON d.id = p."destinationId" AND d.slug = 'bali'
WHERE a."id" = 'bali-one-week-racheloffduty--alchemy-umah-pizza-warung-di-koi'
ON CONFLICT DO NOTHING;
