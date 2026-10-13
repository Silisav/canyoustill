// /q/<slug> (AGENTS.md "Routes"): the game, opened on this question. Pre-rendered with the
// question in the page, so it's the canonical link for sharing and search; the explanation is in the
// page but stays folded until answered. While you play, the address follows the question.

import type { Metadata } from "next";
import { brand } from "@/config/brand";
import { buildDeck, toPlain } from "@/lib/deck/build";
import { topic } from "@/lib/deck/topic";
import { Game } from "@/components/game/Game";

const DECK = "javascript";

export const dynamicParams = false;

export async function generateStaticParams() {
  const deck = await buildDeck(DECK);
  return deck.questions.map((q) => ({ slug: q.id }));
}

async function load(slug: string) {
  const deck = await buildDeck(DECK);
  const question = deck.questions.find((q) => q.id === slug)!;
  return { deck, question, total: deck.questions.length };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { question: q, total } = await load(slug);
  // Led by what the question is about: most titles are "What's the output?" (AGENTS.md "Search").
  const about = topic(slug);
  const label = q.number !== null ? `JavaScript question ${q.number}` : "Community JavaScript question";
  const shareTitle = `${about.title} · ${label}`;
  const description = `${label}${q.number !== null ? ` of ${total}` : ""}: ${about.inSentence}. ${toPlain(q.titleHtml)} ${brand.pitch}`;
  return {
    title: `${shareTitle} · ${brand.name}`,
    description,
    alternates: { canonical: `/q/${slug}` },
    openGraph: { type: "article", siteName: brand.name, title: shareTitle, description, url: `/q/${slug}` },
    twitter: { card: "summary_large_image", title: shareTitle, description },
  };
}

export default async function QuestionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { question } = await load(slug);
  return <Game deckId={DECK} initial={{ question }} />;
}
