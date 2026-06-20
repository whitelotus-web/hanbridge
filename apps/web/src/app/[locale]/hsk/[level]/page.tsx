import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function HskLevelPage({
  params: { locale, level }
}: {
  params: { locale: string; level: string };
}) {
  setRequestLocale(locale);
  const label = level === "advanced" ? "HSK 7–9" : `HSK ${level}`;
  return (
    <Placeholder
      title={`${label} — Practice`}
      description="Section list, Single Training and Smart Quiz for this level arrive in Phase 2."
    />
  );
}
