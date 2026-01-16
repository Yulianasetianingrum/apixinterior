import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Theme Meta rows...");
    const metas = await prisma.homepageSectionDraft.findMany({
        where: {
            slug: {
                startsWith: "__theme_meta__"
            }
        }
    });
    console.log("Metas found:", JSON.stringify(metas, null, 2));

    const all = await prisma.homepageSectionDraft.findMany({
        take: 10
    });
    console.log("First 10 rows:", JSON.stringify(all, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
