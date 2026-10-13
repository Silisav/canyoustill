// /decks/<deck>/images/<file>: explanation images, copied from content at build time.

import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { deckIds, deckImages, imagesDir } from "@/lib/deck/build";

export const dynamic = "force-static";
export const dynamicParams = false;

const TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export function generateStaticParams() {
  return deckIds().flatMap((deck) => deckImages(deck).map((file) => ({ deck, file })));
}

export async function GET(_request: Request, { params }: { params: Promise<{ deck: string; file: string }> }) {
  const { deck, file } = await params;
  const bytes = readFileSync(join(imagesDir(deck), file));
  return new Response(bytes, {
    headers: { "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream" },
  });
}
