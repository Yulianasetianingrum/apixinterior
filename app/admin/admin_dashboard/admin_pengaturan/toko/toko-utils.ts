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
        label: "Footer Section",
        description: "Kontak (WA, Email, Alamat), Sosmed, dan Link Menu di bagian bawah.",
        defaultSlug: "footer",
        defaultConfig: {
            sectionTheme: "FOLLOW_NAVBAR",
            whatsapp: "",
            email: "",
            address: "",
            instagram: "",
            facebook: "",
            useGlobalContact: true,
            useGlobalSocial: true,
            menuLinks: [
                { label: "Hubungi Kami", url: "/hubungi" },
                { label: "Koleksi Terbaru", url: "/produk" },
                { label: "Tentang Kami", url: "/tentang" }
            ],
            footerTags: [
                { label: "Interior Design Jakarta", url: "" },
                { label: "Jasa Interior Rumah", url: "" },
                { label: "Mebel Kayu Jepara", url: "" },
                { label: "Furniture Kantor Murah", url: "" },
                { label: "Kitchen Set Minimalis", url: "" },
                { label: "Sofa Tamu Modern", url: "" },
                { label: "Lemari Pakaian Custom", url: "" },
                { label: "Meja Makan Mewah", url: "" }
            ],
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

export function defaultThemeName(themeKey: ThemeKey) {
    if (themeKey === "theme_1") return "Theme 1";
    const short = String(themeKey).replace(/^theme_/, "").slice(0, 12);
    return short ? `Theme ${short}` : "Theme";
}

export async function ensureThemeMeta(themeKey: ThemeKey, themeName?: string) {
    const slug = themeMetaSlug(themeKey);

    // Safer cleanup: Find all rows that look like theme meta for this themeKey
    const allDrafts = await prisma.homepageSectionDraft.findMany({});
    const duplicates = allDrafts.filter(d => {
        const rowTk = getThemeKeyFromRow(d);
        const isMeta = isThemeMetaRow(d);
        // It's a duplicate if it's meta for this themeKey but NOT the official slug-based row
        return isMeta && rowTk === themeKey && d.slug !== slug;
    });

    if (duplicates.length) {
        await prisma.homepageSectionDraft.deleteMany({
            where: { id: { in: duplicates.map(d => d.id) } }
        });
    }

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
            type: "CUSTOM_PROMO" as any,
            title: "__THEME_META__",
            slug,
            enabled: false,
            sortOrder: -999,
            config: { __isThemeMeta: true, __themeKey: themeKey, themeName: (themeName || defaultThemeName(themeKey)).trim() },
        },
    });
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

export async function sanitizeExistence(args: {
    productIds?: number[];
    kategoriIds?: number[];
    imageIds?: number[];
    branchIds?: number[];
    hubungiIds?: number[];
    mediaIconKeys?: string[];
}) {
    const out = { ...args };

    if (args.productIds?.length) {
        const found = await prisma.produk.findMany({ where: { id: { in: args.productIds } }, select: { id: true } });
        const validSet = new Set(found.map((x) => x.id));
        out.productIds = args.productIds.filter((id) => validSet.has(id));
    }
    if (args.kategoriIds?.length) {
        const found = await prisma.kategoriProduk.findMany({ where: { id: { in: args.kategoriIds } }, select: { id: true } });
        const validSet = new Set(found.map((x) => x.id));
        out.kategoriIds = args.kategoriIds.filter((id) => validSet.has(id));
    }
    if (args.imageIds?.length) {
        const found = await prisma.gambarUpload.findMany({ where: { id: { in: args.imageIds } }, select: { id: true } });
        const validSet = new Set(found.map((x) => x.id));
        out.imageIds = args.imageIds.filter((id) => validSet.has(id));
    }
    if (args.branchIds?.length) {
        const found = await prisma.cabangToko.findMany({ where: { id: { in: args.branchIds } }, select: { id: true } });
        const validSet = new Set(found.map((x) => x.id));
        out.branchIds = args.branchIds.filter((id) => validSet.has(id));
    }
    if (args.hubungiIds?.length) {
        const found = await prisma.hubungi.findMany({ where: { id: { in: args.hubungiIds } }, select: { id: true } });
        const validSet = new Set(found.map((x) => x.id));
        out.hubungiIds = args.hubungiIds.filter((id) => validSet.has(id));
    }
    if (args.mediaIconKeys?.length) {
        const found = await prisma.mediaSosial.findMany({ where: { iconKey: { in: args.mediaIconKeys } }, select: { iconKey: true } });
        const validSet = new Set(found.map((x) => x.iconKey));
        out.mediaIconKeys = args.mediaIconKeys.filter((k) => validSet.has(k));
    }
    return out;
}

