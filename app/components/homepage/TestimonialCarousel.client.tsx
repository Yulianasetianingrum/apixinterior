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

    return (
        <section className="py-12 w-full">
            {/* Header */}
            <div className="mb-8 px-4 flex items-end justify-between">
                <div>
                    {config.title && (
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                            {config.title}
                        </h2>
                    )}
                    {config.subtitle && (
                        <p className="text-sm text-gray-500 max-w-lg leading-relaxed">
                            {config.subtitle}
                        </p>
                    )}
                </div>

                {/* Navigation Arrows */}
                <div className="hidden md:flex gap-2">
                    <button
                        onClick={() => scroll("left")}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        aria-label="Previous"
                    >
                        <FaChevronLeft size={14} />
                    </button>
                    <button
                        onClick={() => scroll("right")}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
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
                        className="snap-start shrink-0 w-[85vw] md:w-[350px] bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] flex flex-col h-auto relative"
                    >
                        {/* Quote Icon */}
                        <div className="absolute top-6 right-6 text-gray-100">
                            <FaQuoteLeft size={40} />
                        </div>

                        {/* Rating */}
                        <div className="flex gap-1 mb-4 text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <FaStar key={i} size={14} className={i < (review.rating || 5) ? "" : "text-gray-200"} />
                            ))}
                        </div>

                        {/* Text */}
                        <p className="text-gray-600 text-[15px] leading-6 mb-6 relative z-10 flex-1">
                            "{review.text}"
                        </p>

                        {/* Author */}
                        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-50">
                            {review.profile_photo_url ? (
                                <img
                                    src={review.profile_photo_url}
                                    alt={review.author_name}
                                    className="w-10 h-10 rounded-full object-cover bg-gray-100"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold uppercase">
                                    {review.author_name?.substring(0, 2) || "AN"}
                                </div>
                            )}
                            <div>
                                <div className="text-sm font-semibold text-gray-900">{review.author_name || "Pelanggan"}</div>
                                <div className="text-xs text-gray-400">{review.relative_time_description || "Pelanggan Terverifikasi"}</div>
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
