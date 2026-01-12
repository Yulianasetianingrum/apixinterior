"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/app/context/CartContext";

export default function CartBadgeClient({ iconUrl }: { iconUrl: string }) {
    const { totalItems } = useCart();

    return (
        <Link href="/keranjang" style={{ display: "flex", alignItems: "center", marginRight: 16, position: "relative" }}>
            <Image
                src={iconUrl}
                alt="Keranjang"
                width={20}
                height={20}
                style={{ objectFit: "contain" }}
            />
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
