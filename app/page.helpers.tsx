
import styles from "./page.module.css";
const ui = styles; // Alias for compatibility with preview code

export type JsonObject = Record<string, any>;

export type SectionRow = {
    id: number;
    type: string;
    title: string | null;
    slug: string | null;
    enabled: boolean;
    sortOrder: number;
    config: JsonObject;
};

export type CategoryGridItem = { kategoriId: number; coverImageId: number | null };
export type CategoryCommerceItem = {
    type?: "category" | "custom";
    kategoriId?: number;
    slug?: string;
    label?: string;
    imageId?: number | null;
    href?: string;
    imageUrl?: string;
    tabId?: string;
};

export const FALLBACK_CATEGORY_IMAGE_URL = "/logo/logo_apixinterior_biru.png.png";
export const MAX_CUSTOM_PROMO_VOUCHERS = 20;

export function safeDecode(v: string) {
    if (!v) return "";
    try {
        return decodeURIComponent(v);
    } catch {
        return v;
    }
}

export function isObject(v: unknown): v is JsonObject {
    return !!v && typeof v === "object" && !Array.isArray(v);
}

export function upperType(v: unknown) {
    return String(v ?? "").toUpperCase().trim();
}

export function normalizeThemeKey(v: any): string {
    const s = String(v ?? "").trim();
    return s || "theme_1";
}

