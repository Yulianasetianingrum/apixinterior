"use client";

import React, { useRef } from "react";
// @ts-ignore
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
// @ts-ignore
import { FaStar, FaQuoteLeft } from "react-icons/fa";
// @ts-ignore
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
    sectionTheme?: string; // "NAVY_GOLD", etc.
}

export default function TestimonialCarousel({ config }: { config: TestimonialConfig }) {
    const reviews = config?.reviews || [];
    const title = config?.title || "Apa Kata Mereka";
    const subtitle = config?.subtitle || "Ulasan pelanggan setia kami";

    // If no reviews, don't render anything (or render a placeholder if in preview?)
    // For now, render nothing if empty to avoid broken UI on live site.
    if (!reviews.length) {
        return null;
    }

    const sliderRef = useRef<Slider>(null);

    const settings = {
        dots: true,
        infinite: reviews.length > 3,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        arrows: false,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 640,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    const next = () => {
        sliderRef.current?.slickNext();
    };
    const previous = () => {
        sliderRef.current?.slickPrev();
    };

    return (
        <section className="py-16 md:py-24 bg-white relative overflow-hidden">
            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-4">{title}</h2>
                    {subtitle && (
                        <p className="text-slate-600 max-w-2xl mx-auto">{subtitle}</p>
                    )}
                </div>

                <div className="relative px-2 md:px-8">
                    <Slider ref={sliderRef} {...settings}>
                        {reviews.map((review, idx) => (
                            <div key={idx} className="px-3 h-full">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-full flex flex-col relative group hover:shadow-lg transition-shadow duration-300">
                                    <FaQuoteLeft className="text-3xl text-slate-200 absolute top-6 right-6" />

                                    <div className="flex items-center gap-4 mb-4">
                                        {review.profile_photo_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={review.profile_photo_url}
                                                alt={review.author_name}
                                                className="w-12 h-12 rounded-full object-cover border border-slate-200"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-lg">
                                                {review.author_name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-slate-900 line-clamp-1" title={review.author_name}>
                                                {review.author_name}
                                            </div>
                                            <div className="flex text-amber-400 text-sm">
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} className={i < review.rating ? "text-amber-400" : "text-slate-300"} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <p className="text-slate-700 leading-relaxed text-sm md:text-base line-clamp-4">
                                            {review.text}
                                        </p>
                                    </div>

                                    {review.relative_time_description && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
                                            {review.relative_time_description}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </Slider>

                    <button
                        onClick={previous}
                        className="absolute top-1/2 -left-2 md:-left-4 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-indigo-900 transition-colors z-20 border border-slate-100"
                        aria-label="Previous"
                    >
                        <FaChevronLeft />
                    </button>
                    <button
                        onClick={next}
                        className="absolute top-1/2 -right-2 md:-right-4 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-slate-700 hover:text-indigo-900 transition-colors z-20 border border-slate-100"
                        aria-label="Next"
                    >
                        <FaChevronRight />
                    </button>
                </div>

            </div>
        </section>
    );
}
