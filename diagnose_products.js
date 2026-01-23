
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    let log = "Checking for missing product references...\n";

    const drafts = await prisma.homepageSectionDraft.findMany();
    const published = await prisma.homepageSectionPublished.findMany();

    const allSections = [...drafts, ...published];
    const allProductIds = new Set();

    for (const s of allSections) {
        let cfg = s.config;
        if (typeof cfg === 'string') {
            try {
                cfg = JSON.parse(cfg);
            } catch (e) {
                log += `Error parsing config for Section ${s.id}\n`;
                continue;
            }
        }

        if (s.type === 'PRODUCT_CAROUSEL' || s.type === 'HIGHLIGHT_COLLECTION') {
            if (cfg && Array.isArray(cfg.productIds)) {
                cfg.productIds.forEach(id => {
                    if (id) allProductIds.add(Number(id));
                });
            }
        }
    }

    log += `Unique Product IDs found in sections: ${Array.from(allProductIds).join(', ')}\n`;

    if (allProductIds.size === 0) {
        log += "No product IDs found in any section.\n";
    } else {
        const foundProducts = await prisma.produk.findMany({
            where: { id: { in: Array.from(allProductIds) } },
            select: { id: true, nama: true }
        });

        const foundIds = new Set(foundProducts.map(p => p.id));
        const missingIds = Array.from(allProductIds).filter(id => !foundIds.has(id));

        if (missingIds.length > 0) {
            log += `\n!!! MISSING PRODUCTS DETECTED !!!\n`;
            log += `Missing IDs: ${missingIds.join(', ')}\n`;

            for (const id of missingIds) {
                log += `\nProduct ID ${id} is referenced in:\n`;
                const affected = allSections.filter(s => {
                    let cfg = s.config;
                    if (typeof cfg === 'string') cfg = JSON.parse(cfg);
                    return cfg && Array.isArray(cfg.productIds) && cfg.productIds.map(Number).includes(id);
                });

                affected.forEach(s => {
                    log += ` - Section ID ${s.id} (${s.type}): ${s.title} [${s instanceof Object && s.constructor.name === 'Object' && drafts.includes(s) ? 'DRAFT' : 'PUBLISHED'}]\n`;
                });
            }
        } else {
            log += "\nAll product references are valid.\n";
        }
    }

    fs.writeFileSync('diagnose_result.txt', log);
    console.log("Result written to diagnose_result.txt");
}

main().catch(e => {
    fs.writeFileSync('diagnose_error.txt', e.stack);
    console.error(e);
}).finally(() => prisma.$disconnect());
