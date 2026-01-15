"use client";



import { useEffect, useMemo, useRef, useState } from "react";

import type { DragEvent } from "react";

import { useRouter } from "next/navigation";

import styles from "./daftar_produk.module.css";
import { useAdminTheme } from "../../AdminThemeContext";



type Product = {

  id: number;

  nama: string;

  slug: string | null;

  kategori: string | null;
  subkategori: string | null;
  harga: number;
  // promo (opsional)
  promoAktif: boolean | null;
  promoTipe: "persen" | "nominal" | null;
  promoValue: number | null;
  mainImageUrl: string | null;
  // untuk ke depan kalau kamu sudah kirim lebih dari 1 foto dari API
  galleryImageUrls: string[] | null;
  urutan: number | null;
  mediaCount: number; // opsional: kalau API ngirim langsung jumlah foto
  // detail tambahan
  hargaTipe: string | null;
  tipeOrder: string | null;
  estimasiPengerjaan: string | null;
  deskripsiSingkat: string | null;
  panjang: number | null;
  lebar: number | null;
  tinggi: number | null;
  material: string | null;
  finishing: string | null;
  warna: string | null;
  berat: number | null;
  jasaPasang: string | null;
  isCustom: boolean | null;
  bisaCustomUkuran: boolean | null;
  tags: string | null;
  variations: Variation[];
};

type Variation = {
  id: number;
  nama: string;
  harga: number;
  priceMode: string | null;
  promoAktif: boolean | null;
  promoTipe: "persen" | "nominal" | null;
  promoValue: number | null;
  imageUrl: string | null;
  galleryUrls: string[] | null;
  combos: Array<{
    id: number;
    level: number;
    nama: string;
    nilai: string;
    tambahHarga: number | null;
    imageUrl: string | null;
    promoAktif?: boolean | null;
    promoTipe?: "persen" | "nominal" | null;
    promoValue?: number | null;
  }>;
};




function formatRupiah(value: number) {

  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;

}



