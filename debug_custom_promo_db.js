
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- Debugging Custom Promo DB ---");

    // 1. Find the active theme key (or just check all sections)
    // Usually the homepage is using "theme_1" or whatever is active.
    // We'll just look for ALL sections of type CUSTOM_PROMO in drafts.

    const sections = await prisma.homepageSectionDraft.findMany({
        where: { type: "CUSTOM_PROMO" },
        orderBy: { id: "desc" }
    });

    console.log(`Found ${sections.length} CUSTOM_PROMO sections.`);

    for (const s of sections) {
        console.log(`\n[Section ID: ${s.id}] Slug: ${s.slug}`);

        const cfg = s.config || {};
        const voucherLinks = cfg.voucherLinks || {};
        console.log("Voucher Links Raw:", JSON.stringify(voucherLinks, null, 2));

        const imageIds = (Array.isArray(cfg.voucherImageIds) ? cfg.voucherImageIds : []).map(Number);
        console.log("Voucher Image IDs:", imageIds);

        for (const vid of imageIds) {
            const linkVal = voucherLinks[vid];
            console.log(`Image #${vid} -> Link Value: ${linkVal}`);

            if (typeof linkVal === 'string' && linkVal.startsWith('category:')) {
                const catId = Number(linkVal.split(':')[1]);
                console.log(`   -> Detected Category ID: ${catId}`);

                const cat = await prisma.kategoriProduk.findUnique({
                    where: { id: catId }
                });

                if (cat) {
                    console.log(`   -> RESOLVED: ${cat.nama} (Slug: ${cat.slug})`);
                    console.log(`   -> GENERATED LINK: /promo?kategori=${cat.slug}`);
                } else {
                    console.log(`   -> FAILED TO RESOLVE CATEGORY: ID ${catId} not found in DB`);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
