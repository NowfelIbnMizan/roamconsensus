-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN "editorTake" TEXT;

-- CreateTable
CREATE TABLE "Editor" (
    "id" TEXT NOT NULL DEFAULT 'me',
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "bio" TEXT NOT NULL,
    "photoUrl" TEXT,
    "email" TEXT,
    "instagramUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Editor_pkey" PRIMARY KEY ("id")
);
