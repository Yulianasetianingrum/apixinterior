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
    console.log('=== DEEP INSPECT THEME_1 ===');

    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    console.log(`Total DB Drafts: ${drafts.length}`);

    const theme1Drafts = [];

    for (const d of drafts) {
        // Skip blatant system rows active_theme (but keep theme_meta to see if it leaks)
        if (d.slug === '__active_theme__') continue;

        const cfg = d.config || {};
        const key = getThemeKeyFromConfig(cfg);

        if (key === 'theme_1') {
            const titleRaw = d.title;
            const titleTrimmed = String(d.title || "").trim();
            const configThemeKey = cfg.__themeKey;

            theme1Drafts.push({
                id: d.id,
                type: d.type,
                title: titleRaw,
                titleLen: titleRaw ? titleRaw.length : 0,
                trimmed: titleTrimmed,
                slug: d.slug,
                explicitKey: configThemeKey,
                isEnabled: d.enabled
            });
        }
    }

    console.log(`Found ${theme1Drafts.length} rows for theme_1:`);
    theme1Drafts.forEach((row, idx) => {
        let status = "✅ OK";
        if (!row.trimmed && !row.slug?.startsWith('__theme_meta__')) {
            status = "❌ SUSPECT (Empty Title)";
        }
        if (row.slug?.startsWith('__theme_meta__')) {
            status = "ℹ️ META (Hidden)";
        }

        console.log(`${idx + 1}. [${status}] ID:${row.id} Type:${row.type.padEnd(20)} Title:"${row.title || ''}" (len:${row.titleLen}) ExplicitKey:${row.explicitKey || 'NONE(Implicit)'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