export function normalizeThemeAttr(v: any): string {
    const s = String(v ?? "").trim();
    if (!s) return "";
    const m = s.match(/^theme[_-]?(\d+)$/i);
    if (m) return `theme_${Number(m[1])}`;
    return s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

const ALLOWED_THEME_COMBOS = new Set([
    "theme_1", "theme_2", "theme_3", "theme_4", "theme_5", "theme_6",
    "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY",
    "GOLD", "NAVY", "WHITE", "LIGHT", "DARK",
]);

export function parseSectionTheme(raw: any): string | null {
    const normalized = normalizeThemeAttr(raw);
    if (!normalized || normalized === "FOLLOW_NAVBAR") return null;
    return ALLOWED_THEME_COMBOS.has(normalized) ? normalized : null;
}

export function resolveEffectiveTheme(raw: any, navbarTheme: string): string {
    const parsed = parseSectionTheme(raw);
    const navbar = normalizeThemeAttr(navbarTheme || "NAVY_GOLD") || "NAVY_GOLD";
    return parsed || navbar;
}

export function getHeroThemeTokens(theme: string) {
    const navy = "#0b1d3a";
    const gold = "#d4af37";
    const white = "#ffffff";
    const ink = "#0f172a";

    switch (theme) {
        case "NAVY_GOLD":
        case "NAVY":
        case "DARK":
        case "theme_1":
            return { bg: navy, element: gold, card: navy, cardFg: gold, cardBorder: "rgba(255,255,255,0.22)", ctaBg: gold, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: gold, divider: "rgba(255,255,255,0.16)" };
        case "WHITE_GOLD":
        case "theme_2":
            // IMPROVED CONTRAST: Use Navy text on White card instead of Gold text
            return { bg: white, element: gold, card: white, cardFg: navy, cardBorder: "rgba(11,29,58,0.12)", ctaBg: gold, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: gold, divider: "rgba(2,6,23,0.08)" };
        case "NAVY_WHITE":
        case "theme_3":
            return { bg: navy, element: white, card: navy, cardFg: white, cardBorder: "rgba(255,255,255,0.22)", ctaBg: white, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: white, divider: "rgba(255,255,255,0.16)" };
        case "GOLD_NAVY":
        case "GOLD":
        case "theme_4":
            return { bg: gold, element: navy, card: gold, cardFg: navy, cardBorder: "rgba(11,29,58,0.20)", ctaBg: navy, ctaFg: white, ctaHoverBg: white, ctaHoverFg: navy, divider: "rgba(11,29,58,0.14)" };
        case "GOLD_WHITE":
        case "theme_5":
            return { bg: gold, element: white, card: gold, cardFg: white, cardBorder: "rgba(255,255,255,0.22)", ctaBg: white, ctaFg: ink, ctaHoverBg: ink, ctaHoverFg: white, divider: "rgba(255,255,255,0.18)" };
        case "WHITE_NAVY":
        case "WHITE":
        case "LIGHT":
        case "theme_6":
        default:
            return { bg: white, element: navy, card: white, cardFg: navy, cardBorder: "rgba(11,29,58,0.12)", ctaBg: navy, ctaFg: white, ctaHoverBg: white, ctaHoverFg: navy, divider: "rgba(2,6,23,0.08)" };
    }
}

export function commerceThemeTokens(theme: string) {
    // Same logic as getHeroThemeTokens for now
    return getHeroThemeTokens(theme);
}

export type PromoBgToken = "FOLLOW_NAVBAR" | "NAVY" | "WHITE" | "GOLD" | "SOFT_GOLD" | "SOFT_NAVY";

export function parseCustomPromoBgTheme(raw: any): PromoBgToken {
    const normalized = normalizeThemeAttr(typeof raw === "string" ? raw : String(raw ?? ""));
    if (!normalized || normalized === "FOLLOW_NAVBAR") return "FOLLOW_NAVBAR";
    if (normalized.startsWith("NAVY")) return "NAVY";
    if (normalized.startsWith("WHITE")) return "WHITE";
    if (normalized.startsWith("GOLD")) return "GOLD";
    if (normalized.includes("SOFT_GOLD")) return "SOFT_GOLD";
    if (normalized.includes("SOFT_NAVY")) return "SOFT_NAVY";
    return "FOLLOW_NAVBAR";
}

function navbarBgToken(navbarTheme: string): Exclude<PromoBgToken, "FOLLOW_NAVBAR"> {
    const nav = normalizeThemeAttr(navbarTheme || "NAVY_GOLD");
    if (nav.startsWith("WHITE")) return "WHITE";
    if (nav.startsWith("GOLD")) return "GOLD";
    return "NAVY";
}

export function resolveCustomPromoPalette(rawBg: any, navbarTheme: string) {
    const parsed = parseCustomPromoBgTheme(rawBg);
    const token = parsed === "FOLLOW_NAVBAR" ? navbarBgToken(navbarTheme) : parsed;
    const palette: Record<string, { bg: string; fg: string; border: string }> = {
        NAVY: { bg: "rgba(11, 29, 58, 0.96)", fg: "#f4f7fb", border: "rgba(255,255,255,0.18)" },
        WHITE: { bg: "#ffffff", fg: "#0b1d3a", border: "rgba(11,29,58,0.12)" },
        GOLD: { bg: "#d4af37", fg: "#0b1d3a", border: "rgba(11,29,58,0.18)" },
        SOFT_GOLD: { bg: "#FAF8F0", fg: "#0b1d3a", border: "rgba(11,29,58,0.08)" },
        SOFT_NAVY: { bg: "#EEF2F6", fg: "#0b1d3a", border: "rgba(11,29,58,0.08)" },
    };
    const picked = palette[token] || palette.NAVY;
    return { token, ...picked };
}

export type FooterIconType = "WA" | "LOC" | "LOGO";
export function getFooterIconPath(iconType: FooterIconType, themeElementColor: string): string {
    let colorType: "GOLD" | "NAVY" | "WHITE" = "GOLD";
    const c = themeElementColor.toLowerCase();

    if (c.includes("#ffffff") || c.includes("white") || c.includes("255,255,255")) {
        colorType = "WHITE";
    } else if (c.includes("#0b1d3a") || c.includes("navy") || c.includes("#0f172a")) {
        colorType = "NAVY";
    } else {
        colorType = "GOLD";
    }

    // Assuming /uploads/ path for WA/LOC based on preview logic
    switch (iconType) {
        case "WA": return `/uploads/WA_${colorType === "WHITE" ? "white" : colorType === "NAVY" ? "navy" : "gold"}.png`;
        case "LOC": return `/uploads/icon-${colorType === "WHITE" ? "white" : colorType === "NAVY" ? "navy" : "yellow"}.png`;
        case "LOGO": return `/logo/logo_apixinterior_${colorType === "WHITE" ? "putih" : colorType === "NAVY" ? "biru" : "golden"}.png.png`;
    }
}

export type ThemeToken = "NAVY" | "GOLD" | "WHITE";
export function colorForToken(t: ThemeToken): string {
    if (t === "NAVY") return "rgba(11, 29, 58, 0.96)";
    if (t === "GOLD") return "rgba(212, 175, 55, 0.96)";
    return "rgba(255, 255, 255, 0.98)";
}

export function parseThemePair(themeKey: string): { a: ThemeToken; b: ThemeToken } {
    const k = String(themeKey || "").trim().toUpperCase();
    const parts = k.split("_");
    const a = (parts[0] as ThemeToken) || "NAVY";
    const b = (parts[1] as ThemeToken) || "GOLD";
    const safe = (x: any, fb: ThemeToken) => (x === "NAVY" || x === "GOLD" || x === "WHITE" ? x : fb);
    return { a: safe(a, "NAVY"), b: safe(b, "GOLD") };
}

export function categoryGridVarsFromTheme(resolvedTheme: string) {
    const NAVY = "#0b1d3a";
    const GOLD = "#d4af37";
    const WHITE = "#ffffff";
    switch (resolvedTheme) {
        case "NAVY_GOLD": return { cardBg: NAVY, insideText: GOLD, outsideText: NAVY, border: "rgba(255,255,255,0.22)" };
        case "WHITE_GOLD": return { cardBg: WHITE, insideText: GOLD, outsideText: GOLD, border: "rgba(11,29,58,0.18)" };
        case "NAVY_WHITE": return { cardBg: NAVY, insideText: WHITE, outsideText: NAVY, border: "rgba(255,255,255,0.22)" };
        case "GOLD_NAVY": return { cardBg: GOLD, insideText: NAVY, outsideText: GOLD, border: "rgba(11,29,58,0.20)" };
        case "GOLD_WHITE": return { cardBg: GOLD, insideText: WHITE, outsideText: GOLD, border: "rgba(255,255,255,0.22)" };
        case "WHITE_NAVY": return { cardBg: WHITE, insideText: NAVY, outsideText: NAVY, border: "rgba(11,29,58,0.18)" };
        default: return { cardBg: WHITE, insideText: NAVY, outsideText: NAVY, border: "rgba(11,29,58,0.18)" };
    }
}

export function getThemeKeyFromConfig(cfg: any): string {
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg) && typeof cfg.__themeKey === "string") {
        const v = String(cfg.__themeKey).trim();
        return v ? normalizeThemeKey(v) : "theme_1";
    }
    return "theme_1";
}

