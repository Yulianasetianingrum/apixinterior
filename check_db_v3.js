const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    const log = [];
    log.push("CHECKING COMMERCE GRID CONFIG...");

    try {
        const sections = await prisma.homepageSectionPublished.findMany({
            where: { type: 'CATEGORY_GRID_COMMERCE' }
        });

        log.push(`Found ${sections.length} sections.`);

        sections.forEach(s => {
            const cfg = s.config || {};
            const items = cfg.items || [];
            log.push(`ID:${s.id} Items:${items.length}`);
            items.slice(0, 5).forEach((it, i) => {
                log.push(`  [${i}] CatID:${it.kategoriId} ImgID:${it.imageId} (${typeof it.imageId}) Type:${it.type}`);
            });
        });
    } catch (e) {
        log.push("ERROR: " + e.toString());
    } finally {
        await prisma.$disconnect();
        fs.writeFileSync('check_db_out.txt', log.join('\n'));
    }
}

main();
