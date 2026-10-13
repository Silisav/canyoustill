"use client";

import { useEffect } from "react";

/**
 * Where the hover fill starts (AGENTS.md "Hover fill"). On entering or leaving a `spread` button,
 * note the point the pointer crossed and the circle that covers the button from there, so the
 * fill grows from where you came in and drains toward where you left. Until this runs, CSS
 * grows it from the centre.
 */
export function HoverSpread() {
  useEffect(() => {
    const mark = (e: PointerEvent) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains("spread")) return;
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - el.clientLeft;
      const y = e.clientY - r.top - el.clientTop;
      const reach = Math.hypot(Math.max(x, el.clientWidth - x), Math.max(y, el.clientHeight - y));
      el.style.setProperty("--spread-x", `${x}px`);
      el.style.setProperty("--spread-y", `${y}px`);
      el.style.setProperty("--spread-d", `${2 * reach + 2}px`);
    };
    // Enter and leave don't bubble, but they do pass the document on the way down.
    const opts = { capture: true, passive: true };
    document.addEventListener("pointerenter", mark, opts);
    document.addEventListener("pointerleave", mark, opts);
    return () => {
      document.removeEventListener("pointerenter", mark, opts);
      document.removeEventListener("pointerleave", mark, opts);
    };
  }, []);
  return null;
}
