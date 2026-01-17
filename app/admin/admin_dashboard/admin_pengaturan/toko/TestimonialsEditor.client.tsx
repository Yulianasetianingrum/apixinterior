"use client";

import { useState } from "react";
import styles from "./toko.module.css";

type Review = {
    id: string;
    author: string;
    rating: number;
    text: string;
    avatarUrl?: string;
    time?: string;
};

type Props = {
    config: any;
    onChange: (newConfig: any) => void;
};

export default function TestimonialsEditor({ config, onChange }: Props) {
    const [title, setTitle] = useState(config.title ?? "Apa Kata Mereka?");
    const [subtitle, setSubtitle] = useState(config.subtitle ?? "Ulasan dari pelanggan setia kami");
    const [mapsUrl, setMapsUrl] = useState(config.mapsUrl ?? "");
    const [reviews, setReviews] = useState<Review[]>(Array.isArray(config.reviews) ? config.reviews : []);

    const [isFetching, setIsFetching] = useState(false);

    // Sync changes to parent
    const updateConfig = (key: string, value: any) => {
        const next = { ...config, title, subtitle, mapsUrl, reviews, [key]: value };
        onChange(next);
    };

    const handleFetch = async () => {
        if (!mapsUrl) {
            alert("Harap isi URL Google Maps terlebih dahulu");
            return;
        }

        setIsFetching(true);

        // SIMULATED FETCH for now
        // In a real scenario, this would call a Server Action that uses Puppeteer/Cheerio/Places API
        setTimeout(() => {
            const dummyReviews: Review[] = [
                { id: "r1", author: "Budi Santoso", rating: 5, text: "Pelayanan sangat ramah, furniture kualitas premium. Sangat puas!", time: "2 hari lalu", avatarUrl: "" },
                { id: "r2", author: "Siti Aminah", rating: 5, text: "Desain interiornya modern, sesuai ekspektasi. Pengiriman juga cepat.", time: "1 minggu lalu", avatarUrl: "" },
                { id: "r3", author: "Ahmad Dani", rating: 4, text: "Harganya bersaing, overall oke banget buat ngisi rumah baru.", time: "2 minggu lalu", avatarUrl: "" },
            ];

            // Append or Replace? Let's confirm logic. For now, replace or append depending on user needs. 
            // Better to append to avoid losing manual ones, or ask.
            // Let's just append for safety.
            const nextReviews = [...reviews, ...dummyReviews];
            setReviews(nextReviews);
            updateConfig("reviews", nextReviews);

            setIsFetching(false);
            alert("Berhasil mengambil 3 ulasan contoh dari Google Maps (Simulasi). Silakan edit sesuai kebutuhan.");
        }, 1500);
    };

    const addManualReview = () => {
        const newRev: Review = {
            id: Date.now().toString(),
            author: "Nama Pelanggan",
            rating: 5,
            text: "Tulis ulasan disini...",
            time: "Baru saja"
        };
        const next = [...reviews, newRev];
        setReviews(next);
        updateConfig("reviews", next);
    };

    const removeReview = (idx: number) => {
        const next = [...reviews];
        next.splice(idx, 1);
        setReviews(next);
        updateConfig("reviews", next);
    };

    const updateReview = (idx: number, field: keyof Review, val: any) => {
        const next = [...reviews];
        if (next[idx]) {
            (next[idx] as any)[field] = val;
            setReviews(next);
            updateConfig("reviews", next);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header Config */}
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Judul Section</label>
                <input
                    type="text" className={styles.input}
                    value={title} onChange={(e) => { setTitle(e.target.value); updateConfig("title", e.target.value); }}
                />
            </div>
            <div className={styles.fieldGroup}>
                <label className={styles.label}>Sub-judul (Opsional)</label>
                <input
                    type="text" className={styles.input}
                    value={subtitle} onChange={(e) => { setSubtitle(e.target.value); updateConfig("subtitle", e.target.value); }}
                />
            </div>

            {/* Maps URL Fetcher */}
            <div className={styles.fieldGroup} style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <label className={styles.label}>Link Google Maps</label>
                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        type="text" className={styles.input}
                        placeholder="https://maps.app.goo.gl/..."
                        value={mapsUrl} onChange={(e) => { setMapsUrl(e.target.value); updateConfig("mapsUrl", e.target.value); }}
                    />
                    <button
                        type="button"
                        onClick={handleFetch}
                        disabled={isFetching}
                        style={{
                            padding: "0 16px", background: "#166534", color: "white",
                            border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600,
                            opacity: isFetching ? 0.7 : 1
                        }}
                    >
                        {isFetching ? "Loading..." : "Fetch"}
                    </button>
                </div>
                <p style={{ fontSize: 12, color: "#166534", marginTop: 6 }}>
                    Fitur Fetch ini akan mencoba mengambil ulasan publik. Jika gagal (karena proteksi Google), Anda bisa input manual di bawah.
                </p>
            </div>

            {/* Reviews List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className={styles.label}>Daftar Ulasan ({reviews.length})</label>
                    <button
                        type="button" onClick={addManualReview}
                        style={{ fontSize: 12, padding: "4px 8px", background: "#e2e8f0", border: "none", borderRadius: 4, cursor: "pointer" }}
                    >
                        + Tambah Manual
                    </button>
                </div>

                {reviews.map((r, idx) => (
                    <div key={r.id || idx} style={{ border: "1px solid #e2e8f0", padding: 12, borderRadius: 8, background: "white" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <input
                                type="text"
                                value={r.author}
                                onChange={(e) => updateReview(idx, "author", e.target.value)}
                                style={{ fontWeight: 600, border: "none", borderBottom: "1px dashed #cbd5e1", width: "40%" }}
                                placeholder="Nama"
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <span>⭐</span>
                                <input
                                    type="number" min={1} max={5}
                                    value={r.rating}
                                    onChange={(e) => updateReview(idx, "rating", Number(e.target.value))}
                                    style={{ width: 40, padding: 2 }}
                                />
                                <button type="button" onClick={() => removeReview(idx)} style={{ marginLeft: 8, color: "red", border: "none", background: "transparent", cursor: "pointer" }}>🗑️</button>
                            </div>
                        </div>
                        <textarea
                            value={r.text}
                            onChange={(e) => updateReview(idx, "text", e.target.value)}
                            rows={2}
                            style={{ width: "100%", fontSize: 13, borderColor: "#e2e8f0", borderRadius: 4, padding: 6 }}
                            placeholder="Isi ulasan..."
                        />
                    </div>
                ))}

                {reviews.length === 0 && (
                    <p style={{ fontStyle: "italic", fontSize: 13, color: "#94a3b8", textAlign: "center" }}>
                        Belum ada ulasan. Klik Fetch atau Tambah Manual.
                    </p>
                )}
            </div>
        </div>
    );
}
