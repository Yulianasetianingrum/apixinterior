"use client";

import { useWishlist } from "@/app/context/WishlistContext";
import { useCart } from "@/app/context/CartContext";
import { formatIDR, normalizePublicUrl } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaHeart, FaCartShopping, FaTrash } from "react-icons/fa6";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import styles from "./favorite.module.css";
import SecureImage from "@/app/components/SecureImage";

// Helper to ensure image URL is correct
// Removed local ensureImageUrl in favor of centralized normalizePublicUrl

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
                        <div
                            key={item.id}
                            className={styles.productCard}
                            onClick={(e) => {
                                // Prevent navigation if clicking action buttons (though stopPropagation handles it, this is extra safety)
                                if ((e.target as HTMLElement).closest(`.${styles.actions}`)) return;
                                router.push(`/produk/${item.slug}`);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.productContent}>
                                <div className={styles.imageWrapper}>
                                    {normalizePublicUrl(item.image) ? (
                                        <SecureImage
                                            src={normalizePublicUrl(item.image)!}
                                            alt={item.name}
                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>No Img</div>
                                    )}
                                </div>
                                <div className={styles.details}>
                                    <div className={styles.productName}>
                                        {item.name}
                                    </div>
                                    <div className={styles.price}>
                                        {formatIDR(item.price)}
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        className={`${styles.actionBtn} ${styles.cartBtn}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(item);
                                        }}
                                        title="Tambah ke Keranjang"
                                    >
                                        <FaCartShopping />
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromWishlist(item.id);
                                        }}
                                        title="Hapus"
                                    >
                                        <FaTrash />
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
