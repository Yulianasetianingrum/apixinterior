// app/api/admin/admin_dashboard/admin_galeri/delete_gambar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function parseIdList(value: unknown): number[] {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((x) => Number(String(x).trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function uniqPreserveOrder(ids: number[]): number[] {
  const seen = new Set<number>();
  const out: number[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function computeShiftedMedia(
  mainImageId: number | null,
  galleryImageIdsRaw: unknown,
  deletedImageId: number
): { newMain: number | null; newGallery: number[] } {
  const base: number[] = [];
  if (mainImageId && mainImageId > 0) base.push(mainImageId);
  base.push(...parseIdList(galleryImageIdsRaw));

  const combined = uniqPreserveOrder(base).filter((x) => x !== deletedImageId);

  const newMain = combined.length ? combined[0] : null;
  const newGallery = combined.length > 1 ? combined.slice(1) : [];

  return { newMain, newGallery };
}

async function deletePhysicalFileIfAny(url: string) {
  if (!url?.startsWith("/uploads/")) return;

  const relPath = url.replace(/^\//, "");
  const filePath = path.join(process.cwd(), "public", relPath);

  try {
    await fs.unlink(filePath);
  } catch (e) {
    // file mungkin sudah hilang, tidak masalah
    console.warn("Gagal hapus file fisik (mungkin sudah hilang):", e);
  }
}

type DeleteBody = {
  id?: number;
  // kalau true: semua produk yang memakai gambar ini akan ikut dihapus
  deleteProductsIfReferenced?: boolean;
};

async function handleDeleteImage(
  id: number,
  deleteProductsIfReferenced: boolean
) {
  // simpan URL untuk hapus file fisik setelah transaksi DB sukses
  let gambarUrlToDelete = "";

  const result = await prisma.$transaction(async (tx) => {
    const gambar = await tx.gambarUpload.findUnique({ where: { id } });
    if (!gambar) {
      return { status: 404 as const, json: { error: "Data gambar tidak ditemukan" } };
    }

    gambarUrlToDelete = gambar.url;

    // Relasi skema baru: nullify atau hapus entri pivot yang memakai gambar ini
    const updatedProdukMain = await tx.produk.updateMany({
      where: { mainImageId: id },
      data: { mainImageId: null },
    });

    const deletedProdukGaleri = await tx.produkGaleri.deleteMany({
      where: { gambarId: id },
    });

    const updatedVariasiMain = await tx.variasiProduk.updateMany({
      where: { imageId: id },
      data: { imageId: null },
    });

    const deletedVariasiGaleri = await tx.variasiGaleri.deleteMany({
      where: { gambarId: id },
    });

    const updatedKombinasi = await tx.variasiKombinasi.updateMany({
      where: { imageId: id },
      data: { imageId: null },
    });

    // Optional: jika ingin hapus produk yang kehilangan main image
    if (deleteProductsIfReferenced && updatedProdukMain.count > 0) {
      await tx.produk.deleteMany({ where: { mainImageId: null } });
    }

    await tx.gambarUpload.delete({ where: { id } });

    return {
      status: 200 as const,
      json: {
        success: true,
        updatedProdukMain: updatedProdukMain.count,
        deletedProdukGaleri: deletedProdukGaleri.count,
        updatedVariasiMain: updatedVariasiMain.count,
        deletedVariasiGaleri: deletedVariasiGaleri.count,
        updatedKombinasi: updatedKombinasi.count,
      },
    };
  });

  if (result.status === 200) {
    await deletePhysicalFileIfAny(gambarUrlToDelete);
  }

  return NextResponse.json(result.json, { status: result.status });
}

// ====== FRONTEND SAAT INI PAKE POST { id } ======
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as DeleteBody;
    const id = typeof body.id === "number" ? body.id : Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });
    }

    const cascade = body.deleteProductsIfReferenced === true;

    return await handleDeleteImage(id, cascade);
  } catch (err) {
    console.error("Delete gambar error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat hapus" },
      { status: 500 }
    );
  }
}

// ====== OPTIONAL: support DELETE ?id=123 (biar fleksibel) ======
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idRaw = searchParams.get("id");
    const id = idRaw ? Number(idRaw) : NaN;

    const cascadeRaw = searchParams.get("deleteProductsIfReferenced");
    const cascade = cascadeRaw === "1" || cascadeRaw === "true";

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID wajib ada" }, { status: 400 });
    }

    return await handleDeleteImage(id, cascade);
  } catch (err) {
    console.error("Delete gambar error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat hapus" },
      { status: 500 }
    );
  }
}
