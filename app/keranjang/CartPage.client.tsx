"use client";

import { useCart } from "@/app/context/CartContext";
import { formatIDR, normalizePublicUrl } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaMinus, FaPlus, FaWhatsapp } from "react-icons/fa6";
import { useState, useEffect } from "react";
import styles from "./keranjang.module.css";
import { useRouter } from "next/navigation";
import SecureImage from "@/app/components/SecureImage";
import { useSettings } from "@/app/context/SettingsContext";

interface CartPageClientProps {
    showPrice?: boolean;
}

// Helper to ensure image URL is correct
// Removed local ensureImageUrl in favor of centralized normalizePublicUrl

export default function CartPageClient({ showPrice = false }: CartPageClientProps) {
    const { waNumber } = useSettings();
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
        let message = `Halo, saya ingin bertanya produk dari Keranjang Belanja:\n\n`;
        items.forEach((item, index) => {
            message += `${index + 1}. *${item.name}* \n`;
            message += `   Jumlah: ${item.quantity}\n`;
            if (showPrice) {
                message += `   Harga: ${formatIDR(item.price)}\n`;
                message += `   Subtotal: ${formatIDR(item.price * item.quantity)}\n`;
            }
            message += `\n`;
        });
        if (showPrice) {
            message += `*Total Belanja: ${formatIDR(totalPrice)}*`;
        }
        const cleanNumber = waNumber.replace(/[^\d]/g, "");
        const url = cleanNumber
            ? `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
            : "#";

        if (cleanNumber) {
            window.open(url, "_blank");
        } else {
            alert("Nomor WhatsApp belum diatur oleh admin.");
        }
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
                                        {normalizePublicUrl(item.image) ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <SecureImage
                                                src={normalizePublicUrl(item.image)!}
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
                                        {showPrice && (
                                            <div className={styles.price}>
                                                {formatIDR(item.price)}
                                            </div>
                                        )}
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
                                    <span className={styles.summaryValue}>
                                        {showPrice ? formatIDR(totalPrice) : "-"}
                                    </span>
                                </div>
                                <div className={`${styles.summaryRow} ${styles.summaryDivider}`}>
                                    <span className={styles.totalLabel}>Total Bayar</span>
                                    <span className={styles.totalPrice}>
                                        {showPrice ? formatIDR(totalPrice) : "-"}
                                    </span>
                                </div>
                            </div>

                            <button onClick={handleCheckout} className={styles.checkoutBtn}>
                                <FaWhatsapp size={28} />
                                {showPrice ? "Checkout Sekarang" : "Tanya Produk Sekarang"}
                            </button>
                            <p className={styles.checkoutNote}>
                                {showPrice
                                    ? "Konfirmasi pesanan langsung via WhatsApp"
                                    : "Konsultasi produk langsung via WhatsApp"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
