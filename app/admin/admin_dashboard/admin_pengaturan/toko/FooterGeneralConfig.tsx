"use client";

import styles from "./toko.module.css";

type Props = {
    useGlobalContact: boolean;
    setUseGlobalContact: (v: boolean) => void;
    useGlobalSocial: boolean;
    setUseGlobalSocial: (v: boolean) => void;
    whatsapp: string;
    setWhatsapp: (v: string) => void;
    address: string;
    setAddress: (v: string) => void;
    email: string;
    setEmail: (v: string) => void;
    instagram: string;
    setInstagram: (v: string) => void;
    facebook: string;
    setFacebook: (v: string) => void;
    copyright: string;
    setCopyright: (v: string) => void;
};

export default function FooterGeneralConfig({
    useGlobalContact, setUseGlobalContact,
    useGlobalSocial, setUseGlobalSocial,
    whatsapp, setWhatsapp,
    address, setAddress,
    email, setEmail,
    instagram, setInstagram,
    facebook, setFacebook,
    copyright, setCopyright
}: Props) {

    return (
        <div className={styles.sectionEditGrid}>
            {/* COPYRIGHT (Top Priority Highlight) */}
            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1", marginBottom: 20, padding: "20px", background: "#f8fafc", borderRadius: 12, border: "2px solid #3b82f6" }}>
                <label className={styles.label} style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e40af", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📅</span> Copyright Profesional (Teks & Tahun)
                </label>
                <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <input
                        type="text"
                        value={copyright}
                        onChange={(e) => setCopyright(e.target.value)}
                        className={styles.input}
                        style={{ fontSize: "1rem", height: "46px", border: "1px solid #94a3b8" }}
                        placeholder={`© ${new Date().getFullYear()} Apix Interior. All rights reserved.`}
                    />
                    <button
                        type="button"
                        onClick={() => setCopyright(`© ${new Date().getFullYear()} Apix Interior. All rights reserved.`)}
                        style={{
                            padding: "0 24px",
                            background: "#1e40af",
                            color: "white",
                            border: "none",
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            boxShadow: "0 4px 10px rgba(30, 64, 175, 0.2)"
                        }}
                    >
                        Reset ke Tahun {new Date().getFullYear()}
                    </button>
                </div>
                <p style={{ fontSize: 13, color: "#475569", marginTop: 10 }}>
                    <b>INFO:</b> Anda bebas mengubah tahun atau teks di atas. Teks ini akan muncul di posisi paling bawah footer (tengah).
                    <br />Contoh Profesional: <code>&copy; 2026 Apix Interior. All rights reserved.</code>
                </p>
            </div>

            {/* CONTACT TOGGLE */}
            <div style={{ gridColumn: "1 / -1", marginBottom: 12, padding: "12px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={useGlobalContact}
                        onChange={(e) => setUseGlobalContact(e.target.checked)}
                        style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontWeight: 600, color: "#166534" }}>Gunakan Kontak Utama (WhatsApp & Alamat) dari Database</span>
                </label>
                <p style={{ fontSize: 13, color: "#166534", marginTop: 4, marginLeft: 28 }}>
                    Jika dicentang, nomor WhatsApp dan Alamat akan diambil otomatis dari menu <b>Hubungi Kami</b> dan <b>Cabang Toko</b>.
                    <br />
                    <a href="/admin/admin_dashboard/admin_pengaturan" target="_blank" style={{ color: "#166534", textDecoration: "underline", fontWeight: 500 }}>
                        Kelola data di Pengaturan Utama &rarr;
                    </a>
                </p>
            </div>

            {!useGlobalContact && (
                <>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>WhatsApp / Telepon</label>
                        <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            className={styles.input}
                            placeholder="Contoh: 628123..."
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Alamat Lengkap</label>
                        <textarea
                            className={styles.textarea}
                            rows={3}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Jalan Raya..."
                        />
                    </div>
                </>
            )}

            <div className={styles.fieldGroup}>
                <label className={styles.label}>Email (Opsional)</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={styles.input}
                    placeholder="admin@apixinterior.co.id"
                />
            </div>

            {/* SOCIAL TOGGLE */}
            <div style={{ gridColumn: "1 / -1", marginTop: 12, marginBottom: 12, padding: "12px", background: "#f0fdf4", borderRadius: 6, border: "1px solid #bbf7d0" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                    <input
                        type="checkbox"
                        checked={useGlobalSocial}
                        onChange={(e) => setUseGlobalSocial(e.target.checked)}
                        style={{ width: 18, height: 18 }}
                    />
                    <span style={{ fontWeight: 600, color: "#166534" }}>Gunakan Sosial Media Utama dari Database</span>
                </label>
                <p style={{ fontSize: 13, color: "#166534", marginTop: 4, marginLeft: 28 }}>
                    Jika dicentang, link Instagram & Facebook akan diambil otomatis dari menu <b>Media Sosial</b>.
                    <br />
                    <a href="/admin/admin_dashboard/admin_pengaturan" target="_blank" style={{ color: "#166534", textDecoration: "underline", fontWeight: 500 }}>
                        Kelola data di Pengaturan Utama &rarr;
                    </a>
                </p>
            </div>

            {!useGlobalSocial && (
                <div className={styles.row2}>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Instagram</label>
                        <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            className={styles.input}
                            placeholder="@apix_interior"
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>Facebook</label>
                        <input
                            type="text"
                            value={facebook}
                            onChange={(e) => setFacebook(e.target.value)}
                            className={styles.input}
                            placeholder="Apix Interior"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

