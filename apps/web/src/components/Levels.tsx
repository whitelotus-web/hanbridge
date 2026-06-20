import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Levels() {
  const t = useTranslations("levels");
  const levels = [1, 2, 3, 4, 5, 6];

  return (
    <section className="container-page py-20">
      <h2 className="text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {t("title")}
      </h2>
      <p className="mt-3 text-center text-slate-500">{t("subtitle")}</p>

      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
      </div>
    </section>
  );
}
