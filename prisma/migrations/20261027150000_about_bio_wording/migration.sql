-- About bio: new site wording ("the places they don't miss" instead of "where they agree") and Cox's Bazar, which is
-- in the owner's new photos (2026-10-27). Each replace only changes text that's still exactly the old wording.
UPDATE "Editor"
SET "bio" = replace(
      replace("bio", 'so you can see where they actually agree.', 'so you can see the places they don''t miss.'),
      'So far: Thailand, Vietnam, Nepal and Sri Lanka.', 'So far: Thailand, Vietnam, Nepal and Sri Lanka, plus Cox''s Bazar back home.'),
    "updatedAt" = NOW()
WHERE "id" = 'me';
