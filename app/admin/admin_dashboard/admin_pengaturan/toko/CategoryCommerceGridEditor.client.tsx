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
import ImagePickerCaptcha from "./ImagePickerCaptcha";

type AnyCategory = {
  id: number | string;
  namaKategori?: string | null;
  nama?: string | null;
  slug?: string | null;
};

type GalleryImage = {
  id: number;
  url: string;
  title?: string | null;
  tags?: string | null;
};

export type CategoryCommerceItem = {
  type: "category" | "custom";
  key: string;
  kategoriId?: number;
  slug?: string;
  label?: string;
  imageId: number | null;
  href?: string;
  imageUrl?: string;
  tabId?: string;
};

function slugify(input: string): string {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function toTitleCase(input: string): string {
  const cleaned = String(input || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
}

function limitWords(input: string, maxWords: number): string {
  const parts = String(input || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, Math.max(1, maxWords)).join(" ");
}

function ensureScopeLabel(label: string, scopeWord: string): string {
  const lower = label.toLowerCase();
  const hasScope = /(mebel|furnitur|interior|rumah|office|kantor|bangunan)/.test(lower);
  if (hasScope) return label;
  return `${label} ${scopeWord}`;
}

function buildSeoSlug(label: string): string {
  const base = slugify(label);
  return base || "";
}

function fileBaseName(url: string): string {
  const raw = String(url || "");
  const clean = raw.split("?")[0].split("#")[0];
  const last = clean.split("/").pop() || "";
  return last.replace(/\.(png|webp|jpg|jpeg|gif|svg)$/i, "");
}

function titleBaseName(title: string): string {
  const raw = String(title || "").trim();
  if (!raw) return "";
  const noExt = raw.replace(/\.(png|webp|jpg|jpeg|gif|svg)$/i, "");
  return stripPngSuffix(noExt);
}

function stripPngSuffix(slug: string): string {
  const s = String(slug || "");
  if (!s) return "";
  if (s.endsWith("-png")) return s.slice(0, -4);
  if (s.endsWith("png")) return s.slice(0, -3);
  return s;
}

function isPngUrl(url: string): boolean {
  return /\.png(\?|#|$)/i.test(String(url || ""));
}

const TOKEN_SYNONYMS: Record<string, string[]> = {
  "rak buku": ["book shelf", "bookshelf", "bookcase"],
  "meja makan": ["dining table", "dining-table"],
  "kursi makan": ["dining chair", "dining-chair"],
  "kursi kantor": ["office chair", "office-chair"],
  "meja kantor": ["office desk", "office table", "office-desk"],
  "rak tv": ["tv rack", "tv stand", "television stand", "backdrop", "tv backdrop"],
  "lemari pakaian": ["wardrobe", "closet"],
  "sofa": ["couch"],
  "kasur": ["mattress", "bed"],
  "ruang kerja": ["work room", "work-room", "workspace", "home office"],
  "ruang makan": ["dining room", "dining-room", "dining space", "dining area", "meja makan"],
  "ruang tamu": ["living room", "living-room"],
  "kamar tidur": ["bed room", "bed-room", "bedroom"],
  "dapur": ["kitchen"],
  "set dapur": ["kitchen set", "kitchen-set"],
  "lemari dapur": ["kitchen cabinet", "kitchen-cabinet"],
  "lemari": ["wardrobe", "cabinet"],
  "rak": ["shelf"],
};

const WORD_SYNONYMS: Record<string, string[]> = {
  meja: ["table", "desk", "worktable", "work-table"],
  makan: ["dining", "eat"],
  dining: ["makan", "meja", "ruang"],
  kursi: ["chair", "seat"],
  rak: ["shelf", "rack", "shelving"],
  tv: ["tv", "television", "tele"],
  lemari: ["cabinet", "wardrobe", "closet"],
  sofa: ["couch", "sofa"],
  kasur: ["bed", "mattress"],
  ruang: ["room", "space", "area"],
  tamu: ["living", "guest"],
  kerja: ["work", "office", "workspace"],
  kantor: ["office", "work", "workspace"],
  tidur: ["bed", "bedroom", "sleep"],
  kamar: ["bed", "bedroom", "room"],
  dapur: ["kitchen", "cook"],
  buku: ["book", "books"],
  kabinet: ["cabinet"],
  etalase: ["display", "showcase"],
  bufet: ["sideboard", "buffet"],
  laci: ["drawer", "drawers"],
  nakas: ["nightstand", "bedside"],
  "meja-rias": ["dresser", "vanity"],
  rias: ["dresser", "vanity"],
  cermin: ["mirror"],
  "lemari-hias": ["display", "showcase", "vitrine"],
  "rak-sepatu": ["shoe-rack", "shoe-shelf", "shoe"],
  "sofa-bed": ["sofa-bed", "sleeper-sofa"],
  "kantor-rumah": ["home-office", "homeoffice"],
};

function normalizeTokenVariants(label: string): string[] {
  const base = slugify(label);
  const out = new Set<string>();
  if (base) out.add(base);
  const direct = TOKEN_SYNONYMS[label.toLowerCase()] || [];
  direct.forEach((t) => out.add(slugify(t)));
  return Array.from(out).filter(Boolean);
}

function scoreImageMatch(categoryName: string, img: GalleryImage): number {
  const labelText = String(categoryName || "").toLowerCase().trim();
  const labelSlug = slugify(labelText);
  if (!labelSlug) return 0;
  const labelVariants = normalizeTokenVariants(labelText);

  const titleText = String(img.title || "");
  const titleBase = slugify(titleBaseName(titleText));
  const titleSlug = titleBase || slugify(titleText);
  const allowTitleMatch = Boolean(titleText.trim());
  const fileBase = slugify(fileBaseName(String(img.url || "")));
  const fileCore = stripPngSuffix(fileBase);
  const titleCore = stripPngSuffix(titleSlug);

  const tokensMatchAll = (variant: string, target: string) => {
    const parts = variant.split("-").filter(Boolean);
    if (!parts.length) return false;
    return parts.every((t) => {
      const candidates = [t, ...(WORD_SYNONYMS[t] || [])].map((w) => slugify(w)).filter(Boolean);
      return candidates.some((tok) => new RegExp(`(^|-)${tok}(-|$)`).test(target));
    });
  };

  const exactFile = labelVariants.some((v) => fileBase === v || fileCore === v);
  const prefixFile = labelVariants.some((v) => fileBase.startsWith(v + "-") || fileCore.startsWith(v + "-"));
  const exactTitle =
    allowTitleMatch && labelVariants.some((v) => titleSlug === v || titleCore === v);
  const prefixTitle =
    allowTitleMatch && labelVariants.some((v) => titleSlug.startsWith(v + "-") || titleCore.startsWith(v + "-"));
  const containedFile = labelVariants.some((v) => tokensMatchAll(v, fileBase) || tokensMatchAll(v, fileCore));
  const containedTitle =
    allowTitleMatch &&
    labelVariants.some((v) => tokensMatchAll(v, titleSlug) || tokensMatchAll(v, titleCore));

  if (!exactFile && !prefixFile && !exactTitle && !prefixTitle && !containedFile && !containedTitle) return 0;

  let score = 0;
  if (exactTitle) score += 30;
  if (prefixTitle) score += 20;
  if (containedTitle) score += 14;
  if (exactFile) score += 18;
  if (prefixFile) score += 12;
  if (containedFile) score += 10;

  return score;
}

function pickBestImage(categoryName: string, images: GalleryImage[], used: Set<number>) {
  let best: { id: number; score: number } | null = null;
  for (const img of images) {
    const urlOk = isPngUrl(img.url);
    if (!urlOk) continue;
    if (used.has(Number(img.id))) continue;
    const score = scoreImageMatch(categoryName, img);
    if (score < 12) continue;
    if (!best || score > best.score) best = { id: Number(img.id), score };
  }
  return best?.id ?? null;
}

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
  catSlug,
  onUpdate,
  onRemove,
  uploadAction,
  sectionId,
  onFileDrop,
  onDragOverRow,
  onDragLeaveRow,
  isDragOver,
  isUploading,
  imageUrl,
  tabs,
  showTabs,
}: {
  item: CategoryCommerceItem;
  label: string;
  catSlug?: string | null;
  onUpdate: (itemKey: string, patch: Partial<CategoryCommerceItem>) => void;
  onRemove: (itemKey: string) => void;
  uploadAction: (formData: FormData) => Promise<any>;
  sectionId: string;
  onFileDrop: (itemKey: string, files: File[]) => void;
  onDragOverRow: (itemKey: string) => void;
  onDragLeaveRow: (itemKey: string) => void;
  isDragOver: boolean;
  isUploading: boolean;
  imageUrl?: string | null;
  tabs: Array<{ id: string; label: string }>;
  showTabs: boolean;
}) {
  const id = String(item.key);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  };

  const dropStyle: React.CSSProperties = isDragOver
    ? {
      background: "rgba(212, 175, 55, 0.12)",
      borderColor: "rgba(212, 175, 55, 0.6)",
    }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, ...dropStyle }}
      className={ui.row}
      onDragOver={(e) => {
        if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          onDragOverRow(item.key);
        }
      }}
      onDragLeave={() => onDragLeaveRow(item.key)}
      onDrop={(e) => {
        if (!e.dataTransfer) return;
        const files = Array.from(e.dataTransfer.files || []);
        if (!files.length) return;
        e.preventDefault();
        e.stopPropagation();
        onDragLeaveRow(item.key);
        onFileDrop(item.key, files);
      }}
    >
      <button type="button" className={ui.handle} aria-label="Drag" {...attributes} {...listeners}>

      </button>

      <div className={ui.rowMain}>
        <div className={ui.rowTitle}>{label}</div>

        <div className={ui.rowControls}>
          <input
            className={ui.select}
            value={item.label ?? ""}
            onChange={(e) => onUpdate(item.key, { label: e.target.value })}
            placeholder="Nama tampil"
          />
          {item.type === "category" ? (
            <div style={{ fontSize: 11, opacity: 0.6, padding: "4px 8px" }}>
              Slug: {item.slug || catSlug || "default"} (auto)
            </div>
          ) : (
            <input
              className={ui.select}
              value={item.href ?? ""}
              onChange={(e) => onUpdate(item.key, { href: e.target.value })}
              placeholder="Link (contoh: /kategori)"
            />
          )}
          {showTabs && tabs.length ? (
            <select
              className={ui.select}
              value={item.tabId ?? tabs[0]?.id ?? ""}
              onChange={(e) => onUpdate(item.key, { tabId: e.target.value })}
            >
              {tabs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label || "Tab"}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className={ui.rowControls}>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            {isUploading ? "Uploading..." : `Icon: ${item.imageId ? `#${item.imageId}` : "kosong"}`}
          </div>
          <div className={ui.iconPreview}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" />
            ) : (
              <div className={ui.iconPlaceholder}>PNG</div>
            )}
          </div>
          {item.type === "category" ? (
            <ImagePickerCaptcha
              action={uploadAction}
              sectionId={sectionId}
              attach={`CATEGORY_GRID_COMMERCE:icon:${item.kategoriId}`}
              endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar?png=1"
              limit={60}
              buttonLabel="Pilih/Upload PNG"
              allowUpload
              autoApplyOnSelect
              accept="image/png"
              skipRefresh
              onAppliedImageId={(id) => onUpdate(item.key, { imageId: id })}
            />
          ) : (
            <ImagePickerCaptcha
              action={uploadAction}
              sectionId={sectionId}
              attach={`CATEGORY_GRID_COMMERCE:custom:${item.key}`}
              endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar?png=1"
              limit={60}
              buttonLabel="Pilih/Upload PNG (custom)"
              allowUpload
              autoApplyOnSelect
              accept="image/png"
              skipRefresh
              onAppliedImageId={(id) => onUpdate(item.key, { imageId: id })}
            />
          )}
          <button type="button" className={ui.removeBtn} onClick={() => onRemove(item.key)}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryCommerceGridEditor({
  categories,
  initialItems,
  sectionId,
  uploadAction,
  images,
  initialTabs,
  mode = "clean",
}: {
  categories: AnyCategory[];
  initialItems: any[];
  sectionId: string;
  uploadAction: (formData: FormData) => Promise<any>;
  images: GalleryImage[];
  initialTabs?: Array<{ id: string; label: string }>;
  mode?: "clean" | "commerce" | "reverse";
}) {
  const catById = React.useMemo(() => {
    const m = new Map<number, AnyCategory>();
    for (const c of categories) {
      const id = Number(c.id);
      if (Number.isFinite(id)) m.set(id, c);
    }
    return m;
  }, [categories]);

  const normalizedInitial: CategoryCommerceItem[] = React.useMemo(() => {
    const arr = Array.isArray(initialItems) ? initialItems : [];
    const normalized = arr
      .map((it: any) => {
        const type = String(it?.type ?? "category") === "custom" ? "custom" : "category";
        if (type === "category") {
          const kategoriId = Number(it?.kategoriId);
          if (!Number.isFinite(kategoriId)) return null;
          const cat = catById.get(kategoriId);
          const fallbackSlug = String(cat?.slug ?? "") || slugify(String(cat?.nama ?? ""));
          const slug = String(it?.slug ?? "").trim() || fallbackSlug || String(kategoriId);
          const label = String(it?.label ?? "").trim();
          const imageId =
            it?.imageId === null || it?.imageId === undefined || it?.imageId === ""
              ? null
              : Number(it.imageId);
          return {
            type: "category",
            key: `cat-${kategoriId}`,
            kategoriId,
            slug,
            label: label || "",
            imageId: Number.isFinite(imageId) && (imageId as number) > 0 ? (imageId as number) : null,
            tabId: String(it?.tabId ?? "") || undefined,
          };
        }

        const label = String(it?.label ?? "").trim();
        const href = String(it?.href ?? "").trim();
        const imageUrl = String(it?.imageUrl ?? "").trim();
        return {
          type: "custom",
          key: String(it?.key ?? `custom-${Date.now()}-${Math.random().toString(16).slice(2)}`),
          label: label || "",
          href,
          imageUrl,
          imageId: null,
          tabId: String(it?.tabId ?? "") || undefined,
        };
      })
      .filter(Boolean) as CategoryCommerceItem[];

    const seenCat = new Set<number>();
    const seenCustom = new Set<string>();
    const deduped: CategoryCommerceItem[] = [];
    normalized.forEach((it) => {
      if (it.type === "category") {
        const id = Number(it.kategoriId);
        if (!Number.isFinite(id) || seenCat.has(id)) return;
        seenCat.add(id);
        deduped.push(it);
        return;
      }
      const key = String(it.key);
      if (seenCustom.has(key)) return;
      seenCustom.add(key);
      deduped.push(it);
    });

    return deduped;
  }, [initialItems, catById]);

  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<CategoryCommerceItem[]>(normalizedInitial);
  const [dragOverId, setDragOverId] = React.useState<string | null>(null);
  const [uploadingId, setUploadingId] = React.useState<number | null>(null);
  const [uploadErr, setUploadErr] = React.useState<string | null>(null);
  const [tabs, setTabs] = React.useState<Array<{ id: string; label: string }>>(
    initialTabs && initialTabs.length ? initialTabs : [],
  );
  const showTabs = mode === "reverse";
  const genTickRef = React.useRef(0);
  const itemsRef = React.useRef<CategoryCommerceItem[]>(normalizedInitial);

  React.useEffect(() => {
    setItems(normalizedInitial);
  }, [normalizedInitial]);

  React.useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const selectedIds = React.useMemo(
    () => new Set(items.filter((it) => it.type === "category").map((it) => Number(it.kategoriId))),
    [items],
  );
  const pngImages = React.useMemo(() => {
    return (images || []).filter((img) => isPngUrl(img.url));
  }, [images]);

  const imageById = React.useMemo(() => {
    const m = new Map<number, GalleryImage>();
    for (const img of pngImages || []) {
      const id = Number(img.id);
      if (Number.isFinite(id)) m.set(id, img);
    }
    return m;
  }, [pngImages]);

  const filteredCategories = React.useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return categories;
    return categories.filter((c) => getCatLabel(c).toLowerCase().includes(qq));
  }, [categories, q]);

  function autoGenerateSeo() {
    genTickRef.current += 1;
    setItems((prev) => {
      const seenCat = new Set<number>();
      const seenCustom = new Set<string>();
      const deduped = prev.filter((it) => {
        if (it.type === "category") {
          const id = Number(it.kategoriId);
          if (!Number.isFinite(id) || seenCat.has(id)) return false;
          seenCat.add(id);
          return true;
        }
        const key = String(it.key);
        if (seenCustom.has(key)) return false;
        seenCustom.add(key);
        return true;
      });
      const tick = genTickRef.current;
      const used = new Set<string>();
      const usedImageIds = new Set<number>();
      const scopeWords = ["Interior", "Mebel", "Furnitur", "Rumah", "Office", "Bangunan"];
      const templates = [
        "{base} {scope}",
        "Mebel {base}",
        "Furnitur {base}",
        "Interior {base}",
        "{base} Rumah",
        "Office {base}",
        "Bangunan {base}",
      ];

      const makeUnique = (base: string) => {
        let slug = slugify(base);
        if (!slug) return "";
        if (!used.has(slug)) {
          used.add(slug);
          return slug;
        }
        let i = 2;
        while (used.has(`${slug}-${i}`)) i += 1;
        const next = `${slug}-${i}`;
        used.add(next);
        return next;
      };

      return deduped.map((it, idx) => {
        if (it.type === "custom") {
          const seed = tick + idx;
          const base = limitWords(toTitleCase(it.label || "Item"), 4);
          const scopeWord = scopeWords[seed % scopeWords.length];
          const templateIdx = seed % templates.length;
          const templated = templates[templateIdx]
            .replace("{base}", base)
            .replace("{scope}", scopeWord);
          const nextLabel = limitWords(ensureScopeLabel(templated.trim(), scopeWord), 6);
          const currentImg = it.imageId ? imageById.get(Number(it.imageId)) : null;
          const currentScore =
            currentImg && isPngUrl(currentImg.url) ? scoreImageMatch(nextLabel, currentImg) : 0;
          const pickedId = pickBestImage(nextLabel, pngImages || [], usedImageIds);
          const finalImageId = currentScore >= 12 ? it.imageId : pickedId ?? null;
          if (finalImageId) usedImageIds.add(Number(finalImageId));
          const nextImageUrl = finalImageId ? imageById.get(Number(finalImageId))?.url ?? "" : it.imageUrl ?? "";
          return { ...it, label: nextLabel || "", imageId: finalImageId, imageUrl: nextImageUrl };
        }

        const cat = typeof it.kategoriId === "number" ? catById.get(it.kategoriId) : undefined;
        if (!cat) return it;

        const baseRaw = getCatLabel(cat);
        const base = limitWords(toTitleCase(baseRaw), 4);
        const templateIdx = (tick + Number(it.kategoriId)) % templates.length;
        const scopeWord = scopeWords[(tick + Number(it.kategoriId)) % scopeWords.length];
        const templated = templates[templateIdx]
          .replace("{base}", base)
          .replace("{scope}", scopeWord);
        const nextLabel = limitWords(ensureScopeLabel(templated.trim(), scopeWord), 6);
        const currentImg = it.imageId ? imageById.get(Number(it.imageId)) : null;
        const currentScore =
          currentImg && isPngUrl(currentImg.url) ? scoreImageMatch(baseRaw, currentImg) : 0;
        const pickedId = pickBestImage(baseRaw, pngImages || [], usedImageIds);
        const finalImageId = currentScore >= 12 ? it.imageId : pickedId ?? null;
        if (finalImageId) usedImageIds.add(Number(finalImageId));

        return { ...it, label: nextLabel || "", imageId: finalImageId };
      });
    });
  }

  function dropAllCategories() {
    setItems((prev) => prev.filter((it) => it.type !== "category"));
  }

  function checklistAllCategories() {
    setItems((prev) => {
      const existing = new Set(
        prev.filter((it) => it.type === "category").map((it) => Number(it.kategoriId)),
      );
      const toAdd = categories
        .map((c) => Number(c.id))
        .filter((id) => Number.isFinite(id) && !existing.has(id))
        .map((kategoriId) => {
          const cat = catById.get(kategoriId);
          const fallbackSlug = String(cat?.slug ?? "") || slugify(String(cat?.nama ?? ""));
          return {
            type: "category" as const,
            key: `cat-${kategoriId}`,
            kategoriId,
            slug: fallbackSlug || String(kategoriId),
            label: "",
            imageId: null,
            tabId: tabs[0]?.id,
          };
        });
      return [...prev, ...toAdd];
    });
  }

  function toggleCategory(kategoriId: number, checked: boolean) {
    setItems((prev) => {
      const has = prev.some((it) => it.type === "category" && it.kategoriId === kategoriId);
      if (checked && !has) {
        const cat = catById.get(kategoriId);
        const fallbackSlug = String(cat?.slug ?? "") || slugify(String(cat?.nama ?? ""));
        return [
          ...prev,
          {
            type: "category",
            key: `cat-${kategoriId}`,
            kategoriId,
            slug: fallbackSlug || String(kategoriId),
            label: cat?.nama || "",
            imageId: null,
            tabId: tabs[0]?.id,
          },
        ];
      }
      if (!checked && has) return prev.filter((it) => !(it.type === "category" && it.kategoriId === kategoriId));
      return prev;
    });
  }

  function onUpdate(itemKey: string, patch: Partial<CategoryCommerceItem>) {
    setItems((prev) => prev.map((it) => (it.key === itemKey ? { ...it, ...patch } : it)));
  }

  function onRemove(itemKey: string) {
    setItems((prev) => prev.filter((it) => it.key !== itemKey));
  }

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((it) => String(it.key) === String(active.id));
      const newIndex = prev.findIndex((it) => String(it.key) === String(over.id));
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  async function onFileDrop(itemKey: string, files: File[]) {
    if (!files.length) return;

    const currentItems = itemsRef.current;
    const startIndex = currentItems.findIndex((it) => it.key === itemKey);
    if (startIndex < 0) {
      setUploadErr("Kategori tujuan tidak ditemukan.");
      return;
    }

    const targetItems = currentItems.slice(startIndex, startIndex + files.length);
    if (targetItems.length < files.length) {
      setUploadErr("Jumlah file melebihi sisa kategori. Sisanya diabaikan.");
    }

    for (let i = 0; i < targetItems.length; i += 1) {
      const file = files[i];
      const targetId = targetItems[i].kategoriId;
      const targetKey = targetItems[i].key;
      if (!targetId || targetItems[i].type !== "category") continue;
      const mime = String(file.type ?? "").toLowerCase();
      const mimeOk = mime === "image/png";
      const nameOk = /\.png$/i.test(String(file.name ?? ""));
      if (!mimeOk && !nameOk) {
        setUploadErr("Icon harus PNG.");
        continue;
      }

      setUploadErr(null);
      setUploadingId(targetId);
      try {
        const fd = new FormData();
        fd.set("sectionId", sectionId);
        fd.set("attach", `CATEGORY_GRID_COMMERCE:icon:${targetId}`);
        fd.set("file", file);

        const res: any = await uploadAction(fd);
        if (res && res.ok === false) {
          setUploadErr(res.error || "Upload gagal.");
        } else if (res?.imageId) {
          onUpdate(targetKey, { imageId: Number(res.imageId) });
        }
      } catch (e: any) {
        setUploadErr(e?.message || "Upload gagal.");
      } finally {
        setUploadingId(null);
      }
    }
  }

  const warnings = React.useMemo(() => {
    const messages: string[] = [];
    if (items.length < 8 && items.length > 0) messages.push("Minimal 8 item agar grid terlihat layak.");
    if (items.length > 16) messages.push("Maksimal 16 item. Sisanya tidak akan ditampilkan.");
    if (items.length > 0 && items.length % 4 !== 0) messages.push("Jumlah item bukan kelipatan 4.");

    const slugSet = new Set<string>();
    const dupSlug = items.some((it) => {
      if (it.type !== "category") return false;
      const s = String(it.slug ?? "").trim();
      if (!s) return false;
      if (slugSet.has(s)) return true;
      slugSet.add(s);
      return false;
    });
    if (dupSlug) messages.push("Ada slug duplikat.");
    return messages;
  }, [items]);

  const hiddenJson = React.useMemo(
    () =>
      JSON.stringify(
        items.map((it) => ({
          type: it.type,
          kategoriId: it.kategoriId ?? null,
          slug: it.slug ?? "",
          label: it.label ?? "",
          imageId: it.imageId ?? null,
          href: it.href ?? "",
          imageUrl: it.imageUrl ?? "",
          tabId: it.tabId ?? "",
        })),
      ),
    [items],
  );
  const tabsJson = React.useMemo(() => JSON.stringify(tabs), [tabs]);

  return (
    <div className={ui.wrap}>
      <input type="hidden" name="itemsJson" value={hiddenJson} />
      <input type="hidden" name="tabsJson" value={tabsJson} />

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
        <button type="button" className={ui.autoBtn} onClick={autoGenerateSeo}>
          Auto Generate SEO
        </button>
        <button type="button" className={ui.autoBtn} onClick={checklistAllCategories}>
          Checklist All
        </button>
        <button type="button" className={ui.removeBtn} onClick={dropAllCategories}>
          Drop All
        </button>
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
          {uploadErr ? (
            <div className={ui.empty} style={{ color: "crimson", fontWeight: 700 }}>
              {uploadErr}
            </div>
          ) : null}

          {showTabs ? (
            <>
              <div className={ui.tabsRow}>
                <div className={ui.tabsTitle}>Tabs</div>
                <button
                  type="button"
                  className={ui.autoBtn}
                  onClick={() =>
                    setTabs((prev) => [...prev, { id: `tab-${Date.now()}`, label: `Tab ${prev.length + 1}` }])
                  }
                >
                  + Tab
                </button>
              </div>
              {tabs.map((t, idx) => (
                <div key={t.id} className={ui.rowControls}>
                  <input
                    className={ui.select}
                    value={t.label}
                    onChange={(e) =>
                      setTabs((prev) => prev.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x)))
                    }
                    placeholder={`Nama tab ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className={ui.removeBtn}
                    onClick={() => setTabs((prev) => prev.filter((x) => x.id !== t.id))}
                    disabled={tabs.length <= 1}
                  >
                    Hapus Tab
                  </button>
                </div>
              ))}
            </>
          ) : null}

          {items.length === 0 ? (
            <div className={ui.empty}>Belum ada kategori dipilih.</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((it) => String(it.key))} strategy={verticalListSortingStrategy}>
                <div className={ui.sortList}>
                  {items.map((it) => {
                    const cat = it.type === "category" && typeof it.kategoriId === "number" ? catById.get(it.kategoriId) : null;
                    const label = it.type === "category"
                      ? cat
                        ? getCatLabel(cat)
                        : `Kategori #${it.kategoriId}`
                      : it.label || "Item Custom";
                    const catSlug = cat ? String(cat.slug ?? "") : "";
                    const iconUrl =
                      it.type === "custom"
                        ? (it.imageId
                          ? imageById.get(Number(it.imageId))?.url ?? null
                          : it.imageUrl || null)
                        : it.imageId
                          ? imageById.get(Number(it.imageId))?.url ?? null
                          : null;
                    return (
                      <SortRow
                        key={String(it.key)}
                        item={it}
                        label={label}
                        catSlug={catSlug}
                        onUpdate={onUpdate}
                        onRemove={onRemove}
                        uploadAction={uploadAction}
                        sectionId={sectionId}
                        onFileDrop={onFileDrop}
                        onDragOverRow={(id) => setDragOverId(id)}
                        onDragLeaveRow={(id) => setDragOverId((prev) => (prev === id ? null : prev))}
                        isDragOver={dragOverId === it.key}
                        isUploading={uploadingId === it.kategoriId}
                        imageUrl={iconUrl}
                        tabs={tabs}
                        showTabs={showTabs}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}

          <div className={ui.colTitle} style={{ marginTop: 12 }}>
            Item Custom (nama + link)
          </div>
          <button
            type="button"
            className={ui.autoBtn}
            onClick={() =>
              setItems((prev) => [
                ...prev,
                {
                  type: "custom",
                  key: `custom-${Date.now()}`,
                  label: "Item Custom",
                  href: "/kategori",
                  imageId: null,
                  imageUrl: "",
                  tabId: tabs[0]?.id,
                },
              ])
            }
          >
            + Tambah Item Custom
          </button>
        </div>
      </div>

      {warnings.length ? (
        <div className={ui.hint} style={{ color: "#b91c1c" }}>
          {warnings.join(" ")}
        </div>
      ) : (
        <div className={ui.hint}>
          Tips: Urutan grid mengikuti urutan kategori terpilih. Kosongkan gambar untuk pakai fallback default.
        </div>
      )}
    </div>
  );
}
