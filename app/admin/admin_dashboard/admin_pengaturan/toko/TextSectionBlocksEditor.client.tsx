"use client";

import * as React from "react";
import styles from "./toko.module.css";

type BlockMode = "heading" | "subtitle" | "body" | "caption";

type TextBlock = {
  mode: BlockMode;
  text: string;
};

export default function TextSectionBlocksEditor({
  initialBlocks,
  fallbackText,
  fallbackMode,
  formId,
  maxBlocks = 8,
}: {
  initialBlocks?: TextBlock[];
  fallbackText?: string;
  fallbackMode?: BlockMode;
  formId?: string;
  maxBlocks?: number;
}) {
  const normalize = React.useCallback((blocks: TextBlock[]) => {
    return blocks
      .map((b) => ({
        mode: b.mode || "body",
        text: b.text || "",
      }))
      .filter((b) => b.text.trim().length > 0);
  }, []);

  const [blocks, setBlocks] = React.useState<TextBlock[]>(() => {
    if (initialBlocks && initialBlocks.length) return initialBlocks;
    const text = (fallbackText || "").trim();
    if (text) {
      return [{ mode: fallbackMode || "body", text }];
    }
    return [{ mode: "body", text: "" }];
  });

  React.useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ formId?: string; blocks?: TextBlock[] }>;
      if (!custom.detail) return;
      if (formId && custom.detail.formId && custom.detail.formId !== formId) return;
      const nextBlocks = Array.isArray(custom.detail.blocks) ? custom.detail.blocks : [];
      if (!nextBlocks.length) return;
      setBlocks(nextBlocks.slice(0, maxBlocks));
    };
    window.addEventListener("text-section-autofill", handler as EventListener);
    return () => window.removeEventListener("text-section-autofill", handler as EventListener);
  }, [formId, maxBlocks]);

  const serialized = React.useMemo(() => JSON.stringify(normalize(blocks)), [blocks, normalize]);

  const onChange = (idx: number, patch: Partial<TextBlock>) => {
    setBlocks((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    );
  };

  const addBlock = () => {
    setBlocks((prev) => {
      if (prev.length >= maxBlocks) return prev;
      return [...prev, { mode: "body", text: "" }];
    });
  };

  const removeBlock = (idx: number) => {
    setBlocks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div>
      <input type="hidden" name="blocksJson" value={serialized} />

      {blocks.map((b, idx) => (
        <div key={`block-${idx}`} className={styles.fieldGroup} style={{ marginBottom: 14 }}>
          <label className={styles.label}>Block #{idx + 1}</label>
          <div className={styles.sectionEditGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Mode</label>
              <select
                className={styles.select}
                value={b.mode}
                onChange={(e) => onChange(idx, { mode: e.target.value as BlockMode })}
              >
                <option value="heading">Heading</option>
                <option value="subtitle">Subtitle</option>
                <option value="body">Body</option>
                <option value="caption">Caption</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Aksi</label>
              <button type="button" className={styles.secondaryButton} onClick={() => removeBlock(idx)}>
                Hapus Block
              </button>
            </div>
          </div>
          <textarea
            className={styles.input}
            rows={4}
            value={b.text}
            onChange={(e) => onChange(idx, { text: e.target.value })}
            placeholder="Tulis teks..."
          />
        </div>
      ))}

      <button type="button" className={styles.secondaryButton} onClick={addBlock}>
        Tambah Block
      </button>
      <p className={styles.helperText} style={{ marginTop: 6 }}>
        Satu section bisa berisi beberapa block (max {maxBlocks}). Mode mengatur gaya teks.
      </p>
    </div>
  );
}
