const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

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
    let output = '=== DEEP INSPECT THEME_1 ===\n';

    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    output += `Total DB Drafts: ${drafts.length}\n`;

    const theme1Drafts = [];

    for (const d of drafts) {
        // Skip blatant system rows but verify them
        if (d.slug === '__active_theme__') continue;

        const cfg = d.config || {};
        const key = getThemeKeyFromConfig(cfg);

        // Check strict theme_1
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

    output += `Found ${theme1Drafts.length} rows for theme_1:\n`;
    theme1Drafts.forEach((row, idx) => {
        let status = "✅ OK";
        if (!row.trimmed && !row.slug?.startsWith('__theme_meta__')) {
            status = "❌ SUSPECT (Empty Title)";
        }
        if (row.slug?.startsWith('__theme_meta__')) {
            status = "ℹ️ META (Hidden)";
        }

        output += `${idx + 1}. [${status}] ID:${row.id} Type:${row.type.padEnd(20)} Title:"${row.title || ''}" (len:${row.titleLen}) ExplicitKey:${row.explicitKey || 'NONE(Implicit)'}\n`;
    });

    fs.writeFileSync('debug_output.txt', output);
    console.log("Done writing to debug_output.txt");
}

main()
    .catch(e => {
        console.error(e);
        fs.writeFileSync('debug_error.txt', String(e));
    })
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
