
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking DB connection...");
    try {
        const count = await prisma.produk.count();
        console.log(`Current products: ${count}`);

        const gambar = await prisma.gambarUpload.findFirst();
        if (!gambar) {
            console.log("No gambar found! Cannot test product creation with image.");
            // Create a dummy image
            const newImg = await prisma.gambarUpload.create({
                data: {
                    url: "/dummy.jpg",
                    title: "Dummy Image",
                }
            });
            console.log("Created dummy image:", newImg.id);
        } else {
            console.log("Found existing image:", gambar.id);
        }

    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
