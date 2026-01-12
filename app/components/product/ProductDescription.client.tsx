"use client";

import { useState } from "react";
import styles from "./ProductDescription.module.css";

export default function ProductDescription({ htmlContent }: { htmlContent: string | null }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!htmlContent) return <p>Belum ada deskripsi.</p>;

    // Simple word count estimate to decide if we even need the button
    // Remove HTML tags to count words suitable for the "70 words" check
    const textContent = htmlContent.replace(/<[^>]+>/g, ' ');
    const wordCount = textContent.trim().split(/\s+/).length;
    const isLong = wordCount > 70;

    // If short, just show it all
    if (!isLong) {
        return <div className="prose" dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\n/g, "<br />") }} />;
    }

    return (
        <div>
            <div
                className={`prose ${isExpanded ? "" : styles.truncated}`}
                dangerouslySetInnerHTML={{ __html: htmlContent.replace(/\n/g, "<br />") }}
            />
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    marginTop: "12px",
                    background: "none",
                    border: "none",
                    color: "#d4af37", // Gold accent
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: "pointer",
                    padding: 0,
                    textDecoration: "underline"
                }}
            >
                {isExpanded ? "Sembunyikan" : "Selanjutnya"}
            </button>
        </div>
    );
}
