-- CreateTable
CREATE TABLE "PageIntro" (
    "path" TEXT NOT NULL,
    "draft" TEXT,
    "text" TEXT,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageIntro_pkey" PRIMARY KEY ("path")
);
