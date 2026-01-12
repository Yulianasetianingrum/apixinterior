const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup of system rows...');

    // 1. Cleanup __active_theme__ in Draft
    const activeThemes = await prisma.homepageSectionDraft.findMany({
        where: { slug: '__active_theme__' },
        orderBy: { updatedAt: 'desc' }
    });

    if (activeThemes.length > 1) {
        console.log(`Found ${activeThemes.length} __active_theme__ rows in Draft. Keeping the latest one.`);
        const toKeep = activeThemes[0];
        const toDelete = activeThemes.slice(1).map(r => r.id);
        await prisma.homepageSectionDraft.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log(`Deleted ${toDelete.length} Duplicate __active_theme__ rows.`);
    } else {
        console.log('__active_theme__ row in Draft is clean (0 or 1 found).');
    }

    // 2. Cleanup __active_theme__ in Published (Should NOT exist as content, but maybe as artifact?)
    // Actually, publishTheme does NOT copy __active_theme__ to Published.
    // But if it did in the past, let's remove it.
    const badPublished = await prisma.homepageSectionPublished.findMany({
        where: { slug: '__active_theme__' }
    });
    if (badPublished.length > 0) {
        console.log(`Found ${badPublished.length} __active_theme__ rows in Published. Deleting...`);
        await prisma.homepageSectionPublished.deleteMany({
            where: { slug: '__active_theme__' }
        });
    } else {
        console.log('__active_theme__ in Published is clean.');
    }

    // 3. Cleanup __theme_meta__ duplicates in Draft
    // These are rows starting with __theme_meta__
    const allMeta = await prisma.homepageSectionDraft.findMany({
        where: { slug: { startsWith: '__theme_meta__' } }
    });

    // Group by slug
    const metaBySlug = {};
    for (const m of allMeta) {
        if (!metaBySlug[m.slug]) metaBySlug[m.slug] = [];
        metaBySlug[m.slug].push(m);
    }

    for (const slug in metaBySlug) {
        const rows = metaBySlug[slug];
        if (rows.length > 1) {
            // Sort by updatedAt desc
            rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            const toKeep = rows[0];
            const toDelete = rows.slice(1).map(r => r.id);
            console.log(`Found ${rows.length} duplicates for ${slug}. Deleting ${toDelete.length}...`);
            await prisma.homepageSectionDraft.deleteMany({
                where: { id: { in: toDelete } }
            });
        }
    }
    console.log('__theme_meta__ rows cleanup check complete.');

    console.log('Cleanup finished.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