export function normalizeConfig(sectionType: string, raw: any): JsonObject {
    const cfg = isObject(raw) ? raw : {};

    if (sectionType === "HERO") {
        const hc = isObject((cfg as any).heroContent) ? (cfg as any).heroContent : {};

        const headline = typeof (cfg as any).headline === "string" ? (cfg as any).headline : "";
        const subheadline = typeof (cfg as any).subheadline === "string" ? (cfg as any).subheadline : "";
        const ctaLabel = typeof (cfg as any).ctaLabel === "string" ? (cfg as any).ctaLabel : "";
        const ctaHref = typeof (cfg as any).ctaHref === "string" ? (cfg as any).ctaHref : "";
        const eyebrow =
            typeof (cfg as any).eyebrow === "string"
                ? (cfg as any).eyebrow
                : typeof (hc as any).eyebrow === "string"
                    ? (hc as any).eyebrow
                    : "";

        const badgesSource = Array.isArray((cfg as any).badges)
            ? (cfg as any).badges
            : Array.isArray((hc as any).badges)
                ? (hc as any).badges
                : [];
        const badges = badgesSource.map((v: any) => String(v ?? "").trim()).filter(Boolean).slice(0, 8);

        const highlightsSource = Array.isArray((cfg as any).highlights)
            ? (cfg as any).highlights
            : Array.isArray((hc as any).highlights)
                ? (hc as any).highlights
                : [];
        const highlights = highlightsSource.map((v: any) => String(v ?? "").trim()).filter(Boolean).slice(0, 8);

        const trustSource = Array.isArray((cfg as any).trustChips)
            ? (cfg as any).trustChips
            : Array.isArray((hc as any).trustChips)
                ? (hc as any).trustChips
                : [];
        const trustChips = trustSource.map((v: any) => String(v ?? "").trim()).filter(Boolean).slice(0, 8);

        const miniSource = Array.isArray((hc as any).miniInfo)
            ? (hc as any).miniInfo
            : Array.isArray((cfg as any).miniInfo)
                ? (cfg as any).miniInfo
                : [];
        const miniInfo = miniSource
            .map((m: any) => ({
                title: String(m?.title ?? "").trim(),
                desc: String(m?.desc ?? "").trim(),
            }))
            .filter((m: any) => m.title || m.desc)
            .slice(0, 3);

        const floatLookbookTitle = String((hc as any).floatLookbookTitle ?? (cfg as any).floatLookbookTitle ?? "").trim();
        const floatLookbookSubtitle = String((hc as any).floatLookbookSubtitle ?? (cfg as any).floatLookbookSubtitle ?? "").trim();
        const floatPromoTitle = String((hc as any).floatPromoTitle ?? (cfg as any).floatPromoTitle ?? "").trim();
        const floatPromoText = String((hc as any).floatPromoText ?? (cfg as any).floatPromoText ?? "").trim();

        const heroTheme = parseSectionTheme((cfg as any).sectionTheme ?? (cfg as any).heroTheme ?? null) ?? "FOLLOW_NAVBAR";

        const imageIdNum = Number((cfg as any).imageId);
        const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;

        const out: any = {
            headline,
            subheadline,
            ctaLabel,
            ctaHref,
            ...(eyebrow ? { eyebrow } : {}),
            ...(badges.length ? { badges } : {}),
            ...(highlights.length ? { highlights } : {}),
            ...(trustChips.length ? { trustChips } : {}),
            ...(miniInfo.length ? { miniInfo } : {}),
            ...(floatLookbookTitle ? { floatLookbookTitle } : {}),
            ...(floatLookbookSubtitle ? { floatLookbookSubtitle } : {}),
            ...(floatPromoTitle ? { floatPromoTitle } : {}),
            ...(floatPromoText ? { floatPromoText } : {}),
            ...(heroTheme ? { sectionTheme: heroTheme, heroTheme } : {}),
            ...(imageId ? { imageId } : {}),
            __themeKey: getThemeKeyFromConfig(cfg),
        };

        if (Object.keys(hc).length) out.heroContent = hc;

        return out;
    }

    if (sectionType === "TEXT_SECTION") {
        const text = typeof (cfg as any).text === "string" ? String((cfg as any).text) : "";
        const modeRaw = String((cfg as any).mode ?? "body").toLowerCase();
        const mode =
            modeRaw === "heading" || modeRaw === "subtitle" || modeRaw === "caption" ? modeRaw : "body";
        const alignRaw = String((cfg as any).align ?? "left").toLowerCase();
        const align = alignRaw === "center" ? "center" : "left";
        const widthRaw = String((cfg as any).width ?? "normal").toLowerCase();
        const width = widthRaw === "wide" ? "wide" : "normal";
        const sectionTheme = String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR");
        const blocks = Array.isArray((cfg as any).blocks)
            ? (cfg as any).blocks
                .map((b: any) => ({
                    mode: String(b?.mode ?? "body").toLowerCase(),
                    text: String(b?.text ?? "").trim(),
                }))
                .filter((b: any) => b.text.length > 0)
            : [];

        return {
            text,
            mode,
            align,
            width,
            sectionTheme,
            blocks,
            __themeKey: getThemeKeyFromConfig(cfg),
        };
    }

    if (sectionType === "PRODUCT_LISTING") {
        const sectionTheme = String((cfg as any).sectionTheme ?? "FOLLOW_NAVBAR");
        const productIds = Array.isArray((cfg as any).productIds)
            ? (cfg as any).productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n))
            : [];

        return {
            sectionTheme,
            sectionBgTheme: parseCustomPromoBgTheme((cfg as any).sectionBgTheme ?? null),
            productIds,
            __themeKey: getThemeKeyFromConfig(cfg),
        };
    }

    if (sectionType === "CATEGORY_GRID") {
        const itemsNew: CategoryGridItem[] = Array.isArray((cfg as any).items)
            ? (cfg as any).items
                .map((it: any) => ({
                    kategoriId: Number(it?.kategoriId),
                    coverImageId:
                        it?.coverImageId === null || it?.coverImageId === undefined || it?.coverImageId === ""
                            ? null
                            : Number(it.coverImageId),
                }))
                .filter((it: any) => Number.isFinite(it.kategoriId))
            : [];

        const layoutObj = isObject((cfg as any).layout) ? (cfg as any).layout : {};
        const columnsRaw = Number((layoutObj as any).columns ?? 3);
        const columns = Math.min(6, Math.max(2, Number.isNaN(columnsRaw) ? 3 : columnsRaw));

        const maxItems =
            (layoutObj as any).maxItems === undefined || (layoutObj as any).maxItems === null
                ? undefined
                : Math.max(1, Number((layoutObj as any).maxItems));

        const rawTheme =
            typeof (cfg as any).sectionTheme === "string"
                ? String((cfg as any).sectionTheme).trim()
                : typeof (cfg as any).gridTheme === "string"
                    ? String((cfg as any).gridTheme).trim()
                    : typeof (cfg as any).categoryGridTheme === "string"
                        ? String((cfg as any).categoryGridTheme).trim()
                        : typeof (cfg as any).categoryTheme === "string"
                            ? String((cfg as any).categoryTheme).trim()
                            : typeof (cfg as any).theme === "string"
                                ? String((cfg as any).theme).trim()
                                : typeof (cfg as any).colorTheme === "string"
                                    ? String((cfg as any).colorTheme).trim()
                                    : typeof (cfg as any).temaWarna === "string"
                                        ? String((cfg as any).temaWarna).trim()
                                        : typeof (cfg as any).warnaTema === "string"
                                            ? String((cfg as any).warnaTema).trim()
                                            : typeof (cfg as any).temaWarnaSection === "string"
                                                ? String((cfg as any).temaWarnaSection).trim()
                                                : typeof (cfg as any).heroTheme === "string"
                                                    ? String((cfg as any).heroTheme).trim()
                                                    : "";

        const sectionTheme = parseSectionTheme(rawTheme);

        const titleTextColorRaw =
            typeof (cfg as any).titleTextColor === "string" ? String((cfg as any).titleTextColor).trim() : "";
        const titleTextColor =
            titleTextColorRaw === "NAVY" || titleTextColorRaw === "GOLD" || titleTextColorRaw === "WHITE"
                ? titleTextColorRaw
                : null;


        return {
            items: itemsNew,
            layout: { columns, ...(maxItems ? { maxItems } : {}) },
            __themeKey: getThemeKeyFromConfig(cfg),
            sectionTheme,
            sectionBgTheme: parseCustomPromoBgTheme((cfg as any).sectionBgTheme),
            titleTextColor,
        };
    }

    if (sectionType === "CATEGORY_GRID_COMMERCE") {
        const items: CategoryCommerceItem[] = Array.isArray((cfg as any).items)
            ? (cfg as any).items
                .map((it: any) => {
                    const type = String(it?.type ?? "category") === "custom" ? "custom" : "category";
                    if (type === "custom") return { type, label: String(it?.label ?? ""), href: String(it?.href ?? ""), imageUrl: String(it?.imageUrl ?? ""), tabId: String(it?.tabId ?? "") };
                    return { type, kategoriId: Number(it?.kategoriId), slug: String(it?.slug ?? ""), label: String(it?.label ?? ""), imageId: it?.imageId ? Number(it.imageId) : null, tabId: String(it?.tabId ?? "") };
                })
                .filter((it: any) => it.type === "custom" || Number.isFinite(it.kategoriId))
            : [];

        const layoutObj = isObject((cfg as any).layout) ? (cfg as any).layout : {};
        const columnsRaw = Number((layoutObj as any).columns ?? 4);
        const columns = Math.min(6, Math.max(2, Number.isNaN(columnsRaw) ? 4 : columnsRaw));
        const maxItems =
            (layoutObj as any).maxItems === undefined || (layoutObj as any).maxItems === null
                ? 16
                : Math.max(1, Number((layoutObj as any).maxItems));
        const modeRaw = String((layoutObj as any).mode ?? (cfg as any).mode ?? "clean").toLowerCase();
        const mode = modeRaw === "reverse" ? "reverse" : modeRaw === "commerce" ? "commerce" : "clean";
        const tabs = Array.isArray((cfg as any).tabs) ? (cfg as any).tabs : [];
        const sectionThemeRaw = typeof (cfg as any).sectionTheme === "string" ? String((cfg as any).sectionTheme).trim() : "FOLLOW_NAVBAR";
        return {
            items,
            layout: { columns, maxItems, mode },
            tabs,
            sectionTheme: sectionThemeRaw || "FOLLOW_NAVBAR",
            sectionBgTheme: parseCustomPromoBgTheme((cfg as any).sectionBgTheme),
            __themeKey: getThemeKeyFromConfig(cfg)
        };
    }

    if (sectionType === "PRODUCT_CAROUSEL") {
        const description = typeof (cfg as any).description === "string" ? (cfg as any).description : "";
        const showPrice = (cfg as any).showPrice === undefined ? true : Boolean((cfg as any).showPrice);
        const showCta = (cfg as any).showCta === undefined ? true : Boolean((cfg as any).showCta);
        const productIds = Array.isArray((cfg as any).productIds) ? (cfg as any).productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n)) : [];
        return { description, showPrice, showCta, productIds, sectionTheme: parseSectionTheme((cfg as any).sectionTheme ?? null), sectionBgTheme: parseCustomPromoBgTheme((cfg as any).sectionBgTheme ?? null), __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "HIGHLIGHT_COLLECTION") {
        const headline = typeof (cfg as any).headline === "string" ? String((cfg as any).headline) : typeof (cfg as any).title === "string" ? String((cfg as any).title) : "";
        const description = typeof (cfg as any).description === "string" ? String((cfg as any).description) : typeof (cfg as any).subtitle === "string" ? String((cfg as any).subtitle) : "";
        const layoutRaw = String((cfg as any).layout ?? "FEATURED_LEFT");
        const layout = ["FEATURED_LEFT", "FEATURED_TOP", "GRID", "CARDS"].includes(layoutRaw) ? layoutRaw : "FEATURED_LEFT";
        const ctaText = typeof (cfg as any).ctaText === "string" ? String((cfg as any).ctaText).trim() : "";
        const ctaHref = typeof (cfg as any).ctaHref === "string" ? String((cfg as any).ctaHref).trim() : "";
        const heroImageIdNum = Number((cfg as any).heroImageId);
        const heroImageId = Number.isFinite(heroImageIdNum) && heroImageIdNum > 0 ? heroImageIdNum : null;
        const productIds = Array.isArray((cfg as any).productIds) ? (cfg as any).productIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n)) : [];
        const sectionThemeRaw = typeof (cfg as any).sectionTheme === "string" ? String((cfg as any).sectionTheme).trim() : "FOLLOW_NAVBAR";
        const sectionTheme = sectionThemeRaw === "FOLLOW_NAVBAR" ? null : parseSectionTheme(sectionThemeRaw);
        return { headline, description, badgeText: "", layout, heroImageId, productIds, ctaText, ctaHref, sectionTheme, __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "BRANCHES") {
        const layoutRaw = String((cfg as any).layout ?? "carousel").toLowerCase();
        const layout = layoutRaw === "grid" ? "grid" : "carousel";
        const branchIds = Array.isArray((cfg as any).branchIds) ? (cfg as any).branchIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n) && n > 0) : [];
        return {
            layout,
            branchIds,
            sectionTheme: parseSectionTheme((cfg as any).sectionTheme ?? null),
            sectionBgTheme: parseCustomPromoBgTheme((cfg as any).sectionBgTheme ?? null),
            __themeKey: getThemeKeyFromConfig(cfg)
        };
    }

    // SOCIAL, CONTACT, CUSTOM_PROMO, ROOM_CATEGORY, FOOTER
    // (Simplified for brevity as structure is standard)
    if (sectionType === "SOCIAL") {
        const selected = Array.isArray((cfg as any).selected) ? (cfg as any).selected : Array.isArray((cfg as any).items) ? (cfg as any).items : Array.isArray((cfg as any).iconKeys) ? (cfg as any).iconKeys : [];
        const iconKeys = selected.map((v: any) => (typeof v === "string" ? v : v?.iconKey ?? v?.key ?? "")).map((v: any) => String(v ?? "").trim()).filter(Boolean).slice(0, 24);
        const displayObj = isObject((cfg as any).display) ? (cfg as any).display : {};
        const iconsOnly = (displayObj as any).iconsOnly === undefined ? Boolean((cfg as any).iconsOnly ?? true) : Boolean((displayObj as any).iconsOnly);
        return { iconKeys, display: { ...(displayObj as any), iconsOnly }, sectionTheme: parseSectionTheme((cfg as any).sectionTheme ?? null), __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "CONTACT") {
        const hubungiIds = Array.isArray((cfg as any).hubungiIds) ? (cfg as any).hubungiIds.map((v: any) => Number(v)).filter((n: any) => Number.isFinite(n)) : [];
        const showImage = Boolean((cfg as any).showImage);
        const imageIdNum = Number((cfg as any).imageId);
        const imageId = Number.isFinite(imageIdNum) && imageIdNum > 0 ? imageIdNum : null;
        return { ...cfg, mode: "SPLIT_IMAGE_STACK", showImage, imageId, hubungiIds, __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "CUSTOM_PROMO") {
        const layoutRaw = String((cfg as any).layout ?? "carousel").toLowerCase();
        const layout = layoutRaw === "grid" ? "grid" : layoutRaw === "hero" ? "hero" : "carousel";
        const voucherIdsRaw = Array.isArray((cfg as any).voucherImageIds) ? (cfg as any).voucherImageIds : [];
        const voucherImageIds = Array.from(new Set(voucherIdsRaw.map((v: any) => Number(v)).filter((v: number) => Number.isFinite(v) && v > 0))).slice(0, MAX_CUSTOM_PROMO_VOUCHERS);
        const sectionBgTheme = parseCustomPromoBgTheme((cfg as any).sectionBgTheme ?? (cfg as any).sectionTheme ?? null);
        const voucherLinks = (cfg as any)?.voucherLinks && typeof (cfg as any).voucherLinks === "object" ? (cfg as any).voucherLinks : null;
        return { layout, voucherImageIds, sectionBgTheme, ...(voucherLinks ? { voucherLinks } : {}), __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "ROOM_CATEGORY") {
        const cardsRaw = Array.isArray((cfg as any).cards) ? (cfg as any).cards : [];
        const cards = cardsRaw.map((c: any, idx: number) => {
            const key = String(c?.key ?? "").trim() || `card_${idx + 1}`;
            const title = typeof c?.title === "string" ? c.title : "";
            const description = typeof c?.description === "string" ? c.description : "";
            const kategoriId = Number(c?.kategoriId);
            const imageId = Number(c?.imageId);
            const badge = typeof c?.badge === "string" ? c.badge.trim() : null;
            const cropY = Number(c?.cropY);
            const zoom = Number(c?.zoom);
            return { key, title, description, badge, kategoriId: Number.isFinite(kategoriId) ? kategoriId : null, imageId: Number.isFinite(imageId) ? imageId : null, cropY: Number.isFinite(cropY) ? Math.max(0, Math.min(100, cropY)) : 50, zoom: Number.isFinite(zoom) ? Math.max(1, Math.min(3, zoom)) : 1 };
        }).slice(0, 30);
        return { ...(cfg as any), cards, __themeKey: getThemeKeyFromConfig(cfg) };
    }

    if (sectionType === "FOOTER") {
        const useGlobalContact = (cfg as any).useGlobalContact === true || (cfg as any).useGlobalContact === "1" || String((cfg as any).useGlobalContact) === "true";
        return { ...(cfg as any), useGlobalContact, __themeKey: getThemeKeyFromConfig(cfg) };
    }

    return { ...(cfg as any), __themeKey: getThemeKeyFromConfig(cfg) };
}

export function pickFirstGalleryImageId(raw: any): number | null {
    if (!raw) return null;
    if (typeof raw === "number") return Number.isFinite(raw) && raw > 0 ? raw : null;
    const s = String(raw).trim();
    try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length) {
            const n = Number(parsed[0]);
            return Number.isFinite(n) && n > 0 ? n : null;
        }
    } catch { }
    const m = s.match(/\d+/);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) && n > 0 ? n : null;
}

