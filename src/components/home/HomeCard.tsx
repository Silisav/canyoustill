"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Deck, Question } from "@/lib/deck/types";
import { clearHomeArrival, handOff, peekHomeArrival, ready, whenReady } from "@/lib/game-handoff";
import { clearNextUp, firstUnanswered, readNextUp, settleReturning, writeNextUp } from "@/lib/next-up";
import { loadProgress, peekProgress, recordAnswer, saveProgress } from "@/lib/progress-store";
import { ghostButton } from "../buttons";
import { CodeBlock } from "../game/CodeBlock";
import { follow } from "../game/follow";
import { animate, settle } from "../game/motion";
import { morph, morphName } from "../game/morph";
import { OptionButton, optionState } from "../game/OptionButton";
import { OutputLine } from "../game/OutputLine";
import { REVEAL, prefersReducedMotion } from "../game/reveal";

/** The CTA asks the card to morph into the game ("Continue at N"). */
export const CONTINUE_EVENT = "home:continue";
/** The card tells the CTA what it's showing now. */
export const NEXT_UP_EVENT = "home:next-up";

type Shown = { mode: "sample"; question: Question } | { mode: "next"; question: Question; position: number };

/**
 * The home card (AGENTS.md "The home card"): the deck's first question on a first visit;
 * for a returning player, the question up next. Either way it morphs into the game card.
 */
export function HomeCard({ sample, deckId, version }: { sample: Question; deckId: string; version: string }) {
  const [shown, setShown] = useState<Shown>({ mode: "sample", question: sample });
  // Arriving from the game: the card names its parts so the game card can fly into it.
  const [arriving] = useState(peekHomeArrival);
  const target = useRef<Shown["mode"]>("sample"); // what the device's copy says will show
  const deck = useRef<Promise<Deck> | null>(null);
  const getDeck = () => (deck.current ??= fetch(`/decks/${deckId}/deck.json`).then((r) => r.json() as Promise<Deck>));

  // Before the first paint after hydration: the device's copy decides which card shows.
  useLayoutEffect(() => {
    const copy = readNextUp(deckId);
    if (copy?.version === version) {
      target.current = "next";
      setShown({ mode: "next", question: copy.question, position: copy.position });
    } else if (!copy) {
      settleReturning(); // nothing saved: the sample it is
    }
    // A copy from an older build stays hidden until the check below replaces it.
  }, [deckId, version]);

  // Then check against real progress: the copy can go stale (a new build), and progress can
  // exist without one (storage partly cleared).
  useEffect(() => {
    let live = true;
    (async () => {
      const saved = await peekProgress(deckId);
      if (!readNextUp(deckId) && !Object.keys(saved?.results ?? {}).length) return; // a first visit
      try {
        const d = await getDeck();
        const progress = await loadProgress(deckId, d.questions.map((q) => q.id));
        if (!live) return;
        const i = firstUnanswered(progress);
        if (i < 0 || !Object.keys(progress.results).length) {
          clearNextUp();
          setShown({ mode: "sample", question: sample });
        } else {
          const question = d.questions.find((q) => q.id === progress.order[i])!;
          writeNextUp(d, progress);
          setShown((s) => (s.question.id === question.id && s.mode === "next" ? s : { mode: "next", question, position: i + 1 }));
        }
      } catch {
        // offline without a cached deck: keep what's shown
      }
      if (live) settleReturning();
    })();
    return () => {
      live = false;
    };
  }, []); // once per page: the inputs are fixed for its lifetime

  // The card is on screen: stop hiding, let the CTA know what "Continue" means, and end a morph
  // from the game once the card it lands on is the final one.
  useEffect(() => {
    if (shown.mode === "next") settleReturning();
    dispatchEvent(new CustomEvent(NEXT_UP_EVENT, { detail: shown.mode === "next" ? shown.position : null }));
    if (arriving && shown.mode === target.current) {
      clearHomeArrival();
      ready("home");
    }
  }, [shown, arriving]);

  return (
    <TryCard
      key={`${shown.mode}:${shown.question.id}`}
      question={shown.question}
      deckId={deckId}
      getDeck={getDeck}
      label={shown.mode === "next" ? "Up next" : "Try one first"}
      hint={
        shown.mode === "next"
          ? `Question ${shown.position}. Answer here or carry on in the game.`
          : "Pick one. It counts as your answer in the game."
      }
      rightLabel={shown.mode === "next" ? "Continue" : "Start"}
      sample={shown.mode === "sample"}
      arriving={arriving}
    />
  );
}

/**
 * One question on a fixed stage: answering marks the options in place and a feedback strip
 * slides up inside the bottom edge over a footer of the same height, so nothing outside the card
 * moves. Its button (or the CTA's Continue) morphs it into the game card.
 */
