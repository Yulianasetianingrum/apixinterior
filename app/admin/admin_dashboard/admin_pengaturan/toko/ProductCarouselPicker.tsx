"use client";

import React, { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  nama: string;
  harga?: number;
  // promo display (opsional)
  hargaAsli?: number;
  isPromo?: boolean;
  promoLabel?: string;

  kategori?: string;
  subkategori?: string;
  mainImageId?: number | null;
  galleryImageIds?: number[] | null;
};

type ImageItem = {
  id: number;
  url: string;
  title?: string | null;
};

type Props = {
  products: Product[];
  images: ImageItem[];
  initialIds?: number[];
  /** Back-compat (boleh dipakai kalau ada kode lama) */
  defaultSelectedIds?: number[];
  /** Default: "productIds" */
  inputName?: string;
  showPrice?: boolean;
  buttonLabel?: string;
};

const GOLD = "#D4AF37";
const GOLD_SOFT = "rgba(212, 175, 55, 0.22)";
const BORDER = "rgba(0,0,0,0.10)";
const TEXT = "#111";

function formatRupiah(n?: number) {
  if (typeof n !== "number" || !Number.isFinite(n)) return "";
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `Rp ${Math.round(n).toLocaleString("id-ID")}`;
  }
}


function renderHargaInline(p: Product) {
  const hargaFinal = typeof p.harga === "number" && Number.isFinite(p.harga) ? p.harga : undefined;
  const hargaAsli =
    typeof p.hargaAsli === "number" && Number.isFinite(p.hargaAsli) ? p.hargaAsli : undefined;

  if (p.isPromo && hargaFinal !== undefined && hargaAsli !== undefined && hargaFinal < hargaAsli) {
    return (
      <>
        <span style={{ fontWeight: 800 }}>{formatRupiah(hargaFinal)}</span>
        <span style={{ marginLeft: 8, textDecoration: "line-through", opacity: 0.6 }}>
          {formatRupiah(hargaAsli)}
        </span>
        <span style={{ marginLeft: 8, fontWeight: 800 }}>{p.promoLabel || ""}</span>
      </>
    );
  }

  return <>{hargaFinal !== undefined ? formatRupiah(hargaFinal) : ""}</>;
}

function pickThumbImageId(p: Product): number | null {
  const main = Number(p.mainImageId ?? NaN);
  if (Number.isFinite(main) && main > 0) return main;

  const g = Array.isArray(p.galleryImageIds) ? p.galleryImageIds : [];
  const first = Number(g?.[0] ?? NaN);
  return Number.isFinite(first) && first > 0 ? first : null;
}