export function formatRupiah(n: any) {
    if (typeof n !== "number") return "";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function computeHargaSetelahPromo(p: any) {
    const hargaAsli = Math.round(Number(p?.harga ?? 0) || 0);
    const aktif = !!p?.promoAktif;
    const tipe = (p?.promoTipe ?? null) as "persen" | "nominal" | null;
    const valueRaw = Math.round(Number(p?.promoValue ?? 0) || 0);

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
    const promoLabel = tipe === "persen" ? `-${Math.max(0, Math.min(100, valueRaw))}%` : `-Rp ${diskon.toLocaleString("id-ID")}`;
    return { hargaAsli, hargaFinal, isPromo: true, promoLabel };
}

export function normalizeExternalUrl(raw: any): string {
    const s = String(raw ?? "").trim();
    if (!s) return "#";
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("//")) return `https:${s}`;
    if (/^(wa:|tel:|mailto:)/i.test(s)) return s;
    return `https://${s.replace(/^\/+/, "")}`;
}

export function resolveGoogleMapsEmbed(mapsUrl: string, name: string): string {
    if (!mapsUrl) return "";
    if (mapsUrl.includes("<iframe")) {
        const match = mapsUrl.match(/src=["']([^"']+)["']/i);
        if (match && match[1]) return match[1];
    }
    try {
        const u = new URL(mapsUrl);
        const host = u.host.toLowerCase();
        const isGoogle = host.includes("google.") || host.includes("maps.");
        const isEmbedPath = u.pathname.includes("/maps/embed");
        const pb = u.searchParams.get("pb");
        const output = u.searchParams.get("output");

        if (isEmbedPath && pb && pb.length > 20) return mapsUrl;
        if (isEmbedPath && output === "embed") return mapsUrl;
        if (output === "embed") return mapsUrl;

        if (isGoogle) {
            const q = u.searchParams.get("q") || u.searchParams.get("query") || u.searchParams.get("search") || "";
            const query = q || name;
            if (!query) return "";
            return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
        }
    } catch { }
    return "";
}

