import { db } from "@/lib/db";
import { deleteCreator, saveCreator } from "@/lib/admin/actions";
import { SOCIALS } from "@/lib/creator-links";
import { platformOptions } from "../../options";
import { Checkbox, DeleteButton, Field, SaveButton, Select, TextArea } from "../../ui";
import { EditDialog } from "../../edit-dialog";
import { CreatorAvatar } from "@/components/creator-avatar";

type Creator = Awaited<ReturnType<typeof db.creator.findFirstOrThrow>>;

function CreatorFields({ c }: { c?: Creator }) {
  return (
    <>
      <Field label="Name" name="name" defaultValue={c?.name} required />
      <Field
        label="Handle"
        name="handle"
        defaultValue={c?.handle}
        required
        hint="Without @. Used in the page link."
      />
      <Select
        label="Platform"
        name="platform"
        defaultValue={c?.platform ?? "INSTAGRAM"}
        options={platformOptions}
      />
      <Field
        label="Main link"
        name="profileUrl"
        type="url"
        defaultValue={c?.profileUrl}
        hint="Where the creator's name button goes. Blank = first link below."
      />
      {SOCIALS.map((s) => (
        <Field
          key={s.key}
          label={s.label}
          name={s.key}
          type="url"
          defaultValue={c?.[s.key]}
        />
      ))}
      <Field
        label="Avatar photo"
        name="avatarUrl"
        type="url"
        defaultValue={c?.avatarUrl}
        hint="Only with the creator's written OK. Use a lasting https link they gave you (their website or Pinterest). Instagram and TikTok photo links expire within days. Blank = initial."
      />
      <Checkbox label="Hide photo (show the initial instead)" name="hideAvatar" defaultChecked={c?.hideAvatar} />
      <TextArea label="Bio" name="bio" defaultValue={c?.bio} />
    </>
  );
}

export default async function CreatorsAdmin() {
  const creators = await db.creator.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { itineraries: true } } },
  });
  const badge = "rounded-full px-2 py-0.5 text-xs";
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Creators</h1>
        <EditDialog title="Add a creator" add label="Add creator">
          <form action={saveCreator} className="grid gap-3 sm:grid-cols-2">
            <CreatorFields />
            <div className="sm:col-span-2">
              <SaveButton>Add creator</SaveButton>
            </div>
          </form>
        </EditDialog>
      </div>
      <p className="mt-1 text-sm text-muted">Most routes first. Creators with no route don&apos;t show on the site.</p>
      <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {creators
          .toSorted((a, b) => b._count.itineraries - a._count.itineraries)
          .map((c) => (
            <li key={c.id} className="relative flex gap-3 rounded-2xl border border-line bg-card p-4">
              <CreatorAvatar creator={c} />
              <div className="min-w-0 flex-1 pr-14">
                <p className="truncate font-medium">{c.name}</p>
                <p className="truncate text-sm text-muted">
                  @{c.handle}, {c._count.itineraries} route{c._count.itineraries === 1 ? "" : "s"}
                </p>
                {c.bio && <p className="mt-2 line-clamp-2 text-sm text-muted">{c.bio}</p>}
                <p className="mt-2 flex flex-wrap gap-1">
                  {!c.bio && <span className={`${badge} bg-amber-100 text-amber-900`}>No bio</span>}
                  {c._count.itineraries === 0 && <span className={`${badge} bg-line/60`}>Hidden: no routes</span>}
                  {c.avatarUrl && c.hideAvatar && <span className={`${badge} bg-line/60`}>Photo hidden</span>}
                  {c.avatarUrl && !c.hideAvatar && <span className={`${badge} bg-sky-100 text-sky-900`}>Photo on</span>}
                </p>
              </div>
              <div className="absolute right-3 top-3">
                <EditDialog title={c.name} subtitle={`@${c.handle}`}>
                  <form action={saveCreator} className="grid gap-3 sm:grid-cols-2">
                    <input type="hidden" name="id" value={c.id} />
                    <CreatorFields c={c} />
                    <div className="sm:col-span-2">
                      <SaveButton />
                    </div>
                  </form>
                  <div className="mt-3 text-right">
                    <DeleteButton action={deleteCreator} id={c.id} what={`${c.name} and their itineraries`} />
                  </div>
                </EditDialog>
              </div>
            </li>
          ))}
      </ul>
    </>
  );
}
