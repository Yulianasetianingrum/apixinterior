const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const draftCount = await prisma.homepageSectionDraft.count();
        const publishedCount = await prisma.homepageSectionPublished.count();
        const baseCount = await prisma.homepageSection.count();
        const activeMarker = await prisma.homepageSectionDraft.findFirst({
            where: { slug: '__active_theme__' }
        });
        const themes = await prisma.homepageSectionDraft.findMany({
            where: { slug: { startsWith: '__theme_meta__' } }
        });

        console.log('--- DATABASE STATUS ---');
        console.log('Draft count:', draftCount);
        console.log('Published count:', publishedCount);
        console.log('Base count (Legacy):', baseCount);
        console.log('Active Marker:', activeMarker ? JSON.stringify(activeMarker.config) : 'NOT FOUND');
        console.log('Themes found:', themes.length);
        themes.forEach(t => console.log(`  - ${t.slug}: ${JSON.stringify(t.config)}`));

        // Check for "ghost" sections in Published that might not have a theme key
        const publishedRows = await prisma.homepageSectionPublished.findMany();
        const ghostRows = publishedRows.filter(r => {
            const config = (r.config || {});
            return !(config.__themeKey || config.themeKey || config.activeThemeKey);
        });
        console.log('Ghost rows in Published (no theme key):', ghostRows.length);
        if (ghostRows.length > 0) {
            ghostRows.forEach(r => console.log(`  - Ghost ID ${r.id}: ${r.type} - ${r.title}`));
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
