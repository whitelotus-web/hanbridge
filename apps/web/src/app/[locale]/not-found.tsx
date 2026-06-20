import { Link } from "@/i18n/routing";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-7xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-500">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="btn-primary mt-8">
        ← Home
      </Link>
    </main>
  );
}
