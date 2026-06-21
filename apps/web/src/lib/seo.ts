import type { Metadata } from "next";
import { locales } from "@/i18n/routing";

/**
 * Canonical site origin. Override per-environment with NEXT_PUBLIC_SITE_URL
 * (e.g. https://hanbridge.app in production, http://localhost:3000 in dev).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hanbridge.app"
).replace(/\/$/, "");

export const SITE_NAME = "HanBridge";

/** Open Graph locale codes for our app locales. */
const OG_LOCALE: Record<string, string> = {
  en: "en_US",
  zh: "zh_CN",
  vi: "vi_VN"
};

/** Build an absolute, locale-prefixed URL: localizedUrl("en", "/learn"). */
export function localizedUrl(locale: string, path = ""): string {
  const clean = path && !path.startsWith("/") ? `/${path}` : path;
  return `${SITE_URL}/${locale}${clean}`;
}

/** hreflang alternates map for a given path (without locale prefix). */
export function languageAlternates(path = ""): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = localizedUrl(l, path);
  languages["x-default"] = localizedUrl("en", path);
  return languages;
}

export interface PageSeoOptions {
  locale: string;
  /** Path after the locale prefix, e.g. "" for home or "/learn". */
  path?: string;
  title: string;
  description: string;
  /** Set true for private pages that must not be indexed. */
  noindex?: boolean;
}

/**
 * Produce a fully-formed, locale-aware Metadata object: canonical URL,
 * hreflang alternates, Open Graph and Twitter cards. The OG/Twitter image is
 * supplied automatically by the file-based `opengraph-image` convention.
 */
export function buildMetadata({
  locale,
  path = "",
  title,
  description,
  noindex
}: PageSeoOptions): Metadata {
  const canonical = localizedUrl(locale, path);
  return {
    title,
    description,
    alternates: { canonical, languages: languageAlternates(path) },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      locale: OG_LOCALE[locale] ?? "en_US",
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l] ?? "en_US")
    },
    twitter: { card: "summary_large_image", title, description }
  };
}

/* ------------------------------- SEO copy --------------------------------- */
// Kept in code (not in messages/*.json) so titles/descriptions stay typed and
// co-located with the SEO helpers. Falls back to English for unknown locales.

export type SeoPageKey =
  | "home"
  | "learn"
  | "tutor"
  | "leaderboard"
  | "upgrade"
  | "about"
  | "corporate";

interface SeoEntry {
  title: string;
  description: string;
}

type SeoBundle = Record<SeoPageKey, SeoEntry> & {
  /** "{level}" is replaced with the HSK label, e.g. "HSK 3" / "HSK 7–9". */
  hsk: SeoEntry;
};

