"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthNav from "./auth/AuthNav";

export default function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/corporate", label: t("corporate") },
    { href: "/upgrade", label: t("upgrade") },
    { href: "/about", label: t("about") }
  ];

  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <nav className="container-page flex h-20 items-center justify-between">
        <Link href="/" className="shrink-0">
          <Logo variant="light" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <ul className="flex items-center gap-7 text-sm font-medium text-white/90">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="light" />
            <AuthNav variant="light" />
          </div>
        </div>

        <button
          type="button"
          className="text-white md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="mx-4 rounded-2xl bg-white p-4 shadow-xl md:hidden">
          <ul className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-lg px-3 py-2 hover:bg-slate-50"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <LanguageSwitcher />
            <AuthNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
