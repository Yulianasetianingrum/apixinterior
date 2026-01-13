import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// helper ambil kategoriId dari URL
function getKategoriIdFromUrl(req: NextRequest): number | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const idx = segments.lastIndexOf("kategori_produk");
  if (idx === -1 || idx + 1 >= segments.length) return null;

  const rawId = segments[idx + 1];
  const n = Number(rawId);
  if (!rawId || Number.isNaN(n) || n <= 0) return null;
  return n;
}

export async function DELETE(req: NextRequest) {
  const kategoriId = getKategoriIdFromUrl(req);

  if (!kategoriId) {
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.kategoriProduk.findUnique({
      where: { id: kategoriId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx: any) => {
      // hapus semua item dulu (jaga-jaga kalau FK di DB belum cascade)
      await tx.kategoriProdukItem.deleteMany({
        where: { kategoriId },
      });

      await tx.kategoriProduk.delete({
        where: { id: kategoriId },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /kategori_produk/:id error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const kategoriId = getKategoriIdFromUrl(req);
  if (!kategoriId) {
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Pastikan hanya update field yang diizinkan (misal isPromo)
    const dataToUpdate: any = {};
    if (typeof body.isPromo !== "undefined") {
      dataToUpdate.isPromo = !!body.isPromo;
    }

    // Fallback jika tidak ada field yg valid
    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json({ message: "No fields to update" });
    }

    const updated = await prisma.kategoriProduk.update({
      where: { id: kategoriId },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("PATCH /kategori_produk/:id error:", error);
    return NextResponse.json(
      { error: "Gagal update kategori." },
      { status: 500 }
    );
  }
}
