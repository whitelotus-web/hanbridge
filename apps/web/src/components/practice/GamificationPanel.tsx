"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { gamificationApi, type Gamification } from "@/lib/gamification";
import { getAccessToken } from "@/lib/tokens";

export default function GamificationPanel() {
  const t = useTranslations("gamification");
  const [data, setData] = useState<Gamification | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    gamificationApi.me(token).then(setData).catch(() => undefined);
  }, []);

  if (!data) return null;

  const pct =
    data.xp_for_next_level > 0
      ? Math.min(100, Math.round((data.xp_into_level / data.xp_for_next_level) * 100))
      : 100;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient text-lg font-bold text-white">
          {data.level}
        </div>
        <div className="min-w-[8rem] flex-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold text-slate-800">
              {t("level")} {data.level}
            </span>
            <span className="text-slate-400">
              {data.xp_into_level}/{data.xp_for_next_level} XP
            </span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full bg-brand-gradient" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-500">🔥 {data.streak_days}</p>
          <p className="text-xs text-slate-400">{t("dayStreak")}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-brand-600">{data.xp}</p>
          <p className="text-xs text-slate-400">{t("totalXp")}</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-slate-700">{t("badges")}</p>
        {data.badges.length === 0 ? (
          <p className="text-sm text-slate-400">{t("noBadges")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.badges.map((b) => (
              <span
                key={b.code}
                title={b.description}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm text-slate-700"
              >
                <span aria-hidden>{b.icon}</span> {b.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
