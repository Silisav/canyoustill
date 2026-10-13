"use client";

// Page switches between the site's pages (AGENTS.md "Motion"): the header and the paper stay
// still and the old content fades out. Then the new page enters as one sequence in reading order:
// headings rise line by line, everything else fades up just after its turn (reveal-lines.ts).
// A view transition around Next's client-side switch, ending when the new page is on screen.
// Not on first load, not for the browser's Back button, instant under reduced motion.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect, type ComponentProps, type MouseEvent } from "react";
import { ready, whenReady } from "@/lib/game-handoff";
import { isPlainClick } from "./plain-click";
import { prefersReducedMotion } from "./game/reveal";
import { enterPage } from "./reveal-lines";

/** Switch pages inside the page transition. The game says when its card is in; other pages when they render. */
export function pageTransition(navigate: () => void, path: string) {
  if (prefersReducedMotion() || !document.startViewTransition) return navigate();
  const arrived = whenReady(path === "/play" ? "game" : "page");
  // The game has no headline to lead with: it fades in whole.
  const untag = tagPageSwitch(path === "/play" ? "fade" : "reveal");
  const t = document.startViewTransition(async () => {
    navigate();
    await Promise.race([arrived, new Promise((r) => setTimeout(r, 1500))]);
  });
  t.finished.finally(untag);
}

/**
 * Mark the view transition about to start as a page switch, for globals.css and PageArrived: how
 * the new page enters, and whether the header holds still. Also used by the card flying home
 * (morph.ts). Returns the unmarking, for when the transition has finished.
 */
export function tagPageSwitch(entrance: "reveal" | "fade") {
  const root = document.documentElement;
  // The header holds still only if it's on screen; scrolled away, it would glide in from above.
  const header = document.querySelector("[data-site-header]")?.getBoundingClientRect();
  const still = header && header.bottom > 0 ? "header-still " : "";
  root.dataset.pageTransition = still + entrance;
  return () => delete root.dataset.pageTransition;
}

/** A link to another of the site's pages, switching with the page transition. */
export function PageLink({ href, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const router = useRouter();
  const go = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || !isPlainClick(e)) return;
    const { pathname } = new URL(href, location.href);
    if (pathname === location.pathname) return; // a section of this page: the link scrolls to it
    e.preventDefault();
    pageTransition(() => router.push(href), pathname);
  };
  return <Link {...props} href={href} onClick={go} />;
}

/**
 * In the root layout: a page switch can end once the new page has rendered. Its entrance is set up
 * first, before the browser captures the new page, so nothing on it flashes in full.
 */
export function PageArrived() {
  const path = usePathname();
  useLayoutEffect(() => {
    if (document.documentElement.dataset.pageTransition?.split(" ").includes("reveal")) enterPage(document.querySelector("main") ?? document);
    ready("page");
  }, [path]);
  return null;
}
