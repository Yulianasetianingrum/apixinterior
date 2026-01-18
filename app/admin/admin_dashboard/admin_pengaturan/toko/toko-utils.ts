// app/admin/admin_dashboard/admin_pengaturan/toko/toko-utils.ts
import { prisma } from "@/lib/prisma";
import { ThemeKey, SectionTypeId, SectionDef } from "./types";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const DEFAULT_THEME_KEY: ThemeKey = "theme_1";
export const THEME_META_SLUG_PREFIX = "__theme_meta__";
export const ADMIN_TOKO_PATH = "/admin/admin_dashboard/admin_pengaturan/toko";
export const MAX_CUSTOM_PROMO_VOUCHERS = 20;
export const MAX_ROOM_CARDS = 12;

export function isThemeMetaRow(row: any): boolean {
    const slug = String(row?.slug ?? "");
    const cfg = (row?.config ?? {}) as any;
    return slug.startsWith(THEME_META_SLUG_PREFIX) || slug === "__active_theme__" || cfg?.__isThemeMeta === true;
}

export function getThemeKeyFromConfig(cfg: any): string {
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg) && typeof cfg.__themeKey === "string") {
        const v = String(cfg.__themeKey).trim();
        return v ? normalizeThemeKey(v) : DEFAULT_THEME_KEY;
    }
    return DEFAULT_THEME_KEY;
}

export const ALLOWED_THEMES = [
    "FOLLOW_NAVBAR",
    "NAVY_GOLD",
    "WHITE_GOLD",
    "NAVY_WHITE",
    "GOLD_NAVY",
    "GOLD_WHITE",
    "WHITE_NAVY",
];

const DEFAULT_ROOM_CARDS = [
    { key: "ruang_keluarga_tamu", title: "Ruang Keluarga & Tamu" },
    { key: "ruang_makan_dapur", title: "Ruang Makan & Dapur" },
    { key: "kamar_tidur", title: "Kamar Tidur" },
] as const;

