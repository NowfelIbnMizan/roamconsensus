-- Admin on/off switches for photos; new columns only, existing rows default to showing photos.
ALTER TABLE "Place" ADD COLUMN "hidePhoto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Creator" ADD COLUMN "hideAvatar" BOOLEAN NOT NULL DEFAULT false;
