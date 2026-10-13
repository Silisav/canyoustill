// /robots.txt: everything may be crawled; the sitemap lists the pages.

import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl()}/sitemap.xml` };
}
