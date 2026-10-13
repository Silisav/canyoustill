"use client";

import { useEffect, useRef } from "react";
import { ghostButton, phoneWide, primaryButton } from "../buttons";
import { AppIcon } from "../Logo";

/**
 * The install offer (AGENTS.md "Offline and install"): a card of its own between two questions, once
 * per visit, so it can't be missed but never interrupts a question. It says plainly what installing
 * gets you. Install opens the browser's dialog; either way the game carries on to the next question.
 */
export function InstallCard({ total, onInstall, onDecline }: { total: number; onInstall(): void; onDecline(): void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus({ preventScroll: true }), []); // screen readers start here

  return (
    <article className="pt-2 pb-1">
      {/* The app's own icon beside the title: this is what lands on your home screen. */}
      <div className="flex items-center gap-4">
        <AppIcon className="size-12 shrink-0" />
        <h1 ref={title} tabIndex={-1} className="text-[30px] leading-[1.1] font-extrabold tracking-headline outline-none">
          Install the app
        </h1>
      </div>
      <ul className="mt-4 max-w-[46ch] list-disc space-y-2 pl-5 text-[17px] leading-[1.5] font-medium text-mute">
        <li>Opens from your home screen or desktop, in its own window.</li>
        <li>Works offline: all {total} questions and explanations are saved on your device.</li>
        <li>Free. No app store, no account, less than 1&nbsp;MB.</li>
      </ul>
      <div className="mt-8 flex flex-wrap items-center gap-3 pr-1 pb-1">
        <button type="button" className={`${primaryButton} ${phoneWide}`} onClick={onInstall}>
          Install app
        </button>
        <button type="button" className={`${ghostButton} ${phoneWide} desktop:self-stretch`} onClick={onDecline}>
          Not now
        </button>
      </div>
    </article>
  );
}
