// /icons/<file>: the web app manifest's icons, rendered once at build time.

import { MANIFEST_ICONS, iconImage } from "@/lib/icon-image";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(MANIFEST_ICONS).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { size, logo } = MANIFEST_ICONS[(await params).file as keyof typeof MANIFEST_ICONS];
  return iconImage(size, { logo });
}
