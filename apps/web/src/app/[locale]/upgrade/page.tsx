import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function UpgradePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="VIP plans"
      description="Unlock all levels, mock tests and AI features. Pricing & checkout (PayPal + PayOS) arrive in Phase 5."
    />
  );
}
