import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import MockRunner from "@/components/practice/MockRunner";

export default function MockPage({
  params: { locale, mockId }
}: {
  params: { locale: string; mockId: string };
}) {
  setRequestLocale(locale);
  const id = Number(mockId);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-3xl py-12">
        <MockRunner mockId={id} />
      </main>
      <Footer />
    </>
  );
}
