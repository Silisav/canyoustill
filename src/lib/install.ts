// The install offer (AGENTS.md "Offline and install"): a card between questions that opens the browser's own install
// dialog, shown only from the second visit on, after ≥5 answers, at most once per visit; "Not now"
// or declining the dialog hides it for good. Only Chromium has an install API, so elsewhere
// nothing shows.

import { useEffect, useState } from "react";
import { INSTALL_DONE } from "./install-script";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPrompt?: InstallPromptEvent;
  }
}

const DONE = INSTALL_DONE;
const VISITS = "visits";
const SHOWN = "install-shown"; // session: this visit has had its offer

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: string) => {
  try {
    store.setItem(key, value);
  } catch {
    // storage blocked: the offer just behaves as if it were the first visit
  }
};

/** Counts this visit once per browser session; returns the visit number. */
function countVisit(): number {
  if (!read(sessionStorage, "visit-counted")) {
    write(sessionStorage, "visit-counted", "1");
    write(localStorage, VISITS, String(Number(read(localStorage, VISITS) ?? 0) + 1));
  }
  return Number(read(localStorage, VISITS) ?? 1);
}

/** The browser's install prompt, once it has offered one (caught by the <head> script). */
function usePrompt() {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    setPrompt(window.__installPrompt ?? null);
    const ready = () => setPrompt(window.__installPrompt ?? null);
    addEventListener("installprompt", ready);
    return () => removeEventListener("installprompt", ready);
  }, []);
  return [prompt, setPrompt] as const;
}

/** Open the browser's install dialog and remember the outcome. A prompt can only be used once. */
async function ask(prompt: InstallPromptEvent) {
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  write(localStorage, DONE, outcome === "accepted" ? "installed" : "declined");
  window.__installPrompt = undefined;
}

const standalone = () => matchMedia("(display-mode: standalone)").matches;

/** Whether the offer is due before the next question, and what its buttons do. */
export function useInstallOffer(answered: number) {
  const [prompt, setPrompt] = usePrompt();
  const [visit, setVisit] = useState(1);

  useEffect(() => setVisit(countVisit()), []);

  const due =
    !!prompt &&
    visit >= 2 &&
    answered >= 5 &&
    typeof window !== "undefined" &&
    !read(localStorage, DONE) &&
    !read(sessionStorage, SHOWN) &&
    !standalone();

  return {
    due,
    /** The card is on stage: no more offers this visit. */
    shown() {
      write(sessionStorage, SHOWN, "1");
    },
    async install() {
      if (!prompt) return;
      await ask(prompt);
      setPrompt(null);
    },
    /** "Not now": never offered again. */
    decline() {
      write(localStorage, DONE, "declined");
    },
  };
}

/**
 * The footer's "Install the app" (AGENTS.md "Offline and install"): there whenever the browser can install the app,
 * also after "Not now" (clicking it is the player's own choice); gone once it's installed, inside
 * the installed app, and wherever the browser has no install API (iPhones).
 */
export function useInstallLink() {
  const [prompt, setPrompt] = usePrompt();
  const installed = typeof window !== "undefined" && (read(localStorage, DONE) === "installed" || standalone());
  return {
    available: !!prompt && !installed,
    async install() {
      if (!prompt) return;
      await ask(prompt);
      setPrompt(null);
    },
  };
}
