"use client";

import { useState, useMemo, useEffect } from "react";
import { formatIDR, computeHargaSetelahPromo } from "@/lib/product-utils";

type Product = {
    id: number;
    nama: string;
    slug: string;
    harga: number;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
    variasiProduk?: Variation[];
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
    options?: any; // Contains dynamic titles etc
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
};

// Helper: Clean Label (remove internal tags like #123)
const cleanLabel = (text?: string | null) =>
    (text ?? "").replace(/__dedup\d+/gi, "").replace(/#\d+/g, "").trim();

export default function ProductVariationSelector({ product, onImageChange, baseWaNumber }: Props) {
    const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
    const [selectedComboIds, setSelectedComboIds] = useState<Record<number, string | null>>({
        1: null,
        2: null,
        3: null,
    });

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


    // Action: WhatsApp Redirect
    const handlePesan = () => {
        if (!baseWaNumber) return;

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

        const url = `https://wa.me/${baseWaNumber}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    // Get Dynamic Titles from first variation's options (if available)
    const dynamicTitles = useMemo(() => {
        const firstVar = product.variasiProduk?.[0];
        // Type safety for Json
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
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: "#0b1d3a" }}>
                    {formatIDR(finalPriceData.hargaFinal)}
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


            {/* VARIATION SELECTOR */}
            {product.variasiProduk && product.variasiProduk.length > 0 && (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#64748b", marginBottom: 8, textTransform: "uppercase" }}>
                        {dynamicTitles.varTitle}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                                        <img src={thumb} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                                    )}
                                    {label}
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
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
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
                                            <img src={c.imageUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: "cover" }} />
                                        )}
                                        {cleanLabel(c.nilai)}
                                        {/* Show +Price? Admin view shows it implicitly via live price update. Maybe better not clutter UI unless desired. */}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* CTA BUTTON */}
            <div style={{ marginTop: 10 }}>
                <button
                    onClick={handlePesan}
                    disabled={!baseWaNumber}
                    style={{
                        width: "100%",
                        padding: "16px",
                        borderRadius: 12,
                        background: baseWaNumber ? "#D4AF37" : "#cbd5e1", // Golden
                        color: "#020617", // Very Dark Navy
                        fontSize: 16,
                        fontWeight: 700,
                        border: "none",
                        cursor: baseWaNumber ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 12
                    }}
                >
                    {baseWaNumber && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src="/uploads/WA_navy.png"
                            alt="WhatsApp"
                            style={{ width: 24, height: 24, objectFit: "contain" }}
                        />
                    )}
                    <span>Hubungi via WhatsApp</span>
                </button>
                {!baseWaNumber && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#ef4444" }}>
                        Nomor WhatsApp belum diatur oleh Admin.
                    </div>
                )}
            </div>

        </div>
    );
}
