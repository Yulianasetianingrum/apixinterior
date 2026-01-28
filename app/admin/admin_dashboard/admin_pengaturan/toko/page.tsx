// app/admin/admin_dashboard/admin_pengaturan/toko/page.tsx
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
// Removed individual editors imports in favor of Wrapper
import FooterEditorWrapper from "./FooterEditorWrapper";




import { headers } from "next/headers";
import styles from "./toko.module.css";
import TokoClient from "./toko-client";

import ProductCarouselPicker from "./ProductCarouselPicker";
import VoucherLinkEditor from "./VoucherLinkEditor";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";

import ImagePickerCaptcha from "./ImagePickerCaptcha";
import FloatingPreviewActions from "./FloatingPreviewActions.client";
import TextSectionBlocksEditor from "./TextSectionBlocksEditor.client";
import TestimonialsEditor from "./TestimonialsEditor.client";
import CategoryCommerceGridEditorNoSSR from "./CategoryCommerceGridEditorNoSSR.client";
import AdminNotice from "./AdminNotice.client";
import DeleteSectionButton from "./DeleteSectionButton.client";
import {
  isThemeMetaRow,
  getThemeKeyFromRow,
  normalizeThemeKey,
  themeMetaSlug,
  withThemeKey,
  getRefererUrl,
  getThemeKeyFromReferer,
  updateDraftConfigPreserveTheme,
  parseCustomPromoBgTheme,
  redirectBack,
  filterExistingIds,
} from "./toko-utils";
import {
  FaArrowLeft,
  FaXmark,
  FaTrash,
  FaPlus,
  FaGripVertical,
  FaChevronRight,
  FaCircleCheck,
  FaCircleMinus
} from "react-icons/fa6";



// selalu ambil data terbaru
export const dynamic = "force-dynamic";


// ========================
// PROMO helper (integer-safe)
// ========================
function computeHargaSetelahPromo(p: {
  harga: number;
  promoAktif?: boolean | null;
  promoTipe?: "persen" | "nominal" | null;
  promoValue?: number | null;
}) {
  const hargaAsli = Math.round(Number(p.harga ?? 0) || 0);
  const aktif = !!p.promoAktif;
  const tipe = (p.promoTipe ?? null) as "persen" | "nominal" | null;
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
    tipe === "persen" ? `-${Math.max(0, Math.min(100, valueRaw))}%` : `-Rp ${diskon.toLocaleString("id-ID")}`;

  return { hargaAsli, hargaFinal, isPromo: true, promoLabel };
}

// ========================
// THEME (slot) for Draft Preview
// Tanpa ubah schema: theme disimpan di config.__themeKey.
// Default: "theme_1" jika belum ada.
// ========================
type ThemeKey = string;
const DEFAULT_THEME_KEY: ThemeKey = "theme_1";
const THEME_META_SLUG_PREFIX = "__theme_meta__";
const ADMIN_TOKO_PATH = "/admin/admin_dashboard/admin_pengaturan/toko";


function safeDecode(v: string): string {
  if (!v) return "";
  try {
    // handle querystring encoding: %20 and plus
    return decodeURIComponent(v.replace(/\+/g, " "));
  } catch {
    return v;
  }
}

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}




// Fungsi untuk menyimpan pilihan background theme di /toko
async function updateBackgroundTheme(formData: FormData) {
  "use server";

  const raw = (formData.get("backgroundTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
  const picked = raw || "FOLLOW_NAVBAR";

  const allowed = ["FOLLOW_NAVBAR", "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"];
  if (!allowed.includes(picked)) return;

  const formDataThemeKey = (formData.get("themeKey") as string | null)?.trim();
  const themeKey = formDataThemeKey ? normalizeThemeKey(formDataThemeKey) : await getThemeKeyFromReferer();

  // Simpan ke Theme Meta (homepageSectionDraft) supaya tidak perlu field baru di schema Prisma.
  await ensureThemeMeta(themeKey);

  const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
  if (!meta) return redirectBack({ error: encodeURIComponent("Theme meta tidak ditemukan. Coba buat theme baru lalu ulangi.") });

  const cfg = (meta.config ?? {}) as any;
  const nextCfg: any = { ...cfg, __isThemeMeta: true, __themeKey: themeKey };

  if (picked === "FOLLOW_NAVBAR") {
    if ("backgroundTheme" in nextCfg) delete nextCfg.backgroundTheme;
  } else {
    nextCfg.backgroundTheme = picked;
  }

  await prisma.homepageSectionDraft.update({
    where: { id: meta.id },
    data: { config: nextCfg },
  });

  // ALSO update the global navbarSetting table if this matches the currently active site theme
  // so that other pages (produk, search, etc.) remain in sync.
  const activeMarker = await prisma.homepageSectionDraft.findFirst({ where: { slug: "__active_theme__" } });
  const activeMarkerCfg = (activeMarker?.config ?? {}) as any;
  const currentActiveKey = activeMarkerCfg?.activeThemeKey || "theme_1";

  if (themeKey === currentActiveKey) {
    await prisma.navbarSetting.upsert({
      where: { id: 1 },
      update: { backgroundTheme: picked },
      create: { id: 1, theme: "NAVY_GOLD", backgroundTheme: picked },
    });
  }

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  revalidatePath("/navbar", "layout");
  revalidatePath("/(public)", "layout");
  revalidatePath("/produk", "layout");
  revalidatePath("/search", "layout");
  return redirectBack({ notice: encodeURIComponent("Tema background berhasil disimpan."), theme: themeKey });
}










// ========================
// NAVBAR THEME SETUP (biarkan seperti versi kamu)
// ========================

type NavbarTheme = "NAVY_GOLD" | "WHITE_GOLD" | "NAVY_WHITE" | "GOLD_NAVY" | "GOLD_WHITE" | "WHITE_NAVY";
const ALLOWED_THEMES = ["NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"] as const;
type AllowedNavbarTheme = (typeof ALLOWED_THEMES)[number];

function normalizeThemeAttr(v: string | null): string {
  const s = (v ?? "").trim();
  if (!s) return "";
  return s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseSectionTheme(raw: string | null): AllowedNavbarTheme | null {
  const normalized = normalizeThemeAttr(raw);
  if (!normalized || normalized === "FOLLOW_NAVBAR") return null;
  if (ALLOWED_THEMES.includes(normalized as any)) return normalized as AllowedNavbarTheme;

  // Back-compat: theme_1..theme_6 -> map ke combo navbar
  const m = normalized.match(/^THEME_(\d)$/);
  if (m) {
    const map: Record<string, AllowedNavbarTheme> = {
      "1": "NAVY_GOLD",
      "2": "WHITE_GOLD",
      "3": "NAVY_WHITE",
      "4": "GOLD_NAVY",
      "5": "GOLD_WHITE",
      "6": "WHITE_NAVY",
    };
    return map[m[1]] ?? null;
  }
  return null;
}




function parseBgThemeLocal(v: any) {
  const s = String(v ?? "").trim().toUpperCase();
  if (s === "SOFT_GOLD" || s === "SOFT GOLD") return "SOFT_GOLD";
  if (s === "SOFT_NAVY" || s === "SOFT NAVY") return "SOFT_NAVY";
  if (s === "NAVY") return "NAVY";
  if (s === "WHITE") return "WHITE";
  if (s === "GOLD") return "GOLD";
  return "FOLLOW_NAVBAR";
}

async function updateNavbarTheme(formData: FormData) {
  "use server";

  try {
    const theme = formData.get("navbarTheme") as AllowedNavbarTheme | null;
    if (!theme) {
      return redirectBack({ error: encodeURIComponent("Pilih tema navbar terlebih dahulu.") });
    }
    if (!ALLOWED_THEMES.includes(theme)) {
      return redirectBack({ error: encodeURIComponent("Tema yang dipilih tidak valid.") });
    }

    const formDataThemeKey = (formData.get("themeKey") as string | null)?.trim();
    const themeKey = formDataThemeKey ? normalizeThemeKey(formDataThemeKey) : await getThemeKeyFromReferer();

    // Pastikan meta row ada
    await ensureThemeMeta(themeKey);

    const meta = await prisma.homepageSectionDraft.findFirst({
      where: { slug: themeMetaSlug(themeKey) }
    });

    if (!meta) {
      return redirectBack({
        error: encodeURIComponent("Gagal: Baris konfigurasi theme tidak ditemukan di database."),
        theme: themeKey
      });
    }

    const cfg = (meta.config ?? {}) as any;
    const nextCfg: any = {
      ...cfg,
      __isThemeMeta: true,
      __themeKey: themeKey,
      navbarTheme: theme
    };

    const updated = await prisma.homepageSectionDraft.update({
      where: { id: meta.id },
      data: { config: nextCfg },
    });

    if (!updated) {
      throw new Error("Database update returned no result.");
    }

    // ALSO update the global navbarSetting table if this matches the currently active site theme
    // so that other pages (produk, search, etc.) remain in sync.
    const activeMarker = await prisma.homepageSectionDraft.findFirst({ where: { slug: "__active_theme__" } });
    const activeMarkerCfg = (activeMarker?.config ?? {}) as any;
    const currentActiveKey = activeMarkerCfg?.activeThemeKey || "theme_1";

    if (themeKey === currentActiveKey) {
      await prisma.navbarSetting.upsert({
        where: { id: 1 },
        update: { theme: theme },
        create: { id: 1, theme: theme },
      });
    }

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
    revalidatePath("/navbar", "layout");
    revalidatePath("/(public)", "layout"); // Try to revalidate layouts if they exist
    revalidatePath("/produk", "layout");
    revalidatePath("/search", "layout");

    return redirectBack({
      notice: encodeURIComponent(`Tema navbar berhasil diubah menjadi ${theme.replace('_', ' ')}.`),
      theme: themeKey
    });
  } catch (err: any) {
    if (String(err).includes("NEXT_REDIRECT")) throw err;
    console.error("updateNavbarTheme error:", err);
    return redirectBack({
      error: encodeURIComponent("Terjadi kesalahan sistem: " + (err.message || String(err)))
    });
  }
}

// ========================
// HOMEPAGE SECTION DRAFT/PUBLISH (baru)
// ========================

type SectionTypeId =
  | "HERO"
  | "TEXT_SECTION"
  | "CATEGORY_GRID"
  | "CATEGORY_GRID_COMMERCE"
  | "PRODUCT_CAROUSEL"
  | "PRODUCT_LISTING"
  | "HIGHLIGHT_COLLECTION"
  | "ROOM_CATEGORY"
  | "GALLERY"
  | "BRANCHES"
  | "CONTACT"
  | "SOCIAL"
  | "CUSTOM_PROMO"
  | "TESTIMONIALS"
  | "FOOTER";

type SectionDef = {
  type: SectionTypeId;
  label: string;
  description: string;
  defaultSlug: string;
  defaultConfig: any;
};

const MAX_ROOM_CARDS = 12;
const MAX_CUSTOM_PROMO_VOUCHERS = 20;

const DEFAULT_ROOM_CARDS = [
  { key: "ruang_keluarga_tamu", title: "Ruang Keluarga & Tamu" },
  { key: "ruang_makan_dapur", title: "Ruang Makan & Dapur" },
  { key: "kamar_tidur", title: "Kamar Tidur" },
] as const;

const SECTION_DEFS: SectionDef[] = [
  {
    type: "HERO",
    label: "Hero / Banner Utama",
    description: "Judul besar, subjudul, CTA, dan 1 gambar.",
    defaultSlug: "hero",
    defaultConfig: {
      headline: "",
      subheadline: "",
      ctaLabel: "",
      ctaHref: "",
      heroTheme: "FOLLOW_NAVBAR",
      sectionTheme: "FOLLOW_NAVBAR",
      imageId: null,
    },
  },
  {
    type: "TEXT_SECTION",
    label: "Text Section",
    description: "Blok teks tunggal dengan mode tipografi (heading/subtitle/body/caption).",
    defaultSlug: "text-section",
    defaultConfig: {
      sectionTheme: "FOLLOW_NAVBAR",
      blocks: [],
      text: "",
      mode: "body",
      align: "left",
      width: "normal",
    },
  },
  {
    type: "CATEGORY_GRID",
    label: "Grid Kategori Produk",
    description: "Checklist kategori + opsional cover image per kategori.",
    defaultSlug: "kategori-produk",
    defaultConfig: {
      sectionTheme: "FOLLOW_NAVBAR",
      layout: { columns: 3, maxItems: 6 },
      items: [],
    },
  },
  {
    type: "CATEGORY_GRID_COMMERCE",
    label: "Grid Category Commerce",
    description: "Grid kategori e-commerce dengan slug unik per item.",
    defaultSlug: "grid-category-commerce",
    defaultConfig: {
      sectionTheme: "FOLLOW_NAVBAR",
      layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 },
      items: [],
    },
  },
  {
    type: "PRODUCT_CAROUSEL",
    label: "Carousel Produk",
    description: "Carousel produk pilihan (urutan mengikuti list).",
    defaultSlug: "carousel-produk",
    defaultConfig: {
      sectionTheme: "FOLLOW_NAVBAR",
      title: "",
      description: "",
      productIds: [],
      showPrice: true,
      showCta: true,
    },
  },
  {
    type: "PRODUCT_LISTING",
    label: "Product Listing",
    description: "Grid produk terbaru dengan tombol Tampilkan Semua.",
    defaultSlug: "produk",
    defaultConfig: {
      sectionTheme: "FOLLOW_NAVBAR",
    },
  },
  {
    type: "HIGHLIGHT_COLLECTION",
    label: "Highlight Collection",
    description: "Koleksi kurasi premium (produk pilihan + hero media + CTA).",
    defaultSlug: "koleksi-pilihan",
    defaultConfig: {
      // Backward compatible keys (renderer lama masih bisa pakai ini)
      mode: "products",
      title: "",
      productIds: [],

      // New keys (rancangan baru)
      layout: "FEATURED_LEFT",
      heroImageId: null,
      badgeText: "",
      headline: "",
      description: "",
      ctaText: "",
      ctaHref: "",
      sectionTheme: "FOLLOW_NAVBAR",

      // Future-proof (opsional): list item campuran, saat ini diisi dari productIds saat simpan
      items: [],
    },
  },
  {
    type: "ROOM_CATEGORY",
    label: "Kategori Ruangan",
    description: "Kartu ruangan (maks. 12). Tiap kartu bisa pilih kategori + gambar (opsional).",
    defaultSlug: "kategori-ruangan",
    defaultConfig: {
      cards: DEFAULT_ROOM_CARDS.map((c) => ({
        key: c.key,
        title: c.title,
        description: "",
        badge: "",
        kategoriId: null,
        imageId: null,
      })),
    },
  },

  {
    type: "BRANCHES",
    label: "Cabang Toko / Showroom",
    description: "Pilih cabang yang tampil.",
    defaultSlug: "cabang",
    defaultConfig: {
      branchIds: [],
      layout: "carousel",
      sectionTheme: "FOLLOW_NAVBAR"
    },
  },
  {
    type: "CONTACT",
    label: "Hubungi Kami",
    description: "Pilih nomor / kontak yang tampil.",
    defaultSlug: "hubungi",
    defaultConfig: { hubungiIds: [], buttonLabels: {}, mode: "SPLIT_IMAGE_STACK", showImage: true, imageId: null, headerText: "", bodyText: "" },
  },
  {
    type: "SOCIAL",
    label: "Media Sosial (icons only)",
    description: "Checklist medsos; yang tampil di homepage hanya iconKey.",
    defaultSlug: "social",
    defaultConfig: { selected: [], display: { iconsOnly: true } },
  },
  {
    type: "CUSTOM_PROMO",
    label: "Custom Promo",
    description: "Voucher promo berbentuk gambar (carousel / grid / hero).",
    defaultSlug: "promo",
    defaultConfig: {
      layout: "carousel",
      sectionBgTheme: "FOLLOW_NAVBAR",
      voucherImageIds: [],
    },
  },
  {
    type: "TESTIMONIALS",
    label: "Ulasan / Testimoni",
    description: "Tampilkan ulasan pelanggan (sumber Google Maps atau manual).",
    defaultSlug: "testimoni",
    defaultConfig: {
      title: "Apa Kata Mereka?",
      subtitle: "Ulasan dari pelanggan setia kami",
      mapsUrl: "",
      reviews: [],
    },
  },
  {
    type: "FOOTER",
    label: "🚀 FOOTER (Copyright & Contact)",
    description: "Informasi copyright, kontak, alamat, dan social media.",
    defaultSlug: "footer-general",
    defaultConfig: {
      copyright: "© 2024 Apix Interior. All Rights Reserved.",
      sectionTheme: "FOLLOW_NAVBAR",
      whatsapp: "",
      email: "",
      address: "",
      instagram: "",
      facebook: "",
    },
  },
];


const SECTION_ICON: Record<string, string> = {
  HERO: "H",
  TEXT_SECTION: "TXT",
  CATEGORY_GRID: "C",
  CATEGORY_GRID_COMMERCE: "GC",
  PRODUCT_CAROUSEL: "P",
  PRODUCT_LISTING: "PL",
  HIGHLIGHT_COLLECTION: "L",
  ROOM_CATEGORY: "R",
  GALLERY: "G",
  BRANCHES: "B",
  CONTACT: "T",
  SOCIAL: "S",
  CUSTOM_PROMO: "CP",
  TESTIMONIALS: "TM",
  FOOTER: "F",
};


function slugify(input: string): string {
  return input
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

function scoreImageMatch(categoryName: string, img: { url?: string | null; title?: string | null }): number {
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
  const exactTitle = allowTitleMatch && labelVariants.some((v) => titleSlug === v || titleCore === v);
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

function pickBestImage(
  categoryName: string,
  images: { id: number; url: string; title?: string | null }[],
  used?: Set<number>,
) {
  let best: { id: number; score: number } | null = null;
  for (const img of images) {
    if (used && used.has(Number(img.id))) continue;
    const score = scoreImageMatch(categoryName, img);
    if (score < 12) continue;
    if (!best || score > best.score) best = { id: Number(img.id), score };
  }
  return best?.id ?? null;
}

function getCategoryLabel(cat: { namaKategori?: string | null; nama?: string | null; slug?: string | null; id?: any }) {
  return (
    (cat.namaKategori as string) ||
    (cat.nama as string) ||
    (cat.slug as string) ||
    `Kategori #${cat.id}`
  );
}

function parseNum(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseNumArray(values: string[]): number[] {
  return values
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v));
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

type RoomCard = {
  key: string;
  title: string;
  description: string;
  badge: string;
  kategoriId: number | null;
  imageId: number | null;
};

function makeRoomCardKey() {
  // stable enough for draft config keys
  return `room_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

function normalizeRoomCards(rawCards: any): RoomCard[] {
  const input = Array.isArray(rawCards) ? rawCards : [];
  const seen = new Set<string>();
  const out: RoomCard[] = [];

  for (const c of input) {
    const key = String(c?.key ?? "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const title = String(c?.title ?? "").trim();
    const description = String(c?.description ?? "").trim();
    const badge = String(c?.badge ?? "").trim();

    const kategoriNum = Number(c?.kategoriId);
    const imageNum = Number(c?.imageId);

    out.push({
      key,
      title,
      description,
      badge,
      kategoriId: Number.isFinite(kategoriNum) && kategoriNum > 0 ? kategoriNum : null,
      imageId: Number.isFinite(imageNum) && imageNum > 0 ? imageNum : null,
    });
    if (out.length >= MAX_ROOM_CARDS) break;
  }

  // Backward-compatible fallback: kalau config lama belum punya cards
  if (!out.length) {
    return DEFAULT_ROOM_CARDS.map((c) => ({
      key: c.key,
      title: c.title,
      description: "",
      badge: "",
      kategoriId: null,
      imageId: null,
    }));
  }

  return out;
}

function normalizeVoucherImageIds(raw: any): number[] {
  const arr = Array.isArray(raw) ? raw : [];
  return Array.from(
    new Set(
      arr
        .map((v: any) => Number(v))
        .filter((v: number) => Number.isFinite(v) && v > 0),
    ),
  ).slice(0, MAX_CUSTOM_PROMO_VOUCHERS);
}

function normalizeCustomPromoConfig(raw: any) {
  const parsed = legacyToNewConfig("CUSTOM_PROMO", raw);
  const layoutRaw = String((parsed as any)?.layout ?? "carousel").toLowerCase();
  const layout =
    layoutRaw === "grid"
      ? "grid"
      : layoutRaw === "hero"
        ? "hero"
        : "carousel";
  const sectionBgTheme = parseCustomPromoBgTheme((parsed as any)?.sectionBgTheme ?? null);
  const voucherImageIds = normalizeVoucherImageIds((parsed as any)?.voucherImageIds);
  const voucherLinks =
    (parsed as any)?.voucherLinks && typeof (parsed as any).voucherLinks === "object"
      ? (parsed as any).voucherLinks
      : null;

  const base: any = { layout, sectionBgTheme, voucherImageIds };
  if (voucherLinks) base.voucherLinks = voucherLinks;
  if ((parsed as any)?._legacyBannerPromoId !== undefined) {
    base._legacyBannerPromoId = (parsed as any)._legacyBannerPromoId;
  }
  return base;
}

/**
 * Normalize stored image URL from DB to a public path usable by <img src>.
 * - Keeps absolute URLs (http/https)
 * - Keeps already-rooted URLs (/uploads/...)
 * - Prefixes relative URLs (uploads/...) with "/"
 *
 * This matters on /admin routes: relative URLs would resolve under /admin/... and 404.
 */
function normalizePublicUrl(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return s;
  return `/${s}`;
}

async function validateExistence(opts: {
  imageIds?: number[];
  productIds?: number[];
  kategoriIds?: number[];
  branchIds?: number[];
  hubungiIds?: number[];
  mediaIconKeys?: string[];
}) {
  const {
    imageIds = [],
    productIds = [],
    kategoriIds = [],
    branchIds = [],
    hubungiIds = [],
    mediaIconKeys = [],
  } = opts;

  const checks: { ok: boolean; msg: string }[] = [];

  if (imageIds.length) {
    const found = await prisma.gambarUpload.findMany({
      where: { id: { in: imageIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((f) => f.id));
    const missing = imageIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada gambar yang tidak ditemukan (ID: ${missing.join(", ")}). Periksa pilihan gambar.` });
    }
  }

  if (productIds.length) {
    const found = await prisma.produk.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((p) => p.id));
    const missing = productIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada produk yang tidak ditemukan (ID: ${missing.join(", ")}). Periksa pilihan produk.` });
    }
  }

  if (kategoriIds.length) {
    const found = await prisma.kategoriProduk.findMany({
      where: { id: { in: kategoriIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((k) => k.id));
    const missing = kategoriIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada kategori yang tidak ditemukan (ID: ${missing.join(", ")}). Periksa pilihan kategori.` });
    }
  }

  if (branchIds.length) {
    const found = await prisma.cabangToko.findMany({
      where: { id: { in: branchIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((b) => b.id));
    const missing = branchIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada cabang yang tidak ditemukan (ID: ${missing.join(", ")}). Periksa pilihan cabang.` });
    }
  }

  if (hubungiIds.length) {
    const found = await prisma.hubungi.findMany({
      where: { id: { in: hubungiIds } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((h) => h.id));
    const missing = hubungiIds.filter((id) => !foundIds.has(id));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada kontak yang tidak ditemukan (ID: ${missing.join(", ")}). Periksa pilihan kontak.` });
    }
  }

  if (mediaIconKeys.length) {
    const found = await prisma.mediaSosial.findMany({
      where: { iconKey: { in: mediaIconKeys } },
      select: { iconKey: true },
    });
    const foundKeys = new Set(found.map((m) => m.iconKey));
    const missing = mediaIconKeys.filter((k) => !foundKeys.has(k));
    if (missing.length > 0) {
      checks.push({ ok: false, msg: `Ada media sosial yang tidak ditemukan (${missing.join(", ")}). Periksa pilihan medsos.` });
    }
  }

  const firstFail = checks.find((c) => !c.ok);
  if (firstFail) throw new Error(firstFail.msg);
}



function collectExistenceArgs(type: SectionTypeId, cfg: any) {
  const out: any = {};

  const pushNum = (arr: number[], v: any) => {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) arr.push(n);
  };

  const uniq = (arr: number[]) => Array.from(new Set(arr));

  switch (type) {
    case "HERO": {
      const imageIds: number[] = [];
      if (cfg?.imageId) pushNum(imageIds, cfg.imageId);
      out.imageIds = uniq(imageIds);
      break;
    }
    case "CUSTOM_PROMO": {
      const imageIds: number[] = [];
      const vouchers = Array.isArray(cfg?.voucherImageIds) ? cfg.voucherImageIds : [];
      vouchers.forEach((v: any) => pushNum(imageIds, v));
      if (cfg?.imageId) pushNum(imageIds, cfg.imageId); // legacy fallback
      out.imageIds = uniq(imageIds).slice(0, MAX_CUSTOM_PROMO_VOUCHERS);
      break;
    }
    case "CATEGORY_GRID": {
      const kategoriIds: number[] = [];
      const imageIds: number[] = [];
      const items = Array.isArray(cfg?.items) ? cfg.items : [];
      items.forEach((it: any) => {
        pushNum(kategoriIds, it?.kategoriId);
        if (it?.coverImageId) pushNum(imageIds, it.coverImageId);
      });
      out.kategoriIds = uniq(kategoriIds);
      out.imageIds = uniq(imageIds);
      break;
    }
    case "CATEGORY_GRID_COMMERCE": {
      const kategoriIds: number[] = [];
      const imageIds: number[] = [];
      const items = Array.isArray(cfg?.items) ? cfg.items : [];
      items.forEach((it: any) => {
        pushNum(kategoriIds, it?.kategoriId);
        if (it?.imageId) pushNum(imageIds, it.imageId);
      });
      out.kategoriIds = uniq(kategoriIds);
      out.imageIds = uniq(imageIds);
      break;
    }
    case "PRODUCT_CAROUSEL": {
      const productIds: number[] = [];
      const ids = Array.isArray(cfg?.productIds) ? cfg.productIds : [];
      ids.forEach((v: any) => pushNum(productIds, v));
      out.productIds = uniq(productIds);
      break;
    }
    case "GALLERY": {
      const imageIds: number[] = [];
      const ids = Array.isArray(cfg?.imageIds) ? cfg.imageIds : [];
      ids.forEach((v: any) => pushNum(imageIds, v));
      out.imageIds = uniq(imageIds);
      break;
    }
    case "ROOM_CATEGORY": {
      const kategoriIds: number[] = [];
      const imageIds: number[] = [];
      const cards = Array.isArray(cfg?.cards) ? cfg.cards : [];
      cards.forEach((c: any) => {
        pushNum(kategoriIds, c?.kategoriId);
        if (c?.imageId) pushNum(imageIds, c.imageId);
      });
      out.kategoriIds = uniq(kategoriIds);
      out.imageIds = uniq(imageIds);
      break;
    }
    case "HIGHLIGHT_COLLECTION": {
      const imageIds: number[] = [];
      const productIds: number[] = [];
      const kategoriIds: number[] = [];

      // Hero media (baru)
      if (cfg?.heroImageId) pushNum(imageIds, cfg.heroImageId);

      // Legacy fields (lama)
      const legacyMode = cfg?.mode === "categories" ? "categories" : "products";
      if (legacyMode === "products") {
        const ids = Array.isArray(cfg?.productIds) ? cfg.productIds : [];
        ids.forEach((v: any) => pushNum(productIds, v));
      } else {
        const ids = Array.isArray(cfg?.categoryIds) ? cfg.categoryIds : [];
        ids.forEach((v: any) => pushNum(kategoriIds, v));
      }

      // Future-proof: items campuran (baru)
      const items = Array.isArray(cfg?.items) ? cfg.items : [];
      items.forEach((it: any) => {
        const t = String(it?.type ?? "");
        if (t === "product") pushNum(productIds, it?.refId);
        if (t === "category") pushNum(kategoriIds, it?.refId);
        if (it?.imageId) pushNum(imageIds, it?.imageId);
      });

      out.imageIds = uniq(imageIds);
      out.productIds = uniq(productIds);
      out.kategoriIds = uniq(kategoriIds);
      break;
    }
    case "SOCIAL": {
      const mediaIconKeys: string[] = [];
      const selected = Array.isArray(cfg?.selected) ? cfg.selected : [];
      selected.forEach((s: any) => {
        const k = String(s?.iconKey || "").trim();
        if (k) mediaIconKeys.push(k);
      });
      out.mediaIconKeys = Array.from(new Set(mediaIconKeys));
      break;
    }
    case "BRANCHES": {
      const branchIds: number[] = [];
      const ids = Array.isArray(cfg?.branchIds) ? cfg.branchIds : [];
      ids.forEach((v: any) => pushNum(branchIds, v));
      out.branchIds = uniq(branchIds);
      break;
    }
    case "CONTACT": {
      const hubungiIds: number[] = [];
      const imageIds: number[] = [];
      const ids = Array.isArray(cfg?.hubungiIds) ? cfg.hubungiIds : [];
      ids.forEach((v: any) => pushNum(hubungiIds, v));
      if (cfg?.imageId) pushNum(imageIds, cfg.imageId);
      out.hubungiIds = uniq(hubungiIds);
      out.imageIds = uniq(imageIds);
      break;
    }
    default:
      break;
  }

  return out;
}

