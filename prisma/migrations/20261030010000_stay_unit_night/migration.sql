-- Two priced stays had no unit, so they showed "$170" instead of "$170/night" and were left out of the
-- Where to stay "from" prices. Both prices are per night (see their price notes). Only fills NULLs.
UPDATE "Item" SET "unit" = 'night'
WHERE "category" = 'STAY' AND "unit" IS NULL AND "priceCents" > 0
  AND "name" IN ('Marriott''s Bali Nusa Dua Gardens', 'Overnight at Siloam Sauna');
