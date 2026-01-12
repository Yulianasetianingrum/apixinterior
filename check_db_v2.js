const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    process.stdout.write("CHECKING COMMERCE GRID CONFIG...\n");

    const sections = await prisma.homepageSectionPublished.findMany({
        where: { type: 'CATEGORY_GRID_COMMERCE' }
    });

    process.stdout.write(`Found ${sections.length} sections.\n`);

    sections.forEach(s => {
        const cfg = s.config || {};
        const items = cfg.items || [];
        process.stdout.write(`ID:${s.id} Items:${items.length}\n`);
        items.slice(0, 5).forEach((it, i) => {
            process.stdout.write(`  [${i}] CatID:${it.kategoriId} ImgID:${it.imageId} (${typeof it.imageId}) Type:${it.type}\n`);
        });
    });
}

main()
    .catch(e => process.stdout.write(e.toString()))
    .finally(async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
