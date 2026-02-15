import { prisma } from "@/lib/prisma";

function parseBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "yes", "ya", "on"].includes(normalized)) return true;
        if (["false", "0", "no", "tidak", "off", ""].includes(normalized)) return false;
    }
    return fallback;
}

function normalizeThemeKey(value: unknown): string {
    const raw = String(value ?? "").trim();
    const normalized = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return normalized || "theme_1";
}

export async function getGlobalShowPrice(): Promise<boolean> {
    // Match homepage live behavior: use active theme key and published sections.
    const activeThemeMeta = await prisma.homepageSectionDraft.findFirst({
        where: { slug: "__active_theme__" as any },
        orderBy: { id: "desc" },
        select: { config: true },
    });
    const activeThemeConfig = (activeThemeMeta?.config as any) ?? {};
    const activeTheme = normalizeThemeKey(
        activeThemeConfig.activeThemeKey ?? activeThemeConfig.activeTheme ?? "theme_1"
    );

    const publishedRows = await prisma.homepageSectionPublished.findMany({
        where: {
            type: "PRODUCT_LISTING",
            enabled: true,
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { config: true },
    });

    const matchingByTheme = publishedRows.find((row: any) => {
        const cfg = row?.config;
        if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) return false;
        return normalizeThemeKey((cfg as any).__themeKey ?? "theme_1") === activeTheme;
    });

    // IMPORTANT:
    // Global visibility follows active homepage theme only.
    // Do not fallback to another theme's PRODUCT_LISTING config.
    const picked = matchingByTheme ?? null;
    const pickedConfig = picked?.config;
    if (pickedConfig && typeof pickedConfig === "object" && !Array.isArray(pickedConfig)) {
        return parseBoolean((pickedConfig as Record<string, unknown>).showPrice, false);
    }

    // Fallback for old data model.
    const legacy = await prisma.homepageSection.findFirst({
        where: { type: "PRODUCT_LISTING", enabled: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: { config: true },
    });
    const legacyConfig = legacy?.config;
    if (legacyConfig && typeof legacyConfig === "object" && !Array.isArray(legacyConfig)) {
        return parseBoolean((legacyConfig as Record<string, unknown>).showPrice, false);
    }

    return false;
}
