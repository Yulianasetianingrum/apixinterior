const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const drafts = await prisma.homepageSectionDraft.findMany({
        where: { slug: '__active_theme__' }
    });
    console.log('Drafts:', drafts.map(d => ({ id: d.id, title: d.title, type: d.type })));

    const published = await prisma.homepageSectionPublished.findMany({
        where: { slug: '__active_theme__' }
    });
    console.log('Published:', published.map(p => ({ id: p.id, title: p.title, type: p.type })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
