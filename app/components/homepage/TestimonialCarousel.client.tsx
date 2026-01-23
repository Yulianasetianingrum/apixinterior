"use client";

import React, { useRef } from "react";
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
    const reviews = Array.isArray(config?.reviews) ? config.reviews : [];

    // Fallback if no reviews
    if (reviews.length === 0) {
        return (
            <div className="py-12 px-4 text-center text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                Belum ada ulasan yang ditampilkan.
            </div>
        );
    }

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const { current } = scrollRef;
        const scrollAmount = 320; // approx card width
        if (direction === "left") {
            current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
        } else {
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    // Theme Logic
    const getThemeStyles = (theme?: string) => {
        switch (theme) {
            case "NAVY_GOLD":
                return {
                    bg: "bg-[#0f172a]", // Navy
                    text: "text-white",
                    subtext: "text-gray-300",
                    cardBh: "bg-[#1e293b]", // Darker navy for card
                    cardBorder: "border-amber-400/20",
                    cardText: "text-gray-200",
                    heading: "text-amber-400", // Gold
                    star: "text-amber-400",
                    arrow: "text-amber-400 hover:bg-amber-400/10 border-amber-400/30"
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
                    arrow: "text-gray-600 hover:bg-gray-50 border-gray-200"
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
                    arrow: "text-slate-800 hover:bg-amber-100 border-amber-200"
                };
            // Add other variations if needed, fallback to default
            default:
                return {
                    bg: "bg-white", // Default or FOLLOW_NAVBAR fallback (approximated as white for now)
                    text: "text-gray-900",
                    subtext: "text-gray-500",
                    cardBh: "bg-white",
                    cardBorder: "border-gray-100",
                    cardText: "text-gray-600",
                    heading: "text-gray-900", // Default black
                    star: "text-amber-400",
                    arrow: "text-gray-600 hover:bg-gray-50 border-gray-200"
                };
        }
    };

    const styles = getThemeStyles(config.sectionTheme);

    return (
        <section className={`py-12 w-full ${styles.bg}`}>
            {/* Header */}
            <div className="mb-8 px-4 flex items-end justify-between">
                <div>
                    {config.title && (
                        <h2 className={`text-2xl font-bold mb-2 ${styles.heading}`}>
                            {config.title}
                        </h2>
                    )}
                    {config.subtitle && (
                        <p className={`text-sm max-w-lg leading-relaxed ${styles.subtext}`}>
                            {config.subtitle}
                        </p>
                    )}
                </div>

                {/* Navigation Arrows */}
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${styles.arrow}`}
                        aria-label="Previous"
                    >
                        <FaChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shadow-sm ${styles.arrow}`}
                        aria-label="Next"
                    >
                        <FaChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Scroll Container */}
            <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-5 px-4 pb-8 -mx-4 md:mx-0 scrollbar-hide no-scrollbar"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {reviews.map((review, idx) => (
                    <div
                        key={idx}
                        className={`snap-start shrink-0 w-[85vw] md:w-[350px] rounded-2xl p-6 border shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] flex flex-col h-auto relative ${styles.cardBh} ${styles.cardBorder}`}
                    >
                        {/* Quote Icon */}
                        <div className={`absolute top-6 right-6 opacity-10 ${styles.heading}`}>
                            <FaQuoteLeft size={40} />
                        </div>

                        {/* Rating */}
                        <div className={`flex gap-1 mb-4 ${styles.star}`}>
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} size={14} className={i < (review.rating || 5) ? "" : "opacity-30"} />
                            ))}
                        </div>

                        {/* Text */}
                        <p className={`text-[15px] leading-6 mb-6 relative z-10 flex-1 ${styles.cardText}`}>
                            "{review.text}"
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100/10">
                            {review.profile_photo_url ? (
                                <img
                                    src={review.profile_photo_url}
                                    alt={review.author_name}
                                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                    loading="lazy"
                                />
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold uppercase ${styles.bg} ${styles.subtext} border ${styles.cardBorder}`}>
                                    {review.author_name?.substring(0, 2) || "AN"}
                                </div>
                            )}
                            <div>
                                <div className={`text-sm font-semibold ${styles.text}`}>{review.author_name || "Pelanggan"}</div>
                                <div className={`text-xs ${styles.subtext}`}>{review.relative_time_description || "Pelanggan Terverifikasi"}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </section>
    );
}
