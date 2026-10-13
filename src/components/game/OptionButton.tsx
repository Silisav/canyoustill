"use client";

import type { CSSProperties } from "react";
import type { Option } from "@/lib/deck/types";
import { REVEAL } from "./reveal";

export type OptionState = "idle" | "right" | "wrong" | "other";

/** How an option looks once `picked` (or nothing, for a card answered wrongly before) is known. */
export function optionState(key: string, answered: boolean, answer: string, picked: string | null): OptionState {
  if (!answered) return "idle";
  return key === answer ? "right" : key === picked ? "wrong" : "other";
}

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/**
 * An answer option (AGENTS.md "Components"): unmistakably a button in both themes. Shared by the
 * game card and the home sample card so the morph between them is one and the same control.
 */
export function OptionButton({
  option,
  state,
  hint,
  onPick,
  transitionName,
}: {
  option: Option;
  state: OptionState;
  /** Keyboard hint shown on desktop while unanswered (1, 2, …), or null. */
  hint: number | null;
  onPick(key: string): void;
  transitionName?: string;
}) {
  const style: CSSProperties = { transitionDuration: `${REVEAL.dimMs}ms` };
  if (transitionName) style.viewTransitionName = transitionName;
  return (
    <button
      type="button"
      data-option={option.key}
      disabled={state !== "idle"}
      onClick={() => onPick(option.key)}
      style={style}
      className={cx(
        "grid w-full grid-cols-[36px_1fr_auto] items-center gap-3.5 rounded-card border px-3.5 py-[13px] text-left text-[16.5px] leading-[1.4] font-medium",
        "transition-[translate,box-shadow,border-color,background-color,opacity] ease-out",
        // Fill and edge come only from the state: two bg-* classes would fight by CSS order.
        state === "idle" &&
          "spread border-edge bg-card shadow-option hover:border-mute hover:shadow-[0_3px_0_var(--c-mute)] active:translate-y-[3px] active:shadow-none",
        state === "right" && "border-ok bg-okbg shadow-[0_3px_0_var(--c-ok)]",
        state === "wrong" && "border-bad bg-badbg shadow-[0_3px_0_var(--c-bad)]",
        state === "other" && "border-edge bg-card opacity-40",
      )}
    >
      <span
        className={cx(
          "grid size-9 place-items-center rounded-[10px] border text-[15px] font-extrabold",
          state === "right" ? "border-ok bg-ok text-ok-ink" : state === "wrong" ? "border-bad bg-bad text-bad-ink" : "border-edge bg-bg2",
        )}
      >
        {option.key}
      </span>
      <span className="md-inline" dangerouslySetInnerHTML={{ __html: option.html }} />
      <span aria-hidden="true" className="hidden font-mono text-xs text-mute desktop:inline">
        {state === "idle" && hint !== null ? hint : ""}
      </span>
      {state === "right" && <span className="sr-only">(right answer)</span>}
      {state === "wrong" && <span className="sr-only">(your answer)</span>}
    </button>
  );
}
