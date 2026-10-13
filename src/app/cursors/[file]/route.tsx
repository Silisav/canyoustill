// /cursors/<file>: the hand cursor (src/lib/cursor-image.tsx), rendered once at build time.

import { CURSORS, cursorImage } from "@/lib/cursor-image";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(CURSORS).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  return cursorImage(CURSORS[(await params).file as keyof typeof CURSORS]);
}
