-- AlterEnum
ALTER TYPE "PhotoSource" ADD VALUE 'WEBSITE';

-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "website" TEXT;
