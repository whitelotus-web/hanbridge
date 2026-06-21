"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { aiApi, type ExplainResult } from "@/lib/ai";
import { getAccessToken } from "@/lib/tokens";

export default function ExplainButton({
  questionId,
  chosenOptionId,
  textAnswer
}: {
  questionId: number;
  chosenOptionId?: number | null;
  textAnswer?: string | null;
}) {
  const t = useTranslations("practice");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState(false);

  async function run() {
    setLoading(true);
    setError(false);
    try {
      const res = await aiApi.explain(
        {
          question_id: questionId,
          chosen_option_id: chosenOptionId ?? null,
          text_answer: textAnswer ?? null,
          locale
        },
        getAccessToken() ?? undefined
      );
      setResult(res);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm text-slate-700">
        <p className="mb-1 font-semibold text-brand-700">
          {t("aiExplanation")}
          {result.ai_generated ? "" : ` · ${t("aiOffline")}`}
        </p>
        <p className="whitespace-pre-wrap">{result.explanation}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
    >
      ✨ {loading ? t("aiThinking") : error ? t("aiError") : t("explainAi")}
    </button>
  );
}
