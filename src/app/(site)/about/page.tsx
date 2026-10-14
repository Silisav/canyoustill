// About (AGENTS.md "About"): what this is, who made the questions, licence, privacy, and the
// repo links once the repo exists. Keep the privacy paragraph true: update it when analytics
// (AGENTS.md "Analytics and privacy") lands.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { buildDeck } from "@/lib/deck/build";
import { body, copyTop, headline, lead, sectionTitle, siteColumns, textLink } from "@/components/site-type";
import { phoneWide, primaryButton } from "@/components/buttons";
import { ExternalLink } from "@/components/ExternalLink";
import { PageLink } from "@/components/PageLink";

export const metadata: Metadata = {
  title: `About · ${brand.name}`,
  description: "What this is, where the questions come from, the licence and what's stored on your device.",
  alternates: { canonical: "/about" },
};

/** The upstream copyright line, from the notice the importer saved with the content. */
const upstreamNotice = () =>
  readFileSync(join(process.cwd(), "content", "javascript", "LICENSE"), "utf8")
    .split("\n")
    .find((l) => l.startsWith("Copyright"))
    ?.trim();

export default async function AboutPage() {
  const deck = await buildDeck("javascript");
  // Home's columns and type (src/components/site-type.ts): the text sits where home's copy does.
  const h2 = `mt-14 desktop:mt-16 ${sectionTitle}`;
  const p = `mt-5 ${body}`;
  return (
    <main className={siteColumns}>
      <div className={`${copyTop} max-w-[58ch] desktop:col-start-1`}>
        <h1 data-reveal className={headline}>
          About
        </h1>
        <p data-reveal className={`mt-6 max-w-[40ch] ${lead}`}>
          This is a small game about reading JavaScript. You get a few lines of code and decide what they do,
          without asking an agent. Then you find out why.
        </p>

        <h2 data-reveal className={h2}>Why</h2>
        <p data-enter className={p}>
          Coding agents write a lot of the code we ship now, and nobody has time to review all of it. Skills you
          don&apos;t use fade: the order things run in, how hoisting works, why 0.1 + 0.2 isn&apos;t 0.3. Reading
          code yourself is how you keep them.
        </p>

        <h2 data-reveal className={h2}>The questions</h2>
        <p data-enter className={p}>
          The {deck.questions.length} questions and their explanations are by{" "}
          {deck.author ? (
            <ExternalLink href={deck.author.url} className={textLink}>
              {deck.author.name}
            </ExternalLink>
          ) : (
            "Lydia Hallie"
          )}
          , from{" "}
          {deck.upstreamUrl ? (
            <ExternalLink href={deck.upstreamUrl} className={textLink}>
              javascript-questions
            </ExternalLink>
          ) : (
            "javascript-questions"
          )}
          , with fixes from its many contributors.
        </p>
        {brand.repoUrl && (
          <p data-enter className={`mt-4 ${body}`}>
            This app is open source. To add or fix a question, open a pull request on{" "}
            <ExternalLink href={brand.repoUrl} className={textLink}>
              GitHub
            </ExternalLink>
            ; the{" "}
            <ExternalLink href={`${brand.repoUrl}/blob/main/CONTRIBUTING.md`} className={textLink}>
              contributing guide
            </ExternalLink>{" "}
            shows the format.
          </p>
        )}

        <h2 id="licence" data-reveal className={h2}>
          Licence
        </h2>
        <p data-enter className={p}>
          The app&apos;s code is MIT licensed. The questions are MIT licensed too and keep their original notice
          {upstreamNotice() ? <>: {upstreamNotice()}</> : null}.
        </p>

        <h2 id="privacy" data-reveal className={h2}>
          Privacy
        </h2>
        <p data-enter className={p}>
          There are no accounts and no cookies. Your answers, your place in the deck and your theme are stored in
          this browser, on this device, and aren&apos;t sent anywhere. So the game works offline, your browser also
          keeps a copy of the app and the questions. Clearing this site&apos;s data removes all of it. To know
          how many people visit, page views are counted anonymously with Vercel Web Analytics: no cookies,
          nothing that identifies you, and nothing at all if your browser asks not to be tracked.
        </p>

        <div data-enter className="mt-12">
          <PageLink href="/play" className={`${primaryButton} ${phoneWide}`}>
            Play
          </PageLink>
        </div>
      </div>
    </main>
  );
}
