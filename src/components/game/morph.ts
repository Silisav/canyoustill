// The card morph between the home page and the game (AGENTS.md "The home card"). Matching
// parts of the two cards carry the same view-transition-name, so the browser animates each from
// where it sat to where it lands; everything else crossfades.

import { flushSync } from "react-dom";
import { tagPageSwitch } from "../PageLink";
import { animate } from "./motion";
import { prefersReducedMotion } from "./reveal";

export const morphName = (part: string) => `sample-${part}`;

/** Morph timing; the explanation unfolds as the card lands. */
export const MORPH_MS = 380;

/**
 * Switch pages inside a view transition.
 * @param nameParts turn on this side's morph names (run synchronously before the snapshot)
 * @param navigate  the client-side switch
 * @param arrived   resolves once the other side has rendered its card
 * @param reveal    the new page enters as after any page switch (PageLink.tsx): back home, the
 *                  text rises in reading order while the card flies to its slot
 */
export async function morph({
  nameParts,
  navigate,
  arrived,
  reveal = false,
}: {
  nameParts(): void;
  navigate(): void;
  arrived: Promise<void>;
  reveal?: boolean;
}) {
  if (prefersReducedMotion()) return navigate();
  if (!document.startViewTransition) {
    // No View Transitions: a crossfade instead.
    const main = document.querySelector("main");
    if (main) await animate(main, { opacity: 0 }, { duration: 0.2 });
    return navigate();
  }
  flushSync(nameParts);
  const untag = reveal ? tagPageSwitch("reveal") : null;
  const t = document.startViewTransition(async () => {
    navigate();
    await Promise.race([arrived, new Promise((r) => setTimeout(r, 1500))]);
  });
  if (untag) t.finished.finally(untag);
}
