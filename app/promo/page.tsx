
import Navbar from "@/app/navbar/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { computeHargaSetelahPromo } from "@/lib/product-utils";

export const dynamic = "force-dynamic";

function formatRupiah(num: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

export default async function PromoPage() {
    // 1. Fetch Promo Categories
    const promoCategories = await prisma.kategoriProduk.findMany({
        where: { isPromo: true },
        orderBy: { urutan: "asc" },
        include: {
            items: {
                take: 1,
                include: {
                    produk: {
                        include: { mainImage: true },
                    },
                },
            },
        },
    });

    // 2. Fetch Promo Products (Individual products marked as promo)
    const promoProducts = await prisma.produk.findMany({
        where: {
            promoAktif: true,
            // Ensure product has basic valid data
            OR: [{ kategori: { not: null } }, { subkategori: { not: null } }],
        },
        include: {
            mainImage: true,
        },
        orderBy: { createdAt: "desc" },
        take: 50, // Limit to 50 for now
    });

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <Navbar />

                <header className={styles.header}>
                    <h1 className={styles.title}>
                        Spesial <span>Promo</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Penawaran terbatas untuk furniture pilihan dengan harga terbaik.
                        Jangan sampai kehabisan!
                    </p>
                </header>

                {/* SECTION 1: PROMO CATEGORIES */}
                {promoCategories.length > 0 && (
                    <section className={styles.section}>
                        <div className={styles.sectionTitle}>Kategori Pilihan</div>
                        <div className={styles.catGrid}>
                            {promoCategories.map((cat) => {
                                const bgImage =
                                    cat.items[0]?.produk?.mainImage?.url || "/placeholder-image.jpg";
                                return (
                                    <Link
                                        href={`/kategori/${cat.slug}`}
                                        key={cat.id}
                                        className={styles.catCard}
                                    >
                                        <div className={styles.catImage}>
                                            <Image
                                                src={bgImage}
                                                alt={cat.nama}
                                                fill
                                                style={{ objectFit: "cover" }}
                                            />
                                            <div className={styles.overlay} />
                                        </div>
                                        <div className={styles.catContent}>
                                            <div className={styles.catLabel}>Promo Spesial</div>
                                            <div className={styles.catName}>{cat.nama}</div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* SECTION 2: PROMO PRODUCTS */}
                <section className={styles.section}>
                    <div className={styles.sectionTitle}>Produk Diskon</div>
                    {promoProducts.length > 0 ? (
                        <div className={styles.prodGrid}>
                            {promoProducts.map((p) => {
                                const promoData = computeHargaSetelahPromo(p as any);
                                const hasDiscount =
                                    promoData.isPromo && (promoData.hargaFinal ?? 0) < p.harga;

                                return (
                                    <Link
                                        href={`/produk/${p.slug}`}
                                        key={p.id}
                                        className={styles.prodCard}
                                    >
                                        <div className={styles.prodImageWrap}>
                                            {hasDiscount && (
                                                <div className={styles.prodBadge}>
                                                    {p.promoTipe === "persen"
                                                        ? `-${p.promoValue}%`
                                                        : "PROMO"}
                                                </div>
                                            )}
                                            {p.mainImage ? (
                                                <Image
                                                    src={p.mainImage.url}
                                                    alt={p.nama}
                                                    fill
                                                    style={{ objectFit: "cover" }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        background: "#eee",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        color: "#999",
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.prodContent}>
                                            <h3 className={styles.prodName}>{p.nama}</h3>
                                            <div className={styles.prodPriceRow}>
                                                {hasDiscount && (
                                                    <div className={styles.originalPrice}>
                                                        {formatRupiah(p.harga)}
                                                    </div>
                                                )}
                                                <div className={styles.finalPrice}>
                                                    {formatRupiah(
                                                        hasDiscount
                                                            ? promoData.hargaFinal ?? p.harga
                                                            : p.harga
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            Belum ada produk promo saat ini.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
