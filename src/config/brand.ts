// The product name, pitch and links live here and nowhere else (AGENTS.md "Brand and name").

export const brand = {
  name: "Can you still?",
  /**
   * What you do here, after "N JavaScript questions that look easy and aren't." (share card,
   * descriptions, manifest). Home's lead spells it out with "Use your brain" in bold: keep them alike.
   */
  pitch: "Use your brain, choose an answer, learn why.",
  /** Canonical site URL (share images, canonical links, sitemap). */
  url: "https://canyoustill.com",
  /** The GitHub repo, once it exists. Repo links (GitHub, "Add a question") render only when set. */
  repoUrl: "https://github.com/Silisav/canyoustill",
  /** Who made the site: credited in the footer. */
  maker: { name: "Vasilis Tsirimokos", url: "https://www.vasilis-tsirimokos.com" },
};

/** Absolute base for canonical links and share images. */
export function siteUrl(): string {
  if (brand.url) return brand.url;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
