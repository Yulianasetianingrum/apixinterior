"use client";

import {
  FormEvent,
  DragEvent,
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import layoutStyles from "../../admin_dashboard.module.css";
import styles from "./page.module.css";
import "./legacy_widget.css";
import { useAdminTheme } from "../../AdminThemeContext";

import Link from "next/link";


type GambarKolase = {
  id: number;
  url: string;
  title: string | null;
  tags: string;
};


type ImagePickerModalProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (imgs: GambarKolase[]) => void;
  initialSelectedIds: number[];
  onNotify?: (msg: string) => void;
  maxPick?: number; // default 15
};

/* ================= MODAL PILIH GAMBAR DARI KOLASE ================= */
function ImagePickerModal({
  open,
  onClose,
  onSelect,
  initialSelectedIds,
  onNotify,
  maxPick,
}: ImagePickerModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GambarKolase[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const MAX_PICK = maxPick ?? 15;

  useEffect(() => {
    if (!open) return;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(
          "/api/admin/admin_dashboard/admin_galeri/list_gambar"
        );
        const json = await res.json();
        const items =
          Array.isArray(json)
            ? json
            : json?.data ?? json?.images ?? json?.gambar ?? json?.items ?? [];
        const normalized = (Array.isArray(items) ? items : [])
          .map((g: any) => {
            const urlRaw = g?.url ?? g?.path ?? g?.imageUrl ?? g?.src ?? "";
            const url =
              typeof urlRaw === "string" && urlRaw
                ? urlRaw.startsWith("http") || urlRaw.startsWith("/")
                  ? urlRaw
                  : "/" + urlRaw
                : "";
            return {
              ...g,
              url,
            };
          })
          .filter((g: any) => typeof g?.id === "number" && g?.id > 0 && !!g?.url);
        setData(normalized);
      } catch (err) {
        console.error("Gagal load kolase foto", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [open]);

  useEffect(() => {
    if (open) {
      setSelectedIds(initialSelectedIds.slice(0, MAX_PICK));
    }
  }, [open, initialSelectedIds]);

  const filtered = data.filter((g) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const text = `${g.title ?? ""} ${g.tags}`.toLowerCase();
    return text.includes(q);
  });

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const already = prev.includes(id);
      if (already) return prev.filter((x) => x !== id);

      // Kalau max 1, langsung replace tanpa harus unpick manual
      if (MAX_PICK === 1) return [id];

      if (prev.length >= MAX_PICK) {
        if (onNotify) onNotify(`Maksimal ${MAX_PICK} foto dari kolase.`);
        else alert(`Maksimal ${MAX_PICK} foto dari kolase.`);
        return prev;
      }
      return [...prev, id];
    });
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Pilih dari Kolase Foto</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <input
          className={styles.modalSearch}
          placeholder="Cari judul / tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className={styles.modalStatus}>Memuat gambar...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.modalStatus}>Tidak ada gambar.</p>
        ) : (
          <div className={styles.modalGrid}>
            {filtered.map((g) => {
              const active = selectedIds.includes(g.id);
              const handlePick = () => {
                if (maxPick === 1) {
                  setSelectedIds([g.id]);
                  // auto-apply for single-pick use cases (variasi)
                  onSelect([g]);
                  return;
                }
                toggleSelect(g.id);
              };
              return (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.modalItem} ${active ? styles.modalItemActive : ""
                    }`}
                  onClick={handlePick}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.title ?? ""} />
                  <div className={styles.modalItemMeta}>
                    <div className={styles.modalItemTitle}>
                      {g.title || "Tanpa judul"}
                    </div>
                    <div className={styles.modalItemTags}>{g.tags}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.modalCancel}
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className={styles.modalConfirm}
            disabled={selectedIds.length === 0}
            onClick={() => {
              const map = new Map<number, GambarKolase>();
              data.forEach((d) => map.set(d.id, d));

              const imgs: GambarKolase[] = [];
              selectedIds.slice(0, MAX_PICK).forEach((id) => {
                const found = map.get(id);
                if (found) imgs.push(found);
              });

              onSelect(imgs);
              onClose();
            }}
          >
            Pakai {selectedIds.length || ""} Gambar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HALAMAN TAMBAH / EDIT PRODUK ================= */


// === Variasi & Kombinasi (port dari variasi.html, scoped) ===
const VariasiKombinasiWidget = memo(function VariasiKombinasiWidget({
  notify,
  storageKey,
}: {
  notify: (msg: string) => void;
  storageKey: string | null;
}) {
  const bootedRef = useRef(false);
  const varKolasePickedRef = useRef<any>(null);
  const broadcastVarMediaRef = useRef<any>(null);

  useEffect(() => {
    if (bootedRef.current) {
      // React StrictMode memanggil efek dua kali (mount -> cleanup -> mount).
      // Saat cleanup pertama, listener sudah dihapus, jadi pas mount kedua kita re-attach di sini.
      const onVarKolasePicked = varKolasePickedRef.current;
      const onRequestVarMedia = broadcastVarMediaRef.current;
      if (onVarKolasePicked) {
        window.addEventListener("apix:varKolasePicked", onVarKolasePicked as any);
      }
      if (onRequestVarMedia) {
        window.addEventListener("apix:requestVarMedia", onRequestVarMedia as any);
      }
      return () => {
        if (onVarKolasePicked) {
          window.removeEventListener("apix:varKolasePicked", onVarKolasePicked as any);
        }
        if (onRequestVarMedia) {
          window.removeEventListener("apix:requestVarMedia", onRequestVarMedia as any);
        }
      };
    }
    bootedRef.current = true;

    let onVarKolasePicked: any = null;

    try {
      const d: any = document;

      const LS_KEY = storageKey;
      const toastEl = d.getElementById("toast");
      let lastAutoFocusKey = null;
      const uid = () => "id_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);

      // === Foto variasi (upload / kolase) ===
      const uploadUrlByVar: Record<string, string> = {};
      const kolaseCache: any = { loaded: false, loading: false, items: [], byId: {}, promise: null as any };

      const VAR_UPLOAD_ENDPOINT = "/api/admin/admin_dashboard/admin_produk/tambah_produk/upload_variasi";

      async function uploadVarImageToGambarUpload(file: File, meta?: { title?: string; tags?: string }) {
        const fd = new FormData();
        fd.append("file", file);
        if (meta?.title) fd.append("title", meta.title);
        if (meta?.tags) fd.append("tags", meta.tags);

        const res = await fetch(VAR_UPLOAD_ENDPOINT, { method: "POST", body: fd } as any);
        if (!res.ok) {
          throw new Error("Upload variasi gagal");
        }
        const json = await res.json();
        const data = (json && (json.data ?? json)) as any;
        if (!data || data.id == null || !data.url) {
          throw new Error("Response upload variasi tidak valid");
        }
        return { id: Number(data.id), url: String(data.url) };
      }

      function vaultEl() {
        return d.getElementById("vcomboVault");
      }

      function ensureVarUploadInput(varId: string) {
        const v = vaultEl();
        if (!v) return null as any;

        const name = `variasiFotoUpload__${varId}`;
        let inp = v.querySelector(`input[data-var-upload="${varId}"]`) as HTMLInputElement | null;
        if (inp) return inp;

        inp = d.createElement("input");
        inp.type = "file";
        inp.accept = "image/*";
        inp.name = name;
        inp.setAttribute("data-var-upload", varId);

        inp.onchange = () => {
          const file = (inp && inp.files && inp.files[0]) ? inp.files[0] : null;
          const vv: any = state.variations.find((x: any) => x.id === varId);
          if (!vv) return;

          if (!vv.image) vv.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
          vv.image.uploadField = name;

          if (!file) {
            // batal pilih file
            vv.image.mode = "";
            vv.image.kolaseId = null;
            vv.image.kolaseUrl = "";
            vv.image.uploadStatus = "";
            vv.image.uploadName = "";
            vv.image.uploadToken = "";

            try { if (uploadUrlByVar[varId]) URL.revokeObjectURL(uploadUrlByVar[varId]); } catch { }
            delete uploadUrlByVar[varId];

            save(); render();
            return;
          }

          // Upload langsung ke DB (tabel gambar_upload) via endpoint upload_variasi
          vv.image.mode = "upload";
          vv.image.kolaseId = null;
          vv.image.kolaseUrl = "";
          vv.image.uploadStatus = "uploading";
          vv.image.uploadName = file.name;
          const token = uid();
          vv.image.uploadToken = token;

          // preview cepat via objectURL
          try { if (uploadUrlByVar[varId]) URL.revokeObjectURL(uploadUrlByVar[varId]); } catch { }
          try { uploadUrlByVar[varId] = URL.createObjectURL(file); } catch { }

          save(); render();

          (async () => {
            try {
              const up = await uploadVarImageToGambarUpload(file, { title: vv.label ? `Variasi: ${vv.label}` : "Foto Variasi" });

              const cur: any = state.variations.find((x: any) => x.id === varId);
              if (!cur || !cur.image || cur.image.uploadToken !== token) return;

              cur.image.kolaseId = up.id;
              cur.image.kolaseUrl = up.url;
              cur.image.uploadStatus = "done";

              // file tidak perlu disimpan lagi
              try { inp.value = ""; } catch { }
              try { if (uploadUrlByVar[varId]) URL.revokeObjectURL(uploadUrlByVar[varId]); } catch { }
              delete uploadUrlByVar[varId];

              save(); render();
            } catch (err: any) {
              const cur: any = state.variations.find((x: any) => x.id === varId);
              if (!cur || !cur.image || cur.image.uploadToken !== token) return;

              cur.image.uploadStatus = "error";
              save(); render();
              try { toast(String(err?.message || "Upload variasi gagal")); } catch { }
            }
          })();
        };

        v.appendChild(inp);
        return inp;
      }

      function getUploadUrl(varId: string) {
        const inp = ensureVarUploadInput(varId);
        const file = (inp && inp.files && inp.files[0]) ? inp.files[0] : null;
        if (!file) return "";
        if (uploadUrlByVar[varId]) return uploadUrlByVar[varId];
        try {
          uploadUrlByVar[varId] = URL.createObjectURL(file);
          return uploadUrlByVar[varId];
        } catch {
          return "";
        }
      }

      function getVarImageUrl(v: any) {
        if (!v || !v.image) return "";
        if (v.image.mode === "kolase" && v.image.kolaseUrl) return v.image.kolaseUrl;
        if (v.image.mode === "upload") {
          // setelah upload sukses, server mengembalikan url dan kita simpan di kolaseUrl
          if (v.image.kolaseUrl) return v.image.kolaseUrl;
          return getUploadUrl(v.id);
        }
        return "";
      }

      function clearVarImage(v: any) {
        if (!v) return;
        if (!v.image) v.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
        v.image.mode = "";
        v.image.kolaseId = null;
        v.image.kolaseUrl = "";
        v.image.uploadField = `variasiFotoUpload__${v.id}`;
        v.image.uploadStatus = "";
        v.image.uploadName = "";
        v.image.uploadToken = "";

        const inp = vaultEl()?.querySelector(`input[data-var-upload="${v.id}"]`) as HTMLInputElement | null;
        if (inp) inp.value = "";

        try { if (uploadUrlByVar[v.id]) URL.revokeObjectURL(uploadUrlByVar[v.id]); } catch { }
        delete uploadUrlByVar[v.id];
      }

      function ensureKolaseCacheLoaded() {
        if (kolaseCache.loaded) return Promise.resolve();
        if (kolaseCache.promise) return kolaseCache.promise;

        kolaseCache.loading = true;

        kolaseCache.promise = fetch("/api/admin/admin_dashboard/admin_galeri/list_gambar", { cache: "no-store" } as any)
          .then(async (r: any) => {
            if (r.ok) return r.json();
            // coba ambil pesan error dari JSON kalau ada
            let j: any = null;
            try { j = await r.json(); } catch { }
            throw new Error(j?.error || j?.message || "Gagal load kolase");
          })
          .then((data: any) => {
            const imgs = (data?.data ?? data?.images ?? data?.gambar ?? data?.items ?? data) || [];
            kolaseCache.items = Array.isArray(imgs) ? imgs : [];
            kolaseCache.byId = {};
            kolaseCache.items.forEach((it: any) => {
              if (it && it.id != null) kolaseCache.byId[it.id] = it;
            });
            kolaseCache.loaded = true;
            return kolaseCache.items;
          })
          .catch((err: any) => {
            console.error("Gagal load kolase foto (variasi)", err);
            kolaseCache.items = [];
            kolaseCache.byId = {};
            kolaseCache.loaded = false;
            return [];
          })
          .finally(() => {
            kolaseCache.loading = false;
            kolaseCache.promise = null;
          });

        return kolaseCache.promise;
      }

      function ensureVarKolaseModal() {
        let overlay = d.getElementById("vImgModalOverlay") as any;
        if (overlay) return overlay;

        overlay = d.createElement("div");
        overlay.id = "vImgModalOverlay";
        overlay.className = "vImgModalOverlay";
        overlay.innerHTML = `
        <div class="vImgModal" role="dialog" aria-modal="true">
          <div class="vImgModalHead">
            <b>Pilih Foto dari Kolase (Variasi)</b>
            <button class="x" type="button" data-x>×</button>
          </div>
          <div class="vImgModalBody">
            <div class="vImgModalSearch">
              <input type="text" placeholder="Cari judul / tag..." id="vImgSearch" />
            </div>
            <div class="vImgGrid" id="vImgGrid"></div>
          </div>
          <div class="vImgModalFoot">
            <button class="btn" type="button" data-cancel>Batal</button>
            <button class="btn primary" type="button" data-ok>Pilih</button>
          </div>
        </div>
      `;

        const close = () => { overlay.style.display = "none"; overlay.__pickForVarId = null; overlay.__selId = null; };

        overlay.addEventListener("click", (e: any) => {
          if (e.target === overlay) close();
        });
        overlay.querySelector("[data-x]").onclick = close;
        overlay.querySelector("[data-cancel]").onclick = close;

        d.body.appendChild(overlay);
        return overlay;
      }

      function openVarKolasePicker(v: any) {
        try {
          const selId = (v?.image?.mode === "kolase" && v.image.kolaseId) ? v.image.kolaseId : null;
          const initialSelectedIds = selId ? [selId] : [];
          window.dispatchEvent(new CustomEvent("apix:openVarKolase", {
            detail: { varId: v?.id, initialSelectedIds }
          }));
        } catch (err) {
          console.error("Gagal buka picker kolase variasi", err);
          try { toast("Gagal buka kolase variasi"); } catch { }
        }
      }
      const TITLE_PH = "contoh: Ukuran / Warna / Model / Material / Finishing / Tekstur / Motif / Paket / Jasa Pasang / Desain";

      const UNIT_OPTIONS = [
        { v: "M2", label: "M2 (per m²)" },
        { v: "M", label: "M (per meter)" },
        { v: "POINT", label: "POINT (per titik)" },
        { v: "PCS", label: "PCS (per unit)" },
        { v: "SERVICE", label: "SERVICE (borongan/paket)" },
      ];
      function unitLabel(u) {
        const found = UNIT_OPTIONS.find(x => x.v === u);
        return found ? found.label : u;
      }

      function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("show");
        setTimeout(() => toastEl.classList.remove("show"), 1200);
      }
      function collectVarMedia() {
        if (!state || !state.enabled) return [];
        const vars = Array.isArray(state.variations) ? state.variations : [];
        return vars
          .map((v: any) => {
            const url = getVarImageUrl(v);
            return {
              varId: v?.id ?? "",
              label: v?.label || "",
              url: url || "",
              mode: v?.image?.mode || "",
              kolaseId: v?.image?.kolaseId ?? null,
            };
          })
          .filter((m: any) => !!m.url);
      }
      function broadcastVarMedia() {
        try {
          const media = collectVarMedia();
          window.dispatchEvent(new CustomEvent("apix:varMediaUpdate", { detail: { enabled: !!state?.enabled, media } }));
        } catch { }
      }
      function syncHidden() {
        const fEnabled = d.getElementById("vcombo_hidden_enabled");
        const fJson = d.getElementById("vcombo_hidden_json");
        const fClear = d.getElementById("vcombo_hidden_clear");
        try {
          if (fEnabled) fEnabled.value = state.enabled ? "1" : "0";
          if (fClear) fClear.value = state.enabled ? "0" : "1";
          if (fJson) fJson.value = state.enabled ? JSON.stringify(state) : "";

          const fUnit = d.getElementById("vcombo_hidden_unit");
          if (fUnit) fUnit.value = state.product?.unit || "";

          // jika variasi dimatikan, file upload variasi jangan ikut tersubmit
          const v = vaultEl();
          if (v) {
            [...v.querySelectorAll('input[type="file"][data-var-upload]')].forEach((inp: any) => {
              inp.disabled = !state.enabled;
            });
          }

          broadcastVarMedia();
        } catch { }
      }
      function save() {
        try {
          if (LS_KEY) localStorage.setItem(LS_KEY, JSON.stringify(state));
        } catch { }
        syncHidden();
      }
      function load() {
        if (!LS_KEY) return null;
        try {
          const raw = localStorage.getItem(LS_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      }

      // input nyaman: state update pas input, render pas blur
      function bindTitleInput(el, getter, setter) {
        el.value = getter() || "";
        el.addEventListener("input", () => {
          setter(el.value);
          save();
        });
        el.addEventListener("blur", () => {
          // Judul kombinasi boleh kosong. Jangan paksa rerender/fokus saat blur.
          // Label default akan mengikuti state pada render berikutnya (mis. saat pindah tab / klik tombol).
        });
      }

      // === ENTER navigation (tanpa perlu arahkan kursor) ===
      // Rule: tekan Enter -> fokus ke input/select berikutnya yang "wajar" & belum diisi dulu,
      // kalau tidak ada yang kosong -> fokus ke next normal.
      function isField(el) {
        if (!el) return false;
        if (el.disabled) return false;
        const tag = (el.tagName || "").toLowerCase();
        if (tag === "textarea") return true;
        if (tag === "input") {
          const t = (el.type || "text").toLowerCase();
          if (t === "hidden" || t === "button" || t === "submit" || t === "reset" || t === "file") return false;
          return true;
        }
        if (tag === "select") return true;
        return false;
      }
      function isVisible(el) {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      }
      function fieldValue(el) {
        const tag = (el.tagName || "").toLowerCase();
        if (tag === "select") return (el.value || "").trim();
        if (tag === "input" || tag === "textarea") return (el.value || "").trim();
        return "";
      }
      function isEmptyField(el) {
        // Field kosong yang "wajib" diisi untuk alur Enter.
        // Judul Kombinasi (Lv1/Lv2/Lv3) & field opsional lain jangan dianggap wajib.
        try {
          if (el.classList && el.classList.contains("titleInput")) return false;

          // Harga add-on (opsional), harga variasi (opsional), unit override (opsional), judul produk (opsional)
          if (el.matches && el.matches('input[data-price], input[data-newprice], input[name="variation_price"], input[name="variation_unit"], input[name="product_title"]')) {
            return false;
          }
          if (el.getAttribute && el.getAttribute("data-optional") === "1") return false;
        } catch (_) { }

        // "kosong" = value empty string OR placeholder mode (like follow product)
        return fieldValue(el) === "";
      }
      function nextFocusableFrom(root, current) {
        const list = Array.from(root.querySelectorAll("input, select, textarea, button")).filter(el => isField(el) && isVisible(el));
        const i = list.indexOf(current);
        if (i < 0) return null;
        return list[i + 1] || null;
      }
      function focusFirstEmptyAfter(root, current) {
        const list = Array.from(root.querySelectorAll("input, select, textarea")).filter(el => isField(el) && isVisible(el)) as any[];
        const i = list.indexOf(current);
        if (i < 0) return false;

        // 1) cari yang kosong dulu (sesudah current)
        for (let k = i + 1; k < list.length; k++) {
          if (isEmptyField(list[k])) {
            list[k].focus();
            list[k].select?.();
            return true;
          }
        }
        // 2) kalau ga ada yang kosong, next biasa
        const nxt = list[i + 1] || null;
        if (nxt) {
          nxt.focus();
          nxt.select?.();
          return true;
        }
        return false;
      }
      // global handler: Enter -> fokus next
      const ROOT = d.getElementById("vcomboRoot");
      d.addEventListener("keydown", (e) => {
        if (ROOT && e.target && !ROOT.contains(e.target)) return;
        if (e.key !== "Enter") return;
        const t = e.target;
        if (!isField(t)) return;

        // jangan ganggu Enter di button
        if ((t.tagName || "").toLowerCase() === "button") return;

        // prevent submit / newline
        e.preventDefault();

        const stepRoot = d.getElementById("page");
        if (!stepRoot) return;

        // Jika sedang di input "Tambah" (vName/vPrice/vUnit etc) dan Enter,
        // fokus pindah dulu; kalau posisi sudah di field terakhir row tambah,
        // otomatis trigger tombol tambah.
        const id = t.id || "";
        if (id === "vUnit") {
          // last field of add-variation row -> trigger Tambah
          const btn = d.getElementById("vAdd");
          if (btn && !btn.disabled) {
            btn.click();
            return;
          }
        }
        if (id === "pBase") {
          // terakhir di produk -> lanjut
          const btn = d.getElementById("toVar");
          if (btn && !btn.disabled) {
            btn.click();
            return;
          }
        }

        // normal: fokus ke field kosong berikutnya atau next biasa
        const ok = focusFirstEmptyAfter(stepRoot, t);
        if (!ok) {
          // kalau buntu, coba klik tombol primary paling relevan di halaman (Lanjut/Simpan)
          const primaries = stepRoot.querySelectorAll(".btn.primary");
          const primary = primaries[primaries.length - 1];
          if (primary) primary.click();
        }
      }, true);

      // === state ===
      let state = load() || null;
      if (!state) {
        state = {
          enabled: false,
          step: 0,
          comboTab: 1,
          combo: { lv2Enabled: false, lv3Enabled: false },
          titles: { varTitle: "", lv1Title: "", lv2Title: "", lv3Title: "" },
          product: { title: "", unit: "M", basePrice: "", status: "" },
          variations: [],
          preview: { varId: null, lv1Id: null, lv2Id: null, lv3Id: null, qty: 1 },
          ui: { selLv1ByVar: {}, selLv2ByVarLv1: {} },
          optClip: null
        };
        save();
      } else {
        if (!state.combo) state.combo = { lv2Enabled: false, lv3Enabled: false };
        if (!("enabled" in state)) state.enabled = (state.variations && state.variations.length) ? true : false;
        // Default tampilan selalu mulai dari tab Produk (biar tidak langsung munculin form variasi).
        state.step = 0;
        if (!state.titles) state.titles = { varTitle: "", lv1Title: "", lv2Title: "", lv3Title: "" };
        if (!state.product) state.product = { title: "", unit: "M", basePrice: "", status: "" };
        if (state.product.status === undefined) state.product.status = "";
        if (!state.variations) state.variations = [];
        if (!state.preview) state.preview = { varId: null, lv1Id: null, lv2Id: null, lv3Id: null, qty: 1 };
        if (!state.ui) state.ui = { selLv1ByVar: {}, selLv2ByVarLv1: {} };
        if (!("optClip" in state)) state.optClip = null;

        state.variations.forEach(v => {
          if ("enabled" in v) delete (v as any).enabled;
          if (v.price === undefined) v.price = "";
          if (v.unitOverride === undefined) v.unitOverride = "";
          if (!v.image) v.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: `variasiFotoUpload__${v.id}` };
          if (v.image.mode === undefined) v.image.mode = "";
          if (v.image.kolaseId === undefined) v.image.kolaseId = null;
          if (v.image.kolaseUrl === undefined) v.image.kolaseUrl = "";
          if (v.image.uploadField === undefined) v.image.uploadField = `variasiFotoUpload__${v.id}`;
          // normalize harga lama: pastikan hanya angka
          v.price = String(v.price || "").replace(/[^\d]/g, "");
          (v as any).promo = normalizePromo((v as any).promo);

          if (!v.combos) v.combos = { lv1: [] };
          if (!Array.isArray(v.combos.lv1)) v.combos.lv1 = [];
          v.combos.lv1.forEach(l1 => {
            l1.addPrice = String(l1.addPrice || "").replace(/[^\d]/g, "");
            (l1 as any).promo = normalizePromo((l1 as any).promo);
            if (!Array.isArray(l1.lv2)) l1.lv2 = [];
            l1.lv2.forEach(l2 => {
              l2.addPrice = String(l2.addPrice || "").replace(/[^\d]/g, "");
              (l2 as any).promo = normalizePromo((l2 as any).promo);
              if (!Array.isArray(l2.lv3)) l2.lv3 = [];
              l2.lv3.forEach(l3 => {
                l3.addPrice = String(l3.addPrice || "").replace(/[^\d]/g, "");
                (l3 as any).promo = normalizePromo((l3 as any).promo);
              });
            });
          });
        });
      }


      // === Sync: ikuti Nama Produk & Harga dari form utama (Informasi Utama & Harga & Status) ===
      // Tujuan: admin tidak perlu input ulang judul & harga di widget variasi.
      let mainFormSyncCleanup: null | (() => void) = null;

      function bindMainFormSync() {
        const SELS = 'input[name="nama"], input[name="harga"], select[name="status"], input[name="status"]';

        const readMain = () => {
          const namaEl = d.querySelector('input[name="nama"]') as HTMLInputElement | null;
          const hargaEl = d.querySelector('input[name="harga"]') as HTMLInputElement | null;

          // status di form utama umumnya <select name="status">
          const statusEl =
            (d.querySelector('select[name="status"]') as HTMLSelectElement | null) ||
            (d.querySelector('input[name="status"]') as HTMLInputElement | null);

          const title = String(namaEl?.value || "");
          const base = normalizePriceString(String(hargaEl?.value || ""));
          const status = String(statusEl?.value || "");

          return { title, base, status };
        };

        const syncOnce = () => {
          const { title, base, status } = readMain();
          let changed = false;

          if (state.product.title !== title) {
            state.product.title = title;
            changed = true;
          }
          if (state.product.basePrice !== base) {
            state.product.basePrice = base;
            changed = true;
          }
          if ((state.product.status || "") !== status) {
            state.product.status = status;
            changed = true;
          }

          if (changed) {
            save();
            try { render(); } catch { }
          }
        };

        const handler = (e?: any) => {
          const t = e?.target;
          if (t && t.matches && !t.matches(SELS)) return;
          syncOnce();
        };

        // initial + catch async prefill/edit mode lebih lama
        handler();
        const itv = window.setInterval(() => syncOnce(), 400);
        const tmo = window.setTimeout(() => window.clearInterval(itv), 12000);

        // event delegation (aman kalau React replace node input)
        d.addEventListener("input", handler, true);
        d.addEventListener("change", handler, true);

        return () => {
          try { window.clearInterval(itv); } catch { }
          try { window.clearTimeout(tmo); } catch { }
          try { d.removeEventListener("input", handler, true); } catch { }
          try { d.removeEventListener("change", handler, true); } catch { }
        };
      }

      // bind sekarang (sekali) — state.product akan selalu mengikuti form utama
      mainFormSyncCleanup = bindMainFormSync();


      // === Bridge: hasil pilih kolase dari React ImagePickerModal (biar modalnya sama persis) ===
      onVarKolasePicked = (ev: any) => {
        try {
          const det = ev?.detail || {};
          const varId = det.varId;
          const selId = det.imageId ?? det.selId ?? det.id;
          const url = det.url || det.kolaseUrl || "";
          if (!varId || !selId) return;

          const vv: any = state.variations.find((x: any) => x.id === String(varId));
          if (!vv) return;

          if (!vv.image) vv.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
          vv.image.mode = "kolase";
          vv.image.uploadStatus = "";
          vv.image.uploadName = "";
          vv.image.uploadToken = "";
          vv.image.kolaseId = Number(selId);
          vv.image.kolaseUrl = String(url || "");
          vv.image.uploadField = `variasiFotoUpload__${vv.id}`;

          // clear upload file if any
          const up = ensureVarUploadInput(vv.id);
          if (up) up.value = "";
          try { if (uploadUrlByVar[vv.id]) URL.revokeObjectURL(uploadUrlByVar[vv.id]); } catch { }
          delete uploadUrlByVar[vv.id];

          save(); render();
        } catch (err) {
          console.error("apply var kolase picked error", err);
        }
      };

      varKolasePickedRef.current = onVarKolasePicked;
      broadcastVarMediaRef.current = broadcastVarMedia;
      window.addEventListener("apix:varKolasePicked", onVarKolasePicked as any);
      window.addEventListener("apix:requestVarMedia", broadcastVarMedia as any);



      // === COPY/PASTE Opsi (Lv1/Lv2/Lv3) ===
      function normKey(s) { return (s || "").trim().toLowerCase(); }
      function setOptClip(payload) {
        state.optClip = payload;
        save();
      }
      function getOptClip() { return state.optClip || null; }

      function stripLv3(o) {
        return {
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
        };
      }
      function stripLv2(o) {
        return {
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
          lv3: Array.isArray(o?.lv3) ? o.lv3.map(stripLv3) : []
        };
      }
      function stripLv1(o) {
        return {
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
          lv2: Array.isArray(o?.lv2) ? o.lv2.map(stripLv2) : []
        };
      }

      function cloneLv3(o) {
        return {
          id: uid(),
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
        };
      }
      function cloneLv2(o) {
        return {
          id: uid(),
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
          lv3: Array.isArray(o?.lv3) ? o.lv3.map(cloneLv3) : []
        };
      }
      function cloneLv1(o) {
        return {
          id: uid(),
          label: (o?.label || "").trim(),
          addPrice: normalizePriceString(o?.addPrice || ""),
          promo: o?.promo ? { ...o.promo } : defaultPromo(),
          lv2: Array.isArray(o?.lv2) ? o.lv2.map(cloneLv2) : []
        };
      }

      function pasteInto(targetArr, items, levelLabel) {
        targetArr = targetArr || [];
        const existing = new Set(targetArr.map(x => normKey(x.label)));
        let added = 0, skipped = 0;
        items.forEach(it => {
          const k = normKey(it.label);
          if (!k) { skipped++; return; }
          if (existing.has(k)) { skipped++; return; }
          existing.add(k);
          targetArr.push(it);
          added++;
        });
        toast(`${added} opsi ${levelLabel} ditambahkan` + (skipped ? ` • ${skipped} dilewati` : ``));
        return { added, skipped };
      }

      const stepsEl = d.getElementById("steps");
      const pageEl = d.getElementById("page");

      function esc(s) {
        return String(s || "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }
      function toInt(v) {
        const s = String(v ?? "");
        const digits = s.replace(/[^\d]/g, "");
        if (!digits) return 0;
        const n = Number(digits);
        return Number.isFinite(n) ? Math.max(0, n) : 0;
      }
      function normalizePriceString(v) {
        const s = String(v ?? "");
        return s.replace(/[^\d]/g, "");
      }
      function parseMoney(str) {
        if (str === "" || str == null) return 0;
        return toInt(str);
      }
      function formatIDR(n) {
        try { return new Intl.NumberFormat("id-ID").format(toInt(n)); }
        catch { return String(toInt(n)); }
      }


      // === Promo/Diskon (opsional) untuk Variasi & Kombinasi Lv1/Lv2/Lv3 ===
      function defaultPromo() {
        return { active: false, type: "percent", value: "" };
      }
      function normalizePromo(p) {
        if (!p) return defaultPromo();
        return {
          active: !!(p as any).active,
          type: ((p as any).type === "nominal") ? "nominal" : "percent",
          value: normalizePriceString(((p as any).value || "") as any)
        };
      }
      function applyPromo(before, promo) {
        const p = normalizePromo(promo);
        const b = toInt(before);
        if (!p.active) return { before: b, after: b, badge: "" };

        if (p.type === "percent") {
          let pct = toInt(p.value);
          if (pct > 100) pct = 100;
          const after = Math.max(0, Math.round(b * (100 - pct) / 100));
          return { before: b, after, badge: pct ? `-${pct}%` : "" };
        } else {
          const cut = toInt(p.value);
          const after = Math.max(0, b - cut);
          return { before: b, after, badge: cut ? `-Rp ${formatIDR(cut)}` : "" };
        }
      }
      function priceHtml(before, after, badge) {
        const b = toInt(before);
        const a = toInt(after);
        if (a < b) {
          return `<span class="oldPrice">Rp ${formatIDR(b)}</span><span class="newPrice">Rp ${formatIDR(a)}</span>${badge ? `<span class="promoBadge">${esc(badge)}</span>` : ""}`;
        }
        return `<span class="newPrice">Rp ${formatIDR(a)}</span>`;
      }

      // Paksa input harga tetap angka (hapus huruf/simbol saat diketik)
      d.addEventListener("input", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLInputElement)) return;
        if (el.matches('input[data-price], input[data-newprice], input[name$="_price"], input[name="variation_price"]')) {
          const before = el.value;
          const after = normalizePriceString(before);
          if (before !== after) {
            const pos = el.selectionStart ?? after.length;
            el.value = after;
            try {
              const newPos = Math.min(after.length, Math.max(0, pos - (before.length - after.length)));
              el.setSelectionRange(newPos, newPos);
            } catch { }
          }
        }
      });

      // Event promo (diskon) - delegation (lebih ringan, tidak perlu bind per-row)
      let promoRenderT = 0 as any;
      function scheduleRender() {
        try { clearTimeout(promoRenderT); } catch { }
        promoRenderT = setTimeout(() => { try { render(); } catch { } }, 120);
      }
      function getTargetByDataset(el: any) {
        const scope = el?.dataset?.scope;
        const varId = el?.dataset?.var;
        const vv: any = (state.variations || []).find((x: any) => x.id === String(varId));
        if (!vv) return null;

        if (scope === "var") return vv;

        const lv1 = (vv.combos?.lv1 || []).find((x: any) => x.id === String(el.dataset.lv1));
        if (scope === "lv1") return lv1 || null;

        const lv2 = (lv1?.lv2 || []).find((x: any) => x.id === String(el.dataset.lv2));
        if (scope === "lv2") return lv2 || null;

        const lv3 = (lv2?.lv3 || []).find((x: any) => x.id === String(el.dataset.lv3));
        if (scope === "lv3") return lv3 || null;

        return null;
      }

      d.addEventListener("change", (e) => {
        const el = (e as any).target;
        if (!(el instanceof HTMLInputElement)) return;

        if (el.matches("[data-promo-on]")) {
          const tgt: any = getTargetByDataset(el);
          if (!tgt) return;
          tgt.promo = normalizePromo(tgt.promo);
          tgt.promo.active = !!el.checked;
          save(); scheduleRender();
        }

        if (el.matches("[data-promo-type]")) {
          const tgt: any = getTargetByDataset(el);
          if (!tgt) return;
          tgt.promo = normalizePromo(tgt.promo);
          tgt.promo.type = (el.getAttribute("data-promo-type") === "nominal") ? "nominal" : "percent";
          save(); scheduleRender();
        }
      });

      d.addEventListener("input", (e) => {
        const el = (e as any).target;
        if (!(el instanceof HTMLInputElement)) return;
        if (!el.matches("[data-promo-val]")) return;

        const tgt: any = getTargetByDataset(el);
        if (!tgt) return;
        tgt.promo = normalizePromo(tgt.promo);
        tgt.promo.value = normalizePriceString(el.value);
        el.value = tgt.promo.value;
        save(); scheduleRender();
      });

      function baseReady() { return parseMoney(state.product.basePrice) > 0; }

      function tVar() { return (state.titles.varTitle || "").trim() || "Variasi"; }
      function tLv1() { return (state.titles.lv1Title || "").trim() || "Pilihan"; }
      function tLv2() { return (state.titles.lv2Title || "").trim() || "Kombinasi"; }
      function tLv3() { return (state.titles.lv3Title || "").trim() || "Opsi"; }

      function effectiveUnitForVar(v) {
        return (v && v.unitOverride) ? v.unitOverride : state.product.unit;
      }
      function unitSymbolShort(u) {
        const s = String(u || "").trim();
        if (!s) return "";
        const up = s.toUpperCase();
        if (up === "M2") return "m²";
        if (up === "M3") return "m³";
        if (up === "CM2") return "cm²";
        if (up === "CM3") return "cm³";
        if (up === "MM2") return "mm²";
        if (up === "MM3") return "mm³";
        // default: lowercase for nicer display (PCS -> pcs)
        return up.toLowerCase();
      }
      function effectiveBasePriceForVar(v) {
        return parseMoney((v && v.price) ? v.price : "") || parseMoney(state.product.basePrice);
      }

      function renderSteps() {
        stepsEl.innerHTML = "";
        stepsEl.appendChild(makeStep(0, "Produk"));
        stepsEl.appendChild(makeStep(1, "Variasi"));
        stepsEl.appendChild(makeStep(2, "Kombinasi"));
      }
      function makeStep(i, label) {
        const el = d.createElement("div");
        el.className = "step" + (state.step === i ? " active" : "");
        el.innerHTML = `<div class="dot">${i + 1}</div><div class="lbl">${esc(label)}</div>`;
        el.onclick = () => {
          if (i > 0 && !baseReady()) { toast("Harga produk wajib diisi"); state.step = 0; }
          else state.step = i;
          save(); render();
        };
        return el;
      }

      function ensurePreviewDefaults() {
        const activeVars = (state.variations || []).filter(x => x.enabled !== false);
        if (!state.preview.varId && activeVars[0]) state.preview.varId = activeVars[0].id;
        let v = activeVars.find(x => x.id === state.preview.varId);
        if (!v) {
          state.preview.varId = activeVars[0]?.id || null;
          state.preview.lv1Id = null; state.preview.lv2Id = null; state.preview.lv3Id = null;
          v = activeVars.find(x => x.id === state.preview.varId);
          if (!v) return;
        }

        const lv1Arr = v.combos.lv1 || [];
        if (!lv1Arr.length) { state.preview.lv1Id = null; state.preview.lv2Id = null; state.preview.lv3Id = null; return; }

        if (!state.preview.lv1Id || !lv1Arr.some(o => o.id === state.preview.lv1Id)) {
          state.preview.lv1Id = lv1Arr[0].id;
          state.preview.lv2Id = null;
          state.preview.lv3Id = null;
        }

        const lv1 = lv1Arr.find(o => o.id === state.preview.lv1Id);
        const lv2Arr = (lv1 && lv1.lv2) ? lv1.lv2 : [];
        if (!state.combo.lv2Enabled || !lv2Arr.length) {
          state.preview.lv2Id = null;
          state.preview.lv3Id = null;
          return;
        }
        if (!state.preview.lv2Id || !lv2Arr.some(o => o.id === state.preview.lv2Id)) {
          state.preview.lv2Id = lv2Arr[0].id;
          state.preview.lv3Id = null;
        }

        const lv2 = lv2Arr.find(o => o.id === state.preview.lv2Id);
        const lv3Arr = (lv2 && lv2.lv3) ? lv2.lv3 : [];
        if (!state.combo.lv3Enabled || !lv3Arr.length) {
          state.preview.lv3Id = null;
          return;
        }
        if (!state.preview.lv3Id || !lv3Arr.some(o => o.id === state.preview.lv3Id)) {
          state.preview.lv3Id = lv3Arr[0].id;
        }
      }

      function render() {
        // Jika variasi OFF: jangan munculin form/tab variasi sama sekali.
        // Preview e-commerce tetap selalu tampil (sesuai requirement).
        if (!state.enabled) {
          stepsEl.style.display = "none";
          pageEl.innerHTML = `
          <div class="disabledBox">
            <div class="disabledTitle">Variasi belum aktif</div>
            <div class="disabledSub">
              Centang <b>Aktifkan Variasi</b> di kanan atas untuk mulai mengatur Variasi &amp; Kombinasi.
              (Data aman, preview tetap tampil di bawah.)
            </div>
          </div>
          <div style="height:12px;"></div>
          <div id="previewMount"></div>
        `;
          const pm = d.getElementById("previewMount");
          pm.innerHTML = "";
          pm.appendChild(renderPreviewEcommerce());
          return;
        }

        stepsEl.style.display = "";
        renderSteps();

        // Layout: form/tab dulu, preview selalu di bawah
        pageEl.innerHTML = `
        <div id="formMount"></div>
        <div style="height:12px;"></div>
        <div id="previewMount"></div>
      `;

        // Render konten form sesuai step/tab
        const fm = d.getElementById("formMount");
        if (state.step === 0) renderProduk(fm);
        else if (state.step === 1) renderVariasi(fm);
        else renderKombinasi(fm);

        // Render preview (selalu tampil di bawah)
        const pm = d.getElementById("previewMount");
        pm.innerHTML = "";
        pm.appendChild(renderPreviewEcommerce());
      }

      function renderProduk(mount) {
        const titleVal = state.product.title || "";
        const baseVal = state.product.basePrice || "";
        const statusVal = state.product.status || "";

        mount.innerHTML = `
    <div class="box" style="margin-bottom:10px;">
      <div class="boxHead">
        <b>Ikuti Produk Utama</b>
        <span class="badge">otomatis</span>
      </div>
      <div class="boxBody">
        <div class="hint">
          Nama &amp; Harga diambil otomatis dari <b>Informasi Utama</b> dan <b>Harga &amp; Status</b> di atas form.
          (Tidak perlu input ulang di sini.)
        </div>
      </div>
    </div>

    <div class="grid2">
      <div>
        <label>Nama Produk (otomatis)</label>
        <input id="pTitle" name="product_title" autocomplete="off" readonly
          placeholder="Isi Nama Produk di Informasi Utama" value="${esc(titleVal)}" />
      </div>
      <div>
        <label>Dijual per</label>
        <select id="pUnit" autocomplete="on">
          ${UNIT_OPTIONS.map(u => `<option value="${u.v}">${esc(u.label)}</option>`).join("")}
        </select>
      </div>
    </div>

    <div style="margin-top:10px;">
      <label>Harga Produk (otomatis)</label>
      <input id="pBase"
        type="text" inputmode="numeric" pattern="[0-9]*"
        name="product_base_price" autocomplete="off"
        readonly
        placeholder="Isi Harga di Harga & Status" value="${esc(baseVal)}" />
      <div class="hint" style="margin-top:6px;">
        Variasi: harga opsional = replace harga produk. Unit variasi opsional = override unit produk.
      </div>
    </div>

    <div style="margin-top:10px;">
      <label>Status Produk (otomatis)</label>
      <input
        id="pStatus"
        name="product_status"
        autocomplete="off"
        readonly
        data-optional="1"
        placeholder="Pilih Status di Harga & Status"
        value="${esc(statusVal)}"
      />
    </div>

    <div class="divider"></div>
    <div class="btnRow">
      <button class="btn primary" id="toVar" type="button">Lanjut</button>
    </div>
  `;
        const pUnit = d.getElementById("pUnit");
        pUnit.value = state.product.unit;

        pUnit.onchange = () => { state.product.unit = pUnit.value; save(); render(); };

        d.getElementById("toVar").onclick = () => {
          if (!baseReady()) { toast("Harga produk wajib diisi"); return; }
          state.step = 1; save(); render();
          // fokus ke input pertama di variasi
          setTimeout(() => d.querySelector("#vName")?.focus(), 0);
        };
      }

      function renderVariasi(mount) {
        const has = state.variations.length > 0;

        mount.innerHTML = `
        <div class="box globalBox">
          <div class="boxHead">
            <b>Judul Global (untuk admin)</b>
            <span class="badge">kosong = pakai default</span>
          </div>
          <div class="boxBody">
            <div class="hint">Judul yang tampil di e-commerce untuk level variasi.</div>
            <div>
              <label>Judul Variasi</label>
              <input class="titleInput" id="titleVar" placeholder="${esc(TITLE_PH)}" />
              <div class="hint">Kalau kosong → otomatis jadi <b>Variasi</b></div>
            </div>
          </div>
        </div>

        <div style="height:12px;"></div>

        <div class="box">
          <div class="boxHead">
            <b>Tambah ${esc(tVar())}</b>
            <span class="badge">${state.variations.length}/10</span>
          </div>
          <div class="boxBody">
            <div class="hint">
              Harga ${esc(tVar())} opsional: kalau diisi → replace harga produk. Kalau kosong → ikut harga produk.
              Unit ${esc(tVar())} opsional: kalau dipilih → override unit produk.
            </div>

            <div class="row">
              <div>
                <label>Nama ${esc(tVar())}</label>
                <input id="vName" name="variation_name" autocomplete="on" placeholder="contoh: Material / Paket / Tipe" />
              </div>

              <div>
                <label>Harga ${esc(tVar())} (opsional, replace)</label>
                <input id="vPrice"
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="variation_price" autocomplete="on"
                  placeholder="kosong = ikut harga produk" />
                <small>diisi → replace harga produk</small>
              </div>

              <div>
                <label>Unit ${esc(tVar())} (opsional)</label>
                <select id="vUnit" name="variation_unit" autocomplete="on">
                  <option value="">Ikuti produk (${esc(state.product.unit)})</option>
                  ${UNIT_OPTIONS.map(u => `<option value="${u.v}">${esc(u.label)}</option>`).join("")}
                </select>
                <small>kosong → ikut unit produk</small>
              </div>

              <div class="actions">
                <button class="btn primary" id="vAdd" type="button">Tambah</button>
              </div>
            </div>
          </div>
        </div>

        <div style="height:12px;"></div>

        ${!has ? `
          <div class="empty"><b>Belum ada ${esc(tVar())}.</b><br/>Tambah ${esc(tVar()).toLowerCase()} dulu (maks 10).</div>
        ` : `
          <div class="box">
            <div class="boxHead">
              <b>Daftar ${esc(tVar())}</b>
              <span class="badge">harga kosong = ikut produk</span>
            </div>
            <div class="boxBody" id="vList"></div>
          </div>
        `}

        <div class="divider"></div>
        <div class="btnRow">
          <button class="btn" id="backP" type="button">Kembali</button>
          <button class="btn primary" id="toK" type="button">Lanjut</button>
        </div>
      `;

        bindTitleInput(
          d.getElementById("titleVar"),
          () => state.titles.varTitle,
          (v) => { state.titles.varTitle = v; }
        );

        const vName = d.getElementById("vName");
        const vPrice = d.getElementById("vPrice");
        const vUnit = d.getElementById("vUnit");

        function addVar() {
          const nm = (vName.value || "").trim();
          if (!nm) { toast(`Nama ${tVar().toLowerCase()} wajib`); vName.focus(); return; }
          if (state.variations.length >= 10) { toast("Maks 10 variasi"); return; }

          const id = uid();
          state.variations.push({
            id,
            enabled: true,
            label: nm,
            price: (vPrice.value || "").trim(),
            unitOverride: (vUnit.value || "").trim(),
            promo: defaultPromo(),
            image: { mode: "", kolaseId: null, kolaseUrl: "", uploadField: `variasiFotoUpload__${id}` },
            combos: { lv1: [] }
          });

          if (!state.preview.varId) state.preview.varId = state.variations[0].id;

          vName.value = ""; vPrice.value = ""; vUnit.value = "";
          save(); render();
          // setelah tambah, fokus balik ke vName biar cepat input variasi berikutnya
          setTimeout(() => d.getElementById("vName")?.focus(), 0);
        }

        d.getElementById("vAdd").onclick = addVar;

        if (has) {
          const list = d.getElementById("vList");
          list.innerHTML = "";
          state.variations.forEach((v, idx) => {
            const row = d.createElement("div");


            row.className = "vCard";
            const vp = normalizePromo((v as any).promo);
            (v as any).promo = vp;
            row.innerHTML = `
            <div class="vTop">
              <div>
                <label style="margin:0 0 6px;">${esc(tVar())} ${idx + 1}</label>
                <input data-name name="variation_name" autocomplete="on" value="${esc(v.label || "")}" />
                <small>${esc(tLv1())}: <b>${(v.combos?.lv1 || []).length}</b></small>
              </div>

              <div>
                <label style="margin:0 0 6px;">Harga ${esc(tVar())} (opsional)</label>
                <input data-price
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="variation_price" autocomplete="on"
                  placeholder="kosong = ikut harga produk" value="${esc(v.price || "")}" />
                <small>diisi → replace harga produk</small>
              </div>

              <div>
                <label style="margin:0 0 6px;">Unit ${esc(tVar())} (opsional)</label>
                <select data-unit name="variation_unit" autocomplete="on">
                  <option value="">Ikuti produk (${esc(state.product.unit)})</option>
                  ${UNIT_OPTIONS.map(u => `
                    <option value="${u.v}" ${v.unitOverride === u.v ? "selected" : ""}>${esc(u.label)}</option>
                  `).join("")}
                </select>
                <small>kosong → ikut unit produk</small>
              </div>
            </div>

            <div class="vBottom">
              <div class="vMediaCol">
                <label style="margin:0 0 6px;">Foto ${esc(tVar())} (opsional)</label>
                <div class="vImgBox">
                  <div class="vImgThumb" data-vthumb></div>
                  <div class="vImgBtns">
                    <div class="vImgSrc">
                      <div class="vImgSrcLabel">Sumber Foto</div>
                      <div class="vImgRadioRow">
                        <label class="vRadio">
                          <input type="radio" data-vimg-mode name="vimgsrc__${v.id}" value="" />
                          <span>Tanpa Foto</span>
                        </label>
                        <label class="vRadio">
                          <input type="radio" data-vimg-mode name="vimgsrc__${v.id}" value="upload" />
                          <span>Upload Baru</span>
                        </label>
                        <label class="vRadio">
                          <input type="radio" data-vimg-mode name="vimgsrc__${v.id}" value="kolase" />
                          <span>Pilih dari Kolase</span>
                        </label>
                      </div>
                    </div>

                    <div class="vImgAct">
                      <div class="vFileRow" data-vupload-row>
                        <button class="btn small vImgBtn" type="button" data-vimg-upload>Upload Foto</button>
                        <span class="vFileName" data-vfile-name>No file chosen</span>
                      </div>

                      <div class="vPickRow" data-vpick-row>
                        <button class="btn small vImgBtn" type="button" data-vimg-pick>Pilih dari Kolase</button>
                      </div>

                      <div class="vImgRow">
                        <button class="btn small vImgBtnGhost" type="button" data-vimg-clear>Hapus</button>
                        <div class="vImgMeta" data-vimg-meta></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="vRight">
                <div class="promoBox promoCompact">
                  <div class="promoHdr">PROMO (OPSIONAL)</div>
                  <label class="promoOnRow">
                    <input type="checkbox" data-promo-on data-scope="var" data-var="${esc(v.id)}" ${vp.active ? "checked" : ""}/>
                    <span class="promoOnText">Aktifkan diskon untuk variasi ini</span>
                  </label>

                  <div class="promoGrid">
                    <div>
                      <div class="promoLabel">Tipe Diskon</div>
                      <div class="promoRow">
                        <label><input type="radio" data-promo-type="percent" data-scope="var" data-var="${esc(v.id)}" name="vpromo__${esc(v.id)}" ${(vp.type !== "nominal") ? "checked" : ""} ${vp.active ? "" : "disabled"}/> Persen (%)</label>
                        <label><input type="radio" data-promo-type="nominal" data-scope="var" data-var="${esc(v.id)}" name="vpromo__${esc(v.id)}" ${(vp.type === "nominal") ? "checked" : ""} ${vp.active ? "" : "disabled"}/> Nominal (Rp)</label>
                      </div>
                    </div>

                    <div>
                      <div class="promoLabel">Nilai Diskon</div>
                      <input class="promoVal" type="text" inputmode="numeric" pattern="[0-9]*"
                        data-promo-val data-scope="var" data-var="${esc(v.id)}"
                        placeholder="contoh: 10 atau 150000"
                        value="${esc(vp.value || "")}"
                        ${vp.active ? "" : "disabled"} />
                    </div>
                  </div>

                  <small style="display:block;margin-top:12px;">Jika harga variasi kosong → diskon diterapkan ke harga produk.</small>
                </div>

                <div class="sideActions">
                  <button class="btn small danger" data-del type="button">Hapus</button>
                </div>
              </div>
            </div>
          `;
            row.querySelector("[data-name]").oninput = (e) => { v.label = e.target.value; save(); };
            row.querySelector("[data-price]").oninput = (e) => { v.price = normalizePriceString(e.target.value); save(); };
            row.querySelector("[data-unit]").onchange = (e) => { v.unitOverride = e.target.value || ""; save(); render(); };
            // Foto variasi (upload / kolase)
            ensureVarUploadInput(v.id);
            const th = row.querySelector("[data-vthumb]") as any;
            const mt = row.querySelector("[data-vimg-meta]") as any;
            const fn = row.querySelector("[data-vfile-name]") as any;
            const uploadRow = row.querySelector("[data-vupload-row]") as any;
            const pickRow = row.querySelector("[data-vpick-row]") as any;
            const clearBtn = row.querySelector("[data-vimg-clear]") as any;

            const paint = () => {
              const mode = (v.image && v.image.mode) ? v.image.mode : "";
              const url = getVarImageUrl(v);
              if (th) th.style.backgroundImage = url ? `url("${url}")` : "";

              // radio checked
              try {
                [...row.querySelectorAll('input[data-vimg-mode]')].forEach((inp: any) => {
                  inp.checked = String(inp.value || "") === String(mode || "");
                });
              } catch { }

              // toggle rows
              if (uploadRow) uploadRow.style.display = (mode === "upload") ? "flex" : "none";
              if (pickRow) pickRow.style.display = (mode === "kolase") ? "block" : "none";
              if (clearBtn) clearBtn.style.display = mode ? "inline-flex" : "none";

              // file name (upload)
              if (fn) {
                if (mode === "upload") {
                  const nm = (v.image && v.image.uploadName) ? String(v.image.uploadName) : "";
                  fn.textContent = nm || "No file chosen";
                } else {
                  fn.textContent = "No file chosen";
                }
              }

              let meta = "Belum ada foto";
              if (mode === "kolase") {
                meta = v.image?.kolaseId ? `Kolase • ID ${v.image.kolaseId}` : "Kolase • belum dipilih";
              } else if (mode === "upload") {
                const st = String(v.image?.uploadStatus || "");
                if (st === "uploading") meta = "Upload • mengupload...";
                else if (st === "error") meta = "Upload • gagal (pilih lagi)";
                else if (v.image?.kolaseId) meta = `Upload • tersimpan • ID ${v.image.kolaseId}`;
                else meta = "Upload • belum dipilih";
              }
              if (mt) mt.textContent = meta;
            };

            // radio change: none / upload / kolase
            try {
              [...row.querySelectorAll('input[data-vimg-mode]')].forEach((inp: any) => {
                inp.onchange = () => {
                  const val = String(inp.value || "");
                  if (val === "") {
                    clearVarImage(v);
                    save(); render();
                    return;
                  }

                  if (!v.image) v.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
                  v.image.uploadField = `variasiFotoUpload__${v.id}`;

                  if (val === "upload") {
                    const keep = (v.image.mode === "upload" && v.image.kolaseId);
                    v.image.mode = "upload";
                    // jika sebelumnya bukan upload, kosongkan dulu agar user pilih file baru
                    if (!keep) {
                      v.image.kolaseId = null;
                      v.image.kolaseUrl = "";
                      v.image.uploadStatus = "";
                      v.image.uploadName = "";
                      v.image.uploadToken = "";
                    }
                    save(); render();
                    return;
                  }

                  if (val === "kolase") {
                    v.image.mode = "kolase";
                    v.image.uploadStatus = "";
                    v.image.uploadName = "";
                    v.image.uploadToken = "";
                    // clear upload file if any (biar gak bingung)
                    const up = ensureVarUploadInput(v.id);
                    if (up) up.value = "";
                    try { if (uploadUrlByVar[v.id]) URL.revokeObjectURL(uploadUrlByVar[v.id]); } catch { }
                    delete uploadUrlByVar[v.id];

                    save(); render();
                    return;
                  }
                };
              });
            } catch { }

            (row.querySelector("[data-vimg-upload]") as any).onclick = () => {
              // set mode ke upload dulu (UX)
              if (!v.image) v.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
              const prev = v.image.mode;
              v.image.mode = "upload";
              v.image.uploadField = `variasiFotoUpload__${v.id}`;
              if (prev !== "upload") {
                v.image.kolaseId = null;
                v.image.kolaseUrl = "";
                v.image.uploadStatus = "";
                v.image.uploadName = "";
                v.image.uploadToken = "";
              }
              save();
              (ensureVarUploadInput(v.id) as any)?.click();
              paint();
            };

            (row.querySelector("[data-vimg-pick]") as any).onclick = () => {
              if (!v.image) v.image = { mode: "", kolaseId: null, kolaseUrl: "", uploadField: "" };
              v.image.mode = "kolase";
              v.image.uploadField = `variasiFotoUpload__${v.id}`;
              save();
              openVarKolasePicker(v);
            };

            (row.querySelector("[data-vimg-clear]") as any).onclick = () => {
              clearVarImage(v);
              save(); render();
            };

            paint();

            row.querySelector("[data-del]").onclick = () => {
              if (!confirm(`Hapus ${tVar().toLowerCase()} ini (beserta kombinasi anaknya)?`)) return;
              state.variations = state.variations.filter(x => x.id !== v.id);

              if (state.preview.varId === v.id) {
                state.preview.varId = state.variations[0]?.id || null;
                state.preview.lv1Id = null;
                state.preview.lv2Id = null;
                state.preview.lv3Id = null;
              }

              delete state.ui.selLv1ByVar[v.id];
              Object.keys(state.ui.selLv2ByVarLv1 || {}).forEach(k => {
                if (k.startsWith(v.id + "::")) delete state.ui.selLv2ByVarLv1[k];
              });

              // cleanup foto variasi (vault)
              const up = vaultEl()?.querySelector(`input[data-var-upload="${v.id}"]`) as any;
              if (up) up.remove();
              try { if (uploadUrlByVar[v.id]) URL.revokeObjectURL(uploadUrlByVar[v.id]); } catch { }
              delete uploadUrlByVar[v.id];

              save(); render();
            };

            list.appendChild(row);
          });
        }

        d.getElementById("backP").onclick = () => { state.step = 0; save(); render(); };
        d.getElementById("toK").onclick = () => {
          if (!baseReady()) { toast("Harga produk wajib diisi"); return; }
          state.step = 2; save(); render();
        };

        // autofocus hanya saat masuk step Variasi (tidak setiap render)
        const afKey = `v:${state.step}`;
        if (lastAutoFocusKey !== afKey) {
          lastAutoFocusKey = afKey;
          setTimeout(() => d.getElementById("vName")?.focus(), 0);
        }
      }

      function anyLv1Exists() {
        return state.variations.some(v => (v.combos.lv1 || []).length > 0);
      }

      function getSelLv1(varId, fallbackLv1Id) {
        const v = state.variations.find(x => x.id === varId);
        const arr = (v && v.combos.lv1) ? v.combos.lv1 : [];
        if (!arr.length) return null;
        let cur = state.ui.selLv1ByVar[varId];
        if (!cur || !arr.some(o => o.id === cur)) cur = fallbackLv1Id || arr[0].id;
        state.ui.selLv1ByVar[varId] = cur;
        return cur;
      }
      function getSelLv2(varId, lv1Id) {
        const key = `${varId}::${lv1Id}`;
        const v = state.variations.find(x => x.id === varId);
        const lv1 = v?.combos.lv1?.find(o => o.id === lv1Id);
        const arr = lv1?.lv2 || [];
        if (!arr.length) return null;
        let cur = state.ui.selLv2ByVarLv1[key];
        if (!cur || !arr.some(o => o.id === cur)) cur = arr[0].id;
        state.ui.selLv2ByVarLv1[key] = cur;
        return cur;
      }

      // ==== Kombinasi + preview (sama seperti versi sebelumnya, dipersingkat) ====
      // NOTE: fokus request kamu: Enter pindah ke input selanjutnya.
      // Jadi bagian kombinasi tetap sama logicnya, tapi input harga dibuat text+inputmode agar autofill oke.
      // (Aku keep full code biar 1 file runnable.)

      function renderKombinasi(mount) {
        if (state.variations.length === 0) {
          mount.innerHTML = `
          <div class="empty"><b>Belum ada ${esc(tVar())}.</b><br/>Tambah ${esc(tVar()).toLowerCase()} dulu.</div>
          <div class="divider"></div>
          <div class="btnRow"><button class="btn" id="backV" type="button">Kembali</button></div>
        `;
          d.getElementById("backV").onclick = () => { state.step = 1; save(); render(); };
          return;
        }

        mount.innerHTML = `
        <div class="subtabs">
          <div class="stabRow">
            <button type="button" class="stab ${state.comboTab === 1 ? "active" : ""}" data-tab="1">${esc(tLv1())} Lv1</button>
            <button type="button" class="stab ${state.comboTab === 2 ? "active" : ""}" data-tab="2">${esc(tLv2())} Lv2</button>
            <button type="button" class="stab ${state.comboTab === 3 ? "active" : ""}" data-tab="3">${esc(tLv3())} Lv3</button>
          </div>
          <div class="btnRow" style="justify-content:flex-end;">
            <span class="badge">Lv2: ${state.combo.lv2Enabled ? "aktif" : "off"}</span>
            <span class="badge">Lv3: ${state.combo.lv3Enabled ? "aktif" : "off"}</span>
          </div>
        </div>

        <div style="height:10px;"></div>
        <div id="comboBody"></div>


        <div class="divider"></div>
        <div class="btnRow">
          <button class="btn" id="backV" type="button">Kembali</button>
          <button class="btn primary" id="btnSave" type="button">Simpan</button>
        </div>
      `;

        pageEl.querySelectorAll(".stab").forEach(el => {
          el.onclick = () => {
            const t = Number(el.getAttribute("data-tab"));
            state.comboTab = t;
            save(); render();
          };
        });

        d.getElementById("backV").onclick = () => { state.step = 1; save(); render(); };
        d.getElementById("btnSave").onclick = () => { save(); toast("Tersimpan"); };

        const body = d.getElementById("comboBody");
        if (state.comboTab === 1) body.appendChild(renderLv1());
        if (state.comboTab === 2) body.appendChild(renderLv2());
        if (state.comboTab === 3) body.appendChild(renderLv3());

        // autofocus hanya saat pindah tab/step (biar tidak "maksa" fokus balik ke judul)
        const afKey = `k:${state.step}:${state.comboTab}`;
        if (lastAutoFocusKey !== afKey) {
          lastAutoFocusKey = afKey;
          setTimeout(() => {
            const ae = d.activeElement;
            if (ae && ae.closest && ae.closest("#page") && isField(ae)) return;
            // fokus ke input pertama di area tab kombinasi aktif
            const first = d.querySelector("#comboBody input:not([disabled]), #comboBody select:not([disabled])");
            first?.focus();
          }, 0);
        }
      }

      function renderLv1() {
        const wrap = d.createElement("div");
        wrap.style.display = "grid";
        wrap.style.gap = "10px";

        const top = d.createElement("div");
        top.className = "box globalBox";
        top.innerHTML = `
        <div class="boxHead">
          <b>Kombinasi Lv 1</b>
          <span class="badge">kosong = pakai default</span>
        </div>
        <div class="boxBody">
          <div>
            <label>Judul Kombinasi Lv1</label>
            <input class="titleInput" id="titleLv1" placeholder="${esc(TITLE_PH)}" />
            <div class="hint">Kalau kosong → otomatis jadi <b>Pilihan</b></div>
          </div>

          <div class="divider" style="margin:6px 0;"></div>

          <div class="hint">Aktifkan Lv2 hanya kalau perlu level lanjutan. Kalau aktif → auto pindah tab Lv2.</div>
          <div class="btnRow" style="justify-content:flex-start;">
            ${state.combo.lv2Enabled
            ? `<span class="badge">Kombinasi Lv2 aktif ✅</span>`
            : `<button class="btn goldBlack" id="enableLv2" type="button">Aktifkan Kombinasi Lv2</button>`
          }
          </div>
        </div>
      `;
        wrap.appendChild(top);

        bindTitleInput(
          top.querySelector("#titleLv1"),
          () => state.titles.lv1Title,
          (v) => { state.titles.lv1Title = v; }
        );

        const enableLv2 = top.querySelector("#enableLv2");
        if (enableLv2) {
          enableLv2.onclick = () => {
            if (!anyLv1Exists()) {
              toast(`Buat ${tLv1()} minimal 1 dulu baru aktifkan Lv2`);
              return;
            }
            const ok = confirm(`Aktifkan Kombinasi Lv2 untuk SEMUA ${tVar().toLowerCase()}?`);
            if (ok) {
              state.combo.lv2Enabled = true;
              state.comboTab = 2;
              save(); render();
            }
          };
        }

        state.variations.forEach(v => {
          const box = d.createElement("div");
          box.className = "box";
          const lv1Count = v.combos.lv1.length;

          box.innerHTML = `
          <div class="boxHead">
            <b>${esc(tVar())}: ${esc(v.label || "-")} → ${esc(tLv1())} (Lv1)</b>
            <span class="badge">${lv1Count} opsi</span>
          </div>
          <div class="boxBody">
            <div class="hint">${esc(tLv1())} add-on. Harga kosong = 0.</div>

            <div class="grid2">
              <div>
                <label>Tambah Opsi ${esc(tLv1())}</label>
                <input data-newname name="lv1_name" autocomplete="on" placeholder="contoh: PVC / WPC / Barang+Pasang" />
              </div>
              <div>
                <label>Tambah Harga (opsional)</label>
                <input data-newprice
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="lv1_price" autocomplete="on"
                  placeholder="0" />
              </div>
            </div>
            <div class="btnRow" style="justify-content:flex-start;">
                <button class="btn primary" data-add type="button">Tambah</button>
                <button class="btn small" data-copy type="button">Copy</button>
                <button class="btn small" data-paste type="button">Paste</button>
                <button class="btn small danger" data-dropall type="button">Drop All</button>
              </div>
              <small class="hint" data-clipinfo style="margin-top:6px;"></small>

              <div class="indent" data-list></div>
          </div>
        `;

          const newName = box.querySelector("[data-newname]");
          const newPrice = box.querySelector("[data-newprice]");
          const btnAdd = box.querySelector("[data-add]");
          const list = box.querySelector("[data-list]");

          const btnCopy = box.querySelector("[data-copy]");
          const btnPaste = box.querySelector("[data-paste]");
          const btnDropAll = box.querySelector("[data-dropall]");
          if (btnDropAll) {
            btnDropAll.onclick = () => {
              const ok = confirm(`Drop ALL opsi ${tLv1()} untuk variasi "${v.label || "-"}"? (Lv2/Lv3 ikut hilang)`);
              if (!ok) return;
              v.combos = { lv1: [] };
              // reset pilihan UI utk variasi ini
              if (state.ui?.selLv1ByVar) delete state.ui.selLv1ByVar[v.id];
              if (state.ui?.selLv2ByVarLv1) {
                Object.keys(state.ui.selLv2ByVarLv1).forEach(k => {
                  if (k.startsWith(v.id + "::")) delete state.ui.selLv2ByVarLv1[k];
                });
              }
              // reset preview kalau sedang lihat variasi ini
              if (state.preview?.varId === v.id) {
                state.preview.lv1Id = null;
                state.preview.lv2Id = null;
                state.preview.lv3Id = null;
              }
              save(); render();
            };
          }
          const clipInfo = box.querySelector("[data-clipinfo]");
          if (clipInfo) {
            const c = getOptClip();
            clipInfo.textContent = (c && c.level === 1) ? `Clipboard: ${c.label || "-"} (${(c.data || []).length} item)` : "";
          }
          if (btnCopy) {
            btnCopy.onclick = () => {
              const data = (v.combos.lv1 || []).map(stripLv1);
              const payload = { level: 1, label: `Lv1 dari variasi "${v.label || "-"}"`, data, ts: Date.now() };
              setOptClip(payload);
              navigator.clipboard?.writeText(JSON.stringify(data, null, 2)).catch(() => { });
              toast("Opsi Lv1 dicopy. Buka variasi lain lalu klik Paste.");
              render();
            };
          }
          if (btnPaste) {
            btnPaste.onclick = () => {
              const c = getOptClip();
              if (!c || c.level !== 1) { toast("Clipboard kosong / beda level"); return; }
              v.combos.lv1 = v.combos.lv1 || [];
              const items = (c.data || []).map(cloneLv1);
              pasteInto(v.combos.lv1, items, tLv1());
              if (state.preview.varId === v.id && !state.preview.lv1Id && v.combos.lv1[0]) state.preview.lv1Id = v.combos.lv1[0].id;
              save(); render();
            };
          }


          btnAdd.onclick = () => {
            const nm = (newName.value || "").trim();
            if (!nm) { toast(`Nama ${tLv1()} wajib`); newName.focus(); return; }
            v.combos.lv1.push({ id: uid(), label: nm, addPrice: normalizePriceString((newPrice.value || "").trim()), promo: defaultPromo(), lv2: [] });

            if (state.preview.varId === v.id && !state.preview.lv1Id) state.preview.lv1Id = v.combos.lv1[0].id;

            newName.value = ""; newPrice.value = "";
            save(); render();
          };

          list.innerHTML = "";
          if (!v.combos.lv1.length) {
            list.innerHTML = `<div class="empty"><b>Belum ada ${esc(tLv1())}.</b><br/>Tambah opsi dulu.</div>`;
          } else {
            v.combos.lv1.forEach((o, idx) => {
              const r = d.createElement("div");

              r.className = "cCard";
              const op = normalizePromo((o as any).promo);
              (o as any).promo = op;
              r.innerHTML = `
              <div class="cNameCol">
                <label style="margin:0 0 6px;">${esc(tLv1())} Opsi ${idx + 1}</label>
                <input data-name name="lv1_name" autocomplete="on" value="${esc(o.label || "")}" />
                <small>${esc(tLv2())} anak: <b>${(o.lv2 || []).length}</b></small>
              </div>

              <div class="cPriceCol">
                <label style="margin:0 0 6px;">Tambah Harga (opsional)</label>
                <input data-price
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="lv1_price" autocomplete="on"
                  placeholder="0" value="${esc(o.addPrice || "")}" />
                <small>kosong = 0</small>
                <small class="hint" style="margin-top:6px;">Lv2 di tab Lv2</small>
              </div>

              <div class="cSideCol">
                <div class="promoBox promoCompact">
                  <div class="promoHdr">PROMO (OPSIONAL)</div>
                  <label class="promoOnRow">
                    <input type="checkbox" data-promo-on data-scope="lv1" data-var="${esc(v.id)}" data-lv1="${esc(o.id)}" ${op.active ? "checked" : ""}/>
                    <span class="promoOnText">Aktifkan diskon untuk opsi ini</span>
                  </label>

                  <div class="promoGrid">
                    <div>
                      <div class="promoLabel">Tipe Diskon</div>
                      <div class="promoRow">
                        <label><input type="radio" data-promo-type="percent" data-scope="lv1" data-var="${esc(v.id)}" data-lv1="${esc(o.id)}" name="p_lv1__${esc(v.id)}__${esc(o.id)}" ${(op.type !== "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Persen (%)</label>
                        <label><input type="radio" data-promo-type="nominal" data-scope="lv1" data-var="${esc(v.id)}" data-lv1="${esc(o.id)}" name="p_lv1__${esc(v.id)}__${esc(o.id)}" ${(op.type === "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Nominal (Rp)</label>
                      </div>
                    </div>

                    <div>
                      <div class="promoLabel">Nilai Diskon</div>
                      <input class="promoVal" type="text" inputmode="numeric" pattern="[0-9]*"
                        data-promo-val data-scope="lv1" data-var="${esc(v.id)}" data-lv1="${esc(o.id)}"
                        placeholder="contoh: 10 atau 150000"
                        value="${esc(op.value || "")}"
                        ${op.active ? "" : "disabled"} />
                    </div>
                  </div>
                </div>

                <div class="sideActions">
                  <button class="btn small danger" data-del type="button">Hapus</button>
                </div>
              </div>
            `;
              r.querySelector("[data-name]").oninput = (e) => { o.label = e.target.value; save(); };
              r.querySelector("[data-price]").oninput = (e) => { o.addPrice = normalizePriceString(e.target.value); save(); };
              r.querySelector("[data-del]").onclick = () => {
                if (!confirm(`Hapus opsi ${tLv1()} ini beserta anaknya?`)) return;
                v.combos.lv1 = v.combos.lv1.filter(x => x.id !== o.id);
                delete state.ui.selLv2ByVarLv1[`${v.id}::${o.id}`];

                if (state.preview.varId === v.id && state.preview.lv1Id === o.id) {
                  state.preview.lv1Id = null;
                  state.preview.lv2Id = null;
                  state.preview.lv3Id = null;
                }

                save(); render();
              };
              list.appendChild(r);
            });
          }

          wrap.appendChild(box);
        });

        return wrap;
      }

      function renderLv2() {
        const wrap = d.createElement("div");
        wrap.style.display = "grid";
        wrap.style.gap = "10px";

        const top = d.createElement("div");
        top.className = "box globalBox";
        top.innerHTML = `
        <div class="boxHead">
          <b>Kombinasi Lv 2</b>
          <span class="badge">${state.combo.lv2Enabled ? "Lv2 aktif" : "Lv2 belum aktif"}</span>
        </div>
        <div class="boxBody">
          ${!state.combo.lv2Enabled ? `
              <div class="empty" style="margin:0;">
                <b>Kombinasi Lv2 belum aktif.</b><br/>
                Kamu bisa aktifkan langsung dari tab ini.
              </div>
              <div class="btnRow" style="justify-content:flex-start; margin-top:10px;">
                <button class="btn goldBlack" id="enableLv2" type="button">Aktifkan Kombinasi Lv2</button>
              </div>
            ` : `
              <div>
                <label>Judul Kombinasi Lv2</label>
                <input class="titleInput" id="titleLv2" placeholder="${esc(TITLE_PH)}" />
                <div class="hint">Kalau kosong → otomatis jadi <b>Kombinasi</b></div>
              </div>

              <div class="divider" style="margin:6px 0;"></div>

              <div class="hint">Aktifkan Lv3 hanya kalau perlu. Kalau aktif → auto pindah tab Lv3.</div>
              <div class="btnRow" style="justify-content:flex-start;">
                ${state.combo.lv3Enabled
            ? `<span class="badge">Kombinasi Lv3 aktif ✅</span>`
            : `<button class="btn goldBlack" id="enableLv3" type="button">Aktifkan Kombinasi Lv3</button>`
          }
              </div>
            `
          }
        </div>
      `;
        wrap.appendChild(top);

        // enable Lv2 juga bisa dari tab Lv2
        const enableLv2 = top.querySelector("#enableLv2");
        if (enableLv2) {
          enableLv2.onclick = () => {
            if (!anyLv1Exists()) {
              toast(`Buat ${tLv1()} minimal 1 dulu baru aktifkan Lv2`);
              return;
            }
            const ok = confirm(`Aktifkan Kombinasi Lv2 untuk SEMUA ${tVar().toLowerCase()}?`);
            if (ok) {
              state.combo.lv2Enabled = true;
              // tetap di tab Lv2 (biar admin langsung lanjut)
              state.comboTab = 2;
              save(); render();
            }
          };
        }

        if (!state.combo.lv2Enabled) return wrap;

        bindTitleInput(
          top.querySelector("#titleLv2"),
          () => state.titles.lv2Title,
          (v) => { state.titles.lv2Title = v; }
        );

        const enableLv3 = top.querySelector("#enableLv3");
        if (enableLv3) {
          enableLv3.onclick = () => {
            const ok = confirm(`Aktifkan Kombinasi Lv3 untuk SEMUA ${tVar().toLowerCase()}?`);
            if (ok) {
              state.combo.lv3Enabled = true;
              state.comboTab = 3;
              save(); render();
            }
          };
        }

        state.variations.forEach(v => {
          const box = d.createElement("div");
          box.className = "box";

          const lv1Arr = v.combos.lv1 || [];
          const selLv1Id = getSelLv1(v.id, null);
          const lv1 = lv1Arr.find(o => o.id === selLv1Id);
          const lv2Arr = (lv1 && lv1.lv2) ? lv1.lv2 : [];

          box.innerHTML = `
          <div class="boxHead">
            <b>${esc(tVar())}: ${esc(v.label || "-")} → ${esc(tLv2())} (Lv2)</b>
            <span class="badge">${lv2Arr.length} opsi</span>
          </div>
          <div class="boxBody">
            ${!lv1Arr.length ? `
              <div class="empty"><b>Belum ada ${esc(tLv1())}.</b><br/>Tambah dulu di tab Lv1.</div>
            ` : `
              <div class="grid2">
                <div>
                  <label>Pilih Opsi Lv1</label>
                  <select data-sel-lv1>
                    ${lv1Arr.map(o => `<option value="${o.id}" ${o.id === selLv1Id ? "selected" : ""}>${esc(o.label || "-")}</option>`).join("")}
                  </select>
                  <div class="hint">Lv2 masuk di bawah Lv1 ini.</div>
                </div>
                <div>
                  <label>Tambah Harga (opsional)</label>
                  <input data-newprice
                    type="text" inputmode="numeric" pattern="[0-9]*"
                    name="lv2_price" autocomplete="on"
                    placeholder="0" />
                  <div class="hint">kosong = 0</div>
                </div>
              </div>

              <div>
                <label>Nama ${esc(tLv2())}</label>
                <input data-newname name="lv2_name" autocomplete="on" placeholder="contoh: ukuran / tipe / finishing ..." />
              </div>

              <div class="btnRow" style="justify-content:flex-start;">
                <button class="btn primary" data-add type="button">Tambah</button>
                <button class="btn small" data-copy type="button">Copy</button>
                <button class="btn small" data-paste type="button">Paste</button>
                <button class="btn small danger" data-dropall type="button">Drop All</button>
              </div>
              <small class="hint" data-clipinfo style="margin-top:6px;"></small>

              <div class="indent" data-list></div>
            `}
          </div>
        `;

          if (!lv1Arr.length) {
            wrap.appendChild(box);
            return;
          }

          const selLv1El = box.querySelector("[data-sel-lv1]");
          selLv1El.onchange = () => {
            state.ui.selLv1ByVar[v.id] = selLv1El.value;
            save(); render();
          };

          const newName = box.querySelector("[data-newname]");
          const newPrice = box.querySelector("[data-newprice]");
          const btnAdd = box.querySelector("[data-add]");
          const list = box.querySelector("[data-list]");

          const btnCopy = box.querySelector("[data-copy]");
          const btnPaste = box.querySelector("[data-paste]");
          const btnDropAll = box.querySelector("[data-dropall]");
          if (btnDropAll) {
            btnDropAll.onclick = () => {
              if (!lv1) { toast("Pilih Opsi Lv1 dulu"); return; }
              const ok = confirm(`Drop ALL opsi ${tLv2()} di bawah Lv1 "${lv1.label || "-"}" untuk variasi "${v.label || "-"}"?`);
              if (!ok) return;
              lv1.lv2 = [];
              const key = `${v.id}::${lv1.id}`;
              if (state.ui?.selLv2ByVarLv1) delete state.ui.selLv2ByVarLv1[key];
              if (state.preview?.varId === v.id && state.preview?.lv1Id === lv1.id) {
                state.preview.lv2Id = null;
                state.preview.lv3Id = null;
              }
              save(); render();
            };
          }
          const clipInfo = box.querySelector("[data-clipinfo]");
          if (clipInfo) {
            const c = getOptClip();
            clipInfo.textContent = (c && c.level === 2) ? `Clipboard: ${c.label || "-"} (${(c.data || []).length} item)` : "";
          }
          if (btnCopy) {
            btnCopy.onclick = () => {
              const lv1Id = state.ui.selLv1ByVar[v.id];
              const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
              if (!lv1Obj) { toast("Pilih opsi Lv1 dulu"); return; }
              const data = (lv1Obj.lv2 || []).map(stripLv2);
              const payload = { level: 2, label: `Lv2 dari variasi "${v.label || "-"}" • Lv1 "${lv1Obj.label || "-"}"`, data, ts: Date.now() };
              setOptClip(payload);
              navigator.clipboard?.writeText(JSON.stringify(data, null, 2)).catch(() => { });
              toast("Opsi Lv2 dicopy. Pilih target Lv1 lalu klik Paste.");
              render();
            };
          }
          if (btnPaste) {
            btnPaste.onclick = () => {
              const c = getOptClip();
              if (!c || c.level !== 2) { toast("Clipboard kosong / beda level"); return; }
              const lv1Id = state.ui.selLv1ByVar[v.id];
              const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
              if (!lv1Obj) { toast("Pilih opsi Lv1 dulu"); return; }
              lv1Obj.lv2 = lv1Obj.lv2 || [];
              const items = (c.data || []).map(cloneLv2);
              pasteInto(lv1Obj.lv2, items, tLv2());
              save(); render();
            };
          }


          btnAdd.onclick = () => {
            const lv1Id = state.ui.selLv1ByVar[v.id];
            const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
            if (!lv1Obj) { toast("Pilih opsi Lv1 dulu"); return; }
            const nm = (newName.value || "").trim();
            if (!nm) { toast(`Nama ${tLv2()} wajib`); newName.focus(); return; }
            lv1Obj.lv2 = lv1Obj.lv2 || [];
            lv1Obj.lv2.push({ id: uid(), label: nm, addPrice: normalizePriceString((newPrice.value || "").trim()), promo: defaultPromo(), lv3: [] });

            state.ui.selLv2ByVarLv1[`${v.id}::${lv1Id}`] = lv1Obj.lv2[0].id;

            newName.value = ""; newPrice.value = "";
            save(); render();
          };

          list.innerHTML = "";
          if (!lv2Arr.length) {
            list.innerHTML = `<div class="empty"><b>Belum ada ${esc(tLv2())} untuk Lv1 ini.</b><br/>Tambah di atas.</div>`;
          } else {
            lv2Arr.forEach((o, idx) => {
              const r = d.createElement("div");

              r.className = "cCard";
              const op = normalizePromo((o as any).promo);
              (o as any).promo = op;
              r.innerHTML = `
              <div class="cNameCol">
                <label style="margin:0 0 6px;">${esc(tLv2())} Opsi ${idx + 1}</label>
                <input data-name name="lv2_name" autocomplete="on" value="${esc(o.label || "")}" />
                <small>${esc(tLv3())} anak: <b>${(o.lv3 || []).length}</b></small>
              </div>

              <div class="cPriceCol">
                <label style="margin:0 0 6px;">Tambah Harga (opsional)</label>
                <input data-price
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="lv2_price" autocomplete="on"
                  placeholder="0" value="${esc(o.addPrice || "")}" />
                <small>kosong = 0</small>
                <small class="hint" style="margin-top:6px;">Lv3 di tab Lv3</small>
              </div>

              <div class="cSideCol">
                <div class="promoBox promoCompact">
                  <div class="promoHdr">PROMO (OPSIONAL)</div>
                  <label class="promoOnRow">
                    <input type="checkbox" data-promo-on data-scope="lv2" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(o.id)}" ${op.active ? "checked" : ""}/>
                    <span class="promoOnText">Aktifkan diskon untuk opsi ini</span>
                  </label>

                  <div class="promoGrid">
                    <div>
                      <div class="promoLabel">Tipe Diskon</div>
                      <div class="promoRow">
                        <label><input type="radio" data-promo-type="percent" data-scope="lv2" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(o.id)}" name="p_lv2__${esc(v.id)}__${esc(selLv1Id)}__${esc(o.id)}" ${(op.type !== "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Persen (%)</label>
                        <label><input type="radio" data-promo-type="nominal" data-scope="lv2" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(o.id)}" name="p_lv2__${esc(v.id)}__${esc(selLv1Id)}__${esc(o.id)}" ${(op.type === "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Nominal (Rp)</label>
                      </div>
                    </div>

                    <div>
                      <div class="promoLabel">Nilai Diskon</div>
                      <input class="promoVal" type="text" inputmode="numeric" pattern="[0-9]*"
                        data-promo-val data-scope="lv2" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(o.id)}"
                        placeholder="contoh: 10 atau 150000"
                        value="${esc(op.value || "")}"
                        ${op.active ? "" : "disabled"} />
                    </div>
                  </div>
                </div>

                <div class="sideActions">
                  <button class="btn small danger" data-del type="button">Hapus</button>
                </div>
              </div>
            `;
              r.querySelector("[data-name]").oninput = (e) => { o.label = e.target.value; save(); };
              r.querySelector("[data-price]").oninput = (e) => { o.addPrice = normalizePriceString(e.target.value); save(); };
              r.querySelector("[data-del]").onclick = () => {
                if (!confirm(`Hapus opsi ${tLv2()} ini beserta anaknya?`)) return;
                lv1.lv2 = (lv1.lv2 || []).filter(x => x.id !== o.id);
                const key = `${v.id}::${lv1.id}`;
                if (state.ui.selLv2ByVarLv1[key] === o.id) delete state.ui.selLv2ByVarLv1[key];

                save(); render();
              };
              list.appendChild(r);
            });
          }

          wrap.appendChild(box);
        });

        return wrap;
      }

      function renderLv3() {
        const wrap = d.createElement("div");
        wrap.style.display = "grid";
        wrap.style.gap = "10px";

        const top = d.createElement("div");
        top.className = "box globalBox";
        top.innerHTML = `
        <div class="boxHead">
          <b>Kombinasi Lv 3</b>
          <span class="badge">${state.combo.lv3Enabled ? "Lv3 aktif" : "Lv3 belum aktif"}</span>
        </div>
        <div class="boxBody">
          ${!state.combo.lv2Enabled ? `
              <div class="empty" style="margin:0;">
                <b>Lv2 belum aktif.</b><br/>Aktifkan Kombinasi Lv2 dulu (di tab Lv1 atau Lv2).
              </div>
            ` : (!state.combo.lv3Enabled ? `
              <div class="empty" style="margin:0;">
                <b>Kombinasi Lv3 belum aktif.</b><br/>
                Kamu bisa aktifkan langsung dari tab ini.
              </div>
              <div class="btnRow" style="justify-content:flex-start; margin-top:10px;">
                <button class="btn goldBlack" id="enableLv3" type="button">Aktifkan Kombinasi Lv3</button>
              </div>
            ` : `
              <div>
                <label>Judul Kombinasi Lv3</label>
                <input class="titleInput" id="titleLv3" placeholder="${esc(TITLE_PH)}" />
                <div class="hint">Kalau kosong → otomatis jadi <b>Opsi</b></div>
              </div>
            `)}
        </div>
      `;
        wrap.appendChild(top);

        // enable Lv3 juga bisa dari tab Lv3
        const enableLv3 = top.querySelector("#enableLv3");
        if (enableLv3) {
          enableLv3.onclick = () => {
            const ok = confirm(`Aktifkan Kombinasi Lv3 untuk SEMUA ${tVar().toLowerCase()}?`);
            if (ok) {
              state.combo.lv3Enabled = true;
              state.comboTab = 3;
              save(); render();
            }
          };
        }

        if (!state.combo.lv2Enabled || !state.combo.lv3Enabled) return wrap;

        bindTitleInput(
          top.querySelector("#titleLv3"),
          () => state.titles.lv3Title,
          (v) => { state.titles.lv3Title = v; }
        );

        state.variations.forEach(v => {
          const box = d.createElement("div");
          box.className = "box";

          const lv1Arr = v.combos.lv1 || [];
          const selLv1Id = getSelLv1(v.id, null);
          const lv1 = lv1Arr.find(o => o.id === selLv1Id);

          const lv2Arr = lv1?.lv2 || [];
          const selLv2Id = selLv1Id ? getSelLv2(v.id, selLv1Id) : null;
          const lv2 = lv2Arr.find(o => o.id === selLv2Id);

          const lv3Arr = lv2?.lv3 || [];

          box.innerHTML = `
          <div class="boxHead">
            <b>${esc(tVar())}: ${esc(v.label || "-")} → ${esc(tLv3())} (Lv3)</b>
            <span class="badge">${lv3Arr.length} opsi</span>
          </div>
          <div class="boxBody">
            ${!lv1Arr.length ? `
              <div class="empty"><b>Belum ada ${esc(tLv1())}.</b><br/>Tambah dulu di tab Lv1.</div>
            ` : `
              <div class="grid2">
                <div>
                  <label>Pilih Opsi Lv1</label>
                  <select data-sel-lv1>
                    ${lv1Arr.map(o => `<option value="${o.id}" ${o.id === selLv1Id ? "selected" : ""}>${esc(o.label || "-")}</option>`).join("")}
                  </select>
                  <div class="hint">Lv3 ada di bawah opsi Lv2.</div>
                </div>
                <div>
                  <label>Pilih Opsi Lv2</label>
                  <select data-sel-lv2 ${lv2Arr.length ? "" : "disabled"}>
                    ${lv2Arr.length
              ? lv2Arr.map(o => `<option value="${o.id}" ${o.id === selLv2Id ? "selected" : ""}>${esc(o.label || "-")}</option>`).join("")
              : `<option value="">Belum ada Lv2 untuk Lv1 ini</option>`
            }
                  </select>
                  <div class="hint">${lv2Arr.length ? "Lv3 masuk di bawah Lv2 ini." : "Tambah Lv2 dulu di tab Lv2."}</div>
                </div>
              </div>

              <div class="grid2">
                <div>
                  <label>Nama ${esc(tLv3())}</label>
                  <input data-newname name="lv3_name" autocomplete="on" placeholder="contoh: opsi detail..." />
                </div>
                <div>
                  <label>Tambah Harga (opsional)</label>
                  <input data-newprice
                    type="text" inputmode="numeric" pattern="[0-9]*"
                    name="lv3_price" autocomplete="on"
                    placeholder="0" />
                  <div class="hint">kosong = 0</div>
                </div>
              </div>

              <div class="btnRow" style="justify-content:flex-start;">
                <button class="btn primary" data-add type="button">Tambah</button>
                <button class="btn small" data-copy type="button">Copy</button>
                <button class="btn small" data-paste type="button">Paste</button>
                <button class="btn small danger" data-dropall type="button">Drop All</button>
              </div>
              <small class="hint" data-clipinfo style="margin-top:6px;"></small>

              <div class="indent" data-list></div>
            `}
          </div>
        `;

          if (!lv1Arr.length) {
            wrap.appendChild(box);
            return;
          }

          const selLv1El = box.querySelector("[data-sel-lv1]");
          const selLv2El = box.querySelector("[data-sel-lv2]");
          selLv1El.onchange = () => {
            state.ui.selLv1ByVar[v.id] = selLv1El.value;
            save(); render();
          };
          if (selLv2El) {
            selLv2El.onchange = () => {
              const key = `${v.id}::${state.ui.selLv1ByVar[v.id]}`;
              state.ui.selLv2ByVarLv1[key] = selLv2El.value;
              save(); render();
            };
          }

          const newName = box.querySelector("[data-newname]");
          const newPrice = box.querySelector("[data-newprice]");
          const btnAdd = box.querySelector("[data-add]");
          const list = box.querySelector("[data-list]");

          const btnCopy = box.querySelector("[data-copy]");
          const btnPaste = box.querySelector("[data-paste]");
          const btnDropAll = box.querySelector("[data-dropall]");
          if (btnDropAll) {
            btnDropAll.onclick = () => {
              if (!lv1Arr.length) { toast(`Belum ada ${tLv1()}`); return; }
              if (!lv2Arr.length) { toast(`Belum ada ${tLv2()} di Lv1 ini`); return; }
              if (!lv2) { toast("Pilih Opsi Lv2 dulu"); return; }
              const ok = confirm(`Drop ALL opsi ${tLv3()} di bawah Lv2 "${lv2.label || "-"}" untuk variasi "${v.label || "-"}"?`);
              if (!ok) return;
              lv2.lv3 = [];
              if (state.preview?.varId === v.id && state.preview?.lv1Id === selLv1Id && state.preview?.lv2Id === lv2.id) {
                state.preview.lv3Id = null;
              }
              save(); render();
            };
          }
          const clipInfo = box.querySelector("[data-clipinfo]");
          if (clipInfo) {
            const c = getOptClip();
            clipInfo.textContent = (c && c.level === 3) ? `Clipboard: ${c.label || "-"} (${(c.data || []).length} item)` : "";
          }
          if (btnCopy) {
            btnCopy.onclick = () => {
              const lv1Id = state.ui.selLv1ByVar[v.id];
              const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
              if (!lv1Obj) { toast("Pilih Lv1 dulu"); return; }
              const key = `${v.id}::${lv1Id}`;
              const lv2Id = state.ui.selLv2ByVarLv1[key];
              const lv2Obj = (lv1Obj.lv2 || []).find(o => o.id === lv2Id);
              if (!lv2Obj) { toast("Pilih Lv2 dulu"); return; }
              const data = (lv2Obj.lv3 || []).map(stripLv3);
              const payload = { level: 3, label: `Lv3 dari variasi "${v.label || "-"}" • Lv1 "${lv1Obj.label || "-"}" • Lv2 "${lv2Obj.label || "-"}"`, data, ts: Date.now() };
              setOptClip(payload);
              navigator.clipboard?.writeText(JSON.stringify(data, null, 2)).catch(() => { });
              toast("Opsi Lv3 dicopy. Pilih target Lv2 lalu klik Paste.");
              render();
            };
          }
          if (btnPaste) {
            btnPaste.onclick = () => {
              const c = getOptClip();
              if (!c || c.level !== 3) { toast("Clipboard kosong / beda level"); return; }
              const lv1Id = state.ui.selLv1ByVar[v.id];
              const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
              if (!lv1Obj) { toast("Pilih Lv1 dulu"); return; }
              const key = `${v.id}::${lv1Id}`;
              const lv2Id = state.ui.selLv2ByVarLv1[key];
              const lv2Obj = (lv1Obj.lv2 || []).find(o => o.id === lv2Id);
              if (!lv2Obj) { toast("Pilih Lv2 dulu"); return; }
              lv2Obj.lv3 = lv2Obj.lv3 || [];
              const items = (c.data || []).map(cloneLv3);
              pasteInto(lv2Obj.lv3, items, tLv3());
              save(); render();
            };
          }


          if (btnAdd) {
            btnAdd.onclick = () => {
              const lv1Id = state.ui.selLv1ByVar[v.id];
              const lv1Obj = v.combos.lv1.find(o => o.id === lv1Id);
              if (!lv1Obj) { toast("Pilih Lv1 dulu"); return; }
              const key = `${v.id}::${lv1Id}`;
              const lv2Id = state.ui.selLv2ByVarLv1[key];
              const lv2Obj = (lv1Obj.lv2 || []).find(o => o.id === lv2Id);
              if (!lv2Obj) { toast("Pilih Lv2 dulu"); return; }
              const nm = (newName.value || "").trim();
              if (!nm) { toast(`Nama ${tLv3()} wajib`); newName.focus(); return; }
              lv2Obj.lv3 = lv2Obj.lv3 || [];
              lv2Obj.lv3.push({ id: uid(), label: nm, addPrice: normalizePriceString((newPrice.value || "").trim()), promo: defaultPromo() });

              newName.value = ""; newPrice.value = "";
              save(); render();
            };
          }

          list.innerHTML = "";
          if (!lv2Arr.length) {
            list.innerHTML = `<div class="empty"><b>Belum ada Lv2 untuk Lv1 ini.</b><br/>Tambah Lv2 dulu di tab Lv2.</div>`;
          } else if (!lv3Arr.length) {
            list.innerHTML = `<div class="empty"><b>Belum ada ${esc(tLv3())} untuk Lv2 ini.</b><br/>Tambah di atas.</div>`;
          } else {
            lv3Arr.forEach((o, idx) => {
              const r = d.createElement("div");

              r.className = "cCard";
              const op = normalizePromo((o as any).promo);
              (o as any).promo = op;
              r.innerHTML = `
              <div class="cNameCol">
                <label style="margin:0 0 6px;">${esc(tLv3())} Opsi ${idx + 1}</label>
                <input data-name name="lv3_name" autocomplete="on" value="${esc(o.label || "")}" />
                <small>&nbsp;</small>
              </div>

              <div class="cPriceCol">
                <label style="margin:0 0 6px;">Tambah Harga (opsional)</label>
                <input data-price
                  type="text" inputmode="numeric" pattern="[0-9]*"
                  name="lv3_price" autocomplete="on"
                  placeholder="0" value="${esc(o.addPrice || "")}" />
                <small>kosong = 0</small>
                <small>&nbsp;</small>
              </div>

              <div class="cSideCol">
                <div class="promoBox promoCompact">
                  <div class="promoHdr">PROMO (OPSIONAL)</div>
                  <label class="promoOnRow">
                    <input type="checkbox" data-promo-on data-scope="lv3" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(selLv2Id)}" data-lv3="${esc(o.id)}" ${op.active ? "checked" : ""}/>
                    <span class="promoOnText">Aktifkan diskon untuk opsi ini</span>
                  </label>

                  <div class="promoGrid">
                    <div>
                      <div class="promoLabel">Tipe Diskon</div>
                      <div class="promoRow">
                        <label><input type="radio" data-promo-type="percent" data-scope="lv3" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(selLv2Id)}" data-lv3="${esc(o.id)}" name="p_lv3__${esc(v.id)}__${esc(selLv1Id)}__${esc(selLv2Id)}__${esc(o.id)}" ${(op.type !== "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Persen (%)</label>
                        <label><input type="radio" data-promo-type="nominal" data-scope="lv3" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(selLv2Id)}" data-lv3="${esc(o.id)}" name="p_lv3__${esc(v.id)}__${esc(selLv1Id)}__${esc(selLv2Id)}__${esc(o.id)}" ${(op.type === "nominal") ? "checked" : ""} ${op.active ? "" : "disabled"}/> Nominal (Rp)</label>
                      </div>
                    </div>

                    <div>
                      <div class="promoLabel">Nilai Diskon</div>
                      <input class="promoVal" type="text" inputmode="numeric" pattern="[0-9]*"
                        data-promo-val data-scope="lv3" data-var="${esc(v.id)}" data-lv1="${esc(selLv1Id)}" data-lv2="${esc(selLv2Id)}" data-lv3="${esc(o.id)}"
                        placeholder="contoh: 10 atau 150000"
                        value="${esc(op.value || "")}"
                        ${op.active ? "" : "disabled"} />
                    </div>
                  </div>
                </div>

                <div class="sideActions">
                  <button class="btn small danger" data-del type="button">Hapus</button>
                </div>
              </div>
            `;
              r.querySelector("[data-name]").oninput = (e) => { o.label = e.target.value; save(); };
              r.querySelector("[data-price]").oninput = (e) => { o.addPrice = normalizePriceString(e.target.value); save(); };
              r.querySelector("[data-del]").onclick = () => {
                if (!confirm(`Hapus opsi ${tLv3()} ini?`)) return;
                lv2.lv3 = (lv2.lv3 || []).filter(x => x.id !== o.id);
                save(); render();
              };
              list.appendChild(r);
            });
          }

          wrap.appendChild(box);
        });

        return wrap;
      }

      function renderPreviewEcommerce() {
        ensurePreviewDefaults();

        const box = d.createElement("div");
        box.className = "box";
        box.innerHTML = `
        <div class="boxHead">
          <b>Preview (tampilan e-commerce)</b>
          <span class="badge">klik chip untuk pilih</span>
        </div>
        <div class="boxBody">
          <div class="previewGrid">
            <div>
              <div class="pvMedia">
                <div class="pvThumb" id="pvThumb"></div>
                <div class="pvMediaText">
                  <div class="pvTitle">${esc(state.product.title || "Produk")}</div>
                  <div class="pvSub">Foto variasi (opsional)</div>
                </div>
              </div>

              <label>${esc(tVar())}</label>
              <div class="chips" id="pvVars"></div>

              <div style="height:10px;"></div>

              <label id="pvLv1Label">${esc(tLv1())}</label>
              <div class="chips" id="pvLv1"></div>

              <div style="height:10px;"></div>

              <label id="pvLv2Label">${esc(tLv2())}</label>
              <div id="pvLv2Mount"></div>

              <div style="height:10px;"></div>

              <label id="pvLv3Label">${esc(tLv3())}</label>
              <div id="pvLv3Mount"></div>

              <div style="height:12px;"></div>

              <div class="priceLine" id="pvPrice"></div>
            </div>
          </div>
        </div>
      `;

        const pvVars = box.querySelector("#pvVars");
        const pvLv1 = box.querySelector("#pvLv1");
        const pvLv2M = box.querySelector("#pvLv2Mount");
        const pvLv3M = box.querySelector("#pvLv3Mount");
        const pvThumb = box.querySelector("#pvThumb") as any;

        const pvLv1Label = box.querySelector("#pvLv1Label");
        const pvLv2Label = box.querySelector("#pvLv2Label");
        const pvLv3Label = box.querySelector("#pvLv3Label");
        const pvPrice = box.querySelector("#pvPrice");
        pvVars.innerHTML = "";
        const activeVars = (state.variations || []).filter(x => x.enabled !== false);
        activeVars.forEach(v => {
          const base = effectiveBasePriceForVar(v);
          const unit = effectiveUnitForVar(v);
          const label = v.label || "-";
          const badge = (v.price && String(v.price).trim() !== "")
            ? `Base ${formatIDR(base)}`
            : `Base ikut produk`;

          const c = d.createElement("div");
          c.className = "chip" + (state.preview.varId === v.id ? " sel" : "");
          c.innerHTML = `<span>${esc(label)}</span>`;
          c.onclick = () => {
            state.preview.varId = v.id;
            state.preview.lv1Id = null;
            state.preview.lv2Id = null;
            state.preview.lv3Id = null;
            save(); render();
          };
          pvVars.appendChild(c);
        });

        const v = state.variations.find(x => x.id === state.preview.varId);
        const base = effectiveBasePriceForVar(v);
        const unit = effectiveUnitForVar(v);

        const lv1Arr = v?.combos?.lv1 || [];

        // Sembunyikan label level jika kosong (tanpa pesan)
        pvLv1Label.style.display = (lv1Arr.length ? "" : "none");

        pvLv1.innerHTML = "";
        if (!lv1Arr.length) {
          // tidak tampilkan pesan kosong
        } else {
          lv1Arr.forEach(o => {
            const add = parseMoney(o.addPrice || "");
            const c = d.createElement("div");
            c.className = "chip" + (state.preview.lv1Id === o.id ? " sel" : "");
            c.innerHTML = `<span>${esc(o.label || "-")}</span>`;
            c.onclick = () => {
              state.preview.lv1Id = o.id;
              state.preview.lv2Id = null;
              state.preview.lv3Id = null;
              save(); render();
            };
            pvLv1.appendChild(c);
          });
        }

        const lv1 = lv1Arr.find(o => o.id === state.preview.lv1Id);
        const lv2Arr = (lv1 && lv1.lv2) ? lv1.lv2 : [];

        pvLv2M.innerHTML = "";
        // Lv2: jangan tampilkan pesan kosong; sembunyikan jika tidak relevan
        if (!state.combo.lv2Enabled) {
          pvLv2Label.style.display = "none";
        } else if (!lv1) {
          pvLv2Label.style.display = "none";
        } else if (!lv2Arr.length) {
          pvLv2Label.style.display = "none";
        } else {
          pvLv2Label.style.display = "";

          const chips = d.createElement("div");
          chips.className = "chips";
          lv2Arr.forEach(o => {
            const add = parseMoney(o.addPrice || "");
            const c = d.createElement("div");
            c.className = "chip" + (state.preview.lv2Id === o.id ? " sel" : "");
            c.innerHTML = `<span>${esc(o.label || "-")}</span>`;
            c.onclick = () => {
              state.preview.lv2Id = o.id;
              state.preview.lv3Id = null;
              save(); render();
            };
            chips.appendChild(c);
          });
          pvLv2M.appendChild(chips);
        }

        const lv2 = lv2Arr.find(o => o.id === state.preview.lv2Id);
        const lv3Arr = (lv2 && lv2.lv3) ? lv2.lv3 : [];

        pvLv3M.innerHTML = "";
        // Lv3: jangan tampilkan pesan kosong; sembunyikan jika tidak relevan
        if (!state.combo.lv2Enabled) {
          pvLv3Label.style.display = "none";
        } else if (!state.combo.lv3Enabled) {
          pvLv3Label.style.display = "none";
        } else if (!lv2) {
          pvLv3Label.style.display = "none";
        } else if (!lv3Arr.length) {
          pvLv3Label.style.display = "none";
        } else {
          pvLv3Label.style.display = "";

          const chips = d.createElement("div");
          chips.className = "chips";
          lv3Arr.forEach(o => {
            const add = parseMoney(o.addPrice || "");
            const c = d.createElement("div");
            c.className = "chip" + (state.preview.lv3Id === o.id ? " sel" : "");
            c.innerHTML = `<span>${esc(o.label || "-")}</span>`;
            c.onclick = () => {
              state.preview.lv3Id = o.id;
              save(); render();
            };
            chips.appendChild(c);
          });
          pvLv3M.appendChild(chips);
        }

        const qty = Math.max(1, toInt(state.preview.qty || 1));
        const lv3Sel = lv3Arr.find(o => o.id === state.preview.lv3Id);

        // Preview sisi user: harga akhir = base (produk/variasi) + add-on Lv1/Lv2/Lv3 yang dipilih (level aktif saja)
        const vPromo = normalizePromo((v as any)?.promo);
        const baseCalc = applyPromo(toInt(base), vPromo);

        const lv1Promo = lv1 ? normalizePromo((lv1 as any).promo) : defaultPromo();
        const add1Before = lv1 ? parseMoney(lv1.addPrice || "") : 0;
        const add1Calc = applyPromo(add1Before, lv1Promo);

        const lv2Promo = (state.combo.lv2Enabled && lv2) ? normalizePromo((lv2 as any).promo) : defaultPromo();
        const add2Before = (state.combo.lv2Enabled && lv2) ? parseMoney(lv2.addPrice || "") : 0;
        const add2Calc = applyPromo(add2Before, lv2Promo);

        const lv3Promo = (state.combo.lv2Enabled && state.combo.lv3Enabled && lv3Sel) ? normalizePromo((lv3Sel as any).promo) : defaultPromo();
        const add3Before = (state.combo.lv2Enabled && state.combo.lv3Enabled && lv3Sel) ? parseMoney(lv3Sel.addPrice || "") : 0;
        const add3Calc = applyPromo(add3Before, lv3Promo);

        const beforeUnit = toInt(baseCalc.before) + toInt(add1Calc.before) + toInt(add2Calc.before) + toInt(add3Calc.before);
        const afterUnit = toInt(baseCalc.after) + toInt(add1Calc.after) + toInt(add2Calc.after) + toInt(add3Calc.after);

        const totalBefore = beforeUnit * qty;
        const totalAfter = afterUnit * qty;

        // badge persen total (mirip contoh -10%)
        let totalBadge = "";
        if (totalAfter < totalBefore && totalBefore > 0) {
          const pct = Math.round((1 - (totalAfter / totalBefore)) * 100);
          if (pct > 0) totalBadge = `-${pct}%`;
        }

        const unitSym = unitSymbolShort(unit);

        pvPrice.innerHTML = `
        <div class="bigPrice">${priceHtml(totalBefore, totalAfter, totalBadge)}${unitSym ? "/" + esc(unitSym) : ""}</div>
      `;

        // Foto variasi (opsional) di preview
        try {
          const vv: any = state.variations.find((x: any) => x.id === state.preview.varId);
          const url = vv ? getVarImageUrl(vv) : "";
          if (pvThumb) pvThumb.style.backgroundImage = url ? `url("${url}")` : "";
        } catch { }

        return box;
      }

      d.getElementById("btnReset").onclick = () => {
        if (!confirm("Reset semua?")) return;
        localStorage.removeItem(LS_KEY);
        location.reload();
      };
      d.getElementById("btnExport").onclick = () => {
        const payload = JSON.stringify(state, null, 2);
        navigator.clipboard?.writeText(payload).catch(() => { });
        alert(payload);
      };
      d.getElementById("btnImport").onclick = () => {
        const raw = prompt("Paste JSON state:");
        if (!raw) return;
        try {
          const obj = JSON.parse(raw);
          if (!obj.product || !obj.variations) throw new Error("Format invalid");
          state = obj;
          if (!state.combo) state.combo = { lv2Enabled: false, lv3Enabled: false };
          if (!("enabled" in state)) state.enabled = (state.variations && state.variations.length) ? true : false;
          if (!state.preview) state.preview = { varId: null, lv1Id: null, lv2Id: null, lv3Id: null, qty: 1 };
          if (!state.titles) state.titles = { varTitle: "", lv1Title: "", lv2Title: "", lv3Title: "" };
          if (!state.ui) state.ui = { selLv1ByVar: {}, selLv2ByVarLv1: {} };
          if (!("optClip" in state)) state.optClip = null;
          state.variations.forEach(v => {
            if ("enabled" in v) delete (v as any).enabled;
            if (v.unitOverride === undefined) v.unitOverride = "";
            if (v.price === undefined) v.price = "";
            v.price = String(v.price || "").replace(/[^\d]/g, "");
            (v as any).promo = normalizePromo((v as any).promo);
            if (!v.combos) v.combos = { lv1: [] };
            if (!Array.isArray(v.combos.lv1)) v.combos.lv1 = [];
            v.combos.lv1.forEach(l1 => {
              l1.addPrice = String(l1.addPrice || "").replace(/[^\d]/g, "");
              (l1 as any).promo = normalizePromo((l1 as any).promo);
              if (!Array.isArray(l1.lv2)) l1.lv2 = [];
              l1.lv2.forEach(l2 => {
                l2.addPrice = String(l2.addPrice || "").replace(/[^\d]/g, "");
                (l2 as any).promo = normalizePromo((l2 as any).promo);
                if (!Array.isArray(l2.lv3)) l2.lv3 = [];
                l2.lv3.forEach(l3 => {
                  l3.addPrice = String(l3.addPrice || "").replace(/[^\d]/g, "");
                  (l3 as any).promo = normalizePromo((l3 as any).promo);
                });
              });
            });
          });
          if (!("optClip" in state)) state.optClip = null;
          save(); render(); toast("Import sukses");
        } catch (e) {
          alert("Import gagal: " + (e.message || e));
        }
      };

      // === Toggle global aktifkan variasi ===
      const enabledToggle = d.getElementById("vcomboEnabled");
      if (enabledToggle) {
        enabledToggle.checked = !!state.enabled;
        enabledToggle.onchange = () => {
          const next = !!enabledToggle.checked;
          if (next && !state.enabled) { state.step = 0; }
          state.enabled = next;
          save();
          render();
        };
      }
      syncHidden();


      render();

    } catch (e) {
      console.error("VCombo init error", e);
      notify("Gagal inisialisasi Variasi & Kombinasi.");
    }


    return () => {
      try { if (onVarKolasePicked) window.removeEventListener("apix:varKolasePicked", onVarKolasePicked as any); } catch { }
      // try { window.removeEventListener("apix:requestVarMedia", broadcastVarMedia as any); } catch { }
      // try { if (mainFormSyncCleanup) mainFormSyncCleanup(); } catch { }
    };

  }, [notify]);

  return (
    <div id="vcomboRoot" className="apixVCombo">
      <style>{`
.apixVCombo {
      --bg:#f6f7fb; --card:#fff; --text:#111827; --muted:#6b7280; --line:#e5e7eb;
      --shadow: 0 10px 30px rgba(17,24,39,.08);
      --r:18px; --r2:14px;

      --green:#03ac0e; --greenSoft: rgba(3,172,14,.10);
      --danger:#ef4444;

      --gold:#d4af37;
      --gold2:#f3e29a;
      --black:#0b0f14;

      --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
    }
.apixVCombo * { box-sizing:border-box; }
.apixVCombo {
      margin:0; font-family:var(--font); color:var(--text);
      background:
        radial-gradient(900px 500px at 10% -10%, rgba(3,172,14,.10), transparent 50%),
        radial-gradient(800px 450px at 95% 0%, rgba(59,130,246,.08), transparent 55%),
        var(--bg);
    }
.apixVCombo .wrap { max-width: 1100px; margin: 0 auto; padding: 16px; }
.apixVCombo .card {
      background:var(--card);
      border:1px solid var(--line);
      border-radius: var(--r);
      box-shadow: var(--shadow);
      overflow: visible;
    }
.apixVCombo .head {
      padding: 14px 16px; border-bottom:1px solid var(--line);
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      background: linear-gradient(180deg, rgba(3,172,14,.06), transparent 65%);
      border-top-left-radius: var(--r);
      border-top-right-radius: var(--r);
      overflow: hidden;
    }
.apixVCombo .brand { display:flex; align-items:center; gap:10px; min-width:0; }
.apixVCombo .logo {
      width:38px;height:38px;border-radius:14px; display:grid; place-items:center;
      background: var(--greenSoft); border:1px solid rgba(3,172,14,.2); color: var(--green); font-weight: 1000;
    }
.apixVCombo .title { margin:0; font-size:14px; font-weight:1000; }
.apixVCombo .sub { margin:2px 0 0; font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.apixVCombo .btnRow { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
.apixVCombo .btn {
      border:1px solid var(--line); background:#fff; padding: 9px 11px; border-radius: 14px;
      font-size: 12px; cursor:pointer; user-select:none;
      transition:.15s transform ease, .15s box-shadow ease, .15s border-color ease;
    }
.apixVCombo .btn:hover { border-color:#d1d5db; box-shadow: 0 8px 18px rgba(17,24,39,.08); }
.apixVCombo .btn:active { transform: translateY(1px); }
.apixVCombo .btn.primary {
      border-color: rgba(3,172,14,.35);
      background: linear-gradient(180deg, rgba(3,172,14,.14), rgba(3,172,14,.08));
      font-weight: 900; color:#0b3d10;
    }
.apixVCombo .btn.danger {
      border-color: rgba(239,68,68,.35);
      background: rgba(239,68,68,.07);
      font-weight: 900; color:#7f1d1d;
    }
.apixVCombo .btn.small { padding:7px 9px; border-radius: 12px; }
.apixVCombo .btn.goldBlack {
      border-color: rgba(212,175,55,.55);
      background: var(--black);
      color: var(--gold2);
      font-weight: 1000;
    }
.apixVCombo .btn.goldBlack:hover {
      border-color: rgba(212,175,55,.75);
      box-shadow: 0 10px 20px rgba(0,0,0,.12);
    }
.apixVCombo .steps {
      display:flex; gap:10px; padding: 12px 16px; border-bottom: 1px solid var(--line); background:#fff;
      flex-wrap:wrap; align-items:center;
    }
.apixVCombo .step {
      display:flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius: 999px;
      padding: 8px 10px; cursor:pointer; user-select:none; background:#fff;
    }
.apixVCombo .dot { width:22px;height:22px;border-radius:999px; display:grid;place-items:center; font-size:12px; border:1px solid var(--line); color:var(--muted); }
.apixVCombo .step .lbl { font-size:12px; font-weight:900; color:var(--muted); white-space:nowrap; }
.apixVCombo .step.active { border-color: rgba(3,172,14,.35); background: rgba(3,172,14,.07); }
.apixVCombo .step.active .dot { border-color: rgba(3,172,14,.35); background: rgba(3,172,14,.12); color: var(--green); font-weight: 1000; }
.apixVCombo .step.active .lbl { color:#0b3d10; }
.apixVCombo .body { padding:16px; }
.apixVCombo .disabledBox{
      border:1px dashed rgba(3,172,14,.35);
      background: rgba(3,172,14,.06);
      border-radius: 16px;
      padding: 14px 14px;
    }
.apixVCombo .disabledTitle{ font-weight:800; }
.apixVCombo .disabledSub{ margin-top:6px; color: var(--muted); font-size: 13px; line-height: 1.45; }

.apixVCombo label { display:block; font-size:12px; color:var(--muted); margin-bottom:6px; }
.apixVCombo input, .apixVCombo select {
      width:100%;
      padding: 12px 14px;
      border-radius: 16px;
      border:1px solid var(--line);
      outline:none; background:#fff; color: var(--text);
      font-size: 14px;
      line-height: 1.25;
    }
.apixVCombo input::placeholder { color:#9ca3af; }
.apixVCombo input:focus, .apixVCombo select:focus { border-color: rgba(3,172,14,.45); box-shadow: 0 0 0 4px rgba(3,172,14,.10); }
.apixVCombo select:disabled, .apixVCombo input:disabled, .apixVCombo button:disabled { opacity:.6; cursor:not-allowed; }
.apixVCombo .titleInput {
      font-weight: 800;
      letter-spacing: .1px;
      background: rgba(255,255,255,.92);
      border-color: rgba(212,175,55,.25);
    }
.apixVCombo .titleInput:focus {
      border-color: rgba(212,175,55,.55);
      box-shadow: 0 0 0 4px rgba(212,175,55,.18);
    }
.apixVCombo .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.apixVCombo .grid3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.apixVCombo .hint { font-size:12px; color:var(--muted); line-height:1.4; margin-top:6px; }
.apixVCombo .divider { height:1px; background: var(--line); margin: 12px 0; }
.apixVCombo .box {
      border:1px solid var(--line);
      border-radius: var(--r2);
      background:#fff;
      overflow: visible;
    }
.apixVCombo .boxHead {
      padding:10px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px;
      background:#f9fafb; border-bottom: 1px solid var(--line);
      border-top-left-radius: var(--r2);
      border-top-right-radius: var(--r2);
      overflow:hidden;
    }
.apixVCombo .boxHead b { font-size:12px; }
.apixVCombo .badge {
      font-size:11px; padding:2px 8px; border-radius:999px; border:1px solid var(--line);
      color:var(--muted); background:#fff; white-space:nowrap;
    }
.apixVCombo .boxBody { padding:12px; display:grid; gap:10px; }
.apixVCombo .globalBox {
      border-color: rgba(212,175,55,.55) !important;
      background: linear-gradient(180deg, rgba(212,175,55,.14), rgba(255,255,255,1) 55%);
    }
.apixVCombo .globalBox .boxHead {
      background: linear-gradient(180deg, rgba(212,175,55,.20), rgba(212,175,55,.08));
      border-bottom-color: rgba(212,175,55,.35);
    }
.apixVCombo .globalBox .badge {
      border-color: rgba(212,175,55,.55);
      background: rgba(212,175,55,.10);
      color: #6b4e00;
    }
.apixVCombo .row {
      border:1px solid var(--line); border-radius: 14px; padding: 10px;
      display:grid; grid-template-columns: 1.1fr .9fr .9fr auto; gap: 8px; align-items:center; background:#fff;
    }
.apixVCombo .row small { color:var(--muted); display:block; margin-top:4px; }
.apixVCombo .vCard{
      border:1px solid var(--line); border-radius: 14px; padding: 12px;
      background:#fff;
      display:flex; flex-direction:column;
      gap: 12px;
    }
.apixVCombo .vTop{
      display:grid;
      grid-template-columns: 1.25fr .95fr .9fr;
      gap: 12px;
      align-items:start;
    }
.apixVCombo .vBottom{
      /* PROMO area (vRight) harus turun ke bawah & full-width */
      display:flex;
      flex-direction:column;
      gap: 12px;
      align-items:stretch;
    }
.apixVCombo .vRight{
      display:flex;
      flex-direction:column;
      gap: 10px;
      width: 100%;
      justify-content:flex-start;
      align-items:stretch;
    }

.apixVCombo .cCard{
      border:1px solid var(--line); border-radius: 14px; padding: 12px;
      background:#fff;
      display:grid;
      /* PROMO harus turun ke baris bawah & full-width (Lv1/Lv2/Lv3) */
      grid-template-columns: 1.25fr .95fr;
      grid-template-areas:
        "name price"
        "side side";
      gap: 12px;
      align-items:start;
    }
.apixVCombo .cNameCol{ grid-area:name; }
.apixVCombo .cPriceCol{ grid-area:price; }
.apixVCombo .cSideCol{
      grid-area:side;
      display:flex;
      flex-direction:column;
      gap:10px;
      width:100%;
      justify-content:flex-start;
      align-items:stretch;
    }

.apixVCombo .sideActions{ display:flex; justify-content:flex-end; margin-top:0; }

.apixVCombo .promoCompact{ padding:10px; }
.apixVCombo .promoCompact .promoOnRow{ margin-bottom:8px; }
.apixVCombo .promoCompact .promoRow{ gap:8px; flex-wrap:wrap; align-items:center; }
.apixVCombo .promoCompact .promoRow label{ white-space:nowrap; }
.apixVCombo .promoCompact .promoRow input[type="text"]{ width: 100%; min-width:0; }
.apixVCombo .actions { display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
.apixVCombo .empty {
      border:1px dashed #d1d5db; border-radius: var(--r2); padding: 14px; background:#fff;
      color: var(--muted); font-size: 12px; line-height: 1.5;
    }
.apixVCombo .empty b { color:#111827; }
.apixVCombo .subtabs {
      display:flex; gap:8px; flex-wrap:wrap;
      padding:10px 12px; border:1px solid var(--line); border-radius: var(--r2);
      background:#fff;
      align-items:center;
      justify-content:space-between;
    }
.apixVCombo .stabRow { display:flex; gap:8px; flex-wrap:wrap; }
.apixVCombo .stab {
      border:1px solid var(--line);
      background:#fff;
      padding:8px 10px;
      border-radius:999px;
      font-size:12px;
      font-weight:900;
      color:var(--muted);
      cursor:pointer;
      user-select:none;
      appearance:none;
      -webkit-appearance:none;
      outline:none;
    }
.apixVCombo .stab:focus {
      box-shadow: 0 0 0 4px rgba(3,172,14,.10);
      border-color: rgba(3,172,14,.45);
    }
.apixVCombo .stab.active {
      border-color: rgba(3,172,14,.35);
      background: rgba(3,172,14,.07);
      color:#0b3d10;
    }
.apixVCombo .indent {
      margin-left: 12px; padding-left: 10px; border-left: 2px dashed #e5e7eb;
      display:grid; gap:10px;
    }
.apixVCombo /* Preview ecommerce */
    .chips { display:flex; flex-wrap:wrap; gap:8px; }
.apixVCombo .chip {
      border:1px solid var(--line);
      background:#fff;
      border-radius:999px;
      padding:8px 10px;
      font-size:12px;
      cursor:pointer;
      user-select:none;
      display:flex; gap:8px; align-items:center;
      transition:.15s border-color ease, .15s transform ease, .15s box-shadow ease;
    }
.apixVCombo .chip:hover { border-color:#d1d5db; box-shadow: 0 8px 16px rgba(17,24,39,.06); }
.apixVCombo .chip:active { transform: translateY(1px); }
.apixVCombo .chip.sel {
      border-color: rgba(3,172,14,.45);
      background: rgba(3,172,14,.08);
      color:#0b3d10;
      font-weight:900;
    }
.apixVCombo .chip .delta {
      font-size:11px;
      padding:2px 8px;
      border-radius:999px;
      border:1px solid rgba(3,172,14,.30);
      background: rgba(3,172,14,.08);
      color:#0b3d10;
      font-weight:900;
      white-space:nowrap;
    }
.apixVCombo .previewGrid {
      display:grid;
      grid-template-columns: 1fr;
      gap: 10px;
      align-items:start;
      max-width: 620px;
      margin: 0 auto;
    }
.apixVCombo .previewGrid label { text-align:center; display:block; }
.apixVCombo .previewGrid .chips { justify-content:center; }
.apixVCombo .priceLine {
      border:1px solid var(--line);
      border-radius: 14px;
      padding:12px;
      background: linear-gradient(180deg, rgba(3,172,14,.08), #fff 70%);
    }
.apixVCombo .priceLine b { font-size:14px; }
.apixVCombo .priceLine .k { color:var(--muted); font-size:12px; }

.apixVCombo .oldPrice{ text-decoration: line-through; opacity:.55; margin-right:10px; font-weight:800; }
.apixVCombo .newPrice{ font-weight: 950; }
.apixVCombo .promoBadge{
      display:inline-block; margin-left:10px; padding:2px 10px;
      border-radius:999px; font-size:12px; border:1px solid var(--line);
      background:#fff;
    }
.apixVCombo .promoBox{
      margin-top:8px; padding:12px;
      border:1px dashed var(--line); border-radius: 14px;
      background: rgba(255,255,255,.65);
    }
.apixVCombo .promoHdr{
      font-weight:900;
      letter-spacing:.08em;
      font-size:12px;
      margin:0 0 12px;
      color:var(--text);
    }

.apixVCombo label.promoOnRow{
      /* HARD LOCK: checkbox + text must stay on the left (no centering / no far-right drift) */
      display:grid !important;
      grid-template-columns: 22px 1fr;
      column-gap:10px;
      align-items:center;
      justify-items:start;
      justify-content:start !important;
      place-content:start !important;
      width:100%;
      margin:0 0 14px;
      font-size:14px;
      color:var(--text);
      text-align:left !important;
    }
.apixVCombo label.promoOnRow input{
      margin:0 !important;
      width:18px;
      height:18px;
      justify-self:start;
      align-self:center;
    }
.apixVCombo label.promoOnRow .promoOnText{
      display:block;
      justify-self:start;
      align-self:center;
      min-width:0 !important;
      max-width: 100%;
      white-space: normal;
      overflow-wrap: normal !important;
      word-break: normal !important;
      text-align:left !important;
    }

/* Force promo containers to take full width in Variasi & Kombinasi cards */
.apixVCombo .promoBox{ width:100% !important; max-width:none !important; }
.apixVCombo .vBottom{ display:flex !important; flex-direction:column !important; align-items:stretch !important; }
.apixVCombo .vRight{ width:100% !important; }
.apixVCombo .cCard{
  display:grid !important;
  grid-template-columns: 1.25fr .95fr !important;
  grid-template-areas:
    "name price"
    "side side" !important;
}
.apixVCombo .cSideCol{ width:100% !important; }


.apixVCombo .promoGrid{
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:16px;
      align-items:start;
    }
.apixVCombo .promoLabel{
      font-weight:800;
      font-size:14px;
      color:var(--text);
      margin:0 0 10px;
    }
.apixVCombo .promoBox .promoRow{
      display:flex;
      gap:18px;
      flex-wrap:wrap;
      align-items:center;
      margin:0;
    }
.apixVCombo .promoBox .promoRow label{
      display:flex;
      align-items:center;
      gap:8px;
      margin:0;
      font-size:14px;
      color:var(--text);
      white-space:nowrap;
    }
.apixVCombo .promoBox .promoRow label input{ margin:0; }

.apixVCombo .promoVal{
      width:100%;
      border-radius: 16px;
      padding: 12px 14px;
      font-size:14px;
    }
.apixVCombo .promoBox [disabled]{ opacity:.55; cursor:not-allowed; }

@media (max-width: 820px){
      .apixVCombo .promoGrid{ grid-template-columns: 1fr; }
      .apixVCombo .cCard{ grid-template-columns: 1fr; grid-template-areas: "name" "price" "side"; }
    }
.apixVCombo .priceTable {
      width:100%; border-collapse:collapse; margin-top:8px;
      font-size:12px;
    }
.apixVCombo .priceTable td {
      padding:6px 0;
      border-bottom:1px dashed #eee;
    }
.apixVCombo .priceTable td:last-child { text-align:right; font-weight:900; }
.apixVCombo .priceWarn {
      border:1px dashed #d1d5db;
      border-radius: 14px;
      padding: 10px;
      color: var(--muted);
      background:#fff;
      font-size:12px;
      line-height:1.5;
    }
.apixVCombo .toast {
      position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%);
      background: rgba(17,24,39,.92); color:#fff; padding: 10px 12px; border-radius: 12px;
      font-size:12px; opacity:0; pointer-events:none; transition:.2s opacity ease, .2s transform ease;
      box-shadow: var(--shadow);
    }
.apixVCombo .toast.show { opacity:1; transform: translateX(-50%) translateY(-4px); }
@media (max-width: 820px) {
      .grid2{ grid-template-columns: 1fr; }
.apixVCombo .grid3 { grid-template-columns: 1fr; }
.apixVCombo .row { grid-template-columns: 1fr; }
.apixVCombo .vTop{ grid-template-columns: 1fr; }
.apixVCombo .vBottom{ grid-template-columns: 1fr; }
.apixVCombo .cCard{ grid-template-columns: 1fr; }
.apixVCombo .previewGrid { grid-template-columns: 1fr; }
    }

.apixVCombo .btn.toggleBtn{
  display:flex; align-items:center; gap:10px;
}
.apixVCombo .btn.toggleBtn input{
  width:16px; height:16px;
  accent-color: var(--green);
}
.apixVCombo .chk{
  display:flex; align-items:center; gap:8px;
  font-size:12px; color: var(--muted);
  user-select:none;
}
.apixVCombo .chk input{
  width:16px; height:16px;
  accent-color: var(--green);
}

/* === Variasi: Foto (upload / kolase) === */
.vcomboVault{ display:none; }

.vImgBox{ display:flex; gap:10px; align-items:flex-start; }
.vImgThumb{
  width:56px; height:56px; border-radius:12px;
  background: linear-gradient(135deg, rgba(212,175,55,.25), rgba(3,172,14,.10));
  border:1px solid var(--line);
  box-shadow: 0 6px 16px rgba(17,24,39,.08);
  background-size:cover; background-position:center;
  flex:0 0 auto;
}
.vImgBtns{ display:flex; flex-direction:column; gap:6px; min-width:150px; }
.vImgMeta{ font-size:12px; color:var(--muted); line-height:1.2; }

.vImgSrcLabel{ font-size:12px; color:var(--muted); margin-bottom:6px; }
.vImgRadioRow{ display:flex; flex-wrap:wrap; gap:8px 12px; }
.vRadio{ display:flex; align-items:center; gap:6px; font-size:12px; color:var(--ink); user-select:none; }
.vRadio input{ width:14px; height:14px; accent-color: var(--green); }
.vImgAct{ display:flex; flex-direction:column; gap:10px; }
.vImgRow{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.vImgBtn{
  background:#0B1B3A;
  color:#D4AF37;
  border:1px solid #D4AF37;
  font-weight:800;
}
.vImgBtn:hover{ filter:brightness(1.06); }
.vImgBtn:active{ transform: translateY(1px); }
.vImgBtnGhost{
  background:transparent;
  color:#0B1B3A;
  border:1px solid rgba(11,27,58,.25);
  font-weight:700;
}
.vImgBtnGhost:hover{ background:rgba(11,27,58,.06); }
.vFileRow{ display:flex; align-items:center; gap:10px; }
.vFileName{ font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 240px; }
.vPickRow{ display:none; }

.pvMedia{ display:flex; gap:12px; align-items:center; margin-bottom:12px; }
.pvThumb{
  width:72px; height:72px; border-radius:16px;
  background: linear-gradient(135deg, rgba(212,175,55,.25), rgba(17,24,39,.06));
  border:1px solid var(--line);
  box-shadow: 0 10px 20px rgba(17,24,39,.10);
  background-size:cover; background-position:center;
  flex:0 0 auto;
}
.pvMediaText .pvTitle{ font-weight:800; }
.pvMediaText .pvSub{ font-size:12px; color:var(--muted); margin-top:2px; }

/* Modal picker kolase (khusus variasi) */
.vImgModalOverlay{
  position:fixed; inset:0; background:rgba(17,24,39,.55);
  display:none; align-items:center; justify-content:center;
  z-index: 9999;
}
.vImgModal{
  width:min(920px, 92vw);
  max-height: min(80vh, 820px);
  overflow:hidden;
  background:var(--card);
  border:1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
}
.vImgModalHead{
  display:flex; align-items:center; justify-content:space-between;
  padding: 14px 16px;
  background:#0B1B3A;
  color:#D4AF37;
  border-bottom:1px solid #D4AF37;
}
.vImgModalHead b{ font-size:14px; color:#D4AF37; }
.vImgModalHead .x{ cursor:pointer; border:0; background:transparent; font-size:18px; color:#D4AF37; }
.vImgModalBody{ padding: 12px 16px; overflow:auto; max-height: calc(80vh - 120px); }
.vImgModalSearch input{
  width:100%;
  padding: 10px 12px;
  border-radius: 14px;
  border:1px solid var(--line);
  outline:none;
}
.vImgGrid{
  margin-top: 12px;
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.vImgItem{
  border:1px solid var(--line);
  border-radius: 14px;
  overflow:hidden;
  background:#fff;
  cursor:pointer;
  transition: transform .08s ease, box-shadow .08s ease, border-color .08s ease;
}
.vImgItem:hover{ transform: translateY(-1px); box-shadow: 0 10px 18px rgba(17,24,39,.10); }
.vImgItem.active{ border-color: var(--green); box-shadow: 0 0 0 3px var(--greenSoft); }
.vImgItem .ph{ aspect-ratio: 1/1; background:#f3f4f6; background-size:cover; background-position:center; }
.vImgItem .cap{ padding: 8px 10px; font-size:12px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.vImgModalFoot{
  display:flex; justify-content:flex-end; gap:10px;
  padding: 12px 16px;
  border-top:1px solid var(--line);
  background: linear-gradient(180deg, rgba(255,255,255,.65), rgba(255,255,255,1));
}
`}
      </style>

      {/* Hidden fields untuk submit ke API */}
      <input id="vcombo_hidden_enabled" type="hidden" name="variasiEnabled" defaultValue="0" />
      <input id="vcombo_hidden_clear" type="hidden" name="variasiClear" defaultValue="1" />
      <input id="vcombo_hidden_json" type="hidden" name="variasiJson" defaultValue="" />
      <input id="vcombo_hidden_unit" type="hidden" name="product_unit" defaultValue="" />

      <div className="wrap">
        <div className="card">
          <div className="head">
            <div className="brand">
              <div className="logo">A</div>
              <div style={{ minWidth: 0 }}>
                <p className="title">apixinterior — Variasi &amp; Kombinasi (Lv1–Lv3)</p>
                <p className="sub">
                  Rule: Variasi harga opsional = replace harga produk. Unit override opsional. Kombinasi
                  (Lv1/Lv2/Lv3) = add-on.
                </p>
              </div>
            </div>

            <div className="btnRow">
              <label
                className="btn toggleBtn"
                title="Jika OFF: variasi tidak ikut tersimpan ke produk (data tetap aman di sini)."
              >
                <input id="vcomboEnabled" type="checkbox" />
                Aktifkan Variasi
              </label>

              <button className="btn" id="btnExport" type="button">
                Export JSON
              </button>
              <button className="btn" id="btnImport" type="button">
                Import JSON
              </button>
              <button className="btn danger" id="btnReset" type="button">
                Reset
              </button>
            </div>
          </div>

          <div className="steps" id="steps"></div>
          <div className="body" id="page"></div>
          <div className="vcomboVault" id="vcomboVault" aria-hidden="true"></div>
        </div>
      </div>

      <div className="toast" id="toast"></div>
    </div>
  );
});


export default function TambahProdukPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  // Variasi & Kombinasi: tambah produk baru harus reset (tanpa localStorage), edit produk persist per-produk.
  const variasiStorageKey = editId ? `apix_cms_vcombo_${editId}` : null;

  const [loading, setLoading] = useState(false);
  const { isDarkMode: darkMode } = useAdminTheme();


  // popup info (pengganti alert browser)
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const notify = useCallback((msg: string) => setInfoMsg(msg), []);


  // ===== Existing products cache (anti nama/slug nabrak) =====
  const existingRef = useRef<{ names: Set<string>; slugs: Set<string> }>({
    names: new Set(),
    slugs: new Set(),
  });
  const [existingReady, setExistingReady] = useState(false);

  // ===== Fast reroll (klik generate berkali-kali harus langsung beda) =====
  const genClickRef = useRef(0);
  const lastGeneratedNameRef = useRef<string>("");
  const sessionUsedRef = useRef<{ names: Set<string>; slugs: Set<string> }>({
    names: new Set(),
    slugs: new Set(),
  });

  useEffect(() => {
    let alive = true;

    async function loadExisting() {
      try {
        setExistingReady(false);
        const res = await fetch("/api/admin/admin_dashboard/admin_produk/daftar_produk", {
          cache: "no-store",
        });
        if (!res.ok) return;

        const json = await res.json().catch(() => null);
        const products = (json?.products ?? []) as Array<{ id: number; nama?: string; slug?: string }>;

        const editIdNum = isEditMode && editId ? Number(editId) : null;

        const names = new Set<string>();
        const slugs = new Set<string>();

        for (const p of products) {
          // kalau edit mode, jangan blokir produk yang sedang diedit
          if (editIdNum && p.id === editIdNum) continue;

          if (p.nama) names.add(normalizeText(p.nama));
          if (p.slug) slugs.add(String(p.slug).trim());
        }

        if (!alive) return;
        existingRef.current.names = names;
        existingRef.current.slugs = slugs;
      } catch {
        // silent: fallback ke AI biasa tanpa dedupe DB
      } finally {
        if (alive) setExistingReady(true);
      }
    }

    loadExisting();
    return () => {
      alive = false;
    };
  }, [isEditMode, editId]);


  // mode gambar
  const [fotoMode, setFotoMode] = useState<"upload" | "kolase">("upload");

  // promo (opsional)
  const [promoAktif, setPromoAktif] = useState(false);
  const [promoTipe, setPromoTipe] = useState<"persen" | "nominal">("persen");
  const [promoValue, setPromoValue] = useState<number>(0);

  // upload mode
  const [uploadMainFile, setUploadMainFile] = useState<File | null>(null);
  const [uploadMainPreview, setUploadMainPreview] = useState<string | null>(
    null
  );
  const [uploadGalleryFiles, setUploadGalleryFiles] = useState<File[]>([]);
  const [uploadGalleryPreview, setUploadGalleryPreview] = useState<string[]>(
    []
  );
  const [varMediaPreview, setVarMediaPreview] = useState<
    Array<{ varId: string | number; url: string; label: string; mode?: string }>
  >([]);


  // drag & drop (desktop) + manajemen preview upload (hindari memory leak blob url)

  // aktifkan fitur drag&drop hanya untuk desktop (pointer fine + hover + lebar layar)
  const [isDesktopDnd, setIsDesktopDnd] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(hover:hover) and (pointer:fine)");
    const compute = () => {
      setIsDesktopDnd(mq.matches && window.innerWidth >= 1024);
    };

    compute();

    const onResize = () => compute();

    // Safari lama masih pakai addListener/removeListener
    // @ts-ignore
    if (mq.addEventListener) mq.addEventListener("change", compute);
    // @ts-ignore
    else if (mq.addListener) mq.addListener(compute);

    window.addEventListener("resize", onResize);

    return () => {
      // @ts-ignore
      if (mq.removeEventListener) mq.removeEventListener("change", compute);
      // @ts-ignore
      else if (mq.removeListener) mq.removeListener(compute);

      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onVarMedia = (e: any) => {
      const det = e?.detail || {};
      if (det && det.enabled === false) {
        setVarMediaPreview([]);
        return;
      }

      const list = Array.isArray(det?.media) ? det.media : [];
      const normalized = list
        .map((m: any) => ({
          varId: m?.varId ?? m?.id ?? "",
          url: m?.url ?? "",
          label: m?.label ?? "",
          mode: m?.mode ?? "",
        }))
        .filter((m) => !!m.url);

      setVarMediaPreview(normalized);
    };

    window.addEventListener("apix:varMediaUpdate", onVarMedia as any);
    let reqTmo: number | undefined;
    try {
      const req = () => window.dispatchEvent(new CustomEvent("apix:requestVarMedia"));
      req();
      reqTmo = window.setTimeout(req, 400);
    } catch { }

    return () => {
      window.removeEventListener("apix:varMediaUpdate", onVarMedia as any);
      if (reqTmo) window.clearTimeout(reqTmo);
    };
  }, []);

  const [dragSrc, setDragSrc] = useState<
    | { from: "main" }
    | { from: "gallery"; index: number }
    | null
  >(null);
  const INTERNAL_DND_MIME = "application/x-apix-upload-media";

  const readInternalDnd = (e: DragEvent<any>) => {
    const raw = e.dataTransfer?.getData?.(INTERNAL_DND_MIME);
    if (!raw) return null as null | { from: "main" } | { from: "gallery"; index: number };
    try {
      return JSON.parse(raw) as { from: "main" } | { from: "gallery"; index: number };
    } catch {
      return null;
    }
  };

  const [isOverMain, setIsOverMain] = useState(false);
  const [overGalleryIdx, setOverGalleryIdx] = useState<number | null>(null);
  const [isOverGalleryArea, setIsOverGalleryArea] = useState(false);

  useEffect(() => {
    // kalau bukan desktop, pastikan state drag bersih
    if (!isDesktopDnd) {
      setDragSrc(null);
      setOverGalleryIdx(null);
      setIsOverMain(false);
      setIsOverGalleryArea(false);
    }
  }, [isDesktopDnd]);

  const MAX_GALLERY = 4;


  const revokeObjectURL = (url?: string | null) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const updateUploadMedia = (nextMain: File | null, nextGallery: File[]) => {
    const gallery = nextGallery.slice(0, MAX_GALLERY);

    setUploadMainFile(nextMain);
    setUploadGalleryFiles(gallery);

    setUploadMainPreview((prev) => {
      revokeObjectURL(prev);
      return nextMain ? URL.createObjectURL(nextMain) : null;
    });

    setUploadGalleryPreview((prev) => {
      prev.forEach(revokeObjectURL);
      return gallery.map((f) => URL.createObjectURL(f));
    });
  };

  const normalizeImageFiles = (files: File[]) =>
    files.filter((f) => f && f.type && f.type.startsWith("image/"));

  const fileSig = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
  const dedupeFiles = (files: File[]) => {
    const seen = new Set<string>();
    const out: File[] = [];
    for (const f of files) {
      const k = fileSig(f);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(f);
    }
    return out;
  };

  const addDroppedToUpload = (
    files: File[],
    target: "auto" | "main" | "gallery" = "auto"
  ) => {
    const imgs = normalizeImageFiles(files);
    if (imgs.length === 0) return;

    const clampGallery = (arr: File[]) => {
      const deduped = dedupeFiles(arr);
      if (deduped.length > MAX_GALLERY) {
        notify("Total galeri maksimal 4 foto (total 5 dengan foto utama).");
        return deduped.slice(0, MAX_GALLERY);
      }
      return deduped;
    };

    // target main: file pertama jadi main, sisanya (plus main lama) masuk galeri
    if (target === "main") {
      const newMain = imgs[0];
      const rest = imgs.slice(1);

      const nextGallery: File[] = [];
      if (uploadMainFile) nextGallery.push(uploadMainFile); // main lama jadi galeri
      nextGallery.push(...uploadGalleryFiles);
      nextGallery.push(...rest);

      updateUploadMedia(newMain, clampGallery(nextGallery));
      return;
    }

    // target gallery: semua masuk galeri
    if (target === "gallery") {
      updateUploadMedia(uploadMainFile, clampGallery([...uploadGalleryFiles, ...imgs]));
      return;
    }

    // auto: kalau belum ada main -> file pertama jadi main, sisanya ke galeri
    if (!uploadMainFile) {
      const newMain = imgs[0];
      const rest = imgs.slice(1);

      updateUploadMedia(newMain, clampGallery([...uploadGalleryFiles, ...rest]));
      return;
    }

    // sudah ada main -> semua masuk galeri
    updateUploadMedia(uploadMainFile, clampGallery([...uploadGalleryFiles, ...imgs]));
  };

  const handleDropOnMain = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDesktopDnd) return;
    setIsOverMain(false);

    if (fotoMode !== "upload") return;

    const internal = readInternalDnd(e);
    const src = internal ?? dragSrc;

    // Jika drag internal (reorder/swap), abaikan FileList bawaan browser (kadang ikut kebaca saat drag <img>)
    if (!internal) {
      const extFiles = normalizeImageFiles(Array.from(e.dataTransfer.files || []));
      if (extFiles.length > 0) {
        addDroppedToUpload(extFiles, "main");
        setDragSrc(null);
        return;
      }
    }

    if (!src) return;

    if (src.from === "gallery") {
      const idx = src.index;
      const g = [...uploadGalleryFiles];
      const picked = g[idx];
      if (!picked) return;

      if (uploadMainFile) g[idx] = uploadMainFile;
      else g.splice(idx, 1);

      updateUploadMedia(picked, g);
    }

    setDragSrc(null);
  };

  const handleDropOnGalleryIdx = (
    e: DragEvent<HTMLDivElement>,
    targetIdx: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setOverGalleryIdx(null);

    if (fotoMode !== "upload") return;

    const internal = readInternalDnd(e);
    const src = internal ?? dragSrc;

    if (!internal) {
      const extFiles = normalizeImageFiles(Array.from(e.dataTransfer.files || []));
      if (extFiles.length > 0) {
        addDroppedToUpload(extFiles, "gallery");
        setDragSrc(null);
        return;
      }
    }

    if (!src) return;

    // drag main -> swap dengan gallery target
    if (src.from === "main") {
      if (!uploadMainFile) return;
      const g = [...uploadGalleryFiles];
      const picked = g[targetIdx];
      if (!picked) return;

      g[targetIdx] = uploadMainFile;
      updateUploadMedia(picked, g);
      setDragSrc(null);
      return;
    }

    // drag gallery -> reorder dalam gallery
    if (src.from === "gallery") {
      const from = src.index;
      if (from === targetIdx) {
        setDragSrc(null);
        return;
      }
      const g = [...uploadGalleryFiles];
      const [moved] = g.splice(from, 1);
      g.splice(targetIdx, 0, moved);
      updateUploadMedia(uploadMainFile, g);
      setDragSrc(null);
      return;
    }
  };

  // kolase mode
  const [kolaseImages, setKolaseImages] = useState<GambarKolase[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // kolase picker untuk gambar VARIASI (single-pick, UI sama persis dengan media produk)
  const [varPickerOpen, setVarPickerOpen] = useState(false);
  const [varPickerVarId, setVarPickerVarId] = useState<string | null>(null);
  const [varPickerInitialIds, setVarPickerInitialIds] = useState<number[]>([]);

  useEffect(() => {
    const handler = (ev: any) => {
      const det = ev?.detail || {};
      setVarPickerVarId(det.varId ?? null);
      setVarPickerInitialIds(
        Array.isArray(det.initialSelectedIds) ? det.initialSelectedIds : []
      );
      setVarPickerOpen(true);
    };

    window.addEventListener("apix:openVarKolase", handler as any);
    return () => window.removeEventListener("apix:openVarKolase", handler as any);
  }, []);


  const formRef = useRef<HTMLFormElement | null>(null);

  /* ================= PREFILL DATA SAAT MODE EDIT ================= */
  useEffect(() => {
    if (!isEditMode || !editId) return;

    async function loadProduk() {
      try {
        const res = await fetch(
          `/api/admin/admin_dashboard/admin_produk/${editId}`
        );
        if (!res.ok) {
          console.error("Gagal load produk untuk edit:", res.status, res.statusText);
          notify(`Gagal memuat produk (Error ${res.status}). Pastikan ID benar.`);
          return;
        }
        const data = await res.json();
        const p = data.produk as any;
        const images = (data.images || []) as GambarKolase[];
        const variasi = Array.isArray(data.variasi) ? data.variasi : [];

        const form = formRef.current;
        if (!form || !p) return;

        const setValue = (name: string, value: any) => {
          const el = form.elements.namedItem(name) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null;
          if (el && value !== undefined && value !== null) {
            el.value = String(value);
          }
        };

        const setCheckbox = (name: string, checked: boolean) => {
          const el = form.elements.namedItem(name) as HTMLInputElement | null;
          if (el && el.type === "checkbox") {
            el.checked = !!checked;
          }
        };

        const setRadio = (name: string, value: string | null) => {
          if (!value) return;
          const group = form.elements.namedItem(name);
          if (!group) return;

          if ((group as any).length != null) {
            const list = group as any as RadioNodeList;
            // @ts-ignore
            for (const node of list) {
              if ((node as HTMLInputElement).value === value) {
                (node as HTMLInputElement).checked = true;
              }
            }
          } else {
            const el = group as HTMLInputElement;
            if (el.value === value) el.checked = true;
          }
        };

        // isi field
        setValue("nama", p.nama);
        setValue("slug", p.slug);
        setValue("kategori", p.kategori);
        setValue("subkategori", p.subkategori);

        setValue("harga", p.harga);
        setValue("hargaTipe", p.hargaTipe);
        // promo (opsional)
        setPromoAktif(!!p.promoAktif);
        if (p.promoTipe === "nominal" || p.promoTipe === "persen") {
          setPromoTipe(p.promoTipe);
        } else {
          setPromoTipe("persen");
        }
        setPromoValue(Number(p.promoValue ?? 0) || 0);
        setRadio("promoTipe", p.promoTipe);
        setValue("promoValue", p.promoValue);

        setValue("status", p.status);
        setValue("tipeOrder", p.tipeOrder);
        setValue("estimasiPengerjaan", p.estimasiPengerjaan);

        setValue("deskripsiSingkat", p.deskripsiSingkat);
        setValue("deskripsiLengkap", p.deskripsiLengkap);

        setValue("panjang", p.panjang);
        setValue("lebar", p.lebar);
        setValue("tinggi", p.tinggi);
        setValue("material", p.material);
        setValue("finishing", p.finishing);
        setValue("warna", p.warna);
        setValue("berat", p.berat);
        setValue("garansi", p.garansi);

        setCheckbox("isCustom", p.isCustom);
        setCheckbox("bisaCustomUkuran", p.bisaCustomUkuran);
        setRadio("jasaPasang", p.jasaPasang);

        setValue("catatanKhusus", p.catatanKhusus);
        setValue("tags", p.tags);
        setValue("metaTitle", p.metaTitle);
        setValue("metaDescription", p.metaDescription);
        setValue("videoUrl", p.videoUrl);

        // media: anggap disimpan di tabel gambar_upload
        if (images.length > 0) {
          setFotoMode("kolase");
          setKolaseImages(images.slice(0, 15));
        }

        // Prefill variasi: set hidden fields + localStorage untuk widget
        if (variasi.length > 0) {
          const payload = {
            enabled: true,
            titles: {
              varTitle: "Variasi",
              lv1Title: "Level 1",
              lv2Title: "Level 2",
              lv3Title: "Level 3",
            },
            product: {
              title: p.nama || "",
              unit: p.hargaTipe || "PCS",
              basePrice: String(p.harga || ""),
              status: "",
            },
            combo: { lv2Enabled: true, lv3Enabled: true },
            preview: { varId: null, lv1Id: null, lv2Id: null, lv3Id: null, qty: 1 },
            ui: { selLv1ByVar: {}, selLv2ByVarLv1: {} },
            optClip: null,
            variations: variasi.map((v: any, idx: number) => {
              if (v.options) {
                // gunakan opsi tersimpan jika ada
                return {
                  ...(v.options || {}),
                  id: String(v.id || `v_${idx}`),
                  label: v.options.label || v.nama || `Variasi ${idx + 1}`,
                };
              }

              // fallback minimal dari DB
              const basePromo = {
                active: !!v.promoAktif,
                type: v.promoTipe || "",
                value: v.promoValue || "",
              };

              const gallery =
                (v.galleryIds || []).map((gid: number) => ({ id: gid })) || [];

              const lv1 = (v.combos || [])
                .filter((c: any) => c.level === 1)
                .map((c: any) => ({
                  id: `c_${c.id}`,
                  label: `${c.nama || "Lv1"}: ${c.nilai || ""}`.trim(),
                  addPrice: c.tambahHarga ? String(c.tambahHarga) : "",
                  promo: {
                    active: !!c.promoAktif,
                    type: c.promoTipe || "",
                    value: c.promoValue || "",
                  },
                  lv2: [],
                  image: c.imageId ? { kolaseId: c.imageId, kolaseUrl: c.imageUrl || "" } : {},
                }));

              const lv2 = (v.combos || [])
                .filter((c: any) => c.level === 2)
                .map((c: any) => ({
                  id: `c_${c.id}`,
                  label: `${c.nama || "Lv2"}: ${c.nilai || ""}`.trim(),
                  addPrice: c.tambahHarga ? String(c.tambahHarga) : "",
                  promo: {
                    active: !!c.promoAktif,
                    type: c.promoTipe || "",
                    value: c.promoValue || "",
                  },
                  lv3: [],
                  image: c.imageId ? { kolaseId: c.imageId, kolaseUrl: c.imageUrl || "" } : {},
                }));

              const lv3 = (v.combos || [])
                .filter((c: any) => c.level === 3)
                .map((c: any) => ({
                  id: `c_${c.id}`,
                  label: `${c.nama || "Lv3"}: ${c.nilai || ""}`.trim(),
                  addPrice: c.tambahHarga ? String(c.tambahHarga) : "",
                  promo: {
                    active: !!c.promoAktif,
                    type: c.promoTipe || "",
                    value: c.promoValue || "",
                  },
                  image: c.imageId ? { kolaseId: c.imageId, kolaseUrl: c.imageUrl || "" } : {},
                }));

              return {
                id: String(v.id || `v_${idx}`),
                label: v.nama || `Variasi ${idx + 1}`,
                price: v.harga != null ? String(v.harga) : "",
                unitOverride: "",
                promo: basePromo,
                image: v.imageId ? { mode: "kolase", kolaseId: v.imageId, kolaseUrl: v.imageUrl || "" } : {},
                gallery,
                combos: {
                  lv1,
                  // lv2/lv3 fallback tidak punya hirarki -> letakkan sebagai lv1 tambahan jika ingin, atau biarkan terpisah
                  // Agar tidak hilang, gabungkan lv2/lv3 ke lv1 sebagai tambahan info
                  // Tetapi kita simpan terpisah di struktur berikut
                  // dev note: UI minimal tetap menampilkan lv1; lv2/lv3 kosong karena tidak ada parent relation di DB
                },
                lv2Flat: lv2,
                lv3Flat: lv3,
              };
            }),
          };

          // Set hidden fields untuk submit ulang
          const fEnabled = document.getElementById("vcombo_hidden_enabled") as HTMLInputElement | null;
          const fClear = document.getElementById("vcombo_hidden_clear") as HTMLInputElement | null;
          const fJson = document.getElementById("vcombo_hidden_json") as HTMLInputElement | null;
          const fUnit = document.getElementById("vcombo_hidden_unit") as HTMLInputElement | null;

          if (fEnabled) fEnabled.value = "1";
          if (fClear) fClear.value = "0";
          if (fJson) fJson.value = JSON.stringify(payload);
          if (fUnit) fUnit.value = p.hargaTipe || "";

          // Simpan ke localStorage supaya widget bisa render saat edit
          if (variasiStorageKey) {
            try {
              localStorage.setItem(variasiStorageKey, JSON.stringify(payload));
            } catch (e) {
              console.error("Gagal set localStorage variasi", e);
            }
          }
        }

      } catch (err) {
        console.error("Error prefill edit:", err);
      }
    }

    loadProduk();
  }, [isEditMode, editId]);

  /* ================= SUBMIT FORM (CREATE + EDIT, PAKAI FORMDATA) ================= */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const raw = new FormData(form);
    // Pastikan variasiJson terisi dari localStorage (widget) jika ada
    if (variasiStorageKey) {
      try {
        const saved = localStorage.getItem(variasiStorageKey);
        if (saved && saved.trim()) {
          raw.set("variasiJson", saved);
          raw.set("variasiEnabled", "1");
          raw.set("variasiClear", "0");
          // sinkronkan hidden input di form agar konsisten
          const hEnabled = form.querySelector<HTMLInputElement>("#vcombo_hidden_enabled");
          const hClear = form.querySelector<HTMLInputElement>("#vcombo_hidden_clear");
          const hJson = form.querySelector<HTMLInputElement>("#vcombo_hidden_json");
          const hUnit = form.querySelector<HTMLInputElement>("#vcombo_hidden_unit");
          if (hEnabled) hEnabled.value = "1";
          if (hClear) hClear.value = "0";
          if (hJson) hJson.value = saved;
          // unit juga harus di-restore jika ada di saved json (tapi saved json struktur variasi, unit ada di state.product.unit)
          if (hUnit && !hUnit.value) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed?.product?.unit) {
                hUnit.value = parsed.product.unit;
                // PENTING: update juga 'raw' FormData karena sudah terlanjur dibuat di atas
                raw.set("product_unit", parsed.product.unit);
              }
            } catch { }
          }
        }
      } catch { }
    }
    setLoading(true);



    // --- HELPER KOMPRESI CLIENT-SIDE (MOBILE OPTIMIZED) ---
    const compressImage = async (file: File): Promise<File> => {
      // Skip jika bukan gambar
      if (!file.type.startsWith("image/")) return file;
      // Skip jika size kecil (< 500KB - aggressive optimization)
      if (file.size < 500 * 1024) return file;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
          const img = new Image();
          img.src = event.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;

            // Standard Web Size (1600px is excellent for e-commerce zoom)
            const MAX_WIDTH = 1600;
            const MAX_HEIGHT = 1600;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) { resolve(file); return; }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (!blob) {
                resolve(file); // fallback
                return;
              }
              // Force JPEG for consistency & compression, even if input was PNG
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              // Log savings
              console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(0)}KB -> ${(newFile.size / 1024).toFixed(0)}KB`);
              resolve(newFile);
            }, "image/jpeg", 0.7); // Quality 70% (Sweet spot for mobile upload speed vs quality)
          };
          img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
      });
    };

    try {
      const formData = new FormData();

      // --- copy semua field non-file ---
      for (const [key, value] of raw.entries()) {
        if (key === "fotoUtamaUpload" || key === "galeriUpload") continue;
        formData.append(key, value);
      }

      // --- promo state (pakai state react, override input)
      formData.set("promoAktif", promoAktif ? "1" : "0");
      formData.set("promoTipe", promoAktif ? promoTipe : "");
      formData.set("promoValue", promoAktif ? String(promoValue || 0) : "");

      // DEBUG: Cek unit yang terkirim
      console.log("FINAL SUBMIT DATA:", {
        unit: formData.get("product_unit"),
        hargaTipe: formData.get("hargaTipe"),
        rawUnit: raw.get("product_unit"),
        hiddenUnit: (form.querySelector("#vcombo_hidden_unit") as HTMLInputElement)?.value
      });

      // --- normalisasi tags ---
      const rawTags = raw.get("tags");
      if (typeof rawTags === "string") {
        const cleaned = rawTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .join(", ");
        formData.set("tags", cleaned);
      }

      // --- info mode foto ---
      formData.set("fotoMode", fotoMode);

      if (fotoMode === "upload") {
        // === MODE UPLOAD BARU ===
        if (!uploadMainFile) {
          setLoading(false);
          notify("Mohon pilih foto utama terlebih dahulu.");
          return;
        }

        // Kompres foto utama
        try {
          notify("Memproses foto utama...");
          const processedMain = await compressImage(uploadMainFile);
          formData.append("fotoUtamaUpload", processedMain);
        } catch (e) {
          console.error("Gagal kompres foto utama:", e);
          formData.append("fotoUtamaUpload", uploadMainFile);
        }

        // galeri tambahan (maks 4)
        const maxGallery = 4;
        const rawGallery = uploadGalleryFiles.slice(0, maxGallery);

        if (rawGallery.length > 0) {
          notify(`Memproses ${rawGallery.length} foto galeri...`);
          for (const file of rawGallery) {
            try {
              const processed = await compressImage(file);
              formData.append("galeriUpload", processed);
            } catch (e) {
              console.error("Gagal kompres foto galeri:", e);
              formData.append("galeriUpload", file);
            }
          }
        }
      } else if (fotoMode === "kolase") {
        // === MODE PILIH DARI KOLASE ===
        if (kolaseImages.length === 0) {
          setLoading(false);
          notify("Pilih minimal 1 foto dari kolase.");
          return;
        }

        const ids = kolaseImages.map((img) => img.id);
        // index 0 = foto utama
        formData.set("kolaseMainId", String(ids[0]));
        // sisanya = galeri
        if (ids.length > 1) {
          formData.set("kolaseGalleryIds", ids.slice(1).join(","));
        }
      }


      // --- tentukan URL & method: create vs edit ---
      const url =
        isEditMode && editId
          ? `/api/admin/admin_dashboard/admin_produk/${editId}`
          : "/api/admin/admin_dashboard/admin_produk/tambah_produk";

      const method = isEditMode && editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        body: formData, // JANGAN pasang Content-Type manual
      });

      setLoading(false);

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch { /* ignore non-JSON response */ }

        const baseMsg = isEditMode
          ? "Gagal menyimpan perubahan produk"
          : "Gagal menyimpan produk baru";

        const detail = data?.error || `Status ${res.status} (${res.statusText})`;

        // Shorten html response if any
        const safeDetail = detail.length > 200 ? detail.substring(0, 200) + "..." : detail;

        notify(`${baseMsg}: ${safeDetail}`);
        console.error("[handleSubmit] Error:", res.status, res.statusText, text);
        return;
      }

      // sukses → balik ke daftar produk
      router.push("/admin/admin_dashboard/admin_produk/daftar_produk");
    } catch (err) {
      console.error(err);
      setLoading(false);
      notify(
        isEditMode
          ? "Terjadi kesalahan saat menyimpan perubahan."
          : "Terjadi kesalahan saat menyimpan produk. Coba lagi.",
      );
    }
  }


  function handleBack() {
    router.push("/admin/admin_dashboard/admin_produk");

  }

  const hasAnyPreview =
    (fotoMode === "upload" &&
      (uploadMainPreview || uploadGalleryPreview.length > 0)) ||
    (fotoMode === "kolase" && kolaseImages.length > 0) ||
    varMediaPreview.length > 0;

  function switchToUpload() {
    setFotoMode("upload");
  }

  function switchToKolase() {
    setFotoMode("kolase");
    // buka modal kolase biar list gambar langsung muncul (tanpa menghapus pilihan upload)
    setPickerOpen(true);
  }

  /* ================= AI AUTO GENERATE (offline: dari kumpulan kata) ================= */

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\u00C0-\u024f\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }


  // Dedupe untuk menghindari keyword stuffing (contoh: "Rak TV backdrop tv")
  function dedupeWordsTitle(input: string) {
    const raw = (input || "").replace(/\s+/g, " ").trim();
    if (!raw) return raw;

    const words = raw.split(" ");
    const seen = new Set<string>();
    const out: string[] = [];

    for (const w of words) {
      const key = w.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(w);
    }

    return out.join(" ").replace(/\s+/g, " ").trim();
  }

  // Dedupe slug untuk menghindari pengulangan frasa: "rak-tv-rak-tv-backdrop-tv"
  function dedupeSlug(slug: string) {
    const tokens = (slug || "").split("-").filter(Boolean);
    if (tokens.length === 0) return slug;

    // 1) hapus pengulangan frasa 2-token berurutan: A B A B -> A B
    const out: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (
        i >= 3 &&
        tokens[i] === tokens[i - 2] &&
        tokens[i - 1] === tokens[i - 3]
      ) {
        continue;
      }
      out.push(tokens[i]);
    }

    // 2) hapus token duplikat global (biar "tv" tidak muncul berkali-kali)
    const seen = new Set<string>();
    const out2: string[] = [];
    for (const t of out) {
      if (seen.has(t)) continue;
      seen.add(t);
      out2.push(t);
    }

    return out2.join("-");
  }


  function makeUniqueSlug(base: string, used: Set<string>) {
    const b = (base || "").trim();
    if (!b) return b;

    if (!used.has(b)) return b;

    for (let i = 2; i <= 50; i++) {
      const cand = `${b}-${i}`;
      if (!used.has(cand)) return cand;
    }
    // last resort
    return `${b}-${Math.floor(100 + Math.random() * 900)}`;
  }

  const STOPWORDS = new Set([
    "yang",
    "dan",
    "untuk",
    "dengan",
    "dari",
    "ke",
    "di",
    "pada",
    "ini",
    "itu",
    "atau",
    "serta",
  ]);

  const BANNED_TERMS = [

    "nordic",
    "scandinavian",
    "skandinavia",
    "industrial",
    "boho",
    "midcentury",
    "mid-century",
    "modern",
    "minimalis",
    "loft",
    "vintage",
    "retro",
    // brand internal (jaga-jaga)
    "apix",
  ];

  function stripBannedTerms(input: string) {
    let out = input;
    for (const t of BANNED_TERMS) {
      const re = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\\]{}]/g, "\\\\$&")}\\b`, "gi");
      out = out.replace(re, "");
    }
    return out.replace(/\s{2,}/g, " ").trim();
  }


  function dedupeConsecutiveWords(input: string) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let prev = "";
    for (const w of words) {
      const norm = w
        .toLowerCase()
        .replace(/^[^a-z0-9\u00C0-\u024f]+|[^a-z0-9\u00C0-\u024f]+$/g, "");
      if (norm && norm === prev) continue; // hindari "jasa jasa", "produk produk"
      out.push(w);
      prev = norm || prev;
    }
    return out.join(" ").replace(/\s{2,}/g, " ").trim();
  }

  function capWordFrequency(input: string, cap = 10) {
    const words = input.trim().split(/\s+/).filter(Boolean);
    const seen = new Map<string, number>();
    const out: string[] = [];
    for (const w of words) {
      const norm = w
        .toLowerCase()
        .replace(/^[^a-z0-9\u00C0-\u024f]+|[^a-z0-9\u00C0-\u024f]+$/g, "");
      if (!norm || norm.length < 2 || STOPWORDS.has(norm)) {
        out.push(w);
        continue;
      }
      const n = (seen.get(norm) || 0) + 1;
      seen.set(norm, n);
      if (n > cap) continue;
      out.push(w);
    }
    return out.join(" ").replace(/\s{2,}/g, " ").trim();
  }

  function escapeReg(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
  }

  function limitPhraseOccurrences(input: string, phrase: string, max = 5) {
    const p = phrase.trim();
    if (!p) return input;
    const words = p.split(/\s+/).filter(Boolean).map(escapeReg);
    if (!words.length) return input;
    const re = new RegExp(`\\b${words.join("\\s+")}\\b`, "gi");
    let count = 0;
    const out = input.replace(re, (m) => {
      count += 1;
      return count <= max ? m : "";
    });
    return out.replace(/\s{2,}/g, " ").trim();
  }

  function sanitizeSeoText(
    input: string,
    opts?: { cap?: number; primary?: string; primaryMax?: number }
  ) {
    // Disable aggressive stripping for "Lengkap" description implies we want full text
    // We only do minimal cleanup
    let out = stripBannedTerms(input).replace(/\s{2,}/g, " ").trim();
    out = dedupeConsecutiveWords(out);
    // Relaxed defaults:
    out = capWordFrequency(out, opts?.cap ?? 10);
    if (opts?.primary) out = limitPhraseOccurrences(out, opts.primary, opts.primaryMax ?? 5);
    return out.replace(/\s{2,}/g, " ").trim();
  }

  function slugFromNameTypeFirst(nama: string, subkategori: string) {
    const base = `${subkategori ? subkategori + " " : ""}${nama}`.trim();
    const raw = slugify(base);
    const parts = raw.split("-").filter(Boolean);
    const cleaned: string[] = [];
    for (const p of parts) {
      if (!STOPWORDS.has(p)) cleaned.push(p);
    }
    // batasi biar ringkas
    return cleaned.slice(0, 8).join("-");
  }


  function sanitizeSeoTextMultiline(
    input: string,
    opts?: { cap?: number; primary?: string; primaryMax?: number }
  ) {
    // preserve paragraph breaks; sanitize per paragraph
    return input
      .split(/\n{2,}/)
      .map((p) => sanitizeSeoText(p, opts))
      .join("\n\n")
      .trim();
  }

  function clampWords(sentence: string, min: number, max: number) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    if (words.length >= min && words.length <= max) return sentence.trim();
    if (words.length > max) return words.slice(0, max).join(" ").replace(/[.,;:!?]$/, "") + ".";
    // kalau kurang, biarkan (lebih aman daripada mengarang banyak)
    return sentence.trim();
  }

  function uniqueTags(items: string[], min = 8, max = 12) {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const it of items) {
      const t = it
        .toLowerCase()
        .trim()
        .replace(/\s{2,}/g, " ");
      if (!t) continue;
      if (seen.has(t)) continue;
      // hindari tag super panjang
      if (t.length > 35) continue;
      seen.add(t);
      out.push(t);
      if (out.length >= max) break;
    }
    // kalau masih kurang, isi dengan intent netral
    const fillers = [
      "penyimpanan rapi",
      "hemat ruang",
      "mudah dibersihkan",
      "opsi custom ukuran",
      "material kokoh",
      "finishing rapi",
      "warna natural",
      "tata ruang",
      "perawatan ringan",
      "ruang terbatas",
    ];
    for (const f of fillers) {
      if (out.length >= min) break;
      if (!seen.has(f)) {
        seen.add(f);
        out.push(f);
      }
    }
    return out.slice(0, max).join(", ");
  }

  function pickOne<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function pickVariant(pool: string[], used?: Set<string>) {
    const norm = (s: string) => normalizeText(s);
    const filtered = used ? pool.filter((p) => !used.has(norm(p))) : pool;
    const chosen = pickOne((filtered.length ? filtered : pool) as any as string[]);
    if (used) used.add(norm(chosen));
    return chosen;
  }


  type SeoProductBankItem = {
    ps: string;
    core: string;
    kategoriL1: string;
    kategoriL2: string;
    needCategory: string;
    baseUom: string;
    uomPhrase: string;
  };

  const SEO_BANK = {
    regions: ["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"],
    propertyTypes: ["Rumah Tapak"],
    rooms: ["Area Masuk / Foyer", "Carport / Garasi", "Dapur", "Gudang", "Kamar Mandi", "Kamar Tidur", "Laundry", "Ruang Keluarga", "Ruang Makan", "Ruang Tamu", "Tangga", "Teras / Balkon"],
    subAreas: ["Aksesori", "Area Shower", "Area TV", "Backsplash", "Decking", "Dinding Aksen", "Dinding Foyer", "Drainase", "Finishing Anak Tangga", "Headboard", "Instalasi Appliance", "Jalur Air", "Jendela & Gorden", "Kabinet Buffet", "Kabinet Laundry", "Kabinet Storage", "Kanopi", "Keramik", "Kitchen Set", "Lampu", "Lampu & Saklar", "Lampu Gantung", "Lampu Kabinet", "Lampu Tangga", "Lantai", "Meja Belajar/Work", "Meja Cuci", "Pagar/Teralis", "Pantry", "Pencahayaan", "Pintu Garasi", "Pintu Gudang", "Pintu Utama", "Railing", "Rak", "Rak & Storage", "Rak Garasi", "Rak Gudang", "Rak Sepatu", "Skirting", "Talang", "Top Table", "Vanity", "Ventilasi", "Wardrobe", "Waterproofing"],
    needCategories: ["Built-in & Storage", "Finishing", "Instalasi", "Item", "Maintenance", "Outdoor"],
    kategoriL1: ["Built-in", "Finishing", "Instalasi", "Item", "Jasa", "Outdoor"],
    kategoriL2: ["Carpentry", "Custom", "Linear", "Maintenance", "Per Titik", "Proteksi", "Surface"],
    uomPhrases: ["borongan", "per meter", "per m²", "per titik", "per unit"],
    products: [{ "ps": "Bongkar Pasang Kitchen Set", "core": "Kitchen Set", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Bongkar Pasang Lemari", "core": "Lemari", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Cermin Backlight LED", "core": "Cermin Backlight LED", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Cermin Custom Bevel", "core": "Cermin Custom Bevel", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Cut-out Kompor", "core": "Kompor", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Cut-out Sink", "core": "Sink", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Door Closer", "core": "Door Closer", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Gambar Kerja Interior", "core": "Gambar Kerja Interior", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Jasa Cat Dinding", "core": "Cat Dinding", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Jasa Cat Plafon", "core": "Cat Plafon", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Jasa Pasang Wallpaper", "core": "Wallpaper", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Jendela Aluminium Kaca", "core": "Jendela Aluminium Kaca", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Konsultasi Desain Interior", "core": "Konsultasi Desain Interior", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Nat Epoxy Keramik", "core": "Nat Epoxy Keramik", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pagar Panel Minimalis", "core": "Pagar Panel Minimalis", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Pasang Atap Transparan", "core": "Atap Transparan", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Bel Pintu", "core": "Bel Pintu", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Brush Seal Sliding Door", "core": "Brush Seal Sliding Door", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang CCTV Indoor", "core": "CCTV Indoor", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang CCTV Outdoor", "core": "CCTV Outdoor", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Cooker Hood", "core": "Cooker Hood", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Decking Outdoor", "core": "Decking Outdoor", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Dishwasher", "core": "Dishwasher", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Downlight", "core": "Downlight", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Exhaust Fan", "core": "Exhaust Fan", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Floor Drain", "core": "Floor Drain", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Jet Shower", "core": "Jet Shower", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Kanopi Alderon", "core": "Kanopi Alderon", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Kanopi Polikarbonat", "core": "Kanopi Polikarbonat", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Kawat Nyamuk Roll", "core": "Kawat Nyamuk Roll", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Keramik Dinding", "core": "Keramik Dinding", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Keramik Lantai", "core": "Keramik Lantai", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Kompor Tanam", "core": "Kompor Tanam", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Kran Dapur", "core": "Kran Dapur", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Kran Wastafel", "core": "Kran Wastafel", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang LED Strip + Profile", "core": "LED Strip + Profile", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Lampu Dinding", "core": "Lampu Dinding", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Lampu Gantung", "core": "Lampu Gantung", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Lantai Laminate", "core": "Lantai Laminate", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Lantai Parket", "core": "Lantai Parket", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Lantai Vinyl SPC", "core": "Lantai Vinyl SPC", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang List Plafon", "core": "List Plafon", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang List Transisi Lantai", "core": "List Transisi Lantai", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Moulding Dinding", "core": "Moulding Dinding", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Oven Tanam", "core": "Oven Tanam", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Panel Akustik Slat", "core": "Panel Akustik Slat", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Panel Dinding 3D", "core": "Panel Dinding 3D", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Panel Marble Sheet", "core": "Panel Marble Sheet", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Partisi Besi Kaca", "core": "Partisi Besi Kaca", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Partisi Gypsum", "core": "Partisi Gypsum", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Partisi Kisi Kayu", "core": "Partisi Kisi Kayu", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Paving Block", "core": "Paving Block", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Plafon Gypsum", "core": "Plafon Gypsum", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Plafon PVC", "core": "Plafon PVC", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Plint Lantai", "core": "Plint Lantai", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Rel Gorden", "core": "Rel Gorden", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Rod Gorden", "core": "Rod Gorden", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Saklar", "core": "Saklar", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Shower Set", "core": "Shower Set", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Skirting Kayu", "core": "Skirting Kayu", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Skirting PVC", "core": "Skirting PVC", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Smoke Detector", "core": "Smoke Detector", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Stop Kontak", "core": "Stop Kontak", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Talang Air", "core": "Talang Air", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pasang Tenda Gulung Teras", "core": "Tenda Gulung Teras", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Wall Panel Fluted", "core": "Wall Panel Fluted", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Wall Panel PVC", "core": "Wall Panel PVC", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Wall Panel WPC", "core": "Wall Panel WPC", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Pasang Water Heater", "core": "Water Heater", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Pasang Weatherstrip Pintu", "core": "Weatherstrip Pintu", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pemasangan Railing Tangga", "core": "Pemasangan Railing Tangga", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Backdrop TV Panel", "core": "Backdrop TV Panel", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Buffet", "core": "Kabinet Buffet", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Island", "core": "Kabinet Island", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Kompor", "core": "Kabinet Kompor", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Laundry", "core": "Kabinet Laundry", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Pantry", "core": "Kabinet Pantry", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Sink", "core": "Kabinet Sink", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kabinet Wastafel", "core": "Kabinet Wastafel", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kitchen Set Atas", "core": "Kitchen Set Atas", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kitchen Set Bawah", "core": "Kitchen Set Bawah", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Kitchen Set Full", "core": "Kitchen Set Full", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Lemari Tanam Sliding Door", "core": "Lemari Tanam Sliding Door", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Lemari Tanam Swing Door", "core": "Lemari Tanam Swing Door", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Meja Belajar Built-in", "core": "Meja Belajar Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Meja Kerja Built-in", "core": "Meja Kerja Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak Buku Built-in", "core": "Rak Buku Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak Dinding Built-in", "core": "Rak Dinding Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak Garasi", "core": "Rak Garasi", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak Gudang", "core": "Rak Gudang", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak Sepatu Built-in", "core": "Rak Sepatu Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Rak TV Built-in", "core": "Rak TV Built-in", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Storage Bawah Tangga", "core": "Storage Bawah Tangga", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pembuatan Walk-in Closet", "core": "Walk-in Closet", "kategoriL1": "Built-in", "kategoriL2": "Carpentry", "needCategory": "Built-in & Storage", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Pengecatan Pagar", "core": "Pengecatan Pagar", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Perakitan Furniture", "core": "Perakitan Furniture", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan Bocor Atap Ringan", "core": "Perbaikan Bocor Atap Ringan", "kategoriL1": "Outdoor", "kategoriL2": "Proteksi", "needCategory": "Outdoor", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Perbaikan Bocor Kran", "core": "Perbaikan Bocor Kran", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan Bocor Pipa Ringan", "core": "Perbaikan Bocor Pipa Ringan", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan Engsel & Laci", "core": "Perbaikan Engsel & Laci", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan Rel Sliding", "core": "Perbaikan Rel Sliding", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan Talang Bocor", "core": "Perbaikan Talang Bocor", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Perbaikan WC Mampet Ringan", "core": "Perbaikan WC Mampet Ringan", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Pintu Aluminium Kaca", "core": "Pintu Aluminium Kaca", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Pintu Garasi", "core": "Pintu Garasi", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Pintu HPL Custom", "core": "Pintu HPL Custom", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Pintu Kayu Solid Custom", "core": "Pintu Kayu Solid Custom", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Pintu Sliding Custom", "core": "Pintu Sliding Custom", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Re-Seal Silikon Kamar Mandi", "core": "Re-Seal Silikon Kamar Mandi", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Regrout Nat Keramik", "core": "Regrout Nat Keramik", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Roller Blind Custom", "core": "Roller Blind Custom", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Shower Screen Frameless", "core": "Shower Screen Frameless", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Skim Coat Dinding", "core": "Skim Coat Dinding", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Smart Lock Pintu", "core": "Smart Lock Pintu", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Survey Ukur Lokasi", "core": "Survey Ukur Lokasi", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Tambah Titik Lampu", "core": "Tambah Titik Lampu", "kategoriL1": "Instalasi", "kategoriL2": "Per Titik", "needCategory": "Instalasi", "baseUom": "POINT", "uomPhrase": "per titik" }, { "ps": "Tambal Retak Dinding", "core": "Tambal Retak Dinding", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Tarik Kabel + Ducting", "core": "Tarik Kabel + Ducting", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Tarik Pipa Air Jalur Pendek", "core": "Tarik Pipa Air Jalur Pendek", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Tarik Pipa Buangan Jalur Pendek", "core": "Tarik Pipa Buangan Jalur Pendek", "kategoriL1": "Instalasi", "kategoriL2": "Linear", "needCategory": "Instalasi", "baseUom": "M", "uomPhrase": "per meter" }, { "ps": "Teralis Jendela", "core": "Teralis Jendela", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }, { "ps": "Touch Up Cat", "core": "Touch Up Cat", "kategoriL1": "Jasa", "kategoriL2": "Maintenance", "needCategory": "Maintenance", "baseUom": "SERVICE", "uomPhrase": "borongan" }, { "ps": "Waterproofing Balkon", "core": "Waterproofing Balkon", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Waterproofing Dak", "core": "Waterproofing Dak", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Waterproofing Kamar Mandi", "core": "Waterproofing Kamar Mandi", "kategoriL1": "Finishing", "kategoriL2": "Surface", "needCategory": "Finishing", "baseUom": "M2", "uomPhrase": "per m²" }, { "ps": "Zebra Blind Custom", "core": "Zebra Blind Custom", "kategoriL1": "Item", "kategoriL2": "Custom", "needCategory": "Item", "baseUom": "PCS", "uomPhrase": "per unit" }],
  } as const;


  const NAME_SERIES = [
    "Aruna",
    "Nara",
    "Sora",
    "Kirana",
    "Raka",
    "Damar",
    "Liora",
    "Tara",
    "Aksa",
    "Rumi",
    "Svara",
    "Awan",
  ];

  function pickNameSuffix(sub: string) {
    const poolBySub: Record<string, string[]> = {
      "Lemari Pakaian": ["2 Pintu", "3 Pintu", "Pintu Geser", "Pintu Swing"],
      "Kabinet Dapur": ["Kitchen Set", "Pantry", "Top Table", "Bawah Sink"],
      "Rak TV": ["Low Console", "Dengan Backdrop", "Floating", "Storage"],
      "Meja Kerja": ["L-Shape", "Compact", "Dengan Laci", "Minimal"],
      "Rak Sepatu": ["2 Tingkat", "3 Tingkat", "Dengan Dudukan", "Slim"],
      "Meja Makan": ["4 Kursi", "6 Kursi", "Top Kayu", "Top Marmer"],
    };

    const pool = poolBySub[sub] ?? ["Custom", "Storage", "Compact", "Rapi"];
    return pickOne(pool);
  }



  let __lastGenKey = ""; // anti repetisi kombinasi saat klik berulang


  function normalizeText(s: string) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u00C0-\u024f\s-]/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }






  function pickSeoRoom(ctx: string) {
    const c = normalizeText(ctx);
    if (c.includes("dapur") || c.includes("kitchen") || c.includes("pantry")) return "Dapur";
    if (c.includes("kamar mandi") || c.includes("toilet")) return "Kamar Mandi";
    if (c.includes("kamar") || c.includes("bedroom")) return "Kamar Tidur";
    if (c.includes("ruang tamu") || c.includes("living")) return "Ruang Tamu";
    if (c.includes("kantor") || c.includes("office") || c.includes("kerja")) return "Ruang Kerja";
    if (c.includes("teras") || c.includes("balkon")) return "Teras / Balkon";
    if (c.includes("carport") || c.includes("garasi")) return "Carport / Garasi";
    return pickOne([...SEO_BANK.rooms]);
  }

  function pickSeoRegion(ctx: string) {
    const c = normalizeText(ctx);
    if (c.includes("jawa timur")) return "Jawa Timur";
    if (c.includes("jawa tengah")) return "Jawa Tengah";
    if (c.includes("jawa barat")) return "Jawa Barat";
    if (c.includes("jabodetabek") || c.includes("jakarta") || c.includes("bogor") || c.includes("depok") || c.includes("tangerang") || c.includes("bekasi")) return "Jabodetabek";
    // default paling relevan (sesuai bank)
    return "Jabodetabek";
  }

  function pickSeoProduct(ctx: string) {
    const c = normalizeText(ctx);

    const allowService =
      c.includes("pasang") ||
      c.includes("instal") ||
      c.includes("pemasangan") ||
      c.includes("tukang") ||
      c.includes("borongan") ||
      c.includes("jasa");

    const tokens = c.split(/\s+/).filter(Boolean);

    let best: SeoProductBankItem | null = null;
    let bestScore = 0;

    for (const p of SEO_BANK.products as any as SeoProductBankItem[]) {
      const ps = normalizeText(p.ps);
      const core = normalizeText(p.core);

      let score = 0;

      // match kuat
      if (core && c.includes(core)) score += 8;
      if (ps && c.includes(ps)) score += 6;

      // match token
      for (const t of tokens) {
        if (t.length < 4) continue;
        if (core.includes(t)) score += 1;
        if (ps.includes(t)) score += 1;
      }

      // prefer non-service kalau user ga minta pasang/jasa
      if (!allowService && (p.kategoriL1 === "Jasa" || p.kategoriL1 === "Instalasi")) score -= 6;

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    // kalau ga ada yang relevan, ambil random dari item/built-in biar judul tetap "produk"
    if (!best || bestScore <= 0) {
      const pool = (SEO_BANK.products as any as SeoProductBankItem[]).filter(
        (x) => x.kategoriL1 !== "Jasa" && x.kategoriL1 !== "Instalasi"
      );
      return pickOne(pool.length ? pool : (SEO_BANK.products as any as SeoProductBankItem[]));
    }

    return best;
  }

  function pickSeoPropertyType(ctx: string) {
    const c = normalizeText(ctx);
    const hit = SEO_BANK.propertyTypes.find((x) => c.includes(normalizeText(x)));
    return hit || pickOne(SEO_BANK.propertyTypes as any);
  }

  function pickSeoSubArea(ctx: string) {
    const c = normalizeText(ctx);
    const hit = SEO_BANK.subAreas.find((x) => c.includes(normalizeText(x)));
    // jika tidak ketemu di konteks, pilih random tapi jarang dipakai biar tidak ngawur
    return hit || "";
  }

  function pickSeoUomPhrase(ctx: string, core: string, subkategori?: string) {
    const c = normalizeText(ctx + " " + core + " " + (subkategori || ""));
    // heuristik ringan biar nyambung sama pola excel
    if (/(m2|m²|per m2|per m²)/.test(c) || /(panel|dinding|plafon|lantai|keramik|cat)/.test(c)) return "per m²";
    if (/(meter|per meter)/.test(c) || /(kabinet|lemari|rak|kitchen set|backdrop|pantry|wardrobe)/.test(c)) return "per meter";
    if (/(titik|per titik)/.test(c) || /(lampu|saklar|stop kontak|kompor)/.test(c)) return "per titik";
    // fallback: kosong (lebih aman daripada random)
    return "";
  }


  function clampLen(s: string, max: number) {
    const out = s.replace(/\s{2,}/g, " ").trim();
    if (out.length <= max) return out;
    return out.slice(0, max).replace(/\s+\S*$/, "").trim();
  }

  function buildNamaProdukFromBank(args: {
    core: string;
    room: string;
    subArea?: string;
    region?: string;
    propertyType?: string;
    uomPhrase?: string;
    needCategory?: string;
    isCustom: boolean;
  }) {
    const coreClean = stripBannedTerms(args.core || "").trim() || "Produk";
    const roomClean = stripBannedTerms(args.room || "").trim();
    const subClean = stripBannedTerms(args.subArea || "").trim();
    const regionClean = stripBannedTerms(args.region || "").trim();
    const propClean = stripBannedTerms(args.propertyType || "").trim();
    const uomClean = stripBannedTerms(args.uomPhrase || "").trim();

    // modifier ringan biar title tidak "plain", tapi tetap natural & tidak stuffing
    const stylePoolBase = ["Minimalis", "Modern", "Hemat Ruang", "Rapi", "Premium"];
    const stylePoolFinishing = ["Finishing Rapi", "Tahan Lama", "Mudah Dibersihkan"];

    const coreLower = normalizeText(coreClean);

    // heuristik: built-in / custom
    const hasBuiltin = coreLower.includes("built-in") || coreLower.includes("builtin");
    const style1 = args.isCustom ? "Custom" : pickOne(stylePoolBase);
    const style2 = hasBuiltin ? "Built-in" : "";

    const style = [style1, style2].filter(Boolean).join(" ").trim();

    const area = subClean ? `${roomClean} - ${subClean}` : roomClean;
    const withArea = area && !normalizeText(coreClean).includes(normalizeText(area))
      ? `${coreClean}${style ? ` ${style}` : ""} untuk ${area}`
      : `${coreClean}${style ? ` ${style}` : ""}`;

    // include region secara opsional (buat SEO lokal), tapi jangan kepanjangan
    const withRegion =
      regionClean && Math.random() < 0.65
        ? `${withArea} | ${regionClean}`
        : withArea;

    // uom di-append kalau masih muat dan relevan
    let title = withRegion;
    if (uomClean && title.length < 55 && !normalizeText(title).includes(normalizeText(uomClean))) {
      title = `${title} (${uomClean})`;
    }

    // property type kadang membantu long-tail, tapi jangan tiap kali
    if (propClean && title.length < 58 && Math.random() < 0.35) {
      title = `${title} ${propClean}`;
    }

    // fallback sedikit penambah konteks (sekali saja)
    if (title.length < 40) {
      title = `${title} | ${pickOne(stylePoolFinishing)}`;
    }

    title = clampLen(title.replace(/\s{2,}/g, " ").trim(), 70);
    title = dedupeWordsTitle(title);
    title = sanitizeSeoText(title, { cap: 1, primary: coreClean, primaryMax: 1 });
    return title;
  }

  function buildMetaTitleFromBank(args: {
    core: string;
    room: string;
    region: string;
    uomPhrase?: string;
  }) {
    const coreClean = stripBannedTerms(args.core || "").trim() || "Produk";
    const roomClean = stripBannedTerms(args.room || "").trim();
    const regionClean = stripBannedTerms(args.region || "").trim();

    // Variasi supaya tidak kaku & tidak keyword-stuffing
    const partsA = [
      `${coreClean}${roomClean ? " " + roomClean : ""}`,
      `${coreClean}${roomClean ? " untuk " + roomClean : ""}`,
      `${roomClean ? roomClean + " - " : ""}${coreClean}`,
    ].map((x) => x.replace(/\s{2,}/g, " ").trim());

    const sep = pickOne([" | ", " - ", " • "]);
    let title = `${pickOne(partsA)}${regionClean ? sep + regionClean : ""}`.replace(/\s{2,}/g, " ").trim();

    // 45–60 char target
    if (title.length < 45) {
      const extras = [
        args.uomPhrase ? `Harga ${args.uomPhrase}` : "",
        "Material & Ukuran",
        "Detail & Spesifikasi",
      ].filter(Boolean) as string[];
      title = `${title} | ${pickOne(extras)}`.replace(/\s{2,}/g, " ").trim();
    }

    title = clampLen(title, 60);
    if (title.length < 45) title = clampLen(`${title} | Finishing`, 60);

    // cap lebih ketat untuk title
    title = sanitizeSeoText(title, { cap: 1, primary: coreClean, primaryMax: 1 });
    return title;
  }
  function buildMetaDescFromBank(args: {
    core: string;
    room: string;
    region: string;
    material: string;
    finishing: string;
    isCustom: boolean;
  }) {
    const coreClean = stripBannedTerms(args.core || "").trim() || "Produk";
    const roomClean = stripBannedTerms(args.room || "").trim();
    const regionClean = stripBannedTerms(args.region || "").trim();
    const materialClean = stripBannedTerms(args.material || "").trim();
    const finishingClean = stripBannedTerms(args.finishing || "").trim();

    const s1Variants = [
      `${coreClean} untuk ${roomClean} di ${regionClean}. Material ${materialClean}, finishing ${finishingClean}.`,
      `${coreClean} untuk ${roomClean} tersedia di ${regionClean}. Material ${materialClean} dengan finishing ${finishingClean}.`,
      `${coreClean} untuk ${roomClean} — ${regionClean}. Material ${materialClean} + finishing ${finishingClean}.`,
    ];

    const s2VariantsCustom = [
      "Tersedia opsi custom dimensi & layout. Cek estimasi pengerjaan sebelum pesan.",
      "Bisa penyesuaian dimensi. Pastikan ukuran area sebelum order.",
      "Opsi custom tersedia. Bandingkan detail spesifikasi sebelum checkout.",
    ];

    const s2VariantsStd = [
      "Cek ukuran area dan detail spesifikasi sebelum pesan.",
      "Lihat detail ukuran dan opsi finishing sebelum order.",
      "Periksa detail produk sebelum checkout.",
    ];

    let out = `${pickOne(s1Variants)} ${pickOne(args.isCustom ? s2VariantsCustom : s2VariantsStd)}`
      .replace(/\s{2,}/g, " ")
      .trim();

    // 120–160 char target
    if (out.length > 160) out = clampLen(out, 160).replace(/[.,;:!?]$/, "") + ".";
    if (out.length < 120) out = `${out} Konsultasi kebutuhan ruang tersedia.`;

    return sanitizeSeoText(out, { cap: 2, primary: coreClean, primaryMax: 1 });
  }

  function handleAutoGenerate() {
    genClickRef.current += 1;
    const form = formRef.current;
    if (!form) return;

    const getInput = (name: string) =>
      form.elements.namedItem(name) as HTMLInputElement | null;
    const getSelect = (name: string) =>
      form.elements.namedItem(name) as HTMLSelectElement | null;

    const getValue = (name: string) => {
      const el = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      return el ? el.value : "";
    };

    const fire = (el: Element) => {
      try { el.dispatchEvent(new Event("input", { bubbles: true })); } catch { }
      try { el.dispatchEvent(new Event("change", { bubbles: true })); } catch { }
    };

    const setValue = (name: string, value: string) => {
      const el = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (el) {
        (el as any).value = value;
        fire(el);
      }
    };

    const setChecked = (name: string, checked: boolean) => {
      const el = getInput(name);
      if (el && el.type === "checkbox") {
        el.checked = checked;
        fire(el);
      }
    };

    const setRadio = (name: string, value: string) => {
      const els = form.elements.namedItem(name);
      if (!els) return;
      if ((els as any).length != null) {
        const group = els as any as RadioNodeList;
        group.forEach?.((node: any) => {
          if (node && node.value === value) {
            node.checked = true;
            try { fire(node); } catch { }
          }
        });
      } else {
        const el = els as HTMLInputElement;
        if (el.value === value) {
          el.checked = true;
          fire(el);
        }
      }
    };

    const randomInt = (min: number, max: number) =>
      Math.round(min + Math.random() * (max - min));

    const currentNama = stripBannedTerms(getValue("nama").trim());

    // Kalau nama sekarang adalah hasil generate sebelumnya, klik berikutnya harus reroll (anggap input nama kosong)
    const isLikelyAuto =
      normalizeText(currentNama) === normalizeText(lastGeneratedNameRef.current) ||
      /\bseri\b/i.test(currentNama);

    const rawNama = isLikelyAuto ? "" : currentNama;
    let kategori = stripBannedTerms(getValue("kategori").trim());
    let subkategori = stripBannedTerms(getValue("subkategori").trim());
    const rawTags = stripBannedTerms(getValue("tags").trim());

    const ctx = `${rawNama} ${kategori} ${subkategori} ${rawTags}`.toLowerCase();
    let seoRegion = pickSeoRegion(ctx);
    let seoRoom = pickSeoRoom(ctx);
    const seoPS = pickSeoProduct(`${ctx} ${subkategori} ${kategori}`);
    let seoCore = seoPS?.core || subkategori || rawNama || "Produk";
    let seoUomPhrase = seoPS?.uomPhrase || "";
    const seoNeedCategory = seoPS?.needCategory || "";
    const seoKatL1 = seoPS?.kategoriL1 || "";
    const seoKatL2 = seoPS?.kategoriL2 || "";

    const seoPropertyType = pickSeoPropertyType(ctx);
    const seoSubArea = pickSeoSubArea(ctx);
    seoUomPhrase = (seoPS?.uomPhrase || pickSeoUomPhrase(ctx, seoCore, subkategori) || "").trim();

    // anti repetisi: kalau klik berulang, usahakan kombinasi core/room/region tidak sama persis
    for (let i = 0; i < 6; i++) {
      const key = normalizeText(`${seoCore}|${seoRoom}|${seoRegion}|${seoUomPhrase}`);
      if (!key || key !== __lastGenKey) {
        __lastGenKey = key;
        break;
      }
      // re-roll room & core sedikit (lebih sering room biar tetap relevan)
      const altRoom = pickOne([...SEO_BANK.rooms]);
      if (altRoom) seoRoom = altRoom;
      const alt = pickOne(
        (SEO_BANK.products as any as SeoProductBankItem[]).filter(
          (x) => x.kategoriL1 !== "Jasa" && x.kategoriL1 !== "Instalasi"
        )
      );
      if (alt?.core) seoCore = alt.core;
      if (alt?.uomPhrase) seoUomPhrase = alt.uomPhrase;
    }



    function inferCategorySub(): { kategori: string; subkategori: string } {
      let kat = "Furniture Rumah";
      let sub = "";

      const isOffice =
        ctx.includes("kantor") || ctx.includes("office") || ctx.includes("kerja") || ctx.includes("work");

      if (isOffice) kat = "Furniture Kantor";

      const rules: Array<{ keys: string[]; sub: string }> = [
        { keys: ["rak tv", "lemari tv", "tv console", "tv"], sub: "Rak TV" },
        { keys: ["rak sepatu", "sepatu"], sub: "Rak Sepatu" },
        { keys: ["lemari pakaian", "wardrobe", "pakaian"], sub: "Lemari Pakaian" },
        { keys: ["meja kerja", "work desk", "office desk", "desk"], sub: "Meja Kerja" },
        { keys: ["meja makan", "dining"], sub: "Meja Makan" },
        { keys: ["kursi makan"], sub: "Kursi Makan" },
        { keys: ["kabinet dapur", "kitchen", "pantry", "dapur"], sub: "Kabinet Dapur" },
        { keys: ["tempat tidur", "bed", "headboard"], sub: "Tempat Tidur" },
        { keys: ["kasur", "mattress"], sub: "Kasur" },
        { keys: ["lampu", "lighting"], sub: "Lampu" },
        { keys: ["karpet", "rug"], sub: "Karpet" },
        { keys: ["gorden", "curtain"], sub: "Gorden" },
        { keys: ["cermin", "mirror"], sub: "Cermin" },
        { keys: ["organizer", "rak", "storage", "penyimpanan"], sub: "Organizer" },
      ];

      for (const r of rules) {
        if (r.keys.some((k) => ctx.includes(k))) {
          sub = r.sub;
          break;
        }
      }

      return { kategori: kat, subkategori: sub };
    }

    if (!kategori || !subkategori) {
      const guess = inferCategorySub();
      if (!kategori) {
        kategori = guess.kategori;
        setValue("kategori", kategori);
      }
      if (!subkategori && guess.subkategori) {
        subkategori = guess.subkategori;
        setValue("subkategori", subkategori);
      }
    }

    // ===== Nama produk (bank excel: fokus PRODUK yang dijual, bukan "jasa pasang") =====
    const customSignalsPreview =
      ctx.includes("custom") ||
      ctx.includes("built-in") ||
      ctx.includes("bikin") ||
      ctx.includes("pesanan") ||
      ctx.includes("ukur") ||
      ["Kabinet Dapur", "Lemari Pakaian", "Rak TV"].includes(subkategori);

    const isCustomPreview = customSignalsPreview;

    // core dari bank excel (contoh: "Kabinet Pantry" bukan "Jasa Pembuatan ...")
    seoCore = stripBannedTerms(seoCore).trim() || (subkategori || "Produk");

    let namaProduk = rawNama ? stripBannedTerms(rawNama) : "";

    if (!namaProduk) {
      namaProduk = buildNamaProdukFromBank({
        core: seoCore,
        room: seoRoom,
        subArea: seoSubArea,
        region: seoRegion,
        propertyType: seoPropertyType,
        uomPhrase: seoUomPhrase,
        needCategory: seoNeedCategory,
        isCustom: isCustomPreview,
      });
    } else {
      namaProduk = stripBannedTerms(namaProduk).replace(/\s{2,}/g, " ").trim();
      const coreNeed = subkategori || seoCore;
      if (coreNeed && !normalizeText(namaProduk).includes(normalizeText(coreNeed))) {
        namaProduk = `${coreNeed} ${namaProduk}`.trim();
      }
      namaProduk = clampLen(namaProduk, 70);
    }

    namaProduk = sanitizeSeoText(namaProduk, { cap: 2, primary: subkategori || seoCore, primaryMax: 1 });
    namaProduk = dedupeWordsTitle(namaProduk);
    setValue("nama", namaProduk);

    // slug type-first, ringkas (dedupe untuk hindari pengulangan token/frasa)
    const rawSlug = slugFromNameTypeFirst(namaProduk, subkategori || seoCore);
    setValue("slug", dedupeSlug(rawSlug));

    // ===== anti nama/slug nabrak di DB (biar AI lebih variatif & unik) ===== anti nama/slug nabrak (biar klik generate selalu beda, tanpa nunggu DB) =====
    {
      const dbNames = existingRef.current.names;
      const dbSlugs = existingRef.current.slugs;

      // gabungkan DB + sesi (jadi walau DB belum keload, tetap anti ulang)
      const usedNames = new Set<string>([...dbNames, ...sessionUsedRef.current.names]);
      const usedSlugs = new Set<string>([...dbSlugs, ...sessionUsedRef.current.slugs]);

      const baseType = (subkategori || seoCore || "Produk").trim();
      const seed = genClickRef.current;

      const pickBySeed = <T,>(arr: readonly T[], salt = 0): T =>
        arr[(seed + salt) % arr.length];

      // 1) Nama unik
      let finalNama = namaProduk;

      for (let attempt = 0; attempt < 18; attempt++) {
        const cand =
          attempt === 0
            ? namaProduk
            : `${namaProduk} Seri ${pickBySeed(NAME_SERIES, attempt)} ${pickNameSuffix(subkategori || "")}`.trim();

        const cleaned = clampLen(
          dedupeWordsTitle(
            sanitizeSeoText(cand, { cap: 2, primary: baseType, primaryMax: 1 })
          ),
          70
        );

        if (!usedNames.has(normalizeText(cleaned))) {
          finalNama = cleaned;
          break;
        }
      }

      setValue("nama", finalNama);
      namaProduk = finalNama;

      // 2) Slug unik
      const baseSlug = dedupeSlug(slugFromNameTypeFirst(finalNama, baseType));
      const finalSlug = makeUniqueSlug(baseSlug, usedSlugs);

      setValue("slug", finalSlug);

      // simpan di sesi biar klik berikutnya pasti beda
      sessionUsedRef.current.names.add(normalizeText(finalNama));
      sessionUsedRef.current.slugs.add(finalSlug);

      // kalau DB cache sudah siap, sekalian tambahkan (biar makin kuat)
      if (existingReady) {
        dbNames.add(normalizeText(finalNama));
        dbSlugs.add(finalSlug);
      }

      lastGeneratedNameRef.current = finalNama;
    }

    // ===== Ukuran: isi wajar kalau kosong; kalau ragu, biarkan kosong =====
    const p0 = parseFloat(getValue("panjang") || "0");
    const l0 = parseFloat(getValue("lebar") || "0");
    const t0 = parseFloat(getValue("tinggi") || "0");

    const needP = !(p0 > 0);
    const needL = !(l0 > 0);
    const needT = !(t0 > 0);

    let panjang = p0;
    let lebar = l0;
    let tinggi = t0;

    if (needP || needL || needT) {
      let pRange: [number, number] | null = null;
      let lRange: [number, number] | null = null;
      let tRange: [number, number] | null = null;

      switch (subkategori) {
        case "Kabinet Dapur":
          pRange = [200, 300]; lRange = [55, 65]; tRange = [210, 240]; break;
        case "Lemari Pakaian":
          pRange = [120, 200]; lRange = [55, 65]; tRange = [200, 240]; break;
        case "Rak TV":
          pRange = [120, 200]; lRange = [35, 55]; tRange = [45, 70]; break;
        case "Meja Kerja":
          pRange = [100, 160]; lRange = [55, 70]; tRange = [72, 76]; break;
        case "Meja Makan":
          pRange = [140, 220]; lRange = [75, 100]; tRange = [72, 76]; break;
        case "Kursi Makan":
          pRange = [45, 55]; lRange = [45, 55]; tRange = [85, 100]; break;
        case "Rak Sepatu":
          pRange = [80, 120]; lRange = [30, 40]; tRange = [90, 130]; break;
        case "Tempat Tidur":
          pRange = [160, 200]; lRange = [200, 220]; tRange = [30, 45]; break;
        case "Kasur":
          pRange = [160, 200]; lRange = [200, 220]; tRange = [20, 30]; break;
        case "Organizer":
          pRange = [60, 120]; lRange = [30, 45]; tRange = [60, 140]; break;
        default:
          // jika tidak jelas, jangan isi otomatis biar tidak ngarang
          pRange = null; lRange = null; tRange = null;
      }

      if (pRange && needP) panjang = randomInt(pRange[0], pRange[1]);
      if (lRange && needL) lebar = randomInt(lRange[0], lRange[1]);
      if (tRange && needT) tinggi = randomInt(tRange[0], tRange[1]);

      if (pRange && needP) setValue("panjang", String(panjang));
      if (lRange && needL) setValue("lebar", String(lebar));
      if (tRange && needT) setValue("tinggi", String(tinggi));
    }

    // ===== Material/Finishing/Warna defaults sesuai aturan =====
    let material = stripBannedTerms(getValue("material").trim());
    let finishing = stripBannedTerms(getValue("finishing").trim());
    let warna = stripBannedTerms(getValue("warna").trim());

    if (!material) material = "Multipleks 18mm + rangka kayu";
    if (!finishing) finishing = "HPL + edging rapi";
    if (!warna) warna = "Kayu Natural";

    setValue("material", material);
    setValue("finishing", finishing);
    setValue("warna", warna);

    // ===== Custom & tipe order =====
    const isCustom = isCustomPreview;


    setChecked("isCustom", isCustom);
    setChecked("bisaCustomUkuran", isCustom);

    // jasaPasang default tidak kecuali ada sinyal pemasangan.
    // Untuk kategori built-in (kabinet/kitchen set) atau produk yang umumnya dihitung per ukuran, paksa "ya".
    const pasangSignals =
      ctx.includes("pasang") ||
      ctx.includes("instal") ||
      ctx.includes("pemasangan") ||
      ctx.includes("install");

    // Barang wajib pasang (built-in / custom ukuran)
    const wajibPasangSubkategori = new Set<string>([
      "Kabinet Dapur",
      "Lemari Pakaian",
      "Kitchen Set",
      "Backdrop TV",
      "Panel Dinding",
      "Partisi",
      "Plafon",
    ]);

    const builtInSignals =
      ctx.includes("built-in") ||
      ctx.includes("builtin") ||
      ctx.includes("tanam") ||
      ctx.includes("tempel") ||
      ctx.includes("custom") ||
      ctx.includes("custom ukuran") ||
      ctx.includes("ukur") ||
      ctx.includes("survey") ||
      ctx.includes("onsite") ||
      ctx.includes("on site") ||
      ctx.includes("kitchen set") ||
      ctx.includes("kitchenset") ||
      ctx.includes("kabinet") ||
      ctx.includes("wardrobe") ||
      ctx.includes("walk in") ||
      ctx.includes("backdrop") ||
      ctx.includes("tv wall") ||
      ctx.includes("panel") ||
      ctx.includes("dinding") ||
      ctx.includes("wall panel") ||
      ctx.includes("wallpanel") ||
      ctx.includes("partisi") ||
      ctx.includes("sekat") ||
      ctx.includes("kisi") ||
      ctx.includes("slat") ||
      ctx.includes("plafon") ||
      ctx.includes("gypsum") ||
      ctx.includes("countertop") ||
      ctx.includes("meja top") ||
      ctx.includes("top table");

    const wajibPasang =
      pasangSignals || builtInSignals || wajibPasangSubkategori.has(subkategori);

    setRadio("jasaPasang", wajibPasang ? "ya" : "tidak");

    const hargaTipeSelect = getSelect("hargaTipe");
    const tipeOrderSelect = getSelect("tipeOrder");

    if (hargaTipeSelect) hargaTipeSelect.value = isCustom ? "mulai_dari" : "fixed";
    if (tipeOrderSelect) tipeOrderSelect.value = isCustom ? "pre_order" : "ready_stock";

    // ===== Estimasi pengerjaan =====
    let estimasi = "7–14 hari kerja";
    if (subkategori === "Kabinet Dapur" || subkategori === "Lemari Pakaian") estimasi = "21–30 hari kerja";
    else if (subkategori === "Rak TV") estimasi = "14–21 hari kerja";
    else if (["Lampu", "Karpet", "Gorden", "Cermin"].includes(subkategori)) estimasi = "7–10 hari kerja";

    setValue("estimasiPengerjaan", estimasi);

    // ===== Harga (realistis: satuan / per meter / per m²) =====
    let pricingNote = "";
    const hargaNow = parseFloat(getValue("harga") || "0");

    const formatIDR = (n: number) => n.toLocaleString("id-ID");
    const roundIDR = (n: number) => Math.round(n / 10_000) * 10_000;
    const calcRange = (min: number, max: number) =>
      roundIDR(min + Math.random() * (max - min));

    // Logika Unit & Rate
    type PriceMode = "unit" | "per_meter" | "per_m2";
    let mode: PriceMode = "unit";
    let rateMin = 0;
    let rateMax = 0;
    let qty = 1;

    const pCm = panjang > 0 ? panjang : 0;
    const tCm = tinggi > 0 ? tinggi : 0;

    const isBackdrop =
      ctx.includes("backdrop") ||
      ctx.includes("panel") ||
      ctx.includes("dinding") ||
      ctx.includes("wall") ||
      ctx.includes("tv wall");

    // Tentukan mode berdasarkan kategori
    if (subkategori === "Kabinet Dapur") {
      mode = "per_meter";
      seoUomPhrase = "per meter";
      rateMin = 2_100_000; rateMax = 3_200_000;
      const p = pCm > 0 ? pCm : 240;
      qty = Math.max(p / 100, 1.8);
    } else if (subkategori === "Lemari Pakaian") {
      mode = "per_m2";
      seoUomPhrase = "per m²";
      rateMin = 2_000_000; rateMax = 3_300_000;
      const p = pCm > 0 ? pCm : 160;
      const t = tCm > 0 ? tCm : 220;
      qty = Math.max((p / 100) * (t / 100), 2.0);
    } else if (subkategori === "Rak TV" && isBackdrop) {
      mode = "per_m2";
      seoUomPhrase = "per m²";
      rateMin = 1_800_000; rateMax = 3_000_000;
      const p = pCm > 0 ? pCm : 180;
      const t = tCm > 0 ? tCm : 240;
      qty = Math.max((p / 100) * (t / 100), 2.0);
    } else {
      // Default / Unit
      mode = "unit";
      seoUomPhrase = "per unit";
      const unitRanges: Record<string, [number, number]> = {
        "Rak TV": [1_500_000, 5_500_000],
        "Rak Sepatu": [900_000, 2_800_000],
        "Meja Kerja": [1_300_000, 4_500_000],
        "Meja Makan": [1_800_000, 6_500_000],
        "Kursi Makan": [450_000, 1_800_000],
        "Tempat Tidur": [2_000_000, 7_500_000],
        "Kasur": [1_800_000, 8_500_000],
        "Lampu": [200_000, 1_500_000],
        "Karpet": [350_000, 2_500_000],
        "Gorden": [450_000, 3_000_000],
        "Cermin": [300_000, 1_800_000],
        "Organizer": [350_000, 1_600_000],
      };
      const r = unitRanges[subkategori] ?? [1_000_000, 3_500_000];
      rateMin = r[0]; rateMax = r[1];
    }

    // Jika harga sudah diisi user -> GUNAKAN!
    let rate = 0;
    if (hargaNow > 0) {
      rate = hargaNow;
      // Coba tebak mode dari inputan user?
      // Agak susah kalau cuma harga. Kita asumsikan mode ikut kategori saja.
      // Tapi kita tidak overwrite harga.
    } else {
      rate = calcRange(rateMin, rateMax);
    }

    if (mode !== "unit") {
      setRadio("jasaPasang", "ya");
    }

    if (mode === "unit") {
      // UNIT: harga = rate
      // Hanya set value jika belum ada harga atau user minta generate ulang (biasanya user kosongin dulu)
      // Tapi logic di sini "hargaNow > 0" sudah menangani preserve.
      setValue("harga", String(rate));
    } else {
      // METER/M2: rate = harga dasar
      setValue("harga", String(rate));

      const total = roundIDR(rate * qty);
      const unitLabel = mode === "per_meter" ? "meter lari" : "m²";
      const qtyLabel = mode === "per_meter"
        ? `${qty.toFixed(2).replace(/\.00$/, "")} m`
        : `${qty.toFixed(2).replace(/\.00$/, "")} m²`;

      pricingNote = `Harga mulai Rp ${formatIDR(rate)}/${unitLabel}. Est total ${qtyLabel}: Rp ${formatIDR(total)}.`;

      if (hargaTipeSelect) hargaTipeSelect.value = "mulai_dari";
      if (tipeOrderSelect) tipeOrderSelect.value = "pre_order";
      setChecked("isCustom", true);
      setChecked("bisaCustomUkuran", true);
    }

    // ===== Deskripsi singkat 14–22 kata, sebut tipe 1x =====
    const typeLabel = (subkategori && subkategori.trim())
      ? subkategori.trim()
      : (seoCore && String(seoCore).trim())
        ? String(seoCore).trim()
        : "Produk";

    const konteksRuang =
      ctx.includes("dapur")
        ? "di area dapur"
        : ctx.includes("kantor") || ctx.includes("kerja")
          ? "di ruang kerja"
          : ctx.includes("kamar")
            ? "di kamar"
            : "";

    const benefit = pickOne([
      isCustom ? "menyesuaikan kebutuhan ruang" : "membantu penataan lebih teratur",
      "memberi ruang simpan praktis",
      "membuat area terasa lebih lega",
      "mempermudah penataan barang harian",
    ]);

    const ending = pickOne([
      "dengan hasil rapi dan mudah dirawat.",
      "dengan tampilan yang lebih tertata.",
      "tanpa membuat ruangan terlihat penuh.",
      "dengan susunan yang efisien.",
    ]);

    const singkatRaw = `${typeLabel} yang ${benefit}${konteksRuang ? " " + konteksRuang : ""} ${ending}`;
    const singkat = clampWords(stripBannedTerms(singkatRaw), 14, 22);
    setValue("deskripsiSingkat", sanitizeSeoText(singkat, { cap: 10, primary: typeLabel, primaryMax: 3 }));

    const materialClean = stripBannedTerms(material);
    const finishingClean = stripBannedTerms(finishing);

    // ===== Deskripsi lengkap (Rich E-commerce Style & SEO Optimized) =====
    const intro = pickOne([
      `Ingin tampilan ${seoRoom} yang lebih mewah dan terorganisir? ${namaProduk} adalah jawabannya. Didesain khusus untuk memenuhi kebutuhan ${subkategori || "interior"} modern, produk ini menawarkan keseimbangan sempurna antara estetika premium dan fungsionalitas praktis.`,
      `Ciptakan suasana ${seoRoom} impian Anda dengan ${namaProduk}. Perabot bergaya modern yang tidak hanya mempercantik ruangan, tetapi juga memberikan solusi penyimpanan cerdas untuk gaya hidup masa kini.`,
      `Hadirkan nuansa elegan di ruang ${seoRoom} Anda bersama ${namaProduk}. Pilihan terbaik bagi Anda yang mengutamakan kualitas material ${materialClean} dan detail finishing presisi.`,
    ]);

    const benefit1 = isCustom
      ? "Fleksibilitas Tanpa Batas: Ukuran dan kompartemen dalam bisa disesuaikan sepenuhnya dengan kebutuhan spesifik ruangan Anda."
      : "Desain Space-Saving: Dirancang cerdas untuk memaksimalkan kapasitas penyimpanan tanpa memakan banyak tempat.";

    const benefit2 = materialClean.toLowerCase().includes("multipleks")
      ? "Ketahanan Ekstra: Dibuat dari Multipleks berkualitas tinggi (bukan partikel board), menjamin konstruksi yang padat, anti-melengkung, dan tahan lama."
      : "Struktur Kokoh: Dibangun dengan teknik konstruksi presisi untuk stabilitas maksimal penggunaan jangka panjang.";

    const benefit3 = finishingClean.toLowerCase().includes("hpl")
      ? "Finishing HPL Premium: Permukaan halus, tahan goresan ringan, serta sangat mudah dibersihkan dari debu atau noda."
      : "Finishing Halus & Rapi: Lapisan akhir yang memikat mata dan melindungi material dasar dari kelembapan.";

    const whyLoveIt = `<strong>Keunggulan Utama:</strong><ul><li>${benefit1}</li><li>${benefit2}</li><li>${benefit3}</li><li>Estetika Modern: Desain minimalis yang timeless, mudah dipadukan dengan berbagai tema interior mulai dari scandinavian hingga industrial.</li></ul>`;

    const dimStr = (panjang > 0 && lebar > 0 && tinggi > 0)
      ? `P ${panjang} cm x L ${lebar} cm x T ${tinggi} cm`
      : "Menyesuaikan permintaan (Custom)";

    const featureStr = isCustom
      ? "Bisa custom ukuran & layout dalam"
      : "Siap pakai, perakitan mudah";

    const specs = `<strong>Spesifikasi Detail:</strong><ul><li>Dimensi: ${dimStr}</li><li>Material Utama: ${materialClean} (Tahan terhadap rayap & jamur)</li><li>Finishing: ${finishingClean}</li><li>Warna: ${warna}</li><li>Fitur Unggulan: ${featureStr}</li></ul>`;

    const care = `<strong>Perawatan Mudah:</strong><p>Cukup lap dengan kain microfiber sedikit lembap untuk membersihkan debu sehari-hari. Hindari penggunaan cairan kimia keras atau sikat kasar agar kualitas finishing tetap terjaga sempurna.</p>`;

    const installNote = getValue("jasaPasang") === "ya"
      ? "Kami menyediakan opsi pengiriman aman dan tim ahli siap membantu instalasi rapi di lokasi Anda."
      : "Produk dikirim dalam kondisi aman. Instruksi perakitan disertakan (jika produk knock-down).";

    const shipping = `<strong>Pengiriman & Instalasi:</strong><p>${installNote} Estimasi pengerjaan ${estimasi} (tergantung antrian produksi).</p>`;

    const cta = isCustom
      ? "Wujudkan interior impian Anda sekarang! Hubungi kami untuk konsultasi desain dan penawaran spesial."
      : "Stok terbatas! Segera amankan produk ini untuk mempercantik ruangan Anda. Klik tombol beli sekarang!";

    const fullDesc = [intro, whyLoveIt, specs, care, shipping, cta]
      .join("\n\n");

    setValue("deskripsiLengkap", fullDesc.trim());

    // ===== Catatan khusus + SEO Notes (Admin) =====
    const noteParts: string[] = [];
    if (pricingNote) noteParts.push(pricingNote);

    const seoNote =
      `SEO(Admin): core=${seoCore}; room=${seoRoom || "-"}; region=${seoRegion || "-"}` +
      (seoUomPhrase ? `; uom=${seoUomPhrase}.` : ".");
    noteParts.push(seoNote);

    noteParts.push("Warna bisa berbeda; toleransi ukuran; harga menyesuaikan spesifikasi.");

    let note = noteParts.join(" ").replace(/\s{2,}/g, " ").trim();
    note = sanitizeSeoText(note, { cap: 10, primary: seoCore, primaryMax: 3 });
    note = clampLen(note, 185); // catatanKhusus varchar(191), sisakan buffer
    setValue("catatanKhusus", note);
    // ===== Tags 8–12 unik =====
    const roomTags = [
      ctx.includes("dapur") ? "dapur" : "",
      ctx.includes("kamar") ? "kamar" : "",
      (ctx.includes("kantor") || ctx.includes("kerja")) ? "ruang kerja" : "",
    ].filter(Boolean);

    const tagCandidates = [
      seoCore,
      seoRoom,
      seoNeedCategory,
      seoKatL1,
      seoKatL2,
      seoRegion,
      seoUomPhrase,
      typeLabel,
      ...roomTags,
      (subkategori || "").toLowerCase().match(/lemari|kabinet|rak|laci|penyimpanan|box|storage/) ? "penyimpanan" : "fungsional",
      isCustom ? "custom ukuran" : "ready stock",
      material.toLowerCase().includes("multipleks") ? "multipleks" : "kayu",
      finishing.toLowerCase().includes("hpl") ? "hpl" : "finishing rapi",
      warna.toLowerCase().includes("natural") ? "warna natural" : warna.toLowerCase(),
      "tips penataan",
      "perawatan mudah",
    ].filter(Boolean);

    setValue("tags", uniqueTags(tagCandidates as string[], 8, 12));

    // ===== Meta title (pakai bank excel) =====
    const metaTitle = buildMetaTitleFromBank({
      core: seoCore,
      room: seoRoom,
      region: seoRegion,
      uomPhrase: seoUomPhrase,
    });

    setValue("metaTitle", metaTitle);

    // ===== Meta description (pakai bank excel) =====
    const metaDesc = buildMetaDescFromBank({
      core: seoCore,
      room: seoRoom,
      region: seoRegion,
      material,
      finishing,
      isCustom,
    });

    setValue("metaDescription", metaDesc);

    // ===== Status =====
    const statusSelect = getSelect("status");
    if (statusSelect && !statusSelect.value) statusSelect.value = "aktif";

    // Trigger DOM events so Variasi/Kombinasi widget can auto-sync (programmatic value set won't emit input/change)
    const __fire = (name: string, type: "input" | "change") => {
      const el = form.elements.namedItem(name) as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      if (!el) return;
      try {
        el.dispatchEvent(new Event(type, { bubbles: true }));
      } catch { }
    };
    __fire("nama", "input");
    __fire("harga", "input");
    __fire("status", "change");



    notify("Field terisi otomatis. Silakan cek ulang sebelum simpan.");
  }

  /* ================= DROP ALL (KOSONGKAN SEMUA FORM) ================= */
  function handleDropAll() {
    const form = formRef.current;
    if (!form) return;

    // kosongkan semua input/select/textarea ke default HTML (umumnya kosong)
    form.reset();

    // reset state yang controlled / punya preview
    setPromoAktif(false);

    setFotoMode("upload");
    updateUploadMedia(null, []);
    setDragSrc(null);
    setIsOverMain(false);
    setOverGalleryIdx(null);
    setIsOverGalleryArea(false);
    setKolaseImages([]);
    setPickerOpen(false);

    notify("Semua field sudah dikosongkan.");
  }

  /* ================= RENDER ================= */
  /* ================= RENDER ================= */
  return (
    <>
      <header className={layoutStyles.mainHeader}>
        <h1
          className={`${layoutStyles.pageTitle} ${styles.pageTitleOutside}`}
        >
          {isEditMode ? "Edit Produk" : "Tambah Produk"}
        </h1>
        <p
          className={`${layoutStyles.pageSubtitle} ${styles.pageSubtitleOutside}`}
        >
          Lengkapi detail produk yang akan ditampilkan ke pengunjung website.
        </p>
      </header>

      <div
        className={`${styles.cardArea} ${darkMode ? styles.cardAreaNight : styles.cardAreaDay
          }`}
      >
        <div className={styles.cardWrapper}>
          <div className={`${styles.card} ${darkMode ? styles.cardNight : styles.cardDay} ${styles.noCardHover}`}>

            {/* AI TOOLBAR */}
            <div className={styles.aiToolbar}>
              <button type="button" className={styles.aiButton} onClick={handleAutoGenerate}>
                ⚡ AI Auto Generate
              </button>
              <button type="button" className={styles.aiButton} onClick={handleDropAll}>
                🗑️ Drop All
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className={`${styles.form} ${darkMode ? styles.formNight : styles.formDay}`}>

              <div className={styles.enterpriseGrid}>
                {/* === LEFT COLUMN (MAIN CONTENT) === */}
                <div className={styles.mainColumn}>

                  {/* SECTION 1: BASIC INFO */}
                  <div className={styles.enterpriseSection}>
                    <h2 className={styles.sectionTitle}>Informasi Produk</h2>
                    <div className={styles.field}>
                      <label className={styles.label}>Nama Produk *</label>
                      <input type="text" name="nama" required className={styles.input} placeholder="Nama produk..." />
                    </div>
                    <div className={styles.field} style={{ marginTop: 16 }}>
                      <label className={styles.label}>Deskripsi Singkat (SEO) *</label>
                      <textarea name="deskripsiSingkat" required className={styles.textarea} rows={3} placeholder="Maks 160 karakter..." />
                      <p className={styles.hint}>Maksimal 180 karakter. Muncul di preview Google/Link.</p>
                    </div>
                    <div className={styles.field} style={{ marginTop: 16 }}>
                      <label className={styles.label}>Deskripsi Lengkap</label>
                      <textarea name="deskripsiLengkap" className={styles.textarea} rows={10} placeholder="Spesifikasi, fitur, keunggulan..." />
                    </div>
                  </div>

                  {/* SECTION 2: MEDIA */}
                  <div className={styles.enterpriseSection}>
                    <h2 className={styles.sectionTitle}>Media & Visual</h2>

                    {/* Preview Box */}
                    {hasAnyPreview && (
                      <div className={styles.previewBox}>
                        {/* ... (Existing preview logic reused here) ... */}
                        {fotoMode === "upload" && uploadMainPreview && (
                          <div className={styles.previewItem}>
                            <button type="button" className={styles.previewRemove} onClick={() => updateUploadMedia(null, uploadGalleryFiles)}>×</button>
                            <img src={uploadMainPreview} className={styles.previewImage} alt="Main" />
                            <div className={styles.previewMeta}><div className={styles.previewTitle}>Foto Utama</div></div>
                          </div>
                        )}
                        {fotoMode === "upload" && uploadGalleryPreview.map((url, idx) => (
                          <div key={idx} className={styles.previewItem}>
                            <button type="button" className={styles.previewRemove} onClick={() => {
                              const next = uploadGalleryFiles.filter((_, i) => i !== idx);
                              updateUploadMedia(uploadMainFile, next);
                            }}>×</button>
                            <img src={url} className={styles.previewImage} alt={`Galeri ${idx}`} />
                            <div className={styles.previewMeta}><div className={styles.previewTitle}>Galeri {idx + 1}</div></div>
                          </div>
                        ))}
                        {fotoMode === "kolase" && kolaseImages.map((img, idx) => (
                          <div key={img.id} className={styles.previewItem}>
                            <button type="button" className={styles.previewRemove} onClick={() => setKolaseImages(prev => prev.filter(p => p.id !== img.id))}>×</button>
                            <img src={img.url} className={styles.previewImage} alt={img.title || ''} />
                            <div className={styles.previewMeta}>
                              <div className={styles.previewTitle}>{idx === 0 ? "Foto Utama" : `Galeri ${idx}`}</div>
                            </div>
                          </div>
                        ))}
                        {varMediaPreview.map((img, idx) => (
                          <div key={`${img.varId}-${idx}`} className={styles.previewItem}>
                            <img src={img.url} className={styles.previewImage} alt="Variasi" />
                            <div className={styles.previewMeta}>
                              <div className={styles.previewTitle}>Variasi</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className={styles.field}>
                      <span className={styles.label}>Sumber Foto</span>
                      <div className={styles.radioRow}>
                        <label className={styles.radioLabel}>
                          <input type="radio" className={styles.radio} checked={fotoMode === "upload"} onChange={switchToUpload} /> Upload Baru
                        </label>
                        <label className={styles.radioLabel}>
                          <input type="radio" className={styles.radio} checked={fotoMode === "kolase"} onChange={switchToKolase} /> Pilih dari Kolase
                        </label>
                      </div>
                      {fotoMode === "kolase" && (
                        <button type="button" onClick={() => setPickerOpen(true)} className={styles.smallBtn} style={{ marginTop: 8 }}>
                          📂 Buka Galeri Kolase
                        </button>
                      )}
                      {fotoMode === "upload" && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div className={styles.field}>
                            <label className={styles.label}>Foto Utama *</label>
                            <input type="file" name="fotoUtamaUpload" accept="image/*" className={styles.inputFile}
                              required={!isEditMode && !uploadMainFile}
                              onChange={(e) => updateUploadMedia(e.target.files?.[0] ?? null, uploadGalleryFiles)}
                            />
                          </div>
                          <div className={styles.field}>
                            <label className={styles.label}>Galeri Tambahan (Maks 4)</label>
                            <input type="file" name="galeriUpload" accept="image/*" multiple className={styles.inputFile}
                              onChange={(e) => {
                                const newFiles = Array.from(e.target.files || []);
                                const combined = [...uploadGalleryFiles, ...newFiles].slice(0, 4);
                                updateUploadMedia(uploadMainFile, combined);
                                e.currentTarget.value = "";
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>


                  </div>

                  {/* SECTION 3: VARIASI (WIDGET LAMA) */}
                  <div className={styles.enterpriseSection}>
                    <h2 className={styles.sectionTitle}>Varian & Opsi</h2>
                    {/* Widget variasi yang sudah ada */}
                    <VariasiKombinasiWidget notify={notify} storageKey={variasiStorageKey || null} />

                    <div className={styles.fieldRow} style={{ marginTop: 20 }}>
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="isCustom" className={styles.checkbox} value="1" />
                          Produk Custom (Pre-order)?
                        </label>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.checkboxLabel}>
                          <input type="checkbox" name="bisaCustomUkuran" className={styles.checkbox} value="1" />
                          Boleh Request Ukuran?
                        </label>
                      </div>
                    </div>
                  </div>

                </div>

                {/* === RIGHT COLUMN (SIDEBAR) === */}
                <div className={styles.sidebarColumn}>

                  {/* PANEL 1: PUBLISH & STATUS */}
                  <div className={styles.enterprisePanel}>
                    <h3 className={styles.panelTitle}>Status & Kategori</h3>

                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Kategori</label>
                      <input type="text" name="kategori" className={styles.input} placeholder="Furniture..." />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Subkategori</label>
                      <input type="text" name="subkategori" className={styles.input} placeholder="Lemari..." />
                    </div>
                  </div>

                  {/* PANEL 2: PRICING */}
                  <div className={styles.enterprisePanel}>
                    <h3 className={styles.panelTitle}>Harga</h3>
                    <div className={styles.field}>
                      <label className={styles.label}>Harga Dasar (Rp)</label>
                      <input type="number" name="harga" className={styles.input} placeholder="0" />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Tipe Harga</label>
                      <select name="hargaTipe" className={styles.select}>
                        <option value="fixed">Harga Pas (Fixed)</option>
                        <option value="mulai_dari">Mulai Dari (Starting)</option>
                        <option value="unit">Per Unit</option>
                      </select>
                    </div>

                    {/* PROMO MINI */}
                    <div style={{ marginTop: 16, borderTop: '1px solid #333', paddingTop: 12 }}>
                      <label className={styles.checkboxLabel} style={{ marginBottom: 8 }}>
                        <input type="checkbox" name="promoAktif" checked={promoAktif} onChange={e => setPromoAktif(e.target.checked)} className={styles.checkbox} value="1" />
                        Ada Diskon?
                      </label>
                      {promoAktif && (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select className={styles.select} value={promoTipe} onChange={e => setPromoTipe(e.target.value as any)} style={{ flex: 1 }}>
                            <option value="persen">%</option>
                            <option value="nominal">Rp</option>
                          </select>
                          <input type="number" name="promoValue" value={promoValue} onChange={e => setPromoValue(Number(e.target.value))} className={styles.input} placeholder="Nilai" style={{ flex: 2 }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PANEL 3: SPESIFIKASI */}
                  <div className={styles.enterprisePanel}>
                    <h3 className={styles.panelTitle}>Spesifikasi Fisik</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div className={styles.field}><label className={styles.label}>P (cm)</label><input type="number" name="panjang" className={styles.input} /></div>
                      <div className={styles.field}><label className={styles.label}>L (cm)</label><input type="number" name="lebar" className={styles.input} /></div>
                      <div className={styles.field}><label className={styles.label}>T (cm)</label><input type="number" name="tinggi" className={styles.input} /></div>
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Berat (gram)</label>
                      <input type="number" name="berat" className={styles.input} placeholder="1000" />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Material</label>
                      <input type="text" name="material" className={styles.input} />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Finishing</label>
                      <input type="text" name="finishing" className={styles.input} />
                    </div>
                  </div>

                  {/* PANEL 4: SEO & TAGS */}
                  <div className={styles.enterprisePanel}>
                    <h3 className={styles.panelTitle}>SEO & Meta</h3>
                    <div className={styles.field}>
                      <label className={styles.label}>Slug URL</label>
                      <input type="text" name="slug" className={styles.input} placeholder="auto-generate" />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Tags (Keyword)</label>
                      <textarea name="tags" className={styles.textarea} rows={3} placeholder="minimalis, modern..." />
                    </div>
                    <div className={styles.field} style={{ marginTop: 12 }}>
                      <label className={styles.label}>Catatan Admin</label>
                      <textarea name="catatanKhusus" className={styles.textarea} rows={2} />
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className={styles.actionPanel}>
                    <button type="submit" disabled={loading} className={`${styles.submitBtn} ${darkMode ? styles.submitBtnDark : styles.submitBtnLight}`}>
                      {loading ? "Menyimpan..." : (isEditMode ? "Simpan Perubahan" : "Terbitkan Produk")}
                    </button>
                    <button type="button" onClick={handleBack} className={styles.cancelBtn}>
                      Batal
                    </button>
                  </div>

                </div>
              </div>

              {/* HIDDEN INPUTS FOR WIDGET SYNC */}
              <input type="hidden" id="vcombo_hidden_enabled" name="variasiEnabled" />
              <input type="hidden" id="vcombo_hidden_json" name="variasiJson" />
              <input type="hidden" id="vcombo_hidden_clear" name="variasiClear" />
              <input type="hidden" id="vcombo_hidden_unit" name="product_unit" />

            </form>
          </div>
        </div>



        <ImagePickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          initialSelectedIds={kolaseImages.map((img) => img.id)}
          onNotify={notify}
          onSelect={(imgs) => {
            setKolaseImages(imgs.slice(0, 15));
          }}
        />

        <ImagePickerModal
          open={varPickerOpen}
          maxPick={1}
          onClose={() => {
            setVarPickerOpen(false);
            setVarPickerVarId(null);
            setVarPickerInitialIds([]);
          }}
          initialSelectedIds={varPickerInitialIds}
          onNotify={notify}
          onSelect={(imgs) => {
            const picked = imgs?.[0];
            const varId = varPickerVarId;
            setVarPickerOpen(false);
            setVarPickerVarId(null);
            setVarPickerInitialIds([]);

            if (!picked || !varId) return;

            window.dispatchEvent(
              new CustomEvent("apix:varKolasePicked", {
                detail: { varId, imageId: picked.id, url: picked.url },
              })
            );
          }}
        />


        {
          infoMsg && (
            <div
              className={styles.modalOverlay}
              onMouseDown={() => setInfoMsg(null)}
            >
              <div
                className={styles.modal}
                style={{ width: "min(560px, 100%)", maxHeight: "none" }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className={styles.modalHeader}>
                  <div className={styles.modalTitle}>Info</div>
                  <button
                    type="button"
                    className={styles.modalCloseBtn}
                    onClick={() => setInfoMsg(null)}
                    aria-label="Tutup"
                  >
                    ×
                  </button>
                </div>

                <div className={styles.modalBody}>
                  {infoMsg}
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.modalConfirm}
                    onClick={() => setInfoMsg(null)}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </>
  );
}
