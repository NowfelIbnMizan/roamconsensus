-- Rachel Off Duty's Bali week: the import folded Day 5 (Ubud day tour and nightlife) into Day 4 and Day 7 (Canggu
-- beach club before the flight) into Day 6, so the route showed no plan for Days 5 and 7. Moves those stops back.
UPDATE "Item" i SET "day" = 5
FROM "Itinerary" t, "Place" p
WHERE i."itineraryId" = t."id" AND i."placeId" = p."id"
  AND t."slug" = 'bali-one-week-racheloffduty' AND i."day" = 4
  AND p."slug" IN ('tegalalang-rice-terraces', 'goa-gajah-and-pura-gunung-lebah', 'no-mas', 'cp-lounge');

UPDATE "Item" i SET "day" = 7
FROM "Itinerary" t, "Place" p
WHERE i."itineraryId" = t."id" AND i."placeId" = p."id"
  AND t."slug" = 'bali-one-week-racheloffduty' AND i."day" = 6
  AND p."slug" = 'canggu-beach-clubs';
