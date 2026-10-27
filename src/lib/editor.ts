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
  tagline: "Street-food hunter, Muay Thai fan, weekend DJ. I read the travel guides so you can plan faster.",
  bio: [
    "Born and raised in Riyadh, now based in Dhaka, and happiest wherever there's a night market. So far: Thailand, Vietnam, Nepal and Sri Lanka, plus Cox's Bazar back home. Bangkok is my favourite city, and I'll happily argue that over a plate of street food.",
    "By day I'm a digital marketer working remotely. That means two things: I can plan trips from anywhere, and I can spot a sponsored \"top 10\" list from across the street. Creatour skips all that. It lines up itineraries that travel creators shared publicly, so you can see the places they don't miss.",
    "Off the clock it's Muay Thai and DJ-ing. On the road it's temples and old towns by day, a good night out after, and street food in between. My rule for that last one: follow the queue of locals, not the ad. Creatour runs on the same rule. When several creators who went all point to the same place, it's probably worth your afternoon.",
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
