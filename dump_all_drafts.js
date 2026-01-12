const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    try {
        const drafts = await prisma.homepageSectionDraft.findMany({
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
        });

        // Write to a local file
        fs.writeFileSync('all_drafts.json', JSON.stringify(drafts, null, 2));
        console.log(`Saved ${drafts.length} drafts to all_drafts.json`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
