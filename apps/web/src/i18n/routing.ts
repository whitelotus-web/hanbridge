import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// Start with EN / 中文 / Tiếng Việt. Add a locale by adding its code here
// plus a matching messages/<locale>.json file.
export const locales = ["en", "zh", "vi"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt"
};

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always"
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