function computeHargaSetelahPromo(p: {

  harga: number;

  promoAktif: boolean | null;

  promoTipe: "persen" | "nominal" | null;

  promoValue: number | null;

}) {

  // Pakai integer murni untuk menghindari kasus nominal geser 1 rupiah

  const hargaAsli = Math.round(Number(p.harga ?? 0) || 0);



  const aktif = !!p.promoAktif;

  const tipe = p.promoTipe ?? null;



  // promoValue kadang kebaca float, jadi paksa int

  const valueRaw = Math.round(Number(p.promoValue ?? 0) || 0);



  if (!aktif || !tipe || valueRaw <= 0 || hargaAsli <= 0) {

    return { hargaAsli, hargaFinal: hargaAsli, isPromo: false, promoLabel: "" };

  }



  let diskon = 0;



  if (tipe === "persen") {

    const pct = Math.max(0, Math.min(100, valueRaw));

    diskon = Math.round((pct / 100) * hargaAsli);

  } else {

    // nominal

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

type PromoInput = {
  promoAktif?: boolean | null;
  promoTipe?: "persen" | "nominal" | "percent" | null;
  promoValue?: number | null;
};

function applyPromoValue(base: number, promo: PromoInput) {
  const harga = Math.max(0, Math.round(Number(base ?? 0) || 0));
  const aktif = !!promo?.promoAktif;
  const tipeRaw = promo?.promoTipe;
  const tipe =
    tipeRaw === "nominal"
      ? "nominal"
      : tipeRaw === "persen" || tipeRaw === "percent"
        ? "persen"
        : null;
  let val = Math.round(Number(promo?.promoValue ?? 0) || 0);
  if (!aktif || !tipe || val <= 0) return { before: harga, after: harga };
  if (tipe === "persen") {
    if (val > 100) val = 100;
    const after = Math.max(0, Math.round((100 - val) * harga / 100));
    return { before: harga, after };
  }
  // nominal
  const cut = Math.min(harga, val);
  return { before: harga, after: Math.max(0, harga - cut) };
}

type ComboSelection = Record<number, string | number | null>;

function buildCombosByLevel(v: Variation | null) {
  const map: Record<number, Variation["combos"]> = { 1: [], 2: [], 3: [] };
  if (!v?.combos?.length) return map;
  v.combos.forEach((c) => {
    const lvl = c.level ?? 0;
    if (!map[lvl]) map[lvl] = [];
    map[lvl].push(c);
  });
  return map;
}

function defaultComboSelection(map: Record<number, Variation["combos"]>) {
  const sel: ComboSelection = { 1: null, 2: null, 3: null };
  [1, 2, 3].forEach((lvl) => {
    const list = map[lvl];
    if (list && list.length) sel[lvl] = list[0].id;
  });
  return sel;
}

function computeHargaPreviewStatic({
  product,
  variation,
  combosByLevel,
  selectedCombos,
}: {
  product: Product;
  variation: Variation | null;
  combosByLevel: Record<number, Variation["combos"]>;
  selectedCombos: ComboSelection;
}) {
  const hasVarHarga = variation && Number(variation.harga) > 0;
  const varPromoOn = variation && !!variation.promoAktif && Number(variation.promoValue ?? 0) > 0;
  const useVarPromo = variation && (hasVarHarga || varPromoOn);
  const basePrice = hasVarHarga ? Number(variation?.harga || 0) : Number(product.harga || 0);
  const basePromoSource: PromoInput = useVarPromo ? variation || {} : product || {};
  const baseCalc = applyPromoValue(basePrice, basePromoSource);

  let totalBefore = baseCalc.before;
  let totalAfter = baseCalc.after;

  [1, 2, 3].forEach((lvl) => {
    const cid = selectedCombos[lvl];
    if (!cid) return;
    const list = combosByLevel[lvl] || [];
    const found = list.find((c) => String(c.id) === String(cid));
    if (!found) return;
    const addPrice = Math.round(Number(found.tambahHarga ?? 0) || 0);
    const addCalc = applyPromoValue(addPrice, {
      promoAktif: found.promoAktif,
      promoTipe: found.promoTipe,
      promoValue: found.promoValue,
    });
    totalBefore += addCalc.before;
    totalAfter += addCalc.after;
  });

  const isPromo = totalAfter < totalBefore;
  const promoPct =
    isPromo && totalBefore > 0 ? Math.round((1 - totalAfter / totalBefore) * 100) : 0;
  const promoLabel = isPromo && promoPct > 0 ? `-${promoPct}%` : "";

  return {
    varId: variation?.id ?? null,
    hargaAsli: totalBefore,
    hargaFinal: totalAfter,
    isPromo,
    promoLabel,
  };
}

function computeBestPriceForProduct(p: Product) {
  let best: { hargaAsli: number; hargaFinal: number; isPromo: boolean; promoLabel: string } | null =
    null;

  const vars = Array.isArray(p.variations) ? p.variations : [];
  if (!vars.length) {
    const pr = computeHargaSetelahPromo(p);
    return { ...pr, hargaAsli: pr.hargaAsli, hargaFinal: pr.hargaFinal, promoLabel: pr.promoLabel };
  }

  vars.forEach((v) => {
    const comboMap = buildCombosByLevel(v);
    const defaultSel = defaultComboSelection(comboMap);
    const pr = computeHargaPreviewStatic({
      product: p,
      variation: v,
      combosByLevel: comboMap,
      selectedCombos: defaultSel,
    });
    if (!best || pr.hargaFinal < best.hargaFinal) {
      best = pr;
    }
  });

  // fallback jika entah kenapa best masih null
  if (!best) {
    const pr = computeHargaSetelahPromo(p);
    best = { ...pr, hargaAsli: pr.hargaAsli, hargaFinal: pr.hargaFinal, promoLabel: pr.promoLabel };
  }

  // badge promo pakai kalkulasi best
  const isPromo = best.hargaFinal < best.hargaAsli;
  const promoPct =
    isPromo && best.hargaAsli > 0
      ? Math.round((1 - best.hargaFinal / best.hargaAsli) * 100)
      : 0;
  const promoLabel = isPromo && promoPct > 0 ? `-${promoPct}%` : best.promoLabel;

  return { ...best, isPromo, promoLabel };
}



export default function DaftarProdukPage() {

  const router = useRouter();



  // ========== UI STATE ==========
  const { isDarkMode: isDark } = useAdminTheme();




  // ========== DATA STATE ==========

  const [products, setProducts] = useState<Product[]>([]);

  const [loading, setLoading] = useState(true);

  const [savingOrder, setSavingOrder] = useState(false);

  const [droppingAll, setDroppingAll] = useState(false);

  const [dropProgress, setDropProgress] = useState<{ done: number; total: number } | null>(null);

  const [error, setError] = useState<string | null>(null);



  // ===== UI POPUP (Confirm + Message) & Toast =====

  type ConfirmTone = "primary" | "danger";

  type ConfirmState = {

    open: boolean;

    title: string;

    description: string;

    confirmText: string;

    cancelText: string;

    tone: ConfirmTone;

  };



  type MessageState = {

    open: boolean;

    title: string;

    description: string;

    detail: string;

    okText: string;

  };



  type ToastType = "success" | "error" | "info";

  type ToastItem = { id: string; type: ToastType; message: string };



  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const confirmResolveRef = useRef<((v: boolean) => void) | null>(null);



  const [messageState, setMessageState] = useState<MessageState | null>(null);



  const [toasts, setToasts] = useState<ToastItem[]>([]);



  function pushToast(message: string, type: ToastType = "info") {

    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setToasts((prev) => [...prev, { id, type, message }]);

    window.setTimeout(() => {

      setToasts((prev) => prev.filter((t) => t.id !== id));

    }, 3500);

  }



  function removeToast(id: string) {

    setToasts((prev) => prev.filter((t) => t.id !== id));

  }



  function openMessage(opts: Omit<MessageState, "open">) {

    setMessageState({ open: true, ...opts });

  }



  function openConfirm(opts: Omit<ConfirmState, "open">) {

    return new Promise<boolean>((resolve) => {

      confirmResolveRef.current = resolve;

      setConfirmState({ open: true, ...opts });

    });

  }



  function closeConfirm(result: boolean) {

    if (confirmResolveRef.current) {

      confirmResolveRef.current(result);

      confirmResolveRef.current = null;

    }

    setConfirmState(null);

  }

  const [search, setSearch] = useState("");

  const [draggingId, setDraggingId] = useState<number | null>(null);



  // ========== PREVIEW STATE ==========

  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const [previewIndex, setPreviewIndex] = useState(0);
  const [selectedVarId, setSelectedVarId] = useState<number | null>(null);
  const [selectedComboIds, setSelectedComboIds] = useState<Record<number, string | null>>({
    1: null,
    2: null,
    3: null,
  });

  const cleanLabel = (text?: string | null) =>
    (text ?? "")
      .replace(/__dedup\d+/gi, "")
      .replace(/#\d+/g, "")
      .trim();



  // ========== LOAD DATA DARI API ==========

  async function fetchProducts() {

    try {

      setLoading(true);

      setError(null);



      const res = await fetch(

        "/api/admin/admin_dashboard/admin_produk/daftar_produk",

        { cache: "no-store" }

      );



      if (!res.ok) {

        throw new Error("Gagal memuat daftar produk");

      }



      const data = (await res.json()) as { products: Product[] };

      setProducts(data.products ?? []);

    } catch (err: any) {

      console.error(err);

      setError(err?.message ?? "Terjadi kesalahan saat memuat produk.");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => {

    fetchProducts();

  }, []);



  // ========== FILTER PENCARIAN ==========

  const filteredProducts = useMemo(() => {

    if (!search.trim()) return products;

    const q = search.toLowerCase();



    return products.filter((p) => {

      return (

        p.nama.toLowerCase().includes(q) ||

        (p.slug || "").toLowerCase().includes(q) ||

        (p.kategori || "").toLowerCase().includes(q) ||

        (p.subkategori || "").toLowerCase().includes(q)

      );

    });

  }, [products, search]);



  // ========== DRAG & DROP URUTAN ==========

  const handleDragStart = (id: number) => {

    if (droppingAll) return;

    setDraggingId(id);

  };



  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: number) => {

    if (droppingAll) return;

    e.preventDefault();

    if (!draggingId || draggingId === targetId) return;



    setProducts((prev) => {

      const fromIndex = prev.findIndex((p) => p.id === draggingId);

      const toIndex = prev.findIndex((p) => p.id === targetId);

      if (fromIndex === -1 || toIndex === -1) return prev;



      const next = [...prev];

      const [moved] = next.splice(fromIndex, 1);

      next.splice(toIndex, 0, moved);

      return next;

    });

  };



  const handleDrop = async () => {

    if (droppingAll) return;

    if (!draggingId) return;

    setDraggingId(null);



    try {

      setSavingOrder(true);

      const orderedIds = products.map((p) => p.id);



      await fetch(

        "/api/admin/admin_dashboard/admin_produk/daftar_produk_urutan",

        {

          method: "PUT",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ orderedIds }),

        }

      );

    } catch (err) {

      console.error(err);

      // kalau gagal, reload ulang biar urutan balik

      fetchProducts();

    } finally {

      setSavingOrder(false);

    }

  };



  // ========== AKSI EDIT / HAPUS ==========

  const handleEdit = (id: number) => {

    router.push(`/admin/admin_dashboard/admin_produk/tambah_produk?id=${id}`);

  };



  const handleDelete = async (id: number) => {

    const ok = await openConfirm({

      title: "Hapus produk",

      description: "Yakin ingin menghapus produk ini> Tindakan ini tidak bisa dibatalkan.",

      confirmText: "Hapus",

      cancelText: "Batal",

      tone: "danger",

    });

    if (!ok) return;



    try {

      const res = await fetch(

        `/api/admin/admin_dashboard/admin_produk/${id}`,

        { method: "DELETE" }

      );



      if (!res.ok) {

        throw new Error("Gagal menghapus produk");

      }



      setProducts((prev) => prev.filter((p) => p.id !== id));

    } catch (err: any) {

      pushToast(err?.message ?? "Gagal menghapus produk.", "error");

    }

  };





  const handleDropAll = async () => {

    if (droppingAll) return;



    if (!products.length) {

      pushToast("Tidak ada produk untuk dihapus.", "info");

      return;

    }



    const ok = await openConfirm({

      title: "Hapus semua produk",

      description: `Ini akan menghapus SEMUA produk (total: ${products.length}) dan tidak bisa dibatalkan.`,

      confirmText: "Hapus semua",

      cancelText: "Batal",

      tone: "danger",

    });

    if (!ok) return;



    // tutup preview biar aman kalau lagi kebuka

    closePreview();



    const failedIds: number[] = [];

    const failedErrors: string[] = [];



    // Validasi ID dulu (hindari HTTP 400 "ID tidak valid")

    const rawIds = products.map((p) => (p as any).id);

    const ids: number[] = [];

    const invalidIdStrings: string[] = [];

    for (const v of rawIds) {

      const n = Number(v);

      if (Number.isFinite(n) && n > 0) ids.push(n);

      else invalidIdStrings.push(String(v));

    }



    if (invalidIdStrings.length) {

      failedErrors.push(

        ...invalidIdStrings.map((v) => `ID tidak valid (frontend): ${v}`)

      );

    }



    if (!ids.length) {

      openMessage({

        title: "Drop all dibatalkan",

        description: "Tidak ada ID produk valid untuk dihapus.",

        detail: invalidIdStrings.length

          ? invalidIdStrings.slice(0, 50).join("\n")

          : "ID produk kosong/invalid.",

        okText: "Oke",

      });

      return;

    }



    try {

      setDroppingAll(true);

      setDropProgress({ done: 0, total: ids.length });



      for (const id of ids) {

        try {

          const res = await fetch(`/api/admin/admin_dashboard/admin_produk/${id}`, {

            method: "DELETE",

          });



          if (!res.ok) {

            let body = "";

            try {

              body = await res.text();

            } catch { }



            throw new Error(

              body?.trim()

                ? `HTTP ${res.status}: ${body}`

                : `HTTP ${res.status}: Gagal menghapus produk`

            );

          }

        } catch (err: any) {

          console.error(err);

          failedIds.push(id);

          failedErrors.push(`ID ${id}  ${err?.message ?? "Unknown error"}`);

        } finally {

          setDropProgress((prev) =>

            prev ? { ...prev, done: prev.done + 1 } : prev

          );

        }

      }



      if (failedIds.length === 0) {

        setProducts([]);

        pushToast("Drop all selesai. Semua produk terhapus.", "success");

      } else {

        await fetchProducts();



        const maxLines = 30;

        const detail =

          failedErrors.slice(0, maxLines).join("\n") +

          (failedErrors.length > maxLines

            ? `\n...dan ${failedErrors.length - maxLines} error lagi`

            : "");



        openMessage({

          title: "Drop all selesai",

          description: `Ada ${failedIds.length} produk yang gagal dihapus.`,

          detail,

          okText: "Oke",

        });

      }

    } finally {

      setDroppingAll(false);

      setDropProgress(null);

    }

  };





  // ========== PREVIEW GALLERY ==========

  const currentPreviewImages = useMemo(() => {
    if (!previewProduct) return [] as string[];

    const arr: string[] = [];

    if (previewProduct.mainImageUrl) {
      arr.push(previewProduct.mainImageUrl);
    }

    if (previewProduct.galleryImageUrls?.length) {
      arr.push(...previewProduct.galleryImageUrls.filter((url): url is string => !!url));
    }

    if (previewProduct.variations?.length) {
      previewProduct.variations.forEach((v) => {
        if (v.imageUrl) arr.push(v.imageUrl);
        if (v.galleryUrls?.length) {
          arr.push(...v.galleryUrls.filter((u): u is string => !!u));
        }
        if (v.combos?.length) {
          v.combos.forEach((c) => {
            if (c.imageUrl) arr.push(c.imageUrl);
          });
        }
      });
    }

    return arr;
  }, [previewProduct]);


  const openPreview = (product: Product, index: number) => {

    setPreviewProduct(product);

    setPreviewIndex(index);
    const firstVar = product.variations?.[0];
    setSelectedVarId(firstVar ? firstVar.id : null);
    setSelectedComboIds({ 1: null, 2: null, 3: null });

  };

  const focusPreviewImage = (url?: string) => {
    if (!url) return;
    setPreviewIndex((prev) => {
      const idx = currentPreviewImages.findIndex((u) => u === url);
      return idx >= 0 ? idx : prev;
    });
  };

  // reset selection when product changes
  useEffect(() => {
    if (!previewProduct) {
      setSelectedVarId(null);
      setSelectedComboIds({ 1: null, 2: null, 3: null });
      return;
    }
    const firstVar = previewProduct.variations?.[0];
    setSelectedVarId(firstVar ? firstVar.id : null);
    setSelectedComboIds({ 1: null, 2: null, 3: null });
  }, [previewProduct]);

  const currentVar = useMemo(() => {
    if (!previewProduct || !selectedVarId) return null;
    return previewProduct.variations.find((v) => v.id === selectedVarId) ?? null;
  }, [previewProduct, selectedVarId]);

  const currentCombosByLevel = useMemo(() => {
    if (!currentVar) return {};
    const byLevel: Record<number, Variation["combos"]> = { 1: [], 2: [], 3: [] };
    currentVar.combos.forEach((c) => {
      if (!byLevel[c.level]) byLevel[c.level] = [];
      byLevel[c.level].push(c);
    });
    return byLevel;
  }, [currentVar]);

  const selectCombo = (level: number, id: number | null) => {
    setSelectedComboIds((prev) => ({ ...prev, [level]: id !== null ? String(id) : null }));
  };

  // Set default combo selection (first item per level) when variasi berubah
  useEffect(() => {
    if (!currentVar) return;
    setSelectedComboIds((prev) => {
      const next = { ...prev };
      [1, 2, 3].forEach((lvl) => {
        const list = currentCombosByLevel[lvl] || [];
        if (!list.length) {
          next[lvl] = null;
          return;
        }
        // only set default if not chosen yet or belongs to different variasi (id mismatch)
        const already = prev[lvl];
        const exists = list.some((c) => String(c.id) === String(already));
        next[lvl] = exists ? already : String(list[0].id);
      });
      return next;
    });
  }, [currentVar, currentCombosByLevel]);

  const previewPrice = useMemo(() => {
    if (!previewProduct) return null;
    const baseProductPromo = computeHargaSetelahPromo(previewProduct);
    if (!currentVar) return baseProductPromo;

    const hasVarHarga = currentVar.harga && Number(currentVar.harga) > 0;
    const varPromoOn = !!currentVar.promoAktif && Number(currentVar.promoValue ?? 0) > 0;
    const useVarPromo = currentVar && (hasVarHarga || varPromoOn);
    const baseHarga = hasVarHarga ? Number(currentVar.harga) : Number(previewProduct.harga);

    const promoSource = useVarPromo ? currentVar : previewProduct;
    const baseCalc = computeHargaSetelahPromo({
      harga: baseHarga,
      promoAktif: promoSource.promoAktif,
      promoTipe: promoSource.promoTipe,
      promoValue: promoSource.promoValue,
    });

    let totalAsli = baseCalc.hargaAsli;
    let totalFinal = baseCalc.hargaFinal;

    [1, 2, 3].forEach((lvl) => {
      const cid = selectedComboIds[lvl];
      if (!cid) return;
      const list = currentCombosByLevel[lvl] || [];
      const found = list.find((c) => String(c.id) === String(cid));
      if (!found) return;

      const addBase = Number(found.tambahHarga) || 0;
      const addCalc = computeHargaSetelahPromo({
        harga: addBase,
        promoAktif: found.promoAktif ?? null,
        promoTipe: found.promoTipe ?? null,
        promoValue: found.promoValue ?? null,
      });
      totalAsli += addCalc.hargaAsli;
      totalFinal += addCalc.hargaFinal;
    });

    totalFinal = Math.max(0, totalFinal);

    const isPromo = totalFinal < totalAsli;
    const promoPct = isPromo && totalAsli > 0 ? Math.round((1 - totalFinal / totalAsli) * 100) : 0;
    const promoLabel = isPromo && promoPct > 0 ? `-${promoPct}%` : baseProductPromo.promoLabel;

    return {
      ...baseProductPromo,
      hargaFinal: totalFinal,
      hargaAsli: totalAsli,
      isPromo,
      promoLabel,
    };
  }, [previewProduct, currentVar, selectedComboIds, currentCombosByLevel]);



  const closePreview = () => {

    setPreviewProduct(null);

    setPreviewIndex(0);

  };



  const showPrevImage = () => {
    if (!currentPreviewImages.length) return;
    setPreviewIndex(
      (prev) =>
        (prev - 1 + currentPreviewImages.length) % currentPreviewImages.length
    );
  };

  const showNextImage = () => {
    if (!currentPreviewImages.length) return;
    setPreviewIndex(
      (prev) => (prev + 1) % currentPreviewImages.length
    );
  };

  // swipe gesture (mobile) + drag (desktop)
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
    touchDeltaX.current = 0;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const cur = e.touches[0]?.clientX ?? touchStartX.current;
    touchDeltaX.current = cur - touchStartX.current;
  };
  const onTouchEnd = () => {
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    touchDeltaX.current = 0;
    const THRESH = 40;
    if (dx > THRESH) showPrevImage();
    else if (dx < -THRESH) showNextImage();
  };

  const mouseDownRef = useRef(false);
  const mouseStartX = useRef<number | null>(null);
  const mouseDeltaX = useRef(0);
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseDownRef.current = true;
    mouseStartX.current = e.clientX;
    mouseDeltaX.current = 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!mouseDownRef.current || mouseStartX.current == null) return;
    mouseDeltaX.current = e.clientX - mouseStartX.current;
  };
  const onMouseUp = () => {
    if (!mouseDownRef.current) return;
    const dx = mouseDeltaX.current;
    mouseDownRef.current = false;
    mouseStartX.current = null;
    mouseDeltaX.current = 0;
    const THRESH = 40;
    if (dx > THRESH) showPrevImage();
    else if (dx < -THRESH) showNextImage();
  };

  // ========== WRAPPER CLASS (SIANG / MALAM) ==========
  const wrapperClass = `${styles.wrapper} ${isDark ? styles.wrapperDark : styles.wrapperLight

    }`;



  // ========== RENDER ==========

  return (

    <div style={{ width: '100%' }} onDragEnd={droppingAll ? undefined : handleDrop}>

      {/* SIDEBAR */}





      {/* OVERLAY MOBILE */}





      {/* MAIN */}



      {/* TOPBAR MOBILE */}





      {/* BRAND DESKTOP (KANAN ATAS) */}





      {/* HEADER */}

      <header className={styles.header}>

        <h1 className={styles.pageTitle}>Daftar Produk</h1>

        <p className={styles.pageSubtitle}>

          Atur urutan, edit, dan hapus produk. Drag &amp; drop untuk mengatur

          posisi tampil di website.

        </p>



        <div className={styles.headerRight}>

          <input

            type="text"
            className={`${styles.searchInput} ${isDark ? styles.searchInputDark : ""}`}
            placeholder="Cari nama / kategori..."
            value={search}
            disabled={droppingAll}
            onChange={(e) => setSearch(e.target.value)}

          />

          <button

            type="button"

            className={styles.primaryButton}

            disabled={droppingAll}

            onClick={() =>

              router.push(

                "/admin/admin_dashboard/admin_produk/tambah_produk"

              )

            }>
            + Tambah Produk

          </button>

          <button

            type="button"

            className={styles.dangerButton}

            disabled={loading || !!error || droppingAll || products.length === 0}

            onClick={handleDropAll}

            title={

              products.length === 0

                ? "Tidak ada produk"

                : "Hapus semua produk sekaligus"

            }>

            Drop All
          </button>

        </div>

      </header>



      {/* STATUS BAR */}

      {loading && (

        <p className={styles.infoText}>Memuat produk...</p>

      )}



      {error && (

        <div className={styles.errorBox}>

          <span>{error}</span>

          <button

            type="button"

            className={styles.retryButton}

            onClick={() => fetchProducts()}>

            Coba lagi
          </button>

        </div>

      )}



      {/* LIST PRODUK */}

      {!loading && !error && (

        <div className={styles.list}>

          {filteredProducts.map((p) => {

            const images: string[] = [];
            const variationImages: string[] = [];
            const variationCount = Array.isArray(p.variations) ? p.variations.length : 0;
            const comboLevelsCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 };

            (p.variations || []).forEach((v) => {
              if (v.imageUrl) variationImages.push(v.imageUrl);
              if (v.galleryUrls?.length) {
                variationImages.push(...v.galleryUrls.filter((u): u is string => !!u));
              }
              (v.combos || []).forEach((c) => {
                if (c.imageUrl) variationImages.push(c.imageUrl);
                if (c.level && comboLevelsCount[c.level] !== undefined) {
                  comboLevelsCount[c.level] += 1;
                }
              });
            });


            if (p.mainImageUrl) {

              images.push(p.mainImageUrl);

            }



            if (p.galleryImageUrls && p.galleryImageUrls.length) {

              images.push(

                ...p.galleryImageUrls.filter(

                  (url): url is string => !!url

                )

              );

            }


            if (variationImages.length) {
              images.push(...variationImages);
            }


            const mediaCount =
              p.mediaCount && p.mediaCount > 0 ? p.mediaCount : images.length;

            const pr = computeBestPriceForProduct(p);



            return (

              <div
                key={p.id}
                className={`${styles.item} ${isDark ? styles.itemDark : ""} ${draggingId === p.id ? styles.itemDragging : ""
                  }`}
                draggable
                onDragStart={() => handleDragStart(p.id)}
                onDragOver={(e) => handleDragOver(e, p.id)}
              >
                <div className={styles.dragHandle}>::</div>



                {/* THUMBNAIL / CAROUSEL MEDIA */}

                <div className={styles.thumbWrapper}>

                  {images.length ? (

                    <div className={styles.thumbCarousel}>

                      {images.map((url, idx) => (

                        <button

                          key={idx}

                          type="button"

                          className={styles.thumbSlide}

                          onClick={() => openPreview(p, idx)}>

                          {/* eslint-disable-next-line @next/next/no-img-element */}

                          <img

                            src={url}

                            alt={`${p.nama} ${idx + 1}`}

                            className={styles.thumb}

                          />

                        </button>

                      ))}

                    </div>

                  ) : (

                    <div className={styles.thumbPlaceholder}>No Image</div>

                  )}



                  {mediaCount > 0 && (

                    <div className={styles.mediaBadge}>

                      | {mediaCount} foto

                    </div>

                  )}

                </div>



                {/* KONTEN & AKSI */}

                <div className={styles.cardContent}>

                  <div className={styles.cardText}>

                    <div className={styles.productName}>{p.nama}</div>

                    <div className={styles.productCategory}>

                      {p.kategori}

                      {p.subkategori ? " > " + p.subkategori : ""}

                    </div>

                    <div className={styles.productPrice}>

                      {pr.isPromo ? (

                        <>

                          <span style={{ fontWeight: 800 }}>

                            {formatRupiah(pr.hargaFinal)}

                          </span>

                          <span

                            style={{

                              marginLeft: 10,

                              textDecoration: "line-through",

                              opacity: 0.6,

                            }}>

                            {formatRupiah(pr.hargaAsli)}
                          </span>

                          <span style={{ marginLeft: 10, fontWeight: 800 }}>

                            {pr.promoLabel}

                          </span>

                          {" | "}ID {p.id}

                        </>

                      ) : (

                        <>

                          Rp {p.harga.toLocaleString("id-ID")} | ID {p.id}

                        </>
                      )}

                      {mediaCount > 0 && (
                        <span className={styles.productMediaInfo}>
                          | {mediaCount} foto
                          {variationCount > 0 ? ` · ${variationCount} variasi` : ""}
                          {comboLevelsCount[1] > 0 ? ` · Lv1 ${comboLevelsCount[1]}` : ""}
                          {comboLevelsCount[2] > 0 ? ` · Lv2 ${comboLevelsCount[2]}` : ""}
                          {comboLevelsCount[3] > 0 ? ` · Lv3 ${comboLevelsCount[3]}` : ""}
                        </span>
                      )}



                    </div>

                  </div>



                  <div className={styles.cardActions}>

                    <button

                      type="button"

                      className={styles.editButton}

                      onClick={() => handleEdit(p.id)}

                      disabled={droppingAll}>

                      Edit
                    </button>

                    <button

                      type="button"

                      className={styles.deleteButton}

                      onClick={() => handleDelete(p.id)}

                      disabled={droppingAll}>

                      Hapus
                    </button>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      )}



      {savingOrder && (

        <p className={styles.infoText}>Menyimpan urutan produk...</p>

      )}



      {droppingAll && dropProgress && (

        <p className={styles.infoText}>

          Menghapus semua produk... ({dropProgress.done}/{dropProgress.total})

        </p>

      )}



      {/* MODAL PREVIEW MEDIA + INFO PRODUK */}

      {previewProduct && currentPreviewImages.length > 0 && (

        <div

          className={styles.previewOverlay}

          onClick={closePreview}>
          <div

            className={styles.previewModal}

            onClick={(e) => e.stopPropagation()}>
            <button

              type="button"

              className={styles.previewClose}

              onClick={closePreview}>
              &times;
            </button>



            {/* BAGIAN GAMBAR */}

            <div className={styles.previewImageBox}>

              {/* eslint-disable-next-line @next/next/no-img-element */}

              <img
                src={currentPreviewImages[previewIndex]}
                alt={`${previewProduct.nama} preview`}
                className={styles.previewImage}
                draggable={false}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />


              {currentPreviewImages.length > 1 && (
                <div className={styles.previewControls}>
                  <div className={styles.previewThumbStrip}>
                    {currentPreviewImages.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`${styles.previewThumb} ${idx === previewIndex ? styles.previewThumbActive : ""
                          }`}
                        onClick={() => setPreviewIndex(idx)}
                        aria-label={`Gambar ${idx + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`${previewProduct.nama} ${idx + 1}`} />
                      </button>
                    ))}
                  </div>
                  <div className={styles.previewNavHit} aria-hidden="true">
                    <button
                      type="button"
                      className={styles.previewNavCircle}
                      onClick={showPrevImage}
                      aria-label="Prev"
                    >
                      &lsaquo;
                    </button>
                    <span className={styles.previewNavCounter}>
                      {previewIndex + 1} / {currentPreviewImages.length}
                    </span>
                    <button
                      type="button"
                      className={styles.previewNavCircle}
                      onClick={showNextImage}
                      aria-label="Next"
                    >
                      &rsaquo;
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.previewInfo}>

              <h3 className={styles.previewTitle}>{previewProduct.nama}</h3>

              <p className={styles.previewCategory}>

                {previewProduct.kategori || "-"}

                {previewProduct.subkategori

                  ? "  " + previewProduct.subkategori

                  : ""}

              </p>

              {previewProduct.variations && previewProduct.variations.length > 0 && (
                <div className={styles.variationPills}>
                  {previewProduct.variations.map((v) => {
                    const isActiveVar = selectedVarId === v.id;
                    const thumb =
                      v.imageUrl ||
                      v.galleryUrls?.find((u) => !!u) ||
                      v.combos?.find((c) => c.imageUrl)?.imageUrl ||
                      null;
                    const label = cleanLabel(v.nama) || `Variasi ${v.id}`;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        className={`${styles.variationPill} ${isActiveVar ? styles.variationPillActive : ""
                          }`}
                        onClick={() => {
                          setSelectedVarId(v.id);
                          setSelectedComboIds({ 1: null, 2: null, 3: null });
                          focusPreviewImage(thumb || undefined);
                        }}
                      >
                        {thumb ? (
                          <span className={styles.variationPillThumb}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumb} alt={label} />
                          </span>
                        ) : null}
                        <span className={styles.variationPillName}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentVar && (
                <div className={styles.comboPills} style={{ marginTop: 6 }}>
                  {[1, 2, 3].map((lvl) => {
                    const list = currentCombosByLevel[lvl] || [];
                    if (!list.length) return null;
                    return (
                      <div key={lvl} className={styles.comboGroup}>
                        <div className={styles.comboList}>
                          {list.map((c) => {
                            const cid = String(c.id);
                            const isActive = selectedComboIds[lvl]
                              ? String(selectedComboIds[lvl]) === cid
                              : false;
                            return (
                              <button
                                type="button"
                                key={cid}
                                className={`${styles.variationPill} ${isActive ? styles.variationPillActive : ""
                                  }`}
                                onClick={() => {
                                  selectCombo(lvl, isActive ? null : Number(cid));
                                  if (c.imageUrl) focusPreviewImage(c.imageUrl);
                                }}
                              >
                                {c.imageUrl ? (
                                  <span className={styles.variationPillThumb}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={c.imageUrl} alt={c.nama || c.nilai} />
                                  </span>
                                ) : null}
                                <span className={styles.variationPillName}>
                                  {cleanLabel(c.nilai || c.nama) || `Lv${lvl}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={styles.previewPrice}>
                {(() => {
                  const pr = previewPrice || computeHargaSetelahPromo(previewProduct);
                  return (
                    <>
                      {pr.isPromo ? (
                        <>
                          <span style={{ fontWeight: 800 }}>
                            {formatRupiah(pr.hargaFinal)}
                          </span>
                          <span
                            style={{
                              marginLeft: 10,
                              textDecoration: "line-through",
                              opacity: 0.7,
                            }}>
                            {formatRupiah(pr.hargaAsli)}
                          </span>
                          <span
                            style={{
                              marginLeft: 10,
                              fontSize: 12,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 999,
                              border: "1px solid currentColor",
                              opacity: 0.9,
                              display: "inline-block",
                            }}>
                            {pr.promoLabel}
                          </span>
                        </>
                      ) : (
                        <span>{formatRupiah(pr.hargaAsli)}</span>
                      )}
                      <span style={{ marginLeft: 10 }}>
                        ID {previewProduct.id}
                      </span>
                    </>
                  );
                })()}
              </p>

              {previewProduct.deskripsiSingkat && (
                <p className={styles.previewDesc}>
                  {previewProduct.deskripsiSingkat}
                </p>
              )}

              <div className={styles.previewSpecs}>
                {(() => {
                  const parts: Array<{ label: string; value: string }> = [];
                  const dim = [
                    previewProduct.panjang,
                    previewProduct.lebar,
                    previewProduct.tinggi,
                  ].filter((n) => Number.isFinite(n) && (n as number) > 0) as number[];
                  if (dim.length === 3) {
                    parts.push({
                      label: "Dimensi",
                      value: `${dim[0]} x ${dim[1]} x ${dim[2]} cm`,
                    });
                  }
                  if (previewProduct.berat && previewProduct.berat > 0) {
                    parts.push({
                      label: "Berat",
                      value: `${previewProduct.berat} kg`,
                    });
                  }
                  if (previewProduct.material) {
                    parts.push({ label: "Material", value: previewProduct.material });
                  }
                  if (previewProduct.finishing) {
                    parts.push({ label: "Finishing", value: previewProduct.finishing });
                  }
                  if (previewProduct.warna) {
                    parts.push({ label: "Warna", value: previewProduct.warna });
                  }
                  if (previewProduct.tipeOrder) {
                    parts.push({ label: "Tipe Order", value: previewProduct.tipeOrder });
                  }
                  if (previewProduct.estimasiPengerjaan) {
                    parts.push({
                      label: "Estimasi",
                      value: previewProduct.estimasiPengerjaan,
                    });
                  }
                  if (previewProduct.jasaPasang) {
                    parts.push({
                      label: "Jasa Pasang",
                      value: previewProduct.jasaPasang,
                    });
                  }
                  parts.push({
                    label: "Custom",
                    value: previewProduct.isCustom ? "Bisa full custom" : "Non custom",
                  });
                  parts.push({
                    label: "Ukuran custom",
                    value: previewProduct.bisaCustomUkuran ? "Bisa" : "Tidak",
                  });

                  return parts.map((item) => (
                    <div key={item.label} className={styles.specRow}>
                      <span className={styles.specLabel}>{item.label}</span>
                      <span className={styles.specValue}>{item.value}</span>
                    </div>
                  ));
                })()}
              </div>

              {previewProduct.tags && (
                <div className={styles.previewTags}>
                  {previewProduct.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className={styles.tagChip}>
                        {tag}
                      </span>
                    ))}
                </div>
              )}

              {previewProduct.variations && previewProduct.variations.length > 0 && (
                <div className={styles.variationSection}>
                  <div className={styles.variationTitle}>Variasi</div>
                  <div className={styles.variationList} />
                </div>
              )}

              <p className={styles.previewHint}>
                Ini preview media & info singkat. Untuk edit detail lengkap,
                gunakan tombol <b>Edit</b> di kartu produk.
              </p>
            </div>
          </div>
        </div>
      )}






      {/* Toasts */}

      {
        toasts.length > 0 && (

          <div className={styles.toastWrap} aria-live="polite">

            {toasts.map((t) => (

              <div

                key={t.id}

                className={[

                  styles.toast,

                  t.type === "success"

                    ? styles.toastSuccess

                    : t.type === "error"

                      ? styles.toastError

                      : styles.toastInfo,

                ].join(" ")}>
                <div className={styles.toastMsg}>{t.message}</div>

                <button

                  className={styles.toastClose}

                  onClick={() => removeToast(t.id)}

                  aria-label="Tutup"

                  type="button">
                </button>

              </div>

            ))}

          </div>

        )
      }



      {/* Confirm Modal */}

      {
        confirmState?.open && (

          <div className={styles.confirmOverlay} role="presentation">

            <div className={styles.confirmCard} role="dialog" aria-modal="true">

              <div className={styles.confirmHead}>

                <div className={styles.confirmTitle}>{confirmState.title}</div>

                <button

                  className={styles.confirmClose}

                  type="button"

                  onClick={() => closeConfirm(false)}

                  aria-label="Tutup">
                </button>

              </div>



              {confirmState.description && (

                <div className={styles.confirmDesc}>{confirmState.description}</div>

              )}



              <div className={styles.confirmActions}>

                <button

                  className={styles.editButton}

                  type="button"

                  onClick={() => closeConfirm(false)}>

                  {confirmState.cancelText ?? "Batal"}
                </button>

                <button

                  className={

                    confirmState.tone === "danger"

                      ? styles.deleteButton

                      : styles.primaryButton

                  }

                  type="button"

                  onClick={() => closeConfirm(true)}>

                  {confirmState.confirmText ?? "OK"}
                </button>

              </div>

            </div>

          </div>

        )
      }



      {/* Message Modal */}

      {
        messageState?.open && (

          <div className={styles.confirmOverlay} role="presentation">

            <div className={styles.messageCard} role="dialog" aria-modal="true">

              <div className={styles.confirmHead}>

                <div className={styles.confirmTitle}>{messageState.title}</div>

                <button

                  className={styles.confirmClose}

                  type="button"

                  onClick={() => setMessageState(null)}

                  aria-label="Tutup">
                </button>

              </div>



              {messageState.description && (

                <div className={styles.confirmDesc}>{messageState.description}</div>

              )}



              {messageState.detail && (

                <pre className={styles.messageDetail}>{messageState.detail}</pre>

              )}



              <div className={styles.confirmActions}>

                <button

                  className={styles.primaryButton}

                  type="button"

                  onClick={() => setMessageState(null)}>

                  {messageState.okText ?? "Oke"}
                </button>

              </div>

            </div>

          </div>

        )
      }

    </div >

  );

}

