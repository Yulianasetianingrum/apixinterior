"use client";

import React, { useState } from "react";

type SectionItem = {
  id: number;
  title: string;
  type: string;
  enabled: boolean;
};

const TYPE_LABEL: Record<string, string> = {
  HERO: "Hero / Banner Utama",
  CATEGORY_GRID: "Grid Kategori Produk",
  CATEGORY_GRID_COMMERCE: "Grid Category Commerce",
  PRODUCT_CAROUSEL: "Carousel Produk",
  PRODUCT_LISTING: "Product Listing",
  HIGHLIGHT_COLLECTION: "Koleksi Furnitur & Dekor Pilihan",
  ROOM_CATEGORY: "Kategori Ruangan",
  GALLERY: "Galeri / Kolase Foto Proyek",
  BRANCHES: "Cabang Toko / Showroom",
  CONTACT: "Hubungi Kami",
  SOCIAL: "Media Sosial",
  CUSTOM_PROMO: "Custom / Promo Section",
};

export default function SectionsReorderClient({
  sections,
}: {
  sections: SectionItem[];
}) {
  const [items, setItems] = useState<SectionItem[]>(sections);
  const [saving, setSaving] = useState(false);

  const handleDragStart =
    (fromIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData("text/plain", String(fromIndex));
    };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // wajib supaya onDrop kepanggil
    e.preventDefault();
  };

  const handleDrop =
    (toIndex: number) => (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const fromIndexRaw = e.dataTransfer.getData("text/plain");
      const fromIndex = Number(fromIndexRaw);
      if (Number.isNaN(fromIndex) || fromIndex === toIndex) return;

      setItems((prev) => {
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        return next;
      });
    };

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch(
        "/api/admin/admin_dashboard/admin_pengaturan/toko/reorder",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ids: items.map((i) => i.id),
          }),
        }
      );

      if (!res.ok) {
        console.error("Gagal simpan urutan");
        setSaving(false);
        return;
      }

      // reload supaya server component kebaca urutan baru
      window.location.reload();
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Urutan Section (Drag & Drop)</p>
          <p className="text-[11px] text-gray-500">
            Tarik handle <span className="font-mono"></span> ke atas/bawah
            untuk mengubah urutan section di homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-black text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan Urutan"}
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={handleDrop(index)}
            className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2 text-xs cursor-grab touch-none"
          >
            <div className="flex items-center gap-2">
              {/* HANDLE :: /  */}
              <span
                className="font-mono text-lg leading-none text-gray-400 select-none"
                aria-hidden="true"
              >
                
              </span>
              <span className="w-4 text-[11px] text-gray-400 text-right">
                {index + 1}
              </span>
              <div className="flex flex-col">
                <span className="font-medium">{item.title}</span>
                <span className="text-[11px] text-gray-500">
                  {TYPE_LABEL[item.type] ?? item.type}
                </span>
              </div>
            </div>
            <span
              className={
                "text-[11px] rounded-full px-2 py-0.5 border " +
                (item.enabled
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                  : "border-gray-200 text-gray-500 bg-white")
              }
            >
              {item.enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

