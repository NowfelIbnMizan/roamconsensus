import { db } from "@/lib/db";
import { Checkbox, Field, Select, TextArea } from "../../ui";
import { KindFields } from "./kind-fields";
import type { PostKind } from "@/generated/prisma/enums";

type Post = {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  destinationId: string | null;
  kind: PostKind;
  itineraryId: string | null;
  otherItineraryId: string | null;
  published: boolean;
};

export const MARKDOWN_HELP =
  "## Heading · ### Smaller heading · **bold** · *italic* · [link text](https://…) · - bullet list · 1. numbered list · > quote · ![caption](image link) on its own line · a YouTube link on its own line becomes a video. Leave a blank line between paragraphs. Link to your own pages like [Bali top picks](/destinations/bali/best).";

export function PostFields({
  p,
  cities,
  routes,
}: {
  p?: Post;
  cities: { value: string; label: string }[];
  routes: { value: string; label: string }[];
}) {
  return (
    <>
      <Field label="Title" name="title" defaultValue={p?.title} required />
      <Field
        label="URL name"
        name="slug"
        defaultValue={p?.slug}
        hint="Leave blank to make one from the title."
      />
      <TextArea
        label="Short summary (shown in the blog list and Google results)"
        name="excerpt"
        defaultValue={p?.excerpt}
      />
      <Field
        label="Cover image link"
        name="coverUrl"
        type="url"
        defaultValue={p?.coverUrl}
        hint="Blank uses the city's photo."
      />
      <Select
        label="About a city"
        name="destinationId"
        defaultValue={p?.destinationId}
        options={cities}
        blank="None (route posts use the route's city)"
      />
      <KindFields
        kind={p?.kind ?? "GENERAL"}
        itineraryId={p?.itineraryId ?? null}
        otherItineraryId={p?.otherItineraryId ?? null}
        body={p?.body ?? ""}
        routes={routes}
        help={MARKDOWN_HELP}
      />
      <Checkbox
        label="Published (visible on the site)"
        name="published"
        defaultChecked={p?.published}
      />
    </>
  );
}

/** Every route as "City · Title (Creator)", for the route pickers. */
export async function routeOptions() {
  const rows = await db.itinerary.findMany({
    orderBy: [{ destination: { name: "asc" } }, { title: "asc" }],
    select: { id: true, title: true, destination: { select: { name: true } }, creator: { select: { name: true } } },
  });
  return rows.map((r) => ({ value: r.id, label: `${r.destination.name} · ${r.title} (${r.creator.name})` }));
}
