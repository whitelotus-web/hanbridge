import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthShell from "@/components/AuthShell";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default async function ForgotPasswordPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
