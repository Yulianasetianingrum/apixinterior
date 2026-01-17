// app/produk/[slug]/page.tsx
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import styles from "./produk-detail.module.css";
import Navbar from "@/app/navbar/Navbar"; // Import Navbar (server component)
import GlobalFooter from "@/app/components/GlobalFooter";
import { formatIDR, normalizePublicUrl, computeHargaSetelahPromo } from "@/lib/product-utils";
import ProductDetailClient from "@/app/components/product/ProductDetailClient";
import SwipeCarousel from "@/app/components/SwipeCarousel";
import ProductDescription from "@/app/components/product/ProductDescription.client";
import ProductCard from "@/app/components/product/ProductCard.client";
import ProductRecommendations from "@/app/components/product/ProductRecommendations.client";
import { Metadata } from "next";
import { ProductSchema, BreadcrumbSchema } from "@/app/components/seo/StructuredData";

type PageProps = {
  params: Promise<{ slug?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = typeof resolvedParams?.slug === "string" ? decodeURIComponent(resolvedParams.slug) : "";

  if (!slug) {
    return {
      title: "Produk Tidak Ditemukan",
    };
  }

  const produk = await prisma.produk.findUnique({
    where: { slug },
    include: {
      mainImage: true,
    },
  });

  if (!produk) {
    return {
      title: "Produk Tidak Ditemukan",
    };
  }

  const { hargaFinal, isPromo } = computeHargaSetelahPromo(produk as any);
  const price = formatIDR(hargaFinal);
  const imageUrl = produk.mainImage?.url || "/logo/logo_apixinterior_biru.png.png";

  // Generate SEO-friendly description
  const deskripsi = (produk as any).deskripsi || '';
  const description = deskripsi
    ? `${deskripsi.substring(0, 150)}... | ${price} | ${produk.kategori || 'Furniture'} berkualitas dari Apix Interior`
    : `${produk.nama} - ${price}. ${produk.kategori || 'Furniture'} berkualitas dari Apix Interior. Melayani Jakarta dan sekitarnya.`;

  // Generate keywords
  const keywords = [
    produk.nama,
    produk.kategori || 'furniture',
    produk.subkategori || '',
    'furniture',
    'mebel',
    'interior',
    `${produk.kategori} jakarta`,
    `${produk.kategori} murah`,
    'apix interior',
  ].filter(Boolean);

  return {
    title: `${produk.nama} - ${price} | Apix Interior`,
    description,
    keywords,
    openGraph: {
      title: `${produk.nama} | Apix Interior`,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: produk.nama,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${produk.nama} | Apix Interior`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ProdukDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = typeof resolvedParams?.slug === "string" ? decodeURIComponent(resolvedParams.slug) : "";
  if (!slug) return notFound();

  // Fetch product with everything
  const produk = await prisma.produk.findUnique({
    where: { slug },
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
          kombinasi: {
            orderBy: [{ level: "asc" }, { urutan: "asc" }],
            include: { image: true }
          }
        }
      }
    },
  });
  if (!produk) return notFound();

  // TRANSFORM FOR CLIENT (Flatten Image URLs)
  const productForClient = {
    ...produk,
    variasiProduk: produk.variasiProduk.map((v: any) => ({
      ...v,
      imageUrl: normalizePublicUrl(v.mainImage?.url || null),
      kombinasi: v.kombinasi.map((k: any) => ({
        ...k,
        imageUrl: normalizePublicUrl(k.image?.url || null),
      })),
    })),
  };

  // Recommendation 1: "Produk Serupa" (Same Category)
  const similarProducts = produk.kategori ? await prisma.produk.findMany({
    where: {
      kategori: produk.kategori,
      id: { not: produk.id }
    },
    take: 8,
    include: { mainImage: true }
  }) : [];

  // Recommendation 2: "Produk Lainnya" (Random/Latest)
  const otherProducts = await prisma.produk.findMany({
    where: {
      id: { not: produk.id },
      // avoid dupes from similar if possible, but simple is ok
    },
    take: 12,
    orderBy: { createdAt: "desc" },
    include: { mainImage: true }
  });


  // WA Number Logic
  const waRow = await prisma.hubungi.findFirst({
    orderBy: [{ prioritas: "desc" }, { id: "asc" }],
    select: { nomor: true },
  });
  const waNumberRaw = waRow?.nomor ?? "";
  const waNumber = String(waNumberRaw).replace(/[^\d]/g, "");

  const mainImageUrl = normalizePublicUrl(produk.mainImage?.url || null);
  const galleryImageUrls = (produk.galeri || [])
    .map((g: any) => normalizePublicUrl(g.gambar?.url || null))
    .filter((u: any): u is string => !!u);

  // Default Price (if no variation selected)
  const harga = typeof produk.harga === "number" ? produk.harga : 0;

  // Basic Server Action
  async function pesanSekarang() {
    "use server";
    if (!waNumber) redirect(`/produk/${encodeURIComponent(produk.slug)}?error=wa_not_set`);
    const text = `Halo, saya mau pesan produk: ${produk.nama}\nSlug: ${produk.slug}`;
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
    redirect(waUrl);
  }

  const { hargaFinal, isPromo } = computeHargaSetelahPromo(produk as any);

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", color: "#0f172a", fontFamily: "Inter, sans-serif" }}>
      {/* SEO Structured Data */}
      <ProductSchema
        name={produk.nama}
        description={(produk as any).deskripsi || `${produk.nama} - ${produk.kategori || 'Furniture'} berkualitas dari Apix Interior`}
        image={mainImageUrl ? [mainImageUrl, ...galleryImageUrls] : galleryImageUrls}
        sku={produk.slug}
        offers={{
          price: hargaFinal,
          priceCurrency: "IDR",
          availability: "https://schema.org/InStock",
          url: `https://apixinterior.com/produk/${produk.slug}`,
        }}
      />
      <BreadcrumbSchema
        items={[
          { name: "Beranda", url: "https://apixinterior.com" },
          { name: "Produk", url: "https://apixinterior.com/produk" },
          { name: produk.nama, url: `https://apixinterior.com/produk/${produk.slug}` },
        ]}
      />

      {/* 1. Global Navbar */}
      <Navbar />

      <main className={styles.container}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <a href="/">Beranda</a> / <a href="/produk">Produk</a> / <span>{produk.nama}</span>
        </div>


        <ProductDetailClient product={productForClient} />

        <section className={styles.detailSection}>
          <h2 className={styles.sectionTitle}>Detail Lengkap</h2>
          <div className={styles.longDesc}>
            <ProductDescription htmlContent={produk.deskripsiLengkap} />
          </div>

          <div className={styles.specGrid}>
            <div className={styles.specItem}>
              <strong>Satuan</strong>
              <div>{resolveUnitLabel(produk.hargaTipe)}</div>
            </div>
            <div className={styles.specItem}>
              <strong>Material</strong>
              <div>{produk.material || "-"}</div>
            </div>
            <div className={styles.specItem}>
              <strong>Finishing</strong>
              <div>{produk.finishing || "-"}</div>
            </div>
            <div className={styles.specItem}>
              <strong>Estimasi</strong>
              <div>{produk.estimasiPengerjaan || "-"}</div>
            </div>
            {produk.garansi ? (
              <div className={styles.specItem}>
                <strong>Garansi</strong>
                <div>{produk.garansi}</div>
              </div>
            ) : null}
          </div>
        </section>

        {/* Product Recommendations */}
        <ProductRecommendations
          similarProducts={similarProducts}
          otherProducts={otherProducts}
        />

      </main>

      <GlobalFooter />
    </div>
  );
}

// Helper to map hargaTipe to readable label
function resolveUnitLabel(code: string | null | undefined) {
  const s = String(code || "").trim().toUpperCase();
  if (!s || s === "TETAP" || s.includes("MULAI")) return "-";

  if (s === "M2") return "Meter Persegi (m²)";
  if (s === "M") return "Meter Lari (m)";
  if (s === "POINT") return "Titik (per point)";
  if (s === "PCS") return "Pcs (Satuan)";
  if (s === "SERVICE") return "Paket / Jasa";
  // Fallback if custom
  return s;
}
