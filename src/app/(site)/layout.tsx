// The pages around the game (home, About, single questions) share one frame that stays mounted as
// you move between them: the header, footer and background paper don't re-render, so a page switch
// only swaps the content, and the logo can finish springing back while the next page arrives
// (AGENTS.md "Design").

import type { ReactNode } from "react";
import { buildDeck } from "@/lib/deck/build";
import { SitePage } from "@/components/SiteChrome";
import { SiteBackground } from "@/components/site/SiteBackground";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const deck = await buildDeck("javascript");
  return (
    <SitePage author={deck.author}>
      {children}
      <SiteBackground />
    </SitePage>
  );
}
