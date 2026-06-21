import type { Metadata } from "next";
import { buildMetadata, seoText } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "about");
  return buildMetadata({ locale, path: "/about", title, description });
}

export default function AboutPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="About HanBridge"
      description="Our mission is to bridge the world to the Chinese language with a smarter, AI-powered HSK platform."
    />
  );
}
