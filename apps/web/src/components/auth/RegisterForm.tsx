"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { ApiError, authApi } from "@/lib/api";

export default function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const { setSession } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authApi.register({
        email,
        password,
        display_name: displayName || undefined,
        locale
      });
      setSession(result);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? t("register.exists")
          : err instanceof ApiError && err.status === 422
            ? t("register.invalid")
            : t("error")
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <div>
        <label className="label" htmlFor="name">
          {t("register.name")}
        </label>
        <input
          id="name"
          className="input"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
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
      <div>
        <label className="label" htmlFor="password">
          {t("password")}
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
        <p className="mt-1 text-xs text-slate-400">{t("register.passwordHint")}</p>
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
      >
        {submitting ? t("submitting") : t("register.submit")}
      </button>
    </form>
  );
}
