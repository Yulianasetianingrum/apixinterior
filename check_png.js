
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check() {
    console.log("Checking GambarUpload for PNGs...");

    try {
        const allImages = await prisma.gambarUpload.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            select: { id: true, url: true, title: true }
        });

        console.log(`Total fetched (limit 50): ${allImages.length}`);

        const pngs = allImages.filter((img) => /\.png(\?|#|$)/i.test(img.url || ""));
        console.log(`PNG matches found: ${pngs.length}`);

        console.log("\n--- Sample URLs ---");
        allImages.forEach((img) => {
            const isPng = /\.png(\?|#|$)/i.test(img.url || "");
            console.log(`[${img.id}] ${img.url} -> Is PNG? ${isPng}`);
        });
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
