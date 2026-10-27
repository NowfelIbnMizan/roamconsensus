import { getDestination, getDestinations, getPosts } from "@/lib/data";
import { siteUrl } from "@/lib/email";
import { tierLabel } from "@/lib/format";

/**
 * llms.txt (llmstxt.org): a plain summary of the site for AI assistants, with links to the pages worth reading.
 * Rebuilt from the database whenever content changes.
 */
export async function GET() {
  const base = siteUrl();
  const destinations = await Promise.all((await getDestinations()).map((d) => getDestination(d.slug)));
  const lines = [
    "# Creatour",
    "",
    "> Creatour compares real travel creators' itineraries for each destination and shows the places they don't miss: which places most creators recommend, which they say to skip, and what each route costs. Every recommendation links to the creator's original guide.",
    "",
    'How to read the data: a place\'s rank comes from how many different creators recommend it. "3 of 4 creators" means three of the four creators covering that city include it. Prices are typical costs in USD with a source link where the creator gave none.',
    "",
    "## Destinations",
    "",
  ];
  for (const d of destinations) {
    if (!d) continue;
    const who = d.creatorCount === 1 ? "1 creator" : `${d.creatorCount} creators`;
    lines.push(
      `- [${d.name}, ${d.country}](${base}/destinations/${d.slug}): ${d.summary} (${d.routes.length} itineraries from ${who})`,
    );
    lines.push(`  - [Top picks ranked by how many creators picked them](${base}/destinations/${d.slug}/best)`);
    lines.push(
      `  - [Best time to go](${base}/destinations/${d.slug}/when), [Before you go](${base}/destinations/${d.slug}/before), [Budget](${base}/destinations/${d.slug}/budget), [eSIM plans](${base}/destinations/${d.slug}/esim)`,
    );
  }
  lines.push("", "## Itineraries", "");
  for (const d of destinations) {
    if (!d) continue;
    for (const r of d.routes)
      lines.push(
        `- [${r.title}](${base}/itineraries/${r.slug}): ${d.name}, ${r.days} days, ${tierLabel[r.tier].toLowerCase()}, by ${r.creator.name}`,
      );
  }
  const posts = await getPosts();
  if (posts.length) {
    lines.push("", "## Blog", "");
    for (const p of posts) lines.push(`- [${p.title}](${base}/blog/${p.slug})${p.excerpt ? `: ${p.excerpt}` : ""}`);
  }
  lines.push(
    "",
    "## Optional",
    "",
    `- [All creators](${base}/creators)`,
    `- [Trip finder by length and budget](${base}/itineraries)`,
    `- [Visa checker](${base}/visa)`,
    `- [About](${base}/about)`,
    "",
  );
  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
