"use client";

import React, { useRef, useState, useEffect } from "react";
import { FaStar, FaQuoteLeft } from "react-icons/fa";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa6";

interface Review {
    author_name: string;
    rating: number;
    text: string;
    relative_time_description?: string;
    profile_photo_url?: string;
    url?: string;
}

interface TestimonialConfig {
    title?: string;
    subtitle?: string;
    reviews?: Review[];
    sectionTheme?: string;    // Affects CARDS only
    sectionBgTheme?: string;  // Affects SECTION BG only
}

export default function TestimonialCarousel({ config }: { config: TestimonialConfig }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const reviews = Array.isArray(config?.reviews) ? config.reviews : [];

    // --- 1. RESOLVE SECTION BACKGROUND (Independent) ---
    // Options: NAVY, GOLD, WHITE
    const bgToken = (config.sectionBgTheme || "NAVY").toUpperCase();

    // Apix Brand Colors
    const BRAND_NAVY = "#0b1f3b";
    const BRAND_GOLD = "#d4af37";
    const BRAND_WHITE = "#ffffff";
    const BRAND_TEXT_DARK = "#0f172a";

    let sectionBg = BRAND_NAVY;
    let sectionText = BRAND_WHITE;

    if (bgToken === "GOLD") {
        sectionBg = BRAND_GOLD;
        sectionText = BRAND_TEXT_DARK;
    } else if (bgToken === "WHITE") {
        sectionBg = BRAND_WHITE;
        sectionText = BRAND_TEXT_DARK;
    } else {
        // NAVY (Default)
        sectionBg = BRAND_NAVY;
        sectionText = BRAND_WHITE;
    }

    // --- 2. RESOLVE CARD THEME (Independent) ---
    // Options: NAVY_GOLD, WHITE_GOLD, NAVY_WHITE, GOLD_NAVY, GOLD_WHITE, WHITE_NAVY
    // Format: CARD_BG + TEXT_COLOR
    const getCardStyles = (theme?: string) => {
        const safeTheme = (theme || "NAVY_GOLD").toUpperCase();

        switch (safeTheme) {
            case "NAVY_GOLD":
                return {
                    bg: BRAND_NAVY,
                    text: BRAND_GOLD,
                    subtext: "rgba(255,255,255,0.6)",
                    border: "rgba(212, 175, 55, 0.3)", // Gold border
                    accent: BRAND_GOLD,
                    activeRing: "rgba(212, 175, 55, 0.6)"
                };
            case "NAVY_WHITE":
                return {
                    bg: BRAND_NAVY,
                    text: BRAND_WHITE,
                    subtext: "rgba(255,255,255,0.6)",
                    border: "rgba(255,255,255,0.2)",
                    accent: BRAND_WHITE,
                    activeRing: "rgba(255,255,255,0.5)"
                };
            case "WHITE_GOLD":
                return {
                    bg: BRAND_WHITE,
                    text: BRAND_GOLD, // Text is Gold? Or Text Dark with Gold Accent? 
                    // User said: "Warna 2 itu khusus teks". So WHITE_GOLD -> Text GOLD.
                    subtext: "#64748b",
                    border: "#fcd34d", // amber-300
                    accent: BRAND_GOLD,
                    activeRing: "#fcd34d"
                };
            case "WHITE_NAVY":
                return {
                    bg: BRAND_WHITE,
                    text: BRAND_NAVY,
                    subtext: "#64748b",
                    border: "rgba(11, 31, 59, 0.15)",
                    accent: BRAND_NAVY,
                    activeRing: BRAND_NAVY
                };
            case "GOLD_NAVY":
                return {
                    bg: BRAND_GOLD,
                    text: BRAND_NAVY,
                    subtext: "rgba(11, 31, 59, 0.7)",
                    border: "rgba(11, 31, 59, 0.2)",
                    accent: BRAND_NAVY,
                    activeRing: BRAND_NAVY
                };
            case "GOLD_WHITE":
                return {
                    bg: BRAND_GOLD,
                    text: BRAND_WHITE,
                    subtext: "rgba(255, 255, 255, 0.8)",
                    border: "rgba(255,255,255,0.4)",
                    accent: BRAND_WHITE,
                    activeRing: BRAND_WHITE
                };
            default:
                // Fallback NAVY_GOLD
                return {
                    bg: BRAND_NAVY,
                    text: BRAND_GOLD,
                    subtext: "rgba(255,255,255,0.6)",
                    border: "rgba(212, 175, 55, 0.3)",
                    accent: BRAND_GOLD,
                    activeRing: "rgba(212, 175, 55, 0.6)"
                };
        }
    };

    const cardStyle = getCardStyles(config.sectionTheme);

    // Styling constants
    const ARROW_COLOR = sectionText; // Arrows adapt to section background, not card
    const HEADLINE_COLOR = sectionText;

    // Fallback if no reviews
    if (reviews.length === 0) {
        return (
            <section style={{ backgroundColor: sectionBg, color: sectionText, padding: "60px 0", width: "100%" }}>
                <div style={{ padding: "0 20px", textAlign: "center" }}>
                    {config.title && <h2 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "8px", color: HEADLINE_COLOR }}>{config.title}</h2>}
                    <div style={{
                        padding: "40px",
                        fontSize: "14px",
                        fontStyle: "italic",
                        borderRadius: "12px",
                        border: `1px dashed ${sectionText}`,
                        opacity: 0.5
                    }}>
                        Belum ada ulasan yang ditampilkan.
                    </div>
                </div>
            </section>
        );
    }

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;
        const children = container.children;
        let closestIndex = 0;
        let minDiff = Infinity;
        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            const childCenter = child.offsetLeft + child.offsetWidth / 2;
            const diff = Math.abs(childCenter - center);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }
        setActiveIndex(closestIndex);
    };

    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        container.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
    }, [reviews]);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const nextIndex = direction === "left" ? Math.max(0, activeIndex - 1) : Math.min(reviews.length - 1, activeIndex + 1);
        const children = scrollRef.current.children;
        const targetChild = children[nextIndex] as HTMLElement;
        if (targetChild) {
            const containerCenter = scrollRef.current.clientWidth / 2;
            const childCenter = targetChild.offsetLeft + targetChild.offsetWidth / 2;
            scrollRef.current.scrollTo({ left: childCenter - containerCenter, behavior: "smooth" });
        }
    };

    return (
        <section style={{ backgroundColor: sectionBg, color: sectionText, padding: "64px 0", width: "100%", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ padding: "0 24px", marginBottom: "40px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", maxWidth: "1200px", marginInline: "auto" }}>
                <div>
                    {config.title && (
                        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "12px", color: HEADLINE_COLOR, lineHeight: 1.2 }}>
                            {config.title}
                        </h2>
                    )}
                    {config.subtitle && (
                        <p style={{ fontSize: "15px", maxWidth: "560px", lineHeight: 1.6, opacity: 0.8, margin: 0 }}>
                            {config.subtitle}
                        </p>
                    )}
                </div>

                {/* Arrows */}
                <div style={{ display: "flex", gap: "12px" }} className="arrows-desktop-only">
                    <button
                        onClick={() => scroll("left")}
                        disabled={activeIndex === 0}
                        style={{
                            width: "48px", height: "48px", borderRadius: "50%",
                            border: `1px solid ${ARROW_COLOR}`,
                            background: "transparent",
                            color: ARROW_COLOR,
                            opacity: activeIndex === 0 ? 0.3 : 1,
                            cursor: activeIndex === 0 ? "not-allowed" : "pointer",
                            display: "grid", placeItems: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={activeIndex === reviews.length - 1}
                        style={{
                            width: "48px", height: "48px", borderRadius: "50%",
                            border: `1px solid ${ARROW_COLOR}`,
                            background: "transparent",
                            color: ARROW_COLOR,
                            opacity: activeIndex === reviews.length - 1 ? 0.3 : 1,
                            cursor: activeIndex === reviews.length - 1 ? "not-allowed" : "pointer",
                            display: "grid", placeItems: "center",
                            transition: "all 0.2s"
                        }}
                    >
                        <FaChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Carousel */}
            <div style={{ position: "relative", width: "100%" }}>
                <div
                    ref={scrollRef}
                    className="no-scrollbar"
                    style={{
                        display: "flex",
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                        gap: "0",
                        paddingBottom: "48px",
                        paddingTop: "20px",
                        alignItems: "center",
                        paddingLeft: "calc(50vw - 140px)",
                        paddingRight: "calc(50vw - 140px)"
                    }}
                >
                    {reviews.map((review, idx) => {
                        const isActive = idx === activeIndex;
                        const scale = isActive ? 1 : 0.9;
                        const opacity = isActive ? 1 : 0.5;

                        return (
                            <div
                                key={idx}
                                style={{
                                    scrollSnapAlign: "center",
                                    flexShrink: 0,
                                    width: "280px",
                                    margin: "0 12px",
                                    transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
                                    transform: `scale(${scale})`,
                                    opacity: opacity,
                                    zIndex: isActive ? 10 : 0,
                                    position: "relative"
                                }}
                                className="carousel-item"
                            >
                                <div style={{
                                    backgroundColor: cardStyle.bg,
                                    color: cardStyle.text,
                                    border: `1px solid ${cardStyle.border}`,
                                    borderRadius: "24px",
                                    padding: "32px",
                                    display: "flex", flexDirection: "column",
                                    height: "100%", minHeight: "360px",
                                    boxShadow: isActive ? "0 20px 40px -12px rgba(0,0,0,0.25)" : "0 4px 12px rgba(0,0,0,0.05)",
                                    position: "relative",
                                    cursor: review.url ? "pointer" : "default",
                                    textDecoration: "none"
                                }}
                                    onClick={() => {
                                        if (review.url) window.open(review.url, "_blank");
                                    }}
                                >
                                    {/* Quote Icon */}
                                    <div style={{ position: "absolute", top: "24px", right: "24px", opacity: 0.15, color: cardStyle.accent }}>
                                        <FaQuoteLeft size={48} />
                                    </div>

                                    {/* Stars */}
                                    <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} size={16} color={i < (review.rating || 5) ? cardStyle.accent : "rgba(128,128,128,0.3)"} />
                                        ))}
                                    </div>

                                    {/* Text */}
                                    <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "32px", position: "relative", flex: 1, color: cardStyle.text }}>
                                        "{review.text}"
                                    </p>

                                    {/* Author */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "auto", borderTop: `1px solid ${cardStyle.border}`, paddingTop: "24px" }}>
                                        {(() => {
                                            const avatarUrl = review.profile_photo_url
                                                || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.author_name || "AN")}&background=d4af37&color=0b1f3b&size=128&bold=true`;

                                            return (
                                                <img
                                                    src={avatarUrl}
                                                    alt={review.author_name}
                                                    style={{
                                                        width: "48px",
                                                        height: "48px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        backgroundColor: "#f1f5f9",
                                                        border: `2px solid ${cardStyle.border}`
                                                    }}
                                                />
                                            );
                                        })()}
                                        <div>
                                            <div style={{ fontSize: "16px", fontWeight: "bold", color: cardStyle.text }}>{review.author_name || "Pelanggan"}</div>
                                            <div style={{ fontSize: "12px", color: cardStyle.subtext }}>{review.relative_time_description || "Pelanggan Terverifikasi"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx>{`
                /* Hide Scrollbar */
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                /* Desktop & Tablet: Max 5 cards visible, proper spacing from edges */
                @media (min-width: 768px) {
                    .carousel-item { 
                        width: 340px !important; 
                        margin: 0 16px !important; 
                    }
                    .no-scrollbar { 
                        padding-left: calc(50vw - 170px) !important; 
                        padding-right: calc(50vw - 170px) !important; 
                    }
                }
                
                /* Mobile: Optimized for single card view */
                @media (max-width: 767px) {
                   .arrows-desktop-only { display: none !important; }
                   .carousel-item { 
                       width: 85vw !important; 
                       margin: 0 8px !important; 
                   }
                   .no-scrollbar { 
                       padding-left: calc(50vw - 42.5vw - 8px) !important; 
                       padding-right: calc(50vw - 42.5vw - 8px) !important; 
                   }
                }
            `}</style>
        </section>
    );
}
