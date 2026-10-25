-- kyoto: checked place by place on 2026-10-25 (still open, own websites, prices with sources).

UPDATE "Place" p SET "website" = 'https://www.aman.com/resorts/aman-kyoto' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'aman-kyoto';
UPDATE "Place" p SET "website" = 'https://backpackersjapan.co.jp/kyotohostel/en/' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'len-kyoto';
UPDATE "Place" p SET "closed" = true, "tip" = 'Closed for good on 1 January 2025, per Rinn''s own site. Rinn Gion Yasakamae nearby is a different hotel.' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'rinn-gion-yasaka';
UPDATE "Place" p SET "website" = 'https://piecehotel.com/hotels/tunestaykyoto' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'tune-stay-kyoto';
UPDATE "Place" p SET "name" = 'Gahojin Kappa' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'gion-kappa';
UPDATE "Place" p SET "website" = 'https://hachidaime.com/' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'hachidaime-gihey';
UPDATE "Place" p SET "area" = 'Kinugasa (near Kinkaku-ji)', "lat" = 35.034, "lng" = 135.729 FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'hanamakiya';
UPDATE "Place" p SET "website" = 'https://honke-daiichiasahi.com/', "tip" = 'Serves shoyu (soy sauce) pork-bone ramen; there is no miso ramen.' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'honke-daiichi-asahi';
UPDATE "Place" p SET "website" = 'https://shop.kurasushi.co.jp/detail/46' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'kura-sushi-kinkakuji';
UPDATE "Place" p SET "website" = 'https://menyainoichi.net/news' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'menya-inoichi-hanare';
UPDATE "Place" p SET "website" = 'https://www.gion-endo.com/' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'tempura-endo-yasaka';
UPDATE "Place" p SET "website" = 'https://unagi-hirokawa.jp/' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'unagi-hirokawa';
UPDATE "Place" p SET "checkedAt" = '2026-10-25' FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug IN ('aman-kyoto', 'len-kyoto', 'rinn-gion-yasaka', 'tune-stay-kyoto', 'arashiyama-bamboo-grove', 'camellia-flower-tea-ceremony', 'eikando', 'fushimi-inari-taisha', 'fushimi-sake-district', 'ginkaku-ji', 'gion', 'gion-corner', 'hanamikoji-street', 'heian-jingu', 'higashi-hongan-ji', 'iwatayama-monkey-park', 'kamo-river', 'kinkaku-ji', 'kiyomizu-dera', 'kodai-ji', 'kurama-dera', 'kyoto-imperial-palace', 'kyoto-international-manga-museum', 'kyoto-station-building', 'maikoya-kyoto-tea-ceremony', 'maruyama-park', 'nijo-jo', 'ninenzaka-sannenzaka', 'ninna-ji', 'philosophers-path', 'pontocho', 'ryoan-ji', 'tenryu-ji', 'togetsukyo-bridge', 'yasaka-koshindo', 'yasaka-pagoda-hokan-ji', 'yasaka-shrine', 'gion-kappa', 'hachidaime-gihey', 'hanamakiya', 'honke-daiichi-asahi', 'kobe-beef-steak-mouriya-gion', 'kura-sushi-kinkakuji', 'menya-inoichi-hanare', 'monk-kyoto', 'nishiki-market', 'sushi-no-musashi', 'tempura-endo-yasaka', 'unagi-hirokawa', 'randen-arashiyama-to-omuro-ninnaji');

UPDATE "Item" SET "priceCents" = 633, "priceNote" = '¥1,000 entry (¥1,500 in autumn)', "priceSourceUrl" = 'https://souda-kyoto.jp/guide/spot/eikando.html', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-2-days-bucketlistly--eikan-do' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 158, "priceNote" = '¥250 a ride', "priceSourceUrl" = 'https://www.keifuku.co.jp/cms/randen_ticket/', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-3-days-willflyforfood--keifuku-randen-tram' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 620, "priceNote" = 'ramen ¥980', "priceSourceUrl" = 'https://iekei.shop/daiichi-asahi', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--honke-daiichi-asahi' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 4873, "priceNote" = 'lunch courses from ¥7,700', "priceSourceUrl" = 'https://r.gnavi.co.jp/k461300/lunch/', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--tempura-endo-yasaka' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 633, "priceNote" = 'soba from ¥1,000', "priceSourceUrl" = 'https://r.gnavi.co.jp/ka35700/menu1/', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--hanamakiya' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 9747, "priceNote" = '¥15,400 tasting menu', "priceSourceUrl" = 'https://www.neverendingvoyage.com/monk-kyoto-restaurant-review/', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--monk' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 5696, "priceNote" = 'Kobe beef lunch from ¥9,000', "priceSourceUrl" = 'https://www.mouriya.co.jp/gion/menu', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--kobe-beef-steak-mouriya-gion' AND "priceCents" IS NULL;
UPDATE "Item" SET "priceCents" = 102, "priceNote" = 'plates ¥161–977', "priceSourceUrl" = 'https://sushinomusashi.com/menu/', "priceCheckedAt" = '2026-10-25' WHERE "id" = 'kyoto-5-days-luxury-foratravel--sushi-no-musashi' AND "priceCents" IS NULL;

-- "Ninenzaka & Sannenzaka" was two streets in one stop; now two places and two stops.
UPDATE "Place" p SET "slug" = 'sannenzaka', "name" = 'Sannenzaka',
  "blurb" = 'Stone-stepped lane of shops and teahouses climbing to Kiyomizu-dera.', "lat" = 34.996, "lng" = 135.781
FROM "Destination" d WHERE d.id = p."destinationId" AND d.slug = 'kyoto' AND p.slug = 'ninenzaka-sannenzaka';
INSERT INTO "Place" ("id", "slug", "name", "category", "area", "blurb", "lat", "lng", "checkedAt", "destinationId")
SELECT 'kyoto-ninenzaka', 'ninenzaka', 'Ninenzaka', 'EXPERIENCE', 'Higashiyama',
  'Preserved lane of wooden shops and teahouses just below Sannenzaka.', 34.9978, 135.7808, '2026-10-25', d.id
FROM "Destination" d WHERE d.slug = 'kyoto' ON CONFLICT DO NOTHING;
UPDATE "Item" i SET "name" = 'Sannenzaka' FROM "Place" p WHERE p.id = i."placeId" AND p.slug = 'sannenzaka';
UPDATE "Item" i SET "position" = i."position" + 1
FROM "Item" a JOIN "Place" p ON p.id = a."placeId" AND p.slug = 'sannenzaka'
WHERE i."itineraryId" = a."itineraryId" AND i."position" > a."position";
INSERT INTO "Item" ("id", "day", "position", "name", "category", "priceCents", "priceNote", "itineraryId", "placeId")
SELECT it.slug || '--ninenzaka', a."day", a."position" + 1, 'Ninenzaka', 'EXPERIENCE', 0, 'free to walk around', a."itineraryId", n.id
FROM "Item" a
JOIN "Place" p ON p.id = a."placeId" AND p.slug = 'sannenzaka'
JOIN "Itinerary" it ON it.id = a."itineraryId"
JOIN "Place" n ON n.slug = 'ninenzaka' AND n."destinationId" = p."destinationId"
ON CONFLICT DO NOTHING;
