
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Cleaning up TESTIMONIALS...");
    try {
        const deleted = await prisma.homepageSectionDraft.deleteMany({
            where: { type: 'TESTIMONIALS' }
        });
        console.log(`Deleted ${deleted.count} sections.`);
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
