"use client";

// The logo in the header (AGENTS.md "Logo"): a link home that squashes onto its stem when you
// press it and springs back when you let go, on every page that shows it. In the game, it flies the
// card back to its slot on the home page (the game registers how, game-handoff.ts). The header stays
// mounted across page switches, so the spring finishes while the next page arrives. Still under
// reduced motion.

import { useEffect, useRef, type ReactNode } from "react";
import { spring } from "motion";
import { animate } from "motion/mini";
import { getFlyHome } from "@/lib/game-handoff";
import { prefersReducedMotion } from "./game/reveal";
import { PageLink } from "./PageLink";
import { isPlainClick } from "./plain-click";

const SQUASH = "scale(1.12, 0.86)";

export function LogoLink({ className, children }: { className: string; children: ReactNode }) {
  const link = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const logo = link.current?.querySelector("svg");
    if (!link.current || !logo || prefersReducedMotion()) return;
    const a = link.current;
    logo.style.transformOrigin = "50% 85%";
    let held = false;
    let run: { stop(): void } | undefined;
    const to = (transform: string, options: { stiffness: number; damping: number }) => {
      const from = getComputedStyle(logo).transform;
      run?.stop();
      logo.style.transform = transform;
      run = animate(logo, { transform: [from, transform || "none"] }, { type: spring, ...options });
    };
    const press = () => {
      held = true;
      to(SQUASH, { stiffness: 700, damping: 30 });
    };
    const release = () => {
      if (!held) return;
      held = false;
      to("", { stiffness: 520, damping: 11 }); // a little wobble on the way back
    };
    a.addEventListener("pointerdown", press);
    a.addEventListener("pointerleave", release);
    addEventListener("pointerup", release);
    addEventListener("pointercancel", release);
    return () => {
      run?.stop();
      a.removeEventListener("pointerdown", press);
      a.removeEventListener("pointerleave", release);
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", release);
      logo.style.transform = "";
    };
  }, []);

  return (
    <PageLink
      ref={link}
      href="/"
      className={className}
      onClick={(e) => {
        const fly = getFlyHome();
        if (!fly || !isPlainClick(e)) return;
        e.preventDefault();
        fly();
      }}
    >
      {children}
    </PageLink>
  );
}
