"use client";

import styles from "./toko.module.css";

type FooterLink = {
    label: string;
    url: string;
};

type Props = {
    links: FooterLink[];
    onChange: (links: FooterLink[]) => void;
};

export default function FooterLinksEditor({ links, onChange }: Props) {

    const addLink = () => {
        onChange([...links, { label: "", url: "" }]);
    };

    const removeLink = (index: number) => {
        const next = [...links];
        next.splice(index, 1);
        onChange(next);
    };

    const updateLink = (index: number, field: "label" | "url", value: string) => {
        const next = [...links];
        if (next[index]) {
            next[index][field] = value;
            onChange(next);
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px solid #e5e7eb", padding: 16, borderRadius: 8, background: "#f9fafb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Menu / Quick Links</label>
                {/* Auto generate button moved to parent wrapper */}
            </div>

            {links.map((link, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Label (e.g. FAQ)"
                        value={link.label}
                        onChange={(e) => updateLink(idx, "label", e.target.value)}
                        className={styles.input}
                    />
                    <input
                        type="text"
                        placeholder="URL (e.g. #faq)"
                        value={link.url}
                        onChange={(e) => updateLink(idx, "url", e.target.value)}
                        className={styles.input}
                    />
                    <button
                        type="button"
                        onClick={() => removeLink(idx)}
                        style={{
                            padding: "8px",
                            color: "#ef4444",
                            background: "white",
                            border: "1px solid #ef4444",
                            borderRadius: 4,
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}
                        title="Hapus"
                    >
                        ✕
                    </button>
                </div>
            ))}

            <button
                type="button"
                onClick={addLink}
                style={{
                    alignSelf: "start",
                    fontSize: 13,
                    color: "#4b5563",
                    background: "#e5e7eb",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 500
                }}
            >
                + Tambah Link
            </button>
        </div>
    );
}
