import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import UpgradePlans from "@/components/billing/UpgradePlans";

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
