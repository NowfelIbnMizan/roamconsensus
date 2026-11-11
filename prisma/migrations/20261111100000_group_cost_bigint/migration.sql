-- Group costs are stored in "cents" of their own currency. 30,000,000 VND is 3,000,000,000 cents, more than an
-- INTEGER holds, so logging a hotel bill in dong or rupiah failed. Widening keeps every existing value as is.
ALTER TABLE "GroupExpense" ALTER COLUMN "amountCents" TYPE BIGINT;
ALTER TABLE "GroupExpenseShare" ALTER COLUMN "amountCents" TYPE BIGINT;
