
import Navbar from "@/app/navbar/Navbar";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import styles from "./page.module.css";
import { computeHargaSetelahPromo } from "@/lib/product-utils";
import PromoCountdown from "./PromoCountdown";

export const dynamic = "force-dynamic";

function formatRupiah(num: number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
}

export default async function PromoPage({
    searchParams,
}: {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // 0. Fetch Page Config
    // DEBUG: Check available models
    // console.log("Prisma Models:", Object.keys(prisma).filter(k => !k.startsWith('_')));

    const sp = await searchParams;
    const categorySlug = typeof sp?.kategori === "string" ? sp.kategori : null;

    let config = null;

    // Safety check just in case legacy client is loaded
    if ((prisma as any).promoPageConfig) {
        config = await prisma.promoPageConfig.findFirst({ where: { id: 1 } });
    } else {
        console.warn("WARN: prisma.promoPageConfig is missing. New migration? RESTART SERVER to fix.");
    }

    // Default config if not exists
    if (!config) {
        config = {
            id: 1,
            heroTitle: "Luxury Flash Sale",
            heroSubtitle: "Kesempatan eksklusif memiliki furnitur premium dengan penawaran harga terbaik. Berlaku hingga stok habis.",
            flashSaleEnd: null,
            vouchers: [],
            createdAt: new Date(), updatedAt: new Date()
        };
    }

    const vouchers = Array.isArray(config.vouchers) ? config.vouchers : [];

    // Filter Logic
    // 0.6 Fetch Promoted Categories (isPromo = true)
    // Only if not filtering by specific category (because if filtering, we show everything anyway)
    let globalPromotedCategoryIds: number[] = [];
    if (!categorySlug) {
        const promotedCats = await prisma.kategoriProduk.findMany({
            where: { isPromo: true },
            select: { id: true }
        });
        globalPromotedCategoryIds = promotedCats.map(c => c.id);
    }

    // Filter Logic
    const whereClause: any = {};

    if (categorySlug) {
        // If Category is selected: Show ALL products in that category
        whereClause.kategoriProdukItems = {
            some: {
                kategori: {
                    slug: categorySlug
                }
            }
        };
    } else {
        // Default: Show "Active Promo" items OR items in "Promoted Categories"
        if (globalPromotedCategoryIds.length > 0) {
            whereClause.OR = [
                { promoAktif: true },
                {
                    kategoriProdukItems: {
                        some: {
                            kategoriId: { in: globalPromotedCategoryIds }
                        }
                    }
                }
            ];
        } else {
            whereClause.promoAktif = true;
        }

        // Legacy fallback only if really needed (optional, keeping it clean for now)
        // whereClause.OR.push(...)
        // But let's stick to the new logic requested: "promo product" OR "product in promo category"
    }

    // 0.5 Fetch Active Category Name
    let activeCategoryName = "";
    if (categorySlug) {
        const cat = await prisma.kategoriProduk.findFirst({
            where: { slug: categorySlug },
            select: { nama: true }
        });
        if (cat) activeCategoryName = cat.nama;
    }

    // 1. Fetch Promo Products
    const promoProducts = await prisma.produk.findMany({
        where: whereClause,
        include: {
            mainImage: true,
            kategoriProdukItems: {
                include: { kategori: true }
            }
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className={styles.pageWrapper}>
            <Navbar />

            {/* SECTION 1: HERO FLASH SALE */}
            <section className={styles.heroSection}>
                <div className={styles.heroBgPattern} />
                <div className={styles.heroContent}>
                    <div className={styles.heroEyebrow}>LIMITED TIME OFFER</div>
                    <h1 className={styles.heroTitle} dangerouslySetInnerHTML={{
                        __html: config.heroTitle.replace(/(Flash Sale)/i, "<span class='" + styles.heroHighlight + "'>$1</span>")
                    }} />
                    <p className={styles.heroSubtitle}>
                        {config.heroSubtitle}
                    </p>

                    <PromoCountdown targetDate={config.flashSaleEnd} />
                </div>
            </section>

            <div className={styles.container}>
                {/* SECTION 2: VOUCHER CLAIM */}
                {vouchers.length > 0 && !categorySlug && (
                    <section className={styles.voucherSection}>
                        <div className={styles.voucherGrid}>
                            {vouchers.map((v: any, i: number) => (
                                <div key={i} className={styles.voucherCard}>
                                    <div className={styles.voucherTop}>
                                        <div className={styles.voucherValue}>{v.value}</div>
                                        <div className={styles.voucherLabel}>{v.label}</div>
                                        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>{v.min}</div>
                                    </div>
                                    <div className={styles.voucherBottom}>
                                        <div className={styles.voucherCode}>{v.code}</div>
                                        <button className={styles.voucherBtn}>Klaim</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 3: PRODUCT GRID */}
                <section className={styles.productSection}>
                    <div className={styles.sectionHeader}>
                        <div>
                            <h2 className={styles.sectionTitle}>
                                {activeCategoryName
                                    ? (activeCategoryName.toLowerCase().startsWith("promo") ? activeCategoryName : `Promo ${activeCategoryName}`)
                                    : "Penawaran Spesial"}
                            </h2>
                            {activeCategoryName && (
                                <div style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                                    Menampilkan {promoProducts.length} produk untuk kategori ini
                                </div>
                            )}
                        </div>

                        {activeCategoryName && (
                            <Link href="/promo" className={styles.viewAllBtn} style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: "50px",
                                border: "1px solid #ddd",
                                fontSize: 13,
                                textDecoration: "none",
                                color: "#333",
                                background: "#fff"
                            }}>
                                <span>✕ Hapus Filter</span>
                            </Link>
                        )}
                    </div>

                    {promoProducts.length > 0 ? (
                        <div className={styles.prodGrid}>
                            {promoProducts.map((p: any) => {
                                const promoData = computeHargaSetelahPromo(p as any);
                                const hasDiscount = promoData.isPromo && (promoData.hargaFinal ?? 0) < p.harga;
                                const discountPct =
                                    p.promoTipe === "persen"
                                        ? p.promoValue
                                        : Math.round(((p.harga - (promoData.hargaFinal ?? 0)) / p.harga) * 100);

                                return (
                                    <Link href={`/produk/${p.slug}`} key={p.id} className={styles.prodCard}>
                                        <div className={styles.prodImageWrap}>
                                            {hasDiscount ? (
                                                <div className={styles.prodDiscountBadge}>-{discountPct}%</div>
                                            ) : (
                                                /* Show HOT DEALS if included via Category Promo but no specific discount */
                                                <div className={styles.prodDiscountBadge} style={{ background: "#ff9800" }}>HOT DEALS</div>
                                            )}
                                            {p.mainImage ? (
                                                <Image
                                                    src={p.mainImage.url}
                                                    alt={p.nama}
                                                    fill
                                                    className={styles.prodImage}
                                                />
                                            ) : (
                                                <div style={{ width: "100%", height: "100%", background: "#f1f5f9" }} />
                                            )}
                                        </div>
                                        <div className={styles.prodInfo}>
                                            <div className={styles.prodCategory}>{p.kategori || "Furniture"}</div>
                                            <h3 className={styles.prodName}>{p.nama}</h3>

                                            <div className={styles.prodPricing}>
                                                {hasDiscount && (
                                                    <div className={styles.originalPrice}>
                                                        {formatRupiah(p.harga)}
                                                    </div>
                                                )}
                                                <div className={styles.finalPrice}>
                                                    {formatRupiah(hasDiscount ? promoData.hargaFinal ?? p.harga : p.harga)}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            Maaf, belum ada produk promo saat ini.
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
