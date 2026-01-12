const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_THEME_KEY = "theme_1";

function normalizeThemeKey(v) {
    const raw = String(v ?? "").trim();
    const s = raw.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return s || DEFAULT_THEME_KEY;
}

function getThemeKeyFromConfig(cfg) {
    if (cfg && typeof cfg === "object" && !Array.isArray(cfg) && typeof cfg.__themeKey === "string") {
        const v = String(cfg.__themeKey).trim();
        return v ? normalizeThemeKey(v) : DEFAULT_THEME_KEY;
    }
    return DEFAULT_THEME_KEY;
}

async function main() {
    try {
        const drafts = await prisma.homepageSectionDraft.findMany({
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
        });

        console.log(`Checking ${drafts.length} drafts...`);

        for (const d of drafts) {
            if (d.slug === '__active_theme__' || (d.slug && d.slug.startsWith('__theme_meta__'))) continue;

            const cfg = d.config || {};
            const key = getThemeKeyFromConfig(cfg);

            if (key === 'theme_1') {
                const isImplicit = !cfg.__themeKey;
                if (isImplicit) {
                    console.log(`[IMPLICIT_THEME_1] ID:${d.id} Type:${d.type} Enabled:${d.enabled} Slug:${d.slug}`);
                } else {
                    console.log(`[EXPLICIT_THEME_1] ID:${d.id} Type:${d.type} Enabled:${d.enabled}`);
                }
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
