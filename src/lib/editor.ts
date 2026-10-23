import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/data";

export type Editor = {
  name: string;
  tagline: string | null;
  bio: string;
  photoUrl: string | null;
  email: string | null;
  instagramUrl: string | null;
};

/** Shown until the owner saves their own in Admin > About me. */
export const DEFAULT_EDITOR: Editor = {
  name: "Nowfel",
  tagline: "I read the travel guides so you can plan faster.",
  bio: [
    "Hi, I'm Nowfel. Planning a trip usually means ten open tabs of creator itineraries and trying to work out which places they all agree on. I built Creatour to do that in one place.",
    "I read each creator's full guide, lay out their stops day by day, check current prices and add my own take on who the route suits. Every itinerary links back to the creator's original guide: read it, they did the travelling.",
  ].join("\n\n"),
  photoUrl: null,
  email: null,
  instagramUrl: null,
};

/** For the admin form, without the public cache. */
export async function loadEditor(): Promise<Editor> {
  const row = await db.editor.findUnique({ where: { id: "me" } });
  return row ?? DEFAULT_EDITOR;
}

export async function getEditor(): Promise<Editor> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  return loadEditor();
}

export const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
