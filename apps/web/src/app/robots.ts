import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Disallow private / authenticated areas across every locale (the `/*`
 * wildcard covers the /en, /zh, /vi prefixes). Public marketing and catalog
 * pages stay fully crawlable.
 */
const DISALLOW = [
  "/*/dashboard",
  "/*/login",
  "/*/register",
  "/*/forgot-password",
  "/*/reset-password",
  "/*/admin",
  "/*/practice/",
  "/*/mock/"
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: DISALLOW }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
