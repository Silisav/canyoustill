// The share image for one question, rendered at build time.

import { buildDeck } from "@/lib/deck/build";
import { SHARE_SIZE, questionShareImage } from "@/lib/share-image";

export const size = SHARE_SIZE;
export const contentType = "image/png";
export const alt = "A JavaScript question: read the code and work out what it does";

// Build every card once, with the pages, rather than on request.
export const dynamicParams = false;
export async function generateStaticParams() {
  const deck = await buildDeck("javascript");
  return deck.questions.map((q) => ({ slug: q.id }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = await buildDeck("javascript");
  return questionShareImage(deck.questions.find((q) => q.id === slug)!, deck.questions.length);
}
