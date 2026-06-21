import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import Dashboard from "@/components/practice/Dashboard";
import GamificationPanel from "@/components/practice/GamificationPanel";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  return buildMetadata({
    locale,
    path: "/dashboard",
    title: "Dashboard",
    description: "Dashboard — HanBridge.",
    noindex: true
  });
}

export default function DashboardPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-4xl space-y-6 py-12">
        <GamificationPanel />
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}
