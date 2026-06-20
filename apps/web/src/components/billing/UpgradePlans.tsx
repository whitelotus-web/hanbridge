"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/context/AuthContext";
import { billingApi, userIsVip, type Plan } from "@/lib/api";
import { getAccessToken } from "@/lib/tokens";

const GATEWAY_LABELS: Record<string, string> = {
  paypal: "PayPal / Card",
  payos: "PayOS (VietQR)"
};

export default function UpgradePlans() {
  const t = useTranslations("billing");
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [gateways, setGateways] = useState<string[]>([]);
  const [gateway, setGateway] = useState<string>("paypal");
  const [busyPlan, setBusyPlan] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyVip = userIsVip(user);

  useEffect(() => {
    Promise.all([billingApi.plans(), billingApi.gateways()]).then(
      ([p, g]) => {
        setPlans(p);
        setGateways(g);
        if (g.length) setGateway(g[0]);
      }
    );
  }, []);

  async function buy(plan: Plan) {
    const token = getAccessToken();
    if (!user || !token) {
      router.push("/login");
      return;
    }
    setBusyPlan(plan.id);
    setError(null);
    try {
      // Dev/mock flow: checkout then immediately confirm the order.
      const checkout = await billingApi.checkout(plan.id, gateway, token);
      await billingApi.confirm(checkout.order_id, token);
      await refreshUser();
      setDone(true);
    } catch {
      setError(t("error"));
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">{t("title")}</h1>
        <p className="mt-2 text-slate-500">{t("subtitle")}</p>
      </header>

      {alreadyVip && (
        <div className="rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">
          {t("alreadyVip")}
        </div>
      )}

      {done && !alreadyVip && (
        <div className="rounded-xl bg-green-50 p-4 text-center text-sm font-medium text-green-700">
          {t("success")}
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-medium text-slate-600">
          {t("payVia")}:
        </span>
        {gateways.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGateway(g)}
            className={[
              "rounded-full border px-4 py-1.5 text-sm font-medium transition",
              gateway === g
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:border-brand-200"
            ].join(" ")}
          >
            {GATEWAY_LABELS[g] ?? g}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
            <p className="mt-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {plan.currency} {plan.price}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {plan.duration_days
                ? t("forDays", { days: plan.duration_days })
                : t("lifetime")}
            </p>
            <button
              type="button"
              disabled={busyPlan !== null || alreadyVip}
              onClick={() => void buy(plan)}
              className="btn-primary mt-6 disabled:opacity-50"
            >
              {busyPlan === plan.id ? t("processing") : t("choose")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
