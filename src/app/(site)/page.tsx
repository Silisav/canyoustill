// Home (AGENTS.md "Home"): the front door. Headline, lead, one CTA, the sample card, a short
// stance and the credits. Desktop is asymmetric: the copy owns most of the width and the sample
// sits lower, top-aligned so nothing it does can move the headline.

import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { buildDeck } from "@/lib/deck/build";
import { body, copyTop, headline, lead, sectionTitle, siteColumns, textLink } from "@/components/site-type";
import { HomeCta } from "@/components/home/HomeCta";
import { HomeCard } from "@/components/home/HomeCard";
import { ExternalLink } from "@/components/ExternalLink";

const DECK = "javascript";

export async function generateMetadata(): Promise<Metadata> {
  const total = (await buildDeck(DECK)).questions.length;
  return {
    // The headline is the name's own question, so it's the whole title.
    title: "Can you still read code?",
    // The lead, word for word.
    description: `${total} JavaScript questions that look easy and aren't. ${brand.pitch}`,
    alternates: { canonical: "/" },
  };
}

export default async function Home() {
  const deck = await buildDeck(DECK);
  // The first question in the deck: following it into the game skips nothing (AGENTS.md "The home card").
  const sample = deck.questions[0];
  const total = deck.questions.length;

  return (
    <>
      <main>
        {/* Phone: copy, card, stance. Desktop: copy and stance on the left; the card on the right,
            lower, spanning both rows; everything top-aligned so the card never moves the headline.
            The card's column grows with the viewport (400–560px); the copy keeps the rest. */}
        <div className={`${siteColumns} gap-12 desktop:gap-y-0`}>
          <section className={`${copyTop} desktop:col-start-1`}>
            <h1 data-reveal className={headline}>
              Can you still read code?
            </h1>
            {/* brand.pitch, with its first words in bold. */}
            <p data-reveal className={`mt-6 max-w-[40ch] ${lead}`}>
              {total} JavaScript questions that look easy and aren&apos;t.{" "}
              <b className="font-bold text-fg">Use your brain</b>, choose an answer, learn why.
            </p>
            <HomeCta deckId={DECK} total={total} />
          </section>

          {/* Single column (phones, tablets): capped at the desktop card's widest, so it never sprawls. */}
          <div data-enter className="max-w-[560px] desktop:col-start-2 desktop:row-span-2 desktop:row-start-1 desktop:mt-[16vh] desktop:max-w-none">
            <HomeCard sample={sample} deckId={DECK} version={deck.version} />
          </div>

          <section className="mt-8 max-w-[58ch] desktop:col-start-1 desktop:mt-[12vh]" aria-labelledby="stance">
            <h2 id="stance" data-reveal className={sectionTitle}>
              Know what the code does.
            </h2>
            <div data-enter className={`mt-5 space-y-4 ${body}`}>
              <p>
                Agents write most of the code now, faster than anyone can review it. So we write less, read less, and
                slowly forget things we used to know.
              </p>
              <p>
                Put the agent aside for a few minutes. Each question is a few lines of JavaScript with one right
                answer and a short explanation: a small workout for your memory and your mental model of the
                language.
              </p>
            </div>
            {deck.upstreamUrl && (
              <p data-enter className="mt-6 text-[15px] leading-[1.6] text-mute">
                The questions and explanations are{" "}
                <ExternalLink href={deck.upstreamUrl} className={textLink}>
                  Lydia Hallie&apos;s javascript-questions
                </ExternalLink>
                , used under the MIT licence. Every card links to its original.
                {brand.repoUrl && (
                  <>
                    {" "}
                    This app is open source:{" "}
                    <ExternalLink href={`${brand.repoUrl}/blob/main/CONTRIBUTING.md`} className={textLink}>
                      add a question
                    </ExternalLink>
                    .
                  </>
                )}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
