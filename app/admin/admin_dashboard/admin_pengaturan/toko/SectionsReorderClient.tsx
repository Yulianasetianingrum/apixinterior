"use client";

import React, { useState, useEffect, useRef } from "react";
import { FaGripVertical, FaLock, FaLockOpen } from "react-icons/fa6";
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

const LONG_PRESS_DURATION = 2000; // 2 seconds

export default function SectionsReorderClient({
  sections,
}: {
  sections: SectionItem[];
}) {
  const [items, setItems] = useState<SectionItem[]>(sections);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [dragModeActive, setDragModeActive] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const [pressingItemId, setPressingItemId] = useState<number | null>(null);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Strict mode fix for dnd
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const startLongPress = (itemId: number, event: React.MouseEvent | React.TouchEvent) => {
    if (dragModeActive) return; // Already in drag mode, ignore

    // Don't preventDefault on touch events - it blocks tap detection in mobile mode
    // Only prevent for mouse events to avoid text selection
    if (event.type.startsWith('mouse')) {
      event.preventDefault();
    }

    setPressingItemId(itemId);
    setPressProgress(0);
    pressStartTimeRef.current = Date.now();

    // Progress animation
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pressStartTimeRef.current;
      const progress = Math.min((elapsed / LONG_PRESS_DURATION) * 100, 100);
      setPressProgress(progress);
    }, 50);

    // Long press timer
    pressTimerRef.current = setTimeout(() => {
      setDragModeActive(true);
      setPressingItemId(null);
      setPressProgress(0);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }, LONG_PRESS_DURATION);
  };

  const cancelLongPress = (itemId: number) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const wasPressingThisItem = pressingItemId === itemId;
    setPressingItemId(null);
    setPressProgress(0);

    // If released before 2s and not in drag mode, trigger auto-scroll
    if (wasPressingThisItem && !dragModeActive) {
      scrollToSection(itemId);
    }
  };

  const scrollToSection = (sectionId: number) => {
    console.log('[SectionsReorder] 🎯 Auto-scroll triggered for section ID:', sectionId);

    // Try multiple selectors since different sections have different form ID patterns
    const selectors = [
      `#heroForm-${sectionId}`,
      `#categoryGridForm-${sectionId}`,
      `#highlightForm-${sectionId}`,
      `#testimonialsForm-${sectionId}`,
      `#footerForm-${sectionId}`,
      `form[id*="${sectionId}"]`,
      `[data-section-id="${sectionId}"]`
    ];

    console.log('[SectionsReorder] 🔍 Trying selectors:', selectors);

    let targetElement: Element | null = null;
    let matchedSelector = '';

    for (const selector of selectors) {
      targetElement = document.querySelector(selector);
      if (targetElement) {
        matchedSelector = selector;
        console.log('[SectionsReorder] ✅ Found element with selector:', selector, targetElement);
        break;
      } else {
        console.log('[SectionsReorder] ❌ Not found:', selector);
      }
    }

    if (targetElement) {
      console.log('[SectionsReorder] 📜 Scrolling to element...', targetElement);
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Flash highlight effect on the form or its parent
      const highlightTarget = targetElement.closest('[class*="sectionEditForm"]') || targetElement;
      console.log('[SectionsReorder] 🎨 Highlighting element:', highlightTarget);
      highlightTarget.classList.add('section-flash-highlight');
      setTimeout(() => {
        highlightTarget.classList.remove('section-flash-highlight');
      }, 2000);
    } else {
      console.error('[SectionsReorder] ❌ FAILED! Section form with id', sectionId, 'not found. Tried:', selectors);
      console.log('[SectionsReorder] 📋 Available forms on page:',
        Array.from(document.querySelectorAll('form')).map(f => ({ id: f.id, tag: f.tagName }))
      );
    }
  };

  const exitDragMode = () => {
    setDragModeActive(false);
  };

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
    <>
      <style jsx>{`
        @keyframes flash-highlight {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(59, 130, 246, 0.2); }
        }
        :global(.section-flash-highlight) {
          animation: flash-highlight 0.6s ease-in-out 3;
        }
      `}</style>

      <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
        {/* Drag Mode Banner */}
        {dragModeActive && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <FaLockOpen className="text-blue-600" size={14} />
              <span className="text-xs font-medium text-blue-700">
                🔓 Drag Mode Aktif - Drag section untuk reorder
              </span>
            </div>
            <button
              type="button"
              onClick={exitDragMode}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Exit Drag Mode
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Urutan Section (Drag & Drop)</p>
            <p className="text-[11px] text-gray-500">
              {dragModeActive
                ? "Drag handle ke atas/bawah untuk mengubah urutan"
                : "Tap untuk scroll ke section • Tahan 2 detik untuk drag mode"
              }
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
                  <Draggable
                    key={item.id}
                    draggableId={String(item.id)}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between rounded-lg border px-3 py-3 text-xs transition-all ${snapshot.isDragging
                          ? "bg-blue-50 border-blue-200 shadow-lg z-50"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                        style={{
                          ...provided.draggableProps.style,
                          touchAction: "none"
                        }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {/* HANDLE */}
                          <div
                            {...provided.dragHandleProps}
                            className="text-gray-400 hover:text-gray-600 p-2 -ml-2 cursor-grab active:cursor-grabbing"
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
    </>
  );
}
