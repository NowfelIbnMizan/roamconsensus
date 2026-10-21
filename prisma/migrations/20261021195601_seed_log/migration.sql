-- CreateTable
CREATE TABLE "SeedLog" (
    "key" TEXT NOT NULL,
    "loadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeedLog_pkey" PRIMARY KEY ("key")
);

-- Everything already in the database counts as loaded.
INSERT INTO "SeedLog" ("key") SELECT 'destination:' || "slug" FROM "Destination" ON CONFLICT DO NOTHING;
INSERT INTO "SeedLog" ("key") SELECT 'itinerary:' || "slug" FROM "Itinerary" ON CONFLICT DO NOTHING;
