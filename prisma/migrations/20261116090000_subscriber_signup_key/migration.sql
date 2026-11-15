-- A scrambled, daily-changing code for where a sign-up came from, so one script can be capped without blocking everyone.
ALTER TABLE "Subscriber" ADD COLUMN "signupKey" TEXT;
CREATE INDEX "Subscriber_signupKey_createdAt_idx" ON "Subscriber"("signupKey", "createdAt");
