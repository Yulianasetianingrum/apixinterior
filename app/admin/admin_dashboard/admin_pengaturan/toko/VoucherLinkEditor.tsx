"use client";

import React, { useState } from "react";
import styles from "./toko.module.css";

interface CategoryItem {
    id: number;
    name: string;
}

interface VoucherLinkEditorProps {
    imgId: number;
    initialMode: "category" | "manual" | "";
    initialCategoryId: number | null;
    initialManualLink: string;
    categories: CategoryItem[];
}

export default function VoucherLinkEditor({
    imgId,
    initialMode,
    initialCategoryId,
    initialManualLink,
    categories,
}: VoucherLinkEditorProps) {
    // If no mode is set (empty string), default to "category" for better UX? 
    // Or keep it empty? Let's use the passed initialMode but fallback to "category" if user interacts.
    const [mode, setMode] = useState<"category" | "manual" | "">(initialMode || "category");

    // We can track values if we want controlled inputs, or just rely on defaultValues and enabling/disabling.
    // Enabling/disabling is sufficient for FormData submission (disabled inputs are ignored).

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>
                    Cantumkan (pilih salah satu)
                </div>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input
                        type="radio"
                        name={`voucherLinkMode_${imgId}`}
                        value="category"
                        checked={mode === "category"}
                        onChange={() => setMode("category")}
                    />
                    <span style={{ fontSize: 12 }}>Kategori</span>
                </label>
                <label style={{ display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    <input
                        type="radio"
                        name={`voucherLinkMode_${imgId}`}
                        value="manual"
                        checked={mode === "manual"}
                        onChange={() => setMode("manual")}
                    />
                    <span style={{ fontSize: 12 }}>Link manual</span>
                </label>
            </div>

            {/* Input Kategori */}
            <label style={{ display: "grid", gap: 4, opacity: mode === "category" ? 1 : 0.5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>Kategori</span>
                <select
                    name={`voucherCategory_${imgId}`}
                    defaultValue={initialCategoryId ?? ""}
                    className={styles.select}
                    style={{ fontSize: 12, padding: "8px 10px" }}
                    disabled={mode !== "category"}
                >
                    <option value="">-- Pilih kategori (opsional) --</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </label>

            {/* Input Link Manual */}
            <label style={{ display: "grid", gap: 4, opacity: mode === "manual" ? 1 : 0.5 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(0,0,0,0.7)" }}>Link manual</span>
                <input
                    name={`voucherLink_${imgId}`}
                    defaultValue={initialManualLink}
                    placeholder="https://contoh.com/promo"
                    className={styles.input}
                    style={{ fontSize: 12, padding: "8px 10px" }}
                    disabled={mode !== "manual"}
                />
            </label>

            <p className={styles.helperText} style={{ margin: 0, fontSize: 11 }}>
                Pilih salah satu: kategori (redirect ke /cari?kategori=&lt;id&gt;) atau link manual.
            </p>
        </div>
    );
}
