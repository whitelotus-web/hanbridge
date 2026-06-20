"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function VipGate() {
  const t = useTranslations("billing");
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        VIP
      </span>
      <h2 className="mt-4 text-xl font-bold text-slate-900">
        {t("gateTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
        {t("gateBody")}
      </p>
      <Link href="/upgrade" className="btn-primary mt-6 inline-block">
        {t("gateCta")}
      </Link>
    </div>
  );
}
