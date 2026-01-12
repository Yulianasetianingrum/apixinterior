
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDescription() {
    const products = await prisma.produk.findMany({
        select: {
            id: true,
            nama: true,
            slug: true,
            deskripsiLengkap: true
        }
    });

    console.log("Checking Product Descriptions:");
    products.forEach(p => {
        if (p.deskripsiLengkap) {
            console.log(`[${p.id}] ${p.nama}: Length=${p.deskripsiLengkap.length}`);
            console.log(`Preview: ${p.deskripsiLengkap.substring(0, 50)}...${p.deskripsiLengkap.substring(p.deskripsiLengkap.length - 20)}`);
            if (p.deskripsiLengkap.length > 185 && p.deskripsiLengkap.length < 200) {
                console.log("POTENTIAL 191 CHAR TRUNCATION DETECTED!");
            }
        } else {
            console.log(`[${p.id}] ${p.nama}: No description`);
        }
    });
}

checkDescription()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
