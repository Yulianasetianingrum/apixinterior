"use client";

import { useWishlist } from "@/app/context/WishlistContext";
import { formatIDR } from "@/lib/product-utils";
import Image from "next/image";
import Link from "next/link";
import { FaTrash, FaCartShopping } from "react-icons/fa6";
import { useCart } from "@/app/context/CartContext";

// Helper to ensure image URL is correct
const ensureImageUrl = (url: string | null | undefined) => {
    if (!url) return null;
    let clean = url;

    // If it is an external/absolute URL, trust it (don't strip domain)
    if (clean.startsWith("http")) return clean;

    // Strip common local prefixes
    clean = clean.replace(/^public\//, "");
    clean = clean.replace(/^\/?public\//, "");

    if (clean.startsWith("/")) return clean;
    return `/${clean}`;
};

export default function WishlistPageClient() {
    const { items, removeFromWishlist } = useWishlist();
    const { addToCart } = useCart();

    if (items.length === 0) {
        // ... (truncated for brevity, ensure this matches existing code structure or use larger context if needed)
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="text-6xl mb-4 text-[#ef4444]">❤</div>
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Wishlist Kosong</h1>
                <p className="text-slate-500 mb-8">Anda belum menyukai produk apapun.</p>
                <Link
                    href="/produk"
                    className="bg-[#D4AF37] text-[#020617] font-bold py-3 px-8 rounded-full hover:shadow-lg transition-transform hover:-translate-y-1"
                >
                    Cari Produk
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 text-black">
            <h1 className="text-3xl font-bold text-slate-900 mb-8">Wishlist Anda ({items.length})</h1>

            <div className="grid grid-cols-1 gap-6">
                {items.map((item) => (
                    <div key={item.id} className="flex gap-4 md:gap-6 p-4 border border-slate-200 rounded-xl bg-white shadow-sm items-center">
                        {/* Image */}
                        <div className="relative w-24 h-24 flex-shrink-0 bg-slate-100 rounded-lg overflow-hidden group">
                            {ensureImageUrl(item.image) ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={ensureImageUrl(item.image)!}
                                    alt={item.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Error";
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-400 text-xs">No Img</div>
                            )}
                            {/* DEBUG INFO */}
                            <div className="absolute top-0 left-0 bg-black/80 text-white text-[8px] p-1 w-full z-50 overflow-hidden leading-tight">
                                <div>RAW: {item.image || "NULL"}</div>
                                <div className="text-green-300">FIX: {ensureImageUrl(item.image)}</div>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-grow">
                            <Link href={`/produk/${item.slug}`} className="text-lg font-bold text-slate-900 hover:text-amber-600 line-clamp-1">
                                {item.name}
                            </Link>
                            <div className="text-[#020617] font-bold mt-1">
                                {formatIDR(item.price)}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => addToCart({
                                    id: item.id,
                                    slug: item.slug,
                                    name: item.name,
                                    price: item.price,
                                    image: item.image || "",
                                })}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                                title="Add to Cart"
                            >
                                <FaCartShopping />
                            </button>

                            <button
                                onClick={() => removeFromWishlist(item.id)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                                aria-label="Hapus"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
