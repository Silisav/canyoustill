"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Deck, Question } from "@/lib/deck/types";
import { arriveHome, clearHandoff, peekHandoff, ready, setFlyHome, whenReady } from "@/lib/game-handoff";
import { writeNextUp } from "@/lib/next-up";
import { freshProgress, inDeckOrder, isInDeckOrder, shuffled, type Progress } from "@/lib/progress";
import { loadProgress, saveProgress } from "@/lib/progress-store";
import { ghostButton, iconMotion } from "../buttons";
import { ChevronDownIcon } from "../icons";
import { morph } from "./morph";
import { SLIDE_PX, animate, settle } from "./motion";
import { useInstallOffer } from "@/lib/install";
import { InstallCard } from "./InstallCard";
import { QuestionCard, type QuestionCardHandle } from "./QuestionCard";
import { QuestionSheet } from "./QuestionSheet";
import { prefersReducedMotion } from "./reveal";

/** A card on stage. Leaving cards stay mounted (keeping their state) until they've gone. */
interface Slide {
  key: string;
  id: string;
  /** +1 arrived from the right, -1 from the left, 0 no entrance (first card on load). */
  dir: number;
  /** Set when leaving: the direction of the card that replaced it. */
  exitDir?: number;
}

/**
 * Card advance (AGENTS.md "Motion"): the outgoing card leaves and the incoming one settles as one
 * gesture. Slides share one grid cell, so they overlap without absolute positioning.
 */
function SlideFrame({ slide, onGone, children }: { slide: Slide; onGone(key: string): void; children: ReactNode }) {
  const el = useRef<HTMLDivElement>(null);
  const leaving = slide.exitDir !== undefined;

  useLayoutEffect(() => {
    if (!slide.dir || !el.current || prefersReducedMotion()) return;
    const a = animate(
      el.current,
      { transform: [`translateX(${slide.dir * SLIDE_PX}px)`, "none"], opacity: [0, 1] },
      { transform: settle, opacity: { duration: 0.2, ease: "easeOut" } },
    );
    return () => a.stop();
  }, [slide.dir]);

  useEffect(() => {
    if (!leaving || !el.current) return;
    if (prefersReducedMotion()) return onGone(slide.key);
    const a = animate(
      el.current,
      { transform: `translateX(${-(slide.exitDir ?? 1) * SLIDE_PX}px)`, opacity: 0 },
      { duration: 0.18, ease: "easeIn" },
    );
    a.then(() => onGone(slide.key));
    return () => a.stop();
  }, [leaving, slide.exitDir, slide.key, onGone]);

  return (
    <div
      ref={el}
      style={{ gridArea: "1 / 1" }}
      // min-w-0: long code lines scroll inside their block instead of widening the page.
      className={leaving ? "pointer-events-none min-w-0" : "min-w-0"}
      inert={leaving}
      aria-hidden={leaving || undefined}
    >
      {children}
    </div>
  );
}

/** Is the touch inside a code block that can scroll sideways? Then it's a scroll, not a swipe. */
const inScrollableCode = (target: EventTarget | null) => {
  const pre = target instanceof Element ? target.closest("pre") : null;
  return !!pre && pre.scrollWidth > pre.clientWidth;
};

/** The install offer's place on stage, between two questions (it's not a question). */
const INSTALL = "install-offer";

/** The question an address names: /q/<slug>. */
const slugIn = (path: string) => (path.startsWith("/q/") ? decodeURIComponent(path.slice(3).replace(/\/$/, "")) : null);

/**
 * The game (AGENTS.md "Routes"). At /play it resumes where you left off; at /q/<slug> it opens on
 * that question, which is server-rendered (`initial`) so the page has it before any script runs.
 * Either way the address follows the question on stage, so it can always be copied and shared.
 */
