"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { REVEAL } from "./reveal";

export interface OutputLineHandle {
  /** Finish typing now. */
  skip(): void;
}

/** Split into what a reader sees as characters, so emoji never type out half-drawn. */
function characters(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
}

/**
 * `> value`, typed out at REVEAL.charMs per character (faster for long values, so it never takes
 * more than REVEAL.typeMaxMs); a tap skips. Typing writes straight to the
 * DOM so the card doesn't re-render 60 times a second.
 */
export function OutputLine({
  text,
  animate,
  onDone,
  transitionName,
  oneLine = false,
  className = "mt-5 rounded-[12px] border border-line bg-bg2 px-4 py-3 text-[15px] leading-[1.7]",
  ref,
}: {
  text: string;
  animate: boolean;
  onDone?: (skipped: boolean) => void;
  /** For the home sample morph. */
  transitionName?: string;
  /** Box styling; the home sample's strip shows the line without the box. */
  className?: string;
  /** Keep to one line, ending in "…" if it's too long (the home card's strip). */
  oneLine?: boolean;
  ref?: Ref<OutputLineHandle>;
}) {
  const value = useRef<HTMLSpanElement>(null);
  const [typing, setTyping] = useState(animate);
  const done = useRef(!animate);
  const frame = useRef(0);

  const finish = (skipped: boolean) => {
    if (done.current) return;
    done.current = true;
    cancelAnimationFrame(frame.current);
    if (value.current) value.current.textContent = text;
    setTyping(false);
    onDone?.(skipped);
  };

  useImperativeHandle(ref, () => ({ skip: () => finish(true) }));

  useEffect(() => {
    if (!animate) return;
    const chars = characters(text);
    const perChar = Math.min(REVEAL.charMs, REVEAL.typeMaxMs / chars.length);
    const start = performance.now();
    const tick = (now: number) => {
      const n = Math.min(chars.length, Math.floor((now - start) / perChar) + 1);
      if (value.current) value.current.textContent = chars.slice(0, n).join("");
      if (n >= chars.length) finish(false);
      else frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, []); // once per mount: a new answer mounts a new line

  return (
    <div
      data-output
      style={{ viewTransitionName: transitionName }}
      className={`${className} font-mono text-mute ${
        oneLine ? "overflow-hidden text-ellipsis whitespace-pre" : "whitespace-pre-wrap [overflow-wrap:anywhere]"
      }`}
      onClick={() => finish(true)}
    >
      <span aria-hidden="true">&gt; </span>
      <span ref={value} className="font-medium text-fg">
        {animate ? "" : text}
      </span>
      {typing && (
        <span aria-hidden="true" className="ml-px inline-block h-[1.1em] w-[0.6em] rounded-[2px] bg-yellow align-[-0.2em]" />
      )}
    </div>
  );
}
