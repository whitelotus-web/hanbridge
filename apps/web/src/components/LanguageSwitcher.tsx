"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, localeNames, type Locale } from "@/i18n/routing";

export default function LanguageSwitcher({
  variant = "dark"
}: {
  variant?: "light" | "dark";
}) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const color = variant === "light" ? "text-white" : "text-slate-700";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-sm font-medium ${color}`}
      >
        {localeNames[locale as Locale]}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-xl">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                router.replace(pathname, { locale: l });
                setOpen(false);
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 ${
                l === locale ? "font-semibold text-brand-600" : "text-slate-700"
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
