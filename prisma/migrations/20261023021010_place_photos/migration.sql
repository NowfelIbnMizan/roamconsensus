-- AlterTable
ALTER TABLE "Place" ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[];
