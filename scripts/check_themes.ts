
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for THEME_META rows...");

    const metas = await prisma.homepageSectionDraft.findMany({
        where: {
            slug: { startsWith: "__theme_meta__" }
        }
    });

    console.log(`Found ${metas.length} theme meta rows:`);
    metas.forEach(m => {
        console.log(`- ID: ${m.id}, Slug: ${m.slug}, Title: ${m.title}`);
        console.log(`  Config:`, JSON.stringify(m.config));
    });

    const allDrafts = await prisma.homepageSectionDraft.findMany({ select: { id: true, type: true, slug: true, config: true } });
    const brokenMetas = allDrafts.filter(d => (d.type as any) === "THEME_META" && !d.slug?.startsWith("__theme_meta__"));
    if (brokenMetas.length > 0) {
        console.log("\nFound BROKEN/ANOMALY meta rows (wrong slug):");
        brokenMetas.forEach(m => {
            console.log(`- ID: ${m.id}, Slug: ${m.slug}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
