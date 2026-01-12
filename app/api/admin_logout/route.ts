// app/api/admin_logout/route.ts
// Hapus session admin dengan menghapus cookie "admin_logged_in"

import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json(
    { success: true, message: "Logout berhasil" },
    { status: 200 }
  );

  // Clear cookie admin_logged_in
  res.cookies.set("admin_logged_in", "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });

  return res;
}

// Opsional: kalau ada yang manggil GET, perlakukan sama seperti POST
export async function GET() {
  return POST();
}
