"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import type { Question } from "@/lib/deck/types";
import { phoneWide, primaryButton } from "../buttons";
import { ExternalLink } from "../ExternalLink";
import { CodeBlock } from "./CodeBlock";
import { OptionButton, optionState } from "./OptionButton";
import { OutputLine, type OutputLineHandle } from "./OutputLine";
import { follow } from "./follow";
import { REVEAL, prefersReducedMotion } from "./reveal";
import { morphName } from "./morph";

/** ask → dim → type → pause → done. A card that was answered before starts at done. */
type Stage = "ask" | "dim" | "type" | "pause" | "done";

export interface QuestionCardHandle {
  pick(key: string): void;
  /** Enter: skip ahead in the reveal, or go to the next question once it's done. */
  enter(): void;
  /** Name the card's parts for a morph to the home page (call inside flushSync). */
  nameForMorph(): void;
}

interface Props {
  question: Question;
  /** Saved result if answered before: true right, false wrong. */
  result: boolean | undefined;
  /**
   * This card is the home card morphing in (AGENTS.md "The home card"): with a pick, the same marks and the
   * explanation still to unfold; without one (Continue), unanswered.
   */
  arrival?: { picked: string | null };
  isLast: boolean;
  onAnswer(right: boolean): void;
  onNext(): void;
  /** Overrides "Next question" / "Finish" (e.g. on a single-question page). */
  nextLabel?: string;

  ref?: Ref<QuestionCardHandle>;
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** After a morph, the explanation waits for the card to land before unfolding. */
const ARRIVAL_PAUSE_MS = 420;

export function QuestionCard({ question: q, result, arrival, isLast, onAnswer, onNext, nextLabel, ref }: Props) {
  const answeredBefore = result !== undefined && !arrival;
  // We keep right/wrong, not the letter: a card answered wrongly before shows only the right one.
  const [picked, setPicked] = useState<string | null>(arrival?.picked ?? (result ? q.answer : null));
  const [stage, setStage] = useState<Stage>(arrival?.picked ? "pause" : answeredBefore ? "done" : "ask");
  const [instant, setInstant] = useState(answeredBefore);
  const [fresh, setFresh] = useState(false); // picked on this card, now (announce it)
  const [typing, setTyping] = useState(false); // a fresh pick types its output out, motion allowed
  const [morphing, setMorphing] = useState(!!arrival);
  const output = useRef<OutputLineHandle>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const followed = useRef(stage === "done"); // a card answered before doesn't scroll

  const pick = (key: string) => {
    if (stage !== "ask" || !q.options.some((o) => o.key === key)) return;
    setPicked(key);
    setFresh(true);
    onAnswer(key === q.answer);
    if (prefersReducedMotion()) {
      setInstant(true);
      setStage("done");
    } else {
      setTyping(true);
      setStage("dim");
    }
  };

  useImperativeHandle(ref, () => ({
    pick,
    enter() {
      if (stage === "type") output.current?.skip();
      else if (stage === "dim" || stage === "pause") setStage("done");
      else if (stage === "done") onNext();
    },
    nameForMorph: () => setMorphing(true),
  }));

  // The timed steps; typing ends itself through OutputLine's onDone.
  useEffect(() => {
    if (stage === "dim") {
      const t = setTimeout(() => setStage("type"), REVEAL.dimMs);
      return () => clearTimeout(t);
    }
    if (stage === "pause") {
      const t = setTimeout(() => setStage("done"), arrival && !typing ? ARRIVAL_PAUSE_MS : REVEAL.pauseMs);
      return () => clearTimeout(t);
    }
  }, [stage, arrival, typing]);

  // Morph names are only for the transition in; drop them so nothing else animates as a pair.
  useEffect(() => {
    if (!morphing) return;
    const t = setTimeout(() => setMorphing(false), 1000);
    return () => clearTimeout(t);
  }, [morphing]);

  // As the explanation unfolds, the page follows it as far as Next, keeping the output line in
  // view (AGENTS.md "Motion"). Only after an answer given on this card.
  useEffect(() => {
    if (stage !== "done" || followed.current) return;
    followed.current = true;
    const out = card.current?.querySelector("[data-output]");
    if (out && nextButton.current) return follow(nextButton.current, out);
  }, [stage]);

  // A new card takes focus so screen readers start at the question.
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, []);

