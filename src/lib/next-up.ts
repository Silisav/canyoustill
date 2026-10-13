// "Up next" for returning players (AGENTS.md "The home card", point 5): the first unanswered
// question from the player's position. The game keeps a copy of it in localStorage so the home
// page can show it on its first frame; the inline <head> script below hides the built-in sample
// for returning players before paint, so the sample never flashes.

import type { Deck, Question } from "./deck/types";
import type { Progress } from "./progress";

export interface NextUp {
  deck: string;
  /** Deck bundle version the copy came from; a newer build ignores a stale copy. */
  version: string;
  id: string;
  /** 1-based position in the player's order: "Continue at N". */
  position: number;
  question: Question;
}

const KEY = "next-up";

/** Inlined in <head>: mark a returning player before first paint. */
export const nextUpScript = `try{if(localStorage.getItem("${KEY}"))document.documentElement.dataset.returning=""}catch(e){}`;

/** Index of the first unanswered question from the current one onwards (wrapping), or -1. */
export function firstUnanswered(p: Progress): number {
  const n = p.order.length;
  for (let k = 0; k < n; k++) {
    const i = (p.cur + k) % n;
    if (p.results[p.order[i]] === undefined) return i;
  }
  return -1;
}

/** Keep the copy in step with progress. Only once something's been answered: a fresh or reset deck is a first visit again. */
export function writeNextUp(deck: Deck, p: Progress) {
  try {
    const i = firstUnanswered(p);
    const answered = Object.keys(p.results).length > 0;
    const question = i >= 0 ? deck.questions.find((q) => q.id === p.order[i]) : undefined;
    if (!answered || !question) return localStorage.removeItem(KEY);
    const next: NextUp = { deck: deck.id, version: deck.version, id: question.id, position: i + 1, question };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked: the home page shows the sample
  }
}

export function readNextUp(deckId: string): NextUp | null {
  try {
    const next = JSON.parse(localStorage.getItem(KEY) ?? "null") as NextUp | null;
    return next?.deck === deckId ? next : null;
  } catch {
    return null;
  }
}

export function clearNextUp() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

/** The page is done deciding: show whichever card is there. */
export function settleReturning() {
  delete document.documentElement.dataset.returning;
}