const SEO_COPY: Record<string, SeoBundle> = {
  en: {
    home: {
      title: "HanBridge — Smarter HSK & Chinese exam prep",
      description:
        "Master HSK 1–9 and HSKK speaking with AI-powered practice, full mock exams, vocabulary SRS and instant explanations."
    },
    learn: {
      title: "Learn Chinese — Courses & practice",
      description:
        "Structured HSK 1–9 courses with listening, reading, writing and HSKK speaking practice, plus an AI tutor."
    },
    tutor: {
      title: "AI Chinese Tutor",
      description:
        "Get instant, personalised explanations, a study plan and 24/7 chat help powered by AI."
    },
    leaderboard: {
      title: "Leaderboard",
      description:
        "See top HanBridge learners ranked by XP, daily streaks and mock-test results."
    },
    upgrade: {
      title: "HanBridge VIP",
      description:
        "Unlock every HSK level, full mock exams, the AI tutor and ad-free study with HanBridge VIP."
    },
    about: {
      title: "About HanBridge",
      description:
        "Why HanBridge is the smarter way to prepare for the HSK and HSKK exams."
    },
    corporate: {
      title: "HanBridge for teams",
      description:
        "Train your team for the HSK with HanBridge corporate plans and progress tracking."
    },
    hsk: {
      title: "{level} practice & mock tests",
      description:
        "Practise {level} listening, reading and writing with instant grading, explanations and timed mock exams on HanBridge."
    }
  },
  zh: {
    home: {
      title: "HanBridge — 更聪明的 HSK 中文考试备考平台",
      description:
        "借助 AI 智能练习、完整模拟考试、词汇 SRS 和即时讲解，攻克 HSK 1–9 与 HSKK 口语。"
    },
    learn: {
      title: "学中文 — 课程与练习",
      description:
        "系统化的 HSK 1–9 课程，涵盖听力、阅读、写作与 HSKK 口语练习，并配有 AI 私教。"
    },
    tutor: {
      title: "AI 中文私教",
      description: "由 AI 驱动，提供即时个性化讲解、学习计划和 24/7 聊天辅导。"
    },
    leaderboard: {
      title: "排行榜",
      description: "查看 HanBridge 学员按经验值、连续打卡和模拟考试成绩的排名。"
    },
    upgrade: {
      title: "HanBridge VIP",
      description:
        "升级 HanBridge VIP，解锁全部 HSK 等级、完整模拟考试、AI 私教与无广告学习。"
    },
    about: {
      title: "关于 HanBridge",
      description: "为什么 HanBridge 是备考 HSK 与 HSKK 更聪明的方式。"
    },
    corporate: {
      title: "HanBridge 企业版",
      description: "通过 HanBridge 企业方案与进度追踪，为团队备考 HSK。"
    },
    hsk: {
      title: "{level} 练习与模拟考试",
      description:
        "在 HanBridge 上练习 {level} 听力、阅读和写作，享受即时评分、讲解与限时模拟考试。"
    }
  },
  vi: {
    home: {
      title: "HanBridge — Luyện thi HSK & tiếng Trung thông minh hơn",
      description:
        "Chinh phục HSK 1–9 và nói HSKK với luyện tập bằng AI, đề thi thử đầy đủ, ôn từ vựng SRS và giải thích tức thì."
    },
    learn: {
      title: "Học tiếng Trung — Khóa học & luyện tập",
      description:
        "Lộ trình HSK 1–9 bài bản với luyện nghe, đọc, viết và nói HSKK, kèm gia sư AI."
    },
    tutor: {
      title: "Gia sư AI tiếng Trung",
      description:
        "Nhận giải thích cá nhân hóa tức thì, lộ trình học và trò chuyện hỗ trợ 24/7 nhờ AI."
    },
    leaderboard: {
      title: "Bảng xếp hạng",
      description:
        "Xem top học viên HanBridge theo XP, chuỗi ngày học và kết quả thi thử."
    },
    upgrade: {
      title: "HanBridge VIP",
      description:
        "Mở khóa mọi cấp độ HSK, đề thi thử đầy đủ, gia sư AI và học không quảng cáo với HanBridge VIP."
    },
    about: {
      title: "Về HanBridge",
      description:
        "Vì sao HanBridge là cách thông minh hơn để luyện thi HSK và HSKK."
    },
    corporate: {
      title: "HanBridge cho doanh nghiệp",
      description:
        "Đào tạo đội ngũ thi HSK với gói doanh nghiệp HanBridge và theo dõi tiến độ."
    },
    hsk: {
      title: "Luyện {level} & thi thử",
      description:
        "Luyện nghe, đọc, viết {level} với chấm điểm tức thì, giải thích và đề thi thử tính giờ trên HanBridge."
    }
  }
};

/** Localized SEO copy for a static page; falls back to English. */
export function seoText(locale: string, key: SeoPageKey): SeoEntry {
  return (SEO_COPY[locale] ?? SEO_COPY.en)[key];
}

/** Localized SEO copy for an HSK level page, with {level} interpolated. */
export function hskSeoText(locale: string, levelLabel: string): SeoEntry {
  const entry = (SEO_COPY[locale] ?? SEO_COPY.en).hsk;
  return {
    title: entry.title.replace("{level}", levelLabel),
    description: entry.description.replace("{level}", levelLabel)
  };
}

/* ----------------------------- JSON-LD builders ---------------------------- */

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon`,
    description:
      "AI-assisted HSK and HSKK exam-prep platform for learning Chinese (levels 1–9)."
  };
}

export function websiteJsonLd(locale: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${localizedUrl(locale, "/learn")}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

export function courseJsonLd(opts: {
  locale: string;
  url: string;
  name: string;
  description: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale,
    provider: {
      "@type": "EducationalOrganization",
      name: SITE_NAME,
      sameAs: SITE_URL
    }
  };
}
