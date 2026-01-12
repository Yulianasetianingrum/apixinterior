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
    console.log('Fetching all draft sections...');
    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    console.log(`Total drafts: ${drafts.length}`);

    console.log('\n--- Sections resolved to "theme_1" ---');
    let count = 0;
    for (const d of drafts) {
        if (d.slug === '__active_theme__' || d.slug?.startsWith('__theme_meta__')) continue;

        const cfg = d.config || {};
        const key = getThemeKeyFromConfig(cfg);

        if (key === 'theme_1') {
            count++;
            const explicit = cfg.__themeKey ? `(Explicit: "${cfg.__themeKey}")` : '(IMPLICIT/DEFAULT)';
            console.log(`[${count}] ID: ${d.id} | Type: ${d.type} | Enabled: ${d.enabled} | Sort: ${d.sortOrder} | ${explicit}`);
            if (!cfg.__themeKey) {
                console.log(`    ⚠️  This section has NO explicit __themeKey, so it defaults to theme_1.`);
                console.log(`    If this was intended for another theme or is a ghost, it will appear in theme_1.`);
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
