// The player's progress through one deck (AGENTS.md "State": `{ order, results, cur }`). Pure functions
// here; persistence is in progress-store.ts.

export interface Progress {
  /** Question ids in play order (shuffling reorders this). */
  order: string[];
  /** Answered questions: true if right. The picked letter is not kept. */
  results: Record<string, boolean>;
  /** Index into `order`. */
  cur: number;
}

export function freshProgress(ids: string[]): Progress {
  return { order: [...ids], results: {}, cur: 0 };
}

/**
 * Fit saved progress to the deck as it is now: drop questions that no longer exist, append new
 * ones at the end, keep the current question current where possible.
 */
export function reconcile(saved: unknown, ids: string[]): Progress {
  if (!saved || typeof saved !== "object") return freshProgress(ids);
  const s = saved as Partial<Progress>;
  const known = new Set(ids);

  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of Array.isArray(s.order) ? s.order : []) {
    if (typeof id === "string" && known.has(id) && !seen.has(id)) {
      order.push(id);
      seen.add(id);
    }
  }
  for (const id of ids) if (!seen.has(id)) order.push(id);

  const results: Record<string, boolean> = {};
  for (const [id, right] of Object.entries(s.results ?? {})) {
    if (known.has(id) && typeof right === "boolean") results[id] = right;
  }

  const savedCurId = Array.isArray(s.order) && Number.isInteger(s.cur) ? s.order[s.cur as number] : undefined;
  const at = typeof savedCurId === "string" ? order.indexOf(savedCurId) : -1;
  const cur = at >= 0 ? at : Math.min(Math.max(Number.isInteger(s.cur) ? (s.cur as number) : 0, 0), order.length - 1);

  return { order, results, cur };
}

/** Whether the order is the deck's own (not shuffled). New questions are appended in deck order, so this holds after a reconcile too. */
export function isInDeckOrder(p: Progress, ids: string[]): boolean {
  return p.order.length === ids.length && p.order.every((id, i) => id === ids[i]);
}

/** Back to the deck's own order, keeping the current question current. */
export function inDeckOrder(p: Progress, ids: string[]): Progress {
  const current = p.order[p.cur];
  const order = [...ids];
  return { ...p, order, cur: Math.max(0, order.indexOf(current)) };
}

/** Shuffle the order (Fisher–Yates), keeping the current question current. */
export function shuffled(p: Progress, random: () => number = Math.random): Progress {
  const current = p.order[p.cur];
  const order = [...p.order];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...p, order, cur: order.indexOf(current) };
}
