// App icons, rendered at build time from the logo (next/og). AGENTS.md "Components": the brain on the brand
// yellow for app icons; the favicon is the brain alone, its sticker rim keeping it visible on
// light and dark tab bars.

import { ImageResponse } from "next/og";
import { LOGO_VIEWBOX, logoShapes } from "@/components/Logo";
import { palette } from "../../tailwind.config";

/**
 * @param size  square edge in px
 * @param logo  logo width as a share of the edge (maskable icons keep it inside the safe zone)
 * @param plate draw the yellow background (app icons) or none (the favicon)
 */
export function iconImage(size: number, { logo = 0.74, plate = true }: { logo?: number; plate?: boolean } = {}) {
  const mark = Math.round(size * logo);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: plate ? palette.light.yellow : "transparent",
        }}
      >
        <svg width={mark} height={mark} viewBox={LOGO_VIEWBOX}>
          {logoShapes(undefined, { rim: !plate })}
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}

/** The web app manifest's icons, served from /icons/<file>. */
export const MANIFEST_ICONS = {
  "icon-192.png": { size: 192, logo: 0.74, purpose: "any" },
  "icon-512.png": { size: 512, logo: 0.74, purpose: "any" },
  // Android crops maskable icons to a circle of 80% of the edge; keep the logo well inside it.
  "maskable-512.png": { size: 512, logo: 0.56, purpose: "maskable" },
} as const;
