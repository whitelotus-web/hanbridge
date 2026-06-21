import type { Metadata } from "next";
import { buildMetadata, seoText } from "@/lib/seo";
import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import { LearnSection, SpecialtiesSection } from "@/components/Specialties";
import Levels from "@/components/Levels";
import Tutoring from "@/components/Tutoring";
import Testimonials from "@/components/Testimonials";
import Corporate from "@/components/Corporate";
import News from "@/components/News";
import Footer from "@/components/Footer";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "home");
  return buildMetadata({ locale, path: "", title, description });
}

export default function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LearnSection />
        <SpecialtiesSection />
        <Levels />
        <Tutoring />
        <Testimonials />
        <Corporate />
        <News />
      </main>
      <Footer />
    </>
  );
}
