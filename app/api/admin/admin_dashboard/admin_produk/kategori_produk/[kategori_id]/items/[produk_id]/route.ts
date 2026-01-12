import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Ambil kategoriId & produkId langsung dari URL
function getIdsFromUrl(req: NextRequest): { kategoriId: number | null; produkId: number | null } {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // .../kategori_produk/:kategoriId/items/:produkId
  const idx = segments.lastIndexOf("kategori_produk");
  if (idx === -1 || idx + 3 >= segments.length) {
    return { kategoriId: null, produkId: null };
  }

  const rawKategoriId = segments[idx + 1];
  const rawProdukId = segments[idx + 3]; // idx+2 = "items"

  const kategoriId = Number(rawKategoriId);
  const produkId = Number(rawProdukId);

  return {
    kategoriId:
      !rawKategoriId || Number.isNaN(kategoriId) || kategoriId <= 0
        ? null
        : kategoriId,
    produkId:
      !rawProdukId || Number.isNaN(produkId) || produkId <= 0
        ? null
        : produkId,
  };
}

export async function DELETE(req: NextRequest) {
  const { kategoriId, produkId } = getIdsFromUrl(req);

  if (!kategoriId) {
    return NextResponse.json(
      { error: "ID kategori tidak valid." },
      { status: 400 }
    );
  }

  if (!produkId) {
    return NextResponse.json(
      { error: "ID produk tidak valid." },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.kategoriProdukItem.findFirst({
      where: { kategoriId, produkId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Produk ini tidak ada di kategori tersebut." },
        { status: 404 }
      );
    }

    await prisma.kategoriProdukItem.deleteMany({
      where: { kategoriId, produkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /kategori_produk/:kategoriId/items/:produkId error:",
      error
    );
    return NextResponse.json(
      { error: "Gagal menghapus produk dari kategori." },
      { status: 500 }
    );
  }
}
