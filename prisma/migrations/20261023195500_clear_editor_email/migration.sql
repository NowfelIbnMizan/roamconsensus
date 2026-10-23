-- The About page now always shows hello@creatour.co; drop the personal address saved in Admin > About me.
UPDATE "Editor" SET "email" = NULL;
