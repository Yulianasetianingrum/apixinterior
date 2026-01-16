import { normalizeThemeKey, getThemeKeyFromConfig } from "@/app/page.helpers";

export const THEME_META_SLUG_PREFIX = "__theme_meta_";
export const DEFAULT_THEME_KEY = "theme_1";

export function themeMetaSlug(key: string) {
    return `${THEME_META_SLUG_PREFIX}${normalizeThemeKey(key)}`;
}

export function isThemeMetaRow(row: any) {
    return String(row?.slug || "").startsWith(THEME_META_SLUG_PREFIX);
}

export { normalizeThemeKey, getThemeKeyFromConfig };
