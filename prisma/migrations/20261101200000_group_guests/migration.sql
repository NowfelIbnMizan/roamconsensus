-- Guests in group trips: friends with no account, named by a member. Cost payers and shares can now be a guest, so
-- those two columns lose their foreign key to User (costs also stay put when someone deletes their account).

-- DropForeignKey
ALTER TABLE "GroupExpense" DROP CONSTRAINT IF EXISTS "GroupExpense_paidById_fkey";

-- DropForeignKey
ALTER TABLE "GroupExpenseShare" DROP CONSTRAINT IF EXISTS "GroupExpenseShare_userId_fkey";

-- CreateTable
CREATE TABLE "GroupGuest" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupGuest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupGuest_groupId_idx" ON "GroupGuest"("groupId");

-- AddForeignKey
ALTER TABLE "GroupGuest" ADD CONSTRAINT "GroupGuest_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

