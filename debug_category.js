
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slug = "set-dapur-qgpgzufv";

    // 1. Check Category
    const cat = await prisma.kategoriProduk.findFirst({
        where: { slug },
        include: { items: true }
    });

    if (!cat) {
        console.log("Category NOT found");
        return;
    }

    console.log(`Category: ${cat.nama} (ID: ${cat.id})`);
    console.log(`Linked Items Pivot Count: ${cat.items.length}`);

    if (cat.items.length === 0) return;

    // 2. Check Products
    const productIds = cat.items.map(i => i.produkId);
    const products = await prisma.produk.findMany({
        where: { id: { in: productIds } },
        select: { id: true, nama: true, kategori: true, subkategori: true, promoAktif: true }
    });

    console.log("--- Products in Category ---");
    products.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.nama} | Legacy Kategori: ${p.kategori} | Sub: ${p.subkategori} | Promo: ${p.promoAktif}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
