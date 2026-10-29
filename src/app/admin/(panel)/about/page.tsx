import Link from "next/link";
import { saveEditor } from "@/lib/admin/actions";
import { loadEditor } from "@/lib/editor";
import { db } from "@/lib/db";
import { AboutPhotosForm } from "../../forms/content-forms";
import { Field, SaveButton, TextArea } from "../../ui";
import { EditDialog } from "../../edit-dialog";

export default async function AboutAdmin() {
  const e = await loadEditor();
  const photos = await db.aboutPhoto.findMany({ orderBy: { position: "asc" } });
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl">About me</h1>
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
      <section className="relative mt-4 flex gap-4 rounded-2xl border border-line bg-card p-5">
        {e.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.photoUrl} alt={e.name} className="size-20 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid size-20 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-3xl text-accent">
            {e.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0 flex-1 pr-14">
          <p className="font-display text-2xl">{e.name}</p>
          {e.tagline && <p className="text-muted">{e.tagline}</p>}
          <p className="mt-2 line-clamp-4 max-w-2xl whitespace-pre-line text-sm text-muted">{e.bio}</p>
        </div>
        <div className="absolute right-3 top-3">
          <EditDialog title="About me">
              <form
                action={saveEditor}
                className="grid gap-3 sm:grid-cols-2"
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
          </EditDialog>
        </div>
      </section>

      <h2 className="mt-10 font-display text-2xl">Travel photos ({photos.length})</h2>
      <p className="mt-1 text-sm text-muted">
        They rotate on the About page. Before adding one: blur other people&apos;s faces and remove the location data.
        Upright photos fill the top two slots, wide ones the bottom two, so keep at least 3 of each.
      </p>
      <AboutPhotosForm photos={photos} />
    </>
  );
}
