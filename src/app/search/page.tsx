import type { Metadata } from "next";
import { getSearchIndex } from "@/lib/data";
import { SearchBox } from "./search-box";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage() {
  const index = await getSearchIndex();
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <SearchBox index={index} />
    </>
  );
}