export function heroThemeClassFromConfig(heroThemeRaw: string, navbarThemeRaw: string) {
    const heroTheme = normalizeThemeAttr(heroThemeRaw || "FOLLOW_NAVBAR");
    const navbarTheme = normalizeThemeAttr(navbarThemeRaw || "NAVY_GOLD") || "NAVY_GOLD";
    const resolved = heroTheme === "FOLLOW_NAVBAR" || !heroTheme ? navbarTheme : heroTheme;

    switch (resolved) {
        case "WHITE_GOLD":
        case "theme_2":
            return styles.heroThemeWhiteGold;
        case "NAVY_WHITE":
        case "theme_3":
            return styles.heroThemeNavyWhite;
        case "WHITE_NAVY":
        case "WHITE":
        case "LIGHT":
        case "theme_6":
            return styles.heroThemeWhiteNavy;
        case "GOLD_NAVY":
        case "GOLD":
        case "theme_4":
            return styles.heroThemeGoldNavy;
        case "GOLD_WHITE":
        case "theme_5":
            return styles.heroThemeGoldWhite;
        case "NAVY_GOLD":
        case "NAVY":
        case "DARK":
        case "theme_1":
        default:
            return styles.heroThemeNavyGold;
    }
}

// React Components removed (switched to @/app/components/homepage/social-icons)


