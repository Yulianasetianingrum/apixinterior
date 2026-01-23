
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        console.log("Checking for duplicate TESTIMONIALS sections...");
        const sections = await prisma.homepageSectionDraft.findMany({
            where: { type: "TESTIMONIALS" },
            orderBy: { id: 'asc' }
        });

        console.log(`Found ${sections.length} sections.`);

        if (sections.length > 1) {
            console.log("Duplicates detected! Keeping the first one (ID " + sections[0].id + ") and deleting others.");

            const idsToDelete = sections.slice(1).map(s => s.id);

            const res = await prisma.homepageSectionDraft.deleteMany({
                where: { id: { in: idsToDelete } }
            });

            console.log(`Deleted ${res.count} duplicate sections (IDs: ${idsToDelete.join(', ')}).`);
        } else {
            console.log("No duplicates found or only 1 section exists.");
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
