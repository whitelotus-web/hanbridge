import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function LearnPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="Learning hub"
      description="Listening, reading, writing & mock-test practice across HSK 1–9. The full practice engine lands in Phase 2."
    />
  );
}
