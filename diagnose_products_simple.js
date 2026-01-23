
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Homepage Sections for invalid product references...");

    const drafts = await prisma.homepageSectionDraft.findMany();
    console.log(`Found ${drafts.length} draft sections.`);

    const allProductIds = new Set();

    for (const s of drafts) {
        let cfg = s.config;
        if (typeof cfg === 'string') {
            try {
                cfg = JSON.parse(cfg);
            } catch (e) {
                continue;
            }
        }

        if (cfg && Array.isArray(cfg.productIds)) {
            cfg.productIds.forEach(id => {
                if (id) allProductIds.add(Number(id));
            });
        }
    }

    const ids = Array.from(allProductIds);
    console.log(`Checking ${ids.length} unique product IDs...`);

    if (ids.length === 0) {
        console.log("No product references found.");
        return;
    }

    const found = await prisma.produk.findMany({
        where: { id: { in: ids } },
        select: { id: true }
    });

    const foundIds = new Set(found.map(p => p.id));
    const missing = ids.filter(id => !foundIds.has(id));

    if (missing.length > 0) {
        console.log(`\n!!! MISSING PRODUCTS: ${missing.join(', ')}`);
        missing.forEach(id => {
            drafts.forEach(s => {
                let cfg = s.config;
                if (typeof cfg === 'string') cfg = JSON.parse(cfg);
                if (cfg && Array.isArray(cfg.productIds) && cfg.productIds.map(Number).includes(id)) {
                    console.log(` - Used in Section ${s.id} (${s.type}): "${s.title}"`);
                }
            });
        });
    } else {
        console.log("\nAll product references are valid.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