function legacyToNewConfig(type: SectionTypeId, raw: any) {
  const cfg = (raw ?? {}) as any;

  if (type === "TEXT_SECTION") {
    const text = typeof cfg.text === "string" ? cfg.text : "";
    const modeRaw = String(cfg.mode ?? "body").toLowerCase();
    const mode =
      modeRaw === "heading" || modeRaw === "subtitle" || modeRaw === "caption" ? modeRaw : "body";
    const alignRaw = String(cfg.align ?? "left").toLowerCase();
    const align = alignRaw === "center" ? "center" : "left";
    const widthRaw = String(cfg.width ?? "normal").toLowerCase();
    const width = widthRaw === "wide" ? "wide" : "normal";
    const blocks = Array.isArray(cfg.blocks)
      ? cfg.blocks
        .map((b: any) => ({
          mode: String(b?.mode ?? "body"),
          text: String(b?.text ?? ""),
        }))
        .filter((b: any) => b.text.trim())
      : [];
    const sectionTheme = String(cfg.sectionTheme ?? "FOLLOW_NAVBAR");
    return { text, mode, align, width, sectionTheme, blocks };
  }

  // CATEGORY_GRID legacy: categoryIdsForHomepage -> items[]
  if (type === "CATEGORY_GRID" && Array.isArray(cfg.categoryIdsForHomepage)) {
    const ids = cfg.categoryIdsForHomepage
      .map((v: any) => Number(v))
      .filter((v: number) => Number.isFinite(v));
    return {
      layout: { columns: 3, maxItems: ids.length || 6 },
      items: ids.map((id: number) => ({ kategoriId: id, coverImageId: null })),
    };
  }

  if (type === "CATEGORY_GRID_COMMERCE") {
    const layoutRaw = isObject(cfg.layout)
      ? cfg.layout
      : { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 };
    const modeRaw = String((layoutRaw as any)?.mode ?? cfg?.mode ?? "clean").toLowerCase();
    const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
    const layout = { ...layoutRaw, mode };
    return {
      sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
      layout,
      items: Array.isArray(cfg.items) ? cfg.items : [],
      tabs: Array.isArray(cfg.tabs) ? cfg.tabs : [],
    };
  }

  if (type === "PRODUCT_LISTING") {
    return {
      sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
      productIds: Array.isArray(cfg.productIds) ? cfg.productIds : [],
    };
  }

  // CUSTOM_PROMO legacy: bannerPromoId (we'll keep to display warning; but on Save we write new format)
  if (type === "CUSTOM_PROMO") {
    const layoutRaw = String(cfg?.layout ?? "carousel").toLowerCase();
    const layout = layoutRaw === "grid" ? "grid" : layoutRaw === "hero" ? "hero" : "carousel";

    const voucherRaw = Array.isArray(cfg?.voucherImageIds) ? cfg.voucherImageIds : [];
    const voucherImageIds = Array.from(
      new Set(
        voucherRaw
          .map((v: any) => Number(v))
          .filter((v: number) => Number.isFinite(v) && v > 0),
      ),
    ).slice(0, MAX_CUSTOM_PROMO_VOUCHERS);

    const bgTheme = parseCustomPromoBgTheme((cfg as any)?.sectionBgTheme ?? (cfg as any)?.sectionTheme ?? null);
    const voucherLinks =
      (cfg as any)?.voucherLinks && typeof (cfg as any).voucherLinks === "object"
        ? (cfg as any).voucherLinks
        : null;

    const base: any = {
      layout,
      sectionBgTheme: bgTheme,
      voucherImageIds: voucherImageIds.length ? voucherImageIds : [],
    };
    if (voucherLinks) base.voucherLinks = voucherLinks;

    // Legacy single imageId fallback
    const legacyImageId = Number((cfg as any)?.imageId);
    if (!base.voucherImageIds.length && Number.isFinite(legacyImageId) && legacyImageId > 0) {
      base.voucherImageIds = [legacyImageId];
    }

    if (cfg && (cfg.bannerPromoId || cfg.bannerPromoId === 0)) {
      base._legacyBannerPromoId = cfg.bannerPromoId ?? null;
    }

    return base;
  }

  return cfg;
}

async function createDraftSection(formData: FormData) {
  "use server";

  const themeKey = await getThemeKeyFromReferer();
  const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
  if (!meta) {
    return redirectBack({ error: encodeURIComponent("Buat theme dulu dengan tombol + Theme, lalu susun section di dalam theme tersebut.") });
  }

  const typeRaw = (formData.get("type") as string | null) ?? null;
  const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const def = SECTION_DEFS.find((d) => d.type === typeRaw);
  if (!def || !def.type) return redirectBack({ error: encodeURIComponent("Jenis section tidak valid (Internal Def Error).") });

  const last = await prisma.homepageSectionDraft.findFirst({ orderBy: { sortOrder: "desc" } });
  const sortOrder = last ? last.sortOrder + 1 : 1;

  const slug = slugRaw ? slugify(slugRaw) : def.defaultSlug;
  if (slug === "__active_theme__" || slug.startsWith(THEME_META_SLUG_PREFIX)) {
    return redirectBack({ error: encodeURIComponent("Slug tersebut diproteksi oleh sistem.") });
  }

  // Final Safety Check
  if (!def || !def.type) {
    console.error("[CreateDraft] Def or Def.Type missing", { typeRaw, def });
    return redirectBack({ error: encodeURIComponent("Type definition is missing.") });
  }

  const sectionType = String(def.type).trim();
  if (!sectionType) {
    console.error("[CreateDraft] Empty section type resolved", { typeRaw, def });
    return redirectBack({ error: encodeURIComponent("Invalid section type (empty).") });
  }

  console.log("[CreateDraft] Creating section:", { type: sectionType, title: titleRaw });

  const created = await prisma.homepageSectionDraft.create({
    data: {
      type: sectionType as any,
      title: titleRaw,
      slug: slug.length ? slug : null,
      enabled: true,
      sortOrder,
      config: withThemeKey(def.defaultConfig ?? {}, themeKey),
    },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({
    notice: encodeURIComponent("Section draft berhasil ditambahkan."),
    anchor: `section-${created.id}`,
    sectionId: created.id,
  });
}

async function updateDraftMeta(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";



  const slug = slugRaw ? slugify(slugRaw) : null;
  if (slug === "__active_theme__" || (slug && slug.startsWith(THEME_META_SLUG_PREFIX))) {
    return redirectBack({ error: encodeURIComponent("Slug tersebut diproteksi oleh sistem.") });
  }

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: { title, slug },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({ notice: encodeURIComponent("Metadata section berhasil disimpan.") });
}

async function toggleDraft(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  const currentEnabled = (formData.get("currentEnabled") as string | null) === "true";
  if (!id || Number.isNaN(id)) return;

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: { enabled: !currentEnabled },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({ notice: encodeURIComponent("Status section berhasil diubah.") });
}

async function deleteDraft(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  console.log(`🗑️ [deleteDraft] Attempting to delete draft section ID: ${id}`);
  try {
    const deleted = await prisma.homepageSectionDraft.delete({ where: { id } });
    console.log(`   - Successfully deleted draft section: ${deleted.title} (${deleted.type})`);
  } catch (err) {
    console.error(`   - ❌ FAILED to delete draft section ID: ${id}. It might already be gone.`, err);
  }

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({ notice: encodeURIComponent("Section draft dihapus.") });
}

async function duplicateDraft(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!existing) return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });

  const themeKey = getThemeKeyFromRow(existing);
  const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } });
  const sameTheme = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d))
    .filter((d) => getThemeKeyFromRow(d) === themeKey);

  const baseSort = Number(existing.sortOrder ?? 0) + 1;
  const toShift = sameTheme
    .filter((d) => Number(d.sortOrder ?? 0) >= baseSort)
    .sort((a, b) => Number(b.sortOrder ?? 0) - Number(a.sortOrder ?? 0));

  const existingSlug = String(existing.slug ?? "").trim();
  let nextSlug = existingSlug ? slugify(`${existingSlug}-copy`) : "";
  if (nextSlug) {
    const used = new Set(
      sameTheme
        .map((d) => String(d.slug ?? "").trim())
        .filter(Boolean),
    );
    let i = 2;
    while (used.has(nextSlug)) {
      nextSlug = slugify(`${existingSlug}-copy-${i}`);
      i += 1;
    }
  }

  const titleBase = String(existing.title ?? "Section").trim() || "Section";
  const nextTitle = `${titleBase} (copy)`;

  const created = await prisma.$transaction(async (tx) => {
    for (const row of toShift) {
      await tx.homepageSectionDraft.update({
        where: { id: Number(row.id) },
        data: { sortOrder: Number(row.sortOrder ?? 0) + 1 },
      });
    }

    return tx.homepageSectionDraft.create({
      data: {
        type: existing.type as any,
        title: nextTitle,
        slug: nextSlug ? nextSlug : null,
        enabled: Boolean(existing.enabled),
        sortOrder: baseSort,
        config: withThemeKey(existing.config ?? {}, themeKey),
      },
    });
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({
    notice: encodeURIComponent("Section berhasil diduplikat."),
    anchor: `section-${created.id}`,
    sectionId: created.id,
  });
}


// ========================
// THEME actions (dynamic slots)
// Disimpan sebagai "meta row" di homepageSectionDraft:
// - slug: __theme_meta__theme_x
// - enabled: false (tidak ikut preview)
// - config: { __isThemeMeta: true, __themeKey: "theme_x", themeName: "..." }
// ========================
function defaultThemeName(themeKey: ThemeKey) {
  if (themeKey === "theme_1") return "Theme 1";
  const short = String(themeKey).replace(/^theme_/, "").slice(0, 12);
  return short ? `Theme ${short}` : "Theme";
}

async function ensureThemeMeta(themeKey: ThemeKey, themeName?: string) {
  "use server";

  const slug = themeMetaSlug(themeKey);
  const existing = await prisma.homepageSectionDraft.findFirst({ where: { slug } });

  if (existing) {
    if (themeName && typeof themeName === "string") {
      const cfg = (existing.config ?? {}) as any;
      await prisma.homepageSectionDraft.update({
        where: { id: existing.id },
        data: { config: { ...cfg, __isThemeMeta: true, __themeKey: themeKey, themeName: themeName.trim() } },
      });
    }
    return;
  }

  await prisma.homepageSectionDraft.create({
    data: {
      // gunakan type yang VALID (enum) agar tidak perlu migrate
      type: "CUSTOM_PROMO" as any,
      title: "__THEME_META__",
      slug,
      enabled: false,
      sortOrder: 0,
      config: { __isThemeMeta: true, __themeKey: themeKey, themeName: (themeName || defaultThemeName(themeKey)).trim() },
    },
  });
}


async function createTheme() {
  "use server";

  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const used = new Set<ThemeKey>();
  for (const d of allDrafts as any[]) {
    if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
  }

  // Jika belum ada theme, buat "theme_1" biar familiar.
  let nextKey: ThemeKey = used.size === 0 ? DEFAULT_THEME_KEY : "";
  if (!nextKey) {
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 7);
    nextKey = `theme_${ts}_${rnd}`;
    while (used.has(nextKey)) {
      const rnd2 = Math.random().toString(36).slice(2, 7);
      nextKey = `theme_${ts}_${rnd2}`;
    }
  }

  const nextName = `Theme ${used.size + 1}`;
  await ensureThemeMeta(nextKey, nextName);

  revalidatePath(ADMIN_TOKO_PATH);
  redirect(
    `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(nextKey)}`
  );
}


async function renameTheme(formData: FormData) {
  "use server";

  const themeKey = normalizeThemeKey(formData.get("themeKey"));
  const themeName = (formData.get("themeName") as string | null)?.trim() ?? "";
  if (!themeName) {
    return redirectBack({ error: encodeURIComponent("Nama theme wajib diisi.") });
  }

  await ensureThemeMeta(themeKey, themeName);
  revalidatePath(ADMIN_TOKO_PATH);
  return redirectBack({ notice: encodeURIComponent("Nama theme disimpan.") });
}

async function resetTheme(formData: FormData) {
  "use server";

  const themeKey = normalizeThemeKey(formData.get("themeKey"));
  await ensureThemeMeta(themeKey);

  const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  const ids = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === themeKey)
    .map((d) => d.id);

  if (ids.length) {
    await prisma.homepageSectionDraft.deleteMany({ where: { id: { in: ids } } });
  }

  revalidatePath(ADMIN_TOKO_PATH);
  return redirectBack({ notice: encodeURIComponent("Theme berhasil di-reset (kosong).") });
}

async function saveBranchesDraftConfig(formData: FormData) {
  "use server";

  const id = parseNum(formData.get("id"));
  if (!id) return redirectBack({ error: encodeURIComponent("ID section tidak valid.") });

  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!existing || existing.type !== "BRANCHES") {
    return redirectBack({ error: encodeURIComponent("Section BRANCHES tidak ditemukan.") });
  }

  const themeKey = getThemeKeyFromRow(existing);

  // Parse form data
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const sectionTheme = (formData.get("sectionTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
  const sectionBgTheme = (formData.get("sectionBgTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
  const layout = (formData.get("layout") as string | null)?.trim() === "grid" ? "grid" : "carousel";

  // Parse branch IDs from checkboxes
  const branchIdsRaw = formData.getAll("branchIds");
  const branchIds = parseNumArray(branchIdsRaw as string[]);

  // Build new config
  const newConfig = {
    __themeKey: themeKey,
    sectionTheme,
    sectionBgTheme,
    layout,
    branchIds,
  };

  // Update database
  await prisma.homepageSectionDraft.update({
    where: { id },
    data: {
      title,
      config: newConfig,
    },
  });

  revalidatePath(ADMIN_TOKO_PATH);
  revalidatePath(`${ADMIN_TOKO_PATH}/preview`);
  return redirectBack({ notice: encodeURIComponent("Konfigurasi BRANCHES berhasil disimpan.") });
}

async function autoGenerateThemeContent(formData: FormData) {
  "use server";

  const rawThemeKey = normalizeThemeKey(formData.get("themeKey"));
  const themeKey = rawThemeKey || (await getThemeKeyFromReferer());
  if (!themeKey) return;

  await ensureThemeMeta(themeKey);

  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });
  const existing = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d))
    .filter((d) => getThemeKeyFromRow(d) === themeKey);

  if (existing.length) {
    return redirectBack({
      error: encodeURIComponent("Theme sudah ada section. Kosongkan dulu dengan Drop All."),
    });
  }

  const [categoriesRaw, imagesRaw, productsRaw, themeMeta] = await Promise.all([
    prisma.kategoriProduk.findMany({
      orderBy: { id: "asc" },
      select: { id: true, nama: true, slug: true },
    }),
    prisma.gambarUpload.findMany({
      orderBy: { id: "desc" },
      take: 400,
      select: { id: true, url: true, title: true },
    }),
    prisma.produk.findMany({
      orderBy: { id: "desc" },
      take: 12,
      select: { id: true },
    }),
    prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } }),
  ]);

  const categories = (categoriesRaw ?? []) as any[];
  const images = (imagesRaw ?? []) as any[];
  const pngImages = images.filter((img) => isPngUrl(img.url));

  const themeNameRaw = String((themeMeta?.config as any)?.themeName ?? "").trim();
  const themeName = themeNameRaw || "Apix Interior";

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

  const makeSeoLabel = (baseRaw: string, seed: number) => {
    const base = limitWords(toTitleCase(baseRaw), 4);
    const scopeWord = scopeWords[seed % scopeWords.length];
    const templateIdx = seed % templates.length;
    const templated = templates[templateIdx].replace("{base}", base).replace("{scope}", scopeWord);
    return limitWords(ensureScopeLabel(templated.trim(), scopeWord), 6);
  };

  const usedSlugs = new Set<string>();
  const makeUniqueSlug = (base: string) => {
    let slug = slugify(base);
    if (!slug) return "";
    if (!usedSlugs.has(slug)) {
      usedSlugs.add(slug);
      return slug;
    }
    let i = 2;
    while (usedSlugs.has(`${slug}-${i}`)) i += 1;
    const next = `${slug}-${i}`;
    usedSlugs.add(next);
    return next;
  };

  const usedImageIds = new Set<number>();

  const pickBestAnyImage = (label: string) => {
    let best: { id: number; score: number } | null = null;
    for (const img of images) {
      const score = scoreImageMatch(label, img);
      if (score < 10) continue;
      if (!best || score > best.score) best = { id: Number(img.id), score };
    }
    return best?.id ?? null;
  };

  const heroLabelBase = categories.length ? getCategoryLabel(categories[0]) : themeName;
  const heroImageId = pickBestAnyImage(heroLabelBase) ?? (images[0] ? Number(images[0].id) : null);

  const heroConfig = {
    headline: "Kurasi Furnitur & Interior Premium",
    subheadline: "Belanja mebel pilihan untuk rumah, office, dan ruang keluarga.",
    ctaLabel: "Belanja Sekarang",
    ctaHref: "/cari",
    eyebrow: themeName,
    heroTheme: "FOLLOW_NAVBAR",
    sectionTheme: "FOLLOW_NAVBAR",
    imageId: Number.isFinite(Number(heroImageId)) ? Number(heroImageId) : null,
  };

  const textBlocks = [
    {
      mode: "subtitle",
      text: "Kurasi mebel dan interior untuk rumah tangga, office, dan bangunan lainnya.",
    },
    {
      mode: "body",
      text:
        "Temukan furnitur pilihan yang selaras dengan desain ruang tamu, dapur, kamar, hingga area kerja. " +
        "Kami pilihkan produk berkualitas agar tampilan rapi, nyaman, dan mudah dirawat.",
    },
    {
      mode: "caption",
      text: "Tips: pilih material yang tahan lama agar investasi interior lebih awet.",
    },
  ];

  const textConfig = {
    sectionTheme: "FOLLOW_NAVBAR",
    blocks: textBlocks,
    text: "",
    mode: "body",
    align: "left",
    width: "normal",
  };

  const commerceCats = categories.slice(0, Math.min(8, categories.length));
  const commerceItems = commerceCats.map((cat, idx) => {
    const baseRaw = getCategoryLabel(cat);
    const label = makeSeoLabel(baseRaw, idx + Number(cat.id || 0));
    const slug = makeUniqueSlug(buildSeoSlug(label) || slugify(String(cat.slug ?? baseRaw)));
    const imageId = pickBestImage(baseRaw, pngImages, usedImageIds);
    if (imageId) usedImageIds.add(Number(imageId));
    return {
      type: "category",
      key: `cat-${cat.id}`,
      kategoriId: Number(cat.id),
      slug,
      label,
      imageId: Number.isFinite(Number(imageId)) ? Number(imageId) : null,
      tabId: "",
    };
  });

  const commerceConfig = {
    sectionTheme: "FOLLOW_NAVBAR",
    layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16, mode: "commerce" },
    items: commerceItems,
    tabs: [],
  };

  const gridCats = categories.slice(0, Math.min(6, categories.length));
  const gridItems = gridCats.map((cat) => {
    const baseRaw = getCategoryLabel(cat);
    const imageId = pickBestImage(baseRaw, pngImages);
    return {
      kategoriId: Number(cat.id),
      coverImageId: Number.isFinite(Number(imageId)) ? Number(imageId) : null,
    };
  });

  const gridConfig = {
    sectionTheme: "FOLLOW_NAVBAR",
    layout: { columns: 3, maxItems: Math.max(6, gridItems.length) || 6 },
    items: gridItems,
  };

  const productIds = (productsRaw ?? [])
    .map((p: any) => Number(p.id))
    .filter((n: number) => Number.isFinite(n));

  const productConfig = {
    sectionTheme: "FOLLOW_NAVBAR",
    title: "Produk Pilihan",
    description: "",
    productIds,
    showPrice: true,
    showCta: true,
  };

  const sectionsToCreate = [
    { type: "HERO", title: "", slug: "hero", config: heroConfig },
    { type: "CATEGORY_GRID_COMMERCE", title: "", slug: "grid-category-commerce", config: commerceConfig },
    { type: "TEXT_SECTION", title: "", slug: "text-section", config: textConfig },
    { type: "PRODUCT_CAROUSEL", title: "", slug: "carousel-produk", config: productConfig },
    { type: "CATEGORY_GRID", title: "", slug: "kategori-produk", config: gridConfig },
  ];

  const last = await prisma.homepageSectionDraft.findFirst({ orderBy: { sortOrder: "desc" } });
  let sortOrder = last ? Number(last.sortOrder ?? 0) + 1 : 1;

  const created = await prisma.$transaction(
    sectionsToCreate.map((s) =>
      prisma.homepageSectionDraft.create({
        data: {
          type: s.type as any,
          title: s.title,
          slug: s.slug || null,
          enabled: true,
          sortOrder: sortOrder++,
          config: withThemeKey(s.config ?? {}, themeKey),
        },
      }),
    ),
  );

  const firstId = created[0]?.id ? Number(created[0].id) : null;

  revalidatePath(ADMIN_TOKO_PATH);
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  revalidatePath("/");
  return redirectBack({
    notice: encodeURIComponent("Auto-generate theme berhasil dijalankan."),
    anchor: firstId ? `section-${firstId}` : undefined,
    sectionId: firstId ?? undefined,
  });
}


async function duplicateThemeSimple(formData: FormData) {
  "use server";

  const fromRaw = (formData.get("fromKey") ?? formData.get("from")) as any;
  const fromKey = normalizeThemeKey(fromRaw);

  const newThemeName = (formData.get("newThemeName") as string | null)?.trim() ?? "";
  if (!newThemeName) {
    return redirectBack({ error: "Nama theme baru wajib diisi." });
  }

  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  const used = new Set<ThemeKey>();
  for (const d of allDrafts as any[]) {
    if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
  }

  const ts = Date.now().toString(36);
  let toKey: ThemeKey = `theme_${ts}_${Math.random().toString(36).slice(2, 7)}`;
  while (used.has(toKey)) {
    toKey = `theme_${ts}_${Math.random().toString(36).slice(2, 7)}`;
  }

  await ensureThemeMeta(toKey, newThemeName);

  const fromRows = (allDrafts as any[]).filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === fromKey);

  await prisma.$transaction(
    fromRows.map((d) =>
      prisma.homepageSectionDraft.create({
        data: {
          type: d.type as any,
          title: d.title,
          slug: d.slug,
          enabled: d.enabled,
          sortOrder: d.sortOrder,
          config: withThemeKey(d.config ?? {}, toKey),
        },
      })
    )
  );

  revalidatePath(ADMIN_TOKO_PATH);
  redirect(
    `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}`
  );
}

async function duplicateTheme(formData: FormData) {
  "use server";

  const fromRaw = (formData.get("fromKey") ?? formData.get("from")) as any;
  const toRaw = (formData.get("toKey") ?? formData.get("to")) as any;

  const fromKey = normalizeThemeKey(fromRaw);
  const toChoice = String(toRaw ?? "").trim();

  const allDrafts = await prisma.homepageSectionDraft.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
  });

  let toKey: ThemeKey;
  if (toChoice === "__new__") {
    const used = new Set<ThemeKey>();
    for (const d of allDrafts as any[]) {
      if (isThemeMetaRow(d)) used.add(getThemeKeyFromRow(d));
    }
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).slice(2, 7);
    toKey = `theme_${ts}_${rnd}`;
    while (used.has(toKey)) {
      const rnd2 = Math.random().toString(36).slice(2, 7);
      toKey = `theme_${ts}_${rnd2}`;
    }
  } else {
    toKey = normalizeThemeKey(toChoice);
  }

  if (fromKey === toKey) {
    return redirectBack({ error: encodeURIComponent("Theme asal dan tujuan tidak boleh sama.") });
  }

  await ensureThemeMeta(toKey);

  const fromRows = (allDrafts as any[]).filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === fromKey);

  const toIds = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === toKey)
    .map((d) => d.id);

  await prisma.$transaction([
    ...(toIds.length ? [prisma.homepageSectionDraft.deleteMany({ where: { id: { in: toIds } } })] : []),
    ...fromRows.map((d) =>
      prisma.homepageSectionDraft.create({
        data: {
          type: d.type as any,
          title: d.title,
          slug: d.slug,
          enabled: d.enabled,
          sortOrder: d.sortOrder,
          config: withThemeKey(d.config ?? {}, toKey),
        },
      }),
    ),
  ]);

  revalidatePath(ADMIN_TOKO_PATH);

  if (toChoice === "__new__") {
    redirect(
      `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}`
    );
  }

  return redirectBack({ notice: encodeURIComponent("Theme berhasil diduplikat (overwrite).") });
}

async function deleteTheme(formData: FormData) {
  "use server";

  const themeKey = normalizeThemeKey(formData.get("themeKey"));
  const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

  const ids = (allDrafts as any[])
    .filter((d) => !isThemeMetaRow(d) && getThemeKeyFromRow(d) === themeKey)
    .map((d) => d.id);

  const slug = themeMetaSlug(themeKey);

  await prisma.$transaction([
    ...(ids.length ? [prisma.homepageSectionDraft.deleteMany({ where: { id: { in: ids } } })] : []),
    prisma.homepageSectionDraft.deleteMany({ where: { slug } }),
  ]);

  revalidatePath(ADMIN_TOKO_PATH);
  // Redirect explicitly to base path to avoid "Referer" resurrecting the deleted theme.
  return redirect(`${ADMIN_TOKO_PATH}?notice=${encodeURIComponent("Theme berhasil dihapus.")}`);
}


