// The frame for the pages around the game (home, About, single questions): one width, header and
// footer, so nothing in the chrome moves from page to page.

import type { ReactNode } from "react";
import { brand } from "@/config/brand";
import { NEW_TAB } from "@/lib/external-link";
import { iconButton, iconMotion } from "./buttons";
import { ExternalLink } from "./ExternalLink";
import { InstallLink } from "./InstallLink";
import { LogoLink } from "./LogoLink";
import { PageLink } from "./PageLink";
import { wordmark, wordmarkLogo } from "./site-type";
import { GitHubIcon } from "./icons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

export function SitePage({ author, children }: { author: { name: string; url: string } | null; children: ReactNode }) {
  return (
    // At least a screen tall, so on short pages the footer sits at the bottom of the window.
    <div className="mx-auto flex min-h-dvh max-w-[1280px] flex-col px-[22px] desktop:px-12">
      <SiteHeader className="pt-[22px] desktop:pt-7" />
      {children}
      <div aria-hidden="true" className="grow" />
      <SiteFooter author={author} className="mt-16 border-t border-line py-8 desktop:mt-20" />
    </div>
  );
}

function SiteHeader({ className = "" }: { className?: string }) {
  return (
    // data-site-header: it stays still through a page switch (globals.css).
    <header data-site-header className={`flex items-center justify-between gap-4 ${className}`}>
      <LogoLink className={wordmark}>
        <Logo className={wordmarkLogo} />
        {brand.name}
      </LogoLink>
      <div className="flex gap-2">
        <RepoLink />
        <ThemeToggle />
      </div>
    </header>
  );
}

/**
 * GitHub beside the theme toggle (AGENTS.md "Brand and name"). A real link once brand.repoUrl is set; until then
 * a placeholder in development only, so no dead button ships.
 */
function RepoLink() {
  if (brand.repoUrl) {
    return (
      <a href={brand.repoUrl} target="_blank" rel="noopener" className={iconButton} aria-label={`Source on GitHub${NEW_TAB}`}>
        <GitHubIcon className={`${iconMotion} group-hover:-rotate-12`} />
      </a>
    );
  }
  if (process.env.NODE_ENV !== "development") return null;
  return (
    <span className={`${iconButton} opacity-60`} title="Placeholder: shows once brand.repoUrl is set" aria-hidden="true">
      <GitHubIcon />
    </span>
  );
}

/**
 * The site's own links on the left, the people behind it on the right (AGENTS.md "Home"); on
 * phones the credits drop below. The repo links appear once brand.repoUrl is set.
 */
function SiteFooter({ author, className = "" }: { author: { name: string; url: string } | null; className?: string }) {
  const link = "underline-offset-2 hover:text-fg hover:underline";
  const person = "text-fg underline underline-offset-2";
  return (
    <footer className={`flex flex-wrap items-start justify-between gap-x-10 gap-y-5 text-sm font-medium text-mute ${className}`}>
      <nav aria-label="Site" className="flex flex-wrap gap-x-6 gap-y-2">
        <PageLink href="/about" className={link}>
          About and privacy
        </PageLink>
        <InstallLink className={link} />
        {brand.repoUrl && (
          <>
            <ExternalLink href={brand.repoUrl} className={link}>
              GitHub
            </ExternalLink>
            <ExternalLink href={`${brand.repoUrl}/blob/main/CONTRIBUTING.md`} className={link}>
              Add a question
            </ExternalLink>
          </>
        )}
      </nav>
      <p className="flex flex-col gap-y-2 desktop:flex-row desktop:gap-x-2">
        {author && (
          <>
            <span>
              Questions by{" "}
              <ExternalLink href={author.url} className={person}>
                {author.name}
              </ExternalLink>
            </span>
            <span aria-hidden="true" className="hidden desktop:inline">
              ·
            </span>
          </>
        )}
        <span>
          Website by{" "}
          <ExternalLink href={brand.maker.url} className={person}>
            {brand.maker.name}
          </ExternalLink>
        </span>
      </p>
    </footer>
  );
}
