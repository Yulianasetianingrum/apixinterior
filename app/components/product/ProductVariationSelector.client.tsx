"use client";

import { useState, useMemo, useEffect } from "react";
import { formatIDR, computeHargaSetelahPromo, normalizePublicUrl } from "@/lib/product-utils";
import { useCart } from "@/app/context/CartContext";
import { useWishlist } from "@/app/context/WishlistContext";
import SecureImage from "@/app/components/SecureImage";
import { useSettings } from "@/app/context/SettingsContext";

type Product = {
    id: number;
    nama: string;
    slug: string;
    harga: number;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
    hargaTipe?: string | null; // Added unit field
    variasiProduk?: Variation[];
    mainImage?: { url: string } | null; // Added for cart image fallback
    gambar?: { url: string } | null;      // Fallback 2
};

type Variation = {
    id: number;
    nama: string;
    harga: number;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
    imageUrl?: string | null;
    kombinasi?: Kombinasi[];
    options?: { unitOverride?: string } & any; // Typed options
};

type Kombinasi = {
    id: number;
    level: number;
    nama: string;
    nilai: string;
    tambahHarga: number | null;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
    imageUrl?: string | null;
    urutan?: number;
};

type Props = {
    product: Product;
    onImageChange?: (url: string) => void;
    baseWaNumber?: string;
    showPrice?: boolean;
};

