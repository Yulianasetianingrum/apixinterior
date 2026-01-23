
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

let logOutput = "";
function log(msg) {
    console.log(msg);
    logOutput += msg + "\n";
}

async function cleanTable(tableName) {
    log(`\n--- Cleaning ${tableName} ---`);
    const sections = await prisma[tableName].findMany();

    // Get all unique product, kategori, and image IDs
    const allProdIds = new Set();
    const allCatIds = new Set();
    const allImgIds = new Set();

    for (const s of sections) {
        let cfg = s.config;
        if (typeof cfg === 'string') {
            try {
                cfg = JSON.parse(cfg);
            } catch (e) {
                log(`Error parsing config for ${tableName} ID ${s.id}`);
                continue;
            }
        }
        if (!cfg) continue;

        if (Array.isArray(cfg.productIds)) cfg.productIds.forEach(id => id && allProdIds.add(Number(id)));
        if (Array.isArray(cfg.items)) {
            cfg.items.forEach(it => {
                if (it.kategoriId) allCatIds.add(Number(it.kategoriId));
                if (it.coverImageId) allImgIds.add(Number(it.coverImageId));
                if (it.refId && it.type === 'product') allProdIds.add(Number(it.refId));
                if (it.refId && it.type === 'category') allCatIds.add(Number(it.refId));
            });
        }
        if (Array.isArray(cfg.cards)) {
            cfg.cards.forEach(c => {
                if (c.kategoriId) allCatIds.add(Number(c.kategoriId));
                if (c.imageId) allImgIds.add(Number(c.imageId));
            });
        }
        if (cfg.imageId) allImgIds.add(Number(cfg.imageId));
        if (cfg.heroImageId) allImgIds.add(Number(cfg.heroImageId));
    }

    // Check existence
    const [foundProds, foundCats, foundImgs] = await Promise.all([
        prisma.produk.findMany({ where: { id: { in: Array.from(allProdIds) } }, select: { id: true } }),
        prisma.kategoriProduk.findMany({ where: { id: { in: Array.from(allCatIds) } }, select: { id: true } }),
        prisma.gambarUpload.findMany({ where: { id: { in: Array.from(allImgIds) } }, select: { id: true } })
    ]);

    const validProds = new Set(foundProds.map(p => p.id));
    const validCats = new Set(foundCats.map(c => c.id));
    const validImgs = new Set(foundImgs.map(i => i.id));

    let updatedCount = 0;

    for (const s of sections) {
        let cfg = s.config;
        if (typeof cfg === 'string') cfg = JSON.parse(cfg);
        if (!cfg) continue;

        let changed = false;

        if (Array.isArray(cfg.productIds)) {
            const next = cfg.productIds.filter(id => validProds.has(Number(id)));
            if (next.length !== cfg.productIds.length) {
                log(`Section ${s.id} (${s.type}): Removed invalid products [${cfg.productIds.filter(id => !validProds.has(Number(id))).join(', ')}]`);
                cfg.productIds = next;
                changed = true;
            }
        }

        if (Array.isArray(cfg.items)) {
            const next = cfg.items.filter(it => {
                if (it.kategoriId && !validCats.has(Number(it.kategoriId))) return false;
                if (it.coverImageId && !validImgs.has(Number(it.coverImageId))) return false;
                if (it.refId && it.type === 'product' && !validProds.has(Number(it.refId))) return false;
                if (it.refId && it.type === 'category' && !validCats.has(Number(it.refId))) return false;
                return true;
            });
            if (next.length !== cfg.items.length) {
                log(`Section ${s.id} (${s.type}): Removed invalid items`);
                cfg.items = next;
                changed = true;
            }
        }

        if (Array.isArray(cfg.cards)) {
            cfg.cards.forEach(c => {
                if (c.kategoriId && !validCats.has(Number(c.kategoriId))) {
                    log(`Section ${s.id} (${s.type}): Card ${c.key} - Reset missing Kategori ${c.kategoriId}`);
                    c.kategoriId = null;
                    changed = true;
                }
                if (c.imageId && !validImgs.has(Number(c.imageId))) {
                    log(`Section ${s.id} (${s.type}): Card ${c.key} - Reset missing Image ${c.imageId}`);
                    c.imageId = null;
                    changed = true;
                }
            });
        }

        if (cfg.imageId && !validImgs.has(Number(cfg.imageId))) {
            log(`Section ${s.id} (${s.type}): Reset missing Image ${cfg.imageId}`);
            cfg.imageId = null;
            changed = true;
        }
        if (cfg.heroImageId && !validImgs.has(Number(cfg.heroImageId))) {
            log(`Section ${s.id} (${s.type}): Reset missing Hero Image ${cfg.heroImageId}`);
            cfg.heroImageId = null;
            changed = true;
        }

        if (changed) {
            await prisma[tableName].update({
                where: { id: s.id },
                data: { config: cfg }
            });
            updatedCount++;
        }
    }

    log(`Updated ${updatedCount} sections in ${tableName}.`);
}

async function main() {
    try {
        await cleanTable('homepageSectionDraft');
        await cleanTable('homepageSectionPublished');
        log("\nCleanup finished. You can now refresh the admin page and try publishing.");
    } catch (e) {
        log(`\nERROR: ${e.message}\n${e.stack}`);
    } finally {
        fs.writeFileSync('cleanup_result.txt', logOutput);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
