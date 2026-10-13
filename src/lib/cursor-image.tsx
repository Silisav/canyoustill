// The hand cursor over things you can click (AGENTS.md "Cursor"): an original cartoon glove in
// the logo's style (ink outline, cream sticker rim, a brand-yellow cuff), pointing up. Rendered at
// build time to PNGs at 1× and 2×, served from /cursors/<file>.

import type { ReactElement } from "react";
import { ImageResponse } from "next/og";
import { palette } from "../../tailwind.config";

const INK = palette.light["logo-ink"];
const RIM = palette.light["logo-rim"];
const FILL = "#FFFFFF";
const CUFF = palette.light.yellow;

type Shape = ["rect", { x: number; y: number; width: number; height: number; rx: number }] | ["circle", { cx: number; cy: number; r: number }] | ["ellipse", { cx: number; cy: number; rx: number; ry: number; transform: string }];

const HAND: Shape[] = [
  ["rect", { x: 11, y: 2, width: 5.4, height: 15, rx: 2.7 }], // the pointing finger
  ["rect", { x: 10, y: 11.5, width: 14.5, height: 12.5, rx: 4.5 }], // the fist
  ["circle", { cx: 19.3, cy: 12.6, r: 2.6 }], // folded fingers
  ["circle", { cx: 22.4, cy: 14.2, r: 2.4 }],
  ["ellipse", { cx: 9.4, cy: 17.2, rx: 2.8, ry: 4, transform: "rotate(-28 9.4 17.2)" }], // thumb
];
const CUFF_SHAPE: Shape = ["rect", { x: 10.2, y: 23.2, width: 14.2, height: 4.8, rx: 2.4 }];

const draw = (shapes: Shape[], paint: Record<string, string | number>, key: string): ReactElement[] =>
  shapes.map(([tag, attrs], i) => {
    const Tag = tag;
    return <Tag key={`${key}${i}`} {...attrs} {...paint} />;
  });

/** Where the click lands, in px of the 32px cursor: the fingertip. */
export const HOTSPOT = [14, 2] as const;

export const CURSORS = { "hand.png": 32, "hand@2x.png": 64 } as const;

export function cursorImage(size: number) {
  const outline = { fill: INK, stroke: INK, strokeWidth: 3, strokeLinejoin: "round" };
  return new ImageResponse(
    (
      <svg width={size} height={size} viewBox="-1 -1.5 34 34">
        {draw([...HAND, CUFF_SHAPE], { fill: RIM, stroke: RIM, strokeWidth: 5.4, strokeLinejoin: "round" }, "rim")}
        {draw(HAND, outline, "o")}
        {draw(HAND, { fill: FILL }, "f")}
        {draw([CUFF_SHAPE], outline, "co")}
        {draw([CUFF_SHAPE], { fill: CUFF }, "cf")}
        {/* the gaps between the folded fingers */}
        <path d="M16.75 11.6v4M21.15 12.7v3.4" stroke={INK} strokeWidth={1.3} strokeLinecap="round" fill="none" />
      </svg>
    ),
    { width: size, height: size },
  );
}
