const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_THEME_KEY = "theme_1";
const THEME_META_SLUG_PREFIX = "__theme_meta__";

function normalizeThemeKey(v) {
    const raw = String(v ?? "").trim();
    const s = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return s || DEFAULT_THEME_KEY;
}

function isThemeMetaRow(row) {
    const slug = String(row?.slug ?? "");
    const cfg = row?.config || {};
    return slug.startsWith(THEME_META_SLUG_PREFIX) || slug === "__active_theme__" || cfg?.__isThemeMeta === true;
}

function getThemeKeyFromRow(row) {
    const cfg = row?.config || {};
    // Emulate Admin Page Logic
    if (cfg?.__themeKey) return normalizeThemeKey(cfg.__themeKey);
    return DEFAULT_THEME_KEY;
}

function getThemeKeyFromConfig(cfg) {
    // Emulate Preview Page Logic
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg) && typeof cfg.__themeKey === "string") {
        const v = String(cfg.__themeKey).trim();
        return v ? normalizeThemeKey(v) : DEFAULT_THEME_KEY;
    }
    return DEFAULT_THEME_KEY;
}

async function main() {
    try {
        const drafts = await prisma.homepageSectionDraft.findMany({ orderBy: { sortOrder: 'asc' } });

        // Simulate DraftSectionsForTheme (Admin Page)
        const adminList = drafts.filter(d => !isThemeMetaRow(d)).filter(d => getThemeKeyFromRow(d) === 'theme_1');

        console.log(`Admin List Count: ${adminList.length}`);

        // Simulate Preview List
        const previewList = drafts
            .filter(d => !isThemeMetaRow(d))
            .filter(d => getThemeKeyFromConfig(d.config) === 'theme_1')
            .filter(d => d.enabled === true);

        console.log(`Preview List Count: ${previewList.length}`);

        // Find difference
        const adminIds = new Set(adminList.map(d => d.id));
        const onlyInPreview = previewList.filter(d => !adminIds.has(d.id));

        console.log(`\nFound ${onlyInPreview.length} items in Preview but NOT in Admin:`);
        onlyInPreview.forEach(d => {
            console.log(`[GHOST] ID:${d.id} Type:${d.type} Title:"${d.title}" Config:${JSON.stringify(d.config)}`);
        });

    } catch (e) { console.error(e); } finally { await prisma.$disconnect(); }
}

main();
