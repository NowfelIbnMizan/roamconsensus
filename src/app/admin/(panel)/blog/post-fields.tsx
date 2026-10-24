import { Checkbox, Field, Select, TextArea } from "../../ui";

type Post = {
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverUrl: string | null;
  destinationId: string | null;
  published: boolean;
};

export const MARKDOWN_HELP =
  "## Heading · ### Smaller heading · **bold** · *italic* · [link text](https://…) · - bullet list · 1. numbered list · > quote · ![caption](image link) on its own line · a YouTube link on its own line becomes a video. Leave a blank line between paragraphs. Link to your own pages like [Bali top picks](/destinations/bali/best).";

export function PostFields({
  p,
  cities,
}: {
  p?: Post;
  cities: { value: string; label: string }[];
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
        blank="None"
      />
      <label className="block text-sm sm:col-span-2">
        <span className="text-muted">Post</span>
        <textarea
          name="body"
          rows={18}
          required
          defaultValue={p?.body ?? ""}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 font-mono text-sm"
        />
        <span className="mt-0.5 block text-xs text-muted">{MARKDOWN_HELP}</span>
      </label>
      <Checkbox
        label="Published (visible on the site)"
        name="published"
        defaultChecked={p?.published}
      />
    </>
  );
}
