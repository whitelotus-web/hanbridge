import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Corporate() {
  const t = useTranslations("corporate");
  return (
    <section className="relative overflow-hidden bg-slate-900 py-20">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(79,124,255,0.5), transparent 45%), radial-gradient(circle at 80% 70%, rgba(123,63,228,0.5), transparent 45%)"
        }}
      />
      <div className="relative container-page text-center">
        <h2 className="mx-auto max-w-3xl text-3xl font-extrabold text-white sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-white/70">{t("desc")}</p>
        <Link href="/corporate" className="btn-primary mt-8 !bg-white !text-brand-600">
          {t("cta")}
        </Link>
      </div>
    </section>
  );
}
