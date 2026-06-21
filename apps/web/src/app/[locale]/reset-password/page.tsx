import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthShell from "@/components/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subtitle")}>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
