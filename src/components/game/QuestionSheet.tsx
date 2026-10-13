"use client";

import { useEffect, useRef, type PointerEvent } from "react";
import type { Question } from "@/lib/deck/types";
import type { Progress } from "@/lib/progress";
import { ghostButton, iconButton, iconMotion } from "../buttons";
import { CloseIcon, InOrderIcon, ResetIcon, ShuffleIcon } from "../icons";
import { animate, settle } from "./motion";
import { prefersReducedMotion } from "./reveal";

interface Props {
  open: boolean;
  questions: Map<string, Question>;
  progress: Progress;
  onClose(): void;
  onJump(index: number): void;
  /** Whether the order is the deck's own; the switch shows it. */
  inOrder: boolean;
  /** Put the deck in its own order (false) or shuffle it (true), keeping the current question. */
  onOrder(shuffle: boolean): void;
  onReset(): void;
}

/** One side of the In order | Shuffled switch: raised when it's the current order. */
const segment = (on: boolean) =>
  [
    "group inline-flex flex-1 items-center justify-center gap-2 rounded-[11px] border px-3 py-2 text-[15px] font-semibold transition-[background-color,border-color,color] duration-150",
    on ? "border-edge bg-card text-fg shadow-[0_2px_0_var(--c-edge)]" : "border-transparent text-mute hover:text-fg",
  ].join(" ");

const isDesktop = () => matchMedia("(min-width: 920px)").matches;

/** Dismiss when dragged this far down, or released faster than this (px/s). */
const DISMISS_PX = 120;
const DISMISS_SPEED = 600;

/**
 * All questions (AGENTS.md "Components"): a bottom sheet on mobile that follows the finger and
 * dismisses on distance or speed, a centred dialog on desktop. Built on <dialog> for focus
 * trapping, Esc and an inert page behind it.
 */
export function QuestionSheet({ open, questions, progress, onClose, onJump, inOrder, onOrder, onReset }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; y: number; t: number; speed: number } | null>(null);

  // Open: showModal, then animate in. Close: animate out from wherever the panel is, then close.
  useEffect(() => {
    const d = dialog.current;
    const p = panel.current;
    const b = backdrop.current;
    if (!d || !p || !b) return;
    const still = prefersReducedMotion();
    const desktop = isDesktop();
    const clear = () => {
      p.style.transform = p.style.opacity = b.style.opacity = "";
    };

    if (open) {
      if (!d.open) d.showModal();
      p.querySelector('[aria-current="true"]')?.scrollIntoView({ block: "nearest" });
      if (still) return;
      const a = [
        animate(b, { opacity: [0, 1] }, { duration: 0.2 }),
        desktop
          ? animate(p, { opacity: [0, 1], transform: ["scale(0.97)", "none"] }, { duration: 0.18, ease: "easeOut" })
          : animate(p, { transform: ["translateY(100%)", "none"] }, settle),
      ];
      return () => a.forEach((x) => x.stop());
    }

    if (!d.open) return;
    if (still) {
      d.close();
      clear();
      return;
    }
    const from = p.style.transform || "none";
    const a = [
      animate(b, { opacity: 0 }, { duration: 0.2 }),
      desktop
        ? animate(p, { opacity: 0, transform: "scale(0.97)" }, { duration: 0.15, ease: "easeIn" })
        : animate(p, { transform: [from, "translateY(100%)"] }, { duration: 0.22, ease: "easeIn" }),
    ];
    let cancelled = false; // reopened mid-exit: don't close the new one
    Promise.all(a).then(() => {
      if (cancelled) return;
      d.close();
      clear();
    });
    return () => {
      cancelled = true;
      a.forEach((x) => x.stop());
    };
  }, [open]);

  // Mobile drag from the handle and header. The grid below scrolls normally.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isDesktop() || (e.target as Element).closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, y: 0, t: e.timeStamp, speed: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || !panel.current) return;
    const raw = e.clientY - d.startY;
    const y = raw < 0 ? raw * 0.05 : raw; // a little give upwards, 1:1 downwards
    d.speed = ((y - d.y) / Math.max(1, e.timeStamp - d.t)) * 1000;
    d.y = y;
    d.t = e.timeStamp;
    panel.current.style.transform = `translateY(${y}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !panel.current) return;
    if (d.y > DISMISS_PX || d.speed > DISMISS_SPEED) onClose();
    else animate(panel.current, { transform: [`translateY(${d.y}px)`, "none"] }, settle);
  };

  return (
    <dialog
      ref={dialog}
      aria-label="All questions"
      // Esc: run the exit animation instead of closing at once.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-transparent p-0 text-fg backdrop:bg-transparent"
    >
      <div className="fixed inset-0 flex items-end justify-center desktop:items-center">
        <div ref={backdrop} className="absolute inset-0 bg-scrim" onClick={onClose} />
        <div
          ref={panel}
          className="relative flex max-h-[82dvh] w-full max-w-column flex-col rounded-t-[22px] border border-b-0 border-line bg-bg px-[18px] pt-2 pb-[calc(24px+env(safe-area-inset-bottom,0px))] desktop:rounded-[22px] desktop:border-b desktop:px-7 desktop:pt-6"
        >
          <div
            className="touch-none select-none desktop:touch-auto"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <div aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line desktop:hidden" />
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-[22px] font-extrabold tracking-headline">All questions</h2>
              <button type="button" className={iconButton} aria-label="Close" onClick={onClose}>
                <CloseIcon className={`${iconMotion} group-hover:rotate-90`} />
              </button>
            </div>
          </div>
          {/* Icons first: quicker to recognise than to read. The order is a switch, so a shuffle
              can always be undone; on phones Reset wraps below it. */}
          <div className="mb-4 flex flex-wrap gap-2.5">
            <div role="group" aria-label="Order" className="flex grow basis-[15rem] gap-1 rounded-primary border border-edge bg-bg2 p-1">
              <button type="button" aria-pressed={inOrder} className={segment(inOrder)} onClick={() => !inOrder && onOrder(false)}>
                <InOrderIcon className={`${iconMotion} group-hover:translate-x-0.5`} />
                In order
              </button>
              <button type="button" aria-pressed={!inOrder} className={segment(!inOrder)} onClick={() => inOrder && onOrder(true)}>
                <ShuffleIcon className={`${iconMotion} group-hover:-scale-x-100`} />
                Shuffled
              </button>
            </div>
            <button type="button" className={`${ghostButton} grow`} onClick={onReset}>
              <ResetIcon className={`${iconMotion} group-hover:-rotate-180`} />
              Reset progress
            </button>
          </div>
          <div className="-mx-1 overflow-y-auto overscroll-contain px-1 pt-1 pb-1">
            <ol className="grid grid-cols-[repeat(auto-fill,minmax(48px,1fr))] gap-2">
              {progress.order.map((id, i) => {
                const q = questions.get(id);
                const result = progress.results[id];
                const label = q?.number ?? i + 1;
                const status = result === true ? "right" : result === false ? "wrong" : "not answered";
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => onJump(i)}
                      aria-current={i === progress.cur ? "true" : undefined}
                      aria-label={`Question ${label}, ${status}`}
                      className={[
                        "grid aspect-square w-full place-items-center rounded-[12px] border text-[14px] font-bold tabular-nums",
                        result === true
                          ? "border-ok bg-okbg text-ok"
                          : result === false
                            ? "border-bad bg-badbg text-bad"
                            : "border-edge bg-card text-mute hover:border-mute",
                        i === progress.cur && "outline-3 outline-offset-0 outline-yellow text-fg",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </dialog>
  );
}
