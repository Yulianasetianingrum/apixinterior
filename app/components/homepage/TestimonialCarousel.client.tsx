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
}

interface TestimonialConfig {
    title?: string;
    subtitle?: string;
    reviews?: Review[];
    sectionTheme?: string;
}

export default function TestimonialCarousel({ config }: { config: TestimonialConfig }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const reviews = Array.isArray(config?.reviews) ? config.reviews : [];

    // Fallback if no reviews
    if (reviews.length === 0) {
        // Theme Logic for Empty State
        const simpleTheme = config.sectionTheme === "NAVY_GOLD" ? "bg-[#0f172a] text-white" :
            config.sectionTheme === "GOLD_NAVY" ? "bg-amber-50 text-slate-900" :
                "bg-white text-gray-900";

        return (
            <section className={`py-12 w-full ${simpleTheme}`}>
                <div className="px-4 text-center">
                    {config.title && <h2 className="text-2xl font-bold mb-2">{config.title}</h2>}
                    <div className="py-12 text-sm italic rounded-xl border border-dashed border-current opacity-60">
                        Belum ada ulasan yang ditampilkan.
                    </div>
                </div>
            </section>
        );
    }

    // Scroll Handler for Center Detection
    const handleScroll = () => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const center = container.scrollLeft + container.clientWidth / 2;

        const children = container.children;
        let closestIndex = 0;
        let minDiff = Infinity;

        for (let i = 0; i < children.length; i++) {
            const child = children[i] as HTMLElement;
            // Calculate center of the child relative to the container scrolling
            const childCenter = child.offsetLeft + child.offsetWidth / 2;
            const diff = Math.abs(childCenter - center);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }
        setActiveIndex(closestIndex);
    };

    // Attach scroll listener
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        container.addEventListener("scroll", handleScroll, { passive: true });
        // Initial check
        handleScroll();

        return () => container.removeEventListener("scroll", handleScroll);
    }, [reviews]);


    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const { current } = scrollRef;
        // Scroll by card width approx. Better: scroll to index
        const nextIndex = direction === "left" ? Math.max(0, activeIndex - 1) : Math.min(reviews.length - 1, activeIndex + 1);

        const children = current.children;
        const targetChild = children[nextIndex] as HTMLElement;
        if (targetChild) {
            const containerCenter = current.clientWidth / 2;
            const childCenter = targetChild.offsetLeft + targetChild.offsetWidth / 2;
            current.scrollTo({ left: childCenter - containerCenter, behavior: "smooth" });
        }
    };

    // Theme Logic
    const getThemeStyles = (theme?: string) => {
        switch (theme) {
            case "NAVY_GOLD":
                return {
                    bg: "bg-[#0f172a]",
                    text: "text-white",
                    subtext: "text-gray-300",
                    cardBh: "bg-[#1e293b]",
                    cardBorder: "border-amber-400/20",
                    cardText: "text-gray-200",
                    heading: "text-amber-400", // Gold
                    star: "text-amber-400",
                    arrow: "text-amber-400 hover:bg-amber-400/10 border-amber-400/30",
                    activeRing: "ring-2 ring-amber-400/50"
                };
            case "WHITE_GOLD":
                return {
                    bg: "bg-white",
                    text: "text-gray-900",
                    subtext: "text-gray-500",
                    cardBh: "bg-white",
                    cardBorder: "border-amber-100",
                    cardText: "text-gray-600",
                    heading: "text-amber-600",
                    star: "text-amber-400",
                    arrow: "text-gray-600 hover:bg-gray-50 border-gray-200",
                    activeRing: "ring-2 ring-amber-200"
                };
            case "GOLD_NAVY":
                return {
                    bg: "bg-amber-50",
                    text: "text-slate-900",
                    subtext: "text-slate-600",
                    cardBh: "bg-white",
                    cardBorder: "border-amber-200",
                    cardText: "text-slate-700",
                    heading: "text-[#0f172a]",
                    star: "text-[#0f172a]",
                    arrow: "text-slate-800 hover:bg-amber-100 border-amber-200",
                    activeRing: "ring-2 ring-[#0f172a]/20"
                };
            default:
                return {
                    bg: "bg-white",
                    text: "text-gray-900",
                    subtext: "text-gray-500",
                    cardBh: "bg-white",
                    cardBorder: "border-gray-100",
                    cardText: "text-gray-600",
                    heading: "text-gray-900",
                    star: "text-amber-400",
                    arrow: "text-gray-600 hover:bg-gray-50 border-gray-200",
                    activeRing: "ring-1 ring-gray-200"
                };
        }
    };

    const styles = getThemeStyles(config.sectionTheme);

    return (
        <section className={`py-16 w-full ${styles.bg}`}>
            {/* Header */}
            <div className="container mx-auto px-6 mb-10 flex items-end justify-between">
                <div>
                    {config.title && (
                        <h2 className={`text-3xl font-bold mb-3 ${styles.heading}`}>
                            {config.title}
                        </h2>
                    )}
                    {config.subtitle && (
                        <p className={`text-sm md:text-base max-w-xl leading-relaxed ${styles.subtext}`}>
                            {config.subtitle}
                        </p>
                    )}
                </div>

                {/* Navigation Arrows */}
                <div className="hidden md:flex gap-3">
                    <button
                        onClick={() => scroll("left")}
                        disabled={activeIndex === 0}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${styles.arrow} ${activeIndex === 0 ? "opacity-30 cursor-not-allowed" : ""}`}
                        aria-label="Previous"
                    >
                        <FaChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        disabled={activeIndex === reviews.length - 1}
                        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all shadow-sm ${styles.arrow} ${activeIndex === reviews.length - 1 ? "opacity-30 cursor-not-allowed" : ""}`}
                        aria-label="Next"
                    >
                        <FaChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* Carousel Container */}
            {/* Using large padding to allow first/last items to be centered */}
            <div className="relative w-full">
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto snap-x snap-mandatory px-[50vw] md:px-[calc(50%-200px)] lg:px-[calc(50%-220px)] pb-12 pt-4 scrollbar-hide no-scrollbar items-center"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        scrollPadding: "0" // handled by flex alignment
                    }}
                >
                    {reviews.map((review, idx) => {
                        const isActive = idx === activeIndex;
                        return (
                            <div
                                key={idx}
                                className={`
                                    snap-center shrink-0 
                                    transition-all duration-500 ease-out 
                                    ${isActive ? "scale-100 opacity-100 z-10" : "scale-90 opacity-40 hover:opacity-100 z-0"}
                                    ${/* Mobile width: 70vw to see edges of next cards. Desktop: fixed width */ ""}
                                    w-[70vw] xs:w-[320px] md:w-[400px] lg:w-[440px]
                                    mx-[-10px] md:mx-4
                                `}
                            >
                                <div className={`
                                    rounded-3xl p-8 border shadow-lg h-full flex flex-col relative 
                                    ${styles.cardBh} ${styles.cardBorder} 
                                    ${isActive ? styles.activeRing : ""}
                                    ${isActive ? "shadow-2xl" : "shadow-sm"}
                                `}>
                                    {/* Quote Icon */}
                                    <div className={`absolute top-6 right-8 opacity-10 ${styles.heading}`}>
                                        <FaQuoteLeft size={48} />
                                    </div>

                                    {/* Rating */}
                                    <div className={`flex gap-1.5 mb-6 ${styles.star}`}>
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} size={16} className={i < (review.rating || 5) ? "" : "opacity-30"} />
                                        ))}
                                    </div>

                                    {/* Text */}
                                    <p className={`text-base md:text-lg leading-relaxed mb-8 relative z-10 flex-1 ${styles.cardText}`}>
                                        "{review.text}"
                                    </p>

                                    {/* Author */}
                                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-gray-100/10">
                                        {review.profile_photo_url ? (
                                            <img
                                                src={review.profile_photo_url}
                                                alt={review.author_name}
                                                className="w-12 h-12 rounded-full object-cover bg-gray-100 ring-2 ring-white/10"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold uppercase ${styles.bg} ${styles.subtext} border ${styles.cardBorder}`}>
                                                {review.author_name?.substring(0, 2) || "AN"}
                                            </div>
                                        )}
                                        <div>
                                            <div className={`text-base font-bold ${styles.text}`}>{review.author_name || "Pelanggan"}</div>
                                            <div className={`text-xs ${styles.subtext}`}>{review.relative_time_description || "Pelanggan Terverifikasi"}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
}
