"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/data";
import { requireAdmin } from "@/lib/admin/auth";
import { submitToIndexNow } from "@/lib/indexnow";
import { canDraft, draftIntro, pageFacts } from "@/lib/intros";

const back = (path: string, note?: string) =>
  redirect(`/admin/intros?page=${encodeURIComponent(path)}${note ? `&note=${encodeURIComponent(note)}` : ""}#intro`);

/** Asks the AI for a first draft from the page's own facts. The draft waits here; nothing goes live. */
export async function draftIntroAction(fd: FormData) {
  await requireAdmin();
  const path = String(fd.get("path") ?? "");
  const facts = await pageFacts(path);
  if (!facts) back(path, "That page doesn't exist any more.");
  if (!canDraft()) back(path, "Add ANTHROPIC_API_KEY in Vercel to use AI drafts. You can still write one yourself.");
  let draft = "";
  try {
    draft = await draftIntro(facts!);
  } catch (e) {
    back(path, `The AI draft failed: ${e instanceof Error ? e.message : "unknown error"}. Try again in a minute.`);
  }
  await db.pageIntro.upsert({ where: { path }, create: { path, draft }, update: { draft } });
  back(path);
}

/** Publishes the text in the box (the owner's edit of the draft, or their own words). */
export async function approveIntroAction(fd: FormData) {
  await requireAdmin();
  const path = String(fd.get("path") ?? "");
  const text = String(fd.get("text") ?? "").trim().slice(0, 600);
  if (!(await pageFacts(path))) back(path, "That page doesn't exist any more.");
  if (!text) back(path, "The box is empty. Write or draft an intro first.");
  const now = new Date();
  await db.pageIntro.upsert({
    where: { path },
    create: { path, text, approvedAt: now },
    update: { text, draft: null, approvedAt: now },
  });
  updateTag(CONTENT_TAG);
  after(() => submitToIndexNow([path]));
  back(path, "Live on the page.");
}

/** Takes the intro off the page; the text stays as a draft. */
export async function removeIntroAction(fd: FormData) {
  await requireAdmin();
  const path = String(fd.get("path") ?? "");
  const row = await db.pageIntro.findUnique({ where: { path } });
  if (row?.text) await db.pageIntro.update({ where: { path }, data: { draft: row.draft ?? row.text, text: null, approvedAt: null } });
  updateTag(CONTENT_TAG);
  back(path, "Taken off the page. The text is kept as a draft.");
}
