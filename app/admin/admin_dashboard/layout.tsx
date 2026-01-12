// app/admin/admin_dashboard/layout.tsx
import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Next.js 16: cookies() now returns a Promise and must be awaited
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_logged_in")?.value === "true";

  // Extra guard on top of middleware + page.tsx:
  // kalau belum login, lempar ke form admin
  if (!isAdmin) {
    redirect("/admin/admin_form?from=/admin/admin_dashboard");
  }

  return <>{children}</>;
}
