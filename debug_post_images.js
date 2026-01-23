console.log('--- START SCRIPT ---');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const posts = await prisma.post.findMany({
        select: { id: true, title: true, coverImage: true }
    });
    console.log('--- POST COVER IMAGES ---');
    posts.forEach(p => {
        console.log(`ID: ${p.id} | Title: ${p.title} | Cover: ${p.coverImage}`);
    });
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
