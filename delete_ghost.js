
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Deleting entries with number containing 81234567890...");
    const res = await prisma.hubungi.deleteMany({
        where: {
            nomor: { contains: "81234567890" }
        }
    });
    console.log(`Deleted ${res.count} entries.`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
