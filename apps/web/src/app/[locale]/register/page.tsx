import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import AuthShell from "@/components/AuthShell";
import RegisterForm from "@/components/auth/RegisterForm";

export default async function RegisterPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthShell
      title={t("register.title")}
      subtitle={t("register.subtitle")}
      footer={
        <>
          {t("register.haveAccount")}{" "}
          <Link
            href="/login"
            className="font-semibold text-brand-600 hover:underline"
          >
            {t("register.loginLink")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
