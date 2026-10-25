-- "Closed" becomes a flag instead of a guess from the tip text ("Closed Mondays" was showing as closed).
ALTER TABLE "Place" ADD COLUMN "closed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Place" ADD COLUMN "checkedAt" TIMESTAMP(3);
ALTER TABLE "Item" ADD COLUMN "priceCheckedAt" TIMESTAMP(3);

UPDATE "Place" SET "closed" = true WHERE "slug" IN ('sushi-hayata', 'miraikan', 'big-buddha-phuket');

-- Every researched price so far was looked up in October 2026.
UPDATE "Item" SET "priceCheckedAt" = '2026-10-20' WHERE "priceSourceUrl" IS NOT NULL;
