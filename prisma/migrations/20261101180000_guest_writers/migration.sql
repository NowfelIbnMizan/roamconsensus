-- Guest blog writers: invite links, a writer flag on accounts, and review fields on posts. Additive only.
ALTER TABLE "User" ADD COLUMN "writer" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Post" ADD COLUMN "authorId" TEXT,
ADD COLUMN "authorName" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "reviewNote" TEXT;

CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");
CREATE INDEX "Post_submittedAt_idx" ON "Post"("submittedAt");

ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WriterInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,

    CONSTRAINT "WriterInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WriterInvite_token_key" ON "WriterInvite"("token");
