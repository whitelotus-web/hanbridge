import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function RegisterPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="Register"
      description="Create your HanBridge account. Sign-up arrives in the Auth phase."
    />
  );
}
