// app/admin/admin_dashboard/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/admin_logout", {
        method: "POST",
      });
      // Setelah logout, paksa refresh state server + arahkan ke form login
      router.push("/admin/admin_form");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "white",
        cursor: loading ? "wait" : "pointer",
        fontSize: 14,
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? "Keluar..." : "Logout"}
    </button>
  );
}
