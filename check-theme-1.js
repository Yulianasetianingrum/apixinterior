const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fetching sections for theme_1...');

    const drafts = await prisma.homepageSectionDraft.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
    });

    const theme1Sections = drafts.filter(d => {
        // Basic filter based on config.activeThemeKey or inferred logic?
        // Actually, the app logic in page.tsx uses `getThemeKeyFromConfig(d.config) === themeKey`.
        // Let's implement a simple version of that check.
        const cfg = d.config || {};
        const rowTheme = cfg.themeKey || 'theme_1'; // Default is theme_1 if missing
        return rowTheme === 'theme_1' && d.slug !== '__active_theme__' && !d.slug?.startsWith('__theme_meta__');
    });

    console.log(`Found ${theme1Sections.length} sections for theme_1:`);
    theme1Sections.forEach(s => {
        console.log(`[#${s.sortOrder}] ID: ${s.id} | TYPE: ${s.type} | TITLE: ${s.title || '(No Title)'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
