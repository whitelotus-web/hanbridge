import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Hero() {
  const t = useTranslations("hero");
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-brand-gradient" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.4), transparent 40%)"
        }}
      />
      <div className="relative container-page flex min-h-[620px] flex-col justify-center py-32">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-extrabold leading-tight text-white sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 text-xl text-white/90">{t("subtitle")}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/learn" className="btn-primary !bg-white !text-brand-600 !shadow-white/20">
              {t("cta")}
            </Link>
            <Link href="/upgrade" className="btn-outline">
              VIP
            </Link>
          </div>
        </div>
      </div>
      <svg
        className="absolute bottom-0 left-0 w-full text-white"
        viewBox="0 0 1440 80"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0 80h1440V40C1080 80 720 0 360 40 240 53 120 60 0 40z" />
      </svg>
    </section>
  );
}