async function saveHeroConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const clearHero = String(formData.get("clearHero") ?? "") === "1";
  const incomingImageId = parseNum(formData.get("imageId"));

  // Read existing config so we can preserve values when a form doesn't send them (e.g. clear-image form)
  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = (existing?.config ?? {}) as any;
  const existingHeroContent = (existing as any)?.heroContent ?? null;
  const headlineRaw = formData.get("headline");
  const subheadlineRaw = formData.get("subheadline");
  const ctaLabelRaw = formData.get("ctaLabel");
  const ctaHrefRaw = formData.get("ctaHref");
  const eyebrowRaw = formData.get("eyebrow");

  const parseLines = (v: any, max: number) =>
    String(typeof v === "string" ? v : "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);

  const badges = parseLines(formData.get("badges"), 6);
  const highlights = parseLines(formData.get("highlights"), 6);
  const trustChips = parseLines(formData.get("trustChips"), 8);

  const miniInfo = [1, 2, 3]
    .map((idx) => {
      const title = String(formData.get(`miniTitle${idx}`) ?? "").trim();
      const desc = String(formData.get(`miniDesc${idx}`) ?? "").trim();
      return title || desc ? { title, desc } : null;
    })
    .filter(Boolean) as { title: string; desc: string }[];

  const floatLookbookTitle = String(formData.get("floatLookbookTitle") ?? "").trim();
  const floatLookbookSubtitle = String(formData.get("floatLookbookSubtitle") ?? "").trim();
  const floatPromoTitle = String(formData.get("floatPromoTitle") ?? "").trim();
  const floatPromoText = String(formData.get("floatPromoText") ?? "").trim();

  const headline =
    typeof headlineRaw === "string" ? headlineRaw.trim() : String(existingCfg?.headline ?? "").trim();
  const subheadline =
    typeof subheadlineRaw === "string" ? subheadlineRaw.trim() : String(existingCfg?.subheadline ?? "").trim();
  const ctaLabel =
    typeof ctaLabelRaw === "string" ? ctaLabelRaw.trim() : String(existingCfg?.ctaLabel ?? "").trim();
  const ctaHref =
    typeof ctaHrefRaw === "string" ? ctaHrefRaw.trim() : String(existingCfg?.ctaHref ?? "").trim();
  const eyebrow =
    typeof eyebrowRaw === "string" ? eyebrowRaw.trim() : String(existingCfg?.eyebrow ?? "").trim();

  const rawSectionThemeMaybe =
    (formData.get("sectionTheme") as string | null) ?? (formData.get("heroTheme") as string | null) ?? null;
  const rawSectionThemeExisting = (existingCfg?.sectionTheme ?? existingCfg?.heroTheme ?? null) as string | null;
  const rawHeroTheme = (typeof rawSectionThemeMaybe === "string" ? rawSectionThemeMaybe : rawSectionThemeExisting)?.trim() ?? "FOLLOW_NAVBAR";
  const sectionThemeOpt = parseSectionTheme(rawHeroTheme);

  const existingImageId =
    Number.isFinite(Number(existingCfg?.imageId)) && Number(existingCfg?.imageId) > 0
      ? Number(existingCfg?.imageId)
      : Number.isFinite(Number(existingCfg?.heroImageId)) && Number(existingCfg?.heroImageId) > 0
        ? Number(existingCfg?.heroImageId)
        : null;

  const finalImageId = clearHero ? null : (incomingImageId ?? existingImageId);

  const { imageIds: validImageIds } = await filterExistingIds({ imageIds: finalImageId ? [finalImageId] : [] });
  const finalImageIdToSave = validImageIds && validImageIds.length > 0 ? validImageIds[0] : null;
  const removedImage = finalImageId && !finalImageIdToSave;

  const heroContent = {
    eyebrow,
    badges,
    highlights,
    trustChips,
    miniInfo,
    floatLookbookTitle,
    floatLookbookSubtitle,
    floatPromoTitle,
    floatPromoText,
  };
  const themeKey = getThemeKeyFromRow(existing);
  const nextCfgBase = {
    ...(existingCfg ?? {}),
    eyebrow,
    headline,
    subheadline,
    ctaLabel,
    ctaHref,
    imageId: finalImageIdToSave,
    heroImageId: finalImageIdToSave,
    badges,
    highlights,
    trustChips,
    miniInfo,
    floatLookbookTitle,
    floatLookbookSubtitle,
    floatPromoTitle,
    floatPromoText,
    heroContent,
  };
  if (sectionThemeOpt) {
    nextCfgBase.sectionTheme = sectionThemeOpt;
    nextCfgBase.heroTheme = sectionThemeOpt;
  } else {
    delete (nextCfgBase as any).sectionTheme;
    delete (nextCfgBase as any).heroTheme;
  }

  const nextCfg = withThemeKey(nextCfgBase, themeKey);

  await updateDraftConfigPreserveTheme(id, nextCfg);

  // heroHeadline etc tetap di luar config untuk schema optimization (jika ada di schema)
  await prisma.homepageSectionDraft.update({
    where: { id },
    data: {
      heroHeadline: headline || null,
      heroSubheadline: subheadline || null,
      heroCtaLabel: ctaLabel || null,
      heroCtaHref: ctaHref || null,
      heroContent,
    },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  const notice = removedImage
    ? "Config HERO tersimpan (gambar tidak ditemukan telah direset)."
    : "Config HERO tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice) });
}



async function saveCategoryGridConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  // Metadata (title/slug) disimpan via tombol utama (kanan bawah)
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;


  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = legacyToNewConfig("CATEGORY_GRID", existingRow?.config);
  const existingItems = Array.isArray((existingCfg as any)?.items) ? (existingCfg as any).items : [];
  const existingCoverByKategori = new Map(
    existingItems.map((it: any) => [Number(it?.kategoriId), (Number(it?.coverImageId) || 0) > 0 ? Number(it.coverImageId) : null])
  );

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const sectionBgTheme = parseBgThemeLocal(formData.get("sectionBgTheme"));

  const rawTitleTextColor = (formData.get("titleTextColor") as string | null)?.trim() ?? "";
  const titleTextColor =
    rawTitleTextColor === "NAVY" || rawTitleTextColor === "GOLD" || rawTitleTextColor === "WHITE"
      ? rawTitleTextColor
      : null;


  const columnsRaw = Number((formData.get("columns") as string | null) ?? "3");
  const columns = clampInt(columnsRaw, 2, 6);

  const maxItemsStr = (formData.get("maxItems") as string | null)?.trim() ?? "";
  const maxItems = maxItemsStr ? clampInt(Number(maxItemsStr), 1, 60) : null;

  const selectedKategoriIds = parseNumArray((formData.getAll("kategoriIds") as string[]) ?? []);

  const items = selectedKategoriIds.map((kategoriId) => {
    const coverKey = `coverImageId_${kategoriId}`;
    let cover: number | null = null;

    if (formData.has(coverKey)) {
      const c = parseNum(formData.get(coverKey));
      cover = c && c > 0 ? c : null;
    } else {
      const prev = existingCoverByKategori.get(kategoriId) as number | null | undefined;
      cover = prev && prev > 0 ? prev : null;
    }

    return { kategoriId, coverImageId: cover };
  });

  const finalItems = maxItems ? items.slice(0, maxItems) : items;
  const finalKategoriIds = finalItems.map((it) => it.kategoriId);
  const coverIds = finalItems
    .map((it) => it.coverImageId)
    .filter((v): v is number => typeof v === "number" && v > 0);

  const { kategoriIds: validKategoriIds, imageIds: validCoverIds } = await filterExistingIds({ kategoriIds: finalKategoriIds, imageIds: coverIds });
  const finalKategoriIdsToSave = validKategoriIds ?? [];
  const finalCoverIdsToSave = validCoverIds ?? [];

  const removedKategoriCount = finalKategoriIds.length - finalKategoriIdsToSave.length;
  const removedCoverCount = coverIds.length - finalCoverIdsToSave.length;

  // Re-filter items based on valid categories
  const filteredItems = finalItems.filter(it => finalKategoriIdsToSave.includes(it.kategoriId)).map(it => {
    if (it.coverImageId && !finalCoverIdsToSave.includes(it.coverImageId)) {
      return { ...it, coverImageId: null };
    }
    return it;
  });

  await updateDraftConfigPreserveTheme(
    id,
    {
      ...(sectionTheme ? { sectionTheme } : {}),
      sectionBgTheme,
      titleTextColor,
      layout: { columns, ...(maxItems ? { maxItems } : {}) },
      items: filteredItems,
    },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  let msg = "Config CATEGORY_GRID tersimpan.";
  if (removedKategoriCount > 0 || removedCoverCount > 0) {
    msg += ` (Dibersihkan: ${removedKategoriCount} kategori, ${removedCoverCount} cover tak ditemukan).`;
  }
  return redirectBack({ notice: encodeURIComponent(msg) });
}

async function saveCategoryGridCommerceConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const anchor = String(formData.get("returnTo") ?? "").trim();

  const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const descriptionRaw = (formData.get("description") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;
  const modeRaw = String(formData.get("layoutMode") ?? "").toLowerCase().trim();
  const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
  const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
  const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
  const sectionThemeValue =
    normalizedSectionTheme === "FOLLOW_NAVBAR" ||
      (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
      ? normalizedSectionTheme
      : "FOLLOW_NAVBAR";

  const sectionBgTheme = parseBgThemeLocal(formData.get("sectionBgTheme"));

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: {
      title: titleRaw,
      slug,
      description: descriptionRaw || null,
    },
  });

  // SAFEGUARD: Check if itemsJson is missing (Client Component failed to mount)
  const itemsJsonRaw = formData.get("itemsJson");
  if (itemsJsonRaw === null) {
    return redirectBack({ error: encodeURIComponent("Gagal menyimpan: Editor belum siap (tunggu component loading dulu).") });
  }

  const itemsJson = (itemsJsonRaw as string) || "[]";
  let parsed: any[] = [];
  try {
    const raw = JSON.parse(itemsJson);
    parsed = Array.isArray(raw) ? raw : [];
  } catch {
    parsed = [];
  }

  const tabsJsonRaw = formData.get("tabsJson");
  const tabsJson = (tabsJsonRaw as string) || "[]";
  let tabsParsed: Array<{ id: string; label: string }> = [];
  try {
    const rawTabs = JSON.parse(tabsJson);
    tabsParsed = Array.isArray(rawTabs) ? rawTabs : [];
  } catch {
    tabsParsed = [];
  }

  const tabs = tabsParsed
    .map((t) => ({
      id: String(t?.id ?? "").trim(),
      label: String(t?.label ?? "").trim(),
    }))
    .filter((t) => t.id && t.label)
    .slice(0, 6);
  const tabIds = new Set(tabs.map((t) => t.id));
  const fallbackTabId = tabs[0]?.id ?? "";

  const kategoriIdsInOrder: number[] = [];
  for (const it of parsed) {
    if (String(it?.type ?? "category") === "custom") continue;
    const idNum = Number(it?.kategoriId);
    if (Number.isFinite(idNum)) kategoriIdsInOrder.push(idNum);
  }

  const kategoriIds = Array.from(new Set(kategoriIdsInOrder));
  const categoryRows = kategoriIds.length
    ? await prisma.kategoriProduk.findMany({
      where: { id: { in: kategoriIds } },
      select: { id: true, nama: true, slug: true },
    })
    : [];
  const categoryMap = new Map(categoryRows.map((k) => [Number(k.id), k]));

  const seenKategori = new Set<number>();
  const seenSlug = new Set<string>();
  const warnings: string[] = [];
  let items: Array<{
    type: "category" | "custom";
    kategoriId?: number;
    slug?: string;
    label?: string;
    imageId?: number | null;
    href?: string;
    imageUrl?: string;
    tabId?: string;
  }> = [];

  for (const it of parsed) {
    const type = String(it?.type ?? "category") === "custom" ? "custom" : "category";
    const tabIdRaw = String(it?.tabId ?? "").trim();
    const tabId = tabIdRaw && tabIds.has(tabIdRaw) ? tabIdRaw : fallbackTabId;

    if (type === "custom") {
      const label = String(it?.label ?? "").trim();
      const href = String(it?.href ?? "").trim();
      const imageUrl = String(it?.imageUrl ?? "").trim();

      if (!label) {
        return redirectBack({ error: encodeURIComponent("Nama tampil item custom wajib diisi.") });
      }
      if (!href) {
        return redirectBack({ error: encodeURIComponent(`Link wajib diisi untuk "${label}".`) });
      }

      const imageIdNum = Number(it?.imageId);
      const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;

      items.push({
        type: "custom",
        label,
        href,
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(tabId ? { tabId } : {}),
      });
      continue;
    }

    const kategoriId = Number(it?.kategoriId);
    if (!Number.isFinite(kategoriId)) continue;

    if (seenKategori.has(kategoriId)) {
      return redirectBack({ error: encodeURIComponent("Grid Category Commerce tidak boleh ada kategori duplikat.") });
    }
    seenKategori.add(kategoriId);

    const cat = categoryMap.get(kategoriId);
    if (!cat) {
      return redirectBack({ error: encodeURIComponent(`Kategori #${kategoriId} tidak ditemukan.`) });
    }

    const label = String(it?.label ?? "").trim();
    const slugInput = String(it?.slug ?? "").trim();
    const fallbackSlug = String(cat.slug ?? "").trim() || slugify(String(cat.nama ?? ""));
    const finalSlug = slugify(slugInput || fallbackSlug);

    if (!finalSlug) {
      return redirectBack({ error: encodeURIComponent(`Slug kosong untuk kategori "${cat.nama ?? kategoriId}".`) });
    }

    if (seenSlug.has(finalSlug)) {
      return redirectBack({ error: encodeURIComponent("Slug Grid Category Commerce harus unik.") });
    }
    seenSlug.add(finalSlug);

    const imageIdNum = Number(it?.imageId);
    const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;

    items.push({
      type: "category",
      kategoriId,
      slug: finalSlug,
      ...(label ? { label } : {}),
      ...(imageId ? { imageId } : {}),
      ...(tabId ? { tabId } : {}),
    });
  }

  if (items.length < 8) {
    warnings.push("Minimal 8 item agar grid terlihat layak.");
  }

  if (items.length % 4 !== 0) {
    warnings.push("Jumlah item bukan kelipatan 4.");
  }

  if (items.length > 16) {
    warnings.push("Maksimal 16 item, sisanya tidak ditampilkan.");
    items = items.slice(0, 16);
  }

  const imageIds = items
    .map((it) => it.imageId)
    .filter((v): v is number => typeof v === "number" && v > 0);

  const { kategoriIds: validKategoriIds, imageIds: validImageIds } = await filterExistingIds({
    kategoriIds: items.map((it) => it.kategoriId).filter((v): v is number => typeof v === "number"),
    imageIds,
  });
  const finalKategoriIdsToSave = validKategoriIds ?? [];
  const finalImageIdsToSave = validImageIds ?? [];

  const removedKategoriCount = items.filter(it => it.type === 'category').length - items.filter(it => it.type === 'category' && finalKategoriIdsToSave.includes(it.kategoriId as number)).length;
  const removedImageCount = imageIds.length - finalImageIdsToSave.length;

  const filteredItems = items.filter(it => {
    if (it.type === 'category') return finalKategoriIdsToSave.includes(it.kategoriId as number);
    return true;
  }).map(it => {
    if (it.imageId && !finalImageIdsToSave.includes(it.imageId)) {
      return { ...it, imageId: null };
    }
    return it;
  });

  await updateDraftConfigPreserveTheme(id, {
    sectionTheme: sectionThemeValue,
    sectionBgTheme,
    description: descriptionRaw,
    layout: { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16, mode },
    items: filteredItems,
    tabs,
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  let notice = warnings.length
    ? `Config Grid Category Commerce tersimpan. Warning: ${warnings.join(" ")}`
    : "Config Grid Category Commerce tersimpan.";

  if (removedKategoriCount > 0 || removedImageCount > 0) {
    notice += ` (Dibersihkan: ${removedKategoriCount} kategori, ${removedImageCount} icon/gambar tak ditemukan).`;
  }

  return redirectBack({ notice: encodeURIComponent(notice), anchor, sectionId: id });
}

async function saveTextSectionConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const anchor = String(formData.get("returnTo") ?? "").trim();

  const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  const blocksJson = (formData.get("blocksJson") as string | null) ?? "[]";
  let blocksRaw: Array<{ mode?: string; text?: string }> = [];
  try {
    const parsed = JSON.parse(blocksJson);
    blocksRaw = Array.isArray(parsed) ? parsed : [];
  } catch {
    blocksRaw = [];
  }

  const modeRaw = String(formData.get("mode") ?? "body").toLowerCase();
  const mode =
    modeRaw === "heading" || modeRaw === "subtitle" || modeRaw === "caption" ? modeRaw : "body";
  const alignRaw = String(formData.get("align") ?? "left").toLowerCase();
  const align = alignRaw === "center" ? "center" : "left";
  const widthRaw = String(formData.get("width") ?? "normal").toLowerCase();
  const width = widthRaw === "wide" ? "wide" : "normal";
  const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
  const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
  const sectionTheme =
    normalizedSectionTheme === "FOLLOW_NAVBAR" ||
      (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
      ? normalizedSectionTheme
      : "FOLLOW_NAVBAR";

  const normalizedBlocks = blocksRaw
    .map((b) => ({
      mode: String(b?.mode ?? "body").toLowerCase(),
      text: String(b?.text ?? "").trim(),
    }))
    .filter((b) => b.text.length > 0)
    .map((b) => ({
      mode: b.mode === "heading" || b.mode === "subtitle" || b.mode === "caption" ? b.mode : "body",
      text: b.text,
    }))
    .slice(0, 8);

  const fallbackText = normalizedBlocks.length ? "" : String((formData.get("text") ?? "")).trim();
  if (!normalizedBlocks.length && !fallbackText) {
    return redirectBack({ error: encodeURIComponent("Teks wajib diisi."), anchor, sectionId: id });
  }

  await updateDraftConfigPreserveTheme(
    id,
    {
      text: fallbackText,
      mode,
      align,
      width,
      sectionTheme,
      blocks: normalizedBlocks,
    },
    { title: titleRaw, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Text Section tersimpan."), anchor, sectionId: id });
}

async function clearProductCarouselProducts(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!existingRow) {
    return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });
  }

  const existingCfg: any = legacyToNewConfig("PRODUCT_CAROUSEL", existingRow.config);

  const nextCfg = {
    sectionTheme: String(existingCfg?.sectionTheme ?? "FOLLOW_NAVBAR"),
    title: String(existingCfg?.title ?? "").trim(),
    description: String(existingCfg?.description ?? "").trim(),
    productIds: [] as number[],
    showPrice: Boolean(existingCfg?.showPrice ?? true),
    showCta: Boolean(existingCfg?.showCta ?? true),
  };

  await updateDraftConfigPreserveTheme(id, nextCfg);

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  return redirectBack({ notice: encodeURIComponent("Produk PRODUCT_CAROUSEL dikosongkan.") });
}

async function saveProductCarouselConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  // Metadata (title/slug) disimpan via tombol utama (kanan bawah)
  const metaTitle = (formData.get("title") as string | null)?.trim() ?? "";
  const metaSlugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const metaSlug = metaSlugRaw ? slugify(metaSlugRaw) : null;



  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = legacyToNewConfig("PRODUCT_CAROUSEL", existingRow?.config);

  const sectionTheme = parseSectionTheme((formData.get("sectionTheme") as string | null) ?? (existingCfg as any)?.sectionTheme ?? null);

  // UI saat ini tidak selalu mengirim title/description, jadi kita preserve nilai existing kalau field kosong.
  const titleFromForm = (formData.get("carouselTitle") as string | null);
  const descFromForm = (formData.get("carouselDescription") as string | null);

  const title = (titleFromForm !== null ? titleFromForm : String((existingCfg as any)?.title ?? "")).trim();
  const description = (descFromForm !== null ? descFromForm : String((existingCfg as any)?.description ?? "")).trim();
  const showPrice = (formData.get("showPrice") as string | null) === "true";
  const showCta = (formData.get("showCta") as string | null) === "true";

  const clearProducts = (((formData.get("clearProducts") as string | null) ?? "").trim() === "1");

  // ordered: hidden inputs in <li> with name="productIds"
  const productIds = clearProducts ? [] : parseNumArray((formData.getAll("productIds") as string[]) ?? []);

  const { productIds: validProductIds } = await filterExistingIds({ productIds });
  const finalProductIdsToSave = validProductIds ?? [];
  const removedCount = productIds.length - finalProductIdsToSave.length;

  await updateDraftConfigPreserveTheme(
    id,
    {
      ...(sectionTheme ? { sectionTheme } : {}),
      title,
      description,
      productIds: finalProductIdsToSave,
      showPrice,
      showCta,
      sectionBgTheme: parseBgThemeLocal(formData.get("sectionBgTheme")),
    },
    { title: metaTitle, slug: metaSlug },
  );
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  const notice = removedCount > 0
    ? `Config PRODUCT_CAROUSEL tersimpan (${removedCount} produk tak ditemukan dihapus).`
    : "Config PRODUCT_CAROUSEL tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice) });
}

async function clearProductListingProducts(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!existingRow) {
    return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });
  }

  const existingCfg: any = legacyToNewConfig("PRODUCT_LISTING", existingRow.config);

  const nextCfg = {
    sectionTheme: String(existingCfg?.sectionTheme ?? "FOLLOW_NAVBAR"),
    title: String(existingCfg?.title ?? "").trim(),
    productIds: [] as number[],
  };

  await updateDraftConfigPreserveTheme(id, nextCfg);

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  return redirectBack({ notice: encodeURIComponent("Produk PRODUCT_LISTING dikosongkan.") });
}

async function pickAllProductListingProducts(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!row) return redirectBack({ error: "Section draft tidak ditemukan link." });

  const existingCfg: any = legacyToNewConfig("PRODUCT_LISTING", row.config);

  // Ambil semua produk (limit 300 agar config tidak terlalu besar)
  const all = await prisma.produk.findMany({ select: { id: true }, orderBy: { id: "desc" }, take: 300 });
  const productIds = all.map((p) => p.id);

  const nextCfg = {
    sectionTheme: String(existingCfg?.sectionTheme ?? "FOLLOW_NAVBAR"),
    title: row.title ?? "",
    productIds,
  };

  await updateDraftConfigPreserveTheme(id, nextCfg);
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent(`Berhasil mengambil ${productIds.length} produk terbaru.`) });
}

