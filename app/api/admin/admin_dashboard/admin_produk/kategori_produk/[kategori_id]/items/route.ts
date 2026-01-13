import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Ambil kategoriId langsung dari URL path, bukan dari params
function getKategoriIdFromUrl(req: NextRequest): number | null {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // cari posisi "kategori_produk"
  const idx = segments.lastIndexOf("kategori_produk");
  if (idx === -1 || idx + 1 >= segments.length) return null;

  const rawId = segments[idx + 1]; // segmen setelah "kategori_produk"
  const n = Number(rawId);
  if (!rawId || Number.isNaN(n) || n <= 0) return null;
  return n;
}

export async function POST(req: NextRequest) {
  const kategoriId = getKategoriIdFromUrl(req);

  if (!kategoriId) {
    console.error("Invalid kategoriId from URL:", req.url);
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Body request tidak valid." },
      { status: 400 }
    );
  }

  const produkIds = Array.isArray(body?.produkIds) ? body.produkIds : null;
  if (!produkIds) {
    return NextResponse.json(
      { error: "Field 'produkIds' harus berupa array number." },
      { status: 400 }
    );
  }

  const cleanedIds: number[] = [];
  for (const v of produkIds) {
    const n = Number(v);
    if (!n || Number.isNaN(n)) {
      return NextResponse.json(
        { error: "Semua 'produkIds' harus berupa ID number yang valid." },
        { status: 400 }
      );
    }
    cleanedIds.push(n);
  }

  try {
    // pastikan kategori ada
    const kategori = await prisma.kategoriProduk.findUnique({
      where: { id: kategoriId },
    });
    if (!kategori) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx: any) => {
      // hapus semua item lama di kategori ini
      await tx.kategoriProdukItem.deleteMany({
        where: { kategoriId },
      });

      if (cleanedIds.length > 0) {
        await tx.kategoriProdukItem.createMany({
          data: cleanedIds.map((produkId, index) => ({
            kategoriId,
            produkId,
            urutan: index + 1,
          })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /kategori_produk/:id/items error:", error);

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Beberapa produk tidak ditemukan atau sudah dihapus. Periksa kembali daftar produk.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Gagal menyimpan isi kategori." },
      { status: 500 }
    );
  }
}
