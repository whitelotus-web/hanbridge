import type { Metadata } from "next";
import { buildMetadata, seoText } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import UpgradePlans from "@/components/billing/UpgradePlans";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "upgrade");
  return buildMetadata({ locale, path: "/upgrade", title, description });
}

export default function UpgradePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-4xl py-12">
        <UpgradePlans />
      </main>
      <Footer />
    </>
  );
}
