import { db } from "@/lib/db";
import { deleteCreator, saveCreator } from "@/lib/admin/actions";
import { SOCIALS } from "@/lib/creator-links";
import { platformOptions } from "../../options";
import { Checkbox, DeleteButton, Field, SaveButton, Select, TextArea } from "../../ui";

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
  return (
    <>
      <h1 className="text-2xl font-semibold">Creators</h1>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {creators.map((c) => (
          <li key={c.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <span>
                  <span className="font-medium">{c.name}</span>{" "}
                  <span className="text-sm text-muted">@{c.handle}</span>
                </span>
                <span className="text-sm text-muted">
                  {c._count.itineraries} itineraries
                </span>
              </summary>
              <form
                action={saveCreator}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={c.id} />
                <CreatorFields c={c} />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton
                  action={deleteCreator}
                  id={c.id}
                  what={`${c.name} and their itineraries`}
                />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Add a creator</summary>
        <form action={saveCreator} className="mt-4 grid gap-3 sm:grid-cols-2">
          <CreatorFields />
          <div>
            <SaveButton>Add creator</SaveButton>
          </div>
        </form>
      </details>
    </>
  );
}
