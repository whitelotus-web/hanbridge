"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ApiError,
  contentApi,
  mockApi,
  type LevelDetail,
  type MockTestSummary
} from "@/lib/api";

export default function LevelCatalog({ code }: { code: string }) {
  const t = useTranslations("practice");
  const [level, setLevel] = useState<LevelDetail | null>(null);
  const [mocks, setMocks] = useState<MockTestSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      contentApi.level(code),
      mockApi.list(code).catch(() => [] as MockTestSummary[])
    ])
      .then(([data, mockList]) => {
        if (!cancelled) {
          setLevel(data);
          setMocks(mockList);
        }
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
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      {section.title}
                      {!section.is_free && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          VIP
                        </span>
                      )}
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

      {mocks.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            {t("mockTests")}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mocks.map((mock) => (
              <li key={mock.id}>
                <Link
                  href={`/mock/${mock.id}`}
                  className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                >
                  <span>
                    <span className="flex items-center gap-2 font-medium text-slate-800">
                      {mock.title}
                      {!mock.is_free && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          VIP
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-slate-500">
                      {mock.question_count} {t("questions")} ·{" "}
                      {Math.round(mock.duration_sec / 60)} {t("minutes")}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-brand-600">
                    {t("startTest")} →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
