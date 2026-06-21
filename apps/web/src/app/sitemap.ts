import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { SITE_URL, languageAlternates, localizedUrl } from "@/lib/seo";

/** Public, indexable paths (relative to the locale prefix). */
const STATIC_PATHS = [
  "",
  "/learn",
  "/tutor",
  "/leaderboard",
  "/upgrade",
  "/about",
  "/corporate"
];

const HSK_LEVELS = ["1", "2", "3", "4", "5", "6", "advanced"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [...STATIC_PATHS, ...HSK_LEVELS.map((l) => `/hsk/${l}`)];
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    for (const locale of locales) {
      entries.push({
        url: localizedUrl(locale, path),
        lastModified: now,
        changeFrequency: path === "" ? "daily" : "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: { languages: languageAlternates(path) }
      });
    }
  }
  return entries;
}

export const baseUrl = SITE_URL;
