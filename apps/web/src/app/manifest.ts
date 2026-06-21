import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Smarter HSK prep`,
    short_name: SITE_NAME,
    description:
      "Learn Chinese and ace the HSK exam (levels 1–9) with AI-powered practice, mock tests and speaking drills.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f7cff",
    icons: [{ src: "/icon", sizes: "any", type: "image/png" }]
  };
}
