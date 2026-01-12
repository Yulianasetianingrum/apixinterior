// app/admin/admin_dashboard/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  // Next.js 16: cookies() sekarang async, jadi harus di-await
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_logged_in")?.value === "true";

  // Guard tambahan (selain layout & middleware):
  // kalau belum login, lempar balik ke form admin
  if (!isAdmin) {
    redirect("/admin/admin_form?from=/admin/admin_dashboard");
  }

  // Render client component utama dashboard
  return <AdminDashboardClient />;
}
