import { useTranslations } from "next-intl";
import { CheckIcon } from "./icons";

export default function Tutoring() {
  const t = useTranslations("tutoring");
  const points = [t("point1"), t("point2"), t("point3")];

  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page grid items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            {t("title")}
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white">
                  <CheckIcon className="h-4 w-4" />
                </span>
                <span className="font-medium text-slate-700">{p}</span>
              </li>
            ))}
          </ul>
          <a href="#download" className="btn-primary mt-8">
            {t("cta")}
          </a>
        </div>
        <div className="relative">
          <div className="aspect-[4/3] rounded-3xl bg-brand-gradient opacity-90" />
          <div className="absolute -bottom-5 -left-5 h-24 w-24 rounded-2xl bg-accent-500/20" />
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-brand-300/40" />
        </div>
      </div>
    </section>
  );
}
