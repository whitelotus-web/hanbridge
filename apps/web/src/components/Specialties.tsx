import { useTranslations } from "next-intl";
import FeatureCard from "./FeatureCard";
import { BookIcon, SparkIcon, TestIcon, VocabIcon, HeadsetIcon } from "./icons";

export function LearnSection() {
  const t = useTranslations("learn");
  return (
    <section className="container-page py-20">
      <h2 className="text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
        {t("title")}
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <FeatureCard icon={<BookIcon />} title={t("courseTitle")} desc={t("courseDesc")} />
        <FeatureCard icon={<SparkIcon />} title={t("aiTitle")} desc={t("aiDesc")} />
      </div>
    </section>
  );
}

export function SpecialtiesSection() {
  const t = useTranslations("specialties");
  return (
    <section className="bg-slate-50 py-20">
      <div className="container-page">
        <h2 className="text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
          {t("title")}
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard icon={<TestIcon />} title={t("testsTitle")} desc={t("testsDesc")} />
          <FeatureCard icon={<VocabIcon />} title={t("vocabTitle")} desc={t("vocabDesc")} />
          <FeatureCard icon={<HeadsetIcon />} title={t("lrwTitle")} desc={t("lrwDesc")} />
        </div>
      </div>
    </section>
  );
}