export const SECTION_DEFS: SectionDef[] = [
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
            title: "",
            productIds: [],
        },
    },
    {
        type: "HIGHLIGHT_COLLECTION",
        label: "Highlight Collection",
        description: "Koleksi kurasi premium (produk pilihan + hero media + CTA).",
        defaultSlug: "koleksi-pilihan",
        defaultConfig: {
            mode: "products",
            title: "Koleksi Pilihan",
            productIds: [],
            layout: "FEATURED_LEFT",
            heroImageId: null,
            badgeText: "",
            headline: "",
            description: "",
            ctaText: "",
            ctaHref: "",
            sectionTheme: "FOLLOW_NAVBAR",
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
        defaultConfig: { branchIds: [], layout: "carousel" },
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

export const SECTION_ICON: Record<string, string> = {
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
    FOOTER: "F",
};

export function computeHargaSetelahPromo(p: {
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

export function safeDecode(v: string): string {
    if (!v) return "";
    try {
        return decodeURIComponent(v.replace(/\+/g, " "));
    } catch {
        return v;
    }
}

export function isObject(v: unknown): v is Record<string, any> {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

export function normalizeThemeKey(v: any): ThemeKey {
    const raw = String(v ?? "").trim();
    const s = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return s || DEFAULT_THEME_KEY;
}

export async function getRefererUrl(): Promise<URL | null> {
    const headersList = await headers();
    const ref = headersList.get("referer") || "";
    try {
        return new URL(ref);
    } catch {
        return null;
    }
}

export async function getThemeKeyFromReferer(): Promise<ThemeKey> {
    const u = await getRefererUrl();
    if (!u) return DEFAULT_THEME_KEY;
    return normalizeThemeKey(u.searchParams.get("theme"));
}

export function themeMetaSlug(themeKey: ThemeKey) {
    return `${THEME_META_SLUG_PREFIX}${themeKey}`;
}

export function withThemeKey(config: any, themeKey: ThemeKey) {
    return { ...config, __themeKey: themeKey };
}

export async function ensureThemeMeta(themeKey: ThemeKey) {
    const slug = themeMetaSlug(themeKey);
    const existing = await prisma.homepageSectionDraft.findFirst({ where: { slug } });
    if (!existing) {
        await prisma.homepageSectionDraft.create({
            data: {
                type: "THEME_META" as any,
                title: `Theme Meta ${themeKey}`,
                slug,
                enabled: true,
                sortOrder: -999,
                config: { __isThemeMeta: true, __themeKey: themeKey },
            },
        });
    }
}

export async function redirectBack(params: {
    notice?: string;
    error?: string;
    forceReload?: boolean;
    anchor?: string;
    sectionId?: number | string;
    theme?: string;
}) {
    const u = await getRefererUrl();
    const base = u ? u : new URL("http://localhost/admin/admin_dashboard/admin_pengaturan/toko");
    if (params.notice) {
        base.searchParams.set("notice", safeDecode(params.notice));
        base.searchParams.delete("error");
    }
    if (params.error) {
        base.searchParams.set("error", safeDecode(params.error));
        base.searchParams.delete("notice");
    }
    if (params.forceReload) {
        base.searchParams.set("r", String(Date.now()));
    }
    if (params.sectionId !== undefined && params.sectionId !== null && params.sectionId !== "") {
        base.searchParams.set("sectionId", String(params.sectionId));
    } else {
        base.searchParams.delete("sectionId");
    }
    if (params.theme) {
        base.searchParams.set("theme", params.theme);
    }
    const anchor = params.anchor ? `#${params.anchor}` : base.hash;
    redirect(base.pathname + (base.search ? base.search : "") + (anchor || ""));
}

export function getThemeKeyFromRow(row: any): ThemeKey {
    const cfg = (row?.config ?? {}) as any;
    if (cfg?.__themeKey) return normalizeThemeKey(cfg.__themeKey);
    return DEFAULT_THEME_KEY;
}



export function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function toTitleCase(s: string) {
    return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function limitWords(s: string, max: number) {
    const words = s.split(/\s+/).filter(Boolean);
    if (words.length <= max) return s;
    return words.slice(0, max).join(" ");
}

export function isPngUrl(url?: string | null) {
    return /\.png(\?|#|$)/i.test(String(url ?? ""));
}

export function ensureScopeLabel(label: string, scope: string) {
    if (label.toLowerCase().includes(scope.toLowerCase())) return label;
    return `${label} ${scope}`;
}

export function buildSeoSlug(label: string) {
    return slugify(label);
}

export function getCategoryLabel(cat: any) {
    return String(cat?.nama || cat?.title || "");
}

export function scoreImageMatch(label: string, img: any) {
    const l = label.toLowerCase();
    const t = String(img.title || "").toLowerCase();

    let score = 0;
    if (t.includes(l)) score += 100;

    const words = l.split(/\s+/).filter((w) => w.length > 2);
    for (const w of words) {
        if (t.includes(w)) score += 10;
    }
    return score;
}

export function pickBestImage(label: string, pngImages: any[], usedIds?: Set<number>) {
    let best: { id: number; score: number } | null = null;
    for (const img of pngImages) {
        if (usedIds?.has(Number(img.id))) continue;
        const score = scoreImageMatch(label, img);
        if (score < 10) continue;
        if (!best || score > best.score) best = { id: Number(img.id), score };
    }
    return best?.id ?? (pngImages[0] ? Number(pngImages[0].id) : null);
}

export function parseNum(v: any) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export function parseNumArray(v: any): number[] {
    if (!Array.isArray(v)) return [];
    return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
}

export function clampInt(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, Math.round(v)));
}

export function normalizeThemeAttr(v: any) {
    const s = String(v ?? "").trim().toUpperCase();
    return s || "FOLLOW_NAVBAR";
}

export function parseSectionTheme(v: any): string | null {
    const s = String(v ?? "").trim().toUpperCase();
    return ALLOWED_THEMES.includes(s) ? s : "FOLLOW_NAVBAR";
}

export function parseCustomPromoBgTheme(v: any) {
    const s = String(v ?? "").trim().toUpperCase();
    if (!s || s === "FOLLOW_NAVBAR") return "FOLLOW_NAVBAR";
    if (s === "NAVY" || s === "WHITE" || s === "GOLD" || s === "SOFT_GOLD" || s === "SOFT_NAVY") return s;
    return ALLOWED_THEMES.includes(s) ? s : "FOLLOW_NAVBAR";
}

export function normalizeVoucherImageIds(v: any): number[] {
    return parseNumArray(v).slice(0, MAX_CUSTOM_PROMO_VOUCHERS);
}

export type RoomCard = {
    key: string;
    title: string;
    description: string;
    badge: string;
    kategoriId: number | null;
    imageId: number | null;
};

export function normalizeRoomCards(v: any): RoomCard[] {
    if (!Array.isArray(v)) return [];
    return v
        .filter((c) => c && typeof c === "object")
        .map((c) => ({
            key: String(c.key || ""),
            title: String(c.title || ""),
            description: String(c.description || ""),
            badge: String(c.badge || ""),
            kategoriId: parseNum(c.kategoriId),
            imageId: parseNum(c.imageId),
        }))
        .filter((c) => c.key);
}

export function makeRoomCardKey() {
    return `card_${Math.random().toString(36).slice(2, 11)}`;
}

export function normalizeCustomPromoConfig(cfg: any) {
    const base = isObject(cfg) ? cfg : {};
    return {
        layout: String(base.layout ?? "carousel").toLowerCase(),
        sectionBgTheme: parseCustomPromoBgTheme(base.sectionBgTheme ?? base.sectionTheme),
        voucherImageIds: normalizeVoucherImageIds(base.voucherImageIds),
        voucherLinks: isObject(base.voucherLinks) ? (base.voucherLinks as Record<number, string>) : {},
        _legacyBannerPromoId: base._legacyBannerPromoId,
    };
}

export function collectExistenceArgs(type: string, cfg: any) {
    const args: any = {};
    if (type === "HERO") {
        args.imageIds = parseNumArray([cfg.imageId, cfg.heroImageId]);
    }
    if (type === "CATEGORY_GRID" || type === "CATEGORY_GRID_COMMERCE") {
        args.kategoriIds = parseNumArray(cfg.items?.map((it: any) => it.kategoriId));
        args.imageIds = parseNumArray(cfg.items?.map((it: any) => it.coverImageId || it.imageId));
    }
    if (type === "PRODUCT_CAROUSEL" || type === "PRODUCT_LISTING" || type === "HIGHLIGHT_COLLECTION") {
        args.productIds = parseNumArray(cfg.productIds);
        if (type === "HIGHLIGHT_COLLECTION" && cfg.heroImageId) {
            args.imageIds = parseNumArray([cfg.heroImageId]);
        }
    }
    if (type === "ROOM_CATEGORY") {
        args.kategoriIds = parseNumArray(cfg.cards?.map((c: any) => c.kategoriId));
        args.imageIds = parseNumArray(cfg.cards?.map((c: any) => c.imageId));
    }
    if (type === "GALLERY") {
        args.imageIds = parseNumArray(cfg.imageIds);
    }
    if (type === "BRANCHES") {
        args.branchIds = parseNumArray(cfg.branchIds);
    }
    if (type === "CONTACT") {
        args.hubungiIds = parseNumArray(cfg.hubungiIds);
        args.imageIds = parseNumArray([cfg.imageId]);
    }
    if (type === "SOCIAL") {
        args.mediaIconKeys = cfg.selected?.map((s: any) => s.iconKey) || [];
    }
    if (type === "CUSTOM_PROMO") {
        args.imageIds = normalizeVoucherImageIds(cfg.voucherImageIds);
    }
    return args;
}

export async function validateExistence(args: {
    productIds?: number[];
    kategoriIds?: number[];
    imageIds?: number[];
    branchIds?: number[];
    hubungiIds?: number[];
    mediaIconKeys?: string[];
}) {
    if (args.productIds?.length) {
        const count = await prisma.produk.count({ where: { id: { in: args.productIds } } });
        if (count < args.productIds.length) throw new Error("Beberapa produk tidak ditemukan.");
    }
    if (args.kategoriIds?.length) {
        const count = await prisma.kategoriProduk.count({ where: { id: { in: args.kategoriIds } } });
        if (count < args.kategoriIds.length) throw new Error("Beberapa kategori tidak ditemukan.");
    }
    if (args.imageIds?.length) {
        const count = await prisma.gambarUpload.count({ where: { id: { in: args.imageIds } } });
        if (count < args.imageIds.length) throw new Error("Beberapa gambar tidak ditemukan.");
    }
    if (args.branchIds?.length) {
        const count = await prisma.cabangToko.count({ where: { id: { in: args.branchIds } } });
        if (count < args.branchIds.length) throw new Error("Beberapa cabang tidak ditemukan.");
    }
    if (args.hubungiIds?.length) {
        const count = await prisma.hubungi.count({ where: { id: { in: args.hubungiIds } } });
        if (count < args.hubungiIds.length) throw new Error("Beberapa kontak tidak ditemukan.");
    }
    if (args.mediaIconKeys?.length) {
        const count = await prisma.mediaSosial.count({ where: { iconKey: { in: args.mediaIconKeys } } });
        if (count < args.mediaIconKeys.length) throw new Error("Beberapa ikon sosmed tidak ditemukan.");
    }
}

export function legacyToNewConfig(type: string, cfg: any) {
    if (!isObject(cfg)) return cfg;

    if (type === "HERO") {
        return {
            sectionTheme: String(cfg.sectionTheme ?? cfg.heroTheme ?? "FOLLOW_NAVBAR"),
            headline: String(cfg.headline ?? "").trim(),
            subheadline: String(cfg.subheadline ?? "").trim(),
            ctaLabel: String(cfg.ctaLabel ?? "").trim(),
            ctaHref: String(cfg.ctaHref ?? "").trim(),
            imageId: parseNum(cfg.imageId ?? cfg.heroImageId),
            heroImageId: parseNum(cfg.imageId ?? cfg.heroImageId),
        };
    }

    if (type === "PRODUCT_CAROUSEL") {
        return {
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            title: String(cfg.title ?? "").trim(),
            description: String(cfg.description ?? "").trim(),
            productIds: parseNumArray(cfg.productIds),
            showPrice: cfg.showPrice !== false,
            showCta: cfg.showCta !== false,
            sectionBgTheme: parseCustomPromoBgTheme(cfg.sectionBgTheme),
        };
    }

    if (type === "CATEGORY_GRID") {
        const ids = parseNumArray(cfg.kategoriIds);
        if (ids.length && !cfg.items) {
            return {
                sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
                layout: { columns: 3, maxItems: ids.length || 6 },
                items: ids.map((id: number) => ({ kategoriId: id, coverImageId: null })),
            };
        }
        return {
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            sectionBgTheme: parseCustomPromoBgTheme(cfg.sectionBgTheme),
            titleTextColor: String(cfg.titleTextColor ?? "").trim(),
            layout: isObject(cfg.layout) ? cfg.layout : { columns: 3, maxItems: 6 },
            items: Array.isArray(cfg.items) ? cfg.items : [],
        };
    }

    if (type === "PRODUCT_LISTING") {
        return {
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            sectionBgTheme: parseCustomPromoBgTheme(cfg.sectionBgTheme),
            title: String(cfg.title ?? "").trim(),
            productIds: parseNumArray(cfg.productIds),
        };
    }

    if (type === "HIGHLIGHT_COLLECTION") {
        return {
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            mode: String(cfg.mode ?? "products"),
            layout: String(cfg.layout ?? "FEATURED_LEFT"),
            headline: String(cfg.headline ?? "").trim(),
            description: String(cfg.description ?? "").trim(),
            ctaText: String(cfg.ctaText ?? "").trim(),
            ctaHref: String(cfg.ctaHref ?? "").trim(),
            heroImageId: parseNum(cfg.heroImageId),
            productIds: parseNumArray(cfg.productIds),
            items: Array.isArray(cfg.items) ? cfg.items : [],
        };
    }

    return cfg;
}

export async function updateDraftConfigPreserveTheme(id: number, nextCfg: any, meta?: { title?: string; slug?: string | null }) {
    const existing = await prisma.homepageSectionDraft.findUnique({ where: { id } });
    if (!existing) return;

    const themeKey = getThemeKeyFromRow(existing);
    await prisma.homepageSectionDraft.update({
        where: { id },
        data: {
            ...(meta?.title !== undefined ? { title: meta.title } : {}),
            ...(meta?.slug !== undefined ? { slug: meta.slug } : {}),
            config: withThemeKey(nextCfg, themeKey),
        },
    });

    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko");
    revalidatePath("/admin/admin_dashboard/admin_pengaturan/toko/preview");
    revalidatePath("/");
}

export function upperType(v: unknown) {
    return String(v ?? "").toUpperCase().trim();
}

export function readSp(sp: any, key: string): string {
    const raw = sp?.[key];
    if (typeof raw === "string") return safeDecode(raw);
    if (Array.isArray(raw)) return safeDecode(String(raw[0] ?? ""));
    return "";
}



