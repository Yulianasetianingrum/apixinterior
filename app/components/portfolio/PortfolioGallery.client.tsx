"use client";

import Image from "next/image";
import { FaInstagram } from "react-icons/fa6";
import { useSettings } from "@/app/context/SettingsContext";

// Real Instagram Posts from @apix_interior
// Last updated: January 10, 2026
const INSTAGRAM_POST_URLS = [
    "https://www.instagram.com/p/DNXxw1-xZKg/",
    "https://www.instagram.com/p/C0YH2EuRRZg/",
    "https://www.instagram.com/p/C0Tb6VEL2mH/",
    "https://www.instagram.com/p/DSe6UjaEal8/",
    "https://www.instagram.com/p/DQQROG3EsQt/",
    "https://www.instagram.com/p/DQBKaf9EeKz/",
    "https://www.instagram.com/p/DP8aptUEaqh/",
    "https://www.instagram.com/p/DNnUIQyRYBS/",
    "https://www.instagram.com/p/DNiE9ZYRfZ8/",
    "https://www.instagram.com/p/DNg5ad3xfge/",
    "https://www.instagram.com/p/DNeUs52RFC6/",
    "https://www.instagram.com/p/DNfgLS3Rbf2/",
];

interface PortfolioGalleryProps {
    initialImages?: any[];
}

export default function PortfolioGallery({ initialImages = [] }: PortfolioGalleryProps) {
    const { waNumber } = useSettings();
    const cleanNumber = waNumber.replace(/[^\d]/g, "");
    const waText = encodeURIComponent("Halo Apix Interior, saya tertarik dengan portofolio Anda");
    const waUrl = cleanNumber ? `https://wa.me/${cleanNumber}?text=${waText}` : "#";

    return (
        <section>
            {/* Simple Title */}
            <h1 style={{
                textAlign: "center",
                marginBottom: "40px",
                fontSize: "2.5rem",
                fontWeight: "800",
                color: "#0b1b3b"
            }}>
                Portofolio Kami
            </h1>

            {/* Content Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: initialImages.length > 0
                    ? "repeat(auto-fill, minmax(300px, 1fr))" // DB Images
                    : "repeat(auto-fill, minmax(320px, 1fr))", // Instagram Embeds
                gap: "20px",
                justifyContent: "center",
                marginBottom: "60px"
            }}>
                {initialImages.length > 0 ? (
                    // Mode 1: Database Images
                    initialImages.map((img, index) => (
                        <div key={img.id || index} style={{
                            position: "relative",
                            aspectRatio: "3/4", // Portrait aspect ratio standard for interior photos
                            borderRadius: "12px",
                            overflow: "hidden",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                            background: "#f5f5f5"
                        }}>
                            <Image
                                src={img.url}
                                alt={img.title || "Portfolio Apix Interior"}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                style={{ objectFit: "cover" }}
                                loading={index < 3 ? "eager" : "lazy"} // Priority first 3 images
                                priority={index < 3}
                            />
                        </div>
                    ))
                ) : (
                    // Mode 2: Fallback to Instagram Embeds (Legacy)
                    INSTAGRAM_POST_URLS.map((url, index) => {
                        const cleanUrl = url.split("?")[0].replace(/\/$/, "");
                        const embedUrl = `${cleanUrl}/embed`;

                        return (
                            <div key={index} style={{
                                display: "flex",
                                justifyContent: "center",
                                transition: "transform 0.2s ease",
                            }}>
                                <iframe
                                    src={embedUrl}
                                    width="100%"
                                    height="400"
                                    style={{
                                        border: "none",
                                        borderRadius: "12px",
                                        maxWidth: "100%",
                                        overflow: "hidden",
                                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)"
                                    }}
                                    scrolling="no"
                                    frameBorder="0"
                                />
                            </div>
                        );
                    })
                )}
            </div>

            {/* View More / Contact Button */}
            <div style={{ textAlign: "center", marginTop: "40px" }}>
                <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#0b1b3b",
                        color: "white",
                        padding: "14px 32px",
                        borderRadius: "99px",
                        fontWeight: "700",
                        textDecoration: "none",
                        fontSize: "16px",
                        boxShadow: "0 4px 15px rgba(11, 27, 59, 0.3)",
                        transition: "transform 0.2s, box-shadow 0.2s"
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(11, 27, 59, 0.4)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(11, 27, 59, 0.3)";
                    }}
                >
                    Hubungi Kami untuk Konsultasi
                </a>
            </div>
        </section>
    );
}
