"use client";

import { useCart } from "@/app/context/CartContext";
import { formatIDR } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaMinus, FaPlus, FaWhatsapp } from "react-icons/fa6";
import { useState, useEffect } from "react";
import styles from "./keranjang.module.css";
import { useRouter } from "next/navigation";
import SecureImage from "@/app/components/SecureImage";

interface CartPageClientProps {
    waNumber: string;
}

// Helper to ensure image URL is correct
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

export default function CartPageClient({ waNumber }: CartPageClientProps) {
    const { items, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <div className={styles.pageWrapper}></div>;
    }

    const handleCheckout = () => {
        let message = `Halo, saya ingin memesan dari Keranjang Belanja:\n\n`;
        items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* \n`;
            message += `   Jumlah: ${item.quantity}\n`;
            message += `   Harga: ${formatIDR(item.price)}\n`;
            message += `   Subtotal: ${formatIDR(item.price * item.quantity)}\n\n`;
        });
        message += `*Total Belanja: ${formatIDR(totalPrice)}*`;
        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
        window.open(url, "_blank");
    };

    if (items.length === 0) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🛒</div>
                    <h1 className={styles.emptyTitle}>Keranjang Belanja Kosong</h1>
                    <p className={styles.emptyText}>Anda belum menambahkan produk apapun ke keranjang.</p>
                    <Link href="/produk" className={styles.shopBtn}>
                        Mulai Belanja
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Keranjang Belanja</h1>
                    <p className={styles.subtitle}>{items.length} produk siap untuk checkout</p>
                </div>

                <div className={styles.layout}>
                    <div className={styles.productList}>
                        {items.map((item) => (
                            <div
                                key={`${item.id}-${item.variationId || 'base'}`}
                                className={styles.productCard}
                                onClick={(e) => {
                                    // Prevent navigation if clicking action buttons
                                    if ((e.target as HTMLElement).closest(`.${styles.actions}`)) return;
                                    router.push(`/produk/${item.slug}`);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className={styles.productContent}>
                                    <div className={styles.imageWrapper}>
                                        {ensureImageUrl(item.image) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <SecureImage
                                                src={ensureImageUrl(item.image)!}
                                                alt={item.name}
                                                style={{ width: 50, height: 50, objectFit: "cover", borderRadius: 8 }}
                                            />
                                        ) : (
                                            <div className={styles.noImage}>No Image</div>
                                        )}
                                    </div>

                                    <div className={styles.details}>
                                        <div className={styles.productName}>
                                            {item.name}
                                        </div>
                                        {item.variationName && (
                                            <div className={styles.variation}>
                                                <span className={styles.variationDot}></span>
                                                <span><strong>Variasi:</strong> {item.variationName}</span>
                                            </div>
                                        )}
                                        <div className={styles.price}>
                                            {formatIDR(item.price)}
                                        </div>
                                    </div>

                                    <div className={styles.actions}>
                                        <div className={styles.quantityWrapper}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateQuantity(item.id, item.quantity - 1, item.variationId);
                                                }}
                                                className={styles.quantityBtn}
                                            >
                                                <FaMinus size={14} />
                                            </button>
                                            <div className={styles.quantityDisplay}>
                                                {item.quantity}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    updateQuantity(item.id, item.quantity + 1, item.variationId);
                                                }}
                                                className={styles.quantityBtn}
                                            >
                                                <FaPlus size={14} />
                                            </button>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromCart(item.id, item.variationId);
                                            }}
                                            className={styles.deleteBtn}
                                            aria-label="Hapus"
                                        >
                                            <FaTrash size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className={styles.summaryWrapper}>
                        <div className={styles.summaryCard}>
                            <h2 className={styles.summaryTitle}>Ringkasan Belanja</h2>

                            <div className={styles.summaryContent}>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Subtotal ({items.length} item)</span>
                                    <span className={styles.summaryValue}>{formatIDR(totalPrice)}</span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.summaryDivider}`}>
                                    <span className={styles.totalLabel}>Total Bayar</span>
                                    <span className={styles.totalPrice}>{formatIDR(totalPrice)}</span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} className={styles.checkoutBtn}>
                                <FaWhatsapp size={28} />
                                Checkout Sekarang
                            </button>
                            <p className={styles.checkoutNote}>
                                Konfirmasi pesanan langsung via WhatsApp
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
