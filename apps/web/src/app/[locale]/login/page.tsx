import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import AuthShell from "@/components/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <AuthShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footer={
        <>
          {t("login.noAccount")}{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-600 hover:underline"
          >
            {t("login.registerLink")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
