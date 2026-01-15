
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const images = await prisma.gambarUpload.findMany({
        orderBy: { id: 'desc' },
        take: 5,
    });
    console.log("Latest 5 images:");
    images.forEach(img => {
        console.log(`ID: ${img.id}, URL: ${img.url}, Title: ${img.title}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
