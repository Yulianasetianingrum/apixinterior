
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log("Checking GambarUpload for PNGs...");

    const allImages = await prisma.gambarUpload.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Total fetched (limit 50): ${allImages.length}`);

    const pngs = allImages.filter((img: any) => /\.png(\?|#|$)/i.test(img.url || ""));
    console.log(`PNG matches found: ${pngs.length}`);

    console.log("\n--- Sample URLs ---");
    allImages.forEach((img: any) => {
        const isPng = /\.png(\?|#|$)/i.test(img.url || "");
        console.log(`[${img.id}] ${img.url} -> Is PNG? ${isPng}`);
    });
}

check().catch(e => console.error(e)).finally(() => prisma.$disconnect());
