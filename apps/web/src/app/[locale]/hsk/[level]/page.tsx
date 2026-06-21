import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import LevelCatalog from "@/components/practice/LevelCatalog";
import JsonLd from "@/components/JsonLd";
import { buildMetadata, courseJsonLd, hskSeoText, localizedUrl } from "@/lib/seo";

function levelCode(level: string): string {
  return level === "advanced" ? "HSK7-9" : `HSK${level}`;
}

function levelLabel(level: string): string {
  return level === "advanced" ? "HSK 7–9" : `HSK ${level}`;
}

export function generateMetadata({
  params: { locale, level }
}: {
  params: { locale: string; level: string };
}): Metadata {
  const { title, description } = hskSeoText(locale, levelLabel(level));
  return buildMetadata({ locale, path: `/hsk/${level}`, title, description });
}

export default function HskLevelPage({
  params: { locale, level }
}: {
  params: { locale: string; level: string };
}) {
  setRequestLocale(locale);
  const label = levelLabel(level);
  const seo = hskSeoText(locale, label);
  const course = courseJsonLd({
    locale,
    url: localizedUrl(locale, `/hsk/${level}`),
    name: seo.title,
    description: seo.description
  });

  return (
    <>
      <JsonLd data={course} />
      <InnerHeader />
      <main className="container-page py-12">
        <header className="mb-10">
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {label}
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
            {label} — Practice
          </h1>
        </header>
        <LevelCatalog code={levelCode(level)} />
      </main>
      <Footer />
    </>
  );
}
