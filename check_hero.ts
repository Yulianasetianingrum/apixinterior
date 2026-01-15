
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("Checking HERO Data...");

    const draft = await prisma.homepageSectionDraft.findFirst({
        where: { type: "HERO" },
        orderBy: { id: 'desc' }
    });

    const published = await prisma.homepageSectionPublished.findFirst({
        where: { type: "HERO" },
        orderBy: { id: 'desc' }
    });

    console.log("--- DRAFT HERO ---");
    if (draft) {
        console.log("ID:", draft.id);
        console.log("Config (JSON):", JSON.stringify(draft.config, null, 2));
        console.log("heroHeadline:", draft.heroHeadline);
    } else {
        console.log("NOT FOUND");
    }

    console.log("\n--- PUBLISHED HERO ---");
    if (published) {
        console.log("ID:", published.id);
        console.log("Config (JSON):", JSON.stringify(published.config, null, 2));
        console.log("heroHeadline:", published.heroHeadline);
    } else {
        console.log("NOT FOUND");
    }
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