async function saveProductListingConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const anchor = String(formData.get("returnTo") ?? "").trim();

  // 1. Metadata (title/slug/description) disimpan di level row (opsional) atau config
  // Di sini kita simpan title & slug ke row DB (untuk keperluan listing admin)
  const titleRaw = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  // 2. Config specifics
  const rawSectionTheme = (formData.get("sectionTheme") as string | null) ?? "";
  const normalizedSectionTheme = normalizeThemeAttr(rawSectionTheme);
  const sectionThemeValue =
    normalizedSectionTheme === "FOLLOW_NAVBAR" ||
      (normalizedSectionTheme && ALLOWED_THEMES.includes(normalizedSectionTheme as any))
      ? normalizedSectionTheme
      : "FOLLOW_NAVBAR";

  const clearProducts = ((formData.get("clearProducts") as string | null) ?? "").trim() === "1";

  // Parse productIds from multiple hidden inputs
  const productIds = clearProducts ? [] : parseNumArray((formData.getAll("productIds") as string[]) ?? []);

  const { productIds: validProductIds } = await filterExistingIds({ productIds });
  const finalProductIdsToSave = validProductIds ?? [];
  const removedCount = productIds.length - finalProductIdsToSave.length;

  await updateDraftConfigPreserveTheme(
    id,
    {
      sectionTheme: sectionThemeValue,
      title: titleRaw,
      productIds: finalProductIdsToSave,
      sectionBgTheme: parseBgThemeLocal(formData.get("sectionBgTheme")),
    },
    { title: titleRaw, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  const notice = removedCount > 0
    ? `Config PRODUCT_LISTING tersimpan (${removedCount} produk tak ditemukan dihapus).`
    : "Config PRODUCT_LISTING tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice), anchor, sectionId: id });
}

async function saveCustomPromoConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const isAutosave = String(formData.get("cpAutosave") ?? "") === "1";

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  const layoutRaw = String(formData.get("layout") ?? "carousel").toLowerCase();
  const layout = layoutRaw === "grid" ? "grid" : layoutRaw === "hero" ? "hero" : "carousel";
  const sectionBgTheme = parseBgThemeLocal(formData.get("sectionBgTheme"));

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = normalizeCustomPromoConfig(row?.config);
  const existingLinks =
    existingCfg && typeof existingCfg.voucherLinks === "object" && existingCfg.voucherLinks !== null
      ? (existingCfg.voucherLinks as Record<number, string>)
      : {};

  const formVoucherIds = parseNumArray((formData.getAll("voucherImageIds") as string[]) ?? []);
  const voucherImageIds = normalizeVoucherImageIds(
    formVoucherIds.length ? formVoucherIds : existingCfg?.voucherImageIds,
  );

  const voucherLinks: Record<number, string> = { ...existingLinks };
  for (const vid of voucherImageIds) {
    const catRaw = formData.get(`voucherCategory_${vid}`) as string | null;
    const catId = catRaw ? Number(catRaw) : NaN;
    const linkRaw = (formData.get(`voucherLink_${vid}`) as string | null)?.trim() ?? "";
    const modeRaw = (formData.get(`voucherLinkMode_${vid}`) as string | null)?.trim() ?? "";
    const mode = modeRaw === "category" || modeRaw === "manual" ? modeRaw : "";

    // Jika user pilih mode, patuhi mode. Jika tidak pilih mode, biarkan nilai lama.
    if (mode === "category") {
      if (Number.isFinite(catId) && catId > 0) {
        voucherLinks[vid] = `category:${catId}`;
      } else {
        delete voucherLinks[vid];
      }
    } else if (mode === "manual") {
      if (linkRaw) {
        voucherLinks[vid] = linkRaw;
      } else {
        delete voucherLinks[vid];
      }
    } else if (mode === "" && (Number.isFinite(catId) && catId > 0)) {
      // fallback: kalau radio tak terpilih tapi kategori diisi (mis. dari auto-fill), simpan kategori
      voucherLinks[vid] = `category:${catId}`;
    } else if (mode === "" && linkRaw) {
      // fallback: kalau radio tak terpilih tapi link diisi, simpan link
      voucherLinks[vid] = linkRaw;
    }
  }

  const { imageIds: validVoucherIds } = await filterExistingIds({ imageIds: voucherImageIds });
  const finalVoucherIds = validVoucherIds ?? [];
  const removedCount = voucherImageIds.length - finalVoucherIds.length;

  // Cleanup voucherLinks from removed IDs
  const finalVoucherLinks = { ...voucherLinks };
  Object.keys(finalVoucherLinks).forEach((key) => {
    if (!finalVoucherIds.includes(Number(key))) {
      delete finalVoucherLinks[Number(key)];
    }
  });

  // Validasi ketat ukuran sesuai mode meskipun gambar dipilih dari galeri
  if (finalVoucherIds.length) {
    let firstSize: { width: number; height: number } | null = null;
    const checks = await Promise.all(
      finalVoucherIds.map(async (imgId) => {
        const rec = await prisma.gambarUpload.findUnique({ where: { id: imgId }, select: { url: true } });
        if (!rec || !rec.url) return { ok: false, msg: `Gambar #${imgId} tidak ditemukan.` };
        const filePath = path.join(process.cwd(), "public", rec.url.replace(/^\//, ""));
        try {
          const meta = await sharp(filePath).metadata();
          const width = meta.width ?? 0;
          const height = meta.height ?? 0;
          const isHero = layout === "hero";
          if (!width || !height) {
            return { ok: false, msg: `Metadata gambar #${imgId} tidak lengkap.` };
          }
          if (isHero) {
            if (width !== 3000 || height !== 1000) {
              return { ok: false, msg: `Hero wajib 3000x1000. Gambar #${imgId} tidak sesuai.` };
            }
          } else {
            if (width < 2300 || width > 4000 || height !== 1000) {
              return { ok: false, msg: `Carousel/Grid wajib 2300x1000 s.d. 4000x1000. Gambar #${imgId} tidak sesuai.` };
            }
          }
          if (!isHero) {
            if (!firstSize) firstSize = { width, height };
            if (firstSize.width !== width || firstSize.height !== height) {
              return { ok: false, msg: `Ukuran voucher harus seragam dengan voucher pertama agar rapi.` };
            }
          }
          return { ok: true };
        } catch {
          // Allow save even if metadata fails (e.g. file missing on disk)
          // This prevents blocking other updates like background theme.
          return { ok: true };
        }
      }),
    );
    const fail = checks.find((c) => !c.ok);
    if (fail && fail.msg) return redirectBack({ error: encodeURIComponent(fail.msg) });
  }

  const normalizedVouchers =
    layout === "hero" && finalVoucherIds.length > 0 ? [finalVoucherIds[0]] : finalVoucherIds;

  // selalu simpan format baru (menghapus ketergantungan bannerPromoId)
  await updateDraftConfigPreserveTheme(
    id,
    {
      layout,
      sectionBgTheme,
      voucherImageIds: normalizedVouchers,
      ...(Object.keys(finalVoucherLinks).length ? { voucherLinks: finalVoucherLinks } : {}),
      ...(existingCfg?._legacyBannerPromoId !== undefined ? { _legacyBannerPromoId: existingCfg._legacyBannerPromoId } : {}),
    },
    { title, slug },
  );

  if (isAutosave) {
    return;
  }

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  const notice = removedCount > 0
    ? `Config CUSTOM_PROMO tersimpan (${removedCount} voucher tak ditemukan dihapus).`
    : "Config CUSTOM_PROMO tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice), forceReload: true });
}

async function saveTestimonialsConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const subtitle = (formData.get("subtitle") as string | null)?.trim() ?? "";
  const mapsUrl = (formData.get("mapsUrl") as string | null)?.trim() ?? "";
  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const sectionBgTheme = (formData.get("sectionBgTheme") as string | null) ?? "NAVY";

  const reviewsJson = (formData.get("reviews") as string | null) ?? "[]";
  let reviews: any[] = [];
  try {
    reviews = JSON.parse(reviewsJson);
  } catch (e) {
    reviews = [];
  }

  // Preserve theme
  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const themeKey = getThemeKeyFromRow(existingRow);
  const existingCfg = (existingRow?.config ?? {}) as any;

  const newConfig = {
    ...existingCfg,
    title,
    subtitle,
    mapsUrl,
    reviews,
    sectionTheme,
    sectionBgTheme,
  };

  await updateDraftConfigPreserveTheme(id, withThemeKey(newConfig, themeKey));

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Testimoni berhasil disimpan.") });
}

// Inline helper: enforce voucher link/kategori mutual exclusivity on the client (no hydration needed)
const voucherLinkScript = `
(() => {
  const showNotice = (msg) => {
    const existing = document.getElementById('cp-notice-modal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'cp-notice-modal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(5, 8, 20, 0.6)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'grid';
    overlay.style.placeItems = 'center';
    overlay.style.padding = '16px';

    const card = document.createElement('div');
    card.style.width = 'min(520px, 94vw)';
    card.style.background = 'linear-gradient(180deg, #fff9e8 0%, #ffffff 100%)';
    card.style.border = '1px solid rgba(212,175,55,0.65)';
    card.style.borderRadius = '18px';
    card.style.padding = '18px';
    card.style.boxShadow = '0 22px 44px rgba(2,6,23,0.35)';
    card.style.color = '#111';
    card.style.position = 'relative';

    const title = document.createElement('div');
    title.textContent = 'Info';
    title.style.fontWeight = '900';
    title.style.fontSize = '17px';
    title.style.color = '#0b1c3f';

    const body = document.createElement('div');
    body.textContent = msg;
    body.style.marginTop = '10px';
    body.style.fontSize = '14px';
    body.style.lineHeight = '1.5';

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.justifyContent = 'flex-end';
    actions.style.marginTop = '14px';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'OK';
    btn.style.padding = '9px 16px';
    btn.style.borderRadius = '12px';
    btn.style.border = '1px solid #d4af37';
    btn.style.background = 'linear-gradient(180deg, #e8c763 0%, #caa136 100%)';
    btn.style.color = '#fff';
    btn.style.fontWeight = '800';
    btn.style.cursor = 'pointer';
    btn.addEventListener('click', () => overlay.remove());

    const badge = document.createElement('div');
    badge.textContent = 'INFO';
    badge.style.position = 'absolute';
    badge.style.top = '10px';
    badge.style.right = '10px';
    badge.style.background = '#0b1c3f';
    badge.style.color = '#fff';
    badge.style.fontSize = '10px';
    badge.style.letterSpacing = '0.08em';
    badge.style.padding = '6px 8px';
    badge.style.borderRadius = '999px';

    actions.appendChild(btn);
    card.appendChild(badge);
    card.appendChild(title);
    card.appendChild(body);
    card.appendChild(actions);
    overlay.appendChild(card);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.body.appendChild(overlay);
    setTimeout(() => {
      try {
        overlay.remove();
      } catch {}
    }, 3000);
  };

  const forms = document.querySelectorAll('[data-cp-form]');
  forms.forEach((form) => {
    let autosaveTimer = null;
    const sectionId = form.getAttribute('data-cp-form') || '';
    const saveVoucherLink = async (id, mode, catVal, linkVal) => {
      if (!sectionId) return;
      try {
        await fetch('/api/admin/admin_dashboard/admin_pengaturan/toko/custom_promo_link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: Number(sectionId),
            voucherId: Number(id),
            mode,
            categoryId: catVal ? Number(catVal) : null,
            link: linkVal || '',
          }),
        });
      } catch (e) {
        console.error('Gagal simpan link voucher', e);
      }
    };

    const applyVoucherMode = (id, mode) => {
      const catSel = form.querySelector('[data-voucher-cat="' + id + '"]');
      const linkInp = form.querySelector('[data-voucher-link="' + id + '"]');
      if (!catSel && !linkInp) return;

      const enableCat = mode === 'category';
      const enableLink = mode === 'manual';

      if (catSel) {
        if (enableCat) catSel.removeAttribute('disabled');
        else catSel.setAttribute('disabled', 'true');
      }
      if (linkInp) {
        if (enableLink) linkInp.removeAttribute('disabled');
        else linkInp.setAttribute('disabled', 'true');
      }

      if (mode === 'category' && linkInp) linkInp.value = '';
      if (mode === 'manual' && catSel) catSel.value = '';
    };

    const syncVoucherModeState = () => {
      const seen = new Set();
      form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
        const id = sel.getAttribute('data-voucher-cat');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const modeEl = form.querySelector('[data-voucher-mode="' + id + '"]:checked');
        const mode = modeEl ? modeEl.value : '';
        applyVoucherMode(id, mode);
      });
    };

    // auto-pick radio when user interacts
    form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
      const id = sel.getAttribute('data-voucher-cat');
      sel.addEventListener('change', () => {
        const r = form.querySelector('[data-voucher-mode="' + id + '"][value="category"]');
        if (r) r.checked = true;
        syncVoucherModeState();
        const catVal = sel.value ? String(sel.value).trim() : '';
        saveVoucherLink(id, 'category', catVal, '');
      });
    });
    form.querySelectorAll('[data-voucher-link]').forEach((inp) => {
      const id = inp.getAttribute('data-voucher-link');
      inp.addEventListener('input', () => {
        const r = form.querySelector('[data-voucher-mode="' + id + '"][value="manual"]');
        if (r) r.checked = true;
        syncVoucherModeState();
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
          const linkVal = inp.value ? String(inp.value).trim() : '';
          saveVoucherLink(id, 'manual', '', linkVal);
        }, 500);
      });
    });
    form.querySelectorAll('[data-voucher-mode]').forEach((radio) => {
      radio.addEventListener('change', () => {
        const r = radio;
        const id = r.getAttribute('data-voucher-mode');
        const mode = r.value;
        if (id) applyVoucherMode(id, mode);
        syncVoucherModeState();
      });
    });

    // validate before submit: no serakah, radio sesuai isian
    form.addEventListener('submit', (e) => {
      let hasError = false;
      const seen = new Set();
      form.querySelectorAll('[data-voucher-cat]').forEach((sel) => {
        const id = sel.getAttribute('data-voucher-cat');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const inp = form.querySelector('[data-voucher-link="' + id + '"]');
        const modeEl = form.querySelector('[data-voucher-mode="' + id + '"]:checked');
        const mode = modeEl ? modeEl.value : '';
        const catVal = sel.value ? String(sel.value).trim() : '';
        const linkVal = inp && inp.value ? String(inp.value).trim() : '';
        const errEl = form.querySelector('[data-voucher-error="' + id + '"]');
        const msgs = [];

        if (mode === 'category' && !catVal) {
          msgs.push('Pilih kategori atau ganti ke link manual.');
        }
        if (mode === 'manual' && !linkVal) {
          msgs.push('Isi link atau ganti ke kategori.');
        }
        if (mode === '' && catVal && linkVal) {
          msgs.push('Pilih salah satu: kategori atau link manual (bukan keduanya).');
        }

        if (errEl) {
          errEl.textContent = msgs.join(' ');
          errEl.style.display = msgs.length ? 'block' : 'none';
        }
        // Hanya blok submit kalau user mengisi keduanya sekaligus.
        if (mode === '' && catVal && linkVal) {
          hasError = true;
        }
      });
      if (hasError) {
        e.preventDefault();
        showNotice('Periksa input voucher: kategori dan link tidak boleh terisi bersamaan.');
        return;
      }

      const submitter = e.submitter;
      if (submitter && submitter.matches && submitter.matches('[data-cp-save]')) {
        showNotice('Silahkan refresh atau klik Ctrl + F5 setelah Simpan.');
      }
    });

    // initial state
    syncVoucherModeState();
  });
})();
`;

const scrollRestoreScript = `
(() => {
  const scrollToSection = () => {
    const hash = window.location.hash ? window.location.hash.replace('#', '') : '';
    const params = new URLSearchParams(window.location.search);
    const sectionId = params.get('sectionId');
    const targetId = hash || (sectionId ? 'section-' + sectionId : '');
    if (targetId) {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    }

    try {
      const saved = window.sessionStorage.getItem('toko-scroll-y');
      if (saved) {
        window.sessionStorage.removeItem('toko-scroll-y');
        const y = Number(saved);
        if (Number.isFinite(y) && y >= 0) {
          window.scrollTo({ top: y, behavior: 'auto' });
        }
      }
    } catch {
      // ignore storage errors
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(scrollToSection, 60));
  } else {
    setTimeout(scrollToSection, 60);
  }
})();
`;

const formFocusScript = `
(() => {
  const storeFormId = (form) => {
    if (!form || !form.id) return;
    if (!form.getAttribute || form.getAttribute('data-section-form') !== '1') return;
    try {
      window.sessionStorage.setItem('toko-last-form-id', form.id);
    } catch {
      // ignore storage errors
    }
  };

  const onFocus = (e) => {
    const target = e.target;
    if (!target) return;
    const form = target.closest ? target.closest('form') : null;
    if (form) storeFormId(form);
  };

  document.addEventListener('focusin', onFocus);
  document.addEventListener('click', onFocus);
  document.addEventListener('change', onFocus);
  document.addEventListener('input', onFocus);
})();
`;

async function removeCustomPromoVoucher(imageId: number, formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const target = Number(imageId);
  if (!Number.isFinite(target) || target <= 0) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = normalizeCustomPromoConfig(row?.config);
  const next = cfg.voucherImageIds.filter((v: number) => v !== target);
  const nextLinks =
    cfg && typeof (cfg as any).voucherLinks === "object" && (cfg as any).voucherLinks !== null
      ? Object.fromEntries(
        Object.entries((cfg as any).voucherLinks as Record<string, string>).filter(
          ([k]) => Number(k) !== target,
        ),
      )
      : undefined;

  const layoutRaw = (formData.get("layout") as string | null) ?? null;
  const sectionBgThemeRaw = (formData.get("sectionBgTheme") as string | null) ?? null;
  const layout = layoutRaw ? (String(layoutRaw).toLowerCase() === "grid" ? "grid" : "carousel") : cfg.layout;
  const sectionBgTheme = sectionBgThemeRaw ? parseCustomPromoBgTheme(sectionBgThemeRaw) : cfg.sectionBgTheme;

  await updateDraftConfigPreserveTheme(id, {
    ...cfg,
    layout,
    sectionBgTheme,
    voucherImageIds: next,
    ...(nextLinks ? { voucherLinks: nextLinks } : {}),
  });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Voucher dihapus.") });
}

async function moveCustomPromoVoucher(move: string, formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const [rawId, dir] = String(move ?? "").split(":");
  const target = Number(rawId);
  if (!Number.isFinite(target) || !dir) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = normalizeCustomPromoConfig(row?.config);

  const idx = cfg.voucherImageIds.findIndex((v: number) => v === target);
  if (idx < 0) return;

  const next = [...cfg.voucherImageIds];
  if (dir === "up" && idx > 0) {
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
  }
  if (dir === "down" && idx < next.length - 1) {
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  }

  const layoutRaw = (formData.get("layout") as string | null) ?? null;
  const sectionBgThemeRaw = (formData.get("sectionBgTheme") as string | null) ?? null;
  const layout = layoutRaw ? (String(layoutRaw).toLowerCase() === "grid" ? "grid" : "carousel") : cfg.layout;
  const sectionBgTheme = sectionBgThemeRaw ? parseCustomPromoBgTheme(sectionBgThemeRaw) : cfg.sectionBgTheme;

  await updateDraftConfigPreserveTheme(id, { ...cfg, layout, sectionBgTheme, voucherImageIds: next });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Urutan voucher diperbarui.") });
}

async function clearCustomPromoVouchers(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = normalizeCustomPromoConfig(row?.config);

  const layoutRaw = (formData.get("layout") as string | null) ?? null;
  const sectionBgThemeRaw = (formData.get("sectionBgTheme") as string | null) ?? null;
  const layout = layoutRaw ? (String(layoutRaw).toLowerCase() === "grid" ? "grid" : "carousel") : cfg.layout;
  const sectionBgTheme = sectionBgThemeRaw ? parseCustomPromoBgTheme(sectionBgThemeRaw) : cfg.sectionBgTheme;

  await updateDraftConfigPreserveTheme(id, {
    ...cfg,
    layout,
    sectionBgTheme,
    voucherImageIds: [],
    ...(cfg && (cfg as any).voucherLinks ? { voucherLinks: {} } : {}),
  });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Semua voucher dihapus.") });
}

async function saveSocialConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const iconKeys = ((formData.getAll("iconKeys") as string[]) ?? []).filter(Boolean);

  const { mediaIconKeys: validIconKeys } = await filterExistingIds({ mediaIconKeys: iconKeys });
  const finalIconKeys = validIconKeys ?? [];
  const removedCount = iconKeys.length - finalIconKeys.length;

  const rows = await prisma.mediaSosial.findMany({
    where: { iconKey: { in: finalIconKeys } },
    select: { iconKey: true, nama: true },
  });

  const selected = finalIconKeys
    .map((k) => rows.find((r) => r.iconKey === k))
    .filter(Boolean)
    .map((r) => ({ iconKey: (r as any).iconKey, nama: (r as any).nama ?? (r as any).iconKey }));

  await updateDraftConfigPreserveTheme(
    id,
    { ...(sectionTheme ? { sectionTheme } : {}), selected, display: { iconsOnly: true } },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  const notice = removedCount > 0
    ? `Config SOCIAL tersimpan (${removedCount} icon tak ditemukan dihapus).`
    : "Config SOCIAL tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice) });
}

async function saveFooterConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);

  const whatsapp = (formData.get("whatsapp") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const address = (formData.get("address") as string | null)?.trim() ?? "";
  const instagram = (formData.get("instagram") as string | null)?.trim() ?? "";
  const facebook = (formData.get("facebook") as string | null)?.trim() ?? "";

  const useGlobalContact = (formData.get("useGlobalContact") as string) === "1";
  const useGlobalSocial = (formData.get("useGlobalSocial") as string) === "1";

  const menuLinksRaw = String(formData.get("menuLinks") ?? "[]");
  const footerTagsRaw = String(formData.get("footerTags") ?? "[]");

  let menuLinks = [];
  try {
    menuLinks = JSON.parse(menuLinksRaw);
  } catch { }

  // Auto-generate links if empty
  if (Array.isArray(menuLinks) && menuLinks.length === 0) {
    const dynamicPages = await prisma.dynamicPage.findMany({
      where: { isPublished: true },
      orderBy: { title: "asc" },
      select: { title: true, slug: true },
    });

    if (dynamicPages.length > 0) {
      menuLinks = dynamicPages.map((p) => ({
        label: p.title,
        url: p.slug.startsWith("/") ? p.slug : `/${p.slug}`,
      }));
      // Standard contact link
      menuLinks.push({ label: "Hubungi Kami", url: "/hubungi" });
    }
  }

  let footerTags = [];
  try {
    footerTags = JSON.parse(footerTagsRaw);
  } catch { }

  await updateDraftConfigPreserveTheme(
    id,
    {
      ...(sectionTheme ? { sectionTheme } : {}),
      whatsapp,
      email,
      address,
      instagram,
      facebook,
      menuLinks,
      footerTags,
      useGlobalContact,
      useGlobalSocial,
      copyright: (formData.get("copyright") as string | null)?.trim() ?? "",
    },
    { title, slug }
  );


  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Config Footer tersimpan.") });
}

async function saveBranchesConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const branchIds = parseNumArray((formData.getAll("branchIds") as string[]) ?? []);
  const layout = ((formData.get("layout") as string | null) ?? "carousel") === "carousel" ? "carousel" : "grid";

  const { branchIds: validBranchIds } = await filterExistingIds({ branchIds });
  const finalBranchIds = validBranchIds ?? [];
  const removedCount = branchIds.length - finalBranchIds.length;

  await updateDraftConfigPreserveTheme(
    id,
    { ...(sectionTheme ? { sectionTheme } : {}), branchIds: finalBranchIds, layout },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  const notice = removedCount > 0
    ? `Config BRANCHES tersimpan (${removedCount} cabang tak ditemukan dihapus).`
    : "Config BRANCHES tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice) });
}

async function saveContactConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const hubungiIds = parseNumArray((formData.getAll("hubungiIds") as string[]) ?? []);

  // Mode "Hubungi Kami" fixed: Split Image + Button Stack
  const mode = "SPLIT_IMAGE_STACK";
  const showImage = true;

  const headerText = (formData.get("headerText") as string | null)?.trim() ?? "";
  const bodyText = (formData.get("bodyText") as string | null)?.trim() ?? "";

  // NOTE: config draft diganti total, jadi kita harus preserve imageId yang sudah ter-attach
  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = legacyToNewConfig("CONTACT", existing?.config ?? {});
  const prevImageId = Number((existingCfg as any)?.imageId);
  const imageId = Number.isFinite(prevImageId) && prevImageId > 0 ? prevImageId : null;

  // Label tombol per kontak (optional, hanya dipakai untuk yang dipilih)
  const buttonLabels: Record<string, string> = {};
  for (const hid of hubungiIds) {
    const key = String(hid);
    const v = (formData.get(`hubungiLabel_${key}`) as string | null)?.trim() ?? "";
    if (v) buttonLabels[key] = v;
  }

  const { hubungiIds: validHubungiIds, imageIds: validImageIds } = await filterExistingIds({
    hubungiIds,
    ...(imageId ? { imageIds: [imageId] } : {}),
  });
  const finalHubungiIdsToSave = validHubungiIds ?? [];
  const finalImageIdToSave = validImageIds && validImageIds.length > 0 ? validImageIds[0] : null;

  const removedHubungiCount = hubungiIds.length - finalHubungiIdsToSave.length;
  const removedImage = !!(imageId && !finalImageIdToSave);

  // SPLIT_IMAGE_STACK selalu butuh gambar (untuk input baru)
  if (!imageId) {
    return redirectBack({ error: encodeURIComponent("Section Hubungi Kami membutuhkan gambar. Silakan pilih gambar dulu.") });
  }

  await updateDraftConfigPreserveTheme(
    id,
    {
      ...(sectionTheme ? { sectionTheme } : {}),
      hubungiIds: finalHubungiIdsToSave,
      ...(Object.keys(buttonLabels).length ? { buttonLabels } : { buttonLabels: {} }),
      mode,
      showImage,
      imageId: finalImageIdToSave,
      ...(headerText ? { headerText } : {}),
      ...(bodyText ? { bodyText } : {}),
    },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  let notice = "Config CONTACT tersimpan.";
  if (removedHubungiCount > 0 || removedImage) {
    notice += ` (Dibersihkan: ${removedHubungiCount} kontak, ${removedImage ? "gambar" : ""} tak ditemukan).`;
  }
  return redirectBack({ notice: encodeURIComponent(notice) });
}

function generateContactCopy(brandRaw: string, seed: number) {
  const brand = (brandRaw || "").trim() || "apixinterior";
  const kwCore = [
    "desain interior",
    "jasa interior",
    "interior rumah",
    "custom furniture",
    "kitchen set",
    "lemari",
    "ruang tamu",
    "kamar tidur",
    "ruang kerja",
    "apartemen",
    "kantor",
    "renovasi interior",
    "ukur & survey",
    "konsultasi",
  ];

  const titleTemplates = [
    `Hubungi ${brand}  Konsultasi Desain Interior & Custom Furniture`,
    `Butuh Interior Rapi? Hubungi ${brand} Sekarang`,
    `${brand} | Konsultasi Interior, Kitchen Set, & Furniture Custom`,
    `Konsultasi Interior Cepat  ${brand} Siap Bantu`,
    `Hubungi ${brand}: Desain Interior, Produksi, & Instalasi`,
  ];

  const sentenceA = [
    `Konsultasi desain interior & custom furniture bareng tim ${brand}.`,
    `Tim ${brand} siap bantu desain interior dan produksi furniture custom.`,
    `Mulai dari konsep sampai instalasi, ${brand} bantu urus interiornya.`,
    `Ceritakan kebutuhan ruanganmu${brand} bantu cari solusi yang pas.`,
  ];

  const sentenceB = [
    `Layanan populer: ${kwCore.slice(0, 6).join(", ")}.`,
    `Fokus pengerjaan: ${kwCore.slice(2, 10).join(", ")}.`,
    `Cocok untuk rumah, apartemen, hingga kantordengan finishing rapi.`,
    `Fast response, bisa konsultasi dulu, lalu estimasi & timeline yang jelas.`,
  ];

  const sentenceC = [
    `Klik salah satu kontak di bawah untuk chat/telepon (bisa rename teks tombol).`,
    `Pilih kontak di bawahkami respons secepatnya untuk kebutuhan interior kamu.`,
    `Hubungi kami lewat kontak yang kamu pilih di bawah. Yuk mulai konsultasi!`,
    `Pilih kontak favoritmu di bawah untuk mulai diskusi proyek interior.`,
  ];

  const pick = <T,>(arr: T[]) => arr[Math.abs(seed) % arr.length];

  const headerText = pick(titleTemplates);
  const bodyText = [pick(sentenceA), pick(sentenceB), pick(sentenceC)].join(" ");

  return { headerText, bodyText };
}

async function autoGenerateContactCopy(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingCfg = legacyToNewConfig("CONTACT", existing?.config ?? {});

  // Brand dari DB: informasi_toko.namaToko
  const info = await prisma.informasiToko.findFirst({ select: { namaToko: true } });
  const brand = (info?.namaToko ?? "").trim() || "apixinterior";

  const seed = id * 131 + brand.length * 17;
  const { headerText, bodyText } = generateContactCopy(brand, seed);

  await updateDraftConfigPreserveTheme(id, {
    ...(existingCfg as any),
    headerText,
    bodyText,
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Judul & deskripsi Hubungi Kami berhasil di-auto-generate.") });
}

async function saveGalleryConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);
  const imageIds = parseNumArray((formData.getAll("imageIds") as string[]) ?? []);
  const layout = ((formData.get("layout") as string | null) ?? "grid") === "grid" ? "grid" : "carousel";

  const { imageIds: validImageIds } = await filterExistingIds({ imageIds });
  const finalImageIdsToSave = validImageIds ?? [];
  const removedCount = imageIds.length - finalImageIdsToSave.length;

  await updateDraftConfigPreserveTheme(
    id,
    { ...(sectionTheme ? { sectionTheme } : {}), imageIds: finalImageIdsToSave, layout },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  const notice = removedCount > 0
    ? `Config GALLERY tersimpan (${removedCount} gambar tak ditemukan dihapus).`
    : "Config GALLERY tersimpan.";
  return redirectBack({ notice: encodeURIComponent(notice) });
}

async function saveRoomCategoryConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;

  const sectionTheme = parseSectionTheme(formData.get("sectionTheme") as string | null);


  // Merge dengan config existing (biar kartu dinamis 1..12 aman, dan picker gambar via action tidak ke-reset)
  const existingRow = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!existingRow) return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });
  const existingCfg = legacyToNewConfig("ROOM_CATEGORY", existingRow?.config);
  const existingCards = normalizeRoomCards(existingCfg?.cards);

  const cards: RoomCard[] = existingCards.map((prev) => {
    const key = prev.key;
    const title = (formData.get(`title_${key}`) as string | null)?.trim() ?? prev.title ?? "";
    const description = (formData.get(`description_${key}`) as string | null)?.trim() ?? prev.description ?? "";
    const badge = (formData.get(`badge_${key}`) as string | null)?.trim() ?? prev.badge ?? "";
    const kategoriId = parseNum(formData.get(`kategoriId_${key}`));
    // imageId dibiarkan dari config (diubah lewat picker / tombol reset)
    return {
      key,
      title,
      description,
      badge,
      kategoriId: kategoriId ?? null,
      imageId: prev.imageId ?? null,
    };
  }).slice(0, MAX_ROOM_CARDS);

  const kategoriIds = cards.map((c) => c.kategoriId).filter((v): v is number => typeof v === "number");
  const imageIds = cards.map((c) => c.imageId).filter((v): v is number => typeof v === "number");

  const { kategoriIds: validKategoriIds, imageIds: validImageIds } = await filterExistingIds({
    kategoriIds,
    imageIds,
  });
  const finalKategoriIdsToSave = validKategoriIds ?? [];
  const finalImageIdsToSave = validImageIds ?? [];

  const removedKategoriCount = kategoriIds.length - finalKategoriIdsToSave.length;
  const removedImageCount = imageIds.length - finalImageIdsToSave.length;

  const filteredCards = cards.map((c) => ({
    ...c,
    kategoriId: c.kategoriId && finalKategoriIdsToSave.includes(c.kategoriId) ? c.kategoriId : null,
    imageId: c.imageId && finalImageIdsToSave.includes(c.imageId) ? c.imageId : null,
  }));

  await updateDraftConfigPreserveTheme(
    id,
    { ...(sectionTheme ? { sectionTheme } : {}), cards: filteredCards },
    { title, slug },
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  let notice = "Config ROOM_CATEGORY tersimpan.";
  if (removedKategoriCount > 0 || removedImageCount > 0) {
    notice += ` (Dibersihkan: ${removedKategoriCount} kategori, ${removedImageCount} gambar tak ditemukan).`;
  }
  return redirectBack({ notice: encodeURIComponent(notice) });
}

async function addRoomCategoryCard(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
  const cards = normalizeRoomCards(cfg?.cards);

  if (cards.length >= MAX_ROOM_CARDS) {
    return redirectBack({ error: encodeURIComponent(`Maksimal ${MAX_ROOM_CARDS} kartu.`) });
  }

  const key = makeRoomCardKey();
  const next: RoomCard[] = [...cards, { key, title: "", description: "", badge: "", kategoriId: null, imageId: null }];

  await updateDraftConfigPreserveTheme(id, { cards: next });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Kartu ruangan ditambahkan.") });
}

async function removeRoomCategoryCard(key: string, formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const safeKey = String(key ?? "").trim();
  if (!safeKey) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
  const cards = normalizeRoomCards(cfg?.cards);

  const next = cards.filter((c) => c.key !== safeKey);
  if (!next.length) {
    return redirectBack({ error: encodeURIComponent("Minimal harus ada 1 kartu.") });
  }

  await updateDraftConfigPreserveTheme(id, { cards: next });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Kartu ruangan dihapus.") });
}

async function moveRoomCategoryCard(move: string, formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const safeMove = String(move ?? "").trim();
  const [key, dir] = safeMove.split(":");
  if (!key || !dir) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
  const cards = normalizeRoomCards(cfg?.cards);

  const idx = cards.findIndex((c) => c.key === key);
  if (idx < 0) return;

  const next = [...cards];
  if (dir === "up" && idx > 0) {
    const tmp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = tmp;
  }
  if (dir === "down" && idx < next.length - 1) {
    const tmp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = tmp;
  }

  await updateDraftConfigPreserveTheme(id, { cards: next });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Urutan kartu diperbarui.") });
}

async function clearRoomCategoryCardImage(key: string, formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const safeKey = String(key ?? "").trim();
  if (!safeKey) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = legacyToNewConfig("ROOM_CATEGORY", row?.config);
  const cards = normalizeRoomCards(cfg?.cards);

  const next = cards.map((c) => (c.key === safeKey ? { ...c, imageId: null } : c));

  await updateDraftConfigPreserveTheme(id, { cards: next });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Gambar kartu di-reset ke mode otomatis.") });
}


async function clearHighlightCollectionProducts(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const cfg = legacyToNewConfig("HIGHLIGHT_COLLECTION", row?.config);

  const base = cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
  const next = { ...base, productIds: [], items: [] };

  await updateDraftConfigPreserveTheme(id, next);

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return redirectBack({ notice: encodeURIComponent("Produk HIGHLIGHT_COLLECTION dikosongkan.") });
}

