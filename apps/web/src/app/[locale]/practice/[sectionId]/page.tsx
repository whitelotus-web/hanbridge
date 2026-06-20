import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import PracticeSession from "@/components/practice/PracticeSession";

export default function PracticePage({
  params: { locale, sectionId }
}: {
  params: { locale: string; sectionId: string };
}) {
  setRequestLocale(locale);
  const id = Number(sectionId);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-3xl py-12">
        <PracticeSession sectionId={id} />
      </main>
      <Footer />
    </>
  );
}
