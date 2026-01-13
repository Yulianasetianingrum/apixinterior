import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const produkList = await prisma.produk.findMany({
      orderBy: { urutan: "asc" },
      include: {
        mainImage: true,
        galeri: {
          orderBy: { urutan: "asc" },
          include: { gambar: true },
        },
        variasiProduk: {
          orderBy: { urutan: "asc" },
          include: {
            mainImage: true,
            galeri: {
              orderBy: { urutan: "asc" },
              include: { gambar: true },
            },
            kombinasi: {
              orderBy: [{ level: "asc" }, { urutan: "asc" }],
              include: { image: true },
            },
          },
        },
      },
    });

    const products = produkList.map((p: any) => {
      const mainImageUrl = p.mainImage ? p.mainImage.url : null;

      const galleryImageUrls: string[] = (p.galeri || [])
        .map((g: any) => g.gambar?.url || null)
        .filter(Boolean) as string[];

      const mediaCount = (mainImageUrl ? 1 : 0) + (galleryImageUrls?.length ?? 0);

      return {
        id: p.id,
        nama: p.nama,
        slug: p.slug,
        kategori: p.kategori,
        subkategori: p.subkategori,
        harga: p.harga,
        promoAktif: p.promoAktif,
        promoTipe: p.promoTipe,
        promoValue: p.promoValue,
        urutan: p.urutan,
        hargaTipe: p.hargaTipe,
        tipeOrder: p.tipeOrder,
        estimasiPengerjaan: p.estimasiPengerjaan,
        deskripsiSingkat: p.deskripsiSingkat,
        panjang: p.panjang,
        lebar: p.lebar,
        tinggi: p.tinggi,
        material: p.material,
        finishing: p.finishing,
        warna: p.warna,
        berat: p.berat,
        jasaPasang: p.jasaPasang,
        isCustom: p.isCustom,
        bisaCustomUkuran: p.bisaCustomUkuran,
        tags: p.tags,
        mainImageUrl,
        galleryImageUrls,
        mediaCount,
        variations:
          p.variasiProduk?.map((v: any) => {
            const vMain = v.mainImage ? v.mainImage.url : null;
            const vGaleri =
              v.galeri?.map((g: any) => g.gambar?.url || null).filter(Boolean) || [];
            const combos = (v.kombinasi || []).map((k: any) => ({
              id: k.id,
              level: k.level,
              nama: k.nama,
              nilai: k.nilai,
              tambahHarga: k.tambahHarga,
              promoAktif: k.promoAktif,
              promoTipe: k.promoTipe,
              promoValue: k.promoValue,
              imageUrl: k.image?.url ?? null,
            }));
            return {
              id: v.id,
              nama: v.nama,
              harga: v.harga,
              priceMode: v.priceMode,
              promoAktif: v.promoAktif,
              promoTipe: v.promoTipe,
              promoValue: v.promoValue,
              imageUrl: vMain,
              galleryUrls: vGaleri,
              combos,
            };
          }) || [],
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("Error daftar produk:", err);
    return NextResponse.json({ error: "Gagal memuat daftar produk" }, { status: 500 });
  }
}
