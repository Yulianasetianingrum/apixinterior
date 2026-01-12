// app/api/admin_form/route.ts
// Versi simple: cek admin pakai .env (ADMIN_USERNAME / ADMIN_PASSWORD)
// Biar kamu bisa login dulu tanpa pusing Prisma/seed dulu.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, message: "Request tidak valid (body kosong / bukan JSON)" },
        { status: 400 }
      );
    }

    const { username, password } = body as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil credential dari .env
    // SECURITY: Hapus default value hardcoded agar tidak terekspos.
    // Admin WAJIB set ADMIN_USERNAME & ADMIN_PASSWORD di .env VPS.
    const ENV_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_INITIAL_USERNAME;
    const ENV_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;

    if (!ENV_USERNAME || !ENV_PASSWORD) {
      console.error("[ADMIN LOGIN] .env ADMIN_USERNAME / ADMIN_PASSWORD belum diset!");
      return NextResponse.json(
        { success: false, message: "Konfigurasi server belum lengkap (Missing .env)" },
        { status: 500 }
      );
    }

    const isValid = username === ENV_USERNAME && password === ENV_PASSWORD;

    if (!isValid) {
      console.warn("[ADMIN LOGIN ENV] Gagal login. Input:", username);
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      );
    }

    console.log("[ADMIN LOGIN ENV] Berhasil login sebagai:", username);

    const res = NextResponse.json(
      { success: true, message: "Login berhasil" },
      { status: 200 }
    );

    // Set cookie admin_logged_in = true
    res.cookies.set("admin_logged_in", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 2, // 2 jam
    });

    return res;
  } catch (error) {
    console.error("Error umum di /api/admin_form (ENV version):", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan di server" },
      { status: 500 }
    );
  }
}
