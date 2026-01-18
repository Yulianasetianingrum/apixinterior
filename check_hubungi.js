
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const hubs = await prisma.hubungi.findMany({
        orderBy: [{ prioritas: 'desc' }, { id: 'asc' }]
    });
    console.log("All Hubungi entries (sorted by priority desc, then id asc):");
    console.table(hubs);

    const picked = await prisma.hubungi.findFirst({
        orderBy: [{ prioritas: 'desc' }, { id: 'asc' }],
        select: { nomor: true },
    });
    console.log("picked number:", picked?.nomor);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