async function saveHighlightCollectionConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const theme = (((formData.get("theme") as string | null) ?? "").trim());

  // Explicit "clear" actions (so admin bisa benar-benar mengosongkan pilihan)
  const clearHero = (((formData.get("clearHero") as string | null) ?? "").trim() === "1");
  const clearProducts = (((formData.get("clearProducts") as string | null) ?? "").trim() === "1");

  // NOTE:
  // Karena picker gambar & produk bisa di-set via action terpisah, form "Simpan" ini
  // harus merge dengan config yang sudah ada supaya tidak menghapus pilihan yang tidak ikut terkirim.
  const existingRowForMerge = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const existingConfigForMerge = (existingRowForMerge?.config ?? {}) as any;
  const existingTitleRaw =
    typeof (existingConfigForMerge as any)?.title === "string" ? String((existingConfigForMerge as any).title).trim() : "";
  const existingHeadlineRaw =
    typeof (existingConfigForMerge as any)?.headline === "string"
      ? String((existingConfigForMerge as any).headline).trim()
      : "";

  // "Judul tampil" untuk Highlight Collection bersifat opsional.
  // Penting: sebagian tombol (mis. hapus hero) bisa submit form tanpa semua field hadir,
  // jadi kita harus merge dengan existing config agar tidak mengosongkan field lain.
  const hasHeadlineField = formData.has("headline");
  const headlineFromForm = (((formData.get("headline") as string | null) ?? "")).trim();
  const headline = hasHeadlineField ? headlineFromForm : existingHeadlineRaw;

  // Backward compatible key: `title` kita samakan dengan `headline` ketika field hadir.
  // Kalau field tidak hadir, pertahankan existing `title`.
  // REMOVED HARDCODED DEFAULT "Koleksi Pilihan"
  const title = hasHeadlineField ? headline : (existingTitleRaw || "");

  const existingLayoutRaw = String((existingConfigForMerge as any)?.layout ?? "FEATURED_LEFT");
  const layoutRawFromForm = (formData.get("layout") as string | null)?.trim();
  const layoutRaw = formData.has("layout") ? (layoutRawFromForm ?? existingLayoutRaw) : existingLayoutRaw;
  const layout =
    layoutRaw === "FEATURED_TOP" || layoutRaw === "GRID" || layoutRaw === "CARDS" ? layoutRaw : "FEATURED_LEFT";

  // Hero image (opsional)
  const heroImageIdRaw = (formData.get("heroImageId") as string | null);
  const heroImageIdNum = heroImageIdRaw && heroImageIdRaw.trim() ? Number(heroImageIdRaw) : NaN;
  const heroImageId = Number.isFinite(heroImageIdNum) && heroImageIdNum > 0 ? heroImageIdNum : undefined;

  const existingHeroNum = Number((existingConfigForMerge as any)?.heroImageId);
  const existingHeroImageId: number | null =
    Number.isFinite(existingHeroNum) && existingHeroNum > 0 ? existingHeroNum : null;

  const nextHeroImageId: number | null = clearHero ? null : heroImageId !== undefined ? heroImageId : existingHeroImageId;

  const existingDescriptionRaw =
    typeof (existingConfigForMerge as any)?.description === "string"
      ? String((existingConfigForMerge as any).description).trim()
      : "";
  const descriptionFromForm = (((formData.get("description") as string | null) ?? "")).trim();
  const description = formData.has("description") ? descriptionFromForm : existingDescriptionRaw;

  const existingCtaTextRaw =
    typeof (existingConfigForMerge as any)?.ctaText === "string" ? String((existingConfigForMerge as any).ctaText).trim() : "";
  const ctaTextFromForm = (((formData.get("ctaText") as string | null) ?? "")).trim();
  const ctaText = formData.has("ctaText") ? ctaTextFromForm : existingCtaTextRaw;

  const existingCtaHrefRaw =
    typeof (existingConfigForMerge as any)?.ctaHref === "string" ? String((existingConfigForMerge as any).ctaHref).trim() : "";
  const ctaHrefFromForm = (((formData.get("ctaHref") as string | null) ?? "")).trim();
  const ctaHref = formData.has("ctaHref") ? ctaHrefFromForm : existingCtaHrefRaw;

  const existingSectionThemeRaw =
    typeof (existingConfigForMerge as any)?.sectionTheme === "string"
      ? String((existingConfigForMerge as any).sectionTheme).trim()
      : "";
  const sectionThemeFromForm = (((formData.get("sectionTheme") as string | null) ?? "")).trim();
  const sectionThemeCandidate = formData.has("sectionTheme") ? sectionThemeFromForm : existingSectionThemeRaw;
  const sectionTheme = parseSectionTheme(sectionThemeCandidate);


  // MVP: kurasi produk (ordered)
  const productIdsFromForm = parseNumArray((formData.getAll("productIds") as string[]) ?? []);
  // Marker dari ProductCarouselPicker
  const hasProductIdsField = String(formData.get("productIds__present") ?? "") === "1";

  const existingProductIds = Array.isArray((existingConfigForMerge as any)?.productIds)
    ? parseNumArray((existingConfigForMerge as any).productIds as any)
    : [];

  const rawProductIds = clearProducts ? [] : hasProductIdsField ? productIdsFromForm : existingProductIds;
  const productIds = Array.from(new Set(rawProductIds));

  const { productIds: validProductIds, imageIds: validImageIds } = await filterExistingIds({
    productIds,
    imageIds: imageIdsToValidate,
  });
  const finalProductIdsToSave = validProductIds ?? [];
  const finalImageIdsToSave = validImageIds ?? [];
  const finalHeroImageIdToSave = nextHeroImageId && finalImageIdsToSave.includes(nextHeroImageId) ? nextHeroImageId : null;

  const removedProductCount = productIds.length - finalProductIdsToSave.length;
  const removedHeroImage = !!(nextHeroImageId && !finalHeroImageIdToSave);

  // items
  const existingItems = Array.isArray((existingConfigForMerge as any)?.items) ? (existingConfigForMerge as any).items : null;
  const shouldRegenerateItems = clearProducts || hasProductIdsField || !existingItems;
  const items = shouldRegenerateItems
    ? finalProductIdsToSave.map((pid) => ({ type: "product", refId: pid, enabled: true }))
    : existingItems;

  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";
  const slug = slugRaw ? slugify(slugRaw) : null;

  await updateDraftConfigPreserveTheme(
    id,
    {
      // Backward compatible keys
      mode: "products",
      title,
      productIds: finalProductIdsToSave,

      // New keys
      layout,
      heroImageId: finalHeroImageIdToSave,

      badgeText: "",
      headline,
      description,
      ctaText,
      ctaHref,
      ...(sectionTheme ? { sectionTheme } : {}),
      items,
    },
    { title, slug }
  );

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  const msg =
    clearHero && clearProducts
      ? "Hero & produk HIGHLIGHT_COLLECTION dikosongkan."
      : clearHero
        ? "Hero HIGHLIGHT_COLLECTION dihapus."
        : clearProducts
          ? "Produk HIGHLIGHT_COLLECTION dikosongkan."
          : "Config HIGHLIGHT_COLLECTION tersimpan.";

  const themeKey = theme || String((existingConfigForMerge as any)?.__themeKey ?? "theme_1");

  // Slug already saved via updateDraftConfigPreserveTheme above

  const noticeEnc = encodeURIComponent(
    msg + (removedProductCount > 0 || removedHeroImage ? ` (${removedProductCount} produk/hero tak ditemukan dihapus).` : "")
  );
  return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?notice=${noticeEnc}&theme=${encodeURIComponent(themeKey)}`);
}
async function clearHighlightCollectionHero(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const theme = (((formData.get("theme") as string | null) ?? "").trim());

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!row) {
    const sp = new URLSearchParams();
    if (theme) sp.set("theme", theme);
    sp.set("error", encodeURIComponent("Section tidak ditemukan."));
    return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
  }

  const existingCfg: any = (row as any).config ?? {};
  const nextCfg: any = { ...(typeof existingCfg === "object" && existingCfg ? existingCfg : {}) };
  nextCfg.heroImageId = null;

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: { config: nextCfg },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  const sp = new URLSearchParams();
  if (theme) sp.set("theme", theme);
  sp.set("notice", encodeURIComponent("Hero HIGHLIGHT_COLLECTION dihapus."));
  return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
}

async function autoGenerateHighlightCollection(formData: FormData) {
  "use server";
  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;
  const theme = (((formData.get("theme") as string | null) ?? "").trim());

  const row = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!row) return;

  const existingCfg: any = (row as any).config ?? {};
  const nextCfg = {
    ...existingCfg,
    headline: "Koleksi Pilihan",
    description: "Temukan produk terbaik kami yang dikurasi khusus untuk keindahan ruangan Anda.",
    ctaText: "Lihat Semua",
    ctaHref: "/kategori",
  };

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: {
      enabled: true,
      config: nextCfg
    }
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");

  const sp = new URLSearchParams();
  if (theme) sp.set("theme", theme);
  sp.set("notice", encodeURIComponent("Text Highlight Collection berhasil di-generate otomatis."));
  return redirect(`/admin/admin_dashboard/admin_pengaturan/toko?${sp.toString()}`);
}



async function uploadImageToGallery(formData: FormData) {
  "use server";

  const file = formData.get("file");
  const title = (formData.get("title") as string | null)?.trim() ?? null;
  const tags = (formData.get("tags") as string | null)?.trim() ?? "";

  if (!file || !(file instanceof File)) {
    return redirectBack({ error: encodeURIComponent("File gambar wajib diupload.") });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Auto-compress ke WebP supaya file kecil & tajam
  const compressed = await sharp(buffer)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true }) // cukup untuk desktop, hemat size
    .webp({ quality: 78 })
    .toBuffer();

  const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
  await fs.mkdir(uploadDir, { recursive: true });

  const originalName = file.name || "image";
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_").replace(/\.webp$/i, "");
  const filename = `${Date.now()}-${safeName}.webp`;
  const filePath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/gambar_upload/${filename}`;

  await fs.writeFile(filePath, compressed);

  await prisma.gambarUpload.create({
    data: {
      url: publicUrl,
      title: title ?? safeName,
      tags,
      categoryId: null,
      subcategoryId: null,
    },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Gambar berhasil diupload ke galeri.") });
}



async function uploadImageToGalleryAndAttach(formData: FormData): Promise<{ ok: true; imageId: number; notice?: string } | { ok: false; error: string }> {
  "use server";

  try {
    const sectionId = Number(formData.get("sectionId"));
    const attach = (formData.get("attach") as string | null) ?? "";
    const kategoriIdRaw = formData.get("kategoriId") as string | null;
    const kategoriId = kategoriIdRaw ? Number(kategoriIdRaw) : NaN;

    const file = formData.get("file");
    const title = (formData.get("title") as string | null)?.trim() ?? null;
    const tags = (formData.get("tags") as string | null)?.trim() ?? "";

    const pickedRaw = ((formData.get("imageId") as string | null) ?? "").trim();
    const pickedMatch = pickedRaw.match(/^\s*(\d+)/);
    const pickedImageId = pickedMatch ? Number(pickedMatch[1]) : NaN;

    const hasUploadFile = file instanceof File && file.size > 0;
    const isCommerceIconAttach = attach.startsWith("CATEGORY_GRID_COMMERCE:icon:");
    const isCommerceCustomAttach = attach.startsWith("CATEGORY_GRID_COMMERCE:custom:");

    let imageIdToUse: number | null =
      Number.isFinite(pickedImageId) && pickedImageId > 0 ? pickedImageId : null;
    if (!sectionId || Number.isNaN(sectionId)) {
      return { ok: false, error: "SectionId tidak valid." };
    }

    const section = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
    if (!section) {
      return { ok: false, error: "Section draft tidak ditemukan." };
    }

    const sectionType = String(section.type || "").toUpperCase() as SectionTypeId;
    const sectionCfg = legacyToNewConfig(sectionType, section.config);

    if (!hasUploadFile && !imageIdToUse) {
      return { ok: false, error: "Pilih gambar dari galeri atau upload file." };
    }

    const layoutOverride = (formData.get("layout") as string | null)?.toLowerCase().trim() || null;

    if (hasUploadFile) {
      // Validation block removed for Commerce Icon PNG check.
      // Now accepting any image format and converting to WebP.

      // 1) Save file to /public/uploads/gambar_upload (same as galeri) dengan auto compress -> WebP
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
      await fs.mkdir(uploadDir, { recursive: true });

      const safeName = (title ?? (file as File).name ?? "image")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-_]/g, "")
        .slice(0, 60)
        .replace(/\.webp$/i, "");

      const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}.webp`;
      const filePath = path.join(uploadDir, filename);
      const publicUrl = `/uploads/gambar_upload/${filename}`;

      const sharpInstance = sharp(buffer);
      const meta = await sharpInstance.metadata();

      if (sectionType === "CUSTOM_PROMO") {
        const promoCfg = normalizeCustomPromoConfig(sectionCfg);
        const ratio = meta.width && meta.height ? meta.width / meta.height : null;
        const layoutRaw = layoutOverride || String(promoCfg.layout ?? "carousel").toLowerCase();
        const isHero = layoutRaw === "hero";
        const width = meta.width ?? 0;
        const height = meta.height ?? 0;
        if (!ratio || !width || !height) {
          return { ok: false, error: "Metadata gambar tidak lengkap. Coba upload ulang." };
        }
        if (isHero) {
          if (width !== 3000 || height !== 1000) {
            return { ok: false, error: "Hero wajib ukuran 3000x1000 (tidak bisa selain itu)." };
          }
        } else {
          if (width < 2300 || width > 4000 || height < 1000 || height > 1500) {
            return { ok: false, error: "Carousel/Grid wajib lebar 2300-4000 dan tinggi 1000-1500." };
          }
        }
        if (isHero) {
          const currentCount = Array.isArray(promoCfg.voucherImageIds) ? promoCfg.voucherImageIds.length : 0;
          if (currentCount >= 1) {
            return { ok: false, error: "Layout Hero hanya boleh 1 gambar. Hapus dulu sebelum upload gambar lain." };
          }
        }
      }

      // Jangan mengecilkan di bawah batas minimal per mode (hindari gagal saat attach).
      let targetWidth = 1920;
      if (isCommerceIconAttach || isCommerceCustomAttach) {
        const metaWidth = Number(meta.width ?? 0);
        targetWidth = metaWidth > 0 ? Math.min(512, metaWidth) : 512;
      }
      if (sectionType === "CUSTOM_PROMO") {
        const promoCfg = normalizeCustomPromoConfig(sectionCfg);
        const layoutRaw = layoutOverride || String(promoCfg.layout ?? "carousel").toLowerCase();
        const isHero = layoutRaw === "hero";
        const minWidthCp = isHero ? 3000 : 2300;
        const maxWidthCp = isHero ? 3000 : 4000;
        const metaWidth = meta.width ?? minWidthCp;
        targetWidth = isHero ? 3000 : Math.max(minWidthCp, Math.min(metaWidth, maxWidthCp));
      }

      const compressed = await sharpInstance
        .rotate()
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toBuffer();

      await fs.writeFile(filePath, compressed);

      // 2) Create gambar_upload row
      const created = await prisma.gambarUpload.create({
        data: {
          url: publicUrl,
          title: title ?? safeName,
          tags,
          categoryId: null,
          subcategoryId: null,
        },
        select: { id: true },
      });

      imageIdToUse = Number(created.id);
    }

    // 3) Attach to Draft section config (ONLY if attach is provided)
    if (!imageIdToUse || Number.isNaN(Number(imageIdToUse))) {
      return { ok: false, error: "Gambar tidak valid." };
    }

    const type = sectionType;
    let cfg: any = legacyToNewConfig(type, section.config);

    if (isCommerceIconAttach || isCommerceCustomAttach) {
      const rec = await prisma.gambarUpload.findUnique({ where: { id: imageIdToUse }, select: { url: true } });
      if (!rec?.url) { // Removed PNG regex check
        return { ok: false, error: "Gambar tidak valid." };
      }
    }

    const metaFromDisk = async (imgId: number) => {
      const rec = await prisma.gambarUpload.findUnique({ where: { id: imgId }, select: { url: true } });
      if (!rec || !rec.url) return null;
      const fp = path.join(process.cwd(), "public", String(rec.url).replace(/^\//, ""));
      try {
        return await sharp(fp).metadata();
      } catch {
        return null;
      }
    };

    if (attach === "HERO:imageId") {
      // HERO: simpan di dua key untuk kompatibilitas (imageId + heroImageId)
      cfg = { ...(cfg ?? {}), imageId: imageIdToUse, heroImageId: imageIdToUse };
    } else if (attach === "CUSTOM_PROMO:append" || attach === "CUSTOM_PROMO:imageId") {
      // enforce rules: ratio + width + hero single image
      const meta = await metaFromDisk(Number(imageIdToUse));

      // Declare layout variables outside metadata check so they're accessible later
      const layoutRaw = (layoutOverride || String((cfg as any)?.layout ?? "carousel")).toLowerCase();
      const isHero = layoutRaw === "hero";
      const nextLayout = isHero ? "hero" : layoutRaw === "grid" ? "grid" : "carousel";

      if (meta?.width && meta?.height) {
        // Only validate if metadata is available
        if (isHero) {
          if (meta.width !== 3000 || meta.height !== 1000) {
            throw new Error("Hero wajib ukuran 3000x1000 (tidak bisa selain itu).");
          }
        } else {
          if (meta.width < 2300 || meta.width > 4000 || meta.height < 1000 || meta.height > 1500) {
            throw new Error("Carousel/Grid wajib lebar 2300-4000 dan tinggi 1000-1500.");
          }
        }
      }
      // If metadata not available, skip validation and proceed


      const vouchers = normalizeVoucherImageIds(cfg?.voucherImageIds);
      const already = vouchers.includes(Number(imageIdToUse));
      if (!isHero && vouchers.length > 0) {
        const firstMeta = await metaFromDisk(Number(vouchers[0]));
        if (firstMeta?.width && firstMeta?.height) {
          if (firstMeta.width !== meta.width || firstMeta.height !== meta.height) {
            throw new Error("Ukuran voucher harus seragam dengan voucher pertama agar rapi.");
          }
        }
      }
      if (!already && vouchers.length >= MAX_CUSTOM_PROMO_VOUCHERS) {
        throw new Error(`Maksimal ${MAX_CUSTOM_PROMO_VOUCHERS} voucher untuk Custom Promo.`);
      }
      if (layoutRaw === "hero" && vouchers.length >= 1 && !already) {
        throw new Error("Mode Hero hanya boleh 1 gambar. Hapus dulu sebelum tambah gambar baru.");
      }
      const next = already ? vouchers : [...vouchers, imageIdToUse];
      cfg = { ...(cfg ?? {}), layout: nextLayout, voucherImageIds: next };
    } else if (attach === "CONTACT:imageId") {
      // CONTACT: attach image + auto enable showImage
      cfg = { ...(cfg ?? {}), imageId: imageIdToUse, showImage: true };
    } else if (attach === "HIGHLIGHT_COLLECTION:heroImageId") {
      cfg = { ...(cfg ?? {}), heroImageId: imageIdToUse };
    } else if (attach.startsWith("ROOM_CATEGORY:")) {
      // attach format: "ROOM_CATEGORY:<cardKey>"
      const key = attach.slice("ROOM_CATEGORY:".length).trim(); // e.g. ruang_keluarga_tamu
      if (!key) {
        return { ok: false, error: "Card key kosong untuk ROOM_CATEGORY." };
      }

      const cards = normalizeRoomCards(cfg?.cards);
      const idx = cards.findIndex((c: any) => String(c?.key) === String(key));
      if (idx < 0) {
        return { ok: false, error: `Card key "${key}" tidak ditemukan di config ROOM_CATEGORY.` };
      }
      cards[idx] = { ...cards[idx], imageId: imageIdToUse };
      cfg = { ...(cfg ?? {}), cards };
    } else if (attach === "GALLERY:append") {
      const prev = Array.isArray(cfg?.imageIds) ? cfg.imageIds : [];
      const next = Array.from(new Set([...prev.map((v: any) => Number(v)).filter(Number.isFinite), imageIdToUse]));
      cfg = { ...(cfg ?? {}), imageIds: next };
    } else if (attach.startsWith("CATEGORY_GRID:cover:")) {
      const tail = attach.slice("CATEGORY_GRID:cover:".length).trim();
      const kid = Number(tail);
      if (!kid || Number.isNaN(kid)) {
        throw new Error("KategoriId tidak valid untuk cover CATEGORY_GRID.");
      }
      const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
      const i = items.findIndex((it: any) => Number(it?.kategoriId) === kid);
      if (i >= 0) {
        items[i] = { ...items[i], coverImageId: imageIdToUse };
      } else {
        items.push({ kategoriId: kid, coverImageId: imageIdToUse });
      }
      const layout = cfg?.layout ?? { columns: 3, maxItems: 6 };
      cfg = { ...(cfg ?? {}), layout, items };
    } else if (attach === "CATEGORY_GRID:cover") {
      if (!kategoriIdRaw || Number.isNaN(kategoriId)) {
        throw new Error("Pilih kategori dulu untuk cover CATEGORY_GRID.");
      }
      const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
      const i = items.findIndex((it: any) => Number(it?.kategoriId) === kategoriId);
      if (i >= 0) {
        items[i] = { ...items[i], coverImageId: imageIdToUse };
      } else {
        // kalau kategori belum dicentang, kita tambahkan sekaligus
        items.push({ kategoriId, coverImageId: imageIdToUse });
      }
      const layout = cfg?.layout ?? { columns: 3, maxItems: 6 };
      cfg = { ...(cfg ?? {}), layout, items };

    } else if (attach.startsWith("CATEGORY_GRID_COMMERCE:icon:")) {
      const tail = attach.slice("CATEGORY_GRID_COMMERCE:icon:".length).trim();
      const kid = Number(tail);
      if (!kid || Number.isNaN(kid)) {
        throw new Error("KategoriId tidak valid untuk icon CATEGORY_GRID_COMMERCE.");
      }
      const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
      const i = items.findIndex((it: any) => Number(it?.kategoriId) === kid);
      if (i < 0) {
        throw new Error("Pilih kategori dulu sebelum upload icon.");
      }
      items[i] = { ...items[i], imageId: imageIdToUse };
      const layout = cfg?.layout ?? { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 };
      cfg = { ...(cfg ?? {}), layout, items };
    } else if (attach.startsWith("CATEGORY_GRID_COMMERCE:custom:")) {
      const key = attach.slice("CATEGORY_GRID_COMMERCE:custom:".length).trim();
      if (!key) {
        throw new Error("Key item custom tidak valid.");
      }
      const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
      const i = items.findIndex((it: any) => String(it?.key ?? "") === String(key));
      if (i < 0) {
        throw new Error("Item custom tidak ditemukan.");
      }
      items[i] = { ...items[i], imageId: imageIdToUse };
      const layout = cfg?.layout ?? { columns: 4, tabletColumns: 3, mobileColumns: 2, maxItems: 16 };
      cfg = { ...(cfg ?? {}), layout, items };

    } else if (attach.startsWith("ROOM_CATEGORY:")) {
      const key = attach.split(":")[1] ?? "";
      const safeKey = String(key).trim();
      if (!safeKey) {
        throw new Error("Key kartu ROOM_CATEGORY tidak valid.");
      }

      const cards = normalizeRoomCards(cfg?.cards);
      const next = cards.map((c) => (c.key === safeKey ? { ...c, imageId: imageIdToUse } : c));
      cfg = { ...(cfg ?? {}), cards: next };

    } else {
      // no attach -> do nothing
    }

    // Validate basic references so config tetap aman
    // STACK SYNC: We skip strict validation here to avoid blocking simple attachments.
    // Full sync/cleaning happens when user clicks "Simpan" on the section.
    // const ref = collectExistenceArgs(type, cfg);
    // await validateExistence(ref);

    if (!imageIdToUse || !Number.isFinite(imageIdToUse)) {
      return { ok: false, error: "ImageId tidak valid setelah proses upload/pilih." };
    }

    // CRITICAL FIX: Save the updated config to database!
    const themeKey = getThemeKeyFromRow(section);
    const finalCfg = withThemeKey(cfg, themeKey);

    await prisma.homepageSectionDraft.update({
      where: { id: sectionId },
      data: { config: finalCfg },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    return { ok: true, imageId: imageIdToUse as number, notice: "Gambar diupload & dipakai di section draft." };
  } catch (err: any) {
    return { ok: false, error: String(err?.message || "Gagal upload/pakai gambar.") };
  }
}


async function publishDraftToWebsite() {
  "use server";

  const themeKey = await getThemeKeyFromReferer();
  const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
  if (!meta) {
    return { ok: false, error: "Belum ada theme aktif. Buat theme dulu sebelum Publish." };
  }
  const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

  const drafts = (allDrafts as any[]).filter((d) => {
    if (isThemeMetaRow(d)) return false;
    const tk = getThemeKeyFromRow(d);
    if (tk !== themeKey) return false;

    // STRICT GHOST FILTER REMOVED: Allow sections with empty titles.
    return true;
  });

  await prisma.$transaction([
    prisma.homepageSectionPublished.deleteMany({}),
    ...drafts.map((d) =>
      prisma.homepageSectionPublished.create({
        data: {
          type: d.type as any,
          title: d.title,
          slug: d.slug,
          enabled: d.enabled,
          sortOrder: d.sortOrder,
          config: d.config,
          heroHeadline: (d as any).heroHeadline ?? null,
          heroSubheadline: (d as any).heroSubheadline ?? null,
          heroCtaLabel: (d as any).heroCtaLabel ?? null,
          heroCtaHref: (d as any).heroCtaHref ?? null,
          heroContent: (d as any).heroContent ?? null,
        },
      }),
    ),
  ]);

  revalidatePath("/");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return { ok: true, notice: "Publish berhasil." };
}


async function unpublishWebsite() {
  "use server";

  await prisma.homepageSectionPublished.deleteMany({});
  revalidatePath("/");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
  return { ok: true, notice: "Publish dihapus dari website utama." };
}



// ========================
// PAGE
// ========================

export default async function TokoPengaturanPage({
  searchParams,
}: {
  // Next versi tertentu bisa mengirim searchParams sebagai Promise.
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, any>>;
}) {
  const spAny: any = searchParams as any;
  const sp = spAny && typeof spAny.then === "function" ? await spAny : (searchParams as any);

  const noticeRaw = typeof sp?.notice === "string" ? sp.notice : "";
  const errorRaw = typeof sp?.error === "string" ? sp.error : "";
  const notice = safeDecode(noticeRaw);
  const error = safeDecode(errorRaw);
  const spTheme = typeof sp?.theme === "string" ? sp.theme : "";
  let requestedThemeKey = "";

  if (spTheme) {
    requestedThemeKey = normalizeThemeKey(spTheme);
    await ensureThemeMeta(requestedThemeKey);
  } else {
    // If no theme requested, try to use the first existing theme to avoid resurrecting deleted default theme
    const firstMeta = await prisma.homepageSectionDraft.findFirst({
      where: { slug: { startsWith: THEME_META_SLUG_PREFIX } },
      orderBy: { id: "asc" },
    });
    if (firstMeta) {
      requestedThemeKey = getThemeKeyFromRow(firstMeta);
    } else {
      requestedThemeKey = DEFAULT_THEME_KEY;
      await ensureThemeMeta(requestedThemeKey);
    }
  }

  const buildCloseUrl = (removeKeys: string[]) => {
    const params = new URLSearchParams();
    const del = new Set(removeKeys);
    if (sp && typeof sp === "object") {
      Object.entries(sp).forEach(([k, v]) => {
        if (del.has(k)) return;
        if (Array.isArray(v)) {
          v.forEach((item) => {
            if (item !== undefined && item !== null) params.append(k, String(item));
          });
        } else if (v !== undefined && v !== null) {
          params.set(k, String(v));
        }
      });
    }
    const qs = params.toString();
    return `/admin/admin_dashboard/admin_pengaturan/toko${qs ? `?${qs}` : ""}`;
  };
  const closeNoticeUrl = buildCloseUrl(["notice", "r"]);
  const closeErrorUrl = buildCloseUrl(["error", "r"]);

  const [
    navbarSetting,
    draftSectionsRaw,
    mediaSocialItemsRaw,
    categoryItemsRaw,
    hubungiItemsRaw,
    cabangItemsRaw,
    gambarItemsRaw,
    bannerPromoItemsRaw,
  ] = await Promise.all([
    prisma.navbarSetting.findUnique({ where: { id: 1 } }),
    prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } }),

    prisma.mediaSosial.findMany({ orderBy: { id: "asc" } }),
    prisma.kategoriProduk.findMany({ orderBy: { id: "asc" } }),
    prisma.hubungi.findMany({ orderBy: { id: "asc" } }),
    prisma.cabangToko.findMany({ orderBy: { id: "asc" } }),
    prisma.gambarUpload.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.bannerPromo.findMany({ orderBy: { id: "desc" }, take: 50 }),
  ]);

  const draftSections = (draftSectionsRaw ?? []) as any[];
  const mediaSocialItems = (mediaSocialItemsRaw ?? []) as any[];
  const categoryItems = (categoryItemsRaw ?? []) as any[];
  const hubungiItems = (hubungiItemsRaw ?? []) as any[];
  const cabangItems = (cabangItemsRaw ?? []) as any[];
  const gambarItems = (gambarItemsRaw ?? []) as any[];
  const bannerPromoItems = (bannerPromoItemsRaw ?? []) as any[];

  // Collect used product IDs to ensure they are fetched
  const usedProductIds = new Set<number>();
  for (const row of draftSections) {
    const t = String((row as any).type ?? "").trim().toUpperCase() as SectionTypeId;
    const cfg = (row as any).config ?? {};
    const ref = collectExistenceArgs(t, cfg);
    const ids = Array.isArray(ref?.productIds) ? ref.productIds : [];
    ids.forEach((id: any) => {
      const n = Number(id);
      if (Number.isFinite(n) && n > 0) usedProductIds.add(n);
    });
  }

  // Fetch products (latest 200 + used ones)
  const latestProducts = await prisma.produk.findMany({
    orderBy: { urutan: "asc" },
    take: 200,
    include: {
      galeri: {
        select: { gambarId: true },
        orderBy: { urutan: "asc" },
      },
    },
  });
  const fetchedIds = new Set(latestProducts.map((p) => p.id));

  const missingIds = Array.from(usedProductIds).filter((id) => !fetchedIds.has(id));
  let extraProducts: any[] = [];
  if (missingIds.length > 0) {
    extraProducts = await prisma.produk.findMany({
      where: { id: { in: missingIds } },
      include: {
        galeri: {
          select: { gambarId: true },
          orderBy: { urutan: "asc" },
        },
      },
    });
  }

  const productItems = [...latestProducts, ...extraProducts];

  // Auto-clean missing product references in draft config
  const validProductIdSet = new Set<number>(productItems.map((p: any) => Number(p.id)));
  const missingProductIds = Array.from(usedProductIds).filter((id) => !validProductIdSet.has(id));
  if (missingProductIds.length > 0) {
    const missingSet = new Set<number>(missingProductIds);
    const updates: { id: number; config: any }[] = [];

    for (const row of draftSections) {
      const cfg = (row as any).config ?? {};
      let changed = false;
      const nextCfg: any = { ...(cfg ?? {}) };

      if (Array.isArray(cfg?.productIds)) {
        const nextIds = (cfg.productIds as any[])
          .map((v) => Number(v))
          .filter((n) => Number.isFinite(n) && n > 0 && !missingSet.has(n));
        if (nextIds.length !== cfg.productIds.length) {
          nextCfg.productIds = nextIds;
          changed = true;
        }
      }

      if (Array.isArray(cfg?.items)) {
        const nextItems = (cfg.items as any[]).filter((it: any) => {
          const t = String(it?.type ?? "").toLowerCase();
          if (t !== "product") return true;
          const id = Number(it?.refId);
          if (!Number.isFinite(id)) return true;
          return !missingSet.has(id);
        });
        if (nextItems.length !== cfg.items.length) {
          nextCfg.items = nextItems;
          changed = true;
        }
      }

      if (changed) {
        const themeKey = getThemeKeyFromRow(row);
        const finalCfg = withThemeKey(nextCfg, themeKey);
        (row as any).config = finalCfg;
        updates.push({ id: Number(row.id), config: finalCfg });
      }
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((u) =>
          prisma.homepageSectionDraft.update({
            where: { id: u.id },
            data: { config: u.config },
          })
        )
      );
    }
  }

  // Map gambar_upload by id (dipakai untuk preview selection di HERO)
  const imageMap = new Map<number, { id: number; url: string; title: string; tags: string }>(
    (gambarItems as any[]).map((g: any) => [
      Number(g?.id),
      {
        id: Number(g?.id),
        url: String(g?.url ?? ""),
        title: String(g?.title ?? ""),
        tags: String(g?.tags ?? ""),
      },
    ])
  );


  // === EMERGENCY CLEANUP ===
  // Force delete the known corrupt themes if they are found in the fetch result
  const corruptKeys = ["theme_mkjikfer_7ejzs", "theme_mki79liq_99yhj"];
  const corruptIds = (draftSections as any[])
    .filter(d => {
      const k = getThemeKeyFromRow(d);
      return corruptKeys.includes(k);
    })
    .map(d => d.id);

  if (corruptIds.length > 0) {
    console.log("🔥 EMERGENCY CLEANUP: Deleting corrupt theme rows:", corruptIds);
    await prisma.homepageSectionDraft.deleteMany({
      where: { id: { in: corruptIds } }
    });
  }

  // =========================
  // THEME list (hanya theme yang sudah dibuat via meta row)
  // =========================
  const themes = (() => {
    const seen = new Set<string>();
    const out: { key: ThemeKey; name: string; _id: number }[] = [];

    (draftSections as any[]).forEach((row) => {
      if (!isThemeMetaRow(row)) return;
      const key = getThemeKeyFromRow(row);
      if (!key || seen.has(key)) return;
      const nameRaw = (row?.config as any)?.themeName;
      const name = typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : defaultThemeName(key);
      out.push({ key, name, _id: Number(row?.id ?? 0) });
      seen.add(key);
    });

    out.sort((a, b) => (a._id || 0) - (b._id || 0));
    return out.map(({ key, name }) => ({ key, name }));
  })();

  /* 
   * LOGIC UPDATE: Active Theme Key
   * Jangan paksa fallback ke existing `themes[0]` jika user meminta theme baru!
   * Ini menyebabkan "Theme Crosstalk" (edit theme A malah masuk ke theme B).
   * Kita izinkan requestedThemeKey apa saja, asalkan valid.
   */
  const activeThemeKey: ThemeKey = (() => {
    const req = normalizeThemeKey(requestedThemeKey);
    // Jika ada request spesifik di URL (misal ?theme=theme_baru), pakai itu.
    if (requestedThemeKey) {
      return req;
    }
    // Fallback: theme pertama yang ada, atau default.
    return themes.length > 0 ? themes[0].key : DEFAULT_THEME_KEY;
  })();

  const activeThemeName = activeThemeKey
    ? (themes.find((t) => t.key === activeThemeKey)?.name ?? defaultThemeName(activeThemeKey))
    : "";

  const draftSectionsForTheme = activeThemeKey
    ? draftSections.filter((d: any) => !isThemeMetaRow(d)).filter((d: any) => getThemeKeyFromRow(d) === activeThemeKey)
    : [];

  console.log(`🖼️ [Admin] ActiveTheme: ${activeThemeKey}, RenderCount: ${draftSectionsForTheme.length}`);

  // --- GHOST CLEANUP (Admin Side) ---
  // Ensure we don't display or keep "untitled" sections that might be ghosts.
  // We filter carefully to only delete rows that are definitely junk (no title, not system).
  // --- GHOST CLEANUP REMOVED ---
  // We now allow sections with empty titles to exist (as requested).
  const ghostsFound: any[] = [];

  // ----------------------------------

  draftSectionsForTheme.forEach(s => console.log(`   - ID: ${s.id}, Type: ${s.type}, Theme: ${getThemeKeyFromRow(s)}`));

  // Pastikan gambar yang direferensikan (mis: hero Highlight Collection) selalu bisa dipreview
  // walaupun tidak masuk list gambar terakhir (take: 200).
  const gambarById = new Map<number, any>(gambarItems.map((g: any) => [Number(g.id), g]));

  const highlightHeroIdsNeeded = new Set<number>();
  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "HIGHLIGHT_COLLECTION") continue;
    const heroId = Number((((row as any).config ?? {}) as any)?.heroImageId);
    if (Number.isFinite(heroId) && heroId > 0) highlightHeroIdsNeeded.add(heroId);
  }

  const missingHeroIds = Array.from(highlightHeroIdsNeeded).filter((id) => !gambarById.has(id));
  if (missingHeroIds.length) {
    const extra = await prisma.gambarUpload.findMany({
      where: { id: { in: missingHeroIds } },
      select: { id: true, url: true, title: true },
    });
    for (const g of extra as any[]) {
      gambarById.set(Number(g.id), g);
    }
  }

  // Pastikan image ROOM_CATEGORY juga bisa dipreview walau bukan "latest N"
  const roomImageIdsNeeded = new Set<number>();
  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "ROOM_CATEGORY") continue;

    const cfgRow = ((row as any).config ?? {}) as any;
    const cards = normalizeRoomCards(cfgRow.cards);
    for (const c of cards) {
      const id = Number((c as any)?.imageId);
      if (Number.isFinite(id) && id > 0) roomImageIdsNeeded.add(id);
    }
  }

  const missingRoomIds = Array.from(roomImageIdsNeeded).filter((id) => !gambarById.has(id));
  if (missingRoomIds.length) {
    const extra = await prisma.gambarUpload.findMany({
      where: { id: { in: missingRoomIds } },
      select: { id: true, url: true, title: true },
    });
    for (const g of extra as any[]) {
      gambarById.set(Number(g.id), g);
    }
  }



  // =========================
  // ROOM_CATEGORY - Auto cover (mode otomatis)
  // Ambil gambar dari produk pertama di kategori (kalau ada), supaya editor bisa menampilkan thumbnail walau imageId null.
  // Catatan: ini hanya untuk PREVIEW di admin editor; tidak mengubah config.
  // =========================
  const autoCoverImageIdByKategori = new Map<number, number>();
  const roomKategoriIdsNeeded = new Set<number>();

  for (const row of draftSectionsForTheme) {
    const t = String((row as any).type ?? "").trim().toUpperCase();
    if (t !== "ROOM_CATEGORY") continue;

    const cfgRow = ((row as any).config ?? {}) as any;
    const cards = normalizeRoomCards(cfgRow.cards);
    for (const c of cards) {
      const kid = Number((c as any)?.kategoriId);
      if (Number.isFinite(kid) && kid > 0) roomKategoriIdsNeeded.add(kid);
    }
  }

  if (roomKategoriIdsNeeded.size) {
    try {
      // menggunakan "as any" supaya tidak nge-break kalau model/schema berbeda
      const relItems = await (prisma as any).kategoriProdukItem.findMany({
        where: { kategoriId: { in: Array.from(roomKategoriIdsNeeded) } },
        orderBy: { id: "asc" },
        select: { id: true, kategoriId: true, produkId: true },
      });

      const firstProdukByKategori = new Map<number, number>();
      for (const it of (relItems as any[]) ?? []) {
        const kid = Number((it as any)?.kategoriId);
        const pid = Number((it as any)?.produkId);
        if (!Number.isFinite(kid) || kid <= 0) continue;
        if (!Number.isFinite(pid) || pid <= 0) continue;
        if (!firstProdukByKategori.has(kid)) firstProdukByKategori.set(kid, pid);
      }

      const produkIds = Array.from(firstProdukByKategori.values());
      if (produkIds.length) {
        const prods = await prisma.produk.findMany({
          where: { id: { in: produkIds } },
          select: {
            id: true,
            mainImageId: true,
            galeri: { select: { gambarId: true }, orderBy: { urutan: "asc" }, take: 1 },
          },
        });

        const prodById = new Map<number, any>(prods.map((p: any) => [Number(p.id), p]));

        for (const [kid, pid] of firstProdukByKategori) {
          const p = prodById.get(pid);
          const mainId = Number((p as any)?.mainImageId);
          let imageId: number | null = Number.isFinite(mainId) && mainId > 0 ? mainId : null;

          if (!imageId) {
            const firstGal = Number((p as any)?.galeri?.[0]?.gambarId);
            if (Number.isFinite(firstGal) && firstGal > 0) imageId = firstGal;
          }

          if (imageId) autoCoverImageIdByKategori.set(kid, imageId);
        }

        // Pastikan image auto-cover juga tersedia di gambarById map
        const missingAutoIds = Array.from(new Set(Array.from(autoCoverImageIdByKategori.values()))).filter((id) => !gambarById.has(id));
        if (missingAutoIds.length) {
          const extra = await prisma.gambarUpload.findMany({
            where: { id: { in: missingAutoIds } },
            select: { id: true, url: true, title: true },
          });
          for (const g of extra as any[]) {
            gambarById.set(Number(g.id), g);
          }
        }
      }
    } catch {
      // ignore: kalau model / field berbeda, editor tetap jalan tanpa auto thumbnail
    }
  }
  /* 
   * LOGIC UPDATE: Read Navbar Theme from DRAFT META first.
   * If draft has no specific navbar theme, fallback to global setting or default.
   */
  const activeMetaSlug = themeMetaSlug(activeThemeKey);
  const activeMetaRow = draftSections.find((r) => r.slug === activeMetaSlug);
  const activeMetaConfig = (activeMetaRow?.config ?? {}) as any;
  const draftNavbarTheme = activeMetaConfig.navbarTheme; // "NAVY_GOLD", "WHITE_GOLD", etc.

  // Prioritize draft setting -> default (NAVY_GOLD).
  // REMOVE global setting fallback to prevent crosstalk (theme lain "ikut-ikutan").
  const currentTheme: NavbarTheme = (draftNavbarTheme as NavbarTheme) ?? "NAVY_GOLD";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Pengaturan Toko</h1>
      <p className={styles.subtitle}>
        Atur tampilan homepage versi <strong>Draft</strong>, preview, lalu publish ke website utama.
      </p>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>

      </div>

      <AdminNotice
        notice={notice}
        error={error}
        closeNoticeUrl={closeNoticeUrl}
        closeErrorUrl={closeErrorUrl}
      />

      {/* NAVBAR KHUSUS TOKO: 1) Urutkan 2) Organize */}
      {/* SIDEBAR NAV (style ikut Media Sosial) */}
      <input id="tokoSidebarToggle" type="checkbox" className={styles.sidebarToggle} />

      <header className={styles.pageTopbar}>
        <label htmlFor="tokoSidebarToggle" className={styles.hamburgerBtn} aria-label="Buka menu">
          :::
        </label>
        <div className={styles.pageTopbarTitle}>Pengaturan Toko</div>
        <Link
          href="/admin/admin_dashboard/admin_pengaturan"
          className={styles.secondaryButton}
          style={{ marginLeft: "auto", textDecoration: "none" }}
        >
          <FaArrowLeft /> Kembali
        </Link>


      </header>

      <label htmlFor="tokoSidebarToggle" className={styles.sidebarOverlay} aria-label="Tutup menu" />

      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarBrand}>
            <div className={styles.sidebarAvatar} aria-hidden="true">
              A
            </div>
            <div>
              <div className={styles.sidebarBrandTitle}>APIX INTERIOR</div>
              <div className={styles.sidebarBrandSub}>Admin Dashboard</div>
            </div>
          </div>

          <label htmlFor="tokoSidebarToggle" className={styles.sidebarClose} aria-label="Tutup menu">
            <FaXmark />
          </label>


        </div>

        <div style={{ padding: "0 16px 12px" }}>

        </div>

        <nav className={styles.sidebarNav}>
          <a href="/admin/admin_dashboard/admin_pengaturan" className={`${styles.sidebarLink} ${styles.sidebarLinkBack}`}>
            <FaArrowLeft style={{ fontSize: '12px' }} /> Kembali ke Pengaturan
          </a>

          <a href="#preview-theme" className={`${styles.sidebarLink} ${styles.sidebarLinkPreview}`}>
            Preview &amp; Theme
          </a>
          <a href="#tema" className={`${styles.sidebarLink} ${styles.sidebarLinkTema}`}>
            Tema (Navbar &amp; Background)
          </a>
          <a href="#urutkan" className={`${styles.sidebarLink} ${styles.sidebarLinkUrutkan}`}>
            Urutkan Section
          </a>
          <a href="#tambah-section" className={`${styles.sidebarLink} ${styles.sidebarLinkTambah}`}>
            Tambah Section
          </a>
        </nav>
      </aside>

      {/* Aksi Preview & Publish */}
      <section id="preview-theme" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Preview & Publish</h2>
        <p className={styles.sectionSubheading}>
          Klik <strong>Preview Draft</strong> untuk melihat tampilan theme. Di halaman preview, kamu bisa klik <strong>Publish ke Website Utama</strong> untuk mempublikasikan theme ini, atau <strong>Hapus Publish</strong> untuk menghapus konten yang sudah dipublikasikan.
        </p>

        <div className={styles.sectionEditActions}>
          {activeThemeKey ? (
            <a
              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${activeThemeKey}`}
              className={styles.primaryButton}
              style={{ textDecoration: "none" }}
            >
              Preview Draft → Publish
            </a>
          ) : (
            <span className={styles.secondaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Preview Draft
            </span>
          )}
        </div>
      </section>


      {/* ================= THEME ================= */}
      <section className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Theme Draft</h2>
        <p className={styles.sectionSubheading}>
          Theme adalah paket susunan section draft. Mulai dari kosong, susun section, lalu simpan. Kamu bisa membuat{" "}
          <strong>theme sebanyak yang kamu mau</strong>.
        </p>

        <div className={styles.sectionEditActions} style={{ flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {themes.map((t) => (
            <a
              key={t.key}
              href={`${ADMIN_TOKO_PATH}?theme=${t.key}`}
              className={t.key === activeThemeKey ? styles.primaryButton : styles.secondaryButton}
              style={{ textDecoration: "none" }}
              aria-current={t.key === activeThemeKey ? "page" : undefined}
            >
              {t.name}
            </a>
          ))}

          <form action={createTheme}>
            <button type="submit" className={styles.primaryButton} style={{ fontWeight: 800 }}>
              <FaPlus /> Theme
            </button>

          </form>
        </div>

        {!themes.length ? (
          <div style={{ marginTop: 12, padding: 12, border: "1px dashed rgba(0,0,0,0.15)", borderRadius: 12 }}>
            Belum ada theme. Klik <strong>+ Theme</strong> untuk membuat theme baru (kosong), lalu susun section-nya.
          </div>
        ) : null}

        {activeThemeKey ? (
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Rename theme</h3>
              <form action={renameTheme} id="form-rename-theme" data-section-form="1">
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    name="themeName"
                    placeholder="Nama theme"
                    defaultValue={activeThemeName}
                    required
                  />
                  <button type="submit" className={styles.secondaryButton}>
                    Simpan
                  </button>
                </div>
              </form>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Reset theme jadi kosong</h3>
              <form action={resetTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <button type="submit" className={styles.dangerButton}>
                  Reset Theme
                </button>
              </form>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Duplikat theme</h3>
              <form action={duplicateThemeSimple}>
                <input type="hidden" name="fromKey" value={activeThemeKey} />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className={styles.input}
                    name="newThemeName"
                    placeholder="Nama theme baru"
                    defaultValue={`Copy dari ${activeThemeName}`}
                    required
                  />
                  <button type="submit" className={styles.secondaryButton}>
                    Buat duplikat
                  </button>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
                  Ini akan membuat theme baru dengan susunan & pengaturan section yang sama seperti theme aktif.
                </div>
              </form>

              <details style={{ marginTop: 10 }}>
                <summary style={{ cursor: "pointer", fontSize: 12, opacity: 0.85 }}>Opsi lanjut (overwrite)</summary>
                <div style={{ marginTop: 8 }}>
                  <form action={duplicateTheme}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>Dari</label>
                      <select className={styles.select} name="fromKey" defaultValue={activeThemeKey}>
                        {themes.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>Ke</label>
                      <select className={styles.select} name="toKey" defaultValue={"__new__"}>
                        {[
                          ...themes
                            .filter((t) => t.key !== (activeThemeKey || ""))
                            .map((t) => ({ key: t.key, label: `${t.name} (overwrite)` })),
                          { key: "__new__", label: "Theme baru (copy)" },
                        ].map((opt) => (
                          <option key={opt.key} value={opt.key}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className={styles.secondaryButton} style={{ marginTop: 8 }}>
                      Duplikat
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <div>
              <h3 style={{ margin: "0 0 6px", fontSize: 13, opacity: 0.9 }}>Hapus theme</h3>
              <form action={deleteTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <button type="submit" className={styles.dangerButton}>
                  Hapus Theme
                </button>
              </form>
            </div>
          </div>
        ) : null}

        {activeThemeKey ? (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
            Theme aktif: <strong>{activeThemeName}</strong>. Sections yang kamu lihat &amp; edit di bawah hanya untuk theme ini.
          </div>
        ) : null}
      </section>


      {/* ================= 2. ORGANIZE (TEMA + SECTION) ================= */}

      {/* Tema Navbar (keep) */}
      <section id="tema" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Tema Navbar</h2>
        <p className={styles.sectionSubheading}>
          Pilih kombinasi warna navbar utama yang akan tampil di website pengunjung.
        </p>

        <div className={styles.currentThemeRow}>
          <span className={styles.currentThemeLabel}>Tema aktif sekarang:</span>
          <span className={styles.currentThemeBadge}>
            {currentTheme === "NAVY_GOLD" && "Navy + Gold"}
            {currentTheme === "WHITE_GOLD" && "White + Gold"}
            {currentTheme === "NAVY_WHITE" && "Navy + White"}
            {currentTheme === "GOLD_NAVY" && "Gold + Navy"}
            {currentTheme === "GOLD_WHITE" && "Gold + White"}
            {currentTheme === "WHITE_NAVY" && "White + Navy"}

          </span>
        </div>

        <form action={updateNavbarTheme} className={styles.fieldGroup} id="form-navbar-theme" data-section-form="1">
          <label htmlFor="navbarTheme" className={styles.label}>
            Pilih tema warna navbar
          </label>
          <select id="navbarTheme" name="navbarTheme" defaultValue={currentTheme ?? ""} className={styles.select}>
            <option value="">Pilih tema navbar</option>
            <option value="NAVY_GOLD">Navy + Gold</option>
            <option value="WHITE_GOLD">White + Gold</option>
            <option value="NAVY_WHITE">Navy + White</option>
            <option value="GOLD_NAVY">Gold + Navy</option>
            <option value="GOLD_WHITE">Gold + White</option>
            <option value="WHITE_NAVY">White + Navy</option>
          </select>
          <p className={styles.helperText}>
            Tema aktif bisa kamu lihat di atas. Dropdown ini hanya untuk memilih tema baru.
          </p>

          <input type="hidden" name="themeKey" value={activeThemeKey ?? ""} />
          <button type="submit" className={styles.submitButton}>
            Simpan Tema Navbar
          </button>
        </form>
      </section>
      {/* Tambah Section Background Utama */}
      <section className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Background Utama</h2>
        <p className={styles.sectionSubheading}>
          Pilih warna background utama untuk tampilan di <code>/preview</code>. Secara default, background mengikuti warna navbar.
        </p>


        <form action={updateBackgroundTheme} className={styles.newSectionForm} id="form-background-theme" data-section-form="1">
          <input type="hidden" name="themeKey" value={activeThemeKey ?? ""} />
          <div className={styles.newSectionGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tema Background Utama</label>
              <select
                name="backgroundTheme"
                defaultValue={String(activeMetaConfig?.backgroundTheme ?? "FOLLOW_NAVBAR")}
                className={styles.select}
              >
                <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                <option value="NAVY_GOLD">Navy</option>
                <option value="WHITE_GOLD">White</option>
                <option value="GOLD_NAVY">Gold</option>
              </select>
              <p className={styles.helperText}>
                Kalau tidak diubah, background <code>/preview</code> akan otomatis mengikuti tema navbar yang aktif.
              </p>
            </div>
          </div>

          <button type="submit" className={styles.submitButton}>
            Simpan Background Utama
          </button>
        </form>

      </section>

      {/* ================= 1. URUTKAN (DRAG DROP) ================= */}
      <section id="urutkan" className={styles.formCard}>
        <div className={styles.sectionsHeader}>
          <div>
            <h2 className={styles.sectionHeading}>Urutkan Section Draft (Drag &amp; Drop)</h2>
            <p className={styles.sectionSubheading}>
              Tarik handle <span className={styles.dragHandle}><FaGripVertical /></span> ke atas/bawah untuk mengubah urutan section di
              homepage draft. Setelah diurutkan, klik tombol &quot;Simpan Urutan&quot;.
            </p>


          </div>
          <button type="button" className={`${styles.smallButton} js-save-order`}>
            Simpan Urutan
          </button>
        </div>

        {(() => { console.log(`🖼️ [Admin] Rendering ${draftSectionsForTheme.length} sections for theme: ${activeThemeKey}`); return null; })()}
        {draftSectionsForTheme.length === 0 ? (
          <p className={styles.emptyText}>
            Belum ada section draft. Tambahkan dulu minimal 1 section di tab Organize.
          </p>
        ) : (
          <div className={`${styles.sectionList} ${styles.sectionListDrag} js-section-list-drag`}>
            {(draftSectionsForTheme || []).filter((s: any) => s && typeof s === 'object' && s.type).map((section: any, index: number) => {
              const def = SECTION_DEFS.find((d) => d.type === section.type);
              const label = def?.label ?? section.type;

              return (
                <div
                  key={section.id}
                  className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""} ${styles.sectionRowDraggable} js-section-row`}
                  draggable
                  data-id={section.id.toString()}
                >
                  <div className={styles.sectionTopRow}>
                    <div className={styles.sectionTopLeft}>
                      <span className={styles.dragHandle}><FaGripVertical /></span>
                      <span className={styles.sectionOrder}>#{index + 1}</span>


                      <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>
                        <span className={styles.sectionTypeIcon} aria-hidden="true">{SECTION_ICON[section.type] ?? ""}</span>
                        {label}
                      </span>
                      <span className={styles.themeBadge} style={{ fontSize: '10px', opacity: 0.6, background: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                        {getThemeKeyFromRow(section)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                        {section.enabled ? "Aktif" : "Nonaktif"}
                      </span>
                      <DeleteSectionButton id={Number(section.id)} deleteAction={deleteDraft} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>





      {/* Tambah Section Draft */}
      <section id="tambah-section" className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Tambah Section Draft</h2>
        <p className={styles.sectionSubheading}>Tambahkan section baru ke homepage versi Draft.</p>

        <form action={createDraftSection} className={styles.newSectionForm}>
          <div className={styles.newSectionGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionType" className={styles.label}>
                Jenis section
              </label>
              <select id="newSectionType" name="type" defaultValue="" className={styles.select}>
                <option value="">Pilih jenis section</option>
                {SECTION_DEFS.map((def) => (
                  <option key={def.type} value={def.type}>
                    {def.label}
                  </option>
                ))}
              </select>
              <p className={styles.helperText}>Contoh: Hero, Grid Kategori Produk, Carousel Produk, dll.</p>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionTitle" className={styles.label}>
                Judul tampil di halaman
              </label>
              <input
                id="newSectionTitle"
                name="title"
                type="text"
                placeholder="Contoh: Produk Terbaru"
                className={styles.input}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="newSectionSlug" className={styles.label}>
                Slug (opsional)
              </label>
              <input
                id="newSectionSlug"
                name="slug"
                type="text"
                placeholder="otomatis kalau dikosongkan"
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.newSectionActions}>
            <button type="submit" className={styles.primaryButton}>
              Tambah Section Draft
            </button>
          </div>
        </form>
      </section>



      {/* Daftar Section Draft (detail + config) */}
      <section className={styles.formCard}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <h2 className={styles.sectionHeading}>Section Draft</h2>
        </div>
        <p className={styles.sectionSubheading}>
          Edit judul, slug, konfigurasi per type, serta aktif/nonaktifkan section yang sudah ada di Draft.
        </p>

        <div className={styles.sectionList}>
          {draftSectionsForTheme.length === 0 ? (
            <p className={styles.emptyText}>Belum ada section draft. Tambahkan minimal 1 section di atas.</p>
          ) : (
            (draftSectionsForTheme || []).filter((s: any) => s && typeof s === 'object' && s.type).map((section: any, index: number) => {
              const def = SECTION_DEFS.find((d) => d.type === section.type);
              const label = def?.label ?? section.type;
              const description = def?.description;

              const cfg = legacyToNewConfig(section.type, section.config ?? {});
              const legacyBannerPromoId = cfg?._legacyBannerPromoId ?? null;

              // DEBUG: Check if productIds is being loaded for PRODUCT_LISTING
              if (section.type === "PRODUCT_LISTING") {
                console.log("[DEBUG PRODUCT_LISTING] Section ID:", section.id);
                console.log("[DEBUG PRODUCT_LISTING] Raw config:", section.config);
                console.log("[DEBUG PRODUCT_LISTING] Processed cfg:", cfg);
                console.log("[DEBUG PRODUCT_LISTING] cfg.productIds:", cfg?.productIds);
              }

              return (
                <article
                  key={section.id}
                  id={`section-${section.id}`}
                  className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""}`}
                >
                  <div className={styles.sectionTopRow}>
                    <div className={styles.sectionTopLeft}>
                      <span className={styles.sectionOrder}>#{index + 1}</span>
                      <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>  <span className={styles.sectionTypeIcon} aria-hidden="true">    {SECTION_ICON[section.type] ?? ""}  </span>  {label}</span>
                      <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                        {section.enabled ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {description && <p className={styles.sectionDescription}>{description}</p>}
                      <form action={duplicateDraft} style={{ display: "inline" }}>
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <button type="submit" className={styles.secondaryButton}>
                          Duplikat
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* === CONFIG FORMS (BY TYPE) === */}

                  {/* HERO */}
                  {section.type === "HERO" && (
                    <div className={styles.sectionEditForm}>
                      {(() => {
                        const heroContent = ((cfg as any).heroContent ?? {}) as any;
                        const badgesValue = Array.isArray((heroContent as any).badges)
                          ? (heroContent as any).badges
                          : Array.isArray((cfg as any).badges)
                            ? (cfg as any).badges
                            : [];
                        const highlightsValue = Array.isArray((heroContent as any).highlights)
                          ? (heroContent as any).highlights
                          : Array.isArray((cfg as any).highlights)
                            ? (cfg as any).highlights
                            : [];
                        const trustValue = Array.isArray((heroContent as any).trustChips)
                          ? (heroContent as any).trustChips
                          : Array.isArray((cfg as any).trustChips)
                            ? (cfg as any).trustChips
                            : [];
                        const miniValue = Array.isArray((heroContent as any).miniInfo)
                          ? (heroContent as any).miniInfo
                          : Array.isArray((cfg as any).miniInfo)
                            ? (cfg as any).miniInfo
                            : [];
                        const miniAt = (idx: number, key: "title" | "desc") =>
                          String(miniValue[idx]?.[key] ?? "").trim();
                        const lookbookTitle =
                          String((heroContent as any).floatLookbookTitle ?? (cfg as any).floatLookbookTitle ?? "").trim();
                        const lookbookSubtitle =
                          String((heroContent as any).floatLookbookSubtitle ?? (cfg as any).floatLookbookSubtitle ?? "").trim();
                        const promoTitle =
                          String((heroContent as any).floatPromoTitle ?? (cfg as any).floatPromoTitle ?? "").trim();
                        const promoText =
                          String((heroContent as any).floatPromoText ?? (cfg as any).floatPromoText ?? "").trim();

                        return (
                          <>
                            {/* Form utama HERO (konsep mengikuti HIGHLIGHT_COLLECTION): slug + config disimpan dari tombol utama */}
                            <form id={`heroForm-${section.id}`} action={saveHeroConfig} className={styles.sectionEditForm} data-section-form="1">
                              <input type="hidden" name="id" value={section.id.toString()} />
                              <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                              {/* Slug (opsional) */}
                              <div style={{ maxWidth: 520 }}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Slug (opsional)</label>
                                  <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                                  <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                                </div>
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Eyebrow (chip atas)</label>
                                <input name="eyebrow" defaultValue={(heroContent as any).eyebrow ?? cfg.eyebrow ?? ""} className={styles.input} />
                                <p className={styles.helperText}>Contoh: Interior Essentials.</p>
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul</label>
                                <input name="headline" defaultValue={cfg.headline ?? ""} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Deskripsi</label>
                                <input name="subheadline" defaultValue={cfg.subheadline ?? ""} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tema Warna Hero</label>
                                <select
                                  name="sectionTheme"
                                  defaultValue={String((cfg as any).sectionTheme ?? (cfg as any).heroTheme ?? "FOLLOW_NAVBAR")}
                                  className={styles.select}
                                >
                                  <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                                  <option value="NAVY_GOLD">NAVY + GOLD</option>
                                  <option value="WHITE_GOLD">WHITE + GOLD</option>
                                  <option value="NAVY_WHITE">NAVY + WHITE</option>
                                  <option value="GOLD_NAVY">GOLD + NAVY</option>
                                  <option value="GOLD_WHITE">GOLD + WHITE</option>
                                  <option value="WHITE_NAVY">WHITE + NAVY</option>
                                </select>
                                <p className={styles.helperText}>
                                  Mengatur warna background, card, elemen (teks/garis/simbol/logo), dan CTA pada HERO.
                                  Jika Ikuti tema Navbar, warna hero otomatis mengikuti tema navbar yang aktif.
                                </p>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>CTA Label</label>
                                  <input name="ctaLabel" defaultValue={cfg.ctaLabel ?? ""} className={styles.input} />
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>CTA Href</label>
                                  <input
                                    name="ctaHref"
                                    defaultValue={cfg.ctaHref ?? ""}
                                    placeholder="contoh: /cari atau https://wa.me/..."
                                    className={styles.input}
                                  />
                                  <p className={styles.helperText}>Jika kosong, tombol CTA tidak ditampilkan.</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditActions}>
                                <button type="button" className={styles.secondaryButton + " js-hero-autofill"} data-hero-form-id={`heroForm-${section.id}`}>
                                  Auto-generate HERO
                                </button>
                                <p className={styles.helperText} style={{ margin: "6px 0 0" }}>
                                  Isi cepat dengan contoh teks (rating , produk , CS , pengiriman ).
                                </p>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Badges (tiap baris 1 item, maks 6)</label>
                                  <textarea name="badges" defaultValue={badgesValue.join("\n")} rows={4} className={styles.input} />
                                  <p className={styles.helperText}>Contoh default: Ready Stock, Kurasi Interior, Material Premium.</p>
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Highlight bullets (maks 6)</label>
                                  <textarea name="highlights" defaultValue={highlightsValue.join("\n")} rows={4} className={styles.input} />
                                  <p className={styles.helperText}>Tiap baris = 1 bullet (contoh: Gratis konsultasi styling).</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Trust chips (maks 8)</label>
                                  <textarea name="trustChips" defaultValue={trustValue.join("\n")} rows={3} className={styles.input} />
                                  <p className={styles.helperText}>Contoh: Pembayaran Aman, Garansi, Support CS.</p>
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Mini info cards</label>
                                  <div style={{ display: "grid", gap: 10 }}>
                                    {[1, 2, 3].map((idx) => (
                                      <div key={idx} style={{ display: "grid", gap: 6 }}>
                                        <input
                                          name={`miniTitle${idx}`}
                                          placeholder={`Judul ${idx}`}
                                          defaultValue={miniAt(idx - 1, "title")}
                                          className={styles.input}
                                        />
                                        <input
                                          name={`miniDesc${idx}`}
                                          placeholder={`Deskripsi ${idx}`}
                                          defaultValue={miniAt(idx - 1, "desc")}
                                          className={styles.input}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                  <p className={styles.helperText}>Kosongkan jika tidak perlu; maksimal 3 kartu kecil.</p>
                                </div>
                              </div>

                              <div className={styles.sectionEditGrid}>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Floating card Lookbook</label>
                                  <input
                                    name="floatLookbookTitle"
                                    defaultValue={lookbookTitle}
                                    className={styles.input}
                                    placeholder="Lookbook Minggu Ini"
                                  />
                                  <input
                                    name="floatLookbookSubtitle"
                                    defaultValue={lookbookSubtitle}
                                    className={styles.input}
                                    placeholder="Inspirasi ruang & koleksi pilihan"
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Floating card Promo</label>
                                  <input
                                    name="floatPromoTitle"
                                    defaultValue={promoTitle}
                                    className={styles.input}
                                    placeholder="Promo"
                                  />
                                  <input
                                    name="floatPromoText"
                                    defaultValue={promoText}
                                    className={styles.input}
                                    placeholder="Gratis ongkir* untuk area tertentu"
                                    style={{ marginTop: 6 }}
                                  />
                                </div>
                              </div>
                            </form>

                            {/* HERO MEDIA: hanya picker (hapus upload + dropdown gambar_upload) */}
                            <div className={styles.innerCard}>
                              <div style={{ fontWeight: 800, color: "rgba(17,17,17,0.9)" }}>
                                Pilih gambar dari galeri
                              </div>
                              <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12, marginTop: 6 }}>
                                Klik tombol untuk buka picker, cari (id/title/tags), lalu pilih thumbnail.
                              </div>

                              <div style={{ marginTop: 10 }}>
                                <ImagePickerCaptcha
                                  action={uploadImageToGalleryAndAttach}
                                  sectionId={section.id.toString()}
                                  attach="HERO:imageId"
                                  endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                  limit={40}
                                  buttonLabel="Buka Picker Gambar"
                                  currentImageId={Number((cfg as any)?.imageId ?? (cfg as any)?.heroImageId ?? 0) || undefined}
                                />

                                {/* Status terpasang: tetap tampil setelah sukses attach (biar tidak "hilang") */}
                                {(() => {
                                  const heroId = Number((cfg as any)?.imageId ?? (cfg as any)?.heroImageId ?? 0) || 0;
                                  if (!heroId) return null;
                                  return (
                                    <div style={{ marginTop: 10, padding: 12, background: "rgba(212, 175, 55, 0.1)", borderRadius: 12, border: "2px solid #D4AF37" }}>
                                      <div style={{ fontSize: 13, fontWeight: 900, color: "#D4AF37", marginBottom: 6 }}>
                                        ✓ HERO Image Terpasang
                                      </div>
                                      <div style={{ fontSize: 12, color: "rgba(17,17,17,0.85)" }}>
                                        Image ID: <b>#{heroId}</b>
                                      </div>
                                      <div style={{ fontSize: 11, color: "rgba(17,17,17,0.6)", marginTop: 4 }}>
                                        Klik "Buka Picker Gambar" untuk melihat atau mengganti
                                      </div>
                                    </div>
                                  );
                                })()}


                                {/* Hapus image: form terpisah (tidak nested) */}
                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                                  <form action={saveHeroConfig}>
                                    <input type="hidden" name="id" value={section.id.toString()} />
                                    <input type="hidden" name="clearHero" value="1" />
                                    <button type="submit" className={styles.secondaryButton}>
                                      Hapus Hero Image
                                    </button>
                                  </form>
                                </div>
                              </div>
                            </div>

                            {/* Tombol aksi HERO: kanan bawah section */}
                            <div className={styles.highlightFooterActions}>
                              <button type="submit" form={`heroForm-${section.id}`} className={styles.secondaryButton}>
                                Simpan
                              </button>

                              {activeThemeKey ? (
                                <a
                                  className={styles.primaryButton}
                                  href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                    activeThemeKey
                                  )}&focus=HERO&sectionId=${section.id}`}
                                >
                                  Preview
                                </a>
                              ) : (
                                <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                  Preview
                                </span>
                              )}

                              <form action={toggleDraft} style={{ display: "inline" }}>
                                <input type="hidden" name="id" value={section.id.toString()} />
                                <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                                <button type="submit" className={styles.secondaryButton}>
                                  {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </form>

                              <form action={deleteDraft} style={{ display: "inline" }}>
                                <input type="hidden" name="id" value={section.id.toString()} />
                                <button type="submit" className={styles.dangerButton}>
                                  Hapus
                                </button>
                              </form>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* TEXT_SECTION */}
                  {section.type === "TEXT_SECTION" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`textSectionForm-${section.id}`}
                        action={saveTextSectionConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul section (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug section (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Teks</label>
                            <select name="mode" defaultValue={String(cfg.mode ?? "body")} className={styles.select}>
                              <option value="heading">Heading</option>
                              <option value="subtitle">Subtitle</option>
                              <option value="body">Body</option>
                              <option value="caption">Caption</option>
                            </select>
                            <p className={styles.helperText}>
                              Ukuran dan gaya mengikuti mode, tidak bisa diatur manual.
                            </p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Alignment</label>
                            <select name="align" defaultValue={String(cfg.align ?? "left")} className={styles.select}>
                              <option value="left">Left</option>
                              <option value="center">Center</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Lebar Teks</label>
                            <select name="width" defaultValue={String(cfg.width ?? "normal")} className={styles.select}>
                              <option value="normal">Normal (~65ch)</option>
                              <option value="wide">Wide (~80ch)</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String(cfg.sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Konten</label>
                          <TextSectionBlocksEditor
                            initialBlocks={Array.isArray(cfg.blocks) ? cfg.blocks : []}
                            fallbackText={String(cfg.text ?? "")}
                            fallbackMode={String(cfg.mode ?? "body") as any}
                            formId={`textSectionForm-${section.id}`}
                          />
                          <div className={styles.sectionEditActions} style={{ marginTop: 10 }}>
                            <button
                              type="button"
                              className={styles.secondaryButton + " js-text-autofill"}
                              data-text-form-id={`textSectionForm-${section.id}`}
                            >
                              Auto-generate Text
                            </button>
                            <p className={styles.helperText} style={{ margin: "6px 0 0" }}>
                              Isi cepat: heading, subtitle, body, caption berbasis judul section.
                            </p>
                          </div>
                        </div>
                      </form>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`textSectionForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=TEXT_SECTION&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* CATEGORY_GRID */}
                  {section.type === "CATEGORY_GRID" && (
                    <div className={styles.sectionEditForm} data-section-id={section.id}>
                      <form id={`categoryGridForm-${section.id}`} action={saveCategoryGridConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>



                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Warna Teks Judul Grid (Luar Card)</label>
                            <select
                              name="titleTextColor"
                              defaultValue={String((cfg as any).titleTextColor ?? "")}
                              className={styles.select}
                            >
                              <option value="">Auto</option>
                              <option value="NAVY">NAVY</option>
                              <option value="GOLD">GOLD</option>
                              <option value="WHITE">WHITE</option>
                            </select>
                            <div className={styles.helperText}>
                              Opsional: kalau dipilih, ini akan memaksa warna judul section (teks di luar card) di preview.
                            </div>
                          </div>


                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Columns (26)</label>
                            <input
                              name="columns"
                              type="number"
                              min={2}
                              max={6}
                              defaultValue={String(cfg.layout?.columns ?? 3)}
                              className={styles.input}
                            />
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Max items (opsional)</label>
                            <input
                              name="maxItems"
                              type="number"
                              min={1}
                              max={60}
                              defaultValue={cfg.layout?.maxItems ? String(cfg.layout.maxItems) : ""}
                              className={styles.input}
                              placeholder="contoh: 6"
                            />
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Pilih kategori + cover image (opsional)</label>

                        </div>

                        <div className={styles.fieldGroup}>
                          {categoryItems.length === 0 ? (
                            <p className={styles.helperText}>Belum ada kategori di database.</p>
                          ) : (
                            categoryItems.map((cat) => {
                              const idNum = Number(cat.id);
                              const items = Array.isArray(cfg.items) ? cfg.items : [];
                              const currentItem = items.find((it: any) => Number(it?.kategoriId) === idNum);
                              const checked = Boolean(currentItem);
                              const cover = currentItem?.coverImageId ?? null;
                              const labelText =
                                (cat.namaKategori as string) ||
                                (cat.nama as string) ||
                                (cat.slug as string) ||
                                `Kategori #${cat.id}`;

                              return (
                                <div key={cat.id} className={styles.checkboxRow} style={{ alignItems: "center" }}>
                                  <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                                    <input type="checkbox" name="kategoriIds" value={String(cat.id)} defaultChecked={checked} />
                                    <span>{labelText}</span>
                                  </label>
                                  <div style={{ maxWidth: 280, width: "100%", display: "flex", justifyContent: "flex-end" }}>
                                    <ImagePickerCaptcha
                                      action={uploadImageToGalleryAndAttach}
                                      sectionId={section.id.toString()}
                                      attach={`CATEGORY_GRID:cover:${idNum}`}
                                      endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                      limit={40}
                                      buttonLabel={cover ? `Cover: #${cover}` : "(Cover otomatis)"}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                      </form>

                      {/* Tombol aksi CATEGORY_GRID: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`categoryGridForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=CATEGORY_GRID&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>



                    </div>
                  )}

                  {/* CATEGORY_GRID_COMMERCE */}
                  {section.type === "CATEGORY_GRID_COMMERCE" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`categoryGridCommerceForm-${section.id}`}
                        action={saveCategoryGridCommerceConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul section (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Subjudul (opsional)</label>
                            <input
                              name="description"
                              type="text"
                              defaultValue={section.description ?? ""}
                              className={styles.input}
                              placeholder="Contoh: Pilih kategori favoritmu"
                            />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug section (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Render</label>
                            <select
                              name="layoutMode"
                              defaultValue={String((cfg as any)?.layout?.mode ?? (cfg as any)?.mode ?? "clean")}
                              className={styles.select}
                            >
                              <option value="clean">Clean</option>
                              <option value="commerce">Commerce (garis)</option>
                              <option value="reverse">Reverse (teks kiri, gambar kanan)</option>
                            </select>
                            <p className={styles.helperText}>Clean tanpa garis, Commerce menampilkan garis grid.</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                            <p className={styles.helperText}>
                              Mengatur warna background section, grid, dan hover/active. Jika ikuti Navbar,
                              warna mengikuti tema navbar yang aktif.
                            </p>
                          </div>


                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Grid Category Commerce</label>
                          <div className={styles.helperText}>
                            Layout: Desktop 4 kolom, Tablet 3 kolom, Mobile 2 kolom. Maksimal 16 item. Slug wajib unik.
                          </div>
                        </div>

                        <CategoryCommerceGridEditorNoSSR
                          categories={categoryItems}
                          images={(gambarItems as any[]).map((g: any) => ({
                            id: Number(g.id),
                            url: String(g.url ?? ""),
                            title: String(g.title ?? ""),
                            tags: String(g.tags ?? ""),
                          }))}
                          initialItems={Array.isArray(cfg.items) ? cfg.items : []}
                          initialTabs={Array.isArray((cfg as any)?.tabs) ? (cfg as any).tabs : []}
                          mode={String((cfg as any)?.layout?.mode ?? (cfg as any)?.mode ?? "clean") as any}
                          sectionId={section.id.toString()}
                          uploadAction={uploadImageToGalleryAndAttach}
                        />
                      </form>

                      {/* Tombol aksi CATEGORY_GRID_COMMERCE: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`categoryGridCommerceForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=CATEGORY_GRID_COMMERCE&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* PRODUCT_CAROUSEL */}
                  {section.type === "PRODUCT_CAROUSEL" && (
                    <div className={styles.sectionEditForm}>
                      <form id={`productCarouselForm-${section.id}`} action={saveProductCarouselConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>




                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>



                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tampilkan harga?</label>
                            <select name="showPrice" defaultValue={String(cfg.showPrice ?? true)} className={styles.select}>
                              <option value="true">Ya</option>
                              <option value="false">Tidak</option>
                            </select>
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tampilkan CTA?</label>
                            <select name="showCta" defaultValue={String(cfg.showCta ?? true)} className={styles.select}>
                              <option value="true">Ya</option>
                              <option value="false">Tidak</option>
                            </select>
                          </div>
                        </div>


                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Kelola produk carousel</label>
                          <p className={styles.helperText}>
                            Pilih produk dengan checklist (tampil thumbnail), lalu drag &amp; drop untuk mengatur urutan tampil di carousel.
                          </p>

                          <ProductCarouselPicker
                            products={(productItems as any[]).map((p: any) => {
                              const hargaAsliNum =
                                typeof p.harga === "number" ? p.harga : Number(p.harga) || 0;

                              const pr = computeHargaSetelahPromo({
                                harga: hargaAsliNum,
                                promoAktif: (p.promoAktif as any) ?? null,
                                promoTipe: (p.promoTipe as any) ?? null,
                                promoValue: typeof p.promoValue === "number" ? p.promoValue : Number(p.promoValue) || null,
                              });

                              return {
                                id: Number(p.id),
                                nama:
                                  (p.nama as string) ||
                                  (p.namaProduk as string) ||
                                  (p.slug as string) ||
                                  `Produk #${String(p.id)}`,

                                // NOTE: harga yang dikirim ke picker kita set ke hargaFinal supaya yang tampil "harga sekarang"
                                harga: pr.hargaFinal,

                                // extra fields (kalau komponen picker mau nampilin coret & label)
                                hargaAsli: pr.hargaAsli,
                                isPromo: pr.isPromo,
                                promoLabel: pr.promoLabel,

                                promoAktif: (p.promoAktif as any) ?? null,
                                promoTipe: (p.promoTipe as any) ?? null,
                                promoValue: (p.promoValue as any) ?? null,

                                kategori: (p.kategori as string) || undefined,
                                subkategori: (p.subkategori as string) || undefined,
                                mainImageId: p.mainImageId ?? null,
                                galleryImageIds: Array.isArray((p as any).galeri)
                                  ? ((p as any).galeri as any[])
                                    .map((v: any) => Number(v.gambarId))
                                    .filter((n: any) => Number.isFinite(n))
                                  : [],
                              };
                            })}
                            images={(gambarItems as any[]).map((g: any) => ({
                              id: Number(g.id),
                              url: String(g.url),
                              title: (g.title as string) || (g.nama as string) || undefined,
                            }))}
                            initialIds={(
                              Array.isArray(cfg.productIds) ? cfg.productIds : []
                            )
                              .map((v: any) => Number(v))
                              .filter((n: any) => Number.isFinite(n))}
                            inputName="productIds"
                            showPrice={String(cfg.showPrice ?? "true") === "true"}
                            showCta={String(cfg.showCta ?? "true") === "true"}
                          />

                          <div className={styles.pickerExtraActions}>
                            <button
                              type="submit"
                              formAction={clearProductCarouselProducts}
                              className={styles.dangerButton}
                              disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              title={
                                !Array.isArray(cfg.productIds) || cfg.productIds.length === 0
                                  ? "Belum ada produk dipilih."
                                  : "Hapus semua produk yang dipilih."
                              }
                            >
                              Drop Produk
                            </button>
                          </div>
                        </div>

                      </form>

                      {/* Tombol aksi PRODUCT_CAROUSEL: kanan bawah section */}
                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`productCarouselForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=PRODUCT_CAROUSEL&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* PRODUCT_LISTING */}
                  {section.type === "PRODUCT_LISTING" && (
                    <div className={styles.sectionEditForm}>
                      <form
                        id={`productListingForm-${section.id}`}
                        action={saveProductListingConfig}
                        className={styles.sectionEditForm}
                        data-section-form="1"
                      >
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="returnTo" value={`section-${section.id}`} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                            <p className={styles.helperText}>Kosongkan bila tidak ingin judul tampil.</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>


                        </div>


                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Aturan Product Listing</label>
                          <div className={styles.helperText}>
                            Desktop: 6 kolom per baris, tampil maksimal 30. Tablet: 3 kolom, tampil maksimal 18. Mobile: 2 kolom, tampil maksimal 10.
                            Jika lebih, tombol "Tampilkan Semua" menuju /produk.
                          </div>

                          <div style={{ marginTop: 16 }}>
                            <div className={styles.pickerExtraActions} style={{ marginBottom: 12 }}>
                              <button
                                type="submit"
                                formAction={pickAllProductListingProducts}
                                className={styles.secondaryButton}
                                title="Pilih otomatis 300 produk terbaru"
                              >
                                Pick All (Auto 300 Latest)
                              </button>
                            </div>

                            <ProductCarouselPicker
                              products={(productItems as any[]).map((p: any) => {
                                const hargaAsliNum =
                                  typeof p.harga === "number" ? p.harga : Number(p.harga) || 0;

                                const pr = computeHargaSetelahPromo({
                                  harga: hargaAsliNum,
                                  promoAktif: (p.promoAktif as any) ?? null,
                                  promoTipe: (p.promoTipe as any) ?? null,
                                  promoValue: typeof p.promoValue === "number" ? p.promoValue : Number(p.promoValue) || null,
                                });

                                return {
                                  id: Number(p.id),
                                  nama:
                                    (p.nama as string) ||
                                    (p.namaProduk as string) ||
                                    (p.slug as string) ||
                                    `Produk #${String(p.id)}`,

                                  harga: pr.hargaFinal,
                                  hargaAsli: pr.hargaAsli,
                                  isPromo: pr.isPromo,
                                  promoLabel: pr.promoLabel,

                                  kategori: (p.kategori as string) || undefined,
                                  subkategori: (p.subkategori as string) || undefined,
                                  mainImageId: p.mainImageId ?? null,
                                  galleryImageIds: Array.isArray((p as any).galeri)
                                    ? ((p as any).galeri as any[])
                                      .map((v: any) => Number(v.gambarId))
                                      .filter((n: any) => Number.isFinite(n))
                                    : [],
                                };
                              })}
                              images={(gambarItems as any[]).map((g: any) => ({
                                id: Number(g.id),
                                url: String(g.url),
                                title: (g.title as string) || (g.nama as string) || undefined,
                              }))}
                              initialIds={(Array.isArray(cfg.productIds) ? cfg.productIds : [])
                                .map((v: any) => Number(v))
                                .filter((n: any) => Number.isFinite(n))}
                              inputName="productIds"
                              showPrice={true}
                              buttonLabel="Pilih Produk Listing"
                            />
                            <div className={styles.pickerExtraActions} style={{ marginTop: 8 }}>
                              <button
                                type="submit"
                                formAction={clearProductListingProducts}
                                className={styles.dangerButton}
                                title="Hapus semua produk yang dipilih"
                                disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              >
                                Drop All Produk
                              </button>
                            </div>
                          </div>
                        </div>
                      </form>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" form={`productListingForm-${section.id}`} className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=PRODUCT_LISTING&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <form action={toggleDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                          <button type="submit" className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                        </form>

                        <form action={deleteDraft} style={{ display: "inline" }}>
                          <input type="hidden" name="id" value={section.id.toString()} />
                          <button type="submit" className={styles.dangerButton}>
                            Hapus
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* CUSTOM_PROMO */}
                  {/* CUSTOM_PROMO */}
                  {section.type === "CUSTOM_PROMO" && (
                    <div className={styles.sectionEditForm}>
                      <form action={saveCustomPromoConfig} className={styles.sectionEditForm} data-cp-form={section.id} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />
                        <input type="hidden" name="cpAutosave" defaultValue="" />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Background Section</label>
                            <select
                              name="sectionBgTheme"
                              defaultValue={String((cfg as any).sectionBgTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY">NAVY (Biru Tua)</option>
                              <option value="GOLD">GOLD (Emas)</option>
                              <option value="WHITE">WHITE (Putih)</option>
                            </select>
                          </div>
                        </div>

                        {legacyBannerPromoId ? (
                          <div className={styles.warningBox}>
                            Config lama terdeteksi: <code>bannerPromoId</code> = {String(legacyBannerPromoId)}. Saat kamu{" "}
                            klik &quot;Simpan&quot;, config akan otomatis dimigrasi ke format baru (voucher gambar saja).
                            (banner_promo hanya fallback read-only)
                          </div>
                        ) : null}

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Mode Custom Promo</label>
                            <select
                              id={`cp-layout-${section.id}`}
                              name="layout"
                              defaultValue={String((cfg as any).layout ?? "carousel")}
                              className={styles.select}
                              data-cp-select="true"
                              data-clear-btn-id={`cp-clear-${section.id}`}
                            >
                              <option value="carousel">Carousel voucher (slide horizontal)</option>
                              <option value="grid">Grid voucher (kartu rapat)</option>
                              <option value="hero">Hero banner (1 gambar lebar)</option>
                            </select>
                            <p className={styles.helperText}>
                              Hero wajib 3000x1000 (rasio 3:1). Carousel/Grid lebar 2300-4000 dan tinggi 1000-1500. Maksimal {MAX_CUSTOM_PROMO_VOUCHERS} voucher.
                            </p>
                          </div>


                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Voucher (gambar)</label>
                          <p className={styles.helperText}>
                            Tambahkan voucher lewat picker/upload. Urutan mengikuti daftar di bawah (atas ke bawah).
                          </p>
                          <div className={styles.infoBox}>
                            <div style={{ fontWeight: 700, marginBottom: 6, color: "crimson" }}>Rules per mode:</div>
                            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4, fontSize: 13, color: "crimson" }}>
                              <li><strong>Carousel / Grid:</strong> wajib lebar 2300-4000 dan tinggi 1000-1500.</li>
                              <li><strong>Hero:</strong> wajib 3000x1000 (rasio 3:1).</li>
                              <li>Format JPG/PNG sumber, nanti dikompres ke WebP; jangan pakai screenshot kecil.</li>
                              <li>Jaga safe area 32px dari tepi untuk teks/logo supaya tidak terpotong.</li>
                            </ul>
                          </div>
                          {(() => {
                            const voucherImageIds = normalizeVoucherImageIds((cfg as any).voucherImageIds ?? []);
                            return (
                              <div style={{ display: "grid", gap: 12 }}>
                                {voucherImageIds.length ? (
                                  <div
                                    style={{
                                      display: "grid",
                                      gap: 12,
                                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                                    }}
                                  >
                                    {voucherImageIds.map((imgId: number, idx: number) => {
                                      const img = gambarItems.find((g) => Number(g.id) === Number(imgId));
                                      const url = img ? String(img.url) : "";
                                      return (
                                        <div
                                          key={`${imgId}-${idx}`}
                                          style={{
                                            border: "1px solid rgba(0,0,0,0.08)",
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            background: "rgba(0,0,0,0.02)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 8,
                                          }}
                                        >
                                          <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>#{imgId}</div>
                                            <div style={{ fontSize: 12, opacity: 0.75 }}>Voucher {idx + 1}</div>
                                          </div>
                                          <div style={{ padding: "0 10px 10px" }}>
                                            {url ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img
                                                src={url}
                                                alt={`Voucher ${imgId}`}
                                                style={{
                                                  width: "100%",
                                                  height: 140,
                                                  objectFit: "cover",
                                                  borderRadius: 10,
                                                  border: "1px solid rgba(0,0,0,0.06)",
                                                }}
                                              />
                                            ) : (
                                              <div
                                                style={{
                                                  height: 140,
                                                  borderRadius: 10,
                                                  border: "1px dashed rgba(0,0,0,0.15)",
                                                  display: "grid",
                                                  placeItems: "center",
                                                  color: "rgba(0,0,0,0.45)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Gambar #{imgId} tidak ada di 200 data terbaru
                                              </div>
                                            )}
                                          </div>
                                          <div style={{ padding: "0 10px 10px", display: "grid", gap: 8 }}>
                                            {(() => {
                                              const linkRaw = (cfg as any)?.voucherLinks?.[imgId];
                                              const isCategory =
                                                typeof linkRaw === "string" && linkRaw.startsWith("category:");
                                              const categoryId = isCategory ? Number(linkRaw.split(":")[1]) : null;
                                              const manualLink = !isCategory && typeof linkRaw === "string" ? linkRaw : "";
                                              const mode =
                                                Number.isFinite(categoryId) && categoryId > 0
                                                  ? "category"
                                                  : manualLink
                                                    ? "manual"
                                                    : "";
                                              return (
                                                <VoucherLinkEditor
                                                  imgId={imgId}
                                                  initialMode={mode as any}
                                                  initialCategoryId={categoryId}
                                                  initialManualLink={manualLink}
                                                  categories={categoryItems.map((c) => ({
                                                    id: Number(c.id),
                                                    name: String(c.nama ?? c.title ?? c.slug ?? `Kategori #${c.id}`),
                                                  }))}
                                                />
                                              );
                                            })()}
                                          </div>
                                          <div style={{ padding: "0 10px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                                            <button
                                              type="submit"
                                              formAction={moveCustomPromoVoucher.bind(null, `${imgId}:up`)}
                                              className={styles.smallButton}
                                              disabled={idx === 0}
                                              aria-disabled={idx === 0}
                                              title="Geser ke atas"
                                            >
                                              Naik
                                            </button>
                                            <button
                                              type="submit"
                                              formAction={moveCustomPromoVoucher.bind(null, `${imgId}:down`)}
                                              className={styles.smallButton}
                                              disabled={idx === voucherImageIds.length - 1}
                                              aria-disabled={idx === voucherImageIds.length - 1}
                                              title="Geser ke bawah"
                                            >
                                              Turun
                                            </button>
                                            <button
                                              type="submit"
                                              formAction={removeCustomPromoVoucher.bind(null, imgId)}
                                              className={styles.dangerButton}
                                            >
                                              Hapus
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className={styles.helperText}>Belum ada voucher. Tambahkan lewat picker di bawah.</div>
                                )}

                                {voucherImageIds.map((imgId: number) => (
                                  <input key={`voucher-hidden-${imgId}`} type="hidden" name="voucherImageIds" value={String(imgId)} />
                                ))}

                                <div className={styles.pickerExtraActions}>
                                  <button
                                    type="submit"
                                    formAction={clearCustomPromoVouchers}
                                    className={styles.dangerButton}
                                    disabled={voucherImageIds.length === 0}
                                    aria-disabled={voucherImageIds.length === 0}
                                    title="Hapus semua voucher"
                                    data-clear-vouchers-btn={`cp-clear-${section.id}`}
                                  >
                                    Drop semua voucher
                                  </button>
                                  {String((cfg as any).layout ?? "carousel") === "hero" ? (
                                    <div className={styles.helperText}>
                                      Mode Hero: maksimal 1 gambar. Tambah gambar baru akan menolak jika belum dihapus.
                                    </div>
                                  ) : (
                                    <div className={styles.helperText}>
                                      Mode Carousel/Grid: bisa lebih dari 1 gambar (maks {MAX_CUSTOM_PROMO_VOUCHERS}).
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button
                            type="submit"
                            className={styles.secondaryButton}
                            data-cp-save="true"
                          >
                            Simpan
                          </button>

                          {activeThemeKey ? (
                            <a
                              className={styles.primaryButton}
                              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                activeThemeKey
                              )}&focus=CUSTOM_PROMO&sectionId=${section.id}`}
                            >
                              Preview
                            </a>
                          ) : (
                            <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                              Preview
                            </span>
                          )}

                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                            Hapus
                          </button>
                        </div>
                      </form>

                      <div className={styles.innerCard}>
                        <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                          Tambah voucher (pilih / upload)
                        </h3>
                        <p className={styles.helperText}>
                          Pilih gambar dari galeri atau upload baru. Otomatis ditambahkan ke daftar voucher (maks. {MAX_CUSTOM_PROMO_VOUCHERS}).
                        </p>

                        <ImagePickerCaptcha
                          action={uploadImageToGalleryAndAttach}
                          sectionId={section.id.toString()}
                          attach="CUSTOM_PROMO:append"
                          endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                          limit={40}
                          buttonLabel="Pilih / Upload Voucher"
                        />
                      </div>
                    </div>
                  )}

                  {/* SOCIAL */}
                  {section.type === "SOCIAL" && (
                    <form action={saveSocialConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul tampil (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                          <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Section</label>
                        <select name="sectionTheme" defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")} className={styles.select}>
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Pilih media sosial (yang tampil hanya ikon)</label>
                      </div>

                      <div className={styles.fieldGroup}>
                        {mediaSocialItems.length === 0 ? (
                          <p className={styles.helperText}>Belum ada data media_sosial.</p>
                        ) : (
                          mediaSocialItems.map((m) => {
                            const iconKey = (m.iconKey as string) || "";
                            const nama = (m.nama as string) || iconKey;
                            const selectedArr = Array.isArray(cfg.selected) ? cfg.selected : [];
                            const checked = selectedArr.some((x: any) => x?.iconKey === iconKey);

                            return (
                              <label key={m.id} className={styles.checkboxRow}>
                                <input type="checkbox" name="iconKeys" value={iconKey} defaultChecked={checked} />
                                <span>
                                  {nama}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=SOCIAL&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}

                  {/* BRANCHES */}
                  {section.type === "BRANCHES" && (
                    <form action={saveBranchesDraftConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul tampil (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                          <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Section</label>
                        <select name="sectionTheme" defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")} className={styles.select}>
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Background Branch</label>
                        <select
                          name="sectionBgTheme"
                          defaultValue={String((cfg as any).sectionBgTheme ?? "FOLLOW_NAVBAR")}
                          className={styles.select}
                        >
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY">Navy</option>
                          <option value="WHITE">White</option>
                          <option value="GOLD">Golden</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Layout</label>
                        <select name="layout" defaultValue={String(cfg.layout ?? "carousel")} className={styles.select}>
                          <option value="carousel">Carousel</option>
                          <option value="grid">Grid</option>
                        </select>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Pilih cabang yang tampil</label>
                        {cabangItems.length === 0 ? (
                          <p className={styles.helperText}>Belum ada cabang di database.</p>
                        ) : (
                          cabangItems.map((b) => {
                            const checked = Array.isArray(cfg.branchIds)
                              ? cfg.branchIds.map((v: any) => Number(v)).includes(Number(b.id))
                              : false;
                            const labelText = (b.namaCabang as string) || (b.alamat as string) || `Cabang #${b.id}`;
                            return (
                              <label key={b.id} className={styles.checkboxRow}>
                                <input type="checkbox" name="branchIds" value={String(b.id)} defaultChecked={checked} />
                                <span>{labelText}</span>
                              </label>
                            );
                          })
                        )}
                      </div>

                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=BRANCHES&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}


                  {/* CONTACT */}
                  {section.type === "CONTACT" && (() => {
                    const cfgAny = cfg as any;

                    // Mode "Hubungi Kami" fixed: Split Image + Button Stack
                    const mode = "SPLIT_IMAGE_STACK";
                    const imageMandatory = true;
                    const showImage = true;

                    const imageIdNum = Number(cfgAny.imageId);
                    const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;
                    const img = imageId ? imageMap.get(imageId) : null;

                    const headerText = String(cfgAny.headerText ?? "");
                    const bodyText = String(cfgAny.bodyText ?? "");

                    const buttonLabels =
                      cfgAny.buttonLabels && typeof cfgAny.buttonLabels === "object" && !Array.isArray(cfgAny.buttonLabels)
                        ? (cfgAny.buttonLabels as any)
                        : {};

                    return (
                      <form action={saveContactConfig} className={styles.sectionEditForm} id={`contactForm-${section.id}`} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>
                        </div>

                        <div className={styles.sectionEditGrid}>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                              <button type="submit" formAction={autoGenerateContactCopy} className={styles.secondaryButton}>
                                Auto-generate Judul & Deskripsi
                              </button>
                              <span className={styles.helperText} style={{ margin: 0 }}>
                                Mengisi otomatis teks yang SEO-friendly berdasarkan brand apixinterior dari database.
                              </span>
                            </div>
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfgAny as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                          </div>

                          {/* Header + Teks (paling kepake untuk SPLIT_IMAGE_STACK) */}
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Header (opsional)</label>
                            <input
                              name="headerText"
                              className={styles.input}
                              placeholder="Contoh: Konsultasi Gratis"
                              defaultValue={headerText}
                            />
                            <p className={styles.helperText}>Dipakai terutama untuk mode Split Image.</p>
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Teks (opsional)</label>
                            <textarea
                              name="bodyText"
                              className={styles.textarea}
                              placeholder="Contoh: Kirim ukuran ruangan & referensi. Tim kami respon cepat."
                              defaultValue={bodyText}
                              rows={3}
                            />
                          </div>

                          {/* Gambar: wajib untuk HERO_POSTER & SPLIT_IMAGE_STACK, opsional untuk yang lain */}
                          {imageMandatory ? (
                            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                              <label className={styles.label}>Gambar</label>
                              <p className={styles.helperText}>Wajib untuk mode ini.</p>

                              <ImagePickerCaptcha
                                action={uploadImageToGalleryAndAttach}
                                sectionId={section.id.toString()}
                                attach="CONTACT:imageId"
                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                limit={40}
                                buttonLabel={imageId ? "Ganti gambar" : "Pilih gambar"}
                              />

                              <div style={{ marginTop: 10 }}>
                                {img?.url ? (
                                  <img
                                    src={img.url}
                                    alt={img.title || "Preview"}
                                    style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
                                  />
                                ) : (
                                  <p className={styles.helperText}>Belum ada gambar terpasang.</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                              <details open={showImage} style={{ border: "1px dashed rgba(0,0,0,0.18)", borderRadius: 12, padding: 12 }}>
                                <summary style={{ cursor: "pointer", fontWeight: 600 }}>
                                  <label style={{ display: "inline-flex", gap: 10, alignItems: "center", cursor: "pointer" }}>
                                    <input type="checkbox" name="showImage" defaultChecked={showImage} />
                                    Pakai gambar (opsional)
                                  </label>
                                </summary>

                                <div style={{ marginTop: 12 }}>
                                  <ImagePickerCaptcha
                                    action={uploadImageToGalleryAndAttach}
                                    sectionId={section.id.toString()}
                                    attach="CONTACT:imageId"
                                    endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                    limit={40}
                                    buttonLabel={imageId ? "Ganti gambar" : "Pilih gambar"}
                                  />

                                  <div style={{ marginTop: 10 }}>
                                    {img?.url ? (
                                      <img
                                        src={img.url}
                                        alt={img.title || "Preview"}
                                        style={{ width: "100%", maxWidth: 520, borderRadius: 12, border: "1px solid rgba(0,0,0,0.12)" }}
                                      />
                                    ) : (
                                      <p className={styles.helperText}>Belum ada gambar terpasang.</p>
                                    )}
                                  </div>
                                </div>
                              </details>
                            </div>
                          )}

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Pilih nomor / kontak yang tampil</label>
                            {hubungiItems.length === 0 ? (
                              <p className={styles.helperText}>Belum ada data di tabel hubungi.</p>
                            ) : (
                              hubungiItems.map((h: any) => {
                                const checked = Array.isArray(cfgAny.hubungiIds)
                                  ? cfgAny.hubungiIds.map((v: any) => Number(v)).includes(Number(h.id))
                                  : false;

                                return (
                                  <div key={h.id} className={styles.checkboxRow} style={{ alignItems: "center" }}>
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, flexWrap: "wrap" }}>
                                      <input className={styles.hubungiCheck} type="checkbox" name="hubungiIds" value={String(h.id)} defaultChecked={checked} />
                                      <span>
                                        <strong>#{h.id}</strong>  {String(h.nomor ?? "")}
                                        {typeof h.prioritas === "number" ? (
                                          <span style={{ marginLeft: 8, opacity: 0.7 }}>(prioritas {h.prioritas})</span>
                                        ) : null}
                                      </span>

                                      <input
                                        className={styles.hubungiLabelInput}
                                        type="text"
                                        name={`hubungiLabel_${String(h.id)}`}
                                        defaultValue={String(buttonLabels?.[String(h.id)] ?? buttonLabels?.[h.id] ?? "").trim()}
                                        placeholder="Teks tombol (contoh: Hubungi Admin)"
                                      />
                                    </label>
                                  </div>
                                );
                              })
                            )}
                            <p className={styles.helperText}>Boleh pilih lebih dari satu.</p>
                          </div>
                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button type="submit" className={styles.secondaryButton}>
                            Simpan
                          </button>

                          {activeThemeKey ? (
                            <a
                              className={styles.primaryButton}
                              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                activeThemeKey
                              )}&focus=CONTACT&sectionId=${section.id}`}
                            >
                              Preview
                            </a>
                          ) : (
                            <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                              Preview
                            </span>
                          )}

                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                            Hapus
                          </button>
                        </div>
                      </form>
                    );
                  })()}

                  {/* FOOTER */}
                  {section.type === "FOOTER" && (
                    <form action={saveFooterConfig} className={styles.sectionEditForm} data-section-form="1">
                      <input type="hidden" name="id" value={section.id.toString()} />
                      <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul Section (Admin) (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                          <p className={styles.helperText}>Judul hanya untuk identifikasi di list admin.</p>
                        </div>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                        </div>
                      </div>

                      <div className={styles.fieldGroup}>
                        <label className={styles.label}>Tema Warna</label>
                        <select
                          name="sectionTheme"
                          defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                          className={styles.select}
                        >
                          <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                          <option value="NAVY_GOLD">NAVY + GOLD</option>
                          <option value="WHITE_GOLD">WHITE + GOLD</option>
                          <option value="NAVY_WHITE">NAVY + WHITE</option>
                          <option value="GOLD_NAVY">GOLD + NAVY</option>
                          <option value="GOLD_WHITE">GOLD + WHITE</option>
                          <option value="WHITE_NAVY">WHITE + NAVY</option>
                        </select>
                        <p className={styles.helperText}>
                          Menentukan warna background dan elemen (teks/ikon).
                        </p>
                      </div>

                      {/* Use Wrapper for all footer config (handles Auto Gen + State) */}
                      <FooterEditorWrapper config={cfg} />



                      <div className={styles.highlightFooterActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan
                        </button>

                        {activeThemeKey ? (
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                              activeThemeKey
                            )}&focus=FOOTER&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                        ) : (
                          <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                            Preview
                          </span>
                        )}

                        <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                          {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                          Hapus
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ROOM_CATEGORY */}
                  {section.type === "ROOM_CATEGORY" && (
                    <div className={styles.sectionEditForm}>
                      {(() => {
                        const roomCards = normalizeRoomCards(cfg?.cards);
                        const canAdd = roomCards.length < MAX_ROOM_CARDS;

                        return (
                          <form action={saveRoomCategoryConfig} className={styles.sectionEditForm} data-section-form="1">
                            <input type="hidden" name="id" value={section.id.toString()} />
                            <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                            <div className={styles.sectionEditGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul tampil (opsional)</label>
                                <input name="title" type="text" defaultValue={section.title} className={styles.input} />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Slug (opsional)</label>
                                <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                                <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                              </div>


                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tema Section (opsional)</label>
                                <select
                                  name="sectionTheme"
                                  defaultValue={String((cfg as any)?.sectionTheme ?? "FOLLOW_NAVBAR")}
                                  className={styles.select}
                                >
                                  <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                                  <option value="NAVY_GOLD">Navy + Gold</option>
                                  <option value="WHITE_GOLD">White + Gold</option>
                                  <option value="NAVY_WHITE">Navy + White</option>
                                  <option value="GOLD_NAVY">Gold + Navy</option>
                                  <option value="GOLD_WHITE">Gold + White</option>
                                  <option value="WHITE_NAVY">White + Navy</option>
                                </select>
                                <p className={styles.helperText}>
                                  Atur warna <strong>background + elemen</strong> untuk section ini. Kalau tidak diubah, otomatis mengikuti tema navbar.
                                </p>
                              </div>

                            </div>




                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Kartu Ruangan</label>
                              <p className={styles.helperText}>
                                Maksimal <strong>{MAX_ROOM_CARDS}</strong> kartu. Jika gambar tidak dipilih, renderer akan pakai{' '}
                                <strong>gambar pertama</strong> dari kategori yang dipilih (mode otomatis).
                              </p>
                            </div>

                            {roomCards.map((card, idx) => {
                              const img = card.imageId ? gambarById.get(card.imageId) : null;
                              const autoImageId =
                                !card.imageId && card.kategoriId ? autoCoverImageIdByKategori.get(card.kategoriId) ?? null : null;
                              const autoImg = autoImageId ? gambarById.get(autoImageId) : null;
                              const effectiveImg = (img as any)?.url ? img : (autoImg as any)?.url ? autoImg : null;
                              const isAuto = !card.imageId && Boolean((autoImg as any)?.url);
                              const effectiveUrl = normalizePublicUrl((effectiveImg as any)?.url);


                              return (
                                <div key={card.key} className={styles.innerCard} style={{ marginTop: 10 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      gap: 10,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <div className={styles.sectionHeading} style={{ fontSize: 14, margin: 0 }}>
                                      Kartu #{idx + 1}
                                    </div>

                                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                      <button
                                        type="submit"
                                        formAction={moveRoomCategoryCard.bind(null, `${card.key}:up`)}
                                        className={styles.secondaryButton}
                                        disabled={idx === 0}
                                        aria-disabled={idx === 0}
                                      >

                                      </button>
                                      <button
                                        type="submit"
                                        formAction={moveRoomCategoryCard.bind(null, `${card.key}:down`)}
                                        className={styles.secondaryButton}
                                        disabled={idx === roomCards.length - 1}
                                        aria-disabled={idx === roomCards.length - 1}
                                      >

                                      </button>
                                      <button
                                        type="submit"
                                        formAction={removeRoomCategoryCard.bind(null, card.key)}
                                        className={styles.dangerButton}
                                        disabled={roomCards.length <= 1}
                                        aria-disabled={roomCards.length <= 1}
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>

                                  <div className={styles.sectionEditGrid}>
                                    <div className={styles.fieldGroup}>
                                      <label className={styles.label}>Judul kartu</label>
                                      <input
                                        name={`title_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Ruang Tamu"
                                        defaultValue={card.title ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup}>
                                      <label className={styles.label}>Badge (opsional)</label>
                                      <input
                                        name={`badge_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Populer"
                                        defaultValue={card.badge ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Deskripsi (opsional)</label>
                                      <input
                                        name={`description_${card.key}`}
                                        className={styles.input}
                                        placeholder="Contoh: Sofa  Meja  Dekor"
                                        defaultValue={card.description ?? ""}
                                      />
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Kategori Produk</label>
                                      <select
                                        name={`kategoriId_${card.key}`}
                                        defaultValue={String(card.kategoriId ?? "")}
                                        className={styles.select}
                                      >
                                        <option value="">(Pilih kategori)</option>
                                        {categoryItems.map((c) => (
                                          <option key={c.id} value={String(c.id)}>
                                            #{c.id}  {(c.namaKategori as string) || (c.nama as string) || (c.slug as string)}
                                          </option>
                                        ))}
                                      </select>
                                      <p className={styles.helperText}>
                                        Kategori ini nanti yang dipakai untuk link/filternya kartu ruangan.
                                      </p>
                                    </div>

                                    <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                      <label className={styles.label}>Gambar kartu</label>

                                      {effectiveUrl ? (
                                        <div className={styles.roomArchSimRow}>
                                          <div className={styles.roomArchSimCard}>
                                            <div
                                              className={styles.roomArchSimMedia}
                                              style={{ ["--rc-bg" as any]: `url(${String(effectiveUrl)})` }}
                                            >
                                              <img
                                                src={String(effectiveUrl)}
                                                alt={String(((effectiveImg as any).title as string) || (isAuto ? "auto" : "room"))}
                                                className={`${styles.roomArchSimImg} ${styles.roomArchFitCover}`}
                                              />
                                            </div>
                                          </div>

                                          <div className={styles.roomArchControls}>
                                            {card.imageId && !(img as any)?.url ? (
                                              <div
                                                style={{
                                                  padding: 12,
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                imageId #{String(card.imageId)} (tidak ada di list 200 gambar terbaru)
                                              </div>
                                            ) : null}

                                            {!card.imageId ? (
                                              <div
                                                style={{
                                                  padding: "10px 12px",
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Mode otomatis: pakai gambar pertama dari kategori (kalau ada).
                                              </div>
                                            ) : null}

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                              <ImagePickerCaptcha
                                                action={uploadImageToGalleryAndAttach}
                                                sectionId={section.id.toString()}
                                                attach={`ROOM_CATEGORY:${card.key}`}
                                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                                limit={40}
                                                buttonLabel={card.imageId ? "Ganti / Upload Gambar" : "Pilih / Upload Gambar"}
                                              />
                                              {card.imageId ? (
                                                <button
                                                  type="submit"
                                                  formAction={clearRoomCategoryCardImage.bind(null, card.key)}
                                                  className={styles.secondaryButton}
                                                >
                                                  Reset ke Otomatis
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className={styles.roomArchSimRow}>
                                          <div className={styles.roomArchSimCard}>
                                            <div className={styles.roomArchSimMedia} />
                                          </div>

                                          <div className={styles.roomArchControls}>
                                            {card.imageId ? (
                                              <div
                                                style={{
                                                  padding: 12,
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                imageId #{String(card.imageId)} (tidak ada di list 200 gambar terbaru)
                                              </div>
                                            ) : (
                                              <div
                                                style={{
                                                  padding: "10px 12px",
                                                  borderRadius: 12,
                                                  border: "1px dashed rgba(0,0,0,0.25)",
                                                  color: "rgba(17,17,17,0.7)",
                                                  fontSize: 12,
                                                }}
                                              >
                                                Mode otomatis: pakai gambar pertama dari kategori (kalau ada).
                                              </div>
                                            )}

                                            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                                              <ImagePickerCaptcha
                                                action={uploadImageToGalleryAndAttach}
                                                sectionId={section.id.toString()}
                                                attach={`ROOM_CATEGORY:${card.key}`}
                                                endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                                limit={40}
                                                buttonLabel={card.imageId ? "Ganti / Upload Gambar" : "Pilih / Upload Gambar"}
                                              />
                                              {card.imageId ? (
                                                <button
                                                  type="submit"
                                                  formAction={clearRoomCategoryCardImage.bind(null, card.key)}
                                                  className={styles.secondaryButton}
                                                >
                                                  Reset ke Otomatis
                                                </button>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <div className={styles.sectionEditActions}>
                              <button
                                type="submit"
                                formAction={addRoomCategoryCard}
                                className={styles.secondaryButton}
                                disabled={!canAdd}
                                aria-disabled={!canAdd}
                              >
                                + Tambah Kartu
                              </button>
                              <span style={{ fontSize: 12, opacity: 0.75 }}>
                                {roomCards.length}/{MAX_ROOM_CARDS}
                              </span>
                            </div>

                            <div className={styles.highlightFooterActions}>
                              <button type="submit" className={styles.secondaryButton}>
                                Simpan
                              </button>

                              {activeThemeKey ? (
                                <a
                                  href={`${ADMIN_TOKO_PATH}/preview?theme=${encodeURIComponent(
                                    activeThemeKey
                                  )}&focus=ROOM_CATEGORY&sectionId=${section.id}`}
                                  className={styles.primaryButton}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Preview
                                </a>
                              ) : (
                                <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
                                  Preview
                                </span>
                              )}

                              <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                                {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                              </button>

                              <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                                Hapus
                              </button>
                            </div>

                          </form>
                        );
                      })()}
                    </div>
                  )}

                  {/* TESTIMONIALS */}
                  {section.type === "TESTIMONIALS" && (
                    <div className={styles.sectionEditForm} data-section-id={section.id}>
                      <form id={`testimonialsForm-${section.id}`} action={saveTestimonialsConfig} className={styles.sectionEditForm}>
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <TestimonialsEditor
                          initialConfig={cfg}
                          sectionId={section.id.toString()}
                        />

                        {/* Footer Actions inside the form for convenience */}
                        <div className={styles.highlightFooterActions} style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 16 }}>
                          <button type="submit" className={styles.secondaryButton}>Simpan</button>

                          {activeThemeKey ? (
                            <a
                              className={styles.primaryButton}
                              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(
                                activeThemeKey
                              )}&focus=TESTIMONIALS&sectionId=${section.id}`}
                            >
                              Preview
                            </a>
                          ) : (
                            <span className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>Preview</span>
                          )}

                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>

                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>
                            Hapus
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* HIGHLIGHT_COLLECTION */}
                  {section.type === "HIGHLIGHT_COLLECTION" && (
                    <div className={styles.sectionEditForm} data-section-id={section.id}>
                      <form id={`highlightForm-${section.id}`} action={saveHighlightCollectionConfig} className={styles.sectionEditForm} data-section-form="1">
                        <input type="hidden" name="id" value={section.id.toString()} />

                        {/* Mode diset fixed ke products (backward compatible) */}
                        <input type="hidden" name="mode" value="products" />

                        <input type="hidden" name="theme" value={activeThemeKey} />

                        <input type="hidden" name="currentEnabled" value={section.enabled ? "true" : "false"} />

                        <div className={styles.highlightMetaRow}>
                          <div className={styles.fieldGroup} style={{ flex: 1, minWidth: 220 }}>
                            <label className={styles.label}>Slug (opsional)</label>
                            <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                            <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                          </div>

                        </div>


                        <div className={styles.sectionEditGrid}>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Layout</label>
                            <select
                              name="layout"
                              defaultValue={String(cfg.layout ?? "FEATURED_LEFT")}
                              className={styles.select}
                            >
                              <option value="FEATURED_LEFT">Featured Left (Desktop)  Stack (Mobile)</option>
                              <option value="FEATURED_TOP">Featured Top</option>
                              <option value="GRID">Grid</option>
                              <option value="CARDS">Cards (Scroll)</option>
                            </select>
                            <p className={styles.helperText}>
                              Desktop akan tampil Featured Left. Tablet/HP otomatis stack: header  hero  items.
                            </p>
                          </div>


                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Section</label>
                            <select
                              name="sectionTheme"
                              defaultValue={String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR")}
                              className={styles.select}
                            >
                              <option value="FOLLOW_NAVBAR">Ikuti tema Navbar (default)</option>
                              <option value="NAVY_GOLD">NAVY + GOLD</option>
                              <option value="WHITE_GOLD">WHITE + GOLD</option>
                              <option value="NAVY_WHITE">NAVY + WHITE</option>
                              <option value="GOLD_NAVY">GOLD + NAVY</option>
                              <option value="GOLD_WHITE">GOLD + WHITE</option>
                              <option value="WHITE_NAVY">WHITE + NAVY</option>
                            </select>
                            <p className={styles.helperText}>
                              Mengatur warna background + elemen + card + CTA untuk section ini. Default ikut tema Navbar.
                            </p>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul tampil (opsional)</label>
                            <input
                              name="headline"
                              defaultValue={cfg.headline ?? ""}
                              className={styles.input}
                              placeholder="Mis. Koleksi Pilihan"
                            />
                            <p className={styles.helperText}>Boleh dikosongkan (judul tidak tampil di website).</p>
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <label className={styles.label}>Deskripsi (opsional)</label>
                              <button
                                formAction={autoGenerateHighlightCollection}
                                className={styles.secondaryButton}
                                style={{ fontSize: 11, padding: "4px 8px", height: "auto" }}
                                title="Klik untuk isi otomatis judul, deskripsi, dan CTA"
                              >
                                Auto Generate Text
                              </button>
                            </div>
                            <textarea name="description" defaultValue={cfg.description ?? ""} className={styles.input} rows={3} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>CTA Text (opsional)</label>
                            <input name="ctaText" defaultValue={cfg.ctaText ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>CTA Link (opsional)</label>
                            <input name="ctaHref" defaultValue={cfg.ctaHref ?? ""} className={styles.input} placeholder="/cari" />
                          </div>

                          <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                            <label className={styles.label}>Hero Media (opsional)</label>
                            <div style={{ marginTop: 10 }}>
                              {/* Preview gambar terpilih */}
                              {(() => {
                                const heroUrl =
                                  (gambarById.get(Number(cfg.heroImageId)) as any)?.url ?? null;
                                // eslint-disable-next-line @next/next/no-img-element
                                return (
                                  <>
                                    {heroUrl ? (
                                      <img
                                        id={`img-preview-highlight-${section.id}`}
                                        src={String(heroUrl)}
                                        alt="Preview"
                                        style={{
                                          width: "100%",
                                          maxWidth: 420,
                                          height: 220,
                                          objectFit: "cover",
                                          borderRadius: 12,
                                          border: "1px solid rgba(0,0,0,0.08)",
                                          display: "block",
                                        }}
                                      />
                                    ) : (cfg.heroImageId ? (
                                      <div
                                        style={{
                                          width: "100%",
                                          maxWidth: 420,
                                          padding: 12,
                                          borderRadius: 12,
                                          border: "1px dashed rgba(0,0,0,0.25)",
                                          color: "rgba(17,17,17,0.7)",
                                          fontSize: 12,
                                        }}
                                      >
                                        Hero imageId #{String(cfg.heroImageId)} (tidak ada di list 200 gambar terbaru)
                                      </div>
                                    ) : null)}


                                    <div style={{ marginTop: 10 }}>
                                      <div style={{ fontWeight: 800, color: "rgba(17,17,17,0.9)" }}>
                                        Pilih gambar dari galeri
                                      </div>
                                      <div style={{ color: "rgba(17,17,17,0.7)", fontSize: 12, marginTop: 6 }}>
                                        Klik tombol untuk buka picker, cari (id/title/tags), lalu pilih thumbnail.
                                      </div>
                                      <div style={{ marginTop: 10 }}>
                                        <ImagePickerCaptcha
                                          action={uploadImageToGalleryAndAttach}
                                          sectionId={section.id.toString()}
                                          attach="HIGHLIGHT_COLLECTION:heroImageId"
                                          endpoint="/api/admin/admin_dashboard/admin_galeri/list_gambar"
                                          limit={40}
                                          buttonLabel="Buka Picker Gambar"
                                        />
                                        <div className={styles.highlightHeroClearRow}>
                                          <button type="submit" formAction={clearHighlightCollectionHero} className={styles.secondaryButton}>
                                            Hapus Hero Image
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Item kurasi (produk)</label>
                          <p className={styles.helperText}>
                            Pilih produk lalu drag &amp; drop untuk urutan tampil. (Versi awal: item hanya produk; nanti bisa diperluas
                            jadi campuran product/category/custom tanpa mengubah data lama.)
                          </p>

                          <ProductCarouselPicker
                            products={(productItems as any[]).map((p: any) => ({
                              id: Number(p.id),
                              nama:
                                (p.nama as string) ||
                                (p.namaProduk as string) ||
                                (p.slug as string) ||
                                `Produk #${String(p.id)}`,
                              harga: typeof p.harga === "number" ? p.harga : Number(p.harga) || undefined,
                              kategori: (p.kategori as string) || undefined,
                              subkategori: (p.subkategori as string) || undefined,
                              mainImageId: p.mainImageId ?? null,
                              galleryImageIds: Array.isArray(p.galleryImageIds)
                                ? (p.galleryImageIds as any[]).map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
                                : [],
                            }))}
                            images={(gambarItems as any[]).map((g: any) => ({
                              id: Number(g.id),
                              url: String(g.url),
                              title: (g.title as string) || "",
                              tags: (g.tags as string) || "",
                            }))}
                            initialIds={
                              Array.isArray(cfg.productIds)
                                ? cfg.productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
                                : []
                            }

                            inputName="productIds"
                          />

                          <div className={styles.pickerExtraActions}>
                            <button
                              type="submit"
                              formAction={clearHighlightCollectionProducts}
                              className={styles.dangerButton}
                              disabled={!Array.isArray(cfg.productIds) || cfg.productIds.length === 0}
                              title={
                                !Array.isArray(cfg.productIds) || cfg.productIds.length === 0
                                  ? "Belum ada produk dipilih."
                                  : "Hapus semua produk yang dipilih."
                              }
                            >
                              Drop Produk
                            </button>
                          </div>

                        </div>

                        <div className={styles.highlightFooterActions}>
                          <button type="submit" className={styles.secondaryButton}>Simpan</button>
                          <a
                            className={styles.primaryButton}
                            href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${encodeURIComponent(activeThemeKey)}&focus=HIGHLIGHT_COLLECTION&sectionId=${section.id}`}
                          >
                            Preview
                          </a>
                          <button type="submit" formAction={toggleDraft} className={styles.secondaryButton}>
                            {section.enabled ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button type="submit" formAction={deleteDraft} className={styles.dangerButton}>Hapus</button>
                        </div>

                      </form>
                    </div>
                  )}
                  {/* Legacy banner_promo list (read-only info) */}
                  {section.type === "CUSTOM_PROMO" && legacyBannerPromoId ? (
                    <div className={styles.helperText} style={{ marginTop: 8 }}>
                      Info legacy: <code>banner_promo</code> #{String(legacyBannerPromoId)}{" "}
                      {bannerPromoItems.find((b) => Number(b.id) === Number(legacyBannerPromoId))
                        ? "(ditemukan)"
                        : "(tidak ditemukan)"}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>

      {activeThemeKey ? (
        <FloatingPreviewActions
          themeKey={activeThemeKey}
          previewHref={`${ADMIN_TOKO_PATH}/preview?theme=${encodeURIComponent(activeThemeKey)}`}
          resetAction={resetTheme}
          deleteThemeAction={deleteTheme}
          autoGenerateAction={autoGenerateThemeContent}
          previewClassName={styles.secondaryButton}
          saveClassName={styles.primaryButton}
          dangerClassName={styles.dangerButton}
          autoGenerateClassName={styles.secondaryButton}
        />
      ) : null}

      {/* Script drag & drop urutan section + ordered picker (vanilla JS) */}
      <TokoClient />
      <script dangerouslySetInnerHTML={{ __html: voucherLinkScript }} />
      <script dangerouslySetInnerHTML={{ __html: scrollRestoreScript }} />
      <script dangerouslySetInnerHTML={{ __html: formFocusScript }} />
    </main>
  );
}





