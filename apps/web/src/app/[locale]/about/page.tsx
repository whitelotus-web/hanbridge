import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

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
