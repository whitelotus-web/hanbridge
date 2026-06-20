"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { ApiError, authApi } from "@/lib/api";

export default function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { setSession } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await authApi.login(identifier, password);
      setSession(result);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 401
          ? t("login.invalid")
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
        <label className="label" htmlFor="identifier">
          {t("login.identifier")}
        </label>
        <input
          id="identifier"
          className="input"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          {t("login.forgot")}
        </Link>
      </div>
      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting}
      >
        {submitting ? t("submitting") : t("login.submit")}
      </button>
    </form>
  );
}
