"use client";

import { useRef, useState } from "react";
import { inputClass } from "../../ui";
import { POST_KINDS } from "@/lib/post-kinds";
import type { PostKind } from "@/generated/prisma/enums";

type Option = { value: string; label: string };

/** Post type, the route(s) it is about, and the post text, with questions to answer in the owner's own words. */
export function KindFields({
  kind: initialKind,
  itineraryId,
  otherItineraryId,
  body,
  routes,
  help,
}: {
  kind: PostKind;
  itineraryId: string | null;
  otherItineraryId: string | null;
  body: string;
  routes: Option[];
  help: string;
}) {
  const [kind, setKind] = useState(initialKind);
  const text = useRef<HTMLTextAreaElement>(null);
  const { hint, questions } = POST_KINDS[kind];
  const routeSelect = (name: string, label: string, value: string | null) => (
    <label className="block text-sm">
      <span className="text-muted">{label}</span>
      <select name={name} defaultValue={value ?? ""} required className={`mt-1 ${inputClass}`}>
        <option value="">Pick a route</option>
        {routes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
  // Each question becomes a heading to write under; "## Day 1" style lines are already headings.
  const addQuestions = () => {
    const el = text.current;
    if (!el) return;
    const outline = questions.map((q) => (q.startsWith("#") ? q : `## ${q}`)).join("\n\n\n");
    el.value = el.value.trim() ? `${el.value.trimEnd()}\n\n${outline}\n\n` : `${outline}\n\n`;
    el.focus();
  };

  return (
    <>
      <label className="block text-sm sm:col-span-2">
        <span className="text-muted">Type of post</span>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as PostKind)}
          className={`mt-1 ${inputClass}`}
        >
          {Object.entries(POST_KINDS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      </label>
      {kind === "TAKE" && <div className="sm:col-span-2">{routeSelect("itineraryId", "Route", itineraryId)}</div>}
      {kind === "COMPARE" && (
        <>
          {routeSelect("itineraryId", "First route", itineraryId)}
          {routeSelect("otherItineraryId", "Second route", otherItineraryId)}
        </>
      )}
      {questions.length > 0 && (
        <div className="rounded-lg border border-line bg-background p-3 text-sm sm:col-span-2">
          <p className="font-medium">Questions to answer, in your own words</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {questions.map((q) => (
              <li key={q}>{q.replace(/^#+\s*/, "")}</li>
            ))}
          </ul>
          <button type="button" onClick={addQuestions} className="mt-2 text-sm font-medium text-accent underline">
            Add them to the post as headings
          </button>
        </div>
      )}
      <label className="block text-sm sm:col-span-2">
        <span className="text-muted">Post</span>
        <textarea
          ref={text}
          name="body"
          rows={18}
          required
          defaultValue={body}
          className="mt-1 w-full rounded-lg border border-line bg-background px-3 py-2 font-mono text-sm"
        />
        <span className="mt-0.5 block text-xs text-muted">{help}</span>
      </label>
    </>
  );
}
