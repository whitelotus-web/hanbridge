import type { ReactNode } from "react";
import InnerHeader from "./InnerHeader";
import Footer from "./Footer";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <>
      <InnerHeader />
      <main className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && (
            <p className="mt-6 text-center text-sm text-slate-500">{footer}</p>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
