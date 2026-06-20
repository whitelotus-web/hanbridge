import { useTranslations } from "next-intl";
import { testimonials } from "@/data/testimonials";

export default function Testimonials() {
  const t = useTranslations("testimonials");
  const common = useTranslations("common");

  return (
    <section className="container-page py-20">
      <h2 className="text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {t("title")}
      </h2>

      <div className="mt-12 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]">
        {testimonials.map((item) => (
          <figure
            key={item.name}
            className="flex min-w-[300px] max-w-[300px] flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient font-bold text-white">
                {item.name.charAt(0)}
              </div>
              <div>
                <figcaption className="font-semibold text-slate-900">
                  {item.name}
                </figcaption>
                <p className="text-xs text-slate-400">
                  {t("level")} {item.level} · {t("score")} {item.score}
                </p>
              </div>
            </div>
            <blockquote className="mt-4 grow text-sm leading-relaxed text-slate-600">
              “{item.text}”
            </blockquote>
            {item.sample && (
              <span className="mt-4 inline-block w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                {common("sampleBadge")}
              </span>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}
