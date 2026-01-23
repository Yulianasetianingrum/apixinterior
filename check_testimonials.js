
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const sections = await prisma.homepageSectionDraft.findMany({
            select: { id: true, type: true, title: true, enabled: true, sortOrder: true }
        });
        console.log("ALL SECTIONS:", JSON.stringify(sections, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
