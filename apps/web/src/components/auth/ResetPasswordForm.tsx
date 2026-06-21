"use client";

import { useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { ApiError, authApi } from "@/lib/api";

export default function ResetPasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? t("reset.invalid")
          : t("error")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {t("reset.missing")}
        </p>
        <Link
          href="/forgot-password"
          className="block text-center text-sm font-medium text-brand-600 hover:underline"
        >
          {t("forgot.title")}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
        {t("reset.success")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="password">
          {t("reset.newPassword")}
        </label>
        <input
          id="password"
          type="password"
          className="input"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
      >
        {submitting ? t("submitting") : t("reset.submit")}
      </button>
    </form>
  );
}
