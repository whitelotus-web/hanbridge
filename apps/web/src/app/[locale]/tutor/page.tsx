import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import TutorChat from "@/components/ai/TutorChat";

export default function TutorPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-4xl py-12">
        <TutorChat />
      </main>
      <Footer />
    </>
  );
}
