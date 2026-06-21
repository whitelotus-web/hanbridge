"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";

export default function AuthNav({
  variant = "dark",
  onNavigate
}: {
  variant?: "light" | "dark";
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const { user, loading, logout } = useAuth();

  const loginClass =
    variant === "light"
      ? "text-sm font-medium text-white/90 transition hover:text-white"
      : "text-sm font-medium text-slate-600 transition hover:text-brand-600";
  const registerClass =
    variant === "light"
      ? "rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-600 transition hover:bg-white/90"
      : "btn-primary !px-5 !py-2";
  const nameClass =
    variant === "light"
      ? "text-sm font-semibold text-white"
      : "text-sm font-semibold text-slate-800";

  if (loading) {
    return <div className="h-5 w-24" aria-hidden />;
  }

  if (user) {
    const name = user.display_name || user.email || user.phone || "";
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className={loginClass} onClick={onNavigate}>
          {t("dashboard")}
        </Link>
        <span className={nameClass}>{name}</span>
        <button
          type="button"
          onClick={() => {
            logout();
            onNavigate?.();
          }}
          className={loginClass}
        >
          {t("logout")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className={loginClass} onClick={onNavigate}>
        {t("login")}
      </Link>
      <Link href="/register" className={registerClass} onClick={onNavigate}>
        {t("register")}
      </Link>
    </div>
  );
}
