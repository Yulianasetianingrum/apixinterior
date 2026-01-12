"use client";

type FooterTag = {
    label: string;
    url: string;
};

type Props = {
    tags: FooterTag[];
    onChange: (tags: FooterTag[]) => void;
};

export default function FooterTagsEditor({ tags, onChange }: Props) {

    const addTag = () => {
        onChange([...tags, { label: "", url: "" }]);
    };

    const removeTag = (index: number) => {
        const next = [...tags];
        next.splice(index, 1);
        onChange(next);
    };

    const updateTag = (index: number, value: string) => {
        const next = [...tags];
        if (next[index]) {
            next[index].label = value;
            next[index].url = ""; // Keep URL empty
            onChange(next);
        }
    };

    // Bulk add helper
    const handlePaste = () => {
        const text = prompt("Paste list tags (Pisahkan dengan Enter). Contoh:\nSofa\nMeja Makan");
        if (text) {
            const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
            const newTags = lines.map(label => ({
                label,
                url: ""
            }));
            onChange([...tags, ...newTags]);
        }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, border: "1px solid #e5e7eb", padding: 16, borderRadius: 8, background: "#f9fafb", marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>Tags (SEO Plain Text)</label>
                <button
                    type="button"
                    onClick={handlePaste}
                    style={{
                        fontSize: 12,
                        color: "#0f172a",
                        background: "#e2e8f0",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: 4,
                        cursor: "pointer",
                    }}
                >
                    📋 Paste Bulk List
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 40px", gap: 8, alignItems: "center" }}>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Label Keyword</div>
                <div></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                {tags.map((tag, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 40px", gap: 8, alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="Contoh: Sofa Ruang Tamu"
                            value={tag.label}
                            onChange={(e) => updateTag(idx, e.target.value)}
                            style={{
                                padding: "8px 12px",
                                border: "1px solid #d1d5db",
                                borderRadius: 4,
                                fontSize: 13,
                                width: "100%"
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => removeTag(idx)}
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
            </div>

            <button
                type="button"
                onClick={addTag}
                style={{
                    alignSelf: "start",
                    fontSize: 13,
                    color: "#4b5563",
                    background: "#e5e7eb",
                    border: "none",
                    padding: "6px 12px",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontWeight: 500,
                    marginTop: 8
                }}
            >
                + Tambah Tag
            </button>
        </div>
    );
}
