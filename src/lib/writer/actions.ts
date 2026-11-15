"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { postKindFields, slugify } from "@/lib/post-form";
import { currentWriter } from "@/lib/writer/auth";
import { currentUser } from "@/lib/auth";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (fd: FormData, key: string) => text(fd, key) || null;

const MAX_DRAFTS = 50;
const MAX_TITLE = 200;
const MAX_EXCERPT = 500;
const MAX_BODY = 100_000;

/** A slug no other post has: "title", else "title-2", "title-3"… */
async function freeSlug(title: string) {
  const base = slugify(title) || "post";
  const taken = new Set(
    (await db.post.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } })).map((p) => p.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

async function save(fd: FormData, submit: boolean) {
  const writer = await currentWriter();
  if (!writer) redirect("/write");
  const id = optional(fd, "id");
  const before = id
    ? await db.post.findFirst({ where: { id, authorId: writer.id }, select: { published: true, publishedAt: true } })
    : null;
  if (id && !before) throw new Error("That post isn't yours.");
  // Once the owner has published a post, changes go through him.
  if (before?.published || before?.publishedAt) throw new Error("This post is live. Ask the owner to change it.");
  // Guests are invited, but the limits still hold: a post is a few pages, and nobody needs hundreds of drafts.
  if (!id && (await db.post.count({ where: { authorId: writer.id, publishedAt: null } })) >= MAX_DRAFTS)
    throw new Error(`You have ${MAX_DRAFTS} unpublished posts. Delete one first.`);
  const { kind, itineraryId, otherItineraryId, routes } = await postKindFields(fd);
  const coverUrl = optional(fd, "coverUrl");
  // Too long or a bad link is said out loud: cutting the text quietly would lose the writer's work on the next save.
  const tooLong = (
    [
      ["title", "The title", MAX_TITLE],
      ["excerpt", "The short summary", MAX_EXCERPT],
      ["body", "The post", MAX_BODY],
    ] as const
  ).find(([key, , max]) => text(fd, key).length > max);
  if (tooLong) throw new Error(`${tooLong[1]} is too long (${tooLong[2].toLocaleString("en-US")} characters at most). Shorten it and save again.`);
  if (coverUrl && !(/^https:\/\/\S+$/.test(coverUrl) && coverUrl.length <= 2000))
    throw new Error("The cover photo must be a web link that starts with https://");
  const data = {
    title: text(fd, "title"),
    excerpt: optional(fd, "excerpt"),
    body: text(fd, "body"),
    // Shown as an image on the review page and the blog: a web photo link or nothing.
    coverUrl,
    destinationId: optional(fd, "destinationId") ?? routes[0]?.destinationId ?? null,
    kind,
    itineraryId,
    otherItineraryId,
    published: false,
    ...(submit ? { submittedAt: new Date(), reviewNote: null } : {}),
  };
  const row = id
    ? await db.post.update({ where: { id }, data })
    : await db.post.create({ data: { ...data, slug: await freeSlug(data.title), authorId: writer.id, authorName: writer.name } });
  redirect(submit ? "/write?sent=1" : `/write/${row.id}`);
}

export async function saveDraft(fd: FormData) {
  await save(fd, false);
}

export async function sendForReview(fd: FormData) {
  await save(fd, true);
}

/** Takes a post back out of the review queue so the writer can keep working on it. */
export async function withdrawPost(fd: FormData) {
  const writer = await currentWriter();
  if (!writer) redirect("/write");
  await db.post.updateMany({
    where: { id: text(fd, "id"), authorId: writer.id, published: false },
    data: { submittedAt: null },
  });
  redirect("/write");
}

export async function deleteDraft(fd: FormData) {
  const writer = await currentWriter();
  if (!writer) redirect("/write");
  await db.post.deleteMany({ where: { id: text(fd, "id"), authorId: writer.id, publishedAt: null } });
  redirect("/write");
}

/** Accepting an invite link: the signed-in account becomes a writer and the link stops working. */
export async function acceptInvite(fd: FormData) {
  const user = await currentUser();
  if (!user) redirect(`/write/join/${text(fd, "token")}`);
  const used = await db.writerInvite.updateMany({
    where: { token: text(fd, "token"), usedAt: null },
    data: { usedAt: new Date(), usedById: user.id },
  });
  if (used.count === 0) redirect(`/write/join/${text(fd, "token")}?used=1`);
  await db.user.update({ where: { id: user.id }, data: { writer: true } });
  redirect("/write");
}
