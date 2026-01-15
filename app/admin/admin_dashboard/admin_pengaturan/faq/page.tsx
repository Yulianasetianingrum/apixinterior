"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
// import styles from "./faq.module.css"; // We'll use inline styles or layoutStyles for now to keep it simple
import { useAdminTheme } from "../../AdminThemeContext";

type DynamicPage = {
    id: number;
    title: string;
    slug: string;
    content: string;
    isPublished: boolean;
    seoTitle?: string;
    seoDescription?: string;
    updatedAt: string;
};

export default function AdminFaqPage() {
    const router = useRouter();
    const { isDarkMode } = useAdminTheme();

    // State Data
    const [pages, setPages] = useState<DynamicPage[]>([]);
    const [loading, setLoading] = useState(false);

    // State Editor
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const [formTitle, setFormTitle] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formContent, setFormContent] = useState("");
    const [formPublished, setFormPublished] = useState(true);

    // SEO fields (optional)
    const [formSeoTitle, setFormSeoTitle] = useState("");
    const [formSeoDesc, setFormSeoDesc] = useState("");


    // Load Data
    const loadPages = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_pengaturan/faq");
            const json = await res.json();
            if (res.ok) {
                setPages(json.pages || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPages();
    }, []);

    // Handlers
    const handleCreateNew = () => {
        setEditId(null);
        setFormTitle("");
        setFormSlug("");
        setFormContent("");
        setFormPublished(true);
        setFormSeoTitle("");
        setFormSeoDesc("");
        setIsEditing(true);
    };

    const handleEdit = (page: DynamicPage) => {
        setEditId(page.id);
        setFormTitle(page.title);
        setFormSlug(page.slug);
        setFormContent(page.content);
        setFormPublished(page.isPublished);
        setFormSeoTitle(page.seoTitle || "");
        setFormSeoDesc(page.seoDescription || "");
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Yakin hapus halaman ini?")) return;
        setLoading(true);
        try {
            const res = await fetch("/api/admin/admin_dashboard/admin_pengaturan/faq", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            if (res.ok) {
                loadPages();
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

        setLoading(true);
        try {
            const method = editId ? "PUT" : "POST";
            const body = {
                id: editId ?? undefined,
                title: formTitle,
                slug: formSlug,
                content: formContent,
                isPublished: formPublished,
                seoTitle: formSeoTitle,
                seoDescription: formSeoDesc,
            };

            const res = await fetch("/api/admin/admin_dashboard/admin_pengaturan/faq", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json();
            if (res.ok) {
                setIsEditing(false);
                loadPages();
            } else {
                alert(json.message || "Gagal menyimpan");
            }
        } catch (err) {
            console.error(err);
            alert("Terjadi kesalahan");
        } finally {
            setLoading(false);
        }
    };

    const handleAutoSlug = (e: ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setFormTitle(val);
        if (!editId) {
            // Auto slug only on create
            const slug = val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            setFormSlug(slug);
        }
    };

    // Styles (Inline for simplicity given module structure isn't fully exposed)
    const containerStyle = {
        padding: 24,
        maxWidth: 1000,
        margin: "0 auto",
    };

    const cardStyle = {
        background: isDarkMode ? "#1e293b" : "#fff",
        borderRadius: 12,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
        color: isDarkMode ? "#f8fafc" : "#0f172a",
    };

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    };

    const tableStyle = {
        width: "100%",
        borderCollapse: "collapse" as const,
        marginTop: 16,
    };

    const thStyle = {
        textAlign: "left" as const,
        padding: "12px 16px",
        background: isDarkMode ? "#0f172a" : "#f8fafc",
        borderBottom: "2px solid rgba(0,0,0,0.1)",
        fontSize: 14,
        fontWeight: 600,
    };

    const tdStyle = {
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontSize: 14,
    };

    const btnStyle = {
        padding: "8px 16px",
        borderRadius: 6,
        border: "none",
        fontWeight: 600,
        cursor: "pointer",
        fontSize: 14,
    };

    const primaryBtn = {
        ...btnStyle,
        background: "#d4af37",
        color: "#0b1d3a",
    };

    const ghostBtn = {
        ...btnStyle,
        background: "transparent",
        border: "1px solid currentColor",
        opacity: 0.7,
    };

    const formGroup = {
        marginBottom: 16,
    };

    const labelStyle = {
        display: "block",
        marginBottom: 6,
        fontSize: 14,
        fontWeight: 500,
        opacity: 0.9,
    };

    const inputStyle = {
        width: "100%",
        padding: "10px",
        borderRadius: 6,
        border: "1px solid rgba(0,0,0,0.2)",
        background: isDarkMode ? "#0f172a" : "#fff",
        color: "inherit",
        fontSize: 14,
    };

    const handleAutoGenerate = () => {
        if (!formTitle && !formSlug) {
            alert("Harap isi Slug atau Judul terlebih dahulu agar sistem tahu konteks halaman.");
            return;
        }

        const slug = (formSlug || formTitle).toLowerCase();
        let generatedContent = "";
        let generatedTitle = formTitle;
        let generatedSeoDesc = "";

        // Template Logic
        if (slug.includes("faq") || slug.includes("tanya")) {
            generatedTitle = "Frequently Asked Questions (FAQ)";
            generatedSeoDesc = "Pertanyaan yang sering diajukan seputar produk, pemesanan, dan pengiriman di APIX Interior.";
            generatedContent = `
<h2>Pemesanan</h2>
<ul>
    <li><strong>Bagaimana cara memesan?</strong><br>Anda dapat memilih produk di website kami, klik tombol 'Pesan via WhatsApp', dan tim kami akan membantu proses selanjutnya.</li>
    <li><strong>Apakah bisa custom ukuran?</strong><br>Ya, kami menerima pesanan custom (ukuran, warna, material) untuk hampir semua produk furniture.</li>
</ul>

<h2>Pengiriman & Pemasangan</h2>
<ul>
    <li><strong>Apakah mengirim ke seluruh Indonesia?</strong><br>Ya, kami melayani pengiriman ke seluruh kota di Indonesia menggunakan ekspedisi terpercaya.</li>
    <li><strong>Apakah harga sudah termasuk pemasangan?</strong><br>Untuk area JABODETABEK, harga sudah termasuk jasa pasang. Untuk luar kota, mohon hubungi sales kami.</li>
</ul>

<h2>Pembayaran</h2>
<ul>
    <li><strong>Metode pembayaran apa saja?</strong><br>Kami menerima Transfer Bank (BCA, Mandiri) dan Kartu Kredit.</li>
    <li><strong>Apakah bisa DP dulu?</strong><br>Ya, untuk pesanan custom, kami memerlukan DP 50% dan pelunasan sebelum barang dikirim.</li>
</ul>
            `;
        } else if (slug.includes("privacy") || slug.includes("privasi")) {
            generatedTitle = "Kebijakan Privasi (Privacy Policy)";
            generatedSeoDesc = "Kebijakan privasi APIX Interior dalam melindungi data pribadi pengguna website kami.";
            generatedContent = `
<p><strong>Terakhir Diperbarui: ${new Date().toLocaleDateString()}</strong></p>
<p>APIX Interior ("kami") menghargai privasi Anda. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan website kami.</p>

<h3>1. Informasi yang Kami Kumpulkan</h3>
<p>Kami dapat mengumpulkan informasi seperti Nama, Nomor WhatsApp, dan Alamat ketika Anda menghubungi kami untuk pemesanan.</p>

<h3>2. Penggunaan Informasi</h3>
<p>Informasi Anda hanya digunakan untuk memproses pesanan, mengatur pengiriman, dan memberikan layanan pelanggan. Kami tidak menjual data Anda ke pihak ketiga.</p>

<h3>3. Keamanan</h3>
<p>Kami menggunakan standar keamanan industri untuk melindungi website dan database kami dari akses tidak sah.</p>

<h3>4. Hubungi Kami</h3>
<p>Jika ada pertanyaan mengenai kebijakan ini, silakan hubungi kami melalui halaman Hubungi Kami.</p>
            `;
        } else if (slug.includes("term") || slug.includes("syarat")) {
            generatedTitle = "Syarat & Ketentuan (Terms & Conditions)";
            generatedSeoDesc = "Syarat dan ketentuan bertransaksi di APIX Interior. Harap baca sebelum melakukan pemesanan.";
            generatedContent = `
<p>Selamat datang di APIX Interior. Dengan mengakses website atau melakukan pemesanan, Anda menyetujui syarat dan ketentuan berikut:</p>

<h3>1. Produk & Pemesanan</h3>
<ul>
    <li>Warna produk di layar mungkin sedikit berbeda dengan aslinya karena pencahayaan foto.</li>
    <li>Detail ukuran memiliki toleransi 1-2 cm untuk produk kerajinan tangan/kayu.</li>
</ul>

<h3>2. Pembayaran & Harga</h3>
<ul>
    <li>Harga dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.</li>
    <li>Pesanan dianggap sah setelah pembayaran DP atau lunas dikonfirmasi.</li>
</ul>

<h3>3. Pengembalian & Garansi</h3>
<ul>
    <li>Klaim kerusakan akibat pengiriman wajib menyertakan Video Unboxing.</li>
    <li>Kami memberikan garansi struktural (rangka) selama 6 bulan sejak barang diterima.</li>
</ul>
            `;
        } else if (slug.includes("about") || slug.includes("tentang")) {
            generatedTitle = "Tentang Kami";
            generatedSeoDesc = "Mengenal lebih dekat APIX Interior, penyedia furniture berkualitas dan desain interior modern.";
            generatedContent = `
<p><strong>APIX Interior</strong> adalah penyedia solusi furniture dan desain interior modern yang berbasis di [Kota Anda]. Kami berdedikasi untuk menciptakan ruang yang estetis, fungsional, dan nyaman bagi hunian maupun bisnis Anda.</p>

<h3>Visi Kami</h3>
<p>Menjadi partner terpercaya dalam mewujudkan interior impian dengan kualitas terbaik dan harga kompetitif.</p>

<h3>Mengapa Memilih Kami?</h3>
<ul>
    <li><strong>Kualitas Premium:</strong> Menggunakan material pilihan grade A (Kayu Jati, Mahoni, Multiplex Berkualitas).</li>
    <li><strong>Desain Custom:</strong> Wujudkan ide Anda menjadi kenyataan bersama tim desain kami.</li>
    <li><strong>Bergaransi:</strong> Layanan purna jual terjamin untuk kepuasan pelanggan.</li>
</ul>
            `;
        } else {
            generatedContent = `
<p>Halaman ini berisi informasi mengenai <strong>${formTitle}</strong>.</p>
<h3>Subjudul Halaman</h3>
<p>Silakan isi konten lengkap di sini. Anda dapat menggunakan editor ini untuk menambahkan teks, daftar, dan informasi lainnya.</p>
            `;
        }

        if (confirm("Konten otomatis akan menimpa isi yang ada. Lanjutkan?")) {
            setFormContent(generatedContent.trim());
            setFormTitle(generatedTitle);
            setFormSeoDesc(generatedSeoDesc);
        }
    };



    return (
        <div className={layoutStyles.dashboard}>
            {/* MAIN CONTENT */}
            <main className={`${layoutStyles.main} ${isDarkMode ? layoutStyles.mainDark : ""}`} style={{ background: isDarkMode ? "#0f172a" : "#f1f5f9", minHeight: "100vh" }}>
                <div style={containerStyle}>

                    <div style={headerStyle}>
                        <div>
                            <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px 0" }}>Halamanan Dinamis (FAQ, dll)</h1>
                            <p style={{ margin: 0, opacity: 0.7 }}>Kelola halaman tambahan website seperti FAQ, Terms, Privacy Policy.</p>
                        </div>
                        {!isEditing && (
                            <button style={primaryBtn} onClick={handleCreateNew} disabled={loading}>
                                + Tambah Halaman
                            </button>
                        )}
                    </div>

                    {isEditing ? (
                        <div style={cardStyle}>
                            <h2 style={{ marginTop: 0, marginBottom: 24, borderBottom: "1px solid rgba(0,0,0,0.1)", paddingBottom: 16 }}>
                                {editId ? "Edit Halaman" : "Buat Halaman Baru"}
                            </h2>

                            <div style={formGroup}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                                    <label style={labelStyle}>Judul Halaman</label>
                                    <button
                                        type="button"
                                        style={{ ...ghostBtn, padding: "4px 8px", fontSize: 12, marginBottom: 6, color: "#d97706", borderColor: "#d97706" }}
                                        onClick={handleAutoGenerate}
                                        title="Isi konten otomatis berdasarkan judul/slug"
                                    >
                                        ✨ Auto Generate Isi Konten
                                    </button>
                                </div>
                                <input
                                    style={inputStyle}
                                    type="text"
                                    value={formTitle}
                                    onChange={handleAutoSlug}
                                    placeholder="Contoh: Frequently Asked Questions"
                                />
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>Slug (URL)</label>
                                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                                    <span style={{
                                        position: "absolute",
                                        left: 10,
                                        color: isDarkMode ? "#94a3b8" : "#64748b",
                                        fontWeight: 600,
                                        userSelect: "none"
                                    }}>/</span>
                                    <input
                                        style={{ ...inputStyle, paddingLeft: 24 }}
                                        type="text"
                                        value={formSlug}
                                        onChange={(e) => {
                                            // Remove slashes and spaces, keep mostly alphanumeric
                                            const clean = e.target.value.replace(/[^a-z0-9-]/gi, "");
                                            setFormSlug(clean);
                                        }}
                                        placeholder="faq"
                                    />
                                </div>
                                <small style={{ display: "block", marginTop: 4, opacity: 0.6 }}>Link: yoursite.com/{formSlug || "..."}</small>
                            </div>

                            <div style={formGroup}>
                                <label style={labelStyle}>Konten Halaman (HTML Support)</label>
                                <textarea
                                    style={{ ...inputStyle, minHeight: 300, fontFamily: "monospace" }}
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="<p>Tulis konten di sini...</p>"
                                />
                                <small style={{ display: "block", marginTop: 4, opacity: 0.6 }}>Tips: Gunakan tag &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt; untuk format rapi.</small>
                            </div>

                            <div style={{ ...formGroup, display: "flex", alignItems: "center", gap: 12 }}>
                                <input
                                    type="checkbox"
                                    id="pubCheck"
                                    checked={formPublished}
                                    onChange={(e) => setFormPublished(e.target.checked)}
                                    style={{ width: 20, height: 20 }}
                                />
                                <label htmlFor="pubCheck" style={{ ...labelStyle, marginBottom: 0, cursor: "pointer" }}>Publikasikan Halaman ini?</label>
                            </div>

                            <details style={{ marginBottom: 24, background: "rgba(0,0,0,0.02)", padding: 12, borderRadius: 6 }}>
                                <summary style={{ cursor: "pointer", fontWeight: 600 }}>SEO Settings (Optional)</summary>
                                <div style={{ marginTop: 12 }}>
                                    <div style={formGroup}>
                                        <label style={labelStyle}>SEO Title</label>
                                        <input style={inputStyle} value={formSeoTitle} onChange={(e) => setFormSeoTitle(e.target.value)} />
                                    </div>
                                    <div style={formGroup}>
                                        <label style={labelStyle}>Meta Description</label>
                                        <textarea style={{ ...inputStyle, minHeight: 80 }} value={formSeoDesc} onChange={(e) => setFormSeoDesc(e.target.value)} />
                                    </div>
                                </div>
                            </details>

                            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                                <button style={ghostBtn} onClick={() => setIsEditing(false)} disabled={loading}>
                                    Batal
                                </button>
                                <button style={primaryBtn} onClick={handleSave} disabled={loading}>
                                    {loading ? "Menyimpan..." : "Simpan"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={cardStyle}>
                            {pages.length === 0 ? (
                                <div style={{ textAlign: "center", padding: 40, opacity: 0.6 }}>
                                    <p>Belum ada halaman dinamis.</p>
                                    <p>Silakan buat halaman FAQ, Privacy Policy, dll.</p>
                                    <button
                                        style={{ ...primaryBtn, marginTop: 16 }}
                                        onClick={handleCreateNew}
                                    >
                                        Buat Halaman Pertama
                                    </button>
                                </div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={tableStyle}>
                                        <thead>
                                            <tr>
                                                <th style={thStyle}>Judul</th>
                                                <th style={thStyle}>URL Slug</th>
                                                <th style={thStyle}>Status</th>
                                                <th style={thStyle}>Last Updated</th>
                                                <th style={thStyle}>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pages.map((p) => (
                                                <tr key={p.id}>
                                                    <td style={tdStyle}>
                                                        <strong>{p.title}</strong>
                                                    </td>
                                                    <td style={{ ...tdStyle, fontFamily: "monospace" }}>/{p.slug}</td>
                                                    <td style={tdStyle}>
                                                        {p.isPublished ? (
                                                            <span style={{ padding: "4px 8px", borderRadius: 99, background: "#dcfce7", color: "#166534", fontSize: 12, fontWeight: 700 }}>Published</span>
                                                        ) : (
                                                            <span style={{ padding: "4px 8px", borderRadius: 99, background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 700 }}>Draft</span>
                                                        )}
                                                    </td>
                                                    <td style={tdStyle}>{new Date(p.updatedAt).toLocaleDateString()}</td>
                                                    <td style={tdStyle}>
                                                        <div style={{ display: "flex", gap: 8 }}>
                                                            <button style={{ ...btnStyle, padding: "6px 12px", background: "#f0f9ff", color: "#0369a1", fontSize: 12 }} onClick={() => handleEdit(p)}>
                                                                Edit
                                                            </button>
                                                            <button style={{ ...btnStyle, padding: "6px 12px", background: "#fef2f2", color: "#b91c1c", fontSize: 12 }} onClick={() => handleDelete(p.id)}>
                                                                Hapus
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
