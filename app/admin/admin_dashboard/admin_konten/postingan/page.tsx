"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminTheme } from "../../AdminThemeContext";

// Type Definitions
type Post = {
    id: number;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    coverImage?: string;
    isPublished: boolean;
    author?: string;
    seoTitle?: string;
    seoDescription?: string;
    updatedAt: string;
};

type Gambar = {
    id: number;
    url: string;
    title?: string;
};

export default function AdminPostinganPage() {
    const router = useRouter();
    const { isDarkMode: darkMode } = useAdminTheme();

    // Data State
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    // Form Fields
    const [formTitle, setFormTitle] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formExcerpt, setFormExcerpt] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formCoverImage, setFormCoverImage] = useState("");
    const [formAuthor, setFormAuthor] = useState("Made by Apix Interior");
    const [formPublished, setFormPublished] = useState(true);
    const [formSeoTitle, setFormSeoTitle] = useState("");
    const [formSeoDescription, setFormSeoDescription] = useState("");

    // Create / Update Loading
    const [saving, setSaving] = useState(false);

    // Gallery Modal State
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<Gambar[]>([]);
    const [galleryLoading, setGalleryLoading] = useState(false);
    const [gallerySearch, setGallerySearch] = useState("");

    // Load Posts
    const loadPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_konten/postingan");
            const json = await res.json();
            if (res.ok) {
                setPosts(json.posts || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // Handlers
    const handleCreateNew = () => {
        setEditId(null);
        setFormTitle("");
        setFormSlug("");
        setFormExcerpt("");
        setFormContent("");
        setFormCoverImage("");
        setFormAuthor("Made by Apix Interior");
        setFormPublished(true);
        setFormSeoTitle("");
        setFormSeoDescription("");
        setIsEditing(true);
    };

    const handleEdit = (post: Post) => {
        setEditId(post.id);
        setFormTitle(post.title);
        setFormSlug(post.slug);
        setFormExcerpt(post.excerpt || "");
        setFormContent(post.content);
        setFormCoverImage(post.coverImage || "");
        setFormAuthor(post.author || "Made by Apix Interior");
        setFormPublished(post.isPublished);
        setFormSeoTitle(post.seoTitle || "");
        setFormSeoDescription(post.seoDescription || "");
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus postingan ini?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_konten/postingan", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                loadPosts();
            } else {
                alert("Gagal menghapus");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formTitle || !formSlug) {
            alert("Judul dan Slug wajib diisi");
            return;
        }

        setSaving(true);
        try {
            const method = editId ? "PUT" : "POST";
            const body = {
                id: editId ?? undefined,
                title: formTitle,
                slug: formSlug,
                excerpt: formExcerpt,
                content: formContent,
                coverImage: formCoverImage,
                author: formAuthor,
                isPublished: formPublished,
                seoTitle: formSeoTitle,
                seoDescription: formSeoDescription,
            };

            const res = await fetch("/api/admin/admin_dashboard/admin_konten/postingan", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json();

            if (res.ok) {
                setIsEditing(false);
                loadPosts();
            } else {
                alert(json.error || "Gagal menyimpan");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        } finally {
            setSaving(false);
        }
    };

    const handleAutoSlug = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormTitle(val);
        if (!editId) {
            const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            setFormSlug(slug);
        }
    };

    // Gallery Modal Logic
    const openGallery = async () => {
        setGalleryOpen(true);
        if (galleryImages.length === 0) {
            setGalleryLoading(true);
            try {
                const res = await fetch("/api/admin/admin_dashboard/admin_galeri/list_gambar");
                const json = await res.json();
                setGalleryImages(json.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setGalleryLoading(false);
            }
        }
    };

    const selectImage = (url: string) => {
        setFormCoverImage(url);
        setGalleryOpen(false);
    };

    const filteredGallery = galleryImages.filter(img =>
        (img.title?.toLowerCase() || "").includes(gallerySearch.toLowerCase())
    );

    // --- AUTO GENERATE LOGIC ---
    const handleAutoGenerate = async () => {
        const keyword = formTitle.trim() || "Interior";

        // Pilih konteks acak biar gak bosen
        const contexts = [
            {
                type: "Tips & Trik",
                title: `7 Tips Memilih ${keyword} Berkualitas untuk Rumah Minimalis`,
                excerpt: `Bingung cari ${keyword} yang pas? Simak panduan lengkap memilih ${keyword} terbaik yang awet dan estetik untuk hunian Anda bersama Apix Interior.`,
                content: `
<h2>Pentingnya Memilih ${keyword} yang Tepat</h2>
<p>Rumah adalah cerminan kepribadian penghuninya. Memilih <strong>${keyword}</strong> bukan sekadar membeli perabot, tapi membangun atmosfer. Di Apix Interior, kami percaya bahwa kualitas adalah prioritas utama.</p>

<h3>1. Perhatikan Material Utama</h3>
<p>Pastikan ${keyword} Anda menggunakan bahan berkualitas tinggi seperti kayu solid atau plywood pilihan. Material yang buruk hanya akan membuat ${keyword} Anda cepat rusak dalam hitungan bulan.</p>

<h3>2. Sesuaikan dengan Luas Ruangan</h3>
<p>Jangan memaksakan ${keyword} berukuran besar di ruangan sempit. Sebaliknya, gunakan solusi custom dari <strong>Apix Interior</strong> untuk memaksimalkan setiap sudut ruangan Anda secara fungsional.</p>

<h3>3. Pilih Warna yang Harmonis</h3>
<p>Warna netral biasanya lebih aman, namun jangan ragu untuk memberikan aksen berani pada ${keyword} tertentu untuk menciptakan <i>focal point</i> yang menarik di mata tamu Anda.</p>

<h3>Kesimpulan</h3>
<p>Investasi pada ${keyword} berkualitas adalah investasi kenyamanan jangka panjang. Hubungi tim ahli kami untuk konsultasi desain interior dan kebutuhan mebel custom Anda.</p>
                `
            },
            {
                type: "Tren Desain",
                title: `Tren ${keyword} Terbaru 2026: Modern, Estetik & Fungsional`,
                excerpt: `Ingin rumah tampil kekinian? Cek tren ${keyword} paling hits tahun ini. Dari gaya Japandi hingga Modern Industrial, temukan inspirasinya hanya di sini.`,
                content: `
<h2>Inspirasi ${keyword} Modern untuk Masa Kini</h2>
<p>Dunia interior terus berkembang, dan tahun ini <strong>${keyword}</strong> tampil dengan konsep yang lebih menekankan pada keberlanjutan dan kenyamanan maksimal. Apix Interior siap membantu mewujudkan hunian impian Anda dengan sentuhan profesional.</p>

<h3>Sentuhan Alami dan Ramah Lingkungan</h3>
<p>Tahun 2026 adalah tahunnya material alami. Penggunaan kayu jepara dengan finishing natural pada ${keyword} memberikan kesan hangat dan mewah sekaligus ramah lingkungan.</p>

<h3>Fungsionalitas dalam Estetika</h3>
<p>Bukan cuma cantik, ${keyword} masa kini harus multifungsi. Lemari dengan penyimpanan tersembunyi atau meja yang bisa dilipat kini menjadi standar baru dalam desain interior modern.</p>

<p><strong>Kenapa Apix Interior?</strong> Kami mengombinasikan keahlian tukang kayu tradisional dengan teknologi desain modern untuk menghasilkan ${keyword} yang presisi dan memiliki nilai seni tinggi.</p>
                `
            },
            {
                type: "Panduan Perawatan",
                title: `Cara Merawat ${keyword} Agar Tetap Terlihat Mewah Seperti Baru`,
                excerpt: `Punya ${keyword} favorit tapi takut cepat rusak? Ikuti tips perawatan profesional dari Apix Interior agar koleksi mebel Anda tetap kinclong bertahun-tahun.`,
                content: `
<h2>Rahasia ${keyword} Tahan Lama</h2>
<p>Banyak orang mengeluh ${keyword} mereka cepat pudar atau berjamur. Padahal, dengan perawatan yang benar, ${keyword} berkualitas dari Apix Interior bisa bertahan hingga puluhan tahun.</p>

<h3>Bersihkan Secara Rutin</h3>
<p>Gunakan kain microfiber yang lembut untuk mengelap debu pada ${keyword}. Hindari penggunaan cairan pembersih berbahan kimia keras yang dapat merusak lapisan cat atau melamin.</p>

<h3>Hindari Kelembapan Berlebih</h3>
<p>Letakkan ${keyword} Anda di area dengan sirkulasi udara yang baik. Kelembapan adalah musuh utama kayu. Gunakan alas jika meletakkan benda panas atau dingin di atas permukaan mebel.</p>

<p>Jika Anda memerlukan bantuan profesional untuk perbaikan atau <i>refinishing</i> ${keyword}, tim kami di Apix Interior selalu siap membantu mengembalikan kejayaan interior rumah Anda.</p>
                `
            }
        ];

        const selected = contexts[Math.floor(Math.random() * contexts.length)];
        const newTitle = selected.title;
        const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const newExcerpt = selected.excerpt;
        const newContent = selected.content.trim();
        const authorName = "Made by Apix Interior";

        // SEO Automation
        const seoTitle = `${newTitle} | Apix Interior`;
        const seoDesc = newExcerpt.substring(0, 155);

        // 2. Auto Select Image (tetap gunakan gallery yang sudah ada)
        let images = galleryImages;
        if (images.length === 0) {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/admin_dashboard/admin_galeri/list_gambar");
                const json = await res.json();
                images = json.data || [];
                setGalleryImages(images);
            } catch (err) {
                console.error("Failed to auto-load gallery", err);
            } finally {
                setLoading(false);
            }
        }

        let selectedUrl = "";
        if (images.length > 0) {
            // Coba cari gambar yang relevan dengan keyword
            const match = images.find(img => (img.title || "").toLowerCase().includes(keyword.toLowerCase()));
            if (match) {
                selectedUrl = match.url;
            } else {
                selectedUrl = images[Math.floor(Math.random() * images.length)].url;
            }
        }

        if (confirm(`Generate konten KREATIF & SEO untuk "${keyword}"?\n\n(Catatan: Ini akan mengisi Judul, Slug, Excerpt, Konten, Author, dan Meta SEO secara otomatis)`)) {
            setFormTitle(newTitle);
            setFormSlug(newSlug);
            setFormExcerpt(newExcerpt);
            setFormContent(newContent);
            setFormAuthor(authorName);
            setFormSeoTitle(seoTitle);
            setFormSeoDescription(seoDesc);
            if (selectedUrl) {
                setFormCoverImage(selectedUrl);
            }
        }
    };
    // ---------------------------

    // Styles
    const containerStyle = { padding: 24, maxWidth: 1200, margin: "0 auto" };
    const cardStyle = {
        background: darkMode ? "#1e293b" : "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        color: darkMode ? "#f8fafc" : "#0f172a",
    };
    const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 };
    const tableStyle = { width: "100%", borderCollapse: "collapse" as const, marginTop: 16 };
    const thStyle = {
        textAlign: "left" as const, padding: "12px 16px",
        background: darkMode ? "#0f172a" : "#f8fafc",
        borderBottom: "2px solid rgba(0,0,0,0.1)",
        fontSize: 14, fontWeight: 600,
    };
    const tdStyle = { padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)", fontSize: 14 };
    const btnStyle = { padding: "8px 16px", borderRadius: 6, border: "none", fontWeight: 600, cursor: "pointer", fontSize: 14 };
    const primaryBtn = { ...btnStyle, background: "#d4af37", color: "#0b1d3a" };
    const ghostBtn = { ...btnStyle, background: "transparent", border: "1px solid currentColor", opacity: 0.7 };
    const formGroup = { marginBottom: 16 };
    const labelStyle = { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, opacity: 0.9 };
    const inputStyle = {
        width: "100%", padding: "10px", borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.2)",
        background: darkMode ? "#0f172a" : "#fff",
        color: "inherit", fontSize: 14,
    };

    return (
        <>
            {/* Mobile Top Bar */}





            {/* Main Content */}

            <div style={containerStyle}>
                <div style={headerStyle}>
                    <div>
                        <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px 0" }}>Konten Posting & Artikel</h1>
                        <p style={{ margin: 0, opacity: 0.7 }}>Kelola artikel blog, berita, dan konten tekstual lainnya.</p>
                    </div>
                    {!isEditing && (
                        <button style={primaryBtn} onClick={handleCreateNew}>+ Buat Postingan Baru</button>
                    )}
                </div>

                {isEditing ? (
                    <div style={cardStyle}>
                        <h2 style={{ borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: 16, marginBottom: 24 }}>
                            {editId ? "Edit Postingan" : "Buat Postingan Baru"}
                        </h2>

                        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                            <div>
                                <div style={formGroup}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                        <label style={labelStyle}>Judul Artikel</label>
                                        <button
                                            type="button"
                                            style={{ ...ghostBtn, padding: "2px 8px", fontSize: 11, marginBottom: 6, color: "#d97706", borderColor: "#d97706" }}
                                            onClick={handleAutoGenerate}
                                            title="Buat konten & gambar otomatis sesuai judul"
                                        >
                                            ✨ Auto Generate
                                        </button>
                                    </div>
                                    <input style={inputStyle} type="text" value={formTitle} onChange={handleAutoSlug} placeholder="Judul artikel menarik..." />
                                </div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>Slug (URL)</label>
                                    <input style={inputStyle} type="text" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="judul-artikel-menarik" />
                                </div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>Ringkasan (Excerpt)</label>
                                    <textarea style={{ ...inputStyle, minHeight: 80 }} value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)} placeholder="Ringkasan singkat untuk preview..." />
                                </div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>Konten Lengkap (HTML Support)</label>
                                    <textarea style={{ ...inputStyle, minHeight: 400, fontFamily: "monospace" }} value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="<p>Isi artikel...</p>" />
                                </div>
                            </div>

                            <div>
                                <div style={formGroup}>
                                    <label style={labelStyle}>Cover Image</label>
                                    <div style={{ marginBottom: 8, border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 6, minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", overflow: "hidden" }}>
                                        {formCoverImage ? (
                                            <img src={formCoverImage} alt="Cover" style={{ maxWidth: "100%", maxHeight: 200, objectFit: "cover" }} />
                                        ) : (
                                            <span style={{ opacity: 0.5, fontSize: 12 }}>Belum ada gambar</span>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input style={inputStyle} type="text" value={formCoverImage} onChange={(e) => setFormCoverImage(e.target.value)} placeholder="https://..." />
                                        <button type="button" style={{ ...ghostBtn, padding: "0 12px", whiteSpace: "nowrap" }} onClick={openGallery} title="Pilih dari Galeri">📂 Pilih</button>
                                    </div>
                                </div>

                                <div style={formGroup}>
                                    <label style={labelStyle}>Penulis</label>
                                    <input style={inputStyle} type="text" value={formAuthor} onChange={(e) => setFormAuthor(e.target.value)} />
                                </div>

                                <div style={{ ...formGroup, marginTop: 32 }}>
                                    <label style={{ ...labelStyle, color: "#d4af37", borderBottom: "1px solid rgba(212,175,55,0.3)", paddingBottom: 4 }}>SEO Meta Data</label>
                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>SEO Title</label>
                                        <input style={inputStyle} type="text" value={formSeoTitle} onChange={(e) => setFormSeoTitle(e.target.value)} placeholder="Title tag untuk Google..." />
                                    </div>
                                    <div style={{ marginTop: 12 }}>
                                        <label style={labelStyle}>SEO Description</label>
                                        <textarea style={{ ...inputStyle, minHeight: 80 }} value={formSeoDescription} onChange={(e) => setFormSeoDescription(e.target.value)} placeholder="Meta description untuk Google..." />
                                    </div>
                                </div>

                                <div style={{ ...formGroup, display: "flex", alignItems: "center", gap: 12, marginTop: 24, padding: 12, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6 }}>
                                    <input type="checkbox" id="pubCheck" checked={formPublished} onChange={(e) => setFormPublished(e.target.checked)} style={{ width: 20, height: 20 }} />
                                    <label htmlFor="pubCheck" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Publikasikan?</label>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24, borderTop: "1px solid rgba(0,0,0,0.1)", paddingTop: 16 }}>
                            <button style={ghostBtn} onClick={() => setIsEditing(false)} disabled={saving}>Batal</button>
                            <button style={primaryBtn} onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan Artikel"}</button>
                        </div>
                    </div>
                ) : (
                    <div style={cardStyle}>
                        {loading ? <p>Memuat...</p> : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>Judul</th>
                                            <th style={thStyle}>Tanggal</th>
                                            <th style={thStyle}>Status</th>
                                            <th style={thStyle}>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {posts.length === 0 ? (
                                            <tr><td colSpan={4} style={{ ...tdStyle, textAlign: "center", padding: 24, opacity: 0.6 }}>Belum ada postingan.</td></tr>
                                        ) : (
                                            posts.map(post => (
                                                <tr key={post.id}>
                                                    <td style={tdStyle}>
                                                        <div style={{ fontWeight: 600 }}>{post.title}</div>
                                                        <div style={{ fontSize: 12, opacity: 0.7 }}>/{post.slug}</div>
                                                    </td>
                                                    <td style={tdStyle}>{new Date(post.updatedAt).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>
                                                        {post.isPublished ? (
                                                            <span style={{ padding: "4px 8px", borderRadius: 99, background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700 }}>PUBLISHED</span>
                                                        ) : (
                                                            <span style={{ padding: "4px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 700 }}>DRAFT</span>
                                                        )}
                                                    </td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <a
                                                                href={`/artikel/${post.slug}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ ...btnStyle, padding: "4px 8px", fontSize: 12, background: "#f0fdf4", color: "#15803d", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                                                            >
                                                                Lihat
                                                            </a>
                                                            <button style={{ ...btnStyle, padding: "4px 8px", fontSize: 12, background: "#e0f2fe", color: "#0369a1" }} onClick={() => handleEdit(post)}>Edit</button>
                                                            <button style={{ ...btnStyle, padding: "4px 8px", fontSize: 12, background: "#fee2e2", color: "#b91c1c" }} onClick={() => handleDelete(post.id)}>Hapus</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>


            {/* GALLERY MODAL */}
            {galleryOpen && (
                <div style={{
                    position: "fixed", inset: 0,
                    background: "rgba(10, 20, 40, 0.75)",
                    backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999,
                    animation: "fadeIn 0.2s ease-out"
                }} onClick={() => setGalleryOpen(false)}>

                    {/* Keyframes for animation injected inline */}
                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                        .gallery-scroll::-webkit-scrollbar { width: 8px; }
                        .gallery-scroll::-webkit-scrollbar-track { background: transparent; }
                        .gallery-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
                        .gallery-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                    `}} />

                    <div style={{
                        ...cardStyle,
                        width: "95%", maxWidth: 1100,
                        height: "85vh",
                        display: "flex", flexDirection: "column",
                        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        padding: 0,
                        overflow: "hidden",
                        border: darkMode ? "1px solid #334155" : "1px solid rgba(255,255,255,0.8)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                    }} onClick={(e) => e.stopPropagation()}>

                        {/* Header */}
                        <div style={{
                            padding: "20px 24px",
                            borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: darkMode ? "#1e293b" : "#fff"
                        }}>
                            <div>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: 18, fontWeight: 700 }}>Pilih Gambar dari Galeri</h3>
                                <p style={{ margin: 0, fontSize: 13, opacity: 0.6 }}>Klik gambar untuk menjadikannya cover artikel.</p>
                            </div>
                            <button onClick={() => setGalleryOpen(false)} style={{
                                background: darkMode ? "#334155" : "#f1f5f9",
                                border: "none", fontSize: 20, fontWeight: 600,
                                width: 36, height: 36, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", color: "inherit", transition: "all 0.2s"
                            }}>×</button>
                        </div>

                        {/* Search Bar */}
                        <div style={{ padding: "16px 24px", background: darkMode ? "#0f172a" : "#f8fafc" }}>
                            <div style={{ position: "relative" }}>
                                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }}>🔍</span>
                                <input
                                    style={{ ...inputStyle, paddingLeft: 36, height: 44, fontSize: 15 }}
                                    type="text"
                                    placeholder="Cari gambar berdasarkan nama..."
                                    value={gallerySearch}
                                    onChange={(e) => setGallerySearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="gallery-scroll" style={{
                            flex: 1, overflowY: "auto",
                            padding: "24px",
                            background: darkMode ? "#0f172a" : "#f8fafc"
                        }}>
                            {galleryLoading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 200, opacity: 0.6 }}>
                                    <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
                                    <div>Memuat galeri...</div>
                                </div>
                            ) : (
                                <div style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                    gap: 20
                                }}>
                                    {filteredGallery.map(img => {
                                        const isSelected = formCoverImage === img.url;
                                        return (
                                            <div key={img.id}
                                                title={img.title || "Untitled"}
                                                style={{
                                                    cursor: "pointer",
                                                    borderRadius: 12,
                                                    overflow: "hidden",
                                                    position: "relative",
                                                    aspectRatio: "4/3",
                                                    border: isSelected ? "3px solid #d4af37" : (darkMode ? "1px solid #334155" : "1px solid #e2e8f0"),
                                                    background: darkMode ? "#1e293b" : "#fff",
                                                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                                                    transition: "transform 0.2s, box-shadow 0.2s",
                                                }}
                                                onClick={() => selectImage(img.url)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = "translateY(-4px)";
                                                    e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = "none";
                                                    e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                                                }}
                                            >
                                                <img src={img.url} alt={img.title || "img"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

                                                {/* Overlay Gradient */}
                                                <div style={{
                                                    position: "absolute", inset: 0,
                                                    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 30%, transparent 100%)",
                                                    display: "flex", alignItems: "flex-end", padding: 12,
                                                    opacity: 0.9
                                                }}>
                                                    <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, lineHeight: 1.3, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                                                        {img.title || "Untitled"}
                                                    </div>
                                                </div>

                                                {/* Selected Badge */}
                                                {isSelected && (
                                                    <div style={{
                                                        position: "absolute", top: 10, right: 10,
                                                        background: "#d4af37", color: "#0b1d3a",
                                                        width: 24, height: 24, borderRadius: "50%",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontWeight: 700, fontSize: 14, boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                                                    }}>✓</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
