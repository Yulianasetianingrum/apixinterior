
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- HomepageSectionPublished (GALLERY) ---");
    const published = await prisma.homepageSectionPublished.findMany({
        where: { type: "GALLERY" }
    });
    console.log(JSON.stringify(published, null, 2));

    console.log("--- HomepageSection (GALLERY) ---");
    const drafts = await prisma.homepageSection.findMany({
        where: { type: "GALLERY" }
    });
    console.log(JSON.stringify(drafts, null, 2));

    console.log("--- GambarUpload (First 5) ---");
    const images = await prisma.gambarUpload.findMany({
        take: 5
    });
    console.log(JSON.stringify(images, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
