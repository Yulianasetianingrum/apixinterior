"use client";

import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/CartContext";
import { formatIDR } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaCartShopping } from "react-icons/fa6";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./favorite.module.css";
import SecureImage from "@/app/components/SecureImage";

// Helper to ensure image URL is correct
const ensureImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    let clean = String(url).trim();
    if (!clean) return null;

    // Passthrough data/blob
    if (clean.startsWith("data:") || clean.startsWith("blob:")) return clean;

    // Robust handling for /uploads/ (strip any localhost/domain prefix)
    const uploadIdx = clean.indexOf("/uploads/");
    if (uploadIdx !== -1) {
        return clean.substring(uploadIdx);
    }

    // Trust other absolute URLs (external CDNs)
    if (clean.startsWith("http")) return clean;

    // Clean local paths
    clean = clean.replace(/^public\//, "").replace(/^\/+/, "");
    return `/${clean}`;
};

export default function FavoritePageClient() {
    const { items, removeFromWishlist } = useWishlist();
    // ... (rest of hook usage)
    const { addToCart } = useCart();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const lastAddTimeRef = useRef<number>(0);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className={styles.pageWrapper}></div>;
    }

    const handleAddToCart = (item: any) => {
        // ... (existing handleAddToCart logic)
        const now = Date.now();
        console.log('handleAddToCart called - last:', lastAddTimeRef.current, 'now:', now, 'diff:', now - lastAddTimeRef.current);

        // Prevent duplicate calls within 1 second
        if (now - lastAddTimeRef.current < 1000) {
            console.log('BLOCKED - too soon! (within 1 second)');
            return;
        }

        lastAddTimeRef.current = now;
        console.log('Adding to cart:', item.name);

        addToCart({
            id: item.id,
            slug: item.slug,
            name: item.name,
            price: item.price,
            image: item.image || "",
        });

        // Redirect to cart page
        setTimeout(() => {
            console.log('Redirecting to cart...');
            router.push('/keranjang');
        }, 500);
    };

    if (items.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>❤</div>
                <h1 className={styles.emptyTitle}>Favorite Kosong</h1>
                <p className={styles.emptyText}>Anda belum menyukai produk apapun.</p>
                <Link href="/produk" className={styles.shopBtn}>
                    Cari Produk
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <FaHeart className={styles.heartIcon} size={28} />
                        Produk Favorite
                    </h1>
                    <p className={styles.subtitle}>{items.length} produk yang Anda sukai</p>
                </div>

                <div className={styles.productGrid}>
                    {items.map((item) => (
                        <div key={item.id} className={styles.productCard}>
                            <div className={styles.productContent}>
                                <div className={styles.imageWrapper}>
                                    {ensureImageUrl(item.image) ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <SecureImage
                                            src={ensureImageUrl(item.image)!}
                                            alt={item.name}
                                            className="favorite-product-image"
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>No Image</div>
                                    )}
                                </div>

                                <div className={styles.details}>
                                    <Link href={`/produk/${item.slug}`} className={styles.productName}>
                                        {item.name}
                                    </Link>
                                    <div className={styles.price}>
                                        {formatIDR(item.price)}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        onClick={() => removeFromWishlist(item.id)}
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        aria-label="Hapus dari Favorite"
                                    >
                                        <FaHeart size={20} />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleAddToCart(item);
                                        }}
                                        className={`${styles.actionBtn} ${styles.cartBtn}`}
                                        title="Tambah ke Keranjang"
                                    >
                                        <FaCartShopping size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
