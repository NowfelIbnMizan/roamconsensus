-- Owner posts can be a take on one route, two routes side by side, or the owner's own trip. Adds columns only; existing posts stay GENERAL.
-- CreateEnum
CREATE TYPE "PostKind" AS ENUM ('GENERAL', 'TAKE', 'COMPARE', 'TRIP');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "itineraryId" TEXT,
ADD COLUMN     "kind" "PostKind" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "otherItineraryId" TEXT;

-- CreateIndex
CREATE INDEX "Post_itineraryId_idx" ON "Post"("itineraryId");

-- CreateIndex
CREATE INDEX "Post_otherItineraryId_idx" ON "Post"("otherItineraryId");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_otherItineraryId_fkey" FOREIGN KEY ("otherItineraryId") REFERENCES "Itinerary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

