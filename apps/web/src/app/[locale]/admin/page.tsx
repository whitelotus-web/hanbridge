import { setRequestLocale } from "next-intl/server";
import InnerHeader from "@/components/InnerHeader";
import Footer from "@/components/Footer";
import AdminConsole from "@/components/admin/AdminConsole";

export default function AdminPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return (
    <>
      <InnerHeader />
      <main className="container-page max-w-6xl space-y-6 py-10">
        <AdminConsole />
      </main>
      <Footer />
    </>
  );
}
