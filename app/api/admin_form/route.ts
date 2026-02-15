import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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

    let isValid = false;

    // 1) Utama: validasi dari tabel admin (multi account)
    try {
      const admin = await prisma.admin.findUnique({
        where: { username },
        select: { passwordHash: true },
      });

      if (admin?.passwordHash) {
        isValid = await bcrypt.compare(password, admin.passwordHash);
      }
    } catch (dbErr) {
      // Jangan bocorkan detail ke client; fallback ke env agar admin tetap bisa masuk saat DB bermasalah
      console.error("[ADMIN LOGIN DB] Error:", dbErr);
    }

    // 2) Fallback: credential .env (single account)
    if (!isValid) {
      const ENV_USERNAME = process.env.ADMIN_USERNAME || process.env.ADMIN_INITIAL_USERNAME;
      const ENV_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
      if (ENV_USERNAME && ENV_PASSWORD) {
        isValid = username === ENV_USERNAME && password === ENV_PASSWORD;
      }
    }

    if (!isValid) {
      console.warn("[ADMIN LOGIN] Gagal login. Input:", username);
      return NextResponse.json(
        { success: false, message: "Username atau password salah" },
        { status: 401 }
      );
    }

    console.log("[ADMIN LOGIN] Berhasil login sebagai:", username);

    const res = NextResponse.json(
      { success: true, message: "Login berhasil" },
      { status: 200 }
    );

    // Set cookie admin_logged_in = true
    res.cookies.set("admin_logged_in", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 2, // 2 jam
    });

    return res;
  } catch (error) {
    console.error("Error umum di /api/admin_form:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan di server" },
      { status: 500 }
    );
  }
}
