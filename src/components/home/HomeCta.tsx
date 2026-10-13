"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useState, type MouseEvent } from "react";
import { clearNextUp, readNextUp } from "@/lib/next-up";
import { peekProgress, saveProgress } from "@/lib/progress-store";
import { phoneWide, primaryButton } from "../buttons";
import { isPlainClick } from "../plain-click";
import { CONTINUE_EVENT, NEXT_UP_EVENT } from "./HomeCard";

/**
 * The one primary on the home page (AGENTS.md "Home"): "Start", "Continue at N" or "Start over", with
 * progress (not score) beneath once started. The button keeps one width whatever it says and the
 * line beneath has its height reserved, so nothing shifts when saved progress arrives.
 */
export function HomeCta({ deckId, total }: { deckId: string; total: number }) {
  const [saved, setSaved] = useState<{ answered: number; cur: number } | null>(null);
  const [upNext, setUpNext] = useState<number | null>(null);

  // The up-next position is on the device already: right on the first frame.
  useLayoutEffect(() => setUpNext(readNextUp(deckId)?.position ?? null), [deckId]);

  useEffect(() => {
    peekProgress(deckId).then((p) => setSaved({ answered: Object.keys(p?.results ?? {}).length, cur: p?.cur ?? 0 }));
    const follow = (e: Event) => setUpNext((e as CustomEvent<number | null>).detail);
    addEventListener(NEXT_UP_EVENT, follow);
    return () => removeEventListener(NEXT_UP_EVENT, follow);
  }, [deckId]);

  const answered = saved?.answered ?? 0;
  const cur = saved?.cur ?? 0;
  const finished = answered >= total;
  const cls = `${primaryButton} ${phoneWide} max-w-[560px]`; // as wide as the card on phones

  // Every CTA goes in through the home card, morphing it into the game card (AGENTS.md "The home card"). A
  // real link underneath, so a modified click still opens the game in a new tab.
  const viaCard = (before?: () => Promise<void>) => async (e: MouseEvent) => {
    if (!isPlainClick(e)) return;
    e.preventDefault();
    await before?.();
    dispatchEvent(new Event(CONTINUE_EVENT));
  };

  let cta;
  if (finished) {
    const startOver = async () => {
      clearNextUp();
      await saveProgress(deckId, { order: [], results: {}, cur: 0 }); // the game refills the order
    };
    cta = (
      <Link href="/play" className={cls} onClick={viaCard(startOver)}>
        Start over
      </Link>
    );
  } else if (upNext !== null) {
    cta = (
      <Link href="/play" className={cls} onClick={viaCard()}>
        Continue at {upNext}
      </Link>
    );
  } else if (cur > 0 && answered > 0) {
    // Progress but no card for it yet (the card is still catching up): a plain switch. Without an
    // answer there's nothing to continue: opening a question's link moves `cur` but answers nothing.
    cta = (
      <Link href="/play" className={cls}>
        Continue at {cur + 1}
      </Link>
    );
  } else {
    cta = (
      <Link href="/play" className={cls} onClick={viaCard()}>
        Start
      </Link>
    );
  }

  return (
    <div data-enter className="mt-8">
      {cta}
      <p className="mt-3 h-5 text-sm font-medium text-mute" aria-live="polite">
        {answered > 0 && `${answered} of ${total} answered`}
      </p>
    </div>
  );
}
