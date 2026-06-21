"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { gamificationApi, type Leaderboard } from "@/lib/gamification";
import { getAccessToken } from "@/lib/tokens";

export default function LeaderboardView() {
  const t = useTranslations("gamification");
  const [data, setData] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamificationApi
      .leaderboard(getAccessToken() ?? undefined)
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">{t("leaderboard")}</h1>
      <p className="mb-4 text-sm text-slate-500">{t("leaderboardSubtitle")}</p>

      {data && data.my_rank && (
        <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          {t("yourRank")}: #{data.my_rank}
        </p>
      )}

      <div className="table-wrapper overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">{t("learner")}</th>
              <th className="px-4 py-2 text-right">{t("level")}</th>
              <th className="px-4 py-2 text-right">XP</th>
              <th className="px-4 py-2 text-right">🔥</th>
            </tr>
          </thead>
          <tbody>
            {(data?.entries ?? []).map((e) => (
              <tr
                key={e.user_id}
                className={
                  e.is_me
                    ? "border-t border-slate-100 bg-brand-50/60 font-semibold"
                    : "border-t border-slate-100"
                }
              >
                <td className="px-4 py-2">
                  {e.rank <= 3 ? ["🥇", "🥈", "🥉"][e.rank - 1] : e.rank}
                </td>
                <td className="px-4 py-2">{e.display_name}</td>
                <td className="px-4 py-2 text-right">{e.level}</td>
                <td className="px-4 py-2 text-right">{e.xp}</td>
                <td className="px-4 py-2 text-right">{e.streak_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data && data.entries.length === 0 && (
        <p className="mt-4 text-center text-sm text-slate-400">{t("empty")}</p>
      )}
    </div>
  );
}
