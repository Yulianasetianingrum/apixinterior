const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== CLEANING PUBLISHED TABLE GHOSTS ===');

    // 1. Delete specific IDs if they exist in published
    // Note: Published IDs usually match Draft IDs if they were just published, 
    // but if new rows were created, their IDs might be different.
    // HOWEVER, the user issue implies they published the "Ghosts". 
    // Let's delete by similarity or just nuking untitled sections in theme_1.

    // Fetch all published to inspect
    const published = await prisma.homepageSectionPublished.findMany({});

    const toDelete = [];

    for (const p of published) {
        if (p.slug === '__active_theme__' || p.slug?.startsWith('__theme_meta__')) continue;

        const cfg = p.config || {};
        const key = (cfg.__themeKey || 'theme_1').trim();

        // Target theme_1
        if (key === 'theme_1') {
            const title = String(p.title || "").trim();
            // If title is empty, it's a ghost
            if (title === "") {
                console.log(`[TARGET DELETE] ID:${p.id} Type:${p.type} (Untitled)`);
                toDelete.push(p.id);
            }
        }
    }

    // Also specifically target the IDs from the screenshot if they happen to match exactly (though unlikely if re-published)
    // But let's check if the user screenshot IDs (969..976) exist in published table
    const knownGhostIds = [969, 970, 971, 972, 973, 974, 975, 976];

    // We can try to delete them directly by ID just in case
    const deletedById = await prisma.homepageSectionPublished.deleteMany({
        where: { id: { in: knownGhostIds } }
    });
    console.log(`Deleted ${deletedById.count} rows by exact Ghost IDs.`);

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} untitled published sections...`);
        await prisma.homepageSectionPublished.deleteMany({
            where: { id: { in: toDelete } }
        });
        console.log("Deleted.");
    } else {
        console.log("No other untitled published sections found.");
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
