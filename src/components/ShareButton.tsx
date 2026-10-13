"use client";

// Share a question (AGENTS.md "Share"). With a mouse, people copy links, so it copies the
// question's link and says so (the copy icon turns into a check, "Link copied" appears beneath).
// On touch screens it opens the system share sheet. Each question's /q/ page unfurls with its own
// card, so the link is all that's shared. Which icon shows is decided in CSS, so the first paint
// already matches.

import { useEffect, useState } from "react";
import { iconButton, iconMotion } from "./buttons";
import { CheckIcon, CopyIcon, ShareIcon } from "./icons";

/** Copy where there's a fine pointer or no share sheet; share where there's a finger and a sheet. */
const copies = () => matchMedia("(pointer: fine)").matches || !navigator.share;

export function ShareButton({ path, title }: { path: string; title?: string }) {
  const [copyMode, setCopyMode] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopyMode(copies()), []);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const act = async () => {
    const url = new URL(path, location.origin).href;
    const data = { title: title ?? document.title, url };
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
      setCopied(true);
    } catch {
      prompt("Copy this link:", url); // no clipboard access: let them copy it by hand
    }
  };

  const motion = `${iconMotion} group-hover:-translate-y-0.5`;
  return (
    <span className="relative inline-grid">
      <button
        type="button"
        className={iconButton}
        aria-label={copyMode ? "Copy link to this question" : "Share this question"}
        onClick={act}
      >
        {copied ? (
          <CheckIcon className="text-ok" />
        ) : (
          <>
            <CopyIcon className={`hidden pointer-fine:block ${motion}`} />
            <ShareIcon className={`pointer-fine:hidden ${motion}`} />
          </>
        )}
      </button>
      {/* The note keeps its words and only fades, in quickly and out a little slower, so it never
          empties into a blank box on the way out. Screen readers hear the status line instead. */}
      <span
        aria-hidden="true"
        // A note, not a control: a 1px structural line (like inline code), the panel fill, no ledge (AGENTS.md "Colour").
        className={`pointer-events-none absolute top-full right-0 mt-2 rounded-[10px] border-[1px] border-line bg-panel px-2.5 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-opacity ${
          copied ? "opacity-100 duration-100" : "opacity-0 duration-300"
        }`}
      >
        Link copied
      </span>
      <span role="status" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </span>
  );
}
