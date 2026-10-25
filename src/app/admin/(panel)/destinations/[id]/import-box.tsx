"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { importItineraries } from "@/lib/admin/actions";
import { inputClass } from "../../../ui";

const EXAMPLE = `{
  "places": [
    { "slug": "new-place", "name": "New Place", "category": "EXPERIENCE", "lat": 13.75, "lng": 100.49,
      "website": "https://example.com" }
  ],
  "creators": [],
  "itineraries": [
    { "slug": "city-3-days-creator", "title": "3 days in City", "summary": "...", "tier": "BUDGET", "days": 3,
      "creator": "creator-handle", "sourceUrl": "https://creator.blog/post",
      "items": [
        { "day": 1, "name": "New Place", "category": "EXPERIENCE", "place": "new-place",
          "price": 5, "priceNote": "per adult", "note": "The creator's tip" }
      ] }
  ]
}`;

/** Paste itineraries in the data/ file format, check them, then add them to this destination in one go. */
export function ImportBox({ destinationId }: { destinationId: string }) {
  const [result, action, pending] = useActionState(importItineraries, null);
  // Controlled, so the pasted text survives the form resetting after each check.
  const [json, setJson] = useState("");
  const checked = result && !result.added.length;
  const canImport = checked && result.problems.length === 0;

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="destinationId" value={destinationId} />
      <p className="text-sm text-muted">
        Same format as the files in <code>data/destinations</code>: one itinerary, or <code>places</code>,{" "}
        <code>creators</code> and <code>itineraries</code> together. Places and creators already on the site are reused
        by their slug.
      </p>
      <textarea
        name="json"
        rows={12}
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder={EXAMPLE}
        spellCheck={false}
        className={`${inputClass} font-mono text-xs`}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="mode"
          value="check"
          disabled={pending || !json.trim()}
          className="rounded-full border border-line px-4 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {pending ? "Checking…" : "Check"}
        </button>
        <button
          type="submit"
          name="mode"
          value="import"
          disabled={pending || !canImport}
          title={canImport ? undefined : "Check first; fix any problems it lists."}
          className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-background disabled:opacity-60"
        >
          Add to site
        </button>
      </div>

      {result && (
        <div className="space-y-2 text-sm">
          {result.summary && <p className="font-medium">{result.summary}</p>}
          {result.added.length > 0 && (
            <ul className="list-disc pl-5">
              {result.added.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} className="text-accent underline">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {result.problems.length > 0 && (
            <div>
              <p className="font-medium text-red-700 dark:text-red-300">
                Fix {result.problems.length === 1 ? "this" : `these ${result.problems.length}`} first:
              </p>
              <ul className="list-disc pl-5 text-red-700 dark:text-red-300">
                {result.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {result.warnings.length > 0 && (
            <details>
              <summary className="cursor-pointer text-muted">
                {result.warnings.length} thing{result.warnings.length === 1 ? "" : "s"} worth a look (won&apos;t block
                it)
              </summary>
              <ul className="mt-1 list-disc pl-5 text-muted">
                {result.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          )}
          {checked && canImport && <p className="text-muted">Looks good. Press &quot;Add to site&quot;.</p>}
        </div>
      )}
    </form>
  );
}
