"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { dashboardApi, type Stats } from "@/lib/api";
import { getAccessToken } from "@/lib/tokens";

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    let cancelled = false;
    dashboardApi
      .stats(token)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || loading || !stats) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">{t("title")}</h1>
        <p className="mt-1 text-slate-500">
          {t("greeting", { name: user?.display_name ?? user?.email ?? "" })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("answered")} value={stats.total_answered} />
        <StatCard label={t("correct")} value={stats.total_correct} />
        <StatCard label={t("accuracy")} value={`${stats.accuracy}%`} />
      </div>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          {t("progress")}
        </h2>
        {stats.sections.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
            {t("noProgress")}
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.sections.map((s) => {
              const pct = s.answered
                ? Math.round((s.correct / s.answered) * 100)
                : 0;
              return (
                <li
                  key={s.section_id}
                  className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">
                      {s.section_title}
                    </span>
                    <span className="text-slate-500">
                      {s.correct}/{s.answered}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-gradient"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          {t("recentMocks")}
        </h2>
        {stats.recent_mocks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-400">
            {t("noMocks")}
          </p>
        ) : (
          <ul className="space-y-3">
            {stats.recent_mocks.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/mock/${m.mock_test_id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-brand-200"
                >
                  <span className="font-medium text-slate-800">{m.title}</span>
                  <span className="font-bold text-brand-600">{m.score}%</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-3xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}