type CategoryGridPreviewItemUI = {
    categoryId: number;
    title: string;
    href: string;
    imageUrl?: string | null;
    subtitle?: string | null;
};

export function buildCategoryGridProps(args: {
    sectionTitle?: string | null;
    columns: number;
    maxItems?: number;
    items: CategoryGridItem[];
    kategoriMap: Map<number, any>;
    imageMap: Map<number, any>;
    autoCoverUrlByKategori: Map<number, string>;
}) {
    const cols = Math.min(6, Math.max(2, Number(args.columns || 3)));
    const maxItems = args.maxItems ? Math.max(1, Number(args.maxItems)) : undefined;

    const uiItems: CategoryGridPreviewItemUI[] = args.items.map((it) => {
        const k = args.kategoriMap.get(Number(it.kategoriId));
        const title = String(k?.nama ?? "Kategori");
        const href = k?.slug ? `/kategori/${k.slug}` : "#";
        const coverUrl = it.coverImageId && Number.isFinite(it.coverImageId)
            ? args.imageMap.get(Number(it.coverImageId))?.url ?? null
            : args.autoCoverUrlByKategori.get(Number(it.kategoriId)) ?? null;
        return { categoryId: Number(it.kategoriId), title, href, imageUrl: coverUrl, subtitle: null };
    });

    return { title: args.sectionTitle ?? "", columns: cols, items: maxItems ? uiItems.slice(0, maxItems) : uiItems };
}