// Helper: Clean Label (remove internal tags like #123)
const cleanLabel = (text?: string | null) =>
    (text ?? "").replace(/__dedup\d+/gi, "").replace(/#\d+/g, "").trim();

// Helper: Format Unit Symbol (same as Admin)
function unitSymbolShort(u: string | null | undefined) {
    const s = String(u || "").trim();
    if (!s || s === "tetap") return ""; // 'tetap' usually implies no specific unit shown or 'fixed'

    // Validate: Don't show numeric/promo status as unit
    const lower = s.toLowerCase();
    if (lower === "mulai_dari" || lower === "mulai dari") return "";

    const up = s.toUpperCase();
    if (up === "M2") return "/ m²";
    if (up === "M3") return "/ m³";
    if (up === "CM2") return "/ cm²";
    if (up === "CM3") return "/ cm³";
    if (up === "MM2") return "/ mm²";
    if (up === "MM3") return "/ mm³";
    if (up === "M") return "/ m";
    if (up === "LARI") return "/ m'"; // lari often denoted as m'
    return `/ ${lower}`;
}

export default function ProductVariationSelector({ product, onImageChange, showPrice = false }: Props) {
    const isShowMainPrice = showPrice === true;
    const hasVariations = Array.isArray(product.variasiProduk) && product.variasiProduk.length > 0;
    const shouldShowTopPrice = isShowMainPrice || hasVariations;
    const { waNumber } = useSettings();
    const { addToCart } = useCart();
    const { isInWishlist, toggleWishlist } = useWishlist();

    const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
    const [selectedComboIds, setSelectedComboIds] = useState<Record<number, string | null>>({
        1: null,
        2: null,
        3: null,
    });
    const [addedToCartFeedback, setAddedToCartFeedback] = useState(false);

    // Init: Select first variation on mount
    useEffect(() => {
        if (product.variasiProduk && product.variasiProduk.length > 0) {
            const first = product.variasiProduk[0];
            setSelectedVarId(first.id);
        }
    }, [product]);

    // Derived: Current Variation
    const currentVar = useMemo(() => {
        return product.variasiProduk?.find((v) => v.id === selectedVarId) || null;
    }, [product, selectedVarId]);

    // Derived: Unit Display
    const displayUnit = useMemo(() => {
        // 1. Check variation override
        if (currentVar?.options?.unitOverride) {
            return unitSymbolShort(currentVar.options.unitOverride);
        }
        // 2. Fallback to product default
        return unitSymbolShort(product.hargaTipe);
    }, [currentVar, product.hargaTipe]);

    // Derived: Combos grouped by Level for current variation
    const currentCombosByLevel = useMemo(() => {
        const map: Record<number, Kombinasi[]> = { 1: [], 2: [], 3: [] };
        if (!currentVar?.kombinasi) return map;

        currentVar.kombinasi.forEach((c) => {
            const lvl = c.level as number; // ensure type
            if (!map[lvl]) map[lvl] = [];
            map[lvl].push(c);
        });
        return map;
    }, [currentVar]);

    // Logic: Auto-select first combo if not selected or invalid
    useEffect(() => {
        if (!currentVar) return;

        setSelectedComboIds((prev) => {
            const next = { ...prev };
            [1, 2, 3].forEach((lvl: any) => {
                const list = currentCombosByLevel[lvl] || [];
                if (!list.length) {
                    next[lvl] = null;
                    return;
                }

                const currentChoice = prev[lvl];
                // Verify if current choice exists in new list
                const exists = list.some(c => String(c.id) === String(currentChoice));

                if (!exists) {
                    next[lvl] = String(list[0].id); // Default to first
                }
            });
            return next;
        });
    }, [currentVar, currentCombosByLevel]);


    // Logic: Update Image on Selection
    // We expose onImageChange to parent to update main image
    const handleFocusImage = (url?: string | null) => {
        if (url && onImageChange) {
            onImageChange(url);
        }
    }


    // Logic: Compute Final Price
    const finalPriceData = useMemo(() => {
        // 1. Base Price (From Variation OR Product)
        const baseProductPromo = computeHargaSetelahPromo({
            harga: product.harga,
            promoAktif: product.promoAktif,
            promoTipe: product.promoTipe,
            promoValue: product.promoValue
        });

        if (!currentVar) return baseProductPromo;

        // Variation Base
        const hasVarHarga = currentVar.harga && Number(currentVar.harga) > 0;
        const varPromoOn = !!currentVar.promoAktif && Number(currentVar.promoValue ?? 0) > 0;
        const useVarPromo = hasVarHarga || varPromoOn;

        const baseHarga = hasVarHarga ? Number(currentVar.harga) : Number(product.harga);
        // Source of Promo: Variation or Product
        const promoSource = useVarPromo ? currentVar : product;

        const baseCalc = computeHargaSetelahPromo({
            harga: baseHarga,
            promoAktif: promoSource.promoAktif,
            promoTipe: promoSource.promoTipe,
            promoValue: promoSource.promoValue
        });


        let totalAsli = baseCalc.hargaAsli;
        let totalFinal = baseCalc.hargaFinal;

        // 2. Add Combos
        [1, 2, 3].forEach((lvl: any) => {
            const cid = selectedComboIds[lvl];
            if (!cid) return;
            const list = currentCombosByLevel[lvl] || [];
            const found = list.find(c => String(c.id) === String(cid));
            if (!found) return;

            const addBase = Number(found.tambahHarga) || 0;
            // Combo Promo?
            const addCalc = computeHargaSetelahPromo({
                harga: addBase,
                promoAktif: found.promoAktif,
                promoTipe: found.promoTipe,
                promoValue: found.promoValue
            });

            totalAsli += addCalc.hargaAsli;
            totalFinal += addCalc.hargaFinal;
        });

        totalFinal = Math.max(0, totalFinal);
        const isPromo = totalFinal < totalAsli;
        const promoPct = isPromo && totalAsli > 0 ? Math.round((1 - totalFinal / totalAsli) * 100) : 0;
        const promoLabel = isPromo && promoPct > 0 ? `-${promoPct}%` : baseCalc.promoLabel;

        return {
            hargaAsli: totalAsli,
            hargaFinal: totalFinal,
            isPromo,
            promoLabel
        };
    }, [product, currentVar, selectedComboIds, currentCombosByLevel]);


    // Build Variation Label String
    const getVariationLabel = () => {
        if (!currentVar) return "";
        let label = cleanLabel(currentVar.nama);
        const comboParts: string[] = [];

        [1, 2, 3].forEach((lvl: any) => {
            const cid = selectedComboIds[lvl];
            if (!cid) return;
            const list = currentCombosByLevel[lvl] || [];
            const found = list.find(c => String(c.id) === String(cid));
            if (found) {
                comboParts.push(cleanLabel(found.nama || found.nilai));
            }
        });

        if (comboParts.length > 0) {
            label += ` (${comboParts.join(", ")})`;
        }
        return label;
    };

    // Action: Add to Cart
    const handleAddToCart = () => {
        const item = {
            id: product.id,
            slug: product.slug,
            name: product.nama,
            price: finalPriceData.hargaFinal,
            image: normalizePublicUrl(currentVar?.imageUrl || product.mainImage?.url || product.gambar?.url || null),
            variationId: currentVar?.id,
            variationName: getVariationLabel()
        };
        addToCart(item);

        // Feedback
        setAddedToCartFeedback(true);
        setTimeout(() => setAddedToCartFeedback(false), 2000);
    };

    // Action: Toggle Wishlist
    const handleWishlist = () => {
        toggleWishlist({
            id: product.id,
            slug: product.slug,
            name: product.nama,
            price: finalPriceData.hargaFinal,
            image: normalizePublicUrl(product.mainImage?.url || null) // Usually wishlist is just the product, not specific variation
        });
    };

    const inWishlist = isInWishlist(product.id);


    // Action: WhatsApp Redirect
    const handlePesan = () => {
        if (!waNumber) return;

        // Track Click (Non-blocking)
        try {
            fetch("/api/analytics/product/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ produkId: product.id }),
                keepalive: true
            }).catch(() => { });
        } catch { }

        // Construct Message
        let text = `Halo, saya mau pesan produk: *${product.nama}*\n`;
        text += `Slug: ${product.slug}\n`;

        if (currentVar) {
            text += `Variasi: ${cleanLabel(currentVar.nama)}\n`;
            [1, 2, 3].forEach((lvl: any) => {
                const cid = selectedComboIds[lvl];
                if (!cid) return;
                const list = currentCombosByLevel[lvl] || [];
                const found = list.find(c => String(c.id) === String(cid));
                if (found) {
                    text += `- ${cleanLabel(found.nama || found.nilai)}\n`;
                }
            });
        }

        text += `\nEstimasi Harga: ${formatIDR(finalPriceData.hargaFinal)}`;
        if (displayUnit) text += ` ${displayUnit}`; // Include unit in WA message too

        const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Get Dynamic Titles
    const dynamicTitles = useMemo(() => {
        const firstVar = product.variasiProduk?.[0];
        const opts = (firstVar?.options as any)?.titles || {};
        return {
            varTitle: opts.varTitle || "Variasi",
            lv1Title: opts.lv1Title || "Pilihan",
            lv2Title: opts.lv2Title || "Kombinasi",
            lv3Title: opts.lv3Title || "Opsi"
        };
    }, [product.variasiProduk]);


    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* PRICE DISPLAY */}
            {shouldShowTopPrice && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "#0b1d3a" }}>
                        {formatIDR(finalPriceData.hargaFinal)}
                        {displayUnit && <span style={{ fontSize: 16, fontWeight: 500, color: "#64748b", marginLeft: 4 }}>{displayUnit}</span>}
                    </div>
                    {finalPriceData.isPromo && (
                        <>
                            <div style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: 14 }}>
                                {formatIDR(finalPriceData.hargaAsli)}
                            </div>
                            <div style={{ background: "#fee2e2", color: "#ef4444", fontSize: 12, fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>
                                {finalPriceData.promoLabel}
                            </div>
                        </>
                    )}
                </div>
            )}


            {/* VARIATION SELECTOR */}
            {product.variasiProduk && product.variasiProduk.length > 0 && (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
                        {dynamicTitles.varTitle}
                    </div>
                    <div className="var-grid">
                        {product.variasiProduk.map(v => {
                            const isSel = selectedVarId === v.id;
                            const label = cleanLabel(v.nama);
                            const thumb = v.imageUrl;

                            return (
                                <button
                                    key={v.id}
                                    onClick={() => {
                                        setSelectedVarId(v.id);
                                        handleFocusImage(thumb);
                                    }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 6,
                                        padding: "6px 14px",
                                        borderRadius: 8,
                                        border: `1px solid ${isSel ? "#0b1d3a" : "#e2e8f0"}`,
                                        background: isSel ? "#0b1d3a" : "#fff",
                                        color: isSel ? "#fff" : "#1e293b",
                                        cursor: "pointer",
                                        fontSize: 14,
                                        fontWeight: 500
                                    }}
                                >
                                    {thumb && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <SecureImage src={thumb} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                                    )}
                                    <span>{label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* COMBINATION SELECTOR */}
            {currentVar && [1, 2, 3].map((lvl: any) => {
                const list = currentCombosByLevel[lvl] || [];
                if (!list.length) return null;

                // Determine Title: Use custom title if available, otherwise fallback
                let sectionTitle = "";
                if (lvl === 1) sectionTitle = dynamicTitles.lv1Title;
                else if (lvl === 2) sectionTitle = dynamicTitles.lv2Title;
                else if (lvl === 3) sectionTitle = dynamicTitles.lv3Title;

                return (
                    <div key={lvl}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
                            {sectionTitle}
                        </div>
                        <div className="var-grid">
                            {list.map(c => {
                                const isActive = String(selectedComboIds[lvl]) === String(c.id);
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedComboIds(prev => ({ ...prev, [lvl]: String(c.id) }));
                                            if (c.imageUrl) handleFocusImage(c.imageUrl);
                                        }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 6,
                                            minHeight: 36,
                                            padding: "6px 14px",
                                            borderRadius: 8,
                                            border: `1px solid ${isActive ? "#0b1d3a" : "#e2e8f0"}`,
                                            background: isActive ? "#0b1d3a" : "#fff",
                                            color: isActive ? "#fff" : "#1e293b",
                                            cursor: "pointer",
                                            fontSize: 14
                                        }}
                                    >
                                        {c.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <SecureImage src={c.imageUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                                        )}
                                        <span>{cleanLabel(c.nilai)}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* ACTIONS: WISHLIST, CART, WA (One Row) */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "stretch" }}>
                {/* Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    title={inWishlist ? "Hapus dari Favorit" : "Tambah ke Favorit"}
                    style={{
                        flex: "0 0 44px", // Fixed square
                        height: "44px",
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        background: inWishlist ? "#fee2e2" : "#fff",
                        color: inWishlist ? "#ef4444" : "#64748b",
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20" height="20"
                        viewBox="0 0 24 24"
                        fill={inWishlist ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round"
                    >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>

                {/* Add to Cart Button (Icon Only) */}
                <button
                    onClick={handleAddToCart}
                    title="Tambah ke Keranjang"
                    style={{
                        flex: "0 0 44px", // Fixed square like Wishlist
                        height: "44px",
                        borderRadius: 12,
                        background: addedToCartFeedback ? "#22c55e" : "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.3s",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        padding: 0
                    }}
                >
                    {addedToCartFeedback ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    )}
                </button>

                {/* CTA BUTTON WA */}
                <button
                    onClick={handlePesan}
                    disabled={!waNumber}
                    style={{
                        flex: "1 1 auto", // Takes remaining space
                        height: "44px",
                        padding: "0 12px",
                        borderRadius: 12,
                        background: waNumber ? "#D4AF37" : "#cbd5e1", // Golden
                        color: "#020617", // Very Dark Navy
                        fontWeight: 700,
                        fontSize: "14px", // Readable size
                        border: "none",
                        cursor: waNumber ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}
                >
                    {waNumber && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <SecureImage
                            src="/uploads/WA_navy.png"
                            alt=""
                            style={{ flexShrink: 0, width: 20, height: 20, objectFit: "contain" }}
                        />
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>Hubungi via WhatsApp</span>
                </button>
            </div>

            {/* Notice for details (below buttons) */}
            <div>
                {!waNumber && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>
                        Nomor WhatsApp belum diatur oleh Admin.
                    </div>
                )}
                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b", fontStyle: "italic", textAlign: "left" }}>
                    Mohon baca deskripsi untuk detail.
                </div>
            </div>

            <style jsx>{`
                .var-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                }
                .var-grid > button {
                    width: 100%;
                    justify-content: flex-start; /* Keep image and text aligned left */
                }
                @media (min-width: 640px) {
                    .var-grid {
                        display: flex;
                        flex-wrap: wrap;
                    }
                    .var-grid > button {
                        width: auto; /* Reset for desktop flex */
                    }
                }
            `}</style>
        </div>
    );
}