export function Game({ deckId, initial }: { deckId: string; initial?: { question: Question } }) {
  const router = useRouter();
  // Arriving from the home sample: everything is already loaded, so the first frame has the card.
  const [handoff] = useState(() => peekHandoff(deckId));
  const [deck, setDeck] = useState<Deck | null>(handoff?.deck ?? null);
  const [progress, setProgress] = useState<Progress | null>(handoff?.progress ?? null);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [slides, setSlides] = useState<Slide[]>(() => {
    if (handoff) {
      const id = handoff.progress.order[handoff.progress.cur];
      return [{ key: `0:${id}`, id, dir: 0 }];
    }
    return initial ? [{ key: `0:${initial.question.id}`, id: initial.question.id, dir: 0 }] : [];
  });
  /** An answer given on the server-rendered card before the deck and progress had loaded. */
  const early = useRef<{ id: string; right: boolean } | null>(null);
  const round = useRef(0); // bumped by Reset so even the same card starts fresh
  const card = useRef<QuestionCardHandle>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  // A transition into the game (the card morph, a page switch) can end once a card is on screen.
  const hasCard = slides.length > 0;
  useEffect(() => {
    if (hasCard) ready("game");
  }, [hasCard]);

  useEffect(() => {
    if (handoff) {
      clearHandoff();
      return;
    }
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/decks/${deckId}/deck.json`);
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as Deck;
        let saved = await loadProgress(deckId, data.questions.map((q) => q.id));
        if (!live) return;
        // A question's own address (a shared link, a refresh, or the offline fallback for one)
        // makes that question the current one; your answers stay as they are.
        const wanted = initial?.question.id ?? slugIn(location.pathname);
        const at = wanted ? saved.order.indexOf(wanted) : -1;
        if (at >= 0 && at !== saved.cur) saved = { ...saved, cur: at };
        if (early.current) saved = { ...saved, results: { ...saved.results, [early.current.id]: early.current.right } };
        if (at >= 0 || early.current) saveProgress(deckId, saved);
        setDeck(data);
        setProgress(saved);
        const id = saved.order[saved.cur];
        // Nothing moves on load. The server-rendered card stays as it is, unless this question was
        // answered before: then it's drawn again, answered.
        const answeredBefore = saved.results[id] !== undefined && !early.current;
        setSlides((s) => (s.length === 1 && s[0].id === id && !answeredBefore ? s : [{ key: `0:${id}:loaded`, id, dir: 0 }]));
      } catch {
        if (live) setFailed(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [deckId, handoff, initial]);

  // Keep the home page's "Up next" copy current (AGENTS.md "The home card", point 5).
  useEffect(() => {
    if (deck && progress) writeNextUp(deck, progress);
  }, [deck, progress]);

  const byId = useMemo(
    () => new Map<string, Question>(deck ? deck.questions.map((q) => [q.id, q]) : initial ? [[initial.question.id, initial.question]] : []),
    [deck, initial],
  );
  const deckIds = useMemo(() => deck?.questions.map((q) => q.id) ?? [], [deck]);

  const update = useCallback(
    (next: Progress) => {
      setProgress(next);
      saveProgress(deckId, next);
    },
    [deckId],
  );

  /** Put a question on stage, sliding in from `dir`. */
  const show = useCallback((id: string, dir: number) => {
    const key = `${round.current}:${id}`;
    setSlides((s) => [
      ...s.filter((x) => x.key !== key).map((x) => (x.exitDir === undefined ? { ...x, exitDir: dir } : x)),
      { key, id, dir },
    ]);
    // Back up to the question's top, under the bar; the site header stays scrolled away.
    const anchor = document.querySelector("[data-bar-anchor]");
    const top = anchor ? anchor.getBoundingClientRect().top + scrollY : 0;
    if (scrollY > top) window.scrollTo({ top });
  }, []);

  const gone = useCallback((key: string) => setSlides((s) => s.filter((x) => x.key !== key)), []);

  const goTo = useCallback(
    (index: number) => {
      if (!progress || index === progress.cur) return;
      update({ ...progress, cur: index });
      show(progress.order[index], index > progress.cur ? 1 : -1);
    },
    [progress, update, show],
  );

  /** Back home, the card flying to its slot there (AGENTS.md "The home card"): it lands as the question up next. */
  const goHome = useCallback(() => {
    arriveHome();
    morph({ nameParts: () => card.current?.nameForMorph(), navigate: () => router.push("/"), arrived: whenReady("home"), reveal: true });
  }, [router]);

  // The install offer takes the stage between two questions when it's due (AGENTS.md "Offline and install").
  const offer = useInstallOffer(progress ? Object.keys(progress.results).length : 0);
  const [offering, setOffering] = useState(false);
  const carryOn = useCallback(() => {
    setOffering(false);
    if (progress) goTo(progress.cur + 1);
  }, [progress, goTo]);

  const next = useCallback(() => {
    if (!progress) return;
    if (progress.cur >= progress.order.length - 1) return goHome();
    if (offer.due && !offering) {
      offer.shown();
      setOffering(true);
      show(INSTALL, 1);
      return;
    }
    goTo(progress.cur + 1);
  }, [progress, goTo, goHome, offer, offering, show]);

  const current = progress && byId.get(progress.order[progress.cur]);

  // The address follows the question on stage (replaced, not pushed: Back leaves the game).
  const currentId = current ? current.id : null;
  useEffect(() => {
    if (currentId && location.pathname !== `/q/${currentId}`) window.history.replaceState(null, "", `/q/${currentId}`);
  }, [currentId]);

  // In the game, the site's logo flies the card back home (AGENTS.md "The home card", point 8).
  useEffect(() => {
    setFlyHome(goHome);
    return () => setFlyHome(null);
  }, [goHome]);

  // Keyboard (AGENTS.md "Layout"): 1–9 or A–F answer, Enter skips ahead or goes next. Esc is the dialog's.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheetOpen || e.metaKey || e.ctrlKey || e.altKey || !current) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "Enter") {
        if (target?.closest("button, a")) return; // the focused control handles its own Enter
        e.preventDefault();
        if (offering) carryOn(); // past the install offer, without declining it
        else card.current?.enter();
        return;
      }
      if (offering) return;
      const n = Number(e.key);
      const keys = current.options.map((o) => o.key);
      const key = n >= 1 && n <= 9 ? keys[n - 1] : /^[a-f]$/i.test(e.key) ? e.key.toUpperCase() : undefined;
      if (key && keys.includes(key)) card.current?.pick(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, sheetOpen, offering, carryOn]);

  const total = deck?.questions.length ?? 0;
  const answeredHere = current && progress ? progress.results[current.id] !== undefined : false;

  return (
    <>
      {/* The game's bar: the counter, centred, over the progress line. Nothing else: sharing is in
          the header and at the end of each answer. Under the site header; once that scrolls away,
          the bar sticks to the top. */}
      <div data-bar-anchor aria-hidden="true" />
      <div data-top-bar className="sticky top-0 z-10 mx-auto mt-4 w-full max-w-column bg-bg pt-3 pb-3 desktop:mt-6">
        <div className="flex justify-center pb-3">
          {/* The counter is the way to all questions (AGENTS.md "Layout"): where you look for
              your place is where you change it. Sized for "155 / 155" so it never jumps. */}
          <button
            type="button"
            className={`${ghostButton} min-w-[8.5rem] font-bold text-mute tabular-nums`}
            aria-haspopup="dialog"
            disabled={!progress}
            onClick={() => setSheetOpen(true)}
          >
            <span className="sr-only">All questions, question </span>
            {progress && (
              <span>
                <b className="text-fg">{progress.cur + 1}</b> / {total}
              </span>
            )}
            <ChevronDownIcon className={`text-fg ${iconMotion} group-hover:translate-y-0.5`} />
          </button>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-bg2"
          role="progressbar"
          aria-label="Position in the deck"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={progress ? progress.cur : 0}
        >
          {/* Mounts with progress already known, so it only ever moves when the player moves. */}
          {progress && total > 0 && (
            <div
              className="h-full rounded-full bg-yellow transition-[width] duration-300 ease-out"
              style={{ width: `${(progress.cur / total) * 100}%` }}
            />
          )}
        </div>
      </div>

      <main
        className="mx-auto grid w-full max-w-column grid-cols-1 overflow-x-clip pt-[22px] desktop:pt-[30px]"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = inScrollableCode(e.target) ? null : { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || !answeredHere) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;
          if (dx < -80 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (offering) carryOn(); // past the install offer, without declining it
            else next(); // swipe left advances
          }
        }}
      >
        {failed && <p className="text-mute">Couldn&apos;t load the questions. Check your connection and reload.</p>}
        {slides.map((slide) => {
          if (slide.id === INSTALL) {
            return (
              <SlideFrame key={slide.key} slide={slide} onGone={gone}>
                <InstallCard
                  total={total}
                  onInstall={async () => {
                    await offer.install();
                    carryOn();
                  }}
                  onDecline={() => {
                    offer.decline();
                    carryOn();
                  }}
                />
              </SlideFrame>
            );
          }
          const q = byId.get(slide.id);
          const leaving = slide.exitDir !== undefined;
          if (!q) return null;
          return (
            <SlideFrame key={slide.key} slide={slide} onGone={gone}>
              <QuestionCard
                ref={leaving ? undefined : card}
                question={q}
                result={progress?.results[q.id]}
                arrival={handoff?.arrival?.id === q.id && slide.key === `0:${q.id}` ? { picked: handoff.arrival.picked } : undefined}
                isLast={progress ? progress.order.indexOf(q.id) === progress.order.length - 1 : false}
                onAnswer={(right) => {
                  if (progress) update({ ...progress, results: { ...progress.results, [q.id]: right } });
                  else early.current = { id: q.id, right };
                }}
                onNext={next}
              />
            </SlideFrame>
          );
        })}
      </main>

      {progress && (
        <QuestionSheet
          open={sheetOpen}
          questions={byId}
          progress={progress}
          onClose={() => setSheetOpen(false)}
          onJump={(i) => {
            setSheetOpen(false);
            goTo(i);
          }}
          inOrder={deck ? isInDeckOrder(progress, deckIds) : true}
          onOrder={(shuffle) => deck && update(shuffle ? shuffled(progress) : inDeckOrder(progress, deckIds))}
          onReset={() => {
            if (!deck || !confirm("Clear all your answers?")) return;
            setSheetOpen(false);
            round.current += 1;
            const fresh = freshProgress(deckIds);
            update(fresh);
            show(fresh.order[0], -1);
          }}
        />
      )}
    </>
  );
}
