"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { authApi } from "@/lib/api";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email);
      setDevToken(res.reset_token ?? null);
      setSent(true);
    } catch {
      // Endpoint always succeeds; show the same confirmation regardless.
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {t("forgot.sent")}
        </p>
        {devToken && (
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-2 font-semibold">{t("forgot.devNote")}</p>
            <Link
              href={`/reset-password?token=${devToken}`}
              className="break-all font-medium text-brand-600 hover:underline"
            >
              {t("forgot.devLink")}
            </Link>
          </div>
        )}
        <Link
          href="/login"
          className="block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          {t("forgot.back")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          {t("register.email")}
        </label>
        <input
          id="email"
          type="email"
          className="input"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
      >
        {submitting ? t("submitting") : t("forgot.submit")}
      </button>
    </form>
  );
}
