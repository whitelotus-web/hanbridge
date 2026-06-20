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
