import type { Metadata } from "next";
import { buildMetadata, seoText } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "corporate");
  return buildMetadata({ locale, path: "/corporate", title, description });
}

export default function CorporatePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="Corporate services"
      description="Tailored Chinese-language training and HSK preparation for teams and enterprises."
    />
  );
}
