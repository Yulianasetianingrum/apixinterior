// app/api/admin/admin_dashboard/admin_produk/kategori_produk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// ======================================================
// Helper: generate slug unik TANPA query ke database
// ======================================================
function generateSlug(nama: string) {
  const base = nama
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // buang char aneh
    .replace(/\s+/g, "-") // spasi → -
    .replace(/-+/g, "-") // normalize ---
    .replace(/^-|-$/g, ""); // trim -

  const rand1 = Date.now().toString(36).slice(-4);
  const rand2 = Math.random().toString(36).substring(2, 6);
  return `${base || "kategori"}-${rand1}${rand2}`;
}

// ======================================================
// GET — Ambil semua kategori (dengan produk di dalamnya)
// ======================================================
export async function GET(_req: NextRequest) {
  try {
    const kategoriList = await prisma.kategoriProduk.findMany({
      orderBy: { urutan: "asc" },
      include: {
        items: {
          orderBy: { urutan: "asc" },
          include: { produk: true },
        },
      },
    });

    // Ambil semua mainImageId unik dari produk
    const ids = new Set<number>();
    for (const cat of kategoriList) {
      for (const item of cat.items) {
        const p: any = item.produk;
        if (p?.mainImageId) ids.add(p.mainImageId as number);
      }
    }

    let imageMap = new Map<number, string>();
    if (ids.size) {
      const imgRows = await prisma.gambarUpload.findMany({
        where: { id: { in: Array.from(ids) } },
        select: { id: true, url: true },
      });
      imageMap = new Map(imgRows.map((img: any) => [img.id, img.url]));
    }

    const categories = kategoriList.map((cat: any) => ({
      id: cat.id,
      nama: cat.nama,
      slug: cat.slug,
      urutan: cat.urutan,
      isUnggulan: !!(cat as any).isUnggulan,
      isPromo: !!(cat as any).isPromo,
      items: cat.items.map((item: any) => {
        const p: any = item.produk;
        const url =
          p?.mainImageId && imageMap.has(p.mainImageId)
            ? imageMap.get(p.mainImageId)!
            : null;

        return {
          id: p?.id,
          nama: p?.nama,
          harga: p?.harga,
          promoAktif: !!p?.promoAktif,
          promoTipe: p?.promoTipe ?? null,
          promoValue: p?.promoValue ?? null,
          mainImageUrl: url,
          kategori: p?.kategori ?? null,
          subkategori: p?.subkategori ?? null,
          deskripsiSingkat: p?.deskripsiSingkat ?? null,
          tags: p?.tags ?? null,
        };
      }),
    }));

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("GET /kategori_produk ERROR:", err);
    return NextResponse.json(
      { error: "Gagal memuat kategori." },
      { status: 500 }
    );
  }
}

// ======================================================
// POST — Buat kategori baru
// body: { nama: string, slug?: string, urutan?: number, isUnggulan?: boolean, isPromo?: boolean }
// ======================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body.nama !== "string") {
      return NextResponse.json(
        { error: "Field 'nama' wajib diisi." },
        { status: 400 }
      );
    }

    const nama = body.nama.trim();
    if (!nama) {
      return NextResponse.json(
        { error: "Nama kategori tidak boleh kosong." },
        { status: 400 }
      );
    }

    const slug =
      typeof body.slug === "string" && body.slug.trim()
        ? body.slug.trim()
        : generateSlug(nama);

    const isUnggulan = !!body.isUnggulan;
    const isPromo = !!body.isPromo;

    let urutan: number;
    if (typeof body.urutan === "number" && Number.isFinite(body.urutan)) {
      urutan = Math.max(0, Math.floor(body.urutan));
    } else {
      const agg = await prisma.kategoriProduk.aggregate({
        _min: { urutan: true },
      });
      // Place at the top (smaller than current min)
      urutan = (agg._min.urutan ?? 0) - 1;
    }

    const created = await prisma.kategoriProduk.create({
      data: {
        nama,
        slug,
        urutan,
        // field lama
        isUnggulan,
        // field baru
        isPromo,
      } as any,
    });

    return NextResponse.json({ kategori: created });
  } catch (err: any) {
    console.error("POST /kategori_produk ERROR:", err);

    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Slug kategori sudah dipakai, coba nama lain." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          typeof err?.message === "string"
            ? err.message
            : "Gagal membuat kategori.",
      },
      { status: 500 }
    );
  }
}
