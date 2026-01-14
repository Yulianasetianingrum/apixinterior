
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Resetting analytics data...');

    await prisma.pageView.deleteMany({});
    await prisma.productView.deleteMany({});
    await prisma.productCardClick.deleteMany({});
    await prisma.productContactClick.deleteMany({});

    console.log('Analytics data reset to 0.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