  const answered = stage !== "ask";
  const right = picked === q.answer;
  const showOutput = stage === "type" || stage === "pause" || stage === "done";
  const verdict = right ? "Nice, that's right." : picked ? `Not quite. It's ${q.answer}.` : "You missed this one before";
  const name = (part: string) => (morphing ? morphName(part) : undefined);

  return (
    <article ref={card}>
      <h1
        ref={title}
        data-reveal
        tabIndex={-1}
        style={{ viewTransitionName: name("title") }}
        className={cx(
          "md-inline font-extrabold tracking-headline outline-none",
          q.code.length ? "mb-3.5 text-[23px] leading-[1.2]" : "mt-2 mb-6 text-[30px] leading-[1.1]",
        )}
        dangerouslySetInnerHTML={{ __html: q.titleHtml }}
      />

      {q.code.length > 0 && (
        <div data-enter>
          {q.code.map((block, i) => (
            <CodeBlock key={i} block={block} transitionName={name(`code-${i}`)} />
          ))}
        </div>
      )}

      <div role="group" aria-label="Answers" data-enter className="mt-[22px] grid gap-3">
        {q.options.map((o, i) => (
          <OptionButton
            key={o.key}
            option={o}
            state={optionState(o.key, answered, q.answer, picked)}
            hint={i + 1}
            onPick={pick}
            transitionName={name(`option-${o.key}`)}
          />
        ))}
      </div>

      {showOutput && (
        <OutputLine
          ref={output}
          text={q.output}
          animate={typing}
          transitionName={name("output")}
          onDone={(skipped) => setStage(skipped ? "done" : "pause")}
        />
      )}

      {/* Explanation unfolds by grid rows 0fr → 1fr; Next sits at its foot so it arrives last. */}
      <div
        data-explanation
        data-enter
        className="grid"
        style={{
          gridTemplateRows: stage === "done" ? "1fr" : "0fr",
          transition: instant ? "none" : `grid-template-rows ${REVEAL.unfoldMs}ms ${REVEAL.ease}`,
        }}
        inert={stage !== "done"}
      >
        {/* relative: absolutely placed bits inside (screen-reader labels) are clipped too, not left
            hanging below the page while the explanation is folded. */}
        <div className="relative min-h-0 overflow-hidden">
          <div className="pt-6">
            <p className={cx("mb-2.5 text-[26px] leading-[1.1] font-black tracking-headline", right ? "text-ok" : "text-bad")}>
              {verdict}
            </p>
            <div className="md-prose" dangerouslySetInnerHTML={{ __html: q.explanationHtml }} />
            <p className="mt-4 text-sm font-medium text-mute">
              {q.number !== null && q.sourceUrl ? (
                <>
                  Question {q.number} ·{" "}
                  <ExternalLink href={q.sourceUrl} className="underline underline-offset-2 hover:text-fg">
                    see the original
                  </ExternalLink>
                </>
              ) : (
                <>Community question{q.author && <> by @{q.author}</>}</>
              )}
            </p>
            {/* pb-1 and pr-1 leave room for the button's offset shadow inside the unfold's clip. */}
            <div className="mt-[26px] flex flex-wrap items-center gap-3 pr-1 pb-1">
              <button ref={nextButton} type="button" className={`${primaryButton} ${phoneWide}`} onClick={onNext}>
                {nextLabel ?? (isLast ? "Finish" : "Next question")}
              </button>
              <span className="hidden text-[13px] font-medium text-mute desktop:inline">or press Enter</span>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {fresh ? `${right ? "Right." : `Not quite. The answer is ${q.answer}.`} Output: ${q.output}` : ""}
      </p>
    </article>
  );
}
