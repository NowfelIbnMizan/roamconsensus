import Link from "next/link";
import { db } from "@/lib/db";
import { saveDraft, sendForReview } from "@/lib/writer/actions";
import { Field, Select, TextArea } from "@/app/admin/ui";
import { MARKDOWN_HELP, routeOptions } from "@/app/admin/(panel)/blog/post-fields";
import { KindFields } from "@/app/admin/(panel)/blog/kind-fields";
import type { PostKind } from "@/generated/prisma/enums";

type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  destinationId: string | null;
  kind: PostKind;
  itineraryId: string | null;
  otherItineraryId: string | null;
};

/** A guest writer's post: the owner's editor minus the URL and the publish switch. */
export async function WriterPostForm({ p }: { p?: Post }) {
  const [cities, routes] = await Promise.all([
    db.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    routeOptions(),
  ]);
  return (
    <form action={saveDraft} className="mt-6 grid gap-3 sm:grid-cols-2">
      {p && <input type="hidden" name="id" value={p.id} />}
      <div className="sm:col-span-2">
        <Field label="Title" name="title" defaultValue={p?.title} required />
      </div>
      <TextArea label="Short summary (one or two sentences)" name="excerpt" defaultValue={p?.excerpt} />
      <Field
        label="Cover image link"
        name="coverUrl"
        type="url"
        defaultValue={p?.coverUrl}
        hint="A photo you took and host yourself. Blank uses the city's photo."
      />
      <Select
        label="About a city"
        name="destinationId"
        defaultValue={p?.destinationId}
        options={cities.map((c) => ({ value: c.id, label: c.name }))}
        blank="None (route posts use the route's city)"
      />
      <KindFields
        kind={p?.kind ?? "TAKE"}
        itineraryId={p?.itineraryId ?? null}
        otherItineraryId={p?.otherItineraryId ?? null}
        body={p?.body ?? ""}
        routes={routes}
        help={MARKDOWN_HELP}
      />
      <p className="fine-print sm:col-span-2">
        Write from your own trips and in your own words. Only use photos you took. Creatour may edit your post before it
        goes live, and decides whether it does.
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-accent">
          Save draft
        </button>
        <button
          type="submit"
          formAction={sendForReview}
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background"
        >
          Send for review
        </button>
        <Link href="/write" className="text-sm text-muted hover:text-foreground">
          Cancel
        </Link>
      </div>
    </form>
  );
}
