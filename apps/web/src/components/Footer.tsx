import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Logo from "./Logo";

export default function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("aboutHsk"),
      links: [
        { href: "/about", label: t("aboutTest") },
        { href: "/hsk/plan", label: t("testPlan") },
        { href: "/hsk/regulation", label: t("testRegulation") },
        { href: "/learn", label: t("mockTests") }
      ]
    },
    {
      title: t("product"),
      links: [1, 2, 3, 4, 5, 6].map((n) => ({
        href: `/hsk/${n}`,
        label: `HSK ${n}`
      }))
    },
    {
      title: t("aboutUs"),
      links: [
        { href: "/privacy", label: t("privacy") },
        { href: "/terms", label: t("terms") },
        { href: "/refund", label: t("refund") },
        { href: "/contact", label: t("contact") }
      ]
    }
  ];

  return (
    <footer id="download" className="bg-slate-900 text-slate-300">
      <div className="container-page grid gap-10 py-16 md:grid-cols-4">
        <div>
          <Logo variant="light" />
          <p className="mt-4 max-w-xs text-sm text-slate-400">{t("tagline")}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              {col.title}
            </h3>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 py-6">
        <p className="container-page text-center text-sm text-slate-500">
          {t("rights", { year })}
        </p>
      </div>
    </footer>
  );
}
