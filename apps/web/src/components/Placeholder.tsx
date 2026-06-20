import InnerHeader from "./InnerHeader";
import Footer from "./Footer";
import { Link } from "@/i18n/routing";

export default function Placeholder({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <>
      <InnerHeader />
      <main className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
          Coming soon
        </span>
        <h1 className="mt-5 text-4xl font-extrabold text-slate-900">{title}</h1>
        {description && (
          <p className="mt-4 max-w-xl text-slate-500">{description}</p>
        )}
        <Link href="/" className="btn-primary mt-8">
          ← Home
        </Link>
      </main>
      <Footer />
    </>
  );
}
