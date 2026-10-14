// Any address that isn't a page. Server markup only, on purpose: the JS budget test measures the
// framework baseline on this page (e2e/budget.e2e.ts), so nothing of ours may load here.

import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { Logo } from "@/components/Logo";
import { primaryButton } from "@/components/buttons";
import { copyTop, headline, lead, wordmark, wordmarkLogo, wordmarkName } from "@/components/site-type";

export const metadata: Metadata = { title: `Not found · ${brand.name}` };

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[1280px] px-[22px] desktop:px-12">
      <header className="flex pt-[22px] desktop:pt-7">
        <a href="/" className={wordmark}>
          <Logo className={wordmarkLogo} />
          <span className={wordmarkName}>{brand.name}</span>
        </a>
      </header>
      <main className={`${copyTop} pb-24`}>
        <h1 className={headline}>Nothing here.</h1>
        <p className={`mt-6 max-w-[40ch] ${lead}`}>This page doesn&apos;t exist, or it moved. The questions are all still where they were.</p>
        <a href="/" className={`${primaryButton} mt-8 w-full desktop:w-auto`}>
          Go home
        </a>
      </main>
    </div>
  );
}
