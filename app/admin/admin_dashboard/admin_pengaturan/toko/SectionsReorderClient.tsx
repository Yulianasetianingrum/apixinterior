"use client";

import React, { useState, useEffect } from "react";
import { FaGripVertical } from "react-icons/fa6";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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
  TESTIMONIALS: "Ulasan / Testimoni",
  FOOTER: "Footer",
};

export default function SectionsReorderClient({
  sections,
}: {
  sections: SectionItem[];
}) {
  const [items, setItems] = useState<SectionItem[]>(sections);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Strict mode fix for dnd
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (sourceIndex === destinationIndex) return;

    const newItems = Array.from(items);
    const [moved] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, moved);

    setItems(newItems);
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

  if (!enabled) {
    return (
      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Urutan Section (Drag & Drop)</p>
            <p className="text-[11px] text-gray-500">Memuat fitur drag & drop...</p>
          </div>
        </div>
      </div>
    );
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

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center justify-between rounded-lg border px-3 py-3 text-xs ${snapshot.isDragging ? "bg-blue-50 border-blue-200 shadow-lg z-50" : "bg-gray-50 border-gray-200"
                        }`}
                      style={{
                        ...provided.draggableProps.style,
                        touchAction: "none" // Crucial for mobile
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* HANDLE */}
                        <div
                          {...provided.dragHandleProps}
                          className="text-gray-400 hover:text-gray-600 p-2 -ml-2 cursor-grab active:cursor-grabbing touch-none"
                          style={{ touchAction: "none" }}
                          aria-label="Drag handle"
                        >
                          <FaGripVertical size={16} />
                        </div>

                        <span className="w-5 text-[11px] text-gray-400 text-right flex-shrink-0">
                          {index + 1}
                        </span>

                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="font-medium truncate">{item.title || "(Tanpa Judul)"}</span>
                          <span className="text-[10px] text-gray-500 truncate">
                            {TYPE_LABEL[item.type] ?? item.type}
                          </span>
                        </div>
                      </div>

                      <span
                        className={
                          "text-[10px] rounded-full px-2 py-0.5 border ml-2 flex-shrink-0 " +
                          (item.enabled
                            ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                            : "border-gray-200 text-gray-500 bg-white")
                        }
                      >
                        {item.enabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

