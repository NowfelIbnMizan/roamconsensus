"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

export const inputClass = "w-full rounded-lg border border-line bg-background px-3 py-1.5 text-sm";

export function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  placeholder,
  hint,
  step,
  maxLength,
  pattern,
  title,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  step?: string;
  maxLength?: number;
  /** Browser check before the form is sent, with `title` as the message shown when it fails. */
  pattern?: string;
  title?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <input
        name={name}
        type={type}
        step={step}
        defaultValue={defaultValue ?? ""}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        className={`mt-1 ${inputClass}`}
      />
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  rows = 2,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  rows?: number;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm sm:col-span-2">
      <span className="text-muted">{label}</span>
      <textarea
        name={name}
        rows={rows}
        maxLength={maxLength}
        defaultValue={defaultValue ?? ""}
        className={`mt-1 ${inputClass}`}
      />
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  blank,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: { value: string; label: string }[];
  /** Label for an empty choice; omit to require a value. */
  blank?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select name={name} defaultValue={defaultValue ?? ""} className={`mt-1 ${inputClass}`}>
        {blank !== undefined && <option value="">{blank}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 self-end pb-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} /> {label}
    </label>
  );
}

export function SaveButton({ children = "Save" }: { children?: ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background disabled:opacity-60"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}

/** Separate form so a delete can't be triggered by pressing Enter in the edit form. */
export function DeleteButton({
  action,
  id,
  what,
  verb = "Delete",
  question,
}: {
  action: (fd: FormData) => Promise<void>;
  id: string;
  what: string;
  /** Button text, for actions that aren't deletes (e.g. "Remove"). */
  verb?: string;
  /** Confirm text; defaults to "Delete <what>? This can't be undone." */
  question?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(question ?? `Delete ${what}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="text-sm text-rose-600 hover:underline">
        {verb}
      </button>
    </form>
  );
}
