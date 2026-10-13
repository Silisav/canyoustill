import type { Metadata } from "next";
import { Game } from "@/components/game/Game";

// Kept out of search (AGENTS.md "Search"): it shows whichever question you're on, so it has no
// content of its own. Each question's /q/ page is the one to find.
export const metadata: Metadata = { robots: { index: false } };

// The game (AGENTS.md "Routes"): a static shell; the deck bundle and the player's progress are
// loaded on the client, and cards switch without navigation.
export default function PlayPage() {
  return <Game deckId="javascript" />;
}
