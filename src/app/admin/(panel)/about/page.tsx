import Link from "next/link";
import { saveEditor } from "@/lib/admin/actions";
import { loadEditor } from "@/lib/editor";
import { Field, SaveButton, TextArea } from "../../ui";

export default async function AboutAdmin() {
  const e = await loadEditor();
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">About me</h1>
        <Link
          href="/about"
          target="_blank"
          className="text-sm text-accent underline"
        >
          View on site
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Shown on the About page and next to your takes on itineraries. Write
        your takes on each itinerary&apos;s admin page.
      </p>
      <form
        action={saveEditor}
        className="mt-4 grid gap-3 rounded-2xl border border-line bg-card p-4 sm:grid-cols-2"
      >
        <Field label="Your name" name="name" defaultValue={e.name} required />
        <Field
          label="One-line tagline"
          name="tagline"
          defaultValue={e.tagline}
        />
        <TextArea
          label="Bio (leave a blank line between paragraphs)"
          name="bio"
          defaultValue={e.bio}
          rows={10}
        />
        <Field
          label="Photo (link to an image)"
          name="photoUrl"
          type="url"
          defaultValue={e.photoUrl}
          hint="Blank = your first initial."
        />
        <Field
          label="Instagram"
          name="instagramUrl"
          type="url"
          defaultValue={e.instagramUrl}
        />
        <div className="sm:col-span-2">
          <SaveButton />
        </div>
      </form>
    </>
  );
}
