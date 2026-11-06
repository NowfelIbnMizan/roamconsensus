-- The site never uses the Google tokens Better Auth saved at sign-in. Clear the plain-text copies; new sign-ins store
-- them encrypted (auth.ts account.encryptOAuthTokens). Sign-in itself doesn't need them.
UPDATE "Account" SET "accessToken" = NULL, "refreshToken" = NULL, "idToken" = NULL
WHERE "accessToken" IS NOT NULL OR "refreshToken" IS NOT NULL OR "idToken" IS NOT NULL;
