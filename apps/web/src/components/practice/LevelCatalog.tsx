"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { ApiError, contentApi, type LevelDetail } from "@/lib/api";

export default function LevelCatalog({ code }: { code: string }) {
  const t = useTranslations("practice");
  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contentApi
      .level(code)
      .then((data) => {
        if (!cancelled) setLevel(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof ApiError && err.status === 404
              ? t("levelNotFound")
              : t("loadError")
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code, t]);

  if (loading) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }
  if (error || !level) {
    return <p className="py-10 text-center text-red-500">{error}</p>;
  }

  return (
    <div className="space-y-10">
      {level.skills.map((skill) => (
        <section key={skill.id}>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{skill.name}</h2>
          {skill.sections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
              {t("comingSoon")}
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {skill.sections.map((section) => (
                <li key={section.id}>
                  <Link
                    href={`/practice/${section.id}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                  >
                    <span className="font-medium text-slate-800">
                      {section.title}
                    </span>
                    <span className="text-sm font-semibold text-brand-600">
                      {t("practice")} →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
