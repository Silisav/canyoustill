// The page follows a reveal (AGENTS.md "Motion"): after the player answers, scroll down by the
// least amount that brings `show` into view, in step with the unfold (same duration and curve),
// so it reads as one movement. Never so far that `keep` goes under the top bar, never up. The
// player's own scrolling, touch or click stops it where it is.

import { cubicBezier } from "motion";
import { REVEAL, prefersReducedMotion } from "./reveal";

const ease = cubicBezier(...REVEAL.easePoints);
const MARGIN = 16; // space left under `show`
const GAP = 12; // space kept above `keep`
const USER = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
const SCROLL_KEYS = new Set(["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]);

/**
 * Where the game's sticky bar ends once it's pinned to the top, or 0. Not where it is now: under
 * the site header it starts lower and only pins as the page scrolls, and it's the pinned bar the
 * output line must stay clear of.
 */
const topInset = () => {
  const bar = document.querySelector<HTMLElement>("[data-top-bar]");
  return bar ? (parseFloat(getComputedStyle(bar).top) || 0) + bar.offsetHeight : 0;
};

/**
 * Positions are read now, so call it as the reveal starts: content inside a still-collapsed
 * panel already sits where it will land. Returns a stop function.
 */
export function follow(show: Element, keep: Element): () => void {
  const want = show.getBoundingClientRect().bottom + MARGIN - innerHeight;
  const room = keep.getBoundingClientRect().top - topInset() - GAP;
  const by = Math.min(want, room);
  if (by < 1) return () => {};

  const from = scrollY;
  if (prefersReducedMotion()) {
    scrollTo({ top: from + by, behavior: "instant" });
    return () => {};
  }

  const start = performance.now();
  let frame = requestAnimationFrame(function step(now) {
    const t = Math.min(1, (now - start) / REVEAL.unfoldMs);
    scrollTo({ top: from + by * ease(t), behavior: "instant" });
    if (t < 1) frame = requestAnimationFrame(step);
    else stop();
  });

  const onUser = (e: Event) => {
    if (!(e instanceof KeyboardEvent) || SCROLL_KEYS.has(e.key)) stop();
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const type of USER) removeEventListener(type, onUser, true);
  };
  for (const type of USER) addEventListener(type, onUser, { capture: true, passive: true });
  return stop;
}
