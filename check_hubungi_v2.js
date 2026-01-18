
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
    try {
        const hubs = await prisma.hubungi.findMany({
            orderBy: [{ prioritas: 'desc' }, { id: 'asc' }]
        });

        fs.writeFileSync('hubungi_dump.txt', JSON.stringify(hubs, null, 2));

        const picked = await prisma.hubungi.findFirst({
            orderBy: [{ prioritas: 'desc' }, { id: 'asc' }],
            select: { nomor: true },
        });
        fs.appendFileSync('hubungi_dump.txt', `\n\nPICKED: ${picked?.nomor}`);
    } catch (e) {
        fs.writeFileSync('hubungi_dump.txt', 'ERROR: ' + e.toString());
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
