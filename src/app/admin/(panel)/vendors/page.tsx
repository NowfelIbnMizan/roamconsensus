import { db } from "@/lib/db";
import {
  deleteCoupon,
  deleteVendor,
  saveCoupon,
  saveVendor,
} from "@/lib/admin/actions";
import { couponTypeOptions } from "../../options";
import { Checkbox, DeleteButton, Field, SaveButton, Select } from "../../ui";

type Coupon = Awaited<ReturnType<typeof db.coupon.findFirstOrThrow>>;
type Choice = { value: string; label: string };

const day = (d: Date | null | undefined) =>
  d ? d.toISOString().slice(0, 10) : "";

function CouponFields({
  c,
  vendors,
  creators,
}: {
  c?: Coupon;
  vendors: Choice[];
  creators: Choice[];
}) {
  return (
    <>
      <Field label="Code" name="code" defaultValue={c?.code} required />
      <Select
        label="Type"
        name="type"
        defaultValue={c?.type ?? "PLATFORM"}
        options={couponTypeOptions}
      />
      <Select
        label="Booking site"
        name="vendorId"
        defaultValue={c?.vendorId}
        options={vendors}
      />
      <Select
        label="Creator (creator codes only)"
        name="creatorId"
        defaultValue={c?.creatorId}
        options={creators}
        blank="None"
      />
      <Field
        label="Description"
        name="description"
        defaultValue={c?.description}
        placeholder="10% off tours"
      />
      <Field
        label="Valid from"
        name="validFrom"
        type="date"
        defaultValue={day(c?.validFrom)}
      />
      <Field
        label="Valid until"
        name="validTo"
        type="date"
        defaultValue={day(c?.validTo)}
      />
      <Checkbox
        label="Active"
        name="active"
        defaultChecked={c?.active ?? true}
      />
    </>
  );
}

export default async function VendorsAdmin() {
  const [vendorRows, coupons, creatorRows] = await Promise.all([
    db.vendor.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    }),
    db.coupon.findMany({ orderBy: { code: "asc" }, include: { vendor: true } }),
    db.creator.findMany({ orderBy: { name: "asc" } }),
  ]);
  const vendors = vendorRows.map((v) => ({ value: v.id, label: v.name }));
  const creators = creatorRows.map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <h1 className="text-2xl font-semibold">Booking sites</h1>
      <p className="mt-1 text-sm text-muted">
        Where items are booked (Klook, Agoda…). Items pick one on their
        itinerary page.
      </p>
      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-card">
        {vendorRows.map((v) => (
          <li key={v.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <span className="font-medium">{v.name}</span>
                <span className="text-sm text-muted">
                  {v._count.items} items
                </span>
              </summary>
              <form
                action={saveVendor}
                className="mt-4 grid gap-3 sm:grid-cols-3"
              >
                <input type="hidden" name="id" value={v.id} />
                <Field
                  label="Name"
                  name="name"
                  defaultValue={v.name}
                  required
                />
                <Field
                  label="Homepage"
                  name="homepage"
                  type="url"
                  defaultValue={v.homepage}
                  required
                />
                <Field label="Short name" name="slug" defaultValue={v.slug} />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton
                  action={deleteVendor}
                  id={v.id}
                  what={`${v.name}, its booking links and coupons`}
                />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <details className="mt-3 rounded-2xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">
          Add a booking site
        </summary>
        <form action={saveVendor} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Name" name="name" required />
          <Field label="Homepage" name="homepage" type="url" required />
          <div className="self-end">
            <SaveButton>Add</SaveButton>
          </div>
        </form>
      </details>

      <h2 className="mt-10 text-xl font-semibold">Coupons</h2>
      <p className="mt-1 text-sm text-muted">
        Shown on bookable items from the same booking site.
      </p>
      <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-card">
        {coupons.map((c) => (
          <li key={c.id}>
            <details className="p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-4">
                <span className="font-mono font-medium">{c.code}</span>
                <span className="text-sm text-muted">
                  {c.vendor.name}
                  {!c.active && " · inactive"}
                </span>
              </summary>
              <form
                action={saveCoupon}
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                <input type="hidden" name="id" value={c.id} />
                <CouponFields c={c} vendors={vendors} creators={creators} />
                <div>
                  <SaveButton />
                </div>
              </form>
              <div className="mt-2 text-right">
                <DeleteButton
                  action={deleteCoupon}
                  id={c.id}
                  what={`coupon ${c.code}`}
                />
              </div>
            </details>
          </li>
        ))}
        {coupons.length === 0 && (
          <li className="p-4 text-sm text-muted">No coupons yet.</li>
        )}
      </ul>
      {vendors.length > 0 && (
        <details className="mt-3 rounded-2xl border border-line bg-card p-4">
          <summary className="cursor-pointer font-medium">Add a coupon</summary>
          <form action={saveCoupon} className="mt-4 grid gap-3 sm:grid-cols-2">
            <CouponFields vendors={vendors} creators={creators} />
            <div>
              <SaveButton>Add coupon</SaveButton>
            </div>
          </form>
        </details>
      )}
    </>
  );
}
