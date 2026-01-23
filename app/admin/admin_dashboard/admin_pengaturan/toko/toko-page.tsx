// app/admin/admin_dashboard/admin_pengaturan/toko/page.tsx
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import styles from "./toko.module.css";
import TokoClient from "./toko-client";
import ProductCarouselPicker from "./ProductCarouselPicker";
import fs from "fs/promises";
import path from "path";

// selalu ambil data terbaru
export const dynamic = "force-dynamic";

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


function normalizeThemeKey(v: any): ThemeKey {
  const raw = String(v ?? "").trim();
  const s = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return s || DEFAULT_THEME_KEY;
}

async function getRefererUrl(): Promise<URL | null> {
  // Next.js 16: headers() adalah async API
  const headersList = await headers();
  const ref = headersList.get("referer") || "";
  try {
    return new URL(ref);
  } catch {
    return null;
  }
}

async function getThemeKeyFromReferer(): Promise<ThemeKey> {
  const u = await getRefererUrl();
  if (!u) return DEFAULT_THEME_KEY;
  return normalizeThemeKey(u.searchParams.get("theme"));
}

// Fungsi untuk menyimpan pilihan background theme di /toko
async function updateBackgroundTheme(formData: FormData) {
  "use server";

  const theme = formData.get("backgroundTheme") as string;

  if (!theme || !["NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"].includes(theme)) return;

  await prisma.navbarSetting.upsert({
    where: { id: 1 },
    update: { backgroundTheme: theme }, // Menyimpan konfigurasi background baru
    create: { id: 1, backgroundTheme: theme },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/"); // Memastikan homepage pengunjung juga terupdate
  return redirectBack({ notice: encodeURIComponent("Tema background berhasil disimpan.") });
}



async function redirectBack(params: { notice?: string; error?: string }) {
  const u = await getRefererUrl();
  const base = u ? u : new URL("http://localhost/admin/admin_dashboard/admin_pengaturan/toko");
  if (params.notice) {
    base.searchParams.set("notice", params.notice);
    base.searchParams.delete("error");
  }
  if (params.error) {
    base.searchParams.set("error", params.error);
    base.searchParams.delete("notice");
  }
  redirect(base.pathname + (base.search ? base.search : ""));
}

function isThemeMetaRow(row: any): boolean {
  const slug = String(row?.slug ?? "");
  const cfg = (row?.config ?? {}) as any;
  return slug.startsWith(THEME_META_SLUG_PREFIX) || cfg?.__isThemeMeta === true;
}

function themeMetaSlug(themeKey: ThemeKey) {
  return `${THEME_META_SLUG_PREFIX}${themeKey}`;
}

function getThemeKeyFromRow(row: any): ThemeKey {
  const cfg = (row?.config ?? {}) as any;
  return cfg?.__themeKey ? normalizeThemeKey(cfg.__themeKey) : DEFAULT_THEME_KEY;
}

function withThemeKey(cfg: any, themeKey: ThemeKey) {
  const base = cfg && typeof cfg === "object" && !Array.isArray(cfg) ? cfg : {};
  return { ...base, __themeKey: themeKey };
}


async function updateDraftConfigPreserveTheme(
  id: number,
  newConfig: any,
  meta?: { title?: string; slug?: string | null },
) {
  const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  const themeKey = getThemeKeyFromRow(existing);

  const data: any = { config: withThemeKey(newConfig ?? {}, themeKey) };
  if (meta) {
    if (meta.title !== undefined) data.title = meta.title;
    if (meta.slug !== undefined) data.slug = meta.slug;
  }

  await prisma.homepageSectionDraft.update({
    where: { id },
    data,
  });
}

// ========================
// NAVBAR THEME SETUP (biarkan seperti versi kamu)
// ========================

type NavbarTheme = "NAVY_GOLD" | "WHITE_GOLD" | "NAVY_WHITE" | "GOLD_NAVY" | "GOLD_WHITE" | "WHITE_NAVY";
const ALLOWED_THEMES = ["NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY"] as const;
type AllowedNavbarTheme = (typeof ALLOWED_THEMES)[number];

async function updateNavbarTheme(formData: FormData) {
  "use server";

  const theme = formData.get("navbarTheme") as AllowedNavbarTheme | null;

  if (!theme || !ALLOWED_THEMES.includes(theme)) return;

  await prisma.navbarSetting.upsert({
    where: { id: 1 },
    update: { theme },
    create: { id: 1, theme },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  revalidatePath("/"); // homepage pengunjung
  return redirectBack({ notice: encodeURIComponent("Tema navbar berhasil disimpan.") });
}

// ========================
// HOMEPAGE SECTION DRAFT/PUBLISH (baru)
// ========================

type SectionTypeId =
  | "HERO"
  | "CATEGORY_GRID"
  | "PRODUCT_CAROUSEL"
  | "HIGHLIGHT_COLLECTION"
  | "ROOM_CATEGORY"
  | "GALLERY"
  | "BRANCHES"
  | "CONTACT"
  | "SOCIAL"
  | "CUSTOM_PROMO"
  | "TESTIMONIALS";

type SectionDef = {
  type: SectionTypeId;
  label: string;
  description: string;
  defaultSlug: string;
  defaultConfig: any;
};

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
      imageId: null,
    },
  },
  {
    type: "CATEGORY_GRID",
    label: "Grid Kategori Produk",
    description: "Checklist kategori + opsional cover image per kategori.",
    defaultSlug: "kategori-produk",
    defaultConfig: {
      layout: { columns: 3, maxItems: 6 },
      items: [],
    },
  },
  {
    type: "PRODUCT_CAROUSEL",
    label: "Carousel Produk",
    description: "Carousel produk pilihan (urutan mengikuti list).",
    defaultSlug: "carousel-produk",
    defaultConfig: {
      title: "",
      description: "",
      productIds: [],
      showPrice: true,
      showCta: true,
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
      title: "Koleksi Pilihan",
      productIds: [],

      // New keys (rancangan baru)
      layout: "FEATURED_LEFT",
      heroImageId: null,
      badgeText: "",
      headline: "",
      description: "",
      ctaText: "",
      ctaHref: "",

      // Future-proof (opsional): list item campuran, saat ini diisi dari productIds saat simpan
      items: [],
    },
  },
  {
    type: "ROOM_CATEGORY",
    label: "Kategori Ruangan",
    description: "Ruang Keluarga & Tamu, Ruang Makan & Dapur, Kamar Tidur.",
    defaultSlug: "kategori-ruangan",
    defaultConfig: {
      cards: DEFAULT_ROOM_CARDS.map((c) => ({
        key: c.key,
        title: c.title,
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
    defaultConfig: { branchIds: [], layout: "carousel" },
  },
  {
    type: "CONTACT",
    label: "Hubungi Kami",
    description: "Pilih nomor / kontak yang tampil.",
    defaultSlug: "hubungi",
    defaultConfig: { hubungiIds: [], primaryOnly: false },
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
    description: "Promo bebas + gambar + tombol opsional.",
    defaultSlug: "promo",
    defaultConfig: {
      title: "",
      subtitle: "",
      buttonLabel: "",
      buttonHref: "",
      imageId: null,
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
];


const SECTION_ICON: Record<string, string> = {
  HERO: "",
  CATEGORY_GRID: "",
  PRODUCT_CAROUSEL: "",
  HIGHLIGHT_COLLECTION: "",
  ROOM_CATEGORY: "",
  GALLERY: "",
  BRANCHES: "",
  CONTACT: "",
  SOCIAL: "",
  CUSTOM_PROMO: "",
};


function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parseNum(v: FormDataEntryValue | null): number | null {
  if (typeof v !== "string") return null;
  const n = Number(v);
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
    if (Number.isFinite(n)) arr.push(n);
  };

  const uniq = (arr: number[]) => Array.from(new Set(arr));

  switch (type) {
    case "HERO":
    case "CUSTOM_PROMO": {
      const imageIds: number[] = [];
      if (cfg?.imageId) pushNum(imageIds, cfg.imageId);
      out.imageIds = uniq(imageIds);
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
      const ids = Array.isArray(cfg?.hubungiIds) ? cfg.hubungiIds : [];
      ids.forEach((v: any) => pushNum(hubungiIds, v));
      out.hubungiIds = uniq(hubungiIds);
      break;
    }
    default:
      break;
  }

  return out;
}

function legacyToNewConfig(type: SectionTypeId, raw: any) {
  const cfg = (raw ?? {}) as any;

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

  // CUSTOM_PROMO legacy: bannerPromoId (we'll keep to display warning; but on Save we write new format)
  if (type === "CUSTOM_PROMO" && cfg && (cfg.bannerPromoId || cfg.bannerPromoId === 0)) {
    return {
      title: cfg.title ?? "",
      subtitle: cfg.subtitle ?? "",
      buttonLabel: cfg.buttonLabel ?? "",
      buttonHref: cfg.buttonHref ?? "",
      imageId: cfg.imageId ?? null,
      _legacyBannerPromoId: cfg.bannerPromoId ?? null,
    };
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
  if (!def) return redirectBack({ error: encodeURIComponent("Jenis section tidak valid.") });

  const last = await prisma.homepageSectionDraft.findFirst({ orderBy: { sortOrder: "desc" } });
  const sortOrder = last ? last.sortOrder + 1 : 1;

  const slug = slugRaw ? slugify(slugRaw) : def.defaultSlug;

  await prisma.homepageSectionDraft.create({
    data: {
      type: def.type as any,
      title: titleRaw,
      slug: slug.length ? slug : null,
      enabled: true,
      sortOrder,
      config: withThemeKey(def.defaultConfig ?? {}, themeKey),
    },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Section draft berhasil ditambahkan.") });
}

async function updateDraftMeta(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const slugRaw = (formData.get("slug") as string | null)?.trim() ?? "";

  const slug = slugRaw ? slugify(slugRaw) : null;

  await prisma.homepageSectionDraft.update({
    where: { id },
    data: { title, slug },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
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
  return redirectBack({ notice: encodeURIComponent("Status section berhasil diubah.") });
}

async function duplicateDraftSection(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const original = await prisma.homepageSectionDraft.findUnique({ where: { id } });
  if (!original) return redirectBack({ error: encodeURIComponent("Section asli tidak ditemukan.") });

  // Find max sortOrder to place at the end
  const last = await prisma.homepageSectionDraft.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const newSortOrder = last ? last.sortOrder + 1 : 1;

  await prisma.homepageSectionDraft.create({
    data: {
      type: original.type,
      title: `${original.title} (Copy)`,
      slug: original.slug ? `${original.slug}-copy` : null,
      enabled: original.enabled,
      sortOrder: newSortOrder,
      config: original.config as any,
    },
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Section berhasil diduplikasi.") });
}

async function deleteDraft(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  await prisma.homepageSectionDraft.delete({ where: { id } });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Section draft dihapus.") });
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
    `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(nextKey)}&notice=${encodeURIComponent(
      "Theme baru dibuat. Silakan rename & susun section."
    )}`
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
    `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}&notice=${encodeURIComponent("Theme berhasil diduplikat.")}`
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
      `${ADMIN_TOKO_PATH}?theme=${encodeURIComponent(toKey)}&notice=${encodeURIComponent(
        "Theme berhasil diduplikat sebagai theme baru."
      )}`
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
  return redirectBack({ notice: encodeURIComponent("Theme berhasil dihapus.") });
}


async function saveHeroConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const headline = (formData.get("headline") as string | null)?.trim() ?? "";
  const subheadline = (formData.get("subheadline") as string | null)?.trim() ?? "";
  const ctaLabel = (formData.get("ctaLabel") as string | null)?.trim() ?? "";
  const ctaHref = (formData.get("ctaHref") as string | null)?.trim() ?? "";
  const rawHeroTheme = (formData.get("heroTheme") as string | null)?.trim() ?? "FOLLOW_NAVBAR";
  const heroTheme =
    rawHeroTheme === "FOLLOW_NAVBAR"
      ? "FOLLOW_NAVBAR"
      : ALLOWED_THEMES.includes(rawHeroTheme as any)
        ? (rawHeroTheme as AllowedNavbarTheme)
        : "FOLLOW_NAVBAR";
  const imageId = parseNum(formData.get("imageId"));

  try {
    await validateExistence({ imageIds: imageId ? [imageId] : [] });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, {
    headline,
    subheadline,
    ctaLabel,
    ctaHref,
    heroTheme,
    imageId: imageId ?? null,
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config HERO tersimpan.") });
}

async function saveCategoryGridConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const columnsRaw = Number((formData.get("columns") as string | null) ?? "3");
  const columns = clampInt(columnsRaw, 2, 6);

  const maxItemsStr = (formData.get("maxItems") as string | null)?.trim() ?? "";
  const maxItems = maxItemsStr ? clampInt(Number(maxItemsStr), 1, 60) : null;

  const selectedKategoriIds = parseNumArray((formData.getAll("kategoriIds") as string[]) ?? []);

  const items = selectedKategoriIds.map((kategoriId) => {
    const coverKey = `coverImageId_${kategoriId}`;
    const cover = parseNum(formData.get(coverKey));
    return { kategoriId, coverImageId: cover ?? null };
  });

  const coverIds = items.map((it) => it.coverImageId).filter((v): v is number => typeof v === "number");

  try {
    await validateExistence({ kategoriIds: selectedKategoriIds, imageIds: coverIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  const finalItems = maxItems ? items.slice(0, maxItems) : items;

  await updateDraftConfigPreserveTheme(id, {
    layout: { columns, ...(maxItems ? { maxItems } : {}) },
    items: finalItems,
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config CATEGORY_GRID tersimpan.") });
}

async function saveProductCarouselConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("carouselTitle") as string | null)?.trim() ?? "";
  const description = (formData.get("carouselDescription") as string | null)?.trim() ?? "";
  const showPrice = (formData.get("showPrice") as string | null) === "true";
  const showCta = (formData.get("showCta") as string | null) === "true";

  // ordered: hidden inputs in <li> with name="productIds"
  const productIds = parseNumArray((formData.getAll("productIds") as string[]) ?? []);

  try {
    await validateExistence({ productIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, { title, description, productIds, showPrice, showCta });
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config PRODUCT_CAROUSEL tersimpan.") });
}

async function saveCustomPromoConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const subtitle = (formData.get("subtitle") as string | null)?.trim() ?? "";
  const buttonLabel = (formData.get("buttonLabel") as string | null)?.trim() ?? "";
  const buttonHref = (formData.get("buttonHref") as string | null)?.trim() ?? "";
  const imageId = parseNum(formData.get("imageId"));

  try {
    await validateExistence({ imageIds: imageId ? [imageId] : [] });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  // selalu simpan format baru (menghapus ketergantungan bannerPromoId)
  await updateDraftConfigPreserveTheme(id, { title, subtitle, buttonLabel, buttonHref, imageId: imageId ?? null });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config CUSTOM_PROMO tersimpan.") });
}

async function saveSocialConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const iconKeys = ((formData.getAll("iconKeys") as string[]) ?? []).filter(Boolean);

  try {
    await validateExistence({ mediaIconKeys: iconKeys });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  const rows = await prisma.mediaSosial.findMany({
    where: { iconKey: { in: iconKeys } },
    select: { iconKey: true, nama: true },
  });

  const selected = iconKeys
    .map((k) => rows.find((r) => r.iconKey === k))
    .filter(Boolean)
    .map((r) => ({ iconKey: (r as any).iconKey, nama: (r as any).nama ?? (r as any).iconKey }));

  await updateDraftConfigPreserveTheme(id, { selected, display: { iconsOnly: true } });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config SOCIAL tersimpan.") });
}

async function saveBranchesConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const branchIds = parseNumArray((formData.getAll("branchIds") as string[]) ?? []);
  const layout = ((formData.get("layout") as string | null) ?? "carousel") === "carousel" ? "carousel" : "grid";

  try {
    await validateExistence({ branchIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, { branchIds, layout });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config BRANCHES tersimpan.") });
}

async function saveContactConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const hubungiIds = parseNumArray((formData.getAll("hubungiIds") as string[]) ?? []);
  const primaryOnly = (formData.get("primaryOnly") as string | null) === "true";

  try {
    await validateExistence({ hubungiIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, { hubungiIds, primaryOnly });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config CONTACT tersimpan.") });
}

async function saveGalleryConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const imageIds = parseNumArray((formData.getAll("imageIds") as string[]) ?? []);
  const layout = ((formData.get("layout") as string | null) ?? "grid") === "grid" ? "grid" : "carousel";

  try {
    await validateExistence({ imageIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, { imageIds, layout });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config GALLERY tersimpan.") });
}

async function saveRoomCategoryConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const cards = DEFAULT_ROOM_CARDS.map((c) => {
    const kategoriId = parseNum(formData.get(`kategoriId_${c.key}`));
    const imageId = parseNum(formData.get(`imageId_${c.key}`));
    return {
      key: c.key,
      title: c.title,
      kategoriId: kategoriId ?? null,
      imageId: imageId ?? null,
    };
  });

  const kategoriIds = cards.map((c) => c.kategoriId).filter((v): v is number => typeof v === "number");
  const imageIds = cards.map((c) => c.imageId).filter((v): v is number => typeof v === "number");

  try {
    await validateExistence({ kategoriIds, imageIds });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  await updateDraftConfigPreserveTheme(id, { cards });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config ROOM_CATEGORY tersimpan.") });
}

async function saveHighlightCollectionConfig(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));
  if (!id || Number.isNaN(id)) return;

  const title = (formData.get("title") as string | null)?.trim() ?? "Koleksi Pilihan";
  const layoutRaw = (formData.get("layout") as string | null)?.trim() ?? "FEATURED_LEFT";
  const layout =
    layoutRaw === "FEATURED_TOP" || layoutRaw === "GRID" || layoutRaw === "CARDS" ? layoutRaw : "FEATURED_LEFT";

  const heroImageIdNum = Number(formData.get("heroImageId"));
  const heroImageId = Number.isFinite(heroImageIdNum) && heroImageIdNum > 0 ? heroImageIdNum : null;

  const badgeText = ((formData.get("badgeText") as string | null) ?? "").trim();
  const headline = ((formData.get("headline") as string | null) ?? "").trim();
  const description = ((formData.get("description") as string | null) ?? "").trim();
  const ctaText = ((formData.get("ctaText") as string | null) ?? "").trim();
  const ctaHref = ((formData.get("ctaHref") as string | null) ?? "").trim();

  // MVP: kurasi produk (ordered)
  const productIds = parseNumArray((formData.getAll("productIds") as string[]) ?? []);

  // Validasi: produk + hero image (kalau ada)
  const imageIdsToValidate = heroImageId ? [heroImageId] : [];
  try {
    await validateExistence({ productIds, imageIds: imageIdsToValidate });
  } catch (e: any) {
    return redirectBack({ error: encodeURIComponent(e?.message ?? "Validasi gagal.") });
  }

  // New: items campuran (future-proof). Saat ini diisi dari productIds.
  const items = productIds.map((pid) => ({ type: "product", refId: pid, enabled: true }));

  await updateDraftConfigPreserveTheme(id, {
    // Backward compatible keys
    mode: "products",
    title,
    productIds,

    // New keys
    layout,
    heroImageId,
    badgeText,
    headline,
    description,
    ctaText,
    ctaHref,
    items,
  });

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Config HIGHLIGHT_COLLECTION tersimpan.") });
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

  const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
  await fs.mkdir(uploadDir, { recursive: true });

  const originalName = file.name || "image.jpg";
  const safeName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/gambar_upload/${filename}`;

  await fs.writeFile(filePath, buffer);

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



async function uploadImageToGalleryAndAttach(formData: FormData) {
  "use server";

  const sectionId = Number(formData.get("sectionId"));
  const attach = (formData.get("attach") as string | null) ?? "";
  const kategoriIdRaw = formData.get("kategoriId") as string | null;
  const kategoriId = kategoriIdRaw ? Number(kategoriIdRaw) : NaN;

  const file = formData.get("file");
  const title = (formData.get("title") as string | null)?.trim() ?? null;
  const tags = (formData.get("tags") as string | null)?.trim() ?? "";

  if (!sectionId || Number.isNaN(sectionId)) {
    return redirectBack({ error: encodeURIComponent("SectionId tidak valid.") });
  }

  if (!file || !(file instanceof File)) {
    return redirectBack({ error: encodeURIComponent("File gambar wajib diupload.") });
  }

  // 1) Save file to /public/uploads/gambar_upload (same as galeri)
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "gambar_upload");
  await fs.mkdir(uploadDir, { recursive: true });

  const ext = path.extname((file as File).name || "").toLowerCase() || ".jpg";
  const safeName = (title ?? (file as File).name ?? "image")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 60);

  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}-${safeName}${ext}`;
  const filePath = path.join(uploadDir, filename);
  const publicUrl = `/uploads/gambar_upload/${filename}`;

  await fs.writeFile(filePath, buffer);

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

  const newImageId = Number(created.id);

  // 3) Attach to Draft section config (ONLY if attach is provided)
  const section = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
  if (!section) {
    return redirectBack({ error: encodeURIComponent("Section draft tidak ditemukan.") });
  }

  const type = String(section.type || "").toUpperCase() as SectionTypeId;
  let cfg: any = legacyToNewConfig(type, section.config);

  try {
    if (attach === "HERO:imageId" || attach === "CUSTOM_PROMO:imageId") {
      cfg = { ...(cfg ?? {}), imageId: newImageId };
    } else if (attach === "HIGHLIGHT_COLLECTION:heroImageId") {
      cfg = { ...(cfg ?? {}), heroImageId: newImageId };
    } else if (attach.startsWith("ROOM_CATEGORY:")) {
      const key = attach.split(":")[1]; // e.g. ruang_keluarga_tamu
      const cards = Array.isArray(cfg?.cards) ? [...cfg.cards] : [];
      const idx = cards.findIndex((c: any) => String(c?.key) === String(key));
      if (idx >= 0) {
        cards[idx] = { ...cards[idx], imageId: newImageId };
      }
      cfg = { ...(cfg ?? {}), cards };
    } else if (attach === "GALLERY:append") {
      const prev = Array.isArray(cfg?.imageIds) ? cfg.imageIds : [];
      const next = Array.from(new Set([...prev.map((v: any) => Number(v)).filter(Number.isFinite), newImageId]));
      cfg = { ...(cfg ?? {}), imageIds: next };
    } else if (attach === "CATEGORY_GRID:cover") {
      if (!kategoriIdRaw || Number.isNaN(kategoriId)) {
        throw new Error("Pilih kategori dulu untuk cover CATEGORY_GRID.");
      }
      const items = Array.isArray(cfg?.items) ? [...cfg.items] : [];
      const i = items.findIndex((it: any) => Number(it?.kategoriId) === kategoriId);
      if (i >= 0) {
        items[i] = { ...items[i], coverImageId: newImageId };
      } else {
        // kalau kategori belum dicentang, kita tambahkan sekaligus
        items.push({ kategoriId, coverImageId: newImageId });
      }
      const layout = cfg?.layout ?? { columns: 3, maxItems: 6 };
      cfg = { ...(cfg ?? {}), layout, items };
    } else {
      // no attach -> do nothing
    }

    // Validate basic references so config tetap aman
    const ref = collectExistenceArgs(type, cfg);
    await validateExistence(ref);

    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id: sectionId } });
    const themeKey = getThemeKeyFromRow(existing);

    await prisma.homepageSectionDraft.update({
      where: { id: sectionId },
      data: { config: withThemeKey(cfg, themeKey) },
    });
  } catch (err: any) {
    // If attach fails, keep upload record but show error (config not changed)
    return redirectBack({ error: encodeURIComponent(err?.message || "Gagal attach gambar ke section.") });
  }

  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Gambar diupload & dipakai di section draft.") });
}
async function publishDraftToWebsite() {
  "use server";

  const themeKey = await getThemeKeyFromReferer();
  const meta = await prisma.homepageSectionDraft.findFirst({ where: { slug: themeMetaSlug(themeKey) } });
  if (!meta) {
    return redirectBack({ error: encodeURIComponent("Belum ada theme aktif. Buat theme dulu sebelum Publish.") });
  }
  const allDrafts = await prisma.homepageSectionDraft.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });

  const drafts = (allDrafts as any[]).filter((d) => {
    if (isThemeMetaRow(d)) return false;
    const tk = getThemeKeyFromRow(d);
    return tk === themeKey;
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
        },
      }),
    ),
  ]);

  revalidatePath("/");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Publish berhasil.") });
}


async function unpublishWebsite() {
  "use server";

  await prisma.homepageSectionPublished.deleteMany({});
  revalidatePath("/");
  revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
  return redirectBack({ notice: encodeURIComponent("Publish dihapus dari website utama.") });
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
  const requestedThemeKey = normalizeThemeKey(typeof sp?.theme === "string" ? sp.theme : "");

  const [
    navbarSetting,
    draftSectionsRaw,
    mediaSocialItemsRaw,
    categoryItemsRaw,
    productItemsRaw,
    hubungiItemsRaw,
    cabangItemsRaw,
    gambarItemsRaw,
    bannerPromoItemsRaw,
  ] = await Promise.all([
    prisma.navbarSetting.findUnique({ where: { id: 1 } }),
    prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.mediaSosial.findMany({ orderBy: { id: "asc" } }),
    prisma.kategoriProduk.findMany({ orderBy: { id: "asc" } }),
    prisma.produk.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.hubungi.findMany({ orderBy: { id: "asc" } }),
    prisma.cabangToko.findMany({ orderBy: { id: "asc" } }),
    prisma.gambarUpload.findMany({ orderBy: { id: "desc" }, take: 200 }),
    prisma.bannerPromo.findMany({ orderBy: { id: "desc" }, take: 50 }), // read-only fallback legacy CUSTOM_PROMO
  ]);

  const draftSections = (draftSectionsRaw ?? []) as any[];
  const mediaSocialItems = (mediaSocialItemsRaw ?? []) as any[];
  const categoryItems = (categoryItemsRaw ?? []) as any[];
  const productItems = (productItemsRaw ?? []) as any[];
  const hubungiItems = (hubungiItemsRaw ?? []) as any[];
  const cabangItems = (cabangItemsRaw ?? []) as any[];
  const gambarItems = (gambarItemsRaw ?? []) as any[];

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

  const activeThemeKey: ThemeKey | null = (() => {
    if (!themes.length) return null;
    const req = normalizeThemeKey(requestedThemeKey);
    const found = themes.find((t) => t.key === req);
    return found ? found.key : themes[0].key;
  })();

  const activeThemeName = activeThemeKey
    ? (themes.find((t) => t.key === activeThemeKey)?.name ?? defaultThemeName(activeThemeKey))
    : "";

  const draftSectionsForTheme = activeThemeKey
    ? draftSections.filter((d: any) => !isThemeMetaRow(d)).filter((d: any) => getThemeKeyFromRow(d) === activeThemeKey)
    : [];

  const currentTheme: NavbarTheme = (navbarSetting?.theme as NavbarTheme) ?? "NAVY_GOLD";

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Pengaturan Toko</h1>
      <p className={styles.subtitle}>
        Atur tampilan homepage versi <strong>Draft</strong>, preview, lalu publish ke website utama.
      </p>

      {notice ? (
        <div className={styles.successBox}>
          <strong>Berhasil:</strong> {notice}
        </div>
      ) : null}

      {error ? (
        <div className={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {/* NAVBAR KHUSUS TOKO: 1) Urutkan 2) Organize */}
      <nav className={styles.tabsNav}>
        <a href="#urutkan" className={`${styles.tabsLink} ${styles.tabsLinkActive}`}>
          1. Urutkan
        </a>
        <a href="#organize" className={styles.tabsLink}>
          2. Organize
        </a>

      </nav>
      {/* Aksi Preview & Publish */}
      <section className={styles.formCard}>
        <h2 className={styles.sectionHeading}>Preview &amp; Publish</h2>
        <p className={styles.sectionSubheading}>
          Preview akan mengambil data dari <code>homepagesectiondraft</code> (enabled saja). Publish akan mengganti seluruh{" "}
          <code>homepagesectionpublished</code> dengan isi Draft.
        </p>

        <div className={styles.sectionEditActions}>
          {activeThemeKey ? (
            <a
              href={`/admin/admin_dashboard/admin_pengaturan/toko/preview?theme=${activeThemeKey}`}
              className={styles.secondaryButton}
              style={{ textDecoration: "none" }}
            >
              Preview Draft
            </a>
          ) : (
            <span className={styles.secondaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }}>
              Preview Draft
            </span>
          )}

          {activeThemeKey ? (
            <form action={publishDraftToWebsite} style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit" className={styles.primaryButton}>
                Publish ke Website Utama
              </button>
              <button type="submit" formAction={unpublishWebsite} className={styles.dangerButton}>
                Hapus Publish
              </button>
            </form>
          ) : (
            <button type="button" className={styles.primaryButton} style={{ opacity: 0.5, cursor: "not-allowed" }} disabled>
              Publish ke Website Utama
            </button>
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
              + Theme
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
              <form action={renameTheme}>
                <input type="hidden" name="themeKey" value={activeThemeKey} />
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    className={styles.textInput}
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
                    className={styles.textInput}
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
                      <select className={styles.selectInput} name="fromKey" defaultValue={activeThemeKey}>
                        {themes.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 8 }}>
                      <label style={{ fontSize: 12, opacity: 0.85 }}>Ke</label>
                      <select className={styles.selectInput} name="toKey" defaultValue={"__new__"}>
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

      {/* ================= 1. URUTKAN (DRAG DROP) ================= */}
      <section id="urutkan" className={styles.formCard}>
        <div className={styles.sectionsHeader}>
          <div>
            <h2 className={styles.sectionHeading}>Urutkan Section Draft (Drag &amp; Drop)</h2>
            <p className={styles.sectionSubheading}>
              Tarik handle <span className={styles.dragHandle}></span> ke atas/bawah untuk mengubah urutan section di
              homepage draft. Setelah diurutkan, klik tombol &quot;Simpan Urutan&quot;.
            </p>
          </div>
          <button type="button" className={`${styles.smallButton} js-save-order`}>
            Simpan Urutan
          </button>
        </div>

        {draftSectionsForTheme.length === 0 ? (
          <p className={styles.emptyText}>
            Belum ada section draft. Tambahkan dulu minimal 1 section di tab Organize.
          </p>
        ) : (
          <div className={`${styles.sectionList} ${styles.sectionListDrag} js-section-list-drag`}>
            {draftSectionsForTheme.map((section: any, index: number) => {
              const def = SECTION_DEFS.find((d) => d.type === section.type);
              const label = def?.label ?? section.type;

              return (
                <div
                  key={section.id}
                  className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""} ${styles.sectionRowDraggable} js-section-row`}
                  draggable
                  data-id={section.id.toString()}
                  style={{ position: "relative" }}
                >
                  <a
                    href={`#section-editor-${section.id}`}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textDecoration: "none",
                      color: "inherit",
                      width: "100%",
                      padding: "12px 16px",
                    }}
                    title="Klik untuk loncat ke editor section ini"
                  >
                    <div className={styles.sectionTopLeft}>
                      <span className={styles.dragHandle}></span>
                      <span className={styles.sectionOrder}>#{index + 1}</span>
                      <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>
                        <span className={styles.sectionTypeIcon} aria-hidden="true">
                          {SECTION_ICON[section.type] ?? ""}
                        </span>
                        {label}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                        {section.enabled ? "Aktif" : "Nonaktif"}
                      </span>

                      {/* Duplicate Button */}
                      <form action={duplicateDraftSection} style={{ margin: 0 }}>
                        <input type="hidden" name="id" value={section.id.toString()} />
                        <button
                          type="submit"
                          title="Duplikat Section"
                          className={styles.smallButton}
                          style={{
                            padding: "6px 8px",
                            fontSize: 11,
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "inherit"
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          📋 Duplikat
                        </button>
                      </form>
                    </div>
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= 2. ORGANIZE (TEMA + SECTION) ================= */}
      <section id="organize" className={styles.sectionsBlock}>
        {/* Tema Navbar (keep) */}
        <section className={styles.formCard}>
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

          <form action={updateNavbarTheme} className={styles.fieldGroup}>
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


        </section>



        {/* Tambah Section Draft */}
        <section className={styles.formCard}>
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
                  Judul tampil di halaman (opsional)
                </label>
                <input
                  id="newSectionTitle"
                  name="title"
                  type="text"
                  placeholder="Contoh: Produk Terbaru (kosongkan jika tidak perlu judul)"
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
          <h2 className={styles.sectionHeading}>Section Draft</h2>
          <p className={styles.sectionSubheading}>
            Edit judul, slug, konfigurasi per type, serta aktif/nonaktifkan section yang sudah ada di Draft.
          </p>

          <div className={styles.sectionList}>
            {draftSectionsForTheme.length === 0 ? (
              <p className={styles.emptyText}>Belum ada section draft. Tambahkan minimal 1 section di atas.</p>
            ) : (
              draftSectionsForTheme.map((section: any, index: number) => {
                const def = SECTION_DEFS.find((d) => d.type === section.type);
                const label = def?.label ?? section.type;
                const description = def?.description;

                const cfg = legacyToNewConfig(section.type, section.config ?? {});
                const legacyBannerPromoId = cfg?._legacyBannerPromoId ?? null;

                return (
                  <article
                    id={`section-editor-${section.id}`}
                    key={section.id}
                    className={`${styles.sectionItem} ${(styles as any)[`sectionItem_${section.type}`] ?? ""}`}
                    style={{ scrollMarginTop: "100px" }}
                  >
                    <div className={styles.sectionTopRow}>
                      <div className={styles.sectionTopLeft}>
                        <span className={styles.sectionOrder}>#{index + 1}</span>
                        <span className={`${styles.sectionTypePill} ${(styles as any)[`pill_${section.type}`] ?? ""}`}>  <span className={styles.sectionTypeIcon} aria-hidden="true">    {SECTION_ICON[section.type] ?? ""}  </span>  {label}</span>
                        <span className={section.enabled ? styles.statusBadgeActive : styles.statusBadgeInactive}>
                          {section.enabled ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      {description && <p className={styles.sectionDescription}>{description}</p>}
                    </div>

                    {/* Edit judul & slug */}
                    <form action={updateDraftMeta} className={styles.sectionEditForm}>
                      <input type="hidden" name="id" value={section.id.toString()} />

                      <div className={styles.sectionEditGrid}>
                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Judul tampil (opsional)</label>
                          <input name="title" type="text" defaultValue={section.title} placeholder="Kosongkan jika tidak perlu judul" className={styles.input} />
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Slug (opsional)</label>
                          <input name="slug" type="text" defaultValue={section.slug ?? ""} className={styles.input} />
                          <p className={styles.helperText}>Boleh kosong (slug akan jadi null).</p>
                        </div>
                      </div>

                      <div className={styles.sectionEditActions}>
                        <button type="submit" className={styles.secondaryButton}>
                          Simpan Metadata
                        </button>

                        <button formAction={toggleDraft} type="submit" className={styles.smallButton}>{section.enabled ? "Nonaktifkan" : "Aktifkan"}
                        </button>

                        <button formAction={deleteDraft} type="submit" className={styles.dangerButton}>Hapus
                        </button>
                      </div>
                    </form>

                    {/* === CONFIG FORMS (BY TYPE) === */}

                    {/* HERO */}
                    {section.type === "HERO" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveHeroConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Headline</label>
                            <input name="headline" defaultValue={cfg.headline ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Subheadline</label>
                            <input name="subheadline" defaultValue={cfg.subheadline ?? ""} className={styles.input} />
                          </div>
                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Tema Warna Hero</label>
                            <select
                              name="heroTheme"
                              defaultValue={String((cfg as any).heroTheme ?? "FOLLOW_NAVBAR")}
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
                              Mengatur warna background, card, elemen, dan tombol CTA (termasuk hover). Jika pilih Ikuti tema Navbar, warna hero otomatis mengikuti tema navbar yang aktif.
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

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Gambar (gambar_upload)</label>
                            <select name="imageId" defaultValue={String(cfg.imageId ?? "")} className={`${styles.select} js-image-select`} data-preview-id={`img-preview-${section.id}`}>
                              <option value="">(Tidak pakai gambar)</option>
                              {gambarItems.map((g) => (
                                <option key={g.id} value={String(g.id)} data-url={String(g.url)}>
                                  #{g.id}  {(g.title as string) || (g.url as string)}
                                </option>
                              ))}
                            </select>
                            <div style={{ marginTop: 10 }}>
                              {/* Preview gambar terpilih */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                id={`img-preview-${section.id}`}
                                alt="Preview"
                                style={{ width: "100%", maxWidth: 520, height: 220, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", display: "none" }}
                              />
                            </div>

                          </div>

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan HERO
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload gambar untuk HERO
                          </h3>
                          <p className={styles.helperText}>
                            Upload di sini akan otomatis masuk ke <code>gambar_upload</code> dan langsung dipakai sebagai{" "}
                            <strong>imageId</strong> di HERO draft.
                          </p>

                          <form action={uploadImageToGalleryAndAttach} className={styles.newSectionForm}>
                            <input type="hidden" name="sectionId" value={section.id.toString()} />
                            <input type="hidden" name="attach" value="HERO:imageId" />

                            <div className={styles.newSectionGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul (opsional)</label>
                                <input name="title" className={styles.input} placeholder="Contoh: Hero Banner" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tags (opsional)</label>
                                <input name="tags" className={styles.input} placeholder="contoh: homepage, hero" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>File gambar</label>
                                <input name="file" type="file" accept="image/*" className={styles.input} required />
                              </div>
                            </div>

                            <div className={styles.sectionEditActions}>
                              <button type="submit" className={styles.primaryButton}>
                                Upload &amp; Pakai di HERO
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* CATEGORY_GRID */}
                    {section.type === "CATEGORY_GRID" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveCategoryGridConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          <div className={styles.sectionEditGrid}>
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
                            <p className={styles.helperText}>
                              Klik kategori di homepage  harus mengarah ke <code>/kategori</code>.
                            </p>
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
                                    <label style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                                      <input type="checkbox" name="kategoriIds" value={String(cat.id)} defaultChecked={checked} />
                                      <span>{labelText}</span>
                                    </label>
                                    <select
                                      name={`coverImageId_${idNum}`}
                                      defaultValue={cover ? String(cover) : ""}
                                      className={styles.select}
                                      style={{ maxWidth: 280 }}
                                    >
                                      <option value="">(Cover otomatis)</option>
                                      {gambarItems.map((g) => (
                                        <option key={g.id} value={String(g.id)} data-url={String(g.url)}>
                                          #{g.id}  {(g.title as string) || (g.url as string)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan CATEGORY_GRID
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload gambar cover untuk kategori (opsional)
                          </h3>
                          <p className={styles.helperText}>
                            Upload di sini akan masuk <code>gambar_upload</code> lalu otomatis dipakai sebagai cover di CATEGORY_GRID draft untuk kategori yang kamu pilih.
                          </p>

                          <form action={uploadImageToGalleryAndAttach} className={styles.newSectionForm}>
                            <input type="hidden" name="sectionId" value={section.id.toString()} />
                            <input type="hidden" name="attach" value="CATEGORY_GRID:cover" />

                            <div className={styles.newSectionGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Pilih kategori</label>
                                <select name="kategoriId" defaultValue="" className={styles.select} required>
                                  <option value="">Pilih kategori</option>
                                  {categoryItems.map((cat) => {
                                    const labelText =
                                      (cat.namaKategori as string) ||
                                      (cat.nama as string) ||
                                      (cat.slug as string) ||
                                      `Kategori #${cat.id}`;
                                    return (
                                      <option key={cat.id} value={String(cat.id)}>
                                        {labelText}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul (opsional)</label>
                                <input name="title" className={styles.input} placeholder="Contoh: Cover Kategori" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>File gambar</label>
                                <input name="file" type="file" accept="image/*" className={styles.input} required />
                              </div>
                            </div>

                            <div className={styles.sectionEditActions}>
                              <button type="submit" className={styles.secondaryButton}>
                                Upload &amp; Set Cover
                              </button>
                            </div>
                          </form>
                        </div>

                      </div>
                    )}

                    {/* PRODUCT_CAROUSEL */}
                    {section.type === "PRODUCT_CAROUSEL" && (
                      <form action={saveProductCarouselConfig} className={styles.sectionEditForm}>
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.sectionEditGrid}>



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
                            }))}
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
                        </div>

                        <div className={styles.sectionEditActions}>
                          <button type="submit" className={styles.primaryButton}>
                            Simpan PRODUCT_CAROUSEL
                          </button>
                        </div>
                      </form>
                    )}

                    {/* CUSTOM_PROMO */}
                    {section.type === "CUSTOM_PROMO" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveCustomPromoConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          {legacyBannerPromoId ? (
                            <div className={styles.warningBox}>
                              Config lama terdeteksi: <code>bannerPromoId</code> = {String(legacyBannerPromoId)}. Saat kamu{" "}
                              klik &quot;Simpan&quot;, config akan otomatis dimigrasi ke format baru (title/subtitle/button/imageId).
                              (banner_promo hanya fallback read-only)
                            </div>
                          ) : null}

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Judul</label>
                            <input name="title" defaultValue={cfg.title ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Subtitle</label>
                            <input name="subtitle" defaultValue={cfg.subtitle ?? ""} className={styles.input} />
                          </div>

                          <div className={styles.sectionEditGrid}>
                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Button label</label>
                              <input name="buttonLabel" defaultValue={cfg.buttonLabel ?? ""} className={styles.input} />
                            </div>
                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Button href</label>
                              <input
                                name="buttonHref"
                                defaultValue={cfg.buttonHref ?? ""}
                                className={styles.input}
                                placeholder="/promo atau link WA"
                              />
                              <p className={styles.helperText}>Jika kosong, tombol tidak ditampilkan.</p>
                            </div>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Gambar (gambar_upload)</label>
                            <select name="imageId" defaultValue={String(cfg.imageId ?? "")} className={`${styles.select} js-image-select`} data-preview-id={`img-preview-${section.id}`}>
                              <option value="">(Tidak pakai gambar)</option>
                              {gambarItems.map((g) => (
                                <option key={g.id} value={String(g.id)} data-url={String(g.url)}>
                                  #{g.id}  {(g.title as string) || (g.url as string)}
                                </option>
                              ))}
                            </select>
                            <div style={{ marginTop: 10 }}>
                              {/* Preview gambar terpilih */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                id={`img-preview-${section.id}`}
                                alt="Preview"
                                style={{ width: "100%", maxWidth: 520, height: 220, objectFit: "cover", borderRadius: 14, border: "1px solid rgba(255,255,255,0.10)", display: "none" }}
                              />
                            </div>

                          </div>

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan CUSTOM_PROMO
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload gambar untuk CUSTOM_PROMO
                          </h3>
                          <p className={styles.helperText}>
                            Upload di sini akan otomatis masuk ke <code>gambar_upload</code> dan langsung dipakai sebagai{" "}
                            <strong>imageId</strong> di CUSTOM_PROMO draft.
                          </p>

                          <form action={uploadImageToGalleryAndAttach} className={styles.newSectionForm}>
                            <input type="hidden" name="sectionId" value={section.id.toString()} />
                            <input type="hidden" name="attach" value="CUSTOM_PROMO:imageId" />

                            <div className={styles.newSectionGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul (opsional)</label>
                                <input name="title" className={styles.input} placeholder="Contoh: Promo Banner" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tags (opsional)</label>
                                <input name="tags" className={styles.input} placeholder="contoh: homepage, promo" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>File gambar</label>
                                <input name="file" type="file" accept="image/*" className={styles.input} required />
                              </div>
                            </div>

                            <div className={styles.sectionEditActions}>
                              <button type="submit" className={styles.primaryButton}>
                                Upload &amp; Pakai di CUSTOM_PROMO
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* SOCIAL */}
                    {section.type === "SOCIAL" && (
                      <form action={saveSocialConfig} className={styles.sectionEditForm}>
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Pilih media sosial (yang tampil hanya ikon)</label>
                          <p className={styles.helperText}>
                            Config disimpan sebagai <code>selected: [{`{iconKey,nama}`}]</code> dan{" "}
                            <code>display.iconsOnly = true</code>.
                          </p>
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
                                    {nama} <code style={{ opacity: 0.8 }}>{iconKey}</code>
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        <div className={styles.sectionEditActions}>
                          <button type="submit" className={styles.primaryButton}>
                            Simpan SOCIAL
                          </button>
                        </div>
                      </form>
                    )}

                    {/* BRANCHES */}
                    {section.type === "BRANCHES" && (
                      <form action={saveBranchesConfig} className={styles.sectionEditForm}>
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Tema Section</label>
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
                          <p className={styles.helperText}>
                            Tema warna yang diterapkan di section Cabang Toko. Pilih "Ikuti tema Navbar" agar otomatis mengikuti warna navbar aktif.
                          </p>
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

                        <div className={styles.sectionEditActions}>
                          <button type="submit" className={styles.primaryButton}>
                            Simpan BRANCHES
                          </button>
                        </div>
                      </form>
                    )}

                    {/* CONTACT */}
                    {section.type === "CONTACT" && (
                      <form action={saveContactConfig} className={styles.sectionEditForm}>
                        <input type="hidden" name="id" value={section.id.toString()} />

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Primary only?</label>
                          <select name="primaryOnly" defaultValue={String(cfg.primaryOnly ?? false)} className={styles.select}>
                            <option value="false">Tidak (boleh banyak)</option>
                            <option value="true">Ya (tampilkan 1 saja)</option>
                          </select>
                        </div>

                        <div className={styles.fieldGroup}>
                          <label className={styles.label}>Pilih kontak</label>
                          {hubungiItems.length === 0 ? (
                            <p className={styles.helperText}>Belum ada data hubungi.</p>
                          ) : (
                            hubungiItems.map((h) => {
                              const checked = Array.isArray(cfg.hubungiIds)
                                ? cfg.hubungiIds.map((v: any) => Number(v)).includes(Number(h.id))
                                : false;
                              const labelText =
                                (h.label as string) ||
                                (h.jenis as string) ||
                                (h.nomor as string) ||
                                (h.email as string) ||
                                `Kontak #${h.id}`;
                              return (
                                <label key={h.id} className={styles.checkboxRow}>
                                  <input type="checkbox" name="hubungiIds" value={String(h.id)} defaultChecked={checked} />
                                  <span>{labelText}</span>
                                </label>
                              );
                            })
                          )}
                        </div>

                        <div className={styles.sectionEditActions}>
                          <button type="submit" className={styles.primaryButton}>
                            Simpan CONTACT
                          </button>
                        </div>
                      </form>
                    )}

                    {/* GALLERY */}
                    {section.type === "GALLERY" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveGalleryConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Layout</label>
                            <select name="layout" defaultValue={String(cfg.layout ?? "grid")} className={styles.select}>
                              <option value="grid">Grid</option>
                              <option value="carousel">Carousel</option>
                            </select>
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>Pilih gambar</label>
                            {gambarItems.length === 0 ? (
                              <p className={styles.helperText}>Belum ada gambar di galeri.</p>
                            ) : (
                              gambarItems.map((g) => {
                                const checked = Array.isArray(cfg.imageIds)
                                  ? cfg.imageIds.map((v: any) => Number(v)).includes(Number(g.id))
                                  : false;
                                return (
                                  <label key={g.id} className={styles.checkboxRow}>
                                    <input type="checkbox" name="imageIds" value={String(g.id)} defaultChecked={checked} />
                                    <span>
                                      #{g.id}  {(g.title as string) || (g.url as string)}
                                    </span>
                                  </label>
                                );
                              })
                            )}
                          </div>

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan GALLERY
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload gambar ke GALLERY
                          </h3>
                          <p className={styles.helperText}>
                            Upload di sini akan masuk <code>gambar_upload</code> lalu otomatis ditambahkan ke{" "}
                            <strong>imageIds</strong> di config GALLERY draft.
                          </p>

                          <form action={uploadImageToGalleryAndAttach} className={styles.newSectionForm}>
                            <input type="hidden" name="sectionId" value={section.id.toString()} />
                            <input type="hidden" name="attach" value="GALLERY:append" />

                            <div className={styles.newSectionGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Judul (opsional)</label>
                                <input name="title" className={styles.input} placeholder="Contoh: Foto Galeri" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tags (opsional)</label>
                                <input name="tags" className={styles.input} placeholder="contoh: homepage, gallery" />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>File gambar</label>
                                <input name="file" type="file" accept="image/*" className={styles.input} required />
                              </div>
                            </div>

                            <div className={styles.sectionEditActions}>
                              <button type="submit" className={styles.primaryButton}>
                                Upload &amp; Tambahkan ke GALLERY
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* ROOM_CATEGORY */}
                    {section.type === "ROOM_CATEGORY" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveRoomCategoryConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          <div className={styles.fieldGroup}>
                            <label className={styles.label}>3 Kartu Ruangan</label>
                            <p className={styles.helperText}>
                              Ada 3 kartu fixed. Pilih kategori + gambar untuk masing-masing.
                            </p>
                          </div>

                          {(Array.isArray(cfg.cards) ? cfg.cards : DEFAULT_ROOM_CARDS).map((card: any, idx: number) => {
                            const key = (card.key as string) || DEFAULT_ROOM_CARDS[idx]?.key;
                            const title = (card.title as string) || DEFAULT_ROOM_CARDS[idx]?.title;
                            return (
                              <div key={key} className={styles.innerCard} style={{ marginTop: 10 }}>
                                <div className={styles.sectionHeading} style={{ fontSize: 14 }}>
                                  {title}
                                </div>

                                <div className={styles.sectionEditGrid}>
                                  <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Kategori</label>
                                    <select
                                      name={`kategoriId_${key}`}
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
                                  </div>

                                  <div className={styles.fieldGroup}>
                                    <label className={styles.label}>Gambar</label>
                                    <select
                                      name={`imageId_${key}`}
                                      defaultValue={String(card.imageId ?? "")}
                                      className={styles.select}
                                    >
                                      <option value="">(Pilih gambar)</option>
                                      {gambarItems.map((g) => (
                                        <option key={g.id} value={String(g.id)} data-url={String(g.url)}>
                                          #{g.id}  {(g.title as string) || (g.url as string)}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan ROOM_CATEGORY
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload gambar per kartu ruangan
                          </h3>
                          <p className={styles.helperText}>
                            Upload di bawah ini akan masuk <code>gambar_upload</code> lalu langsung dipakai ke kartu yang kamu pilih.
                          </p>

                          <div className={styles.sectionEditGrid}>
                            {[
                              { key: "ruang_keluarga_tamu", label: "Ruang Keluarga & Tamu" },
                              { key: "ruang_makan_dapur", label: "Ruang Makan & Dapur" },
                              { key: "kamar_tidur", label: "Kamar Tidur" },
                            ].map((c) => (
                              <form key={c.key} action={uploadImageToGalleryAndAttach} className={styles.innerCard} style={{ margin: 0 }}>
                                <input type="hidden" name="sectionId" value={section.id.toString()} />
                                <input type="hidden" name="attach" value={`ROOM_CATEGORY:${c.key}`} />

                                <div className={styles.fieldGroup}>
                                  <label className={styles.label}>Upload untuk: {c.label}</label>
                                  <input name="file" type="file" accept="image/*" className={styles.input} required />
                                  <input type="hidden" name="title" value={`Room - ${c.label}`} />
                                  <input type="hidden" name="tags" value="homepage, room" />
                                </div>

                                <div className={styles.sectionEditActions}>
                                  <button type="submit" className={styles.secondaryButton}>
                                    Upload &amp; Pakai
                                  </button>
                                </div>
                              </form>
                            ))}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* HIGHLIGHT_COLLECTION */}
                    {section.type === "HIGHLIGHT_COLLECTION" && (
                      <div className={styles.sectionEditForm}>
                        <form action={saveHighlightCollectionConfig} className={styles.sectionEditForm}>
                          <input type="hidden" name="id" value={section.id.toString()} />

                          {/* Mode diset fixed ke products (backward compatible) */}
                          <input type="hidden" name="mode" value="products" />

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
                              <label className={styles.label}>Judul (internal)</label>
                              <input name="title" defaultValue={cfg.title ?? "Koleksi Pilihan"} className={styles.input} />
                              <p className={styles.helperText}>Dipakai untuk label section. Headline tampilan bisa beda.</p>
                            </div>

                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Badge (opsional)</label>
                              <input name="badgeText" defaultValue={cfg.badgeText ?? ""} className={styles.input} />
                            </div>

                            <div className={styles.fieldGroup}>
                              <label className={styles.label}>Headline (opsional)</label>
                              <input name="headline" defaultValue={cfg.headline ?? ""} className={styles.input} />
                            </div>

                            <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                              <label className={styles.label}>Deskripsi (opsional)</label>
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
                              <p className={styles.helperText}>
                                Sumber gambar terpusat di galeri (<code>gambar_upload</code>). Kamu bisa pilih dari galeri atau upload baru (di kartu upload bawah).
                              </p>

                              <select
                                name="heroImageId"
                                defaultValue={String(cfg.heroImageId ?? "")}
                                className={`${styles.select} js-image-select`}
                                data-preview-id={`img-preview-highlight-${section.id}`}
                              >
                                <option value="">(Tidak pakai gambar utama)</option>
                                {gambarItems.map((g) => (
                                  <option key={g.id} value={String(g.id)} data-url={String(g.url)}>
                                    #{g.id}  {(g.title as string) || (g.url as string)}
                                  </option>
                                ))}
                              </select>

                              <div style={{ marginTop: 10 }}>
                                {/* Preview gambar terpilih */}
                                {(() => {
                                  const heroUrl =
                                    (gambarItems.find((g: any) => String(g.id) === String(cfg.heroImageId ?? "")) as any)?.url ?? null;
                                  if (!heroUrl) return null;
                                  // eslint-disable-next-line @next/next/no-img-element
                                  return (
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
                              }))}
                              images={(gambarItems as any[]).map((g: any) => ({
                                id: Number(g.id),
                                url: String(g.url),
                                title: (g.title as string) || "",
                                tags: (g.tags as string) || "",
                              }))}
                              defaultSelectedIds={
                                Array.isArray(cfg.productIds)
                                  ? cfg.productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
                                  : []
                              }
                            />
                          </div>

                          <div className={styles.sectionEditActions}>
                            <button type="submit" className={styles.primaryButton}>
                              Simpan HIGHLIGHT_COLLECTION
                            </button>
                          </div>
                        </form>

                        <div className={styles.innerCard} style={{ marginTop: 12 }}>
                          <h3 className={styles.sectionHeading} style={{ marginTop: 0 }}>
                            Upload hero media untuk HIGHLIGHT_COLLECTION
                          </h3>
                          <p className={styles.helperText}>
                            Upload di sini akan masuk <code>gambar_upload</code> lalu otomatis dipakai sebagai <strong>heroImageId</strong> pada section ini.
                          </p>

                          <form action={uploadImageToGalleryAndAttach} className={styles.newSectionForm}>
                            <input type="hidden" name="sectionId" value={section.id.toString()} />
                            <input type="hidden" name="attach" value="HIGHLIGHT_COLLECTION:heroImageId" />

                            <div className={styles.newSectionGrid}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Title (opsional)</label>
                                <input name="title" className={styles.input} placeholder="Mis. Koleksi Akhir Tahun" />
                              </div>

                              <div className={styles.fieldGroup}>
                                <label className={styles.label}>Tags (opsional)</label>
                                <input name="tags" className={styles.input} placeholder="highlight, promo, 2025" />
                              </div>

                              <div className={styles.fieldGroup} style={{ gridColumn: "1 / -1" }}>
                                <label className={styles.label}>File Gambar</label>
                                <input name="file" type="file" accept="image/*" className={styles.input} required />
                              </div>
                            </div>

                            <div className={styles.sectionEditActions}>
                              <button type="submit" className={styles.primaryButton}>
                                Upload &amp; Pakai
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}


                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>

      {/* Script drag & drop urutan section + ordered picker (vanilla JS) */}
      <TokoClient />
    </main>
  );
}
