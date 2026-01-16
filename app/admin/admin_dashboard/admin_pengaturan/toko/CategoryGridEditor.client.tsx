"use client";

import * as React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ui from "./CategoryGridEditor.module.css";

type AnyCategory = {
  id: number | string;
  namaKategori?: string | null;
  nama?: string | null;
  slug?: string | null;
};

type AnyImage = {
  id: number | string;
  url: string;
  title?: string | null;
};

export type CategoryGridItem = {
  kategoriId: number;
  coverImageId: number | null;
};

function getCatLabel(cat: AnyCategory) {
  return (
    (cat.namaKategori as string) ||
    (cat.nama as string) ||
    (cat.slug as string) ||
    `Kategori #${cat.id}`
  );
}

function SortRow({
  item,
  label,
  images,
  onCoverChange,
  onRemove,
}: {
  item: CategoryGridItem;
  label: string;
  images: AnyImage[];
  onCoverChange: (kategoriId: number, coverImageId: number | null) => void;
  onRemove: (kategoriId: number) => void;
}) {
  const id = String(item.kategoriId);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={ui.row}>
      <button type="button" className={ui.handle} aria-label="Drag" {...attributes} {...listeners}>
        
      </button>

      <div className={ui.rowMain}>
        <div className={ui.rowTitle}>{label}</div>

        <div className={ui.rowControls}>
          <select
            className={ui.select}
            value={item.coverImageId ? String(item.coverImageId) : ""}
            onChange={(e) => {
              const v = e.target.value;
              onCoverChange(item.kategoriId, v ? Number(v) : null);
            }}
          >
            <option value="">(Cover otomatis)</option>
            {images.map((img) => (
              <option key={String(img.id)} value={String(img.id)}>
                #{String(img.id)}  {img.title ? String(img.title) : img.url}
              </option>
            ))}
          </select>

          <button type="button" className={ui.removeBtn} onClick={() => onRemove(item.kategoriId)}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryGridEditor({
  categories,
  images,
  initialItems,
}: {
  categories: AnyCategory[];
  images: AnyImage[];
  initialItems: any[];
}) {
  const normalizedInitial: CategoryGridItem[] = React.useMemo(() => {
    const arr = Array.isArray(initialItems) ? initialItems : [];
    return arr
      .map((it: any) => ({
        kategoriId: Number(it?.kategoriId),
        coverImageId:
          it?.coverImageId === null || it?.coverImageId === undefined || it?.coverImageId === ""
            ? null
            : Number(it.coverImageId),
      }))
      .filter((it) => Number.isFinite(it.kategoriId));
  }, [initialItems]);

  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<CategoryGridItem[]>(normalizedInitial);

  // keep state in sync if switching sections/themes
  React.useEffect(() => {
    setItems(normalizedInitial);
  }, [normalizedInitial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const catById = React.useMemo(() => {
    const m = new Map<number, AnyCategory>();
    for (const c of categories) {
      const id = Number(c.id);
      if (Number.isFinite(id)) m.set(id, c);
    }
    return m;
  }, [categories]);

  const selectedIds = React.useMemo(() => new Set(items.map((it) => it.kategoriId)), [items]);

  const filteredCategories = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return categories;
    return categories.filter((c) => getCatLabel(c).toLowerCase().includes(qq));
  }, [categories, q]);

  function toggleCategory(kategoriId: number, checked: boolean) {
    setItems((prev) => {
      const has = prev.some((it) => it.kategoriId === kategoriId);
      if (checked && !has) return [...prev, { kategoriId, coverImageId: null }];
      if (!checked && has) return prev.filter((it) => it.kategoriId !== kategoriId);
      return prev;
    });
  }

  function onCoverChange(kategoriId: number, coverImageId: number | null) {
    setItems((prev) => prev.map((it) => (it.kategoriId === kategoriId ? { ...it, coverImageId } : it)));
  }

  function onRemove(kategoriId: number) {
    setItems((prev) => prev.filter((it) => it.kategoriId !== kategoriId));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((it) => String(it.kategoriId) === String(active.id));
      const newIndex = prev.findIndex((it) => String(it.kategoriId) === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const hiddenJson = React.useMemo(() => JSON.stringify(items), [items]);

  return (
    <div className={ui.wrap}>
      <input type="hidden" name="itemsJson" value={hiddenJson} />

      <div className={ui.topBar}>
        <input
          className={ui.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kategori"
        />
        <div className={ui.counter}>
          Terpilih: <b>{items.length}</b>
        </div>
      </div>

      <div className={ui.columns}>
        <div className={ui.left}>
          <div className={ui.colTitle}>Semua kategori</div>
          <div className={ui.list}>
            {filteredCategories.map((cat) => {
              const id = Number(cat.id);
              if (!Number.isFinite(id)) return null;
              const checked = selectedIds.has(id);
              return (
                <label key={String(cat.id)} className={ui.checkRow}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleCategory(id, e.target.checked)}
                  />
                  <span className={ui.checkLabel}>{getCatLabel(cat)}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div className={ui.right}>
          <div className={ui.colTitle}>Kategori terpilih (drag untuk urutkan)</div>

          {items.length === 0 ? (
            <div className={ui.empty}>Belum ada kategori dipilih.</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((it) => String(it.kategoriId))} strategy={verticalListSortingStrategy}>
                <div className={ui.sortList}>
                  {items.map((it) => {
                    const cat = catById.get(it.kategoriId);
                    const label = cat ? getCatLabel(cat) : `Kategori #${it.kategoriId}`;
                    return (
                      <SortRow
                        key={String(it.kategoriId)}
                        item={it}
                        label={label}
                        images={images}
                        onCoverChange={onCoverChange}
                        onRemove={onRemove}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      <div className={ui.hint}>
        Tips: Urutan grid mengikuti urutan Kategori terpilih. Cover otomatis akan memakai gambar promo paling depan (preview).
      </div>
    </div>
  );
}

