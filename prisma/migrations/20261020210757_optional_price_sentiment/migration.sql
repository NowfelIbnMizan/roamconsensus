-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('MUST_VISIT', 'RECOMMENDED', 'OPTIONAL');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "priceNote" TEXT,
ADD COLUMN     "sentiment" "Sentiment",
ALTER COLUMN "priceCents" DROP NOT NULL;
