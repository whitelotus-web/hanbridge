import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import LeaderboardView from "@/components/practice/LeaderboardView";

export default function LeaderboardPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-4xl py-12">
        <LeaderboardView />
      </main>
      <Footer />
    </>
  );
}
