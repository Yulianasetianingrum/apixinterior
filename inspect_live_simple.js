const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('CHECKING ROWS...');
    const count = await prisma.homepageSectionPublished.count();
    console.log(`Rows: ${count}`);

    const sections = await prisma.homepageSectionPublished.findMany({
        where: { type: 'CATEGORY_GRID_COMMERCE' },
        select: { id: true, title: true, config: true }
    });
    console.log(`Commerce Grids: ${sections.length}`);

    sections.forEach(s => {
        console.log(`ID:${s.id} Config keys: ${Object.keys(s.config || {}).join(',')}`);
        const items = (s.config || {}).items || [];
        console.log(`  Items: ${items.length}`);
        items.slice(0, 3).forEach((it, i) => console.log(`  [${i}] imgId: ${it.imageId} (${typeof it.imageId})`));
    });
}

main().catch(console.error).finally(async () => await prisma.$disconnect());
