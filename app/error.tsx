"use client";

import { useEffect } from "react";
import styles from "./page.module.css";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 24,
            background: "#fff",
            color: "#0f172a"
        }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16, color: "#d4af37" }}>Oops! Terjadi Kesalahan</h2>
            <p style={{ maxWidth: 500, marginBottom: 32, opacity: 0.8, lineHeight: 1.6 }}>
                Maaf, kami mengalami kendala saat memuat halaman ini. Silakan coba muat ulang atau kembali lagi nanti.
            </p>
            <div style={{ display: "flex", gap: 16 }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: "12px 24px",
                        borderRadius: 999,
                        background: "#0b1d3a",
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: 14
                    }}
                >
                    Muat Ulang
                </button>
                <Link href="/admin" style={{
                    padding: "12px 24px",
                    borderRadius: 999,
                    background: "transparent",
                    color: "#0b1d3a",
                    border: "1px solid #0b1d3a",
                    fontWeight: 600,
                    textDecoration: "none",
                    fontSize: 14
                }}>
                    Ke Dashboard
                </Link>
            </div>
        </div>
    );
}
