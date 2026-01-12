import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: ambil informasi toko (cuma satu record)
export async function GET() {
  try {
    const info = await prisma.informasiToko.findFirst();
    return NextResponse.json({ info }, { status: 200 });
  } catch (error) {
    console.error("GET /informasi error:", error);
    return NextResponse.json(
      { message: "Gagal mengambil informasi toko" },
      { status: 500 }
    );
  }
}

// POST: simpan / update informasi toko (selalu 1, id=1)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { namaToko, deskripsi, logoUrl } = body || {};

    if (!namaToko || !deskripsi) {
      return NextResponse.json(
        { message: "Nama toko dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    // "" / null / undefined -> null
    const cleanLogoUrl =
      logoUrl === "" || logoUrl === null || logoUrl === undefined
        ? null
        : String(logoUrl);

    const info = await prisma.informasiToko.upsert({
      where: { id: 1 },
      update: { namaToko, deskripsi, logoUrl: cleanLogoUrl },
      create: { id: 1, namaToko, deskripsi, logoUrl: cleanLogoUrl },
    });

    return NextResponse.json(
      { message: "Informasi toko berhasil disimpan", info },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /informasi error:", error);
    return NextResponse.json(
      { message: "Gagal menyimpan informasi toko" },
      { status: 500 }
    );
  }
}

// DELETE: hapus informasi toko (jadi kosong lagi)
export async function DELETE() {
  try {
    await prisma.informasiToko.deleteMany();
    return NextResponse.json(
      { message: "Informasi toko berhasil dihapus" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /informasi error:", error);
    return NextResponse.json(
      { message: "Gagal menghapus informasi toko" },
      { status: 500 }
    );
  }
}
