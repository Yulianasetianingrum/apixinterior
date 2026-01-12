const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== DELETING SPECIFIC SUSPECT IDs ===');
    // Based on user screenshot: 969 (HERO), 970..976 (Ghosts)
    const targetIds = [969, 970, 971, 972, 973, 974, 975, 976];

    console.log(`Targeting IDs: ${targetIds.join(', ')}`);

    const deleted = await prisma.homepageSectionDraft.deleteMany({
        where: {
            id: { in: targetIds }
        }
    });

    console.log(`Deleted ${deleted.count} rows.`);

    // Also cleanup any untitlted theme_1 just in case
    console.log('Scanning for any other untitled theme_1 sections...');
    const all = await prisma.homepageSectionDraft.findMany({});
    const others = all.filter(d => {
        // Simple check
        if (d.slug === '__active_theme__') return false;
        const cfg = d.config || {};
        const key = cfg.__themeKey || 'theme_1';
        if (String(key).trim() !== 'theme_1') return false;

        const title = String(d.title || "").trim();
        return title === "";
    });

    if (others.length > 0) {
        console.log(`Found ${others.length} other untitled sections. Deleting...`);
        const otherIds = others.map(d => d.id);
        await prisma.homepageSectionDraft.deleteMany({ where: { id: { in: otherIds } } });
        console.log('Deleted others.');
    } else {
        console.log("No other untitled sections found.");
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
