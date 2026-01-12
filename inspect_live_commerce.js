const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('=== INSPECTING LIVE COMMERCE GRIDS ===');

    const sections = await prisma.homepageSectionPublished.findMany({
        where: { type: 'CATEGORY_GRID_COMMERCE' }
    });

    console.log(`Found ${sections.length} COMMERCE sections.`);

    for (const s of sections) {
        console.log(`\nID: ${s.id}, Title: ${s.title}`);
        const cfg = s.config || {};
        const items = cfg.items || [];
        console.log(`Items count: ${items.length}`);
        items.forEach((it, idx) => {
            console.log(`  [${idx}] CatID:${it.kategoriId} ImgID:${it.imageId} Type:${it.type}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
