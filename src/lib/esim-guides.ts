import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";

/**
 * Local connectivity notes shown under a country's eSIM table. Keyed by destination country; a country without an
 * entry just shows the table. Facts come from the linked sources; recheck them when plan prices are rechecked.
 */
export type EsimGuide = {
  checked: string;
  imei: { title: string; body: string[]; sources: string[] };
  coverage: { intro: string; areas: { name: string; note: string }[]; sources: string[] };
  faq: { q: string; a: string }[];
};

/** A country's guide, edited in Admin > eSIM plans; null when it has none. */
export async function getEsimGuide(country: string): Promise<EsimGuide | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("content");
  const row = await db.esimGuide.findUnique({ where: { country } });
  return (row?.data as EsimGuide | undefined) ?? null;
}
