"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  mockApi,
  type AnswerInput,
  type MockResult,
  type MockTestDetail
} from "@/lib/api";
import { getAccessToken } from "@/lib/tokens";

const CHOICE_TYPES = [
  "true_false",
  "match_picture",
  "match_dialogue",
  "multiple_choice"
];

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MockRunner({ mockId }: { mockId: number }) {
  const t = useTranslations("practice");
  const [test, setTest] = useState<MockTestDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<MockResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    mockApi
      .get(mockId)
      .then((data) => {
        if (cancelled) return;
        setTest(data);
        setRemaining(data.duration_sec);
        startRef.current = Date.now();
      })
      .catch(() => {
        if (!cancelled) setLoadError(t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [mockId, t]);

  const submit = useCallback(async () => {
    if (!test) return;
    setSubmitting(true);
    try {
      const elapsed = Math.round((Date.now() - startRef.current) / 1000);
      const answers: AnswerInput[] = test.questions.map((q) =>
        CHOICE_TYPES.includes(q.question_type)
          ? { question_id: q.id, chosen_option_id: choiceAnswers[q.id] ?? null }
          : { question_id: q.id, text_answer: textAnswers[q.id] ?? "" }
      );
      const res = await mockApi.submit(test.id, answers, elapsed, getAccessToken());
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }, [test, choiceAnswers, textAnswers]);

  // Countdown timer; auto-submits at zero.
  useEffect(() => {
    if (remaining === null || result) return;
    if (remaining <= 0) {
      void submit();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => (r === null ? r : r - 1)), 1000);
    return () => clearTimeout(id);
  }, [remaining, result, submit]);

  const resultMap = useMemo(() => {
    const map: Record<number, MockResult["results"][number]> = {};
    result?.results.forEach((r) => {
      map[r.question_id] = r;
    });
    return map;
  }, [result]);

  if (loading) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }
  if (loadError || !test) {
    return <p className="py-10 text-center text-red-500">{loadError}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-slate-900">{test.title}</h1>
        {!result && remaining !== null && (
          <span
            className={[
              "rounded-full px-4 py-1 font-mono text-sm font-bold",
              remaining < 60
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-700"
            ].join(" ")}
          >
            {fmt(remaining)}
          </span>
        )}
      </div>

      {result && (
        <div className="space-y-4">
          <div
            className={[
              "rounded-2xl p-6 text-white shadow-lg",
              result.passed ? "bg-brand-gradient" : "bg-slate-600"
            ].join(" ")}
          >
            <p className="text-sm uppercase tracking-wide opacity-80">
              {result.passed ? t("passed") : t("notPassed")}
            </p>
            <p className="mt-1 text-4xl font-extrabold">{result.score}%</p>
            <p className="mt-1 text-sm opacity-90">
              {result.correct}/{result.total_questions} {t("correctCount")}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ScoreCard label={t("listening")} value={result.listening_score} />
            <ScoreCard label={t("reading")} value={result.reading_score} />
            <ScoreCard label={t("writing")} value={result.writing_score} />
          </div>
        </div>
      )}

      <ol className="space-y-5">
        {test.questions.map((q, idx) => {
          const r = resultMap[q.id];
          const isChoice = CHOICE_TYPES.includes(q.question_type);
          return (
            <li
              key={q.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                {t(q.skill_type)}
              </p>
              <p className="mt-1 font-semibold text-slate-900">
                {idx + 1}. {q.stem}
              </p>

              {isChoice ? (
                <div className="mt-4 space-y-2">
                  {q.options.map((opt) => {
                    const selected = choiceAnswers[q.id] === opt.id;
                    const isCorrect = r && r.correct_option_id === opt.id;
                    const isWrong = r && selected && !r.is_correct && !isCorrect;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={!!result}
                        onClick={() =>
                          setChoiceAnswers((p) => ({ ...p, [q.id]: opt.id }))
                        }
                        className={[
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                          isCorrect
                            ? "border-green-400 bg-green-50 text-green-800"
                            : isWrong
                              ? "border-red-300 bg-red-50 text-red-700"
                              : selected
                                ? "border-brand-500 bg-brand-50 text-brand-700"
                                : "border-slate-200 text-slate-700 hover:border-brand-200"
                        ].join(" ")}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                          {opt.label}
                        </span>
                        {opt.content}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  className="input mt-4"
                  placeholder={t("yourAnswer")}
                  disabled={!!result}
                  value={textAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    setTextAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                  }
                />
              )}

              {r && r.correct_answer && !r.is_correct && (
                <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <span className="font-medium">{t("acceptedAnswer")}: </span>
                  {r.correct_answer}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between">
        <Link
          href={`/hsk/1`}
          className="text-sm font-medium text-slate-500 hover:text-brand-600"
        >
          ← {t("backToLevel")}
        </Link>
        {!result && (
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            disabled={submitting}
            onClick={() => void submit()}
          >
            {submitting ? t("grading") : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4 text-center shadow-sm">
      <p className="text-2xl font-extrabold text-slate-900">{value}%</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
