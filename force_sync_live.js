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
    console.log('=== FORCING SYNC: DRAFTS -> PUBLISHED ===');

    // 1. Get Clean Drafts for theme_1
    // We explicitly fetch only VALID drafts (no ghosts)
    const allDrafts = await prisma.homepageSectionDraft.findMany({
        orderBy: { sortOrder: 'asc' }
    });

    const validDrafts = allDrafts.filter(d => {
        // 1. Must not be system row
        if (d.slug === '__active_theme__' || d.slug?.startsWith('__theme_meta__')) return false;

        // 2. Must be for theme_1
        const key = getThemeKeyFromConfig(d.config);
        if (key !== 'theme_1') return false;

        // 3. Must be enabled (usually published = enabled only, but let's copy whatever standard logic is)
        // Actually standard publish logic usually copies ENABLED only, OR maybe all? 
        // Checking admin logic: `.filter(d => d.enabled === true)` in preview, but publish logic?
        // Usually only enabled sections go to live.
        if (!d.enabled) return false;

        // 4. Must have title (No Ghost)
        const title = String(d.title || "").trim();
        if (title === "") return false;

        return true;
    });

    console.log(`Found ${validDrafts.length} valid drafts to publish.`);

    // 2. Wipe Published Table
    console.log('Wiping Published Table...');
    await prisma.homepageSectionPublished.deleteMany({});

    // 3. Insert into Published
    if (validDrafts.length > 0) {
        console.log('Inserting valid drafts...');
        await prisma.homepageSectionPublished.createMany({
            data: validDrafts.map(d => ({
                type: d.type,
                title: d.title,
                slug: d.slug,
                enabled: d.enabled,
                sortOrder: d.sortOrder,
                config: d.config ?? {},
                // Map legacy fields just in case model requires them (though usually optional/null)
                heroHeadline: d.heroHeadline || null,
                heroSubheadline: d.heroSubheadline || null,
                heroCtaLabel: d.heroCtaLabel || null,
                heroCtaHref: d.heroCtaHref || null,
                heroContent: d.heroContent || null
            }))
        });
    }

    // 4. Reset Active Theme Marker
    console.log('Resetting Active Theme Marker...');
    await prisma.homepageSectionDraft.deleteMany({ where: { slug: "__active_theme__" } });
    await prisma.homepageSectionDraft.create({
        data: {
            type: "HERO", // Dummy type
            title: "Active Theme Marker",
            slug: "__active_theme__",
            enabled: true,
            sortOrder: -1000,
            config: { __isActiveTheme: true, activeThemeKey: "theme_1" }
        }
    });

    console.log('Sync Complete. Live site should now mirror theme_1 drafts exactly.');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
