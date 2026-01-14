
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cats = await prisma.kategoriProduk.findMany();
    console.log("--- Categories ---");
    cats.forEach(c => {
        console.log(`ID: ${c.id} | Name: ${c.nama} | Slug: ${c.slug}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
