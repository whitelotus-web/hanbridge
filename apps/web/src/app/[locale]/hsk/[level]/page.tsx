import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import LevelCatalog from "@/components/practice/LevelCatalog";

function levelCode(level: string): string {
  return level === "advanced" ? "HSK7-9" : `HSK${level}`;
}

export default function HskLevelPage({
  params: { locale, level }
}: {
  params: { locale: string; level: string };
}) {
  setRequestLocale(locale);
  const label = level === "advanced" ? "HSK 7–9" : `HSK ${level}`;
  return (
    <>
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
