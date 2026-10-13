// Progress persistence in IndexedDB (AGENTS.md "State"), one entry per deck. If storage is unavailable
// (private mode, blocked site data) the game still works; progress just lasts for the visit.

import { get, set } from "idb-keyval";
import { reconcile, type Progress } from "./progress";

const key = (deck: string) => `progress:${deck}`;

export async function loadProgress(deck: string, ids: string[]): Promise<Progress> {
  try {
    return reconcile(await get(key(deck)), ids);
  } catch {
    return reconcile(undefined, ids);
  }
}

/** Resolves once saved (or once saving has failed: storage may be blocked). */
export function saveProgress(deck: string, progress: Progress): Promise<void> {
  return set(key(deck), progress).catch(() => {});
}

/**
 * Record one answer where only that question is on screen (the home sample, /q pages). The
 * game fits it to the deck on its next load (reconcile).
 */
export async function recordAnswer(deck: string, id: string, right: boolean) {
  try {
    const saved = ((await get(key(deck))) ?? {}) as Partial<Progress>;
    await set(key(deck), {
      order: saved.order ?? [],
      cur: saved.cur ?? 0,
      results: { ...(saved.results ?? {}), [id]: right },
    });
  } catch {
    // storage unavailable: the answer lasts for this page only
  }
}

/** Saved progress as stored, for screens that only need counts (the home CTA). */
export async function peekProgress(deck: string): Promise<Partial<Progress> | null> {
  try {
    return ((await get(key(deck))) as Partial<Progress> | undefined) ?? null;
  } catch {
    return null;
  }
}
