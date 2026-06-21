import type { ReactNode } from "react";

export default function FeatureCard({
  icon,
  title,
  desc
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>
      <h4 className="mb-2 text-lg font-bold text-slate-900">{title}</h4>
      <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
