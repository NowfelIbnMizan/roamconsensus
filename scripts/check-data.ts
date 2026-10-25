// Quality check for data/destinations/*.json, run before a content PR: `npm run check:data`.
// The seed already rejects broken files (unknown place, bad URL); this catches what loads fine but looks wrong on
// the site. Problems fail the run; warnings are worth a look but can stand (a creator who gives no prices).
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { checkContent, type CheckContent } from "../src/lib/content-check";

const dir = path.join(process.cwd(), "data/destinations");
const problems: string[] = [];
const warnings: string[] = [];
const seenItineraries = new Set<string>();

for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const d: CheckContent = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
  const result = checkContent(d);
  problems.push(...result.problems);
  warnings.push(...result.warnings);
  for (const it of d.itineraries) {
    if (seenItineraries.has(it.slug)) problems.push(`${d.slug}/${it.slug}: slug used in two files`);
    seenItineraries.add(it.slug);
  }
}
const show = process.argv.includes("--all") ? Infinity : 40;
if (warnings.length) {
  console.log(`${warnings.length} warning(s):`);
  for (const w of warnings.slice(0, show)) console.log(`  - ${w}`);
  if (warnings.length > show) console.log(`  ... and ${warnings.length - show} more (--all shows them)`);
}
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ✗ ${p}`);
  process.exit(1);
}
console.log(`\nNo problems in ${seenItineraries.size} itineraries.`);
