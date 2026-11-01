-- Site-wide admin switches (key/value). New table only.
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);
