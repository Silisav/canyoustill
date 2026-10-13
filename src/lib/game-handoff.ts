// Moves between the home page and /play within one page (no load), so the card can morph across
// (AGENTS.md "The home card"): the arriving side must render its card on the very first frame and say when it
// has. Module state survives Next's client-side navigation.

import type { Deck } from "./deck/types";
import type { Progress } from "./progress";

// --- home → game -------------------------------------------------------------------------

export interface Handoff {
  deck: Deck;
  progress: Progress;
  /** The card arriving from the home page: the option picked there (same marks), or null (Continue). */
  arrival?: { id: string; picked: string | null };
}

let pending: Handoff | null = null;

export function handOff(h: Handoff) {
  pending = h;
}

/** The handoff for this deck, if any. Safe to call from state initialisers. */
export function peekHandoff(deckId: string): Handoff | null {
  return pending?.deck.id === deckId ? pending : null;
}

/** Called once the game has mounted with it: a later visit to /play loads normally. */
export function clearHandoff() {
  pending = null;
}

// --- game → home -------------------------------------------------------------------------

let homeArrival = false;

/** The game card is flying back: the home card names its parts so the browser can pair them. */
export function arriveHome() {
  homeArrival = true;
}
export const peekHomeArrival = () => homeArrival;
export function clearHomeArrival() {
  homeArrival = false;
}

// --- "my card is on screen" ----------------------------------------------------------------

/** The game, the home page (its card), or any page after a page switch. */
type Side = "game" | "home" | "page";
const waiting = new Map<Side, () => void>();

/** Resolves when that side has rendered its card (ends the view transition's update). */
export const whenReady = (side: Side) => new Promise<void>((resolve) => waiting.set(side, resolve));

export function ready(side: Side) {
  waiting.get(side)?.();
  waiting.delete(side);
}

// --- the logo, while the game is on screen -------------------------------------------------

let flyHome: (() => void) | null = null;

/** The game registers how to go home (the card flies back); the site's logo uses it while it's there. */
export function setFlyHome(fn: (() => void) | null) {
  flyHome = fn;
}
export const getFlyHome = () => flyHome;
