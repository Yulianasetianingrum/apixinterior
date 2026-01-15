"use client";

import { useState, useEffect, useRef } from "react";
import ProductCard from "@/app/components/product/ProductCard.client";

interface RecommendationsProps {
    similarProducts: any[];
    otherProducts: any[];
}

export default function ProductRecommendations({ similarProducts, otherProducts }: RecommendationsProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(4);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Calculate items per view based on screen size
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) {
                setItemsPerView(1); // Mobile
            } else if (width < 1024) {
                setItemsPerView(3); // Tablet
            } else {
                setItemsPerView(4); // Desktop
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const totalSlides = Math.max(0, Math.ceil(similarProducts.length - itemsPerView) + 1);

    // Auto scroll functionality
    useEffect(() => {
        if (similarProducts.length <= itemsPerView) return;

        const startAutoScroll = () => {
            autoScrollRef.current = setInterval(() => {
                setCurrentSlide((prev) => {
                    const next = prev + 1;
                    return next >= totalSlides ? 0 : next;
                });
            }, 4000);
        };

        startAutoScroll();

        return () => {
            if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        };
    }, [similarProducts.length, itemsPerView, totalSlides]);

    const resetAutoScroll = () => {
        if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        autoScrollRef.current = setInterval(() => {
            setCurrentSlide((prev) => {
                const next = prev + 1;
                return next >= totalSlides ? 0 : next;
            });
        }, 4000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
        resetAutoScroll();
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
        resetAutoScroll();
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
        resetAutoScroll();
    };

    // Touch/Mouse drag handlers
    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        setStartX(pageX);
        if (carouselRef.current) {
            setScrollLeft(carouselRef.current.scrollLeft);
        }
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
        const walk = (pageX - startX) * 2;
        if (carouselRef.current) {
            carouselRef.current.scrollLeft = scrollLeft - walk;
        }
    };

    const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        const pageX = "changedTouches" in e ? e.changedTouches[0].pageX : (e as React.MouseEvent).pageX;
        const diff = pageX - startX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
    };

    // If both are empty, then return null
    if (similarProducts.length === 0 && otherProducts.length === 0) return null;

    return (
        <>
            {/* RECOMMENDATIONS: SIMILAR - Carousel */}
            {similarProducts.length > 0 && (
                <section style={{ marginBottom: "60px" }}>
                    <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>
                        Produk Serupa
                    </h3>
                    <div style={{ position: "relative" }}>
                        {/* Carousel Container */}
                        <div
                            ref={carouselRef}
                            className="carousel-container"
                            onMouseDown={handleDragStart}
                            onMouseMove={handleDragMove}
                            onMouseUp={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                            style={{
                                overflow: "hidden",
                                position: "relative",
                                cursor: isDragging ? "grabbing" : "grab",
                                userSelect: "none"
                            }}
                        >
                            <div
                                className="carousel-track"
                                style={{
                                    display: "flex",
                                    transition: isDragging ? "none" : "transform 0.5s ease-in-out",
                                    transform: `translateX(-${currentSlide * (100 / itemsPerView)}%)`,
                                }}
                            >
                                {similarProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="carousel-item"
                                        style={{
                                            flex: `0 0 ${100 / itemsPerView}%`,
                                            padding: "0 12px",
                                            boxSizing: "border-box"
                                        }}
                                    >
                                        <ProductCard product={product} index={index} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        {similarProducts.length > itemsPerView && (
                            <>
                                <button
                                    onClick={prevSlide}
                                    disabled={currentSlide === 0}
                                    className="carousel-arrow carousel-arrow-left"
                                    style={{
                                        position: "absolute",
                                        left: "-20px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "50%",
                                        background: "white",
                                        border: "2px solid #e2e8f0",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        transition: "all 0.3s ease",
                                        zIndex: 10,
                                        opacity: currentSlide === 0 ? 0.5 : 1
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                                <button
                                    onClick={nextSlide}
                                    disabled={currentSlide >= totalSlides - 1}
                                    className="carousel-arrow carousel-arrow-right"
                                    style={{
                                        position: "absolute",
                                        right: "-20px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "48px",
                                        height: "48px",
                                        borderRadius: "50%",
                                        background: "white",
                                        border: "2px solid #e2e8f0",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        transition: "all 0.3s ease",
                                        zIndex: 10,
                                        opacity: currentSlide >= totalSlides - 1 ? 0.5 : 1
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            </>
                        )}

                        {/* Indicators */}
                        {similarProducts.length > itemsPerView && totalSlides > 1 && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    gap: "8px",
                                    marginTop: "24px"
                                }}
                            >
                                {Array.from({ length: totalSlides }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => goToSlide(index)}
                                        style={{
                                            width: currentSlide === index ? "32px" : "12px",
                                            height: "12px",
                                            borderRadius: "6px",
                                            background: currentSlide === index ? "#0f172a" : "#cbd5e1",
                                            border: "none",
                                            cursor: "pointer",
                                            transition: "all 0.3s ease"
                                        }}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Responsive Styles */}
                        <style jsx>{`
                        @media (max-width: 1024px) {
                            .carousel-arrow {
                                width: 40px !important;
                                height: 40px !important;
                            }
                            .carousel-arrow-left {
                                left: -16px !important;
                            }
                            .carousel-arrow-right {
                                right: -16px !important;
                            }
                        }
                        @media (max-width: 640px) {
                            .carousel-arrow {
                                width: 36px !important;
                                height: 36px !important;
                            }
                            .carousel-arrow-left {
                                left: 0 !important;
                            }
                            .carousel-arrow-right {
                                right: 0 !important;
                            }
                        }
                        .carousel-arrow:hover:not(:disabled) {
                            background: #f8fafc !important;
                            border-color: #0f172a !important;
                            transform: translateY(-50%) scale(1.05);
                        }
                        .carousel-arrow:disabled {
                            cursor: not-allowed;
                        }
                    `}</style>
                    </div>
                </section>

            {/* RECOMMENDATIONS: OTHERS - 2 Columns on Mobile */}
            <section style={{ marginBottom: "60px" }}>
                <h3 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>
                    Produk Lainnya
                </h3>
                <div
                    className="other-products-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                        gap: "24px"
                    }}
                >
                    {otherProducts.map((product, index) => (
                        <ProductCard key={product.id} product={product} index={index} />
                    ))}
                </div>
                <style jsx>{`
                    @media (max-width: 768px) {
                        .other-products-grid {
                            grid-template-columns: repeat(2, 1fr) !important;
                            gap: 12px !important;
                        }
                    }
                `}</style>
            </section>
        </>
    );
}
