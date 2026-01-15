"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import styles from "./kategori_produk.module.css";
import baseStyles from "../daftar_produk/daftar_produk.module.css";
import { useAdminTheme } from "../../AdminThemeContext";

type Product = {
  id: number;
  nama: string;
  harga: number;
  promoAktif?: boolean | null;
  promoTipe?: "persen" | "nominal" | null;
  promoValue?: number | null;
  mainImageUrl: string | null;
  kategori?: string | null;
  subkategori?: string | null;
  deskripsiSingkat?: string | null;
  tags?: string | null;
};

type Category = {
  id: number;
  nama: string;
  slug?: string | null;
  urutan: number;
  isPromo?: boolean | null;
  items: Product[];
};

type SortOption = "default" | "name-asc" | "price-asc" | "price-desc" | "discount-desc";


function formatRupiah(n: number) {
  return `Rp ${Math.round(Number(n || 0)).toLocaleString("id-ID")}`;
}

function computeHargaSetelahPromo(p: {
  harga: number;
  promoAktif?: boolean | null;
  promoTipe?: "persen" | "nominal" | null;
  promoValue?: number | null;
}) {
  // hitung pakai integer (hindari kasus minus 1 rupiah)
  const hargaAsli = Math.round(Number(p.harga ?? 0) || 0);

  const aktif = !!p.promoAktif;
  const tipe = p.promoTipe ?? null;
  const valueRaw = Math.round(Number(p.promoValue ?? 0) || 0);

  if (!aktif || !tipe || valueRaw <= 0 || hargaAsli <= 0) {
    return { hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
  }

  let diskon = 0;
  if (tipe === "persen") {
    const pct = Math.max(0, Math.min(100, valueRaw));
    diskon = Math.round((pct / 100) * hargaAsli);
  } else {
    diskon = Math.max(0, Math.min(hargaAsli, valueRaw));
  }

  const hargaFinal = Math.max(0, hargaAsli - diskon);

  if (diskon <= 0 || hargaFinal >= hargaAsli) {
    return { hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };
  }

  const promoLabel =
    tipe === "persen"
      ? `-${Math.max(0, Math.min(100, valueRaw))}%`
      : `-Rp ${diskon.toLocaleString("id-ID")}`;

  return { hargaAsli, hargaFinal, isPromo: true, promoLabel };
}

export default function KategoriProdukPage() {
  const router = useRouter();

  // UI global (sidebar + dark mode)
  const { isDarkMode: isDark } = useAdminTheme();

  // data kategori
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Guard untuk DnD: render DragDropContext hanya setelah client mount (hindari error removeChild di hydration)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);


  // form tambah kategori
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);


  // DROP ALL KATEGORI
  const [droppingAllCategories, setDroppingAllCategories] = useState(false);
  const [dropAllConfirmOpen, setDropAllConfirmOpen] = useState(false);
  const [dropAllConfirmCount, setDropAllConfirmCount] = useState(0);
  const [dropAllConfirmBusy, setDropAllConfirmBusy] = useState(false);
  const [deleteOneConfirmOpen, setDeleteOneConfirmOpen] = useState(false);
  const [deleteOneId, setDeleteOneId] = useState<number | null>(null);
  const [deleteOneName, setDeleteOneName] = useState<string>("");
  const [deleteOneBusy, setDeleteOneBusy] = useState(false);

  const [toastOpen, setToastOpen] = useState(false);
  const [toastKind, setToastKind] = useState<"success" | "error" | "info" | "warn">("info");
  const [toastTitle, setToastTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [dropAllProgress, setDropAllProgress] = useState<string>("");

  // MODAL GENERATE KATEGORI OTOMATIS (AI)
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genTargetCount, setGenTargetCount] = useState<string>("10");
  const [genAspects, setGenAspects] = useState("");
  const [genLangMode, setGenLangMode] = useState<"ID" | "EN">("ID");
  const [genBusy, setGenBusy] = useState(false);
  const [genProgress, setGenProgress] = useState<string>("");
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{
    created: Array<{ id: number; nama: string; produkCount: number }>;
    failed: Array<{ nama: string; error: string }>;
    reviewCount: number;
    unassignedCount: number;
    catatan?: string | null;
  } | null>(null);

  // Helper: fetch JSON with better error details (biar nggak cuma "Failed to fetch")
  async function fetchJson<T = any>(
    url: string,
    init: RequestInit | undefined,
    label: string
  ): Promise<T> {
    try {
      const res = await fetch(url, init);
      const text = await res.text();

      let data: any = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const serverMsg =
          (data && (data.error || data.message)) ||
          (text ? text.slice(0, 200) : "");
        throw new Error(`${label} gagal (${res.status})${serverMsg ? `: ${serverMsg}` : ""}`);
      }

      // kalau tidak ada body, return null
      return (data ?? (text as any)) as T;
    } catch (err: any) {
      // Network error biasanya masuk sini (TypeError: Failed to fetch)
      const msg = err?.message ?? String(err);
      throw new Error(`${label} (${url}): ${msg}`);
    }
  }

  function showToast(
    kind: "success" | "error" | "info" | "warn",
    title: string,
    message: string,
    ms = 2600
  ) {
    setToastKind(kind);
    setToastTitle(title);
    setToastMessage(message);
    setToastOpen(true);
    if (ms > 0) {
      window.setTimeout(() => setToastOpen(false), ms);
    }
  }


  // MODAL KELOLA PRODUK
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<Category | null>(null);
  const [promoToggleBusyId, setPromoToggleBusyId] = useState<number | null>(null);

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterSubkategori, setFilterSubkategori] = useState<string>("all");
  const [promoOnly, setPromoOnly] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("default");
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // produk terpilih untuk kategori yang sedang di-edit
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(
    new Set()
  );
  const [selectedOrder, setSelectedOrder] = useState<number[]>([]);
  const [savingCategoryProducts, setSavingCategoryProducts] = useState(false);

  // ===== FETCH KATEGORI =====
  async function fetchCategories() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_produk/kategori_produk",
        { cache: "no-store" }
      );

      if (!res.ok) {
        let msg = "Gagal memuat kategori.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const data = await res.json();
      setCategories(data.categories ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // ===== TAMBAH KATEGORI =====
  async function handleCreateCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      showToast("info", "Info", "Nama kategori kosong.");
      return;
    }

    try {
      setCreatingCategory(true);

      const res = await fetch(
        "/api/admin/admin_dashboard/admin_produk/kategori_produk",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama: name }),
        }
      );

      if (!res.ok) {
        let msg = "Gagal membuat kategori.";
        try {
          const data = await res.json();
          if (data?.error) msg = data.error;
        } catch {
          // ignore
        }
        throw new Error(msg);
      }

      const data = await res.json();

      setNewCategoryName("");
      await fetchCategories();

      // Auto-open modal for the new category to add products immediately
      const created = data?.kategori || data?.created;
      if (created) {
        // Construct a Category object with empty items (since it's new)
        const newCatObj: Category = {
          id: created.id,
          nama: created.nama,
          urutan: created.urutan,
          isPromo: created.isPromo,
          items: []
        };
        openModal(newCatObj);
        showToast("success", "Sukses", `Kategori "${created.nama}" dibuat. Silakan pilih produk.`);
      }

    } catch (err: any) {
      showToast("info", "Info", String(err?.message ?? "Gagal membuat kategori."));
    } finally {
      setCreatingCategory(false);
    }
  }

  // ===== HAPUS KATEGORI =====
  async function handleDeleteCategory(id: number) {
    const cat = categories.find((c) => c.id === id);
    setDeleteOneId(id);
    setDeleteOneName(cat?.nama ?? "Kategori");
    setDeleteOneConfirmOpen(true);
  }

  async function doDeleteOneCategory() {
    if (!deleteOneId) return;

    try {
      setDeleteOneBusy(true);

      const res = await fetch(
        `/api/admin/admin_dashboard/admin_produk/kategori_produk/${deleteOneId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        let msg = "Gagal menghapus kategori.";
        try {
          const j = await res.json();
          msg = j?.error ?? j?.message ?? msg;
        } catch { }
        showToast("error", "Gagal", msg);
        return;
      }

      showToast("success", "Sukses", `Kategori "${deleteOneName}" berhasil dihapus.`);
      setDeleteOneConfirmOpen(false);
      setDeleteOneId(null);
      setDeleteOneName("");
      await fetchCategories();
    } catch (err: any) {
      showToast("error", "Gagal", err?.message ?? "Gagal menghapus kategori.");
    } finally {
      setDeleteOneBusy(false);
    }
  }


  // ===== TOGGLE KATEGORI PROMO =====
  async function toggleCategoryPromo(cat: Category) {
    if (promoToggleBusyId) return;

    try {
      setPromoToggleBusyId(cat.id);

      const res = await fetch(
        `/api/admin/admin_dashboard/admin_produk/kategori_produk/${cat.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isPromo: !cat.isPromo }),
        }
      );

      if (!res.ok) {
        let msg = "Gagal mengubah status promo kategori.";
        try {
          const j = await res.json();
          msg = j?.error ?? j?.message ?? msg;
        } catch { }
        throw new Error(msg);
      }

      await fetchCategories();
    } catch (err: any) {
      showToast("info", "Info", String(err?.message ?? "Gagal mengubah status promo kategori."));
    } finally {
      setPromoToggleBusyId(null);
    }
  }

  // ===== DROP ALL KATEGORI =====
  async function handleDropAllCategories() {
    if (droppingAllCategories) return;

    if (categories.length === 0) {
      showToast("info", "Info", "Tidak ada kategori untuk dihapus.");
      return;
    }

    // custom modal confirm (estetik, bukan confirm() bawaan browser)
    setDropAllConfirmCount(categories.length);
    setDropAllConfirmOpen(true);
    return;
  }

  async function doDropAllCategories() {
    try {
      setDropAllConfirmBusy(true);
      setDroppingAllCategories(true);
      setDropAllProgress(`Menghapus semua kategori... (0/${categories.length})`);

      const failures: Array<{ id: number; nama: string; error: string }> = [];

      for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        setDropAllProgress(
          `Menghapus semua kategori... (${i + 1}/${categories.length})`
        );

        const res = await fetch(
          `/api/admin/admin_dashboard/admin_produk/kategori_produk/${cat.id}`,
          { method: "DELETE" }
        );

        if (!res.ok) {
          let msg = "Gagal menghapus kategori.";
          try {
            const data = await res.json();
            if (data?.error) msg = data.error;
          } catch {
            // ignore
          }
          failures.push({ id: cat.id, nama: cat.nama, error: msg });
        }
      }

      await fetchCategories();

      if (failures.length === 0) {
        showToast("success", "Sukses", "Berhasil menghapus semua kategori.");
      } else {
        const sample = failures
          .slice(0, 3)
          .map((f) => `${f.nama} (#${f.id}): ${f.error}`)
          .join("\n");
        showToast("info", "Info", 'Selesai.\n\n    ${failures.length} kategori gagal dihapus.\n\n    Contoh:\n    ${sample}');
      }
    } catch (err: any) {
      showToast("info", "Info", String(err?.message ?? "Gagal menghapus semua kategori."));
    } finally {
      setDroppingAllCategories(false);
      setDropAllProgress("");
      setDropAllConfirmBusy(false);
      setDropAllConfirmOpen(false);
    }
  }



  // ===== BUKA MODAL GENERATE KATEGORI OTOMATIS (AI) =====
  async function openGenerateModal() {
    setGenError(null);
    setGenResult(null);
    setGenProgress("");

    // pastikan produk sudah tersedia
    if (allProducts.length === 0) {
      try {
        setIsLoadingProducts(true);
        const json = await fetchJson<any>(
          "/api/admin/admin_dashboard/admin_produk/daftar_produk",
          { cache: "no-store" },
          "Memuat produk"
        );

        const mapped: Product[] = (json.products ?? json.produk ?? []).map(
          (p: any) => {
            const kategori = p.kategori ?? null;
            const subkategori = p.subkategori ?? null;

            const fallbackName =
              [kategori, subkategori].filter(Boolean).join(" · ") ||
              `Produk #${p.id}`;

            const nama =
              (typeof p.nama === "string" && p.nama.trim().length > 0
                ? p.nama.trim()
                : "") || fallbackName;

            return {
              id: p.id,
              nama,
              harga: p.harga,
              promoAktif: (p as any).promoAktif ?? null,
              promoTipe: (p as any).promoTipe ?? null,
              promoValue: (p as any).promoValue ?? null,
              mainImageUrl: p.mainImageUrl ?? null,
              kategori,
              subkategori,
              deskripsiSingkat:
                p.deskripsiSingkat ?? p.deskripsi_singkat ?? null,
              tags: p.tags ?? null,
            };
          }
        );

        setAllProducts(mapped);
      } catch (err: any) {
        showToast("info", "Info", String(err?.message ?? "Gagal memuat produk."));
        return;
      } finally {
        setIsLoadingProducts(false);
      }
    }

    setGenModalOpen(true);
  }

  // ===== GENERATE + BUAT KATEGORI OTOMATIS (AI) =====

  function sanitizeCatName(input: string): string {
    let s = String(input ?? "").trim();
    s = s.replace(/\(\s*\d+\s*\)\s*$/g, "");
    s = s.replace(/\d+/g, " ");
    s = s.replace(/\s+/g, " ").trim();
    // normalisasi separator profesional
    s = s.replace(/\s-\s/g, " – ");
    return s;
  }

  function normalizeCatKey(input: string): string {
    return sanitizeCatName(input).toLowerCase();
  }

  async function handleGenerateCategories() {
    if (genBusy) return;

    const target = Math.max(
      1,
      Math.min(10, parseInt(genTargetCount || "1", 10) || 1)
    );
    if (!Number.isFinite(target) || target <= 0) {
      setGenError("Kuantitas kategori tidak valid.");
      return;
    }

    if (allProducts.length === 0) {
      setGenError("Produk kosong. Pastikan ada produk dulu.");
      return;
    }

    try {
      setGenBusy(true);
      setGenError(null);
      setGenResult(null);

      setGenProgress("Menganalisis produk & menyusun draft kategori...");

      const aiData = await fetchJson<any>(
        "/api/admin/admin_dashboard/admin_produk/kategori_produk/ai",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetCategoryCount: target,
            languageMode: genLangMode,
            aspects: genAspects.trim() ? genAspects.trim() : undefined,
            mode: "smart",
            minConfidence: target >= 8 ? 0.22 : 0.35,
            minItemsPerCategory: target >= 8 ? 1 : 3,
            existingCategories: categories.map((c) => c.nama),
            products: allProducts.map((p) => ({
              id: p.id,
              nama: p.nama,
              kategori: p.kategori ?? null,
              subkategori: p.subkategori ?? null,
              deskripsiSingkat: p.deskripsiSingkat ?? null,
              tags: p.tags ?? null,
              harga: p.harga,
              promoAktif: (p as any).promoAktif ?? null,
              promoTipe: (p as any).promoTipe ?? null,
              promoValue: (p as any).promoValue ?? null,
            })),
          }),
        },
        "Generate kategori (AI)"
      );

      const suggestions: Array<{
        nama: string;
        alasan?: string;
        produkIds: number[];
      }> = aiData?.categories ?? [];

      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error(
          "AI tidak mengembalikan kategori. Coba turunkan kuantitas."
        );
      }

      // Merge kategori duplikat dari AI (nama sama) -> gabungkan produkIds, dan sanitasi nama (tanpa angka / (2))
      const mergedMap = new Map<string, { nama: string; produkIds: number[] }>();
      for (const s of suggestions) {
        const cleanName = sanitizeCatName(String((s as any).nama ?? "")).trim();
        if (!cleanName) continue;
        const key = normalizeCatKey(cleanName);
        const ids = Array.isArray((s as any).produkIds) ? (s as any).produkIds : [];
        const prev = mergedMap.get(key);
        if (!prev) {
          mergedMap.set(key, { nama: cleanName, produkIds: Array.from(new Set(ids)) });
        } else {
          const st = new Set<number>(prev.produkIds);
          for (const id of ids) st.add(id);
          prev.produkIds = Array.from(st);
        }
      }
      const mergedSuggestions = Array.from(mergedMap.values()).slice(0, target);

      // Map kategori existing: kalau nama sudah ada -> jangan buat baru (hindari suffix "(2)"), cukup isi produk.
      const existingByKey = new Map<string, { id: number; nama: string }>();
      for (const c of categories) {
        existingByKey.set(normalizeCatKey(c.nama), { id: c.id, nama: c.nama });
      }



      setGenProgress(`Membuat kategori... (0/${mergedSuggestions.length})`);

      const created: Array<{ id: number; nama: string; produkCount: number }> =
        [];
      const failed: Array<{ nama: string; error: string }> = [];

      for (let i = 0; i < mergedSuggestions.length; i++) {
        const s = mergedSuggestions[i];

        const cleanName = sanitizeCatName(String(s.nama ?? "")).trim();
        if (!cleanName) {
          failed.push({ nama: String(s.nama ?? ""), error: "Nama kategori kosong setelah sanitasi." });
          continue;
        }

        const exist = existingByKey.get(normalizeCatKey(cleanName));
        if (exist) {
          // ❗️Nama kategori sudah ada di tabel -> jangan dipakai lagi saat generate ulang
          failed.push({
            nama: cleanName,
            error: `Nama kategori sudah ada ("${exist.nama}"). Generate ulang harus membuat judul berbeda.`,
          });
          continue;
        }


        const namaKategori = cleanName;
        if (!namaKategori) {
          failed.push({ nama: "(kosong)", error: "Nama kategori kosong." });
          continue;
        }

        setGenProgress(`Membuat kategori... (${i + 1}/${mergedSuggestions.length})`);

        // 1) buat kategori
        let createdId: number | null = null;
        try {
          const createData = await fetchJson<any>(
            "/api/admin/admin_dashboard/admin_produk/kategori_produk",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ nama: namaKategori }),
            },
            `Buat kategori "${namaKategori}"`
          );

          createdId =
            createData?.category?.id ??
            createData?.kategori?.id ??
            createData?.id ??
            null;

          if (!createdId) {
            failed.push({
              nama: namaKategori,
              error: "Response create kategori tidak ada id.",
            });
            continue;
          }
        } catch (err: any) {
          failed.push({ nama: namaKategori, error: err?.message ?? "Gagal membuat kategori." });
          continue;
        }
        // 2) isi produk ke kategori
        try {
          const produkIdsUntukKategori = Array.isArray(s.produkIds) ? s.produkIds : [];
          await fetchJson<any>(
            `/api/admin/admin_dashboard/admin_produk/kategori_produk/${createdId}/items`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ produkIds: produkIdsUntukKategori }),
            },
            `Isi produk untuk "${namaKategori}"`
          );
        } catch (err: any) {
          failed.push({
            nama: namaKategori,
            error: err?.message ?? "Kategori dibuat, tapi gagal isi produk.",
          });
          continue;
        }

        created.push({
          id: createdId,
          nama: namaKategori,
          produkCount: Array.isArray(s.produkIds) ? s.produkIds.length : 0,
        });
      }

      await fetchCategories();

      setGenResult({
        created,
        failed,
        reviewCount: Array.isArray(aiData?.reviewProdukIds)
          ? aiData.reviewProdukIds.length
          : 0,
        unassignedCount: Array.isArray(aiData?.unassignedProdukIds)
          ? aiData.unassignedProdukIds.length
          : 0,
        catatan: aiData?.catatan ?? null,
      });

      if (created.length === 0) {
        setGenError("Tidak ada kategori yang berhasil dibuat. Coba ubah kuantitas.");
      }
    } catch (err: any) {
      setGenError(err?.message ?? "Gagal generate kategori.");
    } finally {
      setGenBusy(false);
      setGenProgress("");
    }
  }



  // ===== HELPER: REORDER ARRAY =====
  function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  }

  // ===== SIMPAN URUTAN KATEGORI KE BACKEND =====
  async function saveCategoryOrder(ids: number[]) {
    try {
      await fetch(
        "/api/admin/admin_dashboard/admin_produk/kategori_produk/reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryIds: ids }),
        }
      );
    } catch (err) {
      console.error("Gagal menyimpan urutan kategori:", err);
    }
  }

  // ===== DRAG END (KATEGORI & PRODUK) =====
  function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    if (droppingAllCategories) return;

    const { source, destination } = result;

    // drag daftar kategori
    if (
      source.droppableId === "categories" &&
      destination.droppableId === "categories"
    ) {
      if (source.index === destination.index) return;
      const reordered = reorder(categories, source.index, destination.index);
      setCategories(reordered);
      saveCategoryOrder(reordered.map((c) => c.id));
    }

    // drag list produk terpilih di modal
    if (
      source.droppableId === "selectedProducts" &&
      destination.droppableId === "selectedProducts"
    ) {
      if (source.index === destination.index) return;
      // Perbaikan: Simpan ke variabel dulu agar bisa dipakai untuk update state DAN auto-save
      const reordered = reorder(selectedOrder, source.index, destination.index);
      setSelectedOrder(reordered);

      // AUTO SAVE: Langsung kirim API dengan urutan baru
      handleSaveCategoryProducts(reordered);
    }
  }

  // ===== BUKA MODAL KELOLA PRODUK =====
  async function openModal(cat: Category) {
    setModalCategory(cat);

    // initial selected berdasarkan items di kategori (urutannya pakai urutan yg ada di DB nanti)
    const initialIds = cat.items.map((p) => p.id);
    setSelectedProductIds(new Set(initialIds));
    setSelectedOrder(initialIds);

    // kalau kategori ini khusus promo, defaultkan filter & sort ke diskon terbesar
    setPromoOnly(!!cat.isPromo);
    if (cat.isPromo) setSortOption("discount-desc");

    if (allProducts.length === 0) {
      try {
        setIsLoadingProducts(true);
        const json = await fetchJson<any>(
          "/api/admin/admin_dashboard/admin_produk/daftar_produk",
          { cache: "no-store" },
          "Memuat produk"
        );

        const mapped: Product[] = (json.products ?? json.produk ?? []).map(
          (p: any) => {
            const kategori = p.kategori ?? null;
            const subkategori = p.subkategori ?? null;

            const fallbackName =
              [kategori, subkategori].filter(Boolean).join(" · ") ||
              `Produk #${p.id}`;

            const nama =
              (typeof p.nama === "string" && p.nama.trim().length > 0
                ? p.nama.trim()
                : "") || fallbackName;

            return {
              id: p.id,
              nama,
              harga: p.harga,
              promoAktif: (p as any).promoAktif ?? null,
              promoTipe: (p as any).promoTipe ?? null,
              promoValue: (p as any).promoValue ?? null,
              mainImageUrl: p.mainImageUrl ?? null,
              kategori,
              subkategori,
              deskripsiSingkat:
                p.deskripsiSingkat ?? p.deskripsi_singkat ?? null,
              tags: p.tags ?? null,
            };
          }
        );

        setAllProducts(mapped);
      } catch (err: any) {
        showToast("info", "Info", String(err?.message ?? "Gagal memuat produk."));
      } finally {
        setIsLoadingProducts(false);
      }
    }

    setModalOpen(true);
  }

  // ===== FILTER & SORT PRODUK DI MODAL (KIRI) =====
  const kategoriOptions = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.kategori) set.add(p.kategori);
    });
    return Array.from(set);
  }, [allProducts]);

  const subkategoriOptions = useMemo(() => {
    const set = new Set<string>();
    allProducts.forEach((p) => {
      if (p.subkategori) set.add(p.subkategori);
    });
    return Array.from(set);
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let list = [...allProducts];
    const q = productSearch.toLowerCase();

    if (filterKategori !== "all") {
      list = list.filter((p) => p.kategori === filterKategori);
    }
    if (filterSubkategori !== "all") {
      list = list.filter((p) => p.subkategori === filterSubkategori);
    }
    if (q) {
      list = list.filter((p) => (p.nama ?? "").toLowerCase().includes(q));
    }

    if (promoOnly) {
      list = list.filter((p) => computeHargaSetelahPromo(p).isPromo);
    }

    switch (sortOption) {
      case "name-asc":
        list.sort((a, b) => a.nama.localeCompare(b.nama));
        break;
      case "price-asc":
        list.sort((a, b) => a.harga - b.harga);
        break;
      case "price-desc":
        list.sort((a, b) => b.harga - a.harga);
        break;
      case "discount-desc":
        list.sort((a, b) => {
          const da = computeHargaSetelahPromo(a);
          const db = computeHargaSetelahPromo(b);
          const discA = Math.max(0, (da.hargaAsli ?? 0) - (da.hargaFinal ?? 0));
          const discB = Math.max(0, (db.hargaAsli ?? 0) - (db.hargaFinal ?? 0));
          // promo duluan
          if (db.isPromo !== da.isPromo) return db.isPromo ? 1 : -1;
          if (discB !== discA) return discB - discA;
          return b.harga - a.harga;
        });
        break;
      default:
        break;
    }

    return list;
  }, [
    allProducts,
    productSearch,
    filterKategori,
    filterSubkategori,
    promoOnly,
    sortOption,
  ]);

  // ===== PRODUK TERPILIH (KANAN MODAL) DALAM URUTAN DRAG =====
  const selectedProductsOrdered: Product[] = useMemo(
    () =>
      selectedOrder
        .map((id) => allProducts.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [selectedOrder, allProducts]
  );

  // toggle checkbox
  function toggleProduct(id: number) {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSelectedOrder((prevOrder) => prevOrder.filter((pid) => pid !== id));
      } else {
        next.add(id);
        setSelectedOrder((prevOrder) =>
          prevOrder.includes(id) ? prevOrder : [...prevOrder, id]
        );
      }
      return next;
    });
  }

  // ===== TOGGLE PRODUCT PROMO (DALAM MODAL) =====
  async function toggleProductPromo(p: Product) {
    const nextState = !p.promoAktif;
    // Default promo jika diaktifkan: Diskon 10% (contoh)
    // Terserah user, tapi biar cepat kita set default reasonable
    const patchBody = {
      promoAktif: nextState,
      // Kalau aktif, cek apakah sudah ada tipe/value? Kalau belum set default.
      ...(nextState && !p.promoTipe ? { promoTipe: "persen", promoValue: 10 } : {})
    };

    try {
      const res = await fetch(`/api/admin/admin_dashboard/admin_produk/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody)
      });

      if (!res.ok) throw new Error("Gagal update status promo");

      const json = await res.json();
      if (json.produk) {
        // Update state lokal
        setAllProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, ...json.produk } : prod));
        showToast("success", "Sukses", `Promo produk "${p.nama}" ${nextState ? "aktif" : "non-aktif"}`);
      }
    } catch (err: any) {
      showToast("error", "Gagal", err.message);
    }
  }

  // ===== SIMPAN PRODUK KATEGORI (POST /:id/items) =====
  async function handleSaveCategoryProducts(overrideOrder?: number[]) {
    if (!modalCategory) return;

    // Gunakan order dari parameter jika ada (untuk auto-save DnD),
    // jika tidak (klik tombol simpan manual), gunakan state selectedOrder.
    const orderToSave = Array.isArray(overrideOrder) ? overrideOrder : selectedOrder;

    try {
      setSavingCategoryProducts(true);

      const res = await fetch(
        `/api/admin/admin_dashboard/admin_produk/kategori_produk/${modalCategory.id}/items`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            produkIds: orderToSave,
          }),
        }
      );

      if (!res.ok) {
        let message = "Gagal menyimpan produk.";
        try {
          const text = await res.text();
          console.error(
            "Save kategori gagal. Status:",
            res.status,
            "Body:",
            text
          );
          try {
            const data = JSON.parse(text);
            if (data?.error) message = data.error;
          } catch {
            // body bukan JSON
          }
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      setModalOpen(false);
      setModalCategory(null);
      await fetchCategories();
    } catch (err: any) {
      showToast("info", "Info", String(err?.message ?? "Gagal menyimpan produk."));
    } finally {
      setSavingCategoryProducts(false);
    }
  }

  // ===== WRAPPER CLASS (DARK / LIGHT) =====
  const wrapperClass = `${baseStyles.wrapper} ${isDark ? baseStyles.wrapperDark : baseStyles.wrapperLight
    }`;

  // ===== RENDER =====
  return (
    <div className={wrapperClass}>
      {/* SIDEBAR */}
      <aside
        className={`${baseStyles.sidebar} ${isSidebarOpen ? baseStyles.sidebarOpen : ""
          }`}
      >
        <div className={baseStyles.sidebarHeader}>
          <div className={baseStyles.brand}>
            <div className={baseStyles.brandLogo}>A</div>
            <div className={baseStyles.brandText}>
              <span className={baseStyles.brandTitle}>APIX INTERIOR</span>
              <span className={baseStyles.brandSubtitle}>
                Admin Dashboard
              </span>
            </div>
          </div>

          <button
            type="button"
            className={baseStyles.sidebarClose}
            onClick={() => setIsSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className={baseStyles.menu}>
          <button
            type="button"
            className={baseStyles.menuItem}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_produk/daftar_produk")
            }
          >
            Daftar Produk
          </button>

          <button
            type="button"
            className={baseStyles.menuItem}
            onClick={() =>
              router.push("/admin/admin_dashboard/admin_produk/tambah_produk")
            }
          >
            Tambah Produk
          </button>

          <button
            type="button"
            className={`${baseStyles.menuItem} ${baseStyles.menuItemActive}`}
          >
            Kategori Produk
          </button>
        </nav>

        <div className={baseStyles.themeSection}>
          <span className={baseStyles.themeLabel}>
            Mode tombol: {isDark ? "Malam" : "Siang"}
          </span>
          <button
            type="button"
            className={`${baseStyles.themeSwitch} ${isDark ? baseStyles.themeSwitchOn : ""
              }`}
            onClick={() => setIsDark((prev) => !prev)}
          >
            <span className={baseStyles.themeThumb} />
          </button>
        </div>

        <div className={baseStyles.sidebarBackWrapper}>
          <button
            type="button"
            className={baseStyles.sidebarBackButton}
            onClick={() => router.push("/admin/admin_dashboard")}
          >
            KEMBALI
          </button>
        </div>
      </aside>

      {/* OVERLAY MOBILE */}
      {isSidebarOpen && (
        <div
          className={baseStyles.overlay}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* MAIN CONTENT */}
      <main className={baseStyles.main}>

        {/* TOAST (gantikan alert() bawaan browser) */}
        {toastOpen && (
          <div className={`${styles.toastWrap} ${styles[`toast_${toastKind}`]}`} role="status" aria-live="polite">
            <div className={styles.toastCard}>
              <div className={styles.toastHeader}>
                <div className={styles.toastTitle}>{toastTitle}</div>
                <button
                  type="button"
                  className={styles.toastClose}
                  onClick={() => setToastOpen(false)}
                  aria-label="Tutup"
                  title="Tutup"
                >
                  ✕
                </button>
              </div>
              <div className={styles.toastMessage}>{toastMessage}</div>
            </div>
          </div>
        )}
        {/* TOPBAR MOBILE */}
        <div className={baseStyles.mobileTopBar}>
          <button
            type="button"
            className={baseStyles.mobileMenuButton}
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          <div className={baseStyles.mobileBrand}>APIX INTERIOR</div>
        </div>

        {/* BRAND DESKTOP */}
        <div className={baseStyles.desktopBrandBar}>
          <span className={baseStyles.desktopBrand}>APIX INTERIOR</span>
        </div>

        {/* HEADER */}
        <header className={baseStyles.header}>
          <h1 className={baseStyles.pageTitle}>Kategori Produk</h1>
          <p className={baseStyles.pageSubtitle}>
            Buat kategori bebas dan isi dengan produk dari daftar produk.
          </p>

          <div className={baseStyles.headerRight}>
            <input
              type="text"
              className={baseStyles.searchInput}
              placeholder="Nama kategori baru..."
              disabled={creatingCategory || droppingAllCategories || genBusy}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !creatingCategory) {
                  e.preventDefault();
                  handleCreateCategory();
                }
              }}
            />
            <button
              type="button"
              className={baseStyles.primaryButton}
              disabled={creatingCategory || droppingAllCategories || genBusy}
              onClick={handleCreateCategory}
            >
              {creatingCategory ? "Menyimpan..." : "+ Tambah Kategori"}
            </button>
            <button
              type="button"
              className={baseStyles.editButton}
              disabled={
                creatingCategory ||
                droppingAllCategories ||
                loading ||
                genBusy
              }
              onClick={openGenerateModal}
              title="Generate kategori otomatis dari daftar produk"
            >
              {genBusy ? "Generate..." : "⚡ Generate Otomatis"}
            </button>
            <button
              type="button"
              className={`${baseStyles.deleteButton} ${styles.dropAllButton}`}
              disabled={
                creatingCategory ||
                droppingAllCategories ||
                loading ||
                genBusy ||
                categories.length === 0
              }
              onClick={handleDropAllCategories}
              title={
                categories.length === 0
                  ? "Tidak ada kategori"
                  : "Hapus semua kategori sekaligus"
              }
            >
              {droppingAllCategories ? "Menghapus..." : "Drop All"}

              {droppingAllCategories && dropAllProgress && (
                <p className={styles.dropProgress}>{dropAllProgress}</p>
              )}

            </button>

          </div>
        </header>

        {/* STATUS */}
        {loading && (
          <p className={baseStyles.infoText}>Memuat kategori...</p>
        )}

        {error && (
          <div className={baseStyles.errorBox}>
            <span>{error}</span>
            <button
              type="button"
              className={baseStyles.retryButton}
              onClick={fetchCategories}
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* LIST KATEGORI + DRAG & DROP */}
        {!mounted && !loading && !error && (
          <p className={baseStyles.infoText}>Menyiapkan tampilan...</p>
        )}

        {mounted && !loading && !error && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div
                  className={baseStyles.list}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {categories.map((cat, index) => {
                    const thumbs = cat.items.slice(0, 4);
                    return (
                      <Draggable
                        key={cat.id}
                        draggableId={String(cat.id)}
                        index={index}
                        isDragDisabled={droppingAllCategories}
                      >
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className={baseStyles.item}
                          >
                            <div
                              className={styles.categoryCard}
                              style={
                                cat.isPromo
                                  ? {
                                    border: "2px solid rgba(212,175,55,0.9)",
                                    boxShadow: "0 12px 30px rgba(212,175,55,0.18)",
                                  }
                                  : undefined
                              }
                            >
                              <div className={styles.categoryHeaderRow}>
                                <span
                                  className={styles.categoryDragHandle}
                                  {...dragProvided.dragHandleProps}
                                >
                                  ⠿
                                </span>
                                <div className={styles.categoryInfo}>
                                  <div className={styles.categoryName}>
                                    {cat.nama}
                                    {cat.isPromo && (
                                      <span
                                        style={{
                                          border: "1px solid rgba(212,175,55,0.9)",
                                          background: "rgba(212,175,55,0.14)",
                                          color: "rgba(120,86,0,1)",
                                          padding: "4px 10px",
                                          borderRadius: 999,
                                          fontSize: 12,
                                          fontWeight: 800,
                                          letterSpacing: 0.6,
                                        }}
                                      >
                                        PROMO
                                      </span>
                                    )}
                                  </div>
                                  <div className={styles.categoryCount}>
                                    {cat.items.length} produk
                                  </div>
                                </div>
                              </div>

                              <div className={styles.thumbStrip}>
                                {thumbs.map((p) => (
                                  <div
                                    key={p.id}
                                    className={styles.thumbItem}
                                    title={p.nama}
                                  >
                                    {p.mainImageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={p.mainImageUrl}
                                        alt={p.nama}
                                      />
                                    ) : (
                                      <div className={styles.noImg}>No</div>
                                    )}
                                  </div>
                                ))}
                                {cat.items.length > 4 && (
                                  <div className={styles.thumbMore}>
                                    +{cat.items.length - 4}
                                  </div>
                                )}
                              </div>

                              <div className={styles.cardButtons}>
                                <button
                                  type="button"
                                  className={baseStyles.editButton}
                                  disabled={droppingAllCategories}
                                  onClick={() => openModal(cat)}
                                >
                                  Kelola Produk
                                </button>

                                <button
                                  type="button"
                                  className={baseStyles.editButton}
                                  style={{
                                    borderColor: "rgba(212,175,55,0.9)",
                                    color: "rgba(212,175,55,0.95)",
                                    background: "transparent",
                                  }}
                                  disabled={droppingAllCategories || promoToggleBusyId !== null}
                                  onClick={() => toggleCategoryPromo(cat)}
                                  title={
                                    cat.isPromo
                                      ? "Matikan status promo untuk kategori ini"
                                      : "Jadikan kategori ini khusus promo"
                                  }
                                >
                                  {promoToggleBusyId === cat.id
                                    ? "..."
                                    : cat.isPromo
                                      ? "Matikan Promo"
                                      : "Jadikan Promo"}
                                </button>
                                <button
                                  type="button"
                                  className={baseStyles.deleteButton}
                                  disabled={droppingAllCategories}
                                  onClick={() =>
                                    handleDeleteCategory(cat.id)
                                  }
                                >
                                  Hapus
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* MODAL KELOLA PRODUK */}
            {modalOpen && modalCategory && (
              <div className={`${styles.modalOverlay} ${styles.aiOverlay}`}>
                <div className={`${styles.modal} ${styles.aiModal}`}>
                  <div className={`${styles.modalHeader} ${styles.aiModalHeader}`}>
                    <h2>
                      Kelola Produk: <b>{modalCategory.nama}</b>
                    </h2>
                    <button
                      className={styles.modalClose}
                      onClick={() => {
                        setModalOpen(false);
                        setModalCategory(null);
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <div className={`${styles.modalContent} ${styles.aiModalContent}`}>
                    {/* KIRI: filter + grid produk */}
                    <div className={`${styles.modalLeft} ${styles.aiModalLeft}`}>
                      <div className={`${styles.filterRow} ${styles.aiFieldGroup}`}>
                        <input
                          className={baseStyles.searchInput}
                          placeholder="Cari produk…"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />

                        <select
                          className={styles.select}
                          value={sortOption}
                          onChange={(e) =>
                            setSortOption(e.target.value as SortOption)
                          }
                        >
                          <option value="default">Urutan default</option>
                          <option value="name-asc">Nama A-Z</option>
                          <option value="price-asc">
                            Harga: rendah → tinggi
                          </option>
                          <option value="price-desc">
                            Harga: tinggi → rendah
                          </option>
                          <option value="discount-desc">Diskon terbesar</option>
                        </select>

                        <label style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={promoOnly}
                            onChange={(e) => setPromoOnly(e.target.checked)}
                          />
                          Promo saja
                        </label>
                      </div>

                      <div className={`${styles.filterRow} ${styles.aiFieldGroup}`}>
                        <select
                          className={styles.select}
                          value={filterKategori}
                          onChange={(e) => setFilterKategori(e.target.value)}
                        >
                          <option value="all">Semua kategori</option>
                          {kategoriOptions.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>

                        <select
                          className={styles.select}
                          value={filterSubkategori}
                          onChange={(e) => setFilterSubkategori(e.target.value)}
                        >
                          <option value="all">Semua subkategori</option>
                          {subkategoriOptions.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>

                        <label style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                          <input
                            type="checkbox"
                            checked={promoOnly}
                            onChange={(e) => setPromoOnly(e.target.checked)}
                          />
                          Promo saja
                        </label>
                      </div>

                      <div className={styles.modalGrid}>
                        {isLoadingProducts ? (
                          <p>Memuat produk...</p>
                        ) : filteredProducts.length === 0 ? (
                          <p>Tidak ada produk.</p>
                        ) : (
                          filteredProducts.map((p) => (
                            <label key={p.id} className={styles.modalItem}>
                              <input
                                type="checkbox"
                                checked={selectedProductIds.has(p.id)}
                                onChange={() => toggleProduct(p.id)}
                              />

                              <div className={styles.modalThumb}>
                                {p.mainImageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={p.mainImageUrl} alt={p.nama} />
                                ) : (
                                  <div className={styles.noImg}>No</div>
                                )}
                              </div>

                              <div className={styles.modalName}>{p.nama}</div>
                              <div className={styles.modalPrice}>
                                {(() => {
                                  const pr = computeHargaSetelahPromo(p);
                                  return pr.isPromo ? (
                                    <>
                                      <span style={{ fontWeight: 800 }}>
                                        {formatRupiah(pr.hargaFinal)}
                                      </span>
                                      <span
                                        style={{
                                          marginLeft: 10,
                                          textDecoration: "line-through",
                                          opacity: 0.6,
                                        }}
                                      >
                                        {formatRupiah(pr.hargaAsli)}
                                      </span>
                                      <span style={{ marginLeft: 10, fontWeight: 800 }}>
                                        {pr.promoLabel}
                                      </span>
                                    </>
                                  ) : (
                                    <>{formatRupiah(p.harga)}</>
                                  );
                                })()}
                              </div>
                              {(p.kategori || p.subkategori) && (
                                <div className={styles.modalMeta}>
                                  {[p.kategori, p.subkategori]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </div>
                              )}
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    {/* KANAN: produk di kategori (drag & drop urutan) */}
                    <div className={`${styles.modalRight} ${styles.aiModalRight}`}>
                      <div className={styles.selectedHeader}>
                        <span>
                          Produk dalam kategori ({selectedOrder.length})
                        </span>
                        <span className={styles.selectedHint}>
                          Tarik untuk mengubah urutan
                        </span>
                      </div>

                      <Droppable droppableId="selectedProducts">
                        {(providedSelected) => (
                          <div
                            className={styles.selectedList}
                            ref={providedSelected.innerRef}
                            {...providedSelected.droppableProps}
                          >
                            {selectedProductsOrdered.map((p, index) => (
                              <Draggable
                                key={p.id}
                                draggableId={`sel-${p.id}`}
                                index={index}
                              >
                                {(dragProvidedSel) => (
                                  <div
                                    ref={dragProvidedSel.innerRef}
                                    {...dragProvidedSel.draggableProps}
                                    {...dragProvidedSel.dragHandleProps}
                                    className={styles.selectedItem}
                                  >
                                    <div className={styles.selectedThumb}>
                                      {p.mainImageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={p.mainImageUrl}
                                          alt={p.nama}
                                        />
                                      ) : (
                                        <div className={styles.noImg}>No</div>
                                      )}
                                    </div>
                                    <div className={styles.selectedInfo}>
                                      <div className={styles.selectedName}>
                                        {p.nama}
                                      </div>
                                      <div className={styles.selectedPrice}>
                                        {(() => {
                                          const pr = computeHargaSetelahPromo(p);
                                          return pr.isPromo ? (
                                            <>
                                              <span style={{ fontWeight: 800 }}>
                                                {formatRupiah(pr.hargaFinal)}
                                              </span>
                                              <span
                                                style={{
                                                  marginLeft: 10,
                                                  textDecoration: "line-through",
                                                  opacity: 0.6,
                                                }}
                                              >
                                                {formatRupiah(pr.hargaAsli)}
                                              </span>
                                              <span style={{ marginLeft: 10, fontWeight: 800 }}>
                                                {pr.promoLabel}
                                              </span>
                                            </>
                                          ) : (
                                            <>{formatRupiah(p.harga)}</>
                                          );
                                        })()}
                                      </div>

                                      {/* TOMBOL TOGGLE PROMO (NEW) */}
                                      <button
                                        type="button"
                                        style={{
                                          marginTop: 4,
                                          fontSize: 11,
                                          padding: "2px 8px",
                                          borderRadius: 4,
                                          border: p.promoAktif ? "1px solid #d4af37" : "1px solid #ccc",
                                          background: p.promoAktif ? "rgba(212,175,55,0.1)" : "transparent",
                                          color: p.promoAktif ? "#d4af37" : "#666",
                                          cursor: "pointer"
                                        }}
                                        onClick={() => toggleProductPromo(p)}
                                      >
                                        {p.promoAktif ? "Promo Aktif" : "Jadikan Promo"}
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.selectedRemove}
                                      onClick={() => toggleProduct(p.id)}
                                    >
                                      ×
                                    </button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {providedSelected.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  </div>

                  <div className={`${styles.modalFooter} ${styles.aiModalFooter}`}>
                    <span>Dipilih: {selectedOrder.length} produk</span>
                    <button
                      type="button"
                      className={baseStyles.primaryButton}
                      disabled={savingCategoryProducts}
                      onClick={() => handleSaveCategoryProducts()}
                    >
                      {savingCategoryProducts
                        ? "Menyimpan..."
                        : "Simpan ke kategori"}
                    </button>
                  </div>
                </div>
              </div>

            )}

            {/* MODAL GENERATE KATEGORI OTOMATIS (AI) */}
            {genModalOpen && (
              <div className={styles.modalOverlay}>
                <div className={styles.modal}>
                  <div className={styles.modalHeader}>
                    <h2>Generate Kategori Otomatis (AI)</h2>
                    <button
                      className={styles.modalClose}
                      disabled={genBusy}
                      onClick={() => {
                        if (genBusy) return;
                        setGenModalOpen(false);
                      }}
                      title={genBusy ? "Sedang memproses..." : "Tutup"}
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.modalContent}>
                    <div className={styles.modalLeft}>
                      <div className={`${styles.filterRow} ${styles.aiFieldGroup}`}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className={baseStyles.searchInput}
                          value={genTargetCount}
                          onChange={(e) => {
                            // Hilangkan leading zero: "022" -> "22"
                            let raw = (e.target.value ?? "");
                            raw = raw.replace(/\D+/g, ""); // digits only
                            raw = raw.replace(/^0+(?=\d)/, "");
                            if (raw === "") {
                              setGenTargetCount("");
                              return;
                            }
                            const n = Math.max(1, Math.min(10, parseInt(raw, 10) || 1));
                            setGenTargetCount(String(n));
                          }}
                          disabled={genBusy}
                          placeholder="Kuantitas kategori (1-10)"
                        />

                        <div className={`${styles.filterRow} ${styles.aiFieldGroup}`}>
                          <select
                            className={baseStyles.searchInput}
                            value={genLangMode}
                            onChange={(e) => setGenLangMode((e.target.value as any) === "EN" ? "EN" : "ID")}
                            disabled={genBusy}
                            aria-label="Bahasa kategori"
                            title="Pilih bahasa output kategori"
                          >
                            <option value="ID">Bahasa Indonesia</option>
                            <option value="EN">English</option>
                          </select>

                          <label style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                            <input
                              type="checkbox"
                              checked={promoOnly}
                              onChange={(e) => setPromoOnly(e.target.checked)}
                            />
                            Promo saja
                          </label>
                        </div>
                      </div>

                      <div className={`${styles.filterRow} ${styles.aiFieldGroup}`}>
                        <textarea
                          className={baseStyles.searchInput}
                          style={{ height: 84, resize: "vertical" }}
                          value={genAspects}
                          onChange={(e) => setGenAspects(e.target.value)}
                          disabled={genBusy}
                          placeholder='Deskripsi/aspek (opsional). Contoh: "ruangan, material, style"'
                        />
                      </div>

                      <p className={baseStyles.infoText}>
                        Klik tombol di bawah untuk generate kategori dari data produk, lalu otomatis dibuat dan diisi produknya.
                      </p>

                      {isLoadingProducts && (
                        <p className={baseStyles.infoText}>Memuat produk...</p>
                      )}

                      {genProgress && (
                        <p className={baseStyles.infoText}>{genProgress}</p>
                      )}

                      {genError && (
                        <div className={baseStyles.errorBox}>
                          <span>{genError}</span>
                        </div>
                      )}

                      {genResult && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 12,
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "rgba(0,0,0,0.04)",
                          }}
                        >
                          <div>
                            <b>Berhasil:</b> {genResult.created.length} kategori
                            {genResult.failed.length > 0 && (
                              <>
                                {" "}
                                · <b>Gagal:</b> {genResult.failed.length}
                              </>
                            )}
                          </div>

                          {(genResult.reviewCount > 0 ||
                            genResult.unassignedCount > 0) && (
                              <div style={{ marginTop: 8 }}>
                                <div>
                                  Review: {genResult.reviewCount} produk · Unassigned:{" "}
                                  {genResult.unassignedCount} produk
                                </div>
                                {genResult.catatan && (
                                  <div style={{ marginTop: 6 }}>
                                    <i>{genResult.catatan}</i>
                                  </div>
                                )}
                              </div>
                            )}

                          {genResult.created.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <b>Daftar kategori (max 12):</b>
                              <ul style={{ marginTop: 6, paddingLeft: 18 }}>
                                {genResult?.created?.slice(0, 12).map((c) => (
                                  <li key={c.id}>
                                    {c.nama} ({c.produkCount} produk)
                                  </li>
                                ))}
                                {(genResult?.created?.length ?? 0) > 12 && (
                                  <li>
                                    +{(genResult?.created?.length ?? 0) - 12} lainnya...
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={styles.modalRight}>
                      <div className={styles.selectedHeader}>
                        <span>Ringkasan</span>
                        <span className={styles.selectedHint}>
                          Target:{" "}
                          {Math.max(
                            1,
                            Math.min(10, parseInt(genTargetCount || "1", 10) || 1)
                          )}{" "}
                          kategori
                        </span>
                      </div>

                      <div className={styles.selectedList} style={{ padding: 12 }}>
                        <p className={baseStyles.infoText}>
                          Tips: Kalau hasil terlalu sedikit, turunkan kuantitas atau kosongkan deskripsi/aspek.
                        </p>

                        {genResult?.failed && genResult.failed.length > 0 && (
                          <div className={styles.aiResultSection}>
                            <h4>
                              ⚠️ Gagal dibuat ({genResult.failed.length})
                            </h4>
                            <ul className={styles.aiResultList}>
                              {genResult?.failed?.map((f, i) => (
                                <li key={i} className={styles.aiResultItemError}>
                                  <strong>{f.nama}</strong>: {f.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button
                      type="button"
                      className={baseStyles.deleteButton}
                      disabled={genBusy}
                      onClick={() => setGenModalOpen(false)}
                    >
                      Tutup
                    </button>

                    <button
                      type="button"
                      className={baseStyles.primaryButton}
                      disabled={genBusy || isLoadingProducts}
                      onClick={handleGenerateCategories}
                    >
                      {genBusy ? "Memproses..." : "Generate & Buat Kategori"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </DragDropContext>
        )}

        {/* MODAL KONFIRMASI HAPUS SEMUA (ESTETIK, bukan confirm bawaan browser) */}

        {/* MODAL KONFIRMASI HAPUS SATU (ESTETIK) */}
        {deleteOneConfirmOpen && (
          <div className={`${styles.modalOverlay} ${styles.confirmOverlay}`}>
            <div className={`${styles.modal} ${styles.confirmModal}`} role="dialog" aria-modal="true">
              <div className={`${styles.modalHeader} ${styles.confirmHeader}`}>
                <div>
                  <div className={styles.confirmTitle}>Hapus Kategori</div>
                  <div className={styles.confirmSubtitle}>
                    Kamu akan menghapus: <b>{deleteOneName}</b>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.confirmClose}
                  onClick={() => !deleteOneBusy && setDeleteOneConfirmOpen(false)}
                  disabled={deleteOneBusy}
                  aria-label="Tutup"
                  title="Tutup"
                >
                  ✕
                </button>
              </div>

              {deleteOneBusy && (
                <div className={styles.confirmProgressWrap} aria-label="Menghapus">
                  <div className={styles.confirmProgressBar} />
                </div>
              )}

              <div className={styles.confirmBody}>
                <div className={styles.confirmWarning}>
                  <div className={styles.confirmBadge}>Tidak Bisa Dibatalkan</div>
                  <div className={styles.confirmText}>
                    Catatan: tindakan ini tidak bisa dibatalkan. Pastikan kamu benar-benar yakin sebelum lanjut.
                  </div>
                </div>
              </div>

              <div className={`${styles.modalFooter} ${styles.confirmFooter}`}>
                <button
                  type="button"
                  className={`${baseStyles.btn} ${styles.confirmCancelBtn}`}
                  onClick={() => setDeleteOneConfirmOpen(false)}
                  disabled={deleteOneBusy}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className={`${baseStyles.btn} ${styles.confirmDangerBtn}`}
                  onClick={doDeleteOneCategory}
                  disabled={deleteOneBusy}
                >
                  {deleteOneBusy ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

        {dropAllConfirmOpen && (
          <div className={`${styles.modalOverlay} ${styles.confirmOverlay}`}>
            <div className={`${styles.modal} ${styles.confirmModal}`} role="dialog" aria-modal="true">
              <div className={`${styles.modalHeader} ${styles.confirmHeader}`}>
                <div>
                  <div className={styles.confirmTitle}>Hapus Semua Kategori</div>
                  <div className={styles.confirmSubtitle}>
                    Kamu akan menghapus <b>{dropAllConfirmCount}</b> kategori sekaligus.
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.confirmClose}
                  onClick={() => !dropAllConfirmBusy && setDropAllConfirmOpen(false)}
                  disabled={dropAllConfirmBusy}
                  aria-label="Tutup"
                  title="Tutup"
                >
                  ✕
                </button>
              </div>

              {dropAllConfirmBusy && (
                <div className={styles.confirmProgressWrap} aria-label="Menghapus">
                  <div className={styles.confirmProgressBar} />
                </div>
              )}

              <div className={styles.confirmBody}>
                <div className={styles.confirmWarning}>
                  <div className={styles.confirmBadge}>Tidak Bisa Dibatalkan</div>
                  <div className={styles.confirmText}>
                    Catatan: tindakan ini tidak bisa dibatalkan. Pastikan kamu benar-benar yakin sebelum lanjut.
                  </div>
                </div>

                {dropAllProgress ? (
                  <div className={styles.confirmStatus}>{dropAllProgress}</div>
                ) : (
                  <div className={styles.confirmHint}>
                    Tips: kalau kategori sudah banyak dan kamu cuma ingin reset, ini cara tercepat.
                  </div>
                )}
              </div>

              <div className={`${styles.modalFooter} ${styles.confirmFooter}`}>
                <button
                  type="button"
                  className={`${baseStyles.btn} ${styles.confirmCancelBtn}`}
                  onClick={() => setDropAllConfirmOpen(false)}
                  disabled={dropAllConfirmBusy}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className={`${baseStyles.btn} ${styles.confirmDangerBtn}`}
                  onClick={doDropAllCategories}
                  disabled={dropAllConfirmBusy}
                >
                  {dropAllConfirmBusy ? "Menghapus..." : "Ya, Hapus Semua"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