export function buildCategoryCommerceGridProps(args: {
    sectionTitle?: string | null;
    maxItems?: number;
    mode?: "clean" | "commerce" | "reverse";
    tabs?: Array<{ id: string; label: string }>;
    items: CategoryCommerceItem[];
    kategoriMap: Map<number, any>;
    imageMap: Map<number, any>;
    autoCoverUrlByKategori?: Map<number, string>;
    fallbackUrl: string;
}) {
    const maxItems = args.maxItems ? Math.max(1, Number(args.maxItems)) : undefined;
    const uiItems = args.items.map((it, idx) => {
        if (it.type === "custom") {
            return {
                id: Number(it.kategoriId ?? idx),
                categoryId: Number(it.kategoriId ?? idx),
                name: String(it.label ?? "Item"),
                href: String(it.href ?? "#"),
                imageUrl: it.imageId && Number.isFinite(it.imageId as number) ? args.imageMap.get(Number(it.imageId))?.url ?? null : String(it.imageUrl ?? "") || args.fallbackUrl,
                tabId: String(it.tabId ?? ""),
            };
        }
        const k = args.kategoriMap.get(Number(it.kategoriId));
        const labelOverride = String(it.label ?? "").trim();
        const title = labelOverride || String(k?.nama ?? "Kategori");
        const slug = String(k?.slug ?? it.slug ?? "").trim();
        const href = slug ? `/kategori/${slug}` : "#";

        let imageUrl = args.fallbackUrl;
        if (it.imageId && Number.isFinite(it.imageId as number)) {
            imageUrl = args.imageMap.get(Number(it.imageId))?.url ?? args.fallbackUrl;
        } else if (args.autoCoverUrlByKategori) {
            imageUrl = args.autoCoverUrlByKategori.get(Number(it.kategoriId)) ?? args.fallbackUrl;
        }

        return { id: Number(it.kategoriId), categoryId: Number(it.kategoriId), name: title, href, imageUrl, tabId: String(it.tabId ?? "") };
    });

    return { title: args.sectionTitle ?? "", items: maxItems ? uiItems.slice(0, maxItems) : uiItems, mode: args.mode ?? "clean", tabs: Array.isArray(args.tabs) ? args.tabs : [] };
}
