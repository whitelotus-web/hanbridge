"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

export default function InnerHeader() {
  const t = useTranslations("nav");
  const links = [
    { href: "/corporate", label: t("corporate") },
    { href: "/upgrade", label: t("upgrade") },
    { href: "/about", label: t("about") }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          <ul className="flex items-center gap-6 text-sm font-medium text-slate-600">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-brand-600">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-medium text-slate-600">
            {t("login")}
          </Link>
          <Link href="/register" className="btn-primary !px-5 !py-2">
            {t("register")}
          </Link>
        </div>
        <div className="md:hidden">
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
