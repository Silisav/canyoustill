// Share images (AGENTS.md "Share images"), rendered at build time with
// next/og. A question's card shows its code, highlighted, sized to fit; one without code shows
// its options. Never the answer. Dark palette: the code reads best there and it's the logo's home.

import { readFileSync } from "node:fs";
import type { ReactNode } from "react";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { LOGO_VIEWBOX, logoShapes } from "@/components/Logo";
import { brand } from "@/config/brand";
import { toPlain } from "@/lib/deck/build";
import type { Question } from "@/lib/deck/types";
import { palette } from "../../tailwind.config";

export const SHARE_SIZE = { width: 1200, height: 630 };

const C = palette.dark;
const SYNTAX: Record<string, { color: string; italic?: boolean }> = {
  "s-kw": { color: C["syn-kw"] },
  "s-str": { color: C["syn-str"] },
  "s-num": { color: C["syn-num"] },
  "s-fn": { color: C["syn-fn"] },
  "s-cm": { color: C["syn-cm"], italic: true },
};

// next/og (satori) reads TTF, not WOFF2: static copies used only here, at build time.
const fontFile = (file: string) => readFileSync(join(process.cwd(), "src", "fonts", "og", file));
const fonts = () => [
  { name: "Gabarito", data: fontFile("Gabarito-800.ttf"), weight: 800 as const, style: "normal" as const },
  { name: "Plex Mono", data: fontFile("IBMPlexMono-400.ttf"), weight: 400 as const, style: "normal" as const },
  { name: "Plex Mono", data: fontFile("IBMPlexMono-500.ttf"), weight: 500 as const, style: "normal" as const },
];

interface Token {
  text: string;
  cls: string | null;
}

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");

/** Our highlighted HTML (flat <span class="s-…"> runs) back into lines of tokens. */
function codeLines(q: Question): Token[][] {
  const lines: Token[][] = [];
  for (const block of q.code) {
    if (block.file) lines.push([{ text: `// ${block.file}`, cls: "s-cm" }]);
    let line: Token[] = [];
    for (const m of block.html.matchAll(/<span class="(s-[a-z]+)">([^<]*)<\/span>|([^<]+)/g)) {
      const cls = m[1] ?? null;
      const parts = decode(m[2] ?? m[3]).split("\n");
      parts.forEach((text, i) => {
        if (i > 0) {
          lines.push(line);
          line = [];
        }
        if (text) line.push({ text, cls });
      });
    }
    lines.push(line);
  }
  return lines;
}

function Logo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={LOGO_VIEWBOX}>
      {logoShapes()}
    </svg>
  );
}

function Frame({ children, corner }: { children: ReactNode; corner: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        color: C.fg,
        padding: "52px 64px 48px",
        fontFamily: "Gabarito",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Logo size={48} />
          <span>{brand.name}</span>
        </div>
        <span style={{ color: C.mute }}>{corner}</span>
      </div>
      {children}
    </div>
  );
}

// Space for the code panel's text once header, title and padding are taken (px).
const CODE_W = 1200 - 2 * 64 - 2 * 36 - 4;
const LINE = 1.45;
const ADVANCE = 0.6; // Plex Mono advance width, in em

export function questionShareImage(q: Question, total: number) {
  const title = toPlain(q.titleHtml);
  const titleSize = title.length > 70 ? 40 : title.length > 40 ? 46 : 54;
  const titleLines = Math.ceil((title.length * titleSize * 0.52) / (1200 - 128));
  const corner = q.number !== null ? `Question ${q.number} of ${total}` : "Community question";

  if (!q.code.length) {
    return new ImageResponse(
      (
        <Frame corner={corner}>
          <div style={{ display: "flex", marginTop: 44, fontSize: titleSize + 8, lineHeight: 1.08, letterSpacing: "-0.012em" }}>
            {title}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 36 }}>
            {q.options.map((o) => (
              <div key={o.key} style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 30 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    border: `2px solid ${C.edge}`,
                    background: C.bg2,
                  }}
                >
                  {o.key}
                </span>
                <span style={{ color: C.fg }}>{toPlain(o.html)}</span>
              </div>
            ))}
          </div>
        </Frame>
      ),
      { ...SHARE_SIZE, fonts: fonts() },
    );
  }

  const lines = codeLines(q);
  const longest = Math.max(...lines.map((l) => l.reduce((n, t) => n + t.text.length, 0)));
  const codeH = 630 - 52 - 48 - 40 - 40 - titleLines * titleSize * 1.1 - 28 - 2 * 28 - 4;
  // Readable in a feed preview first: below 20px, long lines clip at the panel's edge (like a block
  // that scrolls) and tall code shows its opening lines, then "…".
  let size = Math.min(28, Math.floor(CODE_W / (longest * ADVANCE)), Math.floor(codeH / (lines.length * LINE)));
  size = Math.max(size, 20);
  const fits = Math.floor(codeH / (size * LINE));
  const shown = lines.length > fits ? [...lines.slice(0, fits - 1), [{ text: "…", cls: "s-cm" }]] : lines;

  return new ImageResponse(
    (
      <Frame corner={corner}>
        <div style={{ display: "flex", marginTop: 40, fontSize: titleSize, lineHeight: 1.1, letterSpacing: "-0.012em" }}>
          {title}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            padding: "28px 36px",
            borderRadius: 24,
            border: `2px solid ${C.line}`,
            background: C.bg2,
            fontFamily: "Plex Mono",
            fontSize: size,
            lineHeight: LINE,
            overflow: "hidden",
          }}
        >
          {shown.map((line, i) => (
            <div key={i} style={{ display: "flex", whiteSpace: "pre", minHeight: size * LINE }}>
              {line.map((t, j) => (
                <span
                  key={j}
                  style={{
                    color: t.cls ? SYNTAX[t.cls].color : C.fg,
                    fontStyle: t.cls && SYNTAX[t.cls].italic ? "italic" : "normal",
                  }}
                >
                  {t.text}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Frame>
    ),
    { ...SHARE_SIZE, fonts: fonts() },
  );
}

/** The site's own card: home, About and anything without a card of its own. */
export function siteShareImage(total: number) {
  return new ImageResponse(
    (
      <Frame corner={`${total} JavaScript questions`}>
        <div
          style={{ display: "flex", marginTop: "auto", maxWidth: 820, fontSize: 116, lineHeight: 0.95, letterSpacing: "-0.012em" }}
        >
          Can you still read code?
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: 32, lineHeight: 1.35, color: C.mute }}>
          <span style={{ color: C.fg }}>Questions that look easy and aren&apos;t.</span>
          <span>{brand.pitch}</span>
        </div>
      </Frame>
    ),
    { ...SHARE_SIZE, fonts: fonts() },
  );
}
