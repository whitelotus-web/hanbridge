"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ApiError,
  contentApi,
  practiceApi,
  type GradeResult,
  type SectionQuestions
} from "@/lib/api";
import { getAccessToken } from "@/lib/tokens";
import VipGate from "@/components/billing/VipGate";

const CHOICE_TYPES = [
  "true_false",
  "match_picture",
  "match_dialogue",
  "multiple_choice"
];
const TEXT_TYPES = ["fill_blank"];

type Mode = "choice" | "text" | "essay";

function modeOf(questionType: string): Mode {
  if (CHOICE_TYPES.includes(questionType)) return "choice";
  if (TEXT_TYPES.includes(questionType)) return "text";
  return "essay";
}

export default function PracticeSession({ sectionId }: { sectionId: number }) {
  const t = useTranslations("practice");
  const [section, setSection] = useState<SectionQuestions | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [choiceAnswers, setChoiceAnswers] = useState<Record<number, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<GradeResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    contentApi
      .section(sectionId)
      .then((data) => {
        if (!cancelled) setSection(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 402) setLocked(true);
        else setLoadError(t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sectionId, t]);

  const resultMap = useMemo(() => {
    const map: Record<number, GradeResult["results"][number]> = {};
    result?.results.forEach((r) => {
      map[r.question_id] = r;
    });
    return map;
  }, [result]);

  if (loading) {
    return <p className="py-10 text-center text-slate-400">{t("loading")}</p>;
  }
  if (locked) {
    return <VipGate />;
  }
  if (loadError || !section) {
    return <p className="py-10 text-center text-red-500">{loadError}</p>;
  }

  const mode = modeOf(section.question_type);

  const allAnswered =
    mode === "essay" ||
    (section.questions.length > 0 &&
      section.questions.every((q) =>
        mode === "choice"
          ? choiceAnswers[q.id] !== undefined
          : (textAnswers[q.id] ?? "").trim().length > 0
      ));

  async function submit() {
    if (!section) return;
    setSubmitting(true);
    try {
      const payload = section.questions.map((q) =>
        mode === "choice"
          ? { question_id: q.id, chosen_option_id: choiceAnswers[q.id] ?? null }
          : { question_id: q.id, text_answer: textAnswers[q.id] ?? "" }
      );
      const res = await practiceApi.grade(payload, getAccessToken());
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setChoiceAnswers({});
    setTextAnswers({});
    setResult(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-600">
          {section.level_code} · {section.skill_name}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
          {section.title}
        </h1>
      </div>

      {result &&
        (result.total > 0 ? (
          <div className="rounded-2xl bg-brand-gradient p-6 text-white shadow-lg">
            <p className="text-sm uppercase tracking-wide opacity-80">
              {t("score")}
            </p>
            <p className="mt-1 text-3xl font-extrabold">
              {result.correct}/{result.total}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
            {t("selfAssessed")}
          </div>
        ))}

      <ol className="space-y-5">
        {section.questions.map((q, idx) => {
          const r = resultMap[q.id];
          return (
            <li
              key={q.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <p className="font-semibold text-slate-900">
                {idx + 1}. {q.stem}
              </p>

              {mode === "choice" && (
                <div className="mt-4 space-y-2">
                  {q.options.map((opt) => {
                    const selected = choiceAnswers[q.id] === opt.id;
                    const isCorrect = r && r.correct_option_id === opt.id;
                    const isWrongChoice =
                      r && selected && !r.is_correct && !isCorrect;
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
                            : isWrongChoice
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
              )}

              {mode === "text" && (
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

              {mode === "essay" && (
                <textarea
                  className="input mt-4 min-h-24"
                  placeholder={t("writeHere")}
                  disabled={!!result}
                  value={textAnswers[q.id] ?? ""}
                  onChange={(e) =>
                    setTextAnswers((p) => ({ ...p, [q.id]: e.target.value }))
                  }
                />
              )}

              {r && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  {r.graded && (
                    <span
                      className={
                        r.is_correct
                          ? "font-semibold text-green-700"
                          : "font-semibold text-red-600"
                      }
                    >
                      {r.is_correct ? t("correct") : t("incorrect")}
                    </span>
                  )}
                  {r.correct_answer && !r.is_correct && (
                    <p className="mt-1">
                      <span className="font-medium">{t("acceptedAnswer")}: </span>
                      {r.correct_answer}
                    </p>
                  )}
                  {r.translation && (
                    <p className="mt-1">
                      <span className="font-medium">{t("translation")}: </span>
                      {r.translation}
                    </p>
                  )}
                  {r.explanation && <p className="mt-1">{r.explanation}</p>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between">
        <Link
          href="/hsk/1"
          className="text-sm font-medium text-slate-500 hover:text-brand-600"
        >
          ← {t("backToLevel")}
        </Link>
        {result ? (
          <button type="button" className="btn-primary" onClick={reset}>
            {t("retry")}
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary disabled:opacity-50"
            disabled={!allAnswered || submitting}
            onClick={submit}
          >
            {submitting ? t("grading") : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}
