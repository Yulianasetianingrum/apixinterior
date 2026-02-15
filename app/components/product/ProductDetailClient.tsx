
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { normalizePublicUrl } from "@/lib/product-utils";
import ProductVariationSelector from "./ProductVariationSelector.client";


type WrapperProps = {
    product: any; // Full prisma object
    showPrice?: boolean; // Control price visibility (default: false)
};

export default function ProductDetailClient({ product, showPrice = false }: WrapperProps) {
    const isShowPrice = showPrice === true;
    // Image State
    const [activeImage, setActiveImage] = useState<string | null>(
        product.mainImage?.url ? normalizePublicUrl(product.mainImage.url) : null
    );

    // Gallery List
    const galleryImageUrls = (product.galeri || [])
        .map((g: any) => normalizePublicUrl(g.gambar?.url || null))
        .filter((u: any): u is string => !!u);

    // Track View on Mount
    useEffect(() => {
        const trackView = async () => {
            try {
                await fetch("/api/analytics/product/view", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ produkId: product.id }),
                });
            } catch (err) {
                // ignore silent error
            }
        };
        trackView();
    }, [product.id]);

    // also add main image to list if not there?
    const allImages = [
        product.mainImage?.url ? normalizePublicUrl(product.mainImage.url) : null,
        ...galleryImageUrls
    ].filter(Boolean) as string[];

    // dedupe
    const displayImages = Array.from(new Set(allImages));

    return (
        <div className="product-client-grid">

            {/* LEFT: GALLERY */}
            <section style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
                <div style={{
                    position: "relative", width: "100%", aspectRatio: "3/4",
                    background: "#fff", borderRadius: 16, overflow: "hidden",
                    border: "1px solid #e2e8f0",
                    maxWidth: "500px", margin: "0 auto"
                }}>
                    {activeImage ? (
                        <Image
                            src={activeImage}
                            alt={product.nama}
                            fill
                            priority
                            style={{ objectFit: "contain" }}
                            sizes="(max-width: 900px) 100vw, 50vw"
                            unoptimized
                        />
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8" }}>
                            No Image
                        </div>
                    )}
                </div>

                {/* THUMBS */}
                {displayImages.length > 1 && (
                    <div className="carousel-scroll" style={{
                        display: "flex", // Ensure horizontal layout
                        flexWrap: "nowrap", // Explicitly prevent wrapping
                        maxWidth: "100%",   // Force constraint
                        gap: 12,
                        overflowX: "auto",
                        paddingBottom: 8,
                        scrollSnapType: "x mandatory",
                        scrollbarWidth: "none", // Firefox
                        msOverflowStyle: "none", // IE/Edge
                    }}>
                        {/* Hide scrollbar Webkit */}

                        {displayImages.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveImage(src)}
                                style={{
                                    position: "relative",
                                    aspectRatio: "1/1",
                                    flex: "0 0 70px",
                                    border: src === activeImage ? "2px solid #0b1d3a" : "1px solid #e2e8f0",
                                    borderRadius: 8,
                                    overflow: "hidden",
                                    padding: 0,
                                    cursor: "pointer",
                                    scrollSnapAlign: "start"
                                }}
                            >
                                <Image src={src} alt="" fill style={{ objectFit: "cover" }} unoptimized />
                            </button>
                        ))}
                    </div>
                )}
            </section>


            {/* RIGHT: INFO + SELECTOR */}
            <aside style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                    alignSelf: "start", background: "#f1f5f9", color: "#475569",
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    marginBottom: 12, textTransform: "uppercase"
                }}>
                    {product.kategori || "Produk"}
                </span>

                <h1 style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", margin: "0 0 16px 0", lineHeight: 1.2 }}>
                    {product.nama}
                </h1>

                <div style={{ marginBottom: 16, fontSize: 15, lineHeight: 1.6, color: "#475569" }}>
                    {product.deskripsiSingkat}
                </div>

                {/* SELECTOR handles Price & CTA */}
                <div style={{ marginBlock: 10 }}>
                    <ProductVariationSelector
                        product={product}
                        onImageChange={(url) => setActiveImage(normalizePublicUrl(url))}
                        showPrice={isShowPrice}
                    />
                </div>

                {/* Specs Mini */}
                <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #e2e8f0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, color: "#64748b" }}>
                    {product.panjang && <div>P: {product.panjang}</div>}
                    {product.lebar && <div>L: {product.lebar}</div>}
                    {product.tinggi && <div>T: {product.tinggi}</div>}
                </div>
            </aside>

            {/* CSS for Responsive Grid */}
            <style jsx>{`
            /* Default Grid (Desktop) */
            .product-client-grid {
                display: grid;
                grid-template-columns: minmax(0, 450px) 1fr;
                gap: 40px;
                align-items: start;
            }

            /* Responsive (Mobile/Tablet) */
            @media (max-width: 900px) {
                .product-client-grid {
                    grid-template-columns: 1fr;
                    gap: 30px;
                }
            }

            /* Global Scrollbar Hiding for Carousel */
            /* Hide scrollbar for Chrome, Safari and Opera */
            .carousel-scroll::-webkit-scrollbar {
                display: none;
            }
            /* Hide scrollbar for IE, Edge and Firefox */
            .carousel-scroll {
                -ms-overflow-style: none;  /* IE and Edge */
                scrollbar-width: none;  /* Firefox */
            }
        `}</style>
        </div >
    );
}


