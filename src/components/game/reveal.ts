// One timeline for the answer reveal (AGENTS.md "Motion"): press → others dim → output types →
// pause → explanation unfolds with Next at its foot. Each step starts when the previous one ends;
// these are the only timings.

const EASE = [0.2, 0.7, 0.2, 1] as const;

export const REVEAL = {
  dimMs: 180,
  /** Typing pace; long outputs speed up so the typing never takes longer than typeMaxMs. */
  charMs: 32,
  typeMaxMs: 1100,
  /** A beat to see the output before the explanation unfolds and the page follows it. */
  pauseMs: 450,
  unfoldMs: 450,
  ease: `cubic-bezier(${EASE.join(", ")})`,
  /** The same curve as numbers, for motion driven from script (the scroll that follows the unfold). */
  easePoints: EASE,
} as const;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
