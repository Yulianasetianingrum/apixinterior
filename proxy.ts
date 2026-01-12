// proxy.ts
// DEBUG VERSION - Proteksi SEMUA route di bawah /admin/*
//
// Penting:
// 1. Harus ada file middleware.ts di root yang berisi:
//      export { proxy as middleware } from "./proxy";
// 2. Setelah update, RESTART `npm run dev`.
//
// Aturan:
// - /admin/admin_form      -> SELALU boleh (halaman login admin)
// - semua path lain yang diawali /admin -> WAJIB punya cookie "admin_logged_in" === "true"
//   kalau tidak, redirect ke /admin/admin_form?from=<path>

import { NextResponse, NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.cookies.get("admin_logged_in")?.value;

  console.log("[MIDDLEWARE proxy] path =", pathname, "| admin_logged_in =", cookie);

  // 1. Halaman login admin selalu boleh diakses
  if (pathname.startsWith("/admin/admin_form")) {
    console.log("[MIDDLEWARE proxy] /admin/admin_form -> allow");
    return NextResponse.next();
  }

  // 2. Semua route lain yang diawali /admin -> wajib login
  if (pathname.startsWith("/admin")) {
    const isAdmin = cookie === "true";

    if (!isAdmin) {
      console.log("[MIDDLEWARE proxy] BLOCK & REDIRECT -> /admin/admin_form?from=", pathname);
      const loginUrl = new URL("/admin/admin_form", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    console.log("[MIDDLEWARE proxy] /admin/* with valid cookie -> allow");
  }

  // 3. Selain /admin/* -> lanjut saja
  return NextResponse.next();
}

// Middleware hanya jalan untuk /admin dan semua anak-anaknya
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
