// Motion, mini edition (AGENTS.md "Motion"): the browser's own animation engine driven by Motion's
// tiny `animate`, with springs compiled to CSS linear() easing. The full React API (motion
// components, AnimatePresence, drag) would cost ~40KB gzipped of the 50KB budget (AGENTS.md "Budget and performance");
// presence and drag are a few lines here instead.

import { spring } from "motion";
import { animate } from "motion/mini";

export { animate };

/** Anything the player touched settles with this. */
export const settle = { type: spring, stiffness: 380, damping: 36 } as const;

/** How far a card travels when it leaves or arrives. */
export const SLIDE_PX = 56;
