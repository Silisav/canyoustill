// The site's share image (home, About, the game), rendered at build time.

import { buildDeck } from "@/lib/deck/build";
import { SHARE_SIZE, siteShareImage } from "@/lib/share-image";

export const size = SHARE_SIZE;
export const contentType = "image/png";
export const alt = "Can you still read code?";

export default async function Image() {
  const deck = await buildDeck("javascript");
  return siteShareImage(deck.questions.length);
}
