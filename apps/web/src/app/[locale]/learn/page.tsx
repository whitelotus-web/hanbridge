import type { Metadata } from "next";
import { buildMetadata, seoText } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "learn");
  return buildMetadata({ locale, path: "/learn", title, description });
}

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
