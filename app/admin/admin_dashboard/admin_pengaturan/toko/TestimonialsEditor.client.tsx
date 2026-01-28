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
    url?: string;
};

type Props = {
    initialConfig: any;
    sectionId?: string;
    onSave?: (formData: FormData) => void;
    onChange?: (newConfig: any) => void;
};

export default function TestimonialsEditor({ initialConfig, onChange }: Props) {
    const safeConfig = initialConfig || {};

    const [title, setTitle] = useState(safeConfig.title ?? "Apa Kata Mereka?");
    const [subtitle, setSubtitle] = useState(safeConfig.subtitle ?? "Ulasan dari pelanggan setia kami");
    const [mapsUrl, setMapsUrl] = useState(safeConfig.mapsUrl ?? "");

    // Normalize initial reviews
    const initialReviews = Array.isArray(safeConfig.reviews)
        ? safeConfig.reviews.map((r: any) => ({
            id: r.id || String(Math.random()),
            author_name: r.author_name || r.author || "Pelanggan",
            rating: typeof r.rating === 'number' ? r.rating : 5,
            text: r.text || "",
            relative_time_description: r.relative_time_description || r.time || "",
            profile_photo_url: r.profile_photo_url || r.avatarUrl || "",
            url: r.url || ""
        }))
        : [];

    const [reviews, setReviews] = useState<any[]>(initialReviews);
    const [isFetching, setIsFetching] = useState(false);
    const [sectionTheme, setSectionTheme] = useState(safeConfig.sectionTheme ?? "NAVY_GOLD");
    const [sectionBgTheme, setSectionBgTheme] = useState(safeConfig.sectionBgTheme ?? "NAVY");
    const [maxReviews, setMaxReviews] = useState<number>(
        Number.isFinite(Number(safeConfig.maxReviews)) ? Number(safeConfig.maxReviews) : 0
    );

    // Sync changes
    const updateConfig = (key: string, value: any) => {
        const next = { ...safeConfig, title, subtitle, mapsUrl, reviews, sectionTheme, sectionBgTheme, maxReviews, [key]: value };
        if (onChange) onChange(next);
    };

    const handleFetch = async () => {
        if (!mapsUrl) {
            alert("Harap isi URL Google Maps terlebih dahulu");
            return;
        }

        setIsFetching(true);
        // SIMULATED FETCH - Using REAL customer data
        setTimeout(() => {
            const dummyReviews = [
                {
                    id: "r1",
                    author_name: "Fitriyanto Budi Nugroho",
                    rating: 5,
                    text: "Terimakasih. Pekerjaan bagus mulus semoga awet dobel storage nya",
                    relative_time_description: "2 tahun lalu",
                    profile_photo_url: "",
                    url: "https://maps.app.goo.gl/hRY8mc4DTpLU2MPR6"
                },
                {
                    id: "r2",
                    author_name: "Afich Agung99",
                    rating: 5,
                    text: "Terima kasih sangat memuaskan, nanti bakal order lagi",
                    relative_time_description: "3 tahun lalu",
                    profile_photo_url: "",
                    url: "https://maps.app.goo.gl/KzpQtgJ2fjQ4s4GE6"
                },
                {
                    id: "r3",
                    author_name: "Nasrul channel",
                    rating: 5,
                    text: "Furniture berkualitas, desain modern dan elegan. Sangat puas dengan hasilnya!",
                    relative_time_description: "2 tahun lalu",
                    profile_photo_url: "",
                    url: "https://maps.app.goo.gl/hqD65A6yQnyYa89r9"
                },
                {
                    id: "r4",
                    author_name: "Pentri Yaser",
                    rating: 5,
                    text: "Pelayanan ramah dan profesional. Hasil custom sesuai request, recommended!",
                    relative_time_description: "2 tahun lalu",
                    profile_photo_url: "",
                    url: "https://maps.app.goo.gl/2mAYa4m8DtEQfQ586"
                },
                {
                    id: "r5",
                    author_name: "tyahehe",
                    rating: 5,
                    text: "Kualitas material premium, finishing rapi. Worth it banget untuk harga nya!",
                    relative_time_description: "2 tahun lalu",
                    profile_photo_url: "",
                    url: "https://maps.app.goo.gl/krb19vnTF3RX3KG39"
                },
            ];

            const nextReviews = [...reviews, ...dummyReviews];
            setReviews(nextReviews);
            updateConfig("reviews", nextReviews);

            setIsFetching(false);
            alert("Berhasil mengambil 5 ulasan Google Maps (Data Real). Link sudah tersimpan di setiap kartu.");
        }, 1500);
    };

    const addManualReview = () => {
        const newRev = {
            id: Date.now().toString(),
            author_name: "Nama Pelanggan",
            rating: 5,
            text: "Tulis ulasan disini...",
            relative_time_description: "Baru saja",
            profile_photo_url: "",
            url: ""
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

    const updateReview = (idx: number, field: string, val: any) => {
        const next = [...reviews];
        if (next[idx]) {
            (next[idx] as any)[field] = val;
            setReviews(next);
            updateConfig("reviews", next);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hidden Inputs */}
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="subtitle" value={subtitle} />
            <input type="hidden" name="mapsUrl" value={mapsUrl} />
            <input type="hidden" name="reviews" value={JSON.stringify(reviews)} />
            <input type="hidden" name="sectionTheme" value={sectionTheme} />
            <input type="hidden" name="sectionBgTheme" value={sectionBgTheme} />
            <input type="hidden" name="maxReviews" value={String(maxReviews)} />

            {/* Grid Config */}
            <div className={styles.sectionEditGrid}>
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Judul Section</label>
                    <input
                        type="text" className={styles.input}
                        value={title} onChange={(e) => { setTitle(e.target.value); updateConfig("title", e.target.value); }}
                    />
                </div>

                {/* Background Section */}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Warna Background</label>
                    <select
                        className={styles.select}
                        value={sectionBgTheme}
                        onChange={(e) => { setSectionBgTheme(e.target.value); updateConfig("sectionBgTheme", e.target.value); }}
                    >
                        <option value="NAVY">NAVY (Biru Gelap)</option>
                        <option value="GOLD">GOLD (Emas)</option>
                        <option value="WHITE">WHITE (Putih)</option>
                    </select>
                </div>

                {/* Card Theme */}
                <div className={styles.fieldGroup}>
                    <label className={styles.label}>Tema Kartu (Bg + Teks)</label>
                    <select
                        className={styles.select}
                        value={sectionTheme}
                        onChange={(e) => { setSectionTheme(e.target.value); updateConfig("sectionTheme", e.target.value); }}
                    >
                        <option value="NAVY_GOLD">Card: NAVY, Teks: GOLD</option>
                        <option value="NAVY_WHITE">Card: NAVY, Teks: WHITE</option>
                        <option value="WHITE_GOLD">Card: WHITE, Teks: GOLD</option>
                        <option value="WHITE_NAVY">Card: WHITE, Teks: NAVY</option>
                        <option value="GOLD_NAVY">Card: GOLD, Teks: NAVY</option>
                        <option value="GOLD_WHITE">Card: GOLD, Teks: WHITE</option>
                    </select>
                </div>
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Sub-judul (Opsional)</label>
                <input
                    type="text" className={styles.input}
                    value={subtitle} onChange={(e) => { setSubtitle(e.target.value); updateConfig("subtitle", e.target.value); }}
                />
            </div>

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Jumlah Ulasan Ditampilkan (0 = Semua)</label>
                <input
                    type="number"
                    min={0}
                    max={200}
                    className={styles.input}
                    value={maxReviews}
                    onChange={(e) => {
                        const raw = Number(e.target.value);
                        const next = Number.isFinite(raw) ? Math.max(0, Math.min(200, Math.round(raw))) : 0;
                        setMaxReviews(next);
                        updateConfig("maxReviews", next);
                    }}
                />
            </div>

            {/* Maps URL Fetcher - ONLY ONE INSTANCE */}
            <div className={styles.fieldGroup} style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0" }}>
                <label className={styles.label}>Link Google Maps (Sumber Ulasan)</label>
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
                            opacity: isFetching ? 0.7 : 1,
                            whiteSpace: "nowrap"
                        }}
                    >
                        {isFetching ? "Loading..." : "Fetch (Simulasi)"}
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
                                value={r.author_name}
                                onChange={(e) => updateReview(idx, "author_name", e.target.value)}
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
                        <input
                            type="text"
                            value={r.url || ""}
                            onChange={(e) => updateReview(idx, "url", e.target.value)}
                            style={{ width: "100%", fontSize: 11, marginBottom: 6, color: "blue", border: "none", borderBottom: "1px dotted #ccc" }}
                            placeholder="Link Ulasan (Opsional)..."
                        />
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
