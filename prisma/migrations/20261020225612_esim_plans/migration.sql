-- CreateTable
CREATE TABLE "EsimPlan" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dataMb" INTEGER,
    "days" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "network" TEXT,
    "speed" TEXT,
    "hotspot" BOOLEAN,
    "notes" TEXT,
    "url" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EsimPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EsimPlan_country_idx" ON "EsimPlan"("country");
