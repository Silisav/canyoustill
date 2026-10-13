"use client";

import { useEffect, useRef, useState } from "react";
import type { CodeBlock as Block } from "@/lib/deck/types";

const PHONE = { base: "text-code", long: "text-code-long", longer: "text-code-longer" } as const;
const DESKTOP = {
  base: "desktop:text-code-desktop",
  long: "desktop:text-code-long-desktop",
  longer: "desktop:text-code-longer-desktop",
} as const;
/**
 * Sized by the enclosing @container (the home card) rather than the screen: the smallest step
 * below 380px wide, the game's phone sizes from 380px, its desktop sizes from 520px.
 */
const BY_CONTAINER = {
  base: "text-code-longer @min-[380px]:text-code @min-[520px]:text-code-desktop",
  long: "text-code-longer @min-[380px]:text-code-long @min-[520px]:text-code-long-desktop",
  longer: "text-code-longer @min-[520px]:text-code-longer-desktop",
} as const;

/** A highlighted block. Long lines scroll inside the block; the page never scrolls sideways. */
export function CodeBlock({
  block,
  transitionName,
  size = block.size,
}: {
  block: Block;
  transitionName?: string;
  /** Override the font step, or size by the enclosing container (the home card). */
  size?: Block["size"] | "container";
}) {
  const pre = useRef<HTMLPreElement>(null);
  const [scrolls, setScrolls] = useState(false);

  // A block that scrolls must be reachable by keyboard.
  useEffect(() => {
    const el = pre.current;
    if (!el) return;
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <figure className="mb-2.5 overflow-hidden rounded-card border border-line bg-bg2" style={{ viewTransitionName: transitionName }}>
      {block.file && <figcaption className="px-4 pt-2.5 font-mono text-xs text-mute">{block.file}</figcaption>}
      <pre
        ref={pre}
        tabIndex={scrolls ? 0 : undefined}
        aria-label={scrolls ? `${block.file ?? "Code"}, scrolls sideways` : undefined}
        className={`overflow-x-auto px-[18px] py-4 font-mono ${
          size === "container" ? BY_CONTAINER[block.size] : `${PHONE[size]} ${DESKTOP[size]}`
        }`}
      >
        <code dangerouslySetInnerHTML={{ __html: block.html }} />
      </pre>
    </figure>
  );
}
