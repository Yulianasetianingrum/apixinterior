"use client";

import Link from "next/link";
import { useWishlist } from "@/app/context/WishlistContext";
import { FaHeart, FaRegHeart } from "react-icons/fa6";

export default function WishlistBadgeClient({ themeColor }: { themeColor: string }) {
    const { totalItems } = useWishlist();

    // Determine icon color based on passed hex code
    // If no color passed, default to gold #d4af37
    const color = themeColor || "#d4af37";

    return (
        <Link href="/favorite" style={{ display: "flex", alignItems: "center", marginRight: 16, position: "relative" }}>
            {/* Use react-icons for Love Logo */}
            <FaHeart size={20} color={color} />

            {totalItems > 0 && (
                <span
                    style={{
                        position: "absolute",
                        top: -6,
                        right: -8,
                        background: "#ef4444", // Red 500
                        color: "white",
                        fontSize: "11px",
                        fontWeight: "bold",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.2)"
                    }}
                >
                    {totalItems > 99 ? "99+" : totalItems}
                </span>
            )}
        </Link>
    );
}
