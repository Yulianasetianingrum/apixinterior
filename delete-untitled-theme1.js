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
    console.log('Scanning for untitled theme_1 sections to delete...');

    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    const toDelete = [];

    for (const d of drafts) {
        // Skip system rows
        if (d.slug === '__active_theme__' || (d.slug && d.slug.startsWith('__theme_meta__'))) continue;

        const cfg = d.config || {};
        const key = getThemeKeyFromConfig(cfg);

        // Target theme_1 sections
        if (key === 'theme_1') {
            const hasTitle = d.title && d.title.trim().length > 0;

            // If it has NO title, we assume it's junk/ghost
            if (!hasTitle) {
                console.log(`[TARGET DELETE] ID:${d.id} Type:${d.type} Enabled:${d.enabled} (Untitled)`);
                toDelete.push(d.id);
            } else {
                console.log(`[KEEP] ID:${d.id} Type:${d.type} Title:"${d.title}"`);
            }
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} sections...`);
        await prisma.homepageSectionDraft.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log("Deleted.");
    } else {
        console.log("No untitled theme_1 sections found.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
