// The logo (AGENTS.md "Components"): a cartoon brain, side on. Lobes are circles: dark circles a little larger
// draw the outline, shade circles under fill circles nudged up-left leave a shaded crescent on
// each lobe, then highlights and folds on top. An optional cream rim outside the outline is the
// "sticker" edge that keeps it readable on dark backgrounds.
// The same shapes render on the page and, at build time, into the app icons and share images,
// so this takes plain colours.

import type { ReactElement } from "react";
import { palette } from "../../tailwind.config";

export const LOGO_COLORS = {
  fill: palette.light["logo-pink"],
  shade: palette.light["logo-shade"],
  hi: palette.light["logo-hi"],
  ink: palette.light["logo-ink"],
  rim: palette.light["logo-rim"],
};

type Colors = typeof LOGO_COLORS;
type Circle = [x: number, y: number, r: number];

const VIEWBOX = "-4 -4 108 108";
const LINE = 5; // outline width
const RIM = 3; // sticker rim beyond the outline

const BODY: Circle[] = [
  [30, 40, 18],
  [50, 30, 19],
  [70, 38, 17],
  [80, 54, 13],
  [22, 58, 15],
  [42, 62, 17],
  [63, 62, 15],
];
const CEREBELLUM: Circle[] = [[74, 70, 9]];
const STEM = "M62 70 C66 80 66 86 63 92";
const HIGHLIGHTS: [x: number, y: number, rx: number, ry: number, angle: number][] = [
  [26, 30, 6, 3, -30],
  [46, 19, 5, 2.4, -15],
  [16, 52, 2.6, 4, 20],
];
const FOLDS = [
  "M33 50 C38 44 46 44 50 49",
  "M56 26 C60 30 61 35 59 40",
  "M70 46 C74 49 76 54 74 59",
  "M26 66 C31 70 37 70 41 67",
  "M48 70 C52 64 58 63 62 66",
  "M40 34 C36 30 31 30 28 32",
];

function lobes(key: string, circles: Circle[], c: Colors): ReactElement[] {
  return [
    ...circles.map(([x, y, r], i) => <circle key={`${key}o${i}`} cx={x} cy={y} r={r + LINE / 2} fill={c.ink} />),
    ...circles.map(([x, y, r], i) => <circle key={`${key}s${i}`} cx={x} cy={y} r={r - LINE / 2 + 0.5} fill={c.shade} />),
    ...circles.map(([x, y, r], i) => (
      <circle key={`${key}f${i}`} cx={x - 1.4} cy={y - 2.2} r={(r - LINE / 2) * 0.86} fill={c.fill} />
    )),
  ];
}

/** The logo's shapes, for an <svg viewBox={LOGO_VIEWBOX}>. */
export function logoShapes(c: Colors = LOGO_COLORS, { rim = true } = {}): ReactElement[] {
  const rimShapes = rim
    ? [
        ...[...BODY, ...CEREBELLUM].map(([x, y, r], i) => (
          <circle key={`rim${i}`} cx={x} cy={y} r={r + LINE / 2 + RIM} fill={c.rim} />
        )),
        <path key="rimstem" d={STEM} fill="none" stroke={c.rim} strokeWidth={13 + 2 * RIM} strokeLinecap="round" />,
      ]
    : [];
  return [
    ...rimShapes,
    <path key="stem" d={STEM} fill="none" stroke={c.ink} strokeWidth={13} strokeLinecap="round" />,
    <path key="stemfill" d={STEM} fill="none" stroke={c.shade} strokeWidth={5} strokeLinecap="round" />,
    ...lobes("c", CEREBELLUM, c),
    ...lobes("b", BODY, c),
    ...HIGHLIGHTS.map(([x, y, rx, ry, a], i) => (
      <ellipse key={`h${i}`} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${a} ${x} ${y})`} fill={c.hi} />
    )),
    ...FOLDS.map((d, i) => (
      <path key={`f${i}`} d={d} fill="none" stroke={c.ink} strokeWidth={3.6} strokeLinecap="round" />
    )),
  ];
}

export const LOGO_VIEWBOX = VIEWBOX;

export function Logo({ size = 32, title, className }: { size?: number; title?: string; className?: string }) {
  return (
    <svg
      viewBox={VIEWBOX}
      width={size}
      height={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {logoShapes()}
    </svg>
  );
}

/** The app icon (AGENTS.md "Logo"): the brain on the brand yellow, as the home screen shows it. */
export function AppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="22" fill={palette.light.yellow} />
      <svg x="13" y="13" width="74" height="74" viewBox={VIEWBOX}>
        {logoShapes(undefined, { rim: false })}
      </svg>
    </svg>
  );
}
