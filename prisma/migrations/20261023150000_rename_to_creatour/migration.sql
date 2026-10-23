-- Site renamed from RoamConsensus to Creatour: update the brand name in admin-written text.
UPDATE "Editor" SET "bio" = replace("bio", 'RoamConsensus', 'Creatour'), "tagline" = replace("tagline", 'RoamConsensus', 'Creatour');
UPDATE "Post" SET "title" = replace("title", 'RoamConsensus', 'Creatour'), "excerpt" = replace("excerpt", 'RoamConsensus', 'Creatour'), "body" = replace("body", 'RoamConsensus', 'Creatour');
UPDATE "Itinerary" SET "editorTake" = replace("editorTake", 'RoamConsensus', 'Creatour') WHERE "editorTake" LIKE '%RoamConsensus%';
