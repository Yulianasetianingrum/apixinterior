"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import ProductCard from "./ProductCard.client";
import { computeHargaSetelahPromo } from "@/lib/product-utils";

interface ProductGridProps {
    products: any[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const searchParams = useSearchParams();

    const selectedCategories = searchParams.get("kategori")?.split(",").filter(Boolean) || [];
    const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const minPrice = parseInt(searchParams.get("minHarga") || "0");
    const maxPrice = parseInt(searchParams.get("maxHarga") || "999999999");
    const discountFilter = parseInt(searchParams.get("diskon") || "0");
    const sortBy = searchParams.get("sort") || "";

    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        if (selectedCategories.length > 0) {
            filtered = filtered.filter(p => selectedCategories.includes(p.kategori));
        }

        if (selectedTags.length > 0) {
            filtered = filtered.filter(p => {
                const productTags = p.tags?.split(",").map((t: string) => t.trim()) || [];
                return selectedTags.some(tag => productTags.includes(tag));
            });
        }

        filtered = filtered.filter(p => {
            return p.harga >= minPrice && p.harga <= maxPrice;
        });

        if (discountFilter > 0) {
            filtered = filtered.filter(p => {
                if (!p.promoAktif) return false;
                const calc = computeHargaSetelahPromo({
                    harga: p.harga,
                    promoAktif: p.promoAktif,
                    promoTipe: p.promoTipe,
                    promoValue: p.promoValue
                });
                const discountPct = calc.isPromo && calc.hargaAsli > 0
                    ? Math.round(((calc.hargaAsli - calc.hargaFinal) / calc.hargaAsli) * 100)
                    : 0;
                return discountPct >= discountFilter;
            });
        }

        if (sortBy === "price-asc") {
            filtered.sort((a, b) => a.harga - b.harga);
        } else if (sortBy === "price-desc") {
            filtered.sort((a, b) => b.harga - a.harga);
        } else if (sortBy === "discount-desc") {
            filtered.sort((a, b) => {
                const getDiscount = (p: any) => {
                    const calc = computeHargaSetelahPromo({
                        harga: p.harga,
                        promoAktif: p.promoAktif,
                        promoTipe: p.promoTipe,
                        promoValue: p.promoValue
                    });
                    return calc.isPromo ? Math.round(((calc.hargaAsli - calc.hargaFinal) / calc.hargaAsli) * 100) : 0;
                };
                return getDiscount(b) - getDiscount(a);
            });
        }

        return filtered;
    }, [products, selectedCategories, selectedTags, minPrice, maxPrice, discountFilter, sortBy]);

    if (filteredProducts.length === 0) {
        return (
            <div style={{ padding: "80px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    Tidak Ada Produk Ditemukan
                </h3>
                <p style={{ color: "#64748b", fontSize: 16 }}>
                    Coba ubah filter Anda untuk menemukan produk lain.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="product-count" style={{ marginBottom: 20, color: "#64748b", fontSize: 14 }}>
                Menampilkan {filteredProducts.length} produk
            </div>

            <div className="product-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "24px"
            }}>
                {filteredProducts.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                ))}
            </div>

            <style jsx>{`
                @media (max-width: 968px) {
                    .product-count {
                        padding-left: 8px;
                    }

                    .product-grid {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 0 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        width: 100%;
                    }
                }
                @media (min-width: 969px) and (max-width: 1024px) {
                    .product-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 16px !important;
                    }
                }
            `}</style>
        </>
    );
}
