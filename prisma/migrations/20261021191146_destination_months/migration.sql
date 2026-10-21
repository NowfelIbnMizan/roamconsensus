-- CreateEnum
CREATE TYPE "Crowd" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- AlterTable
ALTER TABLE "Destination" ADD COLUMN     "climateSourceUrl" TEXT;

-- CreateTable
CREATE TABLE "DestinationMonth" (
    "id" TEXT NOT NULL,
    "destinationId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "highC" INTEGER,
    "lowC" INTEGER,
    "rainMm" INTEGER,
    "crowd" "Crowd",
    "note" TEXT,

    CONSTRAINT "DestinationMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DestinationMonth_destinationId_month_key" ON "DestinationMonth"("destinationId", "month");

-- AddForeignKey
ALTER TABLE "DestinationMonth" ADD CONSTRAINT "DestinationMonth_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Typical Bali weather and crowds for existing databases (live data isn't reseeded). Editable in admin.
UPDATE "Destination" SET "climateSourceUrl" = 'https://en.wikipedia.org/wiki/Denpasar#Climate' WHERE "slug" = 'bali' AND "climateSourceUrl" IS NULL;
INSERT INTO "DestinationMonth" ("id", "destinationId", "month", "highC", "lowC", "rainMm", "crowd", "note")
SELECT md5(random()::text || m.month::text), d."id", m.month, m.high, m.low, m.rain, m.crowd, m.note
FROM "Destination" d, (VALUES
  (1, 31, 24, 345, 'MEDIUM'::"Crowd", 'Wet season. Busy over New Year, quiet after.'),
  (2, 31, 24, 274, 'LOW'::"Crowd", 'Wettest stretch and lowest prices. Short, heavy afternoon storms.'),
  (3, 31, 24, 234, 'LOW'::"Crowd", 'Nyepi (Day of Silence) usually falls in March: the whole island shuts for 24 hours, airport included. Check the date.'),
  (4, 32, 24, 88, 'MEDIUM'::"Crowd", 'Dry season begins. Green rice terraces, fair prices.'),
  (5, 31, 23, 93, 'MEDIUM'::"Crowd", 'Dry, green and not yet crowded.'),
  (6, 30, 23, 53, 'HIGH'::"Crowd", 'Dry. School holidays push prices up from late June.'),
  (7, 29, 22, 55, 'HIGH'::"Crowd", 'Peak season: driest, busiest, priciest. Book stays early.'),
  (8, 30, 22, 25, 'HIGH'::"Crowd", 'Peak season continues. Best weather for Nusa Penida boats and Mount Batur.'),
  (9, 30, 23, 47, 'MEDIUM'::"Crowd", 'Still dry with fewer crowds. A sweet spot.'),
  (10, 31, 23, 63, 'MEDIUM'::"Crowd", 'Warm and calm before the rains.'),
  (11, 31, 24, 179, 'LOW'::"Crowd", 'Rains return. Quiet and cheaper.'),
  (12, 31, 24, 276, 'HIGH'::"Crowd", 'Wet, and very busy from Christmas to New Year.')
) AS m(month, high, low, rain, crowd, note)
WHERE d."slug" = 'bali'
ON CONFLICT ("destinationId", "month") DO NOTHING;
