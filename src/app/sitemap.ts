// /sitemap.xml: the pages worth finding. Every question's /q/ page is its canonical, shareable home
// (AGENTS.md "Routes"); /play is the game's state, not a page of its own.

import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";
import { buildDeck } from "@/lib/deck/build";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const deck = await buildDeck("javascript");
  return [{ url: `${base}/` }, { url: `${base}/about` }, ...deck.questions.map((q) => ({ url: `${base}/q/${q.id}` }))];
}
