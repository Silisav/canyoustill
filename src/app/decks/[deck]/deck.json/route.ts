// /decks/<deck>/deck.json: the deck bundle, generated once at build time.

import { buildDeck, deckIds } from "@/lib/deck/build";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return deckIds().map((deck) => ({ deck }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ deck: string }> }) {
  const { deck } = await params;
  return Response.json(await buildDeck(deck));
}