export function legacyToNewConfig(type: string, cfg: any) {
    if (!isObject(cfg)) return cfg;

    if (type === "HERO") {
        return {
            ...(cfg ?? {}),
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
            ...(cfg ?? {}),
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
                ...(cfg ?? {}),
                sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
                layout: { columns: 3, maxItems: ids.length || 6 },
                items: ids.map((id: number) => ({ kategoriId: id, coverImageId: null })),
            };
        }
        return {
            ...(cfg ?? {}),
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            sectionBgTheme: parseCustomPromoBgTheme(cfg.sectionBgTheme),
            titleTextColor: String(cfg.titleTextColor ?? "").trim(),
            layout: isObject(cfg.layout) ? cfg.layout : { columns: 3, maxItems: 6 },
            items: Array.isArray(cfg.items) ? cfg.items : [],
        };
    }

    if (type === "PRODUCT_LISTING") {
        return {
            ...(cfg ?? {}),
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            sectionBgTheme: parseCustomPromoBgTheme(cfg.sectionBgTheme),
            title: String(cfg.title ?? "").trim(),
            productIds: parseNumArray(cfg.productIds),
        };
    }

    if (type === "HIGHLIGHT_COLLECTION") {
        return {
            ...(cfg ?? {}),
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

    if (type === "FOOTER") {
        return {
            ...(cfg ?? {}),
            sectionTheme: String(cfg.sectionTheme ?? "FOLLOW_NAVBAR"),
            whatsapp: String(cfg.whatsapp ?? "").trim(),
            email: String(cfg.email ?? "").trim(),
            address: String(cfg.address ?? "").trim(),
            instagram: String(cfg.instagram ?? "").trim(),
            facebook: String(cfg.facebook ?? "").trim(),
            useGlobalContact: cfg.useGlobalContact !== false,
            useGlobalSocial: cfg.useGlobalSocial !== false,
            menuLinks: Array.isArray(cfg.menuLinks) ? cfg.menuLinks : [],
            footerTags: Array.isArray(cfg.footerTags) ? cfg.footerTags : [],
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

export function safeDecodeURIComponent(v: string) {
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
}

export function parseBgThemeLocal(v: any) {
    const s = String(v ?? "").trim().toUpperCase();
    if (s === "SOFT_GOLD" || s === "SOFT GOLD") return "SOFT_GOLD";
    if (s === "SOFT_NAVY" || s === "SOFT NAVY") return "SOFT_NAVY";
    if (s === "NAVY") return "NAVY";
    if (s === "WHITE") return "WHITE";
    if (s === "GOLD") return "GOLD";
    return "FOLLOW_NAVBAR";
}

export function readSp(sp: any, key: string): string {
    const raw = sp?.[key];
    if (typeof raw === "string") return safeDecode(raw);
    if (Array.isArray(raw)) return safeDecode(String(raw[0] ?? ""));
    return "";
}

export function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
}

export function toTitleCase(input: string): string {
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

export function limitWords(input: string, maxWords: number): string {
    const parts = String(input || "").trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, Math.max(1, maxWords)).join(" ");
}

export function ensureScopeLabel(label: string, scopeWord: string): string {
    const lower = label.toLowerCase();
    const hasScope = /(mebel|furnitur|interior|rumah|office|kantor|bangunan)/.test(lower);
    if (hasScope) return label;
    return `${label} ${scopeWord}`;
}

export function buildSeoSlug(label: string): string {
    const base = slugify(label);
    return base || "";
}

export function fileBaseName(url: string): string {
    const raw = String(url || "");
    const clean = raw.split("?")[0].split("#")[0];
    const last = clean.split("/").pop() || "";
    return last.replace(/\.(png|webp|jpg|jpeg|gif|svg)$/i, "");
}

export function titleBaseName(title: string): string {
    const raw = String(title || "").trim();
    if (!raw) return "";
    const noExt = raw.replace(/\.(png|webp|jpg|jpeg|gif|svg)$/i, "");
    return stripPngSuffix(noExt);
}

export function stripPngSuffix(slug: string): string {
    const s = String(slug || "");
    if (!s) return "";
    if (s.endsWith("-png")) return s.slice(0, -4);
    if (s.endsWith("png")) return s.slice(0, -3);
    return s;
}

export function isPngUrl(url: string): boolean {
    return /\.png(\?|#|$)/i.test(String(url || ""));
}

export const TOKEN_SYNONYMS: Record<string, string[]> = {
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

export const WORD_SYNONYMS: Record<string, string[]> = {
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

export function normalizeTokenVariants(label: string): string[] {
    const base = slugify(label);
    const out = new Set<string>();
    if (base) out.add(base);
    const direct = TOKEN_SYNONYMS[label.toLowerCase()] || [];
    direct.map(slugify).forEach((v) => out.add(v));
    const parts = base.split("-").filter(Boolean);
    parts.forEach((p) => {
        const syns = WORD_SYNONYMS[p] || [];
        syns.map(slugify).forEach((s) => out.add(s));
    });
    return Array.from(out);
}

export function scoreImageMatch(label: string, img: { url?: string | null; title?: string | null }): number {
    const labelTokens = normalizeTokenVariants(label);
    const titleRaw = String(img.title || "").toLowerCase();
    const urlRaw = String(img.url || "").toLowerCase();
    const urlBase = fileBaseName(urlRaw).toLowerCase();
    const titleBase = titleBaseName(titleRaw).toLowerCase();
    let score = 0;
    for (const t of labelTokens) {
        if (titleRaw.includes(t)) score += 15;
        if (urlBase.includes(t)) score += 10;
        if (titleBase === t) score += 20;
        if (urlBase === t) score += 15;
    }
    return score;
}

export function pickBestImage(label: string, images: { id: number | string; url: string; title: string }[], usedIds?: Set<number>) {
    let best: { id: number; score: number } | null = null;
    for (const img of images) {
        if (usedIds?.has(Number(img.id))) continue;
        const score = scoreImageMatch(label, img);
        if (score < 10) continue;
        if (!best || score > best.score) best = { id: Number(img.id), score };
    }
    return best?.id ?? null;
}

export function getCategoryLabel(cat: { nama?: string | null }): string {
    const raw = String(cat?.nama ?? "").trim();
    // common cleanup for Apix data (remove "Mebel", "Interior" if at end etc)
    return raw.replace(/\s+(Mebel|Interior|Furnitur)$/i, "");
}

export function clampInt(val: any, min: number, max: number): number {
    const n = Math.round(Number(val));
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
}

export function parseNumArray(val: any): number[] {
    if (!val) return [];
    if (Array.isArray(val)) {
        return val.map((v) => Math.round(Number(v))).filter((v) => !Number.isNaN(v) && v > 0);
    }
    const s = String(val).trim();
    if (!s) return [];
    return s
        .split(/[\s,]+/)
        .map((v) => Math.round(Number(v)))
        .filter((v) => !Number.isNaN(v) && v > 0);
}

export function parseNum(val: any): number | null {
    if (val === null || val === undefined || val === "") return null;
    const n = Math.round(Number(val));
    return Number.isFinite(n) ? n : null;
}

export function normalizeCustomPromoConfig(cfg: any) {
    const base = isObject(cfg) ? cfg : {};
    return {
        layout: String(base.layout ?? "carousel").toLowerCase(),
        sectionBgTheme: parseCustomPromoBgTheme(base.sectionBgTheme),
        voucherImageIds: normalizeVoucherImageIds(base.voucherImageIds),
        voucherLinks: isObject(base.voucherLinks) ? base.voucherLinks : {},
    };
}

export function normalizeVoucherImageIds(v: any): number[] {
    if (Array.isArray(v)) return v.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    return [];
}

export function normalizeRoomCards(v: any) {
    if (!Array.isArray(v)) return [];
    return v
        .map((c: any) => ({
            key: String(c?.key ?? "").trim(),
            title: String(c?.title ?? "").trim(),
            description: String(c?.description ?? "").trim(),
            badge: String(c?.badge ?? "").trim(),
            kategoriId: parseNum(c?.kategoriId),
            imageId: parseNum(c?.imageId),
        }))
        .filter((c) => c.key)
        .slice(0, MAX_ROOM_CARDS);
}

export function makeRoomCardKey(title: string): string {
    return slugify(title).replace(/-/g, "_");
}




