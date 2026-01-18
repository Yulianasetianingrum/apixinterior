
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking for 'TESTIMONIALS' sections...");

    const sections = await prisma.homepageSectionDraft.findMany({
        where: { type: "TESTIMONIALS" }
    });

    console.log(`Found ${sections.length} 'TESTIMONIALS' sections.`);

    if (sections.length > 0) {
        console.log("Deleting them...");
        await prisma.homepageSectionDraft.deleteMany({
            where: { type: "TESTIMONIALS" }
        });
        console.log("Deleted.");
    } else {
        console.log("No sections to delete.");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
