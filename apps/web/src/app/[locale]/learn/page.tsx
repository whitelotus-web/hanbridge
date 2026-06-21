import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { buildMetadata, seoText } from "@/lib/seo";
import { Link } from "@/i18n/routing";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "learn");
  return buildMetadata({ locale, path: "/learn", title, description });
}

export default async function LearnPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("levels");
  const nav = await getTranslations("nav");
  const levels = [1, 2, 3, 4, 5, 6];

  const quickLinks = [
    { href: "/tutor", label: nav("tutor") },
    { href: "/leaderboard", label: nav("leaderboard") },
    { href: "/dashboard", label: nav("dashboard") },
    { href: "/upgrade", label: nav("upgrade") }
  ];

  return (
    <>
      <InnerHeader />
      <main className="container-page py-12">
        <header className="max-w-2xl">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-slate-500">{t("subtitle")}</p>
        </header>

        <section className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {levels.map((n) => (
            <Link
              key={n}
              href={`/hsk/${n}`}
              className="group rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-lg font-extrabold text-white">
                {n}
              </div>
              <p className="mt-4 font-semibold text-slate-800">
                {t("level", { n })}
              </p>
              <span className="mt-1 inline-block text-sm font-medium text-brand-600 opacity-0 transition group-hover:opacity-100">
                {t("start")} →
              </span>
            </Link>
          ))}

          <Link
            href="/hsk/advanced"
            className="group col-span-2 rounded-2xl border border-accent-500/30 bg-accent-500/5 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:col-span-1 lg:col-span-2"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500 text-lg font-extrabold text-white">
              7-9
            </div>
            <p className="mt-4 font-semibold text-slate-800">{t("advanced")}</p>
            <span className="mt-1 inline-block text-sm font-medium text-accent-600 opacity-0 transition group-hover:opacity-100">
              {t("start")} →
            </span>
          </Link>
        </section>

        <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl border border-slate-100 bg-white p-5 text-center font-semibold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:text-brand-600 hover:shadow-lg"
            >
              {link.label}
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