function TryCard({
  question: q,
  deckId,
  getDeck,
  label,
  hint,
  rightLabel,
  sample,
  arriving,
}: {
  question: Question;
  deckId: string;
  getDeck: () => Promise<Deck>;
  /** The card's name for screen readers ("Try one first" / "Up next"); on screen, the hint at its foot says it. */
  label: string;
  hint: string;
  rightLabel: string;
  sample: boolean;
  /** The game card is flying in: names on from the first frame. */
  arriving: boolean;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<string | null>(null);
  const [stripUp, setStripUp] = useState(false);
  const [morphing, setMorphing] = useState(arriving);
  const strip = useRef<HTMLDivElement>(null);
  const cardEl = useRef<HTMLElement>(null);
  const recorded = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    router.prefetch("/play"); // so the switch doesn't wait on the network
  }, [router]);

  const right = picked === q.answer;

  const pick = (key: string) => {
    if (picked) return;
    setPicked(key);
    // It counts in the game, and the next visit's "Up next" should know about it.
    recorded.current = recordAnswer(deckId, q.id, key === q.answer).then(async () => {
      try {
        const d = await getDeck();
        writeNextUp(d, await loadProgress(deckId, d.questions.map((x) => x.id)));
      } catch {
        // offline without the deck: the home page catches up next time
      }
    });
    const show = () => setStripUp(true);
    if (prefersReducedMotion()) show();
    else setTimeout(show, REVEAL.dimMs); // the strip follows the dim, as in the game
  };

  // The strip rises from below the card's edge; the card clips it.
  useEffect(() => {
    if (!stripUp || !strip.current || prefersReducedMotion()) return;
    const a = animate(strip.current, { transform: ["translateY(100%)", "none"] }, settle);
    return () => a.stop();
  }, [stripUp]);

  // If the card's foot is off-screen, the page follows the strip up just far enough to show it,
  // never scrolling the option you tapped out of view (AGENTS.md "Motion").
  useEffect(() => {
    const tapped = cardEl.current?.querySelector(`[data-option="${picked}"]`);
    if (stripUp && cardEl.current && tapped) return follow(cardEl.current, tapped);
  }, [stripUp]); // `picked` is set by then

  // Names are only for a transition; drop them so nothing else animates as a pair.
  useEffect(() => {
    if (!morphing) return;
    const t = setTimeout(() => setMorphing(false), 1000);
    return () => clearTimeout(t);
  }, [morphing]);

  /** Morph into the game card for this question: answered (with the same marks) or not. */
  const enterGame = async (withPick: string | null) => {
    await recorded.current;
    const deck = await getDeck();
    const progress = await loadProgress(deckId, deck.questions.map((x) => x.id));
    const here = { ...progress, cur: progress.order.indexOf(q.id) };
    await saveProgress(deckId, here);
    handOff({ deck, progress: here, arrival: { id: q.id, picked: withPick } });
    morph({ nameParts: () => setMorphing(true), navigate: () => router.push("/play"), arrived: whenReady("game") });
  };

  // The CTA ("Start", "Continue at N", "Start over") goes in through this card.
  useEffect(() => {
    const go = () => enterGame(picked);
    addEventListener(CONTINUE_EVENT, go);
    return () => removeEventListener(CONTINUE_EVENT, go);
  });

  const name = (part: string) => (morphing ? morphName(part) : undefined);
  // Strip and footer share one height: two rows on desktop, three where the button wraps.
  const reserve = "h-[132px] desktop:h-[104px]";

  return (
    <section
      ref={cardEl}
      aria-label={label}
      data-home-sample={sample ? "" : undefined}
      className="@container relative overflow-hidden rounded-[22px] border border-line bg-panel desktop:rounded-[24px]"
    >
      {/* Bottom padding keeps the last option's ledge clear of the strip. */}
      <div className="px-[18px] pt-[18px] pb-3 desktop:px-6 desktop:pt-6">
        <h2
          className="md-inline mb-3.5 text-[23px] leading-[1.2] font-extrabold tracking-headline"
          style={{ viewTransitionName: name("title") }}
          dangerouslySetInnerHTML={{ __html: q.titleHtml }}
        />
        {/* Code is sized by the card's width: narrow cards (phones) take the smallest step; wide ones
            the game's own sizes, so the code keeps its size through the morph. */}
        {q.code.map((block, i) => (
          <CodeBlock key={i} block={block} size="container" transitionName={name(`code-${i}`)} />
        ))}
        <div role="group" aria-label="Answers" className="mt-[22px] grid gap-3">
          {q.options.map((o) => (
            <OptionButton
              key={o.key}
              option={o}
              state={optionState(o.key, !!picked, q.answer, picked)}
              hint={null}
              onPick={pick}
              transitionName={name(`option-${o.key}`)}
            />
          ))}
        </div>
      </div>

      <div className={`${reserve} flex items-center px-[18px] text-sm font-medium text-mute desktop:px-6`} aria-hidden={stripUp}>
        {hint}
      </div>

      <div
        ref={strip}
        inert={!stripUp}
        aria-hidden={!stripUp}
        style={{ transform: stripUp ? undefined : "translateY(100%)" }}
        className={`${reserve} absolute inset-x-0 bottom-0 flex flex-col justify-center gap-2 border-t px-[18px] desktop:px-6 ${
          right ? "border-ok bg-okbg" : "border-bad bg-badbg"
        }`}
      >
        {stripUp && (
          <>
            <OutputLine
              text={q.output}
              animate={!prefersReducedMotion()}
              transitionName={name("output")}
              oneLine
              className="text-[15px] leading-[1.5]"
            />
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
              <p className={`text-base font-extrabold tracking-headline ${right ? "text-ok" : "text-bad"}`} aria-live="polite">
                {right ? "Nice. The rest get harder." : "Most people miss this one."}
              </p>
              {/* Both outcomes morph into the game card for this question (AGENTS.md "The home card"). */}
              <button type="button" className={`${ghostButton} px-4`} onClick={() => enterGame(picked)}>
                {right ? rightLabel : "See why"}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
