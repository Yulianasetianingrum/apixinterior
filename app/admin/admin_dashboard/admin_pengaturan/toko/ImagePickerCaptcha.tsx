"use client";

import React, { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type GambarItem = {
  id: number;
  url: string;
  title?: string | null;
  tags?: string | null;
};

type Props = {
  action: (formData: FormData) => Promise<any>;
  sectionId: string;
  attach: string; // e.g. "HIGHLIGHT_COLLECTION:heroImageId"
  endpoint?: string;
  limit?: number;
  buttonLabel?: string;
  allowUpload?: boolean; // default: true
  autoApplyOnSelect?: boolean; // default: false
  accept?: string; // default: image/*
  skipRefresh?: boolean; // default: false
  onAppliedImageId?: (id: number) => void;
  onAppliedImage?: (img: GambarItem) => void;
  currentImageId?: number; // ID of currently selected image to highlight
};

function normalizeApiResult(json: any): { data: GambarItem[] } {
  if (Array.isArray(json)) return { data: json };
  if (json && Array.isArray(json.data)) return { data: json.data };
  return { data: [] };
}

const GOLD = "#D4AF37";
const GOLD_SOFT = "rgba(212, 175, 55, 0.22)";
const GOLD_SOFT2 = "rgba(212, 175, 55, 0.35)";
const TEXT = "#111";

export default function ImagePickerCaptcha({
  action,
  sectionId,
  attach,
  endpoint = "/api/admin/admin_dashboard/admin_galeri/list_gambar",
  limit = 40,
  buttonLabel = "Buka Picker Gambar",
  allowUpload = true,
  autoApplyOnSelect = false,
  accept = "image/*",
  skipRefresh = false,
  onAppliedImageId,
  onAppliedImage,
  currentImageId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<GambarItem[]>([]);
  const [selected, setSelected] = useState<GambarItem | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isNextRedirect = (e: any) => {
    const d = String((e as any)?.digest ?? "");
    return d.includes("NEXT_REDIRECT") || String(e).includes("NEXT_REDIRECT");
  };

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [uploadOk, setUploadOk] = useState<string | null>(null);
  const uploadFileRef = useRef<HTMLInputElement | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const url = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    sp.set("limit", String(limit));
    sp.set("page", String(page));
    sp.set("lite", "1");
    const joiner = endpoint.includes("?") ? "&" : "?";
    return `${endpoint}${joiner}${sp.toString()}`;
  }, [endpoint, q, limit, page]);

  const fetchItems = async () => {
    setLoading(true);
    setErr(null);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch(url, { signal: ac.signal, cache: "no-store" });
      const json = await res.json();
      const { data } = normalizeApiResult(json);

      // Fallback client-side filter if API doesn't support q.
      const qq = q.trim().toLowerCase();
      const filtered =
        qq.length === 0
          ? data
          : data.filter((it) => {
            const t = (it.title ?? "").toLowerCase();
            const tg = (it.tags ?? "").toLowerCase();
            const u = (it.url ?? "").toLowerCase();
            return t.includes(qq) || tg.includes(qq) || u.includes(qq) || String(it.id).includes(qq);
          });

      setItems(filtered);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setErr("Gagal memuat gambar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page]);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setPage(1);
      fetchItems();
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, open]);

  useEffect(() => {
    if (!open) {
      setErr(null);
      setLoading(false);
      abortRef.current?.abort();
      abortRef.current = null;
      setUploadErr(null);
      setUploadOk(null);
      setUploadFile(null);
      setUploadTitle("");
      setUploadTags("");
    } else {
      // Handle scroll lock
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!alertMsg) return;
    const t = window.setTimeout(() => setAlertMsg(null), 3000);
    return () => window.clearTimeout(t);
  }, [alertMsg]);

  const submitById = (id: number) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("sectionId", sectionId);
      fd.set("attach", attach);
      fd.set("imageId", String(id));
      const layoutSel = document.getElementById(`cp-layout-${sectionId}`) as HTMLSelectElement | null;
      if (layoutSel?.value) fd.set("layout", layoutSel.value);

      try {
        const res: any = await action(fd);
        if (res && res.ok === false) {
          const msg = res.error || "Gagal memakai gambar.";
          setUploadErr(msg);
          setAlertMsg(msg);
          setUploadOk(null);
          return;
        }
        setUploadErr(null);
        setUploadOk("Berhasil dipakai.");
        if (onAppliedImageId) onAppliedImageId(id);
        if (onAppliedImage) {
          const found = items.find((x) => x.id === id);
          if (found) onAppliedImage(found);
        }
        if (skipRefresh) return;
        if (attach && attach.startsWith("CUSTOM_PROMO")) {
          const u = new URL(window.location.href);
          u.searchParams.set("r", String(Date.now()));
          window.location.href = u.toString();
          return;
        }
        // FIXED: Use hard reload instead of router.refresh() to bypass Next.js cache
        window.location.reload();
      } catch (e: any) {
        // Antisipasi NEXT_REDIRECT / error server action lainnya
        const msg = e?.message || "Gagal memakai gambar (exception).";
        setUploadErr(msg);
        setAlertMsg(msg);
        setUploadOk(null);
      }
    });
  };

  const submitPicked = () => {
    if (!selected) return;

    submitById(selected.id);
  };

  const submitUpload = () => {
    if (!uploadFile) {
      const msg = "Pilih file gambar dulu.";
      setUploadErr(msg);
      setAlertMsg(msg);
      return;
    }

    setUploadErr(null);
    setUploadOk(null);
    startTransition(async () => {
      try {
        // 1. Upload ke Gallery Endpoint via Client Fetch
        // Gunakan endpoint yang sama persis dengan `admin_galeri/kolase_foto`
        const uploadEndpoint = "/api/admin/admin_dashboard/admin_galeri/upload_foto";

        const fdUpload = new FormData();
        fdUpload.append("foto", uploadFile);
        if (uploadTitle.trim()) fdUpload.append("title", uploadTitle.trim());
        if (uploadTags.trim()) fdUpload.append("tags", uploadTags.trim());

        const resUpload = await fetch(uploadEndpoint, {
          method: "POST",
          body: fdUpload,
        });

        if (!resUpload.ok) {
          throw new Error("Gagal upload ke server (Fetch Error).");
        }

        const jsonUpload = await resUpload.json();
        // Fallback: jika API tidak return data array (meski harusnya iya), kita tidak bisa pakai.
        if (!jsonUpload.success || !jsonUpload.data?.[0]?.id) {
          throw new Error(jsonUpload.error || "Gagal upload: tidak ada ID yang dikembalikan.");
        }

        const newImageId = jsonUpload.data[0].id;

        // 2. Panggil Action dengan imageId yang baru
        const fd = new FormData();
        fd.set("sectionId", sectionId);
        fd.set("attach", attach);
        fd.set("imageId", String(newImageId)); // Kirim ID saja

        const layoutSel = document.getElementById(`cp-layout-${sectionId}`) as HTMLSelectElement | null;
        if (layoutSel?.value) fd.set("layout", layoutSel.value);
        if (uploadTitle.trim()) fd.set("title", uploadTitle.trim());
        if (uploadTags.trim()) fd.set("tags", uploadTags.trim());

        const res: any = await action(fd);
        if (res && res.ok === false) {
          const msg = res.error || "Upload berhasil, tapi gagal dipakai.";
          setUploadErr(msg);
          setAlertMsg(msg);
          setUploadOk(null);
          return;
        }

        setUploadErr(null);
        setUploadOk("Berhasil diupload & dipakai.");
        setUploadFile(null);
        setUploadTitle("");
        setUploadTags("");
        if (uploadFileRef.current) uploadFileRef.current.value = "";

        // Trigger callback with new ID
        if (newImageId && onAppliedImageId) onAppliedImageId(Number(newImageId));
        if (newImageId && onAppliedImage && jsonUpload.data?.[0]) {
          onAppliedImage(jsonUpload.data[0]);
        }

        if (skipRefresh) return;
        if (attach && attach.startsWith("CUSTOM_PROMO")) {
          const u = new URL(window.location.href);
          u.searchParams.set("r", String(Date.now()));
          window.location.href = u.toString();
          return;
        }

        // Use router.refresh() for smoother UX (Server Component Re-render)
        router.refresh();

      } catch (e: any) {
        const msg = e?.message || "Upload gagal (exception).";
        setUploadErr(msg);
        setAlertMsg(msg);
        setUploadOk(null);
      }
    });
  };


  return (
    <div style={{ display: "grid", gap: 10 }}>
      {alertMsg ? (
        <div
          role="alertdialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setAlertMsg(null);
          }}
        >
          <div
            style={{
              width: "min(560px, 94vw)",
              background: "#fff5f5",
              border: "1px solid #d32f2f",
              borderRadius: 16,
              padding: 16,
              color: "#611a15",
              boxShadow: "0 16px 36px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ fontWeight: 900, fontSize: 16, color: "#b00020" }}>Perhatian</div>
            <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.45 }}>{alertMsg}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setAlertMsg(null)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: "1px solid #b00020",
                  background: "#b00020",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

      {selected ? (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ color: "rgba(17,17,17,0.85)", fontSize: 12 }}>
            Terpilih: <b>#{selected.id}</b> {selected.title ? ` ${selected.title}` : ""}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <img
              src={selected.url}
              alt={selected.title ?? `Gambar ${selected.id}`}
              style={{
                width: 120,
                height: 76,
                objectFit: "cover",
                borderRadius: 12,
                border: `1px solid ${GOLD}`,
              }}
            />

            <button
              type="button"
              onClick={submitPicked}
              disabled={isPending}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${GOLD}`,
                background: GOLD_SOFT2,
                color: TEXT,
                cursor: isPending ? "not-allowed" : "pointer",
                fontWeight: 900,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending ? "Menyimpan" : "Pakai gambar ini"}
            </button>

            <button
              type="button"
              onClick={() => setSelected(null)}
              disabled={isPending}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${GOLD}`,
                background: "white",
                color: TEXT,
                cursor: isPending ? "not-allowed" : "pointer",
                fontWeight: 800,
                opacity: isPending ? 0.7 : 1,
              }}
            >
              Ganti pilihan
            </button>
          </div>
        </div>
      ) : null}

      {open && typeof document !== "undefined" ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 99999,
            display: "grid",
            placeItems: "center",
            padding: "20px 16px",
            overflow: "hidden",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 980,
              maxHeight: "90vh",
              background: "white",
              borderRadius: 24,
              border: `1px solid ${GOLD}`,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
              overflow: "hidden",
              animation: "modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
              padding: "20px 24px",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              background: "#fff"
            }}>
              <div style={{ color: TEXT, fontWeight: 950, fontSize: 18 }}>Pilih gambar dari galeri</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 12,
                  border: `1px solid ${BORDER}`,
                  background: "white",
                  color: TEXT,
                  cursor: "pointer",
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                Tutup
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
              <style>{`
                @keyframes modalIn {
                  from { opacity: 0; transform: translateY(20px) scale(0.98); }
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>

              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari (id / title / tags)"
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

                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12 }}>
                    {loading ? "Memuat" : err ? err : `${items.length} hasil`}
                  </div>

                  {allowUpload ? (
                    <div
                      style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 14,
                        border: "1px dashed rgba(0,0,0,0.25)",
                        background: "rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ fontWeight: 900, color: TEXT }}>Upload &amp; Pakai</div>
                      <div style={{ fontSize: 12, color: "rgba(17,17,17,0.7)", marginTop: 6 }}>
                        Upload gambar baru lalu otomatis dipakai untuk field ini.
                      </div>


                      <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                        <input
                          type="file"
                          name="file"
                          accept={accept}
                          required
                          ref={uploadFileRef}
                          onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                          style={{ fontSize: 12 }}
                        />

                        <input
                          value={uploadTitle}
                          onChange={(e) => setUploadTitle(e.target.value)}
                          placeholder="Title (opsional)"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.14)",
                          }}
                        />

                        <input
                          value={uploadTags}
                          onChange={(e) => setUploadTags(e.target.value)}
                          placeholder="Tags (opsional)"
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.14)",
                          }}
                        />

                        {uploadErr ? (
                          <div style={{ fontSize: 12, fontWeight: 900, color: "crimson" }}>{uploadErr}</div>
                        ) : null}

                        {uploadOk ? (
                          <div style={{ fontSize: 12, fontWeight: 900, color: "green" }}>{uploadOk}</div>
                        ) : null}

                        <button
                          type="button"
                          onClick={submitUpload}
                          disabled={isPending}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: `1px solid ${GOLD}`,
                            background: GOLD,
                            color: "white",
                            fontWeight: 900,
                            cursor: isPending ? "not-allowed" : "pointer",
                            opacity: isPending ? 0.7 : 1,
                          }}
                        >
                          {isPending ? "Mengunggah" : "Upload & Pakai"}
                        </button>
                      </div>

                    </div>
                  ) : null}

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1 || loading}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: `1px solid ${GOLD}`,
                        background: "white",
                        color: TEXT,
                        cursor: page <= 1 || loading ? "not-allowed" : "pointer",
                        fontWeight: 900,
                        opacity: page <= 1 || loading ? 0.5 : 1,
                      }}
                    >
                      Prev
                    </button>
                    <div style={{ color: "rgba(17,17,17,0.8)", fontSize: 12, fontWeight: 900 }}>Page {page}</div>
                    <button
                      type="button"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={loading}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: `1px solid ${GOLD}`,
                        background: "white",
                        color: TEXT,
                        cursor: loading ? "not-allowed" : "pointer",
                        fontWeight: 900,
                        opacity: loading ? 0.5 : 1,
                      }}
                    >
                      Next
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                    gap: 10,
                  }}
                >
                  {items.map((it) => {
                    const isCurrentlySelected = currentImageId && it.id === currentImageId;
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => {
                          setSelected(it);
                          setOpen(false);
                          if (autoApplyOnSelect) submitById(it.id);
                        }}
                        style={{
                          position: "relative",
                          textAlign: "left",
                          padding: 8,
                          borderRadius: 14,
                          border: isCurrentlySelected ? `3px solid ${GOLD}` : "1px solid rgba(0,0,0,0.12)",
                          background: isCurrentlySelected ? GOLD_SOFT : "white",
                          cursor: "pointer",
                          color: TEXT,
                        }}
                        title={`${it.title ?? ""} ${it.tags ?? ""}`.trim() || `#${it.id}`}
                      >
                        {isCurrentlySelected && (
                          <div
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              width: 28,
                              height: 28,
                              borderRadius: "50%",
                              background: GOLD,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 900,
                              fontSize: 16,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                              zIndex: 10,
                            }}
                          >
                            ✓
                          </div>
                        )}
                        <img
                          src={it.url}
                          alt={it.title ?? `Gambar ${it.id}`}
                          style={{
                            width: "100%",
                            height: 110,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: isCurrentlySelected ? `2px solid ${GOLD}` : "1px solid rgba(0,0,0,0.10)",
                            background: "rgba(0,0,0,0.03)",
                          }}
                        />
                        <div style={{ marginTop: 8, fontSize: 12, fontWeight: 900 }}>#{it.id}</div>
                        <div style={{ marginTop: 2, fontSize: 11, color: "rgba(17,17,17,0.75)" }}>
                          {(it.title ?? "").slice(0, 40) || "(tanpa judul)"}
                        </div>
                        {it.tags ? (
                          <div style={{ marginTop: 2, fontSize: 10, color: "rgba(17,17,17,0.55)" }}>
                            {String(it.tags).slice(0, 60)}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      ) : null}
    </div>
  );
}
