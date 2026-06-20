import { setRequestLocale } from "next-intl/server";
import Placeholder from "@/components/Placeholder";

export default function LoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <Placeholder
      title="Login"
      description="Email / phone login and QR sign-in arrive in the Auth phase."
    />
  );
}
