import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { news } from "@/data/news";

export default function News() {
  const t = useTranslations("news");
  const common = useTranslations("common");

  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          {t("title")}
        </h2>
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {news.map((item) => (
            <li key={item.slug}>
              <Link
                href={`/news/${item.slug}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white px-5 py-4 transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex items-center gap-2 font-medium text-slate-700">
                  {item.title}
                  {item.sample && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                      {common("sampleBadge")}
                    </span>
                  )}
                </span>
                <time className="shrink-0 text-sm text-slate-400">{item.date}</time>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
