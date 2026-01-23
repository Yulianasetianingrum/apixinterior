const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.post.count();
    console.log('Post count: ' + count);
    const posts = await prisma.post.findMany({ take: 5 });
    console.log(JSON.stringify(posts, null, 2));
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
