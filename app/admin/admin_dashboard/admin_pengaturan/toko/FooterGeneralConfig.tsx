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
};

export default function FooterGeneralConfig({
    useGlobalContact, setUseGlobalContact,
    useGlobalSocial, setUseGlobalSocial,
    whatsapp, setWhatsapp,
    address, setAddress,
    email, setEmail,
    instagram, setInstagram,
    facebook, setFacebook
}: Props) {

    return (
        <div className={styles.sectionEditGrid}>
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
                    placeholder="admin@apixinterior.com"
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
