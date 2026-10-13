import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { brand, siteUrl } from "@/config/brand";
import { HoverSpread } from "@/components/HoverSpread";
import { ConsoleNote } from "@/components/ConsoleNote";
import { PageArrived } from "@/components/PageLink";
import { SiteAnalytics } from "@/components/SiteAnalytics";
import { ServiceWorker } from "@/components/ServiceWorker";
import { installScript } from "@/lib/install-script";
import { nextUpScript } from "@/lib/next-up";
import { themeScript } from "@/lib/theme";
import { palette } from "../../tailwind.config";
import "./globals.css";

// Self-hosted, Latin subset only: every non-Latin character in the content is an emoji.
const gabarito = localFont({
  src: "../fonts/Gabarito-latin-var.woff2",
  weight: "400 900",
  variable: "--font-gabarito",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "../fonts/IBMPlexMono-400-latin.woff2", weight: "400", style: "normal" },
    { path: "../fonts/IBMPlexMono-400italic-latin.woff2", weight: "400", style: "italic" },
    { path: "../fonts/IBMPlexMono-500-latin.woff2", weight: "500", style: "normal" },
    { path: "../fonts/IBMPlexMono-600-latin.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()), // absolute links for share images and canonicals
  title: brand.name,
  description: `JavaScript questions that look easy and aren't. ${brand.pitch}`,
  openGraph: { siteName: brand.name, type: "website" },
  twitter: { card: "summary_large_image" },
  appleWebApp: { capable: true, title: brand.name, statusBarStyle: "default" },
};

// Browser chrome follows the system palette; the theme toggle repaints it (src/lib/theme.ts).
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: palette.light.bg },
    { media: "(prefers-color-scheme: dark)", color: palette.dark.bg },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The inline script sets data-theme before paint, so React sees an attribute it didn't render.
    <html lang="en" className={`${gabarito.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript + installScript + nextUpScript }} />
      </head>
      <body>
        {children}
        <ServiceWorker />
        <HoverSpread />
        <PageArrived />
        <SiteAnalytics />
        <ConsoleNote />
      </body>
    </html>
  );
}
