// /manifest.webmanifest (AGENTS.md "Offline and install"): installable, opens at the home page.

import type { MetadataRoute } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { brand } from "@/config/brand";
import { MANIFEST_ICONS } from "@/lib/icon-image";
import { palette } from "../../tailwind.config";

const questionCount = (): number =>
  (JSON.parse(readFileSync(join(process.cwd(), "content", "javascript", "deck.json"), "utf8")) as { order: string[] })
    .order.length;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    // Home's lead, with the count kept true.
    description: `${questionCount()} JavaScript questions that look easy and aren't. ${brand.pitch}`,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: palette.light.bg,
    theme_color: palette.light.bg,
    icons: Object.entries(MANIFEST_ICONS).map(([file, icon]) => ({
      src: `/icons/${file}`,
      sizes: `${icon.size}x${icon.size}`,
      type: "image/png",
      purpose: icon.purpose,
    })),
  };
}
