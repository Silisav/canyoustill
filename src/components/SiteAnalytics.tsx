"use client";

// Page views, counted anonymously by Vercel Web Analytics (AGENTS.md "Analytics and privacy"): no cookies, nothing that
// identifies anyone. A browser that asks not to be tracked (Do Not Track or Global Privacy
// Control) isn't counted at all. Starts counting once Analytics is enabled for the project in
// Vercel's dashboard.

import { Analytics } from "@vercel/analytics/next";

const asksNotToBeTracked = () =>
  navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;

export function SiteAnalytics() {
  return <Analytics beforeSend={(event) => (asksNotToBeTracked() ? null : event)} />;
}