export default function ProductCarouselPicker({
  products,
  images,
  initialIds,
  defaultSelectedIds,
  inputName = "productIds",
  showPrice = true,
  buttonLabel = "Pick Produk",
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const initial = useMemo(() => {
    if (Array.isArray(initialIds)) return initialIds;
    if (Array.isArray(defaultSelectedIds)) return defaultSelectedIds;
    return [] as number[];
  }, [initialIds, defaultSelectedIds]);

  const [selectedIds, setSelectedIds] = useState<number[]>(() => [...initial]);

  // Sync kalau server render ulang (mis. setelah simpan) membawa initial berbeda
  useEffect(() => {
    setSelectedIds([...initial]);
  }, [initial]);

  const imageMap = useMemo(() => {
    const m = new Map<number, ImageItem>();
    for (const it of images ?? []) m.set(Number(it.id), it);
    return m;
  }, [images]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedProducts = useMemo(() => {
    const byId = new Map<number, Product>();
    for (const p of products ?? []) byId.set(Number(p.id), p);
    return selectedIds.map((id) => byId.get(id)).filter(Boolean) as Product[];
  }, [products, selectedIds]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return products ?? [];
    return (products ?? []).filter((p) => {
      const s = `${p.id} ${p.nama ?? ""} ${p.kategori ?? ""} ${p.subkategori ?? ""}`.toLowerCase();
      return s.includes(qq);
    });
  }, [products, q]);

  const add = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const remove = (id: number) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  // Drag & drop ordering for selected list
  const onDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData("text/plain", String(id));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropOn = (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const draggedId = Number(raw);
    if (!Number.isFinite(draggedId)) return;
    if (draggedId === targetId) return;

    setSelectedIds((prev) => {
      const from = prev.indexOf(draggedId);
      const to = prev.indexOf(targetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Hidden inputs (order matters) */}
      <div style={{ display: "none" }}>
        <input type="hidden" name={`${inputName}__present`} value="1" />
        {selectedIds.map((id) => (
          <input key={id} type="hidden" name={inputName} value={String(id)} />
        ))}
      </div>

      {/* Collapsed summary (always visible) */}
      <div
        style={{
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 12,
          background: "white",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: TEXT }}>Produk untuk Section</div>
          <div style={{ fontSize: 12, color: "rgba(17,17,17,0.65)" }}>{selectedIds.length} dipilih</div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: "fit-content",
            padding: "10px 12px",
            borderRadius: 12,
            border: `1px solid ${GOLD}`,
            background: GOLD_SOFT,
            color: TEXT,
            cursor: "pointer",
            fontWeight: 900,
          }}
        >
          {buttonLabel}
        </button>

        {selectedProducts.length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedProducts.slice(0, 6).map((p) => (
              <span
                key={p.id}
                style={{
                  fontSize: 12,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  background: "rgba(0,0,0,0.02)",
                  color: TEXT,
                  fontWeight: 800,
                  maxWidth: 260,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={p.nama}
              >
                #{p.id} {p.nama}
              </span>
            ))}
            {selectedProducts.length > 6 ? (
              <span style={{ fontSize: 12, color: "rgba(17,17,17,0.65)", alignSelf: "center" }}>
                +{selectedProducts.length - 6} lagi
              </span>
            ) : null}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "rgba(17,17,17,0.65)" }}>Belum ada produk dipilih.</div>
        )}
      </div>

      {/* Modal */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 9999,
            padding: 16,
            overflow: "auto",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              maxWidth: 1100,
              margin: "0 auto",
              background: "white",
              borderRadius: 18,
              border: `1px solid ${GOLD}`,
              padding: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ color: TEXT, fontWeight: 950, fontSize: 16 }}>{buttonLabel}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: `1px solid ${GOLD}`,
                  background: "white",
                  color: TEXT,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                Tutup
              </button>
            </div>

            {/* Selected preview */}
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, color: TEXT }}>Urutan tampil</div>
                <div style={{ fontSize: 12, color: "rgba(17,17,17,0.65)" }}>Drag &amp; drop untuk ubah urutan.</div>
              </div>

              {selectedProducts.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: `1px dashed ${BORDER}`,
                    color: "rgba(17,17,17,0.65)",
                    fontSize: 13,
                  }}
                >
                  Belum ada produk dipilih. Cari &amp; klik <b>Tambah</b> di bawah.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {selectedProducts.map((p) => {
                    const thumbId = pickThumbImageId(p);
                    const img = thumbId ? imageMap.get(Number(thumbId)) : undefined;

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, Number(p.id))}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDropOn(e, Number(p.id))}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          padding: 10,
                          borderRadius: 14,
                          border: `1px solid ${BORDER}`,
                          background: "white",
                          cursor: "grab",
                        }}
                        title="Drag untuk ubah urutan"
                      >
                        <div
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            border: `1px solid ${BORDER}`,
                            overflow: "hidden",
                            background: "rgba(0,0,0,0.03)",
                            flex: "0 0 auto",
                          }}
                        >
                          {img ? (
                            <img
                              src={img.url}
                              alt={img.title ?? p.nama}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : null}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 900, color: TEXT, display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nama}</span>
                            <span style={{ fontSize: 12, color: "rgba(17,17,17,0.55)" }}>#{p.id}</span>
                          </div>
                          <div style={{ marginTop: 2, fontSize: 12, color: "rgba(17,17,17,0.7)" }}>
                            {showPrice ? renderHargaInline(p) : null}
                            {p.kategori ? `  ${p.kategori}` : ""}
                            {p.subkategori ? `  ${p.subkategori}` : ""}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => remove(Number(p.id))}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${GOLD}`,
                            background: "white",
                            color: TEXT,
                            fontWeight: 900,
                            cursor: "pointer",
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Picker */}
            <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
              <div style={{ fontWeight: 900, color: TEXT }}>Cari produk</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari (id / nama / kategori / subkategori)"
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  borderRadius: 12,
                  border: `1px solid ${GOLD}`,
                  background: "white",
                  color: TEXT,
                  outline: "none",
                  fontWeight: 800,
                }}
              />

              <div style={{ fontSize: 12, color: "rgba(17,17,17,0.65)" }}>{filtered.length} hasil</div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {filtered.map((p) => {
                  const id = Number(p.id);
                  const thumbId = pickThumbImageId(p);
                  const img = thumbId ? imageMap.get(Number(thumbId)) : undefined;
                  const isSelected = selectedSet.has(id);

                  return (
                    <div
                      key={id}
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        padding: 10,
                        borderRadius: 14,
                        border: `1px solid ${BORDER}`,
                        background: "white",
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 12,
                          border: `1px solid ${BORDER}`,
                          overflow: "hidden",
                          background: "rgba(0,0,0,0.03)",
                          flex: "0 0 auto",
                        }}
                      >
                        {img ? (
                          <img
                            src={img.url}
                            alt={img.title ?? p.nama}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 900, color: TEXT, display: "flex", gap: 10, alignItems: "baseline" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nama}</span>
                          <span style={{ fontSize: 12, color: "rgba(17,17,17,0.55)" }}>#{id}</span>
                        </div>
                        <div style={{ marginTop: 2, fontSize: 12, color: "rgba(17,17,17,0.7)", wordBreak: "break-word" }}>
                          {showPrice ? renderHargaInline(p) : null}
                          {p.kategori ? `  ${p.kategori}` : ""}
                          {p.subkategori ? `  ${p.subkategori}` : ""}
                        </div>
                      </div>

                      {isSelected ? (
                        <button
                          type="button"
                          onClick={() => remove(id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${GOLD}`,
                            background: GOLD_SOFT,
                            color: TEXT,
                            fontWeight: 900,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Terpilih
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => add(id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${GOLD}`,
                            background: "white",
                            color: TEXT,
                            fontWeight: 900,
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Tambah
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

