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
    console.log('=== CHECKING LIVE HOMEPAGE SECTIONS ===');

    // 1. Get Active Theme
    const activeMeta = await prisma.homepageSectionDraft.findFirst({
        where: { slug: '__active_theme__' }
    });

    const activeTheme = activeMeta ? (activeMeta.config?.__activeTheme || 'theme_1') : 'theme_1';
    console.log(`ACTIVE THEME: ${activeTheme}`);

    // 2. Get Published Sections (since user link is localhost:3000/ which uses Published table)
    const published = await prisma.homepageSectionPublished.findMany({
        orderBy: { sortOrder: 'asc' }
    });

    console.log(`\nFound ${published.length} PUBLISHED sections:`);
    published.forEach(p => {
        console.log(`[${p.type}] ID:${p.id} Title:"${p.title}" Enabled:${p.enabled}`);
    });

    // 3. Get Draft Sections for comparison
    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: { sortOrder: 'asc' }
    });

    const themeDrafts = drafts.filter(d => {
        if (d.slug?.startsWith('__')) return false;
        const key = getThemeKeyFromConfig(d.config) || 'theme_1';
        return key === activeTheme;
    });

    console.log(`\nFound ${themeDrafts.length} DRAFT sections for ${activeTheme}:`);
    themeDrafts.forEach(d => {
        console.log(`[${d.type}] ID:${d.id} Title:"${d.title}" Enabled:${d.enabled}`);
    });

}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
