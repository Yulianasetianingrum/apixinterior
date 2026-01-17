
// lib/theme-utils.ts

export const ALLOWED_THEME_COMBOS = new Set([
    "theme_1", "theme_2", "theme_3", "theme_4", "theme_5", "theme_6",
    "NAVY_GOLD", "WHITE_GOLD", "NAVY_WHITE", "GOLD_NAVY", "GOLD_WHITE", "WHITE_NAVY",
]);

export function normalizeThemeAttr(v: any): string {
    const s = String(v ?? "").trim();
    if (!s) return "";
    const m = s.match(/^theme[_-]?(\d+)$/i);
    if (m) return `theme_${Number(m[1])}`;
    return s.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

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
        case "theme_1":
            return { bg: navy, element: gold, card: navy, cardFg: gold, cardBorder: "rgba(255,255,255,0.22)", ctaBg: gold, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: gold, divider: "rgba(255,255,255,0.16)" };
        case "WHITE_GOLD":
        case "theme_2":
            return { bg: white, element: gold, card: white, cardFg: gold, cardBorder: "rgba(11,29,58,0.12)", ctaBg: gold, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: gold, divider: "rgba(2,6,23,0.08)" };
        case "NAVY_WHITE":
        case "theme_3":
            return { bg: navy, element: white, card: navy, cardFg: white, cardBorder: "rgba(255,255,255,0.22)", ctaBg: white, ctaFg: navy, ctaHoverBg: navy, ctaHoverFg: white, divider: "rgba(255,255,255,0.16)" };
        case "GOLD_NAVY":
        case "theme_4":
            return { bg: gold, element: navy, card: gold, cardFg: navy, cardBorder: "rgba(11,29,58,0.20)", ctaBg: navy, ctaFg: white, ctaHoverBg: white, ctaHoverFg: navy, divider: "rgba(11,29,58,0.14)" };
        case "GOLD_WHITE":
        case "theme_5":
            return { bg: gold, element: white, card: gold, cardFg: white, cardBorder: "rgba(255,255,255,0.22)", ctaBg: white, ctaFg: ink, ctaHoverBg: ink, ctaHoverFg: white, divider: "rgba(255,255,255,0.18)" };
        case "WHITE_NAVY":
        case "theme_6":
            return { bg: white, element: navy, card: white, cardFg: navy, cardBorder: "rgba(11,29,58,0.18)", ctaBg: navy, ctaFg: white, ctaHoverBg: white, ctaHoverFg: navy, divider: "rgba(2,6,23,0.08)" };
        default:
            return { bg: white, element: ink, card: "#f6f7fb", cardFg: ink, cardBorder: "rgba(2,6,23,0.10)", ctaBg: ink, ctaFg: white, ctaHoverBg: white, ctaHoverFg: ink, divider: "rgba(255,255,255,0.14)" };
    }
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

    switch (iconType) {
        case "WA":
            const waSuffix = colorType === "WHITE" ? "white" : colorType === "NAVY" ? "navy" : "gold";
            return `/uploads/WA_${waSuffix}.png`;
        case "LOC":
            const locSuffix = colorType === "WHITE" ? "white" : colorType === "NAVY" ? "navy" : "yellow";
            return `/uploads/icon-${locSuffix}.png`;
        case "LOGO":
            const logoSuffix = colorType === "WHITE" ? "putih" : colorType === "NAVY" ? "biru" : "golden";
            return `/uploads/logo_apixinterior_${logoSuffix}.png.png`;
    }
}
