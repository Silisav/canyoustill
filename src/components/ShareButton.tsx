"use client";

// Share a page (AGENTS.md "Share"): in the header, the page you're on (in the game, the question
// on screen, since the address follows it); at the end of an answer, that question. With a mouse,
// people copy links, so it copies the link and says so; on touch screens it opens the system share
// sheet. Each /q/ page unfurls with its own card, so the link is all that's shared. The share icon and
// the word "Share" everywhere; only what happens behind them differs by device.

import { useEffect, useState } from "react";
import { iconButton, iconMotion } from "./buttons";
import { CheckIcon, ShareIcon } from "./icons";

/** Copy where there's a fine pointer or no share sheet; share where there's a finger and a sheet. */
const copies = () => matchMedia("(pointer: fine)").matches || !navigator.share;

export function ShareButton({ path, title, look = "icon" }: { path?: string; title?: string; look?: "icon" | "text" }) {
  const [copied, setCopied] = useState(false);
  // What the note and screen readers say after a copy. Kept after the note fades, so it fades with its words.
  const [said, setSaid] = useState("Link copied");
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const act = async () => {
    // No path: the address now, read at the press (in the game it has moved on since the page loaded).
    // In the game the address is the question's; anywhere else (home, About) it's the site.
    const where = path ?? (location.pathname.startsWith("/q/") ? location.pathname : "/");
    const url = new URL(where, location.origin).href;
    const data = title ? { title, url } : { url };
    if (!copies() && (navigator.canShare?.(data) ?? true)) {
      try {
        await navigator.share(data);
      } catch {
        // dismissed: nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      // Beside the credit the word is enough; in the header nothing near says which link it was.
      setSaid(look === "text" ? "Link copied" : where.startsWith("/q/") ? "Question link copied" : "Website link copied");
      setCopied(true);
    } catch {
      prompt("Copy this link:", url); // no clipboard access: let them copy it by hand
    }
  };

  const status = (
    <span role="status" className="sr-only">
      {copied ? said : ""}
    </span>
  );

  // A quiet word beside the credit at the end of an answer: muted like it, no border. "Share" on
  // every device (copying is how a mouse shares); "Link copied" says what happened. The padding
  // makes it a 36px-tall tap target without moving the line.
  if (look === "text") {
    return (
      <span>
        <button type="button" className="-my-2.5 py-2.5 underline-offset-2 hover:text-fg hover:underline" onClick={act}>
          {copied ? "Link copied" : "Share"}
        </button>
        {status}
      </span>
    );
  }

  const motion = `${iconMotion} group-hover:-translate-y-0.5`;
  return (
    <span className="relative inline-grid">
      <button
        type="button"
        className={iconButton}
        aria-label="Share this page"
        onClick={act}
      >
        {copied ? (
          <CheckIcon className="text-ok" />
        ) : (
          <ShareIcon className={motion} />
        )}
      </button>
      {/* The note keeps its words and only fades, in quickly and out a little slower, so it never
          empties into a blank box on the way out. Screen readers hear the status line instead. */}
      <span
        aria-hidden="true"
        // A note, not a control: a 1px structural line (like inline code), the panel fill, no ledge (AGENTS.md "Colour").
        // z-20: above the game's sticky bar (z-10), which starts right under the header on phones.
        className={`pointer-events-none absolute top-full right-0 z-20 mt-2 rounded-[10px] border-[1px] border-line bg-panel px-2.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-opacity ${
          copied ? "opacity-100 duration-100" : "opacity-0 duration-300"
        }`}
      >
        {said}
      </span>
      {status}
    </span>
  );
}
