import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/routing";
import { AuthProvider } from "@/context/AuthContext";
import JsonLd from "@/components/JsonLd";
import {
  SITE_NAME,
  SITE_URL,
  languageAlternates,
  localizedUrl,
  organizationJsonLd,
  seoText,
  websiteJsonLd
} from "@/lib/seo";
import "../globals.css";

export function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Metadata {
  const { title, description } = seoText(locale, "home");
  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: { default: title, template: `%s · ${SITE_NAME}` },
    description,
    alternates: {
      canonical: localizedUrl(locale, ""),
      languages: languageAlternates("")
    },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale,
      title,
      description
    },
    twitter: { card: "summary_large_image" }
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as never)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="font-sans">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd(locale)]} />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>{children}</AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
