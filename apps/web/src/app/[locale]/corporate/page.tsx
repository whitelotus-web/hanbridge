import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function CorporatePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="Corporate services"
      description="Tailored Chinese-language training and HSK preparation for teams and enterprises."
    />
  );
}
