"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaCartShopping, FaHeart, FaRegHeart, FaWhatsapp } from "react-icons/fa6";
import styles from "./ProductCard.module.css";
import { formatIDR, normalizePublicUrl, computeHargaSetelahPromo } from "@/lib/product-utils";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";

interface ProductCardProps {
    product: any;
    index: number;
}

export default function ProductCard({ product: pRaw, index }: ProductCardProps) {
    const p = pRaw as any;
    const router = useRouter();
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isLiked = isInWishlist(p.id);
    const [showToast, setShowToast] = useState(false);

    // Removed useEffect local storage logic as it's handled in provider now

    // Calculate best price and discount
    const baseCalc = computeHargaSetelahPromo({
        harga: p.harga,
        promoAktif: p.promoAktif,
        promoTipe: p.promoTipe,
        promoValue: p.promoValue
    });

    let bestPriceInfo = {
        final: baseCalc.hargaFinal,
        original: baseCalc.hargaAsli,
        isPromo: baseCalc.isPromo,
        discountPct: baseCalc.isPromo && baseCalc.hargaAsli > 0
            ? Math.round(((baseCalc.hargaAsli - baseCalc.hargaFinal) / baseCalc.hargaAsli) * 100)
            : 0
    };

    // Check variations for best discount
    if (p.variasiProduk && p.variasiProduk.length > 0) {
        p.variasiProduk.forEach((v: any) => {
            const vHarga = v.harga && v.harga > 0 ? v.harga : p.harga;
            const useVarPromo = (v.harga && v.harga > 0) || (v.promoAktif && (v.promoValue ?? 0) > 0);
            const promoSource = useVarPromo ? v : p;

            const vCalc = computeHargaSetelahPromo({
                harga: vHarga,
                promoAktif: promoSource.promoAktif,
                promoTipe: promoSource.promoTipe,
                promoValue: promoSource.promoValue
            });

            const vDiscountPct = vCalc.isPromo && vCalc.hargaAsli > 0
                ? Math.round(((vCalc.hargaAsli - vCalc.hargaFinal) / vCalc.hargaAsli) * 100)
                : 0;

            if (vDiscountPct > bestPriceInfo.discountPct) {
                bestPriceInfo = {
                    final: vCalc.hargaFinal,
                    original: vCalc.hargaAsli,
                    isPromo: true,
                    discountPct: vDiscountPct
                };
            }
        });
    }

    const imageUrl = normalizePublicUrl(p.mainImage?.url);

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist({
            id: p.id,
            slug: p.slug,
            name: p.nama,
            image: imageUrl,
            price: bestPriceInfo.final
        });
    };

    const { addToCart } = useCart();

    const handleCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const priceToUse = bestPriceInfo.final;

        addToCart({
            id: p.id,
            slug: p.slug,
            name: p.nama,
            price: priceToUse,
            image: imageUrl,
        });

        // Show toast notification
        setShowToast(true);

        // Redirect to cart after short delay
        setTimeout(() => {
            router.push('/keranjang');
        }, 800);
    };

    const handleContact = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const message = `Halo, saya tertarik dengan produk: ${p.nama}`;
        const waUrl = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
        window.open(waUrl, "_blank");
    };

    return (
        <div className={styles.card}>
            <Link href={`/produk/${p.slug}`} className={styles.imageLink}>
                <div className={styles.imageWrapper}>
                    {bestPriceInfo.isPromo && bestPriceInfo.discountPct > 0 && (
                        <div className={styles.badge}>
                            {bestPriceInfo.discountPct}%
                        </div>
                    )}
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={p.nama}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            priority={index < 4}
                        />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#ccc" }}>
                            No Image
                        </div>
                    )}

                    {/* Action Buttons Overlay */}
                    <div className={styles.actions}>
                        <button
                            className={styles.likeBtn}
                            onClick={handleLike}
                            aria-label={isLiked ? "Unlike" : "Like"}
                        >
                            {isLiked ? <FaHeart fill="#dc2626" /> : <FaRegHeart />}
                        </button>
                        <button
                            className={styles.cartBtn}
                            onClick={handleCart}
                            aria-label="Add to cart"
                        >
                            <FaCartShopping />
                        </button>
                    </div>
                </div>
            </Link>

            <div className={styles.cardBody}>
                <Link href={`/produk/${p.slug}`} className={styles.productName}>
                    {p.nama}
                </Link>

                <div className={styles.priceContainer}>
                    <div className={styles.finalPrice}>
                        {formatIDR(bestPriceInfo.final)}
                    </div>
                    {bestPriceInfo.isPromo && bestPriceInfo.original > bestPriceInfo.final && (
                        <div className={styles.originalPrice}>
                            {formatIDR(bestPriceInfo.original)}
                        </div>
                    )}
                </div>

                {/* Contact Button */}
                <button className={styles.contactBtn} onClick={handleContact}>
                    <FaWhatsapp size={16} />
                    Hubungi Kami
                </button>
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className={styles.toast}>
                    ✓ Ditambahkan ke keranjang!
                </div>
            )}
        </div>
    );
}
